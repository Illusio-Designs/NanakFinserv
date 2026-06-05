/**
 * builder routes — mounted under /api. Staff + builders.
 */
const express = require("express");
const verifyToken = require("../../../app/middleware/JWTAuth");
const { requireRole, BUILDER_OPS } = require("../../middleware/rbac");
const { wrapController } = require("../../middleware/asyncHandler");
const controller = wrapController(require("./builder.controller"));
const v = require("./builder.validator");

const router = express.Router();
const builderOps = requireRole(...BUILDER_OPS);

router.post("/user/data/add/builder", verifyToken, builderOps, v.validateAddBuilder, controller.addBuilderData);
router.post("/user/data/update/builder", verifyToken, builderOps, controller.updateBuilderData);
router.get("/user/data/builder/unit", verifyToken, builderOps, controller.getUnitsByBuilder);
router.get("/user/data/builder/unitCategory/:unitId", verifyToken, builderOps, controller.getUnitsByBuilderCategory);
router.post("/user/data/add/builderUnit", verifyToken, builderOps, v.validateAddBuilderUnit, controller.addBuilderUnit);
router.put("/user/data/update/builderUnit", verifyToken, builderOps, controller.updateBuilderUnit);
router.post("/user/data/builder/getunitwithconsumer", verifyToken, builderOps, controller.getUintByConsumer);
router.post("/user/data/add/builderUnitCategory", verifyToken, builderOps, v.validateAddUnitCategory, controller.addBuilderUnitCategory);
router.put("/user/data/update/builderUnitCategory", verifyToken, builderOps, controller.updateBuilderUnitCategory);

module.exports = router;
