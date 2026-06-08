const Sequelize = require("sequelize");
const dotenvParseVariables = require('dotenv-parse-variables');
let env = require('dotenv').config();
env = dotenvParseVariables(env.parsed);
// console.log(process.env.HOST,process.env.poolMin)

var sequelize = new Sequelize(process.env.DB, process.env.USER, process.env.PASSWORD, {
  host: process.env.HOST,
  dialect:  process.env.dialect,
  operatorsAliases: 0,
  logging:false,
});

const db = {};

db.sequelize = sequelize;
db.user = require("./user.models")(sequelize, Sequelize);
db.builderUser = require("./builderUser.model")(sequelize, Sequelize);
db.role = require("./role.model")(sequelize, Sequelize);
db.category = require("./category.model")(sequelize, Sequelize);
db.userCategory = require("./userCategory.model")(sequelize, Sequelize);
db.unit = require("./unit.model")(sequelize, Sequelize);
db.unit_category_list = require("./unit_category_list.model")(sequelize, Sequelize);
db.unit_category_detail = require("./unit_category_detail.model")(sequelize, Sequelize);
db.consumerRoleMapping = require("./consumerRoleMapping.model")(sequelize, Sequelize);
db.loanUser = require("./loanUser.model")(sequelize, Sequelize);
db.builderConsumer = require("./builderConsumer.model")(sequelize, Sequelize);
db.disburse = require("./disburse.model")(sequelize,Sequelize);
db.loanConfiguration = require("./loanConfiguration")(sequelize,Sequelize);
db.mediclaimCompany = require("./mediclaimCompany.model")(sequelize,Sequelize);
db.mediclaimProduct = require("./mediclaimProduct.model")(sequelize,Sequelize);
db.medicliamuser = require("./mediclaim.model")(sequelize,Sequelize);
db.inqueryuser = require("./inquiryUser.model")(sequelize,Sequelize);
db.familyMember = require("./familyMember.mode")(sequelize,Sequelize);
db.employeeMediclaim = require("./employeeMediclaim.model")(sequelize,Sequelize);
db.mediclaimproductpdf  = require("./mediclaimProductPdf.model")(sequelize,Sequelize)
db.floor  = require("./floor.model")(sequelize,Sequelize)
db.wing  = require("./wing.model")(sequelize,Sequelize)
db.disbursementLoan  = require("./loan_details/disbursementloan.model")(sequelize,Sequelize)
db.documentSelectedLoan  = require("./loan_details/documentSelected.model")(sequelize,Sequelize)
db.loginLoan  = require("./loan_details/login.model")(sequelize,Sequelize)
db.property  = require("./loan_details/property.model")(sequelize,Sequelize)
db.queryLoan  = require("./loan_details/query.model")(sequelize,Sequelize)
db.cancelLoan  = require("./loan_details/cancel.model")(sequelize,Sequelize)
db.sanctionLoan  = require("./loan_details/sanction.model")(sequelize,Sequelize)
db.partPaymentLoan  = require("./loan_details/partPayment.model")(sequelize,Sequelize)
db.codeDetail  = require("./codeDetail.model")(sequelize,Sequelize)
db.runningPolicyMediclaim  = require("./runningPolicyMediclaim.model")(sequelize,Sequelize)
db.documents  = require("./documents.model")(sequelize,Sequelize)
db.vehicles  = require("./vehicles.model")(sequelize,Sequelize)
db.references = require("./reference.model")(sequelize,Sequelize)
db.policyPlan  = require("./policyPlan.model")(sequelize,Sequelize)
db.policyType  = require("./policyType.model")(sequelize,Sequelize)
db.companyType  = require("./companyType.model")(sequelize,Sequelize)
db.previousPolicyMediclaim  = require("./previousPolicyMediclaim.model")(sequelize,Sequelize)
db.blog = require("./blog.model")(sequelize, Sequelize);
db.vehicleUser  = require("./vehicle_details/vehicleUser.model")(sequelize,Sequelize)
db.vehcileRunningPolicy  = require("./vehicle_details/vehcileRunningPolicy.model")(sequelize,Sequelize)
db.vehiclePreviousPolicy  = require("./vehicle_details/vehiclePreviousPolicy.model")(sequelize,Sequelize)
db.vehicle_document  = require("./vehicle_details/vehicle_document.model")(sequelize,Sequelize)
db.lifeInsurance = require("./lifeInsurance.model")(sequelize, Sequelize)
db.lifeInsuranceDocument = require("./lifeInsuranceDocument.model")(sequelize, Sequelize)
db.notification = require("./notification.model")(sequelize, Sequelize)
db.appSetting = require("./appSetting.model")(sequelize, Sequelize)
db.buildingManager = require("./buildingManager.model")(sequelize, Sequelize)
db.consumerDocument = require("./consumerDocument.model")(sequelize, Sequelize)

