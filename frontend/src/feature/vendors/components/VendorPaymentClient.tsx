"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronDown, ChevronRight, Users, IndianRupee, Hotel,
  Car, Compass, CreditCard, CheckCircle2,
  TrendingUp, Banknote, Plus, Mail, MessageCircle, Calendar, ShieldCheck, Eye, Share2
} from "lucide-react";
import { useGetVendorAssignments, useRecordVendorPayment, useCreateVendorPayment, useSharePaymentEmail } from "../api/useVendorHooks";
import { formatLocalDateTime } from "@/lib/dateUtils";
import { FileUpload } from "@/components/shared/fileUpload";
import apiClient from "@/lib/apiClient";
import PageLoader from "@/components/shared/PageLoader";
import StatsCardGrid from "@/components/shared/StatsCardGrid";
import PrivatePageHeading from "@/components/shared/PrivatePageHeading";
import FilterBox from "@/components/shared/FilterBox";
import TableWraper from "@/components/shared/TableWraper";
import EmptyState from "@/components/shared/EmptyState";

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  Hotel: <Hotel className="h-4 w-4" />,
  Car: <Car className="h-4 w-4" />,
  Guide: <Compass className="h-4 w-4" />,
};

const STATUS_COLORS: Record<string, string> = {
  UPCOMING: "bg-brand-info-light text-brand-info border-blue-200",
  ONGOING: "bg-brand-warning-light text-brand-warning border-amber-200",
  COMPLETED: "bg-brand-success-light text-brand-success border-emerald-200",
  CANCELLED: "bg-brand-danger-light text-brand-danger border-red-200",
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PAID: "bg-brand-success-light text-brand-success",
  PARTIAL: "bg-brand-warning-light text-brand-warning",
  PENDING: "bg-brand-neutral-light text-brand-neutral",
  OVERDUE: "bg-brand-danger-light text-brand-danger",
};

function calcDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  const diff = new Date(endDate).getTime() - new Date(startDate).getTime();
  return Math.max(1, Math.ceil(diff / 86400000));
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return formatLocalDateTime(d, { month: "short", day: "numeric", year: "numeric" });
}

