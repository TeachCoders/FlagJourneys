"use client";
import React, { useState, useMemo } from "react";
import { IndianRupee, Calendar, ShieldCheck, FileText, CheckCircle, Eye, Pencil } from "lucide-react";
import PageLoader from "@/components/shared/PageLoader";
import { useUploadDocumentMutation } from "../api/useLeadFollowup";
import { useUpdateTravellerPaymentStatus } from "@/feature/payments/api/usePaymentsHooks";
import apiClient from "@/lib/apiClient";
import { successToast, errorToast } from "@/components/shared/tost";
import WhatsAppShareBtn from "@/components/shared/whatsAppShareBtn";
import { useGetCurrentUser } from "@/feature/auth/api/useAuth";
import { ReusableModel } from "@/components/shared/reusableModel";

interface TravellerPaymentTabProps {
  lead: any;
}

const STATUS_BADGE: Record<string, string> = {
  UPCOMING: "bg-brand-warning-light text-brand-warning",
  COMPLETED: "bg-brand-success-light text-brand-success",
  CANCELLED: "bg-brand-danger-light text-brand-danger",
};

const STATUS_LABEL: Record<string, string> = {
  UPCOMING: "Pending Approval",
  COMPLETED: "Approved",
  CANCELLED: "Rejected",
};

