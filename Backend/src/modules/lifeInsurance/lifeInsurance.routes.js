/**
 * lifeInsurance routes — mounted under /api.
 */
const express = require("express");
const verifyToken = require("../../../app/middleware/JWTAuth");
const controller = require("./lifeInsurance.controller");

const router = express.Router();

router.get("/user/list/lifeIns", verifyToken, controller.getAllLifeInsUser);
router.post("/user/life-insurance/create", verifyToken, controller.createLifeInsurance);
router.get("/user/life-insurance/list", verifyToken, controller.getAllLifeInsurance);
router.get("/user/life-insurance/:id", verifyToken, controller.getLifeInsuranceById);
router.put("/user/life-insurance/update/:id", verifyToken, controller.updateLifeInsurance);
router.delete("/user/life-insurance/delete/:id", verifyToken, controller.deleteLifeInsurance);
router.put("/user/life-insurance/status/:id", verifyToken, controller.updateLifeInsuranceStatus);
router.post("/user/life-insurance/:lifeInsuranceId/documents/upload", verifyToken, controller.uploadLifeInsuranceDocument);
router.get("/user/life-insurance/:lifeInsuranceId/documents", verifyToken, controller.getLifeInsuranceDocuments);
router.delete("/user/life-insurance/documents/:documentId", verifyToken, controller.deleteLifeInsuranceDocument);
router.get("/user/life-insurance/consumer/:consumerId", verifyToken, controller.getLifeInsuranceByConsumer);
router.get("/user/life-insurance/renewal/data", verifyToken, controller.getLifeInsuranceRenewalData);

module.exports = router;
