/**
 * consumer routes — mounted under /api. Staff + builders (who onboard consumers).
 */
const express = require("express");
const verifyToken = require("../../../app/middleware/JWTAuth");
const { requireRole, BUILDER_OPS } = require("../../middleware/rbac");
const controller = require("./consumer.controller");
const v = require("./consumer.validator");

const router = express.Router();
const builderOps = requireRole(...BUILDER_OPS);

router.post("/user/data/add/consumer", verifyToken, builderOps, controller.addConsumerData);
router.put("/user/data/add/consumer/loan", verifyToken, builderOps, controller.updateLoanConsumerData);
router.put("/user/data/update/consumer", verifyToken, builderOps, controller.updateConsumerData);
router.post("/user/data/consumer/add", verifyToken, builderOps, v.validateAddConsumer, controller.addConsumer);
router.put("/user/data/consumer/update/:id", verifyToken, builderOps, v.validateUpdateConsumer, controller.updateConsumer);

module.exports = router;
