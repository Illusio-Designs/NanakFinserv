"use client";
import { useRef, useState } from "react";
import { Calendar as CalIcon } from "lucide-react";
import Calendar from "./Calendar";
import Popover from "./Popover";
import { cn } from "@/lib/cn";

const M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmt = (v) => {
  if (!v) return "";
  const [y, m, d] = v.split("-");
  return `${d} ${M[Number(m) - 1]} ${y}`;
};

/** Start→end range selection in ONE calendar. value = { from, to }. */
export default function DateRange({ label, value = {}, onChange, placeholder = "Select date range" }) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const label2 = value.from ? `${fmt(value.from)} → ${value.to ? fmt(value.to) : "…"}` : placeholder;

  return (
    <div className="w-full">
      {label && <label className="ui-label">{label}</label>}
      <button ref={anchorRef} type="button" onClick={() => setOpen((o) => !o)} className="ui-control flex items-center justify-between text-left">
        <span className={cn(!value.from && "text-muted/70")}>{label2}</span>
        <CalIcon size={16} className="text-muted" />
      </button>
      <Popover open={open} onClose={() => setOpen(false)} anchorRef={anchorRef} matchWidth={false}>
        <div>
          <Calendar
            mode="range"
            value={value}
            onSelect={(r) => {
              onChange?.(r);
              if (r.from && r.to) setOpen(false);
            }}
          />
          {value.from && (
            <button type="button" onClick={() => onChange?.({})} className="mt-1 w-full rounded-md border border-line bg-surface py-1.5 text-[12px] text-muted hover:bg-subtle">
              Clear
            </button>
          )}
        </div>
      </Popover>
    </div>
  );
}
