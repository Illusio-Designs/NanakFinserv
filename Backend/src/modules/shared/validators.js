/**
 * Universal validation service.
 *
 * One place for field validators so every module validates the same way.
 *   - `checks`  : reusable rule objects/factories ({ test, msg }).
 *   - `field()` : describe a field (name/aliases, label, required, checks).
 *   - `validate(fields, source)` : Express middleware (body|params|query).
 *   - `runChecks(fields, data)`  : validate a plain object (use inside a
 *     controller, e.g. after a multipart payload has been normalized).
 *
 * A field is only format-checked when a value is present; `required: true`
 * additionally errors when it's missing/empty.
 */

const isPresent = (v) =>
  v !== undefined && v !== null && (Array.isArray(v) ? v.length >= 0 : String(v).trim() !== "");

const checks = {
  email: { test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim()), msg: (l) => `${l} must be a valid email` },
  mobile10: { test: (v) => /^\d{10}$/.test(String(v).trim()), msg: (l) => `${l} must be a 10-digit number` },
  digits: { test: (v) => /^\d+$/.test(String(v).trim()), msg: (l) => `${l} must contain only digits` },
  number: { test: (v) => !isNaN(Number(v)), msg: (l) => `${l} must be a number` },
  year: { test: (v) => /^(19|20)\d{2}$/.test(String(v).trim()), msg: (l) => `${l} must be a valid year` },
  uuid: {
    test: (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v)),
    msg: (l) => `${l} must be a valid id`,
  },
  array: { test: (v) => Array.isArray(v), msg: (l) => `${l} must be a list` },
  nonEmptyArray: { test: (v) => Array.isArray(v) && v.length > 0, msg: (l) => `${l} must have at least one item` },
  maxLen: (n) => ({ test: (v) => String(v).length <= n, msg: (l) => `${l} must be at most ${n} characters` }),
  minLen: (n) => ({ test: (v) => String(v).length >= n, msg: (l) => `${l} must be at least ${n} characters` }),
  oneOf: (arr) => ({ test: (v) => arr.map(String).includes(String(v)), msg: (l) => `${l} must be one of: ${arr.join(", ")}` }),
  pattern: (re, hint) => ({ test: (v) => re.test(String(v).trim()), msg: (l) => `${l} ${hint || "is invalid"}` }),
};

/** Describe a field. `name` can be a string or an array of accepted aliases. */
function field(name, opts = {}) {
  return {
    aliases: Array.isArray(name) ? name : [name],
    label: opts.label || (Array.isArray(name) ? name[0] : name),
    required: !!opts.required,
    checks: opts.checks || [],
  };
}

function pickValue(data, aliases) {
  for (const a of aliases) {
    const dv = data ? data[a] : undefined;
    if (Array.isArray(dv)) return dv;
    if (dv !== undefined && dv !== null && String(dv).trim() !== "") return dv;
  }
  return undefined;
}

/** Validate a plain object against field specs; returns an array of messages. */
function runChecks(fields, data) {
  const errors = [];
  for (const f of fields) {
    const value = pickValue(data, f.aliases);
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

/** Express middleware factory. source: 'body' | 'params' | 'query'. */
function validate(fields, source = "body") {
  return (req, res, next) => {
    const data = (source === "params" ? req.params : source === "query" ? req.query : req.body) || {};
    const errors = runChecks(fields, data);
    if (errors.length) {
      return res.status(400).json({ status: false, message: errors.join("; ") });
    }
    return next();
  };
}

module.exports = { checks, field, validate, runChecks, isPresent };
