"use client";
import { useRef, useState } from "react";
import { ChevronDown, Check, Plus } from "lucide-react";
import Popover from "./Popover";
import { cn } from "@/lib/cn";

/**
 * Custom dropdown (portaled). Optional:
 *  - searchable: filter box inside the menu.
 *  - onCreate(label) -> Promise<value>: when the typed text matches no option,
 *    show "Add '<text>'" to create it (returns the new value to select).
 */
export default function Dropdown({ label, value, onChange, options = [], placeholder = "Select…", error, variant = "default", className, onCreate, searchable }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const anchorRef = useRef(null);
  const selected = options.find((o) => String(o.value) === String(value));
  const showSearch = searchable || !!onCreate;

  const triggerCls =
    variant === "light"
      ? "w-full rounded-md border-0 bg-white/95 px-3 text-[14px] text-ink"
      : cn("ui-control", error && "border-danger ring-2 ring-danger/15");

  const term = q.trim().toLowerCase();
  const filtered = term ? options.filter((o) => String(o.label).toLowerCase().includes(term)) : options;
  const exact = options.some((o) => String(o.label).toLowerCase() === term);

  const pick = (v) => { onChange?.(v); setOpen(false); setQ(""); };
  const create = async () => {
    if (!onCreate || !q.trim()) return;
    setCreating(true);
    try {
      const v = await onCreate(q.trim());
      if (v !== undefined && v !== null) onChange?.(v);
      setOpen(false); setQ("");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {label && <label className="ui-label">{label}</label>}
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(triggerCls, "flex items-center justify-between gap-2 text-left")}
        style={variant === "light" ? { height: "var(--control-h)" } : undefined}
      >
        <span className={cn(!selected && "text-muted/70")}>{selected ? selected.label : placeholder}</span>
        <ChevronDown size={16} className={cn("shrink-0 text-muted transition-transform", open && "rotate-180")} />
      </button>

      <Popover open={open} onClose={() => setOpen(false)} anchorRef={anchorRef}>
        <div className="rounded-md border border-line bg-surface p-1 shadow-pop">
          {showSearch && (
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={onCreate ? "Search or add…" : "Search…"}
              className="mb-1 w-full rounded border border-line px-2.5 py-1.5 text-[13px] outline-none focus:border-brand-600"
            />
          )}
          <ul className="max-h-56 overflow-auto">
            {placeholder && !term && (
              <li>
                <button type="button" onClick={() => pick("")} className="w-full rounded px-3 py-2 text-left text-[13px] text-muted hover:bg-subtle">
                  {placeholder}
                </button>
              </li>
            )}
            {filtered.map((o) => {
              const active = String(o.value) === String(value);
              return (
                <li key={o.value}>
                  <button type="button" onClick={() => pick(o.value)} className={cn("flex w-full items-center justify-between rounded px-3 py-2 text-left text-[14px] hover:bg-subtle", active ? "text-brand-700" : "text-ink")}>
                    {o.label}
                    {active && <Check size={15} className="text-brand-600" />}
                  </button>
                </li>
              );
            })}
            {onCreate && term && !exact && (
              <li>
                <button type="button" disabled={creating} onClick={create} className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-[14px] font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-60">
                  <Plus size={15} /> {creating ? "Adding…" : `Add “${q.trim()}”`}
                </button>
              </li>
            )}
            {filtered.length === 0 && !onCreate && <li className="px-3 py-2 text-[13px] text-muted">No matches</li>}
          </ul>
        </div>
      </Popover>

      {error && <p className="mt-1 text-[12px] text-danger">{error}</p>}
    </div>
  );
}
