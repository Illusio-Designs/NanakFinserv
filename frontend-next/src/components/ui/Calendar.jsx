"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const pad = (n) => String(n).padStart(2, "0");
const toStr = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

/**
 * Custom calendar.
 *  - mode="single" (default): value/onSelect = "YYYY-MM-DD".
 *  - mode="range": value/onSelect = { from, to }. One calendar, click start
 *    then end (start→end highlighted).
 */
export default function Calendar({ value, onSelect, min, max, mode = "single" }) {
  const today = new Date();
  const todayStr = toStr(today.getFullYear(), today.getMonth(), today.getDate());

  const anchor = mode === "range" ? value?.from : value;
  const init = anchor ? new Date(anchor + "T00:00:00") : today;
  const [view, setView] = useState({ y: init.getFullYear(), m: init.getMonth() });

  const firstDay = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const move = (delta) => {
    let m = view.m + delta, y = view.y;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setView({ y, m });
  };

  const disabled = (dStr) => (min && dStr < min) || (max && dStr > max);

  const handleClick = (dStr) => {
    if (mode !== "range") return onSelect?.(dStr);
    const { from, to } = value || {};
    if (!from || (from && to)) {
      onSelect?.({ from: dStr, to: "" }); // start a new range
    } else if (dStr >= from) {
      onSelect?.({ from, to: dStr });
    } else {
      onSelect?.({ from: dStr, to: from }); // clicked before start → swap
    }
  };

  const rangeState = (dStr) => {
    if (mode !== "range") return value === dStr ? "end" : "";
    const { from, to } = value || {};
    if (from && dStr === from) return "end";
    if (to && dStr === to) return "end";
    if (from && to && dStr > from && dStr < to) return "mid";
    return "";
  };

  return (
    <div className="w-64 rounded-lg border border-line bg-surface p-3 shadow-pop">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={() => move(-1)} className="press rounded-md p-1.5 text-muted hover:bg-subtle hover:text-ink">
          <ChevronLeft size={16} />
        </button>
        <div className="text-[13px] font-semibold text-ink">{MONTHS[view.m]} {view.y}</div>
        <button type="button" onClick={() => move(1)} className="press rounded-md p-1.5 text-muted hover:bg-subtle hover:text-ink">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-medium text-muted">
        {WEEKDAYS.map((w) => <div key={w} className="py-1">{w}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const dStr = toStr(view.y, view.m, d);
          const state = rangeState(dStr);
          const hasRange = mode === "range" && value && value.from && value.to;
          const isToday = todayStr === dStr;
          const dis = disabled(dStr);
          return (
            <div
              key={i}
              className={cn(
                "flex h-9 items-center justify-center",
                state === "mid" && "bg-brand-50",
                hasRange && state === "end" && dStr === value.from && "rounded-l-full bg-brand-50",
                hasRange && state === "end" && dStr === value.to && "rounded-r-full bg-brand-50"
              )}
            >
              <button
                type="button"
                disabled={dis}
                onClick={() => handleClick(dStr)}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full text-[13px] transition-colors",
                  state === "end" ? "bg-brand-600 font-semibold text-white shadow-sm" : state === "mid" ? "text-brand-700" : "text-ink hover:bg-brand-100",
                  !state && isToday && "ring-1 ring-brand-500 text-brand-700",
                  dis && "cursor-not-allowed text-muted/40 hover:bg-transparent"
                )}
              >
                {d}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
