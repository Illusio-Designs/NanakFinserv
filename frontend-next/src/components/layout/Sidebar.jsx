"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Building2, Car, ShieldCheck, HandCoins, HeartPulse,
  UserCog, Settings, FileText, X,
} from "lucide-react";
import { cn } from "@/lib/cn";

const NAV = [
  { section: "Overview", items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }] },
  {
    section: "Business",
    items: [
      { label: "Consumers", href: "/consumers", icon: Users },
      { label: "Loan", href: "/loan", icon: HandCoins },
      { label: "Mediclaim", href: "/mediclaim", icon: HeartPulse },
      { label: "Vehicle", href: "/vehicle", icon: Car },
      { label: "Life Insurance", href: "/life", icon: ShieldCheck },
      { label: "Builder", href: "/builder", icon: Building2 },
    ],
  },
  {
    section: "Admin",
    items: [
      { label: "Users & Roles", href: "/users", icon: UserCog },
      { label: "Blog", href: "/blog", icon: FileText },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export default function Sidebar({ open, onClose }) {
  const pathname = usePathname();

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-ink/50 lg:hidden" onClick={onClose} />}

      <aside
        className={cn(
          "fixed z-40 flex h-screen w-[var(--sidebar-w)] flex-col bg-sidebar text-sidebar-text transition-transform duration-200 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="flex h-[var(--header-h)] items-center justify-between px-5">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/Assets/cropped-logo.png" alt="NanakFinserv" className="h-full w-full object-contain" />
            </div>
            <div className="leading-tight">
              <div className="text-[14px] font-semibold text-white">NanakFinserv</div>
              <div className="text-[10px] uppercase tracking-widest text-sidebar-text/60">CRM</div>
            </div>
          </Link>
          <button className="press rounded-md p-1.5 text-sidebar-text hover:bg-sidebar-hover lg:hidden" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Nav grouped by section */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          {NAV.map((group) => (
            <div key={group.section}>
              <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-text/40">
                {group.section}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium transition-all",
                        active
                          ? "bg-brand-600 text-white shadow-lg shadow-brand-600/25"
                          : "text-sidebar-text hover:bg-sidebar-hover hover:text-white"
                      )}
                    >
                      <Icon size={18} className={cn(active ? "text-white" : "text-sidebar-text/80 group-hover:text-white")} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-5 py-4 text-[11px] text-sidebar-text/50">v1.0 · Production CRM</div>
      </aside>
    </>
  );
}
