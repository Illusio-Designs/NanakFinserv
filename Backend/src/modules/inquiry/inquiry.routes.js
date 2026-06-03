/**
 * inquiry routes — mounted under /api.
 */
const express = require("express");
const verifyToken = require("../../../app/middleware/JWTAuth");
const controller = require("./inquiry.controller");
const v = require("./inquiry.validator");

const router = express.Router();

router.post("/user/data/inquiery", verifyToken, v.validateAddInquiry, controller.addInquieryUser);
router.post('/public/inquiry', v.validateAddInquiry, controller.addInquieryUser);
router.get("/user/data/inquiery", verifyToken, controller.getAllInqueryUser);

module.exports = router;
