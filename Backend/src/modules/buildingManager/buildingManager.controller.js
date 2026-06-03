/**
 * buildingManager controller — extracted from the legacy user.controller monolith.
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

exports.createBuildingManager = async (req, res) => {
    try {
        const { 
            username, 
            email, 
            mobileNumber, 
            unit_id, 
            address = '',
            pincode = '',
            city = '',
            state = '',
            created_by 
        } = req.body;
        
        // Validate required fields
        if (!username || !email || !mobileNumber || !unit_id) {
            return res.status(400).json({
                status: false,
                message: 'Username, email, mobile number, and unit_id are required'
            });
        }

        // Check if user with same email or mobile already exists
        const existingUser = await User.findOne({
            where: {
                [Op.or]: [
                    { email: email },
                    { mobileNumber: mobileNumber }
                ]
            }
        });

        if (existingUser) {
            return res.status(400).json({
                status: false,
                message: 'User with this email or mobile number already exists'
            });
        }

        // Check if building already has a manager
        const existingManager = await BuildingManager.findOne({
            where: { unit_id, status: 'active' }
        });

        if (existingManager) {
            return res.status(400).json({
                status: false,
                message: 'This building already has an active manager'
            });
        }

        // Create building manager user
        const buildingManagerUser = await User.create({
            username: username.trim(),
            email: email.trim(),
            mobileNumber: mobileNumber.trim(),
            password: 'BuildingManager@123', // Default password
            role_id: 7, // Building Manager role
            referenceName: 'Building Manager',
            referenceMobileNumber: '',
            referenceEmail: '',
            address: address,
            pincode: pincode,
            city: city,
            state: state,
            created_by: created_by || 1
        });

        // Assign manager to building
        const buildingManagerAssignment = await BuildingManager.create({
            user_id: buildingManagerUser.user_id,
            unit_id: unit_id,
            assigned_by: created_by || 1,
            status: 'active',
            assigned_date: new Date()
        });

        // Create notification
        await createNotification({
            title: 'Building Manager Created',
            message: `Building manager ${username} has been created and assigned to building ID: ${unit_id}`,
            type: 'system',
            category: 'building_manager_created',
            user_id: buildingManagerUser.user_id,
            is_important: true
        });

        res.status(201).json({
            status: true,
            message: 'Building manager created and assigned successfully',
            data: {
                user: buildingManagerUser,
                assignment: buildingManagerAssignment
            }
        });
    } catch (error) {
        console.error('Error creating building manager:', error);
        res.status(500).json({
            status: false,
            message: 'Error creating building manager',
            error: error.message
        });
    }
};


exports.assignBuildingManager = async (req, res) => {
    try {
        const { user_id, unit_id } = req.body;
        
        if (!user_id || !unit_id) {
            return res.status(400).json({
                status: false,
                message: 'User ID and Unit ID are required'
            });
        }

        // Check if building already has a manager
        const existingManager = await BuildingManager.findOne({
            where: { unit_id, status: 'active' }
        });

        if (existingManager) {
            return res.status(400).json({
                status: false,
                message: 'This building already has an active manager'
            });
        }

        // Check if user is already a building manager
        const userAlreadyManager = await BuildingManager.findOne({
            where: { user_id, status: 'active' }
        });

        if (userAlreadyManager) {
            return res.status(400).json({
                status: false,
                message: 'This user is already managing another building'
            });
        }

        const buildingManager = await BuildingManager.create({
            user_id,
            unit_id,
            assigned_by: req.user.id,
            status: 'active',
            assigned_date: new Date()
        });

        // Create notification
        await createNotification({
            title: 'Building Manager Assigned',
            message: `You have been assigned as building manager for building ID: ${unit_id}`,
            type: 'system',
            category: 'building_manager_assigned',
            user_id: user_id,
            is_important: true
        });

        res.status(201).json({
            status: true,
            message: 'Building manager assigned successfully',
            data: buildingManager
        });
    } catch (error) {
        console.error('Error assigning building manager:', error);
        res.status(500).json({
            status: false,
            message: 'Error assigning building manager',
            error: error.message
        });
    }
};


exports.getAllBuildingManagers = async (req, res) => {
    try {
        const buildingManagers = await BuildingManager.findAll({
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['user_id', 'username', 'email', 'mobileNumber']
                },
                {
                    model: db.unit,
                    as: 'unit',
                    attributes: ['unit_id', 'unit_name', 'address']
                }
            ],
            where: { status: 'active' }
        });

        res.status(200).json({
            status: true,
            message: 'Building managers retrieved successfully',
            data: buildingManagers
        });
    } catch (error) {
        console.error('Error fetching building managers:', error);
        res.status(500).json({
            status: false,
            message: 'Error fetching building managers',
            error: error.message
        });
    }
};


exports.getBuildingManagerStats = async (req, res) => {
    try {
        const totalBuildingManagers = await BuildingManager.count({
            where: { status: 'active' }
        });

        const buildingsWithManagers = await BuildingManager.count({
            where: { status: 'active' },
            distinct: true,
            col: 'unit_id'
        });

        const totalBuildings = await db.unit.count();
        const buildingsWithoutManagers = totalBuildings - buildingsWithManagers;

        const stats = {
            totalBuildingManagers,
            buildingsWithManagers,
            buildingsWithoutManagers,
            totalBuildings,
            averageBuildingsPerManager: totalBuildingManagers > 0 ? (totalBuildings / totalBuildingManagers).toFixed(2) : 0
        };

        res.status(200).json({
            status: true,
            message: 'Building manager statistics retrieved successfully',
            data: stats
        });
    } catch (error) {
        console.error('Error fetching building manager stats:', error);
        res.status(500).json({
            status: false,
            message: 'Error fetching building manager statistics',
            error: error.message
        });
    }
};


exports.getBuildingManagerDashboardStats = async (req, res) => {
    try {
        // Check if user is a building manager (Role 7)
        if (req.user.Role !== 7) {
            return res.status(403).json({
                status: false,
                message: 'Access denied. Only building managers can access this endpoint.'
            });
        }

        // Get all units assigned to this building manager
        const buildingManagerAssignments = await BuildingManager.findAll({
            where: { 
                user_id: req.user.id, 
                status: 'active' 
            },
            attributes: ['unit_id'],
            raw: true
        });

        if (buildingManagerAssignments.length === 0) {
            return res.status(200).json({
                status: true,
                message: 'No buildings assigned to this building manager',
                data: {
                    disbursement: 0,
                    cancel: 0,
                    onProcess: 0,
                    completed: 0,
                    notInterested: 0,
                    total: 0
                }
            });
        }

        const unitIds = buildingManagerAssignments.map(assignment => assignment.unit_id);
        console.log('🔍 [BUILDING MANAGER DASHBOARD] Assigned unit IDs:', unitIds);

        // Get all consumer user IDs from these units
        const consumersInBuildings = await builderConsumer.findAll({
            where: {
                unit_id: { [Op.in]: unitIds }
            },
            attributes: ['user_id'],
            raw: true
        });

        const consumerUserIds = [...new Set(consumersInBuildings.map(c => c.user_id).filter(id => id !== null))];
        console.log('🔍 [BUILDING MANAGER DASHBOARD] Consumer user IDs in assigned buildings:', consumerUserIds);

        if (consumerUserIds.length === 0) {
            return res.status(200).json({
                status: true,
                message: 'No consumers found in assigned buildings',
                data: {
                    disbursement: 0,
                    cancel: 0,
                    onProcess: 0,
                    completed: 0,
                    notInterested: 0,
                    total: 0
                }
            });
        }

        // Count loans by status for these consumers
        // Statuses for "onProcess": pickup, login, query, sanction, documentselected, interested, partPayment
        const onProcessStatuses = ['pickup', 'login', 'query', 'sanction', 'documentselected', 'interested', 'partPayment'];

        const disbursementCount = await loanUser.count({
            where: {
                user_id: { [Op.in]: consumerUserIds },
                status: 'disbursement'
            }
        });

        const cancelCount = await loanUser.count({
            where: {
                user_id: { [Op.in]: consumerUserIds },
                status: 'cancel'
            }
        });

        const onProcessCount = await loanUser.count({
            where: {
                user_id: { [Op.in]: consumerUserIds },
                status: { [Op.in]: onProcessStatuses }
            }
        });

        const completedCount = await loanUser.count({
            where: {
                user_id: { [Op.in]: consumerUserIds },
                status: 'completed'
            }
        });

        const notInterestedCount = await loanUser.count({
            where: {
                user_id: { [Op.in]: consumerUserIds },
                status: 'notInterested'
            }
        });

        const totalCount = await loanUser.count({
            where: {
                user_id: { [Op.in]: consumerUserIds }
            }
        });

        const stats = {
            disbursement: disbursementCount,
            cancel: cancelCount,
            onProcess: onProcessCount,
            completed: completedCount,
            notInterested: notInterestedCount,
            total: totalCount
        };

        console.log('🔍 [BUILDING MANAGER DASHBOARD] Stats:', stats);

        res.status(200).json({
            status: true,
            message: 'Building manager dashboard statistics retrieved successfully',
            data: stats
        });
    } catch (error) {
        console.error('Error fetching building manager dashboard stats:', error);
        res.status(500).json({
            status: false,
            message: 'Error fetching building manager dashboard statistics',
            error: error.message
        });
    }
};


exports.updateBuildingManager = async (req, res) => {
    try {
        const { building_manager_id } = req.params;
        const { user_id, unit_id, status } = req.body;

        const buildingManager = await BuildingManager.findByPk(building_manager_id);
        if (!buildingManager) {
            return res.status(404).json({
                status: false,
                message: 'Building manager not found'
            });
        }

        await buildingManager.update({
            user_id: user_id || buildingManager.user_id,
            unit_id: unit_id || buildingManager.unit_id,
            status: status || buildingManager.status
        });

        res.status(200).json({
            status: true,
            message: 'Building manager updated successfully',
            data: buildingManager
        });
    } catch (error) {
        console.error('Error updating building manager:', error);
        res.status(500).json({
            status: false,
            message: 'Error updating building manager',
            error: error.message
        });
    }
};


exports.removeBuildingManager = async (req, res) => {
    try {
        const { building_manager_id } = req.params;

        const buildingManager = await BuildingManager.findByPk(building_manager_id);
        if (!buildingManager) {
            return res.status(404).json({
                status: false,
                message: 'Building manager not found'
            });
        }

        await buildingManager.update({ status: 'inactive' });

        res.status(200).json({
            status: true,
            message: 'Building manager removed successfully'
        });
    } catch (error) {
        console.error('Error removing building manager:', error);
        res.status(500).json({
            status: false,
            message: 'Error removing building manager',
            error: error.message
        });
    }
};

// Get notifications for admin dashboard
// exports.getNotifications = async (req, res) => {
//     try {
//         const { page = 1, limit = 10, type, is_read } = req.query;
//         const offset = (page - 1) * limit;

//         let whereClause = {};
        
//         // Filter by type if provided
//         if (type) {
//             whereClause.type = type;
//         }
        
//         // Filter by read status if provided
//         if (is_read !== undefined) {
//             whereClause.is_read = is_read === 'true';
//         }

//         const notifications = await db.notification.findAndCountAll({
//             where: whereClause,
//             order: [['created_at', 'DESC']],
//             limit: parseInt(limit),
//             offset: parseInt(offset)
//         });

//         res.status(200).json({
//             message: 'Notifications retrieved successfully',
//             status: true,
//             data: {
//                 notifications: notifications.rows,
//                 pagination: {
//                     currentPage: parseInt(page),
//                     totalPages: Math.ceil(notifications.count / limit),
//                     totalItems: notifications.count,
//                     itemsPerPage: parseInt(limit)
//                 }
//             }
//         });
//     } catch (error) {
//         console.error('Error fetching notifications:', error);
//         res.status(500).json({
//             message: 'Error fetching notifications',
//             status: false,
//             error: error.message
//         });
//     }
// };
