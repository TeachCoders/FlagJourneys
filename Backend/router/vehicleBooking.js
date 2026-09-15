"use strict";
import express from "express";
import { prisma } from "../utils/prismaConnection.js";
import { vehicleBookingSchema as bookingSchema } from "../utils/validation.js";
import { sendTravellerEmail } from "../utils/emailSender.js";
import { requireSalesOrAdmin } from "../middleware/requireSalesOrAdmin.js";
import { logger } from "../utils/logger.js";

import { createLead } from "../services/leadService.js";
import { clientIpFromReq } from "../services/geoService.js";

const router = express.Router();

// Create a new VehicleBooking (creates traveller lead if needed)
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
      vehicleName,
      serviceType,
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

    // Build VehicleBooking data
    const data = { travellerId: travellerInternalId };
    if (vehicleName) data.vehicleName = vehicleName;
    if (serviceType) data.serviceType = serviceType;
    if (travellerMessage) data.travellerMessage = travellerMessage;
    if (paymentScreenshotUrl) data.paymentScreenshotUrl = paymentScreenshotUrl;
    if (transactionId) data.transactionId = transactionId;
    if (transactionDetail) data.transactionDetail = transactionDetail;

    const newBooking = await prisma.vehicleBooking.create({ data });

    // 📬 Send email notification (Background process)
    if (targetTraveller && targetTraveller.email) {
      // Keys ko simple aur readable rakha hai taaki HTML Table clean dikhe
      const travelInfo = {
        bookingType: "Vehicle / Transport Rental",
        requestedVehicle: data.vehicleName || "Not Specified",
        serviceType: data.serviceType || "Standard Rental",
        registeredPhone: targetTraveller.phone || "Not Specified",
        originCountry: targetTraveller.country || "Not Specified",
        message: data.travellerMessage || `Thank you for reaching out to ${process.env.BRAND_NAME || 'Flag Journeys'}. One of our verified fleet experts will contact you shortly via Call or WhatsApp to finalize your vehicle deployment.`,
        filledFrom: targetTraveller.location || targetTraveller.country || "",
        ipAddress: targetTraveller.ipAddress || "Unavailable",
        pageReference: targetTraveller.pageReference || "Website",
      };

      // Email trigger bina API response block kiye background me execute hoga
      sendTravellerEmail(targetTraveller.email, targetTraveller.travellerId, targetTraveller.name, travelInfo);
    }

    return res.status(201).json({ success: true, data: newBooking });
  } catch (error) {
    logger.error("Unhandled error", { error: error.message, stack: error.stack });
    return res
      .status(500)
      .json({ success: false, message: "Failed to create vehicle booking" });
  }
});

// Get all VehicleBookings (optional filter by travellerId) — requires auth
router.get("/", requireSalesOrAdmin, async (req, res) => {
  try {
    const { travellerId } = req.query;
    const where = travellerId ? { travellerId: Number(travellerId) } : {};
    const bookings = await prisma.vehicleBooking.findMany({ where });
    return res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    logger.error("Unhandled error", { error: error.message, stack: error.stack });
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
});

export default router;