/**
 * Auth routes. Mounted under /api by the main app.
 */
const express = require("express");

const controller = require("./auth.controller");
const { validateLogin, validateMobileOnly } = require("./auth.validator");

const router = express.Router();

router.post("/user/login", validateLogin, controller.login);
router.post("/user/verfiy", validateMobileOnly, controller.checkUser);
router.get("/user/check", controller.ping);

module.exports = router;
