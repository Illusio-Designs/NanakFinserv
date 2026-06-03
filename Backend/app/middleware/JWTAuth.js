var jwt = require('jsonwebtoken');
var key = require('../config/authConfig');
const logger = require('../../src/config/logger');

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'] || req.headers['token']; // accept both
    let token = null;

    if (authHeader) {
      token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    }

    if (!token) {
      return res.status(401).json({ ERROR: "Unauthorized!", status: false });
    }

    jwt.verify(token, key.secret, (err, decoded) => {
      if (err) {
        // Do NOT log the token or decoded payload (PII / secret material).
        logger.debug({ path: req.path }, 'JWT verification failed');
        return res.status(401).json({ ERROR: "Token Expired!", status: false });
      }
      req.user = decoded;
      return next();
    });
  } catch (e) {
    logger.error({ err: e }, 'JWT middleware exception');
    return res.status(401).json({ ERROR: "Token Expired!", status: false });
  }
};
