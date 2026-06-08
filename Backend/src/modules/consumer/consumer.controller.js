const { ROLE_IDS, CATEGORY_IDS } = require("../../config/ids");
/**
 * consumer controller — extracted from the legacy user.controller monolith.
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
  vehicles,
  ConsumerDocument,
  upsertConsumerDocument,
  saveUpload
} = require("../shared/context");
const consumerService = require("./consumer.service");
const logger = require("../../config/logger");

exports.addConsumerData = async (req, res) => {
    logger.debug('🔍 [ADD CONSUMER] Starting consumer creation...');
    logger.debug('🔍 [ADD CONSUMER] Request body:', req.body);
    logger.debug('🔍 [ADD CONSUMER] User role:', req.user.Role);
    logger.debug('🔍 [ADD CONSUMER] Categories:', req.body?.category);
    
    try {
    let buildeUser;
    if (req.user.Role == ROLE_IDS.SUPER_ADMIN) {
        buildeUser = req.body.builderType;
        logger.debug('🔍 [ADD CONSUMER] Admin user - Builder Type:', buildeUser);
    } else {
        if (req.user.Role == ROLE_IDS.BUILDER) {
            buildeUser = req.user.id;
            logger.debug('🔍 [ADD CONSUMER] Builder user - Builder ID:', buildeUser);
        }
    }

        // Check if user with this mobile number already exists
        let user = await User.findOne({
        where: {
                mobileNumber: req.body.phone_number,
        },
        raw: true,
        nest: true,
        });

        let userData;
        if (user) {
            logger.debug('🔍 [ADD CONSUMER] User found with mobile number:', req.body.phone_number, 'User ID:', user.user_id);
            // Reuse the existing user (NO duplicate user). Category mappings and the
            // per-vertical records are created below — de-duped against whatever the
            // consumer already has — so this single path is idempotent whether the
            // consumer was created here or via the vehicle/loan/etc. pages.
            userData = user;
        } else {
            logger.debug('➕ [ADD CONSUMER] User not found, creating new user...');
            userData = await User.create({
                username: req.body.username,
                email: req.body.email,
                mobileNumber: req.body.phone_number,
                role_id: ROLE_IDS.CONSUMER,
                referenceName: req.body.referenceName,
                created_by: req.user.id,
                updated_by: req.user.id,
                builder_user: buildeUser || null,
                otp: "",
                token: "",
            });

            logger.debug('🔍 [ADD CONSUMER] User created successfully:', userData);
        }

                    logger.debug('🔍 [ADD CONSUMER] Checking vertical assignment conditions...');
                    logger.debug('🔍 [ADD CONSUMER] User Role check:', req.user.Role == ROLE_IDS.SUPER_ADMIN || req.user.Role == ROLE_IDS.STAFF);
                    logger.debug('🔍 [ADD CONSUMER] Category check:', req.body?.category && req.body.category.length);
                    
                    if (
                        // (req.user.Role == ROLE_IDS.SUPER_ADMIN || req.user.Role == ROLE_IDS.STAFF) &&
                        // req.body?.category &&
                        // req.body.category.length
                        (req.body?.category && req.body.category.length) 
                    ) {
                        logger.debug('🔍 [ADD CONSUMER] Vertical assignment conditions met!');
                        // De-dup: only add categories the consumer doesn't already have,
                        // so re-adding an existing consumer (or one created via another
                        // page) never creates duplicate mappings or per-vertical records.
                        const existingMappings = await consumerRoleMapping.findAll({
                            where: { user_consumer_id: userData.user_id },
                        });
                        const existingCatIds = existingMappings.map((m) => String(m.category_id));
                        let array = req.body.category
                            .filter((item) => !existingCatIds.includes(String(item.category_id)))
                            .map((item) => ({
                                user_role_id: item.user_role_id,
                                user_consumer_id: userData.user_id,
                                category_id: item.category_id,
                            }));

                        if (array.length) {
                            let Rs = await consumerRoleMapping.bulkCreate(array);
                            logger.debug('🔍 [ADD CONSUMER] New ConsumerRoleMapping created:', Rs);
                        }

                        let findLoan = array.find((item) => item.category_id == CATEGORY_IDS.LOAN);
                        if (findLoan) {
                            logger.debug('🔍 [ADD CONSUMER] Creating loan user for category 2');
                            const loanUserRecord = await loanUser.create({
                                user_id: findLoan.user_consumer_id,
                                role_id: findLoan.user_role_id,
                                status: "notAssign",
                                non_builder_name: req.body.non_builder_name || null,
                                non_builder_property_name: req.body.non_builder_property_name || null,
                                sq_ft: req.body.sq_ft || null,
                                deed_amount: req.body.deed_amount || null,
                                address: req.body.address || null
                            });

                            // Create notification for admin
                            await createNotification({
                                title: "New Loan User Added",
                                message: userData.username,
                                type: 'loan',
                                category: 'user_added',
                                user_id: req.user.id, // User who added the record
                                target_user_id: userData.user_id, // User who was added
                                record_id: loanUserRecord.loan_user_id,
                                is_important: true,
                                metadata: {
                                    user_name: userData.username,
                                    email: userData.email,
                                    phone: userData.mobileNumber,
                                    non_builder_name: req.body.non_builder_name,
                                    property_name: req.body.non_builder_property_name
                                }
                            });
                        }
                        let findMediclaim = array.find((item) => item.category_id == CATEGORY_IDS.MEDICLAIM);
                        if (findMediclaim) {
                            logger.debug('🔍 [ADD CONSUMER] Creating mediclaim for category 4');
                            await Mediclaim.create({
                                user_id: findMediclaim.user_consumer_id,
                            });
                        }
            let findLifeInsurance = array.find((item) => item.category_id == CATEGORY_IDS.LIFE_INSURANCE);
            if (findLifeInsurance) {
                logger.debug('🔍 [ADD CONSUMER] Creating life insurance for category 5');
                const lifeInsuranceRecord = await LifeInsurance.create({
                    user_id: findLifeInsurance.user_consumer_id,
                    // Agent Details - Required fields
                    agent_code: 'TBD',
                    agent_name: 'TBD',
                    channel: 'TBD',
                    channel_code: 'TBD',
                    // Proposer Details - Using actual user data
                    proposer_number: `LI${Date.now()}`,
                    proposer_name: userData.username,
                    proposer_gender: 'Male', // Default value, will be updated when user fills form
                    proposer_dob: new Date('1990-01-01'), // Default value, will be updated when user fills form
                    proposer_married_status: 'Single', // Default value, will be updated when user fills form
                    proposer_mobile_numbers: userData.mobileNumber,
                    proposer_email: userData.email,
                    proposer_relationship_with_life_assured: 'Self',
                    proposer_residential_status: 'Resident',
                    proposer_mailing_address: 'TBD', // Will be updated when user fills form
                    proposer_permanent_address: 'TBD', // Will be updated when user fills form
                    // Life Assured Details - Using actual user data
                    life_assured_name: userData.username,
                    life_assured_gender: 'Male', // Default value, will be updated when user fills form
                    life_assured_dob: new Date('1990-01-01'), // Default value, will be updated when user fills form
                    life_assured_married_status: 'Single', // Default value, will be updated when user fills form
                    life_assured_mobile_numbers: userData.mobileNumber,
                    life_assured_relationship_with_proposer: 'Self',
                    life_assured_residential_status: 'Resident',
                    life_assured_mailing_address: 'TBD', // Will be updated when user fills form
                    life_assured_permanent_address: 'TBD', // Will be updated when user fills form
                    // Nominee Details - Required fields
                    nominee_name: 'TBD', // Will be updated when user fills form
                    nominee_relationship_with_life_assured: 'Spouse',
                    nominee_gender: 'Male',
                    // Policy Details - Required fields
                    product_name: 'TBD', // Will be updated when user fills form
                    premium_payment_term: 1,
                    sum_assured: 0,
                    policy_term: 1,
                    // Set default due date (1 year from now)
                    due_date_of_premium: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                    // Banking Details - Required fields
                    account_type: 'Savings',
                    bank_name: 'TBD', // Will be updated when user fills form
                    branch: 'TBD', // Will be updated when user fills form
                    account_number: '0000000000000000',
                    premium_amount: 0,
                    premium_payment_mode: 'Yearly',
                    // Status
                    status: 'Draft'
                });

                // Create notification for admin
                await createNotification({
                    title: "New Life Insurance User Added",
                    message: userData.username,
                    type: 'life_insurance',
                    category: 'user_added',
                    user_id: req.user.id, // User who added the record
                    target_user_id: userData.user_id, // User who was added
                    record_id: lifeInsuranceRecord.id,
                    is_important: true,
                    metadata: {
                        user_name: userData.username,
                        email: userData.email,
                        phone: userData.mobileNumber,
                        proposer_number: lifeInsuranceRecord.proposer_number
                    }
                });
            }
                    } else {
                        logger.debug('❌ [ADD CONSUMER] Vertical assignment conditions NOT met!');
                        logger.debug('❌ [ADD CONSUMER] User Role:', req.user.Role);
                        logger.debug('❌ [ADD CONSUMER] Required roles for vertical assignment: 1 or 4');
                        logger.debug('❌ [ADD CONSUMER] Categories provided:', req.body?.category);
                        logger.debug('❌ [ADD CONSUMER] Categories length:', req.body?.category?.length);
                    }
        
            // Create notification for admin about new consumer
            await createNotification({
                title: "New Consumer Added",
                message: req.body.username,
                type: 'system',
                category: 'user_added',
                user_id: req.user.id,
                target_user_id: userData.user_id,
                is_important: false,
                metadata: {
                    consumer_name: req.body.username,
                    mobile_number: req.body.phone_number,
                    categories: req.body?.category?.map(cat => ({
                        category_id: cat.category_id,
                        user_role_id: cat.user_role_id
                    })) || []
                }
            });

                    res.send(
                        JSON.stringify({
                            response: "user successfully added!",
                            status: true,
                userData: userData,
            })
        );
    } catch (error) {
        logger.error('❌ [ADD CONSUMER] Error:', error);
        res.status(500).send({ message: error.message });
    }
};


exports.updateConsumerData = async (req, res) => {
    try {
        // Check if mobile number already exists for another user
        // let user = await User.findOne({
        //     where: {
        //         user_id: { [Op.ne]: req.body.user_id }, // Ignore current user
        //         mobileNumber: req.body.phone_number, // Check if mobile number exists
        //     },
        // });

        // if (user) {
        //     return res.status(400).send({ response: "Mobile number already in use", status: false });
        // }

        // Proceed with the category mapping if the user has the required role
        if ((req.user.Role == ROLE_IDS.SUPER_ADMIN || req.user.Role == ROLE_IDS.STAFF) && req.body?.category && req.body.category.length) {
            // Delete existing category mappings for the user
            await consumerRoleMapping.destroy({
                where: { user_consumer_id: req.body.user_id },
            });

            // Prepare new category mappings
            let array = req.body.category.map((item) => ({
                user_role_id: item.user_role_id,
                user_consumer_id: req.body.user_id,
                category_id: item.category_id,
            }));

            // Create new category mappings
            let Rs = await consumerRoleMapping.bulkCreate(array);

            // Handle loan-related category logic
            let findLoan = array.find((item) => item.category_id == CATEGORY_IDS.LOAN);
            if (findLoan) {
                let findLoanUser = await loanUser.findOne({
                    where: { user_id: findLoan.user_consumer_id },
                });

                if (!findLoanUser) {
                    let findbuilderUser = await builderConsumer.findOne({
                        where: { user_id: findLoan.user_consumer_id },
                    });
                    let loanUserRecord;
                    if (findbuilderUser && req.body.is_from_builder_user == 1) {
                        loanUserRecord = await loanUser.create({
                            user_id: findLoan.user_consumer_id,
                            role_id: findLoan.user_role_id,
                            status: "notAssign",
                        });
                    } else {
                        loanUserRecord = await loanUser.create({
                            user_id: findLoan.user_consumer_id,
                            role_id: findLoan.user_role_id,
                            status: "notAssign",
                        });
                    }

                    // Create notification for admin - only for new loan users
                    await createNotification({
                        title: "New Loan User Added",
                        message: req.body.username,
                        type: 'loan',
                        category: 'user_added',
                        user_id: req.user.id,
                        target_user_id: findLoan.user_consumer_id,
                        record_id: loanUserRecord.loan_user_id,
                        is_important: true,
                        metadata: {
                            user_name: req.body.username,
                            email: req.body.email,
                            phone: req.body.phone_number
                        }
                    });
                } else {
                    await loanUser.update(
                        { role_id: findLoan.user_role_id },
                        { where: { user_id: req.body.user_id } }
                    );
                }
            }

            // Handle Mediclaim-related category logic
            let findMediclaim = array.find((item) => item.category_id == CATEGORY_IDS.MEDICLAIM);
            if (findMediclaim) {
                let findLoanMediclaim = await Mediclaim.findOne({
                    where: { user_id: findMediclaim.user_consumer_id },
                });

                if (!findLoanMediclaim) {
                    await Mediclaim.create({
                        user_id: findMediclaim.user_consumer_id,
                    });
                }
            }

            // Handle Life Insurance-related category logic
            let findLifeInsurance = array.find((item) => item.category_id === CATEGORY_IDS.LIFE_INSURANCE);
            if (findLifeInsurance) {
                let findLifeInsuranceRecord = await LifeInsurance.findOne({
                    where: { user_id: findLifeInsurance.user_consumer_id },
                });

                if (!findLifeInsuranceRecord) {
                    // Create life insurance record with actual user data
                    const lifeInsuranceRecord = await LifeInsurance.create({
                        user_id: findLifeInsurance.user_consumer_id,
                        // Agent Details - Required fields
                        agent_code: 'TBD',
                        agent_name: 'TBD',
                        channel: 'TBD',
                        channel_code: 'TBD',
                        // Proposer Details - Using actual user data
                        proposer_number: `LI${Date.now()}`,
                        proposer_name: req.body.username,
                        proposer_gender: 'Male', // Default value, will be updated when user fills form
                        proposer_dob: new Date('1990-01-01'), // Default value, will be updated when user fills form
                        proposer_married_status: 'Single', // Default value, will be updated when user fills form
                        proposer_mobile_numbers: req.body.phone_number,
                        proposer_email: req.body.email,
                        proposer_relationship_with_life_assured: 'Self',
                        proposer_residential_status: 'Resident',
                        proposer_mailing_address: 'TBD', // Will be updated when user fills form
                        proposer_permanent_address: 'TBD', // Will be updated when user fills form
                        // Life Assured Details - Using actual user data
                        life_assured_name: req.body.username,
                        life_assured_gender: 'Male', // Default value, will be updated when user fills form
                        life_assured_dob: new Date('1990-01-01'), // Default value, will be updated when user fills form
                        life_assured_married_status: 'Single', // Default value, will be updated when user fills form
                        life_assured_mobile_numbers: req.body.phone_number,
                        life_assured_relationship_with_proposer: 'Self',
                        life_assured_residential_status: 'Resident',
                        life_assured_mailing_address: 'TBD', // Will be updated when user fills form
                        life_assured_permanent_address: 'TBD', // Will be updated when user fills form
                        // Nominee Details - Required fields
                        nominee_name: 'TBD', // Will be updated when user fills form
                        nominee_relationship_with_life_assured: 'Spouse',
                        nominee_gender: 'Male',
                        // Policy Details - Required fields
                        product_name: 'TBD', // Will be updated when user fills form
                        premium_payment_term: 1,
                        sum_assured: 0,
                        policy_term: 1,
                        // Set default due date (1 year from now)
                        due_date_of_premium: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                        // Banking Details - Required fields
                        account_type: 'Savings',
                        bank_name: 'TBD', // Will be updated when user fills form
                        branch: 'TBD', // Will be updated when user fills form
                        account_number: '0000000000000000',
                        premium_amount: 0,
                        premium_payment_mode: 'Yearly',
                        // Status
                        status: 'Draft'
                    });

                    // Create notification for admin - only for new life insurance users
                    await createNotification({
                        title: "New Life Insurance User Added",
                        message: req.body.username,
                        type: 'life_insurance',
                        category: 'user_added',
                        user_id: req.user.id,
                        target_user_id: findLifeInsurance.user_consumer_id,
                        record_id: lifeInsuranceRecord.id,
                        is_important: true,
                        metadata: {
                            user_name: req.body.username,
                            email: req.body.email,
                            phone: req.body.phone_number,
                            proposer_number: lifeInsuranceRecord.proposer_number
                        }
                    });
                }
            }

            let findVehicle = array.find((item) => item.category_id === CATEGORY_IDS.VEHICLE);
            if (findVehicle) {
                let findLoanMediclaim = await vehicleUser.findOne({
                    where: { user_id: findVehicle.user_consumer_id },
                });

                if (!findLoanMediclaim) {
                    // await vehicleUser.create({
                    //     user_id: findVehicle.user_consumer_id,
                    //     consumer_role_id: findVehicle.user_role_id,
                    // });
                    await vehicleUser.create({
                        user_id: findVehicle.user_consumer_id,
                        consumer_role_id: findVehicle.user_role_id,
                    
                        // 🔥 Add placeholders so NOT NULL columns don't break
                        vehicle_number: "NA",
                        make: "NA",
                        model: "NA",
                        chasis_number: "NA",
                    });
                    
                }
            }
        }

        // Update the user details
        await User.update(
            {
                username: req.body.username,
                email: req.body.email,
                mobileNumber: req.body.phone_number,
                role_id: req.body.role,
                referenceName: req.body.referenceName,
                updated_by: req.user.id,
            },
            {
                where: { user_id: req.body.user_id },
            }
        );

        // Send success response
        return res.status(200).send({ response: "User successfully updated!", status: true });

    } catch (e) {
        // Handle errors and send response
        logger.error(e);
        return res.status(500).send({ response: "An error occurred", status: false });
    }
};






exports.addConsumer = async (req, res) => {
    const {
        username,
        email,
        mobileNumber,
        role_id,
        unit_id,
        status,
        remarks,
        builder_id,
        office_no,
        category_id,
        sqFeet,
        srNo,
        floor_id,
        wing_id,
        builder_user_id,
        referenceName,
    } = req.body;

    try {
        // Check if foreign keys exist
        const fkOk = await consumerService.checkForeignKeys(role_id, unit_id, category_id);
        if (!fkOk) {
            return res.status(400).json({
                message: "Foreign Key Error: Role, Unit, or Category does not exist",
                status: false,
            });
        }

        // Check for duplicate combination of unit_id, office_no, category_id, floor, and wing
        const duplicateConsumer = await consumerService.findDuplicate({
            unit_id,
            office_no,
            category_id,
            floor_id,
            wing_id,
        });

        if (duplicateConsumer) {
            return res.status(400).json({
                message:
                    "Duplicate Entry Error: A BuilderConsumer with the same unit_id, office_no, category_id, floor, and wing already exists",
                status: false,
            });
        }

        // User find/create + builder-consumer creation live in the service.
        const result = await consumerService.createBuilderConsumer(req.body, req.user.id);
        if (result.userCreateFailed) {
            return res.status(400).json({ message: "User creation failed", status: false });
        }
        const { builderConsumerData } = result;

        // Notify admins when a builder adds an "interested" consumer.
        if (result.isInterested) {
            await createNotification({
                title: "New Builder Consumer Added",
                message: username,
                type: 'builder',
                category: 'user_added',
                user_id: req.user.id, // The builder who added the consumer
                target_user_id: result.user.user_id, // The consumer who was added
                record_id: builderConsumerData.builder_consumer_id,
                is_important: true,
                metadata: {
                    user_name: username,
                    email: email,
                    phone: mobileNumber,
                    unit_id: unit_id,
                    builder_id: builder_id,
                    office_no: office_no
                }
            });
        }

        // Respond with the created object
        res.status(201).json({
            message: "BuilderConsumer successfully created!",
            status: true,
            builderConsumerData,
        });
    } catch (error) {
        if (error.name === "SequelizeValidationError") {
            res.status(400).json({
                message:
                    "Validation Error: " + error.errors.map((e) => e.message).join(", "),
                status: false,
            });
        } else {
            res.status(500).json({
                message: "Internal Server Error: " + error.message,
                status: false,
            });
        }
    }
};


exports.updateConsumer = async (req, res) => {
    const {
        username,
        email,
        mobileNumber,
        role_id,
        unit_id,
        status,
        remarks,
        builder_id,
        office_no,
        category_id,
        user_id,
        sqFeet,
        srNo,
        floor_id,
        wing_id,
        builder_user_id,
    } = req.body;

    try {
        // Check for duplicate combination of unit_id, office_no, category_id, floor, and wing
        const duplicateConsumer = await db.builderConsumer.findOne({
            where: {
                unit_id,
                office_no,
                category_id,
                floor_id,
                wing_id,
                builderConsumerId: { [Op.ne]: req.params.id }, // Exclude the current record
            },
        });

        if (duplicateConsumer) {
            return res.status(400).json({
                message:
                    "Duplicate Entry Error: A BuilderConsumer with the same unit_id, office_no, category_id, floor, and wing already exists",
                status: false,
            });
        }

        if (status === "interested") {
            if (user_id) {
                // Update the user if it already exists
                // let user = await User.findOne({
                //     where: {
                //         user_id: { [Op.ne]: user_id },
                //         mobileNumber: mobileNumber,
                //     },
                // });
                // if (user) {
                //     return res.status(400).json({
                //         message:
                //             "Mobile number already in use",
                //         status: false,
                //     });
                // }
                await User.update(
                    {
                        username,
                        email,
                        mobileNumber,
                        builder_user: builder_user_id,
                        is_from_builder_user: 1,
                    },
                    { where: { user_id } }
                );

                // Update the builderConsumer record
                const [updated] = await db.builderConsumer.update(
                    {
                        role_id,
                        unit_id,
                        status,
                        floor_id,
                        wing_id,
                        sqFeet,
                        srNo,
                        user_id,
                        remarks,
                        builder_id,
                        office_no,
                        category_id,
                    },
                    { where: { builderConsumerId: req.params.id } }
                );

                if (updated) {
                    const updatedBuilderConsumer = await db.builderConsumer.findByPk(
                        req.params.id
                    );
                    return res.status(200).json({
                        message: "BuilderConsumer successfully updated!",
                        status: true,
                        builderConsumer: updatedBuilderConsumer,
                    });
                } else {
                    return res.status(404).json({
                        message: "Not Found: BuilderConsumer not found",
                        status: false,
                    });
                }
            } else {
                // Check if user with this mobile number already exists
                let user = await User.findOne({
                    where: { mobileNumber }
                });

                if (user) {
                    logger.debug('🔍 [UPDATE BUILDER CONSUMER] User found with mobile number:', mobileNumber, 'User ID:', user.user_id);
                    
                    // User exists, update their information if needed
                    await User.update(
                        {
                            username,
                            email,
                            builder_user: builder_user_id,
                            is_from_builder_user: 1,
                            updated_by: req.user.id,
                        },
                        { where: { user_id: user.user_id } }
                    );
                } else {
                    logger.debug('🔍 [UPDATE BUILDER CONSUMER] User not found, creating new user');
                    
                    // Create new user
                    user = await User.create({
                    username,
                    email,
                    mobileNumber,
                    role_id: ROLE_IDS.BUILDER_CONSUMER, // Builder consumers
                    otp: "",
                    token: "",
                    created_by: req.user.id,
                    updated_by: req.user.id,
                    builder_user: builder_user_id,
                    is_from_builder_user: 1,
                });

                if (!user?.user_id) {
                    return res.status(400).json({
                        message: "User creation failed",
                        status: false,
                    });
                    }
                }

                // Update builderConsumer with new user_id
                const [updated] = await db.builderConsumer.update(
                    {
                        unit_id,
                        status,
                        floor_id,
                        wing_id,
                        sqFeet,
                        srNo,
                        user_id: user.user_id,
                        remarks,
                        builder_id,
                        office_no,
                        category_id,
                    },
                    { where: { builderConsumerId: req.params.id } }
                );

                if (updated) {
                    return res.status(200).json({
                        message: "BuilderConsumer successfully updated!",
                        status: true,
                    });
                }
            }
        } else {
            // If status is not "interested", handle removal of associated user
            await User.destroy({ where: { user_id } });

            const [updated] = await db.builderConsumer.update(
                {
                    role_id: null,
                    unit_id,
                    status,
                    floor_id,
                    wing_id,
                    sqFeet,
                    srNo,
                    remarks: null,
                    builder_id,
                    office_no,
                    category_id,
                },
                { where: { builderConsumerId: req.params.id } }
            );

            if (updated) {
                const updatedBuilderConsumer = await db.builderConsumer.findByPk(
                    req.params.id
                );
                return res.status(200).json({
                    message: "BuilderConsumer successfully updated!",
                    status: true,
                    builderConsumer: updatedBuilderConsumer,
                });
            } else {
                return res.status(404).json({
                    message: "Not Found: BuilderConsumer not found",
                    status: false,
                });
            }
        }
    } catch (error) {
        if (error.name === "SequelizeValidationError") {
            res.status(400).json({
                message:
                    "Validation Error: " + error.errors.map((e) => e.message).join(", "),
                status: false,
            });
        } else {
            res.status(500).json({
                message: "Internal Server Error: " + error.message,
                status: false,
            });
        }
    }
};


exports.updateLoanConsumerData = async (req, res) => {
    try {
        logger.debug('🔍 updateLoanConsumerData - Request body:', req.body);
        logger.debug('🔍 updateLoanConsumerData - Status:', req.body.status);
        logger.debug('🔍 updateLoanConsumerData - Sanction Details:', req.body.sanction_details);
        logger.debug('🔍 updateLoanConsumerData - User Consumer ID:', req.body.user_consumer_id);
        logger.debug('🔍 updateLoanConsumerData - Loan ID:', req.body.laon_id);
        
        // Test loanUser model functionality
        try {
            logger.debug('🔍 [TEST] Testing loanUser model...');
            const testQuery = await loanUser.findOne({ 
                where: { laon_id: req.body.laon_id },
                raw: true,
                attributes: ['laon_id', 'status', 'user_id']
            });
            logger.debug('🔍 [TEST] loanUser test query result:', testQuery);
        } catch (testError) {
            logger.error('❌ [TEST] Error testing loanUser model:', testError);
            return res.status(500).send({ 
                response: "Database connection error", 
                status: false,
                error: testError.message
            });
        }
        
        // Add comprehensive debugging for all status types
        logger.debug('🔍 [DEBUG] All incoming data for status:', req.body.status);
        logger.debug('🔍 [DEBUG] Document Details:', req.body.document_details);
        logger.debug('🔍 [DEBUG] Pickup Details:', req.body.pickup_details);
        logger.debug('🔍 [DEBUG] Query Details:', req.body.query_details);
        logger.debug('🔍 [DEBUG] Cancel Details:', req.body.cancel_details);
        logger.debug('🔍 [DEBUG] Login Details:', req.body.login_details);
        logger.debug('🔍 [DEBUG] Disbursement Details:', req.body.disbursement_details);
        logger.debug('🔍 [DEBUG] Part Payment Details:', req.body.part_details);
        logger.debug('🔍 [DEBUG] Completed Details:', req.body.completed_details);
        logger.debug('🔍 [DEBUG] Property Details:', req.body.property_details);
        
        logger.debug('🔍 [DEBUG] About to start status processing...');
        
        // Check if mobile number already exists for another user
        logger.debug('🔍 [DEBUG] Checking mobile number validation...');
        logger.debug('🔍 [DEBUG] Current user ID:', req.body.user_consumer_id);
        logger.debug('🔍 [DEBUG] Mobile number to check:', req.body.phone_number);
        
        // Get current user's existing mobile number for comparison
        const currentUserMobile = await User.findOne({
            where: { user_id: req.body.user_consumer_id },
            attributes: ['mobileNumber']
        });
        logger.debug('🔍 [DEBUG] Current user existing mobile number:', currentUserMobile?.mobileNumber);
        
        // Only check for conflicts if the mobile number is different from current user's
        if (currentUserMobile?.mobileNumber !== req.body.phone_number) {
            logger.debug('🔍 [DEBUG] Mobile number changed, checking for conflicts...');
            
        let user = await User.findOne({
            where: {
                    user_id: { [Op.ne]: req.body.user_consumer_id }, // Ignore current user
                mobileNumber: req.body.phone_number, // Check if mobile number exists
            },
        });

        if (user) {
                logger.debug('🔍 [DEBUG] Mobile number conflict found with user:', user.user_id);
            return res.status(400).send({ response: "Mobile number already in use", status: false });
        }

            logger.debug('🔍 [DEBUG] Mobile number validation passed - no conflicts found');
        } else {
            logger.debug('🔍 [DEBUG] Mobile number unchanged - no validation needed');
        }

        logger.debug('🔍 About to update User table with data:', {
            username: req.body.username,
            email: req.body.email,
            mobileNumber: req.body.phone_number,
            referenceName: req.body.referenceName, // Added referenceName update
            user_consumer_id: req.body.user_consumer_id
        });

        // Check current user data before update
        const currentUser = await User.findOne({
            where: { user_id: req.body.user_consumer_id },
            attributes: ['user_id', 'username', 'email', 'mobileNumber', 'referenceName', 'updated_by']
        });
        
        logger.debug('🔍 [BEFORE UPDATE] Current user data:', currentUser?.dataValues);
        logger.debug('🔍 [BEFORE UPDATE] Current referenceName:', currentUser?.dataValues?.referenceName);
        
        // Check if referenceName column exists in the user table
        try {
            const [columns] = await db.sequelize.query(`
                SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
                FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'user' 
                AND COLUMN_NAME = 'referenceName'
            `);
            logger.debug('🔍 [SCHEMA CHECK] referenceName column info:', columns);
        } catch (schemaError) {
            logger.debug('🔍 [SCHEMA CHECK] Error checking schema:', schemaError);
        }

        const updateResult = await User.update(
            {
                username: req.body.username,
                email: req.body.email,
                mobileNumber: req.body.phone_number,
                referenceName: req.body.referenceName, // Added referenceName update
                updated_by: req.user.id,
            },
            {
                where: {
                    user_id: req.body.user_consumer_id,
                },
            }
        );
        
        logger.debug('🔍 User.update result:', updateResult);
        logger.debug('🔍 User table updated successfully');
        
        // Verify the update by fetching the user data
        const updatedUser = await User.findOne({
            where: { user_id: req.body.user_consumer_id },
            attributes: ['user_id', 'username', 'email', 'mobileNumber', 'referenceName', 'updated_by']
        });
        
        logger.debug('🔍 [VERIFICATION] User data after update:', updatedUser?.dataValues);
        logger.debug('🔍 [VERIFICATION] referenceName value:', updatedUser?.dataValues?.referenceName);

        let loanUserData = await loanUser.findOne({ where: { laon_id: req.body.laon_id } });
        logger.debug('🔍 Found loan user data:', loanUserData);

        if (!loanUserData) {
            return res.status(400).send({ response: "loan user not found", status: false });
        } else {
            // Update loan status
            await loanUser.update({ status: req.body.status }, { where: { laon_id: req.body.laon_id } });
            logger.debug('🔍 Loan status updated to:', req.body.status);

            // Handle sanction details - store in remarks field as JSON
            if (req.body.status === "sanction") {
                try {
                    const sanctionDetails = {
                        amount: req.body.sanction_details?.amount || req.body.amount,
                        rate: req.body.sanction_details?.rate || req.body.rate,
                        tenure: req.body.sanction_details?.tenure || req.body.tenure,
                        sanctionDate: req.body.sanction_details?.sanctionDate || req.body.sanctionDate,
                        updated_at: new Date().toISOString()
                    };
                    
                    logger.debug('🔍 Processing sanction details:', sanctionDetails);
                    
                    // Store sanction details in remarks field as JSON string
                    const remarksData = {
                        sanction_details: sanctionDetails
                    };
                    
                    logger.debug('🔍 About to update loanUser with remarks:', JSON.stringify(remarksData));
                    logger.debug('🔍 loanUser model type:', typeof loanUser);
                    logger.debug('🔍 loanUser model:', loanUser);
                    logger.debug('🔍 Where clause:', { laon_id: req.body.laon_id });
                    
                    // Check if the loanUser record exists before updating
                    const existingLoanUser = await loanUser.findOne({ 
                        where: { laon_id: req.body.laon_id },
                        raw: true 
                    });
                    
                    if (!existingLoanUser) {
                        logger.error('❌ LoanUser record not found for laon_id:', req.body.laon_id);
                        return res.status(400).send({ 
                            response: "Loan user record not found", 
                            status: false,
                            error: `No loan user found with laon_id: ${req.body.laon_id}`
                        });
                    }
                    
                    logger.debug('🔍 Found existing loanUser record:', existingLoanUser);
                    
                    const updateResult = await loanUser.update({
                        remarks: JSON.stringify(remarksData)
                    }, { where: { laon_id: req.body.laon_id } });
                    
                    logger.debug('🔍 Sanction update result:', updateResult);
                    logger.debug('🔍 Sanction details stored in remarks field successfully');
                } catch (sanctionError) {
                    logger.error('❌ Error updating sanction details:', sanctionError);
                    throw sanctionError; // Re-throw to be caught by outer try-catch
                }
            } 
            // Handle login details - store in remarks field as JSON and save to loginloan table
            else if (req.body.status === "login") {
                const loginDetails = {
                    loanAmount: req.body.login_details?.loanAmount,
                    loanDate: req.body.login_details?.loanDate,
                    loanAccountNumber: req.body.login_details?.loanAccountNumber,
                    bankName: req.body.login_details?.bankName,
                    product: req.body.login_details?.product,
                    smName: req.body.login_details?.smName,
                    amName: req.body.login_details?.amName,
                    remarks_loan: req.body.login_details?.remarks_loan,
                    bankCode: req.body.login_details?.bankCode,
                    dateOfBirth: req.body.login_details?.dateOfBirth,
                    code_id: req.body.login_details?.code_id,
                    updated_at: new Date().toISOString()
                };
                
                logger.debug('🔍 Processing login details:', loginDetails);
                
                // Store login details in remarks field as JSON string
                const remarksData = {
                    login_details: loginDetails
                };
                
                // Also include property details if they exist
                if (req.body.property_details) {
                    remarksData.property_details = {
                        address: req.body.property_details.address,
                        sqFeet: req.body.property_details.sqFeet,
                        deedAmount: req.body.property_details.deedAmount,
                        updated_at: new Date().toISOString()
                    };
                }
                
                logger.debug('🔍 Remarks data to be stored:', remarksData);
                
                await loanUser.update({
                    remarks: JSON.stringify(remarksData)
                }, { where: { laon_id: req.body.laon_id } });
                logger.debug('🔍 Login details stored in remarks field successfully');
                
                // Save to loginloan table
                try {
                    // Check if login record already exists for this loan
                    const existingLogin = await LoginLoan.findOne({
                        where: { laon_id: req.body.laon_id }
                    });
                    
                    const loginLoanData = {
                        laon_id: req.body.laon_id,
                        loanAmount: req.body.login_details?.loanAmount || null,
                        loanDate: req.body.login_details?.loanDate || null,
                        loanAccountNumber: req.body.login_details?.loanAccountNumber || null,
                        bankName: req.body.login_details?.bankName || null,
                        product: req.body.login_details?.product || null,
                        smName: req.body.login_details?.smName || null,
                        amName: req.body.login_details?.amName || null,
                        remarks_loan: req.body.login_details?.remarks_loan || null,
                        bankCode: req.body.login_details?.bankCode || null,
                        dateOfBirth: req.body.login_details?.dateOfBirth || null,
                        code_id: req.body.login_details?.code_id || null,
                        updated_by: req.user.id
                    };
                    
                    if (existingLogin) {
                        // Update existing record
                        await LoginLoan.update(loginLoanData, {
                            where: { laon_id: req.body.laon_id }
                        });
                        logger.debug('🔍 Login details updated in loginloan table successfully');
                    } else {
                        // Create new record
                        await LoginLoan.create(loginLoanData);
                        logger.debug('🔍 Login details saved to loginloan table successfully');
                    }
                } catch (error) {
                    logger.error('🔍 Error saving to loginloan table:', error);
                    // Don't throw error, just log it so the main update can continue
                }
            }
            // Handle pickup details - store in remarks field as JSON
            else if (req.body.status === "pickup") {
                logger.debug('🔍 [PICKUP] Status matched! Starting pickup processing...');
                try {
                    const pickupDetails = {
                        pickupDate: req.body.pickup_details?.pickupDate,
                        pickupRemarks: req.body.pickup_details?.pickupRemarks,
                        updated_at: new Date().toISOString()
                    };
                    
                    logger.debug('🔍 Processing pickup details:', pickupDetails);
                    
                    const remarksData = {
                        pickup_details: pickupDetails
                    };
                    
                    logger.debug('🔍 About to update loanUser with remarks:', JSON.stringify(remarksData));
                    
                    const updateResult = await loanUser.update({
                        remarks: JSON.stringify(remarksData)
                    }, { where: { laon_id: req.body.laon_id } });
                    
                    logger.debug('🔍 Pickup update result:', updateResult);
                    logger.debug('🔍 Pickup details stored in remarks field successfully');
                } catch (pickupError) {
                    logger.error('❌ Error updating pickup details:', pickupError);
                    throw pickupError; // Re-throw to be caught by outer try-catch
                }
            }
            // Handle query details - store in remarks field as JSON
            else if (req.body.status === "query") {
                const queryDetails = {
                    remarks: req.body.query_details?.remarks,
                    updated_at: new Date().toISOString()
                };
                
                logger.debug('🔍 Processing query details:', queryDetails);
                
                const remarksData = {
                    query_details: queryDetails
                };
                
                await loanUser.update({
                    remarks: JSON.stringify(remarksData)
                }, { where: { laon_id: req.body.laon_id } });
                logger.debug('🔍 Query details stored in remarks field successfully');
            }
            // Handle cancel details - store in remarks field as JSON
            else if (req.body.status === "cancel") {
                const cancelDetails = {
                    remarks_cancel: req.body.cancel_details?.remarks_cancel,
                    updated_at: new Date().toISOString()
                };
                
                logger.debug('🔍 Processing cancel details:', cancelDetails);
                
                const remarksData = {
                    cancel_details: cancelDetails
                };
                
                await loanUser.update({
                    remarks: JSON.stringify(remarksData)
                }, { where: { laon_id: req.body.laon_id } });
                logger.debug('🔍 Cancel details stored in remarks field successfully');
            }
            // Handle disbursement details - store in remarks field as JSON
            else if (req.body.status === "disbursement") {
                const disbursementDetails = {
                    disbursementAmount: req.body.disbursement_details?.disbursementAmount,
                    disbursementRate: req.body.disbursement_details?.disbursementRate,
                    insurance: req.body.disbursement_details?.insurance,
                    fileNumber: req.body.disbursement_details?.fileNumber,
                    disbursementDate: req.body.disbursement_details?.disbursementDate,
                    remark_dis: req.body.disbursement_details?.remark_dis,
                    insuranceAmount: req.body.disbursement_details?.insuranceAmount,
                    insuranceBankName: req.body.disbursement_details?.insuranceBankName,
                    insuranceType: req.body.disbursement_details?.insuranceType,
                    updated_at: new Date().toISOString()
                };
                
                logger.debug('🔍 Processing disbursement details:', disbursementDetails);
                
                const remarksData = {
                    disbursement_details: disbursementDetails
                };
                
                await loanUser.update({
                    remarks: JSON.stringify(remarksData)
                }, { where: { laon_id: req.body.laon_id } });
                logger.debug('🔍 Disbursement details stored in remarks field successfully');
            }
            // Handle part payment details - store in remarks field as JSON
            else if (req.body.status === "partPayment") {
                const partPaymentDetails = {
                    parts: req.body.part_details?.parts || [],
                    updated_at: new Date().toISOString()
                };
                
                logger.debug('🔍 Processing part payment details:', partPaymentDetails);
                
                const remarksData = {
                    part_details: partPaymentDetails
                };
                
                await loanUser.update({
                    remarks: JSON.stringify(remarksData)
                }, { where: { laon_id: req.body.laon_id } });
                logger.debug('🔍 Part payment details stored in remarks field successfully');
            }
            // Handle completed details - store in remarks field as JSON
            else if (req.body.status === "completed") {
                const completedDetails = {
                    completionDate: req.body.completed_details?.completionDate,
                    completionRemarks: req.body.completed_details?.completionRemarks,
                    updated_at: new Date().toISOString()
                };
                
                logger.debug('🔍 Processing completed details:', completedDetails);
                
                const remarksData = {
                    completed_details: completedDetails
                };
                
                await loanUser.update({
                    remarks: JSON.stringify(remarksData)
                }, { where: { laon_id: req.body.laon_id } });
                logger.debug('🔍 Completed details stored in remarks field successfully');
            }
            // Handle document selected details - store in remarks field as JSON
            else if (req.body.status === "documentselected") {
                const documentDetails = {
                    loan_type: req.body.document_details?.loan_type,
                    loan_type_name: req.body.document_details?.loan_type_name,
                    remarks_docs: req.body.document_details?.remarks_docs,
                    updated_at: new Date().toISOString()
                };
                
                logger.debug('🔍 Processing document details:', documentDetails);
                
                const remarksData = {
                    document_details: documentDetails
                };
                
                await loanUser.update({
                    remarks: JSON.stringify(remarksData)
                }, { where: { laon_id: req.body.laon_id } });
                logger.debug('🔍 Document details stored in remarks field successfully');
            }
            else {
                logger.debug('🔍 No specific details to process for status:', req.body.status);
            }
        }
        return res.status(200).send({ response: "User successfully updated!", status: true });
    } catch (e) {
        logger.error('❌ Error in updateLoanConsumerData:', e);
        return res.status(500).send({ response: "An error occurred", status: false });
    }
};

/**
 * POST /user/data/consumer/family/add
 * Add a family member as a full user linked to the household head.
 * Body: { head_user_id, username, phone_number, email?, referenceName?,
 *         category?: [{ category_id, user_role_id }] }
 */
