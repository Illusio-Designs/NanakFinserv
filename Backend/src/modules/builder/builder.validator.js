/** Validators for the builder module. */
const isPresent = (v) => v !== undefined && v !== null && String(v).trim() !== "";

const validateAddUnitCategory = (req, res, next) => {
  const b = req.body || {};
  const errors = [];
  if (!isPresent(b.unit_id)) errors.push("unit_id is required");
  if (!isPresent(b.unit_category_id)) errors.push("unit_category_id is required");
  if (errors.length) {
    return res.status(400).send({ message: errors.join("; "), status: false });
  }
  return next();
};

module.exports = { validateAddUnitCategory };
