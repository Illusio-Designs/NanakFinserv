/**
 * Request validators for the auth module.
 *
 * Self-contained (no external dependency) so the module is testable on its own.
 * Each validator is an Express middleware that 400s on bad input.
 */

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

// Indian mobile numbers as used by the frontend: 10 digits.
function isValidMobile(value) {
  return typeof value === "string" && /^\d{10}$/.test(value.trim());
}

const validateLogin = (req, res, next) => {
  const { mobileNumber, accessToken } = req.body || {};
  const errors = [];

  if (!isValidMobile(mobileNumber)) {
    errors.push("mobileNumber must be a 10-digit number");
  }
  if (!isNonEmptyString(accessToken)) {
    errors.push("accessToken is required");
  }

  if (errors.length) {
    return res.status(400).send({ error: errors.join("; "), status: false });
  }
  return next();
};

const validateMobileOnly = (req, res, next) => {
  const { mobileNumber } = req.body || {};
  if (!isValidMobile(mobileNumber)) {
    return res
      .status(400)
      .send({ error: "mobileNumber must be a 10-digit number", status: false });
  }
  return next();
};

module.exports = {
  validateLogin,
  validateMobileOnly,
  // exported for unit testing
  isValidMobile,
  isNonEmptyString,
};
