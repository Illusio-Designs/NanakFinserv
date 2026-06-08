import { cn } from "@/lib/cn";

export default function Switch({ checked, onChange, label, disabled, className }) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-3 select-none", disabled && "opacity-60", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", checked ? "bg-brand-600" : "bg-line")}
      >
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", checked ? "left-[22px]" : "left-0.5")} />
      </button>
      {label && <span className="text-[14px] text-ink">{label}</span>}
    </label>
  );
}
