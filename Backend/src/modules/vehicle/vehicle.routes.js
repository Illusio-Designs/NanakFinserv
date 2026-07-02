/**
 * vehicle routes — mounted under /api.
 * Vertical access: super admin or users with the Vehicle category.
 */
const express = require("express");
const verifyToken = require("../../../app/middleware/JWTAuth");
const { requireCategory, CATEGORIES } = require("../../middleware/rbac");
const { requireVerticalEnabled } = require("../../middleware/verticals");
const { wrapController } = require("../../middleware/asyncHandler");
const controller = wrapController(require("./vehicle.controller"));
const v = require("./vehicle.validator");

const router = express.Router();
const vEnabled = requireVerticalEnabled("vehicle"); // applied per-route (path-less router.use leaked to other routers)
const staff = requireCategory(CATEGORIES.VEHICLE);

router.post("/user/vehicle/user/add", vEnabled, verifyToken, staff, controller.addVehicleUserData);
router.put("/user/vehicle/user/update/:vehicle_user_id", vEnabled, verifyToken, staff, controller.updateVehicleUserData);
router.put("/user/vehicle/user/update/remark/:vehicle_user_id", vEnabled, verifyToken, staff, v.validateRemark, controller.updateVehicleUserRemarkData);
router.post("/user/vehicle/user/list", vEnabled, verifyToken, staff, controller.getVehicleUserData);
router.post("/user/vehicle/user/renewal/list", vEnabled, verifyToken, staff, controller.getVehicleUserRenewalData);
router.post("/user/renewVehiclePolicy", vEnabled, verifyToken, staff, controller.renewVehiclePolicy);
router.post("/user/vehicle/policy/close", vEnabled, verifyToken, staff, controller.closeVehiclePolicy);
router.get("/user/vehicle/renewal/stats", vEnabled, verifyToken, staff, controller.getVehicleRenewalStats);
router.get("/user/list/vehicleIns", vEnabled, verifyToken, staff, controller.getAllVehicleInsUser);
// Removed: unauthenticated debug route /user/list/all-vehicle-users-debug
// (controller.listAllVehicleUsersDebug) — it leaked all vehicle users.
router.get("/user/vehicle/user/:vehicle_user_id", vEnabled, verifyToken, staff, controller.getVehicleUserById);

module.exports = router;
