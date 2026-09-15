import { SITE_URL } from "./apiClient";
import { stripHtml } from "./utils";

function absoluteImage(src?: string): string | undefined {
  if (!src) return undefined;
  if (/^https?:\/\//.test(src)) return src;
  return `${SITE_URL}${src.startsWith("/") ? src : `/${src}`}`;
}
export const organizationSchema: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@type": "TravelAgency",
  name: "Flag Journeys",
  alternateName: ["Flag Journeys India", "FlagJourney Inbound India"],
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  image: `${SITE_URL}/logo.png`,
  telephone: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
    ? `+${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`
    : "+919136739178",
  email: "support@flagjourneys.com",
  address: {
    "@type": "PostalAddress",
    addressCountry: "IN",
    addressLocality: "India",
  },
  priceRange: "$$", // Foreigners ke liye USD symbol reference better rehta hai
  areaServed: "Worldwide", // Batata hai ki aap pure globe se clients accept karte hain
  knowsAbout: [
    "India Inbound Tourism",
    "Customized India Tour Packages",
    "Private Chauffeur & Cab Rentals India",
    "Luxury Golden Triangle Tours"
  ]
};

export const websiteSchema: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Flag Journeys",
  alternateName: "Flag Journeys - India Inbound Travel Specialist",
  url: SITE_URL,
  description: "Bespoke India tour packages, private luxury stays, verified drivers, and local guides for foreign travelers.",
  inLanguage: ["en", "en-US"],
  publisher: {
    "@type": "TravelAgency",
    name: "Flag Journeys India",
  },
};

export function breadcrumbSchema(
  items: { name: string; path: string }[]
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

interface ArticleInput {
  title: string;
  description?: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  author?: string;
  url: string;
}

export function articleSchema(post: ArticleInput): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description ? stripHtml(post.description).slice(0, 160) : undefined,
    image: absoluteImage(post.image),
    datePublished: post.datePublished || undefined,
    dateModified: post.dateModified || undefined,
    author: post.author
      ? { "@type": "Organization", name: post.author }
      : { "@type": "Organization", name: "Flag Journeys" },
    publisher: {
      "@type": "Organization",
      name: "Flag Journeys",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}${post.url}`,
    },
  };
}

interface TouristTripInput {
  name: string;
  description?: string;
  image?: string;
  url: string;
  price?: number;
  itinerary?: { day: string; description?: string }[];
  touristType?: string[];
}

export function touristTripSchema(trip: TouristTripInput): Record<string, unknown> {
  return {
    "@type": "Product",
    name: trip.name,
    description: trip.description ? stripHtml(trip.description).slice(0, 160) : undefined,
    image: absoluteImage(trip.image),
    url: `${SITE_URL}${trip.url}`,
    brand: {
      "@type": "Organization",
      name: "Flag Journeys",
      url: SITE_URL,
    },
    ...(trip.price && trip.price > 0
      ? {
        offers: {
          "@type": "Offer",
          name: "Customised holiday quote",
          description: "Personalised itinerary and custom quote within 24 hours.",
          price: trip.price,
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
          url: `${SITE_URL}${trip.url}`,
        },
      }
      : {}),
    ...(trip.touristType && trip.touristType.length > 0 ? { touristType: trip.touristType } : {}),
    ...(trip.itinerary && trip.itinerary.length > 0
      ? {
        itinerary: trip.itinerary.map((d, idx) => ({
          "@type": "City",
          "@id": `${SITE_URL}${trip.url}#day-${idx + 1}`,
          name: d.day,
          description: d.description ? stripHtml(d.description).slice(0, 200) : undefined,
        })),
      }
      : {}),
  };
}

export function graphSchema(nodes: Record<string, unknown>[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": nodes,
  };
}

export function faqSchema(
  faqs: { question: string; answer: string }[]
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function itemListSchema(
  items: { name: string; url: string }[]
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: `${SITE_URL}${item.url}`,
    })),
  };
}

interface TouristDestinationInput {
  name: string;
  description?: string;
  image?: string;
  url: string;
}

export function touristDestinationSchema(dest: TouristDestinationInput): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: dest.name,
    description: dest.description ? stripHtml(dest.description).slice(0, 160) : undefined,
    image: absoluteImage(dest.image),
    url: `${SITE_URL}${dest.url}`,
  };
}
