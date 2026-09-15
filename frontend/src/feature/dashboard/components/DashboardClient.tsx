"use client";
import React, { useMemo } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  MessageSquare,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  Hourglass,
  Phone,
  Globe,
  Map,
  Building2,
  User as UserIcon,
  ArrowRight,
  Sparkles,
  CircleHelp,
  Route,
  Package,
  Newspaper,
  FileText,
  Truck,
  Calendar,
  Compass,
  IndianRupee,
  ClipboardList,
  BotMessageSquare,
  MonitorSmartphone,
  Wallet,
  Building,
  Briefcase,
  ChevronRight
} from "lucide-react";
import StatsCardGrid from "@/components/shared/StatsCardGrid";
import { useDashboardStats } from "@/feature/dashboard/api/useDashboard";
import { useGetCurrentUser } from "@/feature/auth/api/useAuth";
import type { RecentLead, RecentChat } from "@/feature/dashboard/api";
import PageLoader from "@/components/shared/PageLoader";
import { formatLocalDateTime } from "@/lib/dateUtils";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

// ── Premium Components ────────────────────────────────────────────────────────


function PremiumLedger({
  title, subtitle, icon: Icon, columns, rows, tfoot, headerBgClass = "bg-brand-50/50"
}: {
  title: string; subtitle?: string; icon: React.ElementType; headerBgClass?: string;
  columns: { label: string; align?: "left" | "right" | "center"; width?: string }[];
  rows: {
    icon?: React.ElementType;
    iconColor?: string;
    label: string;
    cells: { value: React.ReactNode; colorClass?: string; bold?: boolean }[];
  }[];
  tfoot?: { label: string; cells: { value: React.ReactNode; colorClass?: string }[] };
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className={`px-6 py-5 border-b border-slate-200 flex items-center justify-between ${headerBgClass}`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-brand-600 shadow-sm border border-brand-100">
            <Icon size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">{title}</h2>
            {subtitle && <p className="text-sm font-bold text-slate-600 mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="overflow-x-auto p-0 flex-1">
        <table className="w-full text-base text-left">
          <thead className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-widest text-xs">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className={`px-6 py-4 ${i === 0 ? "" : ""}`} style={{ width: col.width, textAlign: col.align || "left" }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors group bg-white">
                <td className="px-6 py-5 font-semibold text-slate-800 flex items-center gap-3">
                  {row.icon && <row.icon size={18} className={row.iconColor} strokeWidth={2.5} />} 
                  <span className="group-hover:text-brand-600 transition-colors">{row.label}</span>
                </td>
                {row.cells.map((cell, j) => (
                  <td key={j} className={`px-6 py-5 ${cell.colorClass || "text-slate-700"} ${cell.bold ? "font-bold text-lg" : "font-medium"}`} style={{ textAlign: columns[j + 1].align || "left" }}>
                    {cell.value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {tfoot && (
            <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-200">
              <tr>
                <td className="px-6 py-4 text-slate-900 uppercase tracking-widest text-sm">
                  {tfoot.label}
                </td>
                {tfoot.cells.map((cell, j) => (
                  <td key={j} className={`px-6 py-4 text-lg ${cell.colorClass || "text-slate-900"}`} style={{ textAlign: columns[j + 1].align || "left" }}>
                    {cell.value}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

function MiniStat({ label, value, icon: Icon, colorClass }: any) {
  return (
    <div className="flex items-center justify-between py-3.5 px-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
      <div className="flex items-center gap-3">
        <Icon size={18} className={colorClass} strokeWidth={2.5} />
        <span className="text-sm font-bold text-slate-700">{label}</span>
      </div>
      <span className="text-lg font-black text-slate-900">{value}</span>
    </div>
  );
}

function DirectoryCard({ title, icon: Icon, iconColor, headerBgClass = "bg-brand-50/50", children }: any) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className={`px-6 py-5 border-b border-slate-200 flex items-center gap-4 ${headerBgClass}`}>
        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm border border-brand-100">
          <Icon size={24} strokeWidth={2.5} className={iconColor || "text-brand-600"} />
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">{title}</h2>
      </div>
      <div className="p-6 space-y-3 flex-1 bg-white">
        {children}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DashboardClient() {
  const { data, isLoading, isError, refetch } = useDashboardStats();
  const { user } = useGetCurrentUser();

  const stats = useMemo(() => data?.stats, [data]);
  const firstName = user?.name?.split(" ")[0] || "there";
  const today = useMemo(() => formatLocalDateTime(new Date().toISOString(), { weekday: "long", year: "numeric", month: "long", day: "2-digit", timeZone: "Asia/Kolkata" }), []);

  if (isLoading) return <PageLoader size="page" />;
  if (isError) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <CircleHelp size={40} className="text-slate-400" />
      <p className="text-slate-500 font-medium">Failed to load business intelligence data.</p>
      <button onClick={() => refetch()} className="px-4 py-2 rounded-lg bg-brand-600 text-white font-semibold">Retry</button>
    </div>
  );

  const s = stats;

  return (
    <div className="space-y-8 pb-12 max-w-[1600px] mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Sparkles className="text-brand-600" size={28} />
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-slate-500 font-medium mt-1.5 flex items-center gap-2">
            <Calendar size={14} /> {today} · FlagJourney Business Intelligence
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/my-leads" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm">
            <UserPlus size={16} /> My Leads <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      {/* ══ TOP LEVEL METRICS ══ */}
      <StatsCardGrid
        items={[
          { label: "Leads Today", value: s?.leadsToday ?? 0, icon: UserPlus },
          { label: "Leads This Month", value: s?.leadsThisMonth ?? 0, icon: TrendingUp },
          { label: "Active Chats", value: s?.activeChats ?? 0, icon: MessageSquare },
          { label: "Tour Bookings", value: s?.totalTourBookings ?? 0, icon: ClipboardList },
        ]}
        columns={4}
        size="lg"
      />

      {/* ══ MAIN LEDGERS ══ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* 1. Leads & Pipeline Ledger */}
        <PremiumLedger
          title="Lead Generation & Pipeline"
          subtitle="Breakdown of leads acquired via chatbot vs website."
          icon={Users}
          headerBgClass="bg-indigo-50/70"
          columns={[
            { label: "Source", width: "14rem" },
            { label: "Total", align: "right" },
            { label: "Confirmed", align: "right" },
            { label: "In Progress", align: "right" },
            { label: "Pending", align: "right" },
            { label: "Cancelled", align: "right" },
          ]}
          rows={[
            {
              icon: BotMessageSquare, iconColor: "text-indigo-500", label: "Chatbot",
              cells: [
                { value: s?.chatTotal ?? 0, bold: true, colorClass: "text-slate-900" },
                { value: s?.chatConfirmed ?? 0, colorClass: "text-emerald-600" },
                { value: s?.chatOngoing ?? 0, colorClass: "text-blue-600" },
                { value: s?.chatPending ?? 0, colorClass: "text-amber-600" },
                { value: s?.chatCancelled ?? 0, colorClass: "text-rose-600" },
              ]
            },
            {
              icon: MonitorSmartphone, iconColor: "text-emerald-500", label: "Website",
              cells: [
                { value: s?.websiteTotal ?? 0, bold: true, colorClass: "text-slate-900" },
                { value: s?.websiteConfirmed ?? 0, colorClass: "text-emerald-600" },
                { value: s?.websiteOngoing ?? 0, colorClass: "text-blue-600" },
                { value: s?.websitePending ?? 0, colorClass: "text-amber-600" },
                { value: s?.websiteCancelled ?? 0, colorClass: "text-rose-600" },
              ]
            }
          ]}
          tfoot={{
            label: "Total Volume",
            cells: [
              { value: s?.totalLeads ?? 0, colorClass: "text-slate-900" },
              { value: s?.confirmedLeads ?? 0, colorClass: "text-emerald-600" },
              { value: s?.ongoingLeads ?? 0, colorClass: "text-blue-600" },
              { value: s?.pendingLeads ?? 0, colorClass: "text-amber-600" },
              { value: s?.cancelledLeads ?? 0, colorClass: "text-rose-600" },
            ]
          }}
        />

        {/* 2. Operations & Financials Ledger */}
        <PremiumLedger
          title="Operations & Financials"
          subtitle="Status tracker for all service bookings and payments."
          icon={IndianRupee}
          headerBgClass="bg-emerald-50/70"
          columns={[
            { label: "Category", width: "14rem" },
            { label: "Total", align: "right" },
            { label: "Completed", align: "right" },
            { label: "Ongoing", align: "right" },
            { label: "Pending", align: "right" },
            { label: "Cancelled", align: "right" },
          ]}
          rows={[
            {
              icon: Route, iconColor: "text-blue-500", label: "Tours",
              cells: [
                { value: s?.tourTotal ?? 0, bold: true, colorClass: "text-slate-900" },
                { value: s?.tourCompleted ?? 0, colorClass: "text-emerald-600" },
                { value: s?.tourOngoing ?? 0, colorClass: "text-blue-600" },
                { value: s?.tourPending ?? 0, colorClass: "text-amber-600" },
                { value: s?.tourCancelled ?? 0, colorClass: "text-rose-600" },
              ]
            },
            {
              icon: Truck, iconColor: "text-amber-500", label: "Vehicles",
              cells: [
                { value: s?.vehicleTotal ?? 0, bold: true, colorClass: "text-slate-900" },
                { value: s?.vehicleCompleted ?? 0, colorClass: "text-emerald-600" },
                { value: s?.vehicleOngoing ?? 0, colorClass: "text-blue-600" },
                { value: s?.vehiclePending ?? 0, colorClass: "text-amber-600" },
                { value: s?.vehicleCancelled ?? 0, colorClass: "text-rose-600" },
              ]
            },
            {
              icon: Wallet, iconColor: "text-emerald-500", label: "Payments",
              cells: [
                { value: s?.paymentTotal ?? 0, bold: true, colorClass: "text-slate-900" },
                { value: s?.paymentCompleted ?? 0, colorClass: "text-emerald-600" },
                { value: s?.paymentOngoing ?? 0, colorClass: "text-blue-600" },
                { value: s?.paymentPending ?? 0, colorClass: "text-amber-600" },
                { value: s?.paymentCancelled ?? 0, colorClass: "text-rose-600" },
              ]
            }
          ]}
        />

      </div>

      {/* ══ DIRECTORY SUMMARIES ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Content Inventory */}
        <DirectoryCard title="Content Inventory" icon={FileText} iconColor="text-violet-600" headerBgClass="bg-violet-50/70">
          <MiniStat label="Journeys" value={`${s?.activeJourneys ?? 0} Active`} icon={Route} colorClass="text-violet-500" />
          <MiniStat label="Tour Packages" value={`${s?.activePackages ?? 0} Active`} icon={Package} colorClass="text-orange-500" />
          <MiniStat label="Blog Posts" value={`${s?.activeBlogPosts ?? 0} Active`} icon={Newspaper} colorClass="text-blue-500" />
          <MiniStat label="CMS Pages" value={`${s?.activeCmsPages ?? 0} Active`} icon={FileText} colorClass="text-slate-500" />
        </DirectoryCard>

        {/* Destinations */}
        <DirectoryCard title="Destinations" icon={Globe} iconColor="text-sky-600" headerBgClass="bg-sky-50/70">
          <MiniStat label="Countries" value={s?.totalCountries ?? 0} icon={Globe} colorClass="text-sky-500" />
          <MiniStat label="States" value={s?.totalStates ?? 0} icon={Map} colorClass="text-teal-500" />
          <MiniStat label="Cities" value={s?.totalCities ?? 0} icon={Building2} colorClass="text-indigo-500" />
          <MiniStat label="Travel Experiences" value={s?.totalTravelExperiences ?? 0} icon={Compass} colorClass="text-rose-500" />
          <MiniStat label="Seasons" value={s?.totalSeasons ?? 0} icon={Calendar} colorClass="text-amber-500" />
        </DirectoryCard>

        {/* Organization */}
        <DirectoryCard title="Organization" icon={Users} iconColor="text-cyan-600" headerBgClass="bg-cyan-50/70">
          <MiniStat label="Users" value={s?.totalUsers ?? 0} icon={UserIcon} colorClass="text-cyan-600" />
          <MiniStat label="Sales Teams" value={s?.totalTeams ?? 0} icon={Briefcase} colorClass="text-blue-600" />
          <MiniStat label="Registered Vendors" value={s?.totalVendors ?? 0} icon={Truck} colorClass="text-indigo-600" />
          <MiniStat label="Unanswered FAQs" value={s?.unansweredFaqs ?? 0} icon={CircleHelp} colorClass="text-rose-600" />
        </DirectoryCard>

      </div>

    </div>
  );
}
