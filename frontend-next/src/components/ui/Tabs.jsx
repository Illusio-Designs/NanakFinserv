"use client";
import { cn } from "@/lib/cn";

/** tabs: [{ value, label }]; value + onChange controlled. */
export default function Tabs({ tabs = [], value, onChange, className }) {
  return (
    <div className={cn("inline-flex rounded-lg border border-line bg-subtle p-1", className)}>
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            onClick={() => onChange?.(t.value)}
            className={cn(
              "press rounded-md px-3.5 py-1.5 text-[13px] font-medium transition-colors",
              active ? "bg-surface text-brand-700 shadow-card" : "text-muted hover:text-ink"
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