db.mediclaimProduct.hasMany(db.mediclaimproductpdf , { foreignKey : "mediclaim_product_id"})
db.mediclaimproductpdf.hasOne(db.mediclaimProduct, { foreignKey: "mediclaim_product_id"})

db.user.hasMany(db.builderUser, {foreignKey:'updated_by',as: 'updated_by_id' });
db.builderUser.belongsTo(db.user, { foreignKey: 'updated_by',as: 'updated_by_id' });

db.user.hasMany(db.builderUser, {foreignKey:'created_by',as: 'created_by_id' });
db.builderUser.belongsTo(db.user, { foreignKey: 'created_by',as: 'created_by_id' });

// db.user.hasMany(db.user, {foreignKey:'created_by',as: 'created_by_user' });
db.user.belongsTo(db.user, { foreignKey: 'created_by',as: 'created_by_user' });
db.user.belongsTo(db.user, { foreignKey: 'updated_by',as: 'updated_by_user' });
db.user.belongsTo(db.user, { foreignKey: 'builder_user',as: 'builder_user_fk' });

// Household: a head (primary consumer) has many family members; each member
// belongs to its head. Both are `user` rows (members can log in with their own
// mobile). family_head_id is NULL for heads.
db.user.hasMany(db.user, { foreignKey: 'family_head_id', as: 'familyMembers' });
db.user.belongsTo(db.user, { foreignKey: 'family_head_id', as: 'familyHead' });

db.user.hasOne(db.builderUser, { foreignKey: 'user_id' });
db.builderUser.belongsTo(db.user, { foreignKey: 'user_id' });

db.role.hasOne(db.user, { foreignKey: 'role_id' });
db.user.belongsTo(db.role, { foreignKey: 'role_id' });

db.user.hasMany(db.userCategory, { foreignKey: 'user_id' });
db.userCategory.belongsTo(db.user, { foreignKey: 'user_id' });

db.category.hasOne(db.userCategory, { foreignKey: 'category_id' });
db.userCategory.belongsTo(db.category, { foreignKey: 'category_id' });

db.builderUser.hasOne(db.unit, { foreignKey: 'builder_id' });
db.unit.belongsTo(db.builderUser, { foreignKey: 'builder_id' });

db.unit_category_list.hasOne(db.unit_category_detail, { foreignKey: 'unit_category_id' });
db.unit_category_detail.belongsTo(db.unit_category_list, { foreignKey: 'unit_category_id' });

db.unit.hasOne(db.unit_category_detail, { foreignKey: 'unit_id' });
db.unit_category_detail.belongsTo(db.unit, { foreignKey: 'unit_id' });

// User model
db.user.hasMany(db.consumerRoleMapping, { foreignKey: 'user_role_id', as: 'userRoles' });
db.consumerRoleMapping.belongsTo(db.user, { foreignKey: 'user_role_id', as: 'userRoles' });

db.user.hasMany(db.consumerRoleMapping, { foreignKey: 'user_consumer_id', as: 'userConsumers' });
db.consumerRoleMapping.belongsTo(db.user, { foreignKey: 'user_consumer_id', as: 'userConsumers' });

db.consumerRoleMapping.belongsTo(db.vehicleUser, { foreignKey: 'user_consumer_id', targetKey: 'user_id', as: 'vehicleUser' });
db.vehicleUser.hasOne(db.consumerRoleMapping, { foreignKey: 'user_consumer_id', sourceKey: 'user_id', as: 'consumerRoleMapping' });

db.category.hasMany(db.consumerRoleMapping, { foreignKey: 'category_id', as: 'categories' });
db.consumerRoleMapping.belongsTo(db.category, { foreignKey: 'category_id', as: 'category' });

db.user.hasMany(db.loanUser, {foreignKey:'user_id',as: 'user_pk_id' });
db.loanUser.belongsTo(db.user, { foreignKey: 'user_id',as: 'user_pk_id' });

db.role.hasOne(db.builderConsumer, { foreignKey: 'role_id' });
db.builderConsumer.belongsTo(db.role, { foreignKey: 'role_id' });

db.unit.hasMany(db.builderConsumer, { foreignKey: 'unit_id' });
db.builderConsumer.belongsTo(db.unit, { foreignKey: 'unit_id' });