exports.addFamilyMember = async (req, res) => {
  try {
    const { head_user_id, username, phone_number, email, referenceName, category } = req.body;
    if (!head_user_id || !username || !phone_number) {
      return res.status(400).send({ message: "head_user_id, username and phone_number are required", status: false });
    }

    const head = await User.findOne({ where: { user_id: head_user_id } });
    if (!head) return res.status(404).send({ message: "Head consumer not found", status: false });
    // If the given head is itself a member, link to its head (single level).
    const headId = head.family_head_id || head.user_id;

    // A member is a full user identified by their own mobile. Reuse if exists.
    let member = await User.findOne({ where: { mobileNumber: phone_number } });
    if (member) {
      if (!member.family_head_id && member.user_id !== headId) {
        await User.update({ family_head_id: headId }, { where: { user_id: member.user_id } });
        member.family_head_id = headId;
      }
    } else {
      member = await User.create({
        username,
        email: email || "",
        mobileNumber: phone_number,
        referenceName: referenceName || null,
        role_id: ROLE_IDS.CONSUMER,
        family_head_id: headId,
        created_by: req.user && req.user.id,
      });
    }

    // Map the member to the requested verticals.
    if (Array.isArray(category) && category.length) {
      const existing = await consumerRoleMapping.findAll({ where: { user_consumer_id: member.user_id } });
      const toCreate = category
        .filter((cat) => !existing.some((m) => m.category_id === cat.category_id))
        .map((cat) => ({
          user_role_id: cat.user_role_id || (req.user && req.user.id),
          user_consumer_id: member.user_id,
          category_id: cat.category_id,
        }));
      if (toCreate.length) await consumerRoleMapping.bulkCreate(toCreate);
    }

    return res.status(200).send({ message: "Family member added", data: member, status: true });
  } catch (e) {
    logger.error({ err: e }, "addFamilyMember failed");
    return res.status(400).send({ message: "error adding family member", status: false });
  }
};

