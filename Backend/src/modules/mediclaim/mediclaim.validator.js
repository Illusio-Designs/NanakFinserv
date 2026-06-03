/**
 * Input validators for the mediclaim module's mutating endpoints.
 */
const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;
const isPresent = (v) => v !== undefined && v !== null && String(v).trim() !== "";

function fail(res, errors) {
  return res.status(400).send({ message: errors.join("; "), status: false });
}

const validateAddCompany = (req, res, next) => {
  if (!isNonEmptyString((req.body || {}).mediclaim_company_name)) {
    return fail(res, ["mediclaim_company_name is required"]);
  }
  return next();
};

const validateUpdateCompany = (req, res, next) => {
  const b = req.body || {};
  const errors = [];
  if (!isPresent(b.mediclaim_company_id)) errors.push("mediclaim_company_id is required");
  if (!isNonEmptyString(b.mediclaim_company_name)) errors.push("mediclaim_company_name is required");
  return errors.length ? fail(res, errors) : next();
};

const validateAddProduct = (req, res, next) => {
  const errors = [];
  if (!isNonEmptyString((req.body || {}).mediclaim_product_name)) {
    errors.push("mediclaim_product_name is required");
  }
  if (!isPresent((req.params || {}).id)) errors.push("company id is required");
  return errors.length ? fail(res, errors) : next();
};

module.exports = { validateAddCompany, validateUpdateCompany, validateAddProduct };
