/**
 * Auth / mail configuration — sourced entirely from environment variables.
 *
 * (Previously held a hardcoded JWT secret and a Gmail app password; those were
 * removed and MUST be rotated on the respective services — see WORK.md.)
 */
module.exports = {
  secret: process.env.JWT_SECRET,
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS,
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
};
