"use strict";

import { prisma } from "../utils/prismaConnection.js";
import { STOPWORDS } from "./chatFaq.js";

/**
 * DB-backed trip search for the bot.
 *
 * When a tourist asks something like "4 day rajasthan trip" or "honeymoon
 * package in goa", we search the ACTUAL application catalog and reply with
 * the matching trips — instead of only relying on hand-written FAQs.
 *
 * It is fully dynamic: every source registered in TRIP_SOURCES is searched on
 * each turn, so a trip added through the admin dashboard is automatically
 * findable by the bot — no FAQ/manual work needed.
 */

const TRIP_INTENT = [
  "trip", "trips", "tour", "tours", "package", "packages", "itinerary",
  "plan", "options", "suggestion", "suggest", "ghuma", "ghumne", "ghumana",
  "dikhao", "dikhaao", "dikhaaye", "kaunsi", "kaunse", "kaunshi", "show me",
];

const SEASON_WORDS = ["summer", "winter", "monsoon", "spring", "autumn", "fall"];

// Generic words that frequently appear inside trip titles ("…Tour Package")
// but must never act as a "place" match.
const GENERIC_TOKEN_BLOCK = new Set([
  "package", "packages", "tour", "tours", "trip", "trips", "day", "days",
  "from", "with", "road", "custom", "itinerary", "flagjourney", "holidays",
  "holiday", "booking", "book", "price", "per", "person", "best", "seller",
]);

const REPLY_MAX = 3;

/**
 * Every place trips can live in. Add a new entry here whenever a new trip
 * table is introduced — the bot automatically starts searching it.
 */
const TRIP_SOURCES = [
  {
    key: "journey",
    async fetch() {
      return prisma.journey.findMany({
        where: { isActive: true },
        select: {
          id: true,
          title: true,
          destination: true,
          noDays: true,
          pricePerPerson: true,
          isBestSelling: true,
          displayOrder: true,
          cities: { select: { id: true, title: true } },
          months: { select: { title: true, season: true } },
          travelExperiences: { select: { title: true } },
        },
      });
    },
    normalize(r) {
      return {
        id: r.id,
        source: "journey",
        title: r.title,
        destination: r.destination,
        noDays: r.noDays,
        pricePerPerson: r.pricePerPerson,
        isBestSelling: r.isBestSelling,
        displayOrder: r.displayOrder,
        cityIds: r.cities.map((c) => c.id),
        cityTitles: r.cities.map((c) => c.title),
        months: r.months,
        experiences: r.travelExperiences,
      };
    },
  },
  {
    key: "tourPackage",
    async fetch() {
      return prisma.tourPackage.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          destination: true,
          durationDays: true,
          pricePerPerson: true,
          isBestSelling: true,
          displayOrder: true,
        },
      });
    },
    normalize(r) {
      return {
        id: r.id,
        source: "tourPackage",
        title: r.name,
        destination: r.destination,
        noDays: r.durationDays,
        pricePerPerson: r.pricePerPerson,
        isBestSelling: r.isBestSelling,
        displayOrder: r.displayOrder,
        cityIds: [],
        cityTitles: [],
        months: [],
        experiences: [],
      };
    },
  },
];

/** Extracts a requested trip duration ("4 day", "3 days", "weekend") → days. */
export function extractDuration(text) {
  const lower = (text || "").toLowerCase();
  const m = lower.match(/(\d{1,2})\s*(?:days?|dino?|dinn)\b/);
  if (m) {
    const n = parseInt(m[1], 10);
    if (n >= 1 && n <= 90) return n;
  }
  if (/\bweekend\b/.test(lower)) return 2;
  return null;
}

/** Whether the text reads like a trip/catalog request (not just a place name). */
export function hasTripIntent(text) {
  const lower = (text || "").toLowerCase();
  return TRIP_INTENT.some((t) => {
    if (t.includes(" ")) return lower.includes(t);
    if (t.length > 3) return lower.includes(t);
    return new RegExp(`\\b${t}\\b`).test(lower);
  });
}

