"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Star, Clock, CheckCircle2, Compass, ArrowRight, Phone, MapPin, Pencil, CalendarDays } from "lucide-react";
import { successToast, errorToast } from "@/components/shared/tost";
import apiClient from "@/lib/apiClient";
import { detectGeoFromIP } from "@/feature/leads/data/countries";
import { FallbackImage } from "@/components/shared/FallbackImage";
import { QuoteModal } from "@/components/shared/QuoteModal";
import { WhatsAppPriceButton } from "@/components/shared/WhatsAppPriceButton";

interface PackageItem {
  id?: number | string;
  name: string;
  duration: string;
  price: number;
  originalPrice: number;
  image: string;
  destination: string;
  route?: string;
  description?: string;
  highlights: string[];
  inclusions: string[];
  hotelType?: string;
  days?: any[];
}

interface AdPackageShowcaseProps {
  destinationName?: string;
  packages?: PackageItem[];
  onSelectPackage?: (pkgName: string) => void;
}

function PackageImageWithFallback({ src, alt }: { src?: string; alt?: string }) {
  return (
    <FallbackImage
      src={src}
      alt={alt || "Flag Journeys Package"}
      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      fallbackSrc="/logo-with-name.png"
      theme="dark"
    />
  );
}

export default function AdPackageShowcase({
  destinationName = "Featured Destination",
  packages = [],
  onSelectPackage,
}: AdPackageShowcaseProps) {
  const [selectedPkg, setSelectedPkg] = useState<PackageItem | null>(null);
  const [selectedDetailsPkg, setSelectedDetailsPkg] = useState<PackageItem | null>(null);
  const [modalForm, setModalForm] = useState({ name: "", phone: "", travelDate: "" });
  const [geoMeta, setGeoMeta] = useState<{ ip: string; location: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    detectGeoFromIP().then((geo) => {
      if (geo?.ip) setGeoMeta({ ip: geo.ip, location: geo.location });
    });
  }, []);

  const handleQuickBook = (pkg: PackageItem) => {
    setSelectedPkg(pkg);
    if (onSelectPackage) onSelectPackage(pkg.name);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalForm.name.trim()) return errorToast("Please enter your name");
    if (!modalForm.phone.trim() || modalForm.phone.length < 8) return errorToast("Please enter a valid mobile number with country code");

    setIsSubmitting(true);
    try {
      await apiClient.post("/traveller-lead", {
        name: modalForm.name.trim(),
        phone: modalForm.phone.trim(),
        travelDate: modalForm.travelDate || undefined,
        ipAddress: geoMeta?.ip,
        location: geoMeta?.location,
        country: destinationName,
        pageReference: `Ad Package Quote: ${selectedPkg?.name || "General Package"}`,
      });
      successToast("Quote request submitted! Our travel manager will call you immediately.");
      setSelectedPkg(null);
      setModalForm({ name: "", phone: "", travelDate: "" });
    } catch (err: any) {
      errorToast(err?.response?.data?.message || "Failed to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!packages || packages.length === 0) return null;

  const displayList = packages;

  return (
    <section id="packages-section" className="py-20 bg-slate-50 text-slate-900 relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-orange-500/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-widest">
            <Sparkles size={14} /> Factory Direct Price Drop
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
            Top Selling Bestseller Packages
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            100% Transparent pricing with zero hidden charges. Get instant price breakdown for {destinationName}.
          </p>
        </div>

        {/* Package Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayList.map((pkg, idx) => {
            return (
              <div
                key={pkg.id || idx}
                className="group relative flex flex-col bg-white rounded-3xl overflow-hidden border border-slate-200/60 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 ease-out h-full"
              >
                {/* Admin Edit Button */}
                {pkg.id && (
                  <a
                    href={`/dashboard/journey/${pkg.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Edit Journey Title, Image, Highlights & Description in Dashboard"
                    className="absolute top-3 right-3 z-30 w-9 h-9 bg-white/95 backdrop-blur-md border border-slate-200 rounded-full flex items-center justify-center shadow-lg hover:bg-orange-500 hover:border-orange-500 hover:text-white text-slate-700 transition-all duration-200"
                  >
                    <Pencil size={15} />
                  </a>
                )}
                {/* Image Container */}
                <div className="relative h-[320px] w-full overflow-hidden shrink-0 block cursor-pointer" onClick={() => setSelectedDetailsPkg(pkg)}>
                  <PackageImageWithFallback src={pkg.image} alt={pkg.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent opacity-60" />

                  {/* Top Badges */}
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
                    <div className="flex flex-col gap-2 items-start pointer-events-auto">
                      <span className="inline-flex items-center gap-1.5 bg-amber-400 text-[#1C1C1C] text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg">
                        <Star size={11} fill="currentColor" className="text-[#1C1C1C]" /> Best Seller
                      </span>
                    </div>
                  </div>

                  {/* Bottom Image Info */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                    <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white bg-black/30 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full">
                      <Clock size={14} className="opacity-90" />
                      {pkg.duration}
                    </span>
                  </div>
                </div>

                {/* Content Container */}
                <div className="p-6 flex flex-col flex-1 bg-white relative z-10">
                  <div className="inline-block mb-3 cursor-pointer" onClick={() => setSelectedDetailsPkg(pkg)}>
                    <h3 className="text-[22px] font-bold text-[#1C1C1C] line-clamp-2 leading-snug group-hover:text-[#2E8B8B] transition-colors">
                      {pkg.name}
                    </h3>
                  </div>

                  <div className="flex items-start gap-1.5 mb-4 text-[16px] text-[#555] font-medium">
                    <MapPin size={17} className="shrink-0 text-[#2E8B8B] mt-[2px]" />
                    <span className="line-clamp-2 leading-snug">{pkg.route || pkg.destination}</span>
                  </div>

                  {/* Highlights List */}
                  {pkg.highlights && (
                    <div className="space-y-2.5 mb-5 mt-4">
                      {Array.isArray(pkg.highlights) ? (
                        pkg.highlights.map((hl: string, i: number) => (
                          <div key={i} className="flex items-start gap-2.5 text-[15px] text-slate-600">
                            <CheckCircle2 size={17} className="shrink-0 text-emerald-500 mt-[3px]" />
                            <span className="line-clamp-1" dangerouslySetInnerHTML={{ __html: hl }} />
                          </div>
                        ))
                      ) : typeof (pkg.highlights as any) === "string" && (pkg.highlights as any).trim() ? (
                        <div className="text-[15px] text-slate-600 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: pkg.highlights as string }} />
                      ) : null}
                    </div>
                  )}

                  {pkg.description && (
                    <div className="text-[15px] text-slate-500 line-clamp-3 leading-relaxed mb-5" dangerouslySetInnerHTML={{ __html: pkg.description }} />
                  )}

                  {/* Pricing & CTA */}
                  <div className="mt-auto pt-5 border-t border-slate-100 space-y-3">


                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setSelectedDetailsPkg(pkg)}
                        className="py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition flex items-center justify-center gap-1.5 text-base"
                      >
                        View Details
                      </button>
                      <WhatsAppPriceButton packageName={pkg.name} />
                    </div>

                    <QuoteModal>
                      <button
                        type="button"
                        className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold rounded-xl shadow-lg shadow-orange-500/20 transition flex items-center justify-center gap-2 text-base cursor-pointer"
                      >
                        <span>Get Custom Quote</span>
                        <ArrowRight size={16} />
                      </button>
                    </QuoteModal>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

      </div>



      {/* View Details Modal */}
      {selectedDetailsPkg && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl w-[95vw] sm:w-[90vw] max-w-[1200px] max-h-[92vh] flex flex-col shadow-2xl relative text-slate-900 animate-in fade-in zoom-in duration-200 overflow-hidden">

            {/* Sticky Header Bar with Title & Close Button */}
            <div className="shrink-0 px-4 sm:px-7 pt-3.5 pb-3 bg-white/95 backdrop-blur-md z-40 border-b border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-hidden">
                <span className="bg-slate-900 text-white text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs shrink-0 max-w-[200px] sm:max-w-none truncate">
                  <Clock size={13} className="text-orange-400 shrink-0" />
                  <span className="truncate">{selectedDetailsPkg.duration ? `${selectedDetailsPkg.duration} Detailed Tour` : "Verified Tour Itinerary"}</span>
                </span>
                {Boolean(selectedDetailsPkg.price) && Number(selectedDetailsPkg.price) > 0 && (
                  <span className="bg-emerald-100 text-emerald-800 text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full shrink-0">
                    ₹{Number(selectedDetailsPkg.price).toLocaleString()} / person
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedDetailsPkg(null)}
                className="text-slate-400 hover:text-slate-900 text-lg sm:text-xl font-bold p-1 bg-slate-100 hover:bg-slate-200 rounded-full w-8 h-8 flex items-center justify-center shadow-xs transition shrink-0 ml-1"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Body Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-7 space-y-5 sm:space-y-6">
              {/* Full Width Top Hero Image Banner */}
              <div className="relative w-full h-44 sm:h-72 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg bg-slate-900 group shrink-0">
                <FallbackImage
                  src={selectedDetailsPkg.image}
                  alt={selectedDetailsPkg.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  fallbackSrc="/logo-with-name.png"
                  theme="dark"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                {/* Bottom Overlay Title & Route */}
                <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 z-10 space-y-1">
                  <h3 className="text-lg sm:text-2xl font-black text-white leading-tight drop-shadow-md">
                    {selectedDetailsPkg.name}
                  </h3>
                  {selectedDetailsPkg.route && (
                    <p className="text-orange-300 font-bold text-xs sm:text-sm flex items-center gap-1">
                      <Compass size={14} className="shrink-0" /> <span className="truncate">{selectedDetailsPkg.route}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Package Highlights - Single Unified Card */}
              {selectedDetailsPkg.highlights && selectedDetailsPkg.highlights.length > 0 && (
                <div className="bg-[#2E8B8B]/5 border border-[#2E8B8B]/15 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 space-y-2.5 sm:space-y-3">
                  <h4 className="text-sm sm:text-lg font-black text-[#1C1C1C] flex items-center gap-2">
                    <Sparkles size={18} className="text-[#D4561A] shrink-0" />
                    Package Highlights
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 pt-1">
                    {selectedDetailsPkg.highlights.map((point, pointIdx) => (
                      <li key={pointIdx} className="flex items-start gap-2 sm:gap-2.5 text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                        <CheckCircle2 size={16} className="text-[#2E8B8B] shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Day-by-Day Program Timeline */}
              {selectedDetailsPkg.days && selectedDetailsPkg.days.length > 0 ? (
                <div>
                  <h4 className="text-sm sm:text-lg font-black text-[#1C1C1C] mb-4 flex items-center gap-2">
                    <CalendarDays size={18} className="text-[#2E8B8B] shrink-0" />
                    Day-by-Day Itinerary
                  </h4>
                  <div className="relative pl-6 sm:pl-9 space-y-5 sm:space-y-6 border-l-2 border-[#D4561A]/30 ml-3 sm:ml-4 pt-1">
                    {selectedDetailsPkg.days.map((day: any, i: number) => (
                      <div key={i} className="relative group space-y-1.5 sm:space-y-2">
                        {/* Timeline Step Dot Badge */}
                        <div className="absolute -left-[39px] sm:-left-[51px] top-0.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border-2 border-[#D4561A] text-[#D4561A] font-black text-[11px] sm:text-xs flex items-center justify-center shadow-sm group-hover:bg-[#D4561A] group-hover:text-white transition-all">
                          {i + 1}
                        </div>

                        {/* Title */}
                        <h5 className="font-extrabold text-slate-900 text-xs sm:text-base leading-snug pt-0.5">
                          <span className="text-[#D4561A] font-black mr-1.5">Day {i + 1}:</span>
                          {day.day?.replace(/^Day\s*\d+\s*:\s*/i, "")}
                        </h5>

                        {/* Image */}
                        {day.image && (
                          <FallbackImage
                            src={day.image}
                            alt={`Day ${i + 1} ${day.day}`}
                            className="w-full h-36 sm:h-48 object-cover rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/80 my-1.5 sm:my-2"
                            fallbackSrc="/logo-with-name.png"
                            theme="light"
                          />
                        )}

                        {/* Description */}
                        {day.description && (
                          <div
                            className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50/80 border border-slate-200/60 p-3 sm:p-4 rounded-xl sm:rounded-2xl"
                            dangerouslySetInnerHTML={{ __html: day.description }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500 border border-slate-200">
                  Custom itinerary & hotel details will be shared by our travel expert upon inquiry.
                </div>
              )}
            </div>

            {/* Sticky Bottom Modal Footer Bar */}
            <div className="shrink-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 sm:px-7 py-3 flex items-center justify-between gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-[10000] relative">
              {Boolean(selectedDetailsPkg.price) && Number(selectedDetailsPkg.price) > 0 ? (
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Starting Price</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg sm:text-2xl font-black text-slate-900">₹{Number(selectedDetailsPkg.price).toLocaleString()}</span>
                    <span className="text-[11px] sm:text-xs text-slate-500"> / person</span>
                  </div>
                </div>
              ) : (
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Duration</span>
                  <span className="text-xs sm:text-base font-extrabold text-slate-900">{selectedDetailsPkg.duration}</span>
                </div>
              )}

              <QuoteModal>
                <button
                  onClick={() => setSelectedDetailsPkg(null)}
                  className="px-5 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs sm:text-base rounded-xl shadow-lg shadow-orange-500/20 transition flex items-center gap-1.5 sm:gap-2 shrink-0 cursor-pointer relative z-[10001]"
                >
                  <span>Get Custom Quote</span>
                  <ArrowRight size={15} />
                </button>
              </QuoteModal>
            </div>

          </div>
        </div>
      )}
    </section>
  );
}
