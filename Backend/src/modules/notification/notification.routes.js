/**
 * notification routes — mounted under /api. Dashboard users.
 */
const express = require("express");
const verifyToken = require("../../../app/middleware/JWTAuth");
const { requireRole, PORTAL } = require("../../middleware/rbac");
const controller = require("./notification.controller");

const router = express.Router();
const portal = requireRole(...PORTAL);

router.get("/user/notifications", verifyToken, portal, controller.getNotifications);
router.put("/user/notifications/:notificationId/read", verifyToken, portal, controller.markNotificationAsRead);
router.put("/user/notifications/read-all", verifyToken, portal, controller.markAllNotificationsAsRead);
router.get("/user/notifications/count", verifyToken, portal, controller.getNotificationCount);

module.exports = router;
