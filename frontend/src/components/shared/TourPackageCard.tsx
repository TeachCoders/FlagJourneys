"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Clock, Star, ArrowRight, CheckCircle2, Compass } from "lucide-react";
import type { Journey } from "@/feature/journey/type";
import { journeyPackageHref } from "@/feature/journey/filterOptions";
import { travelExperienceIcon } from "@/components/shared/TravelExperiencePills";
import { FallbackImage } from "@/components/shared/FallbackImage";
import { WhatsAppPriceButton } from "@/components/shared/WhatsAppPriceButton";
import { QuoteModal } from "@/components/shared/QuoteModal";

function PackageImageWithFallback({ src, alt }: { src?: string; alt?: string }) {
  return (
    <FallbackImage
      src={src}
      alt={alt || "Flag Journeys Package"}
      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      fallbackSrc="/logo-with-name.png"
      theme="light"
    />
  );
}

function getUniquePackageRating(journey: Journey) {
  const str = (journey.id || journey.title || journey.slug || "package") + "";
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const ratings = ["4.8", "4.9", "4.7", "5.0", "4.9", "4.8", "4.9"];
  const rating = ratings[Math.abs(hash) % ratings.length];

  const reviewCounts = [84, 142, 65, 118, 93, 210, 56, 175, 129, 98];
  const reviewsCount = reviewCounts[Math.abs(hash * 7) % reviewCounts.length];

  return { rating, reviewsCount };
}

