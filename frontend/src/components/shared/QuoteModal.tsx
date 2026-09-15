"use client";

import React, { ReactNode, useState } from "react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import TourBookingForm from "@/feature/leads/components/TourBookingForm";
import Link from "next/link";

const SALES_PHONE = process.env.NEXT_PUBLIC_SALES_PHONE || "+919136739178";

const FacebookIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3V2z" />
  </svg>
);

const TwitterIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
  </svg>
);

const InstagramIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

export function QuoteModal({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-5xl w-[95vw] p-0 overflow-hidden bg-white rounded-[24px] md:rounded-[32px] border-none shadow-2xl">
        <DialogTitle className="sr-only">Request a Quote</DialogTitle>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr] max-h-[90vh] md:max-h-[85vh]">

          {/* Left Panel - Information */}
          <div className="p-8 md:p-12 flex flex-col bg-[#F3F4F6] border-b md:border-b-0 md:border-r border-slate-200">
            <h2 className="text-[32px] md:text-[40px] font-bold text-[#3B4254] mb-8 leading-tight tracking-tight">
              How It Works
            </h2>

            <ul className="space-y-6 mb-12 flex-1">
              <li className="flex gap-4">
                <div className="w-2 h-2 rounded-full bg-[#D4561A] mt-2.5 shrink-0" />
                <p className="text-[#5B6375] text-[15px] md:text-base leading-relaxed">
                  Tell us details of your holiday plan.
                </p>
              </li>
              <li className="flex gap-4">
                <div className="w-2 h-2 rounded-full bg-[#D4561A] mt-2.5 shrink-0" />
                <p className="text-[#5B6375] text-[15px] md:text-base leading-relaxed">
                  After you submit the form, one of our travel experts will get back to you with customised holiday package based on your requirement, within 24 hours.
                </p>
              </li>
              <li className="flex gap-4">
                <div className="w-2 h-2 rounded-full bg-[#D4561A] mt-2.5 shrink-0" />
                <p className="text-[#5B6375] text-[15px] md:text-base leading-relaxed">
                  Grab the deal and start packing your bags for an indelible holiday with Flag Journeys.
                </p>
              </li>
            </ul>

            <div className="mt-auto">
              <div className="flex items-center gap-4 mb-8">
                <Link href="#" className="w-12 h-12 bg-[#E96A1E] text-white rounded-xl flex items-center justify-center hover:bg-[#d65f18] transition-colors shadow-md">
                  <FacebookIcon />
                </Link>
                <Link href="#" className="w-12 h-12 bg-[#E96A1E] text-white rounded-xl flex items-center justify-center hover:bg-[#d65f18] transition-colors shadow-md">
                  <TwitterIcon />
                </Link>
                <Link href="#" className="w-12 h-12 bg-[#E96A1E] text-white rounded-xl flex items-center justify-center hover:bg-[#d65f18] transition-colors shadow-md">
                  <InstagramIcon />
                </Link>
              </div>

              <div className="w-full h-[1px] bg-slate-300 mb-6" />

              <div className="text-center md:text-left">
                <p className="text-[#2E8B8B] text-sm md:text-base mb-1 font-bold">
                  🔒 100% Free Consultation & Instant Quote
                </p>

              </div>
            </div>
          </div>

          {/* Right Panel - Form */}
          <div className="p-8 md:p-12 bg-white flex flex-col overflow-y-auto custom-scrollbar relative">
            <div className="mb-8 flex items-end gap-2">
              <h2 className="text-[32px] md:text-[40px] font-normal text-[#3B4254] leading-none">
                Request a <span className="font-bold text-[#E96A1E] relative inline-block">
                  QUOTE
                  <div className="absolute -bottom-2 left-0 w-full h-[2px] bg-[#E96A1E] opacity-60" />
                </span>
              </h2>
            </div>

            <TourBookingForm embedded hideHeader onSuccess={() => setOpen(false)} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
