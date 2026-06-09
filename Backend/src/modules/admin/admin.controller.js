/**
 * admin controller — settings + data wipe. Thin HTTP layer.
 */
const adminService = require("./admin.service");
const { writeAudit } = require("../shared/context");
const logger = require("../../config/logger");

/** GET /api/admin/settings/verticals — readable by any signed-in user (UI needs it). */
exports.getVerticals = async (req, res) => {
  const verticals = await adminService.getVerticals();
  res.send({ verticals, status: true });
};

/** PUT /api/admin/settings/verticals — super admin only. Body: any of {loan,vehicle,mediclaim,life}:bool */
exports.updateVerticals = async (req, res) => {
  const verticals = await adminService.setVerticals(req.body || {});
  logger.info({ actor: req.user && req.user.id, verticals }, "Vertical toggles updated");
  res.send({ verticals, status: true, message: "Vertical settings updated" });
};

/** POST /api/admin/data/wipe — super admin only. Body: { confirm: "WIPE" } */
exports.wipeData = async (req, res) => {
  const cleared = await adminService.wipeData();
  logger.warn(
    { actor: req.user && req.user.id, count: cleared.length },
    "DATA WIPE executed"
  );
  writeAudit(req, { action: "wiped", entity: "settings", summary: "Wiped all business data + consumers", metadata: { clearedTables: cleared } });
  res.send({
    status: true,
    message: "Data wiped successfully",
    clearedTables: cleared,
  });
};
