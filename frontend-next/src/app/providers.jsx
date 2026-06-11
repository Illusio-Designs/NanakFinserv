"use client";
import { MotionConfig } from "framer-motion";

/**
 * App-wide motion config. reducedMotion="user" makes ALL framer-motion animations
 * (incl. raw whileHover/whileTap/spring on Button, Switch, Checkbox, Tabs…)
 * automatically respect the OS "reduce motion" setting — the framer best practice,
 * complementing the per-component useReducedMotion guards and the CSS media query.
 */
export default function Providers({ children }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
