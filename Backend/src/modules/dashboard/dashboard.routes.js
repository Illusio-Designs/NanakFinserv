/**
 * dashboard routes — mounted under /api.
 */
const express = require("express");
const verifyToken = require("../../../app/middleware/JWTAuth");
const controller = require("./dashboard.controller");
const v = require("./dashboard.validator");

const router = express.Router();

router.get("/user/data/counts", verifyToken, controller.getUserCounts);
router.post("/user/data/filter/amount", verifyToken, v.validateAmountFilter, controller.getLoanAmounFilterDate);
router.get("/user/consumer/dashboard", verifyToken, controller.getConsumerDashboardData);

module.exports = router;
