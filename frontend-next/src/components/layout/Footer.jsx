"use client";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto flex flex-col items-center justify-between gap-1 border-t border-line bg-surface px-4 py-3 text-[12px] text-muted sm:flex-row sm:px-6">
      <span>© {year} NanakFinserv. All rights reserved.</span>
      <span className="flex items-center gap-1">
        Powered by <span className="font-medium text-ink">NanakFinserv CRM</span>
      </span>
    </footer>
  );
}
