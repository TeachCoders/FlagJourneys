"use client";
import React, { useState, useEffect } from "react";
import {
  MapPin, Navigation, Calendar, Clock, Users, Car,
  DollarSign, MessageSquare, Save, Pencil, X,
  BadgeCheck, Mail, Check, ChevronDown
} from "lucide-react";
import PageLoader from "@/components/shared/PageLoader";
import { useSaveRequirementsMutation, useSendRequirementsEmailMutation, useMarkRequirementsSentMutation } from "../api/useLeadFollowup";
import { format } from "date-fns";
import WhatsAppShareBtn from "@/components/shared/whatsAppShareBtn";
import { API_BASE } from "@/lib/apiClient";

const TRAVEL_TIMES = [
  "Early Morning (4AM - 6AM)",
  "Morning (6AM - 12PM)",
  "Afternoon (12PM - 4PM)",
  "Evening (4PM - 8PM)",
  "Night (8PM - 12AM)",
  "Flexible",
];

const VEHICLE_OPTIONS = [
  "Maruti Dzire", "Honda City", "Hyundai Verna", "Hyundai Aura",
  "Hyundai Creta", "Maruti Brezza", "Mahindra XUV700", "Kia Seltos",
  "Toyota Innova Crysta", "Toyota Innova Hycross", "Maruti Ertiga", "Kia Carens",
  "Toyota Fortuner", "Toyota Camry",
  "Tempo Traveller 9-Seater", "Tempo Traveller 12-Seater", "Tempo Traveller 17-Seater",
  "Maruti Swift", "Honda Amaze",
];

interface Props {
  leadId: string;
  lead?: any;
}

