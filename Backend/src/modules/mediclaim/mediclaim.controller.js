const { ROLE_IDS, CATEGORY_IDS } = require("../../config/ids");
/**
 * mediclaim controller — extracted from the legacy user.controller monolith.
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
  saveUpload,
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
const mediclaimService = require("./mediclaim.service");
const logger = require("../../config/logger");

exports.getAllMediclaimUser = async (req, res) => {
    // Set cache control headers to prevent 304 responses
    res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    });
    
    logger.debug('🔍 [MEDICLAIM API] User making request:', req.user);
    logger.debug('🔍 [MEDICLAIM API] User Role:', req.user.Role);
    logger.debug('🔍 [MEDICLAIM API] User ID:', req.user.id);
    
    let whereObj = {};

    // For users with mediclaim category access, show all mediclaim consumers
    // Only apply role-based filtering if the user doesn't have mediclaim category access
    if (req.user.Role === ROLE_IDS.STAFF && !req.user.categoryIds?.includes(CATEGORY_IDS.MEDICLAIM)) {
        whereObj.user_role_id = req.user.id;
        logger.debug('🔍 [MEDICLAIM API] Setting user_role_id filter:', req.user.id);
    } else {
        logger.debug('🔍 [MEDICLAIM API] User has mediclaim category access - showing all mediclaim consumers');
    }
    whereObj.category_id = 4;
    
    logger.debug('🔍 [MEDICLAIM API] Final whereObj:', whereObj);
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
            logger.debug(articles);
            res.status(200).send({
                message: "catergory unit get success",
                data: articles,
                status: true,
            });
        })
        .catch((e) => {
            res.status(400).send({ message: "role error", status: false });
            logger.debug(e);
        });
};


exports.getAllMediclaimCompany = async (req, res) => {
    try {
        const data = await mediclaimService.getCompanies();
        res.status(200).send({ message: "mediclaim company get success", data, status: true });
    } catch (e) {
        logger.error({ err: e }, "getAllMediclaimCompany failed");
        res.status(400).send({ message: "mediclaim company error", status: false });
    }
};


exports.addMediclaimCompanyData = async (req, res) => {
    try {
        const { conflict, created } = await mediclaimService.addCompany(
            req.body.mediclaim_company_name
        );
        if (conflict) {
            return res.status(400).send({
                message: "Mediclaim company name is already in use.",
                status: false,
            });
        }
        return res.status(200).send({
            message: "Mediclaim company successfully added!",
            status: true,
            data: created,
        });
    } catch (e) {
        logger.error({ err: e }, "addMediclaimCompanyData failed");
        return res.status(500).send({ message: "Internal server error", status: false });
    }
};


exports.updateMediclaimCompanyData = async (req, res) => {
    try {
        const { conflict, result } = await mediclaimService.updateCompany(
            req.body.mediclaim_company_id,
            req.body.mediclaim_company_name
        );
        if (conflict) {
            return res.status(400).send({
                message: "Mediclaim company name already in use",
                status: false,
            });
        }
        return res.status(200).send({
            message: "Mediclaim company successfully updated!",
            status: true,
            data: result,
        });
    } catch (e) {
        logger.error({ err: e }, "updateMediclaimCompanyData failed");
        res.status(500).send({ message: "Internal server error", status: false });
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
                logger.debug(e);
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
                CTRL_DIR,
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
        logger.error(error);
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
                CTRL_DIR,
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
                    logger.debug(`🗑️ Deleted PDF file: ${fileName}`);
                }
            }

            // Remove from database
            await db.mediclaimproductpdf.destroy({
                where: { 
                    mediclaim_product_id,
                    mediclaim_product_pdf_id: removedPdfIds
                },
            });
            logger.debug(`🗑️ Removed ${removedPdfIds.length} PDF(s) from database`);
        }

        // Handle new PDF uploads
        const pdfFields = Object.keys(req.files || {}).filter((key) => key.startsWith('pdfFile'));
        if (pdfFields.length > 0) {
            const uploadFolder = path.join(
                CTRL_DIR,
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
                logger.debug(`📄 Added new PDF: ${file.name}`);
            }

            // Save new PDF details to the database
            await db.mediclaimproductpdf.bulkCreate(pdfRecords);
        }

        res.status(200).send({
            message: "Mediclaim product successfully updated!",
            status: true,
        });
    } catch (error) {
        logger.error(error);
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
    logger.debug('🔍 [ADD MEDICLAIM] Received runningPolicy:', runningPolicy);
    logger.debug('🔍 [ADD MEDICLAIM] Received previousPolicy:', previousPolicy);

    let createdMediclaimId = null; // for compensation cleanup if a later step fails
    try {
        // Check if user with this mobile number already exists
        let user = await User.findOne({
            where: { mobileNumber: MobileNumber }
        });

        if (user) {
            logger.debug('🔍 [ADD MEDICLAIM] User found with mobile number:', MobileNumber, 'User ID:', user.user_id);
            
            // Check if user is already assigned to mediclaim category
            const existingMapping = await consumerRoleMapping.findOne({
                where: {
                    user_consumer_id: user.user_id,
                    category_id: CATEGORY_IDS.MEDICLAIM // mediclaim category
                }
            });

            if (!existingMapping) {
                // User exists but not assigned to mediclaim category, add the mapping
                logger.debug('🔍 [ADD MEDICLAIM] Adding user to mediclaim category');
                await consumerRoleMapping.create({
                    user_role_id: req.user.id,
                    user_consumer_id: user.user_id,
                    category_id: CATEGORY_IDS.MEDICLAIM, // mediclaim category
                });
            }
        } else {
            logger.debug('🔍 [ADD MEDICLAIM] User not found, creating new user');
            
            // Create new user
            user = await User.create({
            username: Name,
            email: Email,
            mobileNumber: MobileNumber,
            referenceName: ReferenceName, // User model uses PascalCase
            role_id: ROLE_IDS.CONSUMER // Use role_id 3 for consumers (consumer role)
        });

            if (!user) {
                return res.status(400).json({ message: "User creation failed", status: false });
            }

            // Create role mapping for new user
            await consumerRoleMapping.create({
                user_role_id: req.user.id,
                user_consumer_id: user.user_id,
                category_id: CATEGORY_IDS.MEDICLAIM, // mediclaim category
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
        createdMediclaimId = mediclaimId; // track for rollback on later failure

        // ConsumerRoleMapping already created above in user check/creation logic

        // Handle document uploads (aadhar, pan, gst, custom documents)
        const uploadsDir = path.join(CTRL_DIR, "../../uploads");
        let documentFiles = {
            AadharFileName: null,
            PanFileName: null,
            GstFileName: null
        };
        
        logger.debug('🔍 [ADD MEDICLAIM] req.files keys:', Object.keys(req.files || {}));
        
        // Handle Aadhar / PAN / GST via the shared uploader → uploads/mediclaim/.
        if (req.files && req.files.aadhar) {
            documentFiles.AadharFileName = await saveUpload(req.files.aadhar, "mediclaim");
            logger.debug(`📁 [ADD MEDICLAIM] Aadhar saved: ${documentFiles.AadharFileName}`);
        }
        if (req.files && req.files.pan) {
            documentFiles.PanFileName = await saveUpload(req.files.pan, "mediclaim");
            logger.debug(`📁 [ADD MEDICLAIM] PAN saved: ${documentFiles.PanFileName}`);
        }
        if (req.files && req.files.gst) {
            documentFiles.GstFileName = await saveUpload(req.files.gst, "mediclaim");
            logger.debug(`📁 [ADD MEDICLAIM] GST saved: ${documentFiles.GstFileName}`);
        }

        // Handle custom documents (proper await — the old forEach(async) didn't wait).
        const customDocuments = Data.customDocuments || [];
        for (let idx = 0; idx < customDocuments.length; idx++) {
            const fileKey = `customDocument_${idx}`;
            if (req.files && req.files[fileKey]) {
                customDocuments[idx].file = await saveUpload(req.files[fileKey], "mediclaim");
                logger.debug(`📁 [ADD MEDICLAIM] Custom document saved: ${customDocuments[idx].file}`);
            }
        }

        // Policy PDF on add (uploaded from the modal as CurrentPolicyFile).
        if (req.files && req.files.CurrentPolicyFile) {
            runningPolicy.CurrentPolicyFile = await saveUpload(req.files.CurrentPolicyFile, "mediclaim");
            logger.debug(`📁 [ADD MEDICLAIM] Policy PDF saved: ${runningPolicy.CurrentPolicyFile}`);
        }
        
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
                is_current: true,   // current policy in the unified table
                status: "running",
                // Ensure CurrentPolicyFile is a string or null, not an object
                CurrentPolicyFile: runningPolicy.CurrentPolicyFile && typeof runningPolicy.CurrentPolicyFile === 'object' 
                    ? null 
                    : (runningPolicy.CurrentPolicyFile || null),
                // Ensure other file fields are also strings or null
                PdfFile: runningPolicy.PdfFile && typeof runningPolicy.PdfFile === 'object' 
                    ? null 
                    : (runningPolicy.PdfFile || null)
            };
            
            logger.debug('🔍 [RUNNING POLICY] Cleaned data:', cleanedRunningPolicy);
            
            await RunningPolicies.create(cleanedRunningPolicy);
        }

        // Create previous policy if provided and has real data
        if (hasMeaningfulPreviousPolicyData(previousPolicy)) {
            // Clean the previousPolicy data to prevent validation errors
            const cleanedPreviousPolicy = {
                ...previousPolicy,
                mediclaim_id: mediclaimId,
                user_id: user.user_id,
                is_current: false,  // history row in the unified table
                status: "completed",
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
            
            logger.debug('🔍 [PREVIOUS POLICY] Cleaned data:', cleanedPreviousPolicy);
            logger.debug('🔍 [PREVIOUS POLICY] Previous Agent Details:', {
                PreviousAgentName: cleanedPreviousPolicy.PreviousAgentName,
                PreviousAgentCode: cleanedPreviousPolicy.PreviousAgentCode,
                PreviousAgentContactNumber: cleanedPreviousPolicy.PreviousAgentContactNumber
            });
            
            await PreviousPolicies.create(cleanedPreviousPolicy);
        } else {
            logger.debug('ℹ️ [PREVIOUS POLICY] No meaningful previous policy data provided - skipping creation.');
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

        try { await mediclaimService.reconcileMediclaimPolicies(mediclaimId); } catch (e) { logger.error({ err: e }, "mediclaim reconcile after add failed"); }

        res.status(200).json({
            message: 'Mediclaim data saved successfully',
            status: true
        });
    } catch (error) {
        logger.error('Error in addMediclaimUserData:', error);
        // Compensation: if a later step failed, remove the orphan mediclaim + its
        // policies/members/employees so we never leave a half-written record.
        if (createdMediclaimId) {
            try {
                await Promise.all([
                    db.runningPolicyMediclaim.destroy({ where: { mediclaim_id: createdMediclaimId } }),
                    db.familyMember.destroy({ where: { mediclaim_id: createdMediclaimId } }),
                    db.employeeMediclaim.destroy({ where: { mediclaim_id: createdMediclaimId } }),
                ]);
                await Mediclaim.destroy({ where: { id: createdMediclaimId } });
                logger.warn({ mediclaimId: createdMediclaimId }, "Rolled back partial mediclaim add");
            } catch (cleanupErr) { logger.error({ err: cleanupErr }, "mediclaim add rollback failed"); }
        }
        res.status(500).json({
            message: 'Error saving mediclaim data',
            error: error.message
        });
    }
};


exports.updateMediclaimUserData = async (req, res) => {
    logger.debug('🔍 [UPDATE MEDICLAIM] Request received:', req.body);
    logger.debug('🔍 [UPDATE MEDICLAIM] Request params:', req.params);
    
    if (!req?.body?.data) {
        logger.debug('❌ [UPDATE MEDICLAIM] No data found in request body');
        res.status(404).json({ error: 'Data not found' });
        return;
    }
    
    let Data = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data;
    logger.debug('🔍 [UPDATE MEDICLAIM] Parsed data:', Data);

    const {
        Name, Email, MobileNumber, RadioButton, policyRadio, DateOfBirth, Age, Gender, RelationshipWithPolicyHolder,
        SumInsured, NoClaimBonus, PreExistingIllness, ProductName, CompanyName, AgentName, AgentCode,
        AgentContactNumber, runningPolicy, previousPolicy, user_id, familyMembers, employees, id, ReferenceName,
        // Individual Insured Person fields
        InsuredPersonName, InsuredPersonRelationship, InsuredPersonDateOfBirth, InsuredPersonAge,
        InsuredPersonGender, InsuredPersonDateOfJoining, InsuredPersonPreExistingIllness
    } = Data;

    logger.debug('🔍 [UPDATE MEDICLAIM] Extracted fields:', {
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

    let t = null;
    try {
        t = await db.medicliamuser.sequelize.transaction(); // atomic update (rolls back on any error)
        // Update mediclaim data
        await db.medicliamuser.update(obj, { where: { id: id }, transaction: t });

        // Update user table with basic information (Name, Email, MobileNumber, ReferenceName)
        if (user_id) {
            logger.debug('🔍 [UPDATE MEDICLAIM] Updating User table with:', {
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
                { where: { user_id: user_id }, transaction: t }
            );
            
            logger.debug('🔍 [UPDATE MEDICLAIM] User table update result:', userUpdateResult);
        }

        // Handle document uploads (aadhar, pan, gst, custom documents)
        const uploadsDir = path.join(CTRL_DIR, "../../uploads");
        let documentFiles = {};
        
        // Get existing mediclaim data to check for old files
        const existingMediclaim = await db.medicliamuser.findOne({ where: { id: id } });
        
        logger.debug('🔍 [UPDATE MEDICLAIM] req.files keys:', Object.keys(req.files || {}));
        
        // Handle document removal (if specified)
        const removedDocuments = Data.removedDocuments || [];
        logger.debug('🗑️ [UPDATE MEDICLAIM] Documents marked for removal:', removedDocuments);
        
        if (removedDocuments.length > 0) {
            // Remove Aadhar if marked
            if (removedDocuments.includes('aadhar') && existingMediclaim?.AadharFileName) {
                const filePath = path.join(uploadsDir, existingMediclaim.AadharFileName);
                if (fsSync.existsSync(filePath)) {
                    fsSync.unlinkSync(filePath);
                    logger.debug(`🗑️ [UPDATE MEDICLAIM] Deleted Aadhar file: ${existingMediclaim.AadharFileName}`);
                }
                documentFiles.AadharFileName = null;
            }
            
            // Remove PAN if marked
            if (removedDocuments.includes('pan') && existingMediclaim?.PanFileName) {
                const filePath = path.join(uploadsDir, existingMediclaim.PanFileName);
                if (fsSync.existsSync(filePath)) {
                    fsSync.unlinkSync(filePath);
                    logger.debug(`🗑️ [UPDATE MEDICLAIM] Deleted PAN file: ${existingMediclaim.PanFileName}`);
                }
                documentFiles.PanFileName = null;
            }
            
            // Remove GST if marked
            if (removedDocuments.includes('gst') && existingMediclaim?.GstFileName) {
                const filePath = path.join(uploadsDir, existingMediclaim.GstFileName);
                if (fsSync.existsSync(filePath)) {
                    fsSync.unlinkSync(filePath);
                    logger.debug(`🗑️ [UPDATE MEDICLAIM] Deleted GST file: ${existingMediclaim.GstFileName}`);
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
                    logger.debug(`📁 [UPDATE MEDICLAIM] Deleted old Aadhar: ${existingMediclaim.AadharFileName}`);
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
            logger.debug(`📁 [UPDATE MEDICLAIM] Aadhar saved: ${uniqueName}`);
        }
        
        // Handle PAN
        if (req.files && req.files.pan) {
            // Delete old file if exists
            if (existingMediclaim?.PanFileName) {
                const oldFilePath = path.join(uploadsDir, existingMediclaim.PanFileName);
                if (fsSync.existsSync(oldFilePath)) {
                    fsSync.unlinkSync(oldFilePath);
                    logger.debug(`📁 [UPDATE MEDICLAIM] Deleted old PAN: ${existingMediclaim.PanFileName}`);
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
            logger.debug(`📁 [UPDATE MEDICLAIM] PAN saved: ${uniqueName}`);
        }
        
        // Handle GST
        if (req.files && req.files.gst) {
            // Delete old file if exists
            if (existingMediclaim?.GstFileName) {
                const oldFilePath = path.join(uploadsDir, existingMediclaim.GstFileName);
                if (fsSync.existsSync(oldFilePath)) {
                    fsSync.unlinkSync(oldFilePath);
                    logger.debug(`📁 [UPDATE MEDICLAIM] Deleted old GST: ${existingMediclaim.GstFileName}`);
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
            logger.debug(`📁 [UPDATE MEDICLAIM] GST saved: ${uniqueName}`);
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
                logger.debug(`📁 [UPDATE MEDICLAIM] Custom document ${doc.name} saved: ${uniqueName}`);
            }
        }
        
        // Update mediclaim with document filenames
        if (Object.keys(documentFiles).length > 0) {
            await db.medicliamuser.update(documentFiles, { where: { id: id }, transaction: t });
        }

        // Store custom documents metadata if needed
        if (customDocuments.length > 0) {
            await db.medicliamuser.update(
                { customDocuments: JSON.stringify(customDocuments) },
                { where: { id: id }, transaction: t }
            );
        }

        // Handle Renewal Logic - Transfer running policy to previous policy
        logger.debug('🔍 [UPDATE MEDICLAIM] Policy type:', policyRadio);
        
        if (policyRadio === "Renew" && runningPolicy && typeof runningPolicy === 'object') {
            try {
                logger.debug('🔄 [RENEWAL] Processing renewal - transferring running policy to previous policy');
                
                // Single-table merge: archive the current policy in place by flipping
                // is_current=false (it becomes a history row) — no separate table.
                const existingRunningPolicy = await db.runningPolicyMediclaim.findOne({
                    where: { mediclaim_id: id, is_current: true },
                    raw: true
                });

                if (existingRunningPolicy) {
                    await db.runningPolicyMediclaim.update(
                        {
                            is_current: false,
                            status: "completed",
                            RenewDate: existingRunningPolicy.PolicyTo || existingRunningPolicy.ExpiryDate || null,
                            PdfFile: existingRunningPolicy.CurrentPolicyFile || existingRunningPolicy.PdfFile || null,
                            PdfFileName: existingRunningPolicy.CurrentPolicyFile || existingRunningPolicy.PdfFileName || null,
                            PreviousPolicyNumber: existingRunningPolicy.PolicyNumber || null,
                        },
                        { where: { id: existingRunningPolicy.id }, transaction: t }
                    );
                    logger.debug('🔄 [RENEWAL] Archived current policy as history (is_current=false)');
                }

                // New renewal policy PDF → uploads/mediclaim/. The old policy keeps
                // its file (it's now a history row), so we don't delete it.
                if (req.files && req.files.CurrentPolicyFile) {
                    runningPolicy.CurrentPolicyFile = await saveUpload(req.files.CurrentPolicyFile, "mediclaim");
                    logger.debug(`📁 [UPDATE MEDICLAIM] Renewal policy PDF saved: ${runningPolicy.CurrentPolicyFile}`);
                }

                // Create the new current policy (single-table merge).
                await db.runningPolicyMediclaim.create({
                    ...runningPolicy,
                    mediclaim_id: id,
                    is_current: true,
                    status: "running",
                }, { transaction: t });
                logger.debug('🔄 [RENEWAL] Created new current policy');
            } catch (renewalError) {
                logger.error('❌ [RENEWAL] Error processing renewal:', renewalError);
                throw renewalError;
            }
        } 
        // Handle regular running policy update (Fresh or Portability)
        else if (runningPolicy && typeof runningPolicy === 'object') {
            try {
                // Check if a current running policy exists for this mediclaim
                const existingRunningPolicy = await db.runningPolicyMediclaim.findOne({
                    where: { mediclaim_id: id, is_current: true }
                });

                // Updated policy PDF → uploads/mediclaim/ (delete the old one first).
                const uploadsDir = path.join(CTRL_DIR, "../../uploads");
                if (req.files && req.files.CurrentPolicyFile) {
                    if (existingRunningPolicy?.CurrentPolicyFile) {
                        const oldFilePath = path.join(uploadsDir, existingRunningPolicy.CurrentPolicyFile);
                        try { if (fsSync.existsSync(oldFilePath)) fsSync.unlinkSync(oldFilePath); } catch (e) { /* ignore */ }
                    }
                    runningPolicy.CurrentPolicyFile = await saveUpload(req.files.CurrentPolicyFile, "mediclaim");
                    logger.debug(`📁 [UPDATE MEDICLAIM] Policy PDF saved: ${runningPolicy.CurrentPolicyFile}`);
                } else if (existingRunningPolicy && !runningPolicy.CurrentPolicyFile) {
                    // Keep existing file if no new file uploaded and no file in payload
                    runningPolicy.CurrentPolicyFile = existingRunningPolicy.CurrentPolicyFile;
                }

                if (existingRunningPolicy) {
                    // Update existing current policy
                    await db.runningPolicyMediclaim.update(runningPolicy, {
                        where: { mediclaim_id: id, is_current: true }, transaction: t
                    });
                } else {
                    // Create new current policy
                    await db.runningPolicyMediclaim.create({
                        ...runningPolicy,
                        mediclaim_id: id,
                        is_current: true,
                        status: "running",
                    }, { transaction: t });
                }
            } catch (runningPolicyError) {
                logger.error('Error updating running policy:', runningPolicyError);
                // Continue with other updates even if running policy fails
            }
        }

        // Update previous policy data if provided (for Portability or manual previous policy updates)
        if (policyRadio !== "Renew" && hasMeaningfulPreviousPolicyData(previousPolicy)) {
            try {
                // Check if a history (previous) policy exists for this mediclaim
                const existingPreviousPolicy = await db.runningPolicyMediclaim.findOne({
                    where: { mediclaim_id: id, is_current: false }
                });

                // Handle PdfFile upload if provided
                const uploadsDir = path.join(CTRL_DIR, "../../uploads");
                logger.debug('🔍 [UPDATE MEDICLAIM] PdfFile exists:', !!(req.files && req.files.PdfFile));
                logger.debug('🔍 [UPDATE MEDICLAIM] ClaimStatementPDFfile exists:', !!(req.files && req.files.ClaimStatementPDFfile));
                
                if (req.files && req.files.PdfFile) {
                    let PdfFile = req.files.PdfFile;
                    const uniqueName = `${uuidv4()}-${path.basename(PdfFile.name)}`;
                    const uploadPath = path.join(uploadsDir, uniqueName);
                    
                    // Delete old file if it exists
                    if (existingPreviousPolicy?.PdfFile) {
                        const oldFilePath = path.join(uploadsDir, existingPreviousPolicy.PdfFile);
                        if (fsSync.existsSync(oldFilePath)) {
                            fsSync.unlinkSync(oldFilePath);
                            logger.debug(`📁 [UPDATE MEDICLAIM] Deleted old PdfFile: ${existingPreviousPolicy.PdfFile}`);
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
                    logger.debug(`📁 [UPDATE MEDICLAIM] PdfFile saved: ${uniqueName}`);
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
                            logger.debug(`📁 [UPDATE MEDICLAIM] Deleted old ClaimStatementPDFfile: ${existingPreviousPolicy.ClaimStatementPDFfile}`);
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
                    logger.debug(`📁 [UPDATE MEDICLAIM] ClaimStatementPDFfile saved: ${uniqueName}`);
                } else if (existingPreviousPolicy && !previousPolicy.ClaimStatementPDFfile) {
                    // Keep existing file if no new file uploaded
                    previousPolicy.ClaimStatementPDFfile = existingPreviousPolicy.ClaimStatementPDFfile;
                    previousPolicy.ClaimStatementPDFfileName = existingPreviousPolicy.ClaimStatementPDFfileName;
                }

                // Clean the previousPolicy data before saving
                const cleanedPreviousPolicy = {
                    ...previousPolicy,
                    mediclaim_id: id,
                    is_current: false, // history row in the unified table
                    status: "completed",
                    CompanyName: CompanyName || null,

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
                
                logger.debug('🔍 [UPDATE PREVIOUS POLICY] Previous Agent Details:', {
                    PreviousAgentName: cleanedPreviousPolicy.PreviousAgentName,
                    PreviousAgentCode: cleanedPreviousPolicy.PreviousAgentCode,
                    PreviousAgentContactNumber: cleanedPreviousPolicy.PreviousAgentContactNumber
                });

                if (existingPreviousPolicy) {
                    // Update the existing history policy row
                    await db.runningPolicyMediclaim.update(cleanedPreviousPolicy, {
                        where: { id: existingPreviousPolicy.id }, transaction: t
                    });
                } else {
                    // Create a new history policy row
                    await db.runningPolicyMediclaim.create(cleanedPreviousPolicy, { transaction: t });
                }
            } catch (previousPolicyError) {
                logger.error('Error updating previous policy:', previousPolicyError);
                // Continue with other updates even if previous policy fails
            }
        } else if (policyRadio !== "Renew") {
            logger.debug('ℹ️ [UPDATE MEDICLAIM] No meaningful previous policy data provided - skipping previous policy update.');
        }

        // Delete existing family members and employees
        await db.familyMember.destroy({ where: { mediclaim_id: id }, transaction: t });
        await db.employeeMediclaim.destroy({ where: { mediclaim_id: id }, transaction: t });

        // Save new family members if any
        if (familyMembers && familyMembers.length > 0) {
            const familyMemberPromises = familyMembers.map(member =>
                db.familyMember.create({
                    ...member,
                    mediclaim_id: id
                }, { transaction: t })
            );
            await Promise.all(familyMemberPromises);
        }

        // Save new employees if any
        if (employees && employees.length > 0) {
            const employeePromises = employees.map(employee =>
                db.employeeMediclaim.create({
                    ...employee,
                    mediclaim_id: id
                }, { transaction: t })
            );
            await Promise.all(employeePromises);
        }

        await t.commit(); // all writes succeeded — persist atomically
        t = null;

        // Reconcile on committed data (its own writes, outside the txn).
        try { await mediclaimService.reconcileMediclaimPolicies(id); } catch (e) { logger.error({ err: e }, "mediclaim reconcile after update failed"); }

        res.status(200).json({
            message: 'Mediclaim data updated successfully',
            status: true
        });
    } catch (error) {
        logger.error('Error in updateMediclaimUserData:', error);
        try { if (t && !t.finished) await t.rollback(); } catch (rbErr) { logger.error({ err: rbErr }, "mediclaim update rollback failed"); }
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
    
    logger.debug('🔍 [MEDICLAIM USER DATA API] User making request:', req.user);
    logger.debug('🔍 [MEDICLAIM USER DATA API] User Role:', req.user.Role);
    logger.debug('🔍 [MEDICLAIM USER DATA API] User ID:', req.user.id);
    logger.debug('🔍 [MEDICLAIM USER DATA API] User categoryIds:', req.user.categoryIds);

    // Show all mediclaim data for Super Admin OR users with mediclaim category access
    if (req.user.Role == ROLE_IDS.SUPER_ADMIN || req.user.categoryIds?.includes(CATEGORY_IDS.MEDICLAIM)) {
        // ADMIN ROLE - Fetch all mediclaim data
        Mediclaim.findAll({
            include: [{ model: MediclaimCompany }, { model: User }]
        })
            .then(async (mediclaimData) => {
                const mediclaimIds = mediclaimData.map((item) => item.id); // Extract mediclaim IDs
                logger.debug('🔍 [BACKEND] Admin/Mediclaim Category Role - Mediclaim IDs being searched:', mediclaimIds);
                const familyMembers = await FamilyMember.findAll({
                    where: { mediclaim_id: mediclaimIds },
                    raw: true,
                });
                const employees = await EmployeeMediclaim.findAll({
                    where: { mediclaim_id: mediclaimIds },
                    raw: true,
                });
                const runningPolicies = await RunningPolicies.findAll({
                    where: { mediclaim_id: mediclaimIds, is_current: true },
                    raw: true,
                });
                const previousPolicies = await PreviousPolicies.findAll({
                    where: { mediclaim_id: mediclaimIds, is_current: false },
                    raw: true,
                });
                logger.debug('🔍 [BACKEND] Admin/Mediclaim Category Role - Previous policies found:', previousPolicies.length);
                logger.debug('🔍 [BACKEND] Admin/Mediclaim Category Role - Previous policies data:', JSON.stringify(previousPolicies, null, 2));
                logger.debug(familyMembers)
                logger.debug(runningPolicies)

                // Step 3: Attach family members, employees to the corresponding mediclaim records
                const mediclaimWithFamily = mediclaimData.map((mediclaim) => {
                    const family = familyMembers.filter((member) => member.mediclaim_id === mediclaim.id);
                    const employeeList = employees.filter((member) => member.mediclaim_id === mediclaim.id);
                    const running = runningPolicies.filter((member) => member.mediclaim_id === mediclaim.id);
                    const previous = previousPolicies.filter((member) => member.mediclaim_id === mediclaim.id);
                    const filteredPrevious = previous.filter(hasMeaningfulPreviousPolicyData);
                    return {
                        ...mediclaim.get({ plain: true }), // Convert Sequelize instance to plain JSON
                        familymembers: family,
                        employees: employeeList,
                        runningPolicy: running.length ? running[0] : {},
                        previousPolicy: filteredPrevious.length ? filteredPrevious[0] : {},
                        previousPolicies: filteredPrevious // Return previous policies with real data
                    };
                });
                logger.debug('API response for mediclaim user data:', JSON.stringify(mediclaimWithFamily, null, 2));
                res.status(200).send({
                    message: "mediclaim get success",
                    data: mediclaimWithFamily,
                    status: true,
                });
            })
            .catch((e) => {
                res.status(400).send({ message: "role error", status: false });
                logger.debug(e);
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
                logger.debug('🔍 [BACKEND] User Role - Mediclaim IDs being searched:', mediclaimIds);
                const familyMembers = await FamilyMember.findAll({
                    where: { mediclaim_id: mediclaimIds },
                    raw: true,
                });
                const employees = await EmployeeMediclaim.findAll({
                    where: { mediclaim_id: mediclaimIds },
                    raw: true,
                });
                const runningPolicies = await RunningPolicies.findAll({
                    where: { mediclaim_id: mediclaimIds, is_current: true },
                    raw: true,
                });
                const previousPolicies = await PreviousPolicies.findAll({
                    where: { mediclaim_id: mediclaimIds, is_current: false },
                    raw: true,
                });
                logger.debug('🔍 [BACKEND] User Role - Previous policies found:', previousPolicies.length);
                logger.debug('🔍 [BACKEND] User Role - Previous policies data:', JSON.stringify(previousPolicies, null, 2));
                logger.debug(familyMembers)
                logger.debug(runningPolicies)

                // Step 3: Attach family members, employees to the corresponding mediclaim records
                const mediclaimWithFamily = mediclaimData.map((mediclaim) => {
                    const family = familyMembers.filter((member) => member.mediclaim_id === mediclaim.id);
                    const employeeList = employees.filter((member) => member.mediclaim_id === mediclaim.id);
                    const running = runningPolicies.filter((member) => member.mediclaim_id === mediclaim.id);
                    const previous = previousPolicies.filter((member) => member.mediclaim_id === mediclaim.id);
                    const filteredPrevious = previous.filter(hasMeaningfulPreviousPolicyData);
                    return {
                        ...mediclaim.get({ plain: true }), // Convert Sequelize instance to plain JSON
                        familymembers: family,
                        employees: employeeList,
                        runningPolicy: running.length ? running[0] : {},
                        previousPolicy: filteredPrevious.length ? filteredPrevious[0] : {},
                        previousPolicies: filteredPrevious // Return previous policies with real data
                    };
                });
                logger.debug('API response for mediclaim user data:', JSON.stringify(mediclaimWithFamily, null, 2));
                res.status(200).send({
                    message: "mediclaim get success",
                    data: mediclaimWithFamily,
                    status: true,
                });
            })
            .catch((e) => {
                res.status(400).send({ message: "role error", status: false });
                logger.debug(e);
            });
    }


};


exports.geteMediclaimUserRenewalData = async (req, res) => {

    try {
        let whereObj = {};

        if (req.user.Role !== ROLE_IDS.SUPER_ADMIN) {
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
        logger.debug(startDay, endOfDay)

        const [familyMembers, runningPolicies, previousPolicies] = await Promise.all([
            FamilyMember.findAll({ where: { mediclaim_id: mediclaimIds }, raw: true }),
            RunningPolicies.findAll({
                where: { mediclaim_id: mediclaimIds, is_current: true },
                raw: true
            }),
            PreviousPolicies.findAll({
                where: { mediclaim_id: mediclaimIds, is_current: false },
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
        logger.error("Error fetching mediclaim data:", error);
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
            logger.debug(e);
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
            logger.debug(e);
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
        logger.error('Error in getMediclaimConsumerData:', error);
        res.status(500).json({
            message: 'Error retrieving mediclaim data',
            error: error.message
        });
    }
};

// Blog Controller Functions