db.unit_category_list.hasMany(db.builderConsumer, { foreignKey: 'unit_category_id' });
db.builderConsumer.belongsTo(db.unit_category_list, { foreignKey: 'unit_category_id' });

db.builderUser.hasMany(db.builderConsumer, { foreignKey: 'builder_id' });
db.builderConsumer.belongsTo(db.builderUser, { foreignKey: 'builder_id' });

db.wing.hasMany(db.builderConsumer, { foreignKey: 'wing_id' });
db.builderConsumer.belongsTo(db.wing, { foreignKey: 'wing_id' });

db.floor.hasMany(db.builderConsumer, { foreignKey: 'floor_id' });
db.builderConsumer.belongsTo(db.floor, { foreignKey: 'floor_id' });

db.user.hasMany(db.disburse ,{foreignKey:'user_id'});
db.disburse.belongsTo(db.user ,{foreignKey :'user_id'});

db.loanUser.hasMany(db.disburse,{foreignKey:'laon_id'});
db.disburse.belongsTo(db.loanUser ,{foreignKey :'laon_id'});

db.user.hasMany(db.builderConsumer, { foreignKey: 'user_id' });
db.builderConsumer.belongsTo(db.user, { foreignKey: 'user_id' });

db.mediclaimCompany.hasOne(db.mediclaimProduct, { foreignKey: 'mediclaim_company_id' });
db.mediclaimProduct.belongsTo(db.mediclaimCompany, { foreignKey: 'mediclaim_company_id' });

db.mediclaimCompany.hasOne(db.medicliamuser, { foreignKey: 'mediclaim_company_id' });
db.medicliamuser.belongsTo(db.mediclaimCompany, { foreignKey: 'mediclaim_company_id' });

db.mediclaimProduct.hasOne(db.previousPolicyMediclaim, { foreignKey: 'mediclaim_product_id' });
db.previousPolicyMediclaim.belongsTo(db.mediclaimProduct, { foreignKey: 'mediclaim_product_id' });

db.user.hasOne(db.medicliamuser, { foreignKey: 'user_id' });
db.medicliamuser.belongsTo(db.user, { foreignKey: 'user_id' });

db.unit.hasOne(db.wing, { foreignKey: 'unit_id' });
db.wing.belongsTo(db.unit, { foreignKey: 'unit_id' });

db.unit_category_detail.hasMany(db.wing, { foreignKey: 'unit_category_detail_id' });
db.wing.belongsTo(db.unit_category_detail, { foreignKey: 'unit_category_detail_id' });

db.unit.hasOne(db.floor, { foreignKey: 'unit_id' });
db.floor.belongsTo(db.unit, { foreignKey: 'unit_id' });

db.unit_category_detail.hasMany(db.floor, { foreignKey: 'unit_category_detail_id' });
db.floor.belongsTo(db.unit_category_detail, { foreignKey: 'unit_category_detail_id' });

db.wing.hasMany(db.floor, { foreignKey: 'wing_id' });
db.floor.belongsTo(db.wing, { foreignKey: 'wing_id' });

db.medicliamuser.hasMany(db.familyMember, { foreignKey: 'mediclaim_id', as: 'familymembers' });
db.familyMember.belongsTo(db.medicliamuser, { foreignKey: 'mediclaim_id' });

db.medicliamuser.hasMany(db.employeeMediclaim, { foreignKey: 'mediclaim_id', as: 'employees' });
db.employeeMediclaim.belongsTo(db.medicliamuser, { foreignKey: 'mediclaim_id' });

db.loanUser.hasOne(db.documentSelectedLoan, { foreignKey: 'laon_id' });
db.documentSelectedLoan.belongsTo(db.loanUser, { foreignKey: 'laon_id' });

db.user.hasMany(db.documentSelectedLoan, {foreignKey:'updated_by' });
db.documentSelectedLoan.belongsTo(db.user, { foreignKey: 'updated_by' });

db.loanUser.hasOne(db.sanctionLoan, { foreignKey: 'laon_id' });
db.sanctionLoan.belongsTo(db.loanUser, { foreignKey: 'laon_id' });

db.user.hasMany(db.sanctionLoan, {foreignKey:'updated_by' });
db.sanctionLoan.belongsTo(db.user, { foreignKey: 'updated_by' });

db.loanUser.hasOne(db.queryLoan, { foreignKey: 'laon_id' });
db.queryLoan.belongsTo(db.loanUser, { foreignKey: 'laon_id' });

