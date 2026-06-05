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
router.use(requireVerticalEnabled("vehicle")); // 503 when the Vehicle vertical is off
const staff = requireCategory(CATEGORIES.VEHICLE);

router.post("/user/vehicle/user/add", verifyToken, staff, controller.addVehicleUserData);
router.put("/user/vehicle/user/update/:vehicle_user_id", verifyToken, staff, controller.updateVehicleUserData);
router.put("/user/vehicle/user/update/remark/:vehicle_user_id", verifyToken, staff, v.validateRemark, controller.updateVehicleUserRemarkData);
router.post("/user/vehicle/user/list", verifyToken, staff, controller.getVehicleUserData);
router.post("/user/vehicle/user/renewal/list", verifyToken, staff, controller.getVehicleUserRenewalData);
router.post("/user/renewVehiclePolicy", verifyToken, staff, controller.renewVehiclePolicy);
router.get("/user/vehicle/renewal/stats", verifyToken, staff, controller.getVehicleRenewalStats);
router.get("/user/list/vehicleIns", verifyToken, staff, controller.getAllVehicleInsUser);
// Removed: unauthenticated debug route /user/list/all-vehicle-users-debug
// (controller.listAllVehicleUsersDebug) — it leaked all vehicle users.
router.get("/user/vehicle/user/:vehicle_user_id", verifyToken, staff, controller.getVehicleUserById);

module.exports = router;
