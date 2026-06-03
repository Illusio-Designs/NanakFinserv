/**
 * inquiry controller — extracted from the legacy user.controller monolith.
 * Logic is preserved verbatim; shared dependencies come from shared/context.
 */
const {
  Blog,
  BuilderUser,
  BuildingManager,
  CTRL_DIR,
  CancelLoan,
  Category,
  Disburse,
  DisbursementLoan,
  DocumentSelectedLoan,
  EmployeeMediclaim,
  FamilyMember,
  Inqueryuser,
  LifeInsurance,
  LifeInsuranceDocument,
  LoginLoan,
  Mediclaim,
  MediclaimCompany,
  MediclaimProduct,
  Op,
  PartPaymentLoan,
  PreviousPolicies,
  QueryLoan,
  RunningPolicies,
  SanctionLoan,
  Sequelize,
  Unit,
  UnitCategoryDetail,
  UnitCategoryList,
  User,
  Wing,
  authConfig,
  bcrypt,
  builderConsumer,
  codeDetail,
  companyType,
  consumerRoleMapping,
  createNotification,
  db,
  documents,
  dotenvParseVariables,
  env,
  floor,
  fs,
  fsExtra,
  fsSync,
  hasMeaningfulPreviousPolicyData,
  jwt,
  loanConfiguration,
  loanUser,
  moment,
  nodemailer,
  path,
  policyPlan,
  policyType,
  property,
  references,
  unit_category_list,
  userCatergory,
  uuidv4,
  vehcileRunningPolicy,
  vehiclePreviousPolicy,
  vehicleUser,
  vehicle_document,
  vehicles
} = require("../shared/context");
const inquiryService = require("./inquiry.service");
const logger = require("../../config/logger");

exports.addInquieryUser = async (req, res) => {
    try {
        const userData = await inquiryService.create(req.body || {});
        return res.status(200).send({
            message: "user successfully added!.",
            status: true,
            userData,
        });
    } catch (e) {
        logger.error({ err: e }, "addInquieryUser failed");
        return res.status(400).send({ message: "error.", status: false });
    }
};


exports.getAllInqueryUser = async (req, res) => {
    try {
        const data = await inquiryService.getAll();
        res.status(200).send({ message: "inquery user get success", data, status: true });
    } catch (e) {
        logger.error({ err: e }, "getAllInqueryUser failed");
        res.status(400).send({ message: "inquery user error", status: false });
    }
};

