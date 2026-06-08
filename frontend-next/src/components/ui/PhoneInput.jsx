"use client";
import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import Popover from "./Popover";
import { cn } from "@/lib/cn";

// iso2 is used for the flag image (flagcdn) — emoji flags don't render on Windows.
const COUNTRIES = [
  { code: "IN", iso: "in", dial: "+91" },
  { code: "US", iso: "us", dial: "+1" },
  { code: "GB", iso: "gb", dial: "+44" },
  { code: "AE", iso: "ae", dial: "+971" },
  { code: "AU", iso: "au", dial: "+61" },
  { code: "SG", iso: "sg", dial: "+65" },
];

function Flag({ iso }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`https://flagcdn.com/w40/${iso}.png`} alt={iso} className="h-3.5 w-5 rounded-[2px] object-cover" />;
}

/**
 * Phone input with a country/flag selector. value = national digits (string).
 * onChange(digits). onCountryChange(dial) optional.
 */
export default function PhoneInput({ label, value = "", onChange, onCountryChange, error, maxLength = 10, placeholder = "Enter mobile number", light = false }) {
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  const wrapBase = light
    ? "flex items-center rounded-md bg-white/95"
    : cn("flex items-center rounded-md border border-line bg-surface transition-all focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-100", error && "border-danger ring-2 ring-danger/15");

  return (
    <div className="w-full">
      {label && <label className="ui-label">{label}</label>}
      <div className={wrapBase} style={{ height: "var(--control-h)" }}>
        <button
          ref={anchorRef}
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex h-full items-center gap-1 rounded-l-md px-2.5 text-[14px] text-ink hover:bg-subtle/60"
          style={{ height: "var(--control-h)" }}
        >
          <Flag iso={country.iso} />
          <span className="text-muted">{country.dial}</span>
          <ChevronDown size={14} className="text-muted" />
        </button>
        <Popover open={open} onClose={() => setOpen(false)} anchorRef={anchorRef} matchWidth={false}>
          <ul className="w-44 overflow-hidden rounded-md border border-line bg-surface p-1 shadow-pop">
            {COUNTRIES.map((c) => (
              <li key={c.code}>
                <button
                  type="button"
                  onClick={() => { setCountry(c); setOpen(false); onCountryChange?.(c.dial); }}
                  className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-[14px] text-ink hover:bg-subtle"
                >
                  <Flag iso={c.iso} /> {c.code} <span className="ml-auto text-muted">{c.dial}</span>
                </button>
              </li>
            ))}
          </ul>
        </Popover>
        <span className="h-5 w-px bg-line" />
        <input
          inputMode="numeric"
          maxLength={maxLength}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
          placeholder={placeholder}
          className="h-full flex-1 rounded-r-md bg-transparent px-3 text-[14px] text-ink outline-none placeholder:text-muted/70"
        />
      </div>
      {error && <p className="mt-1 text-[12px] text-danger">{error}</p>}
    </div>
  );
}
