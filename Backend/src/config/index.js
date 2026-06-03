/**
 * Central, environment-driven configuration.
 *
 * No secrets are hardcoded here — everything comes from environment variables.
 * During the migration away from the legacy `app/config/authConfig.js`, the JWT
 * secret falls back to the old constant so existing tokens keep verifying, but
 * `JWT_SECRET` MUST be set (and rotated) before going to production.
 */
let legacyAuthConfig = {};
try {
  // eslint-disable-next-line global-require
  legacyAuthConfig = require("../../app/config/authConfig");
} catch (_) {
  legacyAuthConfig = {};
}

const config = {
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5001,

  jwt: {
    secret: process.env.JWT_SECRET || legacyAuthConfig.secret,
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
