const { ROLE_IDS, CATEGORY_IDS, DOCUMENT_IDS } = require("../../config/ids");
/**
 * vehicle controller — extracted from the legacy user.controller monolith.
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
  writeAudit,
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
  saveUpload,
  unit_category_list,
  userCatergory,
  uuidv4,
  vehcileRunningPolicy,
  vehicleUser,
  vehicle_document,
  vehicles,
  upsertConsumerDocument
} = require("../shared/context");
const vehicleService = require("./vehicle.service");
const vehicleValidator = require("./vehicle.validator");
const logger = require("../../config/logger");

exports.getAllVehicleInsUser = async (req, res) => {
    let whereObj = {};

    if (req.user.Role === ROLE_IDS.STAFF) {
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
            logger.debug(e);
        });
};


exports.addVehicleUserData = async (req, res) => {
    logger.debug('--- [addVehicleUserData] ---');
    logger.debug('req.user:', req.user);
    // Tracks a vehicle created mid-request so we can roll it back (delete the
    // orphan + its policies/docs) if a later step fails — keeps the add atomic.
    let createdVehicleId = null;
    logger.debug('req.headers:', req.headers);
    logger.debug('req.body:', req.body);
    logger.debug('req.files:', req.files);

    if (!req.user || !req.user.id) {
        logger.debug('Unauthorized: req.user is not defined.');
        return res.status(401).json({ error: 'Unauthorized: req.user is not defined. Check your token and authentication.' });
    }

    // Parse + normalize the request payload (JSON or multipart) in the service.
    const parsed = vehicleService.normalizePayload(req.body, req.headers['content-type']);
    if (parsed.error) {
        return res.status(400).json({ error: parsed.error });
    }
    let { Data, documentsData, runningPolicy, previousPolicy } = parsed;

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

logger.debug('🔧 [addVehicleUserData] Agent details extracted:', {
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

    // Field validation (universal validator). Required: Name, Mobile, Vehicle no.;
    // others format-checked only when present.
    const _vErrors = vehicleValidator.validateVehicleData({
        Name: _Name,
        MobileNumber: _MobileNumber,
        VehicleNumber: _VehicleNumber,
        Email: _Email,
        ContactPersonNo: _ContactPersonNo,
        ManufacturingYear: _ManufacturingYear,
        EngineNumber: _EngineNumber,
        ChassisNumber: _ChassisNumber,
        Make: _Make,
        Model: _Model,
    });
    if (_vErrors.length) {
        return res.status(400).json({ message: _vErrors.join("; "), status: false });
    }

    logger.debug('🔧 [addVehicleUserData] Extracted values:', {
        Name: _Name,
        Email: _Email,
        MobileNumber: _MobileNumber,
        EngineNumber: _EngineNumber,
        ChassisNumber: _ChassisNumber
    });
    logger.debug('runningPolicy before DB insert:', runningPolicy);
    logger.debug('previousPolicy before DB insert:', previousPolicy);

    if (!runningPolicy) {
        return res.status(400).json({ error: "runningPolicy is undefined before DB insert" });
    }
    if (_policyRadio !== "Fresh" && !previousPolicy) {
        return res.status(400).json({ error: "previousPolicy is undefined before DB insert" });
    }

    try {
        // Debug logging for validation
        logger.debug('🔍 [addVehicleUserData] Validation check:', {
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
            logger.debug('🔍 [addVehicleUserData] Checking engine number:', engineNumberToCheck);

            const existingEngineNumber = await vehicleUser.findOne({
                where: {
                    [Op.or]: [
                        { engine_number: engineNumberToCheck },
                        { engine_number: engineNumberToCheck.toUpperCase() },
                        { engine_number: engineNumberToCheck.toLowerCase() }
                    ]
                }
            });

            logger.debug('🔍 [addVehicleUserData] Existing engine number result:', existingEngineNumber);

            if (existingEngineNumber) {
                logger.debug('❌ [addVehicleUserData] Engine number already exists:', engineNumberToCheck);
                engineNumberExists = true;
                errorMessages.push("engine number");
            }
        }

        if (_ChassisNumber && _ChassisNumber.trim() !== '') {
            const chassisNumberToCheck = _ChassisNumber.trim();
            logger.debug('🔍 [addVehicleUserData] Checking chassis number:', chassisNumberToCheck);

            const existingChassisNumber = await vehicleUser.findOne({
                where: {
                    [Op.or]: [
                        { chassis_number: chassisNumberToCheck },
                        { chassis_number: chassisNumberToCheck.toUpperCase() },
                        { chassis_number: chassisNumberToCheck.toLowerCase() }
                    ]
                }
            });

            logger.debug('🔍 [addVehicleUserData] Existing chassis number result:', existingChassisNumber);

            if (existingChassisNumber) {
                logger.debug('❌ [addVehicleUserData] Chassis number already exists:', chassisNumberToCheck);
                chassisNumberExists = true;
                errorMessages.push("chassis number");
            }
        }

        // Check for duplicate vehicle number
        if (_VehicleNumber && _VehicleNumber.trim() !== '') {
            const vehicleNumberToCheck = _VehicleNumber.trim();
            logger.debug('🔍 [addVehicleUserData] Checking vehicle number:', vehicleNumberToCheck);

            const existingVehicleNumber = await vehicleUser.findOne({
                where: {
                    [Op.or]: [
                        { vehicle_number: vehicleNumberToCheck },
                        { vehicle_number: vehicleNumberToCheck.toUpperCase() },
                        { vehicle_number: vehicleNumberToCheck.toLowerCase() }
                    ]
                }
            });

            logger.debug('🔍 [addVehicleUserData] Existing vehicle number result:', existingVehicleNumber);

            if (existingVehicleNumber) {
                logger.debug('❌ [addVehicleUserData] Vehicle number already exists:', vehicleNumberToCheck);
                vehicleNumberExists = true;
                errorMessages.push("vehicle number");
            }
        }

        // Return combined error message if any duplicates found
        if (errorMessages.length > 0) {
            const message = errorMessages.length === 1
                ? `This ${errorMessages[0]} already exists`
                : `This ${errorMessages.join(" and ")} already exist`;

            logger.debug('❌ [addVehicleUserData] Validation failed:', message);
            return res.status(400).json({
                message: message,
                status: false
            });
        }

        logger.debug('✅ [addVehicleUserData] Validation passed, proceeding with user check/creation');

        // Check if user with this mobile number already exists
        let userData = await User.findOne({
            where: { mobileNumber: _MobileNumber }
        });

        if (userData) {
            logger.debug('🔍 [addVehicleUserData] User found with mobile number:', _MobileNumber, 'User ID:', userData.user_id);

            // Link to a household head if one was passed and not already linked
            // (lets a vehicle policy be added for a specific family member).
            if (req.body.head_user_id && !userData.family_head_id && userData.user_id !== req.body.head_user_id) {
                await User.update(
                    { family_head_id: req.body.head_user_id },
                    { where: { user_id: userData.user_id } }
                );
            }

            // Check if user is already assigned to vehicle category
            const existingMapping = await consumerRoleMapping.findOne({
                where: {
                    user_consumer_id: userData.user_id,
                    category_id: CATEGORY_IDS.VEHICLE
                }
            });

            if (!existingMapping) {
                // User exists but not assigned to vehicle category, add the mapping
                logger.debug('🔍 [addVehicleUserData] Adding user to vehicle category');
                await consumerRoleMapping.create({
                    user_role_id: req.user.id,
                    user_consumer_id: userData.user_id,
                    category_id: CATEGORY_IDS.VEHICLE,
                });
            }
        } else {
            logger.debug('🔍 [addVehicleUserData] User not found, creating new user');

            // Create new user
            userData = await User.create({
                username: _Name,
                email: _Email,
                mobileNumber: _MobileNumber,
                role_id: ROLE_IDS.CONSUMER, // All users should be consumers
                otp: "",
                token: "",
                created_by: req.user.id,
                updated_by: req.user.id,
                // If this policy is for a family member, link to the household head.
                family_head_id: req.body.head_user_id || null,
            });

            if (!userData) {
                return res.status(400).json({ message: "User creation failed", status: false });
            }

            // Create role mapping for new user
            await consumerRoleMapping.create({
                user_role_id: req.user.id,
                user_consumer_id: userData.user_id,
                category_id: CATEGORY_IDS.VEHICLE,
            });
        }

        if (userData && userData.user_id) {
            logger.debug('🔧 [addVehicleUserData] Saving to database:', {
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
            createdVehicleId = vehicle.vehicle_user_id; // for rollback on later failure

            const uploadsDir = path.join(CTRL_DIR, "../../uploads");

            // Handle standard documents (aadhar, pan, gst, rcbook)
            const standardDocuments = [
                { fieldName: 'aadhar', categoryId: DOCUMENT_IDS.AADHAR },
                { fieldName: 'pan', categoryId: DOCUMENT_IDS.PAN },
                { fieldName: 'gst', categoryId: DOCUMENT_IDS.GST },
                { fieldName: 'rcbook', categoryId: DOCUMENT_IDS.RC_BOOK }
            ];

            // KYC docs (Aadhar/PAN/GST) belong to the CONSUMER — stored once and
            // reused across policies/verticals. RC Book is vehicle-specific.
            const KYC_DOC_IDS = [DOCUMENT_IDS.AADHAR, DOCUMENT_IDS.PAN, DOCUMENT_IDS.GST];

            for (const doc of standardDocuments) {
                if (req.files && req.files[doc.fieldName]) {
                    const fileObj = req.files[doc.fieldName];
                    const isKyc = KYC_DOC_IDS.includes(doc.categoryId);
                    const uniqueName = await saveUpload(fileObj, isKyc ? "consumer-kyc" : "vehicle");

                    if (isKyc) {
                        // Consumer-level KYC: store/replace once on the consumer.
                        await upsertConsumerDocument(userData.user_id, doc.categoryId, uniqueName);
                        logger.debug(`[VehicleUserCreate] ${doc.fieldName} saved as CONSUMER document for user_id: ${userData.user_id}`);
                    } else {
                        // Vehicle-specific (RC Book): per policy.
                        await vehicle_document.create({
                            user_id: userData.user_id,
                            vehicle_user_id: vehicle.vehicle_user_id,
                            categoryId: doc.categoryId,
                            file: uniqueName
                        });
                        logger.debug(`[VehicleUserCreate] ${doc.fieldName} document saved for vehicle_user_id: ${vehicle.vehicle_user_id}`);
                    }
                }
            }

            // Handle custom documents
            if (documentsData && Array.isArray(documentsData)) {
                for (const doc of documentsData) {
                    logger.debug('[VehicleUserCreate] Processing custom document:', doc);
                    const fieldName = doc.fileFieldName; // e.g., "custom_0", "custom_1"
                    if (req.files && req.files[fieldName]) {
                        const fileObj = req.files[fieldName];
                        const uniqueName = await saveUpload(fileObj, "vehicle");

                        // Save document record to database
                        await vehicle_document.create({
                            user_id: userData.user_id,
                            vehicle_user_id: vehicle.vehicle_user_id,
                            categoryId: doc.categoryId,
                            file: uniqueName
                        });
                        logger.debug(`[VehicleUserCreate] Custom document ${fieldName} saved for vehicle_user_id: ${vehicle.vehicle_user_id}`);
                    }
                }
            }

            logger.debug('🔍 [CREATE] req.files keys:', Object.keys(req.files || {}));
            logger.debug('🔍 [CREATE] CurrentPolicyFile exists:', !!(req.files && req.files.CurrentPolicyFile));
            if (req.files && req.files.CurrentPolicyFile) {
                runningPolicy.CurrentPolicyFile = await saveUpload(req.files.CurrentPolicyFile, "vehicle");
                logger.debug(`📁 [CREATE] CurrentPolicyFile saved: ${runningPolicy.CurrentPolicyFile}`);
            }

            // Resolve company name to company_id for running policy
            let resolvedRunningCompanyId = runningPolicy.CompanyId || null;
            if (!resolvedRunningCompanyId && runningPolicy.CompanyName) {
                logger.debug('🔍 [CREATE] Resolving running policy company name to ID:', runningPolicy.CompanyName);
                const runningCompanyRecord = await companyType.findOne({
                    where: { company_name: runningPolicy.CompanyName }
                });
                if (runningCompanyRecord) {
                    resolvedRunningCompanyId = runningCompanyRecord.company_id;
                    logger.debug('✅ [CREATE] Resolved running policy company name to ID:', resolvedRunningCompanyId);
                } else {
                    logger.debug('⚠️ [CREATE] Running policy company not found for name:', runningPolicy.CompanyName);
                }
            }

            // Use only the safe runningPolicy variable here!
            // Derive running-policy status from expiry (OD/Full first) vs today.
            const _runEnd =
                runningPolicy.od_expiry_date ||
                runningPolicy.ExpiryDate ||
                runningPolicy.PolicyTo;
            const _runStatus = (() => {
                if (!_runEnd) return "running";
                const end = new Date(_runEnd);
                if (isNaN(end.getTime())) return "running";
                return end >= new Date() ? "running" : "completed";
            })();

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
                status: _runStatus,
            };
            await vehcileRunningPolicy.create(runningPolicyData);

            if (req.files && req.files.PreviousCurrentPolicyFile) {
                previousPolicy.CurrentPolicyFile = await saveUpload(req.files.PreviousCurrentPolicyFile, "vehicle");
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
                        logger.debug('🔍 [CREATE] Resolving previous policy company name to ID:', previousPolicy.CompanyName);
                        const previousCompanyRecord = await companyType.findOne({
                            where: { company_name: previousPolicy.CompanyName }
                        });
                        if (previousCompanyRecord) {
                            resolvedPreviousCompanyId = previousCompanyRecord.company_id;
                            logger.debug('✅ [CREATE] Resolved previous policy company name to ID:', resolvedPreviousCompanyId);
                        } else {
                            logger.debug('⚠️ [CREATE] Previous policy company not found for name:', previousPolicy.CompanyName);
                        }
                    }
    
                    // Resolve previous policy type id (if policy type name provided)
                    let resolvedPreviousPolicyTypeId = previousPolicy.PolicyTypeId || null;
                    if (!resolvedPreviousPolicyTypeId && previousPolicy.PolicyType) {
                        logger.debug('🔍 [CREATE] Resolving previous policy type name to ID:', previousPolicy.PolicyType);
                        const previousPolicyTypeRecord = await db.policyType.findOne({
                            where: { policy_type_name: previousPolicy.PolicyType }
                        });
                        if (previousPolicyTypeRecord) {
                            resolvedPreviousPolicyTypeId = previousPolicyTypeRecord.policy_type_id;
                            logger.debug('✅ [CREATE] Resolved previous policy type name to ID:', resolvedPreviousPolicyTypeId);
                        } else {
                            logger.debug('⚠️ [CREATE] Previous policy type not found for name:', previousPolicy.PolicyType);
                        }
                    }
    
                    // Resolve previous policy plan id (if policy plan name provided)
                    let resolvedPreviousPolicyPlanId = previousPolicy.PolicyPlanTypeId || null;
                    if (!resolvedPreviousPolicyPlanId && previousPolicy.PolicyPlanType) {
                        logger.debug('🔍 [CREATE] Resolving previous policy plan name to ID:', previousPolicy.PolicyPlanType);
                        const previousPolicyPlanRecord = await db.policyPlan.findOne({
                            where: { policy_name: previousPolicy.PolicyPlanType }
                        });
                        if (previousPolicyPlanRecord) {
                            resolvedPreviousPolicyPlanId = previousPolicyPlanRecord.policy_plan_id;
                            logger.debug('✅ [CREATE] Resolved previous policy plan name to ID:', resolvedPreviousPolicyPlanId);
                        } else {
                            logger.debug('⚠️ [CREATE] Previous policy plan not found for name:', previousPolicy.PolicyPlanType);
                        }
                    }
    
                    // Derive status from the policy's expiry vs today: "running"
                    // while still within the period, "completed" once expired.
                    // Prefer OD/Full expiry, then generic expiry/PolicyTo.
                    const _prevEnd =
                        previousPolicy.od_expiry_date ||
                        previousPolicy.ExpiryDate ||
                        previousPolicy.PolicyTo ||
                        previousPolicy.expiry_date;
                    const _prevStatus = (() => {
                        if (!_prevEnd) return "running";
                        const end = new Date(_prevEnd);
                        if (isNaN(end.getTime())) return "running";
                        return end >= new Date() ? "running" : "completed";
                    })();

                    // Build history data

                    const historyData = {
                        vehicle_user_id: vehicle.vehicle_user_id,
                        ...previousPolicy,
                        policy_type_id: resolvedPreviousPolicyTypeId,
                        company_id: resolvedPreviousCompanyId,
                        policy_plan_id: resolvedPreviousPolicyPlanId,
                        PolicyNumber: previousPolicy.PolicyNumber || null,
                        issue_date: previousPolicy.issue_date || null,
                        expiry_date: previousPolicy.expiry_date || null,
                        status: _prevStatus,
                        agentName: previousPolicy.agentName || _AgentName || '',
                        agentCode: previousPolicy.agentCode || _AgentCode || '',
                        agentContactNumber: previousPolicy.agentContactNumber || _AgentContactNumber || '',
                        Vendor: previousPolicy.Vendor || null,
                        PolicyIssuedDate: previousPolicy.PolicyIssuedDate || null,
                       
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
                    alreadyExists = await vehcileRunningPolicy.findOne({ where: { ...duplicateWhere, is_current: false } });
                } else {
                    // fallback - check any previous policy for this vehicle_user_id (conservative)
                    alreadyExists = await vehcileRunningPolicy.findOne({ where: { vehicle_user_id: vehicle.vehicle_user_id, is_current: false } });
                }

                if (!alreadyExists) {
                    logger.debug("🧾 [CREATE] Inserting previous policy:", historyData);
                    await vehcileRunningPolicy.create({ ...historyData, is_current: false });
                    insertedPreviousPolicy = true;
                } else {
                    logger.debug("⚠️ [CREATE] Skipping previous policy insert because a matching previous policy already exists:", alreadyExists && alreadyExists.previous_policy_id ? alreadyExists.previous_policy_id : alreadyExists);
                }
            } else {
                if (_policyRadio !== "Fresh") {
                    logger.debug('⚠️ [CREATE] Skipping previous policy insert — no valid data found to insert.');
                } else {
                    logger.debug('ℹ️ [CREATE] Policy is Fresh — no previous policy insertion required.');
                }
            }
            // -------------------------------------------------------------------------------

            // Fetch all related data for complete response
            const createdVehicleUser = await vehicleUser.findByPk(vehicle.vehicle_user_id);
            const createdRunningPolicy = await vehcileRunningPolicy.findOne({
                where: { vehicle_user_id: vehicle.vehicle_user_id, is_current: true },
                include: [
                    { model: companyType, as: 'CompanyType' },
                    { model: db.policyPlan, as: 'policyPlan', attributes: [['policy_name', 'PolicyPlanType']] },
                    { model: db.policyType, as: 'policyType', attributes: [['policy_type_name', 'PolicyTypeName']] }
                ]
            });
            const previousPolicies = await vehcileRunningPolicy.findAll({
                where: { vehicle_user_id: vehicle.vehicle_user_id, is_current: false },
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

            // Auto-organize the policy timeline (archive extra running, recompute
            // running/completed by date) so records stay consistent year-by-year.
            try { await vehicleService.reconcileVehiclePolicies(vehicle.vehicle_user_id); } catch (e) { logger.error({ err: e }, "reconcile after add failed"); }

            writeAudit(req, { action: "created", entity: "vehicle", entity_id: vehicle.vehicle_user_id, summary: `Added vehicle ${_VehicleNumber || ""} for ${_Name || ""}`, metadata: { nature: _policyRadio, vehicle_number: _VehicleNumber } });

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
        logger.error('❌ [addVehicleUserData] Error:', error);

        // Roll back a partially-created vehicle so a failure never leaves an orphan
        // vehicle without its policies/documents.
        if (createdVehicleId) {
            try {
                await vehcileRunningPolicy.destroy({ where: { vehicle_user_id: createdVehicleId } });
                await vehicle_document.destroy({ where: { vehicle_user_id: createdVehicleId } });
                await vehicleUser.destroy({ where: { vehicle_user_id: createdVehicleId } });
                logger.warn(`[addVehicleUserData] Rolled back partial vehicle ${createdVehicleId}`);
            } catch (cleanupErr) { logger.error({ err: cleanupErr }, "vehicle rollback cleanup failed"); }
        }

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
    logger.debug('[VehicleUserUpdate] Incoming request:', {
        params: req.params,
        user: req.user && req.user.id,
        hasData: !!req?.body?.data,
        hasFiles: !!req.files
    });

    const parsed = vehicleService.parseUpdatePayload(req.body, req.headers['content-type']);
    if (parsed.error) {
        return res.status(400).json({ error: parsed.error });
    }
    let { Data } = parsed;
    // --- Log the parsed data keys only (not full data for privacy) ---
    logger.debug('[VehicleUserUpdate] Parsed data keys:', Object.keys(Data));
    logger.debug('🔧 [updateVehicleUserData] All Policy Fields received:', {
        policy_type: Data.policy_type,           // Fresh/Renewal/Portability → vehicle_policy_type
        type: Data.type,                         // Individual/Corporate → nominee_type
        policy_plan_type: Data.policy_plan_type, // COMPREHENSIVE/SAOD/THIRD PARTY → policy_plan_type
        policyRadio: Data.policyRadio,           // Alternative field name
        Type: Data.Type,                         // Alternative field name
        PolicyType: Data.PolicyType              // Alternative field name
    });
    
    logger.debug('🔧 [updateVehicleUserData] Agent Fields received:', {
        agent_name: Data.agent_name,
        agent_code: Data.agent_code,
        agent_contact_number: Data.agent_contact_number
    });
    
    logger.debug('🔧 [updateVehicleUserData] RunningPolicy Fields received:', {
        PremiumAmount: Data.runningPolicy?.PremiumAmount,
        PolicyTenure: Data.runningPolicy?.PolicyTenure,
        NomineeAge: Data.runningPolicy?.NomineeAge,
        PolicyNumber: Data.runningPolicy?.PolicyNumber,
        PolicyFrom: Data.runningPolicy?.PolicyFrom,
        PolicyTo: Data.runningPolicy?.PolicyTo
    });
    logger.debug('🔧 [updateVehicleUserData] Full Data object keys:', Object.keys(Data));

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
    logger.debug('🔍 [updateVehicleUserData] Name/Email/Mobile fields received:', {
        Name: Name,
        Email: Email,
        MobileNumber: MobileNumber
    });

    let t = null; // transaction handle (declared here so the catch can roll back)
    try {
        let resolvedUserId = user_id;
        if (!resolvedUserId) {
            const tempUser = await vehicleUser.findByPk(req.params.vehicle_user_id);
            if (tempUser && tempUser.user_id) {
                resolvedUserId = tempUser.user_id;
            }
        }
        if (!resolvedUserId) {
            logger.warn('[VehicleUserUpdate] User ID not provided and could not be resolved');
            return res.status(400).json({ error: "User ID not provided" });
        }
        
        // Debug logging for resolvedUserId after it's defined
        logger.debug('🔍 [updateVehicleUserData] resolvedUserId:', resolvedUserId);
        if (!req.params.vehicle_user_id) {
            logger.warn('[VehicleUserUpdate] Vehicle user ID not provided');
            return res.status(400).json({ error: "Vehicle user ID not provided" });
        }
        // Fetch the vehicle user record before using it
        const vehicleUserRecord = await vehicleUser.findByPk(req.params.vehicle_user_id);
        if (!vehicleUserRecord) {
            logger.warn('[VehicleUserUpdate] Vehicle not found with ID:', req.params.vehicle_user_id);
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
        logger.debug('[VehicleUserUpdate] Updating vehicleUser with:', vehicleUserUpdateObj);
        
        // Debug logging for validation
        logger.debug('🔍 [updateVehicleUserData] Validation check:', {
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
            logger.debug('🔍 [updateVehicleUserData] Checking engine number:', engineNumberToCheck);
            
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
            
            logger.debug('🔍 [updateVehicleUserData] Existing engine number result:', existingEngineNumber);
            
            if (existingEngineNumber) {
                logger.debug('❌ [updateVehicleUserData] Engine number already exists:', engineNumberToCheck);
                engineNumberExists = true;
                errorMessages.push("engine number");
            }
        }

        if (chassis_number && chassis_number.trim() !== '') {
            const chassisNumberToCheck = chassis_number.trim();
            logger.debug('🔍 [updateVehicleUserData] Checking chassis number:', chassisNumberToCheck);
            
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
            
            logger.debug('🔍 [updateVehicleUserData] Existing chassis number result:', existingChassisNumber);
            
            if (existingChassisNumber) {
                logger.debug('❌ [updateVehicleUserData] Chassis number already exists:', chassisNumberToCheck);
                chassisNumberExists = true;
                errorMessages.push("chassis number");
            }
        }

        // Check for duplicate vehicle number (excluding current record)
        if (vehicle_number && vehicle_number.trim() !== '') {
            const vehicleNumberToCheck = vehicle_number.trim();
            logger.debug('🔍 [updateVehicleUserData] Checking vehicle number:', vehicleNumberToCheck);
            
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
            
            logger.debug('🔍 [updateVehicleUserData] Existing vehicle number result:', existingVehicleNumber);
            
            if (existingVehicleNumber) {
                logger.debug('❌ [updateVehicleUserData] Vehicle number already exists:', vehicleNumberToCheck);
                vehicleNumberExists = true;
                errorMessages.push("vehicle number");
            }
        }

        // Return combined error message if any duplicates found
        if (errorMessages.length > 0) {
            const message = errorMessages.length === 1 
                ? `This ${errorMessages[0]} already exists`
                : `This ${errorMessages.join(" and ")} already exist`;
            
            logger.debug('❌ [updateVehicleUserData] Validation failed:', message);
            return res.status(400).json({ 
                message: message, 
                status: false 
            });
        }

        logger.debug('✅ [updateVehicleUserData] Validation passed, proceeding with update');

        // Atomic: all writes below (user + vehicle + policy archive/update + docs +
        // reconcile) commit together. Validation/dup-check early-returns above happen
        // before this, so there's no dangling transaction.
        t = await vehicleUser.sequelize.transaction();

        // First, update the User table with basic user information
        if (Name || Email || MobileNumber) {
            try {
                const userUpdateData = {};
                if (Name) userUpdateData.username = Name;
                if (Email) userUpdateData.email = Email;
                if (MobileNumber) userUpdateData.mobileNumber = MobileNumber;
                
                logger.debug('🔍 [updateVehicleUserData] Updating User table with:', userUpdateData);
                logger.debug('🔍 [updateVehicleUserData] User ID to update:', resolvedUserId);
                
                const userUpdateResult = await User.update(userUpdateData, {
                    where: { user_id: resolvedUserId },
                    transaction: t
                });
                logger.debug('✅ [updateVehicleUserData] User table updated:', userUpdateResult);
            } catch (userUpdateError) {
                logger.error('❌ [updateVehicleUserData] Error updating User table:', userUpdateError);
            }
        } else {
            logger.debug('🔍 [updateVehicleUserData] No Name/Email/Mobile fields to update in User table');
        }

        logger.debug('🚗 [updateVehicleUserData] Database fields to update:', {
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
        }, { transaction: t });
        logger.debug('[VehicleUserUpdate] vehicleUser update successful for ID:', req.params.vehicle_user_id);

        // --- RENEWAL FLOW: Transfer Running Policy to Previous Policy FIRST (before updating running policy) ---
        // Accept either field name (policy_type or policyRadio) so the running
        // policy is always archived to history on renewal/portability.
        const _nature = policy_type || Data.policyRadio;
        const isRenewalOrPortability = _nature === 'Renewal' || _nature === 'Portability';
        if (isRenewalOrPortability && runningPolicy && typeof runningPolicy === 'object') {
            logger.debug('🔄 [RENEWAL] Starting renewal process - transferring current running policy to previous');
            
            // Fetch the CURRENT running policy before we overwrite it
            const currentRunningPolicy = await vehcileRunningPolicy.findOne({
                where: { vehicle_user_id: req.params.vehicle_user_id, is_current: true },
                include: [
                    { model: companyType, as: 'CompanyType' },
                    { model: db.policyPlan, as: 'policyPlan' },
                    { model: db.policyType, as: 'policyType' }
                ],
                transaction: t
            });
            
            if (currentRunningPolicy) {
                logger.debug('🔄 [RENEWAL] Found current running policy to transfer:', {
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
                
                // Mark all existing history policies as inactive (reconcile recomputes status after)
                await vehcileRunningPolicy.update({
                    status: "notActive",
                }, {
                    where: { vehicle_user_id: req.params.vehicle_user_id, is_current: false },
                    transaction: t
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
                
                logger.debug('🔄 [RENEWAL] Transferring policy with company_id:', currentRunningPolicy.company_id);

                // Guard against duplicate history rows. Re-saving a "Renewal" record
                // must NOT keep re-archiving the same policy. A genuine year-over-year
                // renewal differs by period, so only an EXACT match (same number +
                // same From/To) is treated as an already-archived duplicate.
                const existingHistory = await vehcileRunningPolicy.findOne({
                    where: {
                        vehicle_user_id: req.params.vehicle_user_id,
                        is_current: false,
                        PolicyNumber: transferredPolicy.PolicyNumber || null,
                        PolicyFrom: transferredPolicy.PolicyFrom || null,
                        PolicyTo: transferredPolicy.PolicyTo || null,
                    },
                    transaction: t,
                });

                if (existingHistory) {
                    logger.debug('⚠️ [RENEWAL] Skipping transfer — identical previous policy already archived:', existingHistory.id);
                } else {
                    const createdPreviousPolicy = await vehcileRunningPolicy.create({ ...transferredPolicy, is_current: false }, { transaction: t });
                    logger.debug('✅ [RENEWAL] Successfully transferred running policy to previous policy');
                    logger.debug('🔄 [RENEWAL] Created previous policy with ID:', createdPreviousPolicy.id, 'company_id:', createdPreviousPolicy.company_id);
                }
            } else {
                logger.debug('⚠️ [RENEWAL] No existing running policy found to transfer');
            }
        }

        // --- Running Policy Update ---
        if (runningPolicy && typeof runningPolicy === 'object') {
            const uploadsDir = path.join(CTRL_DIR, "../../uploads");
            let findPolicy = await vehcileRunningPolicy.findOne({
                where: { vehicle_user_id: req.params.vehicle_user_id, is_current: true },
                transaction: t
            });
            
            // Resolve company name to company_id if CompanyName is provided
            let resolvedCompanyId = runningPolicy.company_id || runningPolicy.CompanyId || Data.company_id || null;
            if (!resolvedCompanyId && (runningPolicy.CompanyName || company_name)) {
                const companyNameToLookup = runningPolicy.CompanyName || company_name;
                logger.debug('🔍 [RENEWAL] Resolving company name to ID:', companyNameToLookup);
                const companyRecord = await companyType.findOne({
                    where: { company_name: companyNameToLookup }
                });
                if (companyRecord) {
                    resolvedCompanyId = companyRecord.company_id;
                    logger.debug('✅ [RENEWAL] Resolved company name to ID:', resolvedCompanyId);
                } else {
                    logger.debug('⚠️ [RENEWAL] Company not found for name:', companyNameToLookup);
                }
            }
            logger.debug('🔍 [UPDATE] req.files keys:', Object.keys(req.files || {}));
            logger.debug('🔍 [UPDATE] CurrentPolicyFile exists:', !!(req.files && req.files.CurrentPolicyFile));
            if (req.files && req.files.CurrentPolicyFile) {
                // Delete old file if it exists
                if (findPolicy?.CurrentPolicyFile) {
                    const oldFilePath = path.join(uploadsDir, findPolicy.CurrentPolicyFile);
                    if (fsSync.existsSync(oldFilePath)) {
                        fsSync.unlinkSync(oldFilePath);
                        logger.debug(`📁 [UPDATE] Deleted old CurrentPolicyFile: ${findPolicy.CurrentPolicyFile}`);
                    }
                }
                runningPolicy.CurrentPolicyFile = await saveUpload(req.files.CurrentPolicyFile, "vehicle");
                logger.debug(`📁 [UPDATE] CurrentPolicyFile saved: ${runningPolicy.CurrentPolicyFile}`);
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
            logger.debug('[VehicleUserUpdate] RunningPolicy update object:', runningPolicyData);
            if (findPolicy) {
                await vehcileRunningPolicy.update(runningPolicyData, { where: { vehicle_user_id: req.params.vehicle_user_id, is_current: true }, transaction: t });
                logger.debug('[VehicleUserUpdate] RunningPolicy updated for vehicle_user_id:', req.params.vehicle_user_id);
            } else {
                runningPolicyData.vehicle_user_id = req.params.vehicle_user_id;
                runningPolicyData.is_current = true;
                await vehcileRunningPolicy.create(runningPolicyData, { transaction: t });
                logger.debug('[VehicleUserUpdate] RunningPolicy created for vehicle_user_id:', req.params.vehicle_user_id);
            }
        }
        // --- Previous Policy Update (for Portability when user manually enters previous policy data) ---
        // Note: Renewal flow is already handled above, so skip this for Renewal
        if (previousPolicy && typeof previousPolicy === 'object' && policy_type === 'Portability') {
            logger.debug('🔄 [PORTABILITY] Handling manually entered previous policy data');
            
            // Check if previous policy has actual data (not empty object)
            const hasPreviousPolicyData = previousPolicy.PolicyNumber || previousPolicy.CompanyName || 
                                         previousPolicy.PolicyFrom || previousPolicy.PolicyTo;
            
            if (hasPreviousPolicyData) {
                // Mark existing history policies as inactive (reconcile recomputes status after)
                await vehcileRunningPolicy.update({
                    status: "notActive",
                }, {
                    where: { vehicle_user_id: req.params.vehicle_user_id, is_current: false },
                    transaction: t
                });
                
                if (req.files && req.files.PreviousCurrentPolicyFile) {
                    previousPolicy.CurrentPolicyFile = await saveUpload(req.files.PreviousCurrentPolicyFile, "vehicle");
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

                await vehcileRunningPolicy.create({ ...historyData, is_current: false }, { transaction: t });
                logger.debug('✅ [PORTABILITY] PreviousPolicy created for vehicle_user_id:', req.params.vehicle_user_id);
            } else {
                logger.debug('⚠️ [PORTABILITY] No previous policy data provided, skipping');
            }
        }
        logger.debug('[VehicleUserUpdate] Update process completed successfully for vehicle_user_id:', req.params.vehicle_user_id);
        
        // --- Document Upload Handling (aadhar, pan, gst, custom) ---
        const uploadsDir = path.join(CTRL_DIR, "../../uploads");
        
        // Handle standard documents (aadhar, pan, gst, rcbook)
        const standardDocuments = [
            { fieldName: 'aadhar', categoryId: DOCUMENT_IDS.AADHAR },
            { fieldName: 'pan', categoryId: DOCUMENT_IDS.PAN },
            { fieldName: 'gst', categoryId: DOCUMENT_IDS.GST },
            { fieldName: 'rcbook', categoryId: DOCUMENT_IDS.RC_BOOK }
        ];
        
        for (const doc of standardDocuments) {
            if (req.files && req.files[doc.fieldName]) {
                const fileObj = req.files[doc.fieldName];
                const isKyc = [DOCUMENT_IDS.AADHAR, DOCUMENT_IDS.PAN, DOCUMENT_IDS.GST].includes(doc.categoryId);
                const uniqueName = await saveUpload(fileObj, isKyc ? "consumer-kyc" : "vehicle");

                // Delete old document for this categoryId/vehicle_user_id
                await vehicle_document.destroy({
                    where: {
                        vehicle_user_id: req.params.vehicle_user_id,
                        categoryId: doc.categoryId
                    },
                    transaction: t
                });

                // Create new document record
                await vehicle_document.create({
                    user_id: resolvedUserId,
                    vehicle_user_id: req.params.vehicle_user_id,
                    categoryId: doc.categoryId,
                    file: uniqueName
                }, { transaction: t });
                logger.debug(`[VehicleUserUpdate] ${doc.fieldName} document saved for vehicle_user_id: ${req.params.vehicle_user_id}`);
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
                    const uniqueName = await saveUpload(fileObj, "vehicle");

                    // Create custom document record
                    await vehicle_document.create({
                        user_id: resolvedUserId,
                        vehicle_user_id: req.params.vehicle_user_id,
                        categoryId: doc.categoryId,
                        file: uniqueName
                    }, { transaction: t });
                    logger.debug(`[VehicleUserUpdate] Custom document ${fieldName} saved for vehicle_user_id: ${req.params.vehicle_user_id}`);
                }
            }
        }
        // Reconcile the timeline, then fetch the final state — all within the tx.
        try { await vehicleService.reconcileVehiclePolicies(req.params.vehicle_user_id, { transaction: t }); } catch (e) { logger.error({ err: e }, "reconcile after update failed"); }
        // --- Fetch all related data for full response ---
        const updatedVehicleUser = await vehicleUser.findByPk(req.params.vehicle_user_id, { transaction: t });
        const runningPolicyData = await vehcileRunningPolicy.findOne({
            where: { vehicle_user_id: req.params.vehicle_user_id, is_current: true },
            include: [
                { model: companyType, as: 'CompanyType' },
                { model: db.policyPlan, as: 'policyPlan', attributes: [['policy_name', 'PolicyPlanType']] },
                { model: db.policyType, as: 'policyType', attributes: [['policy_type_name', 'PolicyTypeName']] }
            ],
            transaction: t
        });
        const previousPolicies = await vehcileRunningPolicy.findAll({
            where: { vehicle_user_id: req.params.vehicle_user_id, is_current: false },
            include: [
                { model: companyType, as: 'CompanyType' },
                { model: db.policyPlan, as: 'policyPlan', attributes: [['policy_name', 'PolicyPlanType']] },
                { model: db.policyType, as: 'policyType', attributes: [['policy_type_name', 'PolicyTypeName']] }
            ],
            transaction: t
        });
        // Activity log: record the policy update/renewal.
        try {
          const isRenew = (policy_type === "Renewal" || policy_type === "Portability");
          await createNotification({
            title: isRenew ? "Vehicle policy renewed" : "Vehicle policy updated",
            message: `${updatedVehicleUser?.vehicle_number || "Vehicle"} ${isRenew ? "renewed" : "updated"}`,
            type: "vehicle",
            category: isRenew ? "renewal" : "status_update",
            user_id: req.user && req.user.id,
            target_user_id: (updatedVehicleUser && updatedVehicleUser.user_id) || null,
          });
        } catch (e) { logger.error({ err: e }, "vehicle update log failed"); }
        const vehicleDocuments = await vehicle_document.findAll({ where: { vehicle_user_id: req.params.vehicle_user_id }, transaction: t });
        await t.commit(); // all writes succeeded — persist atomically
        writeAudit(req, { action: (policy_type === "Renewal" || policy_type === "Portability") ? "renewed" : "updated", entity: "vehicle", entity_id: req.params.vehicle_user_id, summary: `${(policy_type === "Renewal" || policy_type === "Portability") ? "Renewed" : "Updated"} vehicle ${updatedVehicleUser?.vehicle_number || ""}` });
        return res.status(200).send({
            message: "Vehicle successfully updated!",
            status: true,
            vehicleUser: updatedVehicleUser,
            runningPolicy: runningPolicyData,
            previousPolicies: previousPolicies,
            documents: vehicleDocuments
        });
    } catch (error) {
        try { if (t && !t.finished) await t.rollback(); } catch (rbErr) { logger.error({ err: rbErr }, "update rollback failed"); }
        logger.error("[VehicleUserUpdate] Error updating vehicle user data:", error);
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

    logger.debug('🔍 [getVehicleUserData] User info:', {
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
                
                logger.debug('🔍 [getVehicleUserData] Found vehicle data count:', vehicleData.length);
                
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
                    where: { vehicle_user_id: vehicleIds, is_current: true },
                    include: [
                        { model: companyType, as: 'CompanyType' },  // Use correct alias 'CompanyType'
                        { model: db.policyPlan, as: 'policyPlan', attributes: [['policy_name', 'PolicyPlanType']] },
                        { model: db.policyType, as: 'policyType', attributes: [['policy_type_name', 'PolicyTypeName']] }
                    ]
                    // remove raw: true
                });
                const previousPolicies = await vehcileRunningPolicy.findAll({
                    where: { vehicle_user_id: vehicleIds, is_current: false },
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
                
                logger.debug(documnets_user)
                logger.debug('Fetched runningPolicies:', JSON.stringify(runningPoliciesPlain, null, 2));

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
                logger.debug('🔍 [getVehicleUserData] Error:', e);
                logger.debug('🔍 [getVehicleUserData] Error Message:', e.message);
                logger.debug('🔍 [getVehicleUserData] Error Stack:', e.stack);
                res.status(400).send({ 
                    message: "Error fetching vehicle data", 
                    error: e.message,
                    status: false 
                });
            });


};

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
          role_id: [ROLE_IDS.CONSUMER, ROLE_IDS.BUILDER_CONSUMER],
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
  
        // Check category presence by stable id (seeded name is "Vehicle", not
        // "Vehicle Insurance" — the old name check skipped everyone).
        const hasMediclaim = crList.some((m) => m.category_id === CATEGORY_IDS.MEDICLAIM);
        const hasVehicle = crList.some((m) => m.category_id === CATEGORY_IDS.VEHICLE);
        if (!hasVehicle) {
            logger.debug("Skipping Non-Vehicle User:", user.username);
            continue;
          }
        // ❌ Remove ONLY if Mediclaim exists AND Vehicle DOES NOT exist
        if (hasMediclaim && !hasVehicle) {
          logger.debug("Skipping Mediclaim-only user:", user.username);
          continue;
        }
  
        // ✔ Only vehicle category records
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
              model: vehcileRunningPolicy,
              as: "previousPolicies",
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
  
      logger.debug(`✅ Total vehicle records found: ${allVehicleRecords.length}`);
  
      res.status(200).json({
        message: "Vehicle Insurance consumer get success",
        data: allVehicleRecords,
        status: true,
      });
    } catch (error) {
      logger.error("❌ Error in getVehicleUserRenewalData:", error);
      res.status(500).json({
        message: "Server error while fetching Vehicle Insurance users",
        error: error.message,
        status: false,
      });
    }
  };
  
  


exports.updateVehicleUserRemarkData = async (req, res) => {
    try {
        const user = await vehicleService.updateRemark(
            req.params.vehicle_user_id,
            req.body.remark
        );

        if (!user) {
            return res.status(404).json({ error: "Vehicle not found" });
        }

        return res.status(200).send({
            message: "Vehicle remark successfully updated!",
            status: true,
            userData: user,
        });
    } catch (error) {
        logger.error({ err: error }, "updateVehicleUserRemarkData failed");
        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.map((err) => err.message);
            return res.status(400).json({ errors });
        }
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

// Get Vehicle Renewal Statistics

exports.getVehicleRenewalStats = async (req, res) => {
    try {
        logger.debug('📊 getVehicleRenewalStats: Fetching statistics');

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

        logger.debug('📊 getVehicleRenewalStats: Total vehicle records:', vehicleData.length);

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

        logger.debug('📊 getVehicleRenewalStats: Statistics calculated:', stats);

        return res.status(200).send({
            success: true,
            message: "Vehicle renewal statistics retrieved successfully.",
            data: stats
        });

    } catch (error) {
        logger.error("💥 Error fetching vehicle renewal statistics:", error);
        return res.status(500).send({ 
            success: false, 
            message: "Internal server error.",
            error: error.message 
        });
    }
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
                    model: vehcileRunningPolicy,
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
        logger.error("Error fetching vehicle renewal data:", error);
        return res.status(500).send({ success: false, message: "Internal server error." });
    }
};

exports.getVehicleUserById = async (req, res) => {
    logger.debug('🔍 [getVehicleUserById] Function called!');
    logger.debug('🔍 [getVehicleUserById] Request params:', req.params);
    logger.debug('🔍 [getVehicleUserById] Request headers:', req.headers);
    logger.debug('🔍 [getVehicleUserById] Request method:', req.method);
    logger.debug('🔍 [getVehicleUserById] Request URL:', req.url);
    
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
                { model: vehcileRunningPolicy, as: "previousPolicies" }
            ]
        });
        if (!vehicle) {
            return res.status(404).json({ message: "Vehicle user not found" });
        }
        
        // Fetch vehicle documents with comprehensive debugging
        logger.debug('🔍 [getVehicleUserById] Fetching documents for vehicle_user_id:', req.params.vehicle_user_id);
        
        // First, let's check if there are ANY documents in the vehicle_documents table
        const totalDocumentsCount = await vehicle_document.count();
        logger.debug('🔍 [getVehicleUserById] Total documents in vehicle_documents table:', totalDocumentsCount);
        
        // Check if there are documents for this specific vehicle_user_id
        const documentsForThisVehicle = await vehicle_document.count({ 
            where: { vehicle_user_id: req.params.vehicle_user_id } 
        });
        logger.debug('🔍 [getVehicleUserById] Documents count for this vehicle_user_id:', documentsForThisVehicle);
        
        const vehicleDocuments = await vehicle_document.findAll({ 
            where: { vehicle_user_id: req.params.vehicle_user_id } 
        });
        
        logger.debug('🔍 [getVehicleUserById] Raw vehicle_document query result:', vehicleDocuments);
        logger.debug('🔍 [getVehicleUserById] Number of documents found:', vehicleDocuments.length);
        
        // Log each document individually
        vehicleDocuments.forEach((doc, index) => {
            logger.debug(`🔍 [getVehicleUserById] Document ${index + 1}:`, {
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
        logger.debug('🔍 [getVehicleUserById] Final vehicle data structure:', {
            vehicle_user_id: vehicleData.vehicle_user_id,
            documents_count: vehicleData.documents.length,
            documents: vehicleData.documents
        });
        logger.debug('🔍 [getVehicleUserById] Agent fields:', {
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
        logger.error('Error saving document:', error);
        return null;
    }
};


// Create Life Insurance Policy

// Manually close a vehicle's current policy (used when the consumer won't renew
// an overdue policy). Sets status = "closed", which reconcile always preserves.
exports.closeVehiclePolicy = async (req, res) => {
  try {
    const { vehicle_user_id } = req.body;
    if (!vehicle_user_id) {
      return res.status(400).json({ status: false, message: "vehicle_user_id is required" });
    }

    const current = await vehcileRunningPolicy.findOne({ where: { vehicle_user_id, is_current: true } });
    if (!current) {
      return res.status(404).json({ status: false, message: "No current policy found for this vehicle" });
    }

    await current.update({ status: "closed" });

    writeAudit(req, {
      action: "closed",
      entity: "vehicle_policy",
      entity_id: vehicle_user_id,
      summary: `Closed vehicle policy ${current.PolicyNumber || ""}`.trim(),
    });

    return res.status(200).json({ status: true, message: "Policy closed" });
  } catch (error) {
    logger.error({ err: error }, "closeVehiclePolicy failed");
    return res.status(500).json({ status: false, message: "Could not close policy", error: error.message });
  }
};

exports.renewVehiclePolicy = async (req, res) => {
  try {
    const { vehicle_user_id } = req.body;

    if (!vehicle_user_id) {
      return res.status(400).json({ status: false, message: "vehicle_user_id is required" });
    }

    // 🔍 Find the running policy record for this vehicle
    const runningRecord = await vehcileRunningPolicy.findOne({ where: { vehicle_user_id, is_current: true } });
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
      existingPrev = await vehcileRunningPolicy.findOne({
        where: {
          vehicle_user_id,
          PolicyNumber: previousPayload.PolicyNumber,
          is_current: false,
        },
      });
    }

    if (!existingPrev && previousPayload.CurrentPolicyFile) {
      existingPrev = await vehcileRunningPolicy.findOne({
        where: {
          vehicle_user_id,
          CurrentPolicyFile: previousPayload.CurrentPolicyFile,
          is_current: false,
        },
      });
    }

    let createdPrev;
    if (existingPrev) {
      logger.debug("⚠️ Existing previous policy found — updating instead of creating new.");
      createdPrev = await existingPrev.update({ ...previousPayload, is_current: false });
    } else {
      createdPrev = await vehcileRunningPolicy.create({ ...previousPayload, is_current: false });
      logger.debug("✅ Previous policy created:", createdPrev.PolicyNumber);
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

    try { await vehicleService.reconcileVehiclePolicies(vehicle_user_id); } catch (e) { logger.error({ err: e }, "reconcile after renew failed"); }

    // Notify the consumer that their policy was renewed.
    try {
      const veh = await vehicleUser.findOne({ where: { vehicle_user_id } });
      await createNotification({
        title: "Policy renewed",
        message: "Your vehicle policy has been renewed.",
        type: "vehicle",
        category: "renewal",
        user_id: req.user && req.user.id,
        target_user_id: (veh && veh.user_id) || null,
      });
    } catch (e) { logger.error({ err: e }, "renew notification failed"); }

    return res.status(200).json({
      status: true,
      message: "Policy renewed successfully — running policy moved to previous",
      previousPolicy: createdPrev,
    });
  } catch (error) {
    logger.error("❌ [RENEW VEHICLE POLICY] Error:", error);
    return res.status(500).json({
      status: false,
      message: "Error renewing policy",
      error: error.message,
    });
  }
};

// Get all consumer data (vehicles, mediclaim, loans) for logged-in consumer
