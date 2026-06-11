"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

export default function Switch({ checked, onChange, label, disabled, className }) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-3 select-none", disabled && "opacity-60", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200", checked ? "bg-brand-600" : "bg-line")}
      >
        <motion.span
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
          animate={{ left: checked ? 22 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
        />
      </button>
      {label && <span className="text-[14px] text-ink">{label}</span>}
    </label>
  );
}
