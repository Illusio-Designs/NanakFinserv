"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar as CalIcon } from "lucide-react";
import Calendar from "./Calendar";
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
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const label2 = value.from ? `${fmt(value.from)} → ${value.to ? fmt(value.to) : "…"}` : placeholder;

  return (
    <div className="w-full" ref={ref}>
      {label && <label className="ui-label">{label}</label>}
      <div className="relative">
        <button type="button" onClick={() => setOpen((o) => !o)} className="ui-control flex items-center justify-between text-left">
          <span className={cn(!value.from && "text-muted/70")}>{label2}</span>
          <CalIcon size={16} className="text-muted" />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.14 }}
              className="absolute z-40 mt-1"
            >
              <Calendar
                mode="range"
                value={value}
                onSelect={(r) => {
                  onChange?.(r);
                  if (r.from && r.to) setOpen(false);
                }}
              />
              {value.from && (
                <button
                  type="button"
                  onClick={() => { onChange?.({}); }}
                  className="mt-1 w-full rounded-md border border-line bg-surface py-1.5 text-[12px] text-muted hover:bg-subtle"
                >
                  Clear
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
