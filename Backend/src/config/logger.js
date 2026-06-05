/**
 * Application logger (pino).
 *
 * - Pretty, human-readable output in development.
 * - Structured JSON in production (ready for log aggregation).
 * - Level via LOG_LEVEL env (default: info, or debug in development).
 *
 * Use instead of console.* so logs are leveled and never leak secrets.
 */
const pino = require("pino");

const isProd = process.env.NODE_ENV === "production";
// Pretty transport only in real development — not in prod (JSON) and not under
// Jest (a worker-thread transport leaves open handles in tests).
const usePretty =
  !isProd && process.env.NODE_ENV !== "test" && !process.env.JEST_WORKER_ID;

const logger = pino({
  level: process.env.LOG_LEVEL || (isProd ? "info" : "debug"),
  // Redact common sensitive fields if ever passed as structured data.
  redact: {
    paths: [
      "password",
      "token",
      "accessToken",
      "authorization",
      "req.headers.authorization",
      "req.headers.token",
    ],
    censor: "[REDACTED]",
  },
  transport: usePretty
    ? { target: "pino-pretty", options: { translateTime: "SYS:standard", ignore: "pid,hostname" } }
    : undefined,
});

module.exports = logger;
