"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Building2, Car, ShieldCheck, HandCoins, HeartPulse,
  UserCog, Settings, X, ChevronLeft, ChevronRight, MessageSquare, LifeBuoy, FileText,
} from "lucide-react";
import Tooltip from "@/components/ui/Tooltip";
import { cn } from "@/lib/cn";

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
      { label: "Blog", href: "/blog-admin", icon: FileText },
      { label: "Inquiries", href: "/inquiries", icon: MessageSquare },
      { label: "Support", href: "/support", icon: LifeBuoy },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

// An item shows unless its vertical is explicitly disabled in settings.
const isItemVisible = (item, verticals) => !item.vertical || !verticals || verticals[item.vertical] !== false;

export default function Sidebar({ open, onClose, collapsed, onToggleCollapse, verticals }) {
  const pathname = usePathname();
  const groups = NAV
    .map((g) => ({ ...g, items: g.items.filter((it) => isItemVisible(it, verticals)) }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-ink/50 lg:hidden" onClick={onClose} />}

      <aside
        className={cn(
          "fixed z-40 flex h-screen flex-col bg-sidebar text-sidebar-text transition-all duration-200 lg:static lg:translate-x-0",
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

        {/* Nav — when collapsed, allow overflow so the right-side tooltips
            aren't clipped; expanded uses vertical scroll. */}
        <nav className={cn("flex-1 space-y-5 px-3 py-4", collapsed ? "overflow-visible" : "overflow-y-auto")}>
          {groups.map((group) => (
            <div key={group.section}>
              {!collapsed && (
                <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-text/40">
                  {group.section}
                </div>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
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
                })}
              </div>
            </div>
          ))}
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
