/**
 * mediclaim routes — mounted under /api.
 * Vertical access: super admin or users with the Mediclaim category.
 */
const express = require("express");
const verifyToken = require("../../../app/middleware/JWTAuth");
const { requireCategory, CATEGORIES } = require("../../middleware/rbac");
const { requireVerticalEnabled } = require("../../middleware/verticals");
const { wrapController } = require("../../middleware/asyncHandler");
const controller = wrapController(require("./mediclaim.controller"));
const v = require("./mediclaim.validator");

const router = express.Router();
const vEnabled = requireVerticalEnabled("mediclaim"); // applied per-route (path-less router.use leaked to other routers)
const staff = requireCategory(CATEGORIES.MEDICLAIM);

router.get("/user/list/mediclaim", vEnabled, verifyToken, staff, controller.getAllMediclaimUser);
router.get("/user/mediclaim/company", vEnabled, verifyToken, staff, controller.getAllMediclaimCompany);
router.post("/user/mediclaim/company/add", vEnabled, verifyToken, staff, v.validateAddCompany, controller.addMediclaimCompanyData);
router.put("/user/mediclaim/company/update", vEnabled, verifyToken, staff, v.validateUpdateCompany, controller.updateMediclaimCompanyData);
router.get("/user/mediclaim/product/:id", vEnabled, verifyToken, staff, controller.getAllMediclaimProduct);
router.post("/user/mediclaim/product/add/:id", vEnabled, verifyToken, staff, v.validateAddProduct, controller.addMediclaimProductData);
router.put("/user/mediclaim/product/update/:id", vEnabled, verifyToken, staff, v.validateUpdateProduct, controller.updateMediclaimProductData);
router.post("/user/mediclaim/user/add", vEnabled, verifyToken, staff, v.validateAddMediclaimUser, controller.addMediclaimUserData);
router.put("/user/mediclaim/user/update/:id", vEnabled, verifyToken, staff, controller.updateMediclaimUserData);
router.get("/user/mediclaim/user/list", vEnabled, verifyToken, staff, controller.geteMediclaimUserData);
router.post("/user/mediclaim/user/renewal/list", vEnabled, verifyToken, staff, controller.geteMediclaimUserRenewalData);
router.get("/user/mediclaim/company/list", vEnabled, verifyToken, staff, controller.geteMediclaimCompanyData);
router.get("/user/mediclaim/product/list", vEnabled, verifyToken, staff, controller.geteMediclaimProductData);

module.exports = router;
