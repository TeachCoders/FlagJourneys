"use strict";
import express from "express";
import { prisma } from "../utils/prismaConnection.js";
import { tourBookingSchema as bookingSchema } from "../utils/validation.js";
import { sendTravellerEmail } from "../utils/emailSender.js";
import { requireSalesOrAdmin } from "../middleware/requireSalesOrAdmin.js";
import { logger } from "../utils/logger.js";

import { createLead } from "../services/leadService.js";
import { clientIpFromReq } from "../services/geoService.js";

const router = express.Router();

// Create a new TourBooking (creates traveller lead if needed)
router.post("/", async (req, res) => {
  const parsed = bookingSchema.safeParse(req.body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(", ");
    return res.status(400).json({ success: false, message });
  }

  try {
    const {
      travellerId,
      name,
      email,
      phone,
      country,
      countryId,
      ipAddress,
      location,
      pageReference,
      defaultPassword,
      noOfPersons,
      noOfChildren,
      hotelCategory,
      travelStartDate,
      travelEndDate,
      travellerMessage,
      paymentScreenshotUrl,
      transactionId,
      transactionDetail,
    } = parsed.data;

    let travellerInternalId;
    let targetTraveller = null;
    if (travellerId) {
      // Use existing traveller (numeric ID)
      travellerInternalId = Number(travellerId);
      targetTraveller = await prisma.traveller.findUnique({
        where: { id: travellerInternalId }
      });
      if (!targetTraveller) {
        return res.status(404).json({ success: false, message: "Traveller not found" });
      }
    } else {
      // Create a new traveller lead first via leadService (triggers Telegram, WhatsApp, Email, & Webhook)
      if (!name || !email) {
        return res
          .status(400)
          .json({ success: false, message: "Missing required traveller fields (name, email)" });
      }
      targetTraveller = await createLead({
        name,
        email,
        phone,
        country,
        countryId,
        ipAddress: ipAddress || clientIpFromReq(req) || null,
        location,
        pageReference: pageReference || "/booking",
        defaultPassword,
        source: "website",
      });
      travellerInternalId = targetTraveller.id;
    }

    // Build TourBooking data
    const data = { travellerId: travellerInternalId };
    if (noOfPersons !== undefined) data.noOfPersons = Number(noOfPersons);
    if (noOfChildren !== undefined) data.noOfChildren = Number(noOfChildren);
    if (hotelCategory) data.hotelCategory = hotelCategory;
    if (travelStartDate) data.travelStartDate = new Date(travelStartDate);
    if (travelEndDate) data.travelEndDate = new Date(travelEndDate);
    if (travellerMessage) data.travellerMessage = travellerMessage;
    if (paymentScreenshotUrl) data.paymentScreenshotUrl = paymentScreenshotUrl;
    if (transactionId) data.transactionId = transactionId;
    if (transactionDetail) data.transactionDetail = transactionDetail;

    const newBooking = await prisma.tourBooking.create({ data });

    // 📬 Send email notification (Background process me fire hoga)
    if (targetTraveller && targetTraveller.email) {
      // Keys ko simple aur user-friendly banaya taaki HTML Table me sundar dikhe
      const travelInfo = {
        bookingType: "Package Tour Booking",
        destination: targetTraveller.country || "Not Specified",
        registeredPhone: targetTraveller.phone || "Not Specified",
        totalAdults: data.noOfPersons ? String(data.noOfPersons) : "0",
        totalChildren: data.noOfChildren ? String(data.noOfChildren) : "0",
        hotelRequirement: data.hotelCategory || "Standard",
        departureDate: data.travelStartDate ? new Date(data.travelStartDate).toLocaleDateString('en-IN') : "To Be Decided",
        returnDate: data.travelEndDate ? new Date(data.travelEndDate).toLocaleDateString('en-IN') : "To Be Decided",
        message: data.travellerMessage || `Thank you for reaching out to ${process.env.BRAND_NAME || 'Flag Journeys'}. One of our verified travel experts will contact you shortly via Call or WhatsApp to discuss your custom itinerary.`,
        filledFrom: targetTraveller.location || targetTraveller.country || "",
        ipAddress: targetTraveller.ipAddress || "Unavailable",
        pageReference: targetTraveller.pageReference || "Website",
      };

      // Background me async send trigger hoga, block nahi karega API response ko
      sendTravellerEmail(targetTraveller.email, targetTraveller.travellerId, targetTraveller.name, travelInfo);
    }

    return res.status(201).json({ success: true, data: newBooking });
  } catch (error) {
    logger.error("Unhandled error", { error: error.message, stack: error.stack });
    return res
      .status(500)
      .json({ success: false, message: "Failed to create tour booking" });
  }
});

// Get all TourBookings (optional filter by travellerId) — requires auth
router.get("/", requireSalesOrAdmin, async (req, res) => {
  try {
    const { travellerId } = req.query;
    const where = travellerId ? { travellerId: Number(travellerId) } : {};
    const bookings = await prisma.tourBooking.findMany({ where });
    return res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    logger.error("Unhandled error", { error: error.message, stack: error.stack });
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
});

export default router;