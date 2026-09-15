import express from "express";
import { prisma } from "../utils/prismaConnection.js";
import { requireSalesOrAdmin } from "../middleware/requireSalesOrAdmin.js";
import { requireSuperAdmin } from "../middleware/requireSuperAdmin.js";
import { sendEmail } from "../utils/emailSender.js";
import { handlePrismaError } from "../utils/handlePrismaError.js";
import { logger } from "../utils/logger.js";

const router = express.Router();

// GET all vendor payments with vendor + assignment info + installments
router.get("/", requireSalesOrAdmin, async (req, res) => {
  try {
    const payments = await prisma.vendorPayment.findMany({
      include: {
        vendor: { select: { id: true, vendarName: true, vendarEmail: true, vendarCompanyName: true, vendarMobile: true, vendarServiceType: true } },
        assignment: {
          select: {
            id: true,
            services: true,
            totalAmount: true,
            serviceWiseAmount: true,
            traveller: { select: { id: true, name: true, travellerId: true } },
          },
        },
        installments: { orderBy: { paymentDate: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    const summary = await prisma.vendorPayment.aggregate({
      _sum: { amount: true, paidAmount: true, pendingAmount: true },
    });

    return res.status(200).json({
      success: true,
      data: payments,
      summary: {
        totalPayable: summary._sum.amount || 0,
        totalReceived: summary._sum.paidAmount || 0,
        totalPending: summary._sum.pendingAmount || 0,
      },
    });
  } catch (err) {
    logger.error("Error fetching vendor payments:", { error: err.message, stack: err.stack });
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// GET vendor payments filtered by vendorId
router.get("/vendor/:vendorId", requireSalesOrAdmin, async (req, res) => {
  try {
    const vendorId = Number(req.params.vendorId);
    const payments = await prisma.vendorPayment.findMany({
      where: { vendorId },
      include: {
        assignment: {
          select: {
            id: true,
            services: true,
            totalAmount: true,
            serviceWiseAmount: true,
            traveller: { select: { id: true, name: true, travellerId: true } },
          },
        },
        installments: { orderBy: { paymentDate: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    const summary = await prisma.vendorPayment.aggregate({
      where: { vendorId },
      _sum: { amount: true, paidAmount: true, pendingAmount: true },
    });

    return res.status(200).json({
      success: true,
      data: payments,
      summary: {
        totalPayable: summary._sum.amount || 0,
        totalReceived: summary._sum.paidAmount || 0,
        totalPending: summary._sum.pendingAmount || 0,
      },
    });
  } catch (err) {
    logger.error("Error fetching vendor payments by vendor:", { error: err.message, stack: err.stack });
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// POST create new payment record (optionally linked to an assignment)
router.post("/", requireSuperAdmin, async (req, res) => {
  try {
    const { vendorId, assignmentId, invoiceNo, amount, paymentType, paymentMethod, dueDate, remarks } = req.body;

    if (!vendorId || !amount || !paymentType || !paymentMethod) {
      return res.status(400).json({ success: false, message: "vendorId, amount, paymentType, and paymentMethod are required" });
    }

    const payment = await prisma.vendorPayment.create({
      data: {
        vendorId: Number(vendorId),
        assignmentId: assignmentId ? Number(assignmentId) : null,
        invoiceNo: invoiceNo || `INV-${Date.now()}`,
        amount: Number(amount),
        paidAmount: 0,
        pendingAmount: Number(amount),
        paymentType,
        paymentMethod,
        paymentStatus: "PENDING",
        dueDate: dueDate ? new Date(dueDate) : null,
        remarks: remarks || null,
      },
      include: {
        vendor: { select: { id: true, vendarName: true, vendarCompanyName: true, vendarMobile: true, vendarServiceType: true } },
        assignment: { select: { id: true, services: true, traveller: { select: { name: true, travellerId: true } } } },
        installments: true,
      },
    });

    return res.status(201).json({ success: true, message: "Payment record created", data: payment });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ success: false, message: "Invoice number already exists" });
    }
    logger.error("Error creating payment record:", { error: err.message, stack: err.stack });
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// POST record an installment (partial or full) against an existing payment record
router.post("/:id/record", requireSalesOrAdmin, async (req, res) => {
  try {
    const { payAmount, paymentMethod, transactionId, paymentDate, remarks, paymentSlip } = req.body;

    if (!payAmount || payAmount <= 0) {
      return res.status(400).json({ success: false, message: "A valid payAmount is required" });
    }

    const existing = await prisma.vendorPayment.findUnique({ where: { id: Number(req.params.id) } });
    if (!existing) return res.status(404).json({ success: false, message: "Payment record not found" });

    // Create installment record
    const installment = await prisma.paymentInstallment.create({
      data: {
        paymentId: Number(req.params.id),
        amount: Number(payAmount),
        paymentMethod: paymentMethod || existing.paymentMethod,
        transactionId: transactionId || null,
        paymentSlip: paymentSlip || null,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        remarks: remarks || null,
      },
    });

    // Update parent payment totals
    const newPaid = existing.paidAmount + Number(payAmount);
    const newPending = Math.max(0, existing.amount - newPaid);
    const newStatus = newPending === 0 ? "PAID" : newPaid > 0 ? "PARTIAL" : "PENDING";

    const updated = await prisma.vendorPayment.update({
      where: { id: Number(req.params.id) },
      data: {
        paidAmount: newPaid,
        pendingAmount: newPending,
        paymentStatus: newStatus,
        paymentMethod: paymentMethod || existing.paymentMethod,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      },
      include: {
        vendor: { select: { id: true, vendarName: true, vendarCompanyName: true, vendarMobile: true, vendarServiceType: true } },
        assignment: { select: { id: true, services: true, traveller: { select: { name: true, travellerId: true } } } },
        installments: { orderBy: { paymentDate: "desc" } },
      },
    });

    return res.status(200).json({ success: true, message: "Payment recorded", data: updated });
  } catch (err) {
    logger.error("Error recording installment:", { error: err.message, stack: err.stack });
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// PUT update payment record
router.put("/:id", requireSuperAdmin, async (req, res) => {
  try {
    const { dueDate, remarks, paymentMethod, paymentStatus } = req.body;

    const VALID_PAYMENT_STATUSES = ["PENDING", "PARTIAL", "PAID", "OVERDUE"];
    if (paymentStatus !== undefined && !VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
      return res.status(400).json({ success: false, message: "Invalid payment status value" });
    }

    const updated = await prisma.vendorPayment.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(remarks !== undefined && { remarks }),
        ...(paymentMethod && { paymentMethod }),
        ...(paymentStatus !== undefined && { paymentStatus }),
      },
    });

    return res.status(200).json({ success: true, message: "Payment updated", data: updated });
  } catch (err) {
    if (handlePrismaError(res, err, "Payment")) return;
    logger.error("Error updating payment record:", { error: err.message, stack: err.stack });
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// POST share payment history via email
router.post("/share-email", requireSalesOrAdmin, async (req, res) => {
  try {
    const { vendorId, email } = req.body;
    if (!vendorId || !email) {
      return res.status(400).json({ success: false, message: "vendorId and email are required" });
    }

    const payments = await prisma.vendorPayment.findMany({
      where: { vendorId: Number(vendorId) },
      include: {
        vendor: { select: { vendarName: true, vendarEmail: true } },
        assignment: {
          select: {
            id: true, services: true, totalAmount: true,
            traveller: { select: { name: true, travellerId: true } },
          },
        },
        installments: { orderBy: { paymentDate: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    if (payments.length === 0) {
      return res.status(404).json({ success: false, message: "No payment records found for this vendor" });
    }

    const vendorName = payments[0]?.vendor?.vendarCompanyName || payments[0]?.vendor?.vendarName || "Vendor";
    const totalAmount = payments.reduce((s, p) => s + (p.amount || 0), 0);
    const totalPaid = payments.reduce((s, p) => s + (p.paidAmount || 0), 0);
    const totalDue = payments.reduce((s, p) => s + (p.pendingAmount || 0), 0);

    let installmentRows = "";
    for (const p of payments) {
      for (const inst of (p.installments || [])) {
        installmentRows += `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-size:13px;">${p.assignment?.traveller?.name || "—"}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-size:13px;">${p.invoiceNo || "—"}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:right;">₹${(inst.amount || 0).toLocaleString()}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-size:13px;">${inst.paymentMethod}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-size:13px;">${inst.transactionId || "—"}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-size:13px;">${inst.paymentDate ? new Date(inst.paymentDate).toLocaleDateString("en-IN") : "—"}</td>
          </tr>`;
      }
    }

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#6366f1,#3b82f6);padding:24px;border-radius:12px 12px 0 0;">
          <h2 style="color:#fff;margin:0;">Payment History — ${vendorName}</h2>
          <p style="color:#e0e7ff;margin:4px 0 0;font-size:13px;">${process.env.BRAND_NAME || 'Flag Journeys'} · Payment Summary</p>
        </div>
        <div style="padding:24px;background:#f8fafc;border:1px solid #e2e8f0;">
          <div style="display:flex;gap:16px;margin-bottom:20px;">
            <div style="flex:1;background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#64748b;font-weight:600;">TOTAL AMOUNT</p>
              <p style="margin:4px 0 0;font-size:20px;font-weight:900;color:#1e293b;">₹${totalAmount.toLocaleString()}</p>
            </div>
            <div style="flex:1;background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#64748b;font-weight:600;">TOTAL PAID</p>
              <p style="margin:4px 0 0;font-size:20px;font-weight:900;color:#16a34a;">₹${totalPaid.toLocaleString()}</p>
            </div>
            <div style="flex:1;background:#fff;border:1px solid ${totalDue > 0 ? '#fbbf24' : '#e2e8f0'};border-radius:8px;padding:16px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#64748b;font-weight:600;">DUE AMOUNT</p>
              <p style="margin:4px 0 0;font-size:20px;font-weight:900;color:${totalDue > 0 ? '#d97706' : '#16a34a'};">₹${totalDue.toLocaleString()}</p>
            </div>
          </div>
          <h3 style="font-size:14px;font-weight:700;color:#334155;margin-bottom:8px;">Payment Records</h3>
          <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
            <thead>
              <tr style="background:#f1f5f9;">
                <th style="padding:8px;text-align:left;font-size:11px;font-weight:700;color:#64748b;">Traveller</th>
                <th style="padding:8px;text-align:left;font-size:11px;font-weight:700;color:#64748b;">Invoice</th>
                <th style="padding:8px;text-align:right;font-size:11px;font-weight:700;color:#64748b;">Amount</th>
                <th style="padding:8px;text-align:left;font-size:11px;font-weight:700;color:#64748b;">Method</th>
                <th style="padding:8px;text-align:left;font-size:11px;font-weight:700;color:#64748b;">Transaction ID</th>
                <th style="padding:8px;text-align:left;font-size:11px;font-weight:700;color:#64748b;">Date</th>
              </tr>
            </thead>
            <tbody>${installmentRows || '<tr><td colspan="6" style="padding:16px;text-align:center;color:#94a3b8;">No installments recorded</td></tr>'}</tbody>
          </table>
        </div>
        <div style="padding:16px 24px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:0 0 12px 12px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#94a3b8;">This is an automated payment summary from ${process.env.BRAND_NAME || 'Flag Journeys'}</p>
        </div>
      </div>`;

    const sent = await sendEmail(email, `Payment History — ${vendorName}`, html);
    if (!sent) {
      return res.status(500).json({ success: false, message: "Failed to send email" });
    }

    return res.status(200).json({ success: true, message: `Payment history sent to ${email}` });
  } catch (err) {
    logger.error("Error sharing payment history:", { error: err.message, stack: err.stack });
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// DELETE payment record
router.delete("/:id", requireSuperAdmin, async (req, res) => {
  try {
    await prisma.vendorPayment.delete({ where: { id: Number(req.params.id) } });
    return res.status(200).json({ success: true, message: "Payment record deleted" });
  } catch (err) {
    if (handlePrismaError(res, err, "Payment")) return;
    logger.error("Error deleting payment record:", { error: err.message, stack: err.stack });
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

export default router;