export default function TravellerPaymentTab({ lead }: TravellerPaymentTabProps) {
  const payments = lead?.payments || [];
  const travelDate = lead?.travelDate || null;
  const { user } = useGetCurrentUser();

  const normalizedRole = (user?.role ?? "").toLowerCase().replace(/[\s-]+/g, "_");
  const isSuperAdmin = normalizedRole.includes("super") && normalizedRole.includes("admin");

  const [paymentslipFile, setPaymentslipFile] = useState<File | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Modal states
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [transactionDetail, setTransactionDetail] = useState("");

  const uploadMutation = useUploadDocumentMutation();
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateTravellerPaymentStatus();

  const paymentSummary = useMemo(() => {
    const invoices = lead?.invoices || [];
    const totalInvoiced = invoices.reduce((sum: number, inv: any) => sum + (inv.grandTotal || 0), 0);
    const totalPaid = payments.reduce((sum: number, p: any) => sum + (p.amount ? Number(p.amount) : 0), 0);
    const dueAmount = Math.max(0, totalInvoiced - totalPaid);
    return { totalInvoiced, totalPaid, dueAmount };
  }, [lead]);

  const formatDate = (d: string | Date) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const sortedPayments = [...payments].sort((a, b) => {
    const dateA = a.paymentDate || a.createdAt;
    const dateB = b.paymentDate || b.createdAt;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  const openPaymentModal = (pay: any) => {
    setSelectedPayment(pay);
    setTransactionId(pay.transactionId || "");
    setTransactionDetail(pay.transactionDetail || "");
    setIsModalOpen(true);
  };

  const handleApprove = () => {
    if (!selectedPayment) return;
    if (!transactionId.trim()) {
      errorToast("Transaction ID is required!");
      return;
    }
    if (!transactionDetail.trim()) {
      errorToast("Notes are required!");
      return;
    }
    updateStatus({ id: selectedPayment.id, payload: { status: "COMPLETED", transactionId: transactionId.trim(), transactionDetail: transactionDetail.trim() } });
    setIsModalOpen(false);
    setSelectedPayment(null);
  };

  const handleReject = () => {
    if (!selectedPayment) return;
    if (!transactionDetail.trim()) {
      errorToast("Notes are required!");
      return;
    }
    updateStatus({ id: selectedPayment.id, payload: { status: "CANCELLED", transactionDetail: transactionDetail.trim() } });
    setIsModalOpen(false);
    setSelectedPayment(null);
  };

  const handleUpdateTransaction = () => {
    if (!selectedPayment) return;
    if (!transactionId.trim()) {
      errorToast("Transaction ID is required!");
      return;
    }
    if (!transactionDetail.trim()) {
      errorToast("Notes are required!");
      return;
    }
    updateStatus({ id: selectedPayment.id, payload: { status: selectedPayment.status, transactionId: transactionId.trim(), transactionDetail: transactionDetail.trim() } });
    setIsModalOpen(false);
    setSelectedPayment(null);
  };

  const handleUpload = async () => {
    if (!paymentslipFile) return;

    setUploading(true);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append("folder", "documents");
      formData.append("file", paymentslipFile);
      const uploadRes = await apiClient.post("/upload", formData);
      const url = uploadRes.data?.url || uploadRes.data?.data?.url;
      if (!url) throw new Error("Upload failed — no URL returned");

      const payload: any = { documentType: "paymentslip", url };
      if (paymentAmount) payload.amount = Number(paymentAmount);
      if (paymentDate) payload.paymentDate = paymentDate;

      uploadMutation.mutate(
        { leadId: lead.id, payload },
        {
          onSuccess: () => {
            setSuccess(true);
            setPaymentslipFile(null);
            setPaymentAmount("");
            setPaymentDate("");
            successToast("Payment recorded successfully!");
          },
        }
      );
    } catch (err) {
      console.error("Upload error:", err);
      errorToast("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h2 className="text-lg font-bold text-brand-neutral-dark">Traveller Payments</h2>
        <p className="text-sm text-brand-neutral-muted mt-1">
          Record and track installment-wise payments. Each upload creates a new installment record.
        </p>
      </div>

      {/* Payment Summary */}
      {paymentSummary.totalInvoiced > 0 && (
        <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-primary mb-3">Payment Summary</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-3 border border-indigo-100">
              <p className="text-[10px] font-semibold text-brand-neutral-muted uppercase tracking-wider">Total Invoiced</p>
              <p className="text-lg font-black text-brand-neutral-dark mt-1">₹{paymentSummary.totalInvoiced.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-emerald-100">
              <p className="text-[10px] font-semibold text-brand-neutral-muted uppercase tracking-wider">Total Paid</p>
              <p className="text-lg font-black text-brand-success mt-1">₹{paymentSummary.totalPaid.toLocaleString()}</p>
            </div>
            <div className={`rounded-lg p-3 border ${paymentSummary.dueAmount > 0 ? 'bg-rose-50 border-rose-200' : 'bg-brand-success-light border-emerald-200'}`}>
              <p className="text-[10px] font-semibold text-brand-neutral-muted uppercase tracking-wider">Due Amount</p>
              <p className={`text-lg font-black mt-1 ${paymentSummary.dueAmount > 0 ? 'text-rose-600' : 'text-brand-success'}`}>
                ₹{paymentSummary.dueAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* New Payment Form */}
      <div className="space-y-3">
        {success && (
          <div className="flex items-center justify-between gap-3 px-3 py-2 bg-brand-success-light border border-emerald-200 rounded-lg text-brand-success text-sm font-semibold">
            <span className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> Payment recorded! Email sent to traveller.
            </span>
            <WhatsAppShareBtn
              phone={lead?.phone}
              message={`Dear ${lead?.name || "Guest"}, your payment of Rs.${Number(paymentAmount || 0).toLocaleString()} has been recorded for Traveller ID: ${lead?.travellerId}. Thank you for choosing ${process.env.NEXT_PUBLIC_BRAND_NAME || "Flag Journeys"}!`}
              label="Share on WhatsApp"
            />
          </div>
        )}

        {/* Installment Summary Table */}
        <div className="bg-brand-primary-light border border-indigo-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">Installment #{payments.length + 1}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-brand-primary">
              {payments.length} of {payments.length + 1}
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] font-bold text-brand-neutral-muted uppercase tracking-wider border-b border-brand-primary">
                <th className="tbl-th-sm">Total Payment</th>
                <th className="tbl-th-sm text-center">Paid So Far</th>
                <th className="tbl-th-sm text-right">Due Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 text-base font-black text-brand-neutral-dark">Rs.{paymentSummary.totalInvoiced.toLocaleString()}</td>
                <td className="py-2 text-center text-base font-black text-brand-success">Rs.{paymentSummary.totalPaid.toLocaleString()}</td>
                <td className={`py-2 text-right text-base font-black ${paymentSummary.dueAmount > 0 ? 'text-rose-600' : 'text-brand-success'}`}>
                  Rs.{paymentSummary.dueAmount.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Entry Row */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
          <h4 className="text-[10px] font-bold text-brand-warning uppercase tracking-wider mb-3">New Entry</h4>
          <div className="grid grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-[10px] font-bold text-brand-neutral mb-1">Amount (Rs.)</label>
              <div className="relative">
                <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full pl-8 pr-2 py-2 text-sm border border-brand-neutral-border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-brand-neutral mb-1">Payment Date</label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full pl-8 pr-2 py-2 text-sm border border-brand-neutral-border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-brand-neutral mb-1">Payment Slip</label>
              <label className="flex items-center gap-2 bg-white border border-brand-neutral-border rounded-lg px-3 py-2 cursor-pointer hover:bg-brand-neutral-light transition-colors h-[38px]">
                <IndianRupee className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span className="text-xs text-brand-neutral-muted truncate">{paymentslipFile ? paymentslipFile.name : "Click to upload"}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setPaymentslipFile(e.target.files[0]);
                    }
                  }}
                />
              </label>
            </div>
          </div>
          {paymentslipFile && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="mt-3 px-5 py-2 bg-amber-600 text-white font-semibold text-sm rounded-lg hover:bg-amber-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-60"
            >
              {uploading && <PageLoader size="inline" />}
              {uploading ? "Recording..." : "Record Payment"}
            </button>
          )}
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white border border-brand-neutral-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-brand-neutral-dark text-sm">Payment History</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {payments.length > 0 ? `${payments.length} installment record${payments.length !== 1 ? "s" : ""}` : "No payments recorded yet"}
            </p>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-brand-primary">
            {payments.length} Installment{payments.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="p-4">
          {sortedPayments.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-400 font-medium">
              No payment records yet. Use the form above to record the first installment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead>
                  <tr className="bg-brand-neutral-light border-b border-brand-neutral-border">
                    <th className="tbl-th-sm pr-3">Slip</th>
                    <th className="tbl-th-sm">Installment</th>
                    <th className="tbl-th-sm">Amount</th>
                    <th className="tbl-th-sm">Date</th>
                    <th className="tbl-th-sm">Status</th>
                    {isSuperAdmin && <th className="tbl-th-sm text-right pl-3">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-neutral-light">
                  {sortedPayments.map((pay: any, idx: number) => {
                    const payDate = pay.paymentDate || pay.createdAt;
                    return (
                      <tr key={pay.id} className="hover:bg-brand-neutral-light/50 transition-colors">
                        <td className="py-3 pr-3">
                          {pay.paymentScreenshotUrl ? (
                            <a href={pay.paymentScreenshotUrl} target="_blank" rel="noopener noreferrer">
                              <img
                                src={pay.paymentScreenshotUrl}
                                alt="Payment proof"
                                className="w-10 h-10 rounded-lg object-cover border border-brand-neutral-border hover:opacity-80 transition-opacity"
                              />
                            </a>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-brand-neutral-border flex items-center justify-center text-slate-400 text-[9px] font-semibold">
                              No SS
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-sm font-bold text-brand-neutral-dark">#{payments.length - idx}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-brand-neutral">₹{Number(pay.amount || 0).toLocaleString()}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-xs text-brand-neutral-muted">{formatDate(payDate)}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${STATUS_BADGE[pay.status] || "bg-slate-100 text-brand-neutral"}`}>
                            {STATUS_LABEL[pay.status] || pay.status}
                          </span>
                          {pay.approvedAt && (
                            <p className="text-[10px] text-brand-success mt-0.5 flex items-center gap-1">
                              <ShieldCheck className="h-3 w-3" /> {formatDate(pay.approvedAt)}
                            </p>
                          )}
                        </td>
                        {isSuperAdmin && (
                          <td className="py-3 pl-3 text-right">
                            {pay.status === "UPCOMING" ? (
                              <button
                                onClick={() => openPaymentModal(pay)}
                                className="text-xs font-medium bg-brand-warning-light border border-amber-200 text-brand-warning px-3 py-1.5 rounded-lg hover:bg-brand-warning-light transition shadow-sm flex items-center gap-1 ml-auto"
                              >
                                <Eye className="h-3 w-3" /> Review
                              </button>
                            ) : pay.status === "COMPLETED" ? (
                              <button
                                onClick={() => openPaymentModal(pay)}
                                className="text-xs font-medium bg-brand-primary-light border border-brand-primary text-brand-primary px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition shadow-sm flex items-center gap-1 ml-auto"
                              >
                                <Pencil className="h-3 w-3" /> Edit
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400">—</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Approve / Reject Modal */}
      <ReusableModel
        open={isModalOpen}
        onOpenChange={(open) => { setIsModalOpen(open); if (!open) setSelectedPayment(null); }}
        title="Review Payment"
        description="Check payment details and approve or reject."
        contentClassName="sm:max-w-[500px]"
      >
        {selectedPayment && (
          <div className="space-y-4">
            {/* Payment Screenshot */}
            {selectedPayment.paymentScreenshotUrl && (
              <div>
                <p className="text-xs font-bold text-brand-neutral-muted uppercase tracking-wider mb-2">Payment Screenshot</p>
                <a href={selectedPayment.paymentScreenshotUrl} target="_blank" rel="noopener noreferrer">
                  <img
                    src={selectedPayment.paymentScreenshotUrl}
                    alt="Payment screenshot"
                    className="w-full max-h-56 rounded-xl object-cover border border-brand-neutral-border hover:opacity-90 transition-opacity"
                  />
                </a>
              </div>
            )}

            {/* Payment Details */}
            <div className="bg-brand-neutral-light border border-brand-neutral-border rounded-xl p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-brand-neutral-muted">Amount</span>
                <span className="font-bold text-brand-neutral-dark">₹{Number(selectedPayment.amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-neutral-muted">Payment Date</span>
                <span className="font-semibold text-brand-neutral">{formatDate(selectedPayment.paymentDate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-neutral-muted">Status</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${STATUS_BADGE[selectedPayment.status]}`}>
                  {STATUS_LABEL[selectedPayment.status]}
                </span>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-brand-primary-light border border-indigo-100 rounded-lg p-2 text-center">
                <p className="text-[9px] font-bold text-brand-primary uppercase">Invoiced</p>
                <p className="text-sm font-black text-indigo-900">₹{paymentSummary.totalInvoiced.toLocaleString()}</p>
              </div>
              <div className="bg-brand-success-light border border-emerald-100 rounded-lg p-2 text-center">
                <p className="text-[9px] font-bold text-brand-success uppercase">Paid</p>
                <p className="text-sm font-black text-brand-success">₹{paymentSummary.totalPaid.toLocaleString()}</p>
              </div>
              <div className={`rounded-lg p-2 text-center border ${paymentSummary.dueAmount > 0 ? 'bg-rose-50 border-rose-100' : 'bg-brand-success-light border-emerald-100'}`}>
                <p className="text-[9px] font-bold text-brand-neutral-muted uppercase">Due</p>
                <p className={`text-sm font-black ${paymentSummary.dueAmount > 0 ? 'text-rose-700' : 'text-brand-success'}`}>₹{paymentSummary.dueAmount.toLocaleString()}</p>
              </div>
            </div>

            {/* Transaction ID Input (Optional) */}
            <div>
              <label className="block text-xs font-bold text-brand-neutral mb-1">Transaction ID (UTR) *</label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter UTR / Transaction ID"
                className="w-full px-3 py-2 text-sm border border-brand-neutral-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-brand-neutral mb-1">Notes *</label>
              <textarea
                value={transactionDetail}
                onChange={(e) => setTransactionDetail(e.target.value)}
                placeholder="Add any internal notes..."
                className="w-full px-3 py-2 text-sm border border-brand-neutral-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 min-h-[60px]"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              {selectedPayment.status === "COMPLETED" ? (
                <button
                  onClick={handleUpdateTransaction}
                  disabled={isUpdating || !transactionId.trim() || !transactionDetail.trim()}
                  className="btn-primary flex-1 px-4 py-2.5 font-semibold text-sm rounded-lg shadow-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                   {isUpdating ? <PageLoader size="inline" /> : <CheckCircle className="h-4 w-4" />}
                   {isUpdating ? "Updating..." : "Update"}
                 </button>
               ) : (
                 <>
                   <button
                     onClick={handleApprove}
                     disabled={isUpdating || !transactionId.trim() || !transactionDetail.trim()}
                     className="flex-1 px-4 py-2.5 bg-emerald-600 text-white font-semibold text-sm rounded-lg hover:bg-emerald-700 transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                   >
                     {isUpdating ? <PageLoader size="inline" /> : <CheckCircle className="h-4 w-4" />}
                     {isUpdating ? "Processing..." : "Approve"}
                   </button>
                   <button
                     onClick={handleReject}
                     disabled={isUpdating || !transactionDetail.trim()}
                     className="flex-1 px-4 py-2.5 bg-red-600 text-white font-semibold text-sm rounded-lg hover:bg-red-700 transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                   >
                     {isUpdating ? <PageLoader size="inline" /> : "Reject"}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </ReusableModel>
    </div>
  );
}
