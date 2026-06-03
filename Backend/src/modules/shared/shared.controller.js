/**
 * shared controller — extracted from the legacy user.controller monolith.
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

exports.downloadFile = async (req, res) => {
    try {
        // Guard against path traversal: strip any directory components from the
        // requested name, then confirm the resolved path stays inside uploads.
        const uploadsDir = path.resolve(CTRL_DIR, "../../uploads");
        const safeName = path.basename(req.params.filename || "");
        const filePath = path.join(uploadsDir, safeName);

        if (!safeName || !filePath.startsWith(uploadsDir + path.sep)) {
            return res.status(400).send({ message: "Invalid filename", status: false });
        }

        const filename = safeName;
        console.log('📥 [DOWNLOAD] Request for file:', filename);

        // Check if the file exists (use fsSync for synchronous check)
        if (fsSync.existsSync(filePath)) {
            console.log('📥 [DOWNLOAD] File found, sending download...');
            // Set the headers to force download
            res.download(filePath, filename, (err) => {
                if (err) {
                    console.error('📥 [DOWNLOAD] Error downloading file:', err);
                    res.status(500).send('Error downloading file');
                }
            });
        } else {
            console.log('📥 [DOWNLOAD] File not found at path:', filePath);
            res.status(404).send('File not found');
        }
    } catch (error) {
        console.error('📥 [DOWNLOAD] Error:', error);
        res.status(500).send({
            message: "Error downloading file",
            error: error.message,
            status: false,
        });
    }
};

exports.addCodeDetails = async (req, res) => {
    console.log(req.body);

    let user = await codeDetail.findOne({
        where: {
            code_name: req.body.code_name,
        },
    });
    if (user) {
        return res
            .status(400)
            .send({ message: "Code_name already in use", status: false });
    }
    codeDetail.create({
        code_name: req.body.code_name,
    })
        .then(async (articles) => {
            return res.status(200).send({
                message: "code successfully added!.",
                status: true,
                data: articles,
            });
        })
        .catch((e) =>
            res.status(400).send({ message: "error.", status: false })
        );
};


exports.getAllCodes = async (req, res) => {
    codeDetail.findAll({
        raw: true,
        // attributes:[['id','key'],['name','value']]
    })
        .then((articles) => {
            res
                .status(200)
                .send({ message: "code get success", data: articles, status: true });
        })
        .catch((e) => {
            res.status(400).send({ message: "code error", status: false });
            console.log(e);
        });
};


exports.addCompanyTypeDetails = async (req, res) => {
    console.log(req.body);

    let user = await companyType.findOne({
        where: {
            company_name: req.body.company_name,
        },
    });
    if (user) {
        return res
            .status(400)
            .send({ message: "Code_name already in use", status: false });
    }
    companyType.create({
        company_name: req.body.company_name,
    })
        .then(async (articles) => {
            return res.status(200).send({
                message: "code successfully added!.",
                status: true,
                data: articles,
            });
        })
        .catch((e) =>
            res.status(400).send({ message: "error.", status: false })
        );
};


exports.getAllCompanyTypes = async (req, res) => {
    companyType.findAll({
        raw: true,
        // attributes:[['id','key'],['name','value']]
    })
        .then((articles) => {
            res
                .status(200)
                .send({ message: "code get success", data: articles, status: true });
        })
        .catch((e) => {
            res.status(400).send({ message: "code error", status: false });
            console.log(e);
        });
};


exports.getAllLoanConfiguration = async (req, res) => {
    loanConfiguration.findAll({
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


exports.addPolicyplanDetails = async (req, res) => {
    console.log(req.body);

    let user = await db.policyPlan.findOne({
        where: {
            policy_name: req.body.policy_name,
        },
    });
    if (user) {
        return res
            .status(400)
            .send({ message: "Code_name already in use", status: false });
    }
    db.policyPlan.create({
        policy_name: req.body.policy_name,
    })
        .then(async (articles) => {
            return res.status(200).send({
                message: "code successfully added!.",
                status: true,
                data: articles,
            });
        })
        .catch((e) =>
            res.status(400).send({ message: "error.", status: false })
        );
};


exports.addPolicyTypeDetails = async (req, res) => {
    console.log(req.body);

    let user = await db.policyType.findOne({
        where: {
            policy_type_name: req.body.policy_type_name,
        },
    });
    if (user) {
        return res
            .status(400)
            .send({ message: "Code_name already in use", status: false });
    }
    db.policyType.create({
        policy_type_name: req.body.policy_type_name,
    })
        .then(async (articles) => {
            return res.status(200).send({
                message: "code successfully added!.",
                status: true,
                data: articles,
            });
        })
        .catch((e) =>
            res.status(400).send({ message: "error.", status: false })
        );
};


exports.getAllPolicyPlans = async (req, res) => {
    policyPlan.findAll({
        raw: true,
        // attributes:[['id','key'],['name','value']]
    })
        .then((articles) => {
            res
                .status(200)
                .send({ message: "code get success", data: articles, status: true });
        })
        .catch((e) => {
            res.status(400).send({ message: "code error", status: false });
            console.log(e);
        });
};


exports.getAllPolicyTypes = async (req, res) => {
    policyType.findAll({
        raw: true,
        // attributes:[['id','key'],['name','value']]
    })
        .then((articles) => {
            res
                .status(200)
                .send({ message: "code get success", data: articles, status: true });
        })
        .catch((e) => {
            res.status(400).send({ message: "code error", status: false });
            console.log(e);
        });
};


exports.getAllVehicles = async (req, res) => {
    vehicles.findAll({
        raw: true,
        // attributes:[['id','key'],['name','value']]
    })
        .then((articles) => {
            res
                .status(200)
                .send({ message: "code get success", data: articles, status: true });
        })
        .catch((e) => {
            res.status(400).send({ message: "code error", status: false });
            console.log(e);
        });
};


exports.getAllReferences = async (req, res) => {
    references.findAll({
        raw: true,
        // attributes:[['id','key'],['name','value']]
    })
        .then((articles) => {
            res
                .status(200)
                .send({ message: "code get success", data: articles, status: true });
        })
        .catch((e) => {
            res.status(400).send({ message: "code error", status: false });
            console.log(e);
        });
};


exports.getAllDocuments = async (req, res) => {
    documents.findAll({
        raw: true,
        // attributes:[['id','key'],['name','value']]
    })
        .then((articles) => {
            res
                .status(200)
                .send({ message: "code get success", data: articles, status: true });
        })
        .catch((e) => {
            res.status(400).send({ message: "code error", status: false });
            console.log(e);
        });
};


exports.getAllUnitCatergory = async (req, res) => {
    UnitCategoryList.findAll({
        raw: true,
        // attributes:[['id','key'],['name','value']]
    })
        .then((articles) => {
            res.status(200).send({
                message: "catergory unit get success",
                data: articles,
                status: true,
            });
        })
        .catch((e) => {
            res.status(400).send({ message: "role error", status: false });
            console.log(e);
        });
};


    exports.addVehicleDetails = async (req, res) => {
        console.log(req.body);
    
        let user = await vehicles.findOne({
            where: {
                vehicle_name: req.body.vehicle_name,
            },
        });
        if (user) {
            return res
                .status(400)
                .send({ message: "Code_name already in use", status: false });
        }
        vehicles.create({
            vehicle_name: req.body.vehicle_name,
        })
            .then(async (articles) => {
                return res.status(200).send({
                    message: "code successfully added!.",
                    status: true,
                    data: articles,
                });
            })
            .catch((e) =>
                res.status(400).send({ message: "error.", status: false })
            );
};



