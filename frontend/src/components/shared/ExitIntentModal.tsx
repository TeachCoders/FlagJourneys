"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import TourBookingForm from "@/feature/leads/components/TourBookingForm";
import { Sparkles, CheckCircle2, ShieldCheck, Gift } from "lucide-react";

export default function ExitIntentModal() {
  const [open, setOpen] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    // Only run on desktop screens
    if (window.innerWidth < 768) return;

    // Check session storage to only trigger once per session
    if (sessionStorage.getItem("flagjourney_exit_intent_shown") === "true") {
      setHasTriggered(true);
      return;
    }

    // Show popup once the visitor stays on the page for 15+ seconds
    const timer = setTimeout(() => {
      if (!hasTriggered) {
        setOpen(true);
        setHasTriggered(true);
        sessionStorage.setItem("flagjourney_exit_intent_shown", "true");
      }
    }, 15000);

    return () => clearTimeout(timer);
  }, [hasTriggered]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      sessionStorage.setItem("flagjourney_exit_intent_shown", "true");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-5xl w-[95vw] p-0 overflow-hidden bg-white rounded-[24px] md:rounded-[32px] border-none shadow-2xl">
        <DialogTitle className="sr-only">Exclusive Travel Offer</DialogTitle>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.35fr] max-h-[90vh] md:max-h-[85vh]">
          {/* Left Panel - Value Proposition */}
          <div className="p-8 md:p-12 flex flex-col justify-between bg-gradient-to-br from-[#FFF5F0] via-[#FAF9F6] to-[#F4F6F8] border-b md:border-b-0 md:border-r border-slate-200 text-[#1C1C1C] relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#D4561A]/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-[#2E8B8B]/10 blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider text-white bg-[#D4561A] shadow-sm mb-6">
                <Gift size={14} /> Special Visitor Voucher
              </span>

              <h2 className="font-heading text-2xl md:text-4xl font-extrabold text-[#1C1C1C] leading-tight tracking-tight">
                Wait! Before You Leave...
              </h2>

              <p className="mt-4 text-slate-600 text-sm md:text-base leading-relaxed font-medium">
                Claim up to <strong className="text-[#D4561A] font-bold">₹2,000 Flat Discount</strong> + a 100% free customized day-by-day itinerary tailored for your vacation!
              </p>

              <ul className="mt-8 space-y-4">
                <li className="flex items-start gap-3 text-sm text-slate-700 font-medium">
                  <CheckCircle2 size={18} className="text-[#2E8B8B] shrink-0 mt-0.5" />
                  <span><strong>100% Customized</strong> Tour Itineraries</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700 font-medium">
                  <CheckCircle2 size={18} className="text-[#2E8B8B] shrink-0 mt-0.5" />
                  <span>Verified 3★ / 4★ Hotels & Private Cabs</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700 font-medium">
                  <CheckCircle2 size={18} className="text-[#2E8B8B] shrink-0 mt-0.5" />
                  <span>24/7 On-Trip Personal Concierge Assistance</span>
                </li>
              </ul>
            </div>

            <div className="relative z-10 mt-10 pt-6 border-t border-slate-200/80 flex items-center gap-2 text-xs font-bold text-slate-500">
              <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
              <span>No Spam Guarantee • Free Consultation Within 2 Hours</span>
            </div>
          </div>

          {/* Right Panel - Form Container (Custom scrollbar-none to prevent ugly browser scrollbars) */}
          <div className="p-6 md:p-10 overflow-y-auto max-h-[85vh] bg-white scrollbar-none">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-[#1C1C1C] tracking-tight">
                Get Instant Free Itinerary Quote
              </h3>
              <p className="text-slate-500 text-sm mt-1">
                Fill in your trip preferences & our travel expert will send your custom plan.
              </p>
            </div>

            <TourBookingForm embedded hideHeader onSuccess={() => setOpen(false)} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
