/**
 * Input validators for the user module's mutating endpoints.
 * Each is Express middleware that responds 400 on invalid input.
 */
const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;
const isEmail = (v) => typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const isMobile10 = (v) =>
  (typeof v === "string" || typeof v === "number") && /^\d{10}$/.test(String(v).trim());
const isPresent = (v) => v !== undefined && v !== null && String(v).trim() !== "";

function fail(res, errors) {
  return res.status(400).send({ message: errors.join("; "), status: false });
}

const validateAddRoleWiseUser = (req, res, next) => {
  const b = req.body || {};
  const errors = [];
  if (!isNonEmptyString(b.username)) errors.push("username is required");
  if (!isEmail(b.email)) errors.push("a valid email is required");
  if (!isMobile10(b.phone_number)) errors.push("phone_number must be 10 digits");
  if (!isPresent(b.role)) errors.push("role is required");
  if (!isPresent(b.roleId)) errors.push("roleId is required");
  return errors.length ? fail(res, errors) : next();
};

const validateUpdateRoleWiseUser = (req, res, next) => {
  const b = req.body || {};
  const errors = [];
  if (!isPresent(b.user_id)) errors.push("user_id is required");
  if (!isNonEmptyString(b.username)) errors.push("username is required");
  if (!isEmail(b.email)) errors.push("a valid email is required");
  if (!isMobile10(b.phone_number)) errors.push("phone_number must be 10 digits");
  if (!isPresent(b.role)) errors.push("role is required");
  if (!isPresent(b.roleId)) errors.push("roleId is required");
  return errors.length ? fail(res, errors) : next();
};

const validateAddData = (req, res, next) => {
  const b = req.body || {};
  const errors = [];
  if (!isNonEmptyString(b.username)) errors.push("username is required");
  if (!isEmail(b.email)) errors.push("a valid email is required");
  if (!isMobile10(b.phone_number)) errors.push("phone_number must be 10 digits");
  if (!isPresent(b.role)) errors.push("role is required");
  return errors.length ? fail(res, errors) : next();
};

const validateUpdateData = (req, res, next) => {
  const b = req.body || {};
  const errors = [];
  if (!isPresent(b.user_id)) errors.push("user_id is required");
  if (!isNonEmptyString(b.username)) errors.push("username is required");
  if (!isEmail(b.email)) errors.push("a valid email is required");
  if (!isMobile10(b.phone_number)) errors.push("phone_number must be 10 digits");
  if (!isPresent(b.role)) errors.push("role is required");
  return errors.length ? fail(res, errors) : next();
};

const validateCategoryById = (req, res, next) => {
  if (!isPresent((req.body || {}).user_id)) {
    return fail(res, ["user_id is required"]);
  }
  return next();
};

module.exports = {
  validateAddRoleWiseUser,
  validateUpdateRoleWiseUser,
  validateAddData,
  validateUpdateData,
  validateCategoryById,
  // exported for unit tests
  isEmail,
  isMobile10,
};
