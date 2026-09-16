"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { useState, useMemo } from "react";
import {
  MapPin,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ArrowRight,
  CalendarDays,
  Sun,
  Building2,
  Languages,
  Coins,
  Calendar,
  Clock,
  Globe,
} from "lucide-react";
import { useCountryBySlug } from "@/feature/country/api/useCountry";
import { useGetStates } from "@/feature/state/api/useState";
import { useGetJourneys } from "@/feature/journey/api/useJourney";
import DestinationSlider, { useSliderControl } from "@/components/shared/DestinationSlider";
import HeroSlider from "@/components/shared/HeroSlider";
import { FallbackImage } from "@/components/shared/FallbackImage";
import RichContent from "@/components/shared/RichContent";
import ToursSection from "@/components/shared/ToursSection";
import FilterBar from "@/components/shared/FilterBar";
import {
  travelExperienceOptions,
  durationOptions,
  seasonOptions,
  journeyMatchesExperiences,
  journeyMatchesDuration,
  journeyMatchesSeasons,
  journeyPackageHref,
} from "@/feature/journey/filterOptions";
import type { Country } from "@/feature/country/type";
import type { State, PaginatedResponse as StatePage } from "@/feature/state/type";
import type { Journey, PaginatedResponse as JourneyPage } from "@/feature/journey/type";
import { QuoteModal } from "@/components/shared/QuoteModal";
import StateCard from "./StateCard";
import DestinationsSkeleton from "./DestinationsSkeleton";
import FaqSection from "@/feature/home/components/FaqSection";

export default function CountryDetail({
  slug,
  initialCountry,
  initialStates,
  initialJourneys,
}: {
  slug: string;
  initialCountry?: Country | null;
  initialStates?: StatePage<State> | null;
  initialJourneys?: JourneyPage<Journey> | null;
}) {
  const { country, isLoading } = useCountryBySlug(slug, initialCountry);

  if (isLoading) {
    return (
      <div className="max-w-[1600px] mx-auto px-6 py-12">
        <DestinationsSkeleton />
      </div>
    );
  }
  if (!country) return notFound();

  return (
    <CountryContent
      country={country}
      initialStates={initialStates}
      initialJourneys={initialJourneys}
    />
  );
}

