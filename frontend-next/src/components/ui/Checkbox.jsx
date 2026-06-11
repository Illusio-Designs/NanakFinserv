"use client";
import { Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";

export default function Checkbox({ checked, onChange, label, className }) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2 select-none", className)}>
      <span
        onClick={() => onChange?.(!checked)}
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-[5px] border transition-colors",
          checked ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-surface"
        )}
      >
        <AnimatePresence>
          {checked && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
            >
              <Check size={13} strokeWidth={3} />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      {label && <span className="text-[14px] text-ink">{label}</span>}
    </label>
  );
}
