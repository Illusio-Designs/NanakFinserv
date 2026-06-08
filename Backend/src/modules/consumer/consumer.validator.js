/** Consumer validators — built on the universal validator service. */
const { checks: C, field, validate, runChecks } = require("../shared/validators");

const isPresent = (v) => v !== undefined && v !== null && String(v).trim() !== "";
function fail(res, errors) {
  return res.status(400).json({ status: false, message: errors.join("; ") });
}

// Add consumer (used by /user/data/add/consumer and /user/data/consumer/add).
// Matches the real payload: username, email, phone_number (+ optional reference).
const consumerFields = [
  field("username", { label: "Name", required: true, checks: [C.maxLen(50)] }),
  field("email", { label: "Email", required: true, checks: [C.email] }),
  field(["phone_number", "mobileNumber"], { label: "Mobile number", required: true, checks: [C.mobile10] }),
  field("referenceName", { label: "Reference", checks: [C.maxLen(100)] }),
];
const validateAddConsumer = validate(consumerFields);

// Update consumer by :id — id required; any provided fields are format-checked.
const validateUpdateConsumer = (req, res, next) => {
  if (!isPresent((req.params || {}).id)) return fail(res, ["consumer id is required"]);
  const errors = runChecks(
    [
      field("email", { label: "Email", checks: [C.email] }),
      field(["phone_number", "mobileNumber"], { label: "Mobile number", checks: [C.mobile10] }),
      field("username", { label: "Name", checks: [C.maxLen(50)] }),
      field("referenceName", { label: "Reference", checks: [C.maxLen(100)] }),
    ],
    req.body || {}
  );
  return errors.length ? fail(res, errors) : next();
};

// Add family member (full user linked to a head).
const validateFamilyMember = validate([
  field("head_user_id", { label: "Head consumer", required: true, checks: [C.uuid] }),
  field("username", { label: "Name", required: true, checks: [C.maxLen(50)] }),
  field("phone_number", { label: "Mobile number", required: true, checks: [C.mobile10] }),
  field("email", { label: "Email", checks: [C.email] }),
  field("referenceName", { label: "Relation", checks: [C.maxLen(100)] }),
]);

module.exports = { validateAddConsumer, validateUpdateConsumer, validateFamilyMember };
