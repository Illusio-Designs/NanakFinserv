/**
 * buildingManager routes — mounted under /api. HQ/staff manage building managers.
 */
const express = require("express");
const verifyToken = require("../../../app/middleware/JWTAuth");
const { requireRole, ADMIN } = require("../../middleware/rbac");
const { wrapController } = require("../../middleware/asyncHandler");
const controller = wrapController(require("./buildingManager.controller"));
const v = require("./buildingManager.validator");

const router = express.Router();
const staff = requireRole(...ADMIN);

router.post("/user/building-manager/create", verifyToken, staff, v.validateCreate, controller.createBuildingManager);
router.post("/user/building-manager/assign", verifyToken, staff, v.validateAssign, controller.assignBuildingManager);
router.get("/user/building-manager/list", verifyToken, staff, controller.getAllBuildingManagers);
router.get("/user/building-manager/stats", verifyToken, staff, controller.getBuildingManagerStats);
router.get("/user/building-manager/dashboard-stats", verifyToken, staff, controller.getBuildingManagerDashboardStats);
router.put("/user/building-manager/update/:id", verifyToken, staff, controller.updateBuildingManager);
router.put("/user/building-manager/remove/:id", verifyToken, staff, controller.removeBuildingManager);

module.exports = router;
