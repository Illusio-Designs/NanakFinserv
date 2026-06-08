"use client";
import DatePicker from "./DatePicker";

/** From–To date range filter. value = { from, to }. */
export default function DateRange({ label, value = {}, onChange }) {
  return (
    <div className="w-full">
      {label && <label className="ui-label">{label}</label>}
      <div className="flex items-center gap-2">
        <DatePicker value={value.from || ""} max={value.to || undefined} onChange={(v) => onChange?.({ ...value, from: v })} />
        <span className="text-[13px] text-muted">to</span>
        <DatePicker value={value.to || ""} min={value.from || undefined} onChange={(v) => onChange?.({ ...value, to: v })} />
      </div>
    </div>
  );
}
