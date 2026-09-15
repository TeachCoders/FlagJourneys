import type { Metadata } from "next";
import { ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";
import JsonLd from "@/components/shared/JsonLd";
import { breadcrumbSchema, itemListSchema } from "@/lib/jsonLd";
import PackagesExplorer from "@/feature/journey/components/PackagesExplorer";
import { fetchPublicJson } from "@/feature/destinations/api/public-server";
import type { Journey, PaginatedResponse as JourneyPage } from "@/feature/journey/type";
import { QuoteModal } from "@/components/shared/QuoteModal";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Tour Packages in India and Worldwide | Flag Journeys",
  description:
    "Explore hand-crafted tour packages across India and worldwide destinations. Filter by state, city, travel experience, season & duration. Book your dream trip with Flag Journeys.",
  alternates: { canonical: "/tour-packages" },
};

export default async function TourPackagesPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string | string[]; exp?: string | string[] }>;
}) {
  const params = await searchParams;
  const first = (v: string | string[] | undefined) =>
    (Array.isArray(v) ? v[0] : v || "").trim();
  const cities = first(params.city)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const experiences = first(params.exp)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const initialJourneys = await fetchPublicJson<JourneyPage<Journey>>(
    "/journey?limit=100&isActive=true"
  );

  const journeyItems =
    initialJourneys?.data?.map((j) => ({
      name: j.title,
      url: `/tour-packages/${j.slug}`,
    })) || [];

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* ===== SEO JSON-LD SCHEMA ===== */}
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Tour Packages", path: "/tour-packages" },
        ])}
      />
      {journeyItems.length > 0 && <JsonLd data={itemListSchema(journeyItems)} />}

      {/* ===== HERO BANNER ===== */}
      <section className="relative bg-slate-900 border-b border-slate-800 py-16 md:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#2E8B8B]/25 via-slate-950/80 to-slate-950" />
        <div className="relative z-10 max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-10 text-center flex flex-col items-center">
          <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#D4561A]/10 border border-[#D4561A]/30 text-[#D4561A] text-xs font-extrabold uppercase tracking-widest mb-4">
            <Sparkles size={13} /> Tailor-Made Holiday Packages
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-black uppercase text-white tracking-wide drop-shadow-md">
            Tour Packages
          </h1>
          <p className="mt-4 text-slate-300 text-base md:text-lg max-w-2xl leading-relaxed">
            {cities.length > 0 || experiences.length > 0
              ? "Results filtered by your search — refine using the filters below."
              : "Discover curated travel itineraries across India and top global destinations. Custom packages designed for memories."}
          </p>

          <div className="mt-8">
            <QuoteModal>
              <button
                type="button"
                className="btn-primary px-8 py-3.5 text-sm font-bold tracking-wide flex items-center gap-2 cursor-pointer shadow-lg shadow-[#D4561A]/30 active:scale-95 transition-all"
              >
                <Sparkles size={16} />
                <span>Get Customized Trip Quote</span>
              </button>
            </QuoteModal>
          </div>
        </div>
      </section>

      {/* ===== BREADCRUMB (BELOW HERO) ===== */}
      <nav aria-label="Breadcrumb" className="border-b border-slate-200 bg-white shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-10 py-3 flex items-center gap-2 text-[14px] text-slate-500">
          <Link href="/" className="hover:text-[#2E8B8B] transition-colors font-medium">
            Home
          </Link>
          <ChevronRight size={14} className="text-slate-300" />
          <span className="text-[#1C1C1C] font-semibold">Tour Packages</span>
        </div>
      </nav>

      {/* ===== PACKAGES EXPLORER ===== */}
      <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-10 py-12">
        <PackagesExplorer
          initialCities={cities}
          initialExperiences={experiences}
          initialJourneys={initialJourneys}
        />
      </div>
    </div>
  );
}
