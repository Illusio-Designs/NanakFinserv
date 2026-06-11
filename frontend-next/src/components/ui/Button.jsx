"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import Spinner from "./Spinner";

const VARIANTS = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-card",
  secondary: "bg-surface text-ink border border-line hover:bg-subtle",
  ghost: "bg-transparent text-ink hover:bg-subtle",
  danger: "bg-danger text-white hover:brightness-95",
};
const SIZES = {
  sm: "h-9 px-3 text-[13px] gap-1.5",
  md: "h-10 px-4 text-[14px] gap-2",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className,
  icon: Icon,
  type = "button",
  ...props
}) {
  return (
    <motion.button
      type={type}
      whileHover={disabled || loading ? undefined : { scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {loading ? <Spinner size={16} /> : Icon ? <Icon size={16} /> : null}
      {children}
    </motion.button>
  );
}
