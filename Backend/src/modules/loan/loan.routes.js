/**
 * loan routes — mounted under /api.
 * Vertical access: super admin or users with the Loan category (mirrors the
 * frontend's PrivateLoan guard).
 */
const express = require("express");
const verifyToken = require("../../../app/middleware/JWTAuth");
const { requireCategory, CATEGORIES } = require("../../middleware/rbac");
const { requireVerticalEnabled } = require("../../middleware/verticals");
const { wrapController } = require("../../middleware/asyncHandler");
const controller = wrapController(require("./loan.controller"));
const v = require("./loan.validator");

const router = express.Router();
router.use(requireVerticalEnabled("loan")); // 503 when the Loan vertical is off
const staff = requireCategory(CATEGORIES.LOAN);

router.get("/user/list/loan", verifyToken, staff, controller.getAllLoanUser);
router.post("/user/list/loan/detail", verifyToken, staff, controller.getAllLoanUserDetail);
router.post("/user/list/loanInterested", verifyToken, staff, controller.getAllLoanUserInterested);
router.get("/user/list/loanNotInterested", verifyToken, staff, controller.getAllLoanUserNotInterested);
router.post("/user/list/loanNotDisburse", verifyToken, staff, controller.getAllLoanUserDisburse);
router.put("/user/list/loanUpdateStatus", verifyToken, staff, v.validateUpdateLoanStatus, controller.updateLoanStatus);
router.put("/user/list/loanUpdateWorkingStatus", verifyToken, staff, v.validateUpdateWorkingStatus, controller.updateWorkingLoanStatus);
router.post("/user/loan/disburse/add", verifyToken, staff, v.validateAddDisburse, controller.addDisburse);
router.post("/user/loan/configuration/add", verifyToken, staff, controller.addLoanCobfiguration);
router.put("/user/loan/disburse/update", verifyToken, staff, controller.updateDisburse);

module.exports = router;
