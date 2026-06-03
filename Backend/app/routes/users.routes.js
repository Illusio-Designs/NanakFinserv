const userController = require("../controllers/user.controller");
const verifyToken = require('../middleware/JWTAuth')
const express = require('express');
const router = express.Router();



// Auth routes (login / OTP verification / ping) are handled by the dedicated
// auth module: src/modules/auth/auth.routes.js (mounted in server.js).
// router.post("/user/resetPassword", userController.resetPasswordRequest);
// router.post("/user/updatePassword", userController.updatePasswordByMail);
router.get("/user/list/consumer", [verifyToken], userController.getAllUsers);
router.get("/user/list/builder", [verifyToken], userController.getAllBuilderUsers);
router.get("/user/list/builder/list", [verifyToken], userController.getAllBuilderListUsers);
router.get("/user/list/roleWise", [verifyToken], userController.getAllRolesUsers);
router.post("/user/list/categoriesById", [verifyToken], userController.getCategoryById);

router.post("/user/data/add", [verifyToken], userController.addData);
router.get("/user/role/list", [verifyToken], userController.getAllRoles);
router.post("/user/data/role/add", [verifyToken], userController.addRoleWiseUser);
router.put("/user/data/role/update", [verifyToken], userController.updateRoleWiseUser);
// router.put("/user/data/update", [verifyToken], userController.updateData);

router.post("/user/vehicle/user/add", [verifyToken], userController.addVehicleUserData);
console.log("✅ Route loaded: PUT /user/vehicle/user/update/:vehicle_user_id");



router.put("/user/vehicle/user/update/:vehicle_user_id", [verifyToken], userController.updateVehicleUserData);
router.put("/user/vehicle/user/update/remark/:vehicle_user_id", [verifyToken], userController.updateVehicleUserRemarkData);
router.post("/user/vehicle/user/list", [verifyToken], userController.getVehicleUserData);
router.post("/user/vehicle/user/renewal/list", [verifyToken], userController.getVehicleUserRenewalData);
// Renew running policy -> create previous policy and clear running policy
router.post("/user/renewVehiclePolicy", [verifyToken], userController.renewVehiclePolicy);
router.get("/user/vehicle/renewal/stats", [verifyToken], userController.getVehicleRenewalStats);
router.post("/user/data/vehicle", [verifyToken], userController.addVehicleDetails);
router.post("/user/data/policyplan", [verifyToken], userController.addPolicyplanDetails);
router.post("/user/data/policytype", [verifyToken], userController.addPolicyTypeDetails);
router.get("/user/data/vehicle", [verifyToken], userController.getAllVehicles);
router.get("/user/data/policytype", [verifyToken], userController.getAllPolicyTypes);
router.get("/user/data/policyplan", [verifyToken], userController.getAllPolicyPlans);

router.post("/user/data/add/builder", [verifyToken], userController.addBuilderData);
router.post("/user/data/add/consumer", [verifyToken], userController.addConsumerData);
router.put("/user/data/add/consumer/loan", [verifyToken], userController.updateLoanConsumerData);
router.put("/user/data/update/consumer", [verifyToken], userController.updateConsumerData);
router.post("/user/data/update/builder", [verifyToken], userController.updateBuilderData);
router.put("/user/data/update", [verifyToken], userController.updateData);
router.get("/user/data/builder/unit", [verifyToken], userController.getUnitsByBuilder);
router.get("/user/data/builder/unitCategory/:unitId", [verifyToken], userController.getUnitsByBuilderCategory);
router.post("/user/data/add/builderUnit", [verifyToken], userController.addBuilderUnit);
router.put("/user/data/update/builderUnit", [verifyToken], userController.updateBuilderUnit);
router.post("/user/data/builder/getunitwithconsumer",[verifyToken],userController.getUintByConsumer);
router.post("/user/data/add/builderUnitCategory", [verifyToken], userController.addBuilderUnitCategory);
router.put("/user/data/update/builderUnitCategory", [verifyToken], userController.updateBuilderUnitCategory);
router.get("/user/data/unitCategory", [verifyToken], userController.getAllUnitCatergory);
router.get("/user/list/verticle", [verifyToken], userController.getAllUnitVerticle);
router.post("/user/list/verticleUser", [verifyToken], userController.getAllVerticleUser);
router.get("/user/list/loan", [verifyToken], userController.getAllLoanUser);
router.post("/user/list/loan/detail", [verifyToken], userController.getAllLoanUserDetail);
router.post("/user/list/loanInterested", [verifyToken], userController.getAllLoanUserInterested);
router.get("/user/list/loanNotInterested", [verifyToken], userController.getAllLoanUserNotInterested);
router.post("/user/list/loanNotDisburse", [verifyToken], userController.getAllLoanUserDisburse);
router.put("/user/list/loanUpdateStatus", [verifyToken], userController.updateLoanStatus);
router.put("/user/list/loanUpdateWorkingStatus", [verifyToken], userController.updateWorkingLoanStatus);
router.get("/user/list/mediclaim", [verifyToken], userController.getAllMediclaimUser);
router.get("/user/list/lifeIns", [verifyToken], userController.getAllLifeInsUser);
router.get("/user/list/vehicleIns", [verifyToken], userController.getAllVehicleInsUser);
router.post("/user/data/consumer/add",[verifyToken],userController.addConsumer);
router.put("/user/data/consumer/update/:id",[verifyToken],userController.updateConsumer);
router.post("/user/loan/disburse/add",[verifyToken],userController.addDisburse);
router.post("/user/loan/configuration/add",[verifyToken],userController.addLoanCobfiguration);
router.put("/user/loan/disburse/update",[verifyToken],userController.updateDisburse)
router.get("/user/mediclaim/company",[verifyToken],userController.getAllMediclaimCompany)
router.post("/user/mediclaim/company/add",[verifyToken],userController.addMediclaimCompanyData)
router.put("/user/mediclaim/company/update",[verifyToken],userController.updateMediclaimCompanyData)
router.get("/user/mediclaim/product/:id",[verifyToken],userController.getAllMediclaimProduct)
router.post("/user/mediclaim/product/add/:id",[verifyToken],userController.addMediclaimProductData)
router.put("/user/mediclaim/product/update/:id",[verifyToken],userController.updateMediclaimProductData)
router.post("/user/mediclaim/user/add",[verifyToken],userController.addMediclaimUserData)
router.put("/user/mediclaim/user/update/:id",[verifyToken],userController.updateMediclaimUserData)
router.get("/user/mediclaim/user/list",[verifyToken],userController.geteMediclaimUserData)
router.post("/user/mediclaim/user/renewal/list",[verifyToken],userController.geteMediclaimUserRenewalData)
router.get("/user/mediclaim/company/list",[verifyToken],userController.geteMediclaimCompanyData)
router.get("/user/mediclaim/product/list",[verifyToken],userController.geteMediclaimProductData)
router.post("/user/data/inquiery", [verifyToken], userController.addInquieryUser);
router.post('/public/inquiry', userController.addInquieryUser);
router.post("/user/data/code", [verifyToken], userController.addCodeDetails);
router.get("/user/data/code", [verifyToken], userController.getAllCodes);
router.get("/user/data/company-type", [verifyToken], userController.getAllCompanyTypes);
router.post("/user/data/company-type", [verifyToken], userController.addCompanyTypeDetails);
router.get("/user/data/loan/configuration", [verifyToken], userController.getAllLoanConfiguration);
router.get("/user/data/inquiery", [verifyToken], userController.getAllInqueryUser);
router.get("/user/data/counts", [verifyToken], userController.getUserCounts);
router.post("/user/data/filter/amount", [verifyToken], userController.getLoanAmounFilterDate);
router.get("/user/download/:filename", userController.downloadFile);

