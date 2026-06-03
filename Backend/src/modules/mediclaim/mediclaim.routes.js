/**
 * mediclaim routes — mounted under /api.
 */
const express = require("express");
const verifyToken = require("../../../app/middleware/JWTAuth");
const controller = require("./mediclaim.controller");
const v = require("./mediclaim.validator");

const router = express.Router();

router.get("/user/list/mediclaim", verifyToken, controller.getAllMediclaimUser);
router.get("/user/mediclaim/company", verifyToken, controller.getAllMediclaimCompany);
router.post("/user/mediclaim/company/add", verifyToken, v.validateAddCompany, controller.addMediclaimCompanyData);
router.put("/user/mediclaim/company/update", verifyToken, v.validateUpdateCompany, controller.updateMediclaimCompanyData);
router.get("/user/mediclaim/product/:id", verifyToken, controller.getAllMediclaimProduct);
router.post("/user/mediclaim/product/add/:id", verifyToken, v.validateAddProduct, controller.addMediclaimProductData);
router.put("/user/mediclaim/product/update/:id", verifyToken, controller.updateMediclaimProductData);
router.post("/user/mediclaim/user/add", verifyToken, controller.addMediclaimUserData);
router.put("/user/mediclaim/user/update/:id", verifyToken, controller.updateMediclaimUserData);
router.get("/user/mediclaim/user/list", verifyToken, controller.geteMediclaimUserData);
router.post("/user/mediclaim/user/renewal/list", verifyToken, controller.geteMediclaimUserRenewalData);
router.get("/user/mediclaim/company/list", verifyToken, controller.geteMediclaimCompanyData);
router.get("/user/mediclaim/product/list", verifyToken, controller.geteMediclaimProductData);

module.exports = router;