db.user.hasMany(db.queryLoan, {foreignKey:'updated_by' });
db.queryLoan.belongsTo(db.user, { foreignKey: 'updated_by' });

db.loanUser.hasOne(db.cancelLoan, { foreignKey: 'laon_id' });
db.cancelLoan.belongsTo(db.loanUser, { foreignKey: 'laon_id' });

db.user.hasMany(db.cancelLoan, {foreignKey:'updated_by' });
db.cancelLoan.belongsTo(db.user, { foreignKey: 'updated_by' });

db.loanUser.hasOne(db.loginLoan, { foreignKey: 'laon_id' });
db.loginLoan.belongsTo(db.loanUser, { foreignKey: 'laon_id' });

db.user.hasMany(db.loginLoan, {foreignKey:'updated_by' });
db.loginLoan.belongsTo(db.user, { foreignKey: 'updated_by' });

db.loanUser.hasOne(db.property, { foreignKey: 'laon_id' });
db.property.belongsTo(db.loanUser, { foreignKey: 'laon_id' });

db.user.hasMany(db.property, {foreignKey:'updated_by' });
db.property.belongsTo(db.user, { foreignKey: 'updated_by' });

db.codeDetail.hasMany(db.loginLoan, {foreignKey:'code_id' });
db.loginLoan.belongsTo(db.codeDetail, { foreignKey: 'code_id' });

db.loanUser.hasOne(db.disbursementLoan, { foreignKey: 'laon_id' });
db.disbursementLoan.belongsTo(db.loanUser, { foreignKey: 'laon_id' });

db.user.hasMany(db.disbursementLoan, {foreignKey:'updated_by' });
db.disbursementLoan.belongsTo(db.user, { foreignKey: 'updated_by' });

db.loanUser.hasMany(db.partPaymentLoan, { foreignKey: 'laon_id' });
db.partPaymentLoan.belongsTo(db.loanUser, { foreignKey: 'laon_id' });

db.user.hasMany(db.partPaymentLoan, { foreignKey: 'updated_by' });
db.partPaymentLoan.belongsTo(db.user, { foreignKey: 'updated_by' });




db.medicliamuser.hasMany(db.runningPolicyMediclaim, { foreignKey: 'mediclaim_id' });
db.runningPolicyMediclaim.belongsTo(db.medicliamuser, { foreignKey: 'mediclaim_id' });

db.medicliamuser.hasMany(db.previousPolicyMediclaim, { foreignKey: 'mediclaim_id' });
db.previousPolicyMediclaim.belongsTo(db.medicliamuser, { foreignKey: 'mediclaim_id' });

db.user.hasOne(db.vehicleUser, { foreignKey: 'user_id',as: 'user_pk_vehicle_id' });
db.vehicleUser.belongsTo(db.user, { foreignKey: 'user_id',as: 'user_pk_vehicle_id' });

db.user.hasOne(db.vehicleUser, { foreignKey: 'consumer_role_id',as: 'user_pk_consumer_id' });
db.vehicleUser.belongsTo(db.user, { foreignKey: 'consumer_role_id',as: 'user_pk_consumer_id' });

db.vehicles.hasOne(db.vehicleUser, { foreignKey: 'vehicle_id' });
db.vehicleUser.belongsTo(db.vehicles, { foreignKey: 'vehicle_id' });

db.references.hasOne(db.vehicleUser, { foreignKey: 'reference_id' });
db.vehicleUser.belongsTo(db.references, { foreignKey: 'reference_id' });

db.policyPlan.hasOne(db.vehcileRunningPolicy, { foreignKey: 'policy_plan_id' });
db.vehcileRunningPolicy.belongsTo(db.policyPlan, { foreignKey: 'policy_plan_id', as: 'policyPlan' });

db.policyType.hasOne(db.vehcileRunningPolicy, { foreignKey: 'policy_type_id' });
db.vehcileRunningPolicy.belongsTo(db.policyType, { foreignKey: 'policy_type_id', as: 'policyType' });

db.companyType.hasOne(db.vehcileRunningPolicy, { foreignKey: 'company_id' });
db.vehcileRunningPolicy.belongsTo(db.companyType, { foreignKey: 'company_id', as: 'CompanyType' });

db.policyPlan.hasOne(db.vehiclePreviousPolicy, { foreignKey: 'policy_plan_id' });
db.vehiclePreviousPolicy.belongsTo(db.policyPlan, { foreignKey: 'policy_plan_id', as: 'policyPlan' });

