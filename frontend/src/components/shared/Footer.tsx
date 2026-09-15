"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, Phone, MapPin, ShieldCheck, CreditCard } from "lucide-react";
import WhatsAppIcon from "@/components/shared/WhatsAppIcon";
import { useGetStates } from "@/feature/state/api/useState";
import { useGetTravelExperiences } from "@/feature/travelExperience/api/useTravelExperience";
import type { State } from "@/feature/state/type";
import type { TravelExperience } from "@/feature/travelExperience/type";
import { stripTourSuffix, pickPriorityLinks } from "@/lib/utils";

const QUICK_LINKS = [
  { label: "Home", href: "/" },
  { label: "Destinations", href: "/tour-packages" },
  { label: "Tour Packages", href: "/tour-packages" },
  { label: "Experiences", href: "/travel-experiences" },
  { label: "About Us", href: "/about-us" },
  { label: "Contact Us", href: "/contact-us" },
  { label: "Blog", href: "/blog" },
];

const TOP_DESTINATIONS = [
  { label: "Kashmir Holiday Packages", href: "/tour-packages/india/jammu-and-kashmir" },
  { label: "Himachal Pradesh Tours", href: "/tour-packages/india/himachal-pradesh" },
  { label: "Kerala Backwaters & Hills", href: "/tour-packages/india" },
  { label: "Rajasthan Royal Heritage", href: "/tour-packages/india/rajasthan" },
  { label: "Goa Beach Escapes", href: "/tour-packages/india" },
  { label: "Uttarakhand Hills & Trekking", href: "/tour-packages/india/uttarakhand" },
];

const TRAVEL_THEMES = [
  { label: "Honeymoon & Romantic", href: "/#experiences" },
  { label: "Family Vacation", href: "/#experiences" },
  { label: "Adventure & Trekking", href: "/#experiences" },
  { label: "Wildlife & Safari", href: "/#experiences" },
  { label: "Pilgrimage & Spiritual", href: "/#experiences" },
  { label: "Luxury Escapes", href: "/#experiences" },
];

export const Footer: React.FC = () => {
  const pathname = usePathname();
  const isOfferPage = pathname?.startsWith("/offers/");
  
  const { states } = useGetStates({ limit: 100, isActive: "true" });
  const { travelExperiences } = useGetTravelExperiences({
    limit: 100,
    isActive: "true",
  });

  const destinationLinks = useMemo(
    () =>
      pickPriorityLinks<State>(
        states,
        (s) => s.displayOrder ?? 0,
        (s) => ({
          href: `/tour-packages/${s.country?.slug ?? "india"}/${s.slug}`,
          label: stripTourSuffix(s.h1Title || ""),
        })
      ),
    [states]
  );

  const experienceLinks = useMemo(
    () =>
      pickPriorityLinks<TravelExperience>(
        travelExperiences,
        (e) => e.displayOrder ?? 0,
        (e) => ({
          href: `/travel-experiences/${e.slug}`,
          label: stripTourSuffix(e.h1Title || e.title),
        })
      ),
    [travelExperiences]
  );

  const footerDestinations =
    destinationLinks.length > 0 ? destinationLinks : TOP_DESTINATIONS;
  const footerThemes = experienceLinks.length > 0 ? experienceLinks : TRAVEL_THEMES;

  const salesPhone = process.env.NEXT_PUBLIC_SALES_PHONE || "+918447273005";
  const salesPhoneDigits = salesPhone.replace(/[^0-9]/g, "");
  const salesPhoneDisplay = `+${salesPhoneDigits.slice(0, 2)} ${salesPhoneDigits.slice(2, 7)} ${salesPhoneDigits.slice(7)}`;

  if (isOfferPage) {
  return (
      <footer className="relative bg-[#1C1C1C] text-[#999] pt-12 pb-8 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#2E8B8B]/40 to-transparent" />
        <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-10 flex flex-col items-center justify-center text-center">
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10 mb-8">
            <div className="flex items-center gap-3 text-white/90">
              <ShieldCheck className="w-8 h-8 text-[#2E8B8B]" />
              <span className="font-semibold text-sm tracking-wide uppercase">100% Verified Packages</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <CreditCard className="w-8 h-8 text-[#2E8B8B]" />
              <span className="font-semibold text-sm tracking-wide uppercase">Secure Payments</span>
            </div>
          </div>
          <p className="text-xs text-[#777]">
            &copy; {new Date().getFullYear()} Flag Journeys. All rights reserved.
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="relative bg-[#1C1C1C] text-[#999] pt-16 pb-24 md:pb-8 overflow-hidden">
      {/* Subtle top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#2E8B8B]/40 to-transparent" />

      {/* Main Links */}
      <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <h4 className="text-xs font-bold text-white tracking-[0.08em] uppercase mb-5">
              Quick Links
            </h4>
            <ul className="space-y-3.5 text-sm">
              {QUICK_LINKS.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-[#a8a8a8] hover:text-white transition-colors duration-200"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white tracking-[0.08em] uppercase mb-5">
              Top Destinations
            </h4>
            <ul className="space-y-3.5 text-sm">
              {footerDestinations.map((item) => (
                <li key={`${item.label}-${item.href}`}>
                  <Link
                    href={item.href}
                    className="text-[#a8a8a8] hover:text-white transition-colors duration-200"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white tracking-[0.08em] uppercase mb-5">
              Travel Themes
            </h4>
            <ul className="space-y-3.5 text-sm">
              {footerThemes.map((item) => (
                <li key={`${item.label}-${item.href}`}>
                  <Link
                    href={item.href}
                    className="text-[#a8a8a8] hover:text-white transition-colors duration-200"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white tracking-[0.08em] uppercase mb-5">
              Contact Info
            </h4>
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-[#2E8B8B]" />
                </div>
                <span className="text-[#a8a8a8] leading-relaxed pt-1.5">
                  102, Destination Hub, MG Road, New Delhi, India
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-[#2E8B8B]" />
                </div>
                <a
                  href={`tel:${salesPhone}`}
                  className="text-[#a8a8a8] hover:text-white transition-colors font-medium"
                >
                  {salesPhoneDisplay}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-[#2E8B8B]" />
                </div>
                <a
                  href="mailto:support@flagjourneys.com"
                  className="text-[#a8a8a8] hover:text-white transition-colors"
                >
                  support@flagjourneys.com
                </a>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center shrink-0">
                  <WhatsAppIcon className="w-4 h-4 text-[#2E8B8B]" />
                </div>
                <a
                  href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919136739178"}?text=${encodeURIComponent("Hi Flag Journeys, I want to inquire about a holiday tour package.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#a8a8a8] hover:text-white transition-colors"
                >
                  Chat on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#999]">
          <p className="relative text-[#999] hover:text-white transition-colors duration-200">
            &copy; {new Date().getFullYear()} Flag Journeys. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/about-us" className="hover:text-white transition-colors">
              About Us
            </Link>
            <Link href="/privacy-policy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-and-conditions" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link href="/cancellation-and-refund" className="hover:text-white transition-colors">
              Cancellation & Refund
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;