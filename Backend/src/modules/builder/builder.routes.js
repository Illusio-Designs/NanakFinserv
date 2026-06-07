/**
 * builder routes — mounted under /api. Staff + builders.
 */
const express = require("express");
const verifyToken = require("../../../app/middleware/JWTAuth");
const { requireRole, BUILDER_OPS } = require("../../middleware/rbac");
const { requireVerticalEnabled } = require("../../middleware/verticals");
const { wrapController } = require("../../middleware/asyncHandler");
const controller = wrapController(require("./builder.controller"));
const v = require("./builder.validator");

const router = express.Router();
const builderOps = requireRole(...BUILDER_OPS);
// Applied per-route (a path-less router.use would leak to other routers).
const vEnabled = requireVerticalEnabled("builder");

router.post("/user/data/add/builder", vEnabled, verifyToken, builderOps, v.validateAddBuilder, controller.addBuilderData);
router.post("/user/data/update/builder", vEnabled, verifyToken, builderOps, controller.updateBuilderData);
router.get("/user/data/builder/unit", vEnabled, verifyToken, builderOps, controller.getUnitsByBuilder);
router.get("/user/data/builder/unitCategory/:unitId", vEnabled, verifyToken, builderOps, controller.getUnitsByBuilderCategory);
router.post("/user/data/add/builderUnit", vEnabled, verifyToken, builderOps, v.validateAddBuilderUnit, controller.addBuilderUnit);
router.put("/user/data/update/builderUnit", vEnabled, verifyToken, builderOps, controller.updateBuilderUnit);
router.post("/user/data/builder/getunitwithconsumer", vEnabled, verifyToken, builderOps, controller.getUintByConsumer);
router.post("/user/data/add/builderUnitCategory", vEnabled, verifyToken, builderOps, v.validateAddUnitCategory, controller.addBuilderUnitCategory);
router.put("/user/data/update/builderUnitCategory", vEnabled, verifyToken, builderOps, controller.updateBuilderUnitCategory);

module.exports = router;
