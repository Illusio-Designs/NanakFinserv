import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export default function Select({ label, error, options = [], placeholder = "Select…", className, id, ...props }) {
  const selId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selId} className="ui-label">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selId}
          className={cn("ui-control appearance-none pr-9", error && "border-danger ring-2 ring-danger/15", className)}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
      </div>
      {error && <p className="mt-1 text-[12px] text-danger">{error}</p>}
    </div>
  );
}
