"use client";

import { usePathname } from "next/navigation";
import WhatsAppIcon from "@/components/shared/WhatsAppIcon";

export default function WhatsAppWidget() {
  const pathname = usePathname();
  const hidden =
    pathname.startsWith("/dashboard") || pathname.startsWith("/auth") || pathname.startsWith("/booking");

  if (hidden) return null;

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919136739178";
  const message = "Hi Flag Journeys, I want to inquire about a custom holiday tour package.";

  return (
    <a
      href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed right-0 top-1/2 -translate-y-1/2 z-[55] hidden md:flex flex-col items-center gap-2.5 bg-[#2E8B8B] hover:bg-[#266f6f] text-white font-bold text-sm py-3.5 px-2.5 rounded-l-2xl shadow-2xl shadow-[#2E8B8B]/30 hover:scale-105 active:scale-95 transition-all duration-300 border border-[#2E8B8B]/40"
    >
      <span className="[writing-mode:vertical-rl] leading-tight">Chat with Travel Expert</span>
      <WhatsAppIcon className="w-5 h-5 text-white shrink-0" />
    </a>
  );
}