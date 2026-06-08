/**
 * Input validators for the vehicle module's mutating endpoints.
 * Built on the universal validator service (src/modules/shared/validators.js).
 */
const { checks: C, field, runChecks } = require("../shared/validators");

const isPresent = (v) => v !== undefined && v !== null && String(v).trim() !== "";

function fail(res, errors) {
  return res.status(400).send({ message: errors.join("; "), status: false });
}

const MAX_REMARK = 1000;

const validateRemark = (req, res, next) => {
  const remark = (req.body || {}).remark;
  const errors = [];
  if (!isPresent(remark)) errors.push("remark is required");
  else if (String(remark).length > MAX_REMARK) {
    errors.push(`remark is too long (max ${MAX_REMARK} characters)`);
  }
  if (!isPresent((req.params || {}).vehicle_user_id)) {
    errors.push("vehicle_user_id is required");
  }
  return errors.length ? fail(res, errors) : next();
};

// Field specs for a vehicle policy. The add endpoint is multipart with mixed
// casing, so this is validated INSIDE the controller (after the payload is
// normalized) via validateVehicleData(values) — required only for the genuine
// identity fields; everything else is format-checked only when present.
const vehicleFields = [
  field("Name", { label: "Name", required: true, checks: [C.maxLen(100)] }),
  field("MobileNumber", { label: "Mobile number", required: true, checks: [C.mobile10] }),
  field("VehicleNumber", { label: "Vehicle number", required: true, checks: [C.maxLen(20)] }),
  field("Email", { label: "Email", checks: [C.email] }),
  field("ContactPersonNo", { label: "Contact person number", checks: [C.digits, C.maxLen(15)] }),
  field("ManufacturingYear", { label: "Manufacturing year", checks: [C.year] }),
  field("EngineNumber", { label: "Engine number", checks: [C.maxLen(50)] }),
  field("ChassisNumber", { label: "Chassis number", checks: [C.maxLen(50)] }),
  field("Make", { label: "Make", checks: [C.maxLen(50)] }),
  field("Model", { label: "Model", checks: [C.maxLen(50)] }),
];

/** Validate the normalized vehicle values; returns an array of messages. */
function validateVehicleData(values) {
  return runChecks(vehicleFields, values || {});
}

module.exports = { validateRemark, MAX_REMARK, validateVehicleData };
