/**
 * Aggregates every per-domain router. Mounted at /api by server.js.
 * (Replaces the legacy app/routes/users.routes.js single-file router.)
 */
const express = require("express");
const adminRoutes = require("../modules/admin/admin.routes");
const authRoutes = require("../modules/auth/auth.routes");
const blogRoutes = require("../modules/blog/blog.routes");
const builderRoutes = require("../modules/builder/builder.routes");
const buildingManagerRoutes = require("../modules/buildingManager/buildingManager.routes");
const consumerRoutes = require("../modules/consumer/consumer.routes");
const dashboardRoutes = require("../modules/dashboard/dashboard.routes");
const inquiryRoutes = require("../modules/inquiry/inquiry.routes");
const lifeInsuranceRoutes = require("../modules/lifeInsurance/lifeInsurance.routes");
const loanRoutes = require("../modules/loan/loan.routes");
const mediclaimRoutes = require("../modules/mediclaim/mediclaim.routes");
const notificationRoutes = require("../modules/notification/notification.routes");
const sharedRoutes = require("../modules/shared/shared.routes");
const userRoutes = require("../modules/user/user.routes");
const vehicleRoutes = require("../modules/vehicle/vehicle.routes");

const router = express.Router();

router.use(adminRoutes);
router.use(authRoutes);
router.use(blogRoutes);
router.use(builderRoutes);
router.use(buildingManagerRoutes);
router.use(consumerRoutes);
router.use(dashboardRoutes);
router.use(inquiryRoutes);
router.use(lifeInsuranceRoutes);
router.use(loanRoutes);
router.use(mediclaimRoutes);
router.use(notificationRoutes);
router.use(sharedRoutes);
router.use(userRoutes);
router.use(vehicleRoutes);

module.exports = router;
