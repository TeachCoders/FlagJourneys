"use client";

import {
  Save,
  Eye,
  Mail,
  Plus,
  RefreshCw,
  Hash,
  Users,
  History,
  MapPin,
  Hotel,
  Car,
  Navigation,
  ImageIcon,
  CheckCircle2,
  XCircle,
  Printer,
  MessageCircle,
} from "lucide-react";
import PageLoader from "@/components/shared/PageLoader";
import BannerImageUpload from "@/components/shared/BannerImageUpload";
import DayItineraryEditor from "@/components/shared/DayItineraryEditor";
import { ReusableModel } from "@/components/shared/reusableModel";
import { DialogTitle } from "@/components/ui/dialog";
import type { PackageItem } from "./packageTypes";

export interface InvoiceMainSectionProps {
  createNewPackage: () => void;
  handleSave: () => void;
  isSaving: boolean;
  setIsPreviewOpen: (val: boolean) => void;
  handleSendInvoice: () => void;
  isSending: boolean;
  selectedPackageId: number | null;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  packageName: string;
  setPackageName: (val: string) => void;
  destination: string;
  setDestination: (val: string) => void;
  payablePrice: number;
  advanceAmount: number;

  quotationNo: string;
  setQuotationNo: (val: string) => void;
  generateQuotationNo: () => string;
  validTill: string;
  setValidTill: (val: string) => void;
  travelDate: string;
  setTravelDate: (val: string) => void;
  duration: string;
  setDuration: (val: string) => void;
  adults: number;
  setAdults: (val: number) => void;
  children: number;
  setChildren: (val: number) => void;

  items: PackageItem[];
  groupedData: Record<string, PackageItem[]>;
  subtotal: number;
  gstRate: number;
  setGstRate: (val: number) => void;
  gstAmount: number;
  discount: number;
  setDiscount: (val: number) => void;

  bannerUrls: string[];
  setBannerUrls: (val: string[]) => void;
  bannerFiles: File[];
  setBannerFiles: (val: File[]) => void;

  itinerary: { day: number; title: string; content: string }[];
  setItinerary: (val: { day: number; title: string; content: string }[]) => void;

  isPreviewOpen: boolean;
  includes: string[];
  excludes: string[];
  notes: string;
  balanceTerms: string;

  packages: any[];
  leadId: number | string;
  handleWhatsApp: () => void;
  generatingPdf: boolean;
}

