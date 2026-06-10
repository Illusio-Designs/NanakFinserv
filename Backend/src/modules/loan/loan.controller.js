const { ROLE_IDS, CATEGORY_IDS, MANAGER_ROLE_IDS } = require("../../config/ids");
/**
 * loan controller — extracted from the legacy user.controller monolith.
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
const loanService = require("./loan.service");
const logger = require("../../config/logger");

exports.getAllLoanUser = async (req, res) => {
    // Set cache control headers to prevent 304 responses
    res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    });
    
    logger.debug('🔍 [LOAN API] User making request:', req.user);
    logger.debug('🔍 [LOAN API] User Role:', req.user.Role);
    logger.debug('🔍 [LOAN API] User ID:', req.user.id);
    
    let whereObj = {};
    let whereObjLoan = {};

    // For users with loan category access, show all loan consumers
    // Only apply role-based filtering if the user doesn't have loan category access
    if (req.user.Role === ROLE_IDS.STAFF && !req.user.categoryIds?.includes(CATEGORY_IDS.LOAN)) {
        whereObj.user_role_id = req.user.id;
        logger.debug('🔍 [LOAN API] Setting user_role_id filter:', req.user.id);
    }
    if (req.user.Role === ROLE_IDS.STAFF && !req.user.categoryIds?.includes(CATEGORY_IDS.LOAN)) {
        whereObjLoan.role_id = req.user.id;
        logger.debug('🔍 [LOAN API] Setting role_id filter:', req.user.id);
    } else {
        logger.debug('🔍 [LOAN API] User has loan category access - showing all loan consumers');
    }
    whereObj.category_id = 2;
    // Remove status filter to show all loan consumers
    // whereObjLoan.status = "notAssign";
    
    // Get all building manager user IDs to exclude them
    const buildingManagerUsers = await User.findAll({
        where: { role_id: ROLE_IDS.BUILDING_MANAGER },
        attributes: ['user_id'],
        raw: true
    });
    const buildingManagerUserIds = buildingManagerUsers.map(bm => bm.user_id);
    logger.debug('🔍 [LOAN API] Building manager user IDs to exclude:', buildingManagerUserIds);
    
    // Exclude building managers from loan users
    if (buildingManagerUserIds.length > 0) {
        whereObjLoan.user_id = {
            [Op.notIn]: buildingManagerUserIds
        };
    }
    
    // Only show loan users with status "notAssign"
    whereObjLoan.status = "notAssign";
    
    logger.debug('🔍 [LOAN API] Final whereObj:', whereObj);
    logger.debug('🔍 [LOAN API] Final whereObjLoan:', whereObjLoan);
    
    // Debug: Check what loan users exist in the database
    const allLoanUsers = await loanUser.findAll({
        raw: true,
        attributes: ["user_id", "role_id", "status"],
        limit: 10
    });
    logger.debug('🔍 [LOAN API] All loan users in database (first 10):', allLoanUsers);

    let findUserList = await loanUser.findAll({
        where: whereObjLoan,
        raw: true,
        attributes: ["user_id"],
    });
    logger.debug('🔍 [LOAN API] Found loan users:', findUserList);
    logger.debug('🔍 [LOAN API] Number of loan users found:', findUserList.length);
    
    let userList = [];
    await findUserList.map((item) => {
        userList.push(item.user_id);
    });
    logger.debug('🔍 [LOAN API] User list for consumerRoleMapping:', userList);
    whereObj.user_consumer_id = {
        [Op.in]: userList,
    };
    await consumerRoleMapping
        .findAll({
            where: whereObj,
            attributes: ["user_role_id", "category_id", "user_consumer_id"],
            include: [
                {
                    model: User,
                    as: "userRoles",
                    required: false,
                    attributes: ["username", "email", "mobileNumber", "referenceName"],
                },
                {
                    model: User,
                    as: "userConsumers",
                    required: false,
                    attributes: ["username", "email", "mobileNumber", "referenceName", "role_id"],
                },
            ],
            raw: true,
        })
        .then(async (articles) => {
            // Filter out building managers (role_id = 7) from the results
            const filteredArticles = articles.filter(article => {
                // Exclude if consumer user is a building manager
                const consumerRoleId = article['userConsumers.role_id'];
                if (consumerRoleId === 7) {
                    logger.debug('🔍 [LOAN API] Filtering out building manager consumer:', article.user_consumer_id);
                    return false;
                }
                return true;
            });

            // Fetch loan user property information for each consumer
            const enrichedArticles = await Promise.all(
                filteredArticles.map(async (article) => {
                    // Find loan user record for this consumer
                    const loanUserData = await loanUser.findOne({
                        where: {
                            user_id: article.user_consumer_id,
                            role_id: article.user_role_id,
                            status: "notAssign" // Only include notAssign status
                        },
                        attributes: [
                            "non_builder_name",
                            "non_builder_property_name",
                            "sq_ft",
                            "deed_amount",
                            "address",
                            "laon_id",
                            "status"
                        ],
                        raw: true
                    });

                    // Skip if loan user does not have notAssign status (additional safety check)
                    if (loanUserData && loanUserData.status !== 'notAssign') {
                        return null;
                    }

                    // Merge property information into the article
                    return {
                        ...article,
                        non_builder_name: loanUserData?.non_builder_name || null,
                        non_builder_property_name: loanUserData?.non_builder_property_name || null,
                        sq_ft: loanUserData?.sq_ft || null,
                        deed_amount: loanUserData?.deed_amount || null,
                        address: loanUserData?.address || null,
                        laon_id: loanUserData?.laon_id || null,
                        loan_status: loanUserData?.status || null
                    };
                })
            );

            // Filter out any null entries and only include records with notAssign status
            const finalArticles = enrichedArticles.filter(article => 
                article !== null && article.loan_status === 'notAssign'
            );

            logger.debug('🔍 [LOAN API] Enriched articles with property info (building managers and notInterested excluded):', finalArticles);
            res.status(200).send({
                message: "catergory unit get success",
                data: finalArticles,
                status: true,
            });
        })
        .catch((e) => {
            res.status(400).send({ message: "role error", status: false });
            logger.debug(e);
        });
};


exports.getAllLoanUserInterested = async (req, res) => {
    let whereObj = {};
    let whereObjLoan = {};
    const startDate = req.body.startDate
        ? new Date(new Date(req.body.startDate).setHours(0, 0, 0, 0))
        : new Date(new Date().setDate(1)); // Default to the first day of the current month at 00:00:00

    const endDate = req.body.endDate
        ? new Date(new Date(req.body.endDate).setHours(23, 59, 59, 999))
        : new Date(new Date().setDate(1)); // Default to today at 23:59:59
    
    // whereObjLoan.createdAt = { [Op.between]: [startDate, endDate] }
    // For Role 4, don't filter by user_role_id - show all loan consumers they have access to
    // The consumerRoleMapping will be checked, but if there are no mappings, show all
    // if (req.user.Role === ROLE_IDS.STAFF) {
    //     whereObj.user_role_id = req.user.id;
    // }
    whereObj.category_id = 2;
    whereObjLoan.status = {
        [Op.notIn]: ["notAssign", "notInterested"],
    };

    let findUserList = await loanUser.findAll({
        where: whereObjLoan,
        include: [
            {
                model: LoginLoan,
            },
            {
                model: property,
            },
            {
                model: DocumentSelectedLoan,
            },
            {
                model: QueryLoan,
            },
            {
                model: CancelLoan,
            },
            {
                model: SanctionLoan,
            },
            {
                model: DisbursementLoan,
            }
        ],
        raw: true,
    });
    
    let userList = [];
    await findUserList.map((item) => {
        userList.push(item.user_id);
    });
    whereObj.user_consumer_id = {
        [Op.in]: userList,
    };
    
    const consumerMappings = await consumerRoleMapping
        .findAll({
            where: whereObj,
            attributes: ["user_role_id", "category_id", "user_consumer_id"],
            include: [
                {
                    model: User,
                    as: "userRoles",
                    required: false,
                    attributes: ["username", "email", "mobileNumber", "referenceName"],
                },
                {
                    model: User,
                    as: "userConsumers",
                    required: false,
                    attributes: ["username", "email", "mobileNumber", "referenceName"],
                },
            ],
            raw: true,
        })
        .then(async (articles) => {
            let responseData = await Promise.all(
                articles.map(async (article) => {
                    const initialData = findUserList.find(user => user.user_id === article.user_consumer_id);

                    if (initialData) {
                        let userData = {};
                        const status = initialData.status;

                        const partPayments = await PartPaymentLoan.findAll({
                            where: { laon_id: initialData.laon_id },
                            attributes: ['part_id', 'part_number', 'part_amount', 'part_date'],
                        });

                        // Map data based on the status
                        if (initialData && initialData['documentSelected.laon_id']) {
                            userData.document_details = {
                                loan_type: initialData['documentSelected.loan_type'],
                                loan_type_name: initialData['documentSelected.loan_type_name'],
                                remarks_docs: initialData['documentSelected.remarks_docs'],
                            };
                        }
                        if (initialData && initialData['query.laon_id']) {
                            userData.query_details = {
                                remarks: initialData['query.remarks'],
                            };
                        }
                        if (initialData && initialData['cancel.laon_id']) {
                            userData.cancel_details = {
                                remarks_cancel: initialData['cancel.remarks_cancel'],
                            };
                        }
                        if (initialData && initialData['sanction.laon_id']) {
                            // Only use old sanction table data if no remarks field exists
                            if (!initialData.remarks) {
                            userData.sanction_details = {
                                amount: initialData['sanction.amount'],
                                rate: initialData['sanction.rate'],
                                tenure: initialData['sanction.tenure'],
                                sanctionDate: initialData['sanction.sanctionDate'],
                            };
                            }
                        }
                        if (initialData && initialData['login.laon_id']) {
                            userData.login_details = {
                                loanAmount: initialData['login.loanAmount'],
                                loanDate: initialData['login.loanDate'],
                                loanAccountNumber: initialData['login.loanAccountNumber'],
                                bankName: initialData['login.bankName'],
                                product: initialData['login.product'],
                                smName: initialData['login.smName'],
                                amName: initialData['login.amName'],
                                remarks_loan: initialData['login.remarks_loan'],
                                bankCode: initialData['login.bankCode'],
                                dateOfBirth: initialData['login.dateOfBirth'],
                                code: initialData['login.code_id'],
                            };
                        }
                        if (initialData && initialData['disbursetb.laon_id']) {
                            userData.disbursement_details = {
                                disbursementAmount: initialData['disbursetb.disbursementAmount'],
                                disbursementRate: initialData['disbursetb.disbursementRate'],
                                insurance: initialData['disbursetb.insurance'],
                                fileNumber: initialData['disbursetb.fileNumber'],
                                disbursementDate: initialData['disbursetb.disbursementDate'],
                                remark_dis: initialData['disbursetb.remark_dis'],
                                insuranceBankName: initialData['disbursetb.insuranceBankName'],
                                insuranceAmount: initialData['disbursetb.insuranceAmount'],
                                insuranceType: initialData['disbursetb.insuranceType'],
                            };
                        }

                        const builderConsumer = await db.builderConsumer.findOne({
                            where: { user_id: initialData.user_id },
                            attributes: ['builderConsumerId', 'sqFeet', 'srNo', 'remarks', 'office_no', 'category_id'],
                            include: [
                                {
                                    model: BuilderUser,
                                    required: false,
                                    attributes: ['company_name'],
                                    include: [{ model: Unit, required: false, attributes: ['unit_name', 'address'], }]
                                },
                                {
                                    model: floor,
                                    required: false,
                                    attributes: ['floorNumber', 'unit_id'],
                                },
                                {
                                    model: Wing,
                                    required: false,
                                    attributes: ['wing_name', 'unit_id'],
                                }
                            ]
                        });

                        // Add builder consumer and related details
                        if (builderConsumer) {
                            userData.builder_consumer_details = builderConsumer;
                        } else {
                            if (initialData && initialData['propertydetail.laon_id']) {
                                userData.property_details = {
                                    address: initialData['propertydetail.address'],
                                    deedAmount: initialData['propertydetail.deedAmount'],
                                    sqFeet: initialData['propertydetail.sqFeet'],
                                };
                            }
                        }

                        if (partPayments && partPayments.length > 0) {
                            userData.part_details = {
                                parts: partPayments.map(part => ({
                                    part_id: part.part_id,
                                    part_number: part.part_number,
                                    part_amount: part.part_amount,
                                    part_date: part.part_date,
                                }))
                            }
                        }

                        // Parse remarks field to extract all status details if they exist
                        if (initialData.remarks) {
                            try {
                                const parsedRemarks = JSON.parse(initialData.remarks);
                                logger.debug('🔍 [DEBUG] Parsing remarks for user:', initialData.user_consumer_id, 'Status:', status);
                                logger.debug('🔍 [DEBUG] Parsed remarks:', parsedRemarks);
                                
                                // Extract data for all status types
                                if (parsedRemarks.sanction_details) { 
                                    userData.sanction_details = { ...userData.sanction_details, ...parsedRemarks.sanction_details }; 
                                }
                                if (parsedRemarks.login_details) { 
                                    userData.login_details = { ...userData.login_details, ...parsedRemarks.login_details }; 
                                }
                                if (parsedRemarks.pickup_details) { 
                                    userData.pickup_details = parsedRemarks.pickup_details; 
                                }
                                if (parsedRemarks.query_details) { 
                                    userData.query_details = { ...userData.query_details, ...parsedRemarks.query_details }; 
                                }
                                if (parsedRemarks.cancel_details) { 
                                    userData.cancel_details = { ...userData.cancel_details, ...parsedRemarks.cancel_details }; 
                                }
                                if (parsedRemarks.disbursement_details) { 
                                    logger.debug('🔍 [DEBUG] Found disbursement_details in remarks for user', initialData.user_id, ':', parsedRemarks.disbursement_details);
                                    userData.disbursement_details = { ...userData.disbursement_details, ...parsedRemarks.disbursement_details }; 
                                    logger.debug('🔍 [DEBUG] Updated userData.disbursement_details for user', initialData.user_id, ':', userData.disbursement_details);
                                }
                                if (parsedRemarks.part_details) { 
                                    userData.part_details = { ...userData.part_details, ...parsedRemarks.part_details }; 
                                }
                                if (parsedRemarks.completed_details) { 
                                    userData.completed_details = parsedRemarks.completed_details; 
                                }
                                if (parsedRemarks.document_details) { 
                                    userData.document_details = { ...userData.document_details, ...parsedRemarks.document_details }; 
                                }
                                if (parsedRemarks.property_details) { 
                                    userData.property_details = parsedRemarks.property_details; 
                                }
                                
                                logger.debug('🔍 [DEBUG] Final userData after remarks parsing:', Object.keys(userData));
                            } catch (error) {
                                logger.debug('❌ Error parsing remarks JSON:', error);
                                logger.debug('❌ Raw remarks data:', initialData.remarks);
                            }
                        }

                        // Add additional details and status to the response
                        userData.status = status;
                        userData.remarks = initialData.remarks || '';
                        userData.createdAt = initialData.createdAt;
                        userData.updatedAt = initialData.updatedAt;
                        userData.laon_id = initialData.laon_id;
                        userData.user_consumer_id = initialData.user_consumer_id;
                        
                        // Add user consumer details including referenceName
                        if (article['userConsumers.username']) {
                            userData.username = article['userConsumers.username'];
                            userData.email = article['userConsumers.email'];
                            userData.mobileNumber = article['userConsumers.mobileNumber'];
                            userData.referenceName = article['userConsumers.referenceName'];
                        }

                        logger.debug('🔍 [DEBUG] Final userData for user', initialData.user_id, ':', {
                            status: userData.status,
                            hasSanctionDetails: !!userData.sanction_details,
                            sanctionDetailsKeys: userData.sanction_details ? Object.keys(userData.sanction_details) : [],
                            hasDisbursementDetails: !!userData.disbursement_details,
                            disbursementDetailsKeys: userData.disbursement_details ? Object.keys(userData.disbursement_details) : [],
                            remarksLength: userData.remarks ? userData.remarks.length : 0
                        });

                        // Merge userData with the article
                        const finalResponse = {
                            ...article,
                            details: userData,
                            // Ensure referenceName is available at the top level for frontend access
                            'userConsumers.referenceName': article['userConsumers.referenceName'] || article['userRoles.referenceName'],
                            'userConsumers.username': article['userConsumers.username'] || article['userRoles.username'],
                            'userConsumers.email': article['userConsumers.email'] || article['userRoles.email'],
                            'userConsumers.mobileNumber': article['userConsumers.mobileNumber'] || article['userRoles.mobileNumber'],
                        };
                        
                        logger.debug('🔍 [DEBUG] Final response structure for user', initialData.user_id, ':', {
                            hasDetails: !!finalResponse.details,
                            detailsKeys: finalResponse.details ? Object.keys(finalResponse.details) : [],
                            hasSanctionDetails: finalResponse.details?.sanction_details ? true : false,
                            hasDisbursementDetails: finalResponse.details?.disbursement_details ? true : false,
                            disbursementDetailsKeys: finalResponse.details?.disbursement_details ? Object.keys(finalResponse.details.disbursement_details) : [],
                            sanctionDetailsSample: finalResponse.details?.sanction_details ? {
                                loanAmount: finalResponse.details.sanction_details.loanAmount,
                                bankName: finalResponse.details.sanction_details.bankName,
                                product: finalResponse.details.sanction_details.product
                            } : null,
                            disbursementDetailsSample: finalResponse.details?.disbursement_details ? {
                                disbursementAmount: finalResponse.details.disbursement_details.disbursementAmount,
                                disbursementRate: finalResponse.details.disbursement_details.disbursementRate,
                                insurance: finalResponse.details.disbursement_details.insurance
                            } : null
                        });
                        
                        return finalResponse;
                    } else {
                        return article;
                    }
                })
            );

            res.status(200).send({
                message: "Category unit get success",
                data: responseData,
                status: true,
            });
        })
        .catch((e) => {
            res.status(400).send({ message: "role error", status: false });
            logger.debug(e);
        });
};


exports.getAllLoanUserDetail = async (req, res) => {
    let whereObj = {};
    let whereObjLoan = {};

    whereObjLoan.laon_id = req.body.laon_id;

    let findUserList = await loanUser.findAll({
        where: whereObjLoan,
        include: [
            {
                model: LoginLoan, include: [{ model: codeDetail }]
            },
            {
                model: DocumentSelectedLoan,
            },
            {
                model: property,
            },
            {
                model: QueryLoan,
            },
            {
                model: CancelLoan,
            },
            {
                model: SanctionLoan,
            },
            {
                model: DisbursementLoan,
            }
        ],
        raw: true,
    });
    let userList = [];
    await findUserList.map((item) => {
        userList.push(item.user_id);
    });
    whereObj.user_consumer_id = {
        [Op.in]: userList,
    };
    await consumerRoleMapping
        .findAll({
            where: whereObj,
            attributes: ["user_role_id", "category_id", "user_consumer_id"],
            include: [
                {
                    model: User,
                    as: "userRoles",
                    required: false,
                    attributes: ["username", "email", "mobileNumber", "referenceName"],
                },
                {
                    model: User,
                    as: "userConsumers",
                    required: false,
                    attributes: ["username", "email", "mobileNumber", "referenceName"],
                },
            ],
            raw: true,
        })
        .then(async (articles) => {
            let responseData = await Promise.all(
                articles.map(async (article) => {
                    const initialData = findUserList.find(user => user.user_id === article.user_consumer_id);

                    if (initialData) {
                        let userData = {};
                        const status = initialData.status;

                        const partPayments = await PartPaymentLoan.findAll({
                            where: { laon_id: initialData.laon_id },
                        });

                        // Map data based on the status
                        if (initialData && initialData['documentSelected.laon_id']) {
                            userData.document_details = {
                                loan_type: initialData['documentSelected.loan_type'],
                                loan_type_name: initialData['documentSelected.loan_type_name'],
                                remarks_docs: initialData['documentSelected.remarks_docs'],
                                createdAt: initialData['documentSelected.createdAt'],
                                updatedAt: initialData['documentSelected.updatedAt'],
                            };
                        }
                        if (initialData && initialData['query.laon_id']) {
                            userData.query_details = {
                                remarks: initialData['query.remarks'],
                                createdAt: initialData['query.createdAt'],
                                updatedAt: initialData['query.updatedAt'],
                            };
                        }
                        if (initialData && initialData['cancel.laon_id']) {
                            userData.cancel_details = {
                                remarks_cancel: initialData['cancel.remarks_cancel'],
                                createdAt: initialData['cancel.createdAt'],
                                updatedAt: initialData['cancel.updatedAt'],
                            };
                        }
                        if (initialData && initialData['sanction.laon_id']) {
                            userData.sanction_details = {
                                amount: initialData['sanction.amount'],
                                rate: initialData['sanction.rate'],
                                tenure: initialData['sanction.tenure'],
                                sanctionDate: initialData['sanction.sanctionDate'],
                                createdAt: initialData['sanction.createdAt'],
                                updatedAt: initialData['sanction.updatedAt'],
                            };
                        }
                        if (initialData && initialData['login.laon_id']) {
                            userData.login_details = {
                                loanAmount: initialData['login.loanAmount'],
                                loanDate: initialData['login.loanDate'],
                                loanAccountNumber: initialData['login.loanAccountNumber'],
                                bankName: initialData['login.bankName'],
                                product: initialData['login.product'],
                                smName: initialData['login.smName'],
                                amName: initialData['login.amName'],
                                remarks_loan: initialData['login.remarks_loan'],
                                bankCode: initialData['login.bankCode'],
                                dateOfBirth: initialData['login.dateOfBirth'],
                                code: initialData['login.code_id'],
                                code_name: initialData['login.codedetail.code_name'],
                                createdAt: initialData['login.createdAt'],
                                updatedAt: initialData['login.updatedAt'],
                            };
                        }
                        if (initialData && initialData['disbursetb.laon_id']) {
                            userData.disbursement_details = {
                                disbursementAmount: initialData['disbursetb.disbursementAmount'],
                                disbursementRate: initialData['disbursetb.disbursementRate'],
                                insurance: initialData['disbursetb.insurance'],
                                fileNumber: initialData['disbursetb.fileNumber'],
                                disbursementDate: initialData['disbursetb.disbursementDate'],
                                remark_dis: initialData['disbursetb.remark_dis'],
                                insuranceBankName: initialData['disbursetb.insuranceBankName'],
                                insuranceAmount: initialData['disbursetb.insuranceAmount'],
                                insuranceType: initialData['disbursetb.insuranceType'],
                                createdAt: initialData['disbursetb.createdAt'],
                                updatedAt: initialData['disbursetb.updatedAt'],
                            };
                        }

                        if (partPayments && partPayments.length > 0) {
                            userData.part_details = {
                                parts: partPayments.map(part => ({
                                    part_id: part.part_id,
                                    part_number: part.part_number,
                                    part_amount: part.part_amount,
                                    part_date: part.part_date,
                                    createdAt: part.createdAt,
                                    updatedAt: part.updatedAt,
                                }))
                            }
                        }

                        const builderConsumer = await db.builderConsumer.findOne({
                            where: { user_id: initialData.user_id },
                            attributes: ['builderConsumerId', 'sqFeet', 'srNo', 'remarks', 'office_no', 'category_id'],
                            include: [
                                {
                                    model: BuilderUser,
                                    required: false,
                                    attributes: ['company_name'],
                                    include: [{ model: Unit, required: false, attributes: ['unit_name', 'address'], }]
                                },
                                {
                                    model: floor,
                                    required: false,
                                    attributes: ['floorNumber', 'unit_id'],
                                },
                                {
                                    model: Wing,
                                    required: false,
                                    attributes: ['wing_name', 'unit_id'],
                                }
                            ]
                        });

                        // Add builder consumer and related details
                        if (builderConsumer) {
                            userData.builder_consumer_details = builderConsumer;
                        } else {
                            if (initialData && initialData['propertydetail.laon_id']) {
                                userData.property_details = {
                                    address: initialData['propertydetail.address'],
                                    deedAmount: initialData['propertydetail.deedAmount'],
                                    sqFeet: initialData['propertydetail.sqFeet'],
                                };
                            }
                        }

                        // Parse remarks field to extract sanction details if they exist
                        if (initialData.remarks) {
                            try {
                                const parsedRemarks = JSON.parse(initialData.remarks);
                                if (parsedRemarks.sanction_details) {
                                    userData.sanction_details = parsedRemarks.sanction_details;
                                }
                            } catch (error) {
                                logger.debug('Error parsing remarks JSON:', error);
                            }
                        }

                        // Add additional details and status to the response
                        userData.status = status;
                        userData.remarks = initialData.remarks || '';
                        userData.createdAt = initialData.createdAt;
                        userData.updatedAt = initialData.updatedAt;
                        userData.laon_id = initialData.laon_id;
                        userData.user_consumer_id = initialData.user_consumer_id;

                        // Merge userData with the article
                        return {
                            ...article,
                            details: userData,
                        };
                    } else {
                        return article;
                    }
                })
            );

            res.status(200).send({
                message: "Category unit get success",
                data: responseData || [],
                status: true,
            });
        })
        .catch((e) => {
            res.status(400).send({ message: "role error", status: false });
            logger.debug(e);
        });
};

exports.getAllLoanUserNotInterested = async (req, res) => {
    let whereObj = {};
    let whereObjLoan = {};

    if (req.user.Role === ROLE_IDS.STAFF) {
        whereObj.user_role_id = req.user.id;
    }
    // Set role_id filter for Not Interested page
    if (req.user.Role === ROLE_IDS.STAFF) {
        whereObjLoan.role_id = req.user.id;
        logger.debug('🔍 [BACKEND] Setting role_id filter to:', req.user.id);
    }
    whereObj.category_id = 2;
    whereObjLoan.status = "notInterested";

    // Debug: Check what statuses exist in the database
    logger.debug('🔍 [BACKEND] Checking for notInterested records...');
    const allStatuses = await loanUser.findAll({
        attributes: ['status'],
        group: ['status'],
        raw: true
    });
    logger.debug('🔍 [BACKEND] All statuses in database:', allStatuses.map(s => s.status));
    
    // Check for variations of notInterested
    const notInterestedVariations = await loanUser.findAll({
        where: {
            status: {
                [Op.like]: '%not%'
            }
        },
        attributes: ['status'],
        group: ['status'],
        raw: true
    });
    logger.debug('🔍 [BACKEND] Statuses containing "not":', notInterestedVariations.map(s => s.status));
    
    // Debug: Check the whereObjLoan filter
    logger.debug('🔍 [BACKEND] whereObjLoan filter:', whereObjLoan);
    
    // Debug: Check if there are any notInterested records with the current role_id
    const notInterestedWithRole = await loanUser.findAll({
        where: whereObjLoan,
        raw: true
    });
    logger.debug('🔍 [BACKEND] notInterested records with role_id', req.user.id, ':', notInterestedWithRole.length);
    
    // Debug: Check all notInterested records regardless of role_id
    const allNotInterested = await loanUser.findAll({
        where: { status: "notInterested" },
        raw: true
    });
    logger.debug('🔍 [BACKEND] All notInterested records (any role):', allNotInterested.length);
    if (allNotInterested.length > 0) {
        logger.debug('🔍 [BACKEND] Sample notInterested record:', allNotInterested[0]);
        
        // Check if there are any notInterested records with the current user's role_id
        const notInterestedWithCurrentRole = await loanUser.findAll({
            where: { 
                status: "notInterested",
                role_id: req.user.id
            },
            raw: true
        });
        logger.debug('🔍 [BACKEND] notInterested records with current role_id:', notInterestedWithCurrentRole.length);
        
        // If no notInterested records exist for current user, create one from the existing record
        if (notInterestedWithCurrentRole.length === 0 && allNotInterested.length > 0) {
            logger.debug('🔍 [BACKEND] Creating notInterested record for current user from existing record');
            const existingRecord = allNotInterested[0];
            await loanUser.create({
                user_id: existingRecord.user_id,
                status: "notInterested",
                role_id: req.user.id,
                remarks: existingRecord.remarks || null,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            logger.debug('🔍 [BACKEND] notInterested record created for current user');
        }
    }

    let findUserList = await loanUser.findAll({
        where: whereObjLoan,
        include: [
            {
                model: LoginLoan,
            },
            {
                model: property,
            },
            {
                model: DocumentSelectedLoan,
            },
            {
                model: QueryLoan,
            },
            {
                model: CancelLoan,
            }
        ],
        raw: true,
    });
    
    logger.debug('🔍 [BACKEND] Found notInterested records with role filter:', findUserList.length);
    if (findUserList.length > 0) {
        logger.debug('🔍 [BACKEND] Sample notInterested record:', {
            user_id: findUserList[0].user_id,
            status: findUserList[0].status,
            role_id: findUserList[0].role_id,
            laon_id: findUserList[0].laon_id
        });
    }
    let userList = [];
    await findUserList.map((item) => {
        userList.push(item.user_id);
    });
    logger.debug('🔍 [BACKEND] User IDs from loanUser query:', userList);
    
    // If no notInterested records found, return empty array
    if (userList.length === 0) {
        logger.debug('🔍 [BACKEND] No notInterested records found, returning empty array');
        return res.status(200).send({
            message: "Category unit get success",
            data: [],
            status: true,
        });
    }
    
    whereObj.user_consumer_id = {
        [Op.in]: userList,
    };
    logger.debug('🔍 [BACKEND] consumerRoleMapping whereObj:', whereObj);
    
    // Fix: Create missing consumerRoleMapping entries for notInterested users
    for (const userId of userList) {
        const existingMapping = await consumerRoleMapping.findOne({
            where: {
                user_role_id: req.user.id,
                category_id: CATEGORY_IDS.LOAN,
                user_consumer_id: userId
            }
        });
        
        if (!existingMapping) {
            logger.debug('🔍 [BACKEND] Creating missing consumerRoleMapping for user_id:', userId);
            await consumerRoleMapping.create({
                user_role_id: req.user.id,
                category_id: CATEGORY_IDS.LOAN,
                user_consumer_id: userId
            });
            logger.debug('🔍 [BACKEND] consumerRoleMapping created successfully');
        } else {
            logger.debug('🔍 [BACKEND] consumerRoleMapping already exists for user_id:', userId);
        }
    }
    
    await consumerRoleMapping
        .findAll({
            where: whereObj,
            attributes: ["user_role_id", "category_id", "user_consumer_id"],
            include: [
                {
                    model: User,
                    as: "userRoles",
                    required: false,
                    attributes: ["username", "email", "mobileNumber", "referenceName"],
                },
                {
                    model: User,
                    as: "userConsumers",
                    required: false,
                    attributes: ["username", "email", "mobileNumber", "referenceName"],
                },
            ],
            raw: true,
        })
        .then(async (articles) => {
            let responseData = await Promise.all(
                articles.map(async (article) => {
                    const initialData = findUserList.find(user => user.user_id === article.user_consumer_id);
                    if (initialData) {
                        let userData = {};
                        const status = initialData.status;

                        if (initialData && initialData['documentSelected.laon_id']) {
                            userData.document_details = {
                                loan_type: initialData['documentSelected.loan_type'],
                                loan_type_name: initialData['documentSelected.loan_type_name'],
                                remarks_docs: initialData['documentSelected.remarks_docs'],
                            };
                        }
                        if (initialData && initialData['query.laon_id']) {
                            userData.query_details = {
                                remarks: initialData['query.remarks'],
                            };
                        }
                        if (initialData && initialData['cancel.laon_id']) {
                            userData.cancel_details = {
                                remarks_cancel: initialData['cancel.remarks_cancel'],
                            };
                        }
                        if (initialData && initialData['login.laon_id']) {
                            userData.login_details = {
                                loanAmount: initialData['login.loanAmount'],
                                loanDate: initialData['login.loanDate'],
                                loanAccountNumber: initialData['login.loanAccountNumber'],
                                bankName: initialData['login.bankName'],
                                product: initialData['login.product'],
                                smName: initialData['login.smName'],
                                amName: initialData['login.amName'],
                                remarks_loan: initialData['login.remarks_loan'],
                                bankCode: initialData['login.bankCode'],
                                dateOfBirth: initialData['login.dateOfBirth'],
                                code: initialData['login.code_id'],
                            };
                        }

                        // Parse remarks field to extract sanction details if they exist
                        if (initialData.remarks) {
                            try {
                                const parsedRemarks = JSON.parse(initialData.remarks);
                                if (parsedRemarks.sanction_details) {
                                    userData.sanction_details = parsedRemarks.sanction_details;
                                }
                            } catch (error) {
                                logger.debug('Error parsing remarks JSON:', error);
                            }
                        }

                        // Add additional details and status to the response
                        userData.status = status;
                        userData.remarks = initialData.remarks || '';
                        userData.createdAt = initialData.createdAt;
                        userData.updatedAt = initialData.updatedAt;
                        userData.laon_id = initialData.laon_id;
                        userData.user_consumer_id = initialData.user_consumer_id;

                        // Merge userData with the article
                        return {
                            ...article,
                            details: userData,
                        };
                    } else {
                        return article;
                    }
                })
            );

            res.status(200).send({
                message: "Category unit get success",
                data: responseData,
                status: true,
            });
        })
        .catch((e) => {
            res.status(400).send({ message: "role error", status: false });
            logger.debug(e);
        });
};


exports.getAllLoanUserDisburse = async (req, res) => {
    let whereObj = {};
    let whereObjLoan = {};

    // For Role 4, don't filter by user_role_id - show all completed loans they have access to
    // The consumerRoleMapping will be checked, but if there are no mappings, show all
    // if (req.user.Role === ROLE_IDS.STAFF) {
    //     whereObj.user_role_id = req.user.id;
    // }
    // Don't filter by role_id in loanUser table - filter by consumerRoleMapping instead
    // if (req.user.Role === ROLE_IDS.STAFF) {
    //     whereObjLoan.role_id = req.user.id;
    // }
    whereObj.category_id = 2;
    whereObjLoan.status = "completed";

    // Apply date filter only if dates are provided
    if (req.body.startDate && req.body.endDate) {
    const startDateIST = moment(`${req.body.startDate} 00:00:00`).utcOffset('+05:30').format('YYYY-MM-DD HH:mm:ss');
    const endDateIST = moment(`${req.body.endDate} 23:59:59`).utcOffset('+05:30').format('YYYY-MM-DD HH:mm:ss');
    whereObjLoan.createdAt = { [Op.between]: [startDateIST, endDateIST] }
    }
    try {
        let findUserList = await loanUser.findAll({
            where: whereObjLoan,
            include: [{
                model: LoginLoan, include: [{ model: codeDetail }],
            }, {
                model: DisbursementLoan
            }],
            logging: (msg) => logger.debug(msg),
            raw: true,
            attributes: ["user_id", "laon_id", "status"],
        });

        let userList = [];
        findUserList.map((item) => {
            userList.push(item.user_id);
        });

        whereObj.user_consumer_id = {
            [Op.in]: userList,
        };

        let articles = await consumerRoleMapping.findAll({
            where: whereObj,
            attributes: ["user_role_id", "category_id", "user_consumer_id"],
            include: [
                {
                    model: User,
                    as: "userRoles",
                    required: false,
                    attributes: ["username", "email", "mobileNumber", "referenceName"],
                },
                {
                    model: User,
                    as: "userConsumers",
                    required: false,
                    attributes: ["username", "email", "mobileNumber", "referenceName"],
                },
            ],
            raw: true,
        });

        for (let i = 0; i < articles.length; i++) {
            const initialData = findUserList.find(user => user.user_id === articles[i].user_consumer_id);

            if (initialData && initialData['login.laon_id']) {
                articles[i].login_details = {
                    loanAmount: initialData['login.loanAmount'],
                    loanDate: initialData['login.loanDate'],
                    loanAccountNumber: initialData['login.loanAccountNumber'],
                    bankName: initialData['login.bankName'],
                    product: initialData['login.product'],
                    smName: initialData['login.smName'],
                    amName: initialData['login.amName'],
                    remarks_loan: initialData['login.remarks_loan'],
                    bankCode: initialData['login.bankCode'],
                    dateOfBirth: initialData['login.dateOfBirth'],
                    code: initialData['login.code_id'],
                    createdAt: initialData['login.createdAt'],
                    updatedAt: initialData['login.updatedAt'],
                };
            }
            if (initialData && initialData['disbursetb.laon_id']) {
                articles[i].disbursement_details = {
                    disbursementAmount: initialData['disbursetb.disbursementAmount'],
                    disbursementRate: initialData['disbursetb.disbursementRate'],
                    insurance: initialData['disbursetb.insurance'],
                    fileNumber: initialData['disbursetb.fileNumber'],
                    disbursementDate: initialData['disbursetb.disbursementDate'],
                    remark_dis: initialData['disbursetb.remark_dis'],
                    insuranceBankName: initialData['disbursetb.insuranceBankName'],
                    insuranceAmount: initialData['disbursetb.insuranceAmount'],
                    insuranceType: initialData['disbursetb.insuranceType'],
                    createdAt: initialData['disbursetb.createdAt'],
                    updatedAt: initialData['disbursetb.updatedAt'],
                };
            }
            const result = await Disburse.findAll({
                attributes: [
                    'user_id',
                    [Sequelize.fn('GROUP_CONCAT', Sequelize.col('pdfname')), 'pdfname'],
                    [Sequelize.fn('GROUP_CONCAT', Sequelize.col('categoryname')), 'categoryname']
                ],
                where: { user_id: articles[i].user_consumer_id },
                group: ['user_id']
            });

            if (result.length > 0) {
                articles[i].pdfname = result[0].pdfname;
                articles[i].categoryname = result[0].categoryname;
            } else {
                articles[i].pdfname = null;
                articles[i].categoryname = null;
            }
            articles[i].laon_id = initialData.laon_id;
            articles[i].status = initialData.status;
        }

        res.status(200).send({
            message: "category unit get success",
            data: articles,
            status: true,
        });
    } catch (error) {
        logger.error("Error in getAllLoanUserDisburse:", error);
        res.status(500).send({ 
            message: "Server error", 
            error: error.message,
            status: false 
        });
    }
};


exports.updateLoanStatus = async (req, res) => {
    try {
        const { status, user_consumer_id, laon_id, remarks } = req.body;

        if (!status || !user_consumer_id) {
            return res.status(400).json({
                message: "Status and user_consumer_id are required.",
                status: false,
            });
        }

        const updatedUser = await loanService.updateLoanStatus({
            userConsumerId: user_consumer_id,
            laonId: laon_id,
            status,
            remarks,
            actorId: req.user.id,
        });

        if (!updatedUser) {
            return res.status(404).json({
                message: "Loan user not found or not updated.",
                status: false,
            });
        }

        return res.status(200).json({
            message: "Loan user successfully updated!",
            status: true,
            userData: updatedUser,
        });
    } catch (error) {
        logger.error({ err: error }, "updateLoanStatus failed");
        return res.status(500).json({
            message: "An error occurred while updating the loan user.",
            status: false,
        });
    }
};


exports.updateWorkingLoanStatus = async (req, res) => {
    let obj = {
        status: req.body.status,
    };
    if (req.body.status == "documentselected") {
        obj.documentSelectedType = req.body?.document_name;
    } else if (req.body.status == "query") {
        obj.remarks = req.body?.query;
    } else if (req.body.status == "sanction") {
        obj.senson_rate = req.body?.rate;
        obj.senson_tenue = req.body?.tenue;
        obj.senson_amount = req.body?.amount;
    }
    logger.debug(obj);
    loanUser
        .update(obj, {
            where: {
                user_id: req.body.user_consumer_id,
            },
        })
        .then(async (articles) => {
            return res.status(200).send({
                message: "loan user successfully updated!",
                status: true,
                userData: articles,
            });
        })
        .catch((e) => {
            res.send({ message: e?.message });
            logger.debug(e);
        });
};


exports.addLoanCobfiguration = async (req, res) => {
    try {
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).send({ message: "No files were uploaded.", status: false });
        }

        let pdfFile = req.files.pdfFile;
        const { user_id, categoryname } = req.body;
        logger.debug(req.body, req.files.pdfFile)

        const uploadsDir = path.join(CTRL_DIR, "../../uploads");

        // Find an existing entry by user_id
        let disburse = await loanConfiguration.findOne({
            where: { categoryname },
        });

        if (disburse) {
            if (disburse.categoryname === categoryname) {
                // If the categoryname is the same
                if (pdfFile) {
                    // Replace the PDF file if available
                    const oldFilePath = path.join(uploadsDir, disburse.pdfname);
                    if (fsSync.existsSync(oldFilePath)) {
                        fsSync.unlinkSync(oldFilePath);
                    }

                    // Generate a new unique name for the new file
                    const uniqueName = `${uuidv4()}-${path.basename(pdfFile.name)}`;
                    const uploadPath = path.join(uploadsDir, uniqueName);

                    // Move the new file to the uploads directory
                    pdfFile.mv(uploadPath, async (err) => {
                        if (err) {
                            return res.status(500).send({ message: 'File upload error', error: err, status: false });
                        }

                        // Update the existing entry with the new file name
                        disburse.pdfname = uniqueName;
                        disburse = await loanConfiguration.destroy({
                            where: {
                                categoryname: categoryname
                            }
                        });
                        disburse = await loanConfiguration.create({
                            pdfname: uniqueName,
                            categoryname
                        });

                        res.status(200).send({ message: 'File replaced and record updated!', data: disburse, status: true });
                    });
                } else {
                    // No file to update, just send a success message
                    res.status(200).send({ message: 'Record found with same categoryname. No file updated.', data: disburse, status: true });
                }
            } else {
                // If the categoryname is different
                if (pdfFile) {
                    // Delete the old file
                    const oldFilePath = path.join(uploadsDir, disburse.pdfname);
                    if (fsSync.existsSync(oldFilePath)) {
                        fsSync.unlinkSync(oldFilePath);
                    }

                    // Remove the old file name from the database
                    disburse.pdfname = null;
                    disburse.categoryname = categoryname; // Update the categoryname

                    await disburse.save();

                    // Generate a new unique name for the new file
                    const uniqueName = `${uuidv4()}-${path.basename(pdfFile.name)}`;
                    const uploadPath = path.join(uploadsDir, uniqueName);

                    // Move the new file to the uploads directory
                    pdfFile.mv(uploadPath, async (err) => {
                        if (err) {
                            return res.status(500).send({ message: 'File upload error', error: err, status: false });
                        }

                        // Update the database with the new file name
                        disburse.pdfname = uniqueName;
                        await disburse.save();

                        res.status(200).send({ message: 'File and categoryname updated successfully!', data: disburse, status: true });
                    });
                } else {
                    // If no new file is provided, just update the categoryname
                    disburse.categoryname = categoryname;
                    await disburse.save();

                    res.status(200).send({ message: 'Categoryname updated successfully!', data: disburse, status: true });
                }
            }
        } else {
            // No entry exists, create a new record
            if (pdfFile) {
                const uniqueName = `${uuidv4()}-${path.basename(pdfFile.name)}`;
                const uploadPath = path.join(uploadsDir, uniqueName);

                // Move the new file to the uploads directory
                pdfFile.mv(uploadPath, async (err) => {
                    if (err) {
                        return res.status(500).send({ message: 'File upload error', error: err, status: false });
                    }

                    // Create a new entry in the database
                    disburse = await loanConfiguration.create({
                        pdfname: uniqueName,
                        categoryname
                    });

                    res.status(200).send({ message: 'File uploaded and record created!', data: disburse, status: true });
                });
            } else {
                // File is required for new entries
                res.status(400).send({ message: 'File is required to create a new record.', status: false });
            }
        }
    } catch (error) {
        res.status(500).send({ message: 'Server error', error: error.message, status: false });
    }
};


exports.addDisburse = async (req, res) => {
    try {
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).send({ message: "No files were uploaded.", status: false });
        }

        let pdfFile = req.files.pdfFile;
        const { user_id, categoryname } = req.body;
        logger.debug(req.body, req.files.pdfFile)

        const uploadsDir = path.join(CTRL_DIR, "../../uploads");

        // Find an existing entry by user_id
        let disburse = await Disburse.findOne({
            where: { user_id, categoryname },
        });

        if (disburse) {
            if (disburse.categoryname === categoryname) {
                // If the categoryname is the same
                if (pdfFile) {
                    // Replace the PDF file if available
                    const oldFilePath = path.join(uploadsDir, disburse.pdfname);
                    if (fsSync.existsSync(oldFilePath)) {
                        fsSync.unlinkSync(oldFilePath);
                    }

                    // Generate a new unique name for the new file
                    const uniqueName = `${uuidv4()}-${path.basename(pdfFile.name)}`;
                    const uploadPath = path.join(uploadsDir, uniqueName);

                    // Move the new file to the uploads directory
                    pdfFile.mv(uploadPath, async (err) => {
                        if (err) {
                            return res.status(500).send({ message: 'File upload error', error: err, status: false });
                        }

                        // Update the existing entry with the new file name
                        disburse.pdfname = uniqueName;
                        await disburse.save();

                        res.status(200).send({ message: 'File replaced and record updated!', data: disburse, status: true });
                    });
                } else {
                    // No file to update, just send a success message
                    res.status(200).send({ message: 'Record found with same categoryname. No file updated.', data: disburse, status: true });
                }
            } else {
                // If the categoryname is different
                if (pdfFile) {
                    // Delete the old file
                    const oldFilePath = path.join(uploadsDir, disburse.pdfname);
                    if (fsSync.existsSync(oldFilePath)) {
                        fsSync.unlinkSync(oldFilePath);
                    }

                    // Remove the old file name from the database
                    disburse.pdfname = null;
                    disburse.categoryname = categoryname; // Update the categoryname

                    await disburse.save();

                    // Generate a new unique name for the new file
                    const uniqueName = `${uuidv4()}-${path.basename(pdfFile.name)}`;
                    const uploadPath = path.join(uploadsDir, uniqueName);

                    // Move the new file to the uploads directory
                    pdfFile.mv(uploadPath, async (err) => {
                        if (err) {
                            return res.status(500).send({ message: 'File upload error', error: err, status: false });
                        }

                        // Update the database with the new file name
                        disburse.pdfname = uniqueName;
                        await disburse.save();

                        res.status(200).send({ message: 'File and categoryname updated successfully!', data: disburse, status: true });
                    });
                } else {
                    // If no new file is provided, just update the categoryname
                    disburse.categoryname = categoryname;
                    await disburse.save();

                    res.status(200).send({ message: 'Categoryname updated successfully!', data: disburse, status: true });
                }
            }
        } else {
            // No entry exists, create a new record
            if (pdfFile) {
                const uniqueName = `${uuidv4()}-${path.basename(pdfFile.name)}`;
                const uploadPath = path.join(uploadsDir, uniqueName);

                // Move the new file to the uploads directory
                pdfFile.mv(uploadPath, async (err) => {
                    if (err) {
                        return res.status(500).send({ message: 'File upload error', error: err, status: false });
                    }

                    // Create a new entry in the database
                    disburse = await Disburse.create({
                        user_id,
                        pdfname: uniqueName,
                        categoryname
                    });

                    res.status(200).send({ message: 'File uploaded and record created!', data: disburse, status: true });
                });
            } else {
                // File is required for new entries
                res.status(400).send({ message: 'File is required to create a new record.', status: false });
            }
        }
    } catch (error) {
        res.status(500).send({ message: 'Server error', error: error.message, status: false });
    }
};


exports.updateDisburse = async (req, res) => {
    //   try {
    //     const { disburse_id, loan_id, user_id, categoryname } = req.body;

    //     if (!req.files || Object.keys(req.files).length === 0) {
    //       return res.status(400).send({ message: "No files were uploaded." });
    //     }

    //     let pdfFile = req.files.pdfFile;

    //     // Find the entry to update
    //     let disburse = await Disburse.findByPk(disburse_id);

    //     if (!disburse) {
    //       return res.status(404).send({ message: "Record not found." });
    //     }

    //     // Define the uploads directory
    //     const uploadsDir = path.join(CTRL_DIR, "../../uploads");

    //     // If a new file is uploaded, handle file replacement
    //     if (pdfFile) {
    //       // Delete the old file
    //       const oldFilePath = path.join(uploadsDir, disburse.pdfname);
    //       if (fs.existsSync(oldFilePath)) {
    //         fs.unlinkSync(oldFilePath);
    //       }

    //       // Generate a new unique name for the new file
    //       const uniqueName = `${uuidv4()}-${path.basename(pdfFile.name)}`;
    //       const uploadPath = path.join(uploadsDir, uniqueName);

    //       // Move the new file to the uploads directory
    //       pdfFile.mv(uploadPath, (err) => {
    //         if (err) {
    //           return res.status(500).send(err);
    //         }

    //         // Update the entry with the new file name
    //         disburse.pdfname = uniqueName;
    //       });
    //     }

    //     // Update other fields
    //     disburse.loan_id = loan_id || disburse.loan_id;
    //     disburse.user_id = user_id || disburse.user_id;
    //     disburse.categoryname = categoryname || disburse.categoryname;

    //     // Save the updated entry
    //     await disburse.save();

    //     res.status(200).send({ message: "Record updated successfully!", disburse });
    //   } catch (error) {
    //     res.status(500).send({ message: "Server error", error: error.message });
    //   }
};


// ── Clean loan list/detail (reads the unified loan_stage table) ───────────────
// Builds the row shape the new loan UI needs: consumer + current status + grouped
// stages + builder/property. One query for loans (+ stages include), one for
// builder links — no N+1.
async function buildLoanRows(req, extraLoanWhere = {}) {
  const bms = await User.findAll({ where: { role_id: ROLE_IDS.BUILDING_MANAGER }, attributes: ["user_id"], raw: true });
  const bmIds = bms.map((b) => b.user_id);

  const mapWhere = { category_id: CATEGORY_IDS.LOAN };
  if (MANAGER_ROLE_IDS.includes(req.user.Role)) mapWhere.user_role_id = req.user.id; // managers see only their assigned
  const maps = await consumerRoleMapping.findAll({
    where: mapWhere,
    attributes: ["user_role_id", "user_consumer_id"],
    include: [
      { model: User, as: "userRoles", required: false, attributes: ["username"] },
      { model: User, as: "userConsumers", required: false, attributes: ["username", "email", "mobileNumber", "referenceName", "role_id"] },
    ],
    raw: true,
  });
  const mapByConsumer = {};
  maps.forEach((m) => { if (!mapByConsumer[m.user_consumer_id]) mapByConsumer[m.user_consumer_id] = m; });
  const consumerIds = [...new Set(maps.map((m) => m.user_consumer_id).filter((id) => id && !bmIds.includes(id)))];
  if (!consumerIds.length) return [];

  const loans = await loanUser.findAll({
    where: { user_id: { [require("sequelize").Op.in]: consumerIds }, ...extraLoanWhere },
    include: [{ model: db.loanStage, as: "stages" }],
  });

  // Builder links (batched).
  let bcByUser = {};
  try {
    const bcs = await builderConsumer.findAll({
      where: { user_id: { [require("sequelize").Op.in]: consumerIds } },
      include: [
        { model: BuilderUser, attributes: ["company_name"], include: [{ model: Unit, attributes: ["unit_name", "address"] }] },
        { model: floor, attributes: ["floorNumber"] },
        { model: Wing, attributes: ["wing_name"] },
      ],
    });
    bcs.forEach((b) => { bcByUser[b.user_id] = b.get ? b.get({ plain: true }) : b; });
  } catch (e) { logger.error({ err: e }, "loan builder-link lookup failed"); }

  return loans.map((l) => {
    const lp = l.get ? l.get({ plain: true }) : l;
    const g = loanService.groupStages(lp.stages || []);
    const m = mapByConsumer[lp.user_id] || {};
    const login = g.login || {};
    return {
      laon_id: lp.laon_id,
      user_id: lp.user_id,
      status: lp.status,
      name: m["userConsumers.username"] || null,
      mobile: m["userConsumers.mobileNumber"] || null,
      email: m["userConsumers.email"] || null,
      referenceName: m["userConsumers.referenceName"] || null,
      assignedTo: m["userRoles.username"] || null,
      product: login.product || null,
      bankName: login.bankName || null,
      loanAmount: login.loanAmount || null,
      loanDate: login.loanDate || null,
      loanAccountNumber: login.loanAccountNumber || null,
      stages: g,
      builder: bcByUser[lp.user_id] || null,
      property: g.property || { address: lp.address, sqFeet: lp.sq_ft, deedAmount: lp.deed_amount, non_builder_name: lp.non_builder_name },
    };
  });
}

/** GET /user/loan/list — all loan consumers (assigned + pipeline) with grouped stages. */
exports.getLoanList = async (req, res) => {
  try {
    const data = await buildLoanRows(req);
    res.status(200).send({ status: true, data });
  } catch (e) {
    logger.error({ err: e }, "getLoanList failed");
    res.status(500).send({ status: false, message: e.message });
  }
};

/** GET /user/loan/:laon_id — one loan with grouped stages + builder/property. */
exports.getLoanById = async (req, res) => {
  try {
    const rows = await buildLoanRows(req, { laon_id: req.params.laon_id });
    if (!rows.length) return res.status(404).send({ status: false, message: "Loan not found" });
    res.status(200).send({ status: true, data: rows[0] });
  } catch (e) {
    logger.error({ err: e }, "getLoanById failed");
    res.status(500).send({ status: false, message: e.message });
  }
};
