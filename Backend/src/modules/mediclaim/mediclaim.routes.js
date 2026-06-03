/**
 * mediclaim routes — mounted under /api. Internal staff only.
 */
const express = require("express");
const verifyToken = require("../../../app/middleware/JWTAuth");
const { requireRole, ADMIN } = require("../../middleware/rbac");
const { wrapController } = require("../../middleware/asyncHandler");
const controller = wrapController(require("./mediclaim.controller"));
const v = require("./mediclaim.validator");

const router = express.Router();
const staff = requireRole(...ADMIN);

router.get("/user/list/mediclaim", verifyToken, staff, controller.getAllMediclaimUser);
router.get("/user/mediclaim/company", verifyToken, staff, controller.getAllMediclaimCompany);
router.post("/user/mediclaim/company/add", verifyToken, staff, v.validateAddCompany, controller.addMediclaimCompanyData);
router.put("/user/mediclaim/company/update", verifyToken, staff, v.validateUpdateCompany, controller.updateMediclaimCompanyData);
router.get("/user/mediclaim/product/:id", verifyToken, staff, controller.getAllMediclaimProduct);
router.post("/user/mediclaim/product/add/:id", verifyToken, staff, v.validateAddProduct, controller.addMediclaimProductData);
router.put("/user/mediclaim/product/update/:id", verifyToken, staff, v.validateUpdateProduct, controller.updateMediclaimProductData);
router.post("/user/mediclaim/user/add", verifyToken, staff, v.validateAddMediclaimUser, controller.addMediclaimUserData);
router.put("/user/mediclaim/user/update/:id", verifyToken, staff, controller.updateMediclaimUserData);
router.get("/user/mediclaim/user/list", verifyToken, staff, controller.geteMediclaimUserData);
router.post("/user/mediclaim/user/renewal/list", verifyToken, staff, controller.geteMediclaimUserRenewalData);
router.get("/user/mediclaim/company/list", verifyToken, staff, controller.geteMediclaimCompanyData);
router.get("/user/mediclaim/product/list", verifyToken, staff, controller.geteMediclaimProductData);

module.exports = router;
