/**
 * Client-side validation — mirrors Backend/src/modules/shared/validators.js so
 * the UI gives instant feedback with the same rules the API enforces.
 *
 *   const err = firstError([field('email',{label:'Email',required:true,checks:[checks.email]})], data)
 *   if (err) { toast.error(err); return; }
 */

export const checks = {
  email: { test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim()), msg: (l) => `${l} must be a valid email` },
  mobile10: { test: (v) => /^\d{10}$/.test(String(v).trim()), msg: (l) => `${l} must be a 10-digit number` },
  digits: { test: (v) => /^\d+$/.test(String(v).trim()), msg: (l) => `${l} must contain only digits` },
  number: { test: (v) => !isNaN(Number(v)), msg: (l) => `${l} must be a number` },
  year: { test: (v) => /^(19|20)\d{2}$/.test(String(v).trim()), msg: (l) => `${l} must be a valid year` },
  maxLen: (n) => ({ test: (v) => String(v).length <= n, msg: (l) => `${l} must be at most ${n} characters` }),
  minLen: (n) => ({ test: (v) => String(v).length >= n, msg: (l) => `${l} must be at least ${n} characters` }),
  oneOf: (arr) => ({ test: (v) => arr.map(String).includes(String(v)), msg: (l) => `${l} must be one of: ${arr.join(", ")}` }),
  pattern: (re, hint) => ({ test: (v) => re.test(String(v).trim()), msg: (l) => `${l} ${hint || "is invalid"}` }),
};

export function field(name, opts = {}) {
  return {
    aliases: Array.isArray(name) ? name : [name],
    label: opts.label || (Array.isArray(name) ? name[0] : name),
    required: !!opts.required,
    checks: opts.checks || [],
  };
}

function pick(data, aliases) {
  for (const a of aliases) {
    const dv = data ? data[a] : undefined;
    if (Array.isArray(dv)) return dv;
    if (dv !== undefined && dv !== null && String(dv).trim() !== "") return dv;
  }
  return undefined;
}

/** Returns an array of error messages (empty if valid). */
export function runChecks(fields, data) {
  const errors = [];
  for (const f of fields) {
    const value = pick(data, f.aliases);
    const present = value !== undefined;
    if (f.required && !present) {
      errors.push(`${f.label} is required`);
      continue;
    }
    if (!present) continue;
    for (const c of f.checks) {
      if (!c.test(value)) {
        errors.push(c.msg(f.label));
        break;
      }
    }
  }
  return errors;
}

/** Returns the first error message, or null if valid. */
export function firstError(fields, data) {
  const e = runChecks(fields, data);
  return e.length ? e[0] : null;
}
