"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home } from "lucide-react";
import { FloatingOrbs } from "@/components/public/Motion3D";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-subtle px-6 text-center">
      <FloatingOrbs />
      <div className="pointer-events-none absolute inset-0 bg-dots opacity-50" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative"
      >
        <div className="text-gradient text-[96px] font-bold leading-none tracking-tight">404</div>
        <h1 className="mt-2 text-[22px] font-semibold text-ink">Page not found</h1>
        <p className="mx-auto mt-2 max-w-sm text-[14px] text-muted">
          The page you're looking for doesn't exist or has moved.
        </p>
        <div className="mt-7 flex items-center justify-center gap-3">
          <Link href="/" className="press inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-[14px] font-semibold text-white shadow-glow transition-colors hover:bg-brand-700">
            <Home size={16} /> Go home
          </Link>
          <Link href="/dashboard" className="press inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-5 py-3 text-[14px] font-semibold text-ink hover:bg-subtle">
            Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
