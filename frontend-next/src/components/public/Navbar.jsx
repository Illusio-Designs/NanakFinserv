"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";

const LINKS = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Assets/logo.png" alt="NanakFinserv" className="h-9 object-contain" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-md px-3 py-2 text-[14px] font-medium transition-colors",
                pathname === l.href ? "text-brand-600" : "text-ink/70 hover:text-brand-600"
              )}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="press ml-2 rounded-md bg-brand-600 px-4 py-2 text-[14px] font-medium text-white hover:bg-brand-700"
          >
            Login
          </Link>
        </nav>

        <button className="press rounded-md p-2 text-ink md:hidden" onClick={() => setOpen((o) => !o)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-surface md:hidden">
          <div className="space-y-1 px-4 py-3">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 text-[14px] font-medium text-ink/80 hover:bg-subtle">
                {l.label}
              </Link>
            ))}
            <Link href="/login" onClick={() => setOpen(false)} className="block rounded-md bg-brand-600 px-3 py-2 text-center text-[14px] font-medium text-white">
              Login
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
