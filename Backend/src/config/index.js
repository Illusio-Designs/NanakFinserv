/**
 * Central, environment-driven configuration.
 *
 * No secrets are hardcoded. JWT_SECRET is required; in production the process
 * refuses to start without it (fail-fast). Generate one with:
 *   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
 */
const isProd = process.env.NODE_ENV === "production";

if (isProd && !process.env.JWT_SECRET) {
  // Don't boot a production server that can't securely sign/verify tokens.
  throw new Error("JWT_SECRET is required in production");
}

const config = {
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5001,

  jwt: {
    // No fallback to any previously-committed value.
    secret: process.env.JWT_SECRET,
    // seconds — 1 day, matching the legacy behaviour
    expiresIn: Number(process.env.JWT_EXPIRES_IN) || 86400,
  },

  // MSG91 OTP widget — the OTP is collected on the client, but the resulting
  // access-token MUST be verified server-side before we trust the login.
  msg91: {
    authKey: process.env.MSG91_AUTH_KEY || null,
    widgetId: process.env.MSG91_WIDGET_ID || null,
    verifyUrl:
      process.env.MSG91_VERIFY_URL ||
      "https://control.msg91.com/api/v5/widget/verifyAccessToken",
  },
};

module.exports = config;