export default function VendorPaymentClient() {
  const { assignments, isLoading } = useGetVendorAssignments();
  const { mutate: recordPayment, isPending: recordingPayment } = useRecordVendorPayment();
  const { mutate: createPayment, isPending: creatingPayment } = useCreateVendorPayment();

  const [search, setSearch] = useState("");
  const [expandedAssignments, setExpandedAssignments] = useState<Set<number>>(new Set());
  const [recordModal, setRecordModal] = useState<{ paymentId: number; vendorName: string; pending: number } | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("BANK_TRANSFER");
  const [payTxnId, setPayTxnId] = useState("");
  const [payRemarks, setPayRemarks] = useState("");
  const [paySlip, setPaySlip] = useState<File | null>(null);
  const [uploadingSlip, setUploadingSlip] = useState(false);
  const [reviewModal, setReviewModal] = useState<{ payment: any; vendorName: string } | null>(null);
  const [shareEmailModal, setShareEmailModal] = useState<{ vendorId: number; vendorName: string; vendorMobile: string } | null>(null);
  const [shareEmailInput, setShareEmailInput] = useState("");
  const { mutate: shareEmail, isPending: sendingEmail } = useSharePaymentEmail();

  // Group assignments by vendor
  const vendorGroups = useMemo(() => {
    const map = new Map<number, { vendor: any; assignments: any[] }>();
    for (const a of assignments || []) {
      const vid = a.vendor?.id;
      if (!vid) continue;
      if (!map.has(vid)) map.set(vid, { vendor: a.vendor, assignments: [] });
      map.get(vid)!.assignments.push(a);
    }
    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      const filtered = new Map<number, { vendor: any; assignments: any[] }>();
      for (const [vid, group] of map) {
        const matchedAssignments = group.assignments.filter(
          (a: any) =>
            a.traveller?.name?.toLowerCase().includes(q) ||
            a.traveller?.travellerId?.toLowerCase().includes(q) ||
            a.services?.some((s: string) => s.toLowerCase().includes(q))
        );
        if (matchedAssignments.length > 0 || (group.vendor?.vendarCompanyName || group.vendor?.vendarName)?.toLowerCase().includes(q)) {
          filtered.set(vid, { ...group, assignments: matchedAssignments.length > 0 ? matchedAssignments : group.assignments });
        }
      }
      return filtered;
    }
    return map;
  }, [assignments, search]);

  // Calculate totals per vendor
  const vendorTotals = useMemo(() => {
    const totals = new Map<number, { totalAmount: number; totalPaid: number; totalPending: number }>();
    for (const [vid, group] of vendorGroups) {
      let totalAmount = 0;
      let totalPaid = 0;
      let totalPending = 0;
      for (const a of group.assignments) {
        totalAmount += a.totalAmount || 0;
        for (const p of a.payments || []) {
          totalPaid += p.paidAmount || 0;
          totalPending += p.pendingAmount || 0;
        }
      }
      totals.set(vid, { totalAmount, totalPaid, totalPending });
    }
    return totals;
  }, [vendorGroups]);

  const toggleAssignment = (aid: number) => {
    setExpandedAssignments((prev) => {
      const next = new Set(prev);
      if (next.has(aid)) next.delete(aid);
      else next.add(aid);
      return next;
    });
  };

  const handleRecordPayment = async () => {
    if (!recordModal || !payAmount || Number(payAmount) <= 0) return;

    setUploadingSlip(true);
    let slipUrl: string | null = null;

    if (paySlip) {
      try {
        const formData = new FormData();
        formData.append("folder", "documents");
        formData.append("file", paySlip);
        const uploadRes = await apiClient.post("/upload", formData);
        slipUrl = uploadRes.data?.url || uploadRes.data?.data?.url || null;
      } catch (err) {
        console.error("Slip upload failed:", err);
      }
    }

    recordPayment(
      {
        id: recordModal.paymentId,
        payload: {
          payAmount: Number(payAmount),
          paymentMethod: payMethod,
          transactionId: payTxnId || null,
          remarks: payRemarks || null,
          paymentSlip: slipUrl,
        },
      },
      {
        onSuccess: () => {
          setRecordModal(null);
          setPayAmount("");
          setPayTxnId("");
          setPayRemarks("");
          setPaySlip(null);
        },
      }
    );
    setUploadingSlip(false);
  };

  // Auto-create payment record if none exists, then open modal
  const handlePayClick = (assignment: any) => {
    const pending = (assignment.payments || []).find((p: any) => p.paymentStatus !== "PAID");
    if (pending) {
      setRecordModal({ paymentId: pending.id, vendorName: assignment.vendor?.vendarCompanyName || assignment.vendor?.vendarName || "Vendor", pending: pending.pendingAmount });
    } else {
      // Create a new payment record for this assignment
      createPayment(
        {
          vendorId: assignment.vendorId,
          assignmentId: assignment.id,
          amount: assignment.totalAmount || 0,
          paymentType: "SERVICE_FEE",
          paymentMethod: "BANK_TRANSFER",
        },
        {
          onSuccess: (res: any) => {
            const newPayment = res?.data;
            if (newPayment) {
              setRecordModal({ paymentId: newPayment.id, vendorName: assignment.vendor?.vendarCompanyName || assignment.vendor?.vendarName || "Vendor", pending: newPayment.pendingAmount || newPayment.amount });
            }
          },
        }
      );
    }
  };

  if (isLoading) {
    return <PageLoader size="page" />;
  }

  const totalVendors = vendorGroups.size;
  const totalAssignments = assignments?.length || 0;
  const totalPayable = Array.from(vendorTotals.values()).reduce((s, v) => s + v.totalAmount, 0);
  const totalReceived = Array.from(vendorTotals.values()).reduce((s, v) => s + v.totalPaid, 0);

  return (
    <div className="space-y-5">
      <PrivatePageHeading
        icon={IndianRupee}
        title="Vendor Payments"
        description="Track vendor assignments and installment payments"
      />

      <StatsCardGrid
        items={[
          { label: "Total Vendors", value: totalVendors, icon: Users },
          { label: "Total Assignments", value: totalAssignments, icon: TrendingUp },
          { label: "Total Payable", value: `₹${totalPayable.toLocaleString()}`, icon: IndianRupee },
          { label: "Total Received", value: `₹${totalReceived.toLocaleString()}`, icon: Banknote },
        ]}
        columns={4}
        size="md"
      />

      <FilterBox
        search={{ value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Search by vendor, traveller name, or service..." }}
      />

      {/* ── Traveller Table ── */}
      <TableWraper variant="brand">
        {(!assignments || assignments.length === 0) ? (
          <EmptyState 
            title="No vendor assignments found"
            icon={Users}
            className="border-0 shadow-none bg-transparent"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr className="bg-brand-neutral-light border-b border-brand-neutral-border">
                  <th className="tbl-th">Traveller Name</th>
                  <th className="tbl-th">Vendor</th>
                  <th className="tbl-th-right">Final Amount</th>
                  <th className="tbl-th-center">No. of Bookings</th>
                  <th className="tbl-th-center">Pay Now</th>
                  <th className="tbl-th-center w-10"></th>
                </tr>
              </thead>
              <tbody>
                {(assignments || []).map((a: any) => {
                  const isExpanded = expandedAssignments.has(a.id);
                  const services: string[] = a.services || [];
                  const serviceWiseAmount: Record<string, number> = (a.serviceWiseAmount as Record<string, number>) || {};
                  const serviceWiseDetails: Record<string, any> = (a.serviceWiseDetails as Record<string, any>) || {};
                  const assignmentPaid = (a.payments || []).reduce((s: number, p: any) => s + (p.paidAmount || 0), 0);
                  const assignmentPending = (a.payments || []).reduce((s: number, p: any) => s + (p.pendingAmount || 0), 0);
                  const hasNoPaymentRecord = !(a.payments && a.payments.length > 0);
                  const isAssignmentPending = assignmentPending > 0 || hasNoPaymentRecord;

                  return (
                    <React.Fragment key={a.id}>
                      <tr
                        onClick={() => toggleAssignment(a.id)}
                        className={`border-b border-slate-100 cursor-pointer transition-colors ${isExpanded ? "bg-brand-primary-light/50" : "hover:bg-brand-neutral-light"}`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />}
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shrink-0">
                              <span className="text-[9px] font-bold text-white">{(a.traveller?.name || "T")?.charAt(0)?.toUpperCase()}</span>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{a.traveller?.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{a.traveller?.travellerId} · {a.vendor?.vendarCompanyName || a.vendor?.vendarName || "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-xs text-brand-neutral">{a.vendor?.vendarCompanyName || a.vendor?.vendarName || "—"}</p>
                          <p className="text-[10px] text-slate-400">{a.vendor?.vendarServiceType || ""}</p>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <p className="text-sm font-black text-slate-900">₹{(a.totalAmount || 0).toLocaleString()}</p>
                          {isAssignmentPending ? (
                            <p className="text-[10px] font-bold text-brand-warning">{hasNoPaymentRecord ? "Not paid yet" : `₹${assignmentPending.toLocaleString()} due`}</p>
                          ) : (
                            <p className="text-[10px] font-bold text-brand-success">Fully Paid</p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {services.map((s: string) => (
                              <span key={s} className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-brand-neutral-light text-brand-neutral">
                                {SERVICE_ICONS[s] || null} {s}
                              </span>
                            ))}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">{services.length} service{services.length !== 1 ? "s" : ""}</p>
                        </td>
                        <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          {isAssignmentPending && (
                            <button
                              onClick={() => handlePayClick(a)}
                              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 transition-all shadow-sm"
                            >
                              <IndianRupee className="h-3 w-3" /> Pay Now
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400 mx-auto" /> : <ChevronRight className="h-4 w-4 text-slate-400 mx-auto" />}
                        </td>
                      </tr>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="p-0">
                             <div className="bg-brand-neutral-light/80 border-t border-slate-100 px-6 py-4 space-y-4">
                              {/* ── Service Breakdown Table ── */}
                              {services.length > 0 && (
                                <div className="bg-brand-neutral-light border border-brand-neutral-border rounded-xl overflow-hidden">
                                  <div className="px-4 py-2.5 border-b border-brand-neutral-border">
                                    <p className="text-[10px] font-bold text-brand-neutral-muted uppercase tracking-wider">Service Breakdown</p>
                                  </div>
                                  <table className="tbl-xs">
                                    <thead>
                                      <tr className="border-b border-brand-neutral-border bg-white">
                                         <th className="tbl-th px-3 py-2">Service</th>
                                         <th className="tbl-th px-3 py-2">City</th>
                                         <th className="tbl-th px-3 py-2">Check-in</th>
                                         <th className="tbl-th px-3 py-2">Check-out</th>
                                         <th className="tbl-th-right px-3 py-2">Days</th>
                                         <th className="tbl-th-right px-3 py-2">Price/Unit</th>
                                         <th className="tbl-th-right px-3 py-2">Total</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-brand-neutral-light">
                                       {services.map((s: string) => {
                                        const rawDetail = serviceWiseDetails[s] || {};
                                        const detail = Array.isArray(rawDetail) ? rawDetail[0] || {} : rawDetail;
                                        const amount = serviceWiseAmount[s] || 0;
                                        const start = detail.startDate || detail.checkIn || null;
                                        const end = detail.endDate || detail.checkOut || null;
                                        const city = detail.city || "";
                                        const days = detail.nights || detail.days || calcDays(start, end);
                                        return (
                                          <tr key={s} className="hover:bg-white transition-colors">
                                            <td className="px-3 py-2 font-semibold text-brand-neutral">
                                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                                s === "Hotel" ? "bg-brand-info-light text-brand-info" :
                                                s === "Car" ? "bg-brand-success-light text-brand-success" :
                                                "bg-brand-warning-light text-brand-warning"
                                              }`}>{s}</span>
                                            </td>
                                            <td className="px-3 py-2 text-brand-neutral">{city || "—"}</td>
                                            <td className="px-3 py-2 text-brand-neutral">{formatDate(start)}</td>
                                            <td className="px-3 py-2 text-brand-neutral">{formatDate(end)}</td>
                                            <td className="px-3 py-2 text-right font-semibold text-brand-neutral">
                                              {days ? <span className="px-1.5 py-0.5 rounded bg-brand-neutral-light text-brand-neutral font-semibold">{days}</span> : "—"}
                                            </td>
                                            <td className="px-3 py-2 text-right font-semibold text-brand-neutral">
                                              {days ? `₹${Math.round(amount / days).toLocaleString()}` : "—"}
                                            </td>
                                            <td className="px-3 py-2 text-right font-bold text-slate-900">₹{amount.toLocaleString()}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                    <tfoot>
                                      <tr className="border-t border-brand-neutral-border bg-white">
                                        <td colSpan={6} className="px-3 py-2 font-bold text-brand-neutral text-right text-[11px] uppercase">Total</td>
                                        <td className="px-3 py-2 text-right font-black text-slate-900">₹{(a.totalAmount || 0).toLocaleString()}</td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>
                              )}

                              {/* ── Payment Summary ── */}
                              {(() => {
                                const totalPayable = a.totalAmount || 0;
                                const totalPaid = (a.payments || []).reduce((s: number, p: any) => s + (p.paidAmount || 0), 0);
                                const dueAmount = Math.max(0, totalPayable - totalPaid);
                                return (
                                  <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-brand-primary mb-3">Payment Summary</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                      <div className="bg-white rounded-lg p-3 border border-indigo-100">
                                        <p className="text-[10px] font-semibold text-brand-neutral-muted uppercase tracking-wider">Total Payable</p>
                                        <p className="text-lg font-black text-brand-neutral-dark mt-1">₹{totalPayable.toLocaleString()}</p>
                                      </div>
                                      <div className="bg-white rounded-lg p-3 border border-emerald-100">
                                        <p className="text-[10px] font-semibold text-brand-neutral-muted uppercase tracking-wider">Total Paid</p>
                                        <p className="text-lg font-black text-brand-success mt-1">₹{totalPaid.toLocaleString()}</p>
                                      </div>
                                      <div className={`rounded-lg p-3 border ${dueAmount > 0 ? 'bg-rose-50 border-rose-200' : 'bg-brand-success-light border-emerald-200'}`}>
                                        <p className="text-[10px] font-semibold text-brand-neutral-muted uppercase tracking-wider">Due Amount</p>
                                        <p className={`text-lg font-black mt-1 ${dueAmount > 0 ? 'text-rose-600' : 'text-brand-success'}`}>
                                          ₹{dueAmount.toLocaleString()}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* ── Payment History ── */}
                              <div className="bg-white border border-brand-neutral-border rounded-xl shadow-sm overflow-hidden">
                                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                                  <div>
                                    <h3 className="font-bold text-brand-neutral-dark text-sm flex items-center gap-1.5">
                                      <CreditCard className="h-3.5 w-3.5" /> Payment History
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                      {(a.payments || []).filter((p: any) => (p.installments || []).length > 0).length > 0
                                        ? `${(a.payments || []).filter((p: any) => (p.installments || []).length > 0).length} payment record${(a.payments || []).filter((p: any) => (p.installments || []).length > 0).length !== 1 ? "s" : ""}`
                                        : "No payment record found yet"}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {(a.payments || []).filter((p: any) => (p.installments || []).length > 0).length > 0 && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-brand-primary">
                                        {(a.payments || []).filter((p: any) => (p.installments || []).length > 0).length} Record{(a.payments || []).filter((p: any) => (p.installments || []).length > 0).length !== 1 ? "s" : ""}
                                      </span>
                                    )}
                                    <button
                                      onClick={() => setShareEmailModal({ vendorId: a.vendorId, vendorName: a.vendor?.vendarCompanyName || a.vendor?.vendarName || "Vendor", vendorMobile: a.vendor?.vendarMobile || "" })}
                                      className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-brand-info-light text-brand-info hover:bg-brand-info-light border border-blue-200 transition"
                                      title="Share via Email"
                                    >
                                      <Mail className="h-3 w-3" /> Email
                                    </button>
                                    <a
                                      href={`https://wa.me/${(a.vendor?.vendarMobile || "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                                        `*Payment History — ${a.vendor?.vendarCompanyName || a.vendor?.vendarName || "Vendor"}*\n\n` +
                                        `Traveller: ${a.traveller?.name || "—"}\n` +
                                        `Total Amount: ₹${(a.totalAmount || 0).toLocaleString()}\n` +
                                        `Paid: ₹${((a.payments || []).reduce((s: number, p: any) => s + (p.paidAmount || 0), 0)).toLocaleString()}\n` +
                                        `Pending: ₹${((a.payments || []).reduce((s: number, p: any) => s + (p.pendingAmount || 0), 0)).toLocaleString()}\n\n` +
                                        `— ${process.env.NEXT_PUBLIC_BRAND_NAME || "Flag Journeys"}`
                                      )}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-brand-success-light text-brand-success hover:bg-brand-success-light border border-emerald-200 transition"
                                      title="Share via WhatsApp"
                                    >
                                      <MessageCircle className="h-3 w-3" /> WhatsApp
                                    </a>
                                  </div>
                                </div>
                                <div className="p-4">
                                  {(a.payments || []).some((p: any) => (p.installments || []).length > 0) ? (
                                    <div className="overflow-x-auto">
<table className="tbl">
                                        <thead>
                                           <tr className="text-[10px] font-bold text-brand-neutral-muted uppercase tracking-wider border-b border-brand-neutral-border">
                                              <th className="tbl-th-sm pr-3">#</th>
                                              <th className="tbl-th-sm px-3">Invoice</th>
                                             <th className="tbl-th-sm px-3">Total</th>
                                             <th className="tbl-th-sm px-3">Paid</th>
                                             <th className="tbl-th-sm px-3">Pending</th>
                                             <th className="tbl-th-sm px-3">Status</th>
                                             <th className="tbl-th-sm px-3">Date</th>
                                             <th className="tbl-th-sm text-right pl-3">Action</th>
                                           </tr>
                                        </thead>
                                    <tbody className="divide-y divide-brand-neutral-light">
                                          {(a.payments || []).filter((p: any) => (p.installments || []).length > 0).map((p: any, idx: number) => (
                                            <tr key={p.id} className="hover:bg-brand-neutral-light/50 transition-colors">
                                              <td className="py-3 pr-3">
                                                <span className="text-sm font-bold text-brand-neutral-dark">#{idx + 1}</span>
                                              </td>
                                              <td className="py-3 px-3">
                                                <span className="text-xs font-semibold text-brand-neutral">{p.invoiceNo}</span>
                                              </td>
                                              <td className="py-3 px-3">
                                                <span className="font-semibold text-brand-neutral">₹{(p.amount || 0).toLocaleString()}</span>
                                              </td>
                                              <td className="py-3 px-3">
                                                <span className="font-semibold text-brand-success">₹{(p.paidAmount || 0).toLocaleString()}</span>
                                              </td>
                                              <td className="py-3 px-3">
                                                <span className="font-semibold text-brand-warning">₹{(p.pendingAmount || 0).toLocaleString()}</span>
                                              </td>
                                              <td className="py-3 px-3">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                                  p.paymentStatus === "PAID" ? "bg-brand-success-light text-brand-success" :
                                                  p.paymentStatus === "PARTIAL" ? "bg-brand-warning-light text-brand-warning" :
                                                  "bg-brand-neutral-light text-brand-neutral"
                                                }`}>{p.paymentStatus}</span>
                                                {p.paymentDate && (
                                                  <p className="text-[10px] text-brand-success mt-0.5 flex items-center gap-1">
                                                    <ShieldCheck className="h-3 w-3" /> {formatDate(p.paymentDate)}
                                                  </p>
                                                )}
                                              </td>
                                              <td className="py-3 px-3 text-xs text-brand-neutral-muted">
                                                {formatDate(p.createdAt)}
                                              </td>
                                               <td className="py-3 pl-3 text-right">
                                                 {p.paymentStatus !== "PAID" ? (
                                                   <button
                                                     onClick={() => setRecordModal({ paymentId: p.id, vendorName: a.vendor?.vendarCompanyName || a.vendor?.vendarName, pending: p.pendingAmount })}
                                                     className="text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 rounded-lg hover:from-amber-600 hover:to-orange-600 transition shadow-sm flex items-center gap-1 ml-auto"
                                                   >
                                                     <IndianRupee className="h-3 w-3" /> Pay
                                                   </button>
                                                ) : (
                                                  <button
                                                    onClick={() => setReviewModal({ payment: p, vendorName: a.vendor?.vendarCompanyName || a.vendor?.vendarName })}
                                                    className="text-xs font-medium bg-brand-primary-light border border-brand-primary text-brand-primary px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition shadow-sm flex items-center gap-1 ml-auto"
                                                  >
                                                    <Eye className="h-3 w-3" /> View
                                                  </button>
                                                )}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    <div className="text-center py-8">
                                      <CreditCard className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                                      <p className="text-sm text-slate-400 font-medium">No payment record found yet</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Installment breakdown */}
                              {(a.payments || []).length > 0 && (a.payments || []).some((p: any) => (p.installments || []).length > 0) && (
                                <div className="bg-white border border-brand-neutral-border rounded-xl shadow-sm overflow-hidden">
                                  <div className="px-4 py-3 border-b border-slate-100">
                                    <h3 className="font-bold text-brand-neutral-dark text-sm flex items-center gap-1.5">
                                      <CheckCircle2 className="h-3.5 w-3.5" /> Installment Details
                                    </h3>
                                  </div>
                                  <div className="p-4 space-y-2">
                                    {(a.payments || []).flatMap((p: any) =>
                                      (p.installments || []).map((inst: any) => (
                                        <div key={inst.id} className="flex items-center justify-between bg-brand-neutral-light border border-slate-100 rounded-lg px-3 py-2 text-xs">
                                          <div className="flex items-center gap-2">
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                            <span className="font-bold text-brand-neutral">₹{(inst.amount || 0).toLocaleString()}</span>
                                            <span className="text-slate-400">· {inst.paymentMethod}</span>
                                            {inst.transactionId && <span className="text-slate-400">· {inst.transactionId}</span>}
                                          </div>
                                          <div className="flex items-center gap-2">
                                            {inst.paymentSlip && (
                                              <a href={inst.paymentSlip} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline font-semibold">Slip</a>
                                            )}
                                            <span className="text-slate-400">{formatDate(inst.paymentDate)}</span>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </TableWraper>

      {/* ── Record Payment Modal ── */}
      {recordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Record Vendor Payment</h3>
              <p className="text-xs text-brand-neutral-muted mt-0.5">{recordModal.vendorName} · Pending: ₹{recordModal.pending.toLocaleString()}</p>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-brand-primary-light border border-indigo-100 rounded-lg p-2 text-center">
                <p className="text-[9px] font-bold text-brand-primary uppercase">Total</p>
                <p className="text-sm font-black text-indigo-900">₹{recordModal.pending.toLocaleString()}</p>
              </div>
              <div className="bg-brand-success-light border border-emerald-100 rounded-lg p-2 text-center">
                <p className="text-[9px] font-bold text-brand-success uppercase">Paying</p>
                <p className="text-sm font-black text-brand-success">₹{Number(payAmount || 0).toLocaleString()}</p>
              </div>
              <div className="bg-brand-warning-light border border-amber-100 rounded-lg p-2 text-center">
                <p className="text-[9px] font-bold text-brand-warning uppercase">After</p>
                <p className="text-sm font-black text-brand-warning">₹{Math.max(0, recordModal.pending - Number(payAmount || 0)).toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-brand-neutral mb-1">Amount (₹)</label>
                <div className="relative">
                  <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    max={recordModal.pending}
                    placeholder="Enter amount"
                    className="w-full pl-8 pr-2 py-2 text-sm border border-brand-neutral-border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-brand-neutral mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-brand-neutral-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                >
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-brand-neutral mb-1">Transaction ID</label>
                <input
                  value={payTxnId}
                  onChange={(e) => setPayTxnId(e.target.value)}
                  placeholder="UTR / Transaction ID"
                  className="w-full px-3 py-2 border border-brand-neutral-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-brand-neutral mb-1">Remarks</label>
                <input
                  value={payRemarks}
                  onChange={(e) => setPayRemarks(e.target.value)}
                  placeholder="Internal notes..."
                  className="w-full px-3 py-2 border border-brand-neutral-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-brand-neutral mb-1">Payment Slip (optional)</label>
                <FileUpload
                  title="Upload Payment Slip"
                  subtitle="Screenshot, PDF, or image of payment confirmation"
                  file={paySlip}
                  setFile={setPaySlip}
                  accept="image/*,.pdf"
                  name="paymentSlip"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setRecordModal(null); setPayAmount(""); setPayTxnId(""); setPayRemarks(""); setPaySlip(null); }}
                className="flex-1 py-2.5 border border-brand-neutral-border rounded-xl text-sm font-semibold text-brand-neutral hover:bg-brand-neutral-light"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordPayment}
                disabled={!payAmount || Number(payAmount) <= 0 || recordingPayment || uploadingSlip}
                className="flex-1 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {(recordingPayment || uploadingSlip) && <PageLoader size="inline" />}
                {uploadingSlip ? "Uploading Slip..." : "Record Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Review Payment Modal ── */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Payment Details</h3>
              <p className="text-xs text-brand-neutral-muted mt-0.5">{reviewModal.vendorName} · {reviewModal.payment.invoiceNo}</p>
            </div>

            <div className="bg-brand-neutral-light border border-brand-neutral-border rounded-xl p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-brand-neutral-muted">Amount</span>
                <span className="font-bold text-brand-neutral-dark">₹{(reviewModal.payment.amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-neutral-muted">Paid</span>
                <span className="font-bold text-brand-success">₹{(reviewModal.payment.paidAmount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-neutral-muted">Pending</span>
                <span className="font-bold text-brand-warning">₹{(reviewModal.payment.pendingAmount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-neutral-muted">Status</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  reviewModal.payment.paymentStatus === "PAID" ? "bg-brand-success-light text-brand-success" :
                  reviewModal.payment.paymentStatus === "PARTIAL" ? "bg-brand-warning-light text-brand-warning" :
                  "bg-brand-neutral-light text-brand-neutral"
                }`}>{reviewModal.payment.paymentStatus}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-neutral-muted">Method</span>
                <span className="font-semibold text-brand-neutral">{reviewModal.payment.paymentMethod}</span>
              </div>
              {reviewModal.payment.dueDate && (
                <div className="flex justify-between text-sm">
                  <span className="text-brand-neutral-muted">Due Date</span>
                  <span className="font-semibold text-brand-neutral">{formatDate(reviewModal.payment.dueDate)}</span>
                </div>
              )}
            </div>

            {/* Installments */}
            {(reviewModal.payment.installments || []).length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-brand-neutral-muted uppercase tracking-wider mb-2">Installments</p>
                <div className="space-y-1.5">
                  {(reviewModal.payment.installments || []).map((inst: any) => (
                    <div key={inst.id} className="flex items-center justify-between bg-brand-success-light border border-emerald-100 rounded-lg px-3 py-2 text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="font-bold text-brand-success">₹{(inst.amount || 0).toLocaleString()}</span>
                        <span className="text-brand-success">· {inst.paymentMethod}</span>
                        {inst.transactionId && <span className="text-brand-success">· {inst.transactionId}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {inst.paymentSlip && (
                          <a href={inst.paymentSlip} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline font-semibold">Slip</a>
                        )}
                        <span className="text-emerald-500">{formatDate(inst.paymentDate)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setReviewModal(null)}
              className="w-full py-2.5 bg-brand-neutral-light text-brand-neutral rounded-xl text-sm font-semibold hover:bg-slate-200 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Share Email Modal ── */}
      {shareEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Share Payment History</h3>
              <p className="text-xs text-brand-neutral-muted mt-0.5">Send payment summary for <strong>{shareEmailModal.vendorName}</strong> via email</p>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-brand-neutral mb-1">Recipient Email</label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="email"
                  value={shareEmailInput}
                  onChange={(e) => setShareEmailInput(e.target.value)}
                  placeholder="vendor@example.com"
                  className="w-full pl-8 pr-2 py-2 text-sm border border-brand-neutral-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setShareEmailModal(null); setShareEmailInput(""); }}
                className="flex-1 py-2.5 border border-brand-neutral-border rounded-xl text-sm font-semibold text-brand-neutral hover:bg-brand-neutral-light"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!shareEmailInput || !shareEmailModal) return;
                  shareEmail({ vendorId: shareEmailModal.vendorId, email: shareEmailInput }, {
                    onSuccess: () => { setShareEmailModal(null); setShareEmailInput(""); },
                  });
                }}
                disabled={!shareEmailInput || sendingEmail}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sendingEmail && <PageLoader size="inline" />}
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
