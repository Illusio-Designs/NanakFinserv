/**
 * Single source of truth mapping each extracted controller function to its
 * domain module. Used by the split-* migration scripts.
 */
module.exports = {
  user: [
    "getAllUsers", "getAllBuilderUsers", "getAllBuilderListUsers",
    "getCategoryById", "getAllRolesUsers", "getAllRoles", "addRoleWiseUser",
    "updateRoleWiseUser", "addData", "updateData", "getAllUnitVerticle",
    "getAllVerticleUser",
  ],
  dashboard: ["getUserCounts", "getLoanAmounFilterDate", "getConsumerDashboardData"],
  shared: [
    "downloadFile", "addCodeDetails", "getAllCodes", "addCompanyTypeDetails",
    "getAllCompanyTypes", "getAllLoanConfiguration", "addPolicyplanDetails",
    "addPolicyTypeDetails", "getAllPolicyPlans", "getAllPolicyTypes",
    "getAllVehicles", "getAllReferences", "getAllDocuments",
    "getAllUnitCatergory", "addVehicleDetails",
  ],
  inquiry: ["addInquieryUser", "getAllInqueryUser"],
  consumer: [
    "addConsumerData", "updateConsumerData", "addConsumer", "updateConsumer",
    "updateLoanConsumerData",
  ],
  builder: [
    "addBuilderData", "updateBuilderData", "getUnitsByBuilder",
    "getUintByConsumer", "getUnitsByBuilderCategory", "addBuilderUnit",
    "updateBuilderUnit", "addBuilderUnitCategory", "updateBuilderUnitCategory",
  ],
  loan: [
    "getAllLoanUser", "getAllLoanUserInterested", "getAllLoanUserDetail",
    "getAllLoanUserNotInterested", "getAllLoanUserDisburse", "updateLoanStatus",
    "updateWorkingLoanStatus", "addLoanCobfiguration", "addDisburse",
    "updateDisburse",
  ],
  mediclaim: [
    "getAllMediclaimUser", "getAllMediclaimCompany", "addMediclaimCompanyData",
    "updateMediclaimCompanyData", "getAllMediclaimProduct",
    "addMediclaimProductData", "updateMediclaimProductData",
    "addMediclaimUserData", "updateMediclaimUserData", "geteMediclaimUserData",
    "geteMediclaimUserRenewalData", "geteMediclaimProductData",
    "geteMediclaimCompanyData",
  ],
  lifeInsurance: [
    "getAllLifeInsUser", "createLifeInsurance", "getAllLifeInsurance",
    "getLifeInsuranceById", "updateLifeInsurance", "deleteLifeInsurance",
    "uploadLifeInsuranceDocument", "getLifeInsuranceDocuments",
    "deleteLifeInsuranceDocument", "updateLifeInsuranceStatus",
    "getLifeInsuranceByConsumer", "getLifeInsuranceRenewalData",
  ],
  vehicle: [
    "getAllVehicleInsUser", "addVehicleUserData", "updateVehicleUserData",
    "getVehicleUserData", "getVehicleUserRenewalData",
    "updateVehicleUserRemarkData", "getVehicleRenewalStats",
    "getVehicleRenewalSheet", "listAllVehicleUsersDebug", "getVehicleUserById",
    "renewVehiclePolicy",
  ],
  buildingManager: [
    "createBuildingManager", "assignBuildingManager", "getAllBuildingManagers",
    "getBuildingManagerStats", "getBuildingManagerDashboardStats",
    "updateBuildingManager", "removeBuildingManager",
  ],
  blog: ["addBlog", "updateBlog", "deleteBlog", "getAllBlogs", "getBlogById"],
  notification: [
    "getNotifications", "markNotificationAsRead", "markAllNotificationsAsRead",
    "getNotificationCount",
  ],
};
