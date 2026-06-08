"use client";
import { useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import Popover from "./Popover";
import { cn } from "@/lib/cn";

/**
 * Custom dropdown (not a native <select>). Menu is portaled so it never clips
 * inside modals/overflow containers.
 */
export default function Dropdown({ label, value, onChange, options = [], placeholder = "Select…", error, variant = "default", className }) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const selected = options.find((o) => String(o.value) === String(value));

  const triggerCls =
    variant === "light"
      ? "w-full rounded-md border-0 bg-white/95 px-3 text-[14px] text-ink"
      : cn("ui-control", error && "border-danger ring-2 ring-danger/15");

  const pick = (v) => { onChange?.(v); setOpen(false); };

  return (
    <div className={cn("w-full", className)}>
      {label && <label className="ui-label">{label}</label>}
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(triggerCls, "flex items-center justify-between gap-2 text-left")}
        style={variant === "light" ? { height: "var(--control-h)" } : undefined}
      >
        <span className={cn(!selected && "text-muted/70")}>{selected ? selected.label : placeholder}</span>
        <ChevronDown size={16} className={cn("shrink-0 text-muted transition-transform", open && "rotate-180")} />
      </button>

      <Popover open={open} onClose={() => setOpen(false)} anchorRef={anchorRef}>
        <ul className="max-h-60 overflow-auto rounded-md border border-line bg-surface p-1 shadow-pop">
          {placeholder && (
            <li>
              <button type="button" onClick={() => pick("")} className="w-full rounded px-3 py-2 text-left text-[13px] text-muted hover:bg-subtle">
                {placeholder}
              </button>
            </li>
          )}
          {options.map((o) => {
            const active = String(o.value) === String(value);
            return (
              <li key={o.value}>
                <button
                  type="button"
                  onClick={() => pick(o.value)}
                  className={cn("flex w-full items-center justify-between rounded px-3 py-2 text-left text-[14px] hover:bg-subtle", active ? "text-brand-700" : "text-ink")}
                >
                  {o.label}
                  {active && <Check size={15} className="text-brand-600" />}
                </button>
              </li>
            );
          })}
        </ul>
      </Popover>

      {error && <p className="mt-1 text-[12px] text-danger">{error}</p>}
    </div>
  );
}
