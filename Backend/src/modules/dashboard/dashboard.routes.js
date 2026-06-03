/**
 * dashboard routes — mounted under /api.
 */
const express = require("express");
const verifyToken = require("../../../app/middleware/JWTAuth");
const { requireRole, ADMIN, CONSUMER_VIEW } = require("../../middleware/rbac");
const { wrapController } = require("../../middleware/asyncHandler");
const controller = wrapController(require("./dashboard.controller"));
const v = require("./dashboard.validator");

const router = express.Router();

// Admin counts/aggregates are staff-only.
router.get("/user/data/counts", verifyToken, requireRole(...ADMIN), controller.getUserCounts);
router.post("/user/data/filter/amount", verifyToken, requireRole(...ADMIN), v.validateAmountFilter, controller.getLoanAmounFilterDate);
// Consumer dashboard is for consumers (and staff/BM who can view on their behalf).
router.get("/user/consumer/dashboard", verifyToken, requireRole(...CONSUMER_VIEW), controller.getConsumerDashboardData);

module.exports = router;
