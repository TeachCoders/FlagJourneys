"use client";
import Image from "next/image";
import { useLogout, useGetCurrentUser } from "@/feature/auth/api/useAuth";
import { useGetTeam } from "@/feature/teams/api/useTeam";
import NotificationBell from "@/feature/notifications/components/NotificationBell";
import React, { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  UsersRound,
  Users,
  UserCog,
  LogOut,
  Truck,
  Headset,
  MonitorCog,
  Globe,
  Map,
  Building2,
  Calendar,
  Compass,
  Route,
  IndianRupee,
  TrendingUp,
  Contact,
  ClipboardList,
  UserSearch,
  Wallet,
  CircleDollarSign,
  Headphones,
  Settings,
  ChevronDown,
  FileText,
  Newspaper,
  Tags,
  MessageSquare,
  Menu,
  BookOpen,
  CircleHelp,
  LineChart,
  Images,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import PageLoader from "@/components/shared/PageLoader";

type LayoutProps = {
  children: React.ReactNode;
};

// ── Sidebar section groups ──
type SidebarSection = {
  key: string;
  label: string;
  icon: React.ElementType;
  teams: string[];
  bgColor: string;
  headerBg: string;
  headerText: string;
  superAdminOnly?: boolean;
  items: { name: string; href: string; icon: React.ElementType; teams: string[]; superAdminOnly?: boolean }[];
};

const sidebarSections: SidebarSection[] = [{
  key: "traveller",
  label: "Leads & Travellers",
  icon: UserSearch,
  teams: ["sales", "vendor", "vendor_operations", "operations"],
  bgColor: "", headerBg: "", headerText: "",
  superAdminOnly: true,
  items: [
    { name: "My Leads", href: "/dashboard/my-leads", icon: UserSearch, teams: ["sales", "vendor", "vendor_operations"] },
    { name: "Traveller Payments", href: "/dashboard/payments", icon: CircleDollarSign, teams: ["operations", "vendor_operations"] },
  ],
},

{
  key: "vendor",
  label: "Vendors",
  icon: Truck,
  teams: ["vendor_operations", "sales"],
  bgColor: "", headerBg: "", headerText: "",
  items: [
    { name: "Create Vendor & Services", href: "/dashboard/vendors", icon: Truck, teams: ["vendor_operations"] },
    { name: "Booking Services", href: "/dashboard/traveller-booking-service", icon: ClipboardList, teams: ["vendor_operations"] },
    { name: "Vendor Payments", href: "/dashboard/vendor-payment", icon: Wallet, teams: ["vendor_operations"] },
    { name: "Vendor Directory", href: "/dashboard/vendor-directory", icon: Contact, teams: ["vendor_operations", "sales"] },
  ],
},
{
  key: "sales_team",
  label: "Sales Team",
  icon: TrendingUp,
  teams: ["sales"],
  bgColor: "", headerBg: "", headerText: "",
  items: [
    { name: "Sales Members", href: "/dashboard/sales-team", icon: Users, teams: ["sales"] },
    { name: "Lead Tracking", href: "/dashboard/sales-team/leads", icon: ClipboardList, teams: ["sales"] },
  ],
},
{
  key: "chat",
  label: "Chat & Bot",
  icon: MessageSquare,
  teams: ["support"],
  bgColor: "", headerBg: "", headerText: "",
  items: [
    { name: "Chat Inbox", href: "/dashboard/chat", icon: MessageSquare, teams: ["support"] },
    { name: "Bot FAQ", href: "/dashboard/chat/faqs", icon: BookOpen, teams: ["support"] },
    { name: "Unanswered Questions", href: "/dashboard/chat/unanswered", icon: CircleHelp, teams: [], superAdminOnly: true },
  ],
},
{
  key: "support",
  label: "Support",
  icon: Headphones,
  teams: ["support"],
  bgColor: "", headerBg: "", headerText: "",
  items: [
    { name: "Support Center", href: "/dashboard/support", icon: Headset, teams: ["support"] },
  ],
},
{
  key: "it",
  label: "System Settings",
  icon: Settings,
  teams: ["it"],
  bgColor: "", headerBg: "", headerText: "",
  items: [
    { name: "Analytics(Visiter tracking)", href: "/dashboard/analytics", icon: LineChart, teams: ["it"], superAdminOnly: true },
    { name: "System Settings", href: "/dashboard/it", icon: MonitorCog, teams: ["it"] },
    { name: "Top Selling Packages", href: "/dashboard/best-selling", icon: TrendingUp, teams: ["it"] },
    { name: "Countries", href: "/dashboard/country", icon: Globe, teams: ["it"] },
    { name: "States", href: "/dashboard/state", icon: Map, teams: ["it"] },
    { name: "Cities", href: "/dashboard/city", icon: Building2, teams: ["it"] },
    { name: "Seasons", href: "/dashboard/season", icon: Calendar, teams: ["it"] },
    { name: "Travel Experiences", href: "/dashboard/travel-experience", icon: Compass, teams: ["it"] },
    { name: "Journeys", href: "/dashboard/journey", icon: Route, teams: ["it"] },
    { name: "Content Pages", href: "/dashboard/cms-page", icon: FileText, teams: ["it"] },
    { name: "Ad Landing Pages", href: "/dashboard/ad-landing-pages", icon: FileText, teams: ["it"] },
    { name: "Guest Gallery", href: "/dashboard/guest-gallery", icon: Images, teams: ["it"] },
    { name: "Blog", href: "/dashboard/blog", icon: Newspaper, teams: ["it"] },
    { name: "Blog Categories", href: "/dashboard/blog-category", icon: Tags, teams: ["it"] },
    
  ],
},
];

// ── Reusable sidebar nav link ──
function SideLink({ href, label, icon: Icon, path, exact }: { href: string; label: string; icon: React.ElementType; path: string; exact?: boolean }) {
  const active = exact ? path === href : path.startsWith(href);
  return (
    <div className={`mt-1 py-1.5 pl-2 pr-3 border-l-[3px] transition-all duration-300 ${active ? "border-[#2E8B8B] bg-gradient-to-r from-[#2E8B8B]/15 to-transparent" : "border-transparent"}`}>
      <Link
        href={href}
        className={`flex items-center gap-3 px-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${
          active
            ? "text-white"
            : "text-white/75 hover:bg-white/10 hover:text-white"
        }`}
      >
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
          active
            ? "text-white bg-[#2E8B8B] shadow-sm"
            : "text-white/70 group-hover:text-white bg-white/5"
        }`}>
          <Icon size={16} />
        </span>
        <span className="truncate">{label}</span>
      </Link>
    </div>
  );
}

export default function Layout({ children }: LayoutProps) {
  const path = usePathname();
  const router = useRouter();
  const { user, isLoading } = useGetCurrentUser();
  const { logout } = useLogout();
  const [mounted, setMounted] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const normalizedRole = (user?.role ?? "").toLowerCase().replace(/[\s-]+/g, "_");
  const isSuperAdmin = normalizedRole.includes("super") && normalizedRole.includes("admin");

  const getInternalTeamKey = (dbName: string) => {
    const lower = dbName.toLowerCase();
    if (lower.includes("vendor") && lower.includes("operat")) return "vendor_operations";
    if (lower.includes("sales")) return "sales";
    if (lower.includes("it") || lower.includes("maintenance")) return "it";
    if (lower.includes("operat")) return "operations";
    if (lower.includes("support")) return "support";
    if (lower.includes("vendor") || lower.includes("vender")) return "vendor";
    return lower.replace(/[\s-]+/g, "_");
  };
  const userTeamKey = user?.role === "vendor" ? "vendor" : getInternalTeamKey(user?.team?.name ?? "");

  const { teams: dbTeams } = useGetTeam();
  const dbTeamKeys = useMemo(
    () => new Set((dbTeams || []).map((t: any) => getInternalTeamKey(t.name))),
    [dbTeams]
  );

  // ── Auto-open section for current path ──
  useEffect(() => {
    const activeSection = sidebarSections.find((s) =>
      s.items.some((item) => path.startsWith(item.href))
    );
    if (activeSection) {
      setOpenSections((prev) => {
        if (prev[activeSection.key]) return prev;
        return { ...prev, [activeSection.key]: true };
      });
    }
  }, [path]);

  // ── Route Protection ──
  useEffect(() => {
    if (!user) return;

    // Sales team members: only allowed routes
    if (!isSuperAdmin && userTeamKey === "sales") {
      if (
        !path.startsWith("/dashboard/my-leads") &&
        !path.startsWith("/dashboard/vendor-directory") &&
        !path.startsWith("/dashboard/sales/followup/")
      ) {
        router.replace("/dashboard/my-leads");
      }
      return;
    }
    if (path.startsWith("/dashboard/vendors") || path.startsWith("/dashboard/traveller-booking-service")) {
      if (isSuperAdmin) return;
      if (!dbTeamKeys.has("vendor_operations")) { router.replace("/dashboard"); return; }
      if (userTeamKey !== "vendor_operations") { router.replace("/dashboard"); }
      return;
    }

    // Vendor Directory: sales + vendor_operations + super admin
    if (path.startsWith("/dashboard/vendor-directory")) {
      if (isSuperAdmin) return;
      if (userTeamKey !== "sales" && userTeamKey !== "vendor_operations") { router.replace("/dashboard"); }
      return;
    }

    // Vendor Payment: vendor_operations only (same as payments page)
    if (path.startsWith("/dashboard/vendor-payment")) {
      if (isSuperAdmin) return;
      if (userTeamKey !== "vendor_operations") { router.replace("/dashboard"); }
      return;
    }

    // Traveller Payment: operations + vendor_operations
    if (path.startsWith("/dashboard/payments")) {
      if (isSuperAdmin) return;
      if (userTeamKey !== "operations" && userTeamKey !== "vendor_operations") { router.replace("/dashboard"); }
      return;
    }

    // My Leads: sales + vendor + vendor_operations
    if (path.startsWith("/dashboard/my-leads") || path.startsWith("/dashboard/my-leads")) {
      if (isSuperAdmin) return;
      if (userTeamKey !== "sales" && userTeamKey !== "vendor" && userTeamKey !== "vendor_operations") {
        router.replace("/dashboard");
      }
      return;
    }

    // Sales Team pages: sales team only
    if (path.startsWith("/dashboard/sales-team")) {
      if (isSuperAdmin) return;
      if (userTeamKey !== "sales") { router.replace("/dashboard"); }
      return;
    }

    // Chat: support + super admin only
    if (path.startsWith("/dashboard/chat")) {
      if (isSuperAdmin) return;
      if (userTeamKey !== "support") { router.replace("/dashboard"); }
      return;
    }

    if (!isSuperAdmin) {
      if (user.role === "team_member" && path.startsWith("/dashboard/teams")) {
        router.replace("/dashboard");
        return;
      }
      if (user.role === "vendor") {
        if (path.startsWith("/dashboard/best-selling")) {
          router.replace("/dashboard");
          return;
        }
      }
      if (path.startsWith("/dashboard/best-selling")) {
        if (userTeamKey !== "it" && !isSuperAdmin) { router.replace("/dashboard"); }
        return;
      }

      // Country page: IT team + super admin only
      if (path.startsWith("/dashboard/country")) {
        if (isSuperAdmin) return;
        if (userTeamKey !== "it") { router.replace("/dashboard"); }
        return;
      }

      // State page: IT team + super admin only
      if (path.startsWith("/dashboard/state")) {
        if (isSuperAdmin) return;
        if (userTeamKey !== "it") { router.replace("/dashboard"); }
        return;
      }

      // City page: IT team + super admin only
      if (path.startsWith("/dashboard/city")) {
        if (isSuperAdmin) return;
        if (userTeamKey !== "it") { router.replace("/dashboard"); }
        return;
      }

      // Season page: IT team + super admin only
      if (path.startsWith("/dashboard/season")) {
        if (isSuperAdmin) return;
        if (userTeamKey !== "it") { router.replace("/dashboard"); }
        return;
      }

      // Travel Experience page: IT team + super admin only
      if (path.startsWith("/dashboard/travel-experience")) {
        if (isSuperAdmin) return;
        if (userTeamKey !== "it") { router.replace("/dashboard"); }
        return;
      }

      // Journey page: IT team + super admin only
      if (path.startsWith("/dashboard/journey")) {
        if (isSuperAdmin) return;
        if (userTeamKey !== "it") { router.replace("/dashboard"); }
        return;
      }

      // CMS Page page: IT team + super admin only
      if (path.startsWith("/dashboard/cms-page")) {
        if (isSuperAdmin) return;
        if (userTeamKey !== "it") { router.replace("/dashboard"); }
        return;
      }

      // Ad Landing Pages: IT team + super admin only
      if (path.startsWith("/dashboard/ad-landing-pages")) {
        if (isSuperAdmin) return;
        if (userTeamKey !== "it") { router.replace("/dashboard"); }
        return;
      }

      // Guest Gallery: IT team + super admin only
      if (path.startsWith("/dashboard/guest-gallery")) {
        if (isSuperAdmin) return;
        if (userTeamKey !== "it") { router.replace("/dashboard"); }
        return;
      }

      // Blog page: IT team + super admin only
      if (path.startsWith("/dashboard/blog")) {
        if (isSuperAdmin) return;
        if (userTeamKey !== "it") { router.replace("/dashboard"); }
        return;
      }

      // Blog Categories page: IT team + super admin only
      if (path.startsWith("/dashboard/blog-category")) {
        if (isSuperAdmin) return;
        if (userTeamKey !== "it") { router.replace("/dashboard"); }
        return;
      }
    }
  }, [path, user, isSuperAdmin, userTeamKey, router, dbTeamKeys]);

  useEffect(() => {
    if (mounted && !isLoading && !user) {
      router.replace("/auth");
    }
  }, [mounted, isLoading, user, router]);

  if (!mounted || isLoading) {
    return <PageLoader size="page" />;
  }
  if (!user) {
    return <PageLoader size="page" />;
  }

  const activeTeamKeys = new Set(
    (dbTeams || []).filter((t: any) => t.users && t.users.length > 0).map((t: any) => getInternalTeamKey(t.name))
  );

  // For super admin show all; otherwise only user's team
  const teamsToShow: string[] = isSuperAdmin
    ? [...new Set(sidebarSections.flatMap((s) => s.teams))]
    : userTeamKey
      ? [userTeamKey]
      : [];

  const toggleSection = (key: string) =>
    setOpenSections((prev) => (prev[key] ? {} : { [key]: true }));

  const handleLogout = async () => {
    await logout();
    router.replace("/");
    window.location.reload();
  };

  const navLinkClass = (href: string) =>
    `flex px-3.5 py-2.5 my-1 items-center gap-3 transition-all duration-200 rounded-xl text-sm font-semibold ${path === href
      ? "bg-brand-50 text-brand-700 shadow-sm shadow-brand-100/50"
      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
    }`;

  // Determine which sections to show
  const visibleSections = sidebarSections.filter((section) => {
    if (section.superAdminOnly && !isSuperAdmin) return false;
    const hasVisibleItem = section.items.some((item) => item.teams.some((t) => teamsToShow.includes(t)));
    return hasVisibleItem;
  });

  // If user has no team → only global items
  const showGlobalOnly = !isSuperAdmin && teamsToShow.length === 0;
  const isSalesMember = !isSuperAdmin && userTeamKey === "sales";

  return (
    <div className="min-h-screen bg-white">
      <div className="flex">
        {/* Sidebar */}
        <aside className={`min-h-screen flex flex-col transition-all duration-300 overflow-hidden ${isSidebarOpen ? "w-[260px]" : "w-0"}`} style={{ background: "linear-gradient(180deg, #1C1C1C 0%, #111111 100%)" }}>

          {/* Logo Area */}
          <div className="px-5 py-5 border-b shrink-0" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg, #D4561A, #b83e10)" }}>
                <LayoutDashboard size={17} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-white leading-tight tracking-tight">Flag Journeys</p>
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#2E8B8B" }}>Admin Panel</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <div className="flex-1 overflow-y-auto py-4 pl-3 pr-0 space-y-1">
            <nav>
              {isSalesMember ? (
                <>
                  <SideLink href="/dashboard/my-leads" label="My Leads" icon={UserSearch} path={path} />
                  <SideLink href="/dashboard/vendor-directory" label="Vendor Directory" icon={Contact} path={path} />
                </>
              ) : (
                <>
                  <SideLink href="/dashboard" label="Dashboard" icon={LayoutDashboard} path={path} exact />

                  {!showGlobalOnly && (
                    <>
                      {visibleSections.map((section) => {
                        const SectionIcon = section.icon;
                        const isOpen = openSections[section.key] ?? false;
                        const isActiveSection = section.items.some((item) => path.startsWith(item.href));
                        const visibleItems = section.items.filter((item) =>
                          item.superAdminOnly ? isSuperAdmin : item.teams.some((t) => teamsToShow.includes(t))
                        );

                        if (visibleItems.length === 0) return null;

                        if (visibleItems.length === 1) {
                          const item = visibleItems[0];
                          const Icon = item.icon;
                          return <SideLink key={item.name} href={item.href} label={item.name} icon={Icon} path={path} />;
                        }

                        return (
                          <div key={section.key} className={`mt-1 py-1.5 pl-2 pr-3 border-l-[3px] transition-all duration-300 ${isOpen ? "border-[#2E8B8B] bg-gradient-to-r from-[#2E8B8B]/15 to-transparent" : "border-transparent"}`}>
                            <button
                              onClick={() => toggleSection(section.key)}
                              className={`w-full flex items-center gap-3 px-2 py-2 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                                isOpen
                                  ? "text-white"
                                  : "text-white/75 hover:bg-white/10 hover:text-white"
                              }`}
                            >
                              <span
                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                  isOpen ? "text-white bg-[#2E8B8B] shadow-sm" : "text-white/70 group-hover:text-white bg-white/5"
                                }`}
                              >
                                <SectionIcon size={16} />
                              </span>
                              <span className="truncate flex-1 text-left">{section.label}</span>
                              <ChevronDown size={14} className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 text-white" : ""}`} />
                            </button>

                            {isOpen && (
                              <div className="mt-1 ml-2 space-y-1.5 py-1">
                                {visibleItems.map((item) => {
                                  const Icon = item.icon;
                                  const active = path.startsWith(item.href);
                                  return (
                                    <Link
                                      key={item.name}
                                      href={item.href}
                                      className={`flex items-center gap-2.5 px-2.5 py-1.5 text-[15px] transition-all duration-150 rounded-lg ${
                                        active
                                          ? "text-white bg-[#2E8B8B]/40 shadow-sm font-bold"
                                          : "text-white/60 hover:text-white font-medium hover:bg-white/5"
                                      }`}
                                    >
                                      {item.name}
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {(isSuperAdmin || user.role === "team_leader") && (
                        <SideLink href="/dashboard/teams" label="Teams" icon={UsersRound} path={path} />
                      )}
                    </>
                  )}
                </>
              )}
            </nav>
          </div>

          {/* Bottom logout */}
          <div className="px-3 py-4 shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:bg-white/10 hover:text-red-400 transition-all duration-200 text-sm font-semibold group"
            >
              <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-red-500/10">
                <LogOut size={15} />
              </span>
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] min-h-screen">
          {/* Top Header */}
          <header className="h-[72px] bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
            <div className="flex items-center gap-5">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
                <Menu size={22} />
              </button>
              <div className="relative h-10 w-44 flex items-center">
                <Image src="/logo.png" alt="Logo" fill className="object-contain object-left" />
              </div>
            </div>
            {user && (
              <div className="flex items-center gap-5">
                <NotificationBell />
                <div className="h-8 w-px bg-slate-200"></div>
                <div className="relative">
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center gap-3 hover:bg-slate-50 p-1.5 pr-3 rounded-full transition-colors text-left border border-transparent hover:border-slate-200"
                  >
                    <div className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-sm uppercase shadow-sm">
                      {user.name.charAt(0)}
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-sm font-bold text-slate-700 leading-tight">{user.name.split(" ")[0]}</p>
                      <p className="text-[11px] font-semibold text-slate-400 capitalize">{user.role}</p>
                    </div>
                    <ChevronDown size={14} className="text-slate-400 ml-1" />
                  </button>

                  {isProfileDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-lg shadow-lg py-1 z-50">
                        <div className="px-4 py-2 border-b border-gray-100 mb-1">
                          <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                        </div>
                        <Link
                          href="/profile"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <UserCog size={16} />
                          Profile
                        </Link>
                        <button
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                        >
                          <LogOut size={16} />
                          Logout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </header>

          <div className="flex-1 p-6 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
