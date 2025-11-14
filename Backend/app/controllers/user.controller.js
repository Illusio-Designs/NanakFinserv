const db = require("../models/index");
const jwt = require("jsonwebtoken");
const authConfig = require("../config/authConfig");
const path = require("path");
const fs = require("fs").promises;
const fsSync = require("fs");
const { v4: uuidv4 } = require('uuid');

// Helper function to create notifications
const createNotification = async (notificationData) => {
    try {
        const notification = await db.notification.create({
            title: notificationData.title,
            message: notificationData.message,
            type: notificationData.type, // 'vehicle', 'mediclaim', 'loan', 'builder', 'system'
            category: notificationData.category, // 'user_added', 'user_updated', etc.
            user_id: notificationData.user_id || null,
            target_user_id: notificationData.target_user_id || null,
            record_id: notificationData.record_id || null,
            is_important: notificationData.is_important || false,
            metadata: notificationData.metadata || null
        });
        console.log('🔔 [NOTIFICATION] Created:', notification.title);
        return notification;
    } catch (error) {
        console.error('❌ [NOTIFICATION] Error creating notification:', error);
        return null;
    }
};
const User = db.user;
const Inqueryuser = db.inqueryuser;
const loanConfiguration = db.loanConfiguration;
const RunningPolicies = db.runningPolicyMediclaim;
const PreviousPolicies = db.previousPolicyMediclaim;
const BuilderUser = db.builderUser;
const BuildingManager = db.buildingManager;
const DocumentSelectedLoan = db.documentSelectedLoan;
const DisbursementLoan = db.disbursementLoan;
const PartPaymentLoan = db.partPaymentLoan;
const codeDetail = db.codeDetail;
const vehicles = db.vehicles;
const references = db.references;
const documents = db.documents;
const policyPlan = db.policyPlan;
const vehicleUser = db.vehicleUser;
const vehcileRunningPolicy = db.vehcileRunningPolicy;
const vehiclePreviousPolicy = db.vehiclePreviousPolicy;
const vehicle_document = db.vehicle_document;
const policyType = db.policyType;
const companyType = db.companyType;
const LoginLoan = db.loginLoan;
const property = db.property;
const SanctionLoan = db.sanctionLoan;
const QueryLoan = db.queryLoan;
const CancelLoan = db.cancelLoan;
const Category = db.category;
const MediclaimCompany = db.mediclaimCompany;
const unit_category_list = db.unit_category_list;
const MediclaimProduct = db.mediclaimProduct;
const userCatergory = db.userCategory;
const Unit = db.unit;
const UnitCategoryDetail = db.unit_category_detail;
const builderConsumer = db.builderConsumer;
const consumerRoleMapping = db.consumerRoleMapping;
const UnitCategoryList = db.unit_category_list;
const FamilyMember = db.familyMember;
const loanUser = db.loanUser;
const Disburse = db.disburse;
const Mediclaim = db.medicliamuser;
const EmployeeMediclaim = db.employeeMediclaim;
const floor = db.floor;
const Wing = db.wing;
const Blog = db.blog;
const LifeInsurance = db.lifeInsurance;
const LifeInsuranceDocument = db.lifeInsuranceDocument;
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const moment = require("moment");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const fsExtra = require("fs-extra");
const dotenvParseVariables = require("dotenv-parse-variables");
let env = require('dotenv').config();
env = dotenvParseVariables(env.parsed);

exports.userChek = async (req, res) => {
    return res.send({ messge: "Api test", env: process?.env });
};

exports.verifyUser = async (req, res) => {
    User.findOne({
        where: {
            [Op.or]: [
                { mobileNumber: req.body.mobileNumber },
                // { email: req.body.email },
            ],
        },
        raw: true,
        nest: true,
    })
        .then(async (user) => {
            if (!user) {
                res.status(400).send({ error: "User Not found.", status: false });
            } else {
                let jwtObj = {
                    Email: user.email,
                    name: user.username,
                    mobileNumber: user.mobileNumber,
                    Role: user.role_id,
                    id: user.user_id,
                };

                if (user.role_id == 2) {
                    let builder = await BuilderUser.findOne({
                        where: {
                            user_id: user.user_id,
                        },
                        raw: true,
                        attributes: ["builder_id"],
                    });
                    jwtObj.builder_id = builder.builder_id;
                }
                console.log(jwtObj, "jwtObj");
                let category = await userCatergory.findAll({
                    where: {
                        user_id: user.user_id,
                    },
                    attributes: ["user_id"],
                    include: [
                        { model: Category, attributes: ["category_id", "category_name"] },
                    ],
                    raw: true,
                });

                const categoryIds = Array.from(new Set([
                    ...(category ? category.map(item => item['category.category_id']) : []),
                    user.role_id
                ]));
                jwtObj.categoryIds = categoryIds;
                const token = jwt.sign(jwtObj, authConfig.secret, { expiresIn: 86400 });
                if (token) {
                    let tokenAdd = await User.update(
                        { roken: token },
                        {
                            where: {
                                id: user.user_id,
                            },
                        }
                    );
                }
                let userData = {
                    email: user.email,
                    name: user.username,
                    mobileNumber: user.mobileNumber,
                    role_id: user.role_id,
                    user_id: user.user_id,
                    category: category,
                    categoryIds: categoryIds,
                };

                if (jwtObj?.builder_id) {
                    userData.builder_id = jwtObj.builder_id;
                }

                // let userData = {};
                // Object.assign(userData, user);
                return res.send({
                    token,
                    user: userData,
                    message: "valid",
                });
            }
        })
        .catch((err) => {
            res.status(500).send({ message: err.message });
        });
};

exports.verifyUserLogin = async (req, res) => {
    User.findOne({
        where: {
            [Op.or]: [
                { mobileNumber: req.body.mobileNumber },
                // { email: req.body.email },
            ],
        },
        raw: true,
        nest: true,
    })
        .then(async (user) => {
            if (!user) {
                // return res.send({ error: "User Not found.",status:false });
                res.status(400).send({ error: "User Not found.", status: false });
            } else {
                res.status(200).send({ error: "User found.", status: true });
            }
        })
        .catch((err) => {
            res.status(500).send({ message: err.message });
        });
};

exports.getAllUsers = async (req, res) => {
    whereObj = {};
    if (req?.user.Role == 2) {
        whereObj.builder_user = req.user.id;
    }
    whereObj.role_id = [3, 5]; // Consumer and builder consumer roles (exclude Building Manager role 7)

    if (req.user.Role != 1) {
        User.findAll({
            order: [["username", "asc"]],
            where: whereObj,
            attributes: ['user_id', 'username', 'email', 'mobileNumber', 'referenceName', 'role_id', 'builder_user', 'created_by', 'updated_by', 'is_from_builder_user', 'createdAt', 'updatedAt'],
            include: [
                {
                    model: db.role,
                    attributes: ['role_name'],
                    as: 'role'
                }
            ]
        })
            .then(async (articles) => {
                const updatedArticles = await Promise.all(
                    articles.map(async (item) => {
                        const crList = await consumerRoleMapping.findAll({
                            where: {
                                user_consumer_id: item.user_id,
                            },
                            include: [
                                {
                                    model: User,
                                    as: "userRoles",
                                    attributes: ["username", "email"],
                                },
                                {
                                    model: db.category,
                                    attributes: ["category_name"],
                                    as: "category"
                                }
                            ],
                            raw: true,
                        });
                        
                        // Format the role display for multiple categories
                        let roleDisplay = 'N/A';
                        if (crList && crList.length > 0) {
                            const roleDisplays = crList.map(mapping => {
                                const categoryName = mapping['category.category_name'] || 'N/A';
                                const roleUserName = mapping['userRoles.username'] || 'N/A';
                                return `(Vertical = ${categoryName} : Role User : ${roleUserName})`;
                            });
                            roleDisplay = roleDisplays.join(' | ');
                        }
                        
                        item.category = crList;
                        item.roleDisplay = roleDisplay;
                        return item;
                    })
                );
                
                // Filter out Building Managers from consumer list
                const filteredArticles = updatedArticles.filter(item => {
                    return item.role_id !== 7; // Exclude Building Manager role ID 7
                });
                
                res.status(200).send({
                    message: "consumer get success",
                    data: filteredArticles,
                    status: true,
                });
            })
            .catch((e) => console.log(e));
    } else {
        await User.findAll({
            order: [["username", "asc"]],
            where: whereObj,
            attributes: ['user_id', 'username', 'email', 'mobileNumber', 'referenceName', 'role_id', 'builder_user', 'created_by', 'updated_by', 'is_from_builder_user', 'createdAt', 'updatedAt'],
            include: [
                {
                    model: db.role,
                    attributes: ['role_name'],
                    as: 'role'
                }
            ],
            raw: true,
        })
            .then(async (articles) => {
                const updatedArticles = await Promise.all(
                    articles.map(async (item) => {
                        const crList = await consumerRoleMapping.findAll({
                            where: {
                                user_consumer_id: item.user_id,
                            },
                            include: [
                                {
                                    model: User,
                                    as: "userRoles",
                                    attributes: ["username", "email"],
                                },
                                {
                                    model: db.category,
                                    attributes: ["category_name"],
                                    as: "category"
                                }
                            ],
                            raw: true,
                        });
                        
                        // Format the role display for multiple categories
                        let roleDisplay = 'N/A';
                        if (crList && crList.length > 0) {
                            const roleDisplays = crList.map(mapping => {
                                const categoryName = mapping['category.category_name'] || 'N/A';
                                const roleUserName = mapping['userRoles.username'] || 'N/A';
                                return `(Vertical = ${categoryName} : Role User : ${roleUserName})`;
                            });
                            roleDisplay = roleDisplays.join(' | ');
                        }
                        
                        item.category = crList;
                        item.roleDisplay = roleDisplay;
                        return item;
                    })
                );
                
                // Filter out Building Managers from consumer list
                const filteredArticles = updatedArticles.filter(item => {
                    return item.role_id !== 7; // Exclude Building Manager role ID 7
                });
                
                res.status(200).send({
                    message: "consumer get success",
                    data: filteredArticles,
                    status: true,
                });
            })
            .catch((e) => console.log(e));
    }
};

