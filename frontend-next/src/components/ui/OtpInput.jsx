"use client";
import { useRef } from "react";

/** 6-box OTP input with auto-advance, backspace and paste. value/onChange = string. */
export default function OtpInput({ value = "", onChange, length = 6 }) {
  const refs = useRef([]);

  const setAt = (i, ch) => {
    const arr = value.padEnd(length, "").split("").slice(0, length);
    arr[i] = ch;
    onChange(arr.join("").replace(/\s/g, "").slice(0, length));
  };

  const handle = (i, e) => {
    const v = e.target.value.replace(/\D/g, "");
    if (!v) return setAt(i, "");
    setAt(i, v[v.length - 1]);
    if (i < length - 1) refs.current[i + 1]?.focus();
  };

  const onKey = (i, e) => {
    if (e.key === "Backspace" && !value[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const onPaste = (e) => {
    const d = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, length);
    if (d) {
      onChange(d);
      refs.current[Math.min(d.length, length - 1)]?.focus();
      e.preventDefault();
    }
  };

  return (
    <div className="flex gap-2">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          onChange={(e) => handle(i, e)}
          onKeyDown={(e) => onKey(i, e)}
          onPaste={onPaste}
          className="h-12 w-full rounded-md border border-line bg-surface text-center text-[18px] font-semibold text-ink outline-none transition-all focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
        />
      ))}
    </div>
  );
}
