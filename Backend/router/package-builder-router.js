import express from "express";
import { z } from "zod";
import { prisma } from "../utils/prismaConnection.js";
import { requireSalesOrAdmin } from "../middleware/requireSalesOrAdmin.js";
import { sendEmail } from "../utils/emailSender.js";
import { generateInvoiceEmailHTML } from "../templates/travellerEmailTemplate.js";
import { generatePdfFromHtml } from "../utils/generatePdf.js";
import fs from "fs";
import path from "path";
import { logger } from "../utils/logger.js";

const router = express.Router();

const validServices = ["Hotel", "Car", "Guide", "Activity"];

const invoiceItemSchema = z.object({
  location: z.string().trim().nullish(),
  ServiceName: z.string().trim().nullish(),
  hotelName: z.string().trim().nullish(),
  hotelType: z.string().trim().nullish(),
  carName: z.string().trim().nullish(),
  carOwnerName: z.string().trim().nullish(),
  carType: z.string().trim().nullish(),
  guideName: z.string().trim().nullish(),
  guideLanguage: z.string().trim().nullish(),
  ServcieQty: z.coerce.number().min(0).nullish().default(1),
  UnitPrice: z.coerce.number().min(0).nullish().default(0),
  TotalPrice: z.coerce.number().min(0).nullish().default(0),
  vendorId: z.any().nullish(),
  startDate: z.any().nullish(),
  endDate: z.any().nullish(),
});

const createInvoiceSchema = z.object({
  packageId: z.any().nullish(),
  invoiceNo: z.string().trim().max(100).nullish(),
  quotationNo: z.string().trim().max(100).nullish(),
  packageName: z.string().trim().max(255).nullish(),
  destination: z.string().trim().max(255).nullish(),
  travelDate: z.any().nullish(),
  duration: z.string().trim().max(100).nullish(),
  adults: z.any().nullish(),
  children: z.any().nullish(),
  items: z.array(invoiceItemSchema).nullish().default([]),
  includes: z.array(z.string()).nullish().default([]),
  excludes: z.array(z.string()).nullish().default([]),
  notes: z.any().nullish(),
  cancellationPolicy: z.any().nullish(),
  advanceAmount: z.coerce.number().min(0).nullish().default(0),
  balanceTerms: z.any().nullish(),
  validTill: z.any().nullish(),
  subtotal: z.coerce.number().min(0).nullish().default(0),
  gst: z.coerce.number().min(0).nullish().default(0),
  discount: z.coerce.number().min(0).nullish().default(0),
  serviceCharges: z.coerce.number().min(0).nullish().default(0),
  grandTotal: z.coerce.number().min(0).nullish().default(0),
  itinerary: z.any().nullish(),
  gstRate: z.coerce.number().min(0).max(100).nullish().default(18),
  travellerInfo: z.any().nullish(),
  bannerImageUrl: z.any().nullish(),
  status: z.string().nullish(),
});

