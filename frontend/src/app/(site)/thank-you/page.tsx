import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  PhoneCall,
  Home,
  Clock,
  Sparkles,
} from "lucide-react";
import WhatsAppIcon from "@/components/shared/WhatsAppIcon";

export const metadata: Metadata = {
  title: "Thank You | Flag Journeys - Inquiry Received",
  description:
    "Thank you for contacting Flag Journeys. Your travel inquiry has been received and our destination specialists will contact you shortly.",
};

const SALES_PHONE = process.env.NEXT_PUBLIC_SALES_PHONE || "+91 91367 39178";
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919136739178";
const CLEAN_PHONE = SALES_PHONE.replace(/[^0-9+]/g, "");

export default async function ThankYouPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-slate-800 py-12 md:py-20 px-4 flex items-center justify-center">
      <div className="max-w-3xl w-full mx-auto space-y-8">
        {/* Main Clean Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-md space-y-8 text-center sm:text-left">
          {/* Header Section without dark background */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-8 border-b border-slate-100">
            <div className="w-20 h-20 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 size={44} />
            </div>
            <div className="space-y-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/60 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-1">
                <Sparkles size={12} />
                <span>Submission Successful</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
                Thank You for Choosing Flag Journeys!
              </h1>
              <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
                Your travel inquiry has been received. Our destination specialists are working on your custom plan and will connect with you shortly.
              </p>
            </div>
          </div>

          {/* What Happens Next Section */}
          <div className="space-y-5 pt-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 font-heading flex items-center justify-center sm:justify-start gap-2">
              <Clock size={20} className="text-[#2E8B8B]" />
              <span>What Happens Next?</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-[#2E8B8B]/10 text-[#2E8B8B] flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Inquiry Review</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Our destination expert analyzes your preferences, dates, and budget.
                </p>
              </div>

              <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-[#D4561A]/10 text-[#D4561A] flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Tailored Proposal</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  We draft a personalized itinerary with hotels, cabs, and transparent costs.
                </p>
              </div>

              <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Direct Contact</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  We connect via Phone / WhatsApp to fine-tune every detail according to your needs.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <a
                href={`tel:${CLEAN_PHONE}`}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#2E8B8B] hover:bg-[#246e6e] text-white font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <PhoneCall size={18} />
                <span>Call Sales ({SALES_PHONE})</span>
              </a>

              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <WhatsAppIcon className="w-[18px] h-[18px]" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>

            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              <Home size={18} />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
