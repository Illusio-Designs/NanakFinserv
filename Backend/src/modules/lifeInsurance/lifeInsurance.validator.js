/** Validators for the lifeInsurance module. */
const isPresent = (v) => v !== undefined && v !== null && String(v).trim() !== "";

const validateStatus = (req, res, next) => {
  if (!isPresent((req.body || {}).status)) {
    return res.status(400).json({ status: false, message: "status is required" });
  }
  return next();
};

module.exports = { validateStatus };
