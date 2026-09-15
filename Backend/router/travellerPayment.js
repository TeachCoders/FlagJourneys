import express from "express";
import { prisma } from "../utils/prismaConnection.js";
import { requireSalesOrAdmin } from "../middleware/requireSalesOrAdmin.js";
import { sendBookingConfirmationEmail } from "../utils/emailSender.js";
import crypto from "crypto";
import { z } from "zod";
import { logger } from "../utils/logger.js";

const router = express.Router();

// GET all traveller payments with traveller details, invoices, and payment summary
router.get("/", requireSalesOrAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [payments, totalCount] = await Promise.all([
      prisma.payment.findMany({
        include: {
          traveller: {
            select: {
              id: true,
              travellerId: true,
              name: true,
              email: true,
              phone: true,
              defaultPassword: true,
              invoices: {
                orderBy: { createdAt: 'desc' },
                include: { items: true },
              },
              payments: {
                orderBy: { id: 'desc' },
              },
            },
          },
        },
        orderBy: { id: "desc" },
        skip,
        take: limit,
      }),
      prisma.payment.count(),
    ]);

    // Enrich each payment with computed summary for the traveller
    const enriched = payments.map(p => {
      const travellerInvoices = p.traveller?.invoices || [];
      const travellerPayments = p.traveller?.payments || [];
      const totalInvoiced = travellerInvoices.reduce((s, inv) => s + (inv.grandTotal || 0), 0);
      const totalPaid = travellerPayments.reduce((s, pay) => s + (Number(pay.amount) || 0), 0);
      const dueAmount = Math.max(0, totalInvoiced - totalPaid);
      return {
        ...p,
        paymentSummary: { totalInvoiced, totalPaid, dueAmount },
      };
    });

    const summary = {
      totalPaymentsReceived: totalCount,
      recentPayments: payments.filter(p => p.status === 'COMPLETED').length,
    };

    return res.status(200).json({
      success: true,
      data: enriched,
      summary,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
      }
    });
  } catch (err) {
    logger.error("Error fetching traveller payments:", { error: err.message, stack: err.stack });
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// GET stats for traveller payments dashboard
router.get("/stats", requireSalesOrAdmin, async (req, res) => {
  try {
    const [totalPayments, invoiceAggregate, draftInvoices] = await Promise.all([
      prisma.payment.count(),
      prisma.invoice.aggregate({
        _sum: { grandTotal: true },
      }),
      prisma.invoice.count({ where: { status: "DRAFT" } }),
    ]);

    const totalInvoicedAmount = invoiceAggregate._sum.grandTotal || 0;

    return res.status(200).json({
      success: true,
      data: {
        totalPaymentsRecorded: totalPayments,
        totalInvoicedAmount,
        draftInvoices,
      },
    });
  } catch (err) {
    logger.error("Error fetching payment stats:", { error: err.message, stack: err.stack });
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// PATCH update payment status
const paymentStatusSchema = z.enum(["UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"]);

router.patch("/:id/status", requireSalesOrAdmin, async (req, res) => {
  try {
    const { status, transactionId, transactionDetail } = req.body;

    const parsedStatus = paymentStatusSchema.safeParse(status);
    if (!parsedStatus.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Allowed values: UPCOMING, ONGOING, COMPLETED, CANCELLED",
      });
    }

    const paymentId = parseInt(req.params.id);
    if (isNaN(paymentId)) {
      return res.status(400).json({ success: false, message: "Invalid payment id" });
    }

    const sessionUser = req.session?.user;
    const now = new Date();
    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        ...(status && { status }),
        ...(transactionId && { transactionId }),
        ...(transactionDetail && { transactionDetail }),
        ...(status === 'COMPLETED' && { approvedAt: now, approvedBy: sessionUser?.id }),
        ...(status === 'UPCOMING' && { approvedAt: null, approvedBy: null }),
      },
      include: {
        traveller: {
          select: {
            id: true,
            travellerId: true,
            name: true,
            email: true,
            phone: true,
            defaultPassword: true,
            invoices: {
              orderBy: { createdAt: 'desc' },
            },
            payments: {
              orderBy: { id: 'desc' },
            },
          },
        },
      },
    });

    // Enrich with payment summary
    const travellerInvoices = payment.traveller?.invoices || [];
    const travellerPayments = payment.traveller?.payments || [];
    const totalInvoiced = travellerInvoices.reduce((s, inv) => s + (inv.grandTotal || 0), 0);
    const totalPaid = travellerPayments.reduce((s, pay) => s + (Number(pay.amount) || 0), 0);
    const dueAmount = Math.max(0, totalInvoiced - totalPaid);
    payment.paymentSummary = { totalInvoiced, totalPaid, dueAmount };

    // If payment is COMPLETED, update booking + payment status
    if (status === "COMPLETED" && payment.traveller?.email) {
      const traveller = payment.traveller;

      // Clear PAYMENT_APPROVAL notifications for this traveller
      try {
        await prisma.notification.updateMany({
          where: {
            type: "PAYMENT_APPROVAL",
            read: false,
            message: { contains: traveller.travellerId },
          },
          data: { read: true },
        });
      } catch (notifErr) {
        logger.error("Failed to mark payment notification as read:", { message: notifErr.message });
      }

      // Calculate total invoiced and total paid
      const allInvoices = await prisma.invoice.findMany({
        where: { travellerId: traveller.id, status: { not: "CANCELLED" } },
      });
      const totalInvoiced = allInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

      const allPayments = await prisma.payment.findMany({
        where: { travellerId: traveller.id, status: "COMPLETED" },
      });
      const totalPaid = allPayments.reduce((sum, p) => sum + (p.amount ? Number(p.amount) : 0), 0);
      const dueAmount = Math.max(0, totalInvoiced - totalPaid);

      // ── Dynamic Payment Slab based on Travel Date ──
      // < 30 days  → 80% mandatory
      // 30–90 days → 50% mandatory
      // > 90 days  → 40% mandatory
      const currentLead = await prisma.traveller.findUnique({ where: { id: traveller.id } });
      let requiredPercent = 0.40;
      let slabLabel = "40% (Tour date > 3 months away)";
      if (currentLead?.travelDate) {
        const today = new Date();
        const travelDate = new Date(currentLead.travelDate);
        const diffDays = Math.ceil((travelDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 30) {
          requiredPercent = 0.80;
          slabLabel = "80% (Tour within 1 month)";
        } else if (diffDays <= 90) {
          requiredPercent = 0.50;
          slabLabel = "50% (Tour within 1-3 months)";
        }
      }
      const requiredAmount = totalInvoiced * requiredPercent;

      // Determine paymentStatus
      let newPaymentStatus = "first_payment";
      if (totalInvoiced > 0 && totalPaid >= totalInvoiced) {
        newPaymentStatus = "full_payment";
      }

      // Determine bookingStatus: confirmed when payment arrives AND vendor availability is confirmed
      const vendorAssignments = await prisma.vendorAssignment.findMany({
        where: { travellerId: traveller.id },
      });
      const hasAssignments = vendorAssignments.length > 0;
      const allVendorsConfirmed = hasAssignments && vendorAssignments.every((va) => va.status === "COMPLETED");

      const updateData = {
        paymentStatus: newPaymentStatus,
        paymentReceivedAt: new Date(),
      };

      if (allVendorsConfirmed && currentLead && (currentLead.bookingStatus === "pending" || currentLead.bookingStatus === "working")) {
        updateData.bookingStatus = "confirmed";
        updateData.status = "COMPLETED";
        updateData.completedAt = new Date();
      }

      await prisma.traveller.update({ where: { id: traveller.id }, data: updateData });

      // ── Always send credentials on FIRST payment approval ──
      let password = traveller.defaultPassword;
      if (!password) {
          password = crypto.randomBytes(4).toString("hex").toUpperCase();
        await prisma.traveller.update({
          where: { id: traveller.id },
          data: { defaultPassword: password },
        });
      }

      // Get latest invoice with full details
      const latestInvoice = await prisma.invoice.findFirst({
        where: { travellerId: traveller.id },
        orderBy: { createdAt: "desc" },
        include: { items: true },
      });

      // Send confirmation email with credentials, payment slab, cancellation policy
      sendBookingConfirmationEmail(
        traveller.email,
        traveller.travellerId,
        traveller.name,
        password,
        latestInvoice?.id ? `INV-${latestInvoice.id}` : "N/A",
        totalInvoiced,
        totalPaid,
        dueAmount,
        slabLabel,
        requiredAmount
      );

      // WhatsApp message log (agent sends manually or via WhatsApp API)
      const portalUrl = process.env.BOOKING_PORTAL_URL || "https://booking.flagjourneys.com";
      const brandName = process.env.BRAND_NAME || "Flag Journeys";
      logger.info(`📱 WhatsApp for ${traveller.name} (${traveller.phone}):
🎉 Dear ${traveller.name}, aapka ₹${totalPaid.toLocaleString()} ka payment receive ho gaya!
🆔 Traveller ID: ${traveller.travellerId}
🔑 Portal Password: ${password}
💳 Remaining Due: ₹${dueAmount.toLocaleString()}
📋 Payment Rule: ${slabLabel}
🌐 Portal Login: ${portalUrl}

📜 Cancellation Policy:
• 30+ days pehle cancel: 10% charge
• 15-30 din pehle: 25% charge
• 7-15 din pehle: 50% charge
• 7 din se kam: 100% non-refundable
• No-show: 100% non-refundable
- ${brandName}`);

      // 🏆 Auto-create TourPackage in Best Selling when payment threshold met
      if (totalPaid >= requiredAmount && latestInvoice && latestInvoice.packageName) {
        (async () => {
          try {
            const slugify = (text) =>
              (text || "")
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9\s-]/g, "")
                .replace(/\s+/g, "-")
                .replace(/-+/g, "-");

            let slug = slugify(latestInvoice.packageName);
            const existingSlug = await prisma.tourPackage.findUnique({ where: { slug } });
            if (existingSlug) {
              await prisma.tourPackage.update({
                where: { id: existingSlug.id },
                data: { purchaseCount: { increment: 1 }, isBestSelling: true },
              });
              logger.info(`✅ TourPackage purchase count incremented: "${latestInvoice.packageName}"`);
            } else {
              const invoiceItems = latestInvoice.items || [];
              const hotelDetails = invoiceItems.filter(i => i.ServiceName === "Hotel").map(i => ({ name: i.hotelName || "", type: i.hotelType || "", location: i.location || "", nights: i.ServcieQty || 1, pricePerNight: i.UnitPrice || 0 }));
              const carDetails = invoiceItems.filter(i => i.ServiceName === "Car").map(i => ({ name: i.carName || "", type: i.carType || "", location: i.location || "", days: i.ServcieQty || 1, pricePerDay: i.UnitPrice || 0 }));
              const guideDetails = invoiceItems.filter(i => i.ServiceName === "Guide").map(i => ({ name: i.guideName || "", language: i.guideLanguage || "", location: i.location || "", days: i.ServcieQty || 1, pricePerDay: i.UnitPrice || 0 }));
              const requirement = await prisma.travellerRequirementConfirmation.findUnique({ where: { travellerId: traveller.id } });
              let destination = latestInvoice.destination || "";
              if (!destination) {
                const locations = [...new Set(invoiceItems.map(i => i.location).filter(Boolean))];
                destination = locations.join(", ") || requirement?.cityNames || "";
              }
              let durationDays = 0;
              if (latestInvoice.duration) {
                const dayMatch = latestInvoice.duration.match(/(\d+)\s*(?:D|Day|day)/i);
                durationDays = dayMatch ? parseInt(dayMatch[1]) : parseInt(latestInvoice.duration.replace(/\D/g, "")) || 0;
              }
              if (!durationDays && requirement?.startDate && requirement?.endDate) {
                durationDays = Math.ceil((new Date(requirement.endDate).getTime() - new Date(requirement.startDate).getTime()) / 86400000) + 1;
              }
              const duration = durationDays > 0 ? `${durationDays} Days` : "";
              const adults = latestInvoice.adults || 1;
              const pricePerPerson = adults > 0 ? Math.round(latestInvoice.grandTotal / adults) : latestInvoice.grandTotal;
              await prisma.tourPackage.create({
                data: {
                  name: latestInvoice.packageName, slug, destination, duration, durationDays, pricePerPerson,
                  bannerImageUrl: latestInvoice.bannerImageUrl || null,
                  shortDescription: `Confirmed tour package — ${destination}`,
                  itinerary: Array.isArray(latestInvoice.itinerary) ? latestInvoice.itinerary : [],
                  hotelDetails, carDetails, guideDetails,
                  includes: latestInvoice.includes || [],
                  excludes: latestInvoice.excludes || [],
                  isActive: true, isBestSelling: true, purchaseCount: 1,
                },
              });
              logger.info(`✅ TourPackage auto-created from payment: "${latestInvoice.packageName}"`);
            }
          } catch (pkgErr) {
            logger.error("⚠️ Failed to auto-create TourPackage from payment:", { message: pkgErr.message });
          }
        })();
      }
    }

    return res.status(200).json({ success: true, message: "Payment updated", data: payment });

  } catch (err) {
    logger.error("Error updating payment status:", { error: err.message, stack: err.stack });
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

export default router;
