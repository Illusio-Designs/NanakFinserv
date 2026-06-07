/** Validators for the admin module. */
const VERTICALS = ["loan", "vehicle", "mediclaim", "life", "builder"];

const validateVerticals = (req, res, next) => {
  const b = req.body || {};
  const keys = Object.keys(b);
  // At least one known vertical, and every provided value must be boolean.
  const known = keys.filter((k) => VERTICALS.includes(k));
  if (known.length === 0) {
    return res
      .status(400)
      .send({ message: `Provide at least one of: ${VERTICALS.join(", ")}`, status: false });
  }
  const badType = known.find((k) => typeof b[k] !== "boolean");
  if (badType) {
    return res
      .status(400)
      .send({ message: `${badType} must be true or false`, status: false });
  }
  return next();
};

const validateWipe = (req, res, next) => {
  if ((req.body || {}).confirm !== "WIPE") {
    return res.status(400).send({
      message: 'Confirmation required: send { "confirm": "WIPE" }',
      status: false,
    });
  }
  return next();
};

module.exports = { validateVerticals, validateWipe };
