/**
 * lifeInsurance controller — extracted from the legacy user.controller monolith.
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
            const uploadDir = path.join(CTRL_DIR, '../uploads/life-insurance');
            
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
        
        const uploadsDir = path.join(CTRL_DIR, "../../uploads/life-insurance");
        
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

        // Convert dates to proper format for DATEONLY field (YYYY-MM-DD strings)
        const startDateStr = new Date(startDate).toISOString().split('T')[0]; // YYYY-MM-DD
        const endDateStr = new Date(endDate).toISOString().split('T')[0]; // YYYY-MM-DD
        
        console.log('🔍 [LIFE INSURANCE RENEWAL] Date range strings:', { startDateStr, endDateStr });

        // Build base where clause for user filtering first
        let whereObj = {};

        // Apply user filtering based on role (similar to getAllLifeInsurance)
        if (req.user.Role !== 1 && !req.user.categoryIds?.includes(5)) {
            // USER ROLE WITHOUT LIFE INSURANCE CATEGORY ACCESS - Fetch life insurance data for assigned consumers only
            const findUserList = await consumerRoleMapping.findAll({
                where: {
                    user_role_id: req.user.id,
                    category_id: 5 // Life insurance category
                },
                raw: true,
                attributes: ["user_consumer_id"],
            });

            const userList = findUserList.map((item) => item.user_consumer_id);

            if (userList.length > 0) {
                whereObj.user_id = {
                    [Op.in]: userList,
                };
            } else {
                // If no consumers assigned, return empty result
                return res.status(200).json({
                    status: true,
                    data: [],
                    message: 'No life insurance renewal data found for the selected date range'
                });
            }
        }
        
        // Debug: Check total records
        const totalRecords = await LifeInsurance.count({ where: whereObj });
        console.log('🔍 [LIFE INSURANCE RENEWAL] Total records (after user filter):', totalRecords);
        
        // Fetch all records (with user filtering) and filter by date in memory
        // This allows us to handle NULL due_date_of_premium and use RCD as fallback
        const allLifeInsuranceData = await LifeInsurance.findAll({
            where: whereObj,
            order: [['id', 'DESC']]
        });
        
        console.log('🔍 [LIFE INSURANCE RENEWAL] Total records fetched:', allLifeInsuranceData.length);
        
        // Filter by date range - use due_date_of_premium, or RCD as fallback
        let lifeInsuranceData = allLifeInsuranceData.filter((policy) => {
            const dueDate = policy.due_date_of_premium;
            const rcd = policy.rcd;
            
            // If due_date_of_premium exists and is in range, include it
            if (dueDate) {
                const dueDateStr = new Date(dueDate).toISOString().split('T')[0];
                if (dueDateStr >= startDateStr && dueDateStr <= endDateStr) {
                    return true;
                }
            }
            
            // If no due_date_of_premium but RCD exists and is in range, include it as fallback
            if (!dueDate && rcd) {
                const rcdStr = new Date(rcd).toISOString().split('T')[0];
                if (rcdStr >= startDateStr && rcdStr <= endDateStr) {
                    return true;
                }
            }
            
            // Exclude records with neither date in range
            return false;
        });
        
        console.log('🔍 [LIFE INSURANCE RENEWAL] Records after date filtering:', lifeInsuranceData.length);
        
        // If no records match the date range, show all records as fallback
        // This helps users see what data exists even if dates don't match
        let showAllRecords = false;
        if (lifeInsuranceData.length === 0 && allLifeInsuranceData.length > 0) {
            console.log('⚠️ [LIFE INSURANCE RENEWAL] No records match date range, showing all records as fallback');
            lifeInsuranceData = allLifeInsuranceData;
            showAllRecords = true;
            
            // Log sample dates for debugging
            const sampleRecords = allLifeInsuranceData.slice(0, 5).map(r => ({
                id: r.id,
                due_date_of_premium: r.due_date_of_premium,
                rcd: r.rcd,
                proposer_name: r.proposer_name
            }));
            console.log('🔍 [LIFE INSURANCE RENEWAL] Sample records (first 5):', sampleRecords);
            console.log('🔍 [LIFE INSURANCE RENEWAL] Date range searched:', { startDateStr, endDateStr });
        }

        // Format data for renewal sheet
        const formattedData = lifeInsuranceData.map((policy, index) => ({
            sr_no: index + 1,
            due_date: policy.due_date_of_premium ? new Date(policy.due_date_of_premium).toISOString().split('T')[0] : 'Not Set',
            proposer_name: policy.proposer_name || '',
            mobile_number: policy.proposer_mobile_numbers || '',
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

        // Prepare response message
        let message = 'Life insurance renewal data fetched successfully';
        if (formattedData.length === 0) {
            if (allLifeInsuranceData.length === 0) {
                message = 'No life insurance records found. Please check user permissions or create life insurance policies.';
            } else {
                message = `No life insurance records found with due dates or RCD between ${startDateStr} and ${endDateStr}. Found ${allLifeInsuranceData.length} total record(s) but none match the date range.`;
            }
        } else if (showAllRecords) {
            message = `No records match the date range (${startDateStr} to ${endDateStr}). Showing all ${formattedData.length} record(s) instead.`;
        }
        
        res.status(200).json({
            status: true,
            data: formattedData,
            message: message,
            totalRecords: allLifeInsuranceData.length,
            filteredRecords: formattedData.length,
            showAllRecords: showAllRecords || false
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
