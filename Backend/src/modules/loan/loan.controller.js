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
  try { const data = await buildLoanRows(req, { status: { [Op.notIn]: ["notAssign", "notInterested"] } }); res.status(200).send({ status: true, data }); }
  catch (e) { logger.error({ err: e }, "getAllLoanUserInterested failed"); res.status(500).send({ status: false, message: e.message }); }
};


exports.getAllLoanUserDetail = async (req, res) => {
  try { const data = await buildLoanRows(req, (req.body && req.body.laon_id) ? { laon_id: req.body.laon_id } : {}); res.status(200).send({ status: true, data }); }
  catch (e) { logger.error({ err: e }, "getAllLoanUserDetail failed"); res.status(500).send({ status: false, message: e.message }); }
};

exports.getAllLoanUserNotInterested = async (req, res) => {
  try { const data = await buildLoanRows(req, { status: "notInterested" }); res.status(200).send({ status: true, data }); }
  catch (e) { logger.error({ err: e }, "getAllLoanUserNotInterested failed"); res.status(500).send({ status: false, message: e.message }); }
};


exports.getAllLoanUserDisburse = async (req, res) => {
  try { const data = await buildLoanRows(req, { status: { [Op.in]: ["disbursement", "completed"] } }); res.status(200).send({ status: true, data }); }
  catch (e) { logger.error({ err: e }, "getAllLoanUserDisburse failed"); res.status(500).send({ status: false, message: e.message }); }
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
