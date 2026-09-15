"use strict";
import { prisma } from "../utils/prismaConnection.js";
import crypto from "crypto";
import { sendTravellerEmail, sendPartnerLeadEmail } from "../utils/emailSender.js";
import { sendWebhook } from "./webhookService.js";
import { notifyNewChatTelegram } from "./telegramNotify.js";
import { notifyNewLeadWhatsApp } from "./whatsappNotify.js";
import { logger } from "../utils/logger.js";
import { resolveCountry } from "./geoService.js";

/**
 * Backfills country/location from the visitor IP when the client could not
 * resolve them (e.g. ad-blockers blocking the geo API). Returns updated
 * country/countryId/location values.
 */
async function resolveLeadGeo({ country, countryId, location, ipAddress }) {
  if (location && country) return { country, countryId, location };
  if (!ipAddress) return { country, countryId, location };
  const geo = await resolveCountry(ipAddress);
  if (!geo) return { country, countryId, location };
  return {
    country: country || geo.countryName,
    countryId: countryId || geo.countryCode,
    location: location || (geo.location ? `${geo.location} (${geo.countryName})` : ""),
  };
}

/**
 * Creates a Traveller lead, auto-assigns it to the configured sales partner
 * (DEFAULT_ASSIGNEE_EMAIL), sends the partner a full lead-card email, sends a
 * welcome email to the tourist (when an email is provided), and fires the
 * dashboard notifications + webhook.
 *
 * Shared by the website lead form and the chat widget.
 *
 * @param {object} input
 * @param {string} input.name
 * @param {string} [input.email]          - optional (chat leads usually lack email)
 * @param {string} input.phone
 * @param {string} [input.country]
 * @param {string} [input.countryId]
 * @param {string} [input.ipAddress]     - visitor public IP (from submission)
 * @param {string} [input.location]      - "City, Region" resolved at submit time
 * @param {string} [input.pageReference]
 * @param {string} [input.travelDate]     - ISO date string or null
 * @param {string} [input.destination]
 * @param {number} [input.groupSize]
 * @param {string} [input.budgetRange]
 * @param {boolean} [input.fromChat]      - when true, sends Telegram new-chat alert
 * @param {string}  [input.source]        - lead origin: "chat" | "website" | "direct"
 * @returns {Promise<object>} the created Traveller record
 */
export async function createLead({
  name,
  email = "",
  phone,
  country = "",
  countryId = "",
  ipAddress = null,
  location = null,
  pageReference = "/booking",
  defaultPassword = null,
  travelDate = null,
  travellerMessage = null,
  destination = null,
  groupSize = null,
  budgetRange = null,
  fromChat = false,
  source = "website",
} = {}) {
  // ── IP-based geo fallback (auto-fills country/location when the client couldn't) ──
  const geoResolved = await resolveLeadGeo({ country, countryId, location, ipAddress });
  country = geoResolved.country;
  countryId = geoResolved.countryId;
  location = geoResolved.location;

  // ── Duplicate prevention: reuse existing lead within 30 days ──
  const LEAD_REUSE_MS = 30 * 24 * 60 * 60 * 1000;
  if (phone) {
    const existing = await prisma.traveller.findFirst({
      where: { phone, createdAt: { gte: new Date(Date.now() - LEAD_REUSE_MS) } },
      orderBy: { createdAt: "desc" },
    });
    if (existing) {
      // Update the existing lead with any new info provided
      const updated = await prisma.traveller.update({
        where: { id: existing.id },
        data: {
          name: name || existing.name,
          email: email || existing.email,
          country: country || existing.country,
          countryId: countryId || existing.countryId,
          ipAddress: ipAddress || existing.ipAddress,
          location: location || existing.location,
          pageReference: pageReference || existing.pageReference,
          source: source || existing.source,
          status: existing.status === "CANCELLED" ? "PENDING" : existing.status,
          ...(travelDate && { travelDate: new Date(travelDate) }),
          ...(travellerMessage && { travellerMessage }),
          ...(destination && { destination }),
          ...(groupSize && { groupSize: Number(groupSize) }),
          ...(budgetRange && { budgetRange }),
        },
      });

      // Send Telegram alert for repeat inquiry as well
      try {
        await notifyNewChatTelegram(updated, null);
      } catch (tgErr) {
        logger.error("Failed to send Telegram alert for repeat lead:", { message: tgErr.message });
      }

      return updated;
    }
  }

  // ── Create new lead ──
  const travellerId = `TRV-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`;
  const newTraveller = await prisma.traveller.create({
    data: {
      travellerId,
      name,
      email: email || "",
      phone,
      country,
      countryId,
      ipAddress,
      location,
      pageReference,
      source,
      defaultPassword,
      travelDate: travelDate ? new Date(travelDate) : null,
      destination,
      travellerMessage,
      groupSize: groupSize ? Number(groupSize) : null,
      budgetRange,
    },
  });

  const assignedPartnerUser = null;

  // 📬 Send welcome email notification (only when the tourist provided an email)
  if (newTraveller.email) {
    const travelInfo = {
      destination: newTraveller.destination || newTraveller.country || "Not Specified",
      registeredPhone: newTraveller.phone || "Not Specified",
      inquirySource: pageReference || "Website Direct",
      message: travellerMessage || `Thank you for reaching out to ${process.env.BRAND_NAME || 'Flag Journeys'}. One of our verified travel experts will contact you shortly via Call or WhatsApp to discuss your custom itinerary.`,
      filledFrom: newTraveller.location || newTraveller.country || "",
      ipAddress: ipAddress || "Unavailable",
    };
    try {
      await sendTravellerEmail(
        newTraveller.email,
        newTraveller.travellerId,
        newTraveller.name,
        travelInfo
      );
    } catch (mailErr) {
      logger.error("Failed to send traveller welcome email:", { message: mailErr.message });
    }
  }

  // 🔔 Create notification for super admin about new lead
  const sourceLabel = source === "chat" ? "Chat" : "Website";
  const notifDetail = `${newTraveller.name} | ${newTraveller.phone || "N/A"} | ${sourceLabel}`;
  try {
    await prisma.notification.create({
      data: {
        type: "NEW_LEAD",
        targetRole: "all",
        title: "New Lead Received",
        message: `${notifDetail} | ${newTraveller.country || "India"} | ${newTraveller.travellerId} | From: ${newTraveller.pageReference || "unknown"}`,
        link: "/dashboard/my-leads",
      },
    });
  } catch (notifErr) {
    logger.error("Failed to create notification:", { message: notifErr.message });
  }

  // Trigger Webhook Notification
  sendWebhook("LEAD_CREATED", newTraveller);

  // Telegram alert for every new lead (no-op when TELEGRAM_BOT_TOKEN is empty)
  try {
    await notifyNewChatTelegram(newTraveller, assignedPartnerUser);
  } catch (tgErr) {
    logger.error("Failed to send Telegram lead alert:", { message: tgErr.message });
  }

  // WhatsApp alert for every new lead (no-op until configured)
  try {
    await notifyNewLeadWhatsApp(newTraveller);
  } catch (waErr) {
    logger.error("Failed to send WhatsApp lead alert:", { message: waErr.message });
  }

  return newTraveller;
}
