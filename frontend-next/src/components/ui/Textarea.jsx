import { cn } from "@/lib/cn";

export default function Textarea({ label, error, rows = 4, className, ...props }) {
  return (
    <div className="w-full">
      {label && <label className="ui-label">{label}</label>}
      <textarea
        rows={rows}
        className={cn(
          "w-full rounded-md border border-line bg-surface px-3 py-2 text-[14px] text-ink outline-none transition-all placeholder:text-muted/70 focus:border-brand-600 focus:ring-2 focus:ring-brand-100",
          error && "border-danger ring-2 ring-danger/15",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-[12px] text-danger">{error}</p>}
    </div>
  );
}
