/**
 * shared routes — mounted under /api.
 */
const express = require("express");
const verifyToken = require("../../../app/middleware/JWTAuth");
const { requireRole, ADMIN } = require("../../middleware/rbac");
const controller = require("./shared.controller");

const router = express.Router();

// Master-data writes are back-office only; reads stay available to any signed-in user.
router.post("/user/data/vehicle", verifyToken, requireRole(...ADMIN), controller.addVehicleDetails);
router.post("/user/data/policyplan", verifyToken, requireRole(...ADMIN), controller.addPolicyplanDetails);
router.post("/user/data/policytype", verifyToken, requireRole(...ADMIN), controller.addPolicyTypeDetails);
router.get("/user/data/vehicle", verifyToken, controller.getAllVehicles);
router.get("/user/data/policytype", verifyToken, controller.getAllPolicyTypes);
router.get("/user/data/policyplan", verifyToken, controller.getAllPolicyPlans);
router.get("/user/data/unitCategory", verifyToken, controller.getAllUnitCatergory);
router.post("/user/data/code", verifyToken, requireRole(...ADMIN), controller.addCodeDetails);
router.get("/user/data/code", verifyToken, controller.getAllCodes);
router.get("/user/data/company-type", verifyToken, controller.getAllCompanyTypes);
router.post("/user/data/company-type", verifyToken, requireRole(...ADMIN), controller.addCompanyTypeDetails);
router.get("/user/data/loan/configuration", verifyToken, controller.getAllLoanConfiguration);
router.get("/user/download/:filename", controller.downloadFile);

module.exports = router;
