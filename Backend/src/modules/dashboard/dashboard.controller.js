const { ROLE_IDS, CATEGORY_IDS } = require("../../config/ids");
/**
 * dashboard controller — extracted from the legacy user.controller monolith.
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
const dashboardService = require("./dashboard.service");
const logger = require("../../config/logger");

exports.getUserCounts = async (req, res) => {
    try {
        const consumerWhereObj = {};
        const builderWhereObj = { role_id: ROLE_IDS.BUILDER_CONSUMER }; // Builder consumers keep role_id 5
        const mediclaimWhereObj = {};
        const loanUserWhereObj = {};
        const loanInterstedUserWhereObj = {
            status: {
                [Op.notIn]: ["notAssign", "notInterested", "completed"],
            }
        };
        const loanDocumentSelectedUserWhereObj = { status: 'documentselected' };
        const loanPickupUserWhereObj = { status: 'pickup' };
        const loanQueryUserWhereObj = { status: 'query' };
        const loanLoginUserWhereObj = { status: 'login' };
        const loanSensonUserWhereObj = { status: 'sanction' };
        const loanNotInterstedUserWhereObj = { status: 'notInterested' };
        const loanNotAssignUserWhereObj = { status: 'notAssign' };
        const loanDisburseUserWhereObj = { status: 'disbursement' };
        const loanPartUserWhereObj = { status: 'partPayment' };
        const loanCancelUserWhereObj = { status: 'cancel' };
        const loanCompletedUserWhereObj = { status: 'completed' };

        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        // Adding filters for today's total loan and disbursed amount
        const totalDisbursedFilter = { disbursementDate: { [Op.between]: [startOfDay, endOfDay] } };
        const totalLoanedFilter = { loanDate: { [Op.between]: [startOfDay, endOfDay] } };
        const totalPartPaymentFilter = { part_date: { [Op.between]: [startOfDay, endOfDay] } };
        
        // Also get all-time amounts as fallback
        const allTimeDisbursedFilter = {};
        const allTimeLoanedFilter = {};
        const allTimePartPaymentFilter = {};

        // Get all building manager user IDs to exclude them from loan counts
        const buildingManagerUsers = await User.findAll({
            where: { role_id: ROLE_IDS.BUILDING_MANAGER },
            attributes: ['user_id'],
            raw: true
        });
        const buildingManagerUserIds = buildingManagerUsers.map(bm => bm.user_id);
        logger.debug('🔍 [USER COUNTS] Building manager user IDs to exclude:', buildingManagerUserIds);

        // Exclude building managers from all loan user where objects
        if (buildingManagerUserIds.length > 0) {
            loanUserWhereObj.user_id = { [Op.notIn]: buildingManagerUserIds };
            loanInterstedUserWhereObj.user_id = { [Op.notIn]: buildingManagerUserIds };
            loanNotInterstedUserWhereObj.user_id = { [Op.notIn]: buildingManagerUserIds };
            loanNotAssignUserWhereObj.user_id = { [Op.notIn]: buildingManagerUserIds };
            loanDocumentSelectedUserWhereObj.user_id = { [Op.notIn]: buildingManagerUserIds };
            loanPickupUserWhereObj.user_id = { [Op.notIn]: buildingManagerUserIds };
            loanQueryUserWhereObj.user_id = { [Op.notIn]: buildingManagerUserIds };
            loanLoginUserWhereObj.user_id = { [Op.notIn]: buildingManagerUserIds };
            loanSensonUserWhereObj.user_id = { [Op.notIn]: buildingManagerUserIds };
            loanDisburseUserWhereObj.user_id = { [Op.notIn]: buildingManagerUserIds };
            loanPartUserWhereObj.user_id = { [Op.notIn]: buildingManagerUserIds };
            loanCancelUserWhereObj.user_id = { [Op.notIn]: buildingManagerUserIds };
            loanCompletedUserWhereObj.user_id = { [Op.notIn]: buildingManagerUserIds };
        }

        if (req.user.Role === ROLE_IDS.STAFF) {
            loanUserWhereObj.role_id = req.user.id;
            loanInterstedUserWhereObj.role_id = req.user.id;
            loanNotInterstedUserWhereObj.role_id = req.user.id;
            loanNotAssignUserWhereObj.role_id = req.user.id;
            loanDocumentSelectedUserWhereObj.role_id = req.user.id;
            loanPickupUserWhereObj.role_id = req.user.id;
            loanQueryUserWhereObj.role_id = req.user.id;
            loanLoginUserWhereObj.role_id = req.user.id;
            loanSensonUserWhereObj.role_id = req.user.id;
            loanDisburseUserWhereObj.role_id = req.user.id;
            loanPartUserWhereObj.role_id = req.user.id;
            loanCancelUserWhereObj.role_id = req.user.id;
            loanCompletedUserWhereObj.role_id = req.user.id;
        }

        // Filter for consumers based on role
        if (req?.user.Role === ROLE_IDS.BUILDER) {
            consumerWhereObj.builder_user = req.user.id; // Only consumers linked to the builder user.
        }
        consumerWhereObj.role_id = [3, 5]; // Consumer and builder consumer roles
        

        // Calculate dates for expiry counts
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        
        const nextMonth = new Date(today);
        nextMonth.setMonth(today.getMonth() + 1);
        
        const nextYear = new Date(today);
        nextYear.setFullYear(today.getFullYear() + 1);

        // Execute all counts in parallel using Promise.all
        // Check if user is Super Admin (role_id === ROLE_IDS.SUPER_ADMIN OR has Super Admin category access)
        const isSuperAdmin = req.user.Role === ROLE_IDS.SUPER_ADMIN || (req.user.categoryIds && req.user.categoryIds.includes(ROLE_IDS.SUPER_ADMIN));
        
        logger.debug('🔍 [USER COUNTS] User Role:', req.user.Role);
        logger.debug('🔍 [USER COUNTS] User categoryIds:', req.user.categoryIds);
        logger.debug('🔍 [USER COUNTS] Is Super Admin:', isSuperAdmin);
        
        if (isSuperAdmin) {
            const [
                consumerCount, 
                builderUserCount, 
                loanUserCount, 
                loanInterstedUserCount, 
                loanNotInterstedUserCount, 
                loanNotAssignUserCount, 
                loanDisburseUserCount, 
                loanDocumentUserCount, 
                loanPickupUserCount, 
                loanQueryUserCount, 
                loanLoginUserCount, 
                loanSensonUserCount, 
                loanPartUserCount, 
                loanPartCancelCount, 
                loanCompletedUserCount, 
                mediclaimUserCount,
                mediclaimExpiringThisWeek,
                mediclaimExpiringThisMonth,
                mediclaimExpiringThisYear,
                totalDisbursedAmount, 
                totalLoandAmount,
                totalPartPaymentAmount,
                // All-time amounts as fallback
                allTimeDisbursedAmount,
                allTimeLoandAmount,
                allTimePartPaymentAmount,
                vehicleUserCount, // <-- count all vehicle users (same as admin)
                lifeUserCount // <-- add life insurance count here
            ] = await Promise.all([
                User.count({ where: consumerWhereObj }),
                User.count({ where: builderWhereObj }),
                // Count loan consumers from role mapping, excluding building managers
                consumerRoleMapping.count({ 
                    where: { 
                        category_id: CATEGORY_IDS.LOAN,
                        ...(buildingManagerUserIds.length > 0 && {
                            user_consumer_id: { [Op.notIn]: buildingManagerUserIds }
                        })
                    } 
                }),
                loanUser.count({ where: loanInterstedUserWhereObj }),
                loanUser.count({ where: loanNotInterstedUserWhereObj }),
                loanUser.count({ where: loanNotAssignUserWhereObj }),
                loanUser.count({ where: loanDisburseUserWhereObj }),
                loanUser.count({ where: loanDocumentSelectedUserWhereObj }),
                loanUser.count({ where: loanPickupUserWhereObj }),
                loanUser.count({ where: loanQueryUserWhereObj }),
                loanUser.count({ where: loanLoginUserWhereObj }),
                loanUser.count({ where: loanSensonUserWhereObj }),
                loanUser.count({ where: loanPartUserWhereObj }),
                loanUser.count({ where: loanCancelUserWhereObj }),
                loanUser.count({ where: loanCompletedUserWhereObj }),
                consumerRoleMapping.count({ where: { category_id: CATEGORY_IDS.MEDICLAIM } }), // Count mediclaim consumers from role mapping
                RunningPolicies.count({ 
                    where: { 
                        ExpiryDate: { 
                            [Op.between]: [today.toISOString().split('T')[0], nextWeek.toISOString().split('T')[0]]
                        }
                    }
                }),
                RunningPolicies.count({ 
                    where: { 
                        ExpiryDate: { 
                            [Op.between]: [today.toISOString().split('T')[0], nextMonth.toISOString().split('T')[0]]
                        }
                    }
                }),
                RunningPolicies.count({ 
                    where: { 
                        ExpiryDate: { 
                            [Op.between]: [today.toISOString().split('T')[0], nextYear.toISOString().split('T')[0]]
                        }
                    }
                }),
                DisbursementLoan.sum('disbursementAmount', { where: totalDisbursedFilter }),
                LoginLoan.sum('loanAmount', { where: totalLoanedFilter }),
                PartPaymentLoan.sum('part_amount', { where: totalPartPaymentFilter }),
                // All-time amounts as fallback
                DisbursementLoan.sum('disbursementAmount', { where: allTimeDisbursedFilter }),
                LoginLoan.sum('loanAmount', { where: allTimeLoanedFilter }),
                PartPaymentLoan.sum('part_amount', { where: allTimePartPaymentFilter }),
                consumerRoleMapping.count({ where: { category_id: CATEGORY_IDS.VEHICLE } }), // <-- count all vehicle users (same as admin)
                consumerRoleMapping.count({ where: { category_id: CATEGORY_IDS.LIFE_INSURANCE } }) // <-- count all life insurance users
            ]);

            logger.debug('🔍 [COUNTS DEBUG] ===== USER COUNTS RESULTS =====');
            logger.debug('🔍 [COUNTS DEBUG] Total Consumer Count:', consumerCount);
            logger.debug('🔍 [COUNTS DEBUG] Mediclaim Consumer Count:', mediclaimUserCount);
            logger.debug('🔍 [COUNTS DEBUG] Vehicle Consumer Count:', vehicleUserCount);
            logger.debug('🔍 [COUNTS DEBUG] Life Insurance Consumer Count:', lifeUserCount);
            logger.debug('🔍 [COUNTS DEBUG] Loan Consumer Count:', loanUserCount);
            logger.debug('🔍 [COUNTS DEBUG] Loan Interested Count:', loanInterstedUserCount);
            logger.debug('🔍 [COUNTS DEBUG] Loan Not Interested Count:', loanNotInterstedUserCount);
            logger.debug('🔍 [COUNTS DEBUG] Loan Completed Count:', loanCompletedUserCount);
            logger.debug('🔍 [COUNTS DEBUG] Loan Not Assigned Count:', loanNotAssignUserCount);
            logger.debug('🔍 [COUNTS DEBUG] ===== AMOUNT VALUES =====');
            logger.debug('🔍 [COUNTS DEBUG] Today - Total Loan Amount:', totalLoandAmount);
            logger.debug('🔍 [COUNTS DEBUG] Today - Total Disbursed Amount:', totalDisbursedAmount);
            logger.debug('🔍 [COUNTS DEBUG] Today - Total Part Payment Amount:', totalPartPaymentAmount);
            logger.debug('🔍 [COUNTS DEBUG] All-time - Total Loan Amount:', allTimeLoandAmount);
            logger.debug('🔍 [COUNTS DEBUG] All-time - Total Disbursed Amount:', allTimeDisbursedAmount);
            logger.debug('🔍 [COUNTS DEBUG] All-time - Total Part Payment Amount:', allTimePartPaymentAmount);
            logger.debug('🔍 [COUNTS DEBUG] Final - Total Loan Amount:', totalLoandAmount || allTimeLoandAmount || 0);
            logger.debug('🔍 [COUNTS DEBUG] Final - Total Disbursed Amount:', totalDisbursedAmount || allTimeDisbursedAmount || 0);
            logger.debug('🔍 [COUNTS DEBUG] Final - Total Part Payment Amount:', totalPartPaymentAmount || allTimePartPaymentAmount || 0);
            logger.debug('🔍 [COUNTS DEBUG] ======================================');

            const responseData = {
                message: "Counts fetched successfully",
                data: {
                    consumerCount,
                    builderUserCount,
                    loanUserCount,
                    loanInterstedUserCount,
                    loanNotInterstedUserCount,
                    loanNotAssignUserCount,
                    loanDisburseUserCount,
                    loanDocumentUserCount,
                    loanPartCancelCount,
                    loanPickupUserCount,
                    loanQueryUserCount,
                    loanLoginUserCount,
                    loanSensonUserCount,
                    loanPartUserCount,
                    totalLoandAmount: totalLoandAmount || allTimeLoandAmount || 0,
                    loanCompletedUserCount,
                    totalDisbursedAmount: totalDisbursedAmount || allTimeDisbursedAmount || 0,
                    totalPartPaymentAmount: totalPartPaymentAmount || allTimePartPaymentAmount || 0,
                    mediclaimUserCount,
                    mediclaimExpiringThisWeek,
                    mediclaimExpiringThisMonth,
                    mediclaimExpiringThisYear,
                    vehicleUserCount, // <-- use the counted value
                    lifeUserCount, // <-- use the actual counted value
                    categoryCounts: {
                        'Super Admin': 0,
                        'Loan': loanUserCount,
                        'Mediclaim': mediclaimUserCount,
                        'Life Insurance': lifeUserCount,
                        'Vehicle Insurance': vehicleUserCount
                    }
                }
            };

            logger.debug('🔍 [COUNTS DEBUG] ===== CATEGORY COUNTS SENT TO FRONTEND =====');
            logger.debug('🔍 [COUNTS DEBUG] Category Counts:', responseData.data.categoryCounts);
            logger.debug('🔍 [COUNTS DEBUG] ===============================================');

            res.status(200).send(responseData);
        } else if (req.user.Role === ROLE_IDS.BUILDER) {
            const [consumerCount, builderUserCount, lifeUserCount] = await Promise.all([
                User.count({ where: consumerWhereObj }),
                User.count({ where: builderWhereObj }),
                consumerRoleMapping.count({ where: { category_id: CATEGORY_IDS.LIFE_INSURANCE } }) // <-- count life insurance users
            ]);

            // Send the combined counts
            res.status(200).send({
                message: "Counts fetched successfully",
                data: {
                    consumerCount,
                    builderUserCount,
                    loanUserCount: 0,
                    loanInterstedUserCount: 0,
                    loanNotInterstedUserCount: 0,
                    loanNotAssignUserCount: 0,
                    loanDisburseUserCount: 0,
                    loanDocumentUserCount: 0,
                    loanPartCancelCount: 0,
                    loanPickupUserCount: 0,
                    loanQueryUserCount: 0,
                    loanLoginUserCount: 0,
                    loanSensonUserCount: 0,
                    loanPartUserCount: 0,
                    totalLoandAmount: 0,
                    loanCompletedUserCount: 0,
                    totalDisbursedAmount: 0,
                    totalPartPaymentAmount: 0,
                    mediclaimUserCount: 0,
                    mediclaimExpiringThisWeek: 0,
                    mediclaimExpiringThisMonth: 0,
                    mediclaimExpiringThisYear: 0,
                    vehicleUserCount: 0,
                    lifeUserCount // <-- use actual count
                },
                status: true,
            });
        } else if (req.user.Role === ROLE_IDS.STAFF) {
            // Fetch categories assigned to this user
            const assignedCategories = await userCatergory.findAll({
                where: { user_id: req.user.id },
                include: [{ model: Category, attributes: ["category_id", "category_name"] }],
                raw: true,
            });

            // Prepare counts for each assigned category
            let categoryCounts = {};
            for (const cat of assignedCategories) {
                const categoryId = cat["category.category_id"];
                const categoryName = cat["category.category_name"];
                let count = 0;
                if (categoryId == 2) { // Loan
                    // Exclude building managers from loan count (reuse buildingManagerUserIds from top of function)
                    count = await consumerRoleMapping.count({
                        where: { 
                            category_id: CATEGORY_IDS.LOAN,
                            ...(buildingManagerUserIds.length > 0 && {
                                user_consumer_id: { [Op.notIn]: buildingManagerUserIds }
                            })
                        },
                    });
                } else if (categoryId == 4) { // Mediclaim
                    count = await consumerRoleMapping.count({
                        where: { user_role_id: req.user.id, category_id: CATEGORY_IDS.MEDICLAIM },
                    });
                } else if (categoryId == 6) { // Vehicle
                    count = await consumerRoleMapping.count({
                        where: { category_id: CATEGORY_IDS.VEHICLE }, // Show total count, not just assigned
                    });
                } else if (categoryId == 5) { // Life Insurance
                    count = await consumerRoleMapping.count({
                        where: { category_id: CATEGORY_IDS.LIFE_INSURANCE }, // Show total count, not just assigned
                    });
                } // Add more categories as needed
                categoryCounts[categoryName] = count;
            }

            // You can also keep the old counts if needed, or just return categoryCounts
            res.status(200).send({
                message: "Counts fetched successfully",
                data: {
                    categoryCounts,
                },
                status: true,
            });
        } else {
            // Send the combined counts
            res.status(200).send({
                message: "Counts fetched successfully",
                data: {
                    consumerCount: 0,
                    builderUserCount: 0,
                    loanUserCount: 0,
                    loanInterstedUserCount: 0,
                    loanNotInterstedUserCount: 0,
                    loanNotAssignUserCount: 0,
                    loanDisburseUserCount: 0,
                    loanDocumentUserCount: 0,
                    loanPartCancelCount: 0,
                    loanPickupUserCount: 0,
                    loanQueryUserCount: 0,
                    loanLoginUserCount: 0,
                    loanSensonUserCount: 0,
                    loanPartUserCount: 0,
                    totalLoandAmount: 0,
                    loanCompletedUserCount: 0,
                    totalDisbursedAmount: 0,
                    totalPartPaymentAmount: 0,
                    mediclaimUserCount: 0,
                    mediclaimExpiringThisWeek: 0,
                    mediclaimExpiringThisMonth: 0,
                    mediclaimExpiringThisYear: 0,
                    vehicleUserCount: 0,
                    lifeUserCount: 0
                },
                status: true,
            });

        }



    } catch (error) {
        logger.error(error);
        res.status(500).send({
            message: "Error fetching counts",
            error: error.message,
            status: false,
        });
    }
};




exports.getLoanAmounFilterDate = async (req, res) => {
    try {

        const startDay = new Date(req.body.start_date);
        const endDay = new Date(req.body.end_date);

        const startOfDay = new Date(startDay.setHours(0, 0, 0, 0));
        const endOfDay = new Date(endDay.setHours(23, 59, 59, 999));

        // Execute the aggregate sums (admins only).
        if (req.user.Role === ROLE_IDS.SUPER_ADMIN) {
            const data = await dashboardService.sumLoanAmounts(startOfDay, endOfDay);
            res.status(200).send({
                message: "Counts fetched successfully",
                data,
                status: true,
            });
        } else {
            // Send the combined counts
            res.status(200).send({
                message: "Counts fetched successfully",
                data: {
                    totalLoandAmount: 0,
                    totalDisbursedAmount: 0,
                    totalPartPaymentAmount: 0
                },
                status: true,
            });

        }

    } catch (error) {
        logger.error(error);
        res.status(500).send({
            message: "Error fetching counts",
            error: error.message,
            status: false,
        });
    }
};



exports.getConsumerDashboardData = async (req, res) => {
    try {
        const userId = req.user.id; // Get user_id from authenticated user (from JWT)
        logger.debug('🔍 [CONSUMER DASHBOARD] Fetching data for user_id:', userId);
        logger.debug('🔍 [CONSUMER DASHBOARD] User Role from JWT:', req.user.Role);

        // Check if user is a consumer (role_id 3) - check both JWT and database
        if (req.user.Role !== ROLE_IDS.CONSUMER) {
            return res.status(403).json({
                message: "Access denied. This endpoint is only for consumers.",
                status: false
            });
        }

        // Verify user exists in database
        const user = await User.findOne({
            where: { user_id: userId },
            attributes: ['user_id', 'username', 'email', 'mobileNumber', 'role_id'],
            raw: true
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                status: false
            });
        }

        // Double-check role from database
        if (user.role_id !== ROLE_IDS.CONSUMER) {
            return res.status(403).json({
                message: "Access denied. This endpoint is only for consumers.",
                status: false
            });
        }

        // Fetch vehicles associated with this consumer
        const vehicles = await vehicleUser.findAll({
            where: { user_id: userId },
            attributes: [
                'vehicle_user_id',
                'vehicle_number',
                'make',
                'model',
                'manufacturing_year',
                'vehicle_policy_type',
                'company_name',
                'status',
                'createdAt',
                'updatedAt'
            ],
            include: [
                {
                    model: vehcileRunningPolicy,
                    as: 'runningPolicy',
                    required: false
                },
                {
                    model: vehiclePreviousPolicy,
                    as: 'previousPolicies',
                    required: false
                }
            ],
            raw: false
        });

        // Fetch mediclaim associated with this consumer
        const mediclaim = await Mediclaim.findAll({
            where: { user_id: userId },
            attributes: [
                'id',
                'medicliam_type',
                'medicliam_policy_type',
                'sumInsured',
                'noClaimBonus',
                'agentName',
                'agentCode',
                'createdAt',
                'updatedAt'
            ],
            include: [
                {
                    model: MediclaimCompany,
                    attributes: ['mediclaim_company_name']
                },
                {
                    model: RunningPolicies,
                    required: false
                },
                {
                    model: PreviousPolicies,
                    required: false
                },
                {
                    model: FamilyMember,
                    as: 'familymembers',
                    required: false
                },
                {
                    model: EmployeeMediclaim,
                    as: 'employees',
                    required: false
                }
            ],
            raw: false
        });

        // Fetch loans associated with this consumer
        const loans = await loanUser.findAll({
            where: { user_id: userId },
            attributes: [
                'laon_id',
                'user_id',
                'status',
                'createdAt',
                'updatedAt'
            ],
            include: [
                {
                    model: LoginLoan,
                    required: false
                },
                {
                    model: property,
                    required: false
                },
                {
                    model: SanctionLoan,
                    required: false
                },
                {
                    model: DisbursementLoan,
                    required: false
                }
            ],
            raw: false
        });

        // Convert Sequelize instances to plain objects
        const vehiclesData = vehicles.map(v => v.get({ plain: true }));
        const mediclaimData = mediclaim.map(m => m.get({ plain: true }));
        const loansData = loans.map(l => l.get({ plain: true }));

        return res.status(200).json({
            message: "Consumer dashboard data retrieved successfully",
            status: true,
            data: {
                user: {
                    user_id: user.user_id,
                    username: user.username,
                    email: user.email,
                    mobileNumber: user.mobileNumber
                },
                vehicles: vehiclesData,
                mediclaim: mediclaimData,
                loans: loansData,
                summary: {
                    totalVehicles: vehiclesData.length,
                    totalMediclaim: mediclaimData.length,
                    totalLoans: loansData.length
                }
            }
        });
    } catch (error) {
        logger.error('❌ [CONSUMER DASHBOARD] Error:', error);
        return res.status(500).json({
            message: "Error fetching consumer dashboard data",
            status: false,
            error: error.message
        });
    }
};