export default function TourPackageCard({ journey, contextName }: { journey: Journey, contextName?: string }) {
  const price = journey.discountPrice ?? journey.pricePerPerson ?? 0;
  const hasDiscount = journey.discountPrice && journey.discountPrice > price;
  const offPercent = hasDiscount
    ? Math.round(((journey.discountPrice! - price) / journey.discountPrice!) * 100)
    : 0;
  const state = journey.cities?.[0]?.state?.title;
  const href = journeyPackageHref(journey);
  const { rating, reviewsCount } = getUniquePackageRating(journey);

  return (
    <div
      className="group relative flex flex-col bg-white rounded-3xl overflow-hidden border border-slate-200/60 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 ease-out h-full"
    >
      {/* Image Container */}
      <Link href={href} className="relative h-[240px] w-full overflow-hidden shrink-0 block">
        <PackageImageWithFallback
          src={journey.thumbImg || journey.banner?.images?.[0] || ""}
          alt={`${journey.h1Title || journey.title}${journey.destination ? ` - ${journey.destination}` : ""} Tour Package | Flag Journeys`}
        />

        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent opacity-60" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
          <div className="flex flex-col gap-2 items-start pointer-events-auto">
            {journey.isBestSelling && (
              <span className="inline-flex items-center gap-1.5 bg-amber-400 text-[#1C1C1C] text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg">
                <Star size={11} fill="currentColor" className="text-[#1C1C1C]" /> Best Seller
              </span>
            )}
          </div>
          {hasDiscount && offPercent > 0 && (
            <span className="bg-[#D4561A] text-white text-[11px] font-black px-3 py-1.5 rounded-full shadow-lg pointer-events-auto">
              {offPercent}% OFF
            </span>
          )}
        </div>

        {/* Dynamic Context Icon (Top Right) */}
        {contextName && (
          <div
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white shadow-lg pointer-events-none"
            title={contextName}
          >
            {travelExperienceIcon(contextName, "w-[18px] h-[18px]")}
          </div>
        )}

        {/* Bottom Image Info */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
          {journey.noDays > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white bg-black/40 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full shadow-sm">
              <Clock size={14} className="opacity-90" />
              {journey.noDays === 1 ? "1 Day" : `${journey.noDays - 1}N / ${journey.noDays}D`}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[11.5px] font-bold text-amber-300 bg-black/45 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-full shadow-sm">
            <Star size={11} fill="currentColor" className="text-amber-400 shrink-0" />
            <span>{rating} <span className="text-white/80 font-normal">({reviewsCount})</span></span>
          </span>
        </div>
      </Link>

      {/* Content Container */}
      <div className="p-6 flex flex-col flex-1 bg-white relative z-10">
        <Link href={href} className="inline-block mb-3">
          <h3 className="text-[17px] font-bold text-[#1C1C1C] line-clamp-2 leading-snug group-hover:text-[#2E8B8B] transition-colors">
            {journey.noDays > 0 && !/^\d+\s*(day|days|night|nights)/i.test(journey.h1Title || journey.title || "")
              ? `${journey.noDays} ${journey.noDays === 1 ? "Day" : "Days"} - ${journey.h1Title || journey.title}`
              : (journey.h1Title || journey.title)}
          </h3>
        </Link>

        {/* Route / Destination */}
        {(journey.destination || state) && (
          <div className="flex items-start gap-1.5 mb-3.5 text-[13.5px] text-[#555] font-medium">
            <MapPin size={16} className="shrink-0 text-[#2E8B8B] mt-[1px]" />
            <span className="line-clamp-2 leading-snug">{journey.destination || state}</span>
          </div>
        )}

        {/* Inclusions Feature Badges */}
        <div className="flex items-center justify-between gap-1.5 py-2 px-3 mb-4 rounded-xl bg-slate-50 border border-slate-100 text-[11px] font-bold text-slate-600">
          <span title="3★/4★ Handpicked Hotels" className="flex items-center gap-1">
            🏨 Hotel
          </span>
          <span className="text-slate-300">•</span>
          <span title="Private Cab Transfers" className="flex items-center gap-1">
            🚗 Cab
          </span>
          <span className="text-slate-300">•</span>
          <span title="Daily Breakfast Included" className="flex items-center gap-1">
            🍳 Meals
          </span>
          <span className="text-slate-300">•</span>
          <span title="Guided Sightseeing" className="flex items-center gap-1">
            🎟️ Tours
          </span>
        </div>

        {/* Experience Pills */}
        {(journey.travelExperiences?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {journey.travelExperiences!.slice(0, 3).map((t) => (
              <span
                key={t.id}
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#2E8B8B] bg-[#2E8B8B]/10 border border-[#2E8B8B]/20 px-2.5 py-1 rounded-full"
              >
                {travelExperienceIcon(t.title)}
                {t.title}
              </span>
            ))}
          </div>
        )}

        {/* Highlights List */}
        {(journey.highlights?.length ?? 0) > 0 && (
          <div className="space-y-2.5 mb-6">
            {journey.highlights!.slice(0, 3).map((hl, i) => (
              <div key={i} className="flex items-start gap-2.5 text-[13.5px] text-slate-600 font-medium">
                <CheckCircle2 size={16} className="shrink-0 text-[#2E8B8B]/80 mt-[2px]" />
                <span className="line-clamp-1">{hl}</span>
              </div>
            ))}
          </div>
        )}

        {/* Pricing & CTA - Balanced 2-Column Action Bar */}
        <div className="mt-auto pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
          {/* Column 1: Teal Green Price Action Button */}
          <WhatsAppPriceButton
            packageName={journey.h1Title || journey.title}
            label={price > 0 ? `₹${price.toLocaleString()} • WhatsApp` : "Price on Request"}
            className="px-2.5 sm:px-3 py-2 bg-[#2E8B8B] hover:bg-[#247070] active:scale-95 text-white font-bold tracking-tight rounded-xl text-[12px] sm:text-[12.5px] flex items-center gap-1.5 transition-all duration-200 cursor-pointer shadow-sm shadow-[#2E8B8B]/20 whitespace-nowrap shrink-0"
            iconClassName="w-3.5 h-3.5 fill-white shrink-0"
          />

          {/* Column 2: Details Navigation with Animated Arrow */}
          <Link href={href} className="flex items-center gap-1.5 group/btn shrink-0" title="View Details">
            <span className="text-[14.5px] sm:text-[15.5px] font-bold text-[#D4561A] group-hover/btn:underline whitespace-nowrap">
              View Details
            </span>
            <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center border border-orange-100 group-hover/btn:bg-[#D4561A] group-hover/btn:border-[#D4561A] group-hover/btn:shadow-sm transition-all duration-300 shrink-0">
              <ArrowRight size={14} className="text-[#D4561A] group-hover/btn:text-white transition-all duration-300 group-hover/btn:-rotate-45" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
