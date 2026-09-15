"use client";

import React from "react";
import { Phone, Mail, MapPin, ShieldCheck, HeartHandshake, Award } from "lucide-react";
import WhatsAppIcon from "@/components/shared/WhatsAppIcon";

interface AdFooterProps {
  destinationName?: string;
}

export default function AdFooter({ destinationName = "Holidays" }: AdFooterProps) {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919136739178";
  const salesPhone = process.env.NEXT_PUBLIC_SALES_PHONE || "+919136739178";
  return (
    <footer className="relative bg-[#1C1C1C] text-[#999] pt-14 pb-24 lg:pb-12 border-t border-white/10 overflow-hidden">
      {/* Subtle top accent line matching main site footer */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#2E8B8B]/40 to-transparent" />

      <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-10">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          
          {/* Col 1: Brand & Bio with WhatsApp CTA */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-orange-500 tracking-tighter">FlagJourney</span>
              <span className="text-2xl font-black text-white tracking-tighter">Holidays</span>
            </div>
            <p className="text-[#a8a8a8] text-sm leading-relaxed">
              Delivering 100% personalized, premium local holiday experiences with direct operator pricing and zero hidden fees.
            </p>
            <div className="pt-2">
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 text-xs font-bold transition shadow-sm"
              >
                <WhatsAppIcon className="w-4 h-4" /> Chat on WhatsApp
              </a>
            </div>
          </div>

          {/* Col 2: Why Book With Us */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-white tracking-[0.08em] uppercase">Why Choose Us</h3>
            <ul className="space-y-3 text-sm text-[#a8a8a8]">
              <li className="flex items-center gap-2.5">
                <ShieldCheck size={16} className="text-[#2E8B8B] shrink-0" />
                <span>100% Custom Itineraries</span>
              </li>
              <li className="flex items-center gap-2.5">
                <HeartHandshake size={16} className="text-[#2E8B8B] shrink-0" />
                <span>Direct Local Hotel & Cab Pricing</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Award size={16} className="text-[#2E8B8B] shrink-0" />
                <span>24/7 Dedicated Trip Manager</span>
              </li>
              <li className="flex items-center gap-2.5">
                <ShieldCheck size={16} className="text-[#2E8B8B] shrink-0" />
                <span>Verified Professional Drivers</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Direct Contact Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-white tracking-[0.08em] uppercase">Contact Us</h3>
            <ul className="space-y-3 text-sm text-[#a8a8a8]">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center shrink-0 mt-0.5">
                  <Phone className="w-4 h-4 text-[#2E8B8B]" />
                </div>
                <div>
                  <div className="text-[10px] text-[#777] uppercase font-bold tracking-wider">24/7 Helpline</div>
                  <a href={`tel:${salesPhone.replace(/[^0-9+]/g, "")}`} className="font-bold text-white hover:text-[#2E8B8B] transition">
                    {salesPhone}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center shrink-0 mt-0.5">
                  <Mail className="w-4 h-4 text-[#2E8B8B]" />
                </div>
                <div>
                  <div className="text-[10px] text-[#777] uppercase font-bold tracking-wider">Email Inquiry</div>
                  <a href="mailto:support@flagjourneys.com" className="font-medium text-[#a8a8a8] hover:text-[#2E8B8B] transition">
                    support@flagjourneys.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-[#2E8B8B]" />
                </div>
                <div>
                  <div className="text-[10px] text-[#777] uppercase font-bold tracking-wider">Headquarters</div>
                  <span className="text-[#a8a8a8]">102, Destination Hub, MG Road, New Delhi</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Col 4: Assurance & Trust Box */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#2E8B8B]/10 border border-[#2E8B8B]/20 text-[#2E8B8B] flex items-center justify-center">
              <ShieldCheck size={22} />
            </div>
            <h4 className="text-sm font-bold text-white">Best Price Assurance</h4>
            <p className="text-xs text-[#a8a8a8] leading-relaxed">
              Book directly with verified local experts for total transparency, flexibility, and zero hidden platform commissions.
            </p>
          </div>

        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#777]">
          <p>© {new Date().getFullYear()} Flag Journeys. All Rights Reserved.</p>
          <div className="flex items-center gap-6 text-[#a8a8a8]">
            <span className="hover:text-white transition cursor-pointer">Privacy Policy</span>
            <span className="hover:text-white transition cursor-pointer">Terms of Service</span>
            <span className="hover:text-white transition cursor-pointer">Cancellation Policy</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
