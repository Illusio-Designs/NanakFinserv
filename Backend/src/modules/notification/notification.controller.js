/**
 * notification controller — extracted from the legacy user.controller monolith.
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

exports.getNotifications = async (req, res) => {
    try {
      const { page = 1, limit = 10, type, is_read } = req.query;
      const offset = (page - 1) * limit;
  
      let whereClause = {};
  
      if (type) {
        whereClause.type = type;
      }
  
      if (is_read !== undefined) {
        whereClause.is_read = is_read === "true";
      }
  
      const notifications = await db.notification.findAndCountAll({
        where: whereClause,
        order: [["created_at", "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });
  
      // Map your category IDs to proper names
      const categoryMap = {
        2: "Loan",
        4: "Mediclaim",
        5: "Life Insurance",
        6: "Vehicle Insurance",
        8: "Builder",
      };
  
      const formattedNotifications = notifications.rows.map((n) => {
        let categoryName = null;
  
        try {
          const meta = JSON.parse(n.metadata || "{}");
  
          if (meta.categories && meta.categories.length > 0) {
            const categoryId = meta.categories[0].category_id;
            categoryName = categoryMap[categoryId] || null;
          }
        } catch (err) {
          console.log("Metadata parse error:", err);
        }
  
        return {
          ...n.dataValues,
          category_name: categoryName,
        };
      });
  
      res.status(200).json({
        message: "Notifications retrieved successfully",
        status: true,
        data: {
          notifications: formattedNotifications,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(notifications.count / limit),
            totalItems: notifications.count,
            itemsPerPage: parseInt(limit),
          },
        },
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({
        message: "Error fetching notifications",
        status: false,
        error: error.message,
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