db.policyType.hasOne(db.vehiclePreviousPolicy, { foreignKey: 'policy_type_id' });
db.vehiclePreviousPolicy.belongsTo(db.policyType, { foreignKey: 'policy_type_id', as: 'policyType' });

db.companyType.hasOne(db.vehiclePreviousPolicy, { foreignKey: 'company_id' });
db.vehiclePreviousPolicy.belongsTo(db.companyType, { foreignKey: 'company_id', as: 'CompanyType' });

db.vehicleUser.hasOne(db.vehcileRunningPolicy, { foreignKey: 'vehicle_user_id', as: 'runningPolicy' });
db.vehcileRunningPolicy.belongsTo(db.vehicleUser, { foreignKey: 'vehicle_user_id' });

  // Changed from hasOne to hasMany to fetch ALL previous policies
db.vehicleUser.hasMany(db.vehiclePreviousPolicy, { foreignKey: 'vehicle_user_id', as: 'previousPolicies' });
db.vehiclePreviousPolicy.belongsTo(db.vehicleUser, { foreignKey: 'vehicle_user_id' });

db.vehicleUser.hasMany(db.vehicle_document, { foreignKey: 'vehicle_user_id', as: 'documents' });
db.vehicle_document.belongsTo(db.vehicleUser, { foreignKey: 'vehicle_user_id' });

db.user.hasMany(db.vehicle_document, { foreignKey: 'user_id' });
db.vehicle_document.belongsTo(db.user, { foreignKey: 'user_id' });

db.documents.hasMany(db.vehicle_document, { foreignKey: 'categoryId' });
db.vehicle_document.belongsTo(db.documents, { foreignKey: 'categoryId' });

db.policyPlan.hasMany(db.vehcileRunningPolicy, { foreignKey: 'policy_plan_id', as: 'vehcileRunningPolicies' });

// Life Insurance Relationships - Integration with Consumer Role Mapping
db.user.hasMany(db.lifeInsurance, { foreignKey: 'user_id', as: 'lifeInsurancePolicies' });
db.lifeInsurance.belongsTo(db.user, { foreignKey: 'user_id', as: 'policyHolder' });

// Building Manager relationships
db.user.hasMany(db.buildingManager, { foreignKey: 'user_id' });
db.buildingManager.belongsTo(db.user, { foreignKey: 'user_id', as: 'user' });

db.unit.hasMany(db.buildingManager, { foreignKey: 'unit_id' });
db.buildingManager.belongsTo(db.unit, { foreignKey: 'unit_id' });

// Life Insurance through Consumer Role Mapping
db.consumerRoleMapping.hasMany(db.lifeInsurance, { foreignKey: 'user_consumer_id', sourceKey: 'user_consumer_id', as: 'lifeInsurancePolicies' });
db.lifeInsurance.belongsTo(db.consumerRoleMapping, { foreignKey: 'user_consumer_id', targetKey: 'user_consumer_id', as: 'consumerMapping' });

// Life Insurance Documents
db.lifeInsurance.hasMany(db.lifeInsuranceDocument, { foreignKey: 'life_insurance_id', as: 'documents' });
db.lifeInsuranceDocument.belongsTo(db.lifeInsurance, { foreignKey: 'life_insurance_id', as: 'lifeInsurancePolicy' });

// Audit relationships
db.user.hasMany(db.lifeInsurance, { foreignKey: 'created_by', as: 'createdLifeInsurancePolicies' });
db.lifeInsurance.belongsTo(db.user, { foreignKey: 'created_by', as: 'createdByUser' });

db.user.hasMany(db.lifeInsurance, { foreignKey: 'updated_by', as: 'updatedLifeInsurancePolicies' });
db.lifeInsurance.belongsTo(db.user, { foreignKey: 'updated_by', as: 'updatedByUser' });

db.user.hasMany(db.lifeInsuranceDocument, { foreignKey: 'uploaded_by', as: 'uploadedDocuments' });
db.lifeInsuranceDocument.belongsTo(db.user, { foreignKey: 'uploaded_by', as: 'uploadedByUser' });

// Consumer-level KYC documents (one store reused across verticals).
db.user.hasMany(db.consumerDocument, { foreignKey: 'user_id', as: 'consumerDocuments' });
db.consumerDocument.belongsTo(db.user, { foreignKey: 'user_id' });
db.documents.hasMany(db.consumerDocument, { foreignKey: 'categoryId' });
db.consumerDocument.belongsTo(db.documents, { foreignKey: 'categoryId' });

module.exports = db;