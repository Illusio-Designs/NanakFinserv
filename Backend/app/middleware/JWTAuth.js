var jwt = require('jsonwebtoken');
var key = require('../config/authConfig');
const db = require("../models/index");
const User = db.user;

module.exports = (req, res, next) => {
  console.log('🔍 [JWT] Middleware called for:', req.method, req.path);

  try {
    const authHeader = req.headers['authorization'] || req.headers['token']; // accept both
    let token = null;

    if (authHeader) {
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      } else {
        token = authHeader;
      }
    }

    if (token) {
      console.log('🔍 [JWT] Token received:', token.substring(0, 20) + '...');
      console.log('🔍 [JWT] Token length:', token.length);

      jwt.verify(token, key.secret, (err, decoded) => {
        if (err) {
          console.log('❌ [JWT] Token verification failed:', err.message);
          return res.status(401).json({ ERROR: "Token Expired!", status: false });
        } else {
          req.user = decoded;
          console.log('✅ [JWT] Token verified successfully:', req.user);
          next();
        }
      });
    } else {
      console.log('❌ [JWT] No token provided');
      return res.status(401).json({ ERROR: "Unauthorized!", status: false });
    }
  } catch (e) {
    console.error('❌ [JWT] Exception caught:', e);
    return res.status(401).json({ ERROR: "Token Expired!", status: false });
  }
};
