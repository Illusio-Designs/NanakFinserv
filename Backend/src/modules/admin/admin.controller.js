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

/**
 * POST /api/admin/data/wipe-test — super admin only. Body: { confirm: "WIPE", mobile? }
 * Deletes only the test data created by the given admin (default 7600046416):
 * the consumers they created + all those consumers' records. Keeps the admin
 * account, every other user, and shared masters.
 */
exports.wipeTestData = async (req, res) => {
  const mobile = (req.body && req.body.mobile) || "7600046416";
  const result = await adminService.wipeByCreator(mobile);
  logger.warn({ actor: req.user && req.user.id, mobile, ...result }, "SCOPED TEST-DATA WIPE executed");
  writeAudit(req, { action: "wiped", entity: "settings", summary: `Wiped test data created by ${mobile}`, metadata: result });
  if (!result.adminFound) {
    return res.status(404).send({ status: false, message: `No user found with mobile ${mobile}` });
  }
  res.send({
    status: true,
    message: result.consumerCount
      ? `Wiped ${result.consumerCount} test consumer(s) and their records created by ${mobile}`
      : `No test consumers created by ${mobile} were found`,
    ...result,
  });
};
