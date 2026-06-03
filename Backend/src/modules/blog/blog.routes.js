/**
 * blog routes — mounted under /api.
 */
const express = require("express");
const verifyToken = require("../../../app/middleware/JWTAuth");
const controller = require("./blog.controller");
const v = require("./blog.validator");

const router = express.Router();

router.post("/user/blog/add", verifyToken, v.validateAddBlog, controller.addBlog);
router.put("/user/blog/update/:id", verifyToken, controller.updateBlog);
router.delete("/user/blog/delete/:id", verifyToken, controller.deleteBlog);
router.get("/user/blog/list", verifyToken, controller.getAllBlogs);
router.get("/user/blog/:id", verifyToken, controller.getBlogById);
router.get("/public/blog/list", controller.getAllBlogs);
router.get("/public/blog/:id", controller.getBlogById);

module.exports = router;
