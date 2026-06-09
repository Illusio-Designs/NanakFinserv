"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Cookies from "js-cookie";
import {
  LayoutDashboard, Users, Building2, Car, ShieldCheck, HandCoins, HeartPulse,
  UserCog, Settings, X, ChevronLeft, ChevronRight, ChevronDown, MessageSquare, LifeBuoy, FileText, History,
} from "lucide-react";
import Tooltip from "@/components/ui/Tooltip";
import { cn } from "@/lib/cn";
import { ROLE_IDS } from "@/config/ids";

const NAV = [
  { section: "Overview", items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }] },
  {
    section: "Business",
    items: [
      { label: "Consumers", href: "/consumers", icon: Users },
      { label: "Loan", href: "/loan", icon: HandCoins, vertical: "loan" },
      { label: "Mediclaim", href: "/mediclaim", icon: HeartPulse, vertical: "mediclaim" },
      { label: "Vehicle", href: "/vehicle", icon: Car, vertical: "vehicle" },
      { label: "Life Insurance", href: "/life", icon: ShieldCheck, vertical: "life" },
      { label: "Builder", href: "/builder", icon: Building2, vertical: "builder" },
      { label: "Units", href: "/units", icon: Building2, vertical: "builder" },
    ],
  },
  {
    section: "Admin",
    items: [
      { label: "Users & Roles", href: "/users", icon: UserCog },
      { label: "Activity Log", href: "/logs", icon: History },
      { label: "Blog", href: "/blog-admin", icon: FileText },
      { label: "Inquiries", href: "/inquiries", icon: MessageSquare },
      { label: "Support", href: "/support", icon: LifeBuoy },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

// Vertical managers → the single vertical they manage.
const MANAGER_VERTICAL = {
  [ROLE_IDS.LOAN_MANAGER]: "loan",
  [ROLE_IDS.MEDICLAIM_MANAGER]: "mediclaim",
  [ROLE_IDS.VEHICLE_MANAGER]: "vehicle",
  [ROLE_IDS.LIFE_MANAGER]: "life",
};

// An item shows unless its vertical is explicitly disabled in settings.
const isVerticalEnabled = (item, verticals) => !item.vertical || !verticals || verticals[item.vertical] !== false;

// Role gate: super admin sees all; a vertical manager sees Dashboard + Consumers +
// their own vertical (+ Activity Log); builder roles see Builder/Units; non-admins
// don't get the Admin tools.
function allowedForRole(item, section, role) {
  if (!role || role === ROLE_IDS.SUPER_ADMIN) return true;
  const mv = MANAGER_VERTICAL[role];
  if (mv) {
    if (section === "Admin") return item.href === "/logs";
    if (item.vertical && item.vertical !== mv) return false;
    if (item.href === "/builder" || item.href === "/units") return false;
    return true;
  }
  if (role === ROLE_IDS.BUILDER || role === ROLE_IDS.BUILDING_MANAGER) {
    if (section === "Admin") return false;
    if (item.vertical && item.vertical !== "builder") return false;
    return true;
  }
  return true; // other back-office roles behave like admin
}

export default function Sidebar({ open, onClose, collapsed, onToggleCollapse, verticals }) {
  const pathname = usePathname();
  const [role, setRole] = useState(undefined);          // undefined = not read yet
  const [openSections, setOpenSections] = useState(null); // collapsible group state

  useEffect(() => {
    try { const u = JSON.parse(Cookies.get("user") || "{}"); setRole(u.Role || u.role_id || null); } catch { setRole(null); }
    try { const s = localStorage.getItem("sidebar-sections"); setOpenSections(s ? JSON.parse(s) : {}); } catch { setOpenSections({}); }
  }, []);

  // Wait for settings + role so disabled verticals / role items never flash in.
  const loading = verticals === null || role === undefined;

  const groups = NAV
    .map((g) => ({ ...g, items: g.items.filter((it) => isVerticalEnabled(it, verticals) && allowedForRole(it, g.section, role)) }))
    .filter((g) => g.items.length > 0);

  const isOpen = (section) => !openSections || openSections[section] !== false; // default open
  const toggleSection = (section) => {
    setOpenSections((prev) => {
      const base = prev || {};
      const next = { ...base, [section]: base[section] === false }; // flip
      try { localStorage.setItem("sidebar-sections", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const renderLink = (item) => {
    const active = pathname === item.href || pathname.startsWith(item.href + "/");
    const Icon = item.icon;
    const link = (
      <Link
        href={item.href}
        onClick={onClose}
        className={cn(
          "group flex items-center rounded-lg text-[14px] font-medium transition-all",
          collapsed ? "h-10 w-10 justify-center" : "gap-3 px-3 py-2.5",
          active ? "bg-brand-600 text-white shadow-lg shadow-brand-600/25" : "text-sidebar-text hover:bg-sidebar-hover hover:text-white"
        )}
      >
        <Icon size={18} className={cn(active ? "text-white" : "text-sidebar-text/80 group-hover:text-white")} />
        {!collapsed && item.label}
      </Link>
    );
    return (
      <div key={item.href} className={collapsed ? "flex justify-center" : ""}>
        {collapsed ? <Tooltip label={item.label} side="right">{link}</Tooltip> : link}
      </div>
    );
  };

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-ink/50 lg:hidden" onClick={onClose} />}

      <aside
        className={cn(
          "fixed z-40 flex h-screen flex-col bg-sidebar text-sidebar-text transition-all duration-200 lg:sticky lg:top-0 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
          collapsed ? "w-[76px]" : "w-[var(--sidebar-w)]"
        )}
      >
        {/* Brand */}
        <div className={cn("flex h-[var(--header-h)] items-center", collapsed ? "justify-center px-2" : "justify-between px-5")}>
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/Assets/cropped-logo.png" alt="NanakFinserv" className="h-full w-full object-contain" />
            </div>
            {!collapsed && (
              <div className="leading-tight">
                <div className="text-[14px] font-semibold text-white">NanakFinserv</div>
                <div className="text-[10px] uppercase tracking-widest text-sidebar-text/60">CRM</div>
              </div>
            )}
          </Link>
          {!collapsed && (
            <button className="press rounded-md p-1.5 text-sidebar-text hover:bg-sidebar-hover lg:hidden" onClick={onClose}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* Nav — collapsible dropdown sections (expanded mode); flat icons when collapsed */}
        <nav className={cn("flex-1 space-y-4 px-3 py-4", collapsed ? "overflow-visible" : "overflow-y-auto")}>
          {loading ? (
            <div className="space-y-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className={cn("h-10 rounded-lg bg-white/10", collapsed ? "mx-auto w-10" : "w-full")} />
              ))}
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.section}>
                {!collapsed && (
                  <button
                    onClick={() => toggleSection(group.section)}
                    className="mb-1 flex w-full items-center justify-between px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-text/40 transition-colors hover:text-sidebar-text/70"
                  >
                    <span>{group.section}</span>
                    <ChevronDown size={14} className={cn("transition-transform", !isOpen(group.section) && "-rotate-90")} />
                  </button>
                )}
                {(collapsed || isOpen(group.section)) && <div className="space-y-1">{group.items.map(renderLink)}</div>}
              </div>
            ))
          )}
        </nav>

        {/* Collapse toggle (desktop) */}
        <div className={cn("hidden border-t border-white/10 p-3 lg:flex", collapsed && "justify-center")}>
          <Tooltip label={collapsed ? "Expand" : "Collapse"} side="right">
            <button
              onClick={onToggleCollapse}
              className="press flex h-9 items-center gap-2 rounded-md px-3 text-[13px] text-sidebar-text hover:bg-sidebar-hover hover:text-white"
            >
              {collapsed ? <ChevronRight size={18} /> : <><ChevronLeft size={18} /> Collapse</>}
            </button>
          </Tooltip>
        </div>
      </aside>
    </>
  );
}
