/**
 * builder routes — mounted under /api.
 */
const express = require("express");
const verifyToken = require("../../../app/middleware/JWTAuth");
const controller = require("./builder.controller");
const v = require("./builder.validator");

const router = express.Router();

router.post("/user/data/add/builder", verifyToken, controller.addBuilderData);
router.post("/user/data/update/builder", verifyToken, controller.updateBuilderData);
router.get("/user/data/builder/unit", verifyToken, controller.getUnitsByBuilder);
router.get("/user/data/builder/unitCategory/:unitId", verifyToken, controller.getUnitsByBuilderCategory);
router.post("/user/data/add/builderUnit", verifyToken, controller.addBuilderUnit);
router.put("/user/data/update/builderUnit", verifyToken, controller.updateBuilderUnit);
router.post("/user/data/builder/getunitwithconsumer", verifyToken, controller.getUintByConsumer);
router.post("/user/data/add/builderUnitCategory", verifyToken, v.validateAddUnitCategory, controller.addBuilderUnitCategory);
router.put("/user/data/update/builderUnitCategory", verifyToken, controller.updateBuilderUnitCategory);

module.exports = router;
