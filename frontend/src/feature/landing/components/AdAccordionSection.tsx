"use client";

import React, { useState } from "react";
import { HelpCircle, ChevronDown, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";

interface AdAccordionSectionProps {
  destinationName?: string;
  customFaqs?: { question: string; answer: string }[];
  inclusions?: string[];
  exclusions?: string[];
}

export default function AdAccordionSection({
  destinationName = "our packages",
  customFaqs = [],
  inclusions = [],
  exclusions = [],
}: AdAccordionSectionProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const defaultFaqs = [
    {
      question: `How can I customize an itinerary for ${destinationName}?`,
      answer: `Every Flag Journeys package can be tailored to your preferences. Simply fill out our quick enquiry form or tap WhatsApp to connect with a dedicated travel specialist. We can adjust hotel tiers, duration, private vehicle options, sightseeing pace, and special inclusions within 15 minutes.`,
    },
    {
      question: `Are all transfers, driver allowances, toll taxes, and parking fees included?`,
      answer: `Yes, we practice 100% transparent pricing. All quoted itineraries include AC private vehicle transfers, fuel, toll taxes, parking charges, state entry permits, driver allowances, and applicable taxes. There are zero hidden fees upon arrival.`,
    },
    {
      question: `What is the booking process and payment schedule?`,
      answer: `Booking is simple and secure. You can reserve your dates with a nominal advance deposit (usually 20-30%). The remaining balance is payable conveniently closer to your departure date or upon arrival as per your finalized itinerary agreement.`,
    },
    {
      question: `Is 24/7 on-trip assistance provided during our tour?`,
      answer: `Absolutely. From the moment you land or reach your first destination, a personal Flag Journeys trip executive is assigned to your booking. You will have a dedicated contact for immediate assistance with hotel check-ins, local recommendations, driver coordination, or emergency support.`,
    },
    {
      question: `What is your cancellation and rescheduling policy?`,
      answer: `We understand travel plans can change. Cancellations made well in advance qualify for partial or full refunds according to hotel and vendor timelines. Flexible rescheduling options are also available so you can easily postpone your trip to a future date.`,
    },
  ];

  let rawList: any[] = [];
  if (Array.isArray(customFaqs)) {
    rawList = customFaqs;
  } else if (typeof customFaqs === "string") {
    try { rawList = JSON.parse(customFaqs); } catch (e) {}
  }

  const normalizedFaqs = (Array.isArray(rawList) ? rawList : []).map((f: any) => ({
    question: f.question || f.ques || "",
    answer: f.answer || f.ans || "",
  })).filter((f: any) => f.question.trim() && f.answer.trim());

  const faqList = normalizedFaqs.length > 0 ? normalizedFaqs : defaultFaqs;

  return (
    <section className="py-20 bg-slate-50 text-slate-900 border-t border-slate-200">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Inclusions & Exclusions Grid */}
        {(inclusions.length > 0 || exclusions.length > 0) && (
        <div className="space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck size={14} /> 100% Transparency
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Package Inclusions & Exclusions
            </h2>
            <p className="text-slate-600 text-sm">
              Clear breakdown of what is covered for {destinationName} with zero hidden surprises.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* What is Included */}
            {inclusions.length > 0 && (
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-7 md:p-9 shadow-[0_8px_30px_rgb(16,185,129,0.04)]">
              <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-emerald-700 mb-6 flex items-center gap-2.5">
                <CheckCircle2 size={20} className="text-emerald-500" /> What's Included
              </h3>
              <ul className="space-y-4">
                {inclusions.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-[15.5px] font-bold text-emerald-950 leading-relaxed">
                    <CheckCircle2 size={20} className="text-emerald-500 mt-[2px] shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            )}

            {/* What is Excluded */}
            {exclusions.length > 0 && (
            <div className="bg-red-50/40 border border-red-100 rounded-3xl p-7 md:p-9 shadow-[0_8px_30px_rgb(239,68,68,0.04)]">
              <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-red-700 mb-6 flex items-center gap-2.5">
                <XCircle size={20} className="text-red-500" /> What's Excluded
              </h3>
              <ul className="space-y-4">
                {exclusions.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-[15.5px] font-medium text-red-950 leading-relaxed">
                    <XCircle size={20} className="text-red-500 mt-[2px] shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            )}
          </div>
        </div>
        )}

        {/* FAQs Accordion */}
        {faqList.length > 0 && (
        <div className="max-w-[1440px] mx-auto space-y-10">
          <div className="text-center space-y-2">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-100 border border-orange-200 text-orange-600 text-xs font-bold uppercase tracking-wider">
              <HelpCircle size={14} /> Clear Your Doubts
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">Frequently Asked Questions</h2>
            <p className="text-slate-600 text-sm">Everything you need to know before booking your holiday.</p>
          </div>

          <div className="space-y-3">
            {faqList.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                    isOpen ? "border-[#2E8B8B]/30 shadow-md bg-white" : "border-slate-200/80 bg-white hover:border-slate-300"
                  }`}
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left cursor-pointer focus:outline-none"
                  >
                    <span className={`text-[16px] sm:text-[17px] font-bold transition-colors ${isOpen ? "text-[#2E8B8B]" : "text-slate-900"}`}>
                      {faq.question}
                    </span>
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                      isOpen ? "bg-[#2E8B8B] text-white rotate-180" : "bg-slate-100 text-slate-500"
                    }`}>
                      <ChevronDown size={16} />
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 text-slate-600 text-sm sm:text-base leading-relaxed border-t border-slate-100 pt-4">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        )}

      </div>
    </section>
  );
}
