"use client";
/**
 * Immersive 3D motion toolkit for the public site — CSS 3D transforms + framer-motion.
 * emil-kowalski rules: spring-driven, transform/opacity only, every piece honours
 * prefers-reduced-motion (falls back to static / opacity-only).
 */
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion, useInView } from "framer-motion";
import { useRef } from "react";

const EASE = [0.16, 1, 0.3, 1];

/** Mouse-tracked 3D tilt. Children at higher translateZ float above the surface. */
export function TiltCard({ children, className, max = 12, scale = 1.02 }) {
  const rm = useReducedMotion();
  const ref = useRef(null);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const sx = useSpring(x, { stiffness: 220, damping: 22 });
  const sy = useSpring(y, { stiffness: 220, damping: 22 });
  const rotateX = useTransform(sy, [0, 1], [max, -max]);
  const rotateY = useTransform(sx, [0, 1], [-max, max]);

  if (rm) return <div className={className}>{children}</div>;

  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width);
    y.set((e.clientY - r.top) / r.height);
  };
  const reset = () => { x.set(0.5); y.set(0.5); };

  return (
    <div style={{ perspective: 1000 }}>
      <motion.div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={reset}
        whileHover={{ scale }}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={className}
      >
        {children}
      </motion.div>
    </div>
  );
}

/** Push a child toward/away from the viewer inside a TiltCard (depth parallax). */
export function Depth({ z = 40, children, className, style }) {
  return (
    <div className={className} style={{ transform: `translateZ(${z}px)`, transformStyle: "preserve-3d", ...style }}>
      {children}
    </div>
  );
}

/** Fade + rise when scrolled into view. */
export function ScrollReveal({ children, className, y = 26, delay = 0, once = true }) {
  const rm = useReducedMotion();
  const ref = useRef(null);
  const inView = useInView(ref, { once, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={rm ? false : { opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Staggered in-view container. */
export function StaggerReveal({ children, className, gap = 0.1 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      variants={{ show: { transition: { staggerChildren: gap } } }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, className, y = 24 }) {
  const rm = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={{
        hidden: rm ? { opacity: 0 } : { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
      }}
    >
      {children}
    </motion.div>
  );
}

/** Decorative drifting gradient orbs — adds depth behind a hero. */
export function FloatingOrbs({ className = "" }) {
  const rm = useReducedMotion();
  const orbs = [
    { c: "bg-brand-500/30", s: 340, l: "-8%", t: "-22%", dx: 24, dy: -34, d: 10 },
    { c: "bg-brand-700/25", s: 280, l: "68%", t: "4%", dx: -28, dy: 26, d: 13 },
    { c: "bg-amber-300/20", s: 220, l: "38%", t: "58%", dx: 20, dy: 20, d: 15 },
  ];
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {orbs.map((o, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-3xl ${o.c}`}
          style={{ width: o.s, height: o.s, left: o.l, top: o.t }}
          animate={rm ? {} : { x: [0, o.dx, 0], y: [0, o.dy, 0] }}
          transition={{ duration: o.d, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
