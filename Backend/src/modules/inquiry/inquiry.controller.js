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

exports.addInquieryUser = (req, res) => {
    console.log(req.body);
    Inqueryuser.create({
        user_name: req.body.username,
        email: req.body.email,
        mobile_no: req.body.phone_number,
        services: req.body.service,
    })
        .then(async (articles) => {
            return res.status(200).send({
                message: "user successfully added!.",
                status: true,
                userData: articles,
            });
        })
        .catch((e) =>
            res.status(400).send({ message: "error.", status: false })
        );
};


exports.getAllInqueryUser = async (req, res) => {
    Inqueryuser.findAll({
        raw: true,
    })
        .then((articles) => {
            res
                .status(200)
                .send({ message: "inquery user get success", data: articles, status: true });
        })
        .catch((e) => {
            res.status(400).send({ message: "inquery user error", status: false });
            console.log(e);
        });
};