export default function InvoiceMainSection({
  createNewPackage,
  handleSave,
  isSaving,
  setIsPreviewOpen,
  handleSendInvoice,
  isSending,
  selectedPackageId,
  clientName,
  clientEmail,
  clientPhone,
  packageName,
  setPackageName,
  destination,
  setDestination,
  payablePrice,
  advanceAmount,
  quotationNo,
  setQuotationNo,
  generateQuotationNo,
  validTill,
  setValidTill,
  travelDate,
  setTravelDate,
  duration,
  setDuration,
  adults,
  setAdults,
  children,
  setChildren,
  items,
  groupedData,
  subtotal,
  gstRate,
  setGstRate,
  gstAmount,
  discount,
  setDiscount,
  bannerUrls,
  setBannerUrls,
  bannerFiles,
  setBannerFiles,
  itinerary,
  setItinerary,
  isPreviewOpen,
  includes,
  excludes,
  notes,
  balanceTerms,
  packages,
  leadId,
  handleWhatsApp,
  generatingPdf,
}: InvoiceMainSectionProps) {
  const buildWhatsAppMessage = () => {
    const lines: string[] = [];
    lines.push(`Dear ${clientName || "Guest"},`);
    lines.push("");
    lines.push(`As per our discussion, we've prepared your tour quotation${quotationNo ? ` (#${quotationNo})` : ""}. We hope you'll love the itinerary and pricing we've put together for you!`);
    lines.push("");
    if (packageName || destination) lines.push(`*Package:* ${packageName || destination || "Custom Tour"}`);
    if (duration) lines.push(`*Duration:* ${duration}`);
    if (travelDate) lines.push(`*Travel Date:* ${travelDate}`);
    lines.push("");
    lines.push("*City-wise Services:*");
    const cities = Object.keys(groupedData);
    for (const city of cities) {
      const cityItems = groupedData[city];
      lines.push(`\n> ${city}`);
      for (const item of cityItems) {
        const name = item.ServiceName === "Hotel" ? item.hotelName : item.ServiceName === "Car" ? item.carName : item.guideName;
        const type = item.ServiceName === "Hotel" ? item.hotelType : item.ServiceName === "Car" ? item.carType : item.guideLanguage;
        lines.push(`  - ${item.ServiceName}${name ? `: ${name}` : ""}${type ? ` (${type})` : ""} | ${item.ServcieQty} qty | ₹${Number(item.TotalPrice).toLocaleString("en-IN")}`);
      }
    }
    lines.push("");
    lines.push("*Cost Summary:*");
    lines.push(`  Subtotal: ₹${Number(subtotal).toLocaleString("en-IN")}`);
    lines.push(`  GST (${gstRate}%): ₹${Number(gstAmount).toLocaleString("en-IN")}`);
    if (Number(discount) > 0) lines.push(`  Discount: -₹${Number(discount).toLocaleString("en-IN")}`);
    lines.push(`  *Total: ₹${Number(payablePrice).toLocaleString("en-IN")}*`);
    if (advanceAmount) lines.push(`  Advance: ₹${Number(advanceAmount).toLocaleString("en-IN")}`);
    if (includes.length > 0) {
      lines.push("");
      lines.push("*Inclusions:*");
      lines.push(includes.map(i => `  ✓ ${i}`).join("\n"));
    }
    if (excludes.length > 0) {
      lines.push("");
      lines.push("*Exclusions:*");
      lines.push(excludes.map(e => `  ✗ ${e}`).join("\n"));
    }
    lines.push("");
    lines.push("I've also sent the detailed quotation to your email. Please go through it and let me know if you'd like any changes — we're happy to customize it for you!");
    lines.push("");
    lines.push("Looking forward to making your trip memorable!");
    lines.push(`- ${process.env.NEXT_PUBLIC_BRAND_NAME || "Flag Journeys"}`);
    return lines.join("\n");
  };

  const handlePrint = () => {
    const content = document.getElementById("printable-invoice");
    if (!content) return;

    const printWindow = window.open('', '', 'width=900,height=700');
    if (!printWindow) return;

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(s => s.outerHTML)
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>PACKAGE QUOTATION</title>
          ${styles}
          <style>
            @media print {
              body { -webkit-print-color-adjust: exact; padding: 20px; background: white !important; }
            }
            img { max-width: 100% !important; height: auto !important; }
            .prose img { max-width: 100% !important; height: auto !important; border-radius: 8px; }
          </style>
        </head>
        <body class="bg-white">
          ${content.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b pb-4">
        <h2 className="h6 flex items-center gap-2 text-brand-neutral-dark">
          Package Builder
          {selectedPackageId ? (
            <span className="text-xs font-semibold bg-brand-primary-light text-brand-primary px-2 py-1 rounded">
              Editing Version #{packages.find((inv: any) => inv.id === selectedPackageId)?.version || 1}
            </span>
          ) : (
            <span className="text-xs font-semibold bg-brand-success-light text-brand-success px-2 py-1 rounded">
              New Invoice
            </span>
          )}
        </h2>

        <div className="flex gap-2">
          <button
            onClick={createNewPackage}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-brand-neutral-border rounded-lg text-xs font-bold text-brand-neutral hover:bg-brand-neutral-light transition-colors"
          >
            <Plus size={14} /> New Package
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-1.5 btn-primary disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
          >
            {isSaving ? (
              <PageLoader size="inline" />
            ) : (
              <Save size={14} />
            )}
            Save
          </button>
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-brand-primary text-brand-primary hover:bg-brand-primary-light rounded-lg text-xs font-bold transition-colors"
          >
            <Eye size={14} /> Preview
          </button>
          <button
            onClick={handleSendInvoice}
            disabled={isSending || !selectedPackageId}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
            title="Save package first to send"
          >
            {isSending ? <PageLoader size="inline" /> : <Mail size={14} />}
            Send Email
          </button>
          <button
            onClick={handleWhatsApp}
            disabled={generatingPdf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {generatingPdf ? <PageLoader size="inline" /> : <MessageCircle size={14} />}
            WhatsApp
          </button>
        </div>
      </div>

      <div className="mb-8 border rounded-lg p-4 shadow-sm bg-white">
        <h3 className="font-bold text-brand-neutral mb-4 flex items-center gap-2 text-base">
          <Hash size={16} className="text-brand-primary" /> Quotation & Package Details
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="text-xs font-semibold text-brand-neutral-muted mb-1 block">Quotation No.</label>
            <div className="flex gap-1.5">
              <input
                className="border p-2 rounded w-full text-sm bg-brand-neutral-light"
                value={quotationNo}
                onChange={(e) => setQuotationNo(e.target.value)}
              />
              <button
                onClick={() => setQuotationNo(generateQuotationNo())}
                className="p-2 border rounded text-brand-neutral-muted hover:bg-brand-neutral-light hover:text-brand-primary transition-colors"
                title="Regenerate Quotation Number"
                type="button"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-brand-neutral-muted mb-1 block">Valid Till</label>
            <input
              type="date"
              className="border p-2 rounded w-full text-sm"
              value={validTill}
              onChange={(e) => setValidTill(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-brand-neutral-muted mb-1 block">Travel Date</label>
            <input
              type="date"
              className="border p-2 rounded w-full text-sm"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-brand-neutral-muted mb-1 block">Duration</label>
            <input
              className="border p-2 rounded w-full text-sm"
              placeholder="e.g. 4N / 5D"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="col-span-2">
            <label className="text-xs font-semibold text-brand-neutral-muted mb-1 block">Package Name</label>
            <input
              className="border p-2 rounded w-full text-sm"
              placeholder="e.g. Golden Triangle Tour"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold text-brand-neutral-muted mb-1 block">Destination</label>
            <input
              className="border p-2 rounded w-full text-sm"
              placeholder="e.g. Delhi - Agra - Jaipur"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-brand-neutral-muted mb-1 flex items-center gap-1">
              <Users size={12} /> No. of Adults
            </label>
            <input
              type="number"
              min={0}
              className="border p-2 rounded w-full text-sm"
              value={adults === 0 ? "" : adults}
              placeholder="0"
              onChange={(e) => setAdults(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-brand-neutral-muted mb-1 flex items-center gap-1">
              <Users size={12} /> No. of Children
            </label>
            <input
              type="number"
              min={0}
              className="border p-2 rounded w-full text-sm"
              value={children === 0 ? "" : children}
              placeholder="0"
              onChange={(e) => setChildren(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {items.length > 0 && (
        <div className="border-t pt-6 text-right space-y-3 bg-brand-neutral-light p-4 rounded-lg mb-8">
          <div className="flex justify-end gap-4 items-center">
            <span className="text-brand-neutral text-sm">Subtotal:</span>
            <span className="font-semibold text-brand-neutral-dark w-28 text-base">₹{subtotal}</span>
          </div>
          <div className="flex justify-end items-center gap-4">
            <span className="text-brand-neutral text-sm">GST Rate (%)</span>
            <input
              type="number"
              className="w-16 border p-1 rounded text-center text-sm bg-white focus:ring-1 focus:ring-brand-primary"
              value={gstRate}
              onChange={(e) => setGstRate(Number(e.target.value))}
            />
            <span className="w-28 font-semibold text-brand-neutral-dark text-base">: ₹{gstAmount}</span>
          </div>
          <div className="flex justify-end items-center gap-4">
            <span className="text-brand-neutral text-sm">Discount (₹)</span>
            <input
              type="number"
              className="w-28 border p-1.5 rounded text-right text-sm bg-white focus:ring-1 focus:ring-brand-primary font-semibold text-brand-danger"
              value={discount === 0 ? "" : discount}
              placeholder="0"
              onChange={(e) => setDiscount(Number(e.target.value))}
            />
          </div>
          <div className="border-t pt-3 flex justify-end gap-4 items-center">
            <span className="text-base font-bold text-brand-neutral-dark">Payable Price:</span>
            <span className="text-lg font-extrabold text-brand-primary w-28">₹{payablePrice}</span>
          </div>
        </div>
      )}

      <div className="border rounded-lg p-4 shadow-sm bg-white mb-4">
        <h3 className="font-bold text-brand-neutral mb-3 flex items-center gap-2 text-sm">
          <ImageIcon size={16} className="text-brand-primary" /> Banner Images
        </h3>
        <BannerImageUpload
          value={bannerUrls}
          onChange={setBannerUrls}
          onFilesSelect={setBannerFiles}
          maxImages={15}
        />
      </div>

      <div className="border rounded-lg p-4 shadow-sm bg-white mb-4">
        <h3 className="font-bold text-brand-neutral mb-3 flex items-center gap-2 text-sm">
          <History size={16} className="text-brand-primary" /> Day-by-Day Itinerary
        </h3>
        <DayItineraryEditor value={itinerary} onChange={setItinerary} />
      </div>

      <ReusableModel
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        contentClassName="max-w-5xl sm:max-w-5xl md:max-w-6xl w-full max-h-[90vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0 print:max-w-none print:shadow-none p-8"
      >
        <DialogTitle className="sr-only">Package Quotation Preview</DialogTitle>

        <div className="flex justify-end gap-2 mb-6 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 btn-primary text-white rounded-lg text-sm font-bold shadow-sm transition-colors"
          >
            <Printer size={16} /> Print / PDF
          </button>
        </div>

        <div id="printable-invoice" className="print:block bg-white p-6 md:p-8" style={{ overflowWrap: "break-word", wordBreak: "break-word" }}>
          {/* Header Row: Brand Logo & Quote Info */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-5 mb-5 border-b-2 border-teal-600 gap-4">
            <div>
              <img
                src="/logo-with-name.png"
                alt="Flag Journeys"
                className="h-14 w-auto object-contain mb-2"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {packageName || "LUXURY TOUR PACKAGE"}
              </h1>
              <div className="flex flex-wrap gap-2 mt-2">
                {destination && (
                  <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded">
                    📍 {destination}
                  </span>
                )}
                {duration && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded">
                    ⏱️ {duration}
                  </span>
                )}
                {(adults > 0 || children > 0) && (
                  <span className="text-xs font-bold text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded">
                    👥 {adults} Adults{children > 0 ? `, ${children} Children` : ""}
                  </span>
                )}
              </div>
            </div>

            <div className="text-left md:text-right">
              <span className="inline-block bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded mb-1.5">
                OFFICIAL QUOTATION
              </span>
              <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">
                {(process.env.NEXT_PUBLIC_BRAND_NAME || "FLAG JOURNEYS").toUpperCase()}
              </h2>
              <div className="text-xs text-slate-500 space-y-0.5 mt-1 font-medium">
                {quotationNo && <p className="font-mono text-slate-700 font-bold">Quote #{quotationNo}</p>}
                <p>Date: {new Date().toLocaleDateString("en-IN", { dateStyle: "medium" })}</p>
                {validTill && (
                  <p className="text-teal-600 font-semibold">Valid Till: {new Date(validTill).toLocaleDateString("en-IN", { dateStyle: "medium" })}</p>
                )}
              </div>
            </div>
          </div>

          {/* Traveller Info Bar - Clean Inline Strip (No Outer Box) */}
          {(clientName || clientEmail || clientPhone) && (
            <div className="py-3.5 mb-6 border-b border-slate-200 grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              {clientName && (
                <div>
                  <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">Prepared For</span>
                  <span className="font-bold text-slate-900 text-sm">{clientName}</span>
                </div>
              )}
              {clientPhone && (
                <div>
                  <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">Phone / WhatsApp</span>
                  <span className="font-semibold text-slate-800">{clientPhone}</span>
                </div>
              )}
              {clientEmail && (
                <div>
                  <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">Email</span>
                  <span className="font-semibold text-slate-800">{clientEmail}</span>
                </div>
              )}
            </div>
          )}

          {Array.isArray(itinerary) && itinerary.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-bold text-brand-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                <History size={16} /> Day-by-Day Itinerary
              </h3>
              <div className="space-y-4">
                {itinerary.map((day, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 bg-indigo-100 text-brand-primary rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                        {day.day || idx + 1}
                      </div>
                      {idx < itinerary.length - 1 && <div className="w-0.5 flex-1 bg-indigo-100 mt-1" />}
                    </div>
                    <div className="pb-4 flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900">{day.title || `Day ${idx + 1}`}</h4>
                      {day.content && (
                        <div className="mt-1 text-sm text-brand-neutral prose prose-sm max-w-none [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg" dangerouslySetInnerHTML={{ __html: day.content }} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(() => {
            const hotelItems = items.filter(i => i.ServiceName === "Hotel" && (i.hotelName || i.location));
            if (hotelItems.length === 0) return null;
            return (
              <div className="mb-8">
                <h3 className="text-sm font-bold text-brand-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Hotel size={16} /> Hotel Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {hotelItems.map((item, idx) => (
                    <div key={idx} className="border border-brand-neutral-border rounded-lg p-4 bg-white">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs text-slate-400 font-semibold uppercase">{item.location}</p>
                          <p className="font-bold text-brand-neutral-dark mt-1">{item.hotelName || "Hotel TBD"}</p>
                        </div>
                        {item.hotelType && (
                          <span className="text-[10px] font-bold bg-brand-warning-light text-brand-warning px-2 py-0.5 rounded-full">
                            {item.hotelType}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-brand-neutral-muted">
                        <span>{item.ServcieQty} Nights</span>
                        <span>₹{item.UnitPrice}/night</span>
                        <span className="font-bold text-brand-neutral">₹{item.TotalPrice}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {(() => {
            const carItems = items.filter(i => i.ServiceName === "Car" && (i.carName || i.location));
            if (carItems.length === 0) return null;
            return (
              <div className="mb-8">
                <h3 className="text-sm font-bold text-brand-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Car size={16} /> Transport Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {carItems.map((item, idx) => (
                    <div key={idx} className="border border-brand-neutral-border rounded-lg p-4 bg-white">
                      <p className="font-bold text-brand-neutral-dark">{item.carName || "Car TBD"}</p>
                      {item.carOwnerName && <p className="text-xs text-brand-neutral-muted mt-0.5">Owner: {item.carOwnerName}</p>}
                      <div className="flex items-center gap-3 mt-2 text-xs text-brand-neutral-muted">
                        {item.carType && <span className="bg-slate-100 px-2 py-0.5 rounded">{item.carType}</span>}
                        <span>{item.ServcieQty} Days</span>
                        <span>₹{item.UnitPrice}/day</span>
                        <span className="font-bold text-brand-neutral">₹{item.TotalPrice}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {(() => {
            const guideItems = items.filter(i => i.ServiceName === "Guide" && (i.guideName || i.location));
            if (guideItems.length === 0) return null;
            return (
              <div className="mb-8">
                <h3 className="text-sm font-bold text-brand-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Navigation size={16} /> Guide Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {guideItems.map((item, idx) => (
                    <div key={idx} className="border border-brand-neutral-border rounded-lg p-4 bg-white">
                      <p className="font-bold text-brand-neutral-dark">{item.guideName || "Guide TBD"}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-brand-neutral-muted">
                        {item.guideLanguage && <span className="bg-slate-100 px-2 py-0.5 rounded">{item.guideLanguage}</span>}
                        <span>{item.location}</span>
                        <span>{item.ServcieQty} Days</span>
                        <span className="font-bold text-brand-neutral">₹{item.TotalPrice}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          <div className="mb-8">
            <h3 className="text-sm font-bold text-brand-primary uppercase tracking-wider mb-3">Cost Summary</h3>
            <div className="space-y-4">
              {Object.entries(groupedData).map(([loc, locItems]: [string, any]) => (
                <div key={loc} className="border border-slate-100 rounded-lg p-4 bg-brand-neutral-light/50">
                  <h4 className="font-bold text-brand-primary mb-2 border-b border-slate-100 pb-1.5 text-sm flex items-center gap-1.5">
                    <MapPin size={14} /> {loc}
                  </h4>
                  <table className="tbl">
                    <thead>
                      <tr className="bg-brand-neutral-light border-b border-brand-neutral-border">
                        <th className="tbl-th-sm">Service</th>
                        <th className="tbl-th-sm">Details</th>
                        <th className="tbl-th-sm text-right">Unit Price</th>
                        <th className="tbl-th-sm text-right">Qty</th>
                        <th className="tbl-th-sm text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-neutral-light">
                      {locItems.map((item: any, idx: number) => {
                        let details = "";
                        if (item.ServiceName === "Hotel" && item.hotelName) {
                          details = `${item.hotelName}${item.hotelType ? " (" + item.hotelType + ")" : ""}`;
                        } else if (item.ServiceName === "Car" && item.carName) {
                          details = `${item.carName}${item.carOwnerName ? " - Owner: " + item.carOwnerName : ""}${item.carType ? " (" + item.carType + ")" : ""}`;
                        } else if (item.ServiceName === "Guide" && item.guideName) {
                          details = `${item.guideName}${item.guideLanguage ? " (" + item.guideLanguage + ")" : ""}`;
                        }
                        return (
                          <tr key={idx} className="hover:bg-brand-neutral-light/50 transition-colors">
                            <td className="py-2 font-medium text-brand-neutral">{item.ServiceName}</td>
                            <td className="py-2 text-brand-neutral-muted text-[11px]">{details || "---"}</td>
                            <td className="py-2 text-right text-brand-neutral">₹{item.UnitPrice}</td>
                            <td className="py-2 text-right text-brand-neutral">{item.ServcieQty}</td>
                            <td className="py-2 text-right font-semibold text-brand-neutral-dark">₹{item.TotalPrice}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-brand-neutral-border pt-6 mt-8 space-y-2.5 max-w-sm ml-auto text-sm">
            <div className="flex justify-between text-brand-neutral-muted">
              <span>Subtotal:</span>
              <span className="font-semibold text-brand-neutral">₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-brand-neutral-muted">
              <span>GST ({gstRate}%):</span>
              <span className="font-semibold text-brand-neutral">₹{gstAmount}</span>
            </div>
            {Number(discount) > 0 && (
              <div className="flex justify-between text-brand-danger">
                <span>Discount:</span>
                <span className="font-semibold">- ₹{discount}</span>
              </div>
            )}
            <div className="flex justify-between border-t-2 border-brand-primary pt-3 text-xl font-bold text-brand-neutral-dark">
              <span>Total Cost:</span>
              <span className="text-brand-primary">₹{payablePrice}</span>
            </div>
            {advanceAmount > 0 && (
              <div className="flex justify-between text-sm text-brand-success font-semibold mt-1">
                <span>Advance Required:</span>
                <span>₹{advanceAmount}</span>
              </div>
            )}
          </div>

          {(includes.length > 0 || excludes.length > 0) && (
            <div className="grid grid-cols-2 gap-6 mt-8 pt-6 border-t border-brand-neutral-border">
              {includes.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-brand-success uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> What&apos;s Included
                  </h3>
                  <ul className="space-y-1.5 text-sm text-brand-neutral">
                    {includes.map((inc, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">&#10004;</span>
                        <span>{inc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {excludes.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-brand-danger uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <XCircle size={14} /> What&apos;s Excluded
                  </h3>
                  <ul className="space-y-1.5 text-sm text-brand-neutral">
                    {excludes.map((exc, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-brand-danger mt-0.5">&#10008;</span>
                        <span>{exc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {notes && (
            <div className="mt-6 pt-6 border-t border-brand-neutral-border">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Important Notes</h3>
              <ul className="space-y-1 text-sm text-brand-neutral">
                {notes.split("\n").filter(Boolean).map((line, idx) => {
                  const cleanLine = line.replace(/^[•\-\*\s]+/, "").trim();
                  if (!cleanLine) return null;
                  return <li key={idx}>&#8226; {cleanLine}</li>;
                })}
              </ul>
            </div>
          )}

          {(advanceAmount > 0 || balanceTerms) && (
            <div className="mt-6 pt-6 border-t border-brand-neutral-border">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Payment Terms</h3>
              <div className="text-sm text-brand-neutral space-y-1">
                {advanceAmount > 0 && <p>Advance: ₹{advanceAmount}</p>}
                <p>Balance: {balanceTerms || "Before Arrival"}</p>
              </div>
            </div>
          )}

          <div className="mt-10 pt-6 border-t border-brand-neutral-border text-center">
            <p className="text-sm font-bold text-brand-neutral">Thank You for Choosing {process.env.NEXT_PUBLIC_BRAND_NAME || "Flag Journeys"}</p>
            <p className="text-xs text-slate-400 mt-1">Premium Travel Experiences</p>
          </div>
        </div>
      </ReusableModel>
    </>
  );
}