// Blog routes
router.post("/user/blog/add", [verifyToken], userController.addBlog);
router.put("/user/blog/update/:id", [verifyToken], userController.updateBlog);
router.delete("/user/blog/delete/:id", [verifyToken], userController.deleteBlog); 
router.get("/user/blog/list", [verifyToken], userController.getAllBlogs);
router.get("/user/blog/:id", [verifyToken], userController.getBlogById);

// Public blog routes
router.get("/public/blog/list", userController.getAllBlogs);
router.get("/public/blog/:id", userController.getBlogById);
router.get('/user/list/all-vehicle-users-debug', userController.listAllVehicleUsersDebug);
router.get("/user/vehicle/user/:vehicle_user_id", [verifyToken], userController.getVehicleUserById);

// Life Insurance Routes
router.post("/user/life-insurance/create", [verifyToken], userController.createLifeInsurance);
router.get("/user/life-insurance/list", [verifyToken], userController.getAllLifeInsurance);
router.get("/user/life-insurance/:id", [verifyToken], userController.getLifeInsuranceById);
router.put("/user/life-insurance/update/:id", [verifyToken], userController.updateLifeInsurance);
router.delete("/user/life-insurance/delete/:id", [verifyToken], userController.deleteLifeInsurance);
router.put("/user/life-insurance/status/:id", [verifyToken], userController.updateLifeInsuranceStatus);

// Life Insurance Document Routes
router.post("/user/life-insurance/:lifeInsuranceId/documents/upload", [verifyToken], userController.uploadLifeInsuranceDocument);
router.get("/user/life-insurance/:lifeInsuranceId/documents", [verifyToken], userController.getLifeInsuranceDocuments);
router.delete("/user/life-insurance/documents/:documentId", [verifyToken], userController.deleteLifeInsuranceDocument);

// Life Insurance by Consumer Routes (for consumer role mapping integration)
router.get("/user/life-insurance/consumer/:consumerId", [verifyToken], userController.getLifeInsuranceByConsumer);

// Life Insurance Renewal Data Route
router.get("/user/life-insurance/renewal/data", [verifyToken], userController.getLifeInsuranceRenewalData);

// Notification Routes
router.get("/user/notifications", [verifyToken], userController.getNotifications);
router.put("/user/notifications/:notificationId/read", [verifyToken], userController.markNotificationAsRead);
router.put("/user/notifications/read-all", [verifyToken], userController.markAllNotificationsAsRead);
router.get("/user/notifications/count", [verifyToken], userController.getNotificationCount);

// Building Manager Routes
router.post("/user/building-manager/create", [verifyToken], userController.createBuildingManager);
router.post("/user/building-manager/assign", [verifyToken], userController.assignBuildingManager);
router.get("/user/building-manager/list", [verifyToken], userController.getAllBuildingManagers);
router.get("/user/building-manager/stats", [verifyToken], userController.getBuildingManagerStats);
router.get("/user/building-manager/dashboard-stats", [verifyToken], userController.getBuildingManagerDashboardStats);
router.put("/user/building-manager/update/:id", [verifyToken], userController.updateBuildingManager);
router.put("/user/building-manager/remove/:id", [verifyToken], userController.removeBuildingManager);

// Consumer Dashboard Route
router.get("/user/consumer/dashboard", [verifyToken], userController.getConsumerDashboardData);

module.exports = router;