/** Longest entity/title (len ≥ 3) that appears inside the lower-cased text. */
function longestMatch(lower, terms) {
  let best = null;
  for (const term of terms) {
    const t = String(term || "").trim().toLowerCase();
    if (t.length < 3) continue;
    if (lower.includes(t) && (!best || t.length > best.length)) best = t;
  }
  return best;
}

/**
 * Finds all destination entities (Country/State/City titles) mentioned in the
 * query. Longest title is the primary `place`; every matched name is resolved
 * to the concrete city ids it covers (city → itself, state → its cities,
 * country → all cities across its states).
 */
async function resolvePlace(lower) {
  const [countries, states, cities] = await Promise.all([
    prisma.country.findMany({ select: { id: true, title: true } }),
    prisma.state.findMany({ select: { id: true, title: true, countryId: true } }),
    prisma.city.findMany({ select: { id: true, title: true, stateId: true } }),
  ]);

  const cityIdsByTitle = {};
  const matched = [];

  for (const c of cities) {
    const t = (c.title || "").trim();
    if (t.length >= 2 && lower.includes(t.toLowerCase())) {
      matched.push(t);
      cityIdsByTitle[t.toLowerCase()] = [c.id];
    }
  }
  for (const s of states) {
    const t = (s.title || "").trim();
    if (t.length >= 2 && lower.includes(t.toLowerCase()) && !cityIdsByTitle[t.toLowerCase()]) {
      matched.push(t);
      cityIdsByTitle[t.toLowerCase()] = cities.filter((x) => x.stateId === s.id).map((x) => x.id);
    }
  }
  for (const c of countries) {
    const t = (c.title || "").trim();
    if (t.length >= 2 && lower.includes(t.toLowerCase()) && !cityIdsByTitle[t.toLowerCase()]) {
      matched.push(t);
      const stateIds = states.filter((s) => s.countryId === c.id).map((s) => s.id);
      cityIdsByTitle[t.toLowerCase()] = cities.filter((x) => stateIds.includes(x.stateId)).map((x) => x.id);
    }
  }

  if (!matched.length) return { place: null, matchedNames: [], cityIdsByTitle };
  matched.sort((a, b) => b.length - a.length);
  return { place: matched[0], matchedNames: matched, cityIdsByTitle };
}

/** Loads the season/experience vocabulary from the DB (merged with static words). */
async function loadTerms() {
  const [months, experiences] = await Promise.all([
    prisma.month.findMany({ select: { title: true, season: true } }),
    prisma.travelExperience.findMany({ select: { title: true } }),
  ]);
  const seasonTerms = new Set(SEASON_WORDS);
  for (const m of months) {
    if (m.title) seasonTerms.add(m.title);
    if (m.season) seasonTerms.add(m.season);
  }
  const experienceTerms = experiences.map((e) => e.title).filter(Boolean);
  return { seasonTerms: [...seasonTerms], experienceTerms };
}

function tripTokens(trip) {
  const src = `${trip.title || ""} ${trip.destination || ""}`.toLowerCase();
  return src
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w) && !GENERIC_TOKEN_BLOCK.has(w));
}

/**
 * Searches the DB for trips matching the tourist's message across every
 * registered trip source (Journey, TourPackage, …).
 *
 * @param {string} text
 * @returns {Promise<{kind: "results", reply: string, matchedPlace: string|null, count: number}
 *   | {kind: "no_results", reply: string, matchedPlace: string|null}
 *   | {kind: "no_place", reply: string, matchedPlace: null} | null>}
 *   `null` when the message isn't a trip request (let FAQ/flow handle it).
 */
