"use strict";
import { prisma } from "../utils/prismaConnection.js";
import { answerFaq, answerFaqForFaq, matchFaq, isPriceQuestion, PRICE_ANSWER, STOPWORDS } from "./chatFaq.js";
import { searchCatalog, hasTripIntent } from "./catalogSearch.js";
import { logger } from "../utils/logger.js";

/** Normalize any reply value (string OR {text,buttons} object) to a safe {text,buttons} object. */
function toReply(r) {
  if (!r && r !== 0) return null;
  if (typeof r === "string") return { text: r, buttons: undefined };
  if (r && typeof r === "object") {
    const text = (r.text != null ? String(r.text) : "") || "";
    const buttons = Array.isArray(r.buttons) && r.buttons.length > 0 ? r.buttons : undefined;
    return { text, buttons };
  }
  return null;
}

const BRAND = () => process.env.BRAND_NAME || "Flag Journeys";

const HUMAN_INTENT_KEYWORDS = [
  "agent", "human", "real person", "expert", "call me", "call us", "call on",
  "phone me", "talk to", "speak to", "talk with", "speak with", "contact me",
  "reach me", "book now", "i want to book", "wanna book", "want to book",
  "book a", "book this", "book the", "how do i book", "can i book",
  "agent", "expert", "insaan", "band", "baat", "call", "phone", "booking", "book", "book krna", "book karna"
];

const GREETING_KEYWORDS = ["hi", "hello", "hey", "hii", "hiii", "namaste", "namaskar", "good morning", "good evening", "good afternoon", "haan", "hy", "namskar"];
const THANKS_KEYWORDS = ["thank", "thanks", "thnks", "shukriya", "dhanyavad", "thx", "thanks you"];
const BYE_KEYWORDS = ["bye", "goodbye", "tata", "alvida", "bye bye", "tc", "take care"];

