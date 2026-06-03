/**
 * inquiry routes — mounted under /api.
 * Public site submits via /public/inquiry; staff read/manage the rest.
 */
const express = require("express");
const verifyToken = require("../../../app/middleware/JWTAuth");
const { requireRole, ADMIN } = require("../../middleware/rbac");
const controller = require("./inquiry.controller");
const v = require("./inquiry.validator");

const router = express.Router();
const staff = requireRole(...ADMIN);

router.post("/user/data/inquiery", verifyToken, staff, v.validateAddInquiry, controller.addInquieryUser);
router.post('/public/inquiry', v.validateAddInquiry, controller.addInquieryUser); // public site form
router.get("/user/data/inquiery", verifyToken, staff, controller.getAllInqueryUser);

module.exports = router;
