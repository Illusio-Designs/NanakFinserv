"use client";
import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";

/** tabs: [{ value, label }]; value + onChange controlled. */
export default function Tabs({ tabs = [], value, onChange, className }) {
  const rm = useReducedMotion();
  const id = useId(); // unique layout group per Tabs instance
  return (
    <div className={cn("inline-flex rounded-lg border border-line bg-subtle p-1", className)}>
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            onClick={() => onChange?.(t.value)}
            className={cn(
              "press relative rounded-md px-3.5 py-1.5 text-[13px] font-medium transition-colors",
              active ? "text-brand-700" : "text-muted hover:text-ink"
            )}
          >
            {active && (
              <motion.span
                layoutId={`tab-${id}`}
                transition={rm ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
                className="absolute inset-0 rounded-md bg-surface shadow-card"
              />
            )}
            <span className="relative z-10">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
