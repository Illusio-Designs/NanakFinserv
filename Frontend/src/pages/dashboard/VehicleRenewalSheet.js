import React, { useEffect, useState, useCallback } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { useNavigate } from "react-router-dom";
//import { getVehicleUserRenewalData, updateVehicleUserRemarkData, updateVehicleUserData } from '../../serviceAPI/userAPI';
import {
  getVehicleUserRenewalData,
  updateVehicleUserRemarkData,
  updateVehicleUserData,
  getVehicleUserById,
  getAllPolicyPlans,
  getAllPolicyTypes,
  renewVehiclePolicy,
} from "../../serviceAPI/userAPI";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import Button from "../../components/common/Button";
import Table from "../../components/common/Table";
import StatCard from "../../components/common/StatCard";
import Modal from "../../components/common/Modal";
import "../../styles/pages/dashboard/Consumer.css";
import { FiEye } from "react-icons/fi";
// Removed VehicleRenewalDetailsPopup and implemented inline ViewModalContent similar to mediclaim
import EditVehiclePopup from "../../components/EditVehiclePopup";
import config from "../../config/apiConfig";

const VehicleRenewalSheet = () => {
  const [data, setData] = useState([]);
  const navigate = useNavigate();
  const [filteredData, setFilteredData] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [remark, setRemark] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage] = useState(25);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
  const [renewalItem, setRenewalItem] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null); // 'expired', 'running', 'week', 'month', 'year', null
  const [loading, setLoading] = useState(false);
  const [policyPlans, setPolicyPlans] = useState([]);
  const [policyTypes, setPolicyTypes] = useState([]);

  // Helper to load policy plans and types
  const fetchPolicyLookups = async () => {
    try {
      const plansRes = await getAllPolicyPlans();
      if (plansRes && plansRes.data) setPolicyPlans(plansRes.data);
    } catch (e) {
      console.error("Failed to load policy plans", e);
    }
    try {
      const typesRes = await getAllPolicyTypes();
      if (typesRes && typesRes.data) setPolicyTypes(typesRes.data);
    } catch (e) {
      console.error("Failed to load policy types", e);
    }
  };

  const isWithinDateRange = (dateStr, fromDate, toDate) => {
    if (!fromDate || !toDate) return true;
    if (!dateStr) return false;
    const start = new Date(new Date(fromDate).setHours(0, 0, 0, 0));
    const end = new Date(new Date(toDate).setHours(23, 59, 59, 999));
    const d = new Date(dateStr);
    if (isNaN(d)) return false;
    return d >= start && d <= end;
  };

  // Wrap fetchRenewalData in useCallback
  const fetchRenewalData = useCallback(async () => {
    setLoading(true);
    try {
      const consumerData = await getVehicleUserRenewalData({
        startDate,
        endDate,
      });
      let renewalData = Array.isArray(consumerData?.data)
        ? consumerData.data
        : [];

      // Robust sort by ExpiryDate (newest first)
      renewalData = renewalData.sort((a, b) => {
        const parseDate = (d) => {
          if (!d) return new Date(0);
          const parts = d.split("/");
          if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            if (
              !isNaN(day) &&
              !isNaN(month) &&
              !isNaN(year) &&
              year > 1900 &&
              year < 2100
            ) {
              return new Date(year, month, day);
            }
          }
          const dateObj = new Date(d);
          return isNaN(dateObj.getTime()) ? new Date(0) : dateObj;
        };
        const dateA = parseDate(a.runningPolicy?.ExpiryDate);
        const dateB = parseDate(b.runningPolicy?.ExpiryDate);
        return dateB - dateA;
      });

      setData(renewalData);

      const byDate = renewalData.filter((item) => {
        const date =
          item?.runningPolicy?.ExpiryDate ||
          item?.runningPolicy?.PolicyIssuedDate ||
          item?.createdAt ||
          "";
        return isWithinDateRange(date, startDate, endDate);
      });

      setFilteredData(byDate);
    } catch (error) {
      console.error("💥 [FRONTEND] Error in fetchRenewalData:", error);
      console.error("💥 [FRONTEND] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      toast.error("An error occurred while fetching vehicle renewal data");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  // Only run on mount or when startDate/endDate changes
  useEffect(() => {
    fetchRenewalData();
    fetchPolicyLookups();
  }, [fetchRenewalData]);

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    let filtered = data.filter((item) => {
      const user = item.user_pk_vehicle_id || {};
      const runningPolicy = item.runningPolicy || {};
      return (
        Object.values(user).some((val) =>
          String(val).toLowerCase().includes(lowercasedFilter)
        ) ||
        Object.values(runningPolicy).some((val) =>
          String(val).toLowerCase().includes(lowercasedFilter)
        ) ||
        String(item.vehicle_number || "")
          .toLowerCase()
          .includes(lowercasedFilter) ||
        String(item.make || "")
          .toLowerCase()
          .includes(lowercasedFilter) ||
        String(item.model || "")
          .toLowerCase()
          .includes(lowercasedFilter)
      );
    });

    // Apply active filter from card clicks
    if (activeFilter) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const oneMonthFromNow = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        now.getDate()
      );
      const oneYearFromNow = new Date(
        now.getFullYear() + 1,
        now.getMonth(),
        now.getDate()
      );

      filtered = filtered.filter((item) => {
        const runningPolicy = item.runningPolicy || {};
        const vehicleRecord = item.vehicleRecords?.[0] || {};

        // Consider multiple possible expiry sources (ExpiryDate, PolicyTo, nested vehicleRecord)
        const expiryRaw =
          runningPolicy?.ExpiryDate ||
          runningPolicy?.PolicyTo ||
          vehicleRecord?.runningPolicy?.ExpiryDate ||
          vehicleRecord?.runningPolicy?.PolicyTo ||
          "";

        if (!expiryRaw) return false;

        // Parse expiry date robustly (DD/MM/YYYY or ISO-like)
        const parseDate = (d) => {
          if (!d) return null;
          if (typeof d === "string" && d.includes("/")) {
            const parts = d.split("/").map(Number);
            if (parts.length === 3 && parts.every((p) => !isNaN(p))) {
              const [day, month, year] = parts;
              if (year > 1900 && year < 2100)
                return new Date(year, month - 1, day);
            }
          }
          const dateObj = new Date(d);
          return isNaN(dateObj.getTime()) ? null : dateObj;
        };

        const expiryDate = parseDate(expiryRaw);
        if (!expiryDate) return false;

        switch (activeFilter) {
          case "expired":
            return expiryDate < now;
          case "running":
            return expiryDate >= now;
          case "week":
            return expiryDate >= now && expiryDate <= oneWeekFromNow;
          case "month":
            return expiryDate >= now && expiryDate <= oneMonthFromNow;
          case "year":
            return expiryDate >= now && expiryDate <= oneYearFromNow;
          default:
            return true;
        }
      });
    }

    setFilteredData(filtered);
  }, [searchTerm, data, activeFilter]);

  const handleSearch = () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates.");
      return;
    }
    localStorage.setItem("vehicleRenewalStartDate", startDate);
    localStorage.setItem("vehicleRenewalEndDate", endDate);
    fetchRenewalData();
  };

  const handleClearDateFilter = () => {
    setStartDate("");
    setEndDate("");
    localStorage.removeItem("vehicleRenewalStartDate");
    localStorage.removeItem("vehicleRenewalEndDate");
    fetchRenewalData();
  };

  const handleCardClick = (filterType) => {
    // Toggle filter: if same card clicked, clear filter; otherwise set new filter
    setActiveFilter(activeFilter === filterType ? null : filterType);
  };

  const handleRemarkSave = async (vehicle_user_id) => {
    try {
      const response = await updateVehicleUserRemarkData(
        { remark },
        vehicle_user_id
      );
      if (response && response.status) {
        toast.success("Remark updated successfully!");
        // Update the data arrays
        setData((prev) =>
          prev.map((item) =>
            item.vehicle_user_id === vehicle_user_id
              ? { ...item, remark }
              : item
          )
        );
        setFilteredData((prev) =>
          prev.map((item) =>
            item.vehicle_user_id === vehicle_user_id
              ? { ...item, remark }
              : item
          )
        );
        setEditIndex(null);
        setRemark("");
      } else {
        toast.error(response?.message || "Failed to update remark.");
      }
    } catch (error) {
      toast.error("An error occurred while saving the remark.");
      console.error("Remark save error:", error);
    }
  };

  // const handleViewDetails = (item) => {
  //     setSelectedItem(item);
  //     setIsViewModalOpen(true);
  // };

  const handleViewDetails = async (item) => {
    console.log("👁️ [VIEW] Opening details for item:", item);

    // Extract vehicle_user_id safely
    const vehicleUserId =
      item.vehicleRecords?.[0]?.vehicle_user_id || item.vehicle_user_id;

    if (vehicleUserId) {
      try {
        // Fetch complete data from API
        const fullData = await getVehicleUserById(vehicleUserId);

        if (fullData) {
          console.log("✅ [VIEW] Full data fetched:", fullData);

          // Use the complete data which has proper structure
          setSelectedItem(fullData);
        } else {
          // Fallback to item data if API fails
          console.warn("⚠️ [VIEW] API returned empty, using item data");
          setSelectedItem(item);
        }
      } catch (error) {
        console.error("❌ [VIEW] Failed to fetch full data:", error);
        // Fallback to item data on error
        setSelectedItem(item);
      }
    } else {
      // No vehicle_user_id found, use item as-is
      console.warn("⚠️ [VIEW] No vehicle_user_id found, using item data");
      setSelectedItem(item);
    }

    setIsViewModalOpen(true);
  };
  const handleEditRemark = (currentRemark, index) => {
    setRemark(currentRemark);
    setEditIndex(index);
  };

  const handleCancelEdit = () => {
    setEditIndex(null);
    setRemark("");
  };

  const handleCloseModals = () => {
    setIsViewModalOpen(false);
    setIsRenewalModalOpen(false);
    setSelectedItem(null);
    setRenewalItem(null);
  };

  // const handleRenewal = (item) => {
  //     // Map the renewal sheet data structure to the format expected by VehicleInsurance
  //     const user = item.user_pk_vehicle_id || {};
  //     const runningPolicy = item.runningPolicy || {};
  //     const reference = item.reference || {};

  //     console.log('🔄 [RENEWAL SHEET] Starting renewal process for:', item);

  //     // ✅ Step 1: Move current running policy to previous policy
  //     const previousPolicy = {
  //         PolicyNumber: runningPolicy.PolicyNumber || '',
  //         CompanyName: item.company_name || '',
  //         PolicyFrom: runningPolicy.PolicyFrom || '',
  //         PolicyTo: runningPolicy.PolicyTo || '',
  //         PolicyIssuedDate: runningPolicy.PolicyIssuedDate || '',
  //         PolicyExpiryDate: runningPolicy.PolicyTo || runningPolicy.ExpiryDate || '',
  //         PolicyTenure: runningPolicy.PolicyTenure || '',
  //         PremiumAmount: runningPolicy.PremiumAmount || '',
  //         IDV: runningPolicy.IDV || '',
  //         NCB: runningPolicy.NCB || '',
  //         NomineeName: runningPolicy.NomineeName || '',
  //         NomineeRelation: runningPolicy.NomineeRelation || '',
  //         NomineeDob: runningPolicy.NomineeDob || '',
  //         NomineeAge: runningPolicy.NomineeAge || '',
  //         PdfFile: runningPolicy.CurrentPolicyFile || '',
  //         PdfFileName: runningPolicy.CurrentPolicyFile || '',
  //     };

  //     console.log('🔄 [RENEWAL SHEET] Previous policy (from current running):', previousPolicy);

  //     // ✅ Step 2: Reset running policy for new entry
  //     const resetRunningPolicy = {
  //         PolicyNumber: '',
  //         PolicyIssuedDate: '',
  //         PolicyExpiryDate: '',
  //         PolicyTenure: '',
  //         From: '',
  //         To: '',
  //         PremiumAmount: '',
  //         NCB: '',
  //         IDV: '',
  //         NomineeName: '',
  //         NomineeRelation: '',
  //         NomineeAge: '',
  //         NomineeDob: '',
  //         Vendor: '',
  //         CurrentPolicyFile: '',
  //     };

  //     console.log('🔄 [RENEWAL SHEET] Reset running policy for new entry');

  //     const mappedData = {
  //         // Basic vehicle info (preserve)
  //         vehicle_user_id: item.vehicle_user_id,
  //         VehicleNumber: item.vehicle_number || '',
  //         Make: item.make || '',
  //         Model: item.model || '',
  //         ManufacturingYear: item.manufacturing_year || '',
  //         EngineNumber: item.engine_number || '',
  //         ChassisNumber: item.chassis_number || '',
  //         VehicleType: item.vehicle_type || '',

  //         // User info (preserve)
  //         Name: user.username || '',
  //         Email: user.email || '',
  //         MobileNumber: user.mobileNumber || '',

  //         // Contact info (preserve)
  //         ContactPersonName: item.contact_person_name || '',
  //         ContactPersonMobileNumber: item.contact_person_no || '',

  //         // ✅ Clear company name for new policy
  //         CompanyName: '',

  //         // Policy info - Set to Renewal
  //         vehicle_policy_type: 'Renewal',
  //         nominee_type: item.nominee_type || 'Individual',
  //         policy_plan_type: item.policy_plan_type || '',
  //         status: item.status || 'interested',

  //         // Set radio button values
  //         Type: item.nominee_type || 'Individual',
  //         policyRadio: 'Renewal', // ✅ Force Renewal

  //         // Reference (preserve)
  //         reference_id: reference.reference_id || null,
  //         Reference: reference.reference_name || '',

  //         // ✅ Reset running policy (empty for new entry)
  //         runningPolicy: resetRunningPolicy,

  //         // ✅ Clear all running policy fields at top-level
  //         PolicyNumber: '',
  //         PolicyIssuedDate: '',
  //         From: '',
  //         To: '',
  //         PremiumAmount: '',
  //         NCB: '',
  //         IDV: '',
  //         PolicyTenure: '',
  //         NomineeName: '',
  //         NomineeRelation: '',
  //         NomineeDob: '',
  //         NomineeAge: '',
  //         Vendor: '',
  //         CurrentPolicyFile: '',
  //         RunningPolicyFileName: '',

  //         // Agent details (preserve)
  //         AgentName: runningPolicy.AgentName || runningPolicy.agent_name || item.agentName || item.agent_name || '',
  //         AgentContactNumber: runningPolicy.AgentContactNumber || runningPolicy.agent_contact_number || item.agentContactNumber || item.agent_contact_number || '',
  //         AgentCode: runningPolicy.AgentCode || runningPolicy.agent_code || item.agentCode || item.agent_code || '',

  //         // ✅ Previous policy (moved from current running)
  //         previousPolicy: previousPolicy,

  //         // Documents (preserve)
  //         documents: item.documents || [],

  //         // Document filenames (preserve)
  //         AadharFileName: (() => {
  //             const aadharDoc = item.documents?.find(doc => doc.categoryId === 1);
  //             return aadharDoc ? aadharDoc.file : '';
  //         })(),
  //         PanFileName: (() => {
  //             const panDoc = item.documents?.find(doc => doc.categoryId === 2);
  //             return panDoc ? panDoc.file : '';
  //         })(),
  //         GstFileName: (() => {
  //             const gstDoc = item.documents?.find(doc => doc.categoryId === 3);
  //             return gstDoc ? gstDoc.file : '';
  //         })(),
  //         RcBookFileName: (() => {
  //             const rcbookDoc = item.documents?.find(doc => doc.categoryId === 4);
  //             return rcbookDoc ? rcbookDoc.file : '';
  //         })(),

  //         // Additional fields
  //         remark: item.remark || '',
  //         consumer_role_id: item.consumer_role_id || '',
  //         user_pk_vehicle_id: user,
  //         reference: reference,
  //     };

  //     console.log('🔄 [RENEWAL SHEET] Final mapped data for renewal:', {
  //         previousPolicy: mappedData.previousPolicy,
  //         runningPolicy: mappedData.runningPolicy,
  //         policyRadio: mappedData.policyRadio,
  //         CompanyName: mappedData.CompanyName
  //     });

  //     // Redirect flow: store data and navigate to vehicle insurance page
  //     try {
  //         localStorage.setItem('isVehicleRenew', 'true');
  //         localStorage.setItem('vehicleRenewalData', JSON.stringify(mappedData));
  //         console.log('🔄 [RENEWAL SHEET] Data stored, navigating to vehicle insurance page');
  //     } catch (e) {
  //         console.error('Failed to store vehicle renewal data in localStorage', e);
  //         toast.error('Failed to prepare renewal data. Please try again.');
  //         return;
  //     }
  //     navigate('/vehicle-insurance', { state: mappedData });

  // };

  // const handleRenewal = async (item) => {
  //   console.log('🔄 [RENEWAL SHEET] Starting renewal process for:', item);

  //   const originalData = item.originalData || item;
  //   console.log('🔍 [RENEWAL SHEET] Using originalData:', originalData);

  //   // Extract vehicle_user_id safely - check both locations
  //   const vehicleUserId =
  //     originalData.vehicleRecords?.[0]?.vehicle_user_id ||
  //     originalData.vehicle_user_id;
  //   console.log('🔍 [RENEWAL SHEET] Vehicle user ID:', vehicleUserId);

  //   let completeUserData = originalData;

  //   // Helper to safely get value or fallback to empty string
  //   const getValue = (obj, ...keys) => {
  //     for (let key of keys) {
  //       if (obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key];
  //     }
  //     return '';
  //   };

  //   // Nominee age calculation
  //   const calculateNomineeAge = (dob) => {
  //     if (!dob) return '';
  //     const dobDate = new Date(dob);
  //     const today = new Date();
  //     let age = today.getFullYear() - dobDate.getFullYear();
  //     const monthDiff = today.getMonth() - dobDate.getMonth();
  //     if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) age--;
  //     return age;
  //   };

  //   // If vehicle_user_id exists, fetch full vehicle data
  //   if (vehicleUserId) {
  //     try {
  //       const fullData = await getVehicleUserById(vehicleUserId);

  //       if (fullData) {
  //         console.log('🔍 [RENEWAL] Full data received:', fullData);
  //         console.log('🔍 [RENEWAL] Running policy:', fullData.runningPolicy);
  //         console.log('🔍 [RENEWAL] Previous policies array:', fullData.previousPolicies);
  //         console.log('🔍 [RENEWAL] Previous policy object:', fullData.previousPolicy);

  //         // ✅ SAME AS HANDLE EDIT: Get running policy (current active policy)
  //         const runningPolicy = fullData.runningPolicy || {};

  //         // ✅ SAME AS HANDLE EDIT: Get previous policy from previousPolicies array
  //         // This is the actual OLD previous policy, not the current running one
  //         const previousPolicy =
  //           (Array.isArray(fullData.previousPolicies)
  //             ? fullData.previousPolicies
  //                 .filter(p => p.status !== 'active')
  //                 .sort((a, b) => new Date(b.PolicyTo) - new Date(a.PolicyTo))[0]
  //             : null) || fullData.previousPolicy || {};

  //         console.log('✅ [RENEWAL] Previous policy (from array):', previousPolicy);
  //         console.log('✅ [RENEWAL] Running policy (current active):', runningPolicy);

  //         const documents = fullData.documents || fullData.vehicle_documents || [];

  //         // Helper to find document by multiple ids or names
  //         const findDoc = (ids) => documents.find(doc => ids.includes(doc.categoryId || doc.category_id || doc.documentType));

  //         completeUserData = {
  //           ...fullData,
  //           runningPolicy: runningPolicy, // ✅ Keep current running policy
  //           previousPolicy: previousPolicy, // ✅ Keep actual previous policy from array
  //           documents,
  //           AadharFileName: getValue(findDoc([1, '1', 'Aadhar', 'AADHAR']), 'file', ''),
  //           PanFileName: getValue(findDoc([2, '2', 'Pan', 'PAN']), 'file', ''),
  //           GstFileName: getValue(findDoc([3, '3', 'Gst', 'GST']), 'file', ''),
  //           RcBookFileName: getValue(findDoc([4, '4', 'RCBook', 'RC_BOOK']), 'file', ''),
  //         };
  //       }
  //     } catch (error) {
  //       console.error('❌ [RENEWAL] Failed to fetch vehicle user data:', error);
  //       completeUserData = originalData;
  //     }
  //   } else {
  //     console.warn('⚠️ [RENEWAL] No vehicle_user_id found, using originalData.');
  //   }

  //   // Build final form data - SAME AS HANDLE EDIT
  //   const user = completeUserData.user_pk_vehicle_id || {};
  //   const runningPolicy = completeUserData.runningPolicy || {};
  //   const previousPolicy = completeUserData.previousPolicy || {};
  //   const reference = completeUserData.reference || {};

  //   const mappedData = {
  //     // Consumer info
  //     Name: getValue(completeUserData, 'Name', 'name', 'username', user.username),
  //     Email: getValue(completeUserData, 'Email', 'email', user.email),
  //     MobileNumber: getValue(completeUserData, 'MobileNumber', 'mobile_number', 'mobileNumber', user.mobileNumber),
  //     ContactPersonName: getValue(completeUserData, 'contact_person_name'),
  //     ContactPersonMobileNumber: getValue(completeUserData, 'contact_person_no'),
  //     Type: getValue(completeUserData, 'nominee_type', 'Type', 'Individual'),

  //     // Vehicle info
  //     VehicleType: getValue(completeUserData, 'vehicle_type'),
  //     VehicleNumber: getValue(completeUserData, 'vehicle_number'),
  //     Make: getValue(completeUserData, 'make'),
  //     Model: getValue(completeUserData, 'model'),
  //     ManufacturingYear: getValue(completeUserData, 'manufacturing_year'),
  //     EngineNumber: getValue(completeUserData, 'engine_number'),
  //     ChassisNumber: getValue(completeUserData, 'chassis_number'),

  //     // ✅ RUNNING POLICY: Keep current active policy data (same as handleEdit)
  //     PolicyNumber: runningPolicy.PolicyNumber || '',
  //     PolicyIssuedDate: runningPolicy.PolicyIssuedDate || '',
  //     PolicyExpiryDate: runningPolicy.PolicyTo || runningPolicy.ExpiryDate || runningPolicy.PolicyExpiryDate || '',
  //     PolicyTenure: runningPolicy.PolicyTenure || '',
  //     PremiumAmount: runningPolicy.PremiumAmount || '',
  //     NCB: runningPolicy.NCB || '',
  //     IDV: runningPolicy.IDV || '',
  //     From: runningPolicy.PolicyFrom || '',
  //     To: runningPolicy.PolicyTo || '',

  //     CompanyName: runningPolicy.CompanyType?.company_name || completeUserData.company_name || '',
  //     Vendor: runningPolicy.Vendor || completeUserData.vendor || '',

  //     // Policy type settings - Set to Renewal
  //     policyRadio: 'Renewal',
  //     vehicle_policy_type: 'Renewal',

  //     // Nominee info from running policy
  //     NomineeName: runningPolicy.NomineeName || '',
  //     NomineeRelation: runningPolicy.NomineeRelation || '',
  //     NomineeAge: runningPolicy.NomineeAge || '',
  //     NomineeDob: runningPolicy.NomineeDob || '',
  //     hasNominee: (runningPolicy.NomineeName || runningPolicy.NomineeRelation) ? 'yes' : 'no',

  //     // Agent info
  //     AgentName: getValue(completeUserData, 'agentName', 'agent_name', 'AgentName'),
  //     AgentCode: getValue(completeUserData, 'agentCode', 'agent_code', 'AgentCode'),
  //     AgentContactNumber: getValue(completeUserData, 'agentContactNumber', 'agent_contact_number', 'AgentContactNumber'),

  //     // Reference info
  //     Reference: getValue(reference, 'reference_name', 'Reference'),
  //     reference_id: getValue(completeUserData, 'reference_id', null),

  //     // Documents
  //     AadharFileName: getValue(completeUserData, 'AadharFileName', ''),
  //     PanFileName: getValue(completeUserData, 'PanFileName', ''),
  //     GstFileName: getValue(completeUserData, 'GstFileName', ''),
  //     RcBookFileName: getValue(completeUserData, 'RcBookFileName', ''),
  //     RunningPolicyFileName: runningPolicy.CurrentPolicyFile || '',

  //     // ✅ PREVIOUS POLICY: Actual old previous policy (same as handleEdit)
  //     previousPolicy: {
  //       PolicyNumber: previousPolicy.PolicyNumber || '',
  //       CompanyName: previousPolicy.CompanyType?.company_name || previousPolicy.CompanyName || '',
  //       PolicyFrom: previousPolicy.PolicyFrom || '',
  //       PolicyTo: previousPolicy.PolicyTo || '',
  //       PolicyIssuedDate: previousPolicy.PolicyIssuedDate || '',
  //       PolicyExpiryDate: previousPolicy.PolicyTo || previousPolicy.ExpiryDate || '',
  //       PolicyTenure: previousPolicy.PolicyTenure || '',
  //       PremiumAmount: previousPolicy.PremiumAmount || '',
  //       IDV: previousPolicy.IDV || '',
  //       NCB: previousPolicy.NCB || '',
  //       NomineeName: previousPolicy.NomineeName || '',
  //       NomineeRelation: previousPolicy.NomineeRelation || '',
  //       NomineeDob: previousPolicy.NomineeDob || '',
  //       NomineeAge: previousPolicy.NomineeAge || '',
  //       PdfFile: previousPolicy.CurrentPolicyFile || previousPolicy.PdfFile || '',
  //       PdfFileName: previousPolicy.CurrentPolicyFile || previousPolicy.PdfFileName || '',
  //       agentName: previousPolicy.agentName || previousPolicy.AgentName || '',
  //       agentCode: previousPolicy.agentCode || previousPolicy.AgentCode || '',
  //       agentContactNumber: previousPolicy.agentContactNumber || previousPolicy.AgentContactNumber || '',
  //     },

  //     // ✅ RUNNING POLICY: Current active policy object (same as handleEdit)
  //     runningPolicy: {
  //       PolicyNumber: runningPolicy.PolicyNumber || '',
  //       PolicyIssuedDate: runningPolicy.PolicyIssuedDate || '',
  //       PolicyExpiryDate: runningPolicy.PolicyTo || runningPolicy.ExpiryDate || '',
  //       PolicyFrom: runningPolicy.PolicyFrom || '',
  //       PolicyTo: runningPolicy.PolicyTo || '',
  //       PolicyTenure: runningPolicy.PolicyTenure || '',
  //       PremiumAmount: runningPolicy.PremiumAmount || '',
  //       IDV: runningPolicy.IDV || '',
  //       NCB: runningPolicy.NCB || '',
  //       NomineeName: runningPolicy.NomineeName || '',
  //       NomineeRelation: runningPolicy.NomineeRelation || '',
  //       NomineeAge: runningPolicy.NomineeAge || '',
  //       NomineeDob: runningPolicy.NomineeDob || '',
  //       Vendor: runningPolicy.Vendor || '',
  //       CurrentPolicyFile: runningPolicy.CurrentPolicyFile || '',
  //       CompanyType: runningPolicy.CompanyType || null,
  //       policy_type_id: runningPolicy.policy_type_id || runningPolicy.PolicyTypeId || null,
  //       policy_plan_id: runningPolicy.policy_plan_id || null,
  //     },

  //     // Other data
  //     documents: completeUserData.documents || [],
  //     user_pk_vehicle_id: user,
  //     vehicle_user_id: vehicleUserId,
  //     reference: reference,
  //     consumer_role_id: getValue(completeUserData, 'consumer_role_id', ''),
  //     remark: getValue(completeUserData, 'remark', ''),
  //   };

  //   console.log('✅ [RENEWAL SHEET] Final mapped data:', {
  //     previousPolicyNumber: mappedData.previousPolicy.PolicyNumber,
  //     runningPolicyNumber: mappedData.runningPolicy.PolicyNumber,
  //     policyRadio: mappedData.policyRadio,
  //     CompanyName: mappedData.CompanyName
  //   });

  //   // Store data and navigate to vehicle insurance page
  //   try {
  //     localStorage.setItem('isVehicleRenew', 'true');
  //     localStorage.setItem('vehicleRenewalData', JSON.stringify(mappedData));
  //     console.log('🔄 [RENEWAL SHEET] Data stored, navigating to vehicle insurance page');
  //     navigate('/vehicle-insurance', { state: mappedData });
  //   } catch (e) {
  //     console.error('Failed to store vehicle renewal data in localStorage', e);
  //     toast.error('Failed to prepare renewal data. Please try again.');
  //     return;
  //   }
  // };

  //  const handleRenewal = (item) => {
  //         // Map the renewal sheet data structure to the format expected by VehicleInsurance
  //         const user = item.user_pk_vehicle_id || {};
  //         const runningPolicy = item.runningPolicy || {};
  //         const reference = item.reference || {};

  //         console.log('🔄 [RENEWAL SHEET] Starting renewal process for:', item);

  //         // ✅ Step 1: Move current running policy to previous policy
  //         const previousPolicy = {
  //             PolicyNumber: runningPolicy.PolicyNumber || '',
  //             CompanyName: item.company_name || '',
  //             PolicyFrom: runningPolicy.PolicyFrom || '',
  //             PolicyTo: runningPolicy.PolicyTo || '',
  //             PolicyIssuedDate: runningPolicy.PolicyIssuedDate || '',
  //             PolicyExpiryDate: runningPolicy.PolicyTo || runningPolicy.ExpiryDate || '',
  //             PolicyTenure: runningPolicy.PolicyTenure || '',
  //             PremiumAmount: runningPolicy.PremiumAmount || '',
  //             IDV: runningPolicy.IDV || '',
  //             NCB: runningPolicy.NCB || '',
  //             NomineeName: runningPolicy.NomineeName || '',
  //             NomineeRelation: runningPolicy.NomineeRelation || '',
  //             NomineeDob: runningPolicy.NomineeDob || '',
  //             NomineeAge: runningPolicy.NomineeAge || '',
  //             PdfFile: runningPolicy.CurrentPolicyFile || '',
  //             PdfFileName: runningPolicy.CurrentPolicyFile || '',
  //         };

  //         console.log('🔄 [RENEWAL SHEET] Previous policy (from current running):', previousPolicy);

  //         // ✅ Step 2: Reset running policy for new entry
  //         const resetRunningPolicy = {
  //             PolicyNumber: '',
  //             PolicyIssuedDate: '',
  //             PolicyExpiryDate: '',
  //             PolicyTenure: '',
  //             From: '',
  //             To: '',
  //             PremiumAmount: '',
  //             NCB: '',
  //             IDV: '',
  //             NomineeName: '',
  //             NomineeRelation: '',
  //             NomineeAge: '',
  //             NomineeDob: '',
  //             Vendor: '',
  //             CurrentPolicyFile: '',
  //         };

  //         console.log('🔄 [RENEWAL SHEET] Reset running policy for new entry');

  //         const mappedData = {
  //             // Basic vehicle info (preserve)
  //             vehicle_user_id: item.vehicle_user_id,
  //             VehicleNumber: item.vehicle_number || '',
  //             Make: item.make || '',
  //             Model: item.model || '',
  //             ManufacturingYear: item.manufacturing_year || '',
  //             EngineNumber: item.engine_number || '',
  //             ChassisNumber: item.chassis_number || '',
  //             VehicleType: item.vehicle_type || '',

  //             // User info (preserve)
  //             Name: user.username || '',
  //             Email: user.email || '',
  //             MobileNumber: user.mobileNumber || '',

  //             // Contact info (preserve)
  //             ContactPersonName: item.contact_person_name || '',
  //             ContactPersonMobileNumber: item.contact_person_no || '',

  //             // ✅ Clear company name for new policy
  //             CompanyName: '',

  //             // Policy info - Set to Renewal
  //             vehicle_policy_type: 'Renewal',
  //             nominee_type: item.nominee_type || 'Individual',
  //             policy_plan_type: item.policy_plan_type || '',
  //             status: item.status || 'interested',

  //             // Set radio button values
  //             Type: item.nominee_type || 'Individual',
  //             policyRadio: 'Renewal', // ✅ Force Renewal

  //             // Reference (preserve)
  //             reference_id: reference.reference_id || null,
  //             Reference: reference.reference_name || '',

  //             // ✅ Reset running policy (empty for new entry)
  //             runningPolicy: resetRunningPolicy,

  //             // ✅ Clear all running policy fields at top-level
  //             PolicyNumber: '',
  //             PolicyIssuedDate: '',
  //             From: '',
  //             To: '',
  //             PremiumAmount: '',
  //             NCB: '',
  //             IDV: '',
  //             PolicyTenure: '',
  //             NomineeName: '',
  //             NomineeRelation: '',
  //             NomineeDob: '',
  //             NomineeAge: '',
  //             Vendor: '',
  //             CurrentPolicyFile: '',
  //             RunningPolicyFileName: '',

  //             // Agent details (preserve)
  //             AgentName: runningPolicy.AgentName || runningPolicy.agent_name || item.agentName || item.agent_name || '',
  //             AgentContactNumber: runningPolicy.AgentContactNumber || runningPolicy.agent_contact_number || item.agentContactNumber || item.agent_contact_number || '',
  //             AgentCode: runningPolicy.AgentCode || runningPolicy.agent_code || item.agentCode || item.agent_code || '',

  //             // ✅ Previous policy (moved from current running)
  //             previousPolicy: previousPolicy,

  //             // Documents (preserve)
  //             documents: item.documents || [],

  //             // Document filenames (preserve)
  //             AadharFileName: (() => {
  //                 const aadharDoc = item.documents?.find(doc => doc.categoryId === 1);
  //                 return aadharDoc ? aadharDoc.file : '';
  //             })(),
  //             PanFileName: (() => {
  //                 const panDoc = item.documents?.find(doc => doc.categoryId === 2);
  //                 return panDoc ? panDoc.file : '';
  //             })(),
  //             GstFileName: (() => {
  //                 const gstDoc = item.documents?.find(doc => doc.categoryId === 3);
  //                 return gstDoc ? gstDoc.file : '';
  //             })(),
  //             RcBookFileName: (() => {
  //                 const rcbookDoc = item.documents?.find(doc => doc.categoryId === 4);
  //                 return rcbookDoc ? rcbookDoc.file : '';
  //             })(),

  //             // Additional fields
  //             remark: item.remark || '',
  //             consumer_role_id: item.consumer_role_id || '',
  //             user_pk_vehicle_id: user,
  //             reference: reference,
  //         };

  //         console.log('🔄 [RENEWAL SHEET] Final mapped data for renewal:', {
  //             previousPolicy: mappedData.previousPolicy,
  //             runningPolicy: mappedData.runningPolicy,
  //             policyRadio: mappedData.policyRadio,
  //             CompanyName: mappedData.CompanyName
  //         });

  //         // Redirect flow: store data and navigate to vehicle insurance page
  //         try {
  //             localStorage.setItem('isVehicleRenew', 'true');
  //             localStorage.setItem('vehicleRenewalData', JSON.stringify(mappedData));
  //             console.log('🔄 [RENEWAL SHEET] Data stored, navigating to vehicle insurance page');
  //         } catch (e) {
  //             console.error('Failed to store vehicle renewal data in localStorage', e);
  //             toast.error('Failed to prepare renewal data. Please try again.');
  //             return;
  //         }
  //         navigate('/vehicle-insurance');
  //     };

