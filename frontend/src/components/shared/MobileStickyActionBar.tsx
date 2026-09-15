"use client";

import { usePathname } from "next/navigation";
import { Phone, Sparkles } from "lucide-react";
import { QuoteModal } from "@/components/shared/QuoteModal";
import WhatsAppIcon from "@/components/shared/WhatsAppIcon";

export default function MobileStickyActionBar() {
  const pathname = usePathname();
  const hidden =
    pathname.startsWith("/offers") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/booking");

  if (hidden) return null;

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919136739178"; // Official WhatsApp
  const phone = process.env.NEXT_PUBLIC_SALES_PHONE || "+918447273005"; // Call number (footer matches)

  return (
    <aside aria-label="Quick Actions" className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 p-2.5 shadow-[0_-10px_20px_rgb(0,0,0,0.06)]">
      <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
        {/* Call Button */}
        <a
          href={`tel:${phone}`}
          className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-[#1C1C1C] transition-all active:scale-95 border border-slate-200"
        >
          <Phone size={18} className="text-[#2E8B8B] mb-0.5" />
          <span className="text-[11px] font-bold">Call Now</span>
        </a>

        {/* WhatsApp Button */}
        <a
          href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hi Flag Journeys, I want to inquire about a custom holiday tour package.")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-[#2E8B8B] text-white border border-[#2E8B8B] hover:bg-[#266f6f] transition-all active:scale-95"
        >
          <WhatsAppIcon className="w-[18px] h-[18px] text-white mb-0.5" />
          <span className="text-[11px] font-bold">WhatsApp</span>
        </a>

        {/* Instant Quote Button */}
        <QuoteModal>
          <button
            type="button"
            className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-[#D4561A] text-white hover:bg-[#b84a16] transition-all active:scale-95 shadow-md shadow-[#D4561A]/30"
          >
            <Sparkles size={18} className="mb-0.5 animate-pulse" />
            <span className="text-[11px] font-bold">Get Quote</span>
          </button>
        </QuoteModal>
      </div>
    </aside>
  );
}
