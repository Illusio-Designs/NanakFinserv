"use client";
/**
 * Motion toolkit — emil-kowalski rules baked in: short durations, ease-out enter,
 * transform+opacity only, and every helper honours prefers-reduced-motion.
 */
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

// ease-out — fast start, gentle landing (the "enter" curve).
export const EASE_OUT = [0.16, 1, 0.3, 1];

/** Fade + rise into view once. */
export function Reveal({ children, className, delay = 0, y = 10 }) {
  const rm = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={rm ? false : { opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_OUT, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Parent that staggers its <StaggerItem> children in. */
export function Stagger({ children, className, gap = 0.06, delay = 0.04 }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: gap, delayChildren: delay } } }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, y = 12 }) {
  const rm = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={{
        hidden: rm ? { opacity: 0 } : { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT } },
      }}
    >
      {children}
    </motion.div>
  );
}

/** Number that counts up from 0 (ease-out). Non-numeric values render as-is. */
export function CountUp({ value, format = (n) => n, duration = 750, className }) {
  const rm = useReducedMotion();
  const n = Number(value);
  const finite = Number.isFinite(n);
  const [display, setDisplay] = useState(finite && !rm ? 0 : n);
  const raf = useRef();

  useEffect(() => {
    if (!finite || rm) { setDisplay(n); return; }
    let start;
    const tick = (t) => {
      if (start === undefined) start = t;
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setDisplay(Math.round(n * eased));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [n, finite, rm, duration]);

  return <span className={className}>{finite ? format(display) : (value ?? "—")}</span>;
}

/** Route-change transition — re-keys on pathname so each page eases in. */
export function PageTransition({ routeKey, children }) {
  const rm = useReducedMotion();
  return (
    <motion.div
      key={routeKey}
      initial={rm ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}
