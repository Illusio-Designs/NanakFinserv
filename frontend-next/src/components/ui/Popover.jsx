"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Renders `children` in a portal anchored under `anchorRef`, so menus never get
 * clipped by a modal/overflow container. Closes on outside click / scroll.
 */
export default function Popover({ open, onClose, anchorRef, children, matchWidth = true }) {
  const menuRef = useRef(null);
  const [pos, setPos] = useState(null);

  useEffect(() => {
    if (!open) return;
    let raf;
    const update = () => {
      const el = anchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const menuH = menuRef.current?.offsetHeight || 0;
      const spaceBelow = window.innerHeight - r.bottom;
      // Flip above the trigger when there isn't room below (e.g. table footer).
      const openUp = menuH > 0 && spaceBelow < menuH + 12 && r.top > spaceBelow;
      setPos({
        top: openUp ? Math.max(8, r.top - menuH - 4) : r.bottom + 4,
        left: r.left,
        width: r.width,
      });
    };
    update();
    // Re-measure once the menu has a height so the flip decision is accurate.
    if (typeof requestAnimationFrame !== "undefined") raf = requestAnimationFrame(update);
    const onDoc = (e) => {
      if (anchorRef.current?.contains(e.target)) return;
      if (menuRef.current?.contains(e.target)) return;
      onClose?.();
    };
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    document.addEventListener("mousedown", onDoc);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      document.removeEventListener("mousedown", onDoc);
    };
  }, [open, anchorRef, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && pos && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.14 }}
          style={{ position: "fixed", top: pos.top, left: pos.left, width: matchWidth ? pos.width : undefined, zIndex: 80 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
