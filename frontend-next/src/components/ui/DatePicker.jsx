"use client";
import { useRef } from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/cn";

/** Styled single date selector. value/onChange = "YYYY-MM-DD" string. */
export default function DatePicker({ label, value = "", onChange, error, min, max, className }) {
  const ref = useRef(null);
  const open = () => {
    try { ref.current?.showPicker?.(); } catch { /* fallback to native click */ }
    ref.current?.focus();
  };
  return (
    <div className="w-full">
      {label && <label className="ui-label">{label}</label>}
      <div className="relative">
        <Calendar size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          ref={ref}
          type="date"
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange?.(e.target.value)}
          onClick={open}
          className={cn("ui-control cursor-pointer pl-9", error && "border-danger ring-2 ring-danger/15", className)}
        />
      </div>
      {error && <p className="mt-1 text-[12px] text-danger">{error}</p>}
    </div>
  );
}
