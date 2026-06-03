/**
 * notification routes — mounted under /api.
 */
const express = require("express");
const verifyToken = require("../../../app/middleware/JWTAuth");
const controller = require("./notification.controller");

const router = express.Router();

router.get("/user/notifications", verifyToken, controller.getNotifications);
router.put("/user/notifications/:notificationId/read", verifyToken, controller.markNotificationAsRead);
router.put("/user/notifications/read-all", verifyToken, controller.markAllNotificationsAsRead);
router.get("/user/notifications/count", verifyToken, controller.getNotificationCount);

module.exports = router;
