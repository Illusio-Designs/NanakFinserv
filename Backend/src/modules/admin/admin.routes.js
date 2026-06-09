/**
 * admin routes — mounted under /api. Super-admin-only settings + data wipe.
 * (Reading the vertical toggles is allowed for any signed-in user so the UI
 * can hide disabled verticals.)
 */
const express = require("express");
const verifyToken = require("../../../app/middleware/JWTAuth");
const { requireRole, ROLES } = require("../../middleware/rbac");
const { wrapController } = require("../../middleware/asyncHandler");
const controller = wrapController(require("./admin.controller"));
const v = require("./admin.validator");

const router = express.Router();
const superAdmin = requireRole(ROLES.SUPER_ADMIN);

router.get("/admin/settings/verticals", verifyToken, controller.getVerticals);
router.put("/admin/settings/verticals", verifyToken, superAdmin, v.validateVerticals, controller.updateVerticals);
router.post("/admin/data/wipe", verifyToken, superAdmin, v.validateWipe, controller.wipeData);
router.post("/admin/data/wipe-test", verifyToken, superAdmin, v.validateWipe, controller.wipeTestData);

module.exports = router;
