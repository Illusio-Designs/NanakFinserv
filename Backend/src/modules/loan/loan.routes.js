/**
 * loan routes — mounted under /api. Loan management is internal staff only.
 */
const express = require("express");
const verifyToken = require("../../../app/middleware/JWTAuth");
const { requireRole, ADMIN } = require("../../middleware/rbac");
const controller = require("./loan.controller");
const v = require("./loan.validator");

const router = express.Router();
const staff = requireRole(...ADMIN);

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