// Get all invoices for a specific lead
router.get("/lead/:travellerId", requireSalesOrAdmin, async (req, res) => {
  try {
    const travellerId = parseInt(req.params.travellerId);
    if (isNaN(travellerId)) return res.status(400).json({ success: false, message: "Invalid traveller ID" });

    const invoices = await prisma.invoice.findMany({
      where: { travellerId },
      orderBy: { createdAt: "desc" },
      include: { items: true }
    });

    return res.json({ success: true, data: invoices });
  } catch (error) {
    logger.error("Error fetching invoices:", { error: error.message, stack: error.stack });
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Create or update an invoice
router.post("/lead/:travellerId", requireSalesOrAdmin, async (req, res) => {
  try {
    const travellerId = parseInt(req.params.travellerId);
    if (isNaN(travellerId)) return res.status(400).json({ success: false, message: "Invalid traveller ID" });

    const parsed = createInvoiceSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => i.message).join(", ");
      return res.status(400).json({ success: false, message });
    }

    const {
      packageId, items, subtotal, gst, serviceCharges, grandTotal, status,
      quotationNo, validTill, packageName, destination, duration, travelDate,
      adults, children, discount, includes, excludes, notes, advanceAmount, balanceTerms, itinerary, bannerImageUrl
    } = req.body;

    const invoiceData = {
      subtotal: Number(subtotal || 0),
      gst: Number(gst || 0),
      serviceCharges: Number(serviceCharges || 0),
      grandTotal: Number(grandTotal || 0),
      status: status || "SAVED",
      isEmailSent: false,
      isWhatsappSent: false,
      quotationNo: quotationNo || invoiceNo || null,
      validTill: validTill || null,
      packageName: packageName || null,
      destination: destination || null,
      duration: duration || null,
      travelDate: travelDate || null,
      adults: Number(adults || 1),
      children: Number(children || 0),
      discount: Number(discount || 0),
      includes: includes || [],
      excludes: excludes || [],
      notes: notes || null,
      advanceAmount: Number(advanceAmount || 0),
      balanceTerms: balanceTerms || null,
      itinerary: itinerary || null,
      bannerImageUrl: bannerImageUrl || [],
      items: {
        create: (items || []).map(item => {
          const serviceName = (item.ServiceName && validServices.includes(item.ServiceName)) ? item.ServiceName : "Hotel";
          return {
            location: item.location || "General",
            ServiceName: serviceName,
            ServcieQty: Number(item.ServcieQty || 0),
            UnitPrice: Number(item.UnitPrice || 0),
            TotalPrice: Number(item.TotalPrice || 0),
            vendorId: item.vendorId ? Number(item.vendorId) : null,
            hotelName: item.hotelName || null,
            hotelType: item.hotelType || null,
            carName: item.carName || null,
            carOwnerName: item.carOwnerName || null,
            carType: item.carType || null,
            guideName: item.guideName || null,
            guideLanguage: item.guideLanguage || null,
            startDate: item.startDate ? new Date(item.startDate) : null,
            endDate: item.endDate ? new Date(item.endDate) : null,
          };
        })
      }
    };

    // If packageId is provided, perform an update
    if (packageId) {
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId: Number(packageId) }
      });

      const updatedInvoice = await prisma.invoice.update({
        where: { id: Number(packageId) },
        data: invoiceData,
        include: { items: true }
      });

      return res.json({ success: true, data: updatedInvoice });
    }

    // Otherwise, create a new invoice
    const lastInvoice = await prisma.invoice.findFirst({
      where: { travellerId },
      orderBy: { version: "desc" }
    });

    const newVersion = lastInvoice ? lastInvoice.version + 1 : 1;

    const newInvoice = await prisma.invoice.create({
      data: {
        travellerId,
        version: newVersion,
        ...invoiceData
      },
      include: { items: true }
    });

    return res.json({ success: true, data: newInvoice });
  } catch (error) {
    logger.error("Error saving invoice:", { error: error.message, stack: error.stack });
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Delete Invoice (Super Admin only)
router.delete("/:id", requireSalesOrAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid invoice ID" });
    const sessionUser = req.session?.user;
    const role = (sessionUser?.role ?? "").toLowerCase().replace(/[\s-]+/g, "_");
    const isSuperAdmin = role.includes("super") && role.includes("admin");

    if (!isSuperAdmin) {
      return res.status(403).json({ success: false, message: "Forbidden: Super Admin only" });
    }

    await prisma.invoice.delete({
      where: { id }
    });

    return res.json({ success: true, message: "Invoice deleted successfully" });
  } catch (error) {
    logger.error("Error deleting invoice:", { error: error.message, stack: error.stack });
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Send Invoice Email
router.post("/lead/:travellerId/send-invoice", requireSalesOrAdmin, async (req, res) => {
  try {
    const travellerId = parseInt(req.params.travellerId);
    if (isNaN(travellerId)) return res.status(400).json({ success: false, message: "Invalid traveller ID" });
    const { invoiceNo, packageName, destination, travelDate, duration, items, includes, excludes, notes, cancellationPolicy, advanceAmount, balanceTerms, validTill, subtotal, gst, discount, grandTotal, itinerary, bannerImageUrl, gstRate, travellerInfo } = req.body;

    const traveller = await prisma.traveller.findUnique({
      where: { id: travellerId }
    });

    if (!traveller || !traveller.email) {
      return res.status(404).json({ success: false, message: "Traveller not found or no email available." });
    }

    const packageDetails = { packageName, destination, travelDate, duration, items, includes, excludes, notes, cancellationPolicy, advanceAmount, balanceTerms, validTill, itinerary, bannerImageUrl, gstRate, travellerInfo };

    const htmlContent = generateInvoiceEmailHTML(
      traveller.name,
      invoiceNo || "N/A",
      packageDetails,
      subtotal || 0,
      gst || 0,
      discount || 0,
      grandTotal || 0,
      null,
      null,
      true
    );

    const pdfHtmlContent = generateInvoiceEmailHTML(
      traveller.name,
      invoiceNo || "N/A",
      packageDetails,
      subtotal || 0,
      gst || 0,
      discount || 0,
      grandTotal || 0,
      null,
      null,
      false
    );

    const pdfBuffer = await generatePdfFromHtml(pdfHtmlContent, { format: 'A4', margin: { top: '10px', right: '10px', bottom: '10px', left: '10px' } });

    const cleanName = (str) => (str || "").replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "").substring(0, 50);
    const filename = `quotation-${cleanName(traveller.name)}-${cleanName(packageName)}-${Date.now()}.pdf`;

    const emailSent = await sendEmail(
      traveller.email,
      `Your Invoice / Quotation - ${process.env.BRAND_NAME || "Flag Journeys"}`,
      htmlContent,
      pdfBuffer,
      filename
    );

    if (emailSent) {
      // Mark the latest invoice as SENT
      const latestInvoice = await prisma.invoice.findFirst({
        where: { travellerId },
        orderBy: { createdAt: "desc" },
      });
      if (latestInvoice) {
        await prisma.invoice.update({
          where: { id: latestInvoice.id },
          data: { status: "SENT", isEmailSent: true },
        });
      }
      return res.json({ success: true, message: "Invoice sent successfully!" });
    } else {
      throw new Error("Failed to send email");
    }
  } catch (error) {
    logger.error("Error sending invoice email:", { error: error.message, stack: error.stack });
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Mark invoice as SENT (e.g. via WhatsApp)
router.post("/:id/mark-sent", requireSalesOrAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid invoice ID" });
    await prisma.invoice.update({
      where: { id },
      data: { status: "SENT", isWhatsappSent: true },
    });
    return res.json({ success: true, message: "Invoice marked as sent" });
  } catch (error) {
    logger.error("Error marking invoice as sent:", { error: error.message, stack: error.stack });
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Generate PDF for quotation — saves to public/quotations, returns public URL
// (quotations/ is a shared folder deliberately kept public so travellers can
//  download the PDF from the WhatsApp/email link without logging in)
router.post("/lead/:travellerId/generate-pdf", requireSalesOrAdmin, async (req, res) => {
  try {
    const travellerId = parseInt(req.params.travellerId);
    if (isNaN(travellerId)) return res.status(400).json({ success: false, message: "Invalid traveller ID" });
    const { invoiceNo, packageName, destination, travelDate, duration, items, includes, excludes, notes, cancellationPolicy, advanceAmount, balanceTerms, validTill, subtotal, gst, discount, grandTotal, itinerary, bannerImageUrl, gstRate, travellerInfo } = req.body;

    const traveller = await prisma.traveller.findUnique({
      where: { id: travellerId },
      select: { name: true, email: true, phone: true }
    });

    const packageDetails = { packageName, destination, travelDate, duration, items, includes, excludes, notes, cancellationPolicy, advanceAmount, balanceTerms, validTill, itinerary, bannerImageUrl, gstRate, travellerInfo };

    const htmlContent = generateInvoiceEmailHTML(
      traveller?.name || "Guest",
      invoiceNo || "N/A",
      packageDetails,
      subtotal || 0,
      gst || 0,
      discount || 0,
      grandTotal || 0,
      null,
      null,
      false
    );

    const pdfBuffer = await generatePdfFromHtml(htmlContent, { format: 'A4', margin: { top: '10px', right: '10px', bottom: '10px', left: '10px' } });

    const pdfDir = path.join("public", "quotations");
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }

    // Delete old PDFs for this traveller before creating new one
    const existingFiles = fs.readdirSync(pdfDir);
    for (const file of existingFiles) {
      if (file.startsWith(`quotation-${travellerId}-`)) {
        fs.unlinkSync(path.join(pdfDir, file));
      }
    }

    const cleanName = (str) => (str || "").replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "").substring(0, 50);
    const travellerName = cleanName(traveller?.name);
    const packageNameStr = cleanName(packageName);
    const filename = `quotation-${travellerName}-${packageNameStr}-${Date.now()}.pdf`;
    const filePath = path.join(pdfDir, filename);
    fs.writeFileSync(filePath, pdfBuffer);

    const url = `/quotations/${filename}`;

    return res.json({ success: true, url });
  } catch (error) {
    logger.error("Error generating PDF:", { error: error.message, stack: error.stack });
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// GET invoice preview HTML for a lead's latest invoice
router.get("/lead/:travellerId/invoice-preview", requireSalesOrAdmin, async (req, res) => {
  try {
    const travellerId = parseInt(req.params.travellerId);
    if (isNaN(travellerId)) return res.status(400).json({ success: false, message: "Invalid traveller ID" });

    const invoice = await prisma.invoice.findFirst({
      where: { travellerId },
      orderBy: { createdAt: "desc" },
      include: { items: true }
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: "No invoice found for this lead." });
    }

    const traveller = await prisma.traveller.findUnique({
      where: { id: travellerId },
      select: { name: true, email: true, phone: true, travellerId: true }
    });

    const grouped = (invoice.items || []).reduce((acc, item) => {
      if (!acc[item.location]) acc[item.location] = [];
      acc[item.location].push(item);
      return acc;
    }, {});

    let cityRows = '';
    for (const [city, cityItems] of Object.entries(grouped)) {
      let rows = '';
      for (const item of cityItems) {
        let details = '';
        if (item.ServiceName === 'Hotel' && item.hotelName) {
          details = `<br/><span style="font-size:11px;color:#64748b;">${item.hotelName}${item.hotelType ? ' (' + item.hotelType + ')' : ''}</span>`;
        } else if (item.ServiceName === 'Car' && item.carName) {
          details = `<br/><span style="font-size:11px;color:#64748b;">${item.carName}${item.carOwnerName ? ' - Owner: ' + item.carOwnerName : ''}${item.carType ? ' (' + item.carType + ')' : ''}</span>`;
        } else if (item.ServiceName === 'Guide' && item.guideName) {
          details = `<br/><span style="font-size:11px;color:#64748b;">${item.guideName}${item.guideLanguage ? ' (' + item.guideLanguage + ')' : ''}</span>`;
        }
        rows += `<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;">${item.ServiceName}${details}</td><td style="padding:8px 12px;border:1px solid #e2e8f0;text-align:center;">${item.ServcieQty}</td><td style="padding:8px 12px;border:1px solid #e2e8f0;text-align:right;">₹${Number(item.UnitPrice).toLocaleString()}</td><td style="padding:8px 12px;border:1px solid #e2e8f0;text-align:right;">₹${Number(item.TotalPrice).toLocaleString()}</td></tr>`;
      }
      cityRows += `<h4 style="margin:16px 0 8px;color:#4f46e5;">📍 ${city}</h4><table style="width:100%;border-collapse:collapse;margin-bottom:16px;"><thead><tr style="background:#f1f5f9;"><th style="padding:8px 12px;border:1px solid #e2e8f0;text-align:left;font-size:12px;">Service</th><th style="padding:8px 12px;border:1px solid #e2e8f0;text-align:center;font-size:12px;">Qty</th><th style="padding:8px 12px;border:1px solid #e2e8f0;text-align:right;font-size:12px;">Unit Price</th><th style="padding:8px 12px;border:1px solid #e2e8f0;text-align:right;font-size:12px;">Total</th></tr></thead><tbody>${rows}</tbody></table>`;
    }

    const subtotal = invoice.subtotal || 0;
    const gst = invoice.gst || 0;
    const grandTotal = invoice.grandTotal || 0;
    const brandName = process.env.BRAND_NAME || "Flag Journeys";

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Invoice Preview - ${brandName}</title>
<style>
  body { font-family: 'Inter', Arial, sans-serif; background: #f8fafc; margin: 0; padding: 40px 20px; color: #1e293b; }
  .container { max-width: 700px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); padding: 40px; }
  h1 { font-size: 28px; font-weight: 800; color: #0f172a; margin: 0; }
  h2 { font-size: 16px; color: #4f46e5; margin: 0; }
  .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 20px; }
  .brand { text-align: right; }
  .brand h2 { font-size: 20px; font-weight: 800; color: #0f172a; }
  .brand p { font-size: 12px; color: #64748b; margin: 2px 0; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  th, td { padding: 10px 14px; border: 1px solid #e2e8f0; font-size: 14px; }
  th { background: #f1f5f9; font-weight: 600; color: #475569; text-align: left; }
  .total-row td { background: #4f46e5; color: white; font-weight: bold; font-size: 16px; }
  .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }
  @media print { body { padding: 0; } .container { box-shadow: none; border-radius: 0; padding: 20px; } }
</style></head><body>
<div class="container">
  <div class="header">
    <div><h1>PACKAGE QUOTATION</h1><p style="color:#64748b;margin-top:4px;">Lead ID: #${travellerId}</p><p style="color:#94a3b8;font-size:12px;">Invoice ID: ${invoice.id}</p></div>
    <div class="brand"><h2>${brandName.toUpperCase()}</h2><p>Premium Travel Experiences</p><p style="margin-top:8px;">Date: ${new Date().toLocaleDateString()}</p></div>
  </div>
  ${traveller ? `<div style="margin-bottom:20px;padding:16px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;"><h3 style="font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;margin:0 0 8px;">Billed To</h3><p style="font-weight:700;margin:0;">${traveller.name}</p><p style="color:#64748b;font-size:13px;margin:2px 0;">${traveller.email || ''}</p><p style="color:#64748b;font-size:13px;margin:2px 0;">${traveller.phone || ''}</p></div>` : ''}
  ${cityRows}
  <table><tbody>
    <tr><td style="color:#475569;">Subtotal</td><td style="text-align:right;font-weight:600;">₹${Number(subtotal).toLocaleString()}</td></tr>
    <tr><td style="color:#475569;">GST</td><td style="text-align:right;font-weight:600;">₹${Number(gst).toLocaleString()}</td></tr>
    <tr class="total-row"><td>Grand Total</td><td style="text-align:right;">₹${Number(grandTotal).toLocaleString()}</td></tr>
  </tbody></table>
  <div class="footer"><p>&copy; ${new Date().getFullYear()} ${brandName}. Premium Travel Experiences</p></div>
</div></body></html>`;

    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (error) {
    logger.error("Error generating invoice preview:", { error: error.message, stack: error.stack });
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

export default router;