function CountryContent({
  country,
  initialStates,
  initialJourneys,
}: {
  country: Country;
  initialStates?: StatePage<State> | null;
  initialJourneys?: JourneyPage<Journey> | null;
}) {
  const displayTitle = country.title.replace(/\s*Tour$/i, "") || country.title;

  const { states, isLoading: statesLoading } = useGetStates(
    {
      countryId: country.id,
      limit: 100,
    },
    initialStates
  );

  const { journeys, isLoading: journeysLoading } = useGetJourneys(
    { limit: 100, isActive: "true" },
    initialJourneys
  );
  const countryJourneys = journeys.filter(
    (j) => j.cities?.some((c) => c.state?.country?.id === country.id)
  );

  const journeyCountForState = (stateId: number) =>
    countryJourneys.filter((j) => j.cities?.some((c) => c.state?.id === stateId)).length;

  const displayedStates = journeysLoading
    ? states
    : states.filter((s) => journeyCountForState(s.id) > 0);

  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [expSelected, setExpSelected] = useState<string[]>([]);
  const [seasonSelected, setSeasonSelected] = useState<string[]>([]);
  const [durSelected, setDurSelected] = useState<string[]>([]);

  const stateOptionsList = useMemo(() => {
    const map = new Map<string, { value: string; label: string; count: number }>();
    for (const s of displayedStates) {
      const count = journeyCountForState(s.id);
      if (count > 0) {
        map.set(s.title, { value: s.title, label: s.title, count });
      }
    }
    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [displayedStates, countryJourneys]);

  const cityOptionsList = useMemo(() => {
    const map = new Map<string, { value: string; label: string; count: number }>();
    for (const j of countryJourneys) {
      for (const c of j.cities ?? []) {
        const entry = map.get(c.slug);
        if (entry) entry.count += 1;
        else map.set(c.slug, { value: c.slug, label: c.title, count: 1 });
      }
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [countryJourneys]);

  const filteredJourneys = countryJourneys.filter((j) => {
    if (selectedStates.length > 0) {
      const st = j.cities?.[0]?.state?.title;
      if (!st || !selectedStates.includes(st)) return false;
    }
    if (selectedCities.length > 0) {
      const slugs = new Set(selectedCities);
      if (!(j.cities ?? []).some((c) => slugs.has(c.slug))) return false;
    }
    if (!journeyMatchesExperiences(j, expSelected)) return false;
    if (!journeyMatchesSeasons(j, seasonSelected)) return false;
    if (!journeyMatchesDuration(j, durSelected)) return false;
    return true;
  });

  const activeFilterCount =
    selectedStates.length +
    selectedCities.length +
    expSelected.length +
    seasonSelected.length +
    durSelected.length;

  const clearFilters = () => {
    setSelectedStates([]);
    setSelectedCities([]);
    setExpSelected([]);
    setSeasonSelected([]);
    setDurSelected([]);
  };

  const heroImages = country.banner?.images?.length
    ? country.banner.images
    : country.thumbImg
      ? [country.thumbImg]
      : [];

  const heroTitle = country.banner?.bannerTitle || country.h1Title || displayTitle;
  const heroTag = country.banner?.bannerTag || "";

  const facts = [
    { icon: Building2, label: "Capital", value: country.capital },
    { icon: Languages, label: "Language", value: country.language },
    { icon: Coins, label: "Currency", value: country.currency },
    { icon: Calendar, label: "Best Time", value: country.bestTimeToVisit },
    { icon: Globe, label: "Timezone", value: country.timezone },
    { icon: Clock, label: "Dial Code", value: country.dialCode },
  ].filter((f) => f.value);

  const { swiperRef: statesSwiperRef, slidePrev, slideNext, canScroll } = useSliderControl();

  const filterBar = (
    <FilterBar
      sections={[
        {
          id: "state",
          title: "State",
          options: stateOptionsList,
          selected: selectedStates,
          onChange: setSelectedStates,
        },
        {
          id: "city",
          title: "Destination",
          icon: <MapPin size={14} />,
          options: cityOptionsList,
          selected: selectedCities,
          onChange: setSelectedCities,
        },
        {
          id: "experience",
          title: "Travel Experience",
          icon: <Sparkles size={14} />,
          options: travelExperienceOptions(countryJourneys),
          selected: expSelected,
          onChange: setExpSelected,
        },
        {
          id: "season",
          title: "Best Season / Month",
          icon: <Sun size={14} />,
          options: seasonOptions(countryJourneys),
          selected: seasonSelected,
          onChange: setSeasonSelected,
        },
        {
          id: "duration",
          title: "Duration",
          icon: <CalendarDays size={14} />,
          options: durationOptions(countryJourneys),
          selected: durSelected,
          onChange: setDurSelected,
        },
      ]}
      activeCount={activeFilterCount}
      onClearAll={clearFilters}
      resultCount={filteredJourneys.length}
      totalCount={countryJourneys.length}
    />
  );

  return (
    <div>
      {/* ===== HERO ===== */}
      <section className="relative h-[300px] sm:h-[380px] md:h-[520px] overflow-hidden bg-slate-900">
        {heroImages.length > 0 ? (
          <>
            <HeroSlider images={heroImages} alt={displayTitle} />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-slate-950/20" />
          </>
        ) : (
          <div className="absolute inset-0">
            <FallbackImage
              src={country.thumbImg || country.banner?.images?.[0]}
              alt={displayTitle}
              fill
              priority
              className="object-cover object-center"
              theme="dark"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-slate-950/30" />
          </div>
        )}

        <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10 h-full flex flex-col justify-center items-center py-6 sm:py-8 text-center">
          {heroTag && (
            <p className="max-w-2xl mx-auto mb-2 text-sm sm:text-lg font-bold tracking-wider uppercase text-white/90 leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
              {heroTag}
            </p>
          )}

          <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase text-white leading-tight tracking-wider drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
            {heroTitle}
          </h1>

          <div className="hidden lg:flex mt-4 sm:mt-7 flex-wrap items-center justify-center gap-3">
            <QuoteModal>
              <button
                type="button"
                className="btn-primary px-4 py-2.5 sm:px-7 sm:py-3.5 text-xs sm:text-sm font-bold tracking-wide flex items-center gap-2 cursor-pointer shadow-lg shadow-[#D4561A]/30 active:scale-95 transition-all"
              >
                <Sparkles size={16} />
                <span>Plan My {displayTitle} Trip</span>
              </button>
            </QuoteModal>

            <a href="#tours" className="px-3 py-2.5 sm:px-6 sm:py-3.5 text-xs sm:text-sm font-bold tracking-wide rounded-xl border border-white/40 text-white bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all duration-200 flex items-center gap-2">
              <span>Explore Packages</span>
              <ArrowRight size={16} />
            </a>

            <a href="#more" className="px-3 py-2.5 sm:px-6 sm:py-3.5 text-xs sm:text-sm font-medium tracking-wide rounded-xl border border-white/20 text-white/80 bg-black/20 backdrop-blur-md hover:bg-white/10 transition-all duration-200">
              About {displayTitle}
            </a>
          </div>
        </div>
      </section>

      {/* ===== BREADCRUMB (BELOW HERO) ===== */}
      <nav aria-label="Breadcrumb" className="border-b border-slate-200 bg-slate-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-10 py-3 flex flex-wrap items-center gap-1.5 text-[14px] text-slate-500">
          <Link href="/" className="hover:text-[#2E8B8B] transition-colors shrink-0 font-medium">
            Home
          </Link>
          <ChevronRight size={14} className="text-slate-300 shrink-0" />
          <Link href="/tour-packages" className="hover:text-[#2E8B8B] transition-colors shrink-0 font-medium">
            Tour Packages
          </Link>
          <ChevronRight size={14} className="text-slate-300 shrink-0" />
          <span className="text-[#1C1C1C] font-semibold">{displayTitle}</span>
        </div>
      </nav>

      {/* ===== SHORT DESCRIPTION + TOURS ===== */}
      <ToursSection
        journeys={filteredJourneys}
        isLoading={journeysLoading}
        h1Title={country.h1Title}
        overView={country.overView ?? undefined}
        emptyLabel={`No tours found in ${displayTitle} yet`}
        filterBar={countryJourneys.length > 0 ? filterBar : undefined}
        onClearFilters={clearFilters}
      />

      {/* ===== STATES ===== */}
      <section id="states" className="w-full bg-white py-12 md:py-20 border-t border-slate-200/60">
        <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-10">
        <div className="flex items-end justify-between mb-6 md:mb-10 flex-wrap gap-4">
          <div>
            <span className="accent-label">Discover</span>
            <h2 className="h3 text-[#1C1C1C] mt-2">
              States in {displayTitle}
              <span className="ml-3 align-middle text-sm font-semibold text-[#D4561A] bg-[#D4561A]/10 px-3 py-1 rounded-full">
                {statesLoading || journeysLoading ? "..." : displayedStates.length} States
              </span>
            </h2>
          </div>
          {!statesLoading && !journeysLoading && displayedStates.length > 4 && canScroll && (
            <div className="flex items-center gap-2">
              <button
                onClick={slidePrev}
                aria-label="Previous states"
                className="w-10 h-10 rounded-full bg-white border border-slate-200 text-[#1C1C1C] flex items-center justify-center shadow-sm hover:bg-[#1C1C1C] hover:text-white transition-colors cursor-pointer"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={slideNext}
                aria-label="Next states"
                className="w-10 h-10 rounded-full bg-white border border-slate-200 text-[#1C1C1C] flex items-center justify-center shadow-sm hover:bg-[#1C1C1C] hover:text-white transition-colors cursor-pointer"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        {statesLoading || journeysLoading ? (
          <DestinationsSkeleton count={6} />
        ) : displayedStates.length === 0 ? (
          <div className="text-center py-14">
            <MapPin size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">No states with tours found in {displayTitle}</p>
          </div>
        ) : displayedStates.length <= 4 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {displayedStates.map((s) => (
              <StateCard
                key={s.id}
                state={s}
                countrySlug={country.slug}
                journeyCount={journeyCountForState(s.id)}
              />
            ))}
          </div>
        ) : (
          <DestinationSlider
            swiperRef={statesSwiperRef}
            options={{
              breakpoints: {
                0: { slidesPerView: 1.2, spaceBetween: 12 },
                480: { slidesPerView: 2 },
                768: { slidesPerView: 3 },
                1024: { slidesPerView: 4 },
                1280: { slidesPerView: 5 },
              },
            }}
          >
            {displayedStates.map((s) => (
              <StateCard
                key={s.id}
                state={s}
                countrySlug={country.slug}
                journeyCount={journeyCountForState(s.id)}
              />
            ))}
          </DestinationSlider>
        )}
        </div>
      </section>

      {/* ===== KNOW MORE (ALL INFO) ===== */}
      <section id="more" className="bg-[#f8f8f8] border-y border-slate-200/60 py-12 md:py-20">
        <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              <span className="accent-label">Know More</span>
              <h2 className="h3 text-[#1C1C1C] mt-2 mb-5 md:mb-8">Everything About {displayTitle}</h2>

              {country.seoDescription && (
                <RichContent html={country.seoDescription} />
              )}

              {country.moreDescription && (
                <RichContent html={country.moreDescription} className="mt-8" />
              )}
            </div>

            <aside className="space-y-6 lg:sticky lg:top-28 z-10 self-start">
              {facts.length > 0 && (
                <div className="rounded-2xl border border-slate-100 bg-white p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#2E8B8B] mb-5">
                    Quick Facts
                  </h4>
                  <dl className="flex flex-col divide-y divide-slate-100">
                    {facts.map((f) => (
                      <div key={f.label} className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                        <dt className="text-[15px] text-slate-700 font-semibold flex items-center gap-2">
                          <f.icon size={15} className="shrink-0 text-[#2E8B8B]/70" /> {f.label}
                        </dt>
                        <dd className="text-[15px] font-bold text-[#1C1C1C] text-right capitalize">{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {countryJourneys.filter((j) => (j.displayOrder ?? 0) > 0).length > 0 && (
                <div className="rounded-2xl border border-slate-100 bg-white p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#2E8B8B] mb-5 flex items-center justify-between">
                    Top 10 Tour Packages
                    <span className="text-[10px] font-black text-[#D4561A] bg-[#D4561A]/10 px-2.5 py-0.5 rounded-full">
                      {Math.min(
                        10,
                        countryJourneys.filter((j) => (j.displayOrder ?? 0) > 0).length
                      )}
                    </span>
                  </h4>
                  <ol className="mt-2 space-y-1">
                    {[...countryJourneys]
                      .filter((j) => (j.displayOrder ?? 0) > 0)
                      .sort(
                        (a, b) =>
                          (a.displayOrder ?? Number.MAX_SAFE_INTEGER) -
                          (b.displayOrder ?? Number.MAX_SAFE_INTEGER)
                      )
                      .slice(0, 10)
                      .map((j, i) => (
                        <li key={j.id}>
                          <Link
                            href={journeyPackageHref(j)}
                            className="flex items-start gap-3 p-2.5 -mx-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                          >
                            <span className="mt-[2px] w-[26px] h-[26px] shrink-0 rounded-full bg-slate-100 text-[#1C1C1C] text-[11px] font-black flex items-center justify-center group-hover:bg-[#2E8B8B] group-hover:text-white transition-colors shadow-sm">
                              {i + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <span className="text-[14.5px] font-bold text-[#333] leading-snug group-hover:text-[#2E8B8B] transition-colors block truncate">
                                {j.title.split("|")[0].trim()}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5 text-[11.5px] font-semibold text-slate-500">
                                <span>{j.duration || (j.noDays > 0 ? `${j.noDays} Days` : "")}</span>
                                {((j.discountPrice ?? 0) > 0 || (j.pricePerPerson ?? 0) > 0) ? (
                                  <>
                                    <span>•</span>
                                    <span className="text-[#D4561A] font-extrabold">
                                      ₹{((j.discountPrice || j.pricePerPerson) as number).toLocaleString("en-IN")}
                                    </span>
                                  </>
                                ) : null}
                              </div>
                            </div>
                          </Link>
                        </li>
                      ))}
                  </ol>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>

      {/* ===== FAQ SECTION ===== */}
      <FaqSection faqs={country.faqs} />
    </div>
  );
}
