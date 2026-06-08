"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Custom dropdown (not a native <select>).
 * props: label, value, onChange(value), options:[{value,label}], placeholder,
 *        error, variant ('default' | 'light' for use on coloured backgrounds).
 */
export default function Dropdown({ label, value, onChange, options = [], placeholder = "Select…", error, variant = "default", className }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find((o) => String(o.value) === String(value));

  useEffect(() => {
    const onDoc = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const triggerCls =
    variant === "light"
      ? "w-full rounded-md border-0 bg-white/95 px-3 text-[14px] text-ink"
      : cn("ui-control", error && "border-danger ring-2 ring-danger/15");

  return (
    <div className={cn("w-full", className)} ref={ref}>
      {label && <label className="ui-label">{label}</label>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(triggerCls, "flex items-center justify-between gap-2 text-left")}
          style={variant === "light" ? { height: "var(--control-h)" } : undefined}
        >
          <span className={cn(!selected && "text-muted/70")}>{selected ? selected.label : placeholder}</span>
          <ChevronDown size={16} className={cn("shrink-0 text-muted transition-transform", open && "rotate-180")} />
        </button>

        <AnimatePresence>
          {open && (
            <motion.ul
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.14 }}
              className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-md border border-line bg-surface p-1 shadow-pop"
            >
              {placeholder && (
                <li>
                  <button type="button" onClick={() => { onChange(""); setOpen(false); }} className="flex w-full items-center justify-between rounded px-3 py-2 text-left text-[13px] text-muted hover:bg-subtle">
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
                      onClick={() => { onChange(o.value); setOpen(false); }}
                      className={cn("flex w-full items-center justify-between rounded px-3 py-2 text-left text-[14px] hover:bg-subtle", active ? "text-brand-700" : "text-ink")}
                    >
                      {o.label}
                      {active && <Check size={15} className="text-brand-600" />}
                    </button>
                  </li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
      {error && <p className="mt-1 text-[12px] text-danger">{error}</p>}
    </div>
  );
}
