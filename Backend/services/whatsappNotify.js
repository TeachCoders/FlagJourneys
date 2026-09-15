import { logger } from "../utils/logger.js";
"use strict";

/**
 * Optional WhatsApp notifications for new leads.
 * Fully optional — until either of these is configured it is a silent no-op,
 * so the ₹0 setup keeps working:
 *
 *   A) Generic gateway (e.g. CallMeBot, or any HTTP API that accepts the
 *      message via URL params `phone`, `apikey`, `text`):
 *        WHATSAPP_API_URL=https://api.callmebot.com/whatsapp.php
 *        WHATSAPP_API_KEY=<your-bot-api-key>
 *        WHATSAPP_TO=91XXXXXXXXXX        (recipient; defaults to CHAT_PARTNER_NUMBER)
 *
 *   B) Meta WhatsApp Cloud API:
 *        WHATSAPP_ACCESS_TOKEN=<facebook-app-token>
 *        WHATSAPP_PHONE_NUMBER_ID=<phone-number-id>
 *        WHATSAPP_TO=91XXXXXXXXXX        (recipient; defaults to CHAT_PARTNER_NUMBER)
 */

// Recipient WhatsApp number: defaults to the already-configured partner number.
const whatsappTo = () =>
  (process.env.WHATSAPP_TO || process.env.CHAT_PARTNER_NUMBER || "918447273005").replace(/[^0-9]/g, "");

const whatsappEnabled = () =>
  Boolean(
    process.env.WHATSAPP_API_URL ||
    (process.env.WHATSAPP_ACCESS_TOKEN &&
      process.env.WHATSAPP_PHONE_NUMBER_ID)
  );

// Rough trip distance from today, in days (negative = started already).
function daysUntilTravel(travelDate) {
  if (!travelDate) return null;
  const diffMs = new Date(travelDate).getTime() - Date.now();
  return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
}

/**
 * Builds the lead notification text.
 * Shows who the user is, where they are from, and how far the trip is.
 */
export function buildLeadText(lead) {
  const brand = process.env.BRAND_NAME || "Flag Journeys";
  const siteUrl = process.env.SITE_URL || "";
  const days = daysUntilTravel(lead.travelDate);
  let when;
  if (days == null) when = "Not specified";
  else if (days < 0) when = `${Math.abs(days)} day(s) ago (past date)`;
  else if (days === 0) when = "Today";
  else when = `In ${days} day${days === 1 ? "" : "s"}`;

  const origin = lead.country || "India (default)";
  const source = lead.source === "chat" ? "Chat" : "Website";

  let text =
    `🔔 NEW LEAD — ${brand}\n\n` +
    `👤 Name: ${lead.name}\n` +
    (lead.email ? `📧 Email: ${lead.email}\n` : "") +
    `📞 Phone: ${lead.phone || "N/A"}\n` +
    `📍 Country: ${origin}\n` +
    `🌐 Form Page URL: ${lead.pageReference || "Website Direct"}\n` +
    (lead.destination ? `🗺 Destination: ${lead.destination}\n` : "") +
    `🗓 Trip: ${when}\n` +
    `🆔 Lead: ${lead.travellerId}\n`;
  if (siteUrl) text += `🔗 ${siteUrl}/dashboard/my-leads`;

  return text;
}

/**
 * Sends a plain text message to the configured WhatsApp number.
 * @param {string} text
 * @returns {Promise<boolean>} true if sent
 */
export async function sendWhatsAppPlain(text) {
  // A) Generic gateway keyed by URL params.
  if (process.env.WHATSAPP_API_URL) {
    try {
      const url = new URL(process.env.WHATSAPP_API_URL);
      const params = new URLSearchParams(url.search);
      if (!params.has("phone")) params.set("phone", whatsappTo());
      if (!params.has("apikey") && process.env.WHATSAPP_API_KEY) params.set("apikey", process.env.WHATSAPP_API_KEY);
      params.set("text", text);
      const res = await fetch(`${url.origin}${url.pathname}?${params.toString()}`, {
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) return true;
      logger.error(`WhatsApp gateway error: ${res.status} ${await res.text().catch(() => "")}`);
    } catch (err) {
      logger.error("WhatsApp gateway send error:", { message: err.message });
    }
    return false;
  }

  // B) Meta WhatsApp Cloud API.
  if (process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: whatsappTo(),
            type: "text",
            text: { body: text },
          }),
          signal: AbortSignal.timeout(10000),
        }
      );
      if (res.ok) return true;
      logger.error(`WhatsApp Meta send failed: ${res.status} ${await res.text().catch(() => "")}`);
    } catch (err) {
      logger.error("WhatsApp Meta send error:", { message: err.message });
    }
  }

  return false;
}

/**
 * Alert for a brand-new lead (website or chat).
 * @param {object} lead - Traveller record
 * @returns {Promise<boolean>} true if sent
 */
export async function notifyNewLeadWhatsApp(lead) {
  if (!whatsappEnabled()) return false;
  return sendWhatsAppPlain(buildLeadText(lead));
}