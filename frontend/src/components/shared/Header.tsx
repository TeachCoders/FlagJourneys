"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown } from "lucide-react";
import WhatsAppIcon from "@/components/shared/WhatsAppIcon";
import { useGetStates } from "@/feature/state/api/useState";
import { useGetJourneys } from "@/feature/journey/api/useJourney";
import { useGetTravelExperiences } from "@/feature/travelExperience/api/useTravelExperience";
import type { State } from "@/feature/state/type";
import type { Journey } from "@/feature/journey/type";
import type { TravelExperience } from "@/feature/travelExperience/type";
import { stripTourSuffix, pickPriorityLinks, type NavChild } from "@/lib/utils";
import { QuoteModal } from "./QuoteModal";
import { RequestCallbackModal } from "./RequestCallbackModal";
import { DestinationMegaMenu, DestinationTreeCountry, DestinationTreeState } from "./DestinationMegaMenu";

const DEFAULT_DESTINATION_LINKS: NavChild[] = [
  { href: "/tour-packages/india", label: "India" },
  { href: "/tour-packages/india/rajasthan", label: "Rajasthan" },
  { href: "/tour-packages/india/uttar-pradesh", label: "Uttar Pradesh" },
  { href: "/tour-packages/india/uttarakhand", label: "Uttarakhand" },
  { href: "/tour-packages/india/himachal-pradesh", label: "Himachal Pradesh" },
  { href: "/tour-packages/india/jammu-and-kashmir", label: "Jammu and Kashmir" },
  { href: "/tour-packages/india/punjab", label: "Punjab" },
  { href: "/tour-packages/india/ladakh", label: "Ladakh" },
  { href: "/tour-packages/india/delhi", label: "Delhi NCR" },
];

const DEFAULT_TOUR_LINKS: NavChild[] = [
  { href: "/tour-packages/india/rajasthan", label: "Rajasthan" },
  { href: "/tour-packages/india/jammu-and-kashmir", label: "Kashmir" },
  { href: "/tour-packages/india/kerala", label: "Kerala" },
  { href: "/tour-packages/india/himachal-pradesh", label: "Himachal Pradesh" },
  { href: "/tour-packages/india/uttarakhand", label: "Uttarakhand" },
  { href: "/tour-packages/india/goa", label: "Goa" },
  { href: "/tour-packages/india/uttar-pradesh", label: "Uttar Pradesh" },
  { href: "/tour-packages/india/ladakh", label: "Ladakh" },
];

const DEFAULT_EXPERIENCE_LINKS: NavChild[] = [
  { href: "/travel-experiences/honeymoon", label: "Honeymoon" },
  { href: "/travel-experiences/adventure", label: "Adventure" },
  { href: "/travel-experiences/heritage-and-culture", label: "Heritage & Culture" },
  { href: "/travel-experiences/wildlife", label: "Wildlife" },
  { href: "/travel-experiences/hill-station", label: "Hill Stations" },
  { href: "/travel-experiences/ayurveda-yoga", label: "Ayurveda & Wellness" },
  { href: "/travel-experiences/desert-safari", label: "Desert Safari" },
  { href: "/travel-experiences/golden-triangle", label: "Golden Triangle" },
];

function buildDefaultDestinationTree(): DestinationTreeCountry[] {
  const states: DestinationTreeState[] = DEFAULT_DESTINATION_LINKS.filter(
    (l) => l.href !== "/tour-packages/india"
  ).map((l, i) => ({
    id: i + 1,
    title: l.label,
    slug: l.href.split("/").pop() || "",
    href: l.href,
    displayOrder: i,
    cities: [],
  }));
  return [
    {
      id: 1,
      title: "India",
      slug: "india",
      href: "/tour-packages/india",
      states,
    },
  ];
}

