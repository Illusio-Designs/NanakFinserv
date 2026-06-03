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
        const uploadsDir = path.join(CTRL_DIR, "../../uploads");
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

        // Create previous policy if provided and has real data
        if (hasMeaningfulPreviousPolicyData(previousPolicy)) {
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
        } else {
            console.log('ℹ️ [PREVIOUS POLICY] No meaningful previous policy data provided - skipping creation.');
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
        const uploadsDir = path.join(CTRL_DIR, "../../uploads");
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
                const uploadsDir = path.join(CTRL_DIR, "../../uploads");
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
                const uploadsDir = path.join(CTRL_DIR, "../../uploads");
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
        if (policyRadio !== "Renew" && hasMeaningfulPreviousPolicyData(previousPolicy)) {
            try {
                // Check if previous policy exists for this mediclaim
                const existingPreviousPolicy = await db.previousPolicyMediclaim.findOne({
                    where: { mediclaim_id: id }
                });

                // Handle PdfFile upload if provided
                const uploadsDir = path.join(CTRL_DIR, "../../uploads");
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
        } else if (policyRadio !== "Renew") {
            console.log('ℹ️ [UPDATE MEDICLAIM] No meaningful previous policy data provided - skipping previous policy update.');
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
