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
const vEnabled = requireVerticalEnabled("loan"); // applied per-route (path-less router.use leaked to other routers)
const staff = requireCategory(CATEGORIES.LOAN);

router.get("/user/list/loan", vEnabled, verifyToken, staff, controller.getAllLoanUser);
router.post("/user/list/loan/detail", vEnabled, verifyToken, staff, controller.getAllLoanUserDetail);
router.post("/user/list/loanInterested", vEnabled, verifyToken, staff, controller.getAllLoanUserInterested);
router.get("/user/list/loanNotInterested", vEnabled, verifyToken, staff, controller.getAllLoanUserNotInterested);
router.post("/user/list/loanNotDisburse", vEnabled, verifyToken, staff, controller.getAllLoanUserDisburse);
router.put("/user/list/loanUpdateStatus", vEnabled, verifyToken, staff, v.validateUpdateLoanStatus, controller.updateLoanStatus);
router.put("/user/list/loanUpdateWorkingStatus", vEnabled, verifyToken, staff, v.validateUpdateWorkingStatus, controller.updateWorkingLoanStatus);
router.post("/user/loan/disburse/add", vEnabled, verifyToken, staff, v.validateAddDisburse, controller.addDisburse);
router.post("/user/loan/configuration/add", vEnabled, verifyToken, staff, controller.addLoanCobfiguration);
router.put("/user/loan/disburse/update", vEnabled, verifyToken, staff, controller.updateDisburse);

// Clean list/detail reading the unified loan_stage table (used by the new UI).
router.get("/user/loan/list", vEnabled, verifyToken, staff, controller.getLoanList);
router.get("/user/loan/:laon_id", vEnabled, verifyToken, staff, controller.getLoanById);

module.exports = router;