export default function CarRequirementsForm({ leadId, lead }: Props) {
  const existing = lead?.requirement;
  const hasData = !!existing;
  const vehicleBooking = lead?.vehicleBookings?.[0];

  const toDateString = (d: string | Date | null | undefined) => {
    if (!d) return "";
    return new Date(d).toISOString().split("T")[0];
  };

  const formatDateDisplay = (d: string | Date | null | undefined) => {
    if (!d) return "—";
    try { return format(new Date(d), "dd MMM yyyy"); } catch { return "—"; }
  };

  const initialData = {
    pickupLocation: existing?.pickupLocation ?? "",
    dropLocation: existing?.dropLocation ?? "",
    travelDate: toDateString(existing?.startDate) || toDateString(lead?.travelDate),
    travelTime: existing?.travelTime ?? "",
    adults: existing?.adults ?? 0,
    vehiclePreference: existing?.vehiclePreference ?? vehicleBooking?.vehicleName ?? "",
    budget: existing?.budget ?? 0,
    specialRequirements: existing?.specialRequirements ?? "",
  };

  const [formData, setFormData] = useState(initialData);
  const [isEditMode, setIsEditMode] = useState(!hasData);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (existing) {
      setFormData({
        pickupLocation: existing.pickupLocation ?? "",
        dropLocation: existing.dropLocation ?? "",
        travelDate: toDateString(existing.startDate) || toDateString(lead?.travelDate),
        travelTime: existing.travelTime ?? "",
        adults: existing.adults ?? 0,
        vehiclePreference: existing.vehiclePreference ?? vehicleBooking?.vehicleName ?? "",
        budget: existing.budget ?? 0,
        specialRequirements: existing.specialRequirements ?? "",
      });
      setIsEditMode(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead?.requirement?.updatedAt]);

  const saveMutation = useSaveRequirementsMutation();

  const handleSave = () => {
    if (!formData.pickupLocation.trim()) {
      return;
    }
    setSaved(false);
    saveMutation.mutate({
      leadId,
      payload: {
        serviceType: "Only Car",
        pickupLocation: formData.pickupLocation,
        dropLocation: formData.dropLocation,
        startDate: formData.travelDate || undefined,
        travelTime: formData.travelTime,
        adults: formData.adults,
        vehiclePreference: formData.vehiclePreference,
        budget: formData.budget,
        specialRequirements: formData.specialRequirements,
      },
    }, {
      onSuccess: () => { setSaved(true); setIsEditMode(false); },
    });
  };

  const handleCancel = () => {
    setFormData(initialData);
    setIsEditMode(false);
  };

  const isLoading = saveMutation.isPending;

  const { mutate: sendEmailReq, isPending: sendingEmail } = useSendRequirementsEmailMutation();
  const { mutate: markReqSent } = useMarkRequirementsSentMutation();
  const requirementsUrl = `${API_BASE}/traveller-lead/${leadId}/requirements-preview`;
  const passwordText = lead?.defaultPassword ? `\n🔑 Password: ${lead.defaultPassword}` : "";
  const portalLoginUrl = process.env.NEXT_PUBLIC_BOOKING_PORTAL_URL || "https://flagjourneys.com/my-trips";
  const waFooter = `\n\n🆔 Traveller ID: ${lead?.travellerId || ""}${passwordText}\n🌐 Portal Login: ${portalLoginUrl}\n📄 View Details: ${requirementsUrl}`;

  // ─── VIEW MODE ────────────────────────────────────────────────────
  if (!isEditMode && hasData) {
    const isEmailSent = existing.isEmailSent;
    const isWhatsappSent = existing.isWhatsappSent;
    return (
      <div className="bg-white border border-brand-neutral-border rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-brand-neutral-border bg-brand-neutral-light flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BadgeCheck className="h-5 w-5 text-emerald-500" />
            <div>
              <h2 className="text-lg font-bold text-brand-neutral-dark">Car Requirements</h2>
              <p className="text-xs text-brand-neutral-muted mt-0.5">Filled on {formatDateDisplay(existing?.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => sendEmailReq({ leadId })}
              disabled={sendingEmail || isEmailSent}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-brand-primary text-brand-primary hover:bg-brand-primary-light disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-bold transition-colors"
            >
              {sendingEmail ? <PageLoader size="inline" /> : <Mail size={14} />}
              {isEmailSent ? "Email Sent ✓" : "Send Email"}
            </button>
            <WhatsAppShareBtn
              phone={lead?.phone}
              message={`Dear ${lead?.name || "Guest"}, your car booking requirements are noted! 🚗 Pickup: ${formData.pickupLocation || "—"}, Drop: ${formData.dropLocation || "—"}, Date: ${formData.travelDate ? formatDateDisplay(formData.travelDate) : "—"}, Vehicle: ${formData.vehiclePreference || "—"}. We'll share the quotation soon! - ${process.env.NEXT_PUBLIC_BRAND_NAME || "Flag Journeys"}${waFooter}`}
              disabled={isWhatsappSent}
              onClick={() => markReqSent({ leadId })}
              label={isWhatsappSent ? "WhatsApp Sent ✓" : "WhatsApp"}
            />
            <button
              onClick={() => setIsEditMode(true)}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-brand-neutral rounded-lg text-sm font-semibold hover:bg-brand-neutral-light transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <ViewCard
            icon={<MapPin className="h-4 w-4 text-blue-500" />}
            label="Pickup Location"
            value={existing.pickupLocation || "—"}
          />
          <ViewCard
            icon={<Navigation className="h-4 w-4 text-blue-500" />}
            label="Drop Location"
            value={existing.dropLocation || "—"}
          />
          <ViewCard
            icon={<Calendar className="h-4 w-4 text-blue-500" />}
            label="Travel Date"
            value={existing.startDate ? formatDateDisplay(existing.startDate) : "—"}
          />
          <ViewCard
            icon={<Clock className="h-4 w-4 text-blue-500" />}
            label="Travel Time"
            value={existing.travelTime || "—"}
          />
          <ViewCard
            icon={<Users className="h-4 w-4 text-blue-500" />}
            label="Passengers"
            value={`${existing.adults ?? 0} Person(s)`}
          />
          <ViewCard
            icon={<Car className="h-4 w-4 text-blue-500" />}
            label="Vehicle Preference"
            value={existing.vehiclePreference || "—"}
          />
          <ViewCard
            icon={<DollarSign className="h-4 w-4 text-blue-500" />}
            label="Approx Budget"
            value={existing.budget ? `₹${Number(existing.budget).toLocaleString("en-IN")}` : "—"}
          />
          {existing.specialRequirements && (
            <div className="bg-brand-neutral-light rounded-xl p-4 flex items-start gap-3 sm:col-span-2 lg:col-span-2">
              <MessageSquare className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Special Requirements</p>
                <p className="text-sm font-semibold text-brand-neutral-dark leading-snug">{existing.specialRequirements}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── EDIT / FILL MODE ─────────────────────────────────────────────
  return (
    <div className="bg-white border border-brand-neutral-border rounded-xl overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-brand-neutral-border bg-brand-neutral-light flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-brand-neutral-dark">
            {hasData ? "Edit Car Requirements" : "Car Requirements"}
          </h2>
          <p className="text-xs text-brand-neutral-muted mt-0.5">Talk to the traveller and fill in the details below.</p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-brand-success flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> Saved!
              </span>
              <WhatsAppShareBtn
                phone={lead?.phone}
                message={`Dear ${lead?.name || "Guest"}, your car booking requirements are noted! 🚗 Pickup: ${formData.pickupLocation || "—"}, Drop: ${formData.dropLocation || "—"}, Date: ${formData.travelDate ? format(new Date(formData.travelDate), "dd MMM yyyy") : "—"}, Vehicle: ${formData.vehiclePreference || "—"}. We'll share the quotation soon! - ${process.env.NEXT_PUBLIC_BRAND_NAME || "Flag Journeys"}${waFooter}`}
                label="Share on WhatsApp"
              />
            </div>
          )}
          {hasData && (
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-3 py-2 border border-slate-300 text-brand-neutral rounded-lg text-sm font-semibold hover:bg-brand-neutral-light transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="btn-primary disabled:opacity-60 px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm flex items-center gap-2"
          >
            {isLoading ? <PageLoader size="inline" /> : <Save className="h-4 w-4" />}
            {isLoading ? "Saving..." : "Save Requirements"}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-8">

        {/* Step 1 — Route Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">1. Route Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-brand-neutral">Pickup Location <span className="text-rose-500">*</span></label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.pickupLocation}
                  onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                  placeholder="e.g. Delhi Airport (DEL)"
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-brand-neutral"
                />
                <MapPin className="h-4 w-4 text-slate-400 absolute left-4 top-3 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-brand-neutral">Drop Location</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.dropLocation}
                  onChange={(e) => setFormData({ ...formData, dropLocation: e.target.value })}
                  placeholder="e.g. Manali Hotel"
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-brand-neutral"
                />
                <Navigation className="h-4 w-4 text-slate-400 absolute left-4 top-3 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 — Travel Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">2. Travel Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="space-y-1.5 flex flex-col">
              <label className="text-xs font-bold text-brand-neutral-muted flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Travel Date</label>
              <input type="date" value={formData.travelDate}
                onChange={(e) => setFormData({ ...formData, travelDate: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-brand-neutral"
              />
            </div>
            <div className="space-y-1.5 flex flex-col">
              <label className="text-xs font-bold text-brand-neutral-muted flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Preferred Time</label>
              <select
                value={formData.travelTime}
                onChange={(e) => setFormData({ ...formData, travelTime: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-brand-neutral appearance-none"
              >
                <option value="">Select time</option>
                {TRAVEL_TIMES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5 flex flex-col">
              <label className="text-xs font-bold text-brand-neutral-muted flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Passengers</label>
              <input type="number" min="1" value={formData.adults || ""}
                onChange={(e) => setFormData({ ...formData, adults: parseInt(e.target.value) || 0 })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all" placeholder="e.g. 4"
              />
            </div>
          </div>
        </div>

        {/* Step 3 — Vehicle & Budget */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">3. Vehicle & Budget</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-brand-neutral">Vehicle Preference</label>
              <select
                value={formData.vehiclePreference}
                onChange={(e) => setFormData({ ...formData, vehiclePreference: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-brand-neutral"
              >
                <option value="">Select vehicle</option>
                {VEHICLE_OPTIONS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5 flex flex-col">
              <label className="text-xs font-bold text-brand-neutral-muted flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" /> Approx Budget (₹)</label>
              <input type="number" min="0" step="500" value={formData.budget || ""}
                onChange={(e) => setFormData({ ...formData, budget: parseInt(e.target.value) || 0 })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all" placeholder="e.g. 5000"
              />
            </div>
          </div>
        </div>

        {/* Step 4 — Notes */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">4. Special Requirements</h3>
          <div>
            <label className="block text-sm font-semibold text-brand-neutral mb-2">Any special needs? (AC, child seat, music, stops, etc.)</label>
            <textarea
              value={formData.specialRequirements}
              onChange={(e) => setFormData({ ...formData, specialRequirements: e.target.value })}
              rows={3}
              placeholder="e.g. Need AC car, 2 child seats, stop at Chandigarh for lunch..."
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-brand-neutral resize-none"
            />
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Helper View Card ─────────────────────────────────────────────
function ViewCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-brand-neutral-light rounded-xl p-4 flex items-start gap-3">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-sm font-semibold text-brand-neutral-dark leading-snug">{value}</p>
      </div>
    </div>
  );
}
