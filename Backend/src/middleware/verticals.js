/**
 * Vertical availability guard. If a vertical is toggled OFF in admin settings,
 * its whole route group returns 503 (so e.g. only Vehicle is usable when only
 * Vehicle is enabled). Reads the cached settings, so it's cheap per request.
 */
const adminService = require("../modules/admin/admin.service");

function requireVerticalEnabled(verticalKey) {
  return async (req, res, next) => {
    try {
      const verticals = await adminService.getVerticals();
      if (verticals[verticalKey] === false) {
        return res.status(503).json({
          message: `The ${verticalKey} module is currently disabled.`,
          status: false,
          vertical: verticalKey,
          disabled: true,
        });
      }
      return next();
    } catch (e) {
      return next(e);
    }
  };
}

module.exports = { requireVerticalEnabled };
