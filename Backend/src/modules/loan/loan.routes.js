/**
 * loan routes — mounted under /api.
 */
const express = require("express");
const verifyToken = require("../../../app/middleware/JWTAuth");
const controller = require("./loan.controller");
const v = require("./loan.validator");

const router = express.Router();

router.get("/user/list/loan", verifyToken, controller.getAllLoanUser);
router.post("/user/list/loan/detail", verifyToken, controller.getAllLoanUserDetail);
router.post("/user/list/loanInterested", verifyToken, controller.getAllLoanUserInterested);
router.get("/user/list/loanNotInterested", verifyToken, controller.getAllLoanUserNotInterested);
router.post("/user/list/loanNotDisburse", verifyToken, controller.getAllLoanUserDisburse);
router.put("/user/list/loanUpdateStatus", verifyToken, v.validateUpdateLoanStatus, controller.updateLoanStatus);
router.put("/user/list/loanUpdateWorkingStatus", verifyToken, v.validateUpdateWorkingStatus, controller.updateWorkingLoanStatus);
router.post("/user/loan/disburse/add", verifyToken, v.validateAddDisburse, controller.addDisburse);
router.post("/user/loan/configuration/add", verifyToken, controller.addLoanCobfiguration);
router.put("/user/loan/disburse/update", verifyToken, controller.updateDisburse);

module.exports = router;
