"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import Modal from "./Modal";
import Button from "./Button";
import { cn } from "@/lib/cn";

/**
 * Multi-step modal.
 * steps: [{ title, render: () => JSX, validate?: () => true|errorString }]
 * onSubmit(): called on the final step's "Submit".
 */
export default function StepperModal({ open, onClose, title, steps = [], onSubmit, submitting = false }) {
  const [current, setCurrent] = useState(0);
  const [dir, setDir] = useState(1);
  // Always start a fresh open at step 0. The parent may close us WITHOUT going
  // through close() (e.g. after a successful submit it calls onClose directly),
  // which would otherwise leave `current` pinned on the last step — so reopening
  // showed the Review step + Submit on an empty form and failed validation.
  useEffect(() => { if (open) { setCurrent(0); setDir(1); } }, [open]);
  // Clamp in case the steps array shrank (conditional steps) while mounted.
  const clampedCurrent = Math.min(current, steps.length - 1);
  const last = clampedCurrent === steps.length - 1;

  const reset = () => setCurrent(0);
  const close = () => {
    reset();
    onClose?.();
  };

  const next = () => {
    const v = steps[clampedCurrent]?.validate?.();
    if (v && v !== true) return; // step handles its own error display/toast
    setDir(1);
    setCurrent(() => Math.min(clampedCurrent + 1, steps.length - 1));
  };
  const back = () => {
    setDir(-1);
    setCurrent(() => Math.max(clampedCurrent - 1, 0));
  };

  return (
    <Modal open={open} onClose={close} title={title} size="lg">
      {/* Stepper header */}
      <div className="mb-5 flex items-center">
        {steps.map((s, i) => {
          const done = i < clampedCurrent;
          const active = i === clampedCurrent;
          return (
            <div key={i} className="flex flex-1 items-center last:flex-none">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-semibold transition-colors",
                    done && "bg-brand-600 text-white",
                    active && "bg-brand-50 text-brand-700 ring-2 ring-brand-600",
                    !done && !active && "bg-subtle text-muted"
                  )}
                >
                  {done ? <Check size={15} /> : i + 1}
                </div>
                <span className={cn("hidden text-[13px] font-medium sm:block", active ? "text-ink" : "text-muted")}>
                  {s.title}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn("mx-3 h-px flex-1 transition-colors", done ? "bg-brand-600" : "bg-line")} />
              )}
            </div>
          );
        })}
      </div>

      {/* Animated step body */}
      <div className="min-h-[180px]">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={clampedCurrent}
            custom={dir}
            initial={{ opacity: 0, x: dir * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -24 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {steps[clampedCurrent]?.render?.()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" onClick={current === 0 ? close : back}>
          {current === 0 ? "Cancel" : "Back"}
        </Button>
        {last ? (
          <Button onClick={onSubmit} loading={submitting}>
            Submit
          </Button>
        ) : (
          <Button onClick={next}>Next</Button>
        )}
      </div>
    </Modal>
  );
}
