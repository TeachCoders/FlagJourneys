"use strict";
import express from "express";
const router = express.Router();
import { prisma } from "../utils/prismaConnection.js";
import { requireSalesOrAdmin } from "../middleware/requireSalesOrAdmin.js";
import rateLimit from "express-rate-limit";
import { leadSchema } from "../utils/validation.js";
import { sendCancellationEmail, sendPaymentConfirmationEmail, sendEmail } from "../utils/emailSender.js";
import { generateRequirementsEmailHTML } from "../templates/travellerEmailTemplate.js";
import { createLead } from "../services/leadService.js";
import { clientIpFromReq } from "../services/geoService.js";
import { handlePrismaError } from "../utils/handlePrismaError.js";
import { logger } from "../utils/logger.js";

// Rate limit for public lead creation — prevents spam/abuse
const leadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many requests, please try again later" },
});

// ── My Assigned Leads Dashboard (team_member only) ──
router.get("/my-assigned-dashboard", requireSalesOrAdmin, async (req, res) => {
  try {
    const user = req.session?.user;
    const normalizedRole = (user?.role ?? "").toLowerCase().replace(/[\s-]+/g, "_");
    const isSuperAdmin = normalizedRole.includes("super") && normalizedRole.includes("admin");
    const isTeamMember = normalizedRole === "team_member";
    const isTeamLeader = normalizedRole === "team_leader";

    // Allow team_member, sales, team_leader, super_admin
    const isSalesRole = normalizedRole === "sales";
    if (!isTeamMember && !isSuperAdmin && !isTeamLeader && !isSalesRole) {
      return res.status(403).json({ success: false, message: "This dashboard is only for Sales Team." });
    }

    let whereClause = {};
    if (isTeamMember || isSalesRole) {
      whereClause = { assignedToUserId: user.id };
    } else if (isTeamLeader) {
      whereClause = {
        OR: [
          { assignedToUserId: null },
          { assignedTo: { teamId: user.team?.id } }
        ]
      };
    }
    // Super admin: all leads (no filter)

    // Source filter (e.g. ?source=chat)
    const { source } = req.query;
    if (source) {
      whereClause.source = source;
    }

    // Pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    // Fetch stats using DB aggregation + paginated leads in parallel
    const [statsGroup, totalCount, leads] = await Promise.all([
      prisma.traveller.groupBy({
        by: ['bookingStatus'],
        where: whereClause,
        _count: { _all: true },
      }),
      prisma.traveller.count({ where: whereClause }),
      prisma.traveller.findMany({
        where: whereClause,
        include: {
          tourBookings: true,
          vehicleBookings: true,
          payments: true,
          invoices: {
            include: { items: { include: { vendor: true } } },
            orderBy: { createdAt: "desc" },
          },
          followupNotes: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          assignedTo: {
            select: { id: true, name: true, email: true, mobile: true }
          },
          vendorAssignments: {
            include: {
              vendor: { select: { id: true, vendarName: true, vendarEmail: true, vendarMobile: true, vendarServiceType: true } },
              payments: true,
            }
          },
          requirement: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      // Aggregate invoiced and paid amounts using DB
      prisma.invoice.aggregate({
        where: { traveller: whereClause.travellerId !== undefined ? { assignedToUserId: whereClause.assignedToUserId } : undefined, status: { not: "CANCELLED" } },
        _sum: { grandTotal: true },
      }),
      prisma.payment.aggregate({
        where: { traveller: whereClause.travellerId !== undefined ? { assignedToUserId: whereClause.assignedToUserId } : undefined, status: "COMPLETED" },
        _sum: { amount: true },
      }),
    ]);

    // Build stats from groupBy
    let totalLeads = totalCount;
    let confirmed = 0;
    let ongoing = 0;
    let pending = 0;
    let cancelled = 0;
    for (const g of statsGroup) {
      if (g.bookingStatus === "confirmed") confirmed = g._count._all;
      else if (g.bookingStatus === "working") ongoing = g._count._all;
      else if (g.bookingStatus === "cancelled") cancelled = g._count._all;
      else pending = g._count._all;
    }

    // For aggregated amounts, we need to handle the where clause properly
    // since aggregate doesn't support complex OR with relations
    let totalInvoiced = 0;
    let totalPaid = 0;
    for (const lead of leads) {
      for (const inv of (lead.invoices || [])) {
        if (inv.status !== "CANCELLED") {
          totalInvoiced += inv.grandTotal || 0;
        }
      }
      for (const pay of (lead.payments || [])) {
        if (pay.status === "COMPLETED") {
          totalPaid += Number(pay.amount) || 0;
        }
      }
    }

    const totalPending = totalInvoiced - totalPaid;

    return res.status(200).json({
      success: true,
      stats: {
        totalLeads,
        confirmed,
        ongoing,
        pending,
        cancelled,
        totalInvoiced: Math.round(totalInvoiced),
        totalPaid: Math.round(totalPaid),
        totalPending: Math.round(totalPending > 0 ? totalPending : 0),
      },
      data: leads,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
      }
    });
  } catch (error) {
    logger.error("Error in my-assigned-dashboard:", { error: error.message, stack: error.stack });
    return res.status(500).json({ success: false, message: error?.message ?? "Internal Server Error" });
  }
});

router.post("/", leadLimiter, async (req, res) => {
  const parsed = leadSchema.safeParse(req.body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(", ");
    return res.status(400).json({ success: false, message });
  }

  const {
    name,
    email,
    phone,
    country,
    countryId,
    ipAddress,
    location,
    travellerMessage,
    pageReference,
    defaultPassword,
    travelDate,
  } = parsed.data;
  try {
    const newTraveller = await createLead({
      name,
      email,
      phone,
      country,
      countryId,
      ipAddress: ipAddress || clientIpFromReq(req) || null,
      location,
      travellerMessage,
      pageReference,
      defaultPassword,
      travelDate,
    });

    return res.status(201).json({ success: true, data: newTraveller });
  } catch (error) {
    logger.error("Unhandled error", { error: error.message, stack: error.stack });
    return res.status(500).json({ success: false, message: "Failed to create lead" });
  }
});

router.get("/", requireSalesOrAdmin, async (req, res) => {
  try {
    const user = req.session?.user;

    // Normalize role exactly like layout.tsx / auth.js does
    const normalizedRole = (user?.role ?? "").toLowerCase().replace(/[\s-]+/g, "_");
    const isSuperAdmin = normalizedRole.includes("super") && normalizedRole.includes("admin");
    const isTeamLeader = normalizedRole === "team_leader";
    const isTeamMember = normalizedRole === "team_member";
    const isSalesRole = normalizedRole === "sales";
    const userTeamId = user.team?.id;
    const userId = user.id;

    let whereClause = {};

    if (isSuperAdmin) {
      // Super Admin sees everything
      whereClause = {};
    } else if (isTeamLeader && userTeamId) {
      // Team Leader sees unassigned leads + leads assigned to ANY user in their team
      whereClause = {
        OR: [
          { assignedToUserId: null },
          { assignedTo: { teamId: userTeamId } }
        ]
      };
    } else if ((isTeamMember || isSalesRole) && userId) {
      // Team Member / Sales sees ONLY leads explicitly assigned to them
      whereClause = {
        assignedToUserId: userId
      };
    } else {
      // Fallback: If roles are messed up or missing ID, return nothing
      return res.status(200).json({ success: true, data: [], pagination: { page: 1, limit: 20, totalPages: 0, totalCount: 0 } });
    }

    // Source filter (e.g. ?source=chat)
    const { source } = req.query;
    if (source) {
      whereClause.source = source;
    }

    // Pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [leads, totalCount] = await Promise.all([
      prisma.traveller.findMany({
        where: whereClause,
        include: {
          tourBookings: true,
          vehicleBookings: true,
          payments: true,
          invoices: { orderBy: { createdAt: 'desc' }, include: { items: { include: { vendor: true } } } },
          document: true,
          followupNotes: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              mobile: true
            }
          },
          vendorAssignments: {
            include: {
              vendor: { select: { id: true, vendarName: true, vendarEmail: true, vendarMobile: true, vendarServiceType: true } },
              payments: true,
            }
          },
          requirement: true,
        },
        orderBy: {
          createdAt: "desc"
        },
        skip,
        take: limit,
      }),
      prisma.traveller.count({ where: whereClause })
    ]);

    return res.status(200).json({
      success: true,
      data: leads,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
      }
    });
  } catch (error) {
    logger.error("Error fetching leads:", { error: error.message, stack: error.stack });
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

router.patch("/:leadId/assign", requireSalesOrAdmin, async (req, res) => {
  try {
    const user = req.session?.user;
    const normalizedRole = (user?.role ?? "").toLowerCase().replace(/[\s-]+/g, "_");
    const isSuperAdmin = normalizedRole.includes("super") && normalizedRole.includes("admin");
    const isTeamLeader = normalizedRole === "team_leader";

    if (!isSuperAdmin && !isTeamLeader) {
      return res.status(403).json({ success: false, message: "Only Team Leaders and Super Admins can assign leads." });
    }

    const { leadId } = req.params;
    const { assignedToUserId } = req.body;

    logger.info("leadId:", { leadId });
    logger.info("assignedToUserId:", { assignedToUserId });

    const isHasLead = await prisma.traveller.findUnique({
      where: {
        id: Number(leadId)
      }
    });

    logger.info("isHasLead", { isHasLead });

    const info = await prisma.traveller.update({
      where: {
        id: Number(leadId), // important if id is Int
      },
      data: {
        ...(assignedToUserId !== undefined ? { assignedToUserId: assignedToUserId ? Number(assignedToUserId) : null } : {}),
        assignedAt: new Date(),
      },
    });

    // Sync the assignment to any active chat conversations linked to this traveller
    try {
      if (assignedToUserId !== undefined) {
        await prisma.chatConversation.updateMany({
          where: { travellerId: Number(leadId) },
          data: {
            assignedToUserId: assignedToUserId ? Number(assignedToUserId) : null,
          }
        });
      }
    } catch (chatErr) {
      logger.error("Failed to sync chat assignment:", { message: chatErr.message });
    }

    // Mark related notifications as read
    try {
      if (isHasLead) {
        await prisma.notification.updateMany({
          where: {
            type: { in: ["UNASSIGNED_LEAD", "NEW_LEAD"] },
            read: false,
            message: { contains: isHasLead.travellerId },
          },
          data: { read: true },
        });
      }
    } catch (notifErr) {
      logger.error("Failed to mark notification as read:", { message: notifErr.message });
    }

    logger.info("info", { info });

    res.json({ success: true, info });
  } catch (error) {
    logger.error("Unhandled error", { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET - Fetch single traveller (lead) by ID with full details
router.get('/:leadId', requireSalesOrAdmin, async (req, res) => {
  try {
    const { leadId } = req.params;
    // Determine whether leadId is numeric (id) or a string travellerId
    const isNumeric = /^\d+$/.test(leadId);
    const whereClause = isNumeric ? { id: Number(leadId) } : { travellerId: leadId };
    const lead = await prisma.traveller.findUnique({
      where: whereClause,
      include: {
        tourBookings: true,
        vehicleBookings: true,
        payments: true,
        invoices: { orderBy: { createdAt: 'desc' }, include: { items: { include: { vendor: true } } } },
        followupNotes: { orderBy: { createdAt: 'desc' } },
        assignedTo: { select: { id: true, name: true, email: true } },
        document: true,
        requirement: true,
      },
    });
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Traveller not found' });
    }

    // Ownership check: team_member can only view their own assigned leads
    const sessionUser = req.session?.user;
    const role = (sessionUser?.role ?? '').toLowerCase().replace(/[\s-]+/g, '_');
    const isSuperAdmin = role.includes('super') && role.includes('admin');

    if (!isSuperAdmin) {
      if ((role === 'team_member' || role === 'sales') && lead.assignedToUserId !== sessionUser.id) {
        return res.status(403).json({ success: false, message: 'You do not have access to this lead' });
      }
    }

    return res.status(200).json({ success: true, data: lead });
  } catch (error) {
    logger.error('Error fetching traveller:', { error: error.message, stack: error.stack });
    return res.status(500).json({ success: false, message: error?.message ?? 'Internal Server Error' });
  }
});

// GET - Fetch followup notes for a lead
router.get("/:leadId/notes", requireSalesOrAdmin, async (req, res) => {
  try {
    const { leadId } = req.params;
    if (isNaN(Number(leadId))) {
      return res.status(400).json({ success: false, message: "Invalid lead ID" });
    }
    const notes = await prisma.followupNote.findMany({
      where: { travellerId: Number(leadId) },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: notes });
  } catch (error) {
    logger.error("Unhandled error", { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST - Add a followup note
router.post("/:leadId/notes", requireSalesOrAdmin, async (req, res) => {
  try {
    const { leadId } = req.params;
    if (isNaN(Number(leadId))) {
      return res.status(400).json({ success: false, message: "Invalid lead ID" });
    }
    const { note, channel } = req.body;
    const user = req.session?.user;

    if (!note || !channel) {
      return res.status(400).json({ success: false, message: "Note and channel are required" });
    }

    const newNote = await prisma.followupNote.create({
      data: {
        travellerId: Number(leadId),
        note,
        channel: channel.toUpperCase(),
        createdBy: user?.name || "Unknown Agent",
      },
    });

    // Lead context (needed for the notification + working-started logic below)
    const lead = await prisma.traveller.findUnique({
      where: { id: Number(leadId) },
    });

    // 🔔 Dashboard notification for the new follow-up
    try {
      await prisma.notification.create({
        data: {
          type: "FOLLOWUP_ADDED",
          targetRole: "all",
          title: "New Follow-up Added",
          message: `${user?.name || "Agent"} added a follow-up on ${lead?.name || "lead"} (${channel})`,
          link: "/dashboard/my-leads",
        },
      });
    } catch (notifErr) {
      logger.error("Failed to create followup notification:", { message: notifErr.message });
    }

    // Automatically set workingStartedAt & ONGOING status on first note if not set
    if (lead && !lead.workingStartedAt) {
      await prisma.traveller.update({
        where: { id: Number(leadId) },
        data: {
          workingStartedAt: newNote.createdAt,
          status: lead.status === "PENDING" ? "ONGOING" : lead.status,
          bookingStatus: lead.bookingStatus === "pending" ? "working" : lead.bookingStatus,
        },
      });
    }

    res.json({ success: true, data: newNote });
  } catch (error) {
    logger.error("Unhandled error", { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH - Update lead status (workingStartedAt, completedAt, cancelled + reason)
const VALID_LEAD_STATUSES = ["NEW", "CONTACTED", "INTERESTED", "QUOTED", "BOOKED", "COMPLETED", "CANCELLED", "LOST", "ONGOING", "PENDING"];

router.patch("/:leadId/status", requireSalesOrAdmin, async (req, res) => {
  try {
    const { leadId } = req.params;
    const { status, cancellationReason } = req.body;

    if (!VALID_LEAD_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Allowed values: NEW, CONTACTED, INTERESTED, QUOTED, BOOKED, COMPLETED, CANCELLED, LOST",
      });
    }

    const now = new Date();

    const data = { status };
    if (status === "ONGOING") {
      data.bookingStatus = "working";
      data.workingStartedAt = now;
      data.completedAt = null;
      data.cancelledAt = null;
      data.cancellationReason = null;
    } else if (status === "COMPLETED") {
      const vendorAssignments = await prisma.vendorAssignment.findMany({
        where: { travellerId: Number(leadId) },
      });
      if (vendorAssignments.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot mark lead as COMPLETED. No vendor has been assigned yet.",
        });
      }
      const allConfirmed = vendorAssignments.every((va) => va.status === "COMPLETED");
      if (!allConfirmed) {
        return res.status(400).json({
          success: false,
          message: "Cannot mark lead as COMPLETED. All assigned vendors must confirm availability first.",
        });
      }

      data.bookingStatus = "confirmed";
      data.completedAt = now;
      data.cancelledAt = null;
      data.cancellationReason = null;
    } else if (status === "CANCELLED") {
      data.bookingStatus = "cancelled";
      data.cancelledAt = now;
      data.cancellationReason = cancellationReason || "Cancelled by agent";
      data.completedAt = null;
    } else if (status === "PENDING") {
      data.bookingStatus = "pending";
      data.completedAt = null;
      data.cancelledAt = null;
      data.cancellationReason = null;
    }

    const updated = await prisma.traveller.update({
      where: { id: Number(leadId) },
      data,
      include: { assignedTo: true },
    });

    // Background email trigger if cancelled
    if (status === "CANCELLED" && updated.email) {
      sendCancellationEmail(
        updated.email,
        updated.travellerId,
        updated.name,
        updated.assignedTo?.name || "Your Tour Planner"
      );
    }

    // 🏆 Auto-create TourPackage from latest invoice when tour is COMPLETED
    if (status === "COMPLETED") {
      (async () => {
        try {
          const latestInvoice = await prisma.invoice.findFirst({
            where: { travellerId: Number(leadId) },
            orderBy: { createdAt: "desc" },
            include: { items: true },
          });

          if (latestInvoice && latestInvoice.packageName) {
            // Build slug from package name
            const slugify = (text) =>
              (text || "")
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9\s-]/g, "")
                .replace(/\s+/g, "-")
                .replace(/-+/g, "-");

            let slug = slugify(latestInvoice.packageName);
            const existingSlug = await prisma.tourPackage.findUnique({ where: { slug } });
            if (existingSlug) slug = `${slug}-${Date.now()}`;

            // Extract hotel, car, guide details from invoice items
            const invoiceItems = latestInvoice.items || [];
            const hotelDetails = invoiceItems
              .filter(i => i.ServiceName === "Hotel")
              .map(i => ({ name: i.hotelName || "", type: i.hotelType || "", location: i.location || "", nights: i.ServcieQty || 1, pricePerNight: i.UnitPrice || 0 }));
            const carDetails = invoiceItems
              .filter(i => i.ServiceName === "Car")
              .map(i => ({ name: i.carName || "", type: i.carType || "", location: i.location || "", days: i.ServcieQty || 1, pricePerDay: i.UnitPrice || 0 }));
            const guideDetails = invoiceItems
              .filter(i => i.ServiceName === "Guide")
              .map(i => ({ name: i.guideName || "", language: i.guideLanguage || "", location: i.location || "", days: i.ServcieQty || 1, pricePerDay: i.UnitPrice || 0 }));

            // Destination fallback: invoice → unique locations from items → requirement cityNames → traveller country
            const requirement = await prisma.travellerRequirementConfirmation.findUnique({ where: { travellerId: Number(leadId) } });
            let destination = latestInvoice.destination || "";
            if (!destination) {
              const locations = [...new Set(invoiceItems.map(i => i.location).filter(Boolean))];
              destination = locations.join(", ") || requirement?.cityNames || updated.country || "";
            }

            // Duration: extract days or calculate from dates, format as 'X Days'
            let durationDays = 0;
            if (latestInvoice.duration) {
              const dayMatch = latestInvoice.duration.match(/(\d+)\s*(?:D|Day|day)/i);
              if (dayMatch) {
                durationDays = parseInt(dayMatch[1]);
              } else {
                const digits = latestInvoice.duration.replace(/\D/g, "");
                durationDays = parseInt(digits) || 0;
              }
            }
            if (!durationDays && requirement?.startDate && requirement?.endDate) {
              const diffMs = new Date(requirement.endDate).getTime() - new Date(requirement.startDate).getTime();
              durationDays = Math.ceil(diffMs / 86400000) + 1;
            }
            const duration = durationDays > 0 ? `${durationDays} Days` : "";

            // Calculate price per person
            const adults = latestInvoice.adults || 1;
            const pricePerPerson = adults > 0
              ? Math.round(latestInvoice.grandTotal / adults)
              : latestInvoice.grandTotal;

            await prisma.tourPackage.create({
              data: {
                name: latestInvoice.packageName,
                slug,
                destination,
                duration,
                durationDays,
                pricePerPerson,
                bannerImageUrl: latestInvoice.bannerImageUrl || null,
                shortDescription: `Confirmed tour package — ${destination}`,
                itinerary: Array.isArray(latestInvoice.itinerary) ? latestInvoice.itinerary : [],
                hotelDetails,
                carDetails,
                guideDetails,
                includes: latestInvoice.includes || [],
                excludes: latestInvoice.excludes || [],
                isActive: true,
                isBestSelling: true,
                purchaseCount: 1,
                createdById: req.session?.user?.id || null,
              },
            });

            logger.info(`✅ TourPackage auto-created from completed lead #${leadId}: "${latestInvoice.packageName}"`);
          }
        } catch (pkgErr) {
          // Non-fatal — log but don't break the status update response
          logger.error(`⚠️ Failed to auto-create TourPackage for lead #${leadId}:`, { message: pkgErr.message });
        }
      })();
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    logger.error("Unhandled error", { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH - Upload traveller documents (passport, govtid, payment slip)
// Supports both numeric id and string travellerId lookup.
// Accepts either single document (documentType + url) or bulk (passport_url, govt_id_url, payment_screenshot_url)
// Triggers payment confirmation email + sends password when paymentslip is uploaded
router.patch("/:leadId/documents", requireSalesOrAdmin, async (req, res) => {
  try {
    const { leadId } = req.params;
    const { documentType, url, passport_url, govt_id_url, payment_screenshot_url } = req.body;
    // single: { documentType: 'passport'|'govtid'|'paymentslip', url: '...' }
    // bulk:   { passport_url?: '...', govt_id_url?: '...', payment_screenshot_url?: '...' }

    const isNumeric = /^\d+$/.test(leadId);
    const whereClause = isNumeric ? { id: Number(leadId) } : { travellerId: leadId };

    const lead = await prisma.traveller.findUnique({
      where: whereClause,
      include: { document: true, payments: true },
    });

    if (!lead) return res.status(404).json({ success: false, message: 'Traveller not found' });

    const travellerNumericId = lead.id;
    const results = [];

    // Helper to upsert a document field
    const upsertDocument = async (field, value) => {
      const updateData = {};
      updateData[field] = value;
      return prisma.travellerDocument.upsert({
        where: { travellerId: travellerNumericId },
        update: updateData,
        create: { travellerId: travellerNumericId, ...updateData },
      });
    };

    if (documentType && url !== undefined) {
      // Single document mode
      if (documentType === 'passport' || documentType === 'govtid') {
        const field = documentType === 'passport' ? 'passportUrl' : 'govtIdUrl';
        results.push(await upsertDocument(field, url));
      } else if (documentType === 'paymentslip') {
        const paymentAmount = req.body.amount ? Number(req.body.amount) : undefined;
        const paymentDate = req.body.paymentDate ? new Date(req.body.paymentDate) : undefined;
        results.push(await prisma.payment.create({
          data: {
            travellerId: travellerNumericId,
            paymentScreenshotUrl: url,
            ...(paymentAmount !== undefined && { amount: paymentAmount }),
            ...(paymentDate !== undefined && { paymentDate }),
            status: 'UPCOMING',
          },
        }));

        const password = lead.defaultPassword || 'Contact agent for password';
        if (lead.email) {
          sendPaymentConfirmationEmail(lead.email, lead.travellerId, lead.name, password);
        }

        // 🔔 Notify super admin about new payment pending approval
        try {
          await prisma.notification.create({
            data: {
              type: "PAYMENT_APPROVAL",
              targetRole: "all",
              title: "Payment Pending Approval",
              message: `${lead.name} (${lead.travellerId}) uploaded a payment of ₹${paymentAmount || "N/A"}. Please review and approve.`,
              link: "/dashboard/payments",
            },
          });
        } catch (notifErr) {
          logger.error("Failed to create payment notification:", { message: notifErr.message });
        }
      }
    } else {
      // Bulk mode — update any provided fields
      if (passport_url !== undefined) {
        results.push(await upsertDocument('passportUrl', passport_url));
      }
      if (govt_id_url !== undefined) {
        results.push(await upsertDocument('govtIdUrl', govt_id_url));
      }
      if (payment_screenshot_url !== undefined) {
        const paymentAmount = req.body.amount ? Number(req.body.amount) : undefined;
        const paymentDate = req.body.paymentDate ? new Date(req.body.paymentDate) : undefined;
        results.push(await prisma.payment.create({
          data: {
            travellerId: travellerNumericId,
            paymentScreenshotUrl: payment_screenshot_url,
            ...(paymentAmount !== undefined && { amount: paymentAmount }),
            ...(paymentDate !== undefined && { paymentDate }),
            status: 'UPCOMING',
          },
        }));

        const password = lead.defaultPassword || 'Contact agent for password';
        if (lead.email) {
          sendPaymentConfirmationEmail(lead.email, lead.travellerId, lead.name, password);
        }

        // 🔔 Notify all roles about new payment pending approval
        try {
          await prisma.notification.create({
            data: {
              type: "PAYMENT_APPROVAL",
              targetRole: "all",
              title: "Payment Pending Approval",
              message: `${lead.name} (${lead.travellerId}) uploaded a payment of ₹${paymentAmount || "N/A"}. Please review and approve.`,
              link: "/dashboard/payments",
            },
          });
        } catch (notifErr) {
          logger.error("Failed to create payment notification:", { message: notifErr.message });
        }
      }
    }

    return res.json({ success: true, data: results.length === 1 ? results[0] : results });
  } catch (error) {
    logger.error('Error uploading document:', { error: error.message, stack: error.stack });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST/PATCH - Upsert traveller requirements
router.post("/:leadId/requirements", requireSalesOrAdmin, async (req, res) => {
  try {
    const { leadId } = req.params;
    const {
      serviceType,
      cityNames,
      tourTypes,
      startDate,
      endDate,
      adults,
      children,
      budget,
      needGuide,
      needActivities,
      pickupLocation,
      dropLocation,
      travelTime,
      vehiclePreference,
      specialRequirements,
    } = req.body;

    const traveller = await prisma.traveller.findUnique({
      where: { id: Number(leadId) },
      select: { id: true, defaultPassword: true },
    });

    let password = traveller?.defaultPassword;
    if (traveller && !password) {
      password = crypto.randomBytes(3).toString("hex").toUpperCase();
      await prisma.traveller.update({
        where: { id: Number(leadId) },
        data: { defaultPassword: password },
      });
    }

    const requirement = await prisma.travellerRequirementConfirmation.upsert({
      where: { travellerId: Number(leadId) },
      update: {
        serviceType: serviceType ?? null,
        cityNames: cityNames ?? null,
        tourTypes: tourTypes ?? [],
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        adults: Number(adults) || 0,
        children: Number(children) || 0,
        budget: Number(budget) || 0,
        needGuide: needGuide === true || needGuide === "true",
        needActivities: needActivities === true || needActivities === "true",
        pickupLocation: pickupLocation ?? null,
        dropLocation: dropLocation ?? null,
        travelTime: travelTime ?? null,
        vehiclePreference: vehiclePreference ?? null,
        specialRequirements: specialRequirements ?? null,
        isEmailSent: false,
        isWhatsappSent: false,
      },
      create: {
        travellerId: Number(leadId),
        serviceType: serviceType ?? null,
        cityNames: cityNames ?? null,
        tourTypes: tourTypes ?? [],
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        adults: Number(adults) || 0,
        children: Number(children) || 0,
        budget: Number(budget) || 0,
        needGuide: needGuide === true || needGuide === "true",
        needActivities: needActivities === true || needActivities === "true",
        pickupLocation: pickupLocation ?? null,
        dropLocation: dropLocation ?? null,
        travelTime: travelTime ?? null,
        vehiclePreference: vehiclePreference ?? null,
        specialRequirements: specialRequirements ?? null,
        isEmailSent: false,
        isWhatsappSent: false,
      },
    });

    res.json({ success: true, data: requirement, password });
  } catch (error) {
    logger.error("Error saving requirements:", { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/:leadId/requirements-preview", requireSalesOrAdmin, async (req, res) => {
  try {
    const { leadId } = req.params;
    const traveller = await prisma.traveller.findUnique({
      where: { id: Number(leadId) },
      include: { requirement: true },
    });
    if (!traveller || !traveller.requirement) {
      return res.status(404).send("<h2>Requirements not found</h2>");
    }

    const r = traveller.requirement;
    const brandName = process.env.BRAND_NAME || "Flag Journeys";
    const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

    const rows = [
      ["Service Type", r.serviceType || "—"],
      ["Cities / Destinations", r.cityNames || "—"],
      ["Tour Types", r.tourTypes?.length ? r.tourTypes.join(", ") : "—"],
      ["Start Date", formatDate(r.startDate)],
      ["End Date", formatDate(r.endDate)],
      ["Adults / Children", `${r.adults || 0} Adults, ${r.children || 0} Children`],
      ["Budget", r.budget ? `₹${Number(r.budget).toLocaleString("en-IN")}` : "—"],
      ["Guide Required", r.needGuide ? "✓ Yes" : "✗ No"],
    ];

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Travel Requirements - ${brandName}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', Arial, sans-serif; background: #f1f5f9; padding: 40px 20px; color: #1e293b; }
  .container { max-width: 640px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); overflow: hidden; }
  .header { background: #3730a3; padding: 30px; text-align: center; border-bottom: 4px solid #818cf8; }
  .header h1 { color: white; font-size: 22px; letter-spacing: 1px; }
  .header p { color: #c7d2fe; font-size: 13px; margin-top: 6px; }
  .body { padding: 30px; }
  .greeting { font-size: 18px; font-weight: 700; margin-bottom: 6px; }
  .sub { color: #64748b; font-size: 14px; margin-bottom: 24px; line-height: 1.5; }
  table { width: 100%; border-collapse: collapse; border-radius: 12px; overflow: hidden; }
  td { padding: 12px 16px; font-size: 14px; border-bottom: 1px solid #e2e8f0; }
  tr:nth-child(even) { background: #f8fafc; }
  td:first-child { font-weight: 600; color: #475569; width: 38%; background: #f8fafc; }
  td:last-child { font-weight: 500; color: #0f172a; }
  .footer { text-align: center; padding: 24px; background: #f8fafc; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  .brand-foot { color: #3730a3; font-weight: 700; }
  @media print { body { padding: 0; } .container { box-shadow: none; } }
</style></head><body>
<div class="container">
  <div class="header"><h1>${brandName.toUpperCase()}</h1><p>TRAVEL REQUIREMENTS</p></div>
  <div class="body">
    <div class="greeting">Dear ${traveller.name || "Guest"}, 🙏</div>
    <div class="sub">As per our discussion, your travel requirements are noted below. Our team will create a customized tour package based on these details.</div>
    <table><tbody>
      <tr><td>Traveller ID</td><td style="color:#6366f1;font-weight:700;">${traveller.travellerId}</td></tr>
      ${rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join("")}
    </tbody></table>
    <p style="text-align:center;margin-top:24px;font-size:13px;color:#64748b;">If anything needs to be changed, please let your travel agent know.</p>
  </div>
  <div class="footer">
    <p class="brand-foot">${brandName}</p>
    <p style="margin-top:4px;">&copy; ${new Date().getFullYear()} ${brandName}. All rights reserved.</p>
  </div>
</div>
</body></html>`;

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    logger.error("Error generating requirements preview:", { error: error.message, stack: error.stack });
    res.status(500).send("<h2>Something went wrong</h2>");
  }
});

// POST - Re-send requirements email to traveller
router.post("/:leadId/requirements/send-email", requireSalesOrAdmin, async (req, res) => {
  try {
    const { leadId } = req.params;
    const traveller = await prisma.traveller.findUnique({
      where: { id: Number(leadId) },
      include: { requirement: true },
    });
    if (!traveller) return res.status(404).json({ success: false, message: "Traveller not found" });
    if (!traveller.requirement) return res.status(404).json({ success: false, message: "No requirements saved yet" });
    if (!traveller.email) return res.status(400).json({ success: false, message: "Traveller has no email" });

    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const requirementsUrl = `${baseUrl}/traveller-lead/${leadId}/requirements-preview`;
    const htmlContent = generateRequirementsEmailHTML(
      traveller.name,
      traveller.travellerId,
      traveller.requirement,
      undefined,
      undefined,
      requirementsUrl
    );
    await sendEmail(
      traveller.email,
      `📋 Your Travel Quotation & Requirements - ${traveller.travellerId} | ${process.env.BRAND_NAME || 'Flag Journeys'}`,
      htmlContent
    );

    await prisma.travellerRequirementConfirmation.update({
      where: { id: traveller.requirement.id },
      data: { isEmailSent: true }
    });

    res.json({ success: true, message: "Requirements & Quotation email sent successfully" });
  } catch (error) {
    logger.error("Error sending requirements email:", { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST - Mark requirements as sent (e.g. via WhatsApp)
router.post("/:leadId/requirements/mark-sent", requireSalesOrAdmin, async (req, res) => {
  try {
    const { leadId } = req.params;
    const traveller = await prisma.traveller.findUnique({
      where: { id: Number(leadId) },
      include: { requirement: true },
    });
    if (!traveller || !traveller.requirement) {
      return res.status(404).json({ success: false, message: "Requirements not found" });
    }

    await prisma.travellerRequirementConfirmation.update({
      where: { id: traveller.requirement.id },
      data: { isWhatsappSent: true }
    });

    res.json({ success: true, message: "Requirements marked as sent" });
  } catch (error) {
    logger.error("Error marking requirements as sent:", { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── Delete a lead (super_admin only) ──
router.delete("/:leadId", requireSalesOrAdmin, async (req, res) => {
  try {
    const { leadId } = req.params;
    const user = req.session?.user;
    const normalizedRole = (user?.role ?? "").toLowerCase().replace(/[\s-]+/g, "_");
    const isSuperAdmin = normalizedRole.includes("super") && normalizedRole.includes("admin");

    if (!isSuperAdmin) {
      return res.status(403).json({ success: false, message: "Only Super Admin can delete leads." });
    }

    const id = Number(leadId);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "Invalid lead ID" });
    }
    const traveller = await prisma.traveller.findUnique({ where: { id } });
    if (!traveller) {
      return res.status(404).json({ success: false, message: "Lead not found." });
    }

    // Delete all related records + traveller in a single atomic transaction
    await prisma.$transaction([
      prisma.followupNote.deleteMany({ where: { travellerId: id } }),
      prisma.tourBooking.deleteMany({ where: { travellerId: id } }),
      prisma.vehicleBooking.deleteMany({ where: { travellerId: id } }),
      prisma.payment.deleteMany({ where: { travellerId: id } }),
      prisma.travellerDocument.deleteMany({ where: { travellerId: id } }),
      prisma.vendorAssignment.deleteMany({ where: { travellerId: id } }),
      prisma.invoiceItem.deleteMany({ where: { invoice: { travellerId: id } } }),
      prisma.invoice.deleteMany({ where: { travellerId: id } }),
      prisma.travellerRequirementConfirmation.deleteMany({ where: { travellerId: id } }),
      prisma.traveller.delete({ where: { id } }),
    ]);

    return res.json({ success: true, message: "Lead deleted successfully." });
  } catch (error) {
    logger.error("Error deleting lead:", { error: error.message, stack: error.stack });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ── Public Traveller Portal Endpoints (Zero Paid Third-Party Services) ──

// POST /public/portal-login — Login with phone / email + travellerId or password
router.post("/public/portal-login", async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier) {
      return res.status(400).json({ success: false, message: "Phone or Traveller ID is required" });
    }

    const cleanId = String(identifier).trim();
    const traveller = await prisma.traveller.findFirst({
      where: {
        OR: [
          { travellerId: { equals: cleanId, mode: "insensitive" } },
          { phone: cleanId },
          { email: { equals: cleanId, mode: "insensitive" } },
        ],
      },
      include: {
        invoices: { orderBy: { createdAt: "desc" }, take: 1 },
        payments: { orderBy: { createdAt: "desc" } },
        assignedTo: { select: { name: true, email: true, mobile: true } },
      },
    });

    if (!traveller) {
      return res.status(404).json({ success: false, message: "Traveller record not found for this Phone/ID" });
    }

    // Check password if provided, else fallback to travellerId match
    if (password && traveller.defaultPassword && password !== traveller.defaultPassword && password !== traveller.travellerId) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    return res.json({
      success: true,
      data: traveller,
    });
  } catch (error) {
    logger.error("Error in traveller portal login:", { error: error.message, stack: error.stack });
    return res.status(500).json({ success: false, message: "Server error logging into Traveller Portal" });
  }
});

// POST /public/portal-receipt — Traveller uploads payment receipt screenshot & UTR
router.post("/public/portal-receipt", async (req, res) => {
  try {
    const { travellerId, amount, transactionId, paymentScreenshotUrl, paymentDate } = req.body;
    if (!travellerId || !amount) {
      return res.status(400).json({ success: false, message: "Traveller ID and Amount are required" });
    }

    const cleanId = String(travellerId).trim();
    const isNumeric = /^\d+$/.test(cleanId);
    const whereClause = isNumeric ? { id: Number(cleanId) } : { travellerId: cleanId };

    const traveller = await prisma.traveller.findUnique({
      where: whereClause,
      include: { assignedTo: true },
    });

    if (!traveller) {
      return res.status(404).json({ success: false, message: "Traveller record not found" });
    }

    // Create payment entry
    const newPayment = await prisma.payment.create({
      data: {
        travellerId: traveller.id,
        amount: Number(amount),
        transactionId: transactionId || null,
        paymentScreenshotUrl: paymentScreenshotUrl || null,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        status: "UPCOMING",
      },
    });

    // 🔔 Notify Founder via Telegram Bot
    try {
      const { notifyPaymentReceiptUploadedTelegram } = await import("../services/telegramNotify.js");
      await notifyPaymentReceiptUploadedTelegram(traveller, newPayment);
    } catch (tgErr) {
      logger.error("Telegram notification error:", { message: tgErr.message });
    }

    // 🔔 Create In-App Notification for Superadmin
    try {
      await prisma.notification.create({
        data: {
          type: "PAYMENT_APPROVAL",
          targetRole: "all",
          title: "Payment Receipt Uploaded by Customer",
          message: `${traveller.name} (${traveller.travellerId}) uploaded ₹${amount} payment receipt. Please review and approve.`,
          link: "/dashboard/sales-team/leads",
        },
      });
    } catch (notifErr) {
      logger.error("Failed to create payment notification:", { message: notifErr.message });
    }

    return res.json({
      success: true,
      message: "Payment receipt uploaded successfully! Founder & Sales Team have been notified.",
      data: newPayment,
    });
  } catch (error) {
    logger.error("Error uploading portal receipt:", { error: error.message, stack: error.stack });
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;