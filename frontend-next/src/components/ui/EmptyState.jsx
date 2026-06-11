"use client";
import { Inbox } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

export default function EmptyState({ title = "Nothing here yet", subtitle, icon: Icon = Inbox, action }) {
  const rm = useReducedMotion();
  return (
    <motion.div
      initial={rm ? false : { opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line bg-subtle/50 px-6 py-12 text-center"
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-subtle text-muted">
        <Icon size={22} />
      </div>
      <p className="text-[15px] font-medium text-ink">{title}</p>
      {subtitle && <p className="mt-1 max-w-sm text-[13px] text-muted">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}
