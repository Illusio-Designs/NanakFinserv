/**
 * Access control for statically-served /uploads.
 *
 * Customer documents (resumes, policy PDFs, etc.) live in the same folder as
 * public blog images. Blog images are public; everything else requires a valid
 * JWT. The token may come from the Authorization/token header OR a `?token=`
 * query param (so the frontend can open a file in a new browser tab, where
 * custom headers aren't possible).
 */
const path = require("path");
const jwt = require("jsonwebtoken");
const config = require("../config");

function isPublicUpload(reqPath) {
  const name = path.basename(reqPath);
  // Blog images are written as `blog-<timestamp>...` plus the seed default.
  return name.startsWith("blog-") || name === "default-blog-image.jpg";
}

module.exports = (req, res, next) => {
  if (req.method === "OPTIONS" || isPublicUpload(req.path)) return next();

  const header = req.headers["authorization"] || req.headers["token"];
  let token = null;
  if (header) token = header.startsWith("Bearer ") ? header.slice(7) : header;
  if (!token && req.query && req.query.token) token = req.query.token;

  if (!token) {
    return res
      .status(401)
      .json({ message: "Authentication required to access this file", status: false });
  }

  try {
    jwt.verify(token, config.jwt.secret);
    return next();
  } catch (e) {
    return res
      .status(401)
      .json({ message: "Invalid or expired token", status: false });
  }
};

module.exports.isPublicUpload = isPublicUpload;
