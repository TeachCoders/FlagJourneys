"use client";

import React, { useState, useEffect } from "react";
import { PhoneCall, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { detectGeoFromIP } from "@/feature/leads/data/countries";
import { successToast, errorToast } from "@/components/shared/tost";
import WhatsAppIcon from "@/components/shared/WhatsAppIcon";

interface MobileStickyBarProps {
  destinationName?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
}

export default function MobileStickyBar({
  destinationName = "Holiday Package",
  phoneNumber = process.env.NEXT_PUBLIC_SALES_PHONE || "+919136739178",
  whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919136739178",
}: MobileStickyBarProps) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", travelDate: "" });
  const [geoMeta, setGeoMeta] = useState<{ ip: string; location: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    detectGeoFromIP().then((geo) => {
      if (geo?.ip) setGeoMeta({ ip: geo.ip, location: geo.location });
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return errorToast("Please enter your name");
    if (!formData.phone.trim() || formData.phone.length < 8) return errorToast("Please enter a valid mobile number");

    setIsSubmitting(true);
    try {
      await apiClient.post("/traveller-lead", {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        travelDate: formData.travelDate || undefined,
        ipAddress: geoMeta?.ip,
        location: geoMeta?.location,
        country: destinationName,
        pageReference: `WhatsApp Price Request (${destinationName})`,
      });
      successToast("Lead saved! Redirecting to WhatsApp...");
      setShowModal(false);
      
      const text = encodeURIComponent(`Hi Flag Journeys, I am ${formData.name}. I need price details for ${destinationName}.`);
      window.open(`https://wa.me/${whatsappNumber}?text=${text}`, "_blank");
      setFormData({ name: "", phone: "", travelDate: "" });
    } catch (err: any) {
      errorToast(err?.response?.data?.message || "Failed to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi Flag Journeys, I am interested in ${destinationName} deals. Please share customized package itinerary & pricing.`)}`;

  return (
    <>
      {/* Mobile Sticky Bar (visible only on small screens) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 p-3 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] flex items-center gap-2">
        <button
          onClick={() => setShowModal(true)}
          className="flex-1 py-3 bg-[#2E8B8B] hover:bg-[#266f6f] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition shadow-lg shadow-[#2E8B8B]/20"
        >
          <WhatsAppIcon className="h-4 w-4" />
          <span>Price on WhatsApp</span>
        </button>

        <button
          onClick={() => setShowModal(true)}
          className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition shadow-lg shadow-orange-500/20"
        >
          <PhoneCall size={15} />
          <span>Request Callback</span>
        </button>
      </div>

      {/* Mobile Popup Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl relative text-slate-900 animate-in slide-in-from-bottom duration-300">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 text-xl font-bold p-1"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider bg-orange-100 text-orange-600 px-2.5 py-0.5 rounded-full border border-orange-200">
                100% Free Consultation
              </span>
            </div>
            <h3 className="text-xl font-black text-slate-900">
              Get Discount Quote ({destinationName})
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Enter your mobile number to receive exact hotel & cab price quote on WhatsApp.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Mobile Number (WhatsApp) *</label>
                <input
                  type="tel"
                  required
                  maxLength={20}
                  placeholder="+1 234 567 8900"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/[^\d+-\s]/g, "") })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Travel Date</label>
                <input
                  type="date"
                  value={formData.travelDate}
                  onChange={(e) => setFormData({ ...formData, travelDate: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold rounded-xl shadow-xl transition text-sm"
              >
                {isSubmitting ? "Submitting..." : "Request Call Back & Instant Quote"}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
                <ShieldCheck size={12} className="text-emerald-500" />
                <span>Zero Spam Guarantee. Your number is protected.</span>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
