/**
 * Input validators for the vehicle module's mutating endpoints.
 */
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

module.exports = { validateRemark, MAX_REMARK };
