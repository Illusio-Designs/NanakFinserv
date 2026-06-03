/**
 * vehicle routes — mounted under /api.
 */
const express = require("express");
const verifyToken = require("../../../app/middleware/JWTAuth");
const controller = require("./vehicle.controller");
const v = require("./vehicle.validator");

const router = express.Router();

router.post("/user/vehicle/user/add", verifyToken, controller.addVehicleUserData);
router.put("/user/vehicle/user/update/:vehicle_user_id", verifyToken, controller.updateVehicleUserData);
router.put("/user/vehicle/user/update/remark/:vehicle_user_id", verifyToken, v.validateRemark, controller.updateVehicleUserRemarkData);
router.post("/user/vehicle/user/list", verifyToken, controller.getVehicleUserData);
router.post("/user/vehicle/user/renewal/list", verifyToken, controller.getVehicleUserRenewalData);
router.post("/user/renewVehiclePolicy", verifyToken, controller.renewVehiclePolicy);
router.get("/user/vehicle/renewal/stats", verifyToken, controller.getVehicleRenewalStats);
router.get("/user/list/vehicleIns", verifyToken, controller.getAllVehicleInsUser);
// Removed: unauthenticated debug route /user/list/all-vehicle-users-debug
// (controller.listAllVehicleUsersDebug) — it leaked all vehicle users.
router.get("/user/vehicle/user/:vehicle_user_id", verifyToken, controller.getVehicleUserById);

module.exports = router;
