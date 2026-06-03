/**
 * consumer routes — mounted under /api.
 */
const express = require("express");
const verifyToken = require("../../../app/middleware/JWTAuth");
const controller = require("./consumer.controller");

const router = express.Router();

router.post("/user/data/add/consumer", verifyToken, controller.addConsumerData);
router.put("/user/data/add/consumer/loan", verifyToken, controller.updateLoanConsumerData);
router.put("/user/data/update/consumer", verifyToken, controller.updateConsumerData);
router.post("/user/data/consumer/add", verifyToken, controller.addConsumer);
router.put("/user/data/consumer/update/:id", verifyToken, controller.updateConsumer);

module.exports = router;