export async function searchCatalog(text) {
  const lower = (text || "").trim().toLowerCase();
  if (!lower) return null;

  const { place, matchedNames, cityIdsByTitle } = await resolvePlace(lower);
  const { seasonTerms, experienceTerms } = await loadTerms();
  const seasonTerm = longestMatch(lower, seasonTerms);
  const expTerm = longestMatch(lower, experienceTerms);

  const duration = extractDuration(lower);
  // Experience/season queries need trip phrasing too ("need honeymoon trip",
  // "honeymoon trip") so bare words like "family"/"summer" never hijack the
  // guided flow (e.g. a group-size answer like "my family, 4 members").
  if (!hasTripIntent(lower) && !duration) return null;

  // Pull every trip from every registered source (parallel), then normalize.
  const sourceRows = await Promise.all(TRIP_SOURCES.map((s) => s.fetch()));
  const trips = [];
  for (let i = 0; i < TRIP_SOURCES.length; i++) {
    for (const row of sourceRows[i]) trips.push(TRIP_SOURCES[i].normalize(row));
  }

  const scored = [];
  for (const t of trips) {
    let score = 0;
    let placeHit = false;

    if (place) {
      // Prefer trips that cover more of the mentioned places — a title
      // mention outweighs a city-relation/link which outweighs a passing
      // destination string mention.
      let coverage = 0;
      for (const name of matchedNames) {
        const nl = name.toLowerCase();
        const ids = cityIdsByTitle[nl] || [];
        let c = 0;
        if (ids.length > 0 && t.cityIds.some((id) => ids.includes(id))) c += 12;
        if ((t.title || "").toLowerCase().includes(nl)) c += 15;
        if ((t.destination || "").toLowerCase().includes(nl)) c += 8;
        if (c > 0) coverage += c;
      }
      if (coverage > 0) {
        placeHit = true;
        score += 100 + coverage;
      }
    } else {
      const token = longestMatch(lower, tripTokens(t));
      if (token) {
        placeHit = true;
        score += 90;
      }
    }

    let expHit = false;
    let seasonHit = false;
    if (expTerm) {
      expHit = t.experiences.some((x) =>
        (x.title || "").toLowerCase().includes(expTerm)
      );
      if (expHit) score += 25;
    }
    if (seasonTerm) {
      seasonHit = t.months.some(
        (m) =>
          (m.title || "").toLowerCase().includes(seasonTerm) ||
          (m.season || "").toLowerCase().includes(seasonTerm)
      );
      if (seasonHit) score += 30;
    }
    // No place/token matched, but an experience/season was asked for
    // ("honeymoon trip" without a destination) → the experience/season
    // match itself is enough to answer.
    if (!placeHit && (expHit || seasonHit)) {
      placeHit = true;
      score += 50;
    }
    if (!placeHit) continue;

    if (duration && t.noDays) {
      const diff = Math.abs(t.noDays - duration);
      score += diff === 0 ? 50 : diff === 1 ? 35 : diff === 2 ? 20 : diff === 3 ? 5 : 0;
    }
    if (t.isBestSelling) score += 5;

    scored.push({ trip: t, score });
  }

  if (!scored.length) {
    return {
      kind: place ? "no_results" : "no_place",
      reply: place
        ? `"${place}" ke liye ready-made trip abhi database me nahi mili. Lekin chinta mat karo - hamare expert aapke liye ek fully custom plan bana denge.`
        : `Kaunsa destination dekhna chahenge? Jaise - Rajasthan, Goa, Kerala, Himachal... main wahan ki trips dikha doonga.`,
      matchedPlace: place || null,
    };
  }

  scored.sort((a, b) => b.score - a.score || a.trip.displayOrder - b.trip.displayOrder);
  const top = scored.slice(0, REPLY_MAX);

  const lines = top.map(({ trip: r }, i) => {
    const dest = r.destination || r.cityTitles.join(", ") || "-";
    const days = r.noDays ? `${r.noDays} Days` : "Custom itinerary";
    const best = r.isBestSelling ? " (Best seller)" : "";
    return `${i + 1}. ${r.title}${best}\n   ${dest} - ${days}\n   Price on request — custom quote`;
  });

  const reply =
    `Yeh rahi kuch trips:\n\n${lines.join("\n\n")}\n\n` +
    `Niche diye gaye buttons se apna pasandida trip select karein, ya aage badhiye.`;

  const buttons = top.map(({ trip: r }) => ({
    label: r.title.length > 35 ? r.title.substring(0, 32) + "..." : r.title,
    value: `FETCH_TRIP_DAYS:${r.source}:${r.id}`
  }));

  return { kind: "results", reply, buttons, matchedPlace: place || null, count: scored.length };
}
