import { cn } from "@/lib/cn";

export default function Input({ label, error, hint, icon: Icon, className, id, ...props }) {
  const inputId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="ui-label">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        )}
        <input
          id={inputId}
          className={cn("ui-control", Icon && "pl-9", error && "border-danger ring-2 ring-danger/15", className)}
          {...props}
        />
      </div>
      {error ? (
        <p className="mt-1 text-[12px] text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-[12px] text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
