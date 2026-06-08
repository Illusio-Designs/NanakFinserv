"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Building2, Car, ShieldCheck, HandCoins, HeartPulse,
  UserCog, Settings, FileText, X,
} from "lucide-react";
import { cn } from "@/lib/cn";

const NAV = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Consumers", href: "/consumers", icon: Users },
  { label: "Loan", href: "/loan", icon: HandCoins },
  { label: "Mediclaim", href: "/mediclaim", icon: HeartPulse },
  { label: "Vehicle", href: "/vehicle", icon: Car },
  { label: "Life Insurance", href: "/life", icon: ShieldCheck },
  { label: "Builder", href: "/builder", icon: Building2 },
  { label: "Users & Roles", href: "/users", icon: UserCog },
  { label: "Blog", href: "/blog", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar({ open, onClose }) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 z-30 bg-ink/40 lg:hidden" onClick={onClose} />}

      <aside
        className={cn(
          "fixed z-40 flex h-screen w-[var(--sidebar-w)] flex-col border-r border-line bg-surface transition-transform duration-200 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-[var(--header-h)] items-center justify-between border-b border-line px-5">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white font-bold">N</div>
            <span className="text-[15px] font-semibold tracking-tight">NanakFinserv</span>
          </Link>
          <button className="press rounded-md p-1.5 text-muted hover:bg-subtle lg:hidden" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2.5 text-[14px] font-medium transition-colors",
                  active ? "bg-brand-50 text-brand-700" : "text-muted hover:bg-subtle hover:text-ink"
                )}
              >
                <Icon size={18} className={cn(active ? "text-brand-600" : "text-muted group-hover:text-ink")} />
                {item.label}
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-600" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-line p-4 text-[11px] text-muted">v1.0 · Production CRM</div>
      </aside>
    </>
  );
}
