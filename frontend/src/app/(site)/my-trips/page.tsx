"use client";

import React, { useState, useEffect } from "react";
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  FileText, 
  Upload, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  DollarSign, 
  Download, 
  MessageSquare,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Building2,
  Car,
  Utensils
} from "lucide-react";
import Link from "next/link";

export default function TravellerPortalPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [travellerData, setTravellerData] = useState<any>(null);

  // Payment upload state
  const [amount, setAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [isSubmittingReceipt, setIsSubmittingReceipt] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState("");

  // Check saved session
  useEffect(() => {
    const saved = localStorage.getItem("flagjourney_traveller_session");
    if (saved) {
      try {
        setTravellerData(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem("flagjourney_traveller_session");
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMsg("Please enter your Phone Number or Traveller ID.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/traveller-lead/public/portal-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), password: password.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to log in. Please check your credentials.");
      }

      setTravellerData(data.data);
      localStorage.setItem("flagjourney_traveller_session", JSON.stringify(data.data));
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("flagjourney_traveller_session");
    setTravellerData(null);
    setUploadSuccessMsg("");
  };

  const handleReceiptUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      alert("Please enter a valid payment amount.");
      return;
    }

    setIsSubmittingReceipt(true);
    setUploadSuccessMsg("");

    try {
      const res = await fetch("/api/traveller-lead/public/portal-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          travellerId: travellerData.travellerId || travellerData.id,
          amount: Number(amount),
          transactionId: transactionId.trim(),
          paymentScreenshotUrl: screenshotUrl.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to upload receipt.");
      }

      setUploadSuccessMsg("Payment receipt uploaded successfully! Founder & Travel Manager have been notified via Telegram.");
      setAmount("");
      setTransactionId("");
      setScreenshotUrl("");

      // Update local state payments
      if (data.data) {
        setTravellerData((prev: any) => ({
          ...prev,
          payments: [data.data, ...(prev.payments || [])],
        }));
      }
    } catch (err: any) {
      alert(err.message || "Error submitting payment receipt.");
    } finally {
      setIsSubmittingReceipt(false);
    }
  };

  const latestInvoice = travellerData?.invoices?.[0];
  const assignedAgent = travellerData?.assignedTo;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Branding */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#D4561A] mb-1">
              <ShieldCheck size={16} /> Official Traveller Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C1C1C]">
              Flag Journeys <span className="text-[#2E8B8B]">Trip Portal</span>
            </h1>
          </div>

          {travellerData && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold bg-slate-200 px-3 py-1.5 rounded-full text-slate-700">
                ID: {travellerData.travellerId}
              </span>
              <button
                onClick={handleLogout}
                className="text-xs font-bold text-red-600 hover:text-red-700 underline"
              >
                Log Out
              </button>
            </div>
          )}
        </div>

        {/* LOGGED OUT STATE — LOGIN FORM */}
        {!travellerData ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-200/80 max-w-lg mx-auto">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-gradient-to-tr from-[#FFF5F0] to-[#FFE6D9] text-[#D4561A] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-[#FFD0B8]">
                <User size={28} />
              </div>
              <h2 className="text-xl font-bold text-[#1C1C1C]">Track Your Trip & Upload Receipt</h2>
              <p className="text-sm text-slate-500 mt-1">
                Enter your Phone Number or Traveller ID (sent to your WhatsApp/Email) to access your trip details.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                <AlertCircle size={18} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Phone Number or Traveller ID *
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 text-slate-400" size={18} />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. 9876543210 or AH-1042"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4561A] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Password / PIN (Optional)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter PIN if provided by agent"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4561A] transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-[#D4561A] to-[#B34310] hover:from-[#B34310] hover:to-[#96370C] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                {isLoading ? "Accessing Portal..." : "Access Traveller Portal"}
                <ArrowRight size={18} />
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400">
                Need assistance? Call FlagJourney Concierge at{" "}
                <a href={`tel:${(process.env.NEXT_PUBLIC_SALES_PHONE || "+919136739178").replace(/[^0-9+]/g, "")}`} className="text-[#2E8B8B] font-bold hover:underline">
                  {process.env.NEXT_PUBLIC_SALES_PHONE || "+91 91367 39178"}
                </a>
              </p>
            </div>
          </div>
        ) : (
          /* LOGGED IN TRAVELLER DASHBOARD */
          <div className="space-y-8">
            {/* Welcome & Status Banner */}
            <div className="bg-gradient-to-br from-[#1C1C1C] via-[#2A2A2A] to-[#121212] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-10 translate-x-8 -translate-y-8">
                <Sparkles size={240} />
              </div>

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full mb-3">
                  <CheckCircle2 size={14} /> Official Verified Booking
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Welcome, {travellerData.name}! 👋
                </h2>
                <p className="text-slate-300 text-sm mt-1 max-w-xl">
                  Your customized travel itinerary, assigned manager details, and official payment upload form are below.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10 text-xs">
                  <div>
                    <span className="text-slate-400 block">Traveller ID</span>
                    <span className="font-bold text-white text-sm">{travellerData.travellerId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Booking Status</span>
                    <span className="font-bold uppercase text-amber-400 text-sm">
                      {travellerData.bookingStatus || "PENDING"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Destination</span>
                    <span className="font-bold text-white text-sm">
                      {travellerData.destination || travellerData.country || "India"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Group Size</span>
                    <span className="font-bold text-white text-sm">
                      {travellerData.groupSize ? `${travellerData.groupSize} Persons` : "Custom"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Assigned Manager & Concierge Info */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-[#1C1C1C] mb-4 flex items-center gap-2">
                <User size={20} className="text-[#D4561A]" /> Assigned Travel Advisor
              </h3>

              {assignedAgent ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#2E8B8B] text-white flex items-center justify-center font-black text-lg shadow-sm">
                      {assignedAgent.name?.[0] || "A"}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{assignedAgent.name}</h4>
                      <p className="text-xs text-slate-500">{assignedAgent.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {assignedAgent.mobile && (
                      <a
                        href={`https://wa.me/${assignedAgent.mobile.replace(/\D/g, "")}?text=Hi%20${encodeURIComponent(assignedAgent.name)},%20I%20am%20inquiring%20about%20my%20trip%20ID%20${travellerData.travellerId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <MessageSquare size={16} /> Chat on WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                  <Clock size={16} /> A dedicated Travel Advisor is being assigned to your request. You will receive an instant quote shortly!
                </div>
              )}
            </div>

            {/* Quotation & Itinerary Details */}
            {latestInvoice && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-[#1C1C1C] flex items-center gap-2">
                    <FileText size={20} className="text-[#2E8B8B]" /> Your Official Quotation
                  </h3>
                  <span className="text-xs font-bold text-[#D4561A] bg-[#FFF5F0] px-3 py-1 rounded-full border border-[#FFD0B8]">
                    Quote #{latestInvoice.quotationNo || `QT-${latestInvoice.id}`}
                  </span>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-[#FFF5F0]/60 to-[#FAF9F6] border border-[#FFD0B8]/60 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200/80">
                    <div>
                      <h4 className="text-xl font-black text-[#1C1C1C]">
                        {latestInvoice.packageName || "Custom Tour Package"}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Duration: {latestInvoice.duration || "Multi-day"} • Travel Date: {latestInvoice.travelDate || "Flexible"}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-xs text-slate-500 block">Total Quoted Price</span>
                      <span className="text-2xl font-extrabold text-[#D4561A]">
                        ₹{Number(latestInvoice.grandTotal || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {latestInvoice.includes?.length > 0 && (
                    <div>
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">Inclusions:</span>
                      <div className="flex flex-wrap gap-2">
                        {latestInvoice.includes.map((inc: string, i: number) => (
                          <span key={i} className="text-xs font-semibold bg-white border border-slate-200 text-slate-700 px-3 py-1 rounded-lg">
                            ✓ {inc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* DIRECT PAYMENT RECEIPT UPLOAD (Anti-Fraud Founder Shield) */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border-2 border-[#D4561A]/20">
              <div className="mb-6">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#D4561A] mb-1">
                  <ShieldCheck size={16} /> Direct Customer Payment Verification
                </div>
                <h3 className="text-xl font-bold text-[#1C1C1C]">Upload Advance Payment Receipt</h3>
                <p className="text-xs text-slate-500 mt-1">
                  If you have transferred advance booking amount to freeze your hotels & cabs, upload the receipt/screenshot here. This directly registers your payment into Flag Journeys official audit ledger!
                </p>
              </div>

              {uploadSuccessMsg && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center gap-2">
                  <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
                  <span>{uploadSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleReceiptUpload} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Amount Paid (₹) *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                      <input
                        type="number"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="e.g. 10000"
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4561A]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Transaction UTR / Reference No.
                    </label>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="e.g. UPI/1234567890"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4561A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Payment Screenshot URL / Link
                  </label>
                  <input
                    type="url"
                    value={screenshotUrl}
                    onChange={(e) => setScreenshotUrl(e.target.value)}
                    placeholder="e.g. https://drive.google.com/... or uploaded image URL"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4561A]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingReceipt}
                  className="w-full py-3 bg-[#D4561A] hover:bg-[#B34310] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <Upload size={16} />
                  {isSubmittingReceipt ? "Submitting Payment Proof..." : "Confirm & Submit Payment Proof"}
                </button>
              </form>

              {/* Uploaded Payments History */}
              {travellerData.payments?.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                    Your Payment Upload History:
                  </h4>
                  <div className="space-y-2">
                    {travellerData.payments.map((p: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                          <div>
                            <span className="font-bold text-slate-800">₹{p.amount}</span>
                            {p.transactionId && <span className="text-slate-400 ml-2 font-mono">({p.transactionId})</span>}
                          </div>
                        </div>
                        <span className="font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] uppercase">
                          {p.status || "PENDING VERIFICATION"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
