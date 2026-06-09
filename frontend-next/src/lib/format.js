// Shared formatting helpers (one source of truth for dates etc.)

/** "09 Jun 2026" — friendly, locale-stable date. Falls back to the raw value. */
export function fmtDate(d) {
  if (!d) return "—";
  const x = new Date(String(d).length <= 10 ? `${d}T00:00:00` : d);
  if (isNaN(x.getTime())) return String(d).slice(0, 10);
  return x.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/** Whole days from today until `d` (negative = past). null if unparseable. */
export function daysUntil(d) {
  if (!d) return null;
  const target = new Date(`${String(d).slice(0, 10)}T00:00:00`);
  if (isNaN(target.getTime())) return null;
  const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

/** "in 23 days" / "expires today" / "12 days overdue" — for renewal urgency. */
export function expiryCountdown(d) {
  const n = daysUntil(d);
  if (n === null) return "—";
  if (n > 0) return `in ${n} day${n === 1 ? "" : "s"}`;
  if (n === 0) return "expires today";
  return `${Math.abs(n)} day${n === -1 ? "" : "s"} overdue`;
}
