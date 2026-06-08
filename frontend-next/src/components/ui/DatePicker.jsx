"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar as CalIcon } from "lucide-react";
import Calendar from "./Calendar";
import { cn } from "@/lib/cn";

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function display(v) {
  if (!v) return "";
  const [y, m, d] = v.split("-");
  return `${d} ${MONTHS_SHORT[Number(m) - 1]} ${y}`;
}

/** Custom-calendar date selector. value/onChange = "YYYY-MM-DD". */
export default function DatePicker({ label, value = "", onChange, error, min, max, placeholder = "Select date", className }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className={cn("w-full", className)} ref={ref}>
      {label && <label className="ui-label">{label}</label>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn("ui-control flex items-center justify-between text-left", error && "border-danger ring-2 ring-danger/15")}
        >
          <span className={cn(!value && "text-muted/70")}>{value ? display(value) : placeholder}</span>
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
              <Calendar value={value} min={min} max={max} onSelect={(d) => { onChange?.(d); setOpen(false); }} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {error && <p className="mt-1 text-[12px] text-danger">{error}</p>}
    </div>
  );
}