/**
 * GET /user/household/:mobile
 * Resolve the household by any member's mobile and return the head + all members
 * with their policies (vehicle/loan/mediclaim/life).
 */
exports.getHousehold = async (req, res) => {
  try {
    const mobile = req.params.mobile;
    const user = await User.findOne({ where: { mobileNumber: mobile }, raw: true });
    if (!user) return res.status(404).send({ message: "No consumer with that mobile", status: false });

    const headId = user.family_head_id || user.user_id;

    const members = await User.findAll({
      where: { [Op.or]: [{ user_id: headId }, { family_head_id: headId }] },
      attributes: ["user_id", "username", "email", "mobileNumber", "family_head_id", "role_id"],
      raw: true,
    });
    const ids = members.map((m) => m.user_id);

    const [vehicles, loans, mediclaims, lifes] = await Promise.all([
      vehicleUser.findAll({ where: { user_id: ids }, raw: true }),
      loanUser.findAll({ where: { user_id: ids }, raw: true }),
      Mediclaim.findAll({ where: { user_id: ids }, raw: true }),
      LifeInsurance.findAll({ where: { user_id: ids }, raw: true }),
    ]);

    const groupBy = (arr) =>
      arr.reduce((acc, r) => { (acc[r.user_id] = acc[r.user_id] || []).push(r); return acc; }, {});
    const v = groupBy(vehicles), l = groupBy(loans), m = groupBy(mediclaims), li = groupBy(lifes);

    const data = members.map((mem) => ({
      ...mem,
      isHead: mem.user_id === headId,
      policies: {
        vehicle: v[mem.user_id] || [],
        loan: l[mem.user_id] || [],
        mediclaim: m[mem.user_id] || [],
        life: li[mem.user_id] || [],
      },
    }));

    return res.status(200).send({
      message: "household get success",
      data: { head_user_id: headId, members: data },
      status: true,
    });
  } catch (e) {
    logger.error({ err: e }, "getHousehold failed");
    return res.status(400).send({ message: "error fetching household", status: false });
  }
};