const handleRenewal = async (item) => {
  console.log("🔄 [RENEWAL SHEET] Starting renewal process for:", item);

  const originalData = item.originalData || item;
  console.log("🔍 [RENEWAL SHEET] Using originalData:", originalData);

  // Extract vehicle_user_id safely - check both locations
  const vehicleUserId =
    originalData.vehicleRecords?.[0]?.vehicle_user_id ||
    originalData.vehicle_user_id;
  console.log("🔍 [RENEWAL SHEET] Vehicle user ID:", vehicleUserId);

  let completeUserData = originalData;

  // Helper to safely get value or fallback to empty string
  const getValue = (obj, ...keys) => {
    for (let key of keys) {
      if (
        obj &&
        obj[key] !== undefined &&
        obj[key] !== null &&
        obj[key] !== ""
      )
        return obj[key];
    }
    return "";
  };

  // Nominee age calculation
  const calculateNomineeAge = (dob) => {
    if (!dob) return "";
    const dobDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - dobDate.getFullYear();
    const monthDiff = today.getMonth() - dobDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < dobDate.getDate())
    )
      age--;
    return age;
  };

  // If vehicle_user_id exists, fetch full vehicle data
  if (vehicleUserId) {
    try {
      const fullData = await getVehicleUserById(vehicleUserId);

      if (fullData) {
        console.log("🔍 [RENEWAL] Full data received:", fullData);
        console.log("🔍 [RENEWAL] Running policy:", fullData.runningPolicy);
        console.log(
          "🔍 [RENEWAL] Previous policies array:",
          fullData.previousPolicies
        );

        // Get running policy (current active policy)
        const runningPolicy = fullData.runningPolicy || {};

        // Get previous policy from previousPolicies array
        const previousPolicy =
          (Array.isArray(fullData.previousPolicies)
            ? fullData.previousPolicies
                .filter((p) => p.status !== "active")
                .sort(
                  (a, b) => new Date(b.PolicyTo) - new Date(a.PolicyTo)
                )[0]
            : null) ||
          fullData.previousPolicy ||
          {};

        console.log(
          "✅ [RENEWAL] Previous policy (from array):",
          previousPolicy
        );
        console.log(
          "✅ [RENEWAL] Running policy (current active):",
          runningPolicy
        );

        const documents =
          fullData.documents || fullData.vehicle_documents || [];

        // Helper to find document by multiple ids or names
        const findDoc = (ids) =>
          documents.find((doc) =>
            ids.includes(
              doc.categoryId || doc.category_id || doc.documentType
            )
          );

        completeUserData = {
          ...fullData,
          runningPolicy: runningPolicy,
          previousPolicy: previousPolicy,
          documents,
          AadharFileName: getValue(
            findDoc([1, "1", "Aadhar", "AADHAR"]),
            "file",
            ""
          ),
          PanFileName: getValue(findDoc([2, "2", "Pan", "PAN"]), "file", ""),
          GstFileName: getValue(findDoc([3, "3", "Gst", "GST"]), "file", ""),
          RcBookFileName: getValue(
            findDoc([4, "4", "RCBook", "RC_BOOK"]),
            "file",
            ""
          ),
        };
      }
    } catch (error) {
      console.error("❌ [RENEWAL] Failed to fetch vehicle user data:", error);
      completeUserData = originalData;
    }
  } else {
    console.warn(
      "⚠️ [RENEWAL] No vehicle_user_id found, using originalData."
    );
  }

  // Build final form data
  const user = completeUserData.user_pk_vehicle_id || {};
  const runningPolicy = completeUserData.runningPolicy || {};
  const previousPolicy = completeUserData.previousPolicy || {};
  const reference = completeUserData.reference || {};

  const mappedData = {
    // Consumer info
    Name: getValue(
      completeUserData,
      "Name",
      "name",
      "username",
      user.username
    ),
    Email: getValue(completeUserData, "Email", "email", user.email),
    MobileNumber: getValue(
      completeUserData,
      "MobileNumber",
      "mobile_number",
      "mobileNumber",
      user.mobileNumber
    ),
    ContactPersonName: getValue(completeUserData, "contact_person_name"),
    ContactPersonMobileNumber: getValue(
      completeUserData,
      "contact_person_no"
    ),
    Type: getValue(completeUserData, "nominee_type", "Type", "Individual"),

    // Vehicle info
    VehicleType: getValue(completeUserData, "vehicle_type"),
    VehicleNumber: getValue(completeUserData, "vehicle_number"),
    Make: getValue(completeUserData, "make"),
    Model: getValue(completeUserData, "model"),
    ManufacturingYear: getValue(completeUserData, "manufacturing_year"),
    EngineNumber: getValue(completeUserData, "engine_number"),
    ChassisNumber: getValue(completeUserData, "chassis_number"),

    // RUNNING POLICY: Keep current active policy data
    PolicyNumber: runningPolicy.PolicyNumber || "",
    PolicyIssuedDate: runningPolicy.PolicyIssuedDate || "",
    PolicyExpiryDate:
      runningPolicy.PolicyTo ||
      runningPolicy.ExpiryDate ||
      runningPolicy.PolicyExpiryDate ||
      "",
    PolicyTenure: runningPolicy.PolicyTenure || "",
    PremiumAmount: runningPolicy.PremiumAmount || "",
    NCB: runningPolicy.NCB || "",
    IDV: runningPolicy.IDV || "",
    From: runningPolicy.PolicyFrom || "",
    To: runningPolicy.PolicyTo || "",

    CompanyName:
      runningPolicy.CompanyType?.company_name ||
      completeUserData.company_name ||
      "",
    Vendor: runningPolicy.Vendor || completeUserData.vendor || "",

    // Policy type settings - Set to Renewal
    policyRadio: "Renewal",
    vehicle_policy_type: "Renewal",

    // Clear nominee info for new entry
    NomineeName: "",
    NomineeRelation: "",
    NomineeAge: "",
    NomineeDob: "",
    hasNominee: "no",

    // Agent info
    AgentName: getValue(
      completeUserData,
      "agentName",
      "agent_name",
      "AgentName"
    ),
    AgentCode: getValue(
      completeUserData,
      "agentCode",
      "agent_code",
      "AgentCode"
    ),
    AgentContactNumber: getValue(
      completeUserData,
      "agentContactNumber",
      "agent_contact_number",
      "AgentContactNumber"
    ),

    // Reference info
    Reference: getValue(reference, "reference_name", "Reference"),
    reference_id: getValue(completeUserData, "reference_id", null),

    // Documents
    AadharFileName: getValue(completeUserData, "AadharFileName", ""),
    PanFileName: getValue(completeUserData, "PanFileName", ""),
    GstFileName: getValue(completeUserData, "GstFileName", ""),
    RcBookFileName: getValue(completeUserData, "RcBookFileName", ""),
    RunningPolicyFileName: "",

    // PREVIOUS POLICY: Actual old previous policy
    previousPolicy: {
      PolicyNumber: previousPolicy.PolicyNumber || "",
      CompanyName:
        previousPolicy.CompanyType?.company_name ||
        previousPolicy.CompanyName ||
        "",
      PolicyFrom: previousPolicy.PolicyFrom || "",
      PolicyTo: previousPolicy.PolicyTo || "",
      PolicyIssuedDate: previousPolicy.PolicyIssuedDate || "",
      PolicyExpiryDate:
        previousPolicy.PolicyTo || previousPolicy.ExpiryDate || "",
      PolicyTenure: previousPolicy.PolicyTenure || "",
      PremiumAmount: previousPolicy.PremiumAmount || "",
      IDV: previousPolicy.IDV || "",
      NCB: previousPolicy.NCB || "",
      NomineeName: previousPolicy.NomineeName || "",
      NomineeRelation: previousPolicy.NomineeRelation || "",
      NomineeDob: previousPolicy.NomineeDob || "",
      NomineeAge: previousPolicy.NomineeAge || "",
      PdfFile:
        previousPolicy.CurrentPolicyFile || previousPolicy.PdfFile || "",
      PdfFileName:
        previousPolicy.CurrentPolicyFile || previousPolicy.PdfFileName || "",
      agentName: previousPolicy.agentName || previousPolicy.AgentName || "",
      agentCode: previousPolicy.agentCode || previousPolicy.AgentCode || "",
      agentContactNumber:
        previousPolicy.agentContactNumber ||
        previousPolicy.AgentContactNumber ||
        "",
    },

    // RUNNING POLICY: Current active policy object
    runningPolicy: {
      PolicyNumber: runningPolicy.PolicyNumber || "",
      PolicyIssuedDate: runningPolicy.PolicyIssuedDate || "",
      PolicyExpiryDate:
        runningPolicy.PolicyTo || runningPolicy.ExpiryDate || "",
      PolicyFrom: runningPolicy.PolicyFrom || "",
      PolicyTo: runningPolicy.PolicyTo || "",
      PolicyTenure: runningPolicy.PolicyTenure || "",
      PremiumAmount: runningPolicy.PremiumAmount || "",
      IDV: runningPolicy.IDV || "",
      NCB: runningPolicy.NCB || "",
      NomineeName: runningPolicy.NomineeName || "",
      NomineeRelation: runningPolicy.NomineeRelation || "",
      NomineeAge: runningPolicy.NomineeAge || "",
      NomineeDob: runningPolicy.NomineeDob || "",
      Vendor: runningPolicy.Vendor || "",
      CurrentPolicyFile: runningPolicy.CurrentPolicyFile || "",
      CompanyType: runningPolicy.CompanyType || null,
      policy_type_id:
        runningPolicy.policy_type_id || runningPolicy.PolicyTypeId || null,
      policy_plan_id: runningPolicy.policy_plan_id || null,
    },

    // Other data
    documents: completeUserData.documents || [],
    user_pk_vehicle_id: user,
    vehicle_user_id: vehicleUserId,
    reference: reference,
    consumer_role_id: getValue(completeUserData, "consumer_role_id", ""),
    remark: getValue(completeUserData, "remark", ""),
    
    // Add flag to indicate this is a renewal from renewal sheet
    isRenewalFromSheet: true,
  };

  console.log("✅ [RENEWAL SHEET] Final mapped data:", {
    previousPolicyNumber: mappedData.previousPolicy.PolicyNumber,
    runningPolicyNumber: mappedData.runningPolicy.PolicyNumber,
    policyRadio: mappedData.policyRadio,
    CompanyName: mappedData.CompanyName,
  });

  // Store data and navigate to vehicle insurance page
  try {
    localStorage.setItem("isVehicleRenew", "true");
    localStorage.setItem("vehicleRenewalData", JSON.stringify(mappedData));
    console.log(
      "🔄 [RENEWAL SHEET] Data stored, navigating to vehicle insurance page"
    );
    navigate("/vehicle-insurance", { state: mappedData });
  } catch (e) {
    console.error("Failed to store vehicle renewal data in localStorage", e);
    toast.error("Failed to prepare renewal data. Please try again.");
    return;
  }
};
  const handleRenewalClose = () => {
    setIsRenewalModalOpen(false);
    setRenewalItem(null);
  };

  const handleRenewalSubmit = async (formDataFromPopup) => {
    // Helper to convert empty string/undefined to null for IDs
    const toNullIfEmpty = (val) =>
      val === "" || val === undefined ? null : val;

    // Create FormData for file uploads
    const formData = new FormData();

    // Add the main data as JSON string
    const payload = {
      Name: formDataFromPopup.Name || "",
      Email: formDataFromPopup.Email || "",
      MobileNumber: formDataFromPopup.MobileNumber || "",
      agent_code: formDataFromPopup.agent_code || "",
      agent_contact_number: formDataFromPopup.agent_contact_number || "",
      agent_name: formDataFromPopup.agent_name || "",
      chassis_number: formDataFromPopup.chassis_number || "",
      company_name: formDataFromPopup.company_name || "",
      consumer_role_id: toNullIfEmpty(formDataFromPopup.consumer_role_id),
      contact_person_name: formDataFromPopup.contact_person_name || "",
      contact_person_no: formDataFromPopup.contact_person_no || "",
      engine_number: formDataFromPopup.engine_number || "",
      make: formDataFromPopup.make || "",
      manufacturing_year: formDataFromPopup.manufacturing_year || "",
      model: formDataFromPopup.model || "",
      reference_id: toNullIfEmpty(formDataFromPopup.reference_id),
      remark: formDataFromPopup.remark || "",
      runningPolicy: formDataFromPopup.runningPolicy || {},
      previousPolicy: formDataFromPopup.previousPolicy || {},
      status: formDataFromPopup.status || "interested",
      type: formDataFromPopup.Type || "",
      VehicleId: toNullIfEmpty(formDataFromPopup.vehicle_id),
      VehicleNumber: formDataFromPopup.vehicle_number || "",
      vehicle_type: formDataFromPopup.vehicle_type || "",
      vendor: formDataFromPopup.vendor || "",
      policy_plan_type: formDataFromPopup.policy_plan_type || "",
      policy_type: formDataFromPopup.policy_type || "",
      nominee_type: formDataFromPopup.type || "",
      vehicle_policy_type: formDataFromPopup.vehicle_policy_type || "Renewal",
    };

    formData.append("data", JSON.stringify(payload));

    // Add document files if they exist
    if (formDataFromPopup.documentFiles) {
      const { aadhar, pan, gst } = formDataFromPopup.documentFiles;
      if (aadhar) formData.append("aadhar", aadhar);
      if (pan) formData.append("pan", pan);
      if (gst) formData.append("gst", gst);
    }

    // Add custom documents if they exist
    if (
      formDataFromPopup.customDocuments &&
      formDataFromPopup.customDocuments.length > 0
    ) {
      const documentsData = formDataFromPopup.customDocuments.map(
        (doc, index) => ({
          fileFieldName: `custom_${index}`,
          categoryId: doc.categoryId || 999 + index,
        })
      );
      formData.append("documentsData", JSON.stringify(documentsData));

      // Add custom document files
      formDataFromPopup.customDocuments.forEach((doc, index) => {
        if (doc.file) {
          formData.append(`custom_${index}`, doc.file);
        }
      });
    }

    // Add running policy file if it exists
    if (
      formDataFromPopup.runningPolicy &&
      formDataFromPopup.runningPolicy.CurrentPolicyFile
    ) {
      formData.append(
        "CurrentPolicyFile",
        formDataFromPopup.runningPolicy.CurrentPolicyFile
      );
    }

    const vehicleUserId = formDataFromPopup.vehicle_user_id;

    // If we have an existing vehicle_user_id, call the backend renew endpoint first
    if (vehicleUserId) {
      try {
        const renewResp = await renewVehiclePolicy(vehicleUserId);
        if (renewResp && renewResp.status) {
          console.log(
            "🔄 [RENEWAL SHEET] renewVehiclePolicy response:",
            renewResp
          );
          toast.success("Running policy moved to previous successfully");
        } else {
          console.warn(
            "⚠️ [RENEWAL SHEET] renewVehiclePolicy failed:",
            renewResp
          );
          // proceed anyway to allow update flow to continue, but inform user
          toast.warning(
            renewResp?.message || "Could not move running policy to previous"
          );
        }
      } catch (e) {
        console.error(
          "❌ [RENEWAL SHEET] Error calling renewVehiclePolicy API:",
          e
        );
        toast.error("Server error while renewing policy");
        // proceed to attempt update so user can still submit data
      }
    }

    const res = await updateVehicleUserData(formData, vehicleUserId);
    if (res && res.status) {
      toast.success("Vehicle renewed successfully!");
      setIsRenewalModalOpen(false);
      fetchRenewalData();
    } else {
      toast.error(res?.message || "Renewal failed");
    }
  };

  const exportToExcel = () => {
    const exportData = filteredData.map((item, index) => {
      const user = item.user_pk_vehicle_id || {};
      const runningPolicy = item.runningPolicy || {};
      const reference = item.reference || {};

      return {
        "SR.NO": index + 1,
        "EX DATE": runningPolicy.ExpiryDate
          ? new Date(runningPolicy.ExpiryDate).toLocaleDateString("en-GB")
          : "N/A",
        NAME: user.username || "N/A",
        "MOBILE NO.": user.mobileNumber || "N/A",
        "VEH.NO": item.vehicle_number || "N/A",
        MAKE: item.make || "N/A",
        VARIENT: item.model || "N/A",
        REFRENCE: reference.reference_name || "N/A",
        "CONTACT PERSON NAME": item.contact_person_name || "N/A",
        "CONTACT PERSON NUMBER": item.contact_person_no || "N/A",
        Remark: item.remark || "N/A",
      };
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vehicle Renewals");
    XLSX.writeFile(wb, "VehicleRenewalSheet.xlsx");
  };

  // Helper to build normalized table row (used for table and for global stats)
  const buildRow = (item, index) => {
    const user = item.user_pk_vehicle_id || {};
    const vehicleRecord = item.vehicleRecords?.[0] || {};
    const runningPolicy =
      item.runningPolicy || vehicleRecord.runningPolicy || {};
    const reference = item.reference || vehicleRecord.reference || {};

    const expiryRaw =
      runningPolicy?.ExpiryDate ||
      runningPolicy?.PolicyTo ||
      vehicleRecord?.runningPolicy?.ExpiryDate ||
      vehicleRecord?.runningPolicy?.PolicyTo ||
      "";
    const expiryDateObj = (() => {
      if (!expiryRaw) return null;
      if (typeof expiryRaw === "string" && expiryRaw.includes("/")) {
        const parts = expiryRaw.split("/").map(Number);
        if (parts.length === 3 && parts.every((p) => !isNaN(p))) {
          const [d, m, y] = parts;
          if (y > 1900 && y < 2100) return new Date(y, m - 1, d);
        }
      }
      const asDate = new Date(expiryRaw);
      return isNaN(asDate.getTime()) ? null : asDate;
    })();

    return {
      ...item,
      expiryDate: expiryDateObj
        ? expiryDateObj.toLocaleDateString("en-GB")
        : "",
      expiryDateRaw: expiryDateObj,
      name: user.username || item.username || "",
      email: user.email || item.email || "",
      mobileNumber: user.mobileNumber || item.mobileNumber || "",
      policyNumber:
        runningPolicy?.PolicyNumber ||
        vehicleRecord?.runningPolicy?.PolicyNumber ||
        "",
      issueDate: runningPolicy?.PolicyIssuedDate
        ? new Date(runningPolicy.PolicyIssuedDate).toLocaleDateString("en-GB")
        : "",
      vehicleNumber: item.vehicle_number || vehicleRecord.vehicle_number || "",
      make: item.make || vehicleRecord.make || "",
      model: item.model || vehicleRecord.model || "",
      referenceDisplay: reference?.reference_name || item.referenceName || "-",
      reference: reference,
      contactPersonName:
        item.contact_person_name || vehicleRecord.contact_person_name || "",
      contactPersonNumber:
        item.contact_person_no || vehicleRecord.contact_person_no || "",
      vendor: runningPolicy?.Vendor || vehicleRecord.vendor || "",
      companyName:
        runningPolicy?.CompanyType?.company_name ||
        runningPolicy?.CompanyName ||
        vehicleRecord?.company_name ||
        item.company_name ||
        "",
      premiumAmount: runningPolicy?.PremiumAmount
        ? `₹${runningPolicy.PremiumAmount.toLocaleString()}`
        : "N/A",
      remark: item.remark || "",
      rowIndex: index,
      renew: (
        <button
          className="renew-btn"
          onClick={() => handleRenewal(item)}
          style={{
            cursor: "pointer",
            padding: "8px 16px",
            border: "none",
            borderRadius: "6px",
            background: "#fef3c7",
            color: "#b45309",
            fontSize: "14px",
          }}
        >
          Renew
        </button>
      ),
      actions: (
        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
          <button
            className="action-btn view-btn"
            onClick={() => handleViewDetails(item)}
            title="View Details"
            style={{
              cursor: "pointer",
              width: "40px",
              height: "40px",
              border: "2px solid #3b82f6",
              borderRadius: "8px",
              background: "#3b82f6",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 8px rgba(59,130,246,0.2)",
            }}
          >
            <FiEye size={20} strokeWidth={2.5} />
          </button>
        </div>
      ),
    };
  };

  // tableData uses filteredData (what user sees)
  const tableData = filteredData.map((item, index) => buildRow(item, index));

  // fullTableData uses the complete fetched data (used for stats so counts remain constant)
  const fullTableData = data.map((item, index) => buildRow(item, index));

  const headings = [
    { key: "expiryDate", head: "Expiry Date" },
    { key: "name", head: "Name" },
    { key: "email", head: "Email" },
    { key: "mobileNumber", head: "Mobile Number" },
    { key: "policyNumber", head: "Policy Number" },
    { key: "issueDate", head: "Issue Date" },
    { key: "vehicleNumber", head: "Vehicle Number" },
    { key: "make", head: "Make" },
    { key: "model", head: "Model" },
    { key: "referenceDisplay", head: "Reference" },
    { key: "contactPersonName", head: "Contact Person Name" },
    { key: "contactPersonNumber", head: "Contact Person Number" },
    { key: "vendor", head: "Vendor" },
    { key: "companyName", head: "Company Name" },
    { key: "premiumAmount", head: "Premium Amount" },
    { key: "remark", head: "Remark" },
    { key: "renew", head: "Renew" },
    { key: "actions", head: "Actions" },
  ];

  // Calculate statistics for renewal counts
  const calculateRenewalStats = (data) => {
    console.log("📝 [Stats] Filtered data:", data); // Log filtered data

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const oneMonthFromNow = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      now.getDate()
    );
    const oneYearFromNow = new Date(
      now.getFullYear() + 1,
      now.getMonth(),
      now.getDate()
    );

    let expiredCount = 0;
    let totalPolicies = data.length;
    let weekCount = 0;
    let monthCount = 0;
    let yearCount = 0;

    data.forEach((item) => {
      // Prefer raw Date object if available (expiryDateRaw added on tableData)
      let expiryDate = item.expiryDateRaw || null;

      // Fallback: try to parse expiryDate string (DD/MM/YYYY or ISO)
      if (!expiryDate && item.expiryDate) {
        const expiryDateStr = item.expiryDate;
        if (typeof expiryDateStr === "string" && expiryDateStr.includes("/")) {
          const parts = expiryDateStr.split("/").map(Number);
          if (parts.length === 3 && parts.every((p) => !isNaN(p))) {
            const [d, m, y] = parts;
            if (y > 1900 && y < 2100) expiryDate = new Date(y, m - 1, d);
          }
        }
        if (!expiryDate) {
          const asDate = new Date(expiryDateStr);
          if (!isNaN(asDate.getTime())) expiryDate = asDate;
        }
      }

      if (!expiryDate || isNaN(expiryDate.getTime())) return;

      console.log(
        `📅 [Stats] User: ${item.name}, Expiry: ${expiryDate
          .toISOString()
          .slice(0, 10)}`
      );

      if (expiryDate < now) {
        expiredCount++;
      } else if (expiryDate <= oneWeekFromNow) {
        weekCount++;
      } else if (expiryDate <= oneMonthFromNow) {
        monthCount++;
      } else if (expiryDate <= oneYearFromNow) {
        yearCount++;
      }
    });

    const statsResult = {
      expiredCount,
      totalPolicies,
      weekCount,
      monthCount,
      yearCount,
    };

    console.log("✅ [Stats] Calculated stats:", statsResult);

    return statsResult;
  };

  // Usage: compute stats from the full dataset so card counts don't change when user applies a card filter
  const stats = calculateRenewalStats(fullTableData);

  return (
    <DashboardLayout onSearch={(query) => setSearchTerm(query)}>
      <div className="consumer-container">
        <div className="consumer-header">
          <h1>Renewal Sheet</h1>
        </div>

        <div className="filter-section">
          <div className="filter-inputs">
            <div>
              <label>Start Date:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="form-control"
              />
            </div>
            <div>
              <label>End Date:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="form-control"
              />
            </div>
            <div
              style={{ display: "flex", alignItems: "flex-end", gap: "10px" }}
            >
              <Button className="add-consumer-btn" onClick={handleSearch}>
                Search
              </Button>
              <Button className="cancel-btn" onClick={handleClearDateFilter}>
                Clear
              </Button>
              <Button className="add-consumer-btn" onClick={exportToExcel}>
                Export to Excel
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Card Section */}
        <div className="stat-cards-container">
          <StatCard
            title="Total Policies"
            count={stats.totalPolicies}
            description="All policies"
            color="#2196F3"
            isActive={activeFilter === null}
            onClick={() => setActiveFilter(null)}
          />

          <StatCard
            title="This Week"
            count={stats.weekCount}
            description="Due in 1-7 days"
            color="#FF9800"
            isActive={activeFilter === "week"}
            onClick={() => handleCardClick("week")}
          />

          <StatCard
            title="This Month"
            count={stats.monthCount}
            description="Due in 8-30 days"
            color="#00BCD4"
            isActive={activeFilter === "month"}
            onClick={() => handleCardClick("month")}
          />

          <StatCard
            title="This Year"
            count={stats.yearCount}
            description="Due in 31-365 days"
            color="#4CAF50"
            isActive={activeFilter === "year"}
            onClick={() => handleCardClick("year")}
          />

          <StatCard
            title="Expired"
            count={stats.expiredCount}
            description="Already expired"
            color="#F44336"
            isActive={activeFilter === "expired"}
            onClick={() => handleCardClick("expired")}
          />
        </div>

        <div className="consumer-table-container">
          <Table
            columns={headings.map((h) => ({ key: h.key, title: h.head }))}
            data={tableData}
            pagination={true}
            itemsPerPage={itemsPerPage}
            loading={loading}
          />
        </div>

        {/* View Modal */}
        <Modal
          open={isViewModalOpen}
          onClose={handleCloseModals}
          title="Vehicle Details"
        >
          {selectedItem && (
            <div className="consumer-form">
              {(() => {
                const item = selectedItem || {};
                const user = item.user_pk_vehicle_id || {};
                const runningPolicy = item.runningPolicy || {};
                const reference = item.reference || {};

                return (
                  <>
                    {/* Consumer Information */}
                    <div className="form-section">
                      <h5>Consumer Information</h5>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Name:</label>
                          <span className="detail-value">
                            {user.username || "N/A"}
                          </span>
                        </div>
                        <div className="form-group">
                          <label>Email:</label>
                          <span className="detail-value">
                            {user.email || "N/A"}
                          </span>
                        </div>
                      </div>
                      {/* Attached documents list */}
                      <div className="form-row">
                        <div className="form-group" style={{ width: "100%" }}>
                          <label>Attached Documents:</label>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 6,
                            }}
                          >
                            {item.documents && item.documents.length > 0 ? (
                              item.documents.map((doc, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    display: "flex",
                                    gap: 8,
                                    alignItems: "center",
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      window.open(
                                        `${config.API_URL}/user/download/${doc.file}`,
                                        "_blank"
                                      )
                                    }
                                    style={{
                                      padding: "6px 10px",
                                      backgroundColor: "#1976d2",
                                      color: "white",
                                      border: "none",
                                      borderRadius: 4,
                                      cursor: "pointer",
                                    }}
                                  >
                                    📄 Download
                                  </button>
                                  <span style={{ fontSize: 13 }}>
                                    {doc.file ||
                                      doc.fileName ||
                                      doc.name ||
                                      "Document"}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <span className="detail-value">
                                No attachments
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Mobile:</label>
                          <span className="detail-value">
                            {user.mobileNumber || "N/A"}
                          </span>
                        </div>
                        <div className="form-group">
                          <label>Reference:</label>
                          <span className="detail-value">
                            {reference?.reference_name || "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Contact Person Name:</label>
                          <span className="detail-value">
                            {item.contact_person_name || "N/A"}
                          </span>
                        </div>
                        <div className="form-group">
                          <label>Contact Person Number:</label>
                          <span className="detail-value">
                            {item.contact_person_no || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Vehicle Information */}
                    <div className="form-section">
                      <h5>Vehicle Information</h5>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Vehicle Number:</label>
                          <span className="detail-value">
                            {item.vehicle_number || "N/A"}
                          </span>
                        </div>
                        <div className="form-group">
                          <label>Make:</label>
                          <span className="detail-value">
                            {item.make || "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Model:</label>
                          <span className="detail-value">
                            {item.model || "N/A"}
                          </span>
                        </div>
                        <div className="form-group">
                          <label>Manufacturing Year:</label>
                          <span className="detail-value">
                            {item.manufacturing_year || "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Engine Number:</label>
                          <span className="detail-value">
                            {item.engine_number || "N/A"}
                          </span>
                        </div>
                        <div className="form-group">
                          <label>Chassis Number:</label>
                          <span className="detail-value">
                            {item.chassis_number || "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Vehicle Type:</label>
                          <span className="detail-value">
                            {item.vehicle_type || "N/A"}
                          </span>
                        </div>
                        <div className="form-group">
                          <label>Company Name:</label>
                          <span className="detail-value">
                            {item.company_name || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Running Policy Details */}
                    <div className="form-section">
                      <h5>Running Policy Details</h5>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Policy Number:</label>
                          <span className="detail-value">
                            {runningPolicy.PolicyNumber || "N/A"}
                          </span>
                        </div>
                        <div className="form-group">
                          <label>Policy Type:</label>
                          <span className="detail-value">
                            {(() => {
                              // Prefer nested object
                              if (runningPolicy.policyType?.PolicyTypeName)
                                return runningPolicy.policyType.PolicyTypeName;
                              // If an id exists, map via lookup
                              const id =
                                runningPolicy.policy_type_id ||
                                runningPolicy.PolicyTypeId ||
                                runningPolicy.policy_type_id;
                              if (id && policyTypes.length > 0) {
                                const found = policyTypes.find(
                                  (pt) =>
                                    String(pt.policy_type_id) === String(id)
                                );
                                if (found) return found.policy_type_name;
                              }
                              return (
                                runningPolicy.policy_type_name ||
                                runningPolicy.policy_type ||
                                "N/A"
                              );
                            })()}
                          </span>
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Company Name:</label>
                          <span className="detail-value">
                            {runningPolicy.CompanyType?.company_name ||
                              runningPolicy.CompanyName ||
                              item.company_name ||
                              "N/A"}
                          </span>
                        </div>
                        <div className="form-group">
                          <label>Policy Plan:</label>
                          <span className="detail-value">
                            {(() => {
                              if (runningPolicy.policyPlan?.PolicyPlanType)
                                return runningPolicy.policyPlan.PolicyPlanType;
                              const pid =
                                runningPolicy.policy_plan_id ||
                                runningPolicy.PolicyPlanId ||
                                runningPolicy.policy_plan_id;
                              if (pid && policyPlans.length > 0) {
                                const found = policyPlans.find(
                                  (pp) =>
                                    String(pp.policy_plan_id) === String(pid)
                                );
                                if (found)
                                  return (
                                    found.policy_name ||
                                    found.PolicyPlanType ||
                                    found.policyPlanName ||
                                    found.policy_name
                                  );
                              }
                              return (
                                runningPolicy.policyPlan?.PolicyPlanType ||
                                runningPolicy.policy_plan_type ||
                                "N/A"
                              );
                            })()}
                          </span>
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Policy Issued Date:</label>
                          <span className="detail-value">
                            {runningPolicy.PolicyIssuedDate
                              ? new Date(
                                  runningPolicy.PolicyIssuedDate
                                ).toLocaleDateString("en-GB")
                              : "N/A"}
                          </span>
                        </div>
                        <div className="form-group">
                          <label>Policy From:</label>
                          <span className="detail-value">
                            {runningPolicy.PolicyFrom
                              ? new Date(
                                  runningPolicy.PolicyFrom
                                ).toLocaleDateString("en-GB")
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Policy To:</label>
                          <span className="detail-value">
                            {runningPolicy.PolicyTo
                              ? new Date(
                                  runningPolicy.PolicyTo
                                ).toLocaleDateString("en-GB")
                              : "N/A"}
                          </span>
                        </div>
                        <div className="form-group">
                          <label>Expiry Date:</label>
                          <span className="detail-value">
                            {runningPolicy.ExpiryDate
                              ? new Date(
                                  runningPolicy.ExpiryDate
                                ).toLocaleDateString("en-GB")
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Premium Amount:</label>
                          <span className="detail-value">
                            {runningPolicy.PremiumAmount || "N/A"}
                          </span>
                        </div>
                        <div className="form-group">
                          <label>NCB:</label>
                          <span className="detail-value">
                            {runningPolicy.NCB || "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>IDV:</label>
                          <span className="detail-value">
                            {runningPolicy.IDV || "N/A"}
                          </span>
                        </div>
                        <div className="form-group">
                          <label>Policy Tenure:</label>
                          <span className="detail-value">
                            {runningPolicy.PolicyTenure || "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Vendor:</label>
                          <span className="detail-value">
                            {runningPolicy.Vendor || "N/A"}
                          </span>
                        </div>
                        <div className="form-group">
                          <label>Nominee Name:</label>
                          <span className="detail-value">
                            {runningPolicy.NomineeName || "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Nominee Relation:</label>
                          <span className="detail-value">
                            {runningPolicy.NomineeRelation || "N/A"}
                          </span>
                        </div>
                        <div className="form-group">
                          <label>Nominee Age:</label>
                          <span className="detail-value">
                            {runningPolicy.NomineeAge || "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Nominee DOB:</label>
                          <span className="detail-value">
                            {runningPolicy.NomineeDob
                              ? new Date(
                                  runningPolicy.NomineeDob
                                ).toLocaleDateString("en-GB")
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                      {/* Download box for Running Policy Document */}
                      <div className="form-row">
                        <div className="form-group">
                          <label>Running Policy Document:</label>
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              alignItems: "center",
                            }}
                          >
                            {runningPolicy.CurrentPolicyFile ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    window.open(
                                      `${config.API_URL}/user/download/${runningPolicy.CurrentPolicyFile}`,
                                      "_blank"
                                    )
                                  }
                                  style={{
                                    padding: "6px 10px",
                                    backgroundColor: "#1976d2",
                                    color: "white",
                                    border: "none",
                                    borderRadius: 4,
                                    cursor: "pointer",
                                  }}
                                >
                                  📄 Download Running Policy
                                </button>
                                <span style={{ fontSize: 13 }}>
                                  {runningPolicy.CurrentPolicyFile}
                                </span>
                              </>
                            ) : (
                              <span className="detail-value">No document</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Previous Policy Details */}
                    {(() => {
                      const hasValidData =
                        item.previousPolicy &&
                        (item.previousPolicy.PolicyNumber ||
                          item.previousPolicy.PolicyFrom ||
                          item.previousPolicy.PolicyTo ||
                          item.previousPolicy.PremiumAmount ||
                          item.previousPolicy.IDV ||
                          item.previousPolicy.NCB ||
                          item.previousPolicy.NomineeName ||
                          (item.previousPolicy.CompanyType &&
                            item.previousPolicy.CompanyType.company_name));

                      return hasValidData ? (
                        <div className="form-section">
                          <h5>Previous Policy Details</h5>
                          <div className="form-row">
                            <div className="form-group">
                              <label>Previous Policy Number:</label>
                              <span className="detail-value">
                                {item.previousPolicy.PolicyNumber || "N/A"}
                              </span>
                            </div>
                            <div className="form-group">
                              <label>Previous Policy Type:</label>
                              <span className="detail-value">
                                {item.previousPolicy.policyType
                                  ?.PolicyTypeName ||
                                  item.previousPolicy.policy_type_name ||
                                  item.previousPolicy.policy_type ||
                                  "N/A"}
                              </span>
                            </div>
                          </div>
                          <div className="form-row">
                            <div className="form-group">
                              <label>Previous Company Name:</label>
                              <span className="detail-value">
                                {(() => {
                                  let companyName =
                                    item.previousPolicy.CompanyType
                                      ?.company_name ||
                                    item.previousPolicy.company_name;
                                  if (
                                    !companyName &&
                                    item.runningPolicy?.CompanyType
                                      ?.company_name
                                  ) {
                                    companyName =
                                      item.runningPolicy.CompanyType
                                        .company_name;
                                  }
                                  if (!companyName) {
                                    companyName = "N/A";
                                  }
                                  return companyName;
                                })()}
                              </span>
                            </div>
                            <div className="form-group">
                              <label>Previous Policy Plan:</label>
                              <span className="detail-value">
                                {item.previousPolicy.policyPlan
                                  ?.PolicyPlanType || "N/A"}
                              </span>
                            </div>
                          </div>
                          <div className="form-row">
                            <div className="form-group">
                              <label>Previous Policy From:</label>
                              <span className="detail-value">
                                {item.previousPolicy.PolicyFrom
                                  ? new Date(
                                      item.previousPolicy.PolicyFrom
                                    ).toLocaleDateString("en-GB")
                                  : "N/A"}
                              </span>
                            </div>
                            <div className="form-group">
                              <label>Previous Policy To:</label>
                              <span className="detail-value">
                                {item.previousPolicy.PolicyTo
                                  ? new Date(
                                      item.previousPolicy.PolicyTo
                                    ).toLocaleDateString("en-GB")
                                  : "N/A"}
                              </span>
                            </div>
                          </div>
                          {/* Previous policy document download */}
                          <div className="form-row">
                            <div className="form-group">
                              <label>Previous Policy Document:</label>
                              <div
                                style={{
                                  display: "flex",
                                  gap: 8,
                                  alignItems: "center",
                                }}
                              >
                                {item.previousPolicy.PdfFile ||
                                item.previousPolicy.PdfFileName ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        window.open(
                                          `${config.API_URL}/user/download/${
                                            item.previousPolicy.PdfFile ||
                                            item.previousPolicy.PdfFileName
                                          }`,
                                          "_blank"
                                        )
                                      }
                                      style={{
                                        padding: "6px 10px",
                                        backgroundColor: "#1976d2",
                                        color: "white",
                                        border: "none",
                                        borderRadius: 4,
                                        cursor: "pointer",
                                      }}
                                    >
                                      📄 Download Previous Policy
                                    </button>
                                    <span style={{ fontSize: 13 }}>
                                      {item.previousPolicy.PdfFileName ||
                                        item.previousPolicy.PdfFile}
                                    </span>
                                  </>
                                ) : (
                                  <span className="detail-value">
                                    No document
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="form-row">
                            <div className="form-group">
                              <label>Previous Policy Tenure:</label>
                              <span className="detail-value">
                                {item.previousPolicy.PolicyTenure || "N/A"}
                              </span>
                            </div>
                            <div className="form-group">
                              <label>Previous Premium Amount:</label>
                              <span className="detail-value">
                                {item.previousPolicy.PremiumAmount || "N/A"}
                              </span>
                            </div>
                          </div>
                          <div className="form-row">
                            <div className="form-group">
                              <label>Previous IDV:</label>
                              <span className="detail-value">
                                {item.previousPolicy.IDV || "N/A"}
                              </span>
                            </div>
                            <div className="form-group">
                              <label>Previous Policy NCB:</label>
                              <span className="detail-value">
                                {item.previousPolicy.NCB || "N/A"}
                              </span>
                            </div>
                          </div>
                          <div className="form-row">
                            <div className="form-group">
                              <label>Previous Nominee Name:</label>
                              <span className="detail-value">
                                {item.previousPolicy.NomineeName || "N/A"}
                              </span>
                            </div>
                            <div className="form-group">
                              <label>Previous Nominee Relation:</label>
                              <span className="detail-value">
                                {item.previousPolicy.NomineeRelation || "N/A"}
                              </span>
                            </div>
                          </div>
                          <div className="form-row">
                            <div className="form-group">
                              <label>Previous Nominee DOB:</label>
                              <span className="detail-value">
                                {item.previousPolicy.NomineeDob
                                  ? new Date(
                                      item.previousPolicy.NomineeDob
                                    ).toLocaleDateString("en-GB")
                                  : "N/A"}
                              </span>
                            </div>
                            <div className="form-group">
                              <label>Previous Nominee Age:</label>
                              <span className="detail-value">
                                {item.previousPolicy.NomineeAge || "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })()}

                    {/* Previous Agent Details - Only for Portability */}
                    {item.vehicle_policy_type === "Portability" &&
                      (item.previousPolicy?.agentName ||
                        item.previousPolicy?.agentCode ||
                        item.previousPolicy?.agentContactNumber) && (
                        <div className="form-section">
                          <h5>Previous Agent Details</h5>
                          <div className="form-row">
                            <div className="form-group">
                              <label>Previous Agent Name:</label>
                              <span className="detail-value">
                                {item.previousPolicy.agentName || "N/A"}
                              </span>
                            </div>
                            <div className="form-group">
                              <label>Previous Agent Code:</label>
                              <span className="detail-value">
                                {item.previousPolicy.agentCode || "N/A"}
                              </span>
                            </div>
                          </div>
                          <div className="form-row">
                            <div className="form-group">
                              <label>Previous Agent Contact Number:</label>
                              <span className="detail-value">
                                {item.previousPolicy.agentContactNumber ||
                                  "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Agent Information */}
                    <div className="form-section">
                      <h5>Agent Information</h5>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Agent Name:</label>
                          <span className="detail-value">
                            {item.agentName || "N/A"}
                          </span>
                        </div>
                        <div className="form-group">
                          <label>Agent Code:</label>
                          <span className="detail-value">
                            {item.agentCode || "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Agent Contact Number:</label>
                          <span className="detail-value">
                            {item.agentContactNumber || "N/A"}
                          </span>
                        </div>
                        <div className="form-group">
                          <label>Reference:</label>
                          <span className="detail-value">
                            {reference?.reference_name || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Policy Information */}
                    <div className="form-section">
                      <h5>Policy Information</h5>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Policy Type:</label>
                          <span className="detail-value">
                            {item.vehicle_policy_type || "N/A"}
                          </span>
                        </div>
                        <div className="form-group">
                          <label>Nominee Type:</label>
                          <span className="detail-value">
                            {item.nominee_type || "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Policy Plan Type:</label>
                          <span className="detail-value">
                            {item.policy_plan_type || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="form-actions">
                      <Button
                        type="button"
                        className="cancel-btn"
                        onClick={handleCloseModals}
                      >
                        Close
                      </Button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </Modal>

        {/* Renewal Modal */}
        {isRenewalModalOpen && (
          <Modal
            open={isRenewalModalOpen}
            onClose={handleRenewalClose}
            title="Renew Vehicle"
          >
            <EditVehiclePopup
              data={renewalItem}
              onClose={handleRenewalClose}
              onSubmit={handleRenewalSubmit}
              mode="renewal"
              isOpen={isRenewalModalOpen}
            />
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
};

export default VehicleRenewalSheet;
