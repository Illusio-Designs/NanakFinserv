/**
 * buildingManager routes — mounted under /api.
 */
const express = require("express");
const verifyToken = require("../../../app/middleware/JWTAuth");
const controller = require("./buildingManager.controller");
const v = require("./buildingManager.validator");

const router = express.Router();

router.post("/user/building-manager/create", verifyToken, v.validateCreate, controller.createBuildingManager);
router.post("/user/building-manager/assign", verifyToken, v.validateAssign, controller.assignBuildingManager);
router.get("/user/building-manager/list", verifyToken, controller.getAllBuildingManagers);
router.get("/user/building-manager/stats", verifyToken, controller.getBuildingManagerStats);
router.get("/user/building-manager/dashboard-stats", verifyToken, controller.getBuildingManagerDashboardStats);
router.put("/user/building-manager/update/:id", verifyToken, controller.updateBuildingManager);
router.put("/user/building-manager/remove/:id", verifyToken, controller.removeBuildingManager);

module.exports = router;
