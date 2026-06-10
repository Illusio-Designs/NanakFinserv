const { ROLE_IDS, UNIT_CATEGORY_IDS } = require("../../config/ids");
/**
 * builder controller — extracted from the legacy user.controller monolith.
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
const builderService = require("./builder.service");
const logger = require("../../config/logger");

exports.addBuilderData = async (req, res) => {
    try {
    if (!req.body?.company_name) {
        return res.send(
            JSON.stringify({
                errMessage: "Company name not provided",
                status: false,
            })
        );
    }

        // Check if user with this mobile number already exists
        let user = await User.findOne({
        where: {
                mobileNumber: req.body.phone_number,
            },
        });

        let userData;
        if (user) {
            logger.debug('🔍 [ADD BUILDER] User found with mobile number:', req.body.phone_number, 'User ID:', user.user_id);
            
            // Check if user is already a builder
            const existingBuilder = await BuilderUser.findOne({
                where: {
                    user_id: user.user_id,
                },
            });

            if (existingBuilder) {
                logger.debug('ℹ️ [ADD BUILDER] User is already a builder');
                return res.send(
                    JSON.stringify({
                        errMessage: "This mobile number is already associated with a builder account.",
                        status: false,
                    })
                );
            } else {
                logger.debug('🔍 [ADD BUILDER] User exists but not a builder, creating builder profile...');
                
                // Create builder profile for existing user
                let data = await BuilderUser.create({
                    company_name: req.body.company_name,
                    user_id: user.user_id,
                    created_by: req.user.id,
                    updated_by: req.user.id,
                });

                return res.status(200).send({
                    message: "Builder profile successfully added to existing user!",
                    status: true,
                    userData: user,
                });
            }
        } else {
            logger.debug('➕ [ADD BUILDER] User not found, creating new user and builder profile...');
            
            // Create new user
            userData = await User.create({
                    username: req.body.username,
                    email: req.body.email,
                    mobileNumber: req.body.phone_number,
                    role_id: ROLE_IDS.BUILDER,
                    referenceName: req.body.referenceName,
                    otp: "",
                    token: "",
                    created_by: req.user.id,
                    updated_by: req.user.id,
            });

            // Create builder profile
                        let data = await BuilderUser.create({
                            company_name: req.body.company_name,
                user_id: userData.user_id,
                            created_by: req.user.id,
                            updated_by: req.user.id,
                        });

            return res.status(200).send({
                message: "Builder user successfully added!",
                            status: true,
                userData: userData,
            });
        }
    } catch (error) {
        logger.error('❌ [ADD BUILDER] Error:', error);
        res.status(500).send({ message: error.message });
    }
};


exports.updateBuilderData = async (req, res) => {
    let user = await User.findOne({
        where: {
            user_id: { [Op.ne]: req.body.user_id },
            mobileNumber: req.body.phone_number,
        },
    });
    if (user) {
        // return res.send(
        //     JSON.stringify({ response: "Mobile number already in use", status: false })
        // );
        return res
            .status(400)
            .send({ message: "Mobile number already in use", status: false });
    }
    User.update(
        {
            username: req.body.username,
            email: req.body.email,
            mobileNumber: req.body.phone_number,
            referenceName: req.body.referenceName,
            updated_by: req.user.id,
        },
        {
            where: {
                user_id: req.body.user_id,
            },
        }
    )
        .then(async (articles) => {
            let data = await BuilderUser.update(
                {
                    company_name: req.body.company_name,
                    updated_by: req.user.id,
                },
                {
                    where: {
                        user_id: req.body.user_id,
                    },
                }
            );
            // res.send(
            //     JSON.stringify({ response: "builder user successfully updated!", status: true, userData: articles })
            // );
            return res.status(200).send({
                message: "builder user successfully updated!",
                status: true,
                userData: articles,
            });
        })
        .catch((e) => {
            res.send({ message: e?.message });
            logger.debug(e);
        });
};


exports.getUnitsByBuilder = async (req, res) => {
    let whereObj = {};

    if (req.user.Role === ROLE_IDS.BUILDER) {
        whereObj.builder_id = req.user.builder_id;
    } else if (req.user.Role === ROLE_IDS.BUILDING_MANAGER) { // Building Manager role ID 7
        // For building managers, get their assigned buildings
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
            whereObj.unit_id = { [Op.in]: unitIds };
        } else {
            // If no buildings assigned, return empty result
            return res.status(200).send({
                message: "No buildings assigned to this building manager",
                data: [],
                status: true,
            });
        }
    }
    Unit.findAll({
        raw: true,
        where: whereObj,
        attributes: [
            "address",
            "builder_id",
            "unit_id",
            "unit_name",
            [
                Sequelize.fn(
                    "GROUP_CONCAT",
                    Sequelize.col("unitcategorydetail.unit_category_id")
                ),
                "unit_categories",
            ],
            [
                Sequelize.fn("GROUP_CONCAT", Sequelize.col("unitcategorydetail.count")),
                "counts",
            ],
            [
                Sequelize.fn(
                    "GROUP_CONCAT",
                    Sequelize.col("unitcategorydetail->unitcategory.unit_category_name")
                ),
                "unit_categories_names",
            ],
            [
                Sequelize.fn("GROUP_CONCAT", Sequelize.col("unitcategorydetail.totalCount")),
                "totalCounts",
            ],
            [
                Sequelize.fn("GROUP_CONCAT", Sequelize.col("unitcategorydetail.floorCount")),
                "floorCounts",
            ],
            [
                Sequelize.fn("GROUP_CONCAT", Sequelize.col("unitcategorydetail.wingCount")),
                "wingCounts",
            ],
            [
                Sequelize.fn("GROUP_CONCAT", Sequelize.col("unitcategorydetail.unit_category_detail_id")),
                "unit_category_detail_ids",
            ],
        ],
        include: [
            {
                model: UnitCategoryDetail,
                include: [{ model: UnitCategoryList, attributes: [] }],
                attributes: [],
            },
            {
                model: BuilderUser,
                attributes: ["company_name"],
            },
        ],
        // logging: console.log,
        group: ["unit_id"],
    })
        .then(async (articles) => {
            // logger.debug(articles);

            const response = await Promise.all(
                articles.map(async (element) => {
                    const unit_categories = element.unit_categories;
                    const floorCounts = element.floorCounts;
                    const totalCounts = element.totalCounts;
                    const wingCounts = element.wingCounts;
                    const unit_category_detail_ids = element.unit_category_detail_ids;

                    // Parse values from comma-separated strings into arrays
                    const unitCategoryList = (unit_categories && unit_categories?.split(",")?.map(Number)) || [];
                    const totalCountList = (totalCounts && totalCounts?.split(",")?.map(Number)) || [];
                    const floorList = (floorCounts && floorCounts?.split(",")?.map(Number)) || [];
                    const wingsList = (wingCounts && wingCounts?.split(",")?.map(Number)) || [];
                    const wingsListIds = (unit_category_detail_ids && unit_category_detail_ids?.split(",")?.map(Number)) || [];

                    // Initialize category structure
                    const categoryResponse = {
                        Showroom: [],
                        Office: [],
                        Flat: [],
                        House: [],
                    };

                    await Promise.all(
                        unitCategoryList.map(async (categoryId, index) => {
                            const unitCategoryDetailId = wingsListIds[index] || null;

                            let wingsRanges = [];
                            let floorRanges = [];
                            const totalCount = totalCountList[index] || 0; // Maintain totalCount
                            const wingCount = wingsList[index] || 0; // Maintain wingCount
                            const floorCount = floorList[index] || 0; // Maintain floorCount

                            if (unitCategoryDetailId) {
                                // Fetch wings and floors for the given unit category detail ID
                                const wings = await Wing.findAll({
                                    where: { unit_category_detail_id: unitCategoryDetailId },
                                });

                                const floors = await floor.findAll({
                                    where: { unit_category_detail_id: unitCategoryDetailId },
                                });

                                // Map wings to the required format
                                wingsRanges = wings.map((wing) => ({
                                    wingName: wing.wing_name,
                                    wingId: wing.wing_id,
                                }));

                                // Map floors to the required format
                                floorRanges = floors.map((floor, index) => ({
                                    floorNumber: floor.floorNumber,
                                    startRange: floor.floor_start,
                                    endRange: floor.floor_end,
                                    wingId: floor.wing_id,
                                    floor_id: floor.floor_id,
                                }));

                                // Attach floors to their respective wings
                                wingsRanges.forEach((wingRange) => {
                                    wingRange.floors = floorRanges.filter(
                                        (floor) => floor.wingId === wingRange.wingId
                                    );
                                });
                            }

                            // Map categoryId to the correct category name
                            const categoryKey = categoryId === UNIT_CATEGORY_IDS.SHOWROOM
                                ? "Showroom"
                                : categoryId === UNIT_CATEGORY_IDS.OFFICE
                                    ? "Office"
                                    : categoryId === UNIT_CATEGORY_IDS.FLAT
                                        ? "Flat"
                                        : "House";

                            // Add wings, floors, and counts to the correct category
                            categoryResponse[categoryKey] = {
                                wingCount,
                                floorCount,
                                wings: wingsRanges,
                            };

                            if (categoryId === UNIT_CATEGORY_IDS.SHOWROOM) element.unit_showroomCount = totalCount;
                            if (categoryId === UNIT_CATEGORY_IDS.OFFICE) element.unit_officeCount = totalCount;
                            if (categoryId === UNIT_CATEGORY_IDS.FLAT) element.unit_flatCount = totalCount;
                            if (categoryId === UNIT_CATEGORY_IDS.HOUSE) element.unit_houseCount = totalCount;
                        })
                    );

                    // Fetch building manager data for this unit
                    let buildingManagerData = {
                        building_manager_name: '',
                        building_manager_email: '',
                        building_manager_mobile: ''
                    };
                    
                    try {
                        const buildingManager = await BuildingManager.findOne({
                            where: { 
                                unit_id: element.unit_id,
                                status: 'active'
                            },
                            include: [{
                                model: User,
                                as: 'user',
                                attributes: ['username', 'email', 'mobileNumber']
                            }],
                            raw: false // Keep as Sequelize instance to access associations
                        });

                        if (buildingManager) {
                            // Convert to plain object to access nested data
                            const bmPlain = buildingManager.get ? buildingManager.get({ plain: true }) : buildingManager;
                            
                            logger.debug('Building Manager found for unit_id:', element.unit_id, bmPlain);
                            
                            if (bmPlain && bmPlain.user) {
                                buildingManagerData = {
                                    building_manager_name: bmPlain.user.username || '',
                                    building_manager_email: bmPlain.user.email || '',
                                    building_manager_mobile: bmPlain.user.mobileNumber || ''
                                };
                                logger.debug('Building Manager Data set:', buildingManagerData);
                            } else {
                                logger.debug('No user data found in building manager for unit_id:', element.unit_id);
                            }
                        } else {
                            logger.debug('No building manager found for unit_id:', element.unit_id);
                        }
                    } catch (bmError) {
                        logger.error('Error fetching building manager for unit_id:', element.unit_id, bmError);
                        // Continue with empty building manager data
                    }

                    return {
                        ...element,
                        Showroom: categoryResponse.Showroom,
                        Flat: categoryResponse.Flat,
                        Office: categoryResponse.Office,
                        House: categoryResponse.House,
                        ...buildingManagerData
                    };
                })
            );

            res
                .status(200)
                .send({ message: "unit get success", data: response, status: true });
        })
        .catch((e) => {
            res
                .status(400)
                .send({ message: "unit error", status: false, error: e?.message });
            logger.debug(e);
        });
};


exports.getUintByConsumer = async (req, res) => {
    try {
        // Validation for missing required fields
        // if (req.user.Role === ROLE_IDS.BUILDER && !req.user.builder_id) {
        //     return res.status(400).send({ message: 'Builder ID is required for this user role', status: false });
        // }

        if (!req.body.unit_id) {
            return res
                .status(400)
                .send({ message: "Unit ID is required", status: false });
        }

        let whereObj = {
            unit_id: req.body.unit_id,
        };

        if (req.user.Role === ROLE_IDS.BUILDER) {
            whereObj.builder_id = req.user.builder_id;
        }

        const articles = await Unit.findAll({
            raw: true,
            where: whereObj,
            attributes: [
                "address",
                "builder_id",
                "unit_id",
                "unit_name",
                [
                    Sequelize.fn(
                        "GROUP_CONCAT",
                        Sequelize.col("unitcategorydetail.unit_category_id")
                    ),
                    "unit_categories",
                ],
                [
                    Sequelize.fn("GROUP_CONCAT", Sequelize.col("unitcategorydetail.count")),
                    "counts",
                ],
                [
                    Sequelize.fn(
                        "GROUP_CONCAT",
                        Sequelize.col("unitcategorydetail->unitcategory.unit_category_name")
                    ),
                    "unit_categories_names",
                ],
                [
                    Sequelize.fn("GROUP_CONCAT", Sequelize.col("unitcategorydetail.totalCount")),
                    "totalCounts",
                ],
                [
                    Sequelize.fn("GROUP_CONCAT", Sequelize.col("unitcategorydetail.floorCount")),
                    "floorCounts",
                ],
                [
                    Sequelize.fn("GROUP_CONCAT", Sequelize.col("unitcategorydetail.wingCount")),
                    "wingCounts",
                ],
                [
                    Sequelize.fn("GROUP_CONCAT", Sequelize.col("unitcategorydetail.unit_category_detail_id")),
                    "unit_category_detail_ids",
                ],
            ],
            include: [
                {
                    model: UnitCategoryDetail,
                    include: [{ model: UnitCategoryList, attributes: [] }],
                    attributes: [],
                },
                {
                    model: BuilderUser,
                    attributes: ["company_name", "user_id"],
                },
            ],
            logging: (msg) => logger.debug(msg),
            group: ["unit_id"],
        });

        if (!articles.length) {
            return res.status(404).send({
                message: "No units found for the given criteria",
                status: false,
            });
        }
        const consumerList = await builderConsumer.findAll({
            where: {
                unit_id: req.body.unit_id,
            },
            include: [{ model: User, include: [{ model: loanUser, attributes: ['status'], as: 'user_pk_id' }], attributes: ['username', 'email', 'mobileNumber', 'role_id', 'user_id'] }],
            raw: true,
        });
        const response = await Promise.all(
            articles.map(async (element) => {
                const unit_categories = element.unit_categories;
                const floorCounts = element.floorCounts;
                const totalCounts = element.totalCounts;
                const wingCounts = element.wingCounts;
                const unit_category_detail_ids = element.unit_category_detail_ids;

                // Parse comma-separated strings. Category id + detail id are UUIDs
                // now (not numbers) — keep them as strings; only counts are numeric.
                const unitCategoryList = (unit_categories && unit_categories?.split(",")) || [];
                const totalCountList = (totalCounts && totalCounts?.split(",")?.map(Number)) || [];
                const floorList = (floorCounts && floorCounts?.split(",")?.map(Number)) || [];
                const wingsList = (wingCounts && wingCounts?.split(",")?.map(Number)) || [];
                const wingsListIds = (unit_category_detail_ids && unit_category_detail_ids?.split(",")) || [];

                // Initialize category structure
                const categoryResponse = {
                    Showroom: [],
                    Office: [],
                    Flat: [],
                    House: [],
                };

                await Promise.all(
                    unitCategoryList.map(async (categoryId, index) => {
                        const unitCategoryDetailId = wingsListIds[index] || null;

                        let wingsRanges = [];
                        let floorRanges = [];

                        if (unitCategoryDetailId) {
                            // Fetch wings and floors for the given unit category detail ID
                            const wings = await Wing.findAll({
                                where: { unit_category_detail_id: unitCategoryDetailId },
                            });

                            const floors = await floor.findAll({
                                where: { unit_category_detail_id: unitCategoryDetailId },
                            });

                            // Map wings to the required format
                            wingsRanges = wings.map((wing) => ({
                                wingName: wing.wing_name,
                                wingId: wing.wing_id,
                            }));

                            // Map floors to the required format
                            floorRanges = floors.map((floor, index) => ({
                                floorNumber: floor.floorNumber,
                                startRange: floor.floor_start,
                                endRange: floor.floor_end,
                                wingId: floor.wing_id,
                                floor_id: floor.floor_id,
                            }));

                            // Attach floors to their respective wings
                            wingsRanges.forEach((wingRange) => {
                                wingRange.floors = floorRanges.filter(
                                    (floor) => floor.wingId === wingRange.wingId
                                );
                            });
                        }

                        // Map categoryId to the correct category name
                        const categoryKey = categoryId === UNIT_CATEGORY_IDS.SHOWROOM
                            ? "Showroom"
                            : categoryId === UNIT_CATEGORY_IDS.OFFICE
                                ? "Office"
                                : categoryId === UNIT_CATEGORY_IDS.FLAT
                                    ? "Flat"
                                    : "House";

                        // Add wings with floors to the correct category
                        categoryResponse[categoryKey] = wingsRanges;
                    })
                );

                return {
                    ...element,
                    consumerList,
                    Showroom: categoryResponse.Showroom,
                    Flat: categoryResponse.Flat,
                    Office: categoryResponse.Office,
                    House: categoryResponse.House,
                };
            })
        );

        res.status(200).send({
            message: "Unit get success",
            data: response,
            status: true,
        });

    } catch (e) {
        logger.debug(e);
        res.status(500).send({
            message: "Internal server error",
            status: false,
            error: e.message,
        });
    }
};


exports.getUnitsByBuilderCategory = async (req, res) => {
    let whereObj = {};

    UnitCategoryDetail.findAll({
        raw: true,
        where: {
            unit_id: req.params.unitId,
        },
        include: [{ model: Unit }, { model: UnitCategoryList }],
        // attributes:[['id','key'],['name','value']]
    })
        .then((articles) => {
            res.status(200).send({
                message: "unit catergory get success",
                data: articles,
                status: true,
            });
        })
        .catch((e) => {
            res.status(400).send({ message: "unit catergory error", status: false });
            logger.debug(e);
        });
};


exports.addBuilderUnit = async (req, res) => {
    if (!req.body?.builder_id) {
        return res
            .status(400)
            .send({ message: "Builder id not provided", status: false });
    }

    try {
        // Check if the builder exists
        const user = await BuilderUser.findOne({
            where: {
                [Op.or]: [{ builder_id: req.body.builder_id }],
            },
        });

        if (!user) {
            return res
                .status(400)
                .send({ message: "Builder id does not exist", status: false });
        }

        const existingUnit = await Unit.findOne({
            where: {
                unit_name: req.body.unit_name,
            },
        });


        if (existingUnit) {
            return res
                .status(400)
                .send({ message: "Unit name already in use", status: false });
        }
        // Create the unit
        const newUnit = await Unit.create({
            unit_name: req.body.unit_name,
            address: req.body.address,
            builder_id: req.body.builder_id,
        });

        if (!req.body?.unit_categories || !req.body.unit_categories.length) {
            return res.status(200).send({
                response: "Unit created successfully, but no unit categories provided.",
                status: true,
                userData: newUnit,
            });
        }

        // Delete existing categories and floors for this unit
        await UnitCategoryDetail.destroy({
            where: { unit_id: newUnit.unit_id },
        });
        await floor.destroy({
            where: { unit_id: newUnit.unit_id },
        });

        await Wing.destroy({
            where: { unit_id: newUnit.unit_id },
        });


        // Process each unit category and floors
        for (const item of req.body.unit_categories) {
            let unitCategoryData = {};

            // Determine unit category details
            if (item == UNIT_CATEGORY_IDS.SHOWROOM || item?.unit_category_id == UNIT_CATEGORY_IDS.SHOWROOM) {
                unitCategoryData = {
                    unit_category_id: UNIT_CATEGORY_IDS.SHOWROOM,
                    totalCount: req.body?.Showroom?.summary?.totalCount || 0,
                    floorCount: req.body?.Showroom?.summary?.floorCount || 0,
                    wingCount: req.body?.Showroom?.summary?.wingCount || 0,
                };
            } else if (item == UNIT_CATEGORY_IDS.OFFICE || item?.unit_category_id == UNIT_CATEGORY_IDS.OFFICE) {
                unitCategoryData = {
                    unit_category_id: UNIT_CATEGORY_IDS.OFFICE,
                    totalCount: req.body?.Office?.summary?.totalCount || 0,
                    floorCount: req.body?.Office?.summary?.floorCount || 0,
                    wingCount: req.body?.Office?.summary?.wingCount || 0,
                };
            } else if (item == UNIT_CATEGORY_IDS.FLAT || item?.unit_category_id == UNIT_CATEGORY_IDS.FLAT) {
                unitCategoryData = {
                    unit_category_id: UNIT_CATEGORY_IDS.FLAT,
                    totalCount: req.body?.Flat?.summary?.totalCount || 0,
                    floorCount: req.body?.Flat?.summary?.floorCount || 0,
                    wingCount: req.body?.Flat?.summary?.wingCount || 0,
                };
            } else if (item == UNIT_CATEGORY_IDS.HOUSE || item?.unit_category_id == UNIT_CATEGORY_IDS.HOUSE) {
                unitCategoryData = {
                    unit_category_id: UNIT_CATEGORY_IDS.HOUSE,
                    totalCount: req.body?.House?.summary?.totalCount || 0,
                    floorCount: req.body?.House?.summary?.floorCount || 0,
                    wingCount: req.body?.House?.summary?.wingCount || 0,
                };
            }

            // Skip if no data is provided
            if (!Object.keys(unitCategoryData).length) continue;

            // Add unit_id to the category data
            unitCategoryData.unit_id = newUnit.unit_id;

            // Create the unit category
            const createdCategory = await UnitCategoryDetail.create(unitCategoryData);

            let floorData = [];

            if (createdCategory.unit_category_id === UNIT_CATEGORY_IDS.SHOWROOM && req.body?.Showroom?.wings) {
                await Promise.all(req.body.Showroom.wings.map(async (wing) => {
                    // Create Wing
                    const createdWing = await Wing.create({
                        unit_id: newUnit.unit_id,
                        unit_category_detail_id: createdCategory.unit_category_detail_id,
                        wing_name: wing.wingName,
                    });

                    // Collect Floors for the wing
                    wing.floors.forEach((floor) => {
                        floorData.push({
                            unit_id: newUnit.unit_id,
                            unit_category_detail_id: createdCategory.unit_category_detail_id,
                            wing_id: createdWing.wing_id,
                            floorNumber: floor.floorNumber,
                            floor_start: floor.startRange,
                            floor_end: floor.endRange,
                        });
                    });
                }));
            }

            if (createdCategory.unit_category_id === UNIT_CATEGORY_IDS.OFFICE && req.body?.Office?.wings) {
                await Promise.all(req.body.Office.wings.map(async (wing) => {
                    // Create Wing
                    const createdWing = await Wing.create({
                        unit_id: newUnit.unit_id,
                        unit_category_detail_id: createdCategory.unit_category_detail_id,
                        wing_name: wing.wingName,
                    });

                    // Collect Floors for the wing
                    wing.floors.forEach((floor) => {
                        floorData.push({
                            unit_id: newUnit.unit_id,
                            unit_category_detail_id: createdCategory.unit_category_detail_id,
                            wing_id: createdWing.wing_id,
                            floorNumber: floor.floorNumber,
                            floor_start: floor.startRange,
                            floor_end: floor.endRange,
                        });
                    });
                }));
            }

            if (createdCategory.unit_category_id === UNIT_CATEGORY_IDS.FLAT && req.body?.Flat?.wings) {
                await Promise.all(req.body.Flat.wings.map(async (wing) => {
                    // Create Wing
                    const createdWing = await Wing.create({
                        unit_id: newUnit.unit_id,
                        unit_category_detail_id: createdCategory.unit_category_detail_id,
                        wing_name: wing.wingName,
                    });

                    // Collect Floors for the wing
                    wing.floors.forEach((floor) => {
                        floorData.push({
                            unit_id: newUnit.unit_id,
                            unit_category_detail_id: createdCategory.unit_category_detail_id,
                            wing_id: createdWing.wing_id,
                            floorNumber: floor.floorNumber,
                            floor_start: floor.startRange,
                            floor_end: floor.endRange,
                        });
                    });
                }));
            }

            if (createdCategory.unit_category_id === UNIT_CATEGORY_IDS.HOUSE && req.body?.House?.wings) {
                await Promise.all(req.body.House.wings.map(async (wing) => {
                    // Create Wing
                    const createdWing = await Wing.create({
                        unit_id: newUnit.unit_id,
                        unit_category_detail_id: createdCategory.unit_category_detail_id,
                        wing_name: wing.wingName,
                    });

                    // Collect Floors for the wing
                    wing.floors.forEach((floor) => {
                        floorData.push({
                            unit_id: newUnit.unit_id,
                            unit_category_detail_id: createdCategory.unit_category_detail_id,
                            wing_id: createdWing.wing_id,
                            floorNumber: floor.floorNumber,
                            floor_start: floor.startRange,
                            floor_end: floor.endRange,
                        });
                    });
                }));
            }

            // Bulk create floors if there are any
            if (floorData.length > 0) {
                await floor.bulkCreate(floorData);
            }

        }

        // Final response
        res.send({
            response: "Builder unit and categories successfully added!",
            status: true,
            userData: newUnit,
        });
    } catch (error) {
        logger.debug(error);
        res.status(500).send({ message: error.message || "Internal server error", status: false });
    }
};



exports.updateBuilderUnit = async (req, res) => {
    try {
        // Check if the unit name is already in use by another unit
        const existingUnit = await Unit.findOne({
            where: {
                unit_id: { [Op.ne]: req.body.unit_id },
                unit_name: req.body.unit_name,
            },
        });

        if (existingUnit) {
            return res
                .status(400)
                .send({ message: "Unit name already in use", status: false });
        }

        const unit_id = req.body.unit_id;

        // Update the unit details
        const [updateResult] = await Unit.update(
            {
                unit_name: req.body.unit_name,
                address: req.body.address,
            },
            {
                where: {
                    unit_id: req.body.unit_id,
                },
            }
        );

        if (updateResult === 0) {
            return res.status(404).send({ message: "Unit not found", status: false });
        }

        const validateUpdatedFloorRange = async (wingId, floorId, startRange, endRange) => {
            // Find all BuilderConsumer entries for the same wing and floor
            const existingOffices = await builderConsumer.findAll({
                where: {
                    wing_id: wingId,
                    floor_id: floorId
                },
            });

            // If there are existing offices in the new range, throw an error
            if (existingOffices.length > 0) {
                const occupiedOffices = existingOffices.map((office) => office.office_no);

                // Check if the office numbers in the new range are valid with the existing ranges
                for (const office of occupiedOffices) {
                    // If any office is outside the new range, reject the update
                    if (office < startRange || office > endRange) {
                        throw new Error(`The office number ${office} is already assigned, and the new range ${startRange} to ${endRange} would exclude it.`);
                    }
                }
            }
        };

        const processWingsAndFloors = async (categoryName, categoryData, categoryId) => {
            // Check if the category exists in UnitCategoryDetail; if not, create it
            let unitCategoryDetail = await UnitCategoryDetail.findOne({
                where: { unit_id, unit_category_id: categoryId },
            });

            if (!categoryData?.wings?.length) {
                // If category is empty and exists, delete all associated wings, floors, and the UnitCategoryDetail itself
                if (unitCategoryDetail) {
                    const existingWings = await Wing.findAll({
                        where: { unit_id, unit_category_detail_id: unitCategoryDetail.unit_category_detail_id },
                        include: [{ model: floor }],
                    });

                    // Delete all floors and wings
                    for (const wing of existingWings) {
                        await floor.destroy({ where: { wing_id: wing.wing_id } }); // Delete floors
                        await Wing.destroy({ where: { wing_id: wing.wing_id } }); // Delete wings
                    }

                    // Delete the category itself
                    await UnitCategoryDetail.destroy({
                        where: { unit_category_detail_id: unitCategoryDetail.unit_category_detail_id },
                    });
                }
                return;
            }

            const totalCount = categoryData?.summary?.totalCount || 0;
            const floorCount = categoryData?.summary?.floorCount || 0;
            const wingCount = categoryData?.summary?.wingCount || 0;
            if (!unitCategoryDetail) {
                unitCategoryDetail = await UnitCategoryDetail.create({
                    unit_id,
                    unit_category_id: categoryId,
                    totalCount,
                    floorCount,
                    wingCount,
                });
            } else {
                // Update the category with the counts
                await UnitCategoryDetail.update(
                    { totalCount, floorCount, wingCount },
                    { where: { unit_category_detail_id: unitCategoryDetail.unit_category_detail_id } }
                );
            }

            const unitCategoryId = unitCategoryDetail.unit_category_detail_id;

            // Get all existing wings for the given unit and category
            const existingWings = await Wing.findAll({
                where: { unit_id, unit_category_detail_id: unitCategoryId },
                include: [{ model: floor }],
            });

            // Map existing data for quick lookup
            const existingWingMap = {};
            existingWings.forEach((wing) => {
                existingWingMap[wing.wing_id] = {
                    ...wing.toJSON(),
                    floors: wing.floors || [],
                };
            });

            const inputWingIds = [];
            for (const inputWing of categoryData.wings) {
                const { wingId, wingName, floors } = inputWing;

                for (const floor of floors) {
                    if (floor.startRange > floor.endRange) {
                        throw new Error(
                            `Invalid floor range for wing "${wingName}": startRange (${floor.startRange}) must be less than or equal to endRange (${floor.endRange}).`
                        );
                    }
                }

                let wingIdToUse = wingId;
                // Check if wing exists
                if (wingId && existingWingMap[wingId]) {
                    // Update wing if it already exists
                    await Wing.update(
                        { wing_name: wingName },
                        { where: { wing_id: wingId } }
                    );
                    inputWingIds.push(wingId);
                } else {
                    // Create new wing if not exists
                    const newWing = await Wing.create({
                        unit_id,
                        unit_category_detail_id: unitCategoryId,
                        wing_name: wingName,
                    });
                    inputWing.wingId = newWing.wing_id; // Update inputWing with new wingId
                    inputWingIds.push(newWing.wing_id);
                    wingIdToUse = newWing.wing_id;
                }

                const existingFloors = existingWingMap[inputWing.wingId]?.floors || [];
                const existingFloorMap = {};
                existingFloors.forEach((floor) => {
                    existingFloorMap[floor.floor_id] = floor;
                });

                const inputFloorIds = [];
                for (const inputFloor of floors) {
                    const { floor_id, floorNumber, startRange, endRange } = inputFloor;

                    // Validate office number range on this wing/floor
                    if (floor_id && wingIdToUse) {
                        await validateUpdatedFloorRange(wingIdToUse, floor_id, startRange, endRange);
                    }
                    // Check if floor exists
                    if (floor_id && existingFloorMap[floor_id]) {
                        // Update floor if it already exists
                        await floor.update(
                            {
                                floorNumber,
                                floor_start: startRange,
                                floor_end: endRange,
                            },
                            { where: { floor_id } }
                        );
                        inputFloorIds.push(floor_id);
                    } else {
                        // Create new floor if not exists
                        const newFloor = await floor.create({
                            unit_id,
                            wing_id: inputWing.wingId,
                            unit_category_detail_id: unitCategoryId,
                            floorNumber,
                            floor_start: startRange,
                            floor_end: endRange,
                        });
                        inputFloor.floor_id = newFloor.floor_id; // Update inputFloor with new floor_id
                        inputFloorIds.push(newFloor.floor_id);
                    }
                }

                // Delete floors not in input
                for (const existingFloor of existingFloors) {
                    if (!inputFloorIds.includes(existingFloor.floor_id)) {
                        await floor.destroy({ where: { floor_id: existingFloor.floor_id } });
                    }
                }
            }

            // Delete wings not in input
            for (const existingWing of existingWings) {
                if (!inputWingIds.includes(existingWing.wing_id)) {
                    await Wing.destroy({ where: { wing_id: existingWing.wing_id } });
                }
            }
        };

        await processWingsAndFloors("Showroom", req.body?.Showroom, UNIT_CATEGORY_IDS.SHOWROOM);
        await processWingsAndFloors("Office", req.body?.Office, UNIT_CATEGORY_IDS.OFFICE);
        await processWingsAndFloors("Flat", req.body?.Flat, UNIT_CATEGORY_IDS.FLAT);
        await processWingsAndFloors("House", req.body?.House, UNIT_CATEGORY_IDS.HOUSE);

        res.status(200).send({
            message: "Unit details updated successfully!",
            status: true,
        });
    } catch (error) {
        logger.error(error);
        res.status(500).send({ message: error.message || "Internal server error" });
    }
};



exports.addBuilderUnitCategory = async (req, res) => {
    try {
        const { unit_id, unit_category_id, count } = req.body;
        const result = await builderService.addUnitCategory({ unit_id, unit_category_id, count });

        if (result.noUnit) {
            return res.status(400).send({ message: "unit id not exist", status: false });
        }
        if (result.conflict) {
            return res.status(400).send({ message: "Unit category already in use", status: false });
        }
        return res.send(
            JSON.stringify({
                response: "builder unit successfully added!",
                status: true,
                userData: result.created,
            })
        );
    } catch (e) {
        logger.error({ err: e }, "addBuilderUnitCategory failed");
        return res.status(500).send({ message: "error", status: false });
    }
};


exports.updateBuilderUnitCategory = async (req, res) => {
    let user = await UnitCategoryDetail.findOne({
        where: {
            unit_category_detail_id: { [Op.ne]: req.body.CategoryUnitId },
            unit_category_id: req.body.unit_category_id,
            unit_id: req.body.unit_id,
        },
    });
    if (user) {
        return res
            .status(400)
            .send({ message: "Unit category already in use", status: false });
    }
    UnitCategoryDetail.update(
        {
            unit_category_id: req.body.unit_category_id,
            count: req.body.count,
        },
        {
            where: {
                unit_category_detail_id: req.body.CategoryUnitId,
            },
        }
    )
        .then(async (articles) => {
            return res.status(200).send({
                message: "builder unit category successfully updated!",
                status: true,
                userData: articles,
            });
        })
        .catch((e) => {
            res.send({ message: e?.message });
            logger.debug(e);
        });
};


/**
 * DELETE /user/data/builder/unit/:id — delete a building (and its wings/floors/
 * categories). Blocked if any consumer is still placed in it (vacate them first).
 */
exports.deleteBuilderUnit = async (req, res) => {
  try {
    const unit_id = req.params.id;
    const unit = await Unit.findOne({ where: { unit_id } });
    if (!unit) return res.status(404).json({ status: false, message: "Building not found" });
    const placed = await builderConsumer.count({ where: { unit_id } });
    if (placed > 0) {
      return res.status(400).json({ status: false, message: `Cannot delete — ${placed} consumer(s) are placed in this building. Vacate them first.` });
    }
    await floor.destroy({ where: { unit_id } });
    await Wing.destroy({ where: { unit_id } });
    await UnitCategoryDetail.destroy({ where: { unit_id } });
    await Unit.destroy({ where: { unit_id } });
    return res.status(200).json({ status: true, message: "Building deleted" });
  } catch (e) {
    logger.error({ err: e }, "deleteBuilderUnit failed");
    return res.status(500).json({ status: false, message: e.message });
  }
};
