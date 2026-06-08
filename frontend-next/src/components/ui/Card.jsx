import { cn } from "@/lib/cn";

export function Card({ className, children }) {
  return <div className={cn("ui-card p-5", className)}>{children}</div>;
}

export function StatCard({ title, value, icon: Icon, tone = "brand" }) {
  const toneBg = {
    brand: "bg-brand-50 text-brand-700",
    success: "bg-green-50 text-green-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-600",
  }[tone];
  return (
    <div className="ui-card flex items-center gap-4 p-4 transition-shadow hover:shadow-pop">
      {Icon && (
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-lg", toneBg)}>
          <Icon size={20} />
        </div>
      )}
      <div>
        <div className="text-[22px] font-semibold leading-none text-ink">{value}</div>
        <div className="mt-1 text-[12px] uppercase tracking-wide text-muted">{title}</div>
      </div>
    </div>
  );
}
