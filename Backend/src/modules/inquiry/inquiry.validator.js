/** Validators for the inquiry module. */
const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;
const isEmail = (v) => typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const isMobile10 = (v) =>
  (typeof v === "string" || typeof v === "number") && /^\d{10}$/.test(String(v).trim());

const validateAddInquiry = (req, res, next) => {
  const b = req.body || {};
  const errors = [];
  if (!isNonEmptyString(b.username)) errors.push("username is required");
  if (!isEmail(b.email)) errors.push("a valid email is required");
  if (!isMobile10(b.phone_number)) errors.push("phone_number must be 10 digits");
  if (errors.length) {
    return res.status(400).send({ message: errors.join("; "), status: false });
  }
  return next();
};

module.exports = { validateAddInquiry };
