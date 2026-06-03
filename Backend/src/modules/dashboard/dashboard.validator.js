/** Validators for the dashboard module. */
const isPresent = (v) => v !== undefined && v !== null && String(v).trim() !== "";

const validateAmountFilter = (req, res, next) => {
  const b = req.body || {};
  const errors = [];
  if (!isPresent(b.start_date)) errors.push("start_date is required");
  if (!isPresent(b.end_date)) errors.push("end_date is required");
  if (errors.length) {
    return res.status(400).send({ message: errors.join("; "), status: false });
  }
  return next();
};

module.exports = { validateAmountFilter };
