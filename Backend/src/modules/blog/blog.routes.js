/**
 * blog routes — mounted under /api.
 */
const express = require("express");
const verifyToken = require("../../../app/middleware/JWTAuth");
const { requireRole, ADMIN } = require("../../middleware/rbac");
const { wrapController } = require("../../middleware/asyncHandler");
const controller = wrapController(require("./blog.controller"));
const v = require("./blog.validator");

const router = express.Router();

// Blog authoring is admin-only; reads (incl. /public/blog/*) stay open.
router.post("/user/blog/add", verifyToken, requireRole(...ADMIN), v.validateAddBlog, controller.addBlog);
router.put("/user/blog/update/:id", verifyToken, requireRole(...ADMIN), controller.updateBlog);
router.delete("/user/blog/delete/:id", verifyToken, requireRole(...ADMIN), controller.deleteBlog);
router.get("/user/blog/list", verifyToken, controller.getAllBlogs);
router.get("/user/blog/:id", verifyToken, controller.getBlogById);
router.get("/public/blog/list", controller.getAllBlogs);
router.get("/public/blog/:id", controller.getBlogById);

module.exports = router;
