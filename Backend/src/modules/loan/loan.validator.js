/**
 * Input validators for the loan module's mutating endpoints.
 */
const isPresent = (v) => v !== undefined && v !== null && String(v).trim() !== "";

function fail(res, errors) {
  return res.status(400).send({ message: errors.join("; "), status: false });
}

const validateUpdateLoanStatus = (req, res, next) => {
  const b = req.body || {};
  const errors = [];
  if (!isPresent(b.status)) errors.push("status is required");
  if (!isPresent(b.user_consumer_id)) errors.push("user_consumer_id is required");
  return errors.length ? fail(res, errors) : next();
};

const validateUpdateWorkingStatus = (req, res, next) => {
  const b = req.body || {};
  const errors = [];
  if (!isPresent(b.status)) errors.push("status is required");
  if (!isPresent(b.user_consumer_id)) errors.push("user_consumer_id is required");
  return errors.length ? fail(res, errors) : next();
};

const validateAddDisburse = (req, res, next) => {
  const b = req.body || {};
  const errors = [];
  if (!isPresent(b.user_id)) errors.push("user_id is required");
  if (!isPresent(b.categoryname)) errors.push("categoryname is required");
  return errors.length ? fail(res, errors) : next();
};

module.exports = {
  validateUpdateLoanStatus,
  validateUpdateWorkingStatus,
  validateAddDisburse,
};