export const Header: React.FC = () => {
  const pathname = usePathname();
  const isOfferPage = pathname?.startsWith("/offers/");

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [openDesktopDropdown, setOpenDesktopDropdown] = useState<string | null>(null);
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);
  const [expandedCountries, setExpandedCountries] = useState<Record<number, boolean>>({});
  const [expandedStates, setExpandedStates] = useState<Record<number, boolean>>({});
  const megaMenuCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearMegaMenuCloseTimer = useCallback(() => {
    if (megaMenuCloseTimer.current) {
      clearTimeout(megaMenuCloseTimer.current);
      megaMenuCloseTimer.current = null;
    }
  }, []);

  const scheduleMegaMenuClose = useCallback(() => {
    megaMenuCloseTimer.current = setTimeout(() => {
      setOpenDesktopDropdown(null);
      megaMenuCloseTimer.current = null;
    }, 120);
  }, []);

  const handleMobileOpen = useCallback(() => {
    setOpenMenuKey(null);
    setExpandedCountries({});
    setExpandedStates({});
    setIsMobileMenuOpen(true);
  }, []);

  const handleMobileClose = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const toggleMenu = useCallback((key: string) => {
    setOpenMenuKey((prev) => (prev === key ? null : key));
  }, []);

  const toggleCountryExpanded = useCallback((id: number) => {
    setExpandedCountries((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const toggleStateExpanded = useCallback((id: number) => {
    setExpandedStates((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobileMenuOpen]);

  const { states } = useGetStates({ limit: 100, isActive: "true" });
  const { journeys } = useGetJourneys({ limit: 100, isActive: "true" });
  const { travelExperiences } = useGetTravelExperiences({
    limit: 100,
    isActive: "true",
  });

  const destinationTree = useMemo(() => {
    if (!states || states.length === 0) return [];

    // Only show cities that actually have tour packages/journeys in the menu.
    const journeyCityIds = new Set<number>();
    (journeys || []).forEach((j) => {
      (j.cities || []).forEach((c) => {
        if (typeof c.id === "number") journeyCityIds.add(c.id);
      });
    });

    const countryMap = new Map<number, DestinationTreeCountry>();

    states.forEach(state => {
      if (!state.country) return;

      if (!countryMap.has(state.country.id)) {
        countryMap.set(state.country.id, {
          id: state.country.id,
          title: state.country.title,
          slug: state.country.slug,
          href: `/tour-packages/${state.country.slug}`,
          states: []
        });
      }

      const countryEntry = countryMap.get(state.country.id)!;

      const sortedCities = [...(state.cities || [])]
        .filter((city) => typeof city.id === "number" && journeyCityIds.has(city.id))
        .sort((a, b) => {
          const aOrder = a.displayOrder && a.displayOrder > 0 ? a.displayOrder : 999;
          const bOrder = b.displayOrder && b.displayOrder > 0 ? b.displayOrder : 999;
          return aOrder - bOrder;
        })
        .map(city => ({
          id: city.id as number,
          title: stripTourSuffix(city.title || ""),
          slug: city.slug || "",
          href: `/tour-packages/${state.country!.slug}/${state.slug}/${city.slug}`
        }));

      if (sortedCities.length > 0) {
        countryEntry.states.push({
          id: state.id,
          title: stripTourSuffix(state.h1Title || state.title || ""),
          slug: state.slug,
          href: `/tour-packages/${state.country.slug}/${state.slug}`,
          displayOrder: state.displayOrder && state.displayOrder > 0 ? state.displayOrder : 999,
          cities: sortedCities
        });
      }
    });

    const result = Array.from(countryMap.values())
      .filter((country) => country.states.length > 0)
      .map((country) => {
        country.states.sort((a, b) => a.displayOrder - b.displayOrder);
        return country;
      });

    result.sort((a, b) => {
      if (a.slug.toLowerCase() === 'india') return -1;
      if (b.slug.toLowerCase() === 'india') return 1;
      return a.title.localeCompare(b.title);
    });

    return result;
  }, [states, journeys]);

  const tourLinks = useMemo(() => {
    const links = pickPriorityLinks<Journey>(
      journeys,
      (j) => j.displayOrder ?? 0,
      (j) => {
        return {
          href: `/tour-packages/${j.slug}`,
          label: stripTourSuffix(j.h1Title || j.title),
        };
      }
    );
    return links.length > 0 ? links : DEFAULT_TOUR_LINKS;
  }, [journeys]);

  const experienceLinks = useMemo(
    () => {
      const links = pickPriorityLinks<TravelExperience>(
        travelExperiences,
        (e) => e.displayOrder ?? 0,
        (e) => ({ href: `/travel-experiences/${e.slug}`, label: stripTourSuffix(e.h1Title || e.title) })
      );
      return links.length > 0 ? links : DEFAULT_EXPERIENCE_LINKS;
    },
    [travelExperiences]
  );

  const safeDestinationTree = useMemo<DestinationTreeCountry[]>(
    () => (destinationTree.length > 0 ? destinationTree : buildDefaultDestinationTree()),
    [destinationTree]
  );

  type NavLink = {
    href: string;
    label: string;
    isDestinationMega?: boolean;
    tree?: DestinationTreeCountry[];
    children?: NavChild[];
    dropdownStyle?: string;
    dropdownColumns?: number;
    seeAllHref?: string;
    dropdownTitle?: string;
    dropdownSubtext?: string;
  };

  const navLinks: NavLink[] = useMemo(
    () => [
      { href: "/", label: "Home" },
      {
        href: "/tour-packages/india",
        label: "Destinations",
        isDestinationMega: true,
        tree: safeDestinationTree,
      },
      {
        href: "/tour-packages",
        label: "Tour Packages",
        children: tourLinks,
        dropdownStyle: "mega",
        dropdownColumns: 2,
        seeAllHref: "/tour-packages",
        dropdownTitle: "Top Tour Packages",
        dropdownSubtext: "Explore all tour packages",
      },
      {
        href: "/travel-experiences",
        label: "Experiences",
        children: experienceLinks,
        dropdownStyle: "mega",
        seeAllHref: "/travel-experiences",
        dropdownTitle: "Top Experiences",
        dropdownSubtext: "Explore all experiences",
      },
      {
        href: "/about-company",
        label: "About Company",
        children: [
          { href: "/about-us", label: "About Us" },
          { href: "/guest-gallery", label: "Guest Gallery" },
          { href: "/contact-us", label: "Contact Us" },
        ],
        dropdownStyle: "mega",
        dropdownColumns: 1,
        dropdownTitle: "About Company",
      },
    ],
    [safeDestinationTree, tourLinks, experienceLinks]
  );

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const renderMobileAccordion = navLinks.map((link) => {
    const isDrill = link.isDestinationMega && link.tree && link.tree.length > 0;
    const hasChildren = link.children && link.children.length > 0;
    const isOpen = openMenuKey === link.href;

    return (
      <div key={link.href} className="border-b border-[#f2f2f2] last:border-0">
        {!isDrill && !hasChildren ? (
          <Link
            href={link.href}
            onClick={handleMobileClose}
            className="flex w-full items-center justify-between px-2 py-3.5 text-[15px] font-semibold text-[#1C1C1C] transition-colors hover:bg-[#f6f7f8]"
          >
            {link.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => toggleMenu(link.href)}
            aria-expanded={isOpen}
            className="flex w-full items-center justify-between px-2 py-3.5 text-[15px] font-semibold text-[#1C1C1C] transition-colors hover:bg-[#f6f7f8]"
          >
            <span>{link.label}</span>
            <ChevronDown
              className={`h-5 w-5 text-[#999] transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
            />
          </button>
        )}

        <div
          className={`grid transition-all duration-300 ease-in-out ${isOpen
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
            }`}
        >
          <div className="overflow-hidden">
            <div className="pb-3">
            {isDrill ? (
              safeDestinationTree.map((country) => {
                const isCountryOpen = !!expandedCountries[country.id];
                return (
                  <div key={country.id}>
                    <button
                      type="button"
                      onClick={() => toggleCountryExpanded(country.id)}
                      aria-expanded={isCountryOpen}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-[14px] font-semibold text-[#1C1C1C] transition-colors hover:bg-[#f6f7f8]"
                    >
                      <span>{country.title}</span>
                      <ChevronDown
                        className={`h-4 w-4 text-[#999] transition-transform duration-300 ${isCountryOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    <div
                      className={`grid transition-all duration-300 ease-in-out ${isCountryOpen
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                        }`}
                    >
                      <div className="overflow-hidden">
                        <div>
                        <Link
                          href={country.href}
                          onClick={handleMobileClose}
                          className="flex items-center gap-1 px-4 py-2 text-[13px] font-bold text-[#D4561A]"
                        >
                          View all {country.title} tours <span aria-hidden>→</span>
                        </Link>
                        {country.states.map((state) => {
                          const isStateOpen = !!expandedStates[state.id];
                          return (
                            <div key={state.id}>
                              <button
                                type="button"
                                onClick={() => toggleStateExpanded(state.id)}
                                aria-expanded={isStateOpen}
                                className="flex w-full items-center justify-between px-6 py-2.5 text-[14px] font-semibold text-[#2E8B8B] transition-colors hover:bg-[#f6f7f8]"
                              >
                                <span>{state.title}</span>
                                <ChevronDown
                                  className={`h-4 w-4 text-[#999] transition-transform duration-300 ${isStateOpen ? "rotate-180" : ""}`}
                                />
                              </button>
                              <div
                              className={`grid transition-all duration-300 ease-in-out ${isStateOpen
                                ? "grid-rows-[1fr] opacity-100"
                                : "grid-rows-[0fr] opacity-0"
                                }`}
                            >
                              <div className="overflow-hidden">
                                <div className="flex flex-col">
                                  {state.cities.map((city) => (
                                    <Link
                                      key={city.id}
                                      href={city.href}
                                      onClick={handleMobileClose}
                                      className="px-8 py-2 text-[13px] text-[#444] transition-colors hover:bg-[#f6f7f8] hover:text-[#2E8B8B]"
                                    >
                                      {city.title}
                                    </Link>
                                  ))}
                                  <Link
                                    href={state.href}
                                    onClick={handleMobileClose}
                                    className="flex items-center gap-1 px-6 py-2 text-[13px] font-bold text-[#D4561A]"
                                  >
                                    View all {state.title} tours <span aria-hidden>→</span>
                                  </Link>
                                </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <>
                {link.children?.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={handleMobileClose}
                    className="block px-4 py-2.5 text-[14px] font-medium text-[#444] transition-colors hover:bg-[#f6f7f8] hover:text-[#1C1C1C]"
                  >
                    {child.label}
                  </Link>
                ))}
                {link.seeAllHref && (
                  <Link
                    href={link.seeAllHref}
                    onClick={handleMobileClose}
                    className="flex items-center gap-1 px-4 py-2.5 text-[13px] font-bold text-[#D4561A]"
                  >
                    See All <span aria-hidden>→</span>
                  </Link>
                )}
              </>
            )}
            </div>
          </div>
        </div>
      </div>
    );
  });

  return (
    <header
      className={`relative sticky top-0 z-50 transition-[background-color,border-color,box-shadow,padding] duration-300 ${isScrolled
        ? "bg-white/90 backdrop-blur-md shadow-[0_1px_0_0_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)] border-b border-[#ececec] py-2"
        : "bg-white border-b border-[#f2f2f2] py-2.5"
        }`}
    >
      <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-10">
        <div className="flex items-stretch justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <img
              src="/logo-with-name.png"
              alt="Flag Journeys"
              className="h-[68px] sm:h-[72px] md:h-[76px] w-auto object-contain transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </Link>

          {!isOfferPage && (
            <nav className="hidden md:flex items-stretch gap-0.5">
              {navLinks.map((link) => (
                <div
                  key={link.href}
                  className={`${link.isDestinationMega ? "" : "relative"} flex items-center h-full`}
                  onMouseEnter={() => (link.children || link.isDestinationMega) ? (clearMegaMenuCloseTimer(), setOpenDesktopDropdown(link.href)) : null}
                  onMouseLeave={() => (link.children || link.isDestinationMega) ? scheduleMegaMenuClose() : setOpenDesktopDropdown(null)}
                >
                  {link.children || link.isDestinationMega ? (
                    <button
                      type="button"
                      onClick={() =>
                        setOpenDesktopDropdown(
                          openDesktopDropdown === link.href ? null : link.href
                        )
                      }
                      className={`relative px-3 py-2.5 text-sm font-medium tracking-wide rounded-full transition-all duration-300 group flex items-center gap-1 hover:text-[#2E8B8B] hover:bg-[#2E8B8B]/5 cursor-pointer ${openDesktopDropdown === link.href
                        ? "text-[#2E8B8B] bg-[#2E8B8B]/5"
                        : "text-[#666]"
                        }`}
                    >
                      <span className="relative z-10">{link.label}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 relative z-10 transition-transform duration-300 ${openDesktopDropdown === link.href ? "rotate-180" : ""
                          }`}
                      />
                    </button>
                  ) : (
                    <Link
                      href={link.href}
                      className={`relative px-3 py-2.5 text-sm font-medium tracking-wide rounded-full transition-all duration-300 group flex items-center gap-1 hover:text-[#2E8B8B] hover:bg-[#2E8B8B]/5 ${openDesktopDropdown === link.href
                        ? "text-[#2E8B8B] bg-[#2E8B8B]/5"
                        : "text-[#666]"
                        }`}
                    >
                      <span className="relative z-10">{link.label}</span>
                    </Link>
                  )}

                  {link.isDestinationMega && link.tree && link.tree.length > 0 && (
                    <DestinationMegaMenu
                      tree={link.tree as DestinationTreeCountry[]}
                      isOpen={openDesktopDropdown === link.href}
                      onMouseEnter={() => { clearMegaMenuCloseTimer(); setOpenDesktopDropdown(link.href); }}
                      onMouseLeave={() => scheduleMegaMenuClose()}
                      onClose={() => setOpenDesktopDropdown(null)}
                    />
                  )}

                  {link.children && link.dropdownStyle === "mega" && !link.isDestinationMega && (
                    <div
                      // Keep dropdown open while mouse is over the dropdown area
                      onMouseEnter={() => setOpenDesktopDropdown(link.href)}
                      onMouseLeave={() => setOpenDesktopDropdown(null)}
                      className={`absolute left-1/2 -translate-x-1/2 top-full transition-opacity duration-200 ${openDesktopDropdown === link.href
                        ? "opacity-100 visible pointer-events-auto"
                        : "opacity-0 invisible pointer-events-none"
                        }`}
                    >
                      <div
                        className={`bg-white rounded-2xl border border-slate-200/90 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] p-6 ${link.dropdownColumns === 1 ? "w-[320px]" : "w-[640px]"
                          }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[18px] font-bold text-[#2E8B8B] tracking-tight">
                            {link.dropdownTitle ?? "Popular Tour Packages"}
                          </span>
                        </div>
                        <div
                          className={`grid gap-x-8 gap-y-2 ${link.dropdownColumns === 1
                            ? "grid-cols-1"
                            : link.dropdownColumns === 2
                              ? "grid-cols-2"
                              : "grid-cols-3"
                            }`}
                        >
                          {link.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setOpenDesktopDropdown(null)}
                              className="py-1 text-[16px] text-slate-700 hover:text-[#2E8B8B] font-medium transition-colors duration-150 truncate block"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                        {link.seeAllHref && (
                          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[13px] text-slate-400 font-medium">
                              {link.dropdownSubtext ?? "Explore all destinations worldwide"}
                            </span>
                            <Link
                              href={link.seeAllHref}
                              onClick={() => setOpenDesktopDropdown(null)}
                              className="text-[15px] font-bold text-[#D4561A] hover:opacity-80 transition-opacity flex items-center gap-1"
                            >
                              <span>See All</span>
                              <span aria-hidden>→</span>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              ))}
            </nav>
          )}

          <div className="hidden lg:flex items-center gap-3">
            <QuoteModal>
              <button
                type="button"
                className="btn-primary px-5 py-2.5 text-xs font-bold tracking-wide flex items-center gap-1.5 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>Build My Trip</span>
              </button>
            </QuoteModal>
          </div>

          {!isOfferPage && (
            <div className="flex md:hidden items-center">
              <button
                onClick={() => (isMobileMenuOpen ? handleMobileClose() : handleMobileOpen())}
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMobileMenuOpen}
                className="p-2 rounded-lg text-[#555] hover:bg-[#f5f5f5] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1C1C]/20"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile drawer navigation (slide-in, drill-down) */}
      {!isOfferPage &&
        typeof document !== "undefined" &&
        mounted &&
        createPortal(
          <>
            {/* Backdrop */}
            <div
              className={`fixed inset-0 z-[65] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 md:hidden ${isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              onClick={handleMobileClose}
              aria-hidden="true"
            />

            {/* Drawer panel */}
            <div
              className={`fixed top-0 left-0 z-[70] flex h-full w-[86vw] max-w-[380px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out md:hidden ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                }`}
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
            >
              {/* Drawer head */}
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#ececec] px-4">
                <Link
                  href="/"
                  onClick={handleMobileClose}
                  className="text-[19px] font-extrabold tracking-tight text-[#1C1C1C]"
                >
                  FlagJourney<span className="text-[#2E8B8B]"> Holidays</span>
                </Link>
                <button
                  onClick={handleMobileClose}
                  aria-label="Close menu"
                  className="rounded-lg p-2 text-[#555] transition-colors hover:bg-[#f5f5f5]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Accordion menu */}
              <div className="flex-1 overflow-y-auto px-3 py-3">
                <div className="space-y-2">{renderMobileAccordion}</div>
              </div>

                  {/* Drawer actions */}
              <div className="shrink-0 space-y-2 border-t border-[#ececec] px-4 py-3">
                <QuoteModal>
                  <button className="btn-primary w-full py-3 text-base">
                    <span>Enquire Now</span>
                  </button>
                </QuoteModal>
                <a
                  href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919136739178"}?text=${encodeURIComponent("Hi Flag Journeys, I want to inquire about a custom holiday tour package.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2E8B8B] py-3 text-base font-bold text-white transition-colors hover:bg-[#266f6f] active:scale-95"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  Chat on WhatsApp
                </a>
              </div>
            </div>
          </>,
          document.body
        )}
    </header>
  );
};

export default Header;
