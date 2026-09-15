  "use client";
  import React, { useState, useEffect } from "react";
  import { 
    MapPin, Navigation,
    Users, Baby, Calendar, DollarSign, ChevronDown, Check,
    Save, Pencil, X, BadgeCheck, Car, Hotel, Mail
  } from "lucide-react";
  import PageLoader from "@/components/shared/PageLoader";
  import { useSaveRequirementsMutation, useSendRequirementsEmailMutation, useMarkRequirementsSentMutation } from "../api/useLeadFollowup";
  import { format } from "date-fns";
  import WhatsAppShareBtn from "@/components/shared/whatsAppShareBtn";
  import { API_BASE } from "@/lib/apiClient";
  import SearchableMultiSelect from "@/components/shared/SearchableMultiSelect";

  const TOUR_TYPES = [
    { value: "Nature", label: "Nature" },
    { value: "Rafting", label: "Rafting" },
    { value: "Wildlife", label: "Wildlife" },
    { value: "Hillstation", label: "Hill Station" },
    { value: "Vacation", label: "Vacation" },
    { value: "Honeymoon", label: "Honeymoon" },
    { value: "Pilgrimage", label: "Pilgrimage" },
    { value: "Family Trip", label: "Family Trip" },
    { value: "Business", label: "Business" },
  ];

  interface Props {
    leadId: string;
    lead?: any;
  }

  export default function TravellerRequirementsForm({ leadId, lead }: Props) {
    const existing = lead?.requirement;
    const hasData = !!existing;
    console.log("lead test", lead)
    const tourBooking = lead?.tourBookings?.[0];

    const toDateString = (d: string | Date | null | undefined) => {
      if (!d) return "";
      return new Date(d).toISOString().split("T")[0];
    };

    const formatDateDisplay = (d: string | Date | null | undefined) => {
      if (!d) return "—";
      try { return format(new Date(d), "dd MMM yyyy"); } catch { return "—"; }
    };

    const initialData = {
      cityNames: existing?.cityNames ?? "",
      serviceType: existing?.serviceType ?? "Tour, Hotel, Car",
      tourTypes: (existing?.tourTypes ?? []) as string[],
      startDate: toDateString(existing?.startDate) || toDateString(tourBooking?.travelStartDate),
      endDate: toDateString(existing?.endDate) || toDateString(tourBooking?.travelEndDate),
      adults: existing?.adults ?? tourBooking?.noOfPersons ?? 0,
      children: existing?.children ?? tourBooking?.noOfChildren ?? 0,
      budget: existing?.budget ?? 0,
      needGuide: existing?.needGuide ?? false,
    };

    const [formData, setFormData] = useState(initialData);
    const [isEditMode, setIsEditMode] = useState(!hasData); // if no data, open in edit mode directly
    const [saved, setSaved] = useState(false);

    useEffect(() => {
      if (existing) {
        const populated = {
          cityNames: existing.cityNames ?? "",
          serviceType: existing.serviceType ?? "Tour, Hotel, Car",
          tourTypes: existing.tourTypes ?? [],
          startDate: toDateString(existing.startDate) || toDateString(tourBooking?.travelStartDate),
          endDate: toDateString(existing.endDate) || toDateString(tourBooking?.travelEndDate),
          adults: existing.adults ?? tourBooking?.noOfPersons ?? 0,
          children: existing.children ?? tourBooking?.noOfChildren ?? 0,
          budget: existing.budget ?? 0,
          needGuide: existing.needGuide ?? false,
        };
        setFormData(populated);
        setIsEditMode(false); // after save, switch back to view
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lead?.requirement?.updatedAt]);

    const saveMutation = useSaveRequirementsMutation();

    const handleSave = () => {
      setSaved(false);
      saveMutation.mutate({
        leadId,
        payload: {
          serviceType: formData.serviceType,
          cityNames: formData.cityNames,
          tourTypes: formData.tourTypes,
          startDate: formData.startDate || undefined,
          endDate: formData.endDate || undefined,
          adults: formData.adults,
          children: formData.children,
          budget: formData.budget,
          needGuide: formData.needGuide,
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

    // ─── VIEW MODE ────────────────────────────────────────────────────
    const { mutate: sendEmailReq, isPending: sendingEmail } = useSendRequirementsEmailMutation();
    const { mutate: markReqSent } = useMarkRequirementsSentMutation();
    const requirementsUrl = `${API_BASE}/traveller-lead/${leadId}/requirements-preview`;
    const passwordText = lead?.defaultPassword ? `\n🔑 Password: ${lead.defaultPassword}` : "";
    const portalLoginUrl = process.env.NEXT_PUBLIC_BOOKING_PORTAL_URL || "https://flagjourneys.com/my-trips";
    const waFooter = `\n\n🆔 Traveller ID: ${lead?.travellerId || ""}${passwordText}\n🌐 Portal Login: ${portalLoginUrl}\n📄 View Details: ${requirementsUrl}`;

    if (!isEditMode && hasData) {
      const isEmailSent = existing.isEmailSent;
      const isWhatsappSent = existing.isWhatsappSent;
      return (
        <div className="bg-white border border-brand-neutral-border rounded-xl overflow-hidden shadow-sm">
          {/* Header */}
          <div className="px-5 py-4 border-b border-brand-neutral-border bg-brand-neutral-light flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-emerald-500" />
              <div>
                <h2 className="text-lg font-bold text-brand-neutral-dark">Traveller Requirements</h2>
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
                  message={`Dear ${lead?.name || "Guest"}, thank you for sharing your travel requirements with us! 🙏 We've noted everything — Cities: ${existing.cityNames || "—"}, Dates: ${existing.startDate ? `${formatDateDisplay(existing.startDate)} → ${formatDateDisplay(existing.endDate)}` : "—"}, Budget: ₹${Number(existing.budget || 0).toLocaleString("en-IN")}. Our team is already working on a customized package for you. We'll share it with you soon! - ${process.env.NEXT_PUBLIC_BRAND_NAME || "Flag Journeys"}${waFooter}`}
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

          {/* View Grid */}
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <ViewCard
              icon={<MapPin className="h-4 w-4 text-indigo-500" />}
              label="Cities to Cover"
              value={existing.cityNames || "—"}
            />

            <ViewCard
              icon={<Car className="h-4 w-4 text-indigo-500" />}
              label="Service Type"
              value={existing.serviceType || "—"}
            />

            <ViewCard
              icon={<Navigation className="h-4 w-4 text-indigo-500" />}
              label="Tour Types"
              value={existing.tourTypes?.length > 0 ? existing.tourTypes.join(", ") : "—"}
            />

            <ViewCard
              icon={<Calendar className="h-4 w-4 text-indigo-500" />}
              label="Travel Dates"
              value={
                existing.startDate
                  ? `${formatDateDisplay(existing.startDate)} → ${formatDateDisplay(existing.endDate)}`
                  : "—"
              }
            />

            <ViewCard
              icon={<Users className="h-4 w-4 text-indigo-500" />}
              label="Adults / Children"
              value={`${existing.adults ?? 0} Adults, ${existing.children ?? 0} Children`}
            />

            <ViewCard
              icon={<DollarSign className="h-4 w-4 text-indigo-500" />}
              label="Approx Budget"
              value={existing.budget ? `₹${Number(existing.budget).toLocaleString("en-IN")}` : "—"}
            />

            <div className="bg-brand-neutral-light rounded-xl p-4 flex items-start gap-3">
              <Hotel className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Extra Services</p>
                <div className="flex flex-wrap gap-2">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${existing.needGuide ? "bg-brand-success-light text-brand-success" : "bg-slate-200 text-brand-neutral-muted"}`}>
                    {existing.needGuide ? "✓" : "✗"} Guide
                  </span>
                </div>
              </div>
            </div>
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
              {hasData ? "Edit Requirements" : "Traveller Requirements"}
            </h2>
            <p className="text-xs text-brand-neutral-muted mt-0.5">Follow this sequence to ask questions and build trust.</p>
          </div>
          <div className="flex items-center gap-2">
            {saved && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-brand-success flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Saved!
                </span>
                <WhatsAppShareBtn
                  phone={lead?.phone}
                  message={`Dear ${lead?.name || "Guest"}, thank you for sharing your travel requirements with us! 🙏 We've noted everything — Cities: ${formData.cityNames || "—"}, Dates: ${formData.startDate ? `${format(new Date(formData.startDate), "dd MMM")} → ${format(new Date(formData.endDate), "dd MMM yyyy")}` : "—"}, Budget: ₹${Number(formData.budget || 0).toLocaleString("en-IN")}. Our team is already working on a customized package for you. We'll share it with you soon! - ${process.env.NEXT_PUBLIC_BRAND_NAME || "Flag Journeys"}${waFooter}`}
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

          {/* Step 1 */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">1. Destination & Service</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-brand-neutral">Which cities do you want to cover?</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.cityNames}
                    onChange={(e) => setFormData({ ...formData, cityNames: e.target.value })}
                    placeholder="e.g. Manali, Shimla, Kullu"
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-brand-neutral"
                  />
                  <MapPin className="h-4 w-4 text-slate-400 absolute left-4 top-3 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-brand-neutral">What service are you looking for?</label>
                <div className="relative">
                  <select
                    value={formData.serviceType}
                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-brand-neutral font-medium"
                  >
                    <option value="Tour, Hotel, Car">Tour, Hotel, Car</option>
                    <option value="Only Car">Only Car</option>
                    <option value="Only Hotel">Only Hotel</option>
                  </select>
                  <ChevronDown className="h-4 w-4 text-slate-400 absolute right-4 top-3 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">2. Occasion / Vibe</h3>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-brand-neutral">What type of trip is this?</label>
              <SearchableMultiSelect
                options={TOUR_TYPES.map((t) => ({ id: t.value, title: t.label }))}
                selectedIds={formData.tourTypes}
                onChange={(ids) => setFormData((prev) => ({ ...prev, tourTypes: ids as string[] }))}
                placeholder="Select preferred tour types..."
                searchPlaceholder="Search tour types..."
              />
            </div>
          </div>

          {/* Step 3 */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">3. Logistics (When & Who)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="space-y-1.5 flex flex-col">
                <label className="text-xs font-bold text-brand-neutral-muted flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Start Date</label>
                <input type="date" value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-brand-neutral"
                />
              </div>
              <div className="space-y-1.5 flex flex-col">
                <label className="text-xs font-bold text-brand-neutral-muted flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> End Date</label>
                <input type="date" value={formData.endDate} min={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-brand-neutral"
                />
              </div>
              <div className="space-y-1.5 flex flex-col">
                <label className="text-xs font-bold text-brand-neutral-muted flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Total Adults</label>
                <input type="number" min="0" value={formData.adults || ""}
                  onChange={(e) => setFormData({ ...formData, adults: parseInt(e.target.value) || 0 })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all" placeholder="e.g. 2"
                />
              </div>
              <div className="space-y-1.5 flex flex-col">
                <label className="text-xs font-bold text-brand-neutral-muted flex items-center gap-1.5"><Baby className="h-3.5 w-3.5" /> Total Children</label>
                <input type="number" min="0" value={formData.children || ""}
                  onChange={(e) => setFormData({ ...formData, children: parseInt(e.target.value) || 0 })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all" placeholder="e.g. 1"
                />
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">4. Budget & Extras</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="space-y-1.5 flex flex-col">
                <label className="text-xs font-bold text-brand-neutral-muted flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" /> Approx Budget (₹)</label>
                <input type="number" min="0" step="1000" value={formData.budget || ""}
                  onChange={(e) => setFormData({ ...formData, budget: parseInt(e.target.value) || 0 })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all" placeholder="e.g. 50000"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" className="sr-only peer" checked={formData.needGuide}
                    onChange={(e) => setFormData({ ...formData, needGuide: e.target.checked })} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                </div>
                <span className="text-sm font-semibold text-brand-neutral">Guide Required?</span>
              </label>
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
