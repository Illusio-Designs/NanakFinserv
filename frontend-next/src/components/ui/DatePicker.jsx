"use client";
import { useRef, useState } from "react";
import { Calendar as CalIcon } from "lucide-react";
import Calendar from "./Calendar";
import Popover from "./Popover";
import { cn } from "@/lib/cn";

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function display(v) {
  if (!v) return "";
  const [y, m, d] = v.split("-");
  return `${d} ${MONTHS_SHORT[Number(m) - 1]} ${y}`;
}

export default function DatePicker({ label, value = "", onChange, error, min, max, placeholder = "Select date", className }) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  return (
    <div className={cn("w-full", className)}>
      {label && <label className="ui-label">{label}</label>}
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn("ui-control flex items-center justify-between text-left", error && "border-danger ring-2 ring-danger/15")}
      >
        <span className={cn(!value && "text-muted/70")}>{value ? display(value) : placeholder}</span>
        <CalIcon size={16} className="text-muted" />
      </button>
      <Popover open={open} onClose={() => setOpen(false)} anchorRef={anchorRef} matchWidth={false}>
        <Calendar value={value} min={min} max={max} onSelect={(d) => { onChange?.(d); setOpen(false); }} />
      </Popover>
      {error && <p className="mt-1 text-[12px] text-danger">{error}</p>}
    </div>
  );
}
