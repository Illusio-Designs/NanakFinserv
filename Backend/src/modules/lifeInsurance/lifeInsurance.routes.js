/**
 * lifeInsurance routes — mounted under /api. Internal staff only.
 */
const express = require("express");
const verifyToken = require("../../../app/middleware/JWTAuth");
const { requireRole, ADMIN } = require("../../middleware/rbac");
const controller = require("./lifeInsurance.controller");
const v = require("./lifeInsurance.validator");

const router = express.Router();
const staff = requireRole(...ADMIN);

router.get("/user/list/lifeIns", verifyToken, staff, controller.getAllLifeInsUser);
router.post("/user/life-insurance/create", verifyToken, staff, controller.createLifeInsurance);
router.get("/user/life-insurance/list", verifyToken, staff, controller.getAllLifeInsurance);
router.get("/user/life-insurance/:id", verifyToken, staff, controller.getLifeInsuranceById);
router.put("/user/life-insurance/update/:id", verifyToken, staff, controller.updateLifeInsurance);
router.delete("/user/life-insurance/delete/:id", verifyToken, staff, controller.deleteLifeInsurance);
router.put("/user/life-insurance/status/:id", verifyToken, staff, v.validateStatus, controller.updateLifeInsuranceStatus);
router.post("/user/life-insurance/:lifeInsuranceId/documents/upload", verifyToken, staff, controller.uploadLifeInsuranceDocument);
router.get("/user/life-insurance/:lifeInsuranceId/documents", verifyToken, staff, controller.getLifeInsuranceDocuments);
router.delete("/user/life-insurance/documents/:documentId", verifyToken, staff, controller.deleteLifeInsuranceDocument);
router.get("/user/life-insurance/consumer/:consumerId", verifyToken, staff, controller.getLifeInsuranceByConsumer);
router.get("/user/life-insurance/renewal/data", verifyToken, staff, controller.getLifeInsuranceRenewalData);

module.exports = router;
