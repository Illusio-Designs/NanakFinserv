/**
 * Auth controller — thin HTTP layer. All logic lives in auth.service.
 */
const authService = require("./auth.service");

/**
 * POST /api/user/login
 * Body: { mobileNumber, accessToken }
 * Verifies the MSG91 OTP access-token server-side, then issues the app JWT.
 */
exports.login = async (req, res, next) => {
  try {
    const { mobileNumber, accessToken } = req.body;

    let verified = false;
    try {
      verified = await authService.verifyMsg91AccessToken(accessToken);
    } catch (err) {
      if (err instanceof authService.ConfigError) {
        // Misconfiguration is our fault, not the caller's.
        return res
          .status(503)
          .send({ error: "Login temporarily unavailable.", status: false });
      }
      throw err;
    }

    if (!verified) {
      return res
        .status(401)
        .send({ error: "OTP verification failed.", status: false });
    }

    const result = await authService.loginByMobile(mobileNumber);
    if (!result) {
      return res
        .status(400)
        .send({ error: "User Not found.", status: false });
    }

    return res.send({
      token: result.token,
      user: result.user,
      message: "valid",
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/user/verfiy
 * Body: { mobileNumber }
 * Pre-check: does an account exist for this number? (No token issued.)
 */
exports.checkUser = async (req, res, next) => {
  try {
    const exists = await authService.userExists(req.body.mobileNumber);
    if (!exists) {
      return res
        .status(400)
        .send({ error: "User Not found.", status: false });
    }
    return res.status(200).send({ error: "User found.", status: true });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/user/check
 * Safe liveness ping. Replaces the legacy handler that dumped process.env.
 */
exports.ping = (req, res) => {
  return res.send({ message: "Auth API OK", status: true });
};