const WHATSAPP_NUMBER = (process.env.CHAT_PARTNER_NUMBER || "918447273005").replace(/[\s+\-()]/g, "");
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=Hi!%20I%20need%20help%20with%20my%20trip%20planning.`;

const WHATSAPP_HANDOFF = `Chat directly with our travel expert on WhatsApp:\n${WHATSAPP_LINK}`;

const FALLBACK_REPLY = {
  text: `Got it! Our travel expert has been notified and will assist you shortly. 📲\n\nIn the meantime, what would you like to explore?`,
  buttons: [
    { label: "🏰 Top Destinations", value: "ENGAGEMENT_destinations" },
    { label: "📦 Popular Tour Packages", value: "ENGAGEMENT_packages" },
    { label: "💬 Connect on WhatsApp", value: "ENGAGEMENT_whatsapp" },
  ]
};

// Gentle re-asks used when the tourist's reply doesn't fit the current step.
function getMonthButtons() {
  const months = [];
  const now = new Date();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const curYear = now.getFullYear();

  // Next 3 upcoming months
  for (let i = 1; i <= 3; i++) {
    const targetMonth = (now.getMonth() + i) % 12;
    const targetYear = curYear + Math.floor((now.getMonth() + i) / 12);
    const monthStr = `${monthNames[targetMonth]} ${targetYear}`;
    months.push({
      label: `📅 ${monthStr}`,
      value: `DATE_MONTH_${monthStr}`,
    });
  }

  // Next Year (e.g. 2027)
  months.push({
    label: `📅 Next Year (${curYear + 1})`,
    value: `DATE_MONTH_${curYear + 1}`,
  });
  // Advance Multi-Year Planning (e.g. 2028 - 2029)
  months.push({
    label: `✈️ Advance Planning (${curYear + 2} - ${curYear + 3})`,
    value: `DATE_MONTH_${curYear + 2}-${curYear + 3}`,
  });
  // Flexible
  months.push({
    label: "🗓️ Flexible / Just Browsing",
    value: "DATE_MONTH_Flexible",
  });

  return months;
}

function getDatePartButtons(monthStr) {
  const shortMonth = monthStr.split(" ")[0];
  return [
    { label: `📅 1st - 10th ${shortMonth}`, value: `DATE_PART_1st - 10th ${monthStr}` },
    { label: `📅 11th - 20th ${shortMonth}`, value: `DATE_PART_11th - 20th ${monthStr}` },
    { label: `📅 21st - End of ${shortMonth}`, value: `DATE_PART_21st - End of ${monthStr}` },
    { label: `🗓️ Entire Month (Flexible)`, value: `DATE_PART_Entire ${monthStr}` },
  ];
}

const GROUP_SIZE_BUTTONS = [
  { label: "👤 Solo (1 Person)", value: "GROUP_1 Adult" },
  { label: "👫 Couple (2 Adults)", value: "GROUP_2 Adults" },
  { label: "👨‍👩‍👧 Family (3-4 People)", value: "GROUP_3-4 People" },
  { label: "👨‍👩‍👧‍👦 Group (5+ People)", value: "GROUP_5+ People" },
];

const FLOW_REASKS = {
  AWAITING_TRAVEL_DATE: {
    text: "To get started on your dream trip, when are you planning to travel? Please select your travel month below:",
    buttons: getMonthButtons(),
  },
  AWAITING_GROUP_SIZE: {
    text: "Awesome! How many travelers will be joining this trip?",
    buttons: GROUP_SIZE_BUTTONS,
  },
  AWAITING_BUDGET: {
    text: "What style of stay or hotel category do you prefer for your holiday?",
    buttons: [
      { label: "🏨 3-Star Comfort", value: "BUDGET_3-Star Comfort" },
      { label: "🏨 4-Star Premium", value: "BUDGET_4-Star Premium" },
      { label: "👑 5-Star Luxury", value: "BUDGET_5-Star Luxury" },
      { label: "🤔 Flexible / Open to suggestions", value: "BUDGET_Flexible" },
    ]
  },
  AWAITING_EXPLORE_MODE: {
    text: "How would you like to explore your trip options?",
    buttons: [
      { label: "📍 Browse by Destination (State)", value: "CHOOSE_MODE_DESTINATION" },
      { label: "🎯 Browse by Experience / Interest", value: "CHOOSE_MODE_EXPERIENCE" },
    ]
  },
  AWAITING_DESTINATION:
    "Which destination are you excited to visit? Select an option or type a place name:",
  AWAITING_TRIP_TYPE:
    "What type of holiday experience do you prefer? Select from below:",
  AWAITING_JOURNEY:
    "Here are our top recommended packages for you! Pick one to view full itinerary:",
};

// Words/abbreviations that hint at a travel date answer.
const DATE_HINTS = [
  "january", "february", "march", "april", "june", "july", "august",
  "september", "october", "november", "december",
  "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec",
  "next month", "this month", "next week", "this week", "soon", "asap", "early", "mid", "end of",
  "winter", "summer", "spring", "autumn", "monsoon", "holidays", "diwali", "christmas", "new year",
];

/**
 * Whether at least one sales/team user has marked themselves available for chat.
 * Used internally — tourists never see online/offline status directly.
 */
export async function isAnyoneOnline() {
  try {
    const count = await prisma.users.count({ where: { isActive: true, chatAvailable: true } });
    return count > 0;
  } catch (err) {
    logger.error("isAnyoneOnline error:", { message: err.message });
    return false;
  }
}

/** Welcome sequence shown right after a chat lead is created. */
export function buildWelcomeMessages(name) {
  return [
    `Namaste ${name}! 🙏 Welcome to ${BRAND()}.`,
    `I'm Maya, your personal travel specialist. Let's design your perfect holiday together! ✨`,
  ];
}

/** Fetch popular state destinations to show as buttons. */
async function getDestinationOptions() {
  try {
    // Get top active states ordered by displayOrder
    const states = await prisma.state.findMany({
      where: { isActive: true },
      select: { id: true, title: true, slug: true },
      orderBy: { displayOrder: "asc" },
      take: 8,
    });

    if (states.length === 0) return null;

    const highlightsMap = {
      "Rajasthan": "🏰 Rajasthan (Forts & Palaces)",
      "Uttar Pradesh": "🕌 Uttar Pradesh (Taj Mahal)",
      "Ladakh": "🏔️ Ladakh (Himalayas & Lakes)",
      "Uttarakhand": "🧘 Uttarakhand (Yoga & River)",
      "Himachal Pradesh": "🏔️ Himachal (Snow & Valleys)",
      "Delhi NCR": "🏛️ Delhi NCR (Heritage)",
      "Madhya Pradesh": "🐅 Madhya Pradesh (Wildlife)",
      "Jammu and Kashmir": "❄️ Kashmir (Snow & Valleys)",
      "Kerala": "🌿 Kerala (Backwaters & Spa)",
    };

    const buttons = states.map((state) => {
      const tag = highlightsMap[state.title] || state.title;
      return {
        label: tag.length > 30 ? tag.substring(0, 27) + "..." : tag,
        value: `DEST_${state.id}_${state.title}`,
      };
    });

    const text = "Where would you like to travel? Please select a destination:";
    return { text, buttons };
  } catch (err) {
    logger.error("getDestinationOptions error:", { message: err.message });
    return null;
  }
}

/** Fetch available travel experiences to show as options. */
/** Fetch available travel experiences to show as options. */
async function getTravelExperienceOptions(destinationId = null) {
  try {
    let where = { isActive: true };

    // If destination (stateId) provided, filter experiences for that state
    if (destinationId) {
      where = {
        isActive: true,
        journeys: {
          some: {
            isActive: true,
            cities: {
              some: {
                stateId: destinationId
              }
            }
          }
        }
      };
    }

    let experiences = await prisma.travelExperience.findMany({
      where,
      select: { id: true, title: true, idealFor: true },
      orderBy: { displayOrder: "asc" },
      take: 8,
    });

    // Fallback to all active experiences if state-specific search yielded 0
    if (experiences.length === 0) {
      experiences = await prisma.travelExperience.findMany({
        where: { isActive: true },
        select: { id: true, title: true, idealFor: true },
        orderBy: { displayOrder: "asc" },
        take: 8,
      });
    }

    if (experiences.length === 0) return null;

    const buttons = experiences.map((exp) => ({
      label: exp.title.length > 30 ? exp.title.substring(0, 27) + "..." : exp.title,
      value: `EXP_${exp.id}_${exp.title}`,
    }));

    const text = "What type of trip are you interested in? Please select:";
    return { text, buttons };
  } catch (err) {
    logger.error("getTravelExperienceOptions error:", { message: err.message });
    return null;
  }
}

/** Fetch journeys for a given travel experience to show as buttons. */
async function getJourneyOptionsForExperience(experienceId, destinationId = null) {
  try {
    let where = {
      isActive: true,
      travelExperiences: {
        some: {
          id: experienceId,
          isActive: true,
        }
      }
    };

    if (destinationId) {
      where.cities = {
        some: {
          stateId: destinationId
        }
      };
    }

    let journeys = await prisma.journey.findMany({
      where,
      select: { 
        id: true, 
        title: true, 
        noDays: true,
        pricePerPerson: true,
        destination: true,
      },
      orderBy: [{ noDays: "desc" }, { displayOrder: "asc" }],
      take: 8,
    });

    if (journeys.length === 0 && destinationId) {
      // Fallback without state restriction if no exact match
      delete where.cities;
      journeys = await prisma.journey.findMany({
        where,
        select: { 
          id: true, 
          title: true, 
          noDays: true,
          pricePerPerson: true,
          destination: true,
        },
        orderBy: [{ noDays: "desc" }, { displayOrder: "asc" }],
        take: 8,
      });
    }

    if (journeys.length === 0) return null;

    const buttons = journeys.map((journey) => {
      const displayTitle = journey.title
        .replace(/\s*\|\s*FlagJourney\s*Holidays/gi, "")
        .replace(/\s*\|\s*Golden\s*Triangle/gi, "")
        .trim();
      return {
        label: displayTitle,
        value: `JOURNEY_${journey.id}_${displayTitle}`,
      };
    });

    const text = "Here are our best tour packages for you. Which one interests you?";
    return { text, buttons, journeys };
  } catch (err) {
    logger.error("getJourneyOptionsForExperience error:", { message: err.message });
    return null;
  }
}

/** Fetch tour packages (journeys) for a given destination state to show as buttons. */
async function getJourneyOptionsForDestination(stateId, stateName) {
  try {
    const orConditions = [
      { destination: { contains: stateName, mode: "insensitive" } },
      { title: { contains: stateName, mode: "insensitive" } }
    ];
    if (stateId) {
      orConditions.push({ cities: { some: { stateId: stateId } } });
    }

    let journeys = await prisma.journey.findMany({
      where: {
        isActive: true,
        OR: orConditions
      },
      select: { 
        id: true, 
        title: true, 
        noDays: true,
        pricePerPerson: true,
        destination: true,
      },
      orderBy: [{ noDays: "desc" }, { displayOrder: "asc" }],
      take: 8,
    });

    if (journeys.length === 0) {
      journeys = await prisma.journey.findMany({
        where: { isActive: true },
        select: { 
          id: true, 
          title: true, 
          noDays: true,
          pricePerPerson: true,
          destination: true,
        },
        orderBy: [{ noDays: "desc" }, { displayOrder: "asc" }],
        take: 8,
      });
    }

    if (journeys.length === 0) return null;

    const buttons = journeys.map((j) => {
      const displayTitle = j.title
        .replace(/\s*\|\s*FlagJourney\s*Holidays/gi, "")
        .replace(/\s*\|\s*Golden\s*Triangle/gi, "")
        .trim();
      return {
        label: displayTitle,
        value: `JOURNEY_${j.id}_${displayTitle}`,
      };
    });

    const text = `Here are our best tour packages for ${stateName} (sorted by duration):`;
    return { text, buttons, journeys };
  } catch (err) {
    logger.error("getJourneyOptionsForDestination error:", { message: err.message });
    return null;
  }
}

/**
 * Runs one turn of the bot conversation.
 *
 * @param {object} conversation - ChatConversation record (needs botState + needsData)
 * @param {string} userText - the tourist's latest message
 * @returns {Promise<{replies: string[], nextState: string, needsData: object, leadUpdate: object, unanswered: boolean}>}
 *   `unanswered` is true when the bot could not answer and the message should be
 *   recorded for superadmin review (bot training).
 */
export async function runBot(conversation, userText) {
  const needs = conversation.needsData && typeof conversation.needsData === "object"
    ? { ...conversation.needsData }
    : {};
  const state = conversation.botState || "AWAITING_DESTINATION";
  const trimmed = (userText || "").trim();
  const replies = [];
  let nextState = state;
  const leadUpdate = {};
  let unanswered = false;
  let unansweredSource = null;

  if (trimmed.startsWith("FETCH_TRIP_DAYS:")) {
    const parts = trimmed.split(":");
    const source = parts[1];
    const tripId = Number(parts[2]);
    
    const strip = (s) => (s ? String(s).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim() : "");
    
    const formatDayDetails = (day, index) => {
      const dayNum = index + 1;
      const title = strip(day.day || day.title || day.dayName || `Day ${dayNum}`);
      return `• Day ${dayNum}: ${title}`;
    };

    let daysText = "📋 ITINERARY HIGHLIGHTS\n\n";
    let totalDays = 0;

    if (source === "journey") {
      const journey = await prisma.journey.findUnique({
        where: { id: tripId },
        include: { 
          days: { orderBy: { id: "asc" } },
          cities: { select: { title: true } },
          travelExperiences: { select: { title: true } }
        }
      });
      
      if (journey && journey.days.length > 0) {
        totalDays = journey.days.length;
        daysText += `✨ ${strip(journey.title)}\n`;
        const dest = strip(journey.destination || journey.cities.map(c => c.title).join(", "));
        if (dest) daysText += `📍 Route: ${dest}\n`;
        daysText += `⏱️ Duration: ${journey.noDays} Days / ${journey.noDays - 1} Nights\n\n`;
        
        daysText += journey.days.map((d, i) => formatDayDetails(d, i)).join("\n");
      } else {
        daysText = "Sorry, no detailed itinerary is available for this trip right now.";
      }

      if (journey) {
        needs.itineraryShown = true;
        needs.journey = strip(journey.title) || needs.journey;
        needs.journeyId = journey.id;
        leadUpdate.selectedJourney = needs.journey;
        leadUpdate.selectedJourneyId = journey.id;
      }
    } else if (source === "tourPackage") {
      const pkg = await prisma.tourPackage.findUnique({ 
        where: { id: tripId },
        include: { inclusions: true, exclusions: true }
      });
      
      if (pkg && Array.isArray(pkg.itinerary) && pkg.itinerary.length > 0) {
        totalDays = pkg.itinerary.length;
        daysText += `${strip(pkg.name)}\n`;
        daysText += `Destination: ${strip(pkg.destination)}\n`;
        daysText += `Duration: ${pkg.durationDays} Days\n`;
        daysText += `\n`;
        daysText += "---\n\n";
        
        daysText += pkg.itinerary.map((d, i) => formatDayDetails(d, i)).join("\n" + "---\n\n");
        
        // Package-level inclusions
        if (pkg.inclusions && pkg.inclusions.length > 0) {
          daysText += "\n" + "---\n";
          daysText += "\nWHAT'S INCLUDED:\n";
          daysText += pkg.inclusions.map(inc => `  - ${strip(inc.description)}`).join("\n");
        }
        
        // Package-level exclusions
        if (pkg.exclusions && pkg.exclusions.length > 0) {
          daysText += "\n\nWHAT'S NOT INCLUDED:\n";
          daysText += pkg.exclusions.map(exc => `  - ${strip(exc.description)}`).join("\n");
        }
      } else {
        daysText = "Sorry, no detailed itinerary is available for this package right now.";
      }

      if (pkg) {
        needs.itineraryShown = true;
        needs.journey = strip(pkg.name) || needs.journey;
        needs.journeyId = pkg.id;
        leadUpdate.selectedJourney = needs.journey;
        leadUpdate.selectedJourneyId = pkg.id;
      }
    }
    
    replies.push(daysText);
    return { replies, nextState, needsData: needs, leadUpdate, unanswered };
  }

  switch (state) {
    case "AWAITING_TRAVEL_DATE": {
      const kind = flowInputKind(trimmed);

      if (trimmed === "") {
        replies.push(toReply(FLOW_REASKS["AWAITING_TRAVEL_DATE"]));
        break;
      }

      let selectedMonth = trimmed;
      if (trimmed.startsWith("DATE_MONTH_")) {
        selectedMonth = trimmed.replace("DATE_MONTH_", "");
      }

      if (selectedMonth === "Flexible") {
        needs.travelDate = "Flexible";
        replies.push("No problem! Flexible travel dates give you the best options. 🗓️");
      } else {
        needs.travelDate = selectedMonth;
        const parsed = parseDate(selectedMonth);
        if (parsed) leadUpdate.travelDate = parsed;
        replies.push(`Got it — ${selectedMonth}! 🗓️`);
      }

      replies.push(toReply(FLOW_REASKS["AWAITING_GROUP_SIZE"]));
      nextState = "AWAITING_GROUP_SIZE";
      break;
    }
    case "AWAITING_GROUP_SIZE": {
      const kind = flowInputKind(trimmed);
      let groupText = trimmed;
      if (trimmed.startsWith("GROUP_")) {
        groupText = trimmed.replace("GROUP_", "");
      }
      const n = extractGroupSize(groupText);
      if (!n) {
        const interrupt = await flowInterrupt(kind, state, trimmed);
        replies.push(...interrupt.replies);
        if (interrupt.unanswered) {
          unanswered = true;
          unansweredSource = interrupt.unansweredSource || "flow_rejected";
        }
        break;
      }

      needs.groupSizeText = groupText;
      needs.groupSize = n;
      leadUpdate.groupSize = n;

      replies.push(`Perfect! ${groupText} 👥`);
      replies.push(toReply(FLOW_REASKS["AWAITING_BUDGET"]));
      nextState = "AWAITING_BUDGET";
      break;
    }
    case "AWAITING_BUDGET": {
      const kind = flowInputKind(trimmed);
      let choice = null;
      if (trimmed.startsWith("BUDGET_")) {
        choice = trimmed.substring(7);
      } else {
        const map = {
          "1": "Budget", "2": "Mid-Range", "3": "Luxury", "4": "Not sure yet",
          "budget": "Budget", "mid-range": "Mid-Range", "luxury": "Luxury",
          "skip": "Skip", "skip for now": "Skip", "pata nahi abhi": "Not sure yet",
        };
        choice = map[trimmed.toLowerCase()];
        if (!choice && /[0-9]/.test(trimmed)) {
          choice = budgetFromNumber(trimmed);
        }
      }
      if (!choice) {
        const interrupt = await flowInterrupt(kind, state, trimmed);
        replies.push(...interrupt.replies);
        if (interrupt.unanswered) {
          unanswered = true;
          unansweredSource = interrupt.unansweredSource || "flow_rejected";
        }
        break;
      }
      const isSkip = String(choice).toUpperCase() === "SKIP";
      if (isSkip || choice === "Not sure yet") {
        needs.budgetRange = "Not specified";
        replies.push("No problem!");
      } else {
        needs.budgetRange = choice;
        leadUpdate.budgetRange = choice;
        replies.push(`Got it — ${choice} accommodation! 🏨`);
      }

      // Prompt user to choose explore mode: Destination vs Experience
      replies.push(toReply(FLOW_REASKS["AWAITING_EXPLORE_MODE"]));
      nextState = "AWAITING_EXPLORE_MODE";
      break;
    }
    case "AWAITING_EXPLORE_MODE": {
      const kind = flowInputKind(trimmed);

      if (trimmed === "CHOOSE_MODE_DESTINATION" || trimmed.toLowerCase().includes("destination") || trimmed.toLowerCase().includes("state")) {
        const destOptions = await getDestinationOptions();
        if (destOptions && destOptions.buttons.length > 0) {
          replies.push(toReply({ text: destOptions.text, buttons: destOptions.buttons }));
        } else {
          replies.push(toReply("Where would you like to travel? Type your destination or pick from the options below."));
        }
        nextState = "AWAITING_DESTINATION";
        break;
      }

      if (trimmed === "CHOOSE_MODE_EXPERIENCE" || trimmed.toLowerCase().includes("experience") || trimmed.toLowerCase().includes("interest")) {
        const expOptions = await getTravelExperienceOptions();
        if (expOptions && expOptions.buttons.length > 0) {
          replies.push(toReply({ text: "What type of travel experience are you interested in? Please select from our top offerings:", buttons: expOptions.buttons }));
          nextState = "AWAITING_TRIP_TYPE";
        } else {
          replies.push("What type of trip are you interested in?");
          nextState = "AWAITING_TRIP_TYPE";
        }
        break;
      }

      // If user selected a destination button directly (e.g. DEST_...)
      if (trimmed.startsWith("DEST_")) {
        const dmatch = trimmed.match(/^DEST_(\d+)_(.*)$/);
        const destId = dmatch ? Number(dmatch[1]) : null;
        const destName = dmatch ? dmatch[2] : "";
        if (destId) {
          needs.destination = destName;
          needs.destinationId = destId;
          leadUpdate.destination = destName;
          replies.push(`Great choice! ${destName} is a wonderful destination. 🌟`);
          
          const journeyOptions = await getJourneyOptionsForDestination(destId, destName);
          if (journeyOptions && journeyOptions.buttons.length > 0) {
            replies.push(toReply({ text: journeyOptions.text, buttons: journeyOptions.buttons }));
            nextState = "AWAITING_JOURNEY";
          } else {
            replies.push("Thank you! Our travel expert will custom design the perfect itinerary for you.");
            nextState = "READY";
          }
          break;
        }
      }

      // If user selected an experience button directly (e.g. EXP_...)
      if (trimmed.startsWith("EXP_")) {
        const parts = trimmed.split("_");
        const expId = Number(parts[1]);
        const expTitle = parts.slice(2).join("_");
        needs.tripType = expTitle;
        needs.experienceId = expId;
        leadUpdate.tripType = expTitle;
        replies.push(`${expTitle} — great pick! 🎯 Here are our best tour packages for you (sorted by duration):`);
        const journeyOptions = await getJourneyOptionsForExperience(expId, null);
        if (journeyOptions && journeyOptions.buttons.length > 0) {
          replies.push(toReply({ text: journeyOptions.text, buttons: journeyOptions.buttons }));
          nextState = "AWAITING_JOURNEY";
        } else {
          replies.push("Thank you! Our travel expert will custom design the perfect itinerary for you.");
          nextState = "READY";
        }
        break;
      }

      const interrupt = await flowInterrupt(kind, state, trimmed);
      replies.push(...interrupt.replies);
      if (interrupt.unanswered) {
        unanswered = true;
        unansweredSource = interrupt.unansweredSource || "flow_rejected";
      }
      break;
    }
    case "AWAITING_DESTINATION": {
      const kind = flowInputKind(trimmed);
      
      // Check if user selected a destination via button
      if (trimmed.startsWith("DEST_")) {
        const dmatch = trimmed.match(/^DEST_(\d+)_(.*)$/);
        const destId = dmatch ? Number(dmatch[1]) : null;
        const destName = dmatch ? dmatch[2] : "";
        if (!dmatch || !destId) break;
        needs.destination = destName;
        needs.destinationId = destId;
        leadUpdate.destination = destName;
        replies.push(`Great choice! ${destName} is a wonderful destination. 🌟`);
        
        const journeyOptions = await getJourneyOptionsForDestination(destId, destName);
        if (journeyOptions && journeyOptions.buttons.length > 0) {
          replies.push(toReply({ text: journeyOptions.text, buttons: journeyOptions.buttons }));
          nextState = "AWAITING_JOURNEY";
        } else {
          replies.push("Thank you! Our travel expert will custom design the perfect itinerary for you.");
          nextState = "READY";
        }
        break;
      }

      const validText = kind === "valid" && looksLikeDestination(trimmed);
      if (!validText) {
        const interrupt = await flowInterrupt(kind, state, trimmed);
        replies.push(...interrupt.replies);
        if (interrupt.unanswered) {
          unanswered = true;
          unansweredSource = interrupt.unansweredSource || "flow_rejected";
        }
        break;
      }
      needs.destination = trimmed;
      leadUpdate.destination = trimmed;
      replies.push(`Great choice! ${trimmed} is a wonderful destination. 🌟`);
      
      const journeyOptions = await getJourneyOptionsForDestination(null, trimmed);
      if (journeyOptions && journeyOptions.buttons.length > 0) {
        replies.push(toReply({ text: journeyOptions.text, buttons: journeyOptions.buttons }));
        nextState = "AWAITING_JOURNEY";
      } else {
        replies.push("Thank you! Our travel expert will custom design the perfect itinerary for you.");
        nextState = "READY";
      }
      break;
    }
    case "AWAITING_TRIP_TYPE": {
      const kind = flowInputKind(trimmed);
      
      // Check if user selected an experience via button
      if (trimmed.startsWith("EXP_")) {
        const parts = trimmed.split("_");
        const expId = Number(parts[1]);
        const expTitle = parts.slice(2).join("_");
        needs.tripType = expTitle;
        needs.experienceId = expId;
        leadUpdate.tripType = expTitle;
        replies.push(`${expTitle} — great pick! 🎯 Here are our best tour packages for you (sorted by duration):`);
        
        // Show journeys (sorted by duration descending)
        const journeyOptions = await getJourneyOptionsForExperience(expId, needs.destinationId);
        if (journeyOptions && journeyOptions.buttons.length > 0) {
          replies.push(toReply({ text: journeyOptions.text, buttons: journeyOptions.buttons }));
          nextState = "AWAITING_JOURNEY";
        } else {
          replies.push("Thank you! Our travel expert will custom design the perfect itinerary for you.");
          nextState = "READY";
        }
        break;
      }

      if (kind !== "valid" || trimmed.length < 2) {
        const interrupt = await flowInterrupt(kind, state, trimmed);
        replies.push(...interrupt.replies);
        if (interrupt.unanswered) {
          unanswered = true;
          unansweredSource = interrupt.unansweredSource || "flow_rejected";
        }
        break;
      }
      
      needs.tripType = trimmed;
      leadUpdate.tripType = trimmed;
      replies.push(`${trimmed} sounds great! 👌`);
      
      const journeyOptions = await getJourneyOptionsForExperience(null, needs.destinationId);
      if (journeyOptions && journeyOptions.buttons.length > 0) {
        replies.push(toReply({ text: journeyOptions.text, buttons: journeyOptions.buttons }));
        nextState = "AWAITING_JOURNEY";
      } else {
        replies.push("Thank you! Our travel expert will custom design the perfect itinerary for you.");
        nextState = "READY";
      }
      break;
    }
    case "AWAITING_JOURNEY": {
      const kind = flowInputKind(trimmed);
      
      if (trimmed.startsWith("JOURNEY_")) {
        const parts = trimmed.split("_");
        const journeyId = Number(parts[1]);
        const journeyTitle = parts.slice(2).join("_");
        if (!journeyId) break;
        needs.journey = journeyTitle;
        needs.journeyId = journeyId;
        leadUpdate.selectedJourney = journeyTitle;
        leadUpdate.selectedJourneyId = journeyId;
        needs.journeySource = "journey";
        
        // Fetch journey details
        const journey = await prisma.journey.findUnique({
          where: { id: journeyId },
          include: { 
            days: { orderBy: { id: "asc" } },
            cities: { select: { title: true } }
          }
        });
        
        if (journey) {
          replies.push(`Awesome choice! 🌟 Package: ${journeyTitle}`);
          const destName = journey.destination || (journey.cities && journey.cities.map(c => c.title).join(" - "));
          if (destName) {
            replies.push(`📍 Route: ${destName}`);
          }
          replies.push(`⏱️ Duration: ${journey.noDays} Days / ${journey.noDays - 1} Nights\n`);

          // Format day program directly
          if (journey.days && journey.days.length > 0) {
            const strip = (s) => (s ? String(s).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim() : "");
            let daysText = "📋 ITINERARY HIGHLIGHTS:\n\n";
            daysText += journey.days.map((d, i) => {
              const dayNum = i + 1;
              const title = strip(d.day || d.title || d.dayName || `Day ${dayNum}`);
              return `• Day ${dayNum}: ${title}`;
            }).join("\n");
            replies.push(daysText);
          }
        }
        
        // Final Thank you & Agent confirmation message
        replies.push(toReply({
          text: "Thank you! Your booking inquiry has been successfully recorded. Our travel expert will contact you shortly. 📝\n\nIf you have any other questions or need more details, please feel free to ask me here! 😊",
          buttons: [
            { label: "❓ Ask a question", value: "ENGAGEMENT_ask" },
            { label: "📞 Contact us on WhatsApp", value: "ENGAGEMENT_whatsapp" },
          ]
        }));

        leadUpdate.status = "SUBMITTED";
        nextState = "READY";
        break;
      }
      
      if (kind !== "valid" || trimmed.length < 2) {
        const interrupt = await flowInterrupt(kind, state, trimmed);
        replies.push(...interrupt.replies);
        if (interrupt.unanswered) {
          unanswered = true;
          unansweredSource = interrupt.unansweredSource || "flow_rejected";
        }
        break;
      }
      
      replies.push("Thank you! Your travel details have been successfully recorded. Our travel specialist will connect with you shortly with a customized quote.");
      leadUpdate.status = "SUBMITTED";
      nextState = "READY";
      break;
    }
    case "READY":
    case "ASKING_HUMAN":
    default: {
      const handled = await handleFreeText(trimmed);
      replies.push(...handled.replies);
      nextState = handled.nextState;
      if (handled.unanswered) {
        unanswered = true;
        unansweredSource = handled.unansweredSource || "no_faq";
      }
      break;
    }
  }

  return { replies, nextState, needsData: needs, leadUpdate, unanswered, unansweredSource };
}

/**
 * Classifies a free-text reply while the bot is waiting for a specific detail
 * (destination, date, group size, budget). Anything that isn't a real answer
 * gets a gentle re-ask instead of being blindly accepted.
 */
function flowInputKind(text) {
  const lower = (text || "").trim().toLowerCase();
  if (!lower) return "empty";
  if (hasAnyKeyword(lower, GREETING_KEYWORDS)) return "greeting";
  if (hasAnyKeyword(lower, THANKS_KEYWORDS)) return "thanks";
  if (hasAnyKeyword(lower, BYE_KEYWORDS)) return "bye";
  if (hasAnyKeyword(lower, HUMAN_INTENT_KEYWORDS)) return "human";
  if (isPriceQuestion(lower)) return "price";
  return "valid";
}

/**
 * Loose destination check: needs real letters, a sane length, and must not be
 * a lone stopword ("by", "the", "and", "hai"...) that clearly isn't a place.
 */
function looksLikeDestination(text) {
  const t = (text || "").trim();
  if (t.length < 3) return false;
  if (!/[a-zA-Z]/.test(t)) return false;
  const words = t.toLowerCase().split(/\s+/);
  if (words.length === 1 && STOPWORDS.has(words[0])) return false;
  return true;
}

/** Whole-word/phrase keyword match — avoids "child" matching "hi". */
function hasAnyKeyword(text, keywords) {
  return keywords.some((kw) => {
    const k = String(kw).toLowerCase().trim();
    if (!k) return false;
    const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i").test(text);
  });
}

/**
 * Replies to a non-answer during the guided flow. Junk/empty input is flagged
 * `unanswered` so the superadmin can review it (bot training). Question-like
 * junk first tries the FAQ — a match gets answered and re-asks the flow step.
 */
async function flowInterrupt(kind, state, text) {
  const reask = toReply(FLOW_REASKS[state] || "");
  switch (kind) {
    case "greeting":
      return { replies: [toReply("Hello! 👋"), reask].filter(Boolean), unanswered: false, unansweredSource: null };
    case "thanks":
      return { replies: [toReply("You're welcome!"), reask].filter(Boolean), unanswered: false, unansweredSource: null };
    case "bye":
      return { replies: [toReply("Goodbye! Have a great day! 😊"), reask].filter(Boolean), unanswered: false, unansweredSource: null };
    case "human": {
      return { replies: [toReply(WHATSAPP_HANDOFF), reask].filter(Boolean), unanswered: false, unansweredSource: null };
    }
    case "price":
      return { replies: [toReply(PRICE_ANSWER), reask].filter(Boolean), unanswered: false, unansweredSource: null };
    default: {
      // All FAQs (linked + plain) win over catalog/FAQ fallbacks.
      const matchedFaq = await matchFaq(text);
      if (matchedFaq) {
        const faqAnswer = await answerFaqForFaq(matchedFaq);
        const r = toReply(faqAnswer);
        if (r) return { replies: [r, reask].filter(Boolean), unanswered: false, unansweredSource: null };
      }
      // A trip request can be answered from the DB.
      const catalog = await searchCatalog(text);
      if (catalog && catalog.kind !== "no_place") {
        return { replies: [toReply({ text: catalog.reply, buttons: catalog.buttons }), reask].filter(Boolean), unanswered: false, unansweredSource: null };
      }
      if (looksLikeQuestion(text)) {
        const faqAnswer = await answerFaq((text || "").trim().toLowerCase());
        const r = toReply(faqAnswer);
        if (r) return { replies: [r, reask].filter(Boolean), unanswered: false, unansweredSource: null };
        return { replies: [reask].filter(Boolean), unanswered: true, unansweredSource: "no_faq" };
      }
      return { replies: [reask].filter(Boolean), unanswered: true, unansweredSource: "flow_rejected" };
    }
  }
}

/** Rough question detector: ends with "?" or starts with a question word. */
export function looksLikeQuestion(text) {
  const t = (text || "").trim();
  if (!t) return false;
  if (t.endsWith("?")) return true;
  return /^(do|does|did|can|could|will|would|shall|should|is|are|was|were|have|has|had|how|what|when|where|why|which|who)\b/i.test(t);
}

/** Free-text handling once the needs capture is complete (or anytime in READY). */
async function handleFreeText(text) {
  const lower = (text || "").toLowerCase();
  if (!lower) return { replies: [toReply(FALLBACK_REPLY)], nextState: "READY" };

  // Handle engagement quick-action buttons
  if (text.startsWith("ENGAGEMENT_")) {
    const action = text.replace("ENGAGEMENT_", "");
    if (action === "destinations") {
      const destOptions = await getDestinationOptions();
      if (destOptions) {
        return { replies: [toReply({ text: "Here are some amazing destinations to explore! Which one interests you?", buttons: destOptions.buttons })], nextState: "READY" };
      }
    }
    if (action === "packages") {
      const journeys = await prisma.journey.findMany({
        where: { isActive: true },
        select: { id: true, title: true, noDays: true },
        orderBy: [{ noDays: "desc" }, { displayOrder: "asc" }],
        take: 8,
      });
      if (journeys.length > 0) {
        const buttons = journeys.map((j) => {
          const displayTitle = j.title.replace(/\s*\|\s*FlagJourney\s*Holidays/gi, "").replace(/\s*\|\s*Golden\s*Triangle/gi, "").trim();
          return { label: displayTitle, value: `JOURNEY_${j.id}_${displayTitle}` };
        });
        return { replies: [toReply({ text: "Here are our most popular tour packages:", buttons })], nextState: "READY" };
      }
    }
    if (action === "whatsapp") {
      return { replies: [toReply(WHATSAPP_HANDOFF)], nextState: "READY" };
    }
    if (action === "ask") {
      return { replies: [toReply("Of course! Feel free to ask me anything — about destinations, hotels, best time to visit, activities, or anything else about your trip. 😊")], nextState: "READY" };
    }
  }

  if (isPriceQuestion(lower)) return { replies: [toReply(PRICE_ANSWER)], nextState: "READY" };

  if (hasAnyKeyword(lower, HUMAN_INTENT_KEYWORDS)) {
    return { replies: [toReply(WHATSAPP_HANDOFF)], nextState: "READY" };
  }
  if (hasAnyKeyword(lower, GREETING_KEYWORDS))
    return { replies: [toReply("Hello! How can I help you with your trip planning? 😊")], nextState: "READY" };
  if (hasAnyKeyword(lower, THANKS_KEYWORDS))
    return { replies: [toReply("You're welcome! Is there anything else I can help you with?")], nextState: "READY" };
  if (hasAnyKeyword(lower, BYE_KEYWORDS))
    return { replies: [toReply("Goodbye! Our expert will contact you soon. Have a great day! 😊")], nextState: "READY" };

  // All FAQs (linked + plain) win over catalog.
  const matchedFaq = await matchFaq(lower);
  if (matchedFaq) {
    const faqAnswer = await answerFaqForFaq(matchedFaq);
    const r = toReply(faqAnswer);
    if (r) return { replies: [r], nextState: "READY" };
  }

  // Trip requests → live DB catalog.
  const catalog = await searchCatalog(lower);
  if (catalog) {
    return { replies: [toReply({ text: catalog.reply, buttons: catalog.buttons })], nextState: "READY" };
  }

  return { replies: [toReply(FALLBACK_REPLY)], nextState: "READY", unanswered: true, unansweredSource: "no_faq" };
}

/** Loose date parse for "travel date" answers — returns a Date or null. */
function parseDate(text) {
  if (!text) return null;
  const match = String(text).match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (match) {
    const d = new Date(`${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`);
    if (!isNaN(d.getTime())) return d;
  }
  const d = new Date(String(text));
  if (!isNaN(d.getTime())) return d;
  return null;
}

// Word-number hints so "two adults" / "couple" / "char log" group sizes are accepted.
const WORD_NUMBERS = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, twenty: 20, couple: 2, both: 2, solo: 1, single: 1,
  teen: 3, char: 4, paanch: 5, chhe: 6, saat: 7, aath: 8, nau: 9, das: 10,
};

/** Extracts a group size number from free text, or null. */
function extractGroupSize(text) {
  const lower = String(text || "").toLowerCase();
  const m = lower.match(/(\d{1,2})\s*(?:adults?|people|persons?|pax|travelers?|travellers?|members?|log|logn?|adult)\b/);
  if (m) return parseInt(m[1], 10);
  const n = parseInt(lower, 10);
  if (!isNaN(n)) return n;
  // Hinglish "do log"/"do people" — only when paired with a person-word to avoid
  // false-positive on English "do you have...?".
  if (/\bdo\s+(?:log|logn|lok|people|adults?|members?|persons?)\b/.test(lower)) return 2;
  for (const [word, num] of Object.entries(WORD_NUMBERS)) {
    if (new RegExp(`\\b${word}\\b`).test(lower)) return num;
  }
  return null;
}

/** Maps a rupee/number budget answer ("₹50,000", "1 lakh", "50k") to a range label. */
function budgetFromNumber(text) {
  const cleaned = String(text || "").toLowerCase().replace(/[₹$,\s]/g, "");
  let amount = null;
  const lakh = cleaned.match(/(\d+(?:\.\d+)?)lakh/);
  if (lakh) amount = parseFloat(lakh[1]) * 100000;
  else {
    const k = cleaned.match(/(\d+(?:\.\d+)?)k/);
    if (k) amount = parseFloat(k[1]) * 1000;
    else {
      const digits = cleaned.replace(/[^\d]/g, "");
      if (digits && digits.length >= 3 && digits.length <= 8) amount = parseInt(digits, 10);
    }
  }
  if (amount == null) return null;
  if (amount < 25000) return "Budget";
  if (amount <= 60000) return "Mid-Range";
  return "Luxury";
}

/**
 * Once the quick requirements (date → group → budget) are captured, reveals the
 * full day-by-day program if a trip was selected but its itinerary was not shown yet.
 */
async function afterRequirementsReplies(needs) {
  if (!needs || !needs.journeyId || needs.itineraryShown) return [];
  const source = needs.journeySource || "journey";
  const res = await runBot({ botState: "READY", needsData: needs }, `FETCH_TRIP_DAYS:${source}:${needs.journeyId}`);
  return (res.replies || []).map((r) => toReply(r)).filter(Boolean);
}

export { WHATSAPP_HANDOFF, FALLBACK_REPLY };
