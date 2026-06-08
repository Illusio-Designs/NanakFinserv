import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export default function Checkbox({ checked, onChange, label, className }) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2 select-none", className)}>
      <span
        onClick={() => onChange?.(!checked)}
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-[5px] border transition-colors",
          checked ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-surface"
        )}
      >
        {checked && <Check size={13} strokeWidth={3} />}
      </span>
      {label && <span className="text-[14px] text-ink">{label}</span>}
    </label>
  );
}
