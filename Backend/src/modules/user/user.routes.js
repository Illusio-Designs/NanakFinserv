/**
 * user routes — mounted under /api.
 */
const express = require("express");
const verifyToken = require("../../../app/middleware/JWTAuth");
const { requireRole, ADMIN } = require("../../middleware/rbac");
const controller = require("./user.controller");
const v = require("./user.validator");

const router = express.Router();

router.get("/user/list/consumer", verifyToken, controller.getAllUsers);
router.get("/user/list/builder", verifyToken, controller.getAllBuilderUsers);
router.get("/user/list/builder/list", verifyToken, controller.getAllBuilderListUsers);
router.get("/user/list/roleWise", verifyToken, requireRole(...ADMIN), controller.getAllRolesUsers);
router.post("/user/list/categoriesById", verifyToken, v.validateCategoryById, controller.getCategoryById);
router.post("/user/data/add", verifyToken, requireRole(...ADMIN), v.validateAddData, controller.addData);
router.get("/user/role/list", verifyToken, controller.getAllRoles);
router.post("/user/data/role/add", verifyToken, requireRole(...ADMIN), v.validateAddRoleWiseUser, controller.addRoleWiseUser);
router.put("/user/data/role/update", verifyToken, requireRole(...ADMIN), v.validateUpdateRoleWiseUser, controller.updateRoleWiseUser);
router.put("/user/data/update", verifyToken, v.validateUpdateData, controller.updateData);
router.get("/user/list/verticle", verifyToken, controller.getAllUnitVerticle);
router.post("/user/list/verticleUser", verifyToken, controller.getAllVerticleUser);

module.exports = router;
