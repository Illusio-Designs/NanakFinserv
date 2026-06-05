/** Validators for the buildingManager module. */
const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;
const isEmail = (v) => typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const isMobile10 = (v) =>
  (typeof v === "string" || typeof v === "number") && /^\d{10}$/.test(String(v).trim());
const isPresent = (v) => v !== undefined && v !== null && String(v).trim() !== "";

function fail(res, errors) {
  return res.status(400).send({ status: false, message: errors.join("; ") });
}

const validateCreate = (req, res, next) => {
  const b = req.body || {};
  const errors = [];
  if (!isNonEmptyString(b.username)) errors.push("username is required");
  if (!isEmail(b.email)) errors.push("a valid email is required");
  if (!isMobile10(b.mobileNumber)) errors.push("mobileNumber must be 10 digits");
  if (!isPresent(b.unit_id)) errors.push("unit_id is required");
  return errors.length ? fail(res, errors) : next();
};

const validateAssign = (req, res, next) => {
  const b = req.body || {};
  const errors = [];
  if (!isPresent(b.user_id)) errors.push("user_id is required");
  if (!isPresent(b.unit_id)) errors.push("unit_id is required");
  return errors.length ? fail(res, errors) : next();
};

module.exports = { validateCreate, validateAssign };
