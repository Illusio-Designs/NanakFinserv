/**
 * consumer routes — mounted under /api. Staff + builders (who onboard consumers).
 */
const express = require("express");
const verifyToken = require("../../../app/middleware/JWTAuth");
const { requireRole, BUILDER_OPS } = require("../../middleware/rbac");
const { wrapController } = require("../../middleware/asyncHandler");
const controller = wrapController(require("./consumer.controller"));
const v = require("./consumer.validator");

const router = express.Router();
const builderOps = requireRole(...BUILDER_OPS);

router.post("/user/data/add/consumer", verifyToken, builderOps, controller.addConsumerData);
router.put("/user/data/add/consumer/loan", verifyToken, builderOps, controller.updateLoanConsumerData);
router.put("/user/data/update/consumer", verifyToken, builderOps, controller.updateConsumerData);
router.post("/user/data/consumer/add", verifyToken, builderOps, v.validateAddConsumer, controller.addConsumer);
router.put("/user/data/consumer/update/:id", verifyToken, builderOps, v.validateUpdateConsumer, controller.updateConsumer);

// Household / family members (members are full users linked to a head).
router.post("/user/data/consumer/family/add", verifyToken, builderOps, controller.addFamilyMember);
router.get("/user/household/:mobile", verifyToken, builderOps, controller.getHousehold);

// Consumer-level KYC documents (stored once on the consumer, reused everywhere).
router.get("/user/consumer/documents/by-mobile/:mobile", verifyToken, builderOps, controller.getConsumerDocumentsByMobile);
router.get("/user/consumer/documents/:userId", verifyToken, builderOps, controller.getConsumerDocuments);
router.post("/user/consumer/documents/upload", verifyToken, builderOps, controller.uploadConsumerDocument);

module.exports = router;
