/**
 * user routes — mounted under /api.
 * Reference reads (role/category lists) stay open to any signed-in user;
 * user/role management is staff-only; the consumer list is shared with the portal.
 */
const express = require("express");
const verifyToken = require("../../../app/middleware/JWTAuth");
const { requireRole, ADMIN, PORTAL } = require("../../middleware/rbac");
const controller = require("./user.controller");
const v = require("./user.validator");

const router = express.Router();
const staff = requireRole(...ADMIN);

router.get("/user/list/consumer", verifyToken, requireRole(...PORTAL), controller.getAllUsers);
router.get("/user/list/builder", verifyToken, staff, controller.getAllBuilderUsers);
router.get("/user/list/builder/list", verifyToken, staff, controller.getAllBuilderListUsers);
router.get("/user/list/roleWise", verifyToken, staff, controller.getAllRolesUsers);
router.post("/user/list/categoriesById", verifyToken, staff, v.validateCategoryById, controller.getCategoryById);
router.post("/user/data/add", verifyToken, staff, v.validateAddData, controller.addData);
router.get("/user/role/list", verifyToken, controller.getAllRoles); // reference data
router.post("/user/data/role/add", verifyToken, staff, v.validateAddRoleWiseUser, controller.addRoleWiseUser);
router.put("/user/data/role/update", verifyToken, staff, v.validateUpdateRoleWiseUser, controller.updateRoleWiseUser);
router.put("/user/data/update", verifyToken, staff, v.validateUpdateData, controller.updateData);
router.get("/user/list/verticle", verifyToken, controller.getAllUnitVerticle); // reference data
router.post("/user/list/verticleUser", verifyToken, staff, controller.getAllVerticleUser);

module.exports = router;
