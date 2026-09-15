import type { Metadata } from "next";
import Link from "next/link";
import {
  Sparkles,
  Heart,
  Landmark,
  UtensilsCrossed,
  Flower2,
  Route,
  Mountain,
  Waves,
  Compass,
  ArrowRight,
  Crown,
  ChevronRight,
} from "lucide-react";
import { stripHtml } from "@/lib/utils";
import { SERVER_API_BASE, fetchBySlug } from "@/feature/destinations/api/public-server";
import { QuoteModal } from "@/components/shared/QuoteModal";
import FaqSection from "@/feature/home/components/FaqSection";
import type { CmsPage } from "@/feature/cms/type";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://flagjourneys.com";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Travel Experiences",
    description:
      "Hand-picked travel experiences across India — honeymoons, heritage, culinary, yoga, nature & more. Book your perfect trip with Flag Journeys.",
    alternates: { canonical: "/travel-experiences" },
  };
}

async function fetchExperiences() {
  const url = `${SERVER_API_BASE}/holidays?isActive=true`;
  const res = await fetch(url, { method: "GET", cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch experiences");
  const json = await res.json();
  return json?.data || [];
}

async function fetchAllJourneys() {
  const url = `${SERVER_API_BASE}/journey?limit=200&isActive=true`;
  const res = await fetch(url, { method: "GET", cache: "no-store" });
  if (!res.ok) return [];
  const json = await res.json();
  return json?.data || [];
}

import { FallbackImage } from "@/components/shared/FallbackImage";

const FALLBACK_IMAGE = "";

const THEMES: {
  match: string[];
  icon: React.ReactNode;
  image: string;
}[] = [
  {
    match: ["honeymoon", "couple", "romance"],
    icon: <Heart size={20} />,
    image: "",
  },
  {
    match: ["heritage", "culture", "historical", "monument"],
    icon: <Landmark size={20} />,
    image: "",
  },
  {
    match: ["culinary", "food", "dishes"],
    icon: <UtensilsCrossed size={20} />,
    image: "",
  },
  {
    match: ["ayurveda", "yoga", "wellness"],
    icon: <Flower2 size={20} />,
    image: "",
  },
  {
    match: ["taj", "golden triangle"],
    icon: <Landmark size={20} />,
    image: "",
  },
  {
    match: ["spiritual", "temple", "pilgrim"],
    icon: <Sparkles size={20} />,
    image: "",
  },
  {
    match: ["nature", "wildlife"],
    icon: <Mountain size={20} />,
    image: "",
  },
  {
    match: ["beach", "lake"],
    icon: <Waves size={20} />,
    image: "",
  },
];

function resolveTheme(title: string) {
  const t = title.toLowerCase();
  const found = THEMES.find((th) => th.match.some((m) => t.includes(m)));
  return found || { icon: <Compass size={20} />, image: FALLBACK_IMAGE };
}

export default async function TravelExperiencesPage() {
  const [experiences, journeys] = await Promise.all([
    fetchExperiences(),
    fetchAllJourneys(),
  ]);

  const real = experiences.filter(
    (e: any) => !/^test\b/i.test(e.title || "")
  );

  const tourCount = (id: number) =>
    journeys.filter((j: any) =>
      (j.travelExperiences || []).some((e: any) => e.id === id)
    ).length;

  const defaultFaqs = [
    {
      question: "What are Travel Experiences at Flag Journeys?",
      answer: "Travel Experiences are theme-based tour packages categorized by your trip style — such as Honeymoon, Heritage & Culture, Wellness & Yoga, Wildlife Safaris, and Pilgrimage Tours across India."
    },
    {
      question: "Can I combine two different experiences in a single trip?",
      answer: "Yes! All our tour itineraries are 100% customizable. You can easily combine experiences like Honeymoon + Wildlife or Heritage + Wellness. Our experts will craft a custom schedule for you."
    },
    {
      question: "How do I get a custom itinerary for a specific experience?",
      answer: "Simply click 'Plan My Custom Trip' on any experience page or contact our travel experts via WhatsApp or Instant Quote form to receive a detailed day-by-day plan."
    }
  ];

  const cmsPage = await fetchBySlug<CmsPage>("/cms/by-slug", "travel-experiences");
  const cmsFaqs = (cmsPage?.faqs || [])
    .filter((f) => f?.ques && f?.ans)
    .map((f) => ({ question: f.ques, answer: f.ans }));
  const faqList = cmsFaqs.length > 0 ? cmsFaqs : defaultFaqs;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": `${SITE_URL}/`
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Travel Experiences",
            "item": `${SITE_URL}/travel-experiences`
          }
        ]
      },
      {
        "@type": "ItemList",
        "name": "Hand-picked Travel Experiences in India",
        "numberOfItems": real.length,
        "itemListElement": real.map((e: any, idx: number) => ({
          "@type": "ListItem",
          "position": idx + 1,
          "name": e.title,
          "url": `${SITE_URL}/travel-experiences/${e.slug}`
        }))
      },
      {
        "@type": "FAQPage",
        "mainEntity": faqList.map((f) => ({
          "@type": "Question",
          "name": f.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": f.answer
          }
        }))
      }
    ]
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      {/* ===== SEO JSON-LD SCHEMA ===== */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ===== BREADCRUMB (TOP) ===== */}
      <nav aria-label="Breadcrumb" className="border-b border-slate-200 bg-white shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-10 py-3 flex items-center gap-1.5 text-[14px] text-slate-500">
          <Link href="/" className="hover:text-[#2E8B8B] transition-colors shrink-0 font-medium">
            Home
          </Link>
          <ChevronRight size={14} className="text-slate-300 shrink-0" />
          <span className="text-[#1C1C1C] font-semibold">Travel Experiences</span>
        </div>
      </nav>

      <main className="flex-1 px-6 py-12 md:py-16 max-w-[1600px] mx-auto w-full">
        {/* ===== HERO / HEADER ===== */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="accent-label inline-flex items-center gap-1.5">
            <Sparkles size={12} /> Curated Travel Themes
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1C1C1C] tracking-tight mt-3 leading-tight">
            Hand-Crafted Travel Experiences
          </h1>
          <p className="mt-4 text-slate-600 text-base md:text-lg leading-relaxed">
            From romantic honeymoons to soulful heritage trails and rejuvenating wellness retreats — choose your dream theme and let us design your custom itinerary.
          </p>

          <div className="mt-8 flex items-center justify-center gap-4">
            <QuoteModal>
              <button
                type="button"
                className="btn-primary px-7 py-3.5 text-sm font-bold tracking-wide flex items-center gap-2 cursor-pointer shadow-lg shadow-[#D4561A]/30 active:scale-95 transition-all"
              >
                <Sparkles size={16} />
                <span>Plan My Custom Trip</span>
              </button>
            </QuoteModal>
          </div>
        </div>

        {/* ===== GRID LISTING ===== */}
        {real.length === 0 ? (
          <p className="text-center text-slate-500 py-20">No travel experiences found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {real.map((e: any) => {
              const theme = resolveTheme(e.title);
              const image =
                e.thumbImg || e.banner?.images?.[0] || theme.image;
              const count = tourCount(e.id);
              return (
                <Link
                  key={e.id}
                  href={`/travel-experiences/${e.slug}`}
                  className="group relative block overflow-hidden rounded-3xl bg-white border border-slate-100 shadow-[0_2px_16px_rgba(0,0,0,0.05)] hover:shadow-[0_24px_60px_rgba(46,139,139,0.18)] hover:-translate-y-1.5 transition-all duration-500"
                >
                  <div className="relative h-64 md:h-72 w-full overflow-hidden">
                    <FallbackImage
                      src={image}
                      alt={e.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/5" />
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 text-white">
                        {theme.icon}
                      </span>
                    </div>
                    {count > 0 && (
                      <span className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#D4561A] text-white text-[11px] font-bold shadow-lg">
                        <Crown size={12} /> {count} Tours
                      </span>
                    )}
                    <div className="absolute bottom-5 left-5 right-5">
                      <h3 className="font-heading text-2xl font-extrabold text-white tracking-tight drop-shadow-lg leading-snug">
                        {e.title}
                      </h3>
                    </div>
                  </div>

                  <div className="p-6">
                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                      {stripHtml(e.overView || e.seoDescription)}
                    </p>
                    <div className="mt-5 pt-5 border-t border-slate-100 flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#1C1C1C] group-hover:text-[#2E8B8B] transition-colors">
                        Explore Tours
                        <ArrowRight
                          size={16}
                          className="text-[#D4561A] transition-transform duration-300 group-hover:translate-x-1"
                        />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* ===== FAQ SECTION ===== */}
        <div className="mt-20">
          <FaqSection faqs={faqList} />
        </div>
      </main>
    </div>
  );
}
