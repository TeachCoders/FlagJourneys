import { logger } from "../utils/logger.js";
"use strict";

/**
 * Optional Telegram notifications for new chats / new leads.
 * Fully optional — when TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_IDS is not set,
 * every function becomes a silent no-op so the ₹0 setup keeps working.
 */

const telegramEnabled = () => Boolean(process.env.TELEGRAM_BOT_TOKEN);

const chatIds = () =>
  (process.env.TELEGRAM_CHAT_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

/**
 * Sends a plain text message to all configured Telegram chat IDs.
 * @param {string} text
 * @returns {Promise<boolean>} true if at least one message was sent
 */
export async function sendTelegramMessage(text) {
  if (!telegramEnabled()) return false;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const ids = chatIds();
  if (!ids.length) return false;

  let sent = false;
  for (const chatId of ids) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        sent = true;
      } else {
        logger.error(`Telegram send to ${chatId} failed: ${res.status} ${await res.text()}`);
      }
    } catch (err) {
      logger.error("Telegram send error:", { message: err.message });
    }
  }
  return sent;
}

/**
 * Alert for a brand-new lead (website or chat).
 * @param {object} lead - Traveller record
 * @param {object|null} partner - assigned Users record (or null)
 */
export async function notifyNewChatTelegram(lead, partner = null) {
  const brand = process.env.BRAND_NAME || "Flag Journeys";
  const siteUrl = process.env.SITE_URL || "";
  const isChat = lead.source === "chat";
  const titleEmoji = isChat ? "💬" : "🔔";
  const titleText = isChat ? "NEW CHAT LEAD" : "NEW WEBSITE LEAD";

  let text =
    `${titleEmoji} <b>${titleText} — ${brand}</b>\n\n` +
    `👤 <b>Name:</b> ${lead.name || "Guest"}\n` +
    (lead.email ? `📧 <b>Email:</b> ${lead.email}\n` : "") +
    `📞 <b>Phone:</b> ${lead.phone || "N/A"}\n` +
    `📍 <b>Country:</b> ${lead.country || "India"}\n` +
    `🌐 <b>Form Page URL:</b> ${lead.pageReference || "Website Direct"}\n` +
    (lead.destination ? `🗺 <b>Destination:</b> ${lead.destination}\n` : "") +
    (lead.travellerMessage ? `💬 <b>Message:</b> ${lead.travellerMessage}\n` : "") +
    (partner ? `🤝 <b>Assigned to:</b> ${partner.name}\n` : "") +
    `🆔 <b>Lead ID:</b> ${lead.travellerId}\n`;

  const dashboardLink = isChat ? "/dashboard/chat" : "/dashboard/my-leads";
  if (siteUrl) text += `\n🔗 <a href="${siteUrl}${dashboardLink}">View in Admin Dashboard</a>`;

  return sendTelegramMessage(text);
}

/**
 * Alert for a NEW free-text message inside an ongoing chat (flow complete).
 * @param {object} conversation - ChatConversation record
 * @param {string} messageText - the tourist's latest message
 */
export async function notifyNewChatMessageTelegram(conversation, messageText) {
  const brand = process.env.BRAND_NAME || "Flag Journeys";
  const siteUrl = process.env.SITE_URL || "";
  let text =
    `💬 <b>New Chat Message — ${brand}</b>\n\n` +
    `👤 <b>From:</b> ${conversation.touristName || "Tourist"}\n` +
    `📞 <b>Phone:</b> ${conversation.phone || "N/A"}\n` +
    `💬 <b>Message:</b> ${String(messageText || "").slice(0, 300)}\n`;
  if (siteUrl) text += `\n🔗 <a href="${siteUrl}/dashboard/chat">Open Chat Dashboard</a>`;

  return sendTelegramMessage(text);
}

/**
 * Alert for customer payment receipt upload (Anti-Fraud Founder Shield).
 * @param {object} traveller
 * @param {object} payment
 */
export async function notifyPaymentReceiptUploadedTelegram(traveller, payment) {
  const brand = process.env.BRAND_NAME || "Flag Journeys";
  const siteUrl = process.env.SITE_URL || "";
  let text =
    `💳 <b>PAYMENT RECEIPT UPLOADED — ${brand}</b>\n\n` +
    `👤 <b>Customer Name:</b> ${traveller.name || "Guest"}\n` +
    `📞 <b>Phone:</b> ${traveller.phone || "N/A"}\n` +
    `🆔 <b>Lead ID:</b> ${traveller.travellerId}\n` +
    `💵 <b>Amount Paid:</b> ₹${payment.amount || "N/A"}\n` +
    `🧾 <b>Transaction UTR:</b> ${payment.transactionId || "N/A"}\n` +
    (payment.paymentScreenshotUrl ? `🖼 <b>Proof Image:</b> ${siteUrl}${payment.paymentScreenshotUrl}\n` : "");

  if (siteUrl) text += `\n🔗 <a href="${siteUrl}/dashboard/sales-team/leads">View & Approve in Dashboard</a>`;

  return sendTelegramMessage(text);
}

/**
 * Alert for lead cancellation audit (Anti-Fraud Founder Shield).
 * @param {object} traveller
 * @param {string} cancellationReason
 * @param {string} notes
 */
export async function notifyLeadCancelledTelegram(traveller, cancellationReason, notes) {
  const brand = process.env.BRAND_NAME || "Flag Journeys";
  const siteUrl = process.env.SITE_URL || "";
  let text =
    `⚠️ <b>LEAD CANCELLED (RE-AUDIT REQUIRED) — ${brand}</b>\n\n` +
    `👤 <b>Customer Name:</b> ${traveller.name || "Guest"}\n` +
    `📞 <b>Phone:</b> ${traveller.phone || "N/A"}\n` +
    `🆔 <b>Lead ID:</b> ${traveller.travellerId}\n` +
    `❌ <b>Reason:</b> ${cancellationReason || "Not specified"}\n` +
    (notes ? `📝 <b>Call Notes:</b> ${notes}\n` : "");

  if (siteUrl) text += `\n🔗 <a href="${siteUrl}/dashboard/sales-team/leads">Audit Lead in Dashboard</a>`;

  return sendTelegramMessage(text);
}
