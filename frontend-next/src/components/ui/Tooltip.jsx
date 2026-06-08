import { cn } from "@/lib/cn";

/** Custom CSS tooltip. side: 'top' | 'right'. */
export default function Tooltip({ label, side = "top", children, className }) {
  if (!label) return children;
  return (
    <span className={cn("crm-tip", className)}>
      {children}
      <span className={cn("crm-tip-bubble", side)}>{label}</span>
    </span>
  );
}
