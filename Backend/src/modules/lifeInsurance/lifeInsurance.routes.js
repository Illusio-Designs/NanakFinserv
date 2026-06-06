/**
 * lifeInsurance routes — mounted under /api.
 * Vertical access: super admin or users with the Life-Insurance category.
 */
const express = require("express");
const verifyToken = require("../../../app/middleware/JWTAuth");
const { requireCategory, requireSelfOrRoles, CATEGORIES, ADMIN } = require("../../middleware/rbac");
const { requireVerticalEnabled } = require("../../middleware/verticals");
const { wrapController } = require("../../middleware/asyncHandler");
const controller = wrapController(require("./lifeInsurance.controller"));
const v = require("./lifeInsurance.validator");

const router = express.Router();
const vEnabled = requireVerticalEnabled("life"); // applied per-route (path-less router.use leaked to other routers)
const staff = requireCategory(CATEGORIES.LIFE_INSURANCE);

router.get("/user/list/lifeIns", vEnabled, verifyToken, staff, controller.getAllLifeInsUser);
router.post("/user/life-insurance/create", vEnabled, verifyToken, staff, controller.createLifeInsurance);
router.get("/user/life-insurance/list", vEnabled, verifyToken, staff, controller.getAllLifeInsurance);
router.get("/user/life-insurance/:id", vEnabled, verifyToken, staff, controller.getLifeInsuranceById);
router.put("/user/life-insurance/update/:id", vEnabled, verifyToken, staff, controller.updateLifeInsurance);
router.delete("/user/life-insurance/delete/:id", vEnabled, verifyToken, staff, controller.deleteLifeInsurance);
router.put("/user/life-insurance/status/:id", vEnabled, verifyToken, staff, v.validateStatus, controller.updateLifeInsuranceStatus);
router.post("/user/life-insurance/:lifeInsuranceId/documents/upload", vEnabled, verifyToken, staff, controller.uploadLifeInsuranceDocument);
router.get("/user/life-insurance/:lifeInsuranceId/documents", vEnabled, verifyToken, staff, controller.getLifeInsuranceDocuments);
router.delete("/user/life-insurance/documents/:documentId", vEnabled, verifyToken, staff, controller.deleteLifeInsuranceDocument);
// Staff see any consumer's policies; a consumer can see only their own.
router.get("/user/life-insurance/consumer/:consumerId", vEnabled, verifyToken, requireSelfOrRoles("consumerId", ADMIN), controller.getLifeInsuranceByConsumer);
router.get("/user/life-insurance/renewal/data", vEnabled, verifyToken, staff, controller.getLifeInsuranceRenewalData);

module.exports = router;
