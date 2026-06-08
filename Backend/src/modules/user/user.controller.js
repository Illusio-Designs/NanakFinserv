const { ROLE_IDS, CATEGORY_IDS } = require("../../config/ids");
/**
 * user controller — extracted from the legacy user.controller monolith.
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
const userService = require("./user.service");
const logger = require("../../config/logger");

exports.getAllUsers = async (req, res) => {
    try {
        let whereObj = {};
        
        // If builder login → show only consumers under them
        if (req?.user.Role == ROLE_IDS.BUILDER) {
            whereObj.builder_user = req.user.id;
        }

        // If building manager (Role 7) login → show only consumers from their assigned buildings
        if (req?.user.Role == ROLE_IDS.BUILDING_MANAGER) {
            // Get all units assigned to this building manager
            const buildingManagerAssignments = await BuildingManager.findAll({
                where: { 
                    user_id: req.user.id, 
                    status: 'active' 
                },
                attributes: ['unit_id'],
                raw: true
            });
            
            if (buildingManagerAssignments.length > 0) {
                const unitIds = buildingManagerAssignments.map(assignment => assignment.unit_id);
                logger.debug('🔍 [CONSUMER API] Building Manager assigned unit IDs:', unitIds);
                
                // Get all consumer user IDs from these units
                const consumersInBuildings = await builderConsumer.findAll({
                    where: {
                        unit_id: { [Op.in]: unitIds }
                    },
                    attributes: ['user_id'],
                    raw: true
                });
                
                const consumerUserIds = [...new Set(consumersInBuildings.map(c => c.user_id).filter(id => id !== null))];
                logger.debug('🔍 [CONSUMER API] Consumer user IDs in assigned buildings:', consumerUserIds);
                
                if (consumerUserIds.length > 0) {
                    whereObj.user_id = { [Op.in]: consumerUserIds };
                } else {
                    // No consumers found in assigned buildings, return empty result
                    return res.status(200).send({
                        message: "consumer get success",
                        data: [],
                        status: true
                    });
                }
            } else {
                // No buildings assigned, return empty result
                return res.status(200).send({
                    message: "consumer get success",
                    data: [],
                    status: true
                });
            }
        }

        whereObj.role_id = [ROLE_IDS.CONSUMER, ROLE_IDS.BUILDER_CONSUMER]; // only consumer + builder consumer

        // ✨ Single Fetch for Admin + Builder (NO raw:true anywhere)
        const users = await User.findAll({
            order: [["username", "asc"]],
            where: whereObj,
            attributes: [
                'user_id','username','email','mobileNumber','referenceName',
                'role_id','builder_user','created_by','updated_by',
                'is_from_builder_user','family_head_id','createdAt','updatedAt'
            ],
            include: [
                { model: db.role, attributes: ['role_name'], as: 'role' },
                { 
                    model: User, 
                    as: 'builder_user_fk', 
                    attributes: ['user_id'],
                    required: false,
                    include: [
                        {
                            model: db.builderUser,
                            attributes: ['company_name'],
                            required: false
                        }
                    ]
                }
            ],
            raw: false,
            nest: true
        });

        // Get all user_ids that have loan status "interested" or "notInterested" to exclude them
        const excludedLoanUsers = await loanUser.findAll({
            where: {
                status: {
                    [Op.in]: ["interested", "notInterested"],
                },
            },
            attributes: ["user_id"],
            raw: true,
        });
        const excludedUserIds = [...new Set(excludedLoanUsers.map(u => u.user_id).filter(id => id !== null))];
        logger.debug('🔍 [CONSUMER API] Excluding user_ids with loan status interested/notInterested:', excludedUserIds);

        // Family member counts per head (one grouped query, not N+1).
        const listUserIds = users.map(u => u.user_id);
        const familyRows = listUserIds.length
            ? await User.findAll({
                where: { family_head_id: { [Op.in]: listUserIds } },
                attributes: ['family_head_id'],
                raw: true,
            })
            : [];
        const familyCountByHead = familyRows.reduce((acc, r) => {
            acc[r.family_head_id] = (acc[r.family_head_id] || 0) + 1;
            return acc;
        }, {});

        // ⚡ Add category mapping for ALL users
        const finalData = await Promise.all(
            users.map(async (item) => {
                const crList = await consumerRoleMapping.findAll({
                    where: { user_consumer_id: item.user_id },
                    include: [
                        { model: User, as: "userRoles", attributes:["username","email"] },
                        { model: db.category, as: "category", attributes:["category_name"] }
                    ],
                    raw:true
                });

                item.dataValues.category = crList;
                item.dataValues.roleDisplay = crList.length
                    ? crList.map(m => `(Vertical = ${m["category.category_name"]} : Role User : ${m["userRoles.username"]})`).join(" | ")
                    : "N/A";
                
                // Add builder company name to the response
                // Access BuilderUser through the builder_user_fk relationship
                let builderCompanyName = null;
                if (item.builder_user_fk) {
                    // With nest: true, Sequelize uses the model name
                    const builderUserData = item.builder_user_fk.get ? item.builder_user_fk.get() : item.builder_user_fk;
                    // BuilderUser is included as a nested object
                    if (builderUserData && builderUserData.builderuser) {
                        builderCompanyName = builderUserData.builderuser.company_name;
                    } else if (builderUserData && builderUserData.builderUser) {
                        builderCompanyName = builderUserData.builderUser.company_name;
                    }
                }
                item.dataValues.builder_company_name = builderCompanyName;
                // How many family members belong to this consumer (head).
                item.dataValues.family_member_count = familyCountByHead[item.user_id] || 0;

                return item;
            })
        );

        // Filter out building managers and consumers with loan status interested/notInterested
        const filteredData = finalData.filter(x => {
            // Exclude building managers
            if (x.role_id === ROLE_IDS.BUILDING_MANAGER) return false;
            // Exclude consumers with loan status interested/notInterested
            if (excludedUserIds.includes(x.user_id)) return false;
            return true;
        });

        return res.status(200).send({
            message:"consumer get success",
            data: filteredData,
            status:true
        });

    } catch (err) {
        logger.debug("❌ getAllUsers Failed:", err);
        return res.status(500).send({status:false,message:err.message});
    }
};



exports.getAllBuilderUsers = async (req, res) => {
    wherObj = {};
    if (req?.user.Role == ROLE_IDS.SUPER_ADMIN) {
        wherObj.role_id = 2;
    } else {
        wherObj.role_id = 2;
        wherObj.user_id = req.user.id;
    }

    User.findAll({
        order: [["username", "asc"]],
        where: wherObj,
        include: [
            { model: db.builderUser, attributes: ["company_name", "builder_id"] },
        ],
        raw: true,
        // attributes:[['id','key'] ,['name','value']]
    })
        .then((articles) => {
            res
                .status(200)
                .send({ message: "builder get success", data: articles, status: true });
        })
        .catch((e) => {
            res.send({ message: e?.message });
            logger.debug(e);
        });
};


exports.getAllBuilderListUsers = async (req, res) => {
    logger.debug(req.user, 'req.user')
    wherObj = {};
    wherObj.role_id = 2;

    User.findAll({
        order: [["username", "asc"]],
        where: wherObj,
        include: [
            { model: db.builderUser, attributes: ["company_name", "builder_id"] },
        ],
        raw: true,
        // attributes:[['id','key'] ,['name','value']]
    })
        .then((articles) => {
            res
                .status(200)
                .send({ message: "builder get success", data: articles, status: true });
        })
        .catch((e) => {
            res.send({ message: e?.message });
            logger.debug(e);
        });
};


exports.getCategoryById = async (req, res) => {
    try {
        const data = await userService.getCategoriesByUserId(req.body.user_id);
        res.status(200).send({ message: "user category get success", data, status: true });
    } catch (e) {
        logger.error({ err: e }, "getCategoryById failed");
        res.status(400).send({ message: "error", status: false });
    }
};

exports.getAllRolesUsers = async (req, res) => {
    logger.debug('🔍 [ROLE MANAGER] Filtering users (admin + staff roles)');
    
    // Auto-fix super admin categories when loading role management page
    try {
        logger.debug('🔍 [AUTO FIX] Checking super admin categories...');
        
        // Find all users with role_id = 1 (super admin)
        const superAdmins = await User.findAll({
            where: { role_id: ROLE_IDS.SUPER_ADMIN },
            attributes: ['user_id', 'username', 'email']
        });
        
        for (const admin of superAdmins) {
            // Check if they have all required categories
            const existingCategories = await userCatergory.findAll({
                where: { user_id: admin.user_id },
                attributes: ['category_id']
            });
            
            const existingCategoryIds = existingCategories.map(cat => cat.category_id);
            const requiredCategories = [CATEGORY_IDS.LOAN, CATEGORY_IDS.MEDICLAIM, CATEGORY_IDS.LIFE_INSURANCE, CATEGORY_IDS.VEHICLE]; // Loan, Mediclaim, Life Insurance, Vehicle
            
            const missingCategories = requiredCategories.filter(catId => !existingCategoryIds.includes(catId));
            
            if (missingCategories.length > 0) {
                logger.debug(`🔍 [AUTO FIX] User ${admin.username} missing categories:`, missingCategories);
                
                // Add missing categories
                const categoryData = missingCategories.map(categoryId => ({
                    user_id: admin.user_id,
                    category_id: categoryId,
                }));
                
                await userCatergory.bulkCreate(categoryData);
                logger.debug(`✅ [AUTO FIX] Added missing categories for ${admin.username}:`, categoryData);
            }
        }
    } catch (error) {
        logger.error('❌ [AUTO FIX] Error fixing super admin categories:', error);
        // Don't fail the main request, just log the error
    }
    
    User.findAll({
        order: [["username", "asc"]],
        attributes: [
            "user_id",
            "username",
            "email",
            "mobileNumber",
            [
                Sequelize.fn(
                    "GROUP_CONCAT",
                    Sequelize.col("usercategories.category_id")
                ),
                "categories",
            ],
            [
                Sequelize.fn(
                    "GROUP_CONCAT",
                    Sequelize.col("usercategories->category.category_name")
                ),
                "categories_name",
            ],
        ],
        include: [
            {
                model: userCatergory,
                include: [{ model: Category, attributes: [] }],
                attributes: [],
            },
        ],
        raw: true,
        where: {
            role_id: {
                [Op.or]: [ROLE_IDS.SUPER_ADMIN, ROLE_IDS.STAFF], // Show admin and user roles (exclude builder, consumer and mediclaim users)
            },
        },
        group: ["user_id"],
        // attributes:[['id','key'],['name','value']]
    })
        .then((articles) => {
            res.status(200).send({
                message: "user role wise get success",
                data: articles,
                status: true,
            });
        })
        .catch((e) => {
            res.status(400).send({ message: "error", status: false });
            logger.debug(e);
        });
};


exports.getAllRoles = async (req, res) => {
    try {
        const data = await userService.getRoles();
        res.status(200).send({ message: "role get success", data, status: true });
    } catch (e) {
        logger.error({ err: e }, "getAllRoles failed");
        res.status(400).send({ message: "role error", status: false });
    }
};


exports.addRoleWiseUser = (req, res) => {
    logger.debug(req.body);
    User.findOne({
        where: {
            [Op.or]: [
                { mobileNumber: req.body.phone_number },
                // { email: req.body.email },
            ],
        },
    })
        .then(async (user) => {
            logger.debug(user);
            if (user) {
                return res
                    .status(400)
                    .send({ message: "User already exist.", status: false });
            } else {
                User.create({
                    username: req.body.username,
                    email: req.body.email,
                    mobileNumber: req.body.phone_number,
                    role_id: req.body.role || ROLE_IDS.STAFF, // UUID role id
                    referenceName: req.body.referenceName,
                    otp: "",
                    token: "",
                })
                    .then(async (articles) => {

                        // req.body.roleId = the category (vertical) UUIDs to assign (optional).
                        let roles = [];
                        if (Array.isArray(req.body.roleId)) roles = req.body.roleId;
                        else if (req.body.roleId) roles = String(req.body.roleId).split(',').map((s) => s.trim());

                        // Super admin gets all verticals automatically.
                        if (req.body.role === ROLE_IDS.SUPER_ADMIN) {
                            roles = [CATEGORY_IDS.LOAN, CATEGORY_IDS.MEDICLAIM, CATEGORY_IDS.LIFE_INSURANCE, CATEGORY_IDS.VEHICLE];
                        }
                        roles = roles.filter(Boolean);

                        let categoryData = roles.map((category_id) => ({
                            user_id: articles.user_id,
                            category_id,
                        }));

                        // Bulk insert into userCategory table
                        if (categoryData.length) await userCatergory.bulkCreate(categoryData);
                        logger.debug('🔍 [ROLE ASSIGNMENT] Categories assigned:', categoryData);
                        // Create notification for admin
                        await createNotification({
                            title: "New User Added",
                            message: `A new user "${req.body.username}" has been added to the system with role ID ${req.body.role}.`,
                            type: 'system',
                            category: 'user_added',
                            user_id: req.user.id, // User who added the record
                            target_user_id: articles.user_id, // User who was added
                            record_id: articles.user_id,
                            is_important: true,
                            metadata: {
                                user_name: req.body.username,
                                email: req.body.email,
                                mobile: req.body.phone_number,
                                role_id: req.body.role,
                                categories: roles,
                                added_by: req.user.username || 'System'
                            }
                        });

                        return res.status(200).send({
                            message: "user successfully added!.",
                            status: true,
                            userData: articles,
                        });
                    })
                    .catch((e) =>
                        res.status(400).send({ message: "error.", status: false })
                    );
            }
        })
        .catch((err) => {
            res.status(400).send({ message: "error.", status: false });
        });
};


exports.updateRoleWiseUser = async (req, res) => {
    logger.debug(req.body);
    let user = await User.findOne({
        where: {
            user_id: { [Op.ne]: req.body.user_id },
            mobileNumber: req.body.phone_number,
        },
    });
    if (user) {
        return res
            .status(400)
            .send({ message: "User already exist.", status: false });
    }

    User.update(
        {
            username: req.body.username,
            email: req.body.email,
            mobileNumber: req.body.phone_number,
            role_id: req.body.role == 1 ? 1 : 4,
            referenceName: req.body.referenceName,
        },
        {
            where: {
                user_id: req.body.user_id,
            },
        }
    )
        .then(async (articles) => {
            // req.body.roleId contains category IDs (not role IDs)
            let roles = req.body.roleId
                .toString() // Convert to string
                .split(',') // Split by comma if multiple
                .map(Number); // Convert to an array of numbers

            // For super admin (role_id = 1), assign ALL categories automatically
            if (req.body.role == 1) {
                // Super admin gets access to all categories: 2, 4, 5, 6 (Loan, Mediclaim, Life Insurance, Vehicle)
                roles = [2, 4, 5, 6];
                logger.debug('🔍 [SUPER ADMIN UPDATE] Assigning all categories to super admin:', roles);
            }

            // Clear existing categories for the user
            await userCatergory.destroy({
                where: { user_id: req.body.user_id },
            });

            // Add new categories
            let categoryData = roles.map((roleId) => ({
                user_id: req.body.user_id,
                category_id: roleId,
            }));

            await userCatergory.bulkCreate(categoryData);
            logger.debug('🔍 [ROLE UPDATE] Categories assigned:', categoryData);
            return res.status(200).send({
                message: "user successfully updated!.",
                status: true,
                userData: articles,
            });
        })
        .catch((e) => res.status(400).send({ message: "error.", status: false }));
};


exports.addData = (req, res) => {
    User.findOne({
        where: {
            [Op.or]: [
                { mobileNumber: req.body.phone_number },
                // { email: req.body.email },
            ],
        },
        raw: true,
        nest: true,
    })
        .then(async (user) => {
            logger.debug(user);
            if (user) {
                // return res.send({ error: "User already exist." });
                res
                    .status(400)
                    .send({ response: "User already exist.", status: false });
            } else {
                User.findOne({
                    where: {
                        [Op.or]: [
                            { username: req.body.username },
                            { email: req.body.email },
                        ],
                    },
                })
                    .then((user) => {
                        if (!user) {
                            User.create({
                                username: req.body.username,
                                email: req.body.email,
                                mobileNumber: req.body.phone_number,
                                role_id: req.body.role,
                                referenceName: req.body.referenceName,
                                otp: "",
                                token: "",
                            })
                                .then((articles) => {
                                    res.send(
                                        JSON.stringify({
                                            response: "user successfully added!",
                                            status: true,
                                            userData: articles,
                                        })
                                    );
                                })
                                .catch((e) => res.status(500).send({ message: err.message }));
                        } else
                            res.status(400).send({
                                response: "Name or Email is already in use.",
                                status: false,
                            });
                    })
                    .catch((e) => {
                        res.status(500).send({ message: e.message });
                        // logger.debug(e.message)
                    });
            }
        })
        .catch((err) => {
            res.status(500).send({ message: err.message });
        });
};




exports.updateData = async (req, res) => {
    let user = await User.findOne({
        where: {
            user_id: { [Op.ne]: req.body.user_id },
            mobileNumber: req.body.phone_number,
        },
    });
    if (user) {
        return res.send(
            JSON.stringify({
                response: "Mobile number already in use",
                status: false,
            })
        );
    }
    User.update(
        {
            username: req.body.username,
            email: req.body.email,
            mobileNumber: req.body.phone_number,
            role_id: req.body.role,
            referenceName: req.body.referenceName,
            otp: "",
            token: "",
        },
        {
            where: {
                user_id: req.body.user_id,
            },
        }
    )
        .then((articles) => {
            res.send(
                JSON.stringify({ response: "user successfully updated!", status: true })
            );
        })
        .catch((e) => {
            res.send({ message: e?.message });
            logger.debug(e);
        });
};


exports.getAllUnitVerticle = async (req, res) => {
    try {
        const data = await userService.getUnitVerticals();
        res.status(200).send({ message: "catergory unit get success", data, status: true });
    } catch (e) {
        logger.error({ err: e }, "getAllUnitVerticle failed");
        res.status(400).send({ message: "role error", status: false });
    }
};


exports.getAllVerticleUser = async (req, res) => {
    try {
        const categories = req.body?.category || [];
        
        logger.debug('🔍 [getAllVerticleUser] Request body:', req.body);
        logger.debug('🔍 [getAllVerticleUser] Categories:', categories);
        
        if (!categories || categories.length === 0) {
            return res.status(400).send({ 
                message: "Category array is required", 
                status: false 
            });
        }

        const articles = await User.findAll({
        attributes: ["user_id", "username", "email", "role_id"],
        include: [
            {
                model: userCatergory,
                attributes: ["category_id"],
                where: {
                        category_id: categories,
                },
            },
        ],
        raw: true,
        });

        logger.debug('🔍 [getAllVerticleUser] Query result:', articles);
        logger.debug('🔍 [getAllVerticleUser] Number of users found:', articles.length);

            res.status(200).send({
            message: "category unit get success",
                data: articles,
                status: true,
            });
    } catch (e) {
        logger.error("Error in getAllVerticleUser:", e);
        res.status(400).send({ 
            message: "Error fetching verticle users", 
            status: false 
        });
    }
};

