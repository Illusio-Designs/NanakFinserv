import { cn } from "@/lib/cn";
import { CountUp } from "./Motion";

export function Card({ className, children }) {
  return <div className={cn("ui-card p-5", className)}>{children}</div>;
}

export function StatCard({ title, value, icon: Icon, tone = "brand", format }) {
  const toneBg = {
    brand: "bg-brand-50 text-brand-700",
    success: "bg-green-50 text-green-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-600",
    muted: "bg-subtle text-muted",
  }[tone] || "bg-brand-50 text-brand-700";
  return (
    <div className="ui-card card-hover group flex items-center gap-4 p-4">
      {Icon && (
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-110", toneBg)}>
          <Icon size={20} />
        </div>
      )}
      <div className="min-w-0">
        <div className="text-[22px] font-semibold leading-none text-ink tabular-nums">
          {format ? <CountUp value={value} format={format} /> : <CountUp value={value} />}
        </div>
        <div className="mt-1 truncate text-[12px] uppercase tracking-wide text-muted">{title}</div>
      </div>
    </div>
  );
}