/**
 * GET /user/consumer/documents/:userId
 * The consumer's stored KYC documents (Aadhar/PAN/GST...). Policy forms call
 * this to show what's already attached and only prompt for missing ones.
 */
exports.getConsumerDocuments = async (req, res) => {
  try {
    const userId = req.params.userId;
    const docs = await ConsumerDocument.findAll({
      where: { user_id: userId },
      include: [{ model: documents, attributes: ["doc_name"] }],
      raw: true,
      nest: true,
    });
    return res.status(200).send({ message: "consumer documents", data: docs, status: true });
  } catch (e) {
    logger.error({ err: e }, "getConsumerDocuments failed");
    return res.status(400).send({ message: "error fetching documents", status: false });
  }
};

/**
 * GET /user/consumer/documents/by-mobile/:mobile
 * Same as getConsumerDocuments but resolves the consumer by mobile (policy forms
 * have the mobile, not the user_id). Returns [] if no such consumer yet.
 */
exports.getConsumerDocumentsByMobile = async (req, res) => {
  try {
    const user = await User.findOne({ where: { mobileNumber: req.params.mobile }, raw: true });
    if (!user) return res.status(200).send({ message: "no consumer", data: [], status: true });
    const docs = await ConsumerDocument.findAll({
      where: { user_id: user.user_id },
      include: [{ model: documents, attributes: ["doc_name"] }],
      raw: true,
      nest: true,
    });
    return res.status(200).send({ message: "consumer documents", data: docs, user_id: user.user_id, status: true });
  } catch (e) {
    logger.error({ err: e }, "getConsumerDocumentsByMobile failed");
    return res.status(400).send({ message: "error fetching documents", status: false });
  }
};

/**
 * POST /user/consumer/documents/upload  (multipart: file, user_id, categoryId)
 * Store/replace a single consumer-level KYC document.
 */
exports.uploadConsumerDocument = async (req, res) => {
  try {
    const { user_id, categoryId } = req.body;
    if (!user_id || !categoryId) {
      return res.status(400).send({ message: "user_id and categoryId are required", status: false });
    }
    if (!req.files || !req.files.file) {
      return res.status(400).send({ message: "file is required", status: false });
    }
    const uniqueName = await saveUpload(req.files.file); // universal upload helper
    const doc = await upsertConsumerDocument(user_id, categoryId, uniqueName);
    return res.status(200).send({ message: "Document saved", data: doc, status: true });
  } catch (e) {
    logger.error({ err: e }, "uploadConsumerDocument failed");
    return res.status(400).send({ message: "error saving document", status: false });
  }
};

