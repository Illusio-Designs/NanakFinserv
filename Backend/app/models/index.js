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
// Loan per-stage models merged into the unified loan_stage table (below).
db.loanStage  = require("./loan_details/loanStage.model")(sequelize,Sequelize) // unified stage table (merge)
db.codeDetail  = require("./codeDetail.model")(sequelize,Sequelize)
db.runningPolicyMediclaim  = require("./runningPolicyMediclaim.model")(sequelize,Sequelize)
db.documents  = require("./documents.model")(sequelize,Sequelize)
db.vehicles  = require("./vehicles.model")(sequelize,Sequelize)
db.references = require("./reference.model")(sequelize,Sequelize)
db.policyPlan  = require("./policyPlan.model")(sequelize,Sequelize)
db.policyType  = require("./policyType.model")(sequelize,Sequelize)
db.companyType  = require("./companyType.model")(sequelize,Sequelize)
// previousPolicyMediclaim merged into runningPolicyMediclaim (is_current flag).
db.blog = require("./blog.model")(sequelize, Sequelize);
db.auditLog = require("./auditLog.model")(sequelize, Sequelize);
db.vehicleUser  = require("./vehicle_details/vehicleUser.model")(sequelize,Sequelize)
db.vehcileRunningPolicy  = require("./vehicle_details/vehcileRunningPolicy.model")(sequelize,Sequelize)
// vehiclePreviousPolicy merged into vehcileRunningPolicy (is_current flag); table dropped at boot.
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

db.mediclaimProduct.hasMany(db.runningPolicyMediclaim, { foreignKey: 'mediclaim_product_id' });
db.runningPolicyMediclaim.belongsTo(db.mediclaimProduct, { foreignKey: 'mediclaim_product_id' });

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

// Loan per-stage tables (login/sanction/disbursement/document/query/cancel/
// property/partPayment) were merged into the unified loan_stage table — their
// models + associations were removed. See db.loanStage above.

// Unified loan-stage table (merge of the 10 per-stage tables into one). Loan
// stages are cumulative (a disbursed loan keeps its login+sanction+disbursement
// data), so this is one row per stage-type per loan (part-payments = many rows),
// read via the `stages` association and grouped by `stage` in the controller.
db.loanUser.hasMany(db.loanStage, { foreignKey: 'laon_id', as: 'stages' });
db.loanStage.belongsTo(db.loanUser, { foreignKey: 'laon_id' });
db.user.hasMany(db.loanStage, { foreignKey: 'updated_by' });
db.loanStage.belongsTo(db.user, { foreignKey: 'updated_by' });
db.codeDetail.hasMany(db.loanStage, { foreignKey: 'code_id' });
db.loanStage.belongsTo(db.codeDetail, { foreignKey: 'code_id' });




db.medicliamuser.hasMany(db.runningPolicyMediclaim, { foreignKey: 'mediclaim_id' });
db.runningPolicyMediclaim.belongsTo(db.medicliamuser, { foreignKey: 'mediclaim_id' });

// Unified policy table (merge): current policy = is_current true, history = false.
db.medicliamuser.hasOne(db.runningPolicyMediclaim, { foreignKey: 'mediclaim_id', as: 'runningPolicy', scope: { is_current: true } });
db.medicliamuser.hasMany(db.runningPolicyMediclaim, { foreignKey: 'mediclaim_id', as: 'previousPolicies', scope: { is_current: false } });

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

// Unified policy table (runningpolicies_vehicle): current = is_current true,
// history (previousPolicies) = same table with is_current false. The old
// previouspolicies_vehicle table is dropped at boot (bootstrap/dropLegacyTables).
db.vehicleUser.hasOne(db.vehcileRunningPolicy, { foreignKey: 'vehicle_user_id', as: 'runningPolicy', scope: { is_current: true } });
db.vehcileRunningPolicy.belongsTo(db.vehicleUser, { foreignKey: 'vehicle_user_id' });

db.vehicleUser.hasMany(db.vehcileRunningPolicy, { foreignKey: 'vehicle_user_id', as: 'previousPolicies', scope: { is_current: false } });

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