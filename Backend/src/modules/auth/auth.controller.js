/**
 * Auth controller — thin HTTP layer. All logic lives in auth.service.
 */
const authService = require("./auth.service");
const config = require("../../config");

// httpOnly auth cookie options. Secure in production; SameSite=strict limits CSRF.
const TOKEN_COOKIE_OPTS = {
  httpOnly: true,
  secure: config.env === "production",
  sameSite: "strict",
  maxAge: config.jwt.expiresIn * 1000, // seconds -> ms
};

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

    // Set an httpOnly cookie (not JS-readable) AND return the token in the body
    // for backward compatibility with the current header-based frontend.
    res.cookie("token", result.token, TOKEN_COOKIE_OPTS);

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
 * POST /api/user/logout
 * Clears the httpOnly auth cookie. (The header-based flow can simply drop the
 * token client-side; this exists for the cookie-only flow.)
 */
exports.logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: config.env === "production",
    sameSite: "strict",
  });
  return res.send({ message: "Logged out", status: true });
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
