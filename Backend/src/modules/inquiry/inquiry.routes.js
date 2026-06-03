/**
 * inquiry routes — mounted under /api.
 */
const express = require("express");
const verifyToken = require("../../../app/middleware/JWTAuth");
const controller = require("./inquiry.controller");

const router = express.Router();

router.post("/user/data/inquiery", verifyToken, controller.addInquieryUser);
router.post('/public/inquiry', controller.addInquieryUser);
router.get("/user/data/inquiery", verifyToken, controller.getAllInqueryUser);

module.exports = router;