exports.getUserCounts = async (req, res) => {
    try {
        const consumerWhereObj = {};
        const builderWhereObj = { role_id: 5 }; // Builder consumers keep role_id 5
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

        if (req.user.Role === 4) {
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
        if (req?.user.Role === 2) {
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
        // Check if user is Super Admin (role_id === 1 OR has Super Admin category access)
        const isSuperAdmin = req.user.Role === 1 || (req.user.categoryIds && req.user.categoryIds.includes(1));
        
        console.log('🔍 [USER COUNTS] User Role:', req.user.Role);
        console.log('🔍 [USER COUNTS] User categoryIds:', req.user.categoryIds);
        console.log('🔍 [USER COUNTS] Is Super Admin:', isSuperAdmin);
        
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
                consumerRoleMapping.count({ where: { category_id: 2 } }), // Count loan consumers from role mapping
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
                consumerRoleMapping.count({ where: { category_id: 4 } }), // Count mediclaim consumers from role mapping
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
                consumerRoleMapping.count({ where: { category_id: 6 } }), // <-- count all vehicle users (same as admin)
                consumerRoleMapping.count({ where: { category_id: 5 } }) // <-- count all life insurance users
            ]);

            console.log('🔍 [COUNTS DEBUG] ===== USER COUNTS RESULTS =====');
            console.log('🔍 [COUNTS DEBUG] Total Consumer Count:', consumerCount);
            console.log('🔍 [COUNTS DEBUG] Mediclaim Consumer Count:', mediclaimUserCount);
            console.log('🔍 [COUNTS DEBUG] Vehicle Consumer Count:', vehicleUserCount);
            console.log('🔍 [COUNTS DEBUG] Life Insurance Consumer Count:', lifeUserCount);
            console.log('🔍 [COUNTS DEBUG] Loan Consumer Count:', loanUserCount);
            console.log('🔍 [COUNTS DEBUG] Loan Interested Count:', loanInterstedUserCount);
            console.log('🔍 [COUNTS DEBUG] Loan Not Interested Count:', loanNotInterstedUserCount);
            console.log('🔍 [COUNTS DEBUG] Loan Completed Count:', loanCompletedUserCount);
            console.log('🔍 [COUNTS DEBUG] Loan Not Assigned Count:', loanNotAssignUserCount);
            console.log('🔍 [COUNTS DEBUG] ===== AMOUNT VALUES =====');
            console.log('🔍 [COUNTS DEBUG] Today - Total Loan Amount:', totalLoandAmount);
            console.log('🔍 [COUNTS DEBUG] Today - Total Disbursed Amount:', totalDisbursedAmount);
            console.log('🔍 [COUNTS DEBUG] Today - Total Part Payment Amount:', totalPartPaymentAmount);
            console.log('🔍 [COUNTS DEBUG] All-time - Total Loan Amount:', allTimeLoandAmount);
            console.log('🔍 [COUNTS DEBUG] All-time - Total Disbursed Amount:', allTimeDisbursedAmount);
            console.log('🔍 [COUNTS DEBUG] All-time - Total Part Payment Amount:', allTimePartPaymentAmount);
            console.log('🔍 [COUNTS DEBUG] Final - Total Loan Amount:', totalLoandAmount || allTimeLoandAmount || 0);
            console.log('🔍 [COUNTS DEBUG] Final - Total Disbursed Amount:', totalDisbursedAmount || allTimeDisbursedAmount || 0);
            console.log('🔍 [COUNTS DEBUG] Final - Total Part Payment Amount:', totalPartPaymentAmount || allTimePartPaymentAmount || 0);
            console.log('🔍 [COUNTS DEBUG] ======================================');

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

            console.log('🔍 [COUNTS DEBUG] ===== CATEGORY COUNTS SENT TO FRONTEND =====');
            console.log('🔍 [COUNTS DEBUG] Category Counts:', responseData.data.categoryCounts);
            console.log('🔍 [COUNTS DEBUG] ===============================================');

            res.status(200).send(responseData);
        } else if (req.user.Role === 2) {
            const [consumerCount, builderUserCount, lifeUserCount] = await Promise.all([
                User.count({ where: consumerWhereObj }),
                User.count({ where: builderWhereObj }),
                consumerRoleMapping.count({ where: { category_id: 5 } }) // <-- count life insurance users
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
        } else if (req.user.Role === 4) {
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
                    count = await consumerRoleMapping.count({
                        where: { category_id: 2 }, // Show total count, not just assigned
                    });
                } else if (categoryId == 4) { // Mediclaim
                    count = await consumerRoleMapping.count({
                        where: { user_role_id: req.user.id, category_id: 4 },
                    });
                } else if (categoryId == 6) { // Vehicle
                    count = await consumerRoleMapping.count({
                        where: { category_id: 6 }, // Show total count, not just assigned
                    });
                } else if (categoryId == 5) { // Life Insurance
                    count = await consumerRoleMapping.count({
                        where: { category_id: 5 }, // Show total count, not just assigned
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
        console.error(error);
        res.status(500).send({
            message: "Error fetching counts",
            error: error.message,
            status: false,
        });
    }
};



exports.downloadFile = async (req, res) => {
    try {
        const filename = req.params.filename;
        // const filePath = path.join(__dirname, 'public/uploads', filename);
        const filePath = path.join(__dirname, "../../uploads", filename);

        console.log('📥 [DOWNLOAD] Request for file:', filename);
        console.log('📥 [DOWNLOAD] Full path:', filePath);

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
exports.getLoanAmounFilterDate = async (req, res) => {
    try {

        const startDay = new Date(req.body.start_date);
        const endDay = new Date(req.body.end_date);

        const startOfDay = new Date(startDay.setHours(0, 0, 0, 0));
        const endOfDay = new Date(endDay.setHours(23, 59, 59, 999));

        // Adding filters for today's total loan and disbursed amount
        const totalDisbursedFilter = { disbursementDate: { [Op.between]: [startOfDay, endOfDay] } };
        const totalLoanedFilter = { loanDate: { [Op.between]: [startOfDay, endOfDay] } };
        const totalPartPaymentFilter = { part_date: { [Op.between]: [startOfDay, endOfDay] } };


        // Execute both counts in parallel using Promise.all
        if (req.user.Role === 1) {
            const [totalDisbursedAmount, totalLoandAmount, totalPartPaymentAmount] = await Promise.all([
                DisbursementLoan.sum('disbursementAmount', { where: totalDisbursedFilter }),
                LoginLoan.sum('loanAmount', { where: totalLoanedFilter }),
                PartPaymentLoan.sum('part_amount', { where: totalPartPaymentFilter })
            ]);
            res.status(200).send({
                message: "Counts fetched successfully",
                data: {
                    totalLoandAmount,
                    totalDisbursedAmount,
                    totalPartPaymentAmount
                },
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
        console.error(error);
        res.status(500).send({
            message: "Error fetching counts",
            error: error.message,
            status: false,
        });
    }
};


exports.getAllBuilderUsers = async (req, res) => {
    wherObj = {};
    if (req?.user.Role == 1) {
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
            console.log(e);
        });
};

exports.getAllBuilderListUsers = async (req, res) => {
    console.log(req.user, 'req.user')
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
            console.log(e);
        });
};

exports.getCategoryById = async (req, res) => {
    userCatergory
        .findAll({
            include: [Category],
            where: {
                user_id: req.body.user_id,
            },
            raw: true,
            // attributes:[['id','key'],['name','value']]
        })
        .then((articles) => {
            res.status(200).send({
                message: "user category get success",
                data: articles,
                status: true,
            });
        })
        .catch((e) => {
            res.status(400).send({ message: "error", status: false });
            console.log(e);
        });
};
exports.getAllRolesUsers = async (req, res) => {
    console.log('🔍 [ROLE MANAGER] Filtering users with role_id:', [1, 2, 3]);
    
    // Auto-fix super admin categories when loading role management page
    try {
        console.log('🔍 [AUTO FIX] Checking super admin categories...');
        
        // Find all users with role_id = 1 (super admin)
        const superAdmins = await User.findAll({
            where: { role_id: 1 },
            attributes: ['user_id', 'username', 'email']
        });
        
        for (const admin of superAdmins) {
            // Check if they have all required categories
            const existingCategories = await userCatergory.findAll({
                where: { user_id: admin.user_id },
                attributes: ['category_id']
            });
            
            const existingCategoryIds = existingCategories.map(cat => cat.category_id);
            const requiredCategories = [2, 4, 5, 6]; // Loan, Mediclaim, Life Insurance, Vehicle
            
            const missingCategories = requiredCategories.filter(catId => !existingCategoryIds.includes(catId));
            
            if (missingCategories.length > 0) {
                console.log(`🔍 [AUTO FIX] User ${admin.username} missing categories:`, missingCategories);
                
                // Add missing categories
                const categoryData = missingCategories.map(categoryId => ({
                    user_id: admin.user_id,
                    category_id: categoryId,
                }));
                
                await userCatergory.bulkCreate(categoryData);
                console.log(`✅ [AUTO FIX] Added missing categories for ${admin.username}:`, categoryData);
            }
        }
    } catch (error) {
        console.error('❌ [AUTO FIX] Error fixing super admin categories:', error);
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
                [Op.or]: [1, 4], // Show admin and user roles (exclude builder, consumer and mediclaim users)
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
            console.log(e);
        });
};

exports.getAllRoles = async (req, res) => {
    Category.findAll({
        raw: true,
        // attributes:[['id','key'],['name','value']]
    })
        .then((articles) => {
            res
                .status(200)
                .send({ message: "role get success", data: articles, status: true });
        })
        .catch((e) => {
            res.status(400).send({ message: "role error", status: false });
            console.log(e);
        });
};

exports.addRoleWiseUser = (req, res) => {
    console.log(req.body);
    User.findOne({
        where: {
            [Op.or]: [
                { mobileNumber: req.body.phone_number },
                // { email: req.body.email },
            ],
        },
    })
        .then(async (user) => {
            console.log(user);
            if (user) {
                return res
                    .status(400)
                    .send({ message: "User already exist.", status: false });
            } else {
                User.create({
                    username: req.body.username,
                    email: req.body.email,
                    mobileNumber: req.body.phone_number,
                    role_id: req.body.role == 1 ? 1 : 4,
                    referenceName: req.body.referenceName,
                    otp: "",
                    token: "",
                })
                    .then(async (articles) => {

                        // req.body.roleId contains category IDs (not role IDs)
                        let roles = req.body.roleId
                            .toString() // Ensure it's a string
                            .split(',') // Split by comma
                            .map(Number); // Convert each to a number
                        
                        // For super admin (role_id = 1), assign ALL categories automatically
                        if (req.body.role == 1) {
                            // Super admin gets access to all categories: 2, 4, 5, 6 (Loan, Mediclaim, Life Insurance, Vehicle)
                            roles = [2, 4, 5, 6];
                            console.log('🔍 [SUPER ADMIN] Assigning all categories to super admin:', roles);
                        }
                        
                        let categoryData = roles.map((roleId) => ({
                            user_id: articles.user_id,
                            category_id: roleId,
                        }));

                        // Bulk insert into userCategory table
                        await userCatergory.bulkCreate(categoryData);
                        console.log('🔍 [ROLE ASSIGNMENT] Categories assigned:', categoryData);
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

exports.updateRoleWiseUser = async (req, res) => {
    console.log(req.body);
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
                console.log('🔍 [SUPER ADMIN UPDATE] Assigning all categories to super admin:', roles);
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
            console.log('🔍 [ROLE UPDATE] Categories assigned:', categoryData);
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
            console.log(user);
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
                        // console.log(e.message)
                    });
            }
        })
        .catch((err) => {
            res.status(500).send({ message: err.message });
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

exports.addConsumerData = async (req, res) => {
    console.log('🔍 [ADD CONSUMER] Starting consumer creation...');
    console.log('🔍 [ADD CONSUMER] Request body:', req.body);
    console.log('🔍 [ADD CONSUMER] User role:', req.user.Role);
    console.log('🔍 [ADD CONSUMER] Categories:', req.body?.category);
    
    try {
    let buildeUser;
    if (req.user.Role == 1) {
        buildeUser = req.body.builderType;
        console.log('🔍 [ADD CONSUMER] Admin user - Builder Type:', buildeUser);
    } else {
        if (req.user.Role == 2) {
            buildeUser = req.user.id;
            console.log('🔍 [ADD CONSUMER] Builder user - Builder ID:', buildeUser);
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
            console.log('🔍 [ADD CONSUMER] User found with mobile number:', req.body.phone_number, 'User ID:', user.user_id);
            
            // Check if user is already assigned to any of the requested categories
            const existingMappings = await consumerRoleMapping.findAll({
                where: {
                    user_consumer_id: user.user_id,
                    category_id: req.body?.category?.map(cat => cat.category_id) || []
                }
            });

            console.log('🔍 [ADD CONSUMER] Existing mappings:', existingMappings);

            // Filter out categories that are already assigned
            const newCategories = req.body?.category?.filter(cat => 
                !existingMappings.some(mapping => mapping.category_id === cat.category_id)
            ) || [];

            if (newCategories.length > 0) {
                console.log('🔍 [ADD CONSUMER] Adding new category mappings for existing user');
                const newMappings = newCategories.map(cat => ({
                    user_role_id: cat.user_role_id,
                    user_consumer_id: user.user_id,
                    category_id: cat.category_id,
                }));

                await consumerRoleMapping.bulkCreate(newMappings);
                console.log('✅ [ADD CONSUMER] New category mappings created for existing user');
            } else {
                console.log('ℹ️ [ADD CONSUMER] User already assigned to all requested categories');
            }

            userData = user;
        } else {
            console.log('➕ [ADD CONSUMER] User not found, creating new user...');
            userData = await User.create({
                username: req.body.username,
                email: req.body.email,
                mobileNumber: req.body.phone_number,
                role_id: 3,
                referenceName: req.body.referenceName,
                created_by: req.user.id,
                updated_by: req.user.id,
                builder_user: buildeUser || null,
                otp: "",
                token: "",
            });

            console.log('🔍 [ADD CONSUMER] User created successfully:', userData);
        }

                    console.log('🔍 [ADD CONSUMER] Checking vertical assignment conditions...');
                    console.log('🔍 [ADD CONSUMER] User Role check:', req.user.Role == 1 || req.user.Role == 4);
                    console.log('🔍 [ADD CONSUMER] Category check:', req.body?.category && req.body.category.length);
                    
                    if (
                        (req.user.Role == 1 || req.user.Role == 4) &&
                        req.body?.category &&
                        req.body.category.length
                    ) {
                        console.log('🔍 [ADD CONSUMER] Vertical assignment conditions met!');
                        let array = [];
                        req.body.category.map((item) => {
                            console.log('🔍 [ADD CONSUMER] Processing category item:', item);
                            array.push({
                                user_role_id: item.user_role_id,
                    user_consumer_id: userData.user_id,
                                category_id: item.category_id,
                            });
                        });

                        console.log('🔍 [ADD CONSUMER] ConsumerRoleMapping array:', array);
                        let Rs = await consumerRoleMapping.bulkCreate(array);
                        console.log('🔍 [ADD CONSUMER] ConsumerRoleMapping created:', Rs);

                        let findLoan = array.find((item) => item.category_id == 2);
                        if (findLoan) {
                            console.log('🔍 [ADD CONSUMER] Creating loan user for category 2');
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
                        let findMediclaim = array.find((item) => item.category_id == 4);
                        if (findMediclaim) {
                            console.log('🔍 [ADD CONSUMER] Creating mediclaim for category 4');
                            await Mediclaim.create({
                                user_id: findMediclaim.user_consumer_id,
                            });
                        }
            let findLifeInsurance = array.find((item) => item.category_id == 5);
            if (findLifeInsurance) {
                console.log('🔍 [ADD CONSUMER] Creating life insurance for category 5');
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
                        console.log('❌ [ADD CONSUMER] Vertical assignment conditions NOT met!');
                        console.log('❌ [ADD CONSUMER] User Role:', req.user.Role);
                        console.log('❌ [ADD CONSUMER] Required roles for vertical assignment: 1 or 4');
                        console.log('❌ [ADD CONSUMER] Categories provided:', req.body?.category);
                        console.log('❌ [ADD CONSUMER] Categories length:', req.body?.category?.length);
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
        console.error('❌ [ADD CONSUMER] Error:', error);
        res.status(500).send({ message: error.message });
    }
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
        if ((req.user.Role == 1 || req.user.Role == 4) && req.body?.category && req.body.category.length) {
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
            let findLoan = array.find((item) => item.category_id == 2);
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
            let findMediclaim = array.find((item) => item.category_id == 4);
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
            let findLifeInsurance = array.find((item) => item.category_id === 5);
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

            let findVehicle = array.find((item) => item.category_id === 6);
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
        console.error(e);
        return res.status(500).send({ response: "An error occurred", status: false });
    }
};





exports.updateLoanConsumerData = async (req, res) => {
    try {
        console.log('🔍 updateLoanConsumerData - Request body:', req.body);
        console.log('🔍 updateLoanConsumerData - Status:', req.body.status);
        console.log('🔍 updateLoanConsumerData - Sanction Details:', req.body.sanction_details);
        console.log('🔍 updateLoanConsumerData - User Consumer ID:', req.body.user_consumer_id);
        console.log('🔍 updateLoanConsumerData - Loan ID:', req.body.laon_id);
        
        // Test loanUser model functionality
        try {
            console.log('🔍 [TEST] Testing loanUser model...');
            const testQuery = await loanUser.findOne({ 
                where: { laon_id: req.body.laon_id },
                raw: true,
                attributes: ['laon_id', 'status', 'user_id']
            });
            console.log('🔍 [TEST] loanUser test query result:', testQuery);
        } catch (testError) {
            console.error('❌ [TEST] Error testing loanUser model:', testError);
            return res.status(500).send({ 
                response: "Database connection error", 
                status: false,
                error: testError.message
            });
        }
        
        // Add comprehensive debugging for all status types
        console.log('🔍 [DEBUG] All incoming data for status:', req.body.status);
        console.log('🔍 [DEBUG] Document Details:', req.body.document_details);
        console.log('🔍 [DEBUG] Pickup Details:', req.body.pickup_details);
        console.log('🔍 [DEBUG] Query Details:', req.body.query_details);
        console.log('🔍 [DEBUG] Cancel Details:', req.body.cancel_details);
        console.log('🔍 [DEBUG] Login Details:', req.body.login_details);
        console.log('🔍 [DEBUG] Disbursement Details:', req.body.disbursement_details);
        console.log('🔍 [DEBUG] Part Payment Details:', req.body.part_details);
        console.log('🔍 [DEBUG] Completed Details:', req.body.completed_details);
        console.log('🔍 [DEBUG] Property Details:', req.body.property_details);
        
        console.log('🔍 [DEBUG] About to start status processing...');
        
        // Check if mobile number already exists for another user
        console.log('🔍 [DEBUG] Checking mobile number validation...');
        console.log('🔍 [DEBUG] Current user ID:', req.body.user_consumer_id);
        console.log('🔍 [DEBUG] Mobile number to check:', req.body.phone_number);
        
        // Get current user's existing mobile number for comparison
        const currentUserMobile = await User.findOne({
            where: { user_id: req.body.user_consumer_id },
            attributes: ['mobileNumber']
        });
        console.log('🔍 [DEBUG] Current user existing mobile number:', currentUserMobile?.mobileNumber);
        
        // Only check for conflicts if the mobile number is different from current user's
        if (currentUserMobile?.mobileNumber !== req.body.phone_number) {
            console.log('🔍 [DEBUG] Mobile number changed, checking for conflicts...');
            
        let user = await User.findOne({
            where: {
                    user_id: { [Op.ne]: req.body.user_consumer_id }, // Ignore current user
                mobileNumber: req.body.phone_number, // Check if mobile number exists
            },
        });

        if (user) {
                console.log('🔍 [DEBUG] Mobile number conflict found with user:', user.user_id);
            return res.status(400).send({ response: "Mobile number already in use", status: false });
        }

            console.log('🔍 [DEBUG] Mobile number validation passed - no conflicts found');
        } else {
            console.log('🔍 [DEBUG] Mobile number unchanged - no validation needed');
        }

        console.log('🔍 About to update User table with data:', {
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
        
        console.log('🔍 [BEFORE UPDATE] Current user data:', currentUser?.dataValues);
        console.log('🔍 [BEFORE UPDATE] Current referenceName:', currentUser?.dataValues?.referenceName);
        
        // Check if referenceName column exists in the user table
        try {
            const [columns] = await db.sequelize.query(`
                SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
                FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'user' 
                AND COLUMN_NAME = 'referenceName'
            `);
            console.log('🔍 [SCHEMA CHECK] referenceName column info:', columns);
        } catch (schemaError) {
            console.log('🔍 [SCHEMA CHECK] Error checking schema:', schemaError);
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
        
        console.log('🔍 User.update result:', updateResult);
        console.log('🔍 User table updated successfully');
        
        // Verify the update by fetching the user data
        const updatedUser = await User.findOne({
            where: { user_id: req.body.user_consumer_id },
            attributes: ['user_id', 'username', 'email', 'mobileNumber', 'referenceName', 'updated_by']
        });
        
        console.log('🔍 [VERIFICATION] User data after update:', updatedUser?.dataValues);
        console.log('🔍 [VERIFICATION] referenceName value:', updatedUser?.dataValues?.referenceName);

        let loanUserData = await loanUser.findOne({ where: { laon_id: req.body.laon_id } });
        console.log('🔍 Found loan user data:', loanUserData);

        if (!loanUserData) {
            return res.status(400).send({ response: "loan user not found", status: false });
        } else {
            // Update loan status
            await loanUser.update({ status: req.body.status }, { where: { laon_id: req.body.laon_id } });
            console.log('🔍 Loan status updated to:', req.body.status);

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
                    
                    console.log('🔍 Processing sanction details:', sanctionDetails);
                    
                    // Store sanction details in remarks field as JSON string
                    const remarksData = {
                        sanction_details: sanctionDetails
                    };
                    
                    console.log('🔍 About to update loanUser with remarks:', JSON.stringify(remarksData));
                    console.log('🔍 loanUser model type:', typeof loanUser);
                    console.log('🔍 loanUser model:', loanUser);
                    console.log('🔍 Where clause:', { laon_id: req.body.laon_id });
                    
                    // Check if the loanUser record exists before updating
                    const existingLoanUser = await loanUser.findOne({ 
                        where: { laon_id: req.body.laon_id },
                        raw: true 
                    });
                    
                    if (!existingLoanUser) {
                        console.error('❌ LoanUser record not found for laon_id:', req.body.laon_id);
                        return res.status(400).send({ 
                            response: "Loan user record not found", 
                            status: false,
                            error: `No loan user found with laon_id: ${req.body.laon_id}`
                        });
                    }
                    
                    console.log('🔍 Found existing loanUser record:', existingLoanUser);
                    
                    const updateResult = await loanUser.update({
                        remarks: JSON.stringify(remarksData)
                    }, { where: { laon_id: req.body.laon_id } });
                    
                    console.log('🔍 Sanction update result:', updateResult);
                    console.log('🔍 Sanction details stored in remarks field successfully');
                } catch (sanctionError) {
                    console.error('❌ Error updating sanction details:', sanctionError);
                    throw sanctionError; // Re-throw to be caught by outer try-catch
                }
            } 
            // Handle login details - store in remarks field as JSON
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
                
                console.log('🔍 Processing login details:', loginDetails);
                
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
                
                console.log('🔍 Remarks data to be stored:', remarksData);
                
                await loanUser.update({
                    remarks: JSON.stringify(remarksData)
                }, { where: { laon_id: req.body.laon_id } });
                console.log('🔍 Login details stored in remarks field successfully');
            }
            // Handle pickup details - store in remarks field as JSON
            else if (req.body.status === "pickup") {
                console.log('🔍 [PICKUP] Status matched! Starting pickup processing...');
                try {
                    const pickupDetails = {
                        pickupDate: req.body.pickup_details?.pickupDate,
                        pickupRemarks: req.body.pickup_details?.pickupRemarks,
                        updated_at: new Date().toISOString()
                    };
                    
                    console.log('🔍 Processing pickup details:', pickupDetails);
                    
                    const remarksData = {
                        pickup_details: pickupDetails
                    };
                    
                    console.log('🔍 About to update loanUser with remarks:', JSON.stringify(remarksData));
                    
                    const updateResult = await loanUser.update({
                        remarks: JSON.stringify(remarksData)
                    }, { where: { laon_id: req.body.laon_id } });
                    
                    console.log('🔍 Pickup update result:', updateResult);
                    console.log('🔍 Pickup details stored in remarks field successfully');
                } catch (pickupError) {
                    console.error('❌ Error updating pickup details:', pickupError);
                    throw pickupError; // Re-throw to be caught by outer try-catch
                }
            }
            // Handle query details - store in remarks field as JSON
            else if (req.body.status === "query") {
                const queryDetails = {
                    remarks: req.body.query_details?.remarks,
                    updated_at: new Date().toISOString()
                };
                
                console.log('🔍 Processing query details:', queryDetails);
                
                const remarksData = {
                    query_details: queryDetails
                };
                
                await loanUser.update({
                    remarks: JSON.stringify(remarksData)
                }, { where: { laon_id: req.body.laon_id } });
                console.log('🔍 Query details stored in remarks field successfully');
            }
            // Handle cancel details - store in remarks field as JSON
            else if (req.body.status === "cancel") {
                const cancelDetails = {
                    remarks_cancel: req.body.cancel_details?.remarks_cancel,
                    updated_at: new Date().toISOString()
                };
                
                console.log('🔍 Processing cancel details:', cancelDetails);
                
                const remarksData = {
                    cancel_details: cancelDetails
                };
                
                await loanUser.update({
                    remarks: JSON.stringify(remarksData)
                }, { where: { laon_id: req.body.laon_id } });
                console.log('🔍 Cancel details stored in remarks field successfully');
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
                
                console.log('🔍 Processing disbursement details:', disbursementDetails);
                
                const remarksData = {
                    disbursement_details: disbursementDetails
                };
                
                await loanUser.update({
                    remarks: JSON.stringify(remarksData)
                }, { where: { laon_id: req.body.laon_id } });
                console.log('🔍 Disbursement details stored in remarks field successfully');
            }
            // Handle part payment details - store in remarks field as JSON
            else if (req.body.status === "partPayment") {
                const partPaymentDetails = {
                    parts: req.body.part_details?.parts || [],
                    updated_at: new Date().toISOString()
                };
                
                console.log('🔍 Processing part payment details:', partPaymentDetails);
                
                const remarksData = {
                    part_details: partPaymentDetails
                };
                
                await loanUser.update({
                    remarks: JSON.stringify(remarksData)
                }, { where: { laon_id: req.body.laon_id } });
                console.log('🔍 Part payment details stored in remarks field successfully');
            }
            // Handle completed details - store in remarks field as JSON
            else if (req.body.status === "completed") {
                const completedDetails = {
                    completionDate: req.body.completed_details?.completionDate,
                    completionRemarks: req.body.completed_details?.completionRemarks,
                    updated_at: new Date().toISOString()
                };
                
                console.log('🔍 Processing completed details:', completedDetails);
                
                const remarksData = {
                    completed_details: completedDetails
                };
                
                await loanUser.update({
                    remarks: JSON.stringify(remarksData)
                }, { where: { laon_id: req.body.laon_id } });
                console.log('🔍 Completed details stored in remarks field successfully');
            }
            // Handle document selected details - store in remarks field as JSON
            else if (req.body.status === "documentselected") {
                const documentDetails = {
                    loan_type: req.body.document_details?.loan_type,
                    loan_type_name: req.body.document_details?.loan_type_name,
                    remarks_docs: req.body.document_details?.remarks_docs,
                    updated_at: new Date().toISOString()
                };
                
                console.log('🔍 Processing document details:', documentDetails);
                
                const remarksData = {
                    document_details: documentDetails
                };
                
                await loanUser.update({
                    remarks: JSON.stringify(remarksData)
                }, { where: { laon_id: req.body.laon_id } });
                console.log('🔍 Document details stored in remarks field successfully');
            }
            else {
                console.log('🔍 No specific details to process for status:', req.body.status);
            }
        }
        return res.status(200).send({ response: "User successfully updated!", status: true });
    } catch (e) {
        console.error('❌ Error in updateLoanConsumerData:', e);
        return res.status(500).send({ response: "An error occurred", status: false });
    }
};

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
            console.log('🔍 [ADD BUILDER] User found with mobile number:', req.body.phone_number, 'User ID:', user.user_id);
            
            // Check if user is already a builder
            const existingBuilder = await BuilderUser.findOne({
                where: {
                    user_id: user.user_id,
                },
            });

            if (existingBuilder) {
                console.log('ℹ️ [ADD BUILDER] User is already a builder');
                return res.send(
                    JSON.stringify({
                        errMessage: "This mobile number is already associated with a builder account.",
                        status: false,
                    })
                );
            } else {
                console.log('🔍 [ADD BUILDER] User exists but not a builder, creating builder profile...');
                
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
            console.log('➕ [ADD BUILDER] User not found, creating new user and builder profile...');
            
            // Create new user
            userData = await User.create({
                    username: req.body.username,
                    email: req.body.email,
                    mobileNumber: req.body.phone_number,
                    role_id: 2,
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
        console.error('❌ [ADD BUILDER] Error:', error);
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
            console.log(e);
        });
};

exports.getUnitsByBuilder = async (req, res) => {
    let whereObj = {};

    if (req.user.Role === 2) {
        whereObj.builder_id = req.user.builder_id;
    } else if (req.user.Role === 7) { // Building Manager role ID 7
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
            // console.log(articles);

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
                            const categoryKey = categoryId === 1
                                ? "Showroom"
                                : categoryId === 2
                                    ? "Office"
                                    : categoryId === 3
                                        ? "Flat"
                                        : "House";

                            // Add wings, floors, and counts to the correct category
                            categoryResponse[categoryKey] = {
                                wingCount,
                                floorCount,
                                wings: wingsRanges,
                            };

                            if (categoryId === 1) element.unit_showroomCount = totalCount;
                            if (categoryId === 2) element.unit_officeCount = totalCount;
                            if (categoryId === 3) element.unit_flatCount = totalCount;
                            if (categoryId === 4) element.unit_houseCount = totalCount;
                        })
                    );

                    return {
                        ...element,
                        Showroom: categoryResponse.Showroom,
                        Flat: categoryResponse.Flat,
                        Office: categoryResponse.Office,
                        House: categoryResponse.House,
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
            console.log(e);
        });
};

exports.getUintByConsumer = async (req, res) => {
    try {
        // Validation for missing required fields
        // if (req.user.Role === 2 && !req.user.builder_id) {
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

        if (req.user.Role === 2) {
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
            logging: console.log,
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
                        const categoryKey = categoryId === 1
                            ? "Showroom"
                            : categoryId === 2
                                ? "Office"
                                : categoryId === 3
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
        console.log(e);
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
            console.log(e);
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
            if (item == "1" || item?.unit_category_id == 1) {
                unitCategoryData = {
                    unit_category_id: 1,
                    totalCount: req.body?.Showroom?.summary?.totalCount || 0,
                    floorCount: req.body?.Showroom?.summary?.floorCount || 0,
                    wingCount: req.body?.Showroom?.summary?.wingCount || 0,
                };
            } else if (item == "2" || item?.unit_category_id == 2) {
                unitCategoryData = {
                    unit_category_id: 2,
                    totalCount: req.body?.Office?.summary?.totalCount || 0,
                    floorCount: req.body?.Office?.summary?.floorCount || 0,
                    wingCount: req.body?.Office?.summary?.wingCount || 0,
                };
            } else if (item == "3" || item?.unit_category_id == 3) {
                unitCategoryData = {
                    unit_category_id: 3,
                    totalCount: req.body?.Flat?.summary?.totalCount || 0,
                    floorCount: req.body?.Flat?.summary?.floorCount || 0,
                    wingCount: req.body?.Flat?.summary?.wingCount || 0,
                };
            } else if (item == "4" || item?.unit_category_id == 4) {
                unitCategoryData = {
                    unit_category_id: 4,
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

            if (createdCategory.unit_category_id === 1 && req.body?.Showroom?.wings) {
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

            if (createdCategory.unit_category_id === 2 && req.body?.Office?.wings) {
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

            if (createdCategory.unit_category_id === 3 && req.body?.Flat?.wings) {
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

            if (createdCategory.unit_category_id === 4 && req.body?.House?.wings) {
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
        console.log(error);
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

        await processWingsAndFloors("Showroom", req.body?.Showroom, 1);
        await processWingsAndFloors("Office", req.body?.Office, 2);
        await processWingsAndFloors("Flat", req.body?.Flat, 3);
        await processWingsAndFloors("House", req.body?.House, 4);

        res.status(200).send({
            message: "Unit details updated successfully!",
            status: true,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: error.message || "Internal server error" });
    }
};


exports.addBuilderUnitCategory = (req, res) => {
    console.log(req.body);

    if (!req.body?.unit_id) {
        return res.status(400).send({
            message: "unit id not provide name not provided",
            status: false,
        });
    }
    Unit.findOne({
        where: {
            [Op.or]: [{ unit_id: req.body.unit_id }],
        },
    })
        .then(async (user) => {
            if (user) {
                let unit = await UnitCategoryDetail.findOne({
                    where: {
                        unit_category_id: req.body.unit_category_id,
                        unit_id: req.body.unit_id,
                    },
                });
                if (unit) {
                    return res
                        .status(400)
                        .send({ message: "Unit category already in use", status: false });
                }
                UnitCategoryDetail.create({
                    unit_category_id: req.body.unit_category_id,
                    unit_id: req.body.unit_id,
                    count: req.body.count,
                })
                    .then(async (articles) => {
                        res.send(
                            JSON.stringify({
                                response: "builder unit successfully added!",
                                status: true,
                                userData: articles,
                            })
                        );
                    })
                    .catch((e) => console.log(e));
            } else
                return res
                    .status(400)
                    .send({ message: "unit id not exist", status: false });
        })
        .catch((e) => {
            res.send({ message: e?.message });
            console.log(e);
        });
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

exports.getAllUnitVerticle = async (req, res) => {
    Category.findAll({
        raw: true,
        where: {
            category_id: { [Op.ne]: [1, 3] },
        },
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

exports.getAllVerticleUser = async (req, res) => {
    try {
        const categories = req.body?.category || [];
        
        console.log('🔍 [getAllVerticleUser] Request body:', req.body);
        console.log('🔍 [getAllVerticleUser] Categories:', categories);
        
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

        console.log('🔍 [getAllVerticleUser] Query result:', articles);
        console.log('🔍 [getAllVerticleUser] Number of users found:', articles.length);

            res.status(200).send({
            message: "category unit get success",
                data: articles,
                status: true,
            });
    } catch (e) {
        console.error("Error in getAllVerticleUser:", e);
        res.status(400).send({ 
            message: "Error fetching verticle users", 
            status: false 
        });
    }
};

exports.getAllLoanUser = async (req, res) => {
    // Set cache control headers to prevent 304 responses
    res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    });
    
    console.log('🔍 [LOAN API] User making request:', req.user);
    console.log('🔍 [LOAN API] User Role:', req.user.Role);
    console.log('🔍 [LOAN API] User ID:', req.user.id);
    
    let whereObj = {};
    let whereObjLoan = {};

    // For users with loan category access, show all loan consumers
    // Only apply role-based filtering if the user doesn't have loan category access
    if (req.user.Role === 4 && !req.user.categoryIds?.includes(2)) {
        whereObj.user_role_id = req.user.id;
        console.log('🔍 [LOAN API] Setting user_role_id filter:', req.user.id);
    }
    if (req.user.Role === 4 && !req.user.categoryIds?.includes(2)) {
        whereObjLoan.role_id = req.user.id;
        console.log('🔍 [LOAN API] Setting role_id filter:', req.user.id);
    } else {
        console.log('🔍 [LOAN API] User has loan category access - showing all loan consumers');
    }
    whereObj.category_id = 2;
    // Remove status filter to show all loan consumers
    // whereObjLoan.status = "notAssign";
    
    console.log('🔍 [LOAN API] Final whereObj:', whereObj);
    console.log('🔍 [LOAN API] Final whereObjLoan:', whereObjLoan);
    
    // Debug: Check what loan users exist in the database
    const allLoanUsers = await loanUser.findAll({
        raw: true,
        attributes: ["user_id", "role_id", "status"],
        limit: 10
    });
    console.log('🔍 [LOAN API] All loan users in database (first 10):', allLoanUsers);

    let findUserList = await loanUser.findAll({
        where: whereObjLoan,
        raw: true,
        attributes: ["user_id"],
    });
    console.log('🔍 [LOAN API] Found loan users:', findUserList);
    console.log('🔍 [LOAN API] Number of loan users found:', findUserList.length);
    
    let userList = [];
    await findUserList.map((item) => {
        userList.push(item.user_id);
    });
    console.log('🔍 [LOAN API] User list for consumerRoleMapping:', userList);
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
        .then((articles) => {
            console.log(articles);
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
    // if (req.user.Role === 4) {
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
                                console.log('🔍 [DEBUG] Parsing remarks for user:', initialData.user_consumer_id, 'Status:', status);
                                console.log('🔍 [DEBUG] Parsed remarks:', parsedRemarks);
                                
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
                                    console.log('🔍 [DEBUG] Found disbursement_details in remarks for user', initialData.user_id, ':', parsedRemarks.disbursement_details);
                                    userData.disbursement_details = { ...userData.disbursement_details, ...parsedRemarks.disbursement_details }; 
                                    console.log('🔍 [DEBUG] Updated userData.disbursement_details for user', initialData.user_id, ':', userData.disbursement_details);
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
                                
                                console.log('🔍 [DEBUG] Final userData after remarks parsing:', Object.keys(userData));
                            } catch (error) {
                                console.log('❌ Error parsing remarks JSON:', error);
                                console.log('❌ Raw remarks data:', initialData.remarks);
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

                        console.log('🔍 [DEBUG] Final userData for user', initialData.user_id, ':', {
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
                        
                        console.log('🔍 [DEBUG] Final response structure for user', initialData.user_id, ':', {
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
            console.log(e);
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
                                console.log('Error parsing remarks JSON:', error);
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
            console.log(e);
        });
};
exports.getAllLoanUserNotInterested = async (req, res) => {
    let whereObj = {};
    let whereObjLoan = {};

    if (req.user.Role === 4) {
        whereObj.user_role_id = req.user.id;
    }
    // Set role_id filter for Not Interested page
    if (req.user.Role === 4) {
        whereObjLoan.role_id = req.user.id;
        console.log('🔍 [BACKEND] Setting role_id filter to:', req.user.id);
    }
    whereObj.category_id = 2;
    whereObjLoan.status = "notInterested";

    // Debug: Check what statuses exist in the database
    console.log('🔍 [BACKEND] Checking for notInterested records...');
    const allStatuses = await loanUser.findAll({
        attributes: ['status'],
        group: ['status'],
        raw: true
    });
    console.log('🔍 [BACKEND] All statuses in database:', allStatuses.map(s => s.status));
    
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
    console.log('🔍 [BACKEND] Statuses containing "not":', notInterestedVariations.map(s => s.status));
    
    // Debug: Check the whereObjLoan filter
    console.log('🔍 [BACKEND] whereObjLoan filter:', whereObjLoan);
    
    // Debug: Check if there are any notInterested records with the current role_id
    const notInterestedWithRole = await loanUser.findAll({
        where: whereObjLoan,
        raw: true
    });
    console.log('🔍 [BACKEND] notInterested records with role_id', req.user.id, ':', notInterestedWithRole.length);
    
    // Debug: Check all notInterested records regardless of role_id
    const allNotInterested = await loanUser.findAll({
        where: { status: "notInterested" },
        raw: true
    });
    console.log('🔍 [BACKEND] All notInterested records (any role):', allNotInterested.length);
    if (allNotInterested.length > 0) {
        console.log('🔍 [BACKEND] Sample notInterested record:', allNotInterested[0]);
        
        // Check if there are any notInterested records with the current user's role_id
        const notInterestedWithCurrentRole = await loanUser.findAll({
            where: { 
                status: "notInterested",
                role_id: req.user.id
            },
            raw: true
        });
        console.log('🔍 [BACKEND] notInterested records with current role_id:', notInterestedWithCurrentRole.length);
        
        // If no notInterested records exist for current user, create one from the existing record
        if (notInterestedWithCurrentRole.length === 0 && allNotInterested.length > 0) {
            console.log('🔍 [BACKEND] Creating notInterested record for current user from existing record');
            const existingRecord = allNotInterested[0];
            await loanUser.create({
                user_id: existingRecord.user_id,
                status: "notInterested",
                role_id: req.user.id,
                remarks: existingRecord.remarks || null,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log('🔍 [BACKEND] notInterested record created for current user');
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
    
    console.log('🔍 [BACKEND] Found notInterested records with role filter:', findUserList.length);
    if (findUserList.length > 0) {
        console.log('🔍 [BACKEND] Sample notInterested record:', {
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
    console.log('🔍 [BACKEND] User IDs from loanUser query:', userList);
    
    // If no notInterested records found, return empty array
    if (userList.length === 0) {
        console.log('🔍 [BACKEND] No notInterested records found, returning empty array');
        return res.status(200).send({
            message: "Category unit get success",
            data: [],
            status: true,
        });
    }
    
    whereObj.user_consumer_id = {
        [Op.in]: userList,
    };
    console.log('🔍 [BACKEND] consumerRoleMapping whereObj:', whereObj);
    
    // Fix: Create missing consumerRoleMapping entries for notInterested users
    for (const userId of userList) {
        const existingMapping = await consumerRoleMapping.findOne({
            where: {
                user_role_id: req.user.id,
                category_id: 2,
                user_consumer_id: userId
            }
        });
        
        if (!existingMapping) {
            console.log('🔍 [BACKEND] Creating missing consumerRoleMapping for user_id:', userId);
            await consumerRoleMapping.create({
                user_role_id: req.user.id,
                category_id: 2,
                user_consumer_id: userId
            });
            console.log('🔍 [BACKEND] consumerRoleMapping created successfully');
        } else {
            console.log('🔍 [BACKEND] consumerRoleMapping already exists for user_id:', userId);
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
                                console.log('Error parsing remarks JSON:', error);
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
            console.log(e);
        });
};

exports.getAllLoanUserDisburse = async (req, res) => {
    let whereObj = {};
    let whereObjLoan = {};

    // For Role 4, don't filter by user_role_id - show all completed loans they have access to
    // The consumerRoleMapping will be checked, but if there are no mappings, show all
    // if (req.user.Role === 4) {
    //     whereObj.user_role_id = req.user.id;
    // }
    // Don't filter by role_id in loanUser table - filter by consumerRoleMapping instead
    // if (req.user.Role === 4) {
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
            logging: console.log,
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
        console.error("Error in getAllLoanUserDisburse:", error);
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

        const whereClause = { user_id: user_consumer_id };
        if (laon_id) {
            whereClause.laon_id = laon_id;
        }

        // Debug: Check existing records before update
        const existingRecords = await loanUser.findAll({
            where: { user_id: user_consumer_id },
            raw: true
        });
        console.log('🔍 [UPDATE STATUS] Existing records for user_id', user_consumer_id, ':', existingRecords.length);
        existingRecords.forEach((record, index) => {
            console.log(`🔍 [UPDATE STATUS] Record ${index + 1}:`, {
                laon_id: record.laon_id,
                status: record.status,
                role_id: record.role_id,
                user_id: record.user_id
            });
        });

        // Add role_id to the update data to ensure proper filtering
        const updateData = {
            status,
            role_id: req.user.id, // Update role_id to current user's role
            remarks: status === 'notInterested' ? remarks : null
        };

        console.log('🔍 [UPDATE STATUS] Updating loan status:', {
            whereClause,
            updateData,
            currentUserRole: req.user.id
        });

        const [updated] = await loanUser.update(
            updateData,
            { where: whereClause }
        );

        if (!updated) {
            return res.status(404).json({
                message: "Loan user not found or not updated.",
                status: false,
            });
        }

        const updatedUser = await loanUser.findOne({
            where: whereClause,
        });

        console.log('🔍 [UPDATE STATUS] Updated loan user:', {
            status: updatedUser.status,
            role_id: updatedUser.role_id,
            remarks: updatedUser.remarks,
            user_id: updatedUser.user_id,
            laon_id: updatedUser.laon_id
        });

        return res.status(200).json({
            message: "Loan user successfully updated!",
            status: true,
            userData: updatedUser,
        });
    } catch (error) {
        console.error("Error updating loan status:", error);
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
    console.log(obj);
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
            console.log(e);
        });
};

exports.getAllMediclaimUser = async (req, res) => {
    // Set cache control headers to prevent 304 responses
    res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    });
    
    console.log('🔍 [MEDICLAIM API] User making request:', req.user);
    console.log('🔍 [MEDICLAIM API] User Role:', req.user.Role);
    console.log('🔍 [MEDICLAIM API] User ID:', req.user.id);
    
    let whereObj = {};

    // For users with mediclaim category access, show all mediclaim consumers
    // Only apply role-based filtering if the user doesn't have mediclaim category access
    if (req.user.Role === 4 && !req.user.categoryIds?.includes(4)) {
        whereObj.user_role_id = req.user.id;
        console.log('🔍 [MEDICLAIM API] Setting user_role_id filter:', req.user.id);
    } else {
        console.log('🔍 [MEDICLAIM API] User has mediclaim category access - showing all mediclaim consumers');
    }
    whereObj.category_id = 4;
    
    console.log('🔍 [MEDICLAIM API] Final whereObj:', whereObj);
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
        .then((articles) => {
            console.log(articles);
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

exports.getAllLifeInsUser = async (req, res) => {
    // Set cache control headers to prevent 304 responses
    res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    });
    
    console.log('🔍 [LIFE INS API] User making request:', req.user);
    console.log('🔍 [LIFE INS API] User Role:', req.user.Role);
    console.log('🔍 [LIFE INS API] User ID:', req.user.id);
    
    let whereObj = {};

    // For users with life insurance category access, show all life insurance consumers
    // Only apply role-based filtering if the user doesn't have life insurance category access
    if (req.user.Role === 4 && !req.user.categoryIds?.includes(5)) {
        whereObj.user_role_id = req.user.id;
        console.log('🔍 [LIFE INS API] Setting user_role_id filter:', req.user.id);
    } else {
        console.log('🔍 [LIFE INS API] User has life insurance category access - showing all life insurance consumers');
    }
    whereObj.category_id = 5;
    
    console.log('🔍 [LIFE INS API] Final whereObj:', whereObj);
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
        .then((articles) => {
            console.log(articles);
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

exports.getAllVehicleInsUser = async (req, res) => {
    let whereObj = {};

    if (req.user.Role === 4) {
        whereObj.user_role_id = req.user.id;
    }
    whereObj.category_id = 6;

    // Add status filter if provided
    const status = req.query.status;
    let userIdsWithStatus = null;
    if (status) {
        // Find all vehicle users with the given status
        const vehicleUsers = await db.vehicleUser.findAll({
            where: { status },
            attributes: ['user_id'],
            raw: true,
        });
        userIdsWithStatus = vehicleUsers.map(vu => vu.user_id);
        if (userIdsWithStatus.length > 0) {
            whereObj.user_consumer_id = { [Op.in]: userIdsWithStatus };
        } else {
            // No users with this status, return empty
            return res.status(200).send({ message: "No vehicle consumers found for this status", data: [], status: true });
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
                 {
                    model: db.vehicleUser,
                    as: "vehicleUser",
                    required: false,
                    attributes: [
                        "vehicle_user_id", 
                        "user_id", 
                        "vehicle_number", 
                        "make", 
                        "model", 
                        "manufacturing_year", 
                        "engine_number", 
                        "chassis_number", 
                        "company_name", 
                        "contact_person_name", 
                        "contact_person_no",
                        "vehicle_policy_type",
                        "agentName",
                        "agentCode",
                        "agentContactNumber"
                    ],
                    where: { status: status || "interested" },
                },
            ],
            raw: true,
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
        const [roleExists, unitExists, categoryExists] = await Promise.all([
            db.role.findByPk(role_id),
            db.unit.findByPk(unit_id),
            db.unit_category_list.findByPk(category_id),
        ]);

        if (!roleExists || !unitExists || !categoryExists) {
            return res.status(400).json({
                message: "Foreign Key Error: Role, Unit, or Category does not exist",
                status: false,
            });
        }

        // Check for duplicate combination of unit_id, office_no, category_id, floor, and wing
        const duplicateConsumer = await db.builderConsumer.findOne({
            where: {
                unit_id,
                office_no,
                category_id,
                floor_id,
                wing_id,
            },
        });

        if (duplicateConsumer) {
            return res.status(400).json({
                message:
                    "Duplicate Entry Error: A BuilderConsumer with the same unit_id, office_no, category_id, floor, and wing already exists",
                status: false,
            });
        }

        let builderConsumerData;

        // Process based on the status
        if (status === "interested") {
            // Check if user with this mobile number already exists
            let user = await User.findOne({
                where: { mobileNumber }
            });

            if (user) {
                console.log('🔍 [ADD BUILDER CONSUMER] User found with mobile number:', mobileNumber, 'User ID:', user.user_id);
                
                // User exists, update builder_user if needed
                if (builder_user_id && user.builder_user !== builder_user_id) {
                    await User.update(
                        {
                            builder_user: builder_user_id,
                            is_from_builder_user: 1,
                            updated_by: req.user.id,
                        },
                        { where: { user_id: user.user_id } }
                    );
                }
            } else {
                console.log('🔍 [ADD BUILDER CONSUMER] User not found, creating new user');
                
                // Create new user
                user = await User.create({
                username,
                email,
                mobileNumber,
                role_id: 5, // Builder consumers
                otp: "",
                token: "",
                created_by: req.user.id,
                updated_by: req.user.id,
                builder_user: builder_user_id,
                is_from_builder_user: 1,
                referenceName,
            });

            if (!user?.user_id) {
                return res.status(400).json({
                    message: "User creation failed",
                    status: false,
                });
                }
            }

            // Create builderConsumer with the user_id (either existing or newly created)
            builderConsumerData = await db.builderConsumer.create({
                role_id,
                unit_id,
                status,
                sqFeet,
                srNo,
                floor_id,
                wing_id,
                remarks,
                builder_id,
                office_no,
                category_id,
                user_id: user.user_id,
                referenceName,
            });

            // Create notification for admin when builder creates a consumer
            await createNotification({
                title: "New Builder Consumer Added",
                message: username,
                type: 'builder',
                category: 'user_added',
                user_id: req.user.id, // The builder who added the consumer
                target_user_id: user.user_id, // The consumer who was added
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
        } else {
            // Create builderConsumer without user association
            builderConsumerData = await db.builderConsumer.create({
                unit_id,
                status,
                sqFeet,
                srNo,
                floor_id,
                wing_id,
                builder_id,
                office_no,
                category_id,
                referenceName,
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
                    console.log('🔍 [UPDATE BUILDER CONSUMER] User found with mobile number:', mobileNumber, 'User ID:', user.user_id);
                    
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
                    console.log('🔍 [UPDATE BUILDER CONSUMER] User not found, creating new user');
                    
                    // Create new user
                    user = await User.create({
                    username,
                    email,
                    mobileNumber,
                    role_id: 5, // Builder consumers
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

exports.addLoanCobfiguration = async (req, res) => {
    try {
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).send({ message: "No files were uploaded.", status: false });
        }

        let pdfFile = req.files.pdfFile;
        const { user_id, categoryname } = req.body;
        console.log(req.body, req.files.pdfFile)

        const uploadsDir = path.join(__dirname, "../../uploads");

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
        console.log(req.body, req.files.pdfFile)

        const uploadsDir = path.join(__dirname, "../../uploads");

        // Find an existing entry by user_id
        let disburse = await Disburse.findOne({
            where: { user_id: Number(user_id), categoryname },
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
    //     const uploadsDir = path.join(__dirname, "../../uploads");

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

exports.getAllMediclaimCompany = async (req, res) => {
    console.log('🔍 Backend: getAllMediclaimCompany called');
    try {
        const companies = await MediclaimCompany.findAll({
        raw: true,
        });
        console.log('🔍 Backend: Found companies:', companies);
        console.log('🔍 Backend: Number of companies:', companies.length);
        
            res.status(200).send({
                message: "mediclaim company get success",
            data: companies,
                status: true,
            });
    } catch (e) {
        console.error('🔍 Backend: Error in getAllMediclaimCompany:', e);
        res.status(400).send({ message: "mediclaim company error", status: false });
    }
};

exports.addMediclaimCompanyData = (req, res) => {
    console.log('🔍 [ADD COMPANY] Request body:', req.body);
    
    if (!req.body?.mediclaim_company_name) {
        return res.status(400).send({
            message: "Company name not provided",
                status: false,
        });
    }
    
    MediclaimCompany.findOne({
        where: {
            mediclaim_company_name: req.body.mediclaim_company_name
        },
    })
        .then((user) => {
            if (!user) {
                MediclaimCompany.create({
                    mediclaim_company_name: req.body.mediclaim_company_name,
                })
                    .then(async (articles) => {
                        console.log('🔍 [ADD COMPANY] Company created:', articles);
                        res.status(200).send({
                            message: "Mediclaim company successfully added!",
                            status: true,
                            data: articles,
                        });
                    })
                    .catch((e) => {
                        console.error('🔍 [ADD COMPANY] Error creating company:', e);
                        res.status(400).send({
                            message: "Error creating company",
                        status: false,
                            error: e.message
                        });
                    });
            } else {
                console.log('🔍 [ADD COMPANY] Company name already exists');
                res.status(400).send({
                    message: "Mediclaim company name is already in use.",
                    status: false,
                });
            }
        })
        .catch((e) => {
            console.error('🔍 [ADD COMPANY] Error checking company:', e);
            res.status(500).send({ 
                message: e?.message || "Internal server error",
                status: false
            });
        });
};

exports.updateMediclaimCompanyData = async (req, res) => {
    console.log('🔍 [UPDATE COMPANY] Request body:', req.body);
    
    try {
        // Check if another company already has this name
    let user = await MediclaimCompany.findOne({
        where: {
            mediclaim_company_id: { [Op.ne]: req.body.mediclaim_company_id },
            mediclaim_company_name: req.body.mediclaim_company_name,
        },
    });
        
    if (user) {
            console.log('🔍 [UPDATE COMPANY] Company name already exists');
            return res.status(400).send({ 
                message: "Mediclaim company name already in use", 
                status: false 
            });
        }
        
        const result = await MediclaimCompany.update(
        {
            mediclaim_company_name: req.body.mediclaim_company_name,
        },
        {
            where: {
                mediclaim_company_id: req.body.mediclaim_company_id,
            },
        }
        );
        
        console.log('🔍 [UPDATE COMPANY] Update result:', result);
        
            return res.status(200).send({
                message: "Mediclaim company successfully updated!",
                status: true,
            data: result,
        });
    } catch (e) {
        console.error('🔍 [UPDATE COMPANY] Error:', e);
        res.status(500).send({ 
            message: e?.message || "Internal server error",
            status: false
        });
    }
};

exports.getAllMediclaimProduct = async (req, res) => {
    if (req.params.id) {
        MediclaimProduct.findAll({
            include: [{ model: db.mediclaimproductpdf }],
            // raw: true,
            where: {
                mediclaim_company_id: req.params.id
            }
        })
            .then((articles) => {
                res.status(200).send({
                    message: "mediclaim company get success",
                    data: articles,
                    status: true,
                });
            })
            .catch((e) => {
                res.status(400).send({ message: "get error", status: false });
                console.log(e);
            });
    } else {
        res.status(400).send({ message: "id not found error", status: false });
    }

};

exports.addMediclaimProductData = async (req, res) => {
    const { mediclaim_product_name } = req.body;
    const { id } = req.params; // mediclaim_company_id

    if (!mediclaim_product_name) {
        return res.status(400).send({ message: "Product name not provided", status: false });
    }

    if (!id) {
        return res.status(400).send({ message: "Company ID not provided", status: false });
    }

    try {
        // Check if the product already exists
        const existingProduct = await MediclaimProduct.findOne({
            where: {
                mediclaim_product_name,
                mediclaim_company_id: id,
            },
        });

        if (existingProduct) {
            return res.status(400).send({
                message: "Mediclaim product name already in use",
                status: false,
            });
        }

        // Create the product
        const newProduct = await MediclaimProduct.create({
            mediclaim_product_name,
            mediclaim_company_id: id,
        });

        const pdfFields = Object.keys(req.files || {}).filter((key) => key.startsWith('pdf'));
        if (pdfFields.length > 0) {
            const uploadFolder = path.join(
                __dirname,
                '../../uploads/companyProduct',
                id.toString(),
                newProduct.mediclaim_product_id.toString()
            );

            // Ensure the directory exists using native fs
            if (!fsSync.existsSync(uploadFolder)) {
                fsSync.mkdirSync(uploadFolder, { recursive: true });
            }

            const pdfRecords = [];

            for (const pdfField of pdfFields) {
                const file = req.files[pdfField];
                const fullFilePath = path.join(uploadFolder, file.name);
                const virtualPath = `/uploads/companyProduct/${id}/${newProduct.mediclaim_product_id}/${file.name}`;

                // Move file to the designated folder
                await file.mv(fullFilePath);

                // Prepare record for database
                pdfRecords.push({
                    mediclaim_product_id: newProduct.mediclaim_product_id,
                    pdf_name: file.name,
                    pdf_path: virtualPath, // Save only the virtual path
                });
            }

            await db.mediclaimproductpdf.bulkCreate(pdfRecords);
        }

        res.status(200).send({
            message: "Mediclaim product successfully added!",
            status: true,
            data: newProduct,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error", status: false });
    }
};
exports.updateMediclaimProductData = async (req, res) => {
    const { mediclaim_product_name, mediclaim_product_id } = req.body;
    const { id } = req.params; // mediclaim_company_id

    if (!mediclaim_product_name) {
        return res.status(400).send({ message: "Product name not provided", status: false });
    }

    if (!id) {
        return res.status(400).send({ message: "Company ID not provided", status: false });
    }

    if (!mediclaim_product_id) {
        return res.status(400).send({ message: "Product ID not provided", status: false });
    }

    try {
        // Check if the product exists
        const existingProduct = await MediclaimProduct.findOne({
            where: {
                mediclaim_product_id,
                mediclaim_company_id: id,
            },
        });

        if (!existingProduct) {
            return res.status(404).send({
                message: "Mediclaim product not found",
                status: false,
            });
        }

        // Update the product name
        await MediclaimProduct.update(
            { mediclaim_product_name },
            { where: { mediclaim_product_id } }
        );

        // Handle PDF removal (if specified)
        const removedPdfIds = req.body.removedPdfIds ? JSON.parse(req.body.removedPdfIds) : [];
        if (removedPdfIds.length > 0) {
            const uploadFolder = path.join(
                __dirname,
                '../../uploads/companyProduct',
                id.toString(),
                mediclaim_product_id.toString()
            );

            // Fetch PDFs marked for removal
            const pdfsToRemove = await db.mediclaimproductpdf.findAll({
                where: { 
                    mediclaim_product_id,
                    mediclaim_product_pdf_id: removedPdfIds
                },
            });

            // Delete physical files
            for (const pdf of pdfsToRemove) {
                const fileName = path.basename(pdf.pdf_path);
                const fullFilePath = path.join(uploadFolder, fileName);

                if (fsSync.existsSync(fullFilePath)) {
                    fsSync.unlinkSync(fullFilePath);
                    console.log(`🗑️ Deleted PDF file: ${fileName}`);
                }
            }

            // Remove from database
            await db.mediclaimproductpdf.destroy({
                where: { 
                    mediclaim_product_id,
                    mediclaim_product_pdf_id: removedPdfIds
                },
            });
            console.log(`🗑️ Removed ${removedPdfIds.length} PDF(s) from database`);
        }

        // Handle new PDF uploads
        const pdfFields = Object.keys(req.files || {}).filter((key) => key.startsWith('pdfFile'));
        if (pdfFields.length > 0) {
            const uploadFolder = path.join(
                __dirname,
                '../../uploads/companyProduct',
                id.toString(),
                mediclaim_product_id.toString()
            );

            // Ensure the directory exists using native fs
            if (!fsSync.existsSync(uploadFolder)) {
                fsSync.mkdirSync(uploadFolder, { recursive: true });
            }

            // Add new PDFs
            const pdfRecords = [];
            for (const pdfField of pdfFields) {
                const file = req.files[pdfField];
                const fullFilePath = path.join(uploadFolder, file.name);
                const virtualPath = `/uploads/companyProduct/${id}/${mediclaim_product_id}/${file.name}`;

                // Move file to the designated folder
                await file.mv(fullFilePath);

                // Prepare record for database
                pdfRecords.push({
                    mediclaim_product_id,
                    pdf_name: file.name,
                    pdf_path: virtualPath,
                });
                console.log(`📄 Added new PDF: ${file.name}`);
            }

            // Save new PDF details to the database
            await db.mediclaimproductpdf.bulkCreate(pdfRecords);
        }

        res.status(200).send({
            message: "Mediclaim product successfully updated!",
            status: true,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error", status: false });
    }
};


exports.addMediclaimUserData = async (req, res) => {
    if (!req?.body?.data) {
        res.status(404).json({ error: 'Data not found' });
    }
    let Data = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data;

    const {
        Name, Email, MobileNumber, RadioButton, policyRadio, DateOfBirth, Age, Gender, RelationshipWithPolicyHolder,
        SumInsured, NoClaimBonus, PreExistingIllness, ProductName, CompanyName, AgentName, AgentCode,
        AgentContactNumber, runningPolicy, previousPolicy, familyMembers, employees, ReferenceName,
        // Individual Insured Person fields
        InsuredPersonName, InsuredPersonRelationship, InsuredPersonDateOfBirth, InsuredPersonAge,
        InsuredPersonGender, InsuredPersonDateOfJoining, InsuredPersonPreExistingIllness
    } = Data;

    // Debug: Log the received data to identify the issue
    console.log('🔍 [ADD MEDICLAIM] Received runningPolicy:', runningPolicy);
    console.log('🔍 [ADD MEDICLAIM] Received previousPolicy:', previousPolicy);

    try {
        // Check if user with this mobile number already exists
        let user = await User.findOne({
            where: { mobileNumber: MobileNumber }
        });

        if (user) {
            console.log('🔍 [ADD MEDICLAIM] User found with mobile number:', MobileNumber, 'User ID:', user.user_id);
            
            // Check if user is already assigned to mediclaim category
            const existingMapping = await consumerRoleMapping.findOne({
                where: {
                    user_consumer_id: user.user_id,
                    category_id: 4 // mediclaim category
                }
            });

            if (!existingMapping) {
                // User exists but not assigned to mediclaim category, add the mapping
                console.log('🔍 [ADD MEDICLAIM] Adding user to mediclaim category');
                await consumerRoleMapping.create({
                    user_role_id: req.user.id,
                    user_consumer_id: user.user_id,
                    category_id: 4, // mediclaim category
                });
            }
        } else {
            console.log('🔍 [ADD MEDICLAIM] User not found, creating new user');
            
            // Create new user
            user = await User.create({
            username: Name,
            email: Email,
            mobileNumber: MobileNumber,
            referenceName: ReferenceName, // User model uses PascalCase
            role_id: 3 // Use role_id 3 for consumers (consumer role)
        });

            if (!user) {
                return res.status(400).json({ message: "User creation failed", status: false });
            }

            // Create role mapping for new user
            await consumerRoleMapping.create({
                user_role_id: req.user.id,
                user_consumer_id: user.user_id,
                category_id: 4, // mediclaim category
            });
        }

        let obj = {
            "medicliam_type": RadioButton,
            "medicliam_policy_type": policyRadio,
            "dob": DateOfBirth || null,
            "age": Age ? parseInt(Age) : 0,
            "gender": Gender || null,
            "relationshipWithPolicyHolder": RelationshipWithPolicyHolder || null,
            "sumInsured": SumInsured ? parseInt(SumInsured) : 0,
            "noClaimBonus": NoClaimBonus || null,
            "preExistingIllness": PreExistingIllness || null,
            "agentName": AgentName || null,
            "agentCode": AgentCode || null,
            "agentContactNumber": AgentContactNumber || null,
            "mediclaim_company_id": CompanyName || null,
            "mediclaim_product_id": ProductName || null,
            "user_id": user.user_id,
            "referenceName": ReferenceName || null, // Mediclaim model uses camelCase
            // Individual Insured Person fields
            "insuredPersonName": InsuredPersonName || null,
            "insuredPersonRelationship": InsuredPersonRelationship || null,
            "insuredPersonDateOfBirth": InsuredPersonDateOfBirth || null,
            "insuredPersonAge": InsuredPersonAge ? parseInt(InsuredPersonAge) : 0,
            "insuredPersonGender": InsuredPersonGender || null,
            "insuredPersonDateOfJoining": InsuredPersonDateOfJoining || null,
            "insuredPersonPreExistingIllness": InsuredPersonPreExistingIllness || null
        };

        const mediclaim = await Mediclaim.create(obj);
        const mediclaimId = mediclaim.id;

        // ConsumerRoleMapping already created above in user check/creation logic

        // Handle document uploads (aadhar, pan, gst, custom documents)
        const uploadsDir = path.join(__dirname, "../../uploads");
        let documentFiles = {
            AadharFileName: null,
            PanFileName: null,
            GstFileName: null
        };
        
        console.log('🔍 [ADD MEDICLAIM] req.files keys:', Object.keys(req.files || {}));
        
        // Handle Aadhar
        if (req.files && req.files.aadhar) {
            let aadhar = req.files.aadhar;
            const uniqueName = `${uuidv4()}-${path.basename(aadhar.name)}`;
            const uploadPath = path.join(uploadsDir, uniqueName);
            
            if (aadhar.mv) {
                await aadhar.mv(uploadPath);
            } else if (aadhar.data) {
                await fs.writeFile(uploadPath, aadhar.data);
            }
            
            documentFiles.AadharFileName = uniqueName;
            console.log(`📁 [ADD MEDICLAIM] Aadhar saved: ${uniqueName}`);
        }
        
        // Handle PAN
        if (req.files && req.files.pan) {
            let pan = req.files.pan;
            const uniqueName = `${uuidv4()}-${path.basename(pan.name)}`;
            const uploadPath = path.join(uploadsDir, uniqueName);
            
            if (pan.mv) {
                await pan.mv(uploadPath);
            } else if (pan.data) {
                await fs.writeFile(uploadPath, pan.data);
            }
            
            documentFiles.PanFileName = uniqueName;
            console.log(`📁 [ADD MEDICLAIM] PAN saved: ${uniqueName}`);
        }
        
        // Handle GST
        if (req.files && req.files.gst) {
            let gst = req.files.gst;
            const uniqueName = `${uuidv4()}-${path.basename(gst.name)}`;
            const uploadPath = path.join(uploadsDir, uniqueName);
            
            if (gst.mv) {
                await gst.mv(uploadPath);
            } else if (gst.data) {
                await fs.writeFile(uploadPath, gst.data);
            }
            
            documentFiles.GstFileName = uniqueName;
            console.log(`📁 [ADD MEDICLAIM] GST saved: ${uniqueName}`);
        }
        
        // Handle custom documents
        const customDocuments = Data.customDocuments || [];
        customDocuments.forEach(async (doc, idx) => {
            const fileKey = `customDocument_${idx}`;
            if (req.files && req.files[fileKey]) {
                let file = req.files[fileKey];
                const uniqueName = `${uuidv4()}-${path.basename(file.name)}`;
                const uploadPath = path.join(uploadsDir, uniqueName);
                
                if (file.mv) {
                    await file.mv(uploadPath);
                } else if (file.data) {
                    await fs.writeFile(uploadPath, file.data);
                }
                
                doc.file = uniqueName;
                console.log(`📁 [ADD MEDICLAIM] Custom document ${doc.name} saved: ${uniqueName}`);
            }
        });
        
        // Update mediclaim with document filenames
        await Mediclaim.update(documentFiles, { where: { id: mediclaimId } });
        
        // Store custom documents metadata if needed (optional - you may want to create a separate table)
        if (customDocuments.length > 0) {
            await Mediclaim.update(
                { customDocuments: JSON.stringify(customDocuments) },
                { where: { id: mediclaimId } }
            );
        }

        // Create loanUser record for this consumer (optional - for future loan services)
        await loanUser.create({
            user_id: user.user_id,
            role_id: req.user.id,
            status: "notAssign",
        });

        // Create running policy if provided
        if (runningPolicy) {
            // Clean the runningPolicy data to prevent validation errors
            const cleanedRunningPolicy = {
                ...runningPolicy,
                mediclaim_id: mediclaimId,
                user_id: user.user_id,
                // Ensure CurrentPolicyFile is a string or null, not an object
                CurrentPolicyFile: runningPolicy.CurrentPolicyFile && typeof runningPolicy.CurrentPolicyFile === 'object' 
                    ? null 
                    : (runningPolicy.CurrentPolicyFile || null),
                // Ensure other file fields are also strings or null
                PdfFile: runningPolicy.PdfFile && typeof runningPolicy.PdfFile === 'object' 
                    ? null 
                    : (runningPolicy.PdfFile || null)
            };
            
            console.log('🔍 [RUNNING POLICY] Cleaned data:', cleanedRunningPolicy);
            
            await RunningPolicies.create(cleanedRunningPolicy);
        }

        // Create previous policy if provided
        if (previousPolicy) {
            // Clean the previousPolicy data to prevent validation errors
            const cleanedPreviousPolicy = {
                ...previousPolicy,
                mediclaim_id: mediclaimId,
                user_id: user.user_id,
                // Ensure file fields are strings or null, not objects
                PdfFile: previousPolicy.PdfFile && typeof previousPolicy.PdfFile === 'object' 
                    ? null 
                    : (previousPolicy.PdfFile || null),
                ClaimStatementPDFfile: previousPolicy.ClaimStatementPDFfile && typeof previousPolicy.ClaimStatementPDFfile === 'object' 
                    ? null 
                    : (previousPolicy.ClaimStatementPDFfile || null),
                // Add new fields for Sum Insured and No Claim Bonus
                SumInsured: previousPolicy.SumInsured ? parseFloat(previousPolicy.SumInsured) : null,
                NoClaimBonus: previousPolicy.NoClaimBonus || null,
                // Add file name fields
                PdfFileName: previousPolicy.PdfFileName || null,
                ClaimStatementPDFfileName: previousPolicy.ClaimStatementPDFfileName || null,
                // Add product ID
                mediclaim_product_id: ProductName || null,
                // Add previous agent details (for Portability)
                PreviousAgentName: previousPolicy.PreviousAgentName || null,
                PreviousAgentCode: previousPolicy.PreviousAgentCode || null,
                PreviousAgentContactNumber: previousPolicy.PreviousAgentContactNumber || null
            };
            
            console.log('🔍 [PREVIOUS POLICY] Cleaned data:', cleanedPreviousPolicy);
            console.log('🔍 [PREVIOUS POLICY] Previous Agent Details:', {
                PreviousAgentName: cleanedPreviousPolicy.PreviousAgentName,
                PreviousAgentCode: cleanedPreviousPolicy.PreviousAgentCode,
                PreviousAgentContactNumber: cleanedPreviousPolicy.PreviousAgentContactNumber
            });
            
            await PreviousPolicies.create(cleanedPreviousPolicy);
        }

        // Save family members if any
        if (familyMembers && familyMembers.length > 0) {
            const familyMemberPromises = familyMembers.map(member => {
                // Convert empty strings to null for numeric fields
                const processedMember = {
                    ...member,
                    mediclaim_id: mediclaimId,
                    DateOfBirth: member.DateOfBirth || null,
                    Age: member.Age ? parseInt(member.Age) : 0,
                    Gender: member.Gender || null,
                    RelationshipWithPolicyHolder: member.RelationshipWithPolicyHolder || null,
                    FamilyName: member.FamilyName || null,
                    DateOfJoining: member.DateOfJoining || null,
                    PreExistingIllness: member.PreExistingIllness || null
                };
                return FamilyMember.create(processedMember);
            });
            await Promise.all(familyMemberPromises);
        }

        // Save employees if any
        if (employees && employees.length > 0) {
            const employeePromises = employees.map(employee => {
                // Convert empty strings to null for numeric fields
                const processedEmployee = {
                    ...employee,
                    mediclaim_id: mediclaimId,
                    DateOfBirth: employee.DateOfBirth || null,
                    Age: employee.Age ? parseInt(employee.Age) : 0,
                    Gender: employee.Gender || null,
                    RelationshipWithPolicyHolder: employee.RelationshipWithPolicyHolder || null,
                    EmployeeName: employee.EmployeeName || null,
                    DateOfJoining: employee.DateOfJoining || null,
                    PreExistingIllness: employee.PreExistingIllness || null
                };
                return EmployeeMediclaim.create(processedEmployee);
            });
            await Promise.all(employeePromises);
        }

        // Create notification for admin
        await createNotification({
            title: "New Mediclaim User Added",
            message: Name,
            type: 'mediclaim',
            category: 'user_added',
            user_id: req.user.id, // User who added the record
            target_user_id: user.user_id, // User who was added
            record_id: mediclaimId,
            is_important: true,
            metadata: {
                user_name: Name,
                email: Email,
                mobile: MobileNumber,
                policy_type: policyRadio,
                mediclaim_type: RadioButton,
                company_name: CompanyName,
                added_by: req.user.username || 'System'
            }
        });

        res.status(200).json({
            message: 'Mediclaim data saved successfully',
            status: true
        });
    } catch (error) {
        console.error('Error in addMediclaimUserData:', error);
        res.status(500).json({
            message: 'Error saving mediclaim data',
            error: error.message
        });
    }
};

exports.updateMediclaimUserData = async (req, res) => {
    console.log('🔍 [UPDATE MEDICLAIM] Request received:', req.body);
    console.log('🔍 [UPDATE MEDICLAIM] Request params:', req.params);
    
    if (!req?.body?.data) {
        console.log('❌ [UPDATE MEDICLAIM] No data found in request body');
        res.status(404).json({ error: 'Data not found' });
        return;
    }
    
    let Data = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data;
    console.log('🔍 [UPDATE MEDICLAIM] Parsed data:', Data);

    const {
        Name, Email, MobileNumber, RadioButton, policyRadio, DateOfBirth, Age, Gender, RelationshipWithPolicyHolder,
        SumInsured, NoClaimBonus, PreExistingIllness, ProductName, CompanyName, AgentName, AgentCode,
        AgentContactNumber, runningPolicy, previousPolicy, user_id, familyMembers, employees, id, ReferenceName,
        // Individual Insured Person fields
        InsuredPersonName, InsuredPersonRelationship, InsuredPersonDateOfBirth, InsuredPersonAge,
        InsuredPersonGender, InsuredPersonDateOfJoining, InsuredPersonPreExistingIllness
    } = Data;

    console.log('🔍 [UPDATE MEDICLAIM] Extracted fields:', {
        Name, Email, MobileNumber, RadioButton, policyRadio, DateOfBirth, Age, Gender, 
        RelationshipWithPolicyHolder, SumInsured, NoClaimBonus, PreExistingIllness, 
        ProductName, CompanyName, AgentName, AgentCode, AgentContactNumber, 
        runningPolicy: !!runningPolicy, previousPolicy: !!previousPolicy, 
        user_id, familyMembers: familyMembers?.length, employees: employees?.length, id, ReferenceName
    });

    let obj = {
        "medicliam_type": RadioButton,
        "medicliam_policy_type": policyRadio,
        "dob": DateOfBirth,
        "age": Age || 0,
        "gender": Gender,
        "relationshipWithPolicyHolder": RelationshipWithPolicyHolder,
        "sumInsured": Number(SumInsured) || 0,
        "noClaimBonus": NoClaimBonus,
        "preExistingIllness": PreExistingIllness,
        "agentName": AgentName,
        "agentCode": AgentCode,
        "agentContactNumber": AgentContactNumber,
        "mediclaim_company_id": CompanyName,
        "mediclaim_product_id": ProductName || null,
        "referenceName": ReferenceName || null,
        // Individual Insured Person fields
        "insuredPersonName": InsuredPersonName || null,
        "insuredPersonRelationship": InsuredPersonRelationship || null,
        "insuredPersonDateOfBirth": InsuredPersonDateOfBirth || null,
        "insuredPersonAge": InsuredPersonAge ? parseInt(InsuredPersonAge) : 0,
        "insuredPersonGender": InsuredPersonGender || null,
        "insuredPersonDateOfJoining": InsuredPersonDateOfJoining || null,
        "insuredPersonPreExistingIllness": InsuredPersonPreExistingIllness || null
    };

    try {
        // Update mediclaim data
        await db.medicliamuser.update(obj, { where: { id: id } });
        
        // Update user table with basic information (Name, Email, MobileNumber, ReferenceName)
        if (user_id) {
            console.log('🔍 [UPDATE MEDICLAIM] Updating User table with:', {
                username: Name || null,
                email: Email || null,
                mobileNumber: MobileNumber || null,
                referenceName: ReferenceName || null
            });
            
            const userUpdateResult = await db.user.update(
                { 
                    username: Name || null,           // Update username (Name)
                    email: Email || null,             // Update email
                    mobileNumber: MobileNumber || null, // Update mobile number
                    referenceName: ReferenceName || null // Update reference name
                }, 
                { where: { user_id: user_id } }
            );
            
            console.log('🔍 [UPDATE MEDICLAIM] User table update result:', userUpdateResult);
        }

        // Handle document uploads (aadhar, pan, gst, custom documents)
        const uploadsDir = path.join(__dirname, "../../uploads");
        let documentFiles = {};
        
        // Get existing mediclaim data to check for old files
        const existingMediclaim = await db.medicliamuser.findOne({ where: { id: id } });
        
        console.log('🔍 [UPDATE MEDICLAIM] req.files keys:', Object.keys(req.files || {}));
        
        // Handle document removal (if specified)
        const removedDocuments = Data.removedDocuments || [];
        console.log('🗑️ [UPDATE MEDICLAIM] Documents marked for removal:', removedDocuments);
        
        if (removedDocuments.length > 0) {
            // Remove Aadhar if marked
            if (removedDocuments.includes('aadhar') && existingMediclaim?.AadharFileName) {
                const filePath = path.join(uploadsDir, existingMediclaim.AadharFileName);
                if (fsSync.existsSync(filePath)) {
                    fsSync.unlinkSync(filePath);
                    console.log(`🗑️ [UPDATE MEDICLAIM] Deleted Aadhar file: ${existingMediclaim.AadharFileName}`);
                }
                documentFiles.AadharFileName = null;
            }
            
            // Remove PAN if marked
            if (removedDocuments.includes('pan') && existingMediclaim?.PanFileName) {
                const filePath = path.join(uploadsDir, existingMediclaim.PanFileName);
                if (fsSync.existsSync(filePath)) {
                    fsSync.unlinkSync(filePath);
                    console.log(`🗑️ [UPDATE MEDICLAIM] Deleted PAN file: ${existingMediclaim.PanFileName}`);
                }
                documentFiles.PanFileName = null;
            }
            
            // Remove GST if marked
            if (removedDocuments.includes('gst') && existingMediclaim?.GstFileName) {
                const filePath = path.join(uploadsDir, existingMediclaim.GstFileName);
                if (fsSync.existsSync(filePath)) {
                    fsSync.unlinkSync(filePath);
                    console.log(`🗑️ [UPDATE MEDICLAIM] Deleted GST file: ${existingMediclaim.GstFileName}`);
                }
                documentFiles.GstFileName = null;
            }
        }
        
        // Handle Aadhar
        if (req.files && req.files.aadhar) {
            // Delete old file if exists
            if (existingMediclaim?.AadharFileName) {
                const oldFilePath = path.join(uploadsDir, existingMediclaim.AadharFileName);
                if (fsSync.existsSync(oldFilePath)) {
                    fsSync.unlinkSync(oldFilePath);
                    console.log(`📁 [UPDATE MEDICLAIM] Deleted old Aadhar: ${existingMediclaim.AadharFileName}`);
                }
            }
            
            let aadhar = req.files.aadhar;
            const uniqueName = `${uuidv4()}-${path.basename(aadhar.name)}`;
            const uploadPath = path.join(uploadsDir, uniqueName);
            
            if (aadhar.mv) {
                await aadhar.mv(uploadPath);
            } else if (aadhar.data) {
                await fs.writeFile(uploadPath, aadhar.data);
            }
            
            documentFiles.AadharFileName = uniqueName;
            console.log(`📁 [UPDATE MEDICLAIM] Aadhar saved: ${uniqueName}`);
        }
        
        // Handle PAN
        if (req.files && req.files.pan) {
            // Delete old file if exists
            if (existingMediclaim?.PanFileName) {
                const oldFilePath = path.join(uploadsDir, existingMediclaim.PanFileName);
                if (fsSync.existsSync(oldFilePath)) {
                    fsSync.unlinkSync(oldFilePath);
                    console.log(`📁 [UPDATE MEDICLAIM] Deleted old PAN: ${existingMediclaim.PanFileName}`);
                }
            }
            
            let pan = req.files.pan;
            const uniqueName = `${uuidv4()}-${path.basename(pan.name)}`;
            const uploadPath = path.join(uploadsDir, uniqueName);
            
            if (pan.mv) {
                await pan.mv(uploadPath);
            } else if (pan.data) {
                await fs.writeFile(uploadPath, pan.data);
            }
            
            documentFiles.PanFileName = uniqueName;
            console.log(`📁 [UPDATE MEDICLAIM] PAN saved: ${uniqueName}`);
        }
        
        // Handle GST
        if (req.files && req.files.gst) {
            // Delete old file if exists
            if (existingMediclaim?.GstFileName) {
                const oldFilePath = path.join(uploadsDir, existingMediclaim.GstFileName);
                if (fsSync.existsSync(oldFilePath)) {
                    fsSync.unlinkSync(oldFilePath);
                    console.log(`📁 [UPDATE MEDICLAIM] Deleted old GST: ${existingMediclaim.GstFileName}`);
                }
            }
            
            let gst = req.files.gst;
            const uniqueName = `${uuidv4()}-${path.basename(gst.name)}`;
            const uploadPath = path.join(uploadsDir, uniqueName);
            
            if (gst.mv) {
                await gst.mv(uploadPath);
            } else if (gst.data) {
                await fs.writeFile(uploadPath, gst.data);
            }
            
            documentFiles.GstFileName = uniqueName;
            console.log(`📁 [UPDATE MEDICLAIM] GST saved: ${uniqueName}`);
        }
        
        // Handle custom documents
        const customDocuments = Data.customDocuments || [];
        for (let idx = 0; idx < customDocuments.length; idx++) {
            const doc = customDocuments[idx];
            const fileKey = `customDocument_${idx}`;
            if (req.files && req.files[fileKey]) {
                let file = req.files[fileKey];
                const uniqueName = `${uuidv4()}-${path.basename(file.name)}`;
                const uploadPath = path.join(uploadsDir, uniqueName);
                
                if (file.mv) {
                    await file.mv(uploadPath);
                } else if (file.data) {
                    await fs.writeFile(uploadPath, file.data);
                }
                
                doc.file = uniqueName;
                console.log(`📁 [UPDATE MEDICLAIM] Custom document ${doc.name} saved: ${uniqueName}`);
            }
        }
        
        // Update mediclaim with document filenames
        if (Object.keys(documentFiles).length > 0) {
            await db.medicliamuser.update(documentFiles, { where: { id: id } });
        }
        
        // Store custom documents metadata if needed
        if (customDocuments.length > 0) {
            await db.medicliamuser.update(
                { customDocuments: JSON.stringify(customDocuments) },
                { where: { id: id } }
            );
        }

        // Handle Renewal Logic - Transfer running policy to previous policy
        console.log('🔍 [UPDATE MEDICLAIM] Policy type:', policyRadio);
        
        if (policyRadio === "Renew" && runningPolicy && typeof runningPolicy === 'object') {
            try {
                console.log('🔄 [RENEWAL] Processing renewal - transferring running policy to previous policy');
                
                // Get existing running policy to transfer to previous
                const existingRunningPolicy = await db.runningPolicyMediclaim.findOne({
                    where: { mediclaim_id: id },
                    raw: true
                });

                if (existingRunningPolicy) {
                    console.log('🔄 [RENEWAL] Found existing running policy, transferring to previous policy');
                    
                    // Mark all existing previous policies as inactive
                    await db.previousPolicyMediclaim.update(
                        { status: "notActive" },
                        { where: { mediclaim_id: id } }
                    );
                    console.log('🔄 [RENEWAL] Marked existing previous policies as notActive');

                    // Transfer existing running policy to previous policy
                    const transferData = {
                        mediclaim_id: id,
                        Zone: existingRunningPolicy.Zone || null,
                        PolicyNumber: existingRunningPolicy.PolicyNumber || null,
                        PolicyTenure: existingRunningPolicy.PolicyTenure || null,
                        PremiumAmount: existingRunningPolicy.PremiumAmount || null,
                        NomineeName: existingRunningPolicy.NomineeName || null,
                        NomineeRelation: existingRunningPolicy.NomineeRelation || null,
                        NomineeAge: existingRunningPolicy.NomineeAge || null,
                        NomineeDob: existingRunningPolicy.NomineeDob || null,
                        PolicyTo: existingRunningPolicy.PolicyTo || null,
                        PolicyFrom: existingRunningPolicy.PolicyFrom || null,
                        SumInsured: SumInsured ? parseFloat(SumInsured) : (existingRunningPolicy.SumInsured || null),
                        NoClaimBonus: NoClaimBonus || existingRunningPolicy.NoClaimBonus || null,
                        PdfFile: existingRunningPolicy.CurrentPolicyFile || null, // Transfer CurrentPolicyFile to PdfFile
                        PdfFileName: existingRunningPolicy.CurrentPolicyFile || null,
                        RenewDate: existingRunningPolicy.PolicyTo || null,
                        CompanyName: CompanyName || null,
                        PreviousPolicyNumber: existingRunningPolicy.PolicyNumber || null,
                        mediclaim_product_id: ProductName || null,
                        status: "active" // New previous policy is active
                    };

                    // Create new previous policy record with transferred data
                    await db.previousPolicyMediclaim.create(transferData);
                    console.log('🔄 [RENEWAL] Successfully transferred running policy to previous policy');
                }

                // Now update running policy with new renewal data
                const uploadsDir = path.join(__dirname, "../../uploads");
                console.log('🔍 [UPDATE MEDICLAIM] req.files keys:', Object.keys(req.files || {}));
                console.log('🔍 [UPDATE MEDICLAIM] CurrentPolicyFile exists:', !!(req.files && req.files.CurrentPolicyFile));
                
                if (req.files && req.files.CurrentPolicyFile) {
                    let CurrentPolicyFile = req.files.CurrentPolicyFile;
                    const uniqueName = `${uuidv4()}-${path.basename(CurrentPolicyFile.name)}`;
                    const uploadPath = path.join(uploadsDir, uniqueName);
                    
                    // Note: We don't delete the old file as it's now transferred to previous policy
                    
                    // Handle file movement
                    if (CurrentPolicyFile.mv) {
                        console.log(`📁 [UPDATE MEDICLAIM] Using file.mv() for CurrentPolicyFile`);
                        await CurrentPolicyFile.mv(uploadPath);
                    } else if (CurrentPolicyFile.data) {
                        console.log(`📁 [UPDATE MEDICLAIM] Using file.data for CurrentPolicyFile`);
                        await fs.writeFile(uploadPath, CurrentPolicyFile.data);
                    } else {
                        throw new Error(`Unable to process CurrentPolicyFile - no valid file handling method found`);
                    }
                    
                    runningPolicy.CurrentPolicyFile = uniqueName;
                    console.log(`📁 [UPDATE MEDICLAIM] CurrentPolicyFile saved: ${uniqueName}`);
                }

                // Update running policy with new renewal data
                if (existingRunningPolicy) {
                    await db.runningPolicyMediclaim.update(runningPolicy, {
                        where: { mediclaim_id: id }
                    });
                    console.log('🔄 [RENEWAL] Updated running policy with new renewal data');
                } else {
                    await db.runningPolicyMediclaim.create({
                        ...runningPolicy,
                        mediclaim_id: id
                    });
                    console.log('🔄 [RENEWAL] Created new running policy with renewal data');
                }
            } catch (renewalError) {
                console.error('❌ [RENEWAL] Error processing renewal:', renewalError);
                throw renewalError;
            }
        } 
        // Handle regular running policy update (Fresh or Portability)
        else if (runningPolicy && typeof runningPolicy === 'object') {
            try {
                // Check if running policy exists for this mediclaim
                const existingRunningPolicy = await db.runningPolicyMediclaim.findOne({
                    where: { mediclaim_id: id }
                });

                // Handle CurrentPolicyFile upload if provided
                const uploadsDir = path.join(__dirname, "../../uploads");
                console.log('🔍 [UPDATE MEDICLAIM] req.files keys:', Object.keys(req.files || {}));
                console.log('🔍 [UPDATE MEDICLAIM] CurrentPolicyFile exists:', !!(req.files && req.files.CurrentPolicyFile));
                
                if (req.files && req.files.CurrentPolicyFile) {
                    let CurrentPolicyFile = req.files.CurrentPolicyFile;
                    const uniqueName = `${uuidv4()}-${path.basename(CurrentPolicyFile.name)}`;
                    const uploadPath = path.join(uploadsDir, uniqueName);
                    
                    // Delete old file if it exists
                    if (existingRunningPolicy?.CurrentPolicyFile) {
                        const oldFilePath = path.join(uploadsDir, existingRunningPolicy.CurrentPolicyFile);
                        if (fsSync.existsSync(oldFilePath)) {
                            fsSync.unlinkSync(oldFilePath);
                            console.log(`📁 [UPDATE MEDICLAIM] Deleted old CurrentPolicyFile: ${existingRunningPolicy.CurrentPolicyFile}`);
                        }
                    }
                    
                    // Handle file movement
                    if (CurrentPolicyFile.mv) {
                        console.log(`📁 [UPDATE MEDICLAIM] Using file.mv() for CurrentPolicyFile`);
                        await CurrentPolicyFile.mv(uploadPath);
                    } else if (CurrentPolicyFile.data) {
                        console.log(`📁 [UPDATE MEDICLAIM] Using file.data for CurrentPolicyFile`);
                        await fs.writeFile(uploadPath, CurrentPolicyFile.data);
                    } else {
                        throw new Error(`Unable to process CurrentPolicyFile - no valid file handling method found`);
                    }
                    
                    runningPolicy.CurrentPolicyFile = uniqueName;
                    console.log(`📁 [UPDATE MEDICLAIM] CurrentPolicyFile saved: ${uniqueName}`);
                } else if (existingRunningPolicy && !runningPolicy.CurrentPolicyFile) {
                    // Keep existing file if no new file uploaded and no file in payload
                    runningPolicy.CurrentPolicyFile = existingRunningPolicy.CurrentPolicyFile;
                }

                if (existingRunningPolicy) {
                    // Update existing running policy
                    await db.runningPolicyMediclaim.update(runningPolicy, {
                        where: { mediclaim_id: id }
                    });
                } else {
                    // Create new running policy
                    await db.runningPolicyMediclaim.create({
                        ...runningPolicy,
                        mediclaim_id: id
                    });
                }
            } catch (runningPolicyError) {
                console.error('Error updating running policy:', runningPolicyError);
                // Continue with other updates even if running policy fails
            }
        }

        // Update previous policy data if provided (for Portability or manual previous policy updates)
        if (previousPolicy && typeof previousPolicy === 'object' && policyRadio !== "Renew") {
            try {
                // Check if previous policy exists for this mediclaim
                const existingPreviousPolicy = await db.previousPolicyMediclaim.findOne({
                    where: { mediclaim_id: id }
                });

                // Handle PdfFile upload if provided
                const uploadsDir = path.join(__dirname, "../../uploads");
                console.log('🔍 [UPDATE MEDICLAIM] PdfFile exists:', !!(req.files && req.files.PdfFile));
                console.log('🔍 [UPDATE MEDICLAIM] ClaimStatementPDFfile exists:', !!(req.files && req.files.ClaimStatementPDFfile));
                
                if (req.files && req.files.PdfFile) {
                    let PdfFile = req.files.PdfFile;
                    const uniqueName = `${uuidv4()}-${path.basename(PdfFile.name)}`;
                    const uploadPath = path.join(uploadsDir, uniqueName);
                    
                    // Delete old file if it exists
                    if (existingPreviousPolicy?.PdfFile) {
                        const oldFilePath = path.join(uploadsDir, existingPreviousPolicy.PdfFile);
                        if (fsSync.existsSync(oldFilePath)) {
                            fsSync.unlinkSync(oldFilePath);
                            console.log(`📁 [UPDATE MEDICLAIM] Deleted old PdfFile: ${existingPreviousPolicy.PdfFile}`);
                        }
                    }
                    
                    // Handle file movement
                    if (PdfFile.mv) {
                        await PdfFile.mv(uploadPath);
                    } else if (PdfFile.data) {
                        await fs.writeFile(uploadPath, PdfFile.data);
                    }
                    
                    previousPolicy.PdfFile = uniqueName;
                    previousPolicy.PdfFileName = PdfFile.name;
                    console.log(`📁 [UPDATE MEDICLAIM] PdfFile saved: ${uniqueName}`);
                } else if (existingPreviousPolicy && !previousPolicy.PdfFile) {
                    // Keep existing file if no new file uploaded
                    previousPolicy.PdfFile = existingPreviousPolicy.PdfFile;
                    previousPolicy.PdfFileName = existingPreviousPolicy.PdfFileName;
                }

                if (req.files && req.files.ClaimStatementPDFfile) {
                    let ClaimStatementPDFfile = req.files.ClaimStatementPDFfile;
                    const uniqueName = `${uuidv4()}-${path.basename(ClaimStatementPDFfile.name)}`;
                    const uploadPath = path.join(uploadsDir, uniqueName);
                    
                    // Delete old file if it exists
                    if (existingPreviousPolicy?.ClaimStatementPDFfile) {
                        const oldFilePath = path.join(uploadsDir, existingPreviousPolicy.ClaimStatementPDFfile);
                        if (fsSync.existsSync(oldFilePath)) {
                            fsSync.unlinkSync(oldFilePath);
                            console.log(`📁 [UPDATE MEDICLAIM] Deleted old ClaimStatementPDFfile: ${existingPreviousPolicy.ClaimStatementPDFfile}`);
                        }
                    }
                    
                    // Handle file movement
                    if (ClaimStatementPDFfile.mv) {
                        await ClaimStatementPDFfile.mv(uploadPath);
                    } else if (ClaimStatementPDFfile.data) {
                        await fs.writeFile(uploadPath, ClaimStatementPDFfile.data);
                    }
                    
                    previousPolicy.ClaimStatementPDFfile = uniqueName;
                    previousPolicy.ClaimStatementPDFfileName = ClaimStatementPDFfile.name;
                    console.log(`📁 [UPDATE MEDICLAIM] ClaimStatementPDFfile saved: ${uniqueName}`);
                } else if (existingPreviousPolicy && !previousPolicy.ClaimStatementPDFfile) {
                    // Keep existing file if no new file uploaded
                    previousPolicy.ClaimStatementPDFfile = existingPreviousPolicy.ClaimStatementPDFfile;
                    previousPolicy.ClaimStatementPDFfileName = existingPreviousPolicy.ClaimStatementPDFfileName;
                }

                // Clean the previousPolicy data before saving
                const cleanedPreviousPolicy = {
                    ...previousPolicy,
                    mediclaim_id: id,
                    // Ensure SumInsured and NoClaimBonus are properly formatted
                    SumInsured: previousPolicy.SumInsured ? parseFloat(previousPolicy.SumInsured) : null,
                    NoClaimBonus: previousPolicy.NoClaimBonus || null,
                    // Add product ID
                    mediclaim_product_id: ProductName || null,
                    // Add previous agent details (for Portability)
                    PreviousAgentName: previousPolicy.PreviousAgentName || null,
                    PreviousAgentCode: previousPolicy.PreviousAgentCode || null,
                    PreviousAgentContactNumber: previousPolicy.PreviousAgentContactNumber || null
                };
                
                console.log('🔍 [UPDATE PREVIOUS POLICY] Previous Agent Details:', {
                    PreviousAgentName: cleanedPreviousPolicy.PreviousAgentName,
                    PreviousAgentCode: cleanedPreviousPolicy.PreviousAgentCode,
                    PreviousAgentContactNumber: cleanedPreviousPolicy.PreviousAgentContactNumber
                });

                if (existingPreviousPolicy) {
                    // Update existing previous policy
                    await db.previousPolicyMediclaim.update(cleanedPreviousPolicy, {
                        where: { mediclaim_id: id }
                    });
                } else {
                    // Create new previous policy
                    await db.previousPolicyMediclaim.create(cleanedPreviousPolicy);
                }
            } catch (previousPolicyError) {
                console.error('Error updating previous policy:', previousPolicyError);
                // Continue with other updates even if previous policy fails
            }
        }

        // Delete existing family members and employees
        await db.familyMember.destroy({ where: { mediclaim_id: id } });
        await db.employeeMediclaim.destroy({ where: { mediclaim_id: id } });

        // Save new family members if any
        if (familyMembers && familyMembers.length > 0) {
            const familyMemberPromises = familyMembers.map(member => 
                db.familyMember.create({
                    ...member,
                    mediclaim_id: id
                })
            );
            await Promise.all(familyMemberPromises);
        }

        // Save new employees if any
        if (employees && employees.length > 0) {
            const employeePromises = employees.map(employee => 
                db.employeeMediclaim.create({
                    ...employee,
                    mediclaim_id: id
                })
            );
            await Promise.all(employeePromises);
        }

        res.status(200).json({
            message: 'Mediclaim data updated successfully',
            status: true
        });
    } catch (error) {
        console.error('Error in updateMediclaimUserData:', error);
        res.status(500).json({
            message: 'Error updating mediclaim data',
            error: error.message
        });
    }
};

exports.geteMediclaimUserData = async (req, res) => {
    // Set cache control headers to prevent 304 responses
    res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    });
    
    console.log('🔍 [MEDICLAIM USER DATA API] User making request:', req.user);
    console.log('🔍 [MEDICLAIM USER DATA API] User Role:', req.user.Role);
    console.log('🔍 [MEDICLAIM USER DATA API] User ID:', req.user.id);
    console.log('🔍 [MEDICLAIM USER DATA API] User categoryIds:', req.user.categoryIds);

    // Show all mediclaim data for Super Admin OR users with mediclaim category access
    if (req.user.Role == 1 || req.user.categoryIds?.includes(4)) {
        // ADMIN ROLE - Fetch all mediclaim data
        Mediclaim.findAll({
            include: [{ model: MediclaimCompany }, { model: User }]
        })
            .then(async (mediclaimData) => {
                const mediclaimIds = mediclaimData.map((item) => item.id); // Extract mediclaim IDs
                console.log('🔍 [BACKEND] Admin/Mediclaim Category Role - Mediclaim IDs being searched:', mediclaimIds);
                const familyMembers = await FamilyMember.findAll({
                    where: { mediclaim_id: mediclaimIds },
                    raw: true,
                });
                const employees = await EmployeeMediclaim.findAll({
                    where: { mediclaim_id: mediclaimIds },
                    raw: true,
                });
                const runningPolicies = await RunningPolicies.findAll({
                    where: { mediclaim_id: mediclaimIds },
                    raw: true,
                });
                const previousPolicies = await PreviousPolicies.findAll({
                    where: { mediclaim_id: mediclaimIds },
                    raw: true,
                });
                console.log('🔍 [BACKEND] Admin/Mediclaim Category Role - Previous policies found:', previousPolicies.length);
                console.log('🔍 [BACKEND] Admin/Mediclaim Category Role - Previous policies data:', JSON.stringify(previousPolicies, null, 2));
                console.log(familyMembers)
                console.log(runningPolicies)

                // Step 3: Attach family members, employees to the corresponding mediclaim records
                const mediclaimWithFamily = mediclaimData.map((mediclaim) => {
                    const family = familyMembers.filter((member) => member.mediclaim_id === mediclaim.id);
                    const employeeList = employees.filter((member) => member.mediclaim_id === mediclaim.id);
                    const running = runningPolicies.filter((member) => member.mediclaim_id === mediclaim.id);
                    const previous = previousPolicies.filter((member) => member.mediclaim_id === mediclaim.id);
                    return {
                        ...mediclaim.get({ plain: true }), // Convert Sequelize instance to plain JSON
                        familymembers: family,
                        employees: employeeList,
                        runningPolicy: running.length ? running[0] : {},
                        previousPolicy: previous.length ? previous[0] : {},
                        previousPolicies: previous // Return all previous policies as array
                    };
                });
                console.log('API response for mediclaim user data:', JSON.stringify(mediclaimWithFamily, null, 2));
                res.status(200).send({
                    message: "mediclaim get success",
                    data: mediclaimWithFamily,
                    status: true,
                });
            })
            .catch((e) => {
                res.status(400).send({ message: "role error", status: false });
                console.log(e);
            });
    } else {

        let whereObj = {}
        let findUserList = await consumerRoleMapping.findAll({
            where: {
                user_role_id: req.user.id
            },
            raw: true,
            attributes: ["user_consumer_id"],
        });

        let userList = [];
        findUserList.map((item) => {
            userList.push(item.user_consumer_id);
        });

        whereObj.user_id = {
            [Op.in]: userList,
        };

        // USER ROLE - Fetch mediclaim data for specific users
        Mediclaim.findAll({
            include: [{ model: MediclaimCompany }, { model: User }],
            where: whereObj
        })
            .then(async (mediclaimData) => {
                const mediclaimIds = mediclaimData.map((item) => item.id); // Extract mediclaim IDs
                console.log('🔍 [BACKEND] User Role - Mediclaim IDs being searched:', mediclaimIds);
                const familyMembers = await FamilyMember.findAll({
                    where: { mediclaim_id: mediclaimIds },
                    raw: true,
                });
                const employees = await EmployeeMediclaim.findAll({
                    where: { mediclaim_id: mediclaimIds },
                    raw: true,
                });
                const runningPolicies = await RunningPolicies.findAll({
                    where: { mediclaim_id: mediclaimIds },
                    raw: true,
                });
                const previousPolicies = await PreviousPolicies.findAll({
                    where: { mediclaim_id: mediclaimIds },
                    raw: true,
                });
                console.log('🔍 [BACKEND] User Role - Previous policies found:', previousPolicies.length);
                console.log('🔍 [BACKEND] User Role - Previous policies data:', JSON.stringify(previousPolicies, null, 2));
                console.log(familyMembers)
                console.log(runningPolicies)

                // Step 3: Attach family members, employees to the corresponding mediclaim records
                const mediclaimWithFamily = mediclaimData.map((mediclaim) => {
                    const family = familyMembers.filter((member) => member.mediclaim_id === mediclaim.id);
                    const employeeList = employees.filter((member) => member.mediclaim_id === mediclaim.id);
                    const running = runningPolicies.filter((member) => member.mediclaim_id === mediclaim.id);
                    const previous = previousPolicies.filter((member) => member.mediclaim_id === mediclaim.id);
                    return {
                        ...mediclaim.get({ plain: true }), // Convert Sequelize instance to plain JSON
                        familymembers: family,
                        employees: employeeList,
                        runningPolicy: running.length ? running[0] : {},
                        previousPolicy: previous.length ? previous[0] : {},
                        previousPolicies: previous // Return all previous policies as array
                    };
                });
                console.log('API response for mediclaim user data:', JSON.stringify(mediclaimWithFamily, null, 2));
                res.status(200).send({
                    message: "mediclaim get success",
                    data: mediclaimWithFamily,
                    status: true,
                });
            })
            .catch((e) => {
                res.status(400).send({ message: "role error", status: false });
                console.log(e);
            });
    }


};

exports.geteMediclaimUserRenewalData = async (req, res) => {

    try {
        let whereObj = {};

        if (req.user.Role !== 1) {
            const findUserList = await consumerRoleMapping.findAll({
                where: { user_role_id: req.user.id },
                raw: true,
                attributes: ["user_consumer_id"],
            });

            const userList = findUserList.map(item => item.user_consumer_id);
            whereObj.user_id = { [Op.in]: userList };
        }

        const mediclaimData = await Mediclaim.findAll({
            where: whereObj,
            include: [{ model: MediclaimCompany }, { model: User }]
        });

        if (!mediclaimData.length) {
            return res.status(200).send({ message: "No mediclaim found", data: [], status: true });
        }

        const mediclaimIds = mediclaimData.map(item => item.id);
        const startDay = new Date(req.body.startDate);
        const endDay = new Date(req.body.endDate);

        const startOfDay = new Date(startDay.setHours(0, 0, 0, 0));
        const endOfDay = new Date(endDay.setHours(23, 59, 59, 999));
        console.log(startDay, endOfDay)

        const [familyMembers, runningPolicies, previousPolicies] = await Promise.all([
            FamilyMember.findAll({ where: { mediclaim_id: mediclaimIds }, raw: true }),
            RunningPolicies.findAll({
                where: { mediclaim_id: mediclaimIds },
                raw: true
            }),
            PreviousPolicies.findAll({
                where: { mediclaim_id: mediclaimIds },
                order: [["id", "DESC"]],
                raw: true
            })
        ]);

        // Don't filter out mediclaim records - include all mediclaim data
        const filteredMediclaimData = mediclaimData;

        const mediclaimWithDetails = filteredMediclaimData.map(mediclaim => {
            const family = familyMembers.filter(member => member.mediclaim_id === mediclaim.id);
            const running = runningPolicies.find(policy => policy.mediclaim_id === mediclaim.id) || {};

            // Separate active previous policy and history
            const activePrevious = previousPolicies.find(policy => policy.mediclaim_id === mediclaim.id && policy.status === "active") || {};
            const previousHistory = previousPolicies.filter(policy => policy.mediclaim_id === mediclaim.id && policy.status !== "active");

            // Convert Sequelize instance to plain object
            const plainMediclaim = mediclaim.get({ plain: true });

            return {
                ...plainMediclaim,
                familymembers: family,
                runningPolicy: running, // Only include if within expiry range
                previousPolicy: activePrevious, // Only the active previous policy
                previousHistory: previousHistory // All other previous policies except active
            };
        });



        return res.status(200).send({
            message: "Mediclaim data retrieved successfully",
            data: mediclaimWithDetails,
            status: true
        });

    } catch (error) {
        console.error("Error fetching mediclaim data:", error);
        return res.status(500).send({ message: "Internal Server Error", status: false });
    }
};

exports.geteMediclaimProductData = async (req, res) => {

    MediclaimProduct.findAll({
        raw: true,
    })
        .then((articles) => {
            res.status(200).send({
                message: "mediclaim product get success",
                data: articles,
                status: true,
            });
        })
        .catch((e) => {
            res.status(400).send({ message: "role error", status: false });
            console.log(e);
        });

};

exports.geteMediclaimCompanyData = async (req, res) => {

    Mediclaim.findAll({
        raw: true,
    })
        .then((articles) => {
            res.status(200).send({
                message: "mediclaim company get success",
                data: articles,
                status: true,
            });
        })
        .catch((e) => {
            res.status(400).send({ message: "role error", status: false });
            console.log(e);
        });

};

const getMediclaimConsumerData = async (req, res) => {
    try {
        const mediclaimId = req.params.id;
        const mediclaimData = await Mediclaim.findOne({
            where: { id: mediclaimId },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['username', 'email', 'mobileNumber']
                },
                {
                    model: MediclaimCompany,
                    as: 'mediclaimcompany',
                    attributes: ['mediclaim_company_name']
                },
                {
                    model: FamilyMember,
                    as: 'familymembers',
                    attributes: ['FamilyName', 'Gender', 'Age', 'DateOfBirth', 'RelationshipWithPolicyHolder', 'PreExistingIllness', 'DateOfJoining']
                },
                {
                    model: EmployeeMediclaim,
                    as: 'employees',
                    attributes: ['EmployeeName', 'Gender', 'Age', 'DateOfBirth', 'RelationshipWithPolicyHolder', 'PreExistingIllness', 'DateOfJoining']
                }
            ]
        });

        if (!mediclaimData) {
            return res.status(404).json({
                message: 'Mediclaim data not found',
                data: null
            });
        }

        res.status(200).json({
            message: 'Mediclaim data retrieved successfully',
            data: mediclaimData
        });
    } catch (error) {
        console.error('Error in getMediclaimConsumerData:', error);
        res.status(500).json({
            message: 'Error retrieving mediclaim data',
            error: error.message
        });
    }
};

// Blog Controller Functions
exports.addBlog = async (req, res) => {
    try {
        console.log('🔍 addBlog - Request body:', req.body);
        console.log('🔍 addBlog - Request files:', req.files);
        console.log('🔍 addBlog - Blog model:', Blog);
        console.log('🔍 addBlog - Database connection status:', db.sequelize.authenticate ? 'Connected' : 'Not connected');
        
        const { title, content, author, category, tags, status = 'draft' } = req.body;
        
        // Handle file upload
        let imagePath = 'default-blog-image.jpg'; // Default image filename (just filename, not full path)
        
        if (req.files && req.files.image) {
            const image = req.files.image;
            const uploadDir = path.join(__dirname, '../../uploads');
            
            // Ensure upload directory exists using native fs
            if (!fsSync.existsSync(uploadDir)) {
                fsSync.mkdirSync(uploadDir, { recursive: true });
            }
            
            // Generate unique filename
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const filename = `blog-${uniqueSuffix}${path.extname(image.name)}`;
            imagePath = filename; // Store only filename
            
            // Move file to upload directory
            await image.mv(path.join(uploadDir, filename));
        }

        // Handle tags - convert to array if it's a string
        let tagsArray = [];
        if (tags) {
            try {
                tagsArray = typeof tags === 'string' ? JSON.parse(tags) : tags;
            } catch (e) {
                // If parsing fails, treat it as a single tag
                tagsArray = [tags];
            }
        }

        console.log('🔍 addBlog - Creating blog with data:', {
            title,
            content,
            image: imagePath,
            author,
            category,
            tags: tagsArray,
            status,
            created_at: new Date(),
            updated_at: new Date()
        });

        const blog = await Blog.create({
            title,
            content,
            image: imagePath,
            author,
            category,
            tags: tagsArray,
            status,
            created_at: new Date(),
            updated_at: new Date()
        });
        
        console.log('🔍 addBlog - Blog created successfully:', blog.toJSON());
        
        // Add full URL to image path
        const blogData = blog.toJSON();
        if (blogData.image && !blogData.image.startsWith('http')) {
            blogData.image = `${req.protocol}://${req.get('host')}/uploads/${blogData.image}`;
        }
        
        console.log('🔍 addBlog - Returning response:', { message: 'Blog created successfully', blog: blogData });
        return res.status(201).json({ message: 'Blog created successfully', blog: blogData });
    } catch (error) {
        console.error('Error creating blog:', error);
        return res.status(500).json({ 
            message: 'Error creating blog',
            error: error.message 
        });
    }
};

exports.updateBlog = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, author, category, tags, status } = req.body;
        
        const blog = await Blog.findByPk(id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        // Handle file upload if new image is provided
        let imagePath = blog.image; // Keep existing image by default
        
        if (req.files && req.files.image) {
            const image = req.files.image;
            const uploadDir = path.join(__dirname, '../../uploads');
            
            // Ensure upload directory exists using native fs
            if (!fsSync.existsSync(uploadDir)) {
                fsSync.mkdirSync(uploadDir, { recursive: true });
            }
            
            // Generate unique filename
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const filename = `blog-${uniqueSuffix}${path.extname(image.name)}`;
            imagePath = filename; // Store only filename
            
            // Move file to upload directory
            await image.mv(path.join(uploadDir, filename));
        }

        // Handle tags - convert to array if it's a string
        let tagsArray = blog.tags; // Keep existing tags by default
        if (tags) {
            try {
                tagsArray = typeof tags === 'string' ? JSON.parse(tags) : tags;
            } catch (e) {
                // If parsing fails, treat it as a single tag
                tagsArray = [tags];
            }
        }

        await blog.update({
            title: title || blog.title,
            content: content || blog.content,
            image: imagePath,
            author: author || blog.author,
            category: category || blog.category,
            tags: tagsArray,
            status: status || blog.status,
            updated_at: new Date()
        });

        // Add full URL to image path
        const blogData = blog.toJSON();
        if (blogData.image && !blogData.image.startsWith('http')) {
            blogData.image = `${req.protocol}://${req.get('host')}/uploads/${blogData.image}`;
        }

        return res.status(200).json({ message: 'Blog updated successfully', blog: blogData });
    } catch (error) {
        console.error('Error updating blog:', error);
        return res.status(500).json({ message: 'Error updating blog' });
    }
};

exports.deleteBlog = async (req, res) => {
    try {
        const { id } = req.params;
        const blog = await Blog.findByPk(id);
        
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        await blog.destroy();
        return res.status(200).json({ message: 'Blog deleted successfully' });
    } catch (error) {
        console.error('Error deleting blog:', error);
        return res.status(500).json({ message: 'Error deleting blog' });
    }
};

exports.getAllBlogs = async (req, res) => {
    try {
        const blogs = await Blog.findAll({
            order: [['created_at', 'DESC']]
        });
        
        // Add full URL to image paths
        const blogsWithFullImageUrl = blogs.map(blog => {
            const blogData = blog.toJSON();
            if (blogData.image && !blogData.image.startsWith('http')) {
                blogData.image = `${req.protocol}://${req.get('host')}/uploads/${blogData.image}`;
            }
            return blogData;
        });
        
        return res.status(200).json({
            status: true,
            data: blogsWithFullImageUrl
        });
    } catch (error) {
        console.error('Error fetching blogs:', error);
        return res.status(500).json({
            status: false,
            message: 'Error fetching blogs',
            error: error.message
        });
    }
};

exports.getBlogById = async (req, res) => {
    try {
        const { id } = req.params;
        const blog = await Blog.findByPk(id);
        
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        // Add full URL to image path
        const blogData = blog.toJSON();
        if (blogData.image && !blogData.image.startsWith('http')) {
            blogData.image = `${req.protocol}://${req.get('host')}/uploads/${blogData.image}`;
        }

        return res.status(200).json(blogData);
    } catch (error) {
        console.error('Error fetching blog:', error);
        return res.status(500).json({ message: 'Error fetching blog' });
    }
};

exports.getAllVehicleInsUser = async (req, res) => {
    let whereObj = {};

    if (req.user.Role === 4) {
        whereObj.user_role_id = req.user.id;
    }
    whereObj.category_id = 6;

    // Add status filter if provided
    const status = req.query.status;
    let userIdsWithStatus = null;
    if (status) {
        // Find all vehicle users with the given status
        const vehicleUsers = await db.vehicleUser.findAll({
            where: { status },
            attributes: ['user_id'],
            raw: true,
        });
        userIdsWithStatus = vehicleUsers.map(vu => vu.user_id);
        if (userIdsWithStatus.length > 0) {
            whereObj.user_consumer_id = { [Op.in]: userIdsWithStatus };
        } else {
            // No users with this status, return empty
            return res.status(200).send({ message: "No vehicle consumers found for this status", data: [], status: true });
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
                {
                    model: db.vehicleUser,
                    as: "vehicleUser",
                    required: false,
                    attributes: ["vehicle_user_id", "user_id"],
                    where: { status: status || "interested" },
                },
            ],
            raw: true,
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

exports.addVehicleUserData = async (req, res) => {
    console.log('--- [addVehicleUserData] ---');
    console.log('req.user:', req.user);
    console.log('req.headers:', req.headers);
    console.log('req.body:', req.body);
    console.log('req.files:', req.files);

    if (!req.user || !req.user.id) {
        console.log('Unauthorized: req.user is not defined.');
        return res.status(401).json({ error: 'Unauthorized: req.user is not defined. Check your token and authentication.' });
    }

    let Data;
    if (req.body.data) {
        // JSON request - data is nested under 'data' property
        Data = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data;
        console.log('[addVehicleUserData] Processing JSON request');
    } else if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
        // FormData request - data is directly in req.body
        Data = req.body;
        console.log('[addVehicleUserData] Processing FormData request');
        console.log('🔍 [ADD] req.files object:', req.files);
        console.log('🔍 [ADD] req.files keys:', Object.keys(req.files || {}));

        // Parse JSON strings in FormData
        if (Data.runningPolicy && typeof Data.runningPolicy === 'string') {
            try {
                Data.runningPolicy = JSON.parse(Data.runningPolicy);
            } catch (e) {
                console.log('🔍 [ADD] Error parsing runningPolicy:', e.message);
                Data.runningPolicy = {};
            }
        }
        if (Data.previousPolicy && typeof Data.previousPolicy === 'string') {
            try {
                Data.previousPolicy = JSON.parse(Data.previousPolicy);
            } catch (e) {
                console.log('🔍 [ADD] Error parsing previousPolicy:', e.message);
                Data.previousPolicy = {};
            }
        }
        if (Data.documentsData && typeof Data.documentsData === 'string') {
            try {
                Data.documentsData = JSON.parse(Data.documentsData);
            } catch (e) {
                console.log('🔍 [ADD] Error parsing documentsData:', e.message);
                Data.documentsData = [];
            }
        }
    } else {
        console.warn('[addVehicleUserData] No data found in request body');
        return res.status(400).json({ error: 'Data not found in request body' });
    }
    console.log('Parsed Data:', Data);
    console.log('🔧 [addVehicleUserData] Policy fields received:', {
        policyRadio: Data.policyRadio,
        policy_type: Data.policy_type,
        vehicle_policy_type: Data.vehicle_policy_type,
        Type: Data.Type,
        nominee_type: Data.nominee_type,
        type: Data.type
    });
    console.log('🔧 [addVehicleUserData] Engine and Chassis fields:', {
        engine_number: Data.engine_number,
        chassis_number: Data.chassis_number,
        EngineNumber: Data.EngineNumber,
        ChassisNumber: Data.ChassisNumber
    });

    let documentsData = Data.documentsData || (typeof req.body.documentsData === "string" ? JSON.parse(req.body.documentsData || "[]") : req.body.documentsData);

    // Defensive check for runningPolicy
    let runningPolicy = Data.runningPolicy;
    if (!runningPolicy || typeof runningPolicy !== 'object') {
        runningPolicy = { PolicyTypeId: null, CompanyId: null, PolicyPlanTypeId: null };
        Data.runningPolicy = runningPolicy;
    }
    // Defensive check for previousPolicy
    let previousPolicy = Data.previousPolicy;
    if (!previousPolicy || typeof previousPolicy !== 'object') {
        previousPolicy = { PolicyTypeId: null, CompanyId: null, PolicyPlanTypeId: null };
        Data.previousPolicy = previousPolicy;
    }

    // Accept both PascalCase and camelCase for all fields
    const {
        Name, name,
        Email, email,
        MobileNumber, mobileNumber,
        policyRadio, policy_type,
        AgentName, agentName,
        AgentCode, agentCode,
        AgentContactNumber, agentContactNumber,
        CompanyName, company_name,
        ContactPersonNo, contact_person_no,
        remark,
        ContactPersonName, contact_person_name,
        VehicleNumber, vehicle_number,
        Make, make,
        ReferenceId, reference_id,
        nomineeRadio, nominee_type,
        Model, model,
        ManufacturingYear, manufacturing_year,
        EngineNumber, engine_number,
        ChassisNumber, chassis_number,
        VehicleId, vehicle_id,

        user_id, documents,
        type,
        Type
    } = Data;

    // Use fallback logic to get the value from either style
    const _Name = Name || name || '';
    const _Email = Email || email || '';
    const _MobileNumber = MobileNumber || mobileNumber || '';
    const _policyRadio = policyRadio || policy_type || Data.policyRadio || Data.policy_type || '';
    // const _AgentName = AgentName || agentName || '';
    // const _AgentCode = AgentCode || agentCode || '';
    // const _AgentContactNumber = AgentContactNumber || agentContactNumber || '';
    // ✅ Fixed to support all naming styles (camelCase, PascalCase, snake_case)
const _AgentName =
AgentName || agentName || Data.agent_name || Data.Agent_Name || '';
const _AgentCode =
AgentCode || agentCode || Data.agent_code || Data.Agent_Code || '';
const _AgentContactNumber =
AgentContactNumber || agentContactNumber || Data.agent_contact_number || Data.Agent_Contact_Number || '';

console.log('🔧 [addVehicleUserData] Agent details extracted:', {
AgentName: _AgentName,
AgentCode: _AgentCode,
AgentContactNumber: _AgentContactNumber
});

    const _CompanyName = CompanyName || company_name || '';
    const _ContactPersonNo = ContactPersonNo || contact_person_no || '';
    const _remark = remark || '';
    const _ContactPersonName = ContactPersonName || contact_person_name || '';
    const _VehicleNumber = VehicleNumber || vehicle_number || '';
    const _Make = Make || make || '';
    const _ReferenceId = ReferenceId || reference_id || null;
    const _nomineeRadio = nomineeRadio || nominee_type || Data.Type || Data.nominee_type || Data.type || '';
    const _Model = Model || model || '';
    const _ManufacturingYear = ManufacturingYear || manufacturing_year || '';
    const _EngineNumber = EngineNumber || engine_number || '';
    const _ChassisNumber = ChassisNumber || chassis_number || '';
    const _VehicleId = VehicleId || vehicle_id || null;
    const _user_id = user_id || null;
    const _documents = documents || null;

    console.log('🔧 [addVehicleUserData] Extracted values:', {
        Name: _Name,
        Email: _Email,
        MobileNumber: _MobileNumber,
        EngineNumber: _EngineNumber,
        ChassisNumber: _ChassisNumber
    });
    console.log('runningPolicy before DB insert:', runningPolicy);
    console.log('previousPolicy before DB insert:', previousPolicy);

    if (!runningPolicy) {
        return res.status(400).json({ error: "runningPolicy is undefined before DB insert" });
    }
    if (_policyRadio !== "Fresh" && !previousPolicy) {
        return res.status(400).json({ error: "previousPolicy is undefined before DB insert" });
    }

    try {
        // Debug logging for validation
        console.log('🔍 [addVehicleUserData] Validation check:', {
            engineNumber: _EngineNumber,
            chassisNumber: _ChassisNumber,
            engineNumberTrimmed: _EngineNumber ? _EngineNumber.trim() : null,
            chassisNumberTrimmed: _ChassisNumber ? _ChassisNumber.trim() : null
        });

        // Check for duplicate engine number, chassis number, and vehicle number
        let engineNumberExists = false;
        let chassisNumberExists = false;
        let vehicleNumberExists = false;
        let errorMessages = [];

        if (_EngineNumber && _EngineNumber.trim() !== '') {
            const engineNumberToCheck = _EngineNumber.trim();
            console.log('🔍 [addVehicleUserData] Checking engine number:', engineNumberToCheck);

            const existingEngineNumber = await vehicleUser.findOne({
                where: {
                    [Op.or]: [
                        { engine_number: engineNumberToCheck },
                        { engine_number: engineNumberToCheck.toUpperCase() },
                        { engine_number: engineNumberToCheck.toLowerCase() }
                    ]
                }
            });

            console.log('🔍 [addVehicleUserData] Existing engine number result:', existingEngineNumber);

            if (existingEngineNumber) {
                console.log('❌ [addVehicleUserData] Engine number already exists:', engineNumberToCheck);
                engineNumberExists = true;
                errorMessages.push("engine number");
            }
        }

        if (_ChassisNumber && _ChassisNumber.trim() !== '') {
            const chassisNumberToCheck = _ChassisNumber.trim();
            console.log('🔍 [addVehicleUserData] Checking chassis number:', chassisNumberToCheck);

            const existingChassisNumber = await vehicleUser.findOne({
                where: {
                    [Op.or]: [
                        { chassis_number: chassisNumberToCheck },
                        { chassis_number: chassisNumberToCheck.toUpperCase() },
                        { chassis_number: chassisNumberToCheck.toLowerCase() }
                    ]
                }
            });

            console.log('🔍 [addVehicleUserData] Existing chassis number result:', existingChassisNumber);

            if (existingChassisNumber) {
                console.log('❌ [addVehicleUserData] Chassis number already exists:', chassisNumberToCheck);
                chassisNumberExists = true;
                errorMessages.push("chassis number");
            }
        }

        // Check for duplicate vehicle number
        if (_VehicleNumber && _VehicleNumber.trim() !== '') {
            const vehicleNumberToCheck = _VehicleNumber.trim();
            console.log('🔍 [addVehicleUserData] Checking vehicle number:', vehicleNumberToCheck);

            const existingVehicleNumber = await vehicleUser.findOne({
                where: {
                    [Op.or]: [
                        { vehicle_number: vehicleNumberToCheck },
                        { vehicle_number: vehicleNumberToCheck.toUpperCase() },
                        { vehicle_number: vehicleNumberToCheck.toLowerCase() }
                    ]
                }
            });

            console.log('🔍 [addVehicleUserData] Existing vehicle number result:', existingVehicleNumber);

            if (existingVehicleNumber) {
                console.log('❌ [addVehicleUserData] Vehicle number already exists:', vehicleNumberToCheck);
                vehicleNumberExists = true;
                errorMessages.push("vehicle number");
            }
        }

        // Return combined error message if any duplicates found
        if (errorMessages.length > 0) {
            const message = errorMessages.length === 1
                ? `This ${errorMessages[0]} already exists`
                : `This ${errorMessages.join(" and ")} already exist`;

            console.log('❌ [addVehicleUserData] Validation failed:', message);
            return res.status(400).json({
                message: message,
                status: false
            });
        }

        console.log('✅ [addVehicleUserData] Validation passed, proceeding with user check/creation');

        // Check if user with this mobile number already exists
        let userData = await User.findOne({
            where: { mobileNumber: _MobileNumber }
        });

        if (userData) {
            console.log('🔍 [addVehicleUserData] User found with mobile number:', _MobileNumber, 'User ID:', userData.user_id);

            // Check if user is already assigned to vehicle category
            const existingMapping = await consumerRoleMapping.findOne({
                where: {
                    user_consumer_id: userData.user_id,
                    category_id: 6
                }
            });

            if (!existingMapping) {
                // User exists but not assigned to vehicle category, add the mapping
                console.log('🔍 [addVehicleUserData] Adding user to vehicle category');
                await consumerRoleMapping.create({
                    user_role_id: req.user.id,
                    user_consumer_id: userData.user_id,
                    category_id: 6,
                });
            }
        } else {
            console.log('🔍 [addVehicleUserData] User not found, creating new user');

            // Create new user
            userData = await User.create({
                username: _Name,
                email: _Email,
                mobileNumber: _MobileNumber,
                role_id: 3, // All users should be consumers
                otp: "",
                token: "",
                created_by: req.user.id,
                updated_by: req.user.id,
            });

            if (!userData) {
                return res.status(400).json({ message: "User creation failed", status: false });
            }

            // Create role mapping for new user
            await consumerRoleMapping.create({
                user_role_id: req.user.id,
                user_consumer_id: userData.user_id,
                category_id: 6,
            });
        }

        if (userData && userData.user_id) {
            console.log('🔧 [addVehicleUserData] Saving to database:', {
                vehicle_policy_type: _policyRadio || Data.policyRadio || Data.policy_type || '',
                nominee_type: _nomineeRadio || Data.Type || Data.nominee_type || Data.type || ''
            });

            let vehicle = await vehicleUser.create({
                user_id: userData.user_id,
                vehicle_policy_type: _policyRadio || Data.policy_type || Data.policyRadio || '', // Fresh/Renewal/Portability
                nominee_type: _nomineeRadio || Data.type || Data.Type || Data.nominee_type || '', // Individual/Corporate
                policy_plan_type: Data.policy_plan_type || Data.PolicyType || '', // FULL/NORMAL/THIRD PARTY
                company_name: _CompanyName,
                contact_person_name: _ContactPersonName,
                remark: _remark,
                contact_person_no: _ContactPersonNo,
                vehicle_number: _VehicleNumber,
                vehicle_id: _VehicleId,
                reference_id: _ReferenceId,
                make: _Make,
                model: _Model,
                manufacturing_year: _ManufacturingYear,
                engine_number: _EngineNumber,
                chassis_number: _ChassisNumber,
                agentName: _AgentName,
                agentCode: _AgentCode,
                agentContactNumber: _AgentContactNumber,
                consumer_role_id: req.user.id,
                vehicle_type: Data.vehicle_type || '',
                type: Data.type || '',
                status: Data.status || '',
                policy_plan_type: Data.policy_plan_type || '',
                vendor: Data.vendor || '',
                runningPolicy: JSON.stringify(Data.runningPolicy || {}),
                previousPolicy: JSON.stringify(Data.previousPolicy || {}),
                // Add any other fields from Data as needed
            });

            if (!vehicle.vehicle_user_id) {
                return res.status(400).json({ message: "Vehicle creation failed", status: false });
            }

            const uploadsDir = path.join(__dirname, "../../uploads");

            // Handle standard documents (aadhar, pan, gst, rcbook)
            const standardDocuments = [
                { fieldName: 'aadhar', categoryId: 1 },
                { fieldName: 'pan', categoryId: 2 },
                { fieldName: 'gst', categoryId: 3 },
                { fieldName: 'rcbook', categoryId: 4 }
            ];

            for (const doc of standardDocuments) {
                if (req.files && req.files[doc.fieldName]) {
                    const fileObj = req.files[doc.fieldName];
                    const uniqueName = `${uuidv4()}-${path.basename(fileObj.name)}`;
                    const uploadPath = path.join(uploadsDir, uniqueName);

                    // Handle file movement - now using in-memory files
                    if (fileObj.mv) {
                        // When useTempFiles: false, use mv method (in-memory files)
                        console.log(`📁 [CREATE] Using file.mv() for ${doc.fieldName}`);
                        await fileObj.mv(uploadPath);
                    } else if (fileObj.data) {
                        // Fallback: write file data directly
                        console.log(`📁 [CREATE] Using file.data for ${doc.fieldName}`);
                        await fs.writeFile(uploadPath, fileObj.data);
                    } else {
                        throw new Error(`Unable to process ${doc.fieldName} file - no valid file handling method found`);
                    }

                    // Save document record to database
                    await vehicle_document.create({
                        user_id: userData.user_id,
                        vehicle_user_id: vehicle.vehicle_user_id,
                        categoryId: doc.categoryId,
                        file: uniqueName
                    });
                    console.log(`[VehicleUserCreate] ${doc.fieldName} document saved for vehicle_user_id: ${vehicle.vehicle_user_id}`);
                }
            }

            // Handle custom documents
            if (documentsData && Array.isArray(documentsData)) {
                for (const doc of documentsData) {
                    console.log('[VehicleUserCreate] Processing custom document:', doc);
                    const fieldName = doc.fileFieldName; // e.g., "custom_0", "custom_1"
                    if (req.files && req.files[fieldName]) {
                        const fileObj = req.files[fieldName];
                        const uniqueName = `${uuidv4()}-${path.basename(fileObj.name)}`;
                        const uploadPath = path.join(uploadsDir, uniqueName);
                        await fileObj.mv(uploadPath);

                        // Save document record to database
                        await vehicle_document.create({
                            user_id: userData.user_id,
                            vehicle_user_id: vehicle.vehicle_user_id,
                            categoryId: doc.categoryId,
                            file: uniqueName
                        });
                        console.log(`[VehicleUserCreate] Custom document ${fieldName} saved for vehicle_user_id: ${vehicle.vehicle_user_id}`);
                    }
                }
            }

            console.log('🔍 [CREATE] req.files keys:', Object.keys(req.files || {}));
            console.log('🔍 [CREATE] CurrentPolicyFile exists:', !!(req.files && req.files.CurrentPolicyFile));
            if (req.files && req.files.CurrentPolicyFile) {
                let CurrentPolicyFile = req.files.CurrentPolicyFile;
                const uniqueName = `${uuidv4()}-${path.basename(CurrentPolicyFile.name)}`;
                const uploadPath = path.join(uploadsDir, uniqueName);

                // Handle file movement - now using in-memory files
                if (CurrentPolicyFile.mv) {
                    // When useTempFiles: false, use mv method (in-memory files)
                    console.log(`📁 [CREATE] Using file.mv() for CurrentPolicyFile`);
                    await CurrentPolicyFile.mv(uploadPath);
                } else if (CurrentPolicyFile.data) {
                    // Fallback: write file data directly
                    console.log(`📁 [CREATE] Using file.data for CurrentPolicyFile`);
                    await fs.writeFile(uploadPath, CurrentPolicyFile.data);
                } else {
                    throw new Error(`Unable to process CurrentPolicyFile - no valid file handling method found`);
                }

                runningPolicy.CurrentPolicyFile = uniqueName;
                console.log(`📁 [CREATE] CurrentPolicyFile saved: ${uniqueName}`);
            }

            // Resolve company name to company_id for running policy
            let resolvedRunningCompanyId = runningPolicy.CompanyId || null;
            if (!resolvedRunningCompanyId && runningPolicy.CompanyName) {
                console.log('🔍 [CREATE] Resolving running policy company name to ID:', runningPolicy.CompanyName);
                const runningCompanyRecord = await companyType.findOne({
                    where: { company_name: runningPolicy.CompanyName }
                });
                if (runningCompanyRecord) {
                    resolvedRunningCompanyId = runningCompanyRecord.company_id;
                    console.log('✅ [CREATE] Resolved running policy company name to ID:', resolvedRunningCompanyId);
                } else {
                    console.log('⚠️ [CREATE] Running policy company not found for name:', runningPolicy.CompanyName);
                }
            }

            // Use only the safe runningPolicy variable here!
            const runningPolicyData = {
                vehicle_user_id: vehicle.vehicle_user_id,
                policy_type_id: runningPolicy.PolicyTypeId,
                company_id: resolvedRunningCompanyId,
                policy_plan_id: runningPolicy.PolicyPlanTypeId,
                CurrentPolicyFile: runningPolicy.CurrentPolicyFile || null,
                isNomineeFlag: runningPolicy.isNomineeFlag || Data.isNomineeFlag || null,
                // Add agent details
                agentName: _AgentName || '',
                agentCode: _AgentCode || '',
                agentContactNumber: _AgentContactNumber || '',
                ...runningPolicy,
            };
            await vehcileRunningPolicy.create(runningPolicyData);

            if (req.files && req.files.PreviousCurrentPolicyFile) {
                let PdfFile = req.files.PreviousCurrentPolicyFile;
                const uniqueName = `${uuidv4()}-${path.basename(PdfFile.name)}`;
                const uploadPath = path.join(uploadsDir, uniqueName);
                await PdfFile.mv(uploadPath);
                previousPolicy.CurrentPolicyFile = uniqueName;
            }

            // --------- SAFEGUARDED insertion of previous policy (single insert only) ----------
            // runtime guard to avoid double insert in same request
            let insertedPreviousPolicy = false;

            // Helper: does previousPolicy contain any meaningful identifying data?
            const hasMeaningfulPreviousPolicy = previousPolicy &&
                (
                    previousPolicy.PolicyTypeId ||
                    previousPolicy.CompanyId ||
                    previousPolicy.PolicyPlanTypeId ||
                    previousPolicy.CompanyName ||
                    previousPolicy.PolicyNumber
                );

            if (_policyRadio !== "Fresh" && hasMeaningfulPreviousPolicy) {
                // Resolve previous policy company id (if company name provided)
                let resolvedPreviousCompanyId = previousPolicy.CompanyId || null;
                if (!resolvedPreviousCompanyId && previousPolicy.CompanyName) {
                    console.log('🔍 [CREATE] Resolving previous policy company name to ID:', previousPolicy.CompanyName);
                    const previousCompanyRecord = await companyType.findOne({
                        where: { company_name: previousPolicy.CompanyName }
                    });
                    if (previousCompanyRecord) {
                        resolvedPreviousCompanyId = previousCompanyRecord.company_id;
                        console.log('✅ [CREATE] Resolved previous policy company name to ID:', resolvedPreviousCompanyId);
                    } else {
                        console.log('⚠️ [CREATE] Previous policy company not found for name:', previousPolicy.CompanyName);
                    }
                }

                // Build history data
                const historyData = {
                    vehicle_user_id: vehicle.vehicle_user_id,
                    ...previousPolicy,
                    policy_type_id: previousPolicy.PolicyTypeId || null,
                    company_id: resolvedPreviousCompanyId,
                    policy_plan_id: previousPolicy.PolicyPlanTypeId || null,
                    PolicyNumber: previousPolicy.PolicyNumber || null,
                    issue_date: previousPolicy.issue_date || null,
                    expiry_date: previousPolicy.expiry_date || null,
                    status: "active",
                    agentName: previousPolicy.agentName || _AgentName || '',
                    agentCode: previousPolicy.agentCode || _AgentCode || '',
                    agentContactNumber: previousPolicy.agentContactNumber || _AgentContactNumber || '',
                };

                // Check DB to avoid duplicate insertion:
                // look for an existing previous policy for this vehicle_user_id that matches at least one identifying field
                const duplicateWhere = {
                    vehicle_user_id: vehicle.vehicle_user_id,
                    [Op.or]: []
                };

                if (historyData.PolicyNumber) duplicateWhere[Op.or].push({ PolicyNumber: historyData.PolicyNumber });
                if (historyData.policy_type_id) duplicateWhere[Op.or].push({ policy_type_id: historyData.policy_type_id });
                if (historyData.company_id) duplicateWhere[Op.or].push({ company_id: historyData.company_id });
                if (historyData.policy_plan_id) duplicateWhere[Op.or].push({ policy_plan_id: historyData.policy_plan_id });

                // If there is no identifying field (shouldn't happen because hasMeaningfulPreviousPolicy true), fallback to a simple existence check
                let alreadyExists = null;
                if (duplicateWhere[Op.or].length > 0) {
                    alreadyExists = await vehiclePreviousPolicy.findOne({ where: duplicateWhere });
                } else {
                    // fallback - check any previous policy for this vehicle_user_id (conservative)
                    alreadyExists = await vehiclePreviousPolicy.findOne({ where: { vehicle_user_id: vehicle.vehicle_user_id } });
                }

                if (!alreadyExists) {
                    console.log("🧾 [CREATE] Inserting previous policy:", historyData);
                    await vehiclePreviousPolicy.create(historyData);
                    insertedPreviousPolicy = true;
                } else {
                    console.log("⚠️ [CREATE] Skipping previous policy insert because a matching previous policy already exists:", alreadyExists && alreadyExists.previous_policy_id ? alreadyExists.previous_policy_id : alreadyExists);
                }
            } else {
                if (_policyRadio !== "Fresh") {
                    console.log('⚠️ [CREATE] Skipping previous policy insert — no valid data found to insert.');
                } else {
                    console.log('ℹ️ [CREATE] Policy is Fresh — no previous policy insertion required.');
                }
            }
            // -------------------------------------------------------------------------------

            // Fetch all related data for complete response
            const createdVehicleUser = await vehicleUser.findByPk(vehicle.vehicle_user_id);
            const createdRunningPolicy = await vehcileRunningPolicy.findOne({
                where: { vehicle_user_id: vehicle.vehicle_user_id },
                include: [
                    { model: companyType, as: 'CompanyType' },
                    { model: db.policyPlan, as: 'policyPlan', attributes: [['policy_name', 'PolicyPlanType']] },
                    { model: db.policyType, as: 'policyType', attributes: [['policy_type_name', 'PolicyTypeName']] }
                ]
            });
            const previousPolicies = await vehiclePreviousPolicy.findAll({
                where: { vehicle_user_id: vehicle.vehicle_user_id },
                include: [
                    { model: companyType, as: 'CompanyType' },
                    { model: db.policyPlan, as: 'policyPlan', attributes: [['policy_name', 'PolicyPlanType']] },
                    { model: db.policyType, as: 'policyType', attributes: [['policy_type_name', 'PolicyTypeName']] }
                ]
            });
            const vehicleDocuments = await vehicle_document.findAll({ where: { vehicle_user_id: vehicle.vehicle_user_id } });

            // Create notification for admin
            await createNotification({
                title: "New Vehicle User Added",
                message: _Name,
                type: 'vehicle',
                category: 'user_added',
                user_id: req.user.id, // User who added the record
                target_user_id: userData.user_id, // User who was added
                record_id: vehicle.vehicle_user_id,
                is_important: true,
                metadata: {
                    user_name: _Name,
                    email: _Email,
                    mobile: _MobileNumber,
                    policy_type: _policyRadio,
                    vehicle_number: _VehicleNumber,
                    added_by: req.user.username || 'System'
                }
            });

            res.status(200).send({
                message: "Vehicle user successfully added!",
                status: true,
                vehicleUser: createdVehicleUser,
                runningPolicy: createdRunningPolicy,
                previousPolicies: previousPolicies,
                documents: vehicleDocuments
            });
        } else {
            res.status(400).json({
                message: "user create faild",
                status: false,
            });
        }
    } catch (error) {
        console.error('❌ [addVehicleUserData] Error:', error);

        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.map(err => err.message);
            res.status(400).json({
                message: 'Validation failed',
                errors: errors,
                status: false
            });
        } else if (error.name === 'SequelizeUniqueConstraintError') {
            // Handle unique constraint violations
            const field = error.errors[0]?.path || 'field';
            const message = `This ${field.replace('_', ' ')} already exists`;
            res.status(400).json({
                message: message,
                status: false
            });
        } else {
            res.status(500).json({
                message: 'Internal server error',
                error: error.message,
                status: false
            });
        }
    }
};

exports.updateVehicleUserData = async (req, res) => {
    // --- Clean, focused debug log for incoming request ---
    console.log('[VehicleUserUpdate] Incoming request:', {
        params: req.params,
        user: req.user && req.user.id,
        hasData: !!req?.body?.data,
        hasFiles: !!req.files
    });

    let Data;
    if (req.body.data) {
        // JSON request - data is nested under 'data' property
        Data = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data;
        console.log('[VehicleUserUpdate] Processing JSON request');
    } else if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
        // FormData request - data is directly in req.body
        Data = req.body;
        console.log('[VehicleUserUpdate] Processing FormData request');
        console.log('🔍 [UPDATE] req.files object:', req.files);
        console.log('🔍 [UPDATE] req.files keys:', Object.keys(req.files || {}));
        
        // Parse JSON strings in FormData
        if (Data.runningPolicy && typeof Data.runningPolicy === 'string') {
            try {
                Data.runningPolicy = JSON.parse(Data.runningPolicy);
            } catch (e) {
                console.log('🔍 [UPDATE] Error parsing runningPolicy:', e.message);
                Data.runningPolicy = {};
            }
        }
        if (Data.previousPolicy && typeof Data.previousPolicy === 'string') {
            try {
                Data.previousPolicy = JSON.parse(Data.previousPolicy);
            } catch (e) {
                console.log('🔍 [UPDATE] Error parsing previousPolicy:', e.message);
                Data.previousPolicy = {};
            }
        }
    } else {
        console.warn('[VehicleUserUpdate] No data found in request body');
        return res.status(400).json({ error: 'Data not found in request body' });
    }
    // --- Log the parsed data keys only (not full data for privacy) ---
    console.log('[VehicleUserUpdate] Parsed data keys:', Object.keys(Data));
    console.log('🔧 [updateVehicleUserData] All Policy Fields received:', {
        policy_type: Data.policy_type,           // Fresh/Renewal/Portability → vehicle_policy_type
        type: Data.type,                         // Individual/Corporate → nominee_type
        policy_plan_type: Data.policy_plan_type, // COMPREHENSIVE/SAOD/THIRD PARTY → policy_plan_type
        policyRadio: Data.policyRadio,           // Alternative field name
        Type: Data.Type,                         // Alternative field name
        PolicyType: Data.PolicyType              // Alternative field name
    });
    
    console.log('🔧 [updateVehicleUserData] Agent Fields received:', {
        agent_name: Data.agent_name,
        agent_code: Data.agent_code,
        agent_contact_number: Data.agent_contact_number
    });
    
    console.log('🔧 [updateVehicleUserData] RunningPolicy Fields received:', {
        PremiumAmount: Data.runningPolicy?.PremiumAmount,
        PolicyTenure: Data.runningPolicy?.PolicyTenure,
        NomineeAge: Data.runningPolicy?.NomineeAge,
        PolicyNumber: Data.runningPolicy?.PolicyNumber,
        PolicyFrom: Data.runningPolicy?.PolicyFrom,
        PolicyTo: Data.runningPolicy?.PolicyTo
    });
    console.log('🔧 [updateVehicleUserData] Full Data object keys:', Object.keys(Data));

    const {
        Name, Email, MobileNumber, 
        policy_type, // Frontend sends this
        type, // Frontend sends this
        contact_person_name, // Frontend sends this
        contact_person_no, // Frontend sends this
        vehicle_number, // Frontend sends this
        make, // Frontend sends this
        model, // Frontend sends this
        vendor, // Frontend sends this
        company_name, // Frontend sends this
        user_id, documents, remark,
        // Additional fields from frontend
        agent_code, agent_contact_number, agent_name,
        chassis_number, engine_number, manufacturing_year,
        reference_id, vehicle_id, vehicle_type,
        policy_plan_type, status, nominee_type,
        runningPolicy = null, // Default to null if not provided
        previousPolicy = null // Default to null if not provided
    } = Data;

    // Debug logging for Name, Email, Mobile fields
    console.log('🔍 [updateVehicleUserData] Name/Email/Mobile fields received:', {
        Name: Name,
        Email: Email,
        MobileNumber: MobileNumber
    });

    try {
        let resolvedUserId = user_id;
        if (!resolvedUserId) {
            const tempUser = await vehicleUser.findByPk(req.params.vehicle_user_id);
            if (tempUser && tempUser.user_id) {
                resolvedUserId = tempUser.user_id;
            }
        }
        if (!resolvedUserId) {
            console.warn('[VehicleUserUpdate] User ID not provided and could not be resolved');
            return res.status(400).json({ error: "User ID not provided" });
        }
        
        // Debug logging for resolvedUserId after it's defined
        console.log('🔍 [updateVehicleUserData] resolvedUserId:', resolvedUserId);
        if (!req.params.vehicle_user_id) {
            console.warn('[VehicleUserUpdate] Vehicle user ID not provided');
            return res.status(400).json({ error: "Vehicle user ID not provided" });
        }
        // Fetch the vehicle user record before using it
        const vehicleUserRecord = await vehicleUser.findByPk(req.params.vehicle_user_id);
        if (!vehicleUserRecord) {
            console.warn('[VehicleUserUpdate] Vehicle not found with ID:', req.params.vehicle_user_id);
            return res.status(404).json({ error: "Vehicle not found" });
        }
        // Now construct the update object
        const vehicleUserUpdateObj = {
            vehicle_policy_type: Data.policy_type || Data.policyRadio || vehicleUserRecord.vehicle_policy_type, // Fresh/Renewal/Portability (radio)
            nominee_type: Data.type || Data.Type || vehicleUserRecord.nominee_type, // Individual/Corporate (radio)
            policy_plan_type: Data.policy_plan_type || vehicleUserRecord.policy_plan_type, // Policy Plan Type dropdown (COMPREHENSIVE/SAOD/THIRD PARTY)

            company_name: company_name,
            contact_person_name: contact_person_name,
            remark: remark || '',
            contact_person_no: contact_person_no,
            vehicle_number: vehicle_number,
            vehicle_id: vehicle_id,
            reference_id: reference_id,
            make: make,
            model: model,
            manufacturing_year: manufacturing_year,
            engine_number: engine_number,
            chassis_number: chassis_number,
            agentName: agent_name,
            agentCode: agent_code,
            agentContactNumber: agent_contact_number,
            status: status || Data.status,
            policy_plan_type: policy_plan_type || Data.policy_plan_type,
            vehicle_type: vehicle_type || Data.vehicle_type,
            vendor: vendor || Data.vendor,
        };
        console.log('[VehicleUserUpdate] Updating vehicleUser with:', vehicleUserUpdateObj);
        
        // Debug logging for validation
        console.log('🔍 [updateVehicleUserData] Validation check:', {
            engineNumber: engine_number,
            chassisNumber: chassis_number,
            vehicleUserId: req.params.vehicle_user_id,
            engineNumberTrimmed: engine_number ? engine_number.trim() : null,
            chassisNumberTrimmed: chassis_number ? chassis_number.trim() : null
        });

        // Check for duplicate engine number, chassis number, and vehicle number (excluding current record)
        let engineNumberExists = false;
        let chassisNumberExists = false;
        let vehicleNumberExists = false;
        let errorMessages = [];

        if (engine_number && engine_number.trim() !== '') {
            const engineNumberToCheck = engine_number.trim();
            console.log('🔍 [updateVehicleUserData] Checking engine number:', engineNumberToCheck);
            
            const existingEngineNumber = await vehicleUser.findOne({
                where: {
                    [Op.and]: [
                        {
                            [Op.or]: [
                                { engine_number: engineNumberToCheck },
                                { engine_number: engineNumberToCheck.toUpperCase() },
                                { engine_number: engineNumberToCheck.toLowerCase() }
                            ]
                        },
                        { vehicle_user_id: { [Op.ne]: req.params.vehicle_user_id } } // Exclude current record
                    ]
                }
            });
            
            console.log('🔍 [updateVehicleUserData] Existing engine number result:', existingEngineNumber);
            
            if (existingEngineNumber) {
                console.log('❌ [updateVehicleUserData] Engine number already exists:', engineNumberToCheck);
                engineNumberExists = true;
                errorMessages.push("engine number");
            }
        }

        if (chassis_number && chassis_number.trim() !== '') {
            const chassisNumberToCheck = chassis_number.trim();
            console.log('🔍 [updateVehicleUserData] Checking chassis number:', chassisNumberToCheck);
            
            const existingChassisNumber = await vehicleUser.findOne({
                where: {
                    [Op.and]: [
                        {
                            [Op.or]: [
                                { chassis_number: chassisNumberToCheck },
                                { chassis_number: chassisNumberToCheck.toUpperCase() },
                                { chassis_number: chassisNumberToCheck.toLowerCase() }
                            ]
                        },
                        { vehicle_user_id: { [Op.ne]: req.params.vehicle_user_id } } // Exclude current record
                    ]
                }
            });
            
            console.log('🔍 [updateVehicleUserData] Existing chassis number result:', existingChassisNumber);
            
            if (existingChassisNumber) {
                console.log('❌ [updateVehicleUserData] Chassis number already exists:', chassisNumberToCheck);
                chassisNumberExists = true;
                errorMessages.push("chassis number");
            }
        }

        // Check for duplicate vehicle number (excluding current record)
        if (vehicle_number && vehicle_number.trim() !== '') {
            const vehicleNumberToCheck = vehicle_number.trim();
            console.log('🔍 [updateVehicleUserData] Checking vehicle number:', vehicleNumberToCheck);
            
            const existingVehicleNumber = await vehicleUser.findOne({
                where: {
                    [Op.and]: [
                        {
                            [Op.or]: [
                                { vehicle_number: vehicleNumberToCheck },
                                { vehicle_number: vehicleNumberToCheck.toUpperCase() },
                                { vehicle_number: vehicleNumberToCheck.toLowerCase() }
                            ]
                        },
                        { vehicle_user_id: { [Op.ne]: req.params.vehicle_user_id } } // Exclude current record
                    ]
                }
            });
            
            console.log('🔍 [updateVehicleUserData] Existing vehicle number result:', existingVehicleNumber);
            
            if (existingVehicleNumber) {
                console.log('❌ [updateVehicleUserData] Vehicle number already exists:', vehicleNumberToCheck);
                vehicleNumberExists = true;
                errorMessages.push("vehicle number");
            }
        }

        // Return combined error message if any duplicates found
        if (errorMessages.length > 0) {
            const message = errorMessages.length === 1 
                ? `This ${errorMessages[0]} already exists`
                : `This ${errorMessages.join(" and ")} already exist`;
            
            console.log('❌ [updateVehicleUserData] Validation failed:', message);
            return res.status(400).json({ 
                message: message, 
                status: false 
            });
        }

        console.log('✅ [updateVehicleUserData] Validation passed, proceeding with update');

        // First, update the User table with basic user information
        if (Name || Email || MobileNumber) {
            try {
                const userUpdateData = {};
                if (Name) userUpdateData.username = Name;
                if (Email) userUpdateData.email = Email;
                if (MobileNumber) userUpdateData.mobileNumber = MobileNumber;
                
                console.log('🔍 [updateVehicleUserData] Updating User table with:', userUpdateData);
                console.log('🔍 [updateVehicleUserData] User ID to update:', resolvedUserId);
                
                const userUpdateResult = await User.update(userUpdateData, {
                    where: { user_id: resolvedUserId }
                });
                console.log('✅ [updateVehicleUserData] User table updated:', userUpdateResult);
            } catch (userUpdateError) {
                console.error('❌ [updateVehicleUserData] Error updating User table:', userUpdateError);
            }
        } else {
            console.log('🔍 [updateVehicleUserData] No Name/Email/Mobile fields to update in User table');
        }

        console.log('🚗 [updateVehicleUserData] Database fields to update:', {
            vehicle_policy_type: vehicleUserUpdateObj.vehicle_policy_type,  // From policyRadio (Fresh/Renewal/Portability)
            nominee_type: vehicleUserUpdateObj.nominee_type,                // From Type (Individual/Corporate)
            policy_plan_type: vehicleUserUpdateObj.policy_plan_type         // From PolicyPlanType (COMPREHENSIVE/SAOD/THIRD PARTY)
        });
        await vehicleUserRecord.update({
            ...vehicleUserUpdateObj,
            // fallback to old values if undefined
            vehicle_policy_type: vehicleUserUpdateObj.vehicle_policy_type || vehicleUserRecord.vehicle_policy_type,
            nominee_type: vehicleUserUpdateObj.nominee_type || vehicleUserRecord.nominee_type,

            company_name: vehicleUserUpdateObj.company_name || vehicleUserRecord.company_name,
            contact_person_name: vehicleUserUpdateObj.contact_person_name || vehicleUserRecord.contact_person_name,
            remark: vehicleUserUpdateObj.remark || vehicleUserRecord.remark || '',
            contact_person_no: vehicleUserUpdateObj.contact_person_no || vehicleUserRecord.contact_person_no,
            vehicle_number: vehicleUserUpdateObj.vehicle_number || vehicleUserRecord.vehicle_number,
            vehicle_id: vehicleUserUpdateObj.vehicle_id || vehicleUserRecord.vehicle_id,
            reference_id: vehicleUserUpdateObj.reference_id || vehicleUserRecord.reference_id,
            make: vehicleUserUpdateObj.make || vehicleUserRecord.make,
            model: vehicleUserUpdateObj.model || vehicleUserRecord.model,
            manufacturing_year: vehicleUserUpdateObj.manufacturing_year || vehicleUserRecord.manufacturing_year,
            engine_number: vehicleUserUpdateObj.engine_number || vehicleUserRecord.engine_number,
            chassis_number: vehicleUserUpdateObj.chassis_number || vehicleUserRecord.chassis_number,
            agentName: vehicleUserUpdateObj.agentName || vehicleUserRecord.agentName,
            agentCode: vehicleUserUpdateObj.agentCode || vehicleUserRecord.agentCode,
            agentContactNumber: vehicleUserUpdateObj.agentContactNumber || vehicleUserRecord.agentContactNumber,
            status: vehicleUserUpdateObj.status || vehicleUserRecord.status,
            policy_plan_type: vehicleUserUpdateObj.policy_plan_type || vehicleUserRecord.policy_plan_type,
            vehicle_type: vehicleUserUpdateObj.vehicle_type || vehicleUserRecord.vehicle_type,
            vendor: vehicleUserUpdateObj.vendor || vehicleUserRecord.vendor,
        });
        console.log('[VehicleUserUpdate] vehicleUser update successful for ID:', req.params.vehicle_user_id);

        // --- RENEWAL FLOW: Transfer Running Policy to Previous Policy FIRST (before updating running policy) ---
        const isRenewalOrPortability = policy_type === 'Renewal' || policy_type === 'Portability';
        if (isRenewalOrPortability && runningPolicy && typeof runningPolicy === 'object') {
            console.log('🔄 [RENEWAL] Starting renewal process - transferring current running policy to previous');
            
            // Fetch the CURRENT running policy before we overwrite it
            const currentRunningPolicy = await vehcileRunningPolicy.findOne({
                where: { vehicle_user_id: req.params.vehicle_user_id },
                include: [
                    { model: companyType, as: 'CompanyType' },
                    { model: db.policyPlan, as: 'policyPlan' },
                    { model: db.policyType, as: 'policyType' }
                ]
            });
            
            if (currentRunningPolicy) {
                console.log('🔄 [RENEWAL] Found current running policy to transfer:', {
                    PolicyNumber: currentRunningPolicy.PolicyNumber,
                    PolicyFrom: currentRunningPolicy.PolicyFrom,
                    PolicyTo: currentRunningPolicy.PolicyTo,
                    company_id: currentRunningPolicy.company_id,
                    policy_type_id: currentRunningPolicy.policy_type_id,
                    policy_plan_id: currentRunningPolicy.policy_plan_id,
                    CompanyType: currentRunningPolicy.CompanyType,
                    policyPlan: currentRunningPolicy.policyPlan,
                    policyType: currentRunningPolicy.policyType
                });
                
                // Mark all existing previous policies as inactive
                await vehiclePreviousPolicy.update({
                    status: "notActive",
                }, {
                    where: { vehicle_user_id: req.params.vehicle_user_id }
                });
                
                // Transfer current running policy to previous policy
                const transferredPolicy = {
                    vehicle_user_id: req.params.vehicle_user_id,
                    PolicyNumber: currentRunningPolicy.PolicyNumber,
                    policy_type_id: currentRunningPolicy.policy_type_id,
                    company_id: currentRunningPolicy.company_id,
                    policy_plan_id: currentRunningPolicy.policy_plan_id,
                    PolicyFrom: currentRunningPolicy.PolicyFrom,
                    PolicyTo: currentRunningPolicy.PolicyTo,
                    PolicyIssuedDate: currentRunningPolicy.PolicyIssuedDate,
                    ExpiryDate: currentRunningPolicy.ExpiryDate || currentRunningPolicy.PolicyTo,
                    PolicyTenure: currentRunningPolicy.PolicyTenure,
                    PremiumAmount: currentRunningPolicy.PremiumAmount,
                    IDV: currentRunningPolicy.IDV,
                    NCB: currentRunningPolicy.NCB,
                    NomineeName: currentRunningPolicy.NomineeName,
                    NomineeRelation: currentRunningPolicy.NomineeRelation,
                    NomineeAge: currentRunningPolicy.NomineeAge,
                    NomineeDob: currentRunningPolicy.NomineeDob,
                    CurrentPolicyFile: currentRunningPolicy.CurrentPolicyFile,
                    Vendor: currentRunningPolicy.Vendor,
                    agentName: currentRunningPolicy.agentName || agent_name,
                    agentCode: currentRunningPolicy.agentCode || agent_code,
                    agentContactNumber: currentRunningPolicy.agentContactNumber || agent_contact_number,
                    status: "active",
                };
                
                console.log('🔄 [RENEWAL] Transferring policy with company_id:', currentRunningPolicy.company_id);
                
                const createdPreviousPolicy = await vehiclePreviousPolicy.create(transferredPolicy);
                console.log('✅ [RENEWAL] Successfully transferred running policy to previous policy');
                console.log('🔄 [RENEWAL] Created previous policy with ID:', createdPreviousPolicy.id, 'company_id:', createdPreviousPolicy.company_id);
            } else {
                console.log('⚠️ [RENEWAL] No existing running policy found to transfer');
            }
        }

        // --- Running Policy Update ---
        if (runningPolicy && typeof runningPolicy === 'object') {
            const uploadsDir = path.join(__dirname, "../../uploads");
            let findPolicy = await vehcileRunningPolicy.findOne({
                where: { vehicle_user_id: req.params.vehicle_user_id }
            });
            
            // Resolve company name to company_id if CompanyName is provided
            let resolvedCompanyId = runningPolicy.company_id || runningPolicy.CompanyId || Data.company_id || null;
            if (!resolvedCompanyId && (runningPolicy.CompanyName || company_name)) {
                const companyNameToLookup = runningPolicy.CompanyName || company_name;
                console.log('🔍 [RENEWAL] Resolving company name to ID:', companyNameToLookup);
                const companyRecord = await companyType.findOne({
                    where: { company_name: companyNameToLookup }
                });
                if (companyRecord) {
                    resolvedCompanyId = companyRecord.company_id;
                    console.log('✅ [RENEWAL] Resolved company name to ID:', resolvedCompanyId);
                } else {
                    console.log('⚠️ [RENEWAL] Company not found for name:', companyNameToLookup);
                }
            }
            console.log('🔍 [UPDATE] req.files keys:', Object.keys(req.files || {}));
            console.log('🔍 [UPDATE] CurrentPolicyFile exists:', !!(req.files && req.files.CurrentPolicyFile));
            if (req.files && req.files.CurrentPolicyFile) {
                let CurrentPolicyFile = req.files.CurrentPolicyFile;
                const uniqueName = `${uuidv4()}-${path.basename(CurrentPolicyFile.name)}`;
                const uploadPath = path.join(uploadsDir, uniqueName);
                
                // Delete old file if it exists
                if (findPolicy?.CurrentPolicyFile) {
                    const oldFilePath = path.join(uploadsDir, findPolicy.CurrentPolicyFile);
                    if (fsSync.existsSync(oldFilePath)) {
                        fsSync.unlinkSync(oldFilePath);
                        console.log(`📁 [UPDATE] Deleted old CurrentPolicyFile: ${findPolicy.CurrentPolicyFile}`);
                    }
                }
                
                // Handle file movement - now using in-memory files
                if (CurrentPolicyFile.mv) {
                    // When useTempFiles: false, use mv method (in-memory files)
                    console.log(`📁 [UPDATE] Using file.mv() for CurrentPolicyFile`);
                await CurrentPolicyFile.mv(uploadPath);
                } else if (CurrentPolicyFile.data) {
                    // Fallback: write file data directly
                    console.log(`📁 [UPDATE] Using file.data for CurrentPolicyFile`);
                    await fs.writeFile(uploadPath, CurrentPolicyFile.data);
                } else {
                    throw new Error(`Unable to process CurrentPolicyFile - no valid file handling method found`);
                }
                
                runningPolicy.CurrentPolicyFile = uniqueName;
                console.log(`📁 [UPDATE] CurrentPolicyFile saved: ${uniqueName}`);
            }
            const runningPolicyData = {
                policy_type_id: runningPolicy.policy_type_id || runningPolicy.PolicyTypeId || Data.policy_type_id || null,
                company_id: resolvedCompanyId,
                policy_plan_id: runningPolicy.policy_plan_id || runningPolicy.PolicyPlanTypeId || Data.policy_plan_id || null,
                CurrentPolicyFile: runningPolicy.CurrentPolicyFile || (findPolicy ? findPolicy.CurrentPolicyFile : null),
                isNomineeFlag: runningPolicy.isNomineeFlag || Data.isNomineeFlag || null,
                // Handle PremiumAmount specifically to avoid empty string database errors
                PremiumAmount: runningPolicy.PremiumAmount && runningPolicy.PremiumAmount !== '' ? parseFloat(runningPolicy.PremiumAmount) : null,
                // Handle other numeric fields that might cause similar issues
                PolicyTenure: runningPolicy.PolicyTenure && runningPolicy.PolicyTenure !== '' ? parseInt(runningPolicy.PolicyTenure) : null,
                NomineeAge: runningPolicy.NomineeAge && runningPolicy.NomineeAge !== '' ? parseInt(runningPolicy.NomineeAge) : null,
                // Add agent details
                agentName: agent_name || '',
                agentCode: agent_code || '',
                agentContactNumber: agent_contact_number || '',
                // Spread the rest of runningPolicy but exclude the fields we've handled above
                ...Object.fromEntries(
                    Object.entries(runningPolicy).filter(([key]) => 
                        !['PremiumAmount', 'PolicyTenure', 'NomineeAge', 'agentName', 'agentCode', 'agentContactNumber'].includes(key)
                    )
                ),
            };
            console.log('[VehicleUserUpdate] RunningPolicy update object:', runningPolicyData);
            if (findPolicy) {
                await vehcileRunningPolicy.update(runningPolicyData, { where: { vehicle_user_id: req.params.vehicle_user_id } });
                console.log('[VehicleUserUpdate] RunningPolicy updated for vehicle_user_id:', req.params.vehicle_user_id);
            } else {
                runningPolicyData.vehicle_user_id = req.params.vehicle_user_id;
                await vehcileRunningPolicy.create(runningPolicyData);
                console.log('[VehicleUserUpdate] RunningPolicy created for vehicle_user_id:', req.params.vehicle_user_id);
            }
        }
        // --- Previous Policy Update (for Portability when user manually enters previous policy data) ---
        // Note: Renewal flow is already handled above, so skip this for Renewal
        if (previousPolicy && typeof previousPolicy === 'object' && policy_type === 'Portability') {
            console.log('🔄 [PORTABILITY] Handling manually entered previous policy data');
            
            // Check if previous policy has actual data (not empty object)
            const hasPreviousPolicyData = previousPolicy.PolicyNumber || previousPolicy.CompanyName || 
                                         previousPolicy.PolicyFrom || previousPolicy.PolicyTo;
            
            if (hasPreviousPolicyData) {
                // Mark existing previous policies as inactive
                await vehiclePreviousPolicy.update({
                    status: "notActive",
                }, {
                    where: { vehicle_user_id: req.params.vehicle_user_id }
                });
                
                const uploadsDir = path.join(__dirname, "../../uploads");
                if (req.files && req.files.PreviousCurrentPolicyFile) {
                    let PdfFile = req.files.PreviousCurrentPolicyFile;
                    const uniqueName = `${uuidv4()}-${path.basename(PdfFile.name)}`;
                    const uploadPath = path.join(uploadsDir, uniqueName);
                    await PdfFile.mv(uploadPath);
                    previousPolicy.CurrentPolicyFile = uniqueName;
                }
                
                const historyData = {
                    vehicle_user_id: req.params.vehicle_user_id,
                    ...previousPolicy,
                    policy_type_id: previousPolicy.PolicyTypeId || previousPolicy.policy_type_id,
                    company_id: previousPolicy.CompanyId || previousPolicy.company_id,
                    policy_plan_id: previousPolicy.PolicyPlanTypeId || previousPolicy.policy_plan_id,
                    status: "active",
                    // Add agent details for portability policies
                    agentName: previousPolicy.agentName || agent_name || '',
                    agentCode: previousPolicy.agentCode || agent_code || '',
                    agentContactNumber: previousPolicy.agentContactNumber || agent_contact_number || '',
                };
                // Remove id if present to avoid duplicate primary key error
                if (historyData.id) delete historyData.id;
                
                await vehiclePreviousPolicy.create(historyData);
                console.log('✅ [PORTABILITY] PreviousPolicy created for vehicle_user_id:', req.params.vehicle_user_id);
            } else {
                console.log('⚠️ [PORTABILITY] No previous policy data provided, skipping');
            }
        }
        console.log('[VehicleUserUpdate] Update process completed successfully for vehicle_user_id:', req.params.vehicle_user_id);
        
        // --- Document Upload Handling (aadhar, pan, gst, custom) ---
        const uploadsDir = path.join(__dirname, "../../uploads");
        
        // Handle standard documents (aadhar, pan, gst, rcbook)
        const standardDocuments = [
            { fieldName: 'aadhar', categoryId: 1 },
            { fieldName: 'pan', categoryId: 2 },
            { fieldName: 'gst', categoryId: 3 },
            { fieldName: 'rcbook', categoryId: 4 }
        ];
        
        for (const doc of standardDocuments) {
            if (req.files && req.files[doc.fieldName]) {
                const fileObj = req.files[doc.fieldName];
                const uniqueName = `${uuidv4()}-${path.basename(fileObj.name)}`;
                const uploadPath = path.join(uploadsDir, uniqueName);
                
                // Handle file movement - now using in-memory files
                if (fileObj.mv) {
                    // When useTempFiles: false, use mv method (in-memory files)
                    console.log(`📁 [UPDATE] Using file.mv() for ${doc.fieldName}`);
                await fileObj.mv(uploadPath);
                } else if (fileObj.data) {
                    // Fallback: write file data directly
                    console.log(`📁 [UPDATE] Using file.data for ${doc.fieldName}`);
                    await fs.writeFile(uploadPath, fileObj.data);
                } else {
                    throw new Error(`Unable to process ${doc.fieldName} file - no valid file handling method found`);
                }
                
                // Delete old document for this categoryId/vehicle_user_id
                await vehicle_document.destroy({
                    where: {
                        vehicle_user_id: req.params.vehicle_user_id,
                        categoryId: doc.categoryId
                    }
                });
                
                // Create new document record
                await vehicle_document.create({
                    user_id: resolvedUserId,
                    vehicle_user_id: req.params.vehicle_user_id,
                    categoryId: doc.categoryId,
                    file: uniqueName
                });
                console.log(`[VehicleUserUpdate] ${doc.fieldName} document saved for vehicle_user_id: ${req.params.vehicle_user_id}`);
            }
        }
        
        // Handle custom documents
        let documentsData;
        if (req.body.data) {
            // JSON request - documentsData is nested under 'data' property
            documentsData = req.body.documentsData;
        if (typeof documentsData === "string") {
            try { documentsData = JSON.parse(documentsData); } catch (e) { documentsData = null; }
            }
        } else {
            // FormData request - documentsData is directly in req.body
            documentsData = Data.documentsData;
            if (typeof documentsData === "string") {
                try { documentsData = JSON.parse(documentsData); } catch (e) { documentsData = null; }
            }
        }
        if (documentsData && Array.isArray(documentsData)) {
            for (const doc of documentsData) {
                const fieldName = doc.fileFieldName; // e.g., "custom_0", "custom_1"
                if (req.files && req.files[fieldName]) {
                    const fileObj = req.files[fieldName];
                    const uniqueName = `${uuidv4()}-${path.basename(fileObj.name)}`;
                    const uploadPath = path.join(uploadsDir, uniqueName);
                    await fileObj.mv(uploadPath);
                    
                    // Create custom document record
                    await vehicle_document.create({
                        user_id: resolvedUserId,
                        vehicle_user_id: req.params.vehicle_user_id,
                        categoryId: doc.categoryId,
                        file: uniqueName
                    });
                    console.log(`[VehicleUserUpdate] Custom document ${fieldName} saved for vehicle_user_id: ${req.params.vehicle_user_id}`);
                }
            }
        }
        // --- Fetch all related data for full response ---
        const updatedVehicleUser = await vehicleUser.findByPk(req.params.vehicle_user_id);
        const runningPolicyData = await vehcileRunningPolicy.findOne({ 
            where: { vehicle_user_id: req.params.vehicle_user_id },
            include: [
                { model: companyType, as: 'CompanyType' },
                { model: db.policyPlan, as: 'policyPlan', attributes: [['policy_name', 'PolicyPlanType']] },
                { model: db.policyType, as: 'policyType', attributes: [['policy_type_name', 'PolicyTypeName']] }
            ]
        });
        const previousPolicies = await vehiclePreviousPolicy.findAll({ 
            where: { vehicle_user_id: req.params.vehicle_user_id },
            include: [
                { model: companyType, as: 'CompanyType' },
                { model: db.policyPlan, as: 'policyPlan', attributes: [['policy_name', 'PolicyPlanType']] },
                { model: db.policyType, as: 'policyType', attributes: [['policy_type_name', 'PolicyTypeName']] }
            ]
        });
        const vehicleDocuments = await vehicle_document.findAll({ where: { vehicle_user_id: req.params.vehicle_user_id } });
        return res.status(200).send({
            message: "Vehicle successfully updated!",
            status: true,
            vehicleUser: updatedVehicleUser,
            runningPolicy: runningPolicyData,
            previousPolicies: previousPolicies,
            documents: vehicleDocuments
        });
    } catch (error) {
        console.error("[VehicleUserUpdate] Error updating vehicle user data:", error);
        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.map(err => err.message);
            return res.status(400).json({ 
                message: 'Validation failed', 
                errors: errors,
                status: false 
            });
        } else if (error.name === 'SequelizeUniqueConstraintError') {
            // Handle unique constraint violations
            const field = error.errors[0]?.path || 'field';
            const message = `This ${field.replace('_', ' ')} already exists`;
            return res.status(400).json({ 
                message: message, 
                status: false 
            });
        } else {
            return res.status(500).json({ 
                message: 'Internal server error', 
                error: error.message,
                status: false 
            });
        }
    }
};

exports.getVehicleUserData = async (req, res) => {

    // Make dates optional - only use them if provided
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;
    const startDay = startDate ? new Date(startDate) : null;
    const endDay = endDate ? new Date(endDate) : null;

    console.log('🔍 [getVehicleUserData] User info:', {
        id: req.user.id,
        Role: req.user.Role,
        username: req.user.username
    });

    // Open for all roles - no role restrictions
    vehicleUser.findAll({
        include: [
            { model: User, as: "user_pk_vehicle_id" }, 
            { model: references }  // No alias - use default
        ]
    })
        .then(async (vehicleData) => {
                // Convert to plain objects
                vehicleData = vehicleData.map(item => item.get({ plain: true }));
                
                console.log('🔍 [getVehicleUserData] Found vehicle data count:', vehicleData.length);
                
                // If no data found, return empty array
                if (!vehicleData || vehicleData.length === 0) {
                    return res.status(200).send({
                        message: "Vehicle category users retrieved successfully.",
                        data: [],
                        success: true,
                        status: true,
                    });
                }
                
                const vehicleIds = vehicleData.map((item) => item.vehicle_user_id); // Extract mediclaim IDs
                const documnets_user = await vehicle_document.findAll({
                    where: { vehicle_user_id: vehicleIds },
                    raw: true,
                });
                const runningPolicies = await vehcileRunningPolicy.findAll({
                    where: { vehicle_user_id: vehicleIds },
                    include: [
                        { model: companyType, as: 'CompanyType' },  // Use correct alias 'CompanyType'
                        { model: db.policyPlan, as: 'policyPlan', attributes: [['policy_name', 'PolicyPlanType']] },
                        { model: db.policyType, as: 'policyType', attributes: [['policy_type_name', 'PolicyTypeName']] }
                    ]
                    // remove raw: true
                });
                const previousPolicies = await vehiclePreviousPolicy.findAll({
                    where: { vehicle_user_id: vehicleIds },
                    include: [
                        { model: companyType, as: 'CompanyType' },
                        { model: db.policyPlan, as: 'policyPlan', attributes: [['policy_name', 'PolicyPlanType']] },
                        { model: db.policyType, as: 'policyType', attributes: [['policy_type_name', 'PolicyTypeName']] }
                    ]
                    // remove raw: true to get associations
                });
                
                // Convert to plain objects to include associations
                const runningPoliciesPlain = runningPolicies.map(item => item.get({ plain: true }));
                const previousPoliciesPlain = previousPolicies.map(item => item.get({ plain: true }));
                
                console.log(documnets_user)
                console.log('Fetched runningPolicies:', JSON.stringify(runningPoliciesPlain, null, 2));

                // Step 3: Attach family members to the corresponding mediclaim records
                const mediclaimWithFamily = vehicleData.map((mediclaim) => {
                    const document = documnets_user.filter((member) => member.vehicle_user_id === mediclaim.vehicle_user_id);
                    const running = runningPoliciesPlain.filter((member) => member.vehicle_user_id === mediclaim.vehicle_user_id);
                    const previous = previousPoliciesPlain.filter((member) => member.vehicle_user_id === mediclaim.vehicle_user_id);
                    return {
                        ...mediclaim, // Convert Sequelize instance to plain JSON
                        documents: document,
                        runningPolicy: running.length ? running[0] : {},
                        previousPolicy: previous.length ? previous[0] : {},
                        previousPolicies: previous // Return all previous policies as array
                    };
                }).filter((item) => {
                    // Only apply date filtering if dates are provided
                    if (!startDay || !endDay) {
                        return true; // Return all items if no date filter
                    }

                    const policyIssued = item.runningPolicy?.PolicyIssuedDate
                        ? new Date(item.runningPolicy.PolicyIssuedDate)
                        : null;

                    let createdAtDate = null;
                    if (!policyIssued && item.createdAt) {
                        // Convert UTC to IST
                        const utcDate = new Date(item.createdAt);
                        const istOffset = 5.5 * 60 * 60 * 1000;
                        const istDate = new Date(utcDate.getTime() + istOffset);
                        createdAtDate = new Date(istDate.toISOString().split("T")[0]); // Only keep yyyy-mm-dd
                    }

                    // Priority: use policyIssued
                    if (policyIssued) {
                        return policyIssued >= startDay && policyIssued <= endDay;
                    }

                    // Fallback: use createdAt (local date)
                    return createdAtDate && createdAtDate >= startDay && createdAtDate <= endDay;
                });
                res.status(200).send({
                    message: "Vehicle category users retrieved successfully.",
                    data: mediclaimWithFamily,
                    success: true,
                    status: true,
                });
            })
            .catch((e) => {
                console.log('🔍 [getVehicleUserData] Error:', e);
                console.log('🔍 [getVehicleUserData] Error Message:', e.message);
                console.log('🔍 [getVehicleUserData] Error Stack:', e.stack);
                res.status(400).send({ 
                    message: "Error fetching vehicle data", 
                    error: e.message,
                    status: false 
                });
            });


};

// exports.getVehicleUserRenewalData = async (req, res) => {
//     try {
//         const { startDate, endDate } = req.body;
        
//         // If no dates provided, get all vehicle category users (including those without vehicle records)
//         if (!startDate || !endDate) {
//             console.log('🔍 getVehicleUserRenewalData: No dates provided, fetching all vehicle category users');
            
//             // Get all users assigned to Vehicle category (category_id: 6)
//             const vehicleCategoryUsers = await db.consumerRoleMapping.findAll({
//                 where: { category_id: 6 },
//                 include: [
//                     {
//                         model: db.user,
//                         as: 'userConsumers',
//                         attributes: ['user_id', 'username', 'email', 'mobileNumber', 'referenceName', 'role_id']
//                     }
//                 ],
//                 raw: true
//             });

//             console.log('🔍 getVehicleUserRenewalData: Found vehicle category users:', vehicleCategoryUsers.length);

//             // Get all vehicle user data directly (not per user mapping)
//             const vehicleUserData = await vehicleUser.findAll({
//                     include: [
//                         { model: User, as: "user_pk_vehicle_id" },
//                         { model: references, as: 'reference' },
//                         {
//                             model: vehcileRunningPolicy,
//                             as: 'runningPolicy',
//                             required: false,
//                             attributes: [
//                                 "id",
//                                 "PolicyNumber",
//                                 "PolicyTenure",
//                                 "PremiumAmount",
//                                 "PolicyFrom",
//                                 "PolicyTo",
//                                 "NCB",
//                                 "IDV",
//                                 "PolicyIssuedDate",
//                                 "ExpiryDate",
//                                 "policy_type_id",
//                                 "policy_plan_id",
//                                 "Vendor",
//                                 "NomineeName",
//                                 "NomineeRelation",
//                                 "NomineeDob",
//                                 "NomineeAge",
//                                 "CurrentPolicyFile",
//                             ],
//                             include: [{ model: companyType, as: 'CompanyType' }]
//                         },
//                         { 
//                             model: vehiclePreviousPolicy, 
//                             as: 'previousPolicies',
//                             where: { status: 'active' },
//                             required: false,
//                             attributes: [
//                                 "id",
//                                 "vehicle_user_id",
//                                 "PolicyNumber",
//                                 "policy_type_id",
//                                 "policy_plan_id",
//                                 "company_id",
//                                 "PolicyTenure",
//                                 "PremiumAmount",
//                                 "NomineeName",
//                                 "NomineeRelation",
//                                 "PolicyFrom",
//                                 "PolicyTo",
//                                 "PolicyIssuedDate",
//                                 "ExpiryDate",
//                                 "NomineeDob",
//                                 "Vendor",
//                                 "IDV",
//                                 "isNomineeFlag",
//                                 "claim",
//                                 "NCB",
//                                 "NomineeAge",
//                                 "CurrentPolicyFile",
//                                 "status",
//                                 "agentName",
//                                 "agentCode",
//                                 "agentContactNumber"
//                             ],
//                             include: [
//                                 { model: companyType, as: 'CompanyType' },
//                                 { model: db.policyPlan, as: 'policyPlan', attributes: [['policy_name', 'PolicyPlanType']] }
//                             ]
//                         },
//                         {
//                             model: vehicle_document,
//                             as: 'documents',
//                             required: false,
//                             attributes: ['id', 'categoryId', 'file']
//                         }
//                     ]
//                 });

//             console.log('🔍 getVehicleUserRenewalData: Found vehicle records:', vehicleUserData.length);

//             // Process the vehicle data
//             const result = vehicleUserData.map(vehicleRecord => {
//                 const item = vehicleRecord.get({ plain: true });
                
//                 // Debug: Log previous policies count
//                 if (item.previousPolicies) {
//                     console.log(`🔍 Vehicle ${item.vehicle_user_id}: Found ${item.previousPolicies.length} previous policies`);
//                 }
                
//                 // Fix previous policies (now an array) - maintain backwards compatibility
//                 if (item.previousPolicies && Array.isArray(item.previousPolicies) && item.previousPolicies.length > 0) {
//                     // Keep first previous policy as previousPolicy for backwards compatibility
//                     item.previousPolicy = item.previousPolicies[0];
                    
//                     // Fix company name for all previous policies
//                     item.previousPolicies = item.previousPolicies.map(prevPolicy => {
//                         if (!prevPolicy.companytype || !prevPolicy.companytype.company_name) {
//                             if (item.company_name) {
//                                 prevPolicy.companytype = {
//                                     company_name: item.company_name,
//                                     company_id: null
//                                 };
//                             }
//                         }
//                         return prevPolicy;
//                     });
                    
//                     // Also fix the first previousPolicy for backwards compatibility
//                     if (!item.previousPolicy.companytype || !item.previousPolicy.companytype.company_name) {
//                         if (item.company_name) {
//                             item.previousPolicy.companytype = {
//                                 company_name: item.company_name,
//                                 company_id: null
//                             };
//                         }
//                     }
//                 }
                
//                 // Fix reference data structure - ensure it's an object
//                 if (item.reference && typeof item.reference === 'string') {
//                     // If reference is a string, convert it to proper object structure
//                     item.reference = {
//                         reference_id: item.reference_id,
//                         reference_name: item.reference
//                     };
//                 } else if (!item.reference && item.reference_id) {
//                     // If reference is null but reference_id exists, create reference object
//                     item.reference = {
//                         reference_id: item.reference_id,
//                         reference_name: item.reference_name || 'N/A'
//                     };
//                 }
                
//                     if (item.runningPolicy && item.runningPolicy.policyPlan) {
//                         item.runningPolicy.PolicyPlanType = item.runningPolicy.policyPlan.PolicyPlanType;
//                         delete item.runningPolicy.policyPlan;
//                     }
//                     // Ensure vehicle_user_id is always present
//                     if (!item.vehicle_user_id && item.id) {
//                         item.vehicle_user_id = item.id;
//                     }
//                     return item;
//             });

//             console.log('🔍 getVehicleUserRenewalData: Final result count:', result.length);
            
//             return res.status(200).send({
//                 success: true,
//                 message: "Vehicle category users retrieved successfully.",
//                 data: result
//             });
//         }

//         // Original logic for date-based filtering
//         let whereObj = {};
//         if (req.user.Role !== 1) {
//             whereObj.consumer_role_id = req.user.id;
//         }
//         // Add status filter if provided
//         if (req.body.status) {
//             whereObj.status = req.body.status;
//         }

//         const vehicleData = await vehicleUser.findAll({
//             where: whereObj,
//             include: [
//                 { model: User, as: "user_pk_vehicle_id" },
//                 { model: references, as: 'reference' },
//                 {
//                     model: vehcileRunningPolicy,
//                     as: 'runningPolicy',
//                     required: false,
//                     attributes: [
//                         "id",
//                         "PolicyNumber",
//                         "PolicyTenure",
//                         "PremiumAmount",
//                         "PolicyFrom",
//                         "PolicyTo",
//                         "NCB",
//                         "IDV",
//                         "PolicyIssuedDate",
//                         "ExpiryDate",
//                         "policy_type_id",
//                         "policy_plan_id",
//                         "Vendor",
//                         "NomineeName",
//                         "NomineeRelation",
//                         "NomineeDob",
//                         "NomineeAge",
//                         "CurrentPolicyFile",
//                     ],
//                     include: [{ model: companyType, as: 'CompanyType' }]
//                 },
//                 { 
//                     model: vehiclePreviousPolicy, 
//                     as: 'previousPolicies',
//                     required: false,
//                     include: [
//                         { model: companyType, as: 'CompanyType' },
//                         { model: db.policyPlan, as: 'policyPlan', attributes: [['policy_name', 'PolicyPlanType']] }
//                     ]
//                 },
//                 {
//                     model: vehicle_document,
//                     as: 'documents',
//                     required: false,
//                     attributes: ['id', 'categoryId', 'file']
//                 }
//             ]
//         });

//         console.log('🔍 getVehicleUserRenewalData: vehicleData.length before filtering:', vehicleData.length);

//         // Apply date filtering after fetching data - but only if dates are provided
//         let filteredVehicleData = vehicleData;
//         if (startDate && endDate) {
//             filteredVehicleData = vehicleData.filter(item => {
//             const start = new Date(startDate);
//             const end = new Date(endDate);

//             const policyIssued = item.runningPolicy?.PolicyIssuedDate
//                 ? new Date(item.runningPolicy.PolicyIssuedDate)
//                 : null;

//             let createdAtDate = null;
//             if (!policyIssued && item.createdAt) {
//                 // Convert UTC to IST
//                 const utcDate = new Date(item.createdAt);
//                 const istOffset = 5.5 * 60 * 60 * 1000;
//                 const istDate = new Date(utcDate.getTime() + istOffset);
//                 createdAtDate = new Date(istDate.toISOString().split("T")[0]); // Only keep yyyy-mm-dd
//             }

//             // Priority: use policyIssued
//             if (policyIssued) {
//                 return policyIssued >= start && policyIssued <= end;
//             }

//             // Fallback: use createdAt (local date)
//             return createdAtDate && createdAtDate >= start && createdAtDate <= end;
//         });
//         }

//         console.log('🔍 getVehicleUserRenewalData: vehicleData.length after filtering:', filteredVehicleData.length);

//         if (!filteredVehicleData.length) {
//             return res.status(200).send({ success: true, data: [], message: "No vehicle renewal data found for the selected dates." });
//         }

//         const plainVehicleData = filteredVehicleData.map(d => {
//             const item = d.get({ plain: true });
            
//             // Fix previous policy company name - use vehicleuser company_name as fallback
//             if (item.previousPolicy) {
//                 // If previous policy doesn't have company info from companytype association, use vehicleuser company_name
//                 if (!item.previousPolicy.companytype || !item.previousPolicy.companytype.company_name) {
//                     if (item.company_name) {
//                         // Create a companytype object with the company name from vehicleuser
//                         item.previousPolicy.companytype = {
//                             company_name: item.company_name,
//                             company_id: null
//                         };
//                     }
//                 }
//             }
            
//             // Fix reference data structure - ensure it's an object
//             if (item.reference && typeof item.reference === 'string') {
//                 // If reference is a string, convert it to proper object structure
//                 item.reference = {
//                     reference_id: item.reference_id,
//                     reference_name: item.reference
//                 };
//             } else if (!item.reference && item.reference_id) {
//                 // If reference is null but reference_id exists, create reference object
//                 item.reference = {
//                     reference_id: item.reference_id,
//                     reference_name: item.reference_name || 'N/A'
//                 };
//             }
            
//             if (item.runningPolicy && item.runningPolicy.policyPlan) {
//                 item.runningPolicy.PolicyPlanType = item.runningPolicy.policyPlan.PolicyPlanType;
//                 delete item.runningPolicy.policyPlan;
//             }
//             // Ensure vehicle_user_id is always present
//             if (!item.vehicle_user_id && item.id) {
//                 item.vehicle_user_id = item.id;
//             }
//             return item;
//         });

//         return res.status(200).send({
//             success: true,
//             message: "Vehicle data retrieved successfully.",
//             data: plainVehicleData
//         });

//     } catch (error) {
//         console.error("Error fetching vehicle renewal data:", error);
//         return res.status(500).send({ success: false, message: "Internal server error." });
//     }
// };


// exports.getVehicleUserRenewalData = async (req, res) => {
//   try {
//     const { startDate, endDate } = req.body;
//     const { Op } = require("sequelize");

//     let dateFilter = {};
//     if (startDate && endDate) {
//       dateFilter.createdAt = {
//         [Op.between]: [new Date(startDate), new Date(endDate)],
//       };
//     }

//     // Get all consumer/builder-consumer users
//     const users = await User.findAll({
//       order: [["username", "asc"]],
//       where: {
//         role_id: [3, 5],
//         ...dateFilter,
//       },
//       attributes: [
//         "user_id",
//         "username",
//         "email",
//         "mobileNumber",
//         "referenceName",
//         "role_id",
//         "builder_user",
//         "created_by",
//         "updated_by",
//         "is_from_builder_user",
//         "createdAt",
//         "updatedAt",
//       ],
//       include: [
//         {
//           model: db.role,
//           attributes: ["role_name"],
//           as: "role",
//         },
//       ],
//     });

//     // Map each user to check Vehicle Insurance category and get vehicle data
//     const updatedUsers = await Promise.all(
//       users.map(async (user) => {
//         const crList = await consumerRoleMapping.findAll({
//           where: { user_consumer_id: user.user_id },
//           include: [
//             {
//               model: User,
//               as: "userRoles",
//               attributes: ["username", "email"],
//             },
//             {
//               model: db.category,
//               as: "category",
//               attributes: ["category_name"],
//             },
//           ],
//           raw: true,
//         });

//         // ✅ Filter for only Vehicle Insurance
//         const vehicleOnly = crList.filter(
//           (m) => m["category.category_name"] === "Vehicle Insurance"
//         );

//         if (vehicleOnly.length === 0) return null; // Skip users with no Vehicle Insurance

//         const roleDisplays = vehicleOnly.map((m) => {
//           const cat = m["category.category_name"] || "N/A";
//           const roleUser = m["userRoles.username"] || "N/A";
//           return `(Vertical = ${cat} : Role User : ${roleUser})`;
//         });

//         // ✅ Fetch vehicle data for this user
//         const vehicleRecords = await vehicleUser.findAll({
//           where: { 
//             user_id: user.user_id 
//           },
//           include: [
//             { 
//               model: references, 
//               as: 'reference',
//               attributes: ['reference_id', 'reference_name']
//             },
//             {
//               model: vehcileRunningPolicy,
//               as: 'runningPolicy',
//               required: false,
//               attributes: [
//                 "id",
//                 "PolicyNumber",
//                 "PolicyTenure",
//                 "PremiumAmount",
//                 "PolicyFrom",
//                 "PolicyTo",
//                 "NCB",
//                 "IDV",
//                 "PolicyIssuedDate",
//                 "ExpiryDate",
//                 "policy_type_id",
//                 "policy_plan_id",
//                 "Vendor",
//                 "NomineeName",
//                 "NomineeRelation",
//                 "NomineeDob",
//                 "NomineeAge",
//                 "CurrentPolicyFile",
//               ],
//               include: [
//                 { model: companyType, as: 'CompanyType' },
//                 { model: db.policyPlan, as: 'policyPlan', attributes: [['policy_name', 'PolicyPlanType']] }
//               ]
//             },
//             { 
//               model: vehiclePreviousPolicy, 
//               as: 'previousPolicies',
//               where: { status: 'active' },
//               required: false,
//               attributes: [
//                 "id",
//                 "vehicle_user_id",
//                 "PolicyNumber",
//                 "policy_type_id",
//                 "policy_plan_id",
//                 "company_id",
//                 "PolicyTenure",
//                 "PremiumAmount",
//                 "NomineeName",
//                 "NomineeRelation",
//                 "PolicyFrom",
//                 "PolicyTo",
//                 "PolicyIssuedDate",
//                 "ExpiryDate",
//                 "NomineeDob",
//                 "Vendor",
//                 "IDV",
//                 "isNomineeFlag",
//                 "claim",
//                 "NCB",
//                 "NomineeAge",
//                 "CurrentPolicyFile",
//                 "status",
//                 "agentName",
//                 "agentCode",
//                 "agentContactNumber"
//               ],
//               include: [
//                 { model: companyType, as: 'CompanyType' },
//                 { model: db.policyPlan, as: 'policyPlan', attributes: [['policy_name', 'PolicyPlanType']] }
//               ]
//             },
//             {
//               model: vehicle_document,
//               as: 'documents',
//               required: false,
//               attributes: ['id', 'categoryId', 'file']
//             }
//           ]
//         });

//         // Process vehicle records
//         const processedVehicleRecords = vehicleRecords.map(vr => {
//           const item = vr.get({ plain: true });
          
//           // Fix previous policies
//           if (item.previousPolicies && Array.isArray(item.previousPolicies) && item.previousPolicies.length > 0) {
//             item.previousPolicy = item.previousPolicies[0];
            
//             item.previousPolicies = item.previousPolicies.map(prevPolicy => {
//               if (!prevPolicy.CompanyType || !prevPolicy.CompanyType.company_name) {
//                 if (item.company_name) {
//                   prevPolicy.CompanyType = {
//                     company_name: item.company_name,
//                     company_id: null
//                   };
//                 }
//               }
//               return prevPolicy;
//             });
            
//             if (!item.previousPolicy.CompanyType || !item.previousPolicy.CompanyType.company_name) {
//               if (item.company_name) {
//                 item.previousPolicy.CompanyType = {
//                   company_name: item.company_name,
//                   company_id: null
//                 };
//               }
//             }
//           }
          
//           // Fix reference
//           if (item.reference && typeof item.reference === 'string') {
//             item.reference = {
//               reference_id: item.reference_id,
//               reference_name: item.reference
//             };
//           } else if (!item.reference && item.reference_id) {
//             item.reference = {
//               reference_id: item.reference_id,
//               reference_name: item.reference_name || 'N/A'
//             };
//           }
          
//           // Fix running policy
//           if (item.runningPolicy && item.runningPolicy.policyPlan) {
//             item.runningPolicy.PolicyPlanType = item.runningPolicy.policyPlan.PolicyPlanType;
//             delete item.runningPolicy.policyPlan;
//           }
          
//           // Ensure vehicle_user_id
//           if (!item.vehicle_user_id && item.id) {
//             item.vehicle_user_id = item.id;
//           }
          
//           return item;
//         });

//         return {
//           ...user.toJSON(),
//           category: vehicleOnly,
//           roleDisplay: roleDisplays.join(" | "),
//           vehicleRecords: processedVehicleRecords, // ✅ Add vehicle data
//           hasVehicleRecords: processedVehicleRecords.length > 0 // ✅ Flag to check if user has vehicle data
//         };
//       })
//     );

//     // Remove users who don't match Vehicle Insurance
//     const filtered = updatedUsers.filter((u) => u !== null);

//     res.status(200).json({
//       message: "Vehicle Insurance consumer get success",
//       data: filtered,
//       status: true,
//     });
//   } catch (error) {
//     console.error("❌ Error in getVehicleUserRenewalData:", error);
//     res.status(500).json({
//       message: "Server error while fetching Vehicle Insurance users",
//       error: error.message,
//       status: false,
//     });
//   }
// };



// exports.getVehicleUserRenewalData = async (req, res) => {
//     try {
//       const { startDate, endDate } = req.body;
//       const { Op } = require("sequelize");
  
//       let dateFilter = {};
//       if (startDate && endDate) {
//         dateFilter.createdAt = {
//           [Op.between]: [new Date(startDate), new Date(endDate)],
//         };
//       }
  
//       const users = await User.findAll({
//         order: [["username", "asc"]],
//         where: {
//           role_id: [3, 5],
//           ...dateFilter,
//         },
//         attributes: [
//           "user_id",
//           "username",
//           "email",
//           "mobileNumber",
//           "referenceName",
//           "role_id",
//           "builder_user",
//           "created_by",
//           "updated_by",
//           "is_from_builder_user",
//           "createdAt",
//           "updatedAt",
//         ],
//         include: [
//           {
//             model: db.role,
//             attributes: ["role_name"],
//             as: "role",
//           },
//         ],
//       });
  
//       const allVehicleRecords = [];
  
//       for (const user of users) {
//         const crList = await consumerRoleMapping.findAll({
//           where: { user_consumer_id: user.user_id },
//           include: [
//             {
//               model: User,
//               as: "userRoles",
//               attributes: ["username", "email"],
//             },
//             {
//               model: db.category,
//               as: "category",
//               attributes: ["category_name"],
//             },
//           ],
//           raw: true,
//         });
  
//         const vehicleOnly = crList.filter(
//           (m) => m["category.category_name"] === "Vehicle Insurance"
//         );
  
//         if (vehicleOnly.length === 0) {
//           // ⚙ Include users with no Vehicle records but valid consumer entry
//           allVehicleRecords.push({
//             ...user.toJSON(),
//             category: [],
//             roleDisplay: "No Vehicle Insurance Category",
//             hasVehicleRecords: false,
//           });
//           continue;
//         }
  
//         const roleDisplays = vehicleOnly.map((m) => {
//           const cat = m["category.category_name"] || "N/A";
//           const roleUser = m["userRoles.username"] || "N/A";
//           return `Vertical = ${cat} : Role User : ${roleUser}`;
//         });
  
//         const vehicleRecords = await vehicleUser.findAll({
//           where: { user_id: user.user_id },
//           include: [
//             {
//               model: references,
//               as: "reference",
//               attributes: ["reference_id", "reference_name"],
//             },
//             {
//               model: vehcileRunningPolicy,
//               as: "runningPolicy",
//               required: false,
//               attributes: [
//                 "id",
//                 "PolicyNumber",
//                 "PolicyTenure",
//                 "PremiumAmount",
//                 "PolicyFrom",
//                 "PolicyTo",
//                 "NCB",
//                 "IDV",
//                 "PolicyIssuedDate",
//                 "ExpiryDate",
//                 "policy_type_id",
//                 "policy_plan_id",
//                 "Vendor",
//                 "NomineeName",
//                 "NomineeRelation",
//                 "NomineeDob",
//                 "NomineeAge",
//                 "CurrentPolicyFile",
//               ],
//               include: [
//                 { model: companyType, as: "CompanyType" },
//                 {
//                   model: db.policyPlan,
//                   as: "policyPlan",
//                   attributes: [["policy_name", "PolicyPlanType"]],
//                 },
//               ],
//             },
//             {
//               model: vehiclePreviousPolicy,
//               as: "previousPolicies",
//               where: { status: "active" },
//               required: false,
//               attributes: [
//                 "id",
//                 "vehicle_user_id",
//                 "PolicyNumber",
//                 "policy_type_id",
//                 "policy_plan_id",
//                 "company_id",
//                 "PolicyTenure",
//                 "PremiumAmount",
//                 "NomineeName",
//                 "NomineeRelation",
//                 "PolicyFrom",
//                 "PolicyTo",
//                 "PolicyIssuedDate",
//                 "ExpiryDate",
//                 "NomineeDob",
//                 "Vendor",
//                 "IDV",
//                 "isNomineeFlag",
//                 "claim",
//                 "NCB",
//                 "NomineeAge",
//                 "CurrentPolicyFile",
//                 "status",
//                 "agentName",
//                 "agentCode",
//                 "agentContactNumber",
//               ],
//               include: [
//                 { model: companyType, as: "CompanyType" },
//                 {
//                   model: db.policyPlan,
//                   as: "policyPlan",
//                   attributes: [["policy_name", "PolicyPlanType"]],
//                 },
//               ],
//             },
//             {
//               model: vehicle_document,
//               as: "documents",
//               required: false,
//               attributes: ["id", "categoryId", "file"],
//             },
//           ],
//         });
  
//         if (vehicleRecords.length === 0) {
//           // ⚙ Include consumers without vehicles
//           allVehicleRecords.push({
//             ...user.toJSON(),
//             category: vehicleOnly,
//             roleDisplay: roleDisplays.join(" | "),
//             hasVehicleRecords: false,
//           });
//           continue;
//         }
  
//         for (const vr of vehicleRecords) {
//           const item = vr.get({ plain: true });
  
//           if (item.previousPolicies?.length > 0) {
//             item.previousPolicy = item.previousPolicies[0];
//           }
  
//           if (item.runningPolicy?.policyPlan) {
//             item.runningPolicy.PolicyPlanType =
//               item.runningPolicy.policyPlan.PolicyPlanType;
//             delete item.runningPolicy.policyPlan;
//           }
  
//           const vehicleRecord = {
//             user_id: user.user_id,
//             username: user.username,
//             email: user.email,
//             mobileNumber: user.mobileNumber,
//             referenceName: user.referenceName,
//             role_id: user.role_id,
//             createdAt: user.createdAt,
//             updatedAt: user.updatedAt,
  
//             vehicle_user_id: item.vehicle_user_id || item.id,
//             vehicle_number: item.vehicle_number,
//             make: item.make,
//             model: item.model,
//             manufacturing_year: item.manufacturing_year,
//             engine_number: item.engine_number,
//             chassis_number: item.chassis_number,
//             vehicle_type: item.vehicle_type,
//             company_name: item.company_name,
//             contact_person_name: item.contact_person_name,
//             contact_person_no: item.contact_person_no,
//             vehicle_policy_type: item.vehicle_policy_type,
//             nominee_type: item.nominee_type,
//             reference_id: item.reference_id,
//             reference: item.reference,
  
//             runningPolicy: item.runningPolicy,
//             previousPolicies: item.previousPolicies,
//             previousPolicy: item.previousPolicy,
//             documents: item.documents,
  
//             category: vehicleOnly,
//             roleDisplay: roleDisplays.join(" | "),
//             hasVehicleRecords: true,
//           };
  
//           allVehicleRecords.push(vehicleRecord);
//         }
//       }
  
//       console.log(`✅ Total vehicle records found: ${allVehicleRecords.length}`);
  
//       res.status(200).json({
//         message: "Vehicle Insurance consumer get success",
//         data: allVehicleRecords,
//         status: true,
//       });
//     } catch (error) {
//       console.error("❌ Error in getVehicleUserRenewalData:", error);
//       res.status(500).json({
//         message: "Server error while fetching Vehicle Insurance users",
//         error: error.message,
//         status: false,
//       });
//     }
//   };
  


exports.getVehicleUserRenewalData = async (req, res) => {
    try {
      const { startDate, endDate } = req.body;
      const { Op } = require("sequelize");
  
      let dateFilter = {};
      if (startDate && endDate) {
        dateFilter.createdAt = {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        };
      }
  
      const users = await User.findAll({
        order: [["username", "asc"]],
        where: {
          role_id: [3, 5],
          ...dateFilter,
        },
        attributes: [
          "user_id",
          "username",
          "email",
          "mobileNumber",
          "referenceName",
          "role_id",
          "builder_user",
          "created_by",
          "updated_by",
          "is_from_builder_user",
          "createdAt",
          "updatedAt",
        ],
        include: [
          {
            model: db.role,
            attributes: ["role_name"],
            as: "role",
          },
        ],
      });
  
      const allVehicleRecords = [];
  
      for (const user of users) {
        const crList = await consumerRoleMapping.findAll({
          where: { user_consumer_id: user.user_id },
          include: [
            {
              model: User,
              as: "userRoles",
              attributes: ["username", "email"],
            },
            {
              model: db.category,
              as: "category",
              attributes: ["category_name"],
            },
          ],
          raw: true,
        });
  
        const vehicleOnly = crList.filter(
          (m) => m["category.category_name"] === "Vehicle Insurance"
        );
  
        if (vehicleOnly.length === 0) {
          // Include users with no Vehicle records but valid consumer entry
          allVehicleRecords.push({
            ...user.toJSON(),
            category: [],
            roleDisplay: "No Vehicle Insurance Category",
            hasVehicleRecords: false,
          });
          continue;
        }
  
        const roleDisplays = vehicleOnly.map((m) => {
          const cat = m["category.category_name"] || "N/A";
          const roleUser = m["userRoles.username"] || "N/A";
          return `Vertical = ${cat} : Role User : ${roleUser}`;
        });
  
        // ✅ Updated vehicleUser query with agent fields
        const vehicleRecords = await vehicleUser.findAll({
          where: { user_id: user.user_id },
          attributes: [
            "vehicle_user_id",
            "vehicle_number",
            "make",
            "model",
            "manufacturing_year",
            "engine_number",
            "chassis_number",
            "vehicle_type",
            "company_name",
            "contact_person_name",
            "contact_person_no",
            "vehicle_policy_type",
            "nominee_type",
            "reference_id",
            "remark",
            "vendor",
            "policy_plan_type",
            "agentName",
            "agentCode",
            "agentContactNumber", // ✅ Added here
            "createdAt",
            "updatedAt",
          ],
          include: [
            {
              model: references,
              as: "reference",
              attributes: ["reference_id", "reference_name"],
            },
            {
              model: vehcileRunningPolicy,
              as: "runningPolicy",
              required: false,
              attributes: [
                "id",
                "PolicyNumber",
                "PolicyTenure",
                "PremiumAmount",
                "PolicyFrom",
                "PolicyTo",
                "NCB",
                "IDV",
                "PolicyIssuedDate",
                "ExpiryDate",
                "policy_type_id",
                "policy_plan_id",
                "Vendor",
                "NomineeName",
                "NomineeRelation",
                "NomineeDob",
                "NomineeAge",
                "CurrentPolicyFile",
                "agentName",
                "agentCode",
                "agentContactNumber", // ✅ Added here too
              ],
              include: [
                { model: companyType, as: "CompanyType" },
                {
                  model: db.policyPlan,
                  as: "policyPlan",
                  attributes: [["policy_name", "PolicyPlanType"]],
                },
              ],
            },
            {
              model: vehiclePreviousPolicy,
              as: "previousPolicies",
              where: { status: "active" },
              required: false,
              attributes: [
                "id",
                "vehicle_user_id",
                "PolicyNumber",
                "policy_type_id",
                "policy_plan_id",
                "company_id",
                "PolicyTenure",
                "PremiumAmount",
                "NomineeName",
                "NomineeRelation",
                "PolicyFrom",
                "PolicyTo",
                "PolicyIssuedDate",
                "ExpiryDate",
                "NomineeDob",
                "Vendor",
                "IDV",
                "isNomineeFlag",
                "claim",
                "NCB",
                "NomineeAge",
                "CurrentPolicyFile",
                "status",
                "agentName",
                "agentCode",
                "agentContactNumber", // ✅ Already here
              ],
              include: [
                { model: companyType, as: "CompanyType" },
                {
                  model: db.policyPlan,
                  as: "policyPlan",
                  attributes: [["policy_name", "PolicyPlanType"]],
                },
              ],
            },
            {
              model: vehicle_document,
              as: "documents",
              required: false,
              attributes: ["id", "categoryId", "file"],
            },
          ],
        });
  
        if (vehicleRecords.length === 0) {
          allVehicleRecords.push({
            ...user.toJSON(),
            category: vehicleOnly,
            roleDisplay: roleDisplays.join(" | "),
            hasVehicleRecords: false,
          });
          continue;
        }
  
        for (const vr of vehicleRecords) {
          const item = vr.get({ plain: true });
  
          if (item.previousPolicies?.length > 0) {
            item.previousPolicy = item.previousPolicies[0];
          }
  
          if (item.runningPolicy?.policyPlan) {
            item.runningPolicy.PolicyPlanType =
              item.runningPolicy.policyPlan.PolicyPlanType;
            delete item.runningPolicy.policyPlan;
          }
  
          // ✅ Include agent details in final response object
          const vehicleRecord = {
            user_id: user.user_id,
            username: user.username,
            email: user.email,
            mobileNumber: user.mobileNumber,
            referenceName: user.referenceName,
            role_id: user.role_id,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
  
            vehicle_user_id: item.vehicle_user_id || item.id,
            vehicle_number: item.vehicle_number,
            make: item.make,
            model: item.model,
            manufacturing_year: item.manufacturing_year,
            engine_number: item.engine_number,
            chassis_number: item.chassis_number,
            vehicle_type: item.vehicle_type,
            company_name: item.company_name,
            contact_person_name: item.contact_person_name,
            contact_person_no: item.contact_person_no,
            vehicle_policy_type: item.vehicle_policy_type,
            nominee_type: item.nominee_type,
  
            agentName: item.agentName || "",
            agentCode: item.agentCode || "",
            agentContactNumber: item.agentContactNumber || "", // ✅
  
            reference_id: item.reference_id,
            reference: item.reference,
  
            runningPolicy: item.runningPolicy,
            previousPolicies: item.previousPolicies,
            previousPolicy: item.previousPolicy,
            documents: item.documents,
  
            category: vehicleOnly,
            roleDisplay: roleDisplays.join(" | "),
            hasVehicleRecords: true,
          };
  
          allVehicleRecords.push(vehicleRecord);
        }
      }
  
      console.log(`✅ Total vehicle records found: ${allVehicleRecords.length}`);
  
      res.status(200).json({
        message: "Vehicle Insurance consumer get success",
        data: allVehicleRecords,
        status: true,
      });
    } catch (error) {
      console.error("❌ Error in getVehicleUserRenewalData:", error);
      res.status(500).json({
        message: "Server error while fetching Vehicle Insurance users",
        error: error.message,
        status: false,
      });
    }
  };
  

exports.updateVehicleUserRemarkData = async (req, res) => {
    console.log('🔧 updateVehicleUserRemarkData called with:', {
        body: req.body,
        params: req.params,
        user: req.user
    });

    if (!req?.body?.remark) {
        console.log('❌ No remark found in request body');
        return res.status(400).json({ error: 'Remark not found in request body' });
    }

    if (!req.params.vehicle_user_id) {
        console.log('❌ Vehicle user ID not provided');
        return res.status(400).json({ error: 'Vehicle user ID not provided' });
    }

    // Add validation for remark length
    if (req.body.remark.length > 1000) {
        console.log('❌ Remark too long:', req.body.remark.length);
        return res.status(400).json({ error: 'Remark is too long. Maximum length is 1000 characters.' });
    }

    try {
        console.log('🔧 Finding vehicle user with ID:', req.params.vehicle_user_id);
        const user = await vehicleUser.findByPk(req.params.vehicle_user_id);

        if (!user) {
            console.log('❌ Vehicle not found with ID:', req.params.vehicle_user_id);
            return res.status(404).json({ error: "Vehicle not found" });
        }
        
        console.log('🔧 Updating remark:', req.body.remark);
        await user.update({
            remark: req.body.remark
        });
        
        console.log('✅ Vehicle remark updated successfully');
        return res.status(200).send({
            message: "Vehicle remark successfully updated!",
            status: true,
            userData: user,
        });

    } catch (error) {
        console.error("❌ Error updating vehicle remark:", error);
        if (error.name === 'SequelizeValidationError') {
            // Validation error occurred
            const errors = error.errors.map(err => err.message);
            return res.status(400).json({ errors });
        } else {
            return res.status(500).json({ error: error.message });
        }
    }
};

// Get Vehicle Renewal Statistics
exports.getVehicleRenewalStats = async (req, res) => {
    try {
        console.log('📊 getVehicleRenewalStats: Fetching statistics');

        // Fetch all vehicle data with running policies
        const vehicleData = await vehicleUser.findAll({
            include: [
                {
                    model: vehcileRunningPolicy,
                    as: 'runningPolicy',
                    required: false,
                    attributes: [
                        "id",
                        "ExpiryDate",
                        "PolicyNumber"
                    ]
                }
            ]
        });

        console.log('📊 getVehicleRenewalStats: Total vehicle records:', vehicleData.length);

        // Calculate statistics
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Set to start of today
        const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const oneMonthFromNow = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
        const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

        let expiredCount = 0;
        let totalPolicies = vehicleData.length; // Count all policies
        let weekCount = 0;
        let monthCount = 0;
        let yearCount = 0;

        vehicleData.forEach(vehicle => {
            const item = vehicle.get({ plain: true });
            const runningPolicy = item.runningPolicy;
            const expiryDateStr = runningPolicy?.ExpiryDate;

            // Only process policies with expiry dates for other counts
            if (expiryDateStr) {

                // Parse expiry date - handle multiple formats
                const parseDate = (dateStr) => {
                    if (!dateStr) return null;
                    
                    // Try DD/MM/YYYY format
                    const parts = dateStr.split('/');
                    if (parts.length === 3) {
                        const day = parseInt(parts[0], 10);
                        const month = parseInt(parts[1], 10) - 1;
                        const year = parseInt(parts[2], 10);
                        if (!isNaN(day) && !isNaN(month) && !isNaN(year) && year > 1900 && year < 2100) {
                            return new Date(year, month, day);
                        }
                    }
                    
                    // Try standard date parsing
                    const dateObj = new Date(dateStr);
                    return isNaN(dateObj.getTime()) ? null : dateObj;
                };

                const expiryDate = parseDate(expiryDateStr);

                if (expiryDate) {
                    // Check if expired (before today)
                    if (expiryDate < now) {
                        expiredCount++;
                    }
                    // Count renewals by time period (only future expirations)
                    else if (expiryDate >= now && expiryDate <= oneWeekFromNow) {
                        weekCount++;
                    }
                    if (expiryDate >= now && expiryDate <= oneMonthFromNow) {
                        monthCount++;
                    }
                    if (expiryDate >= now && expiryDate <= oneYearFromNow) {
                        yearCount++;
                    }
                }
            }
        });

        const stats = {
            expiredCount,
            totalPolicies,
            weekCount,
            monthCount,
            yearCount
        };

        console.log('📊 getVehicleRenewalStats: Statistics calculated:', stats);

        return res.status(200).send({
            success: true,
            message: "Vehicle renewal statistics retrieved successfully.",
            data: stats
        });

    } catch (error) {
        console.error("💥 Error fetching vehicle renewal statistics:", error);
        return res.status(500).send({ 
            success: false, 
            message: "Internal server error.",
            error: error.message 
        });
    }
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



exports.getVehicleRenewalSheet = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        if (!startDate || !endDate) {
            return res.status(400).send({ success: false, message: "Please provide both start and end dates." });
        }
        
        const vehicleData = await vehicleUser.findAll({
            include: [
                { model: User, as: "user_pk_vehicle_id" },
                { model: references, as: 'reference' },
                { model: vehicles, as: 'vehicle' },
                {
                    model: vehcileRunningPolicy,
                    as: 'runningPolicy',
                    required: true,
                    where: {
                        ExpiryDate: { [Op.between]: [new Date(startDate), new Date(endDate)] }
                    },
                    include: [
                        { model: companyType, as: 'CompanyType' },
                        {
                            model: db.policyPlan,
                            as: 'policyPlan',
                            attributes: [['policy_name', 'PolicyPlanType']]
                        }
                    ]
                },
                { 
                    model: vehiclePreviousPolicy, 
                    as: 'previousPolicies', 
                    include: [
                        { model: companyType, as: 'CompanyType' },
                        { model: db.policyPlan, as: 'policyPlan', attributes: [['policy_name', 'PolicyPlanType']] }
                    ] 
                }
            ]
        });

        if (!vehicleData.length) {
            return res.status(200).send({ success: false, message: "No vehicle renewal data found for the selected dates." });
        }
        const plainVehicleData = vehicleData.map(d => {
            const item = d.get({ plain: true });
            // Add backwards compatibility for previousPolicy
            if (item.previousPolicies && Array.isArray(item.previousPolicies) && item.previousPolicies.length > 0) {
                item.previousPolicy = item.previousPolicies[0];
            }
            return item;
        });
        return res.status(200).send({ success: true, message: "Vehicle renewal data retrieved successfully.", data: plainVehicleData });
    } catch (error) {
        console.error("Error fetching vehicle renewal data:", error);
        return res.status(500).send({ success: false, message: "Internal server error." });
    }
};

module.exports.getVehicleRenewalSheet = exports.getVehicleRenewalSheet;
// The above line is just to ensure export. I will combine them next.

// TEMPORARY DEBUG ENDPOINT: List all vehicle users with their status
exports.listAllVehicleUsersDebug = async (req, res) => {
    try {
        const allVehicleUsers = await vehicleUser.findAll({
            attributes: [
                'vehicle_user_id',
                'user_id',
                'status',
                'createdAt',
                'updatedAt'
            ],
            order: [['vehicle_user_id', 'DESC']]
        });
        res.status(200).send({
            message: 'All vehicle users (debug)',
            data: allVehicleUsers,
            status: true
        });
    } catch (error) {
        res.status(500).send({ message: 'Error fetching vehicle users', error });
    }
};

exports.getVehicleUserById = async (req, res) => {
    console.log('🔍 [getVehicleUserById] Function called!');
    console.log('🔍 [getVehicleUserById] Request params:', req.params);
    console.log('🔍 [getVehicleUserById] Request headers:', req.headers);
    console.log('🔍 [getVehicleUserById] Request method:', req.method);
    console.log('🔍 [getVehicleUserById] Request URL:', req.url);
    
    try {
        const vehicle = await vehicleUser.findOne({
            where: { vehicle_user_id: req.params.vehicle_user_id },
            attributes: [
                'vehicle_user_id',
                'vehicle_policy_type',
                'nominee_type',
                'company_name',
                'user_id',
                'contact_person_name',
                'remark',
                'contact_person_no',
                'vehicle_number',
                'vehicle_id',
                'reference_id',
                'make',
                'model',
                'manufacturing_year',
                'engine_number',
                'chassis_number',
                'consumer_role_id',
                'agentName',
                'agentCode',
                'agentContactNumber',
                'status',
                'vehicle_type',
                'vendor',
                'policy_plan_type',
                'createdAt',
                'updatedAt'
            ],
            include: [
                { 
                    model: User, 
                    as: "user_pk_vehicle_id",
                    attributes: ['user_id', 'username', 'email', 'mobileNumber', 'referenceName']
                },
                { model: references, as: 'reference' },
                { model: vehcileRunningPolicy, as: "runningPolicy" },
                { model: vehiclePreviousPolicy, as: "previousPolicies" }
            ]
        });
        if (!vehicle) {
            return res.status(404).json({ message: "Vehicle user not found" });
        }
        
        // Fetch vehicle documents with comprehensive debugging
        console.log('🔍 [getVehicleUserById] Fetching documents for vehicle_user_id:', req.params.vehicle_user_id);
        
        // First, let's check if there are ANY documents in the vehicle_documents table
        const totalDocumentsCount = await vehicle_document.count();
        console.log('🔍 [getVehicleUserById] Total documents in vehicle_documents table:', totalDocumentsCount);
        
        // Check if there are documents for this specific vehicle_user_id
        const documentsForThisVehicle = await vehicle_document.count({ 
            where: { vehicle_user_id: req.params.vehicle_user_id } 
        });
        console.log('🔍 [getVehicleUserById] Documents count for this vehicle_user_id:', documentsForThisVehicle);
        
        const vehicleDocuments = await vehicle_document.findAll({ 
            where: { vehicle_user_id: req.params.vehicle_user_id } 
        });
        
        console.log('🔍 [getVehicleUserById] Raw vehicle_document query result:', vehicleDocuments);
        console.log('🔍 [getVehicleUserById] Number of documents found:', vehicleDocuments.length);
        
        // Log each document individually
        vehicleDocuments.forEach((doc, index) => {
            console.log(`🔍 [getVehicleUserById] Document ${index + 1}:`, {
                id: doc.id,
                user_id: doc.user_id,
                vehicle_user_id: doc.vehicle_user_id,
                categoryId: doc.categoryId,
                file: doc.file,
                createdAt: doc.createdAt,
                updatedAt: doc.updatedAt
            });
        });
        
                 // Add documents to the vehicle data
                 const vehicleData = vehicle.toJSON();
                 vehicleData.documents = vehicleDocuments;
        
        // Debug logging to see what data is being fetched
        console.log('🔍 [getVehicleUserById] Final vehicle data structure:', {
            vehicle_user_id: vehicleData.vehicle_user_id,
            documents_count: vehicleData.documents.length,
            documents: vehicleData.documents
        });
        console.log('🔍 [getVehicleUserById] Agent fields:', {
            agentName: vehicle.agentName,
            agentCode: vehicle.agentCode,
            agentContactNumber: vehicle.agentContactNumber
        });
        
        res.status(200).json({ status: true, data: vehicleData });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
};

// ==================== LIFE INSURANCE FUNCTIONS ====================

// Basic payload validation for Life Insurance
function validateLifeInsurancePayload(body) {
    const errors = [];
    const requiredString = (val) => typeof val === 'string' && val.trim().length > 0;
    const requiredNumber = (val) => val !== undefined && val !== null && !isNaN(Number(val));

    // Proposer
    if (!requiredString(body.proposer_name)) errors.push('proposer_name is required');
    if (!requiredString(body.proposer_gender)) errors.push('proposer_gender is required');
    if (!body.proposer_dob) errors.push('proposer_dob is required');
    if (!requiredString(body.proposer_married_status)) errors.push('proposer_married_status is required');
    if (!requiredString(body.proposer_mailing_address)) errors.push('proposer_mailing_address is required');
    if (!requiredString(body.proposer_permanent_address)) errors.push('proposer_permanent_address is required');

    // Life assured
    if (!requiredString(body.life_assured_name)) errors.push('life_assured_name is required');
    if (!requiredString(body.life_assured_gender)) errors.push('life_assured_gender is required');
    if (!body.life_assured_dob) errors.push('life_assured_dob is required');
    if (!requiredString(body.life_assured_married_status)) errors.push('life_assured_married_status is required');

    // Product
    if (!requiredString(body.product_name)) errors.push('product_name is required');
    if (!requiredNumber(body.premium_payment_term)) errors.push('premium_payment_term is required');
    if (!requiredNumber(body.sum_assured)) errors.push('sum_assured is required');
    if (!requiredNumber(body.policy_term)) errors.push('policy_term is required');

    // Premium
    if (!requiredNumber(body.premium_amount)) errors.push('premium_amount is required');
    if (!requiredString(body.premium_payment_mode)) errors.push('premium_payment_mode is required');

    return errors;
}

// Helper function to save document
const saveDocument = async (lifeInsuranceId, fieldName, file, uploadDir, userId) => {
    try {
        // Generate unique filename
        const fileExtension = path.extname(file.name);
        const uniqueFilename = `${Date.now()}_${Math.random().toString(36).substring(7)}${fileExtension}`;
        const filePath = path.join(uploadDir, uniqueFilename);
        
        // Move file to upload directory
        await file.mv(filePath);
        
        // Map field names to document types
        const documentTypeMap = {
            'policy_document': 'Policy Document',
            'identity_document': 'Identity Document',
            'address_proof': 'Address Proof',
            'medical_certificate': 'Medical Certificate',
            'other_documents': 'Other Document'
        };
        
        // Create document record in database
        const documentData = {
            life_insurance_id: lifeInsuranceId,
            document_name: documentTypeMap[fieldName] || 'Document',
            document_type: fieldName,
            file_path: filePath,
            original_filename: file.name,
            file_size: file.size,
            mime_type: file.mimetype,
            upload_status: 'Uploaded',
            uploaded_by: userId
        };
        
        const document = await LifeInsuranceDocument.create(documentData);
        return document;
    } catch (error) {
        console.error('Error saving document:', error);
        return null;
    }
};


// Create Life Insurance Policy
exports.createLifeInsurance = async (req, res) => {
    try {
        console.log('🔍 [CREATE] Request body:', req.body);
        console.log('🔍 [CREATE] Request body keys:', Object.keys(req.body || {}));
        const errors = validateLifeInsurancePayload(req.body || {});
        if (errors.length) {
            console.log('🔍 [CREATE] Validation errors:', errors);
            return res.status(400).json({ status: false, message: 'Validation failed', errors });
        }

        // Process FormData to handle arrays properly
        const processedData = { ...req.body };
        
        
        // Handle mobile numbers as single strings
        ['proposer_mobile_numbers', 'life_assured_mobile_numbers', 'nominee_mobile_numbers'].forEach(field => {
            if (processedData[field]) {
                // If it's an array, take the first non-empty value
                if (Array.isArray(processedData[field])) {
                    const validMobile = processedData[field].find(mobile => mobile && mobile.trim());
                    processedData[field] = validMobile || '';
                }
                // If it's a string, just trim it
                else if (typeof processedData[field] === 'string') {
                    processedData[field] = processedData[field].trim();
                }
            } else {
                // Extract single value from FormData
                let index = 0;
                while (processedData[`${field}[${index}]`]) {
                    const value = processedData[`${field}[${index}]`];
                    if (value && value.trim()) {
                        processedData[field] = value.trim();
                        break; // Take only the first valid value
                    }
                    delete processedData[`${field}[${index}]`];
                    index++;
                }
                if (!processedData[field]) {
                    processedData[field] = '';
                }
            }
        });
        
        // Handle integer fields - convert empty strings to null
        ['tobacco_days', 'alcohol_days', 'narcotics_days', 'tobacco_quantity', 'alcohol_quantity', 'narcotics_quantity'].forEach(field => {
            console.log(`🔍 [CREATE] Processing ${field}:`, {
                original: req.body[field],
                type: typeof req.body[field],
                processed: processedData[field],
                processedType: typeof processedData[field]
            });
            
            if (processedData[field] === '' || processedData[field] === undefined) {
                processedData[field] = null;
            } else if (typeof processedData[field] === 'string' && processedData[field].trim() === '') {
                processedData[field] = null;
            } else if (typeof processedData[field] === 'string') {
                // Convert string to number
                const numValue = parseInt(processedData[field], 10);
                processedData[field] = isNaN(numValue) ? null : numValue;
            } else if (typeof processedData[field] === 'number') {
                // Keep numeric values as is (including 0)
                processedData[field] = processedData[field];
            }
            
            console.log(`🔍 [CREATE] After processing ${field}:`, processedData[field]);
        });

        // Handle string fields - convert empty strings to null and trim whitespace
        const stringFields = [
            'life_assured_father_name', 'life_assured_mother_name', 'life_assured_spouse_name',
            'proposer_residential_status', 'life_assured_residential_status',
            'nominee_relationship_with_life_assured', 'policy_numbers', 'user_consumer_id',
            'proposer_gender_custom', 'life_assured_gender_custom',
            'tobacco_consumption', 'alcohol_consumption', 'narcotics_consumption'
        ];
        
        stringFields.forEach(field => {
            if (processedData[field] === '' || processedData[field] === undefined) {
                processedData[field] = null;
            } else if (typeof processedData[field] === 'string') {
                processedData[field] = processedData[field].trim();
                if (processedData[field] === '') {
                    processedData[field] = null;
                }
            }
        });

        // Generate policy_numbers if not provided
        if (!processedData.policy_numbers) {
            processedData.policy_numbers = `POL${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }

        // Debug: Log specific fields that are causing issues
        console.log('🔍 [CREATE] Problem fields before processing:', {
            policy_numbers: processedData.policy_numbers,
            life_assured_father_name: processedData.life_assured_father_name,
            life_assured_mother_name: processedData.life_assured_mother_name,
            life_assured_spouse_name: processedData.life_assured_spouse_name,
            tobacco_days: processedData.tobacco_days,
            alcohol_days: processedData.alcohol_days,
            narcotics_days: processedData.narcotics_days,
            user_consumer_id: processedData.user_consumer_id
        });

        const lifeInsuranceData = {
            ...processedData,
            user_id: req.user.id,
            user_consumer_id: req.user.id, // Automatically set to current user's ID
            created_by: req.user.id,
            status: 'Draft'
        };

        // Handle optional foreign key fields - set to null if empty or invalid
        const optionalForeignKeyFields = ['updated_by'];
        optionalForeignKeyFields.forEach(field => {
            if (!lifeInsuranceData[field] || lifeInsuranceData[field] === '') {
                lifeInsuranceData[field] = null;
            }
        });

        // Generate unique proposer number if not provided or if it already exists
        if (!lifeInsuranceData.proposer_number) {
            const timestamp = Date.now();
            lifeInsuranceData.proposer_number = `LI${timestamp}`;
        } else {
            // Check if proposer_number already exists
            const existingPolicy = await LifeInsurance.findOne({
                where: { proposer_number: lifeInsuranceData.proposer_number }
            });
            if (existingPolicy) {
            const timestamp = Date.now();
            lifeInsuranceData.proposer_number = `LI${timestamp}`;
            }
        }

        console.log('🔍 [CREATE] Creating life insurance with data:', lifeInsuranceData);
        const lifeInsurance = await LifeInsurance.create(lifeInsuranceData);
        console.log('🔍 [CREATE] Life insurance created successfully:', lifeInsurance.id);
        
        // Create ConsumerRoleMapping for life insurance category
        // Use the current logged-in user as the role user (vertical assignment)
        await consumerRoleMapping.create({
            user_role_id: req.user.id, // Current logged-in user becomes the role user (vertical)
            user_consumer_id: req.user.id, // Use the current user as consumer
            category_id: 5, // life insurance category
        });
        console.log('🔍 [CREATE] ConsumerRoleMapping created for life insurance category');
        
        // Handle document uploads
        const uploadedDocuments = [];
        
        if (req.files && Object.keys(req.files).length > 0) {
            const uploadDir = path.join(__dirname, '../uploads/life-insurance');
            
            // Create upload directory if it doesn't exist
            if (!fsSync.existsSync(uploadDir)) {
                fsSync.mkdirSync(uploadDir, { recursive: true });
            }
            
            
            // Process each uploaded file
            for (const [fieldName, file] of Object.entries(req.files)) {
                
                try {
                    if (Array.isArray(file)) {
                        // Handle multiple files (other_documents)
                        for (const singleFile of file) {
                            const documentData = await saveDocument(lifeInsurance.id, fieldName, singleFile, uploadDir, req.user.id);
                            if (documentData) {
                                uploadedDocuments.push(documentData);
                            } else {
                            }
                        }
                    } else {
                        // Handle single file
                        const documentData = await saveDocument(lifeInsurance.id, fieldName, file, uploadDir, req.user.id);
                        if (documentData) {
                            uploadedDocuments.push(documentData);
                        } else {
                        }
                    }
                } catch (error) {
                    console.error(`Error processing file ${fieldName}:`, error);
                }
            }
        } else {
            console.log('No files received in request');
        }
        
        console.log('Total documents uploaded:', uploadedDocuments.length);
        
        res.status(201).json({
            status: true,
            message: 'Life insurance policy created successfully',
            data: {
                ...lifeInsurance.toJSON(),
                documents: uploadedDocuments
            }
        });
    } catch (error) {
        console.error('❌ [CREATE] Error creating life insurance:', error);
        console.error('❌ [CREATE] Error details:', {
            name: error.name,
            message: error.message,
            errors: error.errors
        });
        
        if (error.name === 'SequelizeValidationError') {
            const validationErrors = error.errors.map(err => ({
                field: err.path,
                message: err.message,
                value: err.value
            }));
            return res.status(400).json({
                status: false,
                message: 'Validation error',
                errors: validationErrors
            });
        }
        
        if (error.name === 'SequelizeUniqueConstraintError') {
            const uniqueErrors = error.errors.map(err => ({
                field: err.path,
                message: err.message,
                value: err.value
            }));
            return res.status(400).json({
                status: false,
                message: 'Duplicate entry error',
                errors: uniqueErrors
            });
        }
        
        res.status(500).json({
            status: false,
            message: 'Error creating life insurance policy',
            error: error.message
        });
    }
};

// Get All Life Insurance Policies
exports.getAllLifeInsurance = async (req, res) => {
    try {
        // Set cache control headers to prevent 304 responses
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        
        console.log('🔍 [LIFE INSURANCE API] User making request:', req.user);
        console.log('🔍 [LIFE INSURANCE API] User Role:', req.user.Role);
        console.log('🔍 [LIFE INSURANCE API] User ID:', req.user.id);
        console.log('🔍 [LIFE INSURANCE API] User categoryIds:', req.user.categoryIds);
        
        const { page = 1, limit = 10, status, user_id } = req.query;
        const offset = (page - 1) * limit;

        // Show all life insurance data for Super Admin OR users with life insurance category access
        if (req.user.Role == 1 || req.user.categoryIds?.includes(5)) {
            // ADMIN ROLE OR LIFE INSURANCE CATEGORY ACCESS - Fetch all life insurance data
        const { count, rows } = await LifeInsurance.findAndCountAll({
                where: {},
            include: [
                {
                    model: User,
                    as: 'policyHolder',
                        attributes: ['user_id', 'username', 'email', 'mobileNumber'],
                        required: false
                },
                {
                    model: User,
                    as: 'createdByUser',
                        attributes: ['user_id', 'username', 'email'],
                        required: false
                    }
                ],
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: [['createdAt', 'DESC']]
            });

            res.status(200).json({
                status: true,
                data: rows,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(count / limit)
                }
            });
        } else {
            // USER ROLE WITHOUT LIFE INSURANCE CATEGORY ACCESS - Fetch life insurance data for assigned consumers only
            let whereObj = {};
            let findUserList = await consumerRoleMapping.findAll({
                where: {
                    user_role_id: req.user.id,
                    category_id: 5 // Life insurance category
                },
                raw: true,
                attributes: ["user_consumer_id"],
            });

            let userList = [];
            findUserList.map((item) => {
                userList.push(item.user_consumer_id);
            });

            if (userList.length > 0) {
                whereObj.user_id = {
                    [Op.in]: userList,
                };
            } else {
                // If no consumers assigned, return empty result
                return res.status(200).json({
                    status: true,
                    data: [],
                    pagination: {
                        total: 0,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        pages: 0
                    }
                });
            }

            // Add status filter if provided
            if (status) whereObj.status = status;
            if (user_id) whereObj.user_id = user_id;

        const { count, rows } = await LifeInsurance.findAndCountAll({
                where: whereObj,
                    include: [
                        {
                            model: User,
                    as: 'policyHolder',
                    attributes: ['user_id', 'username', 'email', 'mobileNumber'],
                    required: false
                },
                {
                    model: User,
                    as: 'createdByUser',
                    attributes: ['user_id', 'username', 'email'],
                    required: false
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            status: true,
            data: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count / limit)
            }
        });
        }
    } catch (error) {
        console.error('Error fetching life insurance policies:', error);
        res.status(500).json({
            status: false,
            message: 'Error fetching life insurance policies',
            error: error.message
        });
    }
};

// Get Life Insurance Policy by ID
exports.getLifeInsuranceById = async (req, res) => {
    try {
        const { id } = req.params;

        const lifeInsurance = await LifeInsurance.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'policyHolder',
                    attributes: ['user_id', 'username', 'email', 'mobileNumber']
                },
                {
                    model: User,
                    as: 'createdByUser',
                    attributes: ['user_id', 'username', 'email']
                },
                {
                    model: User,
                    as: 'updatedByUser',
                    attributes: ['user_id', 'username', 'email']
                },
                {
                    model: consumerRoleMapping,
                    as: 'consumerMapping',
                    include: [
                        {
                            model: User,
                            as: 'userConsumers',
                            attributes: ['user_id', 'username', 'email', 'mobileNumber']
                        }
                    ]
                },
                {
                    model: LifeInsuranceDocument,
                    as: 'documents',
                    include: [
                        {
                            model: User,
                            as: 'uploadedByUser',
                            attributes: ['user_id', 'username']
                        }
                    ]
                }
            ]
        });

        if (!lifeInsurance) {
            return res.status(404).json({
                status: false,
                message: 'Life insurance policy not found'
            });
        }

        res.status(200).json({
            status: true,
            data: lifeInsurance
        });
    } catch (error) {
        console.error('Error fetching life insurance policy:', error);
        res.status(500).json({
            status: false,
            message: 'Error fetching life insurance policy',
            error: error.message
        });
    }
};

// Update Life Insurance Policy
exports.updateLifeInsurance = async (req, res) => {
    try {
        const { id } = req.params;
        const errors = validateLifeInsurancePayload(req.body || {});
        if (errors.length) {
            return res.status(400).json({ status: false, message: 'Validation failed', errors });
        }

        // Process mobile number arrays similar to createLifeInsurance
        const processedData = { ...req.body };
        
        // Debug: Log incoming data
        console.log('🔍 [UPDATE] Raw req.body mobile numbers:', {
            proposer: req.body.proposer_mobile_numbers,
            life_assured: req.body.life_assured_mobile_numbers,
            nominee: req.body.nominee_mobile_numbers
        });
        
        // Debug: Log raw problem fields from frontend
        console.log('🔍 [UPDATE] Raw problem fields from frontend:', {
            policy_numbers: req.body.policy_numbers,
            life_assured_father_name: req.body.life_assured_father_name,
            life_assured_mother_name: req.body.life_assured_mother_name,
            life_assured_spouse_name: req.body.life_assured_spouse_name,
            tobacco_days: req.body.tobacco_days,
            alcohol_days: req.body.alcohol_days,
            narcotics_days: req.body.narcotics_days,
            user_consumer_id: req.body.user_consumer_id
        });
        
        // Handle mobile numbers as single strings
        ['proposer_mobile_numbers', 'life_assured_mobile_numbers', 'nominee_mobile_numbers'].forEach(field => {
            if (processedData[field]) {
                // If it's an array, take the first non-empty value
                if (Array.isArray(processedData[field])) {
                    const validMobile = processedData[field].find(mobile => mobile && mobile.trim());
                    processedData[field] = validMobile || '';
                }
                // If it's a string, just trim it
                else if (typeof processedData[field] === 'string') {
                    processedData[field] = processedData[field].trim();
                }
            } else {
                processedData[field] = '';
            }
        });
        
        // Debug: Log processed data
        console.log('🔍 [UPDATE] Processed mobile numbers:', {
            proposer: processedData.proposer_mobile_numbers,
            life_assured: processedData.life_assured_mobile_numbers,
            nominee: processedData.nominee_mobile_numbers
        });

        // Handle integer fields - convert empty strings to null
        ['tobacco_days', 'alcohol_days', 'narcotics_days', 'tobacco_quantity', 'alcohol_quantity', 'narcotics_quantity'].forEach(field => {
            console.log(`🔍 [UPDATE] Processing ${field}:`, {
                original: req.body[field],
                type: typeof req.body[field],
                processed: processedData[field],
                processedType: typeof processedData[field]
            });
            
            if (processedData[field] === '' || processedData[field] === undefined) {
                processedData[field] = null;
            } else if (typeof processedData[field] === 'string' && processedData[field].trim() === '') {
                processedData[field] = null;
            } else if (typeof processedData[field] === 'string') {
                // Convert string to number
                const numValue = parseInt(processedData[field], 10);
                processedData[field] = isNaN(numValue) ? null : numValue;
            } else if (typeof processedData[field] === 'number') {
                // Keep numeric values as is (including 0)
                processedData[field] = processedData[field];
            }
            
            console.log(`🔍 [UPDATE] After processing ${field}:`, processedData[field]);
        });

        // Handle string fields - convert empty strings to null and trim whitespace
        const stringFields = [
            'life_assured_father_name', 'life_assured_mother_name', 'life_assured_spouse_name',
            'proposer_residential_status', 'life_assured_residential_status',
            'nominee_relationship_with_life_assured', 'policy_numbers', 'user_consumer_id',
            'proposer_gender_custom', 'life_assured_gender_custom',
            'tobacco_consumption', 'alcohol_consumption', 'narcotics_consumption'
        ];
        
        stringFields.forEach(field => {
            if (processedData[field] === '' || processedData[field] === undefined) {
                processedData[field] = null;
            } else if (typeof processedData[field] === 'string') {
                processedData[field] = processedData[field].trim();
                if (processedData[field] === '') {
                    processedData[field] = null;
                }
            }
        });

        // Generate policy_numbers if not provided
        if (!processedData.policy_numbers) {
            processedData.policy_numbers = `POL${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }

        // Debug: Log specific fields that are causing issues
        console.log('🔍 [UPDATE] Problem fields before processing:', {
            policy_numbers: processedData.policy_numbers,
            life_assured_father_name: processedData.life_assured_father_name,
            life_assured_mother_name: processedData.life_assured_mother_name,
            life_assured_spouse_name: processedData.life_assured_spouse_name,
            tobacco_days: processedData.tobacco_days,
            alcohol_days: processedData.alcohol_days,
            narcotics_days: processedData.narcotics_days,
            user_consumer_id: processedData.user_consumer_id
        });

        const updateData = {
            ...processedData,
            user_consumer_id: req.user.id, // Automatically set to current user's ID
            updated_by: req.user.id
        };

        const [updatedRowsCount] = await LifeInsurance.update(updateData, {
            where: { id: id }
        });

        if (updatedRowsCount === 0) {
            return res.status(404).json({
                status: false,
                message: 'Life insurance policy not found'
            });
        }

        // Ensure ConsumerRoleMapping exists for life insurance category
        const existingMapping = await consumerRoleMapping.findOne({
            where: {
                user_role_id: req.user.id,
                user_consumer_id: req.user.id,
                category_id: 5
            }
        });

        if (!existingMapping) {
            await consumerRoleMapping.create({
                user_role_id: req.user.id, // Current logged-in user becomes the role user (vertical)
                user_consumer_id: req.user.id, // Use the current user as consumer
                category_id: 5, // life insurance category
            });
            console.log('🔍 [UPDATE] ConsumerRoleMapping created for life insurance category');
        }

        const updatedLifeInsurance = await LifeInsurance.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'policyHolder',
                    attributes: ['user_id', 'username', 'email', 'mobileNumber']
                }
            ]
        });

        res.status(200).json({
            status: true,
            message: 'Life insurance policy updated successfully',
            data: updatedLifeInsurance
        });
    } catch (error) {
        console.error('Error updating life insurance policy:', error);
        res.status(500).json({
            status: false,
            message: 'Error updating life insurance policy',
            error: error.message
        });
    }
};

// Delete Life Insurance Policy
exports.deleteLifeInsurance = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedRowsCount = await LifeInsurance.destroy({
            where: { id: id }
        });

        if (deletedRowsCount === 0) {
            return res.status(404).json({
                status: false,
                message: 'Life insurance policy not found'
            });
        }

        res.status(200).json({
            status: true,
            message: 'Life insurance policy deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting life insurance policy:', error);
        res.status(500).json({
            status: false,
            message: 'Error deleting life insurance policy',
            error: error.message
        });
    }
};

// Upload Life Insurance Document
exports.uploadLifeInsuranceDocument = async (req, res) => {
    try {
        const { lifeInsuranceId } = req.params;
        const { documentName, documentType, remarks } = req.body;

        // Debug: Log JWT token and user info
        console.log('🔍 [UPLOAD] JWT Token received:', req.headers.token ? 'YES' : 'NO');
        console.log('🔍 [UPLOAD] User info:', req.user ? 'YES' : 'NO');
        if (req.user) {
            console.log('🔍 [UPLOAD] User ID:', req.user.id);
        }
        
        // Debug: Log request body to see what we're receiving
        console.log('🔍 [DEBUG] Request body:', req.body);
        console.log('🔍 [DEBUG] documentName type:', typeof documentName, 'value:', documentName);
        console.log('🔍 [DEBUG] remarks type:', typeof remarks, 'value:', remarks);

        if (!req.files || !req.files.document) {
            return res.status(400).json({
                status: false,
                message: 'No file uploaded'
            });
        }

        // Check if life insurance policy exists
        const lifeInsurance = await LifeInsurance.findByPk(lifeInsuranceId);
        if (!lifeInsurance) {
            return res.status(404).json({
                status: false,
                message: 'Life insurance policy not found'
            });
        }

        // Handle file upload - check if it's an array or single file
        let files = req.files.document;
        if (!Array.isArray(files)) {
            files = [files]; // Convert single file to array for consistent processing
        }
        
        const uploadsDir = path.join(__dirname, "../../uploads/life-insurance");
        
        // Ensure upload directory exists
        if (!fsSync.existsSync(uploadsDir)) {
            fsSync.mkdirSync(uploadsDir, { recursive: true });
        }

        // Process multiple documents
        const uploadedDocuments = [];
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // Debug: Log file object properties
            console.log(`🔍 [DEBUG] Processing file ${i + 1}/${files.length}:`, {
                name: file.name,
                size: file.size,
                mimetype: file.mimetype,
                tempFilePath: file.tempFilePath,
                hasMv: typeof file.mv === 'function',
                hasData: !!file.data
            });
            
            // Generate unique filename
            const uniqueName = `${Date.now()}-${i}-${file.name}`;
            const filePath = path.join(uploadsDir, uniqueName);
            
            // Handle file movement based on express-fileupload configuration
            if (file.tempFilePath) {
                // When useTempFiles: true, file is already saved to temp location
                console.log(`📁 [DEBUG] Using tempFilePath for file ${i + 1}:`, file.tempFilePath);
                await fs.copyFile(file.tempFilePath, filePath);
                // Clean up temp file
                await fs.unlink(file.tempFilePath);
            } else if (file.mv) {
                // When useTempFiles: false, use mv method
                console.log(`📁 [DEBUG] Using file.mv() for file ${i + 1}`);
                await file.mv(filePath);
            } else if (file.data) {
                // Fallback: write file data directly
                console.log(`📁 [DEBUG] Using file.data for file ${i + 1}`);
                await fs.writeFile(filePath, file.data);
            } else {
                throw new Error(`Unable to process file ${i + 1} - no valid file handling method found`);
            }

            // Get document details for this file
            const cleanDocumentName = Array.isArray(documentName) ? documentName[i] : documentName;
            const cleanRemarks = Array.isArray(remarks) ? remarks[i] : remarks;
            const cleanDocumentType = Array.isArray(documentType) ? documentType[i] : documentType;

            // Map document names to appropriate document types
            const getDocumentType = (docName) => {
                if (!docName) return 'Policy Document';
                
                const name = docName.toLowerCase();
                if (name.includes('policy')) return 'Policy Document';
                if (name.includes('identity') || name.includes('aadhar') || name.includes('pan')) return 'Identity Document';
                if (name.includes('address') || name.includes('utility')) return 'Address Proof';
                if (name.includes('medical') || name.includes('health')) return 'Medical Certificate';
                if (name.includes('bank') || name.includes('statement')) return 'Bank Statement';
                if (name.includes('income') || name.includes('salary')) return 'Income Proof';
                return 'Other Document';
            };

        const documentData = {
            life_insurance_id: lifeInsuranceId,
                document_name: cleanDocumentName || file.name,
                document_type: cleanDocumentType || getDocumentType(cleanDocumentName),
                file_path: filePath,
                original_filename: file.name,
                file_size: file.size,
                mime_type: file.mimetype,
            upload_status: 'Uploaded',
                remarks: cleanRemarks || '',
            uploaded_by: req.user.id
        };

        const document = await LifeInsuranceDocument.create(documentData);
            uploadedDocuments.push(document);
        }

        res.status(201).json({
            status: true,
            message: `${uploadedDocuments.length} document(s) uploaded successfully`,
            data: uploadedDocuments,
            count: uploadedDocuments.length
        });
    } catch (error) {
        console.error('Error uploading document:', error);
        res.status(500).json({
            status: false,
            message: 'Error uploading document',
            error: error.message
        });
    }
};

// Get Life Insurance Documents
exports.getLifeInsuranceDocuments = async (req, res) => {
    try {
        const { lifeInsuranceId } = req.params;

        const documents = await LifeInsuranceDocument.findAll({
            where: { life_insurance_id: lifeInsuranceId },
            include: [
                {
                    model: User,
                    as: 'uploadedByUser',
                    attributes: ['user_id', 'username']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            status: true,
            data: documents
        });
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({
            status: false,
            message: 'Error fetching documents',
            error: error.message
        });
    }
};

// Delete Life Insurance Document
exports.deleteLifeInsuranceDocument = async (req, res) => {
    try {
        const { documentId } = req.params;

        const document = await LifeInsuranceDocument.findByPk(documentId);
        if (!document) {
            return res.status(404).json({
                status: false,
                message: 'Document not found'
            });
        }

        // Delete file from filesystem
        if (fsSync.existsSync(document.file_path)) {
            fsSync.unlinkSync(document.file_path);
        }

        await LifeInsuranceDocument.destroy({
            where: { document_id: documentId }
        });

        res.status(200).json({
            status: true,
            message: 'Document deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({
            status: false,
            message: 'Error deleting document',
            error: error.message
        });
    }
};

// Update Life Insurance Status
exports.updateLifeInsuranceStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Active', 'Lapsed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                status: false,
                message: 'Invalid status'
            });
        }

        // Enforce simple status transition rules
        const policy = await LifeInsurance.findByPk(id, { attributes: ['id', 'status'] });
        if (!policy) {
            return res.status(404).json({ status: false, message: 'Life insurance policy not found' });
        }

        const currentStatus = policy.status;
        const allowedTransitions = {
            'Draft': ['Submitted', 'Deleted'],
            'Submitted': ['Under Review', 'Rejected'],
            'Under Review': ['Approved', 'Rejected'],
            'Approved': ['Active', 'Lapsed'],
            'Active': ['Lapsed'],
            'Rejected': [],
            'Lapsed': []
        };

        const allowedNext = allowedTransitions[currentStatus] || [];
        if (allowedNext.length && !allowedNext.includes(status)) {
            return res.status(400).json({
                status: false,
                message: `Invalid status transition from ${currentStatus} to ${status}`
            });
        }

        const [updatedRowsCount] = await LifeInsurance.update(
            { 
                status: status,
                updated_by: req.user.id
            },
            { where: { id: id } }
        );

        if (updatedRowsCount === 0) {
            return res.status(404).json({
                status: false,
                message: 'Life insurance policy not found'
            });
        }

        res.status(200).json({
            status: true,
            message: 'Life insurance status updated successfully'
        });
    } catch (error) {
        console.error('Error updating life insurance status:', error);
        res.status(500).json({
            status: false,
            message: 'Error updating life insurance status',
            error: error.message
        });
    }
};

// Get Life Insurance by Consumer (for consumer role mapping integration)
exports.getLifeInsuranceByConsumer = async (req, res) => {
    try {
        const { consumerId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const { count, rows } = await LifeInsurance.findAndCountAll({
            where: { user_consumer_id: consumerId },
            include: [
                {
                    model: User,
                    as: 'policyHolder',
                    attributes: ['user_id', 'username', 'email', 'mobileNumber']
                },
                {
                    model: consumerRoleMapping,
                    as: 'consumerMapping',
                    include: [
                        {
                            model: User,
                            as: 'userConsumers',
                            attributes: ['user_id', 'username', 'email', 'mobileNumber']
                        }
                    ]
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            status: true,
            data: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching life insurance by consumer:', error);
        res.status(500).json({
            status: false,
            message: 'Error fetching life insurance by consumer',
            error: error.message
        });
    }
};

// Get Life Insurance Renewal Data
exports.getLifeInsuranceRenewalData = async (req, res) => {
    try {
        console.log('🔍 [LIFE INSURANCE RENEWAL] Starting renewal data fetch...');
        const { startDate, endDate } = req.query;
        
        console.log('🔍 [LIFE INSURANCE RENEWAL] Query params:', { startDate, endDate });
        
        if (!startDate || !endDate) {
            return res.status(400).json({
                status: false,
                message: 'Start date and end date are required'
            });
        }

        // Convert dates to proper format
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include end of day
        
        console.log('🔍 [LIFE INSURANCE RENEWAL] Date range:', { start, end });

        // First, let's try a simple query to see if the model works
        console.log('🔍 [LIFE INSURANCE RENEWAL] Testing simple query...');
        const testQuery = await LifeInsurance.findAll({
            limit: 5,
            order: [['id', 'DESC']]
        });
        console.log('🔍 [LIFE INSURANCE RENEWAL] Test query result:', testQuery.length, 'records found');
        
        // Try a simpler query first
        const lifeInsuranceData = await LifeInsurance.findAll({
            order: [['id', 'DESC']]
        });
        
        console.log('🔍 [LIFE INSURANCE RENEWAL] Query executed, found records:', lifeInsuranceData.length);

        // Format data for renewal sheet
        const formattedData = lifeInsuranceData.map((policy, index) => ({
            sr_no: index + 1,
            due_date: policy.due_date_of_premium ? new Date(policy.due_date_of_premium).toISOString().split('T')[0] : 'Not Set',
            proposer_name: policy.proposer_name || '',
            mobile_number: policy.proposer_mobile_numbers && policy.proposer_mobile_numbers.length > 0 
                ? policy.proposer_mobile_numbers[0] 
                : '',
            email: policy.proposer_email || '',
            policy_numbers: policy.policy_numbers || policy.policy_number || '',
            rcd: policy.rcd ? new Date(policy.rcd).toISOString().split('T')[0] : 'Not Set',
            premium_amount: policy.premium_amount || 0,
            mode: policy.premium_payment_mode || '',
            company_name: policy.agent_name || '', // Using agent_name as company name
            product_name: policy.product_name || '',
            // Additional fields for actions
            id: policy.id,
            status: policy.status || 'Draft',
            remarks: policy.policy_remarks || '',
            // Original policy data for editing
            originalData: policy
        }));

        res.status(200).json({
            status: true,
            data: formattedData,
            message: 'Life insurance renewal data fetched successfully'
        });
    } catch (error) {
        console.error('❌ [LIFE INSURANCE RENEWAL] Error fetching renewal data:', error);
        console.error('❌ [LIFE INSURANCE RENEWAL] Error stack:', error.stack);
        res.status(500).json({
            status: false,
            message: 'Error fetching life insurance renewal data',
            error: error.message,
            details: error.stack
        });
    }
};

// Building Manager APIs
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
exports.getNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 10, type, is_read } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = {};
        
        // Filter by type if provided
        if (type) {
            whereClause.type = type;
        }
        
        // Filter by read status if provided
        if (is_read !== undefined) {
            whereClause.is_read = is_read === 'true';
        }

        const notifications = await db.notification.findAndCountAll({
            where: whereClause,
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.status(200).json({
            message: 'Notifications retrieved successfully',
            status: true,
            data: {
                notifications: notifications.rows,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(notifications.count / limit),
                    totalItems: notifications.count,
                    itemsPerPage: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            message: 'Error fetching notifications',
            status: false,
            error: error.message
        });
    }
};

// Mark notification as read
exports.markNotificationAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        
        const notification = await db.notification.findByPk(notificationId);
        if (!notification) {
            return res.status(404).json({
                message: 'Notification not found',
                status: false
            });
        }

        await notification.update({ is_read: true });

        res.status(200).json({
            message: 'Notification marked as read',
            status: true
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            message: 'Error marking notification as read',
            status: false,
            error: error.message
        });
    }
};

// // Mark all notifications as read
exports.markAllNotificationsAsRead = async (req, res) => {
    try {
        await db.notification.update(
            { is_read: true },
            { where: { is_read: false } }
        );

        res.status(200).json({
            message: 'All notifications marked as read',
            status: true
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({
            message: 'Error marking all notifications as read',
            status: false,
            error: error.message
        });
    }
};






// Mark notification as read
// exports.markNotificationAsRead = async (req, res) => {
//     try {
//         const { notificationId } = req.params;
//         const userId = req.user.id; // Get user ID from authenticated request
        
//         const notification = await db.notification.findOne({
//             where: {
//                 id: notificationId,
//                 user_id: userId // Ensure user owns this notification
//             }
//         });
        
//         if (!notification) {
//             return res.status(404).json({
//                 message: 'Notification not found',
//                 status: false
//             });
//         }

//         await notification.update({ is_read: true });

//         res.status(200).json({
//             message: 'Notification marked as read',
//             status: true,
//             data: notification
//         });
//     } catch (error) {
//         console.error('Error marking notification as read:', error);
//         res.status(500).json({
//             message: 'Error marking notification as read',
//             status: false,
//             error: error.message
//         });
//     }
// };

// Mark all notifications as read
// exports.markAllNotificationsAsRead = async (req, res) => {
//     try {
//         const userId = req.user.id; // Get user ID from authenticated request
        
//         await db.notification.update(
//             { is_read: true },
//             { 
//                 where: { 
//                     user_id: userId, // Only mark current user's notifications
//                     is_read: false 
//                 } 
//             }
//         );

//         res.status(200).json({
//             message: 'All notifications marked as read',
//             status: true
//         });
//     } catch (error) {
//         console.error('Error marking all notifications as read:', error);
//         res.status(500).json({
//             message: 'Error marking all notifications as read',
//             status: false,
//             error: error.message
//         });
//     }
// };

// Get notification count
exports.getNotificationCount = async (req, res) => {
    try {
        const totalCount = await db.notification.count();
        const unreadCount = await db.notification.count({ where: { is_read: false } });

        res.status(200).json({
            message: 'Notification count retrieved successfully',
            status: true,
            data: {
                total: totalCount,
                unread: unreadCount
            }
        });
    } catch (error) {
        console.error('Error getting notification count:', error);
        res.status(500).json({
            message: 'Error getting notification count',
            status: false,
            error: error.message
        });
    }
};

// Renew Vehicle Policy: move current running policy to previous and clear running policy
// exports.renewVehiclePolicy = async (req, res) => {
//     try {
//         const { vehicle_user_id } = req.body;

//         if (!vehicle_user_id) {
//             return res.status(400).json({ status: false, message: 'vehicle_user_id is required' });
//         }

//         // Find running policy record
//         const runningRecord = await vehcileRunningPolicy.findOne({ where: { vehicle_user_id } });
//         if (!runningRecord) {
//             return res.status(404).json({ status: false, message: 'Running policy not found for this vehicle_user_id' });
//         }

//         // Convert to plain object for safer field access
//         const running = runningRecord.get ? runningRecord.get({ plain: true }) : runningRecord;

//         // Build payload for previous policy
//         const previousPayload = {
//             vehicle_user_id: running.vehicle_user_id,
//             PolicyNumber: running.PolicyNumber || '',
//             company_id: running.company_id || (running.CompanyType && running.CompanyType.company_id) || null,
//             CompanyName: running.CompanyName || (running.CompanyType && running.CompanyType.company_name) || '',
//             PolicyFrom: running.From || running.PolicyFrom || '',
//             PolicyTo: running.To || running.PolicyTo || '',
//             PolicyIssuedDate: running.PolicyIssuedDate || '',
//             PolicyExpiryDate: running.PolicyExpiryDate || running.ExpiryDate || running.To || '',
//             PolicyTenure: running.PolicyTenure || '',
//             PremiumAmount: running.PremiumAmount || 0,
//             IDV: running.IDV || '',
//             NCB: running.NCB || '',
//             NomineeName: running.NomineeName || '',
//             NomineeRelation: running.NomineeRelation || '',
//             NomineeDob: running.NomineeDob || '',
//             NomineeAge: running.NomineeAge || '',
//             CurrentPolicyFile: running.CurrentPolicyFile || running.PdfFile || ''
//         };

//         // Only create/update previous policy when we have meaningful data
//         const hasMeaningfulFields = (previousPayload.PolicyNumber && previousPayload.PolicyNumber.trim() !== '')
//             || (previousPayload.CompanyName && previousPayload.CompanyName.trim() !== '')
//             || (previousPayload.CurrentPolicyFile && previousPayload.CurrentPolicyFile.trim() !== '')
//             || (previousPayload.PolicyFrom && previousPayload.PolicyFrom.trim() !== '')
//             || (previousPayload.PolicyTo && previousPayload.PolicyTo.trim() !== '');

//         let createdPrev = null;

//         if (hasMeaningfulFields) {
//             // Try to find an existing previous policy to update (prefer exact vehicle match + policy number)
//             let existingPrev = null;

//             if (previousPayload.PolicyNumber) {
//                 existingPrev = await vehiclePreviousPolicy.findOne({
//                     where: {
//                         vehicle_user_id: vehicle_user_id,
//                         PolicyNumber: previousPayload.PolicyNumber,
//                     },
//                 });
//             }

//             // If not found, try to reuse a placeholder row (vehicle_user_id = null) matching PolicyNumber
//             if (!existingPrev && previousPayload.PolicyNumber) {
//                 existingPrev = await vehiclePreviousPolicy.findOne({
//                     where: {
//                         vehicle_user_id: null,
//                         PolicyNumber: previousPayload.PolicyNumber,
//                     },
//                 });
//             }

//             // If still not found, try matching by CurrentPolicyFile on placeholder rows
//             if (!existingPrev && previousPayload.CurrentPolicyFile) {
//                 existingPrev = await vehiclePreviousPolicy.findOne({
//                     where: {
//                         vehicle_user_id: null,
//                         CurrentPolicyFile: previousPayload.CurrentPolicyFile,
//                     },
//                 });
//             }

//             // Fallback: reuse any placeholder row (most recent) with vehicle_user_id = null
//             if (!existingPrev) {
//                 existingPrev = await vehiclePreviousPolicy.findOne({
//                     where: { vehicle_user_id: null },
//                     order: [['createdAt', 'DESC']],
//                 });
//             }

//             if (existingPrev) {
//                 createdPrev = await existingPrev.update(previousPayload);
//             } else {
//                 createdPrev = await vehiclePreviousPolicy.create(previousPayload);
//             }
//         }

//         // Clear fields in running policy (reset for new entry)
//         await runningRecord.update({
//             PolicyNumber: '',
//             PolicyIssuedDate: '',
//             PolicyExpiryDate: '',
//             PolicyTenure: '',
//             From: '',
//             To: '',
//             PremiumAmount: 0,
//             NCB: '',
//             IDV: '',
//             NomineeName: '',
//             NomineeRelation: '',
//             NomineeAge: '',
//             NomineeDob: '',
//             Vendor: '',
//             CurrentPolicyFile: ''
//         });

//         return res.status(200).json({ status: true, message: 'Policy renewed: running policy moved to previous', previousPolicy: createdPrev });
//     } catch (error) {
//         console.error('❌ [RENEW VEHICLE POLICY] Error:', error);
//         return res.status(500).json({ status: false, message: 'Error renewing policy', error: error.message });
//     }
// };


exports.renewVehiclePolicy = async (req, res) => {
  try {
    const { vehicle_user_id } = req.body;

    if (!vehicle_user_id) {
      return res.status(400).json({ status: false, message: "vehicle_user_id is required" });
    }

    // 🔍 Find the running policy record for this vehicle
    const runningRecord = await vehcileRunningPolicy.findOne({ where: { vehicle_user_id } });
    if (!runningRecord) {
      return res.status(404).json({ status: false, message: "Running policy not found for this vehicle_user_id" });
    }

    const running = runningRecord.get ? runningRecord.get({ plain: true }) : runningRecord;

    // 🧾 Prepare the previous policy payload
    const previousPayload = {
      vehicle_user_id: running.vehicle_user_id,
      PolicyNumber: running.PolicyNumber?.trim() || "",
      company_id:
        running.company_id ||
        (running.CompanyType && running.CompanyType.company_id) ||
        null,
      CompanyName:
        running.CompanyName ||
        (running.CompanyType && running.CompanyType.company_name) ||
        "",
      PolicyFrom: running.From || running.PolicyFrom || "",
      PolicyTo: running.To || running.PolicyTo || "",
      PolicyIssuedDate: running.PolicyIssuedDate || "",
      PolicyExpiryDate:
        running.PolicyExpiryDate || running.ExpiryDate || running.To || "",
      PolicyTenure: running.PolicyTenure || "",
      PremiumAmount: running.PremiumAmount || 0,
      IDV: running.IDV || "",
      NCB: running.NCB || "",
      NomineeName: running.NomineeName || "",
      NomineeRelation: running.NomineeRelation || "",
      NomineeDob: running.NomineeDob || "",
      NomineeAge: running.NomineeAge || "",
      CurrentPolicyFile: running.CurrentPolicyFile || running.PdfFile || "",
    };

    // ✅ Check if the data is meaningful enough to move
    const hasMeaningfulFields =
      previousPayload.PolicyNumber ||
      previousPayload.CompanyName ||
      previousPayload.CurrentPolicyFile ||
      previousPayload.PolicyFrom ||
      previousPayload.PolicyTo;

    if (!hasMeaningfulFields) {
      return res.status(400).json({
        status: false,
        message: "No meaningful running policy data found to move",
      });
    }

    // ✅ Check for existing previous policy (avoid duplicate)
    let existingPrev = null;

    if (previousPayload.PolicyNumber) {
      existingPrev = await vehiclePreviousPolicy.findOne({
        where: {
          vehicle_user_id,
          PolicyNumber: previousPayload.PolicyNumber,
        },
      });
    }

    if (!existingPrev && previousPayload.CurrentPolicyFile) {
      existingPrev = await vehiclePreviousPolicy.findOne({
        where: {
          vehicle_user_id,
          CurrentPolicyFile: previousPayload.CurrentPolicyFile,
        },
      });
    }

    let createdPrev;
    if (existingPrev) {
      console.log("⚠️ Existing previous policy found — updating instead of creating new.");
      createdPrev = await existingPrev.update(previousPayload);
    } else {
      createdPrev = await vehiclePreviousPolicy.create(previousPayload);
      console.log("✅ Previous policy created:", createdPrev.PolicyNumber);
    }

    // 🧹 Reset the running policy after successful move
    await runningRecord.update({
      PolicyNumber: "",
      PolicyIssuedDate: "",
      PolicyExpiryDate: "",
      PolicyTenure: "",
      From: "",
      To: "",
      PremiumAmount: 0,
      NCB: "",
      IDV: "",
      NomineeName: "",
      NomineeRelation: "",
      NomineeAge: "",
      NomineeDob: "",
      Vendor: "",
      CurrentPolicyFile: "",
    });

    return res.status(200).json({
      status: true,
      message: "Policy renewed successfully — running policy moved to previous",
      previousPolicy: createdPrev,
    });
  } catch (error) {
    console.error("❌ [RENEW VEHICLE POLICY] Error:", error);
    return res.status(500).json({
      status: false,
      message: "Error renewing policy",
      error: error.message,
    });
  }
};

module.exports = {
    userChek: exports.userChek,
    verifyUser: exports.verifyUser,
    verifyUserLogin: exports.verifyUserLogin,
    getAllUsers: exports.getAllUsers,
    getAllBuilderUsers: exports.getAllBuilderUsers,
    getAllBuilderListUsers: exports.getAllBuilderListUsers,
    getAllRolesUsers: exports.getAllRolesUsers,
    getCategoryById: exports.getCategoryById,
    addData: exports.addData,
    getAllRoles: exports.getAllRoles,
    addRoleWiseUser: exports.addRoleWiseUser,
    updateRoleWiseUser: exports.updateRoleWiseUser,
    updateData: exports.updateData,
    addBuilderData: exports.addBuilderData,
    addConsumerData: exports.addConsumerData,
    updateLoanConsumerData: exports.updateLoanConsumerData,
    updateConsumerData: exports.updateConsumerData,
    updateBuilderData: exports.updateBuilderData,
    getUnitsByBuilder: exports.getUnitsByBuilder,
    getUnitsByBuilderCategory: exports.getUnitsByBuilderCategory,
    addBuilderUnit: exports.addBuilderUnit,
    updateBuilderUnit: exports.updateBuilderUnit,
    getUintByConsumer: exports.getUintByConsumer,
    addBuilderUnitCategory: exports.addBuilderUnitCategory,
    updateBuilderUnitCategory: exports.updateBuilderUnitCategory,
    getAllUnitCatergory: exports.getAllUnitCatergory,
    getAllUnitVerticle: exports.getAllUnitVerticle,
    getAllVerticleUser: exports.getAllVerticleUser,
    getAllLoanUser: exports.getAllLoanUser,
    getAllLoanUserDetail: exports.getAllLoanUserDetail,
    getAllLoanUserInterested: exports.getAllLoanUserInterested,
    getAllLoanUserNotInterested: exports.getAllLoanUserNotInterested,
    getAllLoanUserDisburse: exports.getAllLoanUserDisburse,
    updateLoanStatus: exports.updateLoanStatus,
    updateWorkingLoanStatus: exports.updateWorkingLoanStatus,
    getAllMediclaimUser: exports.getAllMediclaimUser,
    getAllLifeInsUser: exports.getAllLifeInsUser,
    getAllVehicleInsUser: exports.getAllVehicleInsUser,
    addConsumer: exports.addConsumer,
    updateConsumer: exports.updateConsumer,
    addDisburse: exports.addDisburse,
    addLoanCobfiguration: exports.addLoanCobfiguration,
    updateDisburse: exports.updateDisburse,
    getAllMediclaimCompany: exports.getAllMediclaimCompany,
    addMediclaimCompanyData: exports.addMediclaimCompanyData,
    updateMediclaimCompanyData: exports.updateMediclaimCompanyData,
    getAllMediclaimProduct: exports.getAllMediclaimProduct,
    addMediclaimProductData: exports.addMediclaimProductData,
    updateMediclaimProductData: exports.updateMediclaimProductData,
    addMediclaimUserData: exports.addMediclaimUserData,
    updateMediclaimUserData: exports.updateMediclaimUserData,
    geteMediclaimUserData: exports.geteMediclaimUserData,
    geteMediclaimUserRenewalData: exports.geteMediclaimUserRenewalData,
    geteMediclaimCompanyData: exports.geteMediclaimCompanyData,
    geteMediclaimProductData: exports.geteMediclaimProductData,
    addInquieryUser: exports.addInquieryUser,
    addCodeDetails: exports.addCodeDetails,
    getAllCodes: exports.getAllCodes,
    getAllLoanConfiguration: exports.getAllLoanConfiguration,
    getAllInqueryUser: exports.getAllInqueryUser,
    getUserCounts: exports.getUserCounts,
    getLoanAmounFilterDate: exports.getLoanAmounFilterDate,
    downloadFile: exports.downloadFile,
    // Vehicle related functions
    addVehicleUserData: exports.addVehicleUserData,
    updateVehicleUserData: exports.updateVehicleUserData,
    updateVehicleUserRemarkData: exports.updateVehicleUserRemarkData,
    getVehicleUserData: exports.getVehicleUserData,
    getVehicleUserRenewalData: exports.getVehicleUserRenewalData,
    getVehicleRenewalStats: exports.getVehicleRenewalStats,
    addVehicleDetails: exports.addVehicleDetails,
    getAllVehicles: exports.getAllVehicles,
    // Policy related functions
    addPolicyplanDetails: exports.addPolicyplanDetails,
    addPolicyTypeDetails: exports.addPolicyTypeDetails,
    getAllPolicyTypes: exports.getAllPolicyTypes,
    getAllPolicyPlans: exports.getAllPolicyPlans,
    // Company type functions
    getAllCompanyTypes: exports.getAllCompanyTypes,
    addCompanyTypeDetails: exports.addCompanyTypeDetails,
    // Blog functions
    addBlog: exports.addBlog,
    updateBlog: exports.updateBlog,
    deleteBlog: exports.deleteBlog,
    getAllBlogs: exports.getAllBlogs,
    getBlogById: exports.getBlogById,
    getVehicleRenewalSheet: exports.getVehicleRenewalSheet,
    renewVehiclePolicy: exports.renewVehiclePolicy,
    listAllVehicleUsersDebug: exports.listAllVehicleUsersDebug,
    getVehicleUserById: exports.getVehicleUserById,
    // Life Insurance functions
    createLifeInsurance: exports.createLifeInsurance,
    getAllLifeInsurance: exports.getAllLifeInsurance,
    getLifeInsuranceById: exports.getLifeInsuranceById,
    updateLifeInsurance: exports.updateLifeInsurance,
    deleteLifeInsurance: exports.deleteLifeInsurance,
    uploadLifeInsuranceDocument: exports.uploadLifeInsuranceDocument,
    getLifeInsuranceDocuments: exports.getLifeInsuranceDocuments,
    deleteLifeInsuranceDocument: exports.deleteLifeInsuranceDocument,
    updateLifeInsuranceStatus: exports.updateLifeInsuranceStatus,
    getLifeInsuranceByConsumer: exports.getLifeInsuranceByConsumer,
    getLifeInsuranceRenewalData: exports.getLifeInsuranceRenewalData,
    getAllPolicyRecords: exports.getAllPolicyRecords,
    // Notification functions
    getNotifications: exports.getNotifications,
    markNotificationAsRead: exports.markNotificationAsRead,
    markAllNotificationsAsRead: exports.markAllNotificationsAsRead,
    getNotificationCount: exports.getNotificationCount,
    // Building Manager functions
    createBuildingManager: exports.createBuildingManager,
    assignBuildingManager: exports.assignBuildingManager,
    getAllBuildingManagers: exports.getAllBuildingManagers,
    getBuildingManagerStats: exports.getBuildingManagerStats,
    updateBuildingManager: exports.updateBuildingManager,
    removeBuildingManager: exports.removeBuildingManager,
};