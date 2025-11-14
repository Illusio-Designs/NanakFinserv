import React, { useEffect, useState } from "react";
import "../../styles/pages/dashboard/Consumer.css";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import Input from "../../components/common/Input";

import Select from "../../components/common/Select";

import DashboardLayout from "../../components/DashboardLayout";

import {
  getVehicleUserRenewalData,
  updateVehicleUserData,
  addVehicleUserData,
  getAllPolicyPlans,
  getAllReferences,
  getAllVehicles,
  getAllPolicyTypes,
  getVehicleUserById,
  getAllCompanyTypes,
  addCompanyType,
  renewVehiclePolicy,
} from "../../serviceAPI/userAPI";
import config from "../../config/apiConfig";

import * as XLSX from "xlsx";

import toast from "react-hot-toast";

import Cookies from "js-cookie";

import { FiEye, FiEdit2 } from "react-icons/fi";
import ReactSelect from "react-select";

const VehicleInsurance = () => {
  const [data, setData] = useState([]);

  const [filteredData, setFilteredData] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [editData, setEditData] = useState(null);

  const [heading, setHeading] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);

  const [itemsPerPage, setItemsPerPage] = useState(25);

  const [sortColumn, setSortColumn] = useState(null);

  const [sortDirection, setSortDirection] = useState("asc");

  const [loading, setLoading] = useState(false);

  const [vehicleLoading, setVehicleLoading] = useState(true);

  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    Name: "",

    Email: "",

    MobileNumber: "",

    ContactPersonName: "",

    ContactPersonMobileNumber: "",

    PolicyType: "",

    Type: "",

    VehicleType: "",

    VehicleNumber: "",

    Make: "",

    Model: "",

    Vendor: "",

    CompanyName: "",

    ManufacturingYear: "",

    EngineNumber: "",

    ChassisNumber: "",

    vehicle_user_id: "",

    NomineeDob: "",

    AgentName: "",

    AgentContactNumber: "",

    AgentCode: "",

    Reference: "",

    PolicyPlanType: "",

    From: "",

    To: "",

    PolicyIssuedDate: "",

    PolicyExpiryDate: "",

    PolicyNumber: "",

    PremiumAmount: "",

    NCB: "",

    IDV: "",

    NomineeName: "",

    NomineeRelation: "",

    NomineeAge: "",

    PolicyTenure: "",

    vehicle_id: "",

    reference_id: "",

    vehicle_policy_type: "",

    nominee_type: "",

    policyRadio: "",

    nomineeRadio: "",

    policy_type_id: "",

    policy_plan_id: "",

    company_id: "",

    isNomineeFlag: "",

    hasNominee: "no",

    CurrentPolicyFile: "",

    AadharFileName: "",

    PanFileName: "",

    GstFileName: "",

    RcBookFileName: "",

    RunningPolicyFileName: "",

    previousPolicy: {},

    documents: [],

    reference: {},

    runningPolicy: {},

    user_pk_vehicle_id: {},

    consumer_role_id: "",
  });

  const [documentFiles, setDocumentFiles] = useState({
    aadhar: null,

    pan: null,

    gst: null,

    rcbook: null,
  });

  const [customDocuments, setCustomDocuments] = useState([]);

  const [vehicleList, setVehicleList] = useState([]);

  const [policyPlans, setPolicyPlans] = useState([]);

  const [references, setReferences] = useState([]);

  const [vehicleTypes, setVehicleTypes] = useState([]);

  const [policyTypes, setPolicyTypes] = useState([]);
  const [companyTypes, setCompanyTypes] = useState([]);
  const [showAddCompanyField, setShowAddCompanyField] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const user = (Cookies.get("user") && JSON.parse(Cookies.get("user"))) || "";

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);

    if (!isModalOpen) {
      setEditData(null);

      resetForm();

      setStep(1);
    }
  };

  // Prevent background scroll when modal is open
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = previousOverflow || "";
    }
    return () => {
      document.body.style.overflow = previousOverflow || "";
    };
  }, [isModalOpen]);

  const isWithinDateRange = (dateStr, fromDate, toDate) => {
    if (!fromDate || !toDate) return true;
    if (!dateStr) return false;
    const start = new Date(new Date(fromDate).setHours(0, 0, 0, 0));
    const end = new Date(new Date(toDate).setHours(23, 59, 59, 999));
    const d = new Date(dateStr);
    if (isNaN(d)) return false;
    return d >= start && d <= end;
  };

  const handleClearDateFilter = async () => {
    setStartDate("");
    setEndDate("");
    localStorage.removeItem("vehicleInsuranceStartDate");
    localStorage.removeItem("vehicleInsuranceEndDate");
    await getVehicleData({});
    // Apply filters after clearing dates
    applyFilters();
  };

  const resetForm = () => {
    setFormData({
      Name: "",

      Email: "",

      MobileNumber: "",

      ContactPersonName: "",

      ContactPersonMobileNumber: "",

      PolicyType: "",

      Type: "",

      VehicleType: "",

      VehicleNumber: "",

      Make: "",

      Model: "",

      Vendor: "",

      CompanyName: "",

      ManufacturingYear: "",

      EngineNumber: "",

      ChassisNumber: "",

      vehicle_user_id: "",

      NomineeDob: "",

      AgentName: "",

      AgentContactNumber: "",

      AgentCode: "",

      Reference: "",

      PolicyPlanType: "",

      From: "",

      To: "",

      PolicyIssuedDate: "",

      PolicyExpiryDate: "",

      PolicyNumber: "",

      PremiumAmount: "",

      NCB: "",

      IDV: "",

      NomineeName: "",

      NomineeRelation: "",

      NomineeAge: "",

      PolicyTenure: "",

      vehicle_id: "",

      reference_id: "",

      vehicle_policy_type: "",

      nominee_type: "",

      policyRadio: "",

      nomineeRadio: "",

      policy_type_id: "",

      policy_plan_id: "",

      company_id: "",

      isNomineeFlag: "",

      CurrentPolicyFile: "",

      AadharFileName: "",

      PanFileName: "",

      GstFileName: "",

      RunningPolicyFileName: "",

      previousPolicy: {},

      documents: [],

      reference: {},

      runningPolicy: {},

      user_pk_vehicle_id: {},

      consumer_role_id: "",
    });

    setDocumentFiles({
      aadhar: null,

      pan: null,

      gst: null,

      rcbook: null,
    });

    setCustomDocuments([]);

    setStep(1);

    // Reset inline field states

    setShowAddVehicleField(false);

    setShowAddPolicyPlanField(false);

    setShowAddPolicyTypeField(false);

    setShowAddCompanyField(false);

    setShowAddReferenceField(false);

    setShowAddDocumentField(false);

    setNewVehicleName("");

    setNewPolicyPlanName("");

    setNewPolicyTypeName("");

    setNewCompanyName("");

    setNewReferenceName("");

    setNewDocumentName("");

    // Reset form data to default values
    setFormData({
      // Step 1 - Consumer Details
      Name: "",
      Email: "",
      MobileNumber: "",
      ContactPersonName: "",
      ContactPersonMobileNumber: "",
      PolicyType: "",
      Type: "",
      // Step 2 - Vehicle Details
      VehicleType: "",
      VehicleNumber: "",
      Make: "",
      Model: "",
      Vendor: "",
      CompanyName: "",
      ManufacturingYear: "",
      EngineNumber: "",
      ChassisNumber: "",
      // IDs
      vehicle_user_id: "",
      NomineeDob: "",
      // Step 4 - Policy Details
      AgentName: "",
      AgentContactNumber: "",
      AgentCode: "",
      Reference: "",
      PolicyPlanType: "",
      From: "",
      To: "",
      PolicyIssuedDate: "",
      PolicyNumber: "",
      PremiumAmount: "",
      NCB: "",
      IDV: "",
      NomineeName: "",
      NomineeRelation: "",
      NomineeAge: "",
      PolicyTenure: "",
      vehicle_id: "",
      reference_id: "",
      vehicle_policy_type: "",
      nominee_type: "",
      policyRadio: "",
      nomineeRadio: "",
      policy_type_id: "",
      policy_plan_id: "",
      company_id: "",
      isNomineeFlag: "",
      CurrentPolicyFile: "",
      // Document file names
      AadharFileName: "",
      PanFileName: "",
      GstFileName: "",
      RcBookFileName: "",
      RunningPolicyFileName: "",
      previousPolicy: {},
      documents: [],
      reference: {},
      runningPolicy: {},
      user_pk_vehicle_id: {},
      consumer_role_id: "",
    });
  };

  // Debug useEffect to monitor formData changes
  useEffect(() => {
    console.log("🔍 [FORMDATA CHANGE] formData updated:", {
      AadharFileName: formData.AadharFileName,
      PanFileName: formData.PanFileName,
      GstFileName: formData.GstFileName,
      debugInfo: formData._debugInfo,
      debugDocumentFilenames: formData._debugDocumentFilenames,
    });
  }, [formData.AadharFileName, formData.PanFileName, formData.GstFileName]);

  // Function to reset all document error states
  const resetDocumentErrorStates = () => {
    const documentTypes = ["aadhar", "pan", "gst", "rcbook", "running-policy"];

    documentTypes.forEach((type) => {
      const storedMessage = document.getElementById(`${type}-stored-message`);
      const downloadLink = document.getElementById(`${type}-download-link`);

      if (storedMessage) {
        storedMessage.style.color = "#388e3c";
        // Reset to original text based on current formData
        const fileName =
          formData[
            `${
              type.charAt(0).toUpperCase() + type.slice(1).replace("-", "")
            }FileName`
          ];
        if (fileName) {
          storedMessage.textContent = `Document already stored: ${fileName}`;
        }
      }
      if (downloadLink) {
        downloadLink.style.color = "#1976d2";
        // Reset to original text
        const linkTexts = {
          aadhar: "📄 Download Aadhar Card",
          pan: "📄 Download PAN Card",
          gst: "📄 Download GST Certificate",
          rcbook: "📄 Download RC Book",
          "running-policy": "📄 Download Running Policy Document",
        };
        downloadLink.textContent = linkTexts[type] || "📄 Download";
      }
    });
  };

  // Reset error states when modal opens or formData changes
  useEffect(() => {
    if (isModalOpen) {
      // Small delay to ensure DOM elements are rendered
      setTimeout(() => {
        resetDocumentErrorStates();
      }, 100);
    }
  }, [
    isModalOpen,
    formData.AadharFileName,
    formData.PanFileName,
    formData.GstFileName,
    formData.RunningPolicyFileName,
  ]);

  useEffect(() => {
    getVehicleData();

    fetchPolicyPlans();

    fetchReferences();

    fetchVehicleTypes();

    fetchPolicyTypes();

    fetchCompanyTypes();
  }, []);

  // Fix: Ensure formData is properly populated when editData changes
  useEffect(() => {
    if (
      editData &&
      isModalOpen &&
      policyPlans.length > 0 &&
      references.length > 0
    ) {
      console.log("✅ [FIX] Repopulating formData from editData");
      console.log("✅ [FIX] editData.policyRadio:", editData.policyRadio);
      console.log("✅ [FIX] editData.previousPolicy:", editData.previousPolicy);
      console.log(
        "✅ [FIX] editData.previousPolicy.agentName:",
        editData.previousPolicy?.agentName
      );
      console.log(
        "✅ [FIX] editData.previousPolicy.agentCode:",
        editData.previousPolicy?.agentCode
      );
      console.log(
        "✅ [FIX] editData.previousPolicy.agentContactNumber:",
        editData.previousPolicy?.agentContactNumber
      );

      const user = editData.user_pk_vehicle_id || {};
      const runningPolicy = editData.runningPolicy || {};
      const reference = editData.reference || {};
      const documents = editData.documents || editData.vehicle_documents || [];

      const aadharDoc = documents.find(
        (doc) =>
          doc.categoryId == 1 || doc.categoryId === 1 || doc.categoryId === "1"
      );
      const panDoc = documents.find(
        (doc) =>
          doc.categoryId == 2 || doc.categoryId === 2 || doc.categoryId === "2"
      );
      const gstDoc = documents.find(
        (doc) =>
          doc.categoryId == 3 || doc.categoryId === 3 || doc.categoryId === "3"
      );
      const rcbookDoc = documents.find(
        (doc) =>
          doc.categoryId == 4 || doc.categoryId === 4 || doc.categoryId === "4"
      );

      // Determine if this edit is for a Renewal so we can clear running-policy nominee fields
      const isRenewalEdit =
        editData &&
        (editData.policyRadio === "Renewal" ||
          editData.vehicle_policy_type === "Renewal" ||
          editData.runningPolicy?.policy_type === "Renewal");

      setFormData((prev) => ({
        ...prev,
        Name:
          editData.Name ||
          editData.name ||
          user.username ||
          editData.username ||
          "",
        Email: editData.Email || editData.email || user.email || "",
        MobileNumber:
          editData.MobileNumber ||
          editData.mobile_number ||
          user.mobileNumber ||
          editData.mobileNumber ||
          "",
        ContactPersonName:
          editData.ContactPersonName || editData.contact_person_name || "",
        ContactPersonMobileNumber:
          editData.ContactPersonMobileNumber ||
          editData.contact_person_no ||
          "",
        policyRadio:
          editData.policyRadio || editData.vehicle_policy_type || "Fresh",
        Type: editData.Type || editData.nominee_type || "Individual",
        VehicleType: editData.VehicleType || editData.vehicle_type || "",
        VehicleNumber: editData.VehicleNumber || editData.vehicle_number || "",
        Make: editData.Make || editData.make || "",
        Model: editData.Model || editData.model || "",
        ManufacturingYear:
          editData.ManufacturingYear || editData.manufacturing_year || "",
        EngineNumber: editData.EngineNumber || editData.engine_number || "",
        ChassisNumber: editData.ChassisNumber || editData.chassis_number || "",
        // Running policy - use editData top-level fields if available (from renewal), otherwise from runningPolicy
        PolicyNumber: editData.PolicyNumber || runningPolicy.PolicyNumber || "",
        PolicyIssuedDate:
          editData.PolicyIssuedDate || runningPolicy.PolicyIssuedDate || "",
        PolicyExpiryDate:
          editData.To ||
          runningPolicy.PolicyTo ||
          runningPolicy.ExpiryDate ||
          runningPolicy.PolicyExpiryDate ||
          "",
        PolicyTenure: editData.PolicyTenure || runningPolicy.PolicyTenure || "",
        From: editData.From || runningPolicy.PolicyFrom || "",
        To: editData.To || runningPolicy.PolicyTo || "",
        PremiumAmount:
          editData.PremiumAmount || runningPolicy.PremiumAmount || "",
        NCB: editData.NCB || runningPolicy.NCB || "",
        IDV: editData.IDV || runningPolicy.IDV || "",
        NomineeName: isRenewalEdit
          ? ""
          : editData.NomineeName || runningPolicy.NomineeName || "",
        NomineeRelation: isRenewalEdit
          ? ""
          : editData.NomineeRelation || runningPolicy.NomineeRelation || "",
        NomineeAge: isRenewalEdit
          ? ""
          : editData.NomineeAge || runningPolicy.NomineeAge || "",
        NomineeDob: isRenewalEdit
          ? ""
          : editData.NomineeDob || runningPolicy.NomineeDob || "",
        hasNominee: isRenewalEdit
          ? "no"
          : editData.NomineeName ||
            runningPolicy.NomineeName ||
            editData.NomineeRelation ||
            runningPolicy.NomineeRelation
          ? "yes"
          : "no",
        CompanyName: editData.CompanyName || editData.company_name || "",
        Vendor:
          editData.Vendor || runningPolicy.Vendor || editData.vendor || "",
        PolicyPlanType: runningPolicy.policy_plan_id
          ? policyPlans.find(
              (pp) => pp.policy_plan_id === runningPolicy.policy_plan_id
            )?.policy_name || ""
          : editData.policy_plan_type || "",
        PolicyType: runningPolicy.policy_type_id
          ? policyTypes.find(
              (pt) => pt.policy_type_id === runningPolicy.policy_type_id
            )?.policy_type_name || ""
          : runningPolicy.policy_type_name ||
            runningPolicy.policy_type ||
            editData.running_policy_type ||
            "",
        AgentName:
          editData.AgentName || editData.agentName || editData.agent_name || "",
        AgentCode:
          editData.AgentCode || editData.agentCode || editData.agent_code || "",
        AgentContactNumber:
          editData.AgentContactNumber ||
          editData.agentContactNumber ||
          editData.agent_contact_number ||
          "",
        Reference:
          editData.Reference ||
          (editData.reference_id
            ? references.find((r) => r.reference_id === editData.reference_id)
                ?.reference_name || ""
            : reference.reference_name || ""),
        vehicle_user_id: editData.vehicle_user_id || editData.id || "",
        AadharFileName:
          editData.AadharFileName || (aadharDoc ? aadharDoc.file : ""),
        PanFileName: editData.PanFileName || (panDoc ? panDoc.file : ""),
        GstFileName: editData.GstFileName || (gstDoc ? gstDoc.file : ""),
        RcBookFileName:
          editData.RcBookFileName || (rcbookDoc ? rcbookDoc.file : ""),
        // For renewals we explicitly clear the running policy file so the Upload field is empty
        RunningPolicyFileName: isRenewalEdit
          ? ""
          : editData.RunningPolicyFileName ||
            runningPolicy.CurrentPolicyFile ||
            "",
        CurrentPolicyFile: isRenewalEdit
          ? null
          : editData.CurrentPolicyFile ||
            runningPolicy.CurrentPolicyFile ||
            null,
        previousPolicy: {
          ...(editData.previousPolicy || {}),
          // Ensure agent details are properly mapped for portability
          agentName:
            editData.previousPolicy?.agentName ||
            editData.previousPolicy?.AgentName ||
            "",
          agentCode:
            editData.previousPolicy?.agentCode ||
            editData.previousPolicy?.AgentCode ||
            "",
          agentContactNumber:
            editData.previousPolicy?.agentContactNumber ||
            editData.previousPolicy?.AgentContactNumber ||
            "",
        },
        documents: documents,
        reference: reference,
        runningPolicy: runningPolicy,
        user_pk_vehicle_id: user,
      }));

      console.log("✅ [FIX] FormData repopulated successfully");
      console.log(
        "✅ [FIX] Final formData.policyRadio:",
        editData.policyRadio || editData.vehicle_policy_type || "Fresh"
      );
      console.log(
        "✅ [FIX] Final formData.previousPolicy:",
        editData.previousPolicy || {}
      );
    }
  }, [editData, isModalOpen, policyPlans, references, policyTypes]);

  // Debug useEffect for vehicle list

  useEffect(() => {
    console.log("Vehicle list updated:", vehicleList);
  }, [vehicleList]);

  // useEffect to handle editData changes and update form data

  useEffect(() => {
    if (editData && vehicleList.length > 0) {
      console.log("Edit data or vehicle list changed, updating form data");

      console.log("Current editData:", editData);

      console.log("Current vehicleList:", vehicleList);

      // If we have a vehicle type in editData but it's not in the current vehicle list, add it

      const editVehicleType = editData.vehicle_type || editData.VehicleType;

      if (
        editVehicleType &&
        !vehicleList.find((v) => v.vehicle_name === editVehicleType)
      ) {
        console.log("Adding missing vehicle type to list:", editVehicleType);

        const newVehicle = {
          vehicle_id: Date.now(),

          vehicle_name: editVehicleType,
        };

        setVehicleList((prev) => [...prev, newVehicle]);
      }
    }
  }, [editData, vehicleList]);

  const getVehicleData = async (dateParams = {}) => {
    setVehicleLoading(true);

    const consumerData = await getVehicleUserRenewalData(dateParams);

    let renewalData = Array.isArray(consumerData?.data)
      ? consumerData.data
      : [];

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

      const dateA = parseDate(a.runningPolicy?.PolicyIssuedDate);

      const dateB = parseDate(b.runningPolicy?.PolicyIssuedDate);

      return dateB - dateA;
      //     const dateA = a.issueDate === 'N/A' ? -Infinity : new Date(a.issueDate.split('/').reverse().join('-')).getTime();
      // const dateB = b.issueDate === 'N/A' ? -Infinity : new Date(b.issueDate.split('/').reverse().join('-')).getTime();

      // return dateB - dateA;
    });

    setData(renewalData);

    // Always set filteredData to the full dataset initially
    // Date filtering will be applied by the search function when needed
    setFilteredData(renewalData);

    setHeading([
      { key: "issueDate", head: "Issue Date" },

      { key: "name", head: "Name" },

      { key: "email", head: "Email" },

      { key: "mobileNumber", head: "Mobile Number" },

      { key: "vehicleNumber", head: "Vehicle Number" },

      { key: "make", head: "Make" },

      { key: "model", head: "Model" },

      { key: "reference", head: "Reference" },

      { key: "contactPersonName", head: "Contact Person Name" },

      { key: "contactPersonNumber", head: "Contact Person Number" },

      { key: "vendor", head: "Vendor" },

      { key: "companyName", head: "Company Name" },

      { key: "chassisNumber", head: "Chassis Number" },

      { key: "policyTenure", head: "Policy Tenure" },

      { key: "policyFrom", head: "Policy From" },

      { key: "policyTo", head: "Policy To" },

      { key: "nomineeName", head: "Nominee Name" },

      { key: "nomineeRelation", head: "Nominee Relation" },

      { key: "nomineeAge", head: "Nominee Age" },

      { key: "nomineeDob", head: "Nominee DOB" },

      { key: "premiumAmount", head: "Premium Amount" },

      { key: "createdDate", head: "Created Date" },
    ]);

    setVehicleLoading(false);
  };

  const fetchPolicyPlans = async () => {
    const response = await getAllPolicyPlans();

    if (response && response.data) {
      setPolicyPlans(response.data);
    }
  };

  const fetchReferences = async () => {
    const response = {
      data: [
        { reference_id: 1, reference_name: "SUNNYSIR" },

        { reference_id: 2, reference_name: "ANOTHER_REF" },
      ],
    };

    if (response && response.data) {
      setReferences(response.data);
    }
  };

  const fetchVehicleTypes = async () => {
    setVehicleLoading(true);

    try {
      const response = await getAllVehicles();

      if (response && response.data) {
        setVehicleList(response.data);
      } else {
        // Set default vehicle types if API fails

        setVehicleList([
          { vehicle_id: 1, vehicle_name: "Two Wheeler" },

          { vehicle_id: 2, vehicle_name: "Four Wheeler" },

          { vehicle_id: 3, vehicle_name: "Commercial Vehicle" },
        ]);
      }
    } catch (error) {
      console.error("Failed to fetch vehicle types:", error);

      // Set default vehicle types if API fails

      setVehicleList([
        { vehicle_id: 1, vehicle_name: "Two Wheeler" },

        { vehicle_id: 2, vehicle_name: "Four Wheeler" },

        { vehicle_id: 3, vehicle_name: "Commercial Vehicle" },
      ]);
    } finally {
      setVehicleLoading(false);
    }
  };

  const fetchPolicyTypes = async () => {
    try {
      const policyTypeRes = await getAllPolicyTypes();

      if (policyTypeRes && policyTypeRes.data) {
        setPolicyTypes(policyTypeRes.data);

        // If we're currently editing and have a policy_type_id, update the PolicyType field

        if (
          editData &&
          (editData.runningPolicy?.policy_type_id ||
            editData.runningPolicy?.PolicyTypeId)
        ) {
          const policyTypeId =
            editData.runningPolicy?.policy_type_id ||
            editData.runningPolicy?.PolicyTypeId;

          const foundPolicyType = policyTypeRes.data.find(
            (pt) => pt.policy_type_id === policyTypeId
          );

          if (foundPolicyType) {
            setFormData((prev) => ({
              ...prev,

              PolicyType: foundPolicyType.policy_type_name,
            }));
          }
        }
      }
    } catch (e) {
      console.error("Failed to fetch policy types", e);
    }
  };

  const fetchCompanyTypes = async () => {
    try {
      console.log("🔍 Fetching company types...");
      const response = await getAllCompanyTypes();
      console.log("🔍 Company types response:", response);

      if (response && response.data) {
        console.log("🔍 Setting company types:", response.data);
        setCompanyTypes(response.data);
      } else {
        console.log("🔍 No company types data found");
      }
    } catch (e) {
      console.error("Failed to fetch company types", e);
    }
  };

  // Function to apply both search and date filtering
  const applyFilters = (searchQuery = "") => {
    // First apply search filter
    let searchFiltered = data;
    if (searchQuery.trim()) {
      searchFiltered = data.filter((row) => {
        const user = row.user_pk_vehicle_id || {};
        const runningPolicy = row.runningPolicy || {};
        const reference = row.reference || {};
        const hasVehicleRecord = row.vehicle_user_id && row.vehicle_number;

        return (
          user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.mobileNumber
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (hasVehicleRecord &&
            row.vehicle_number
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase())) ||
          (hasVehicleRecord &&
            row.make?.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (hasVehicleRecord &&
            row.model?.toLowerCase().includes(searchQuery.toLowerCase())) ||
          reference.reference_name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (hasVehicleRecord &&
            row.contact_person_name
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase())) ||
          (hasVehicleRecord &&
            row.contact_person_no
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase())) ||
          (hasVehicleRecord &&
            row.company_name
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase())) ||
          (hasVehicleRecord &&
            runningPolicy.Vendor &&
            runningPolicy.Vendor.toLowerCase().includes(
              searchQuery.toLowerCase()
            ))
        );
      });
    }

    // Then apply date filter if dates are selected
    let finalFiltered = searchFiltered;
    if (startDate && endDate) {
      finalFiltered = searchFiltered.filter((item) => {
        const date =
          item?.runningPolicy?.PolicyIssuedDate ||
          item?.runningPolicy?.PolicyFrom ||
          item?.createdAt ||
          "";
        return isWithinDateRange(date, startDate, endDate);
      });
    }

    setFilteredData(finalFiltered);
  };

  const handleSearch = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates.");

      return;
    }

    localStorage.setItem("vehicleInsuranceStartDate", startDate);

    localStorage.setItem("vehicleInsuranceEndDate", endDate);

    await getVehicleData({ startDate, endDate });

    // Apply filters after data is loaded
    applyFilters();
  };

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [viewData, setViewData] = useState(null);

  // States for inline add functionality

  const [showAddVehicleField, setShowAddVehicleField] = useState(false);

  const [showAddPolicyPlanField, setShowAddPolicyPlanField] = useState(false);

  const [showAddPolicyTypeField, setShowAddPolicyTypeField] = useState(false);

  const [showAddReferenceField, setShowAddReferenceField] = useState(false);

  const [showAddDocumentField, setShowAddDocumentField] = useState(false);

  // New field values

  const [newVehicleName, setNewVehicleName] = useState("");

  const [newPolicyPlanName, setNewPolicyPlanName] = useState("");

  const [newPolicyTypeName, setNewPolicyTypeName] = useState("");

  const [newReferenceName, setNewReferenceName] = useState("");

  const [newDocumentName, setNewDocumentName] = useState("");

  const handleViewDetails = (item) => {
    console.log("🔍 [VIEW] Opening view modal for item:", item);

    const originalData = item.originalData || item;

    // NEW CODE:
    // Get documents - check multiple possible locations
    const documents =
      originalData.documents ||
      originalData.vehicle_documents ||
      originalData.vehicleRecords?.[0]?.documents ||
      [];

    console.log("🔍 [VIEW] Documents found:", documents);

    // Parse runningPolicy if it's a string
    let runningPolicyData = originalData.runningPolicy || {};
    if (typeof runningPolicyData === "string") {
      try {
        runningPolicyData = JSON.parse(runningPolicyData);
      } catch (e) {
        console.error("Failed to parse runningPolicy:", e);
      }
    }

    const viewDataFlattened = {
      // Consumer fields
      username: originalData.username || originalData.Name || "N/A",
      email: originalData.email || originalData.Email || "N/A",
      mobileNumber:
        originalData.mobileNumber || originalData.MobileNumber || "N/A",
      reference_name:
        originalData.referenceName ||
        originalData.reference?.reference_name ||
        "N/A",
      contact_person_name:
        originalData.contact_person_name ||
        originalData.ContactPersonName ||
        "N/A",
      contact_person_no:
        originalData.contact_person_no ||
        originalData.ContactPersonMobileNumber ||
        "N/A",

      // Vehicle fields - THESE ARE THE KEY FIXES
      vehicle_number:
        originalData.vehicle_number || originalData.VehicleNumber || "N/A",
      make: originalData.make || originalData.Make || "N/A",
      model: originalData.model || originalData.Model || "N/A",
      chassis_number:
        originalData.chassis_number || originalData.ChassisNumber || "N/A",
      company_name:
        originalData.company_name ||
        originalData.CompanyName ||
        runningPolicyData.CompanyType?.company_name ||
        "N/A",
      vehicle_policy_type:
        originalData.vehicle_policy_type || originalData.policyRadio || "N/A",
      policy_type: originalData.policy_type || originalData.PolicyType || "N/A",
      // vendor: originalData.vendor || originalData.Vendor || 'N/A',
      vendor:
        runningPolicyData.Vendor ||
        originalData.vendor ||
        originalData.Vendor ||
        "N/A",

      // Agent details
      // Agent details - check previousPolicy first, then top level
      agentName:
        originalData.previousPolicy?.agentName ||
        originalData.agentName ||
        originalData.AgentName ||
        runningPolicyData.agentName ||
        "N/A",
      agentCode:
        originalData.previousPolicy?.agentCode ||
        originalData.agentCode ||
        originalData.AgentCode ||
        runningPolicyData.agentCode ||
        "N/A",
      agentContactNumber:
        originalData.previousPolicy?.agentContactNumber ||
        originalData.agentContactNumber ||
        originalData.AgentContactNumber ||
        runningPolicyData.agentContactNumber ||
        "N/A",

      // Running Policy fields
      runningPolicy: {
        PolicyNumber: runningPolicyData.PolicyNumber || "N/A",
        PolicyTypeId:
          runningPolicyData.PolicyTypeId ||
          runningPolicyData.policy_type_id ||
          null,
        policy_type:
          runningPolicyData.policy_type ||
          runningPolicyData.PolicyType ||
          originalData.policy_type ||
          "N/A",
        PolicyPlanType:
          runningPolicyData.PolicyPlanType ||
          runningPolicyData.policy_plan_type ||
          originalData.policy_plan_type ||
          "N/A",
        PolicyFrom: runningPolicyData.PolicyFrom || "N/A",
        PolicyTo: runningPolicyData.PolicyTo || "N/A",
        PolicyIssuedDate: runningPolicyData.PolicyIssuedDate || "N/A",
        PremiumAmount: runningPolicyData.PremiumAmount || "N/A",
        Vendor: runningPolicyData.Vendor || originalData.vendor || "N/A",
        NomineeName: runningPolicyData.NomineeName || "N/A",
        NomineeDob: runningPolicyData.NomineeDob || "N/A",
        CurrentPolicyFile: runningPolicyData.CurrentPolicyFile || null,
        CompanyType: runningPolicyData.CompanyType || null,
        CompanyName:
          runningPolicyData.CompanyName || originalData.company_name || "N/A",
        agentName:
          runningPolicyData.agentName || originalData.agentName || "N/A",
        agentCode:
          runningPolicyData.agentCode || originalData.agentCode || "N/A",
        agentContactNumber:
          runningPolicyData.agentContactNumber ||
          originalData.agentContactNumber ||
          "N/A",
      },

      // Documents - THIS IS ALSO A KEY FIX
      documents: documents,
    };

    console.log("🔍 [VIEW] Flattened viewData:", viewDataFlattened);

    setViewData(viewDataFlattened);
    setIsViewModalOpen(true);
  };

  // Handler functions for inline add functionality

  const handleAddVehicleInline = () => {
    if (!newVehicleName.trim()) {
      toast.error("Please enter vehicle name");

      return;
    }

    const newVehicle = {
      vehicle_id: Date.now(),

      vehicle_name: newVehicleName,
    };

    console.log("Adding new vehicle:", newVehicle);

    console.log("Current vehicle list:", vehicleList);

    setVehicleList((prev) => {
      const updatedList = [...prev, newVehicle];

      console.log("Updated vehicle list:", updatedList);

      return updatedList;
    });

    setFormData((prev) => {
      const updated = { ...prev, VehicleType: newVehicle.vehicle_name };

      console.log("Updated form data VehicleType:", updated.VehicleType);

      return updated;
    });

    setNewVehicleName("");

    setShowAddVehicleField(false);

    toast.success("Vehicle added successfully!");
  };

  const handleAddPolicyPlanInline = () => {
    if (!newPolicyPlanName.trim()) {
      toast.error("Please enter policy plan name");

      return;
    }

    const newPolicyPlan = {
      policy_id: Date.now(),

      policy_name: newPolicyPlanName,
    };

    setPolicyPlans((prev) => [...prev, newPolicyPlan]);

    setFormData((prev) => ({
      ...prev,
      PolicyPlanType: newPolicyPlan.policy_name,
    }));

    setNewPolicyPlanName("");

    setShowAddPolicyPlanField(false);

    toast.success("Policy plan added successfully!");
  };

  const handleAddPolicyTypeInline = () => {
    if (!newPolicyTypeName.trim()) {
      toast.error("Please enter policy type name");

      return;
    }

    const newPolicyType = {
      policy_type_id: Date.now(),

      policy_type_name: newPolicyTypeName,
    };

    setPolicyTypes((prev) => [...prev, newPolicyType]);

    setFormData((prev) => ({
      ...prev,
      PolicyType: newPolicyType.policy_type_name,
    }));

    setNewPolicyTypeName("");

    setShowAddPolicyTypeField(false);

    toast.success("Policy type added successfully!");
  };

  const handleAddCompanyInline = () => {
    if (!newCompanyName.trim()) {
      toast.error("Please enter company name");

      return;
    }

    setFormData((prev) => ({ ...prev, CompanyName: newCompanyName }));

    setNewCompanyName("");

    setShowAddCompanyField(false);

    toast.success("Company name added successfully!");
  };

  const handleAddReferenceInline = () => {
    if (!newReferenceName.trim()) {
      toast.error("Please enter reference name");

      return;
    }

    const newReference = {
      reference_id: Date.now(),

      reference_name: newReferenceName,
    };

    setReferences((prev) => [...prev, newReference]);

    setFormData((prev) => ({
      ...prev,
      Reference: newReference.reference_name,
    }));

    setNewReferenceName("");

    setShowAddReferenceField(false);

    toast.success("Reference added successfully!");
  };

  const handleAddDocumentInline = () => {
    if (!newDocumentName.trim()) {
      toast.error("Please enter category name");

      return;
    }

    const newDocument = {
      category_id: Date.now(), // Generate a unique ID

      document_name: newDocumentName,
    };

    // Add to custom documents list

    setCustomDocuments((prev) => [...prev, newDocument]);

    // Add the new category to formData with a null file value

    setFormData((prev) => ({
      ...prev,

      [`custom_${newDocument.category_id}`]: null,

      [`custom_${newDocument.category_id}_fileName`]: "",
    }));

    setNewDocumentName("");

    setShowAddDocumentField(false);

    toast.success("Document category added successfully!");
  };

  // const handleEdit = async (userData) => {
  //   console.log('🔍 [EDIT POPUP] Opening edit popup for userData:', userData);

  //   // Use original data if available, otherwise fall back to userData
  //   const originalData = userData.originalData || userData;
  //   console.log('🔍 [EDIT POPUP] Using originalData:', originalData);
  //   console.log('🔍 [EDIT POPUP] Vehicle user ID:', originalData.vehicle_user_id);

  //   // Fetch complete vehicle user data to get agent details
  //   let completeUserData = originalData;

  //   if (originalData.vehicle_user_id) {

  //     try {

  //       const fullData = await getVehicleUserById(originalData.vehicle_user_id);

  //       console.log('🔍 [EDIT] Full API response:', fullData);
  //       console.log('🔍 [EDIT] Documents in response:', fullData?.documents);
  //       console.log('🔍 [EDIT] API response structure:', {
  //           hasDocuments: !!fullData?.documents,
  //           documentsType: typeof fullData?.documents,
  //           documentsLength: fullData?.documents?.length,
  //           vehicle_user_id: fullData?.vehicle_user_id
  //       });

  //       if (fullData) {

  //         completeUserData = fullData;

  //         console.log('Complete vehicle user data fetched:', fullData);
  //         console.log('🔍 [EDIT] previousPolicy from API:', fullData.previousPolicy);
  //         console.log('🔍 [EDIT] previousPolicy agent details:', {
  //           agentName: fullData.previousPolicy?.agentName,
  //           agentCode: fullData.previousPolicy?.agentCode,
  //           agentContactNumber: fullData.previousPolicy?.agentContactNumber
  //         });

  //         // Set editData with the complete data from API
  //         setEditData({
  //           ...fullData,
  //           previousPolicy: {
  //             ...(fullData.previousPolicy || {}),
  //             agentName: fullData.previousPolicy?.agentName || fullData.previousPolicy?.AgentName || '',
  //             agentCode: fullData.previousPolicy?.agentCode || fullData.previousPolicy?.AgentCode || '',
  //             agentContactNumber: fullData.previousPolicy?.agentContactNumber || fullData.previousPolicy?.AgentContactNumber || '',
  //           }
  //         });

  //       } else {
  //         setEditData(originalData);
  //       }

  //     } catch (error) {

  //       setEditData(originalData);

  //       console.error('Failed to fetch complete vehicle user data:', error);

  //     }

  //   }

  //   const user = completeUserData.user_pk_vehicle_id || {};

  //   const runningPolicy = completeUserData.runningPolicy || {};

  //   const reference = completeUserData.reference || {};

  //   const documents = completeUserData.documents || completeUserData.vehicle_documents || [];

  //   console.log('🔍 [EDIT] Documents received:', documents);
  //   console.log('🔍 [EDIT] Document structure:', documents.map(doc => ({
  //     categoryId: doc.categoryId,
  //     file: doc.file,
  //     id: doc.id
  //   })));

  //   const aadharDoc = documents.find(doc => doc.categoryId == 1 || doc.categoryId === 1 || doc.categoryId === '1');

  //   const panDoc = documents.find(doc => doc.categoryId == 2 || doc.categoryId === 2 || doc.categoryId === '2');

  //   const gstDoc = documents.find(doc => doc.categoryId == 3 || doc.categoryId === 3 || doc.categoryId === '3');

  //   const rcbookDoc = documents.find(doc => doc.categoryId == 4 || doc.categoryId === 4 || doc.categoryId === '4');

  //   console.log('🔍 [EDIT] Found documents:', {
  //     aadharDoc: aadharDoc,
  //     panDoc: panDoc,
  //     gstDoc: gstDoc,
  //     rcbookDoc: rcbookDoc
  //   });

  //   // Debug logging for Policy Type

  //   console.log('Edit Data - userData:', userData);

  //   console.log('Edit Data - completeUserData:', completeUserData);

  //   console.log('Edit Data - runningPolicy:', runningPolicy);

  //   console.log('Edit Data - Agent fields available:', {

  //     agent_name: completeUserData.agent_name,

  //     agentName: completeUserData.agentName,

  //     AgentName: completeUserData.AgentName,

  //     agent_code: completeUserData.agent_code,

  //     agentCode: completeUserData.agentCode,

  //     AgentCode: completeUserData.AgentCode,

  //     agent_contact_number: completeUserData.agent_contact_number,

  //     agentContactNumber: completeUserData.agentContactNumber,

  //     AgentContactNumber: completeUserData.AgentContactNumber

  //   });

  //   // Debug logging for Name/Email/Mobile fields

  //   console.log('Edit Data - Name/Email/Mobile fields available:', {

  //     completeUserData_Name: completeUserData.Name,

  //     completeUserData_name: completeUserData.name,

  //     user_username: user.username,

  //     completeUserData_username: completeUserData.username,

  //     completeUserData_Email: completeUserData.Email,

  //     completeUserData_email: completeUserData.email,

  //     user_email: user.email,

  //     completeUserData_MobileNumber: completeUserData.MobileNumber,

  //     completeUserData_mobile_number: completeUserData.mobile_number,

  //     user_mobileNumber: user.mobileNumber,

  //     completeUserData_mobileNumber: completeUserData.mobileNumber

  //   });

  //   console.log('Edit Data - Policy Type sources:', {

  //     runningPolicy_policy_type_id: runningPolicy.policy_type_id,

  //     runningPolicy_policy_type_name: runningPolicy.policy_type_name,

  //     runningPolicy_policy_type: runningPolicy.policy_type,

  //     userData_running_policy_type: userData.running_policy_type,

  //     userData_vehicle_policy_type: userData.vehicle_policy_type,

  //     userData_policy_type_dropdown: userData.policy_type_dropdown

  //   });

  //   console.log('🔍 [EDIT] About to set formData');
  //   console.log('🔍 [EDIT] completeUserData.previousPolicy:', completeUserData.previousPolicy);
  //   console.log('🔍 [EDIT] completeUserData.vehicle_policy_type:', completeUserData.vehicle_policy_type);

  //   setFormData({

  //     Name: completeUserData.Name || completeUserData.name || user.username || completeUserData.username || '',

  //     Email: completeUserData.Email || completeUserData.email || user.email || '',

  //     MobileNumber: completeUserData.MobileNumber || completeUserData.mobile_number || user.mobileNumber || completeUserData.mobileNumber || '',

  //     ContactPersonName: completeUserData.contact_person_name || '',

  //     ContactPersonMobileNumber: completeUserData.contact_person_no || '',

  //     policyRadio: completeUserData.vehicle_policy_type || 'Fresh',

  //     Type: completeUserData.nominee_type || 'Individual',

  //     VehicleType: completeUserData.vehicle_type || completeUserData.VehicleType || '',

  //     VehicleNumber: completeUserData.vehicle_number || '',

  //     Make: completeUserData.make || '',

  //     Model: completeUserData.model || '',

  //     ManufacturingYear: completeUserData.manufacturing_year || '',

  //     EngineNumber: completeUserData.engine_number || '',

  //     ChassisNumber: completeUserData.chassis_number || '',

  //     PolicyNumber: runningPolicy.PolicyNumber || '',

  //     PolicyIssuedDate: runningPolicy.PolicyIssuedDate || '',

  //     PolicyExpiryDate: runningPolicy.PolicyTo || runningPolicy.ExpiryDate || runningPolicy.PolicyExpiryDate || '',

  //     PolicyTenure: runningPolicy.PolicyTenure || '',

  //     From: runningPolicy.PolicyFrom || '',

  //     To: runningPolicy.PolicyTo || '',

  //     PremiumAmount: runningPolicy.PremiumAmount || '',

  //     NCB: runningPolicy.NCB || '',

  //     IDV: runningPolicy.IDV || '',

  //     NomineeName: runningPolicy.NomineeName || '',

  //     NomineeRelation: runningPolicy.NomineeRelation || '',

  //     NomineeAge: (() => {

  //       if (runningPolicy.NomineeDob) {

  //         const dob = new Date(runningPolicy.NomineeDob);

  //         const today = new Date();

  //         const age = today.getFullYear() - dob.getFullYear();

  //         const monthDiff = today.getMonth() - dob.getMonth();

  //         if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {

  //           return age - 1;

  //         }

  //         return age;

  //       }

  //       return runningPolicy.NomineeAge || '';

  //     })(),

  //     NomineeDob: runningPolicy.NomineeDob || '',

  //     CompanyName: completeUserData.company_name || '',

  //     Vendor: runningPolicy.Vendor || completeUserData.vendor || '',

  //     PolicyPlanType: (() => {

  //       // First try to find policy plan name by ID from runningPolicy

  //       if (runningPolicy.policy_plan_id && policyPlans.length > 0) {

  //         const foundPolicyPlan = policyPlans.find(pp => pp.policy_plan_id === runningPolicy.policy_plan_id);

  //         if (foundPolicyPlan) {

  //           return foundPolicyPlan.policy_name;

  //         }

  //       }

  //       // Fallback to other sources

  //       return completeUserData.policy_plan_type || '';

  //     })(),

  //     PolicyType: (() => {

  //       // First try to find policy type name by ID from runningPolicy

  //       if ((runningPolicy.policy_type_id || runningPolicy.PolicyTypeId) && policyTypes.length > 0) {

  //         const policyTypeId = runningPolicy.policy_type_id || runningPolicy.PolicyTypeId;

  //         const foundPolicyType = policyTypes.find(pt => pt.policy_type_id === policyTypeId);

  //         if (foundPolicyType) {

  //           return foundPolicyType.policy_type_name;

  //         }

  //       }

  //       // Fallback to other sources (exclude vehicle_policy_type as it contains Fresh/Renewal, not policy type)

  //       return runningPolicy.policy_type_name || runningPolicy.policy_type || completeUserData.running_policy_type || completeUserData.policy_type_dropdown || '';

  //     })(),

  //     AgentName: completeUserData.agentName || completeUserData.agent_name || completeUserData.AgentName || '',

  //     AgentCode: completeUserData.agentCode || completeUserData.agent_code || completeUserData.AgentCode || '',

  //     AgentContactNumber: completeUserData.agentContactNumber || completeUserData.agent_contact_number || completeUserData.AgentContactNumber || '',

  //     Reference: (() => {

  //       // First try to find reference name by ID from completeUserData

  //       if (completeUserData.reference_id && references.length > 0) {

  //         const foundReference = references.find(r => r.reference_id === completeUserData.reference_id);

  //         if (foundReference) {

  //           return foundReference.reference_name;

  //         }

  //       }

  //       // Fallback to other sources

  //       return reference.reference_name || '';

  //     })(),

  //     vehicle_user_id: completeUserData.vehicle_user_id || completeUserData.id || '',

  //     AadharFileName: aadharDoc ? aadharDoc.file : '',

  //     PanFileName: panDoc ? panDoc.file : '',

  //     GstFileName: gstDoc ? gstDoc.file : '',

  //     RcBookFileName: rcbookDoc ? rcbookDoc.file : '',

  //     RunningPolicyFileName: runningPolicy.CurrentPolicyFile || '',

  //     // Debug logging for document filenames
  //     _debugDocumentFilenames: {
  //       AadharFileName: aadharDoc ? aadharDoc.file : '',
  //       PanFileName: panDoc ? panDoc.file : '',
  //       GstFileName: gstDoc ? gstDoc.file : '',
  //       RcBookFileName: rcbookDoc ? rcbookDoc.file : ''
  //     },

  //     // Additional debug info
  //     _debugInfo: {
  //       totalDocuments: documents.length,
  //       aadharDocExists: !!aadharDoc,
  //       panDocExists: !!panDoc,
  //       gstDocExists: !!gstDoc,
  //       rcbookDocExists: !!rcbookDoc,
  //       vehicle_user_id: completeUserData.vehicle_user_id || completeUserData.id || ''
  //     },

  //     previousPolicy: {
  //       ...(completeUserData.previousPolicy || {}),
  //       // Ensure agent details are properly mapped for portability
  //       agentName: completeUserData.previousPolicy?.agentName || completeUserData.previousPolicy?.AgentName || '',
  //       agentCode: completeUserData.previousPolicy?.agentCode || completeUserData.previousPolicy?.AgentCode || '',
  //       agentContactNumber: completeUserData.previousPolicy?.agentContactNumber || completeUserData.previousPolicy?.AgentContactNumber || '',
  //     },

  //     documents: documents,

  //     reference: reference,

  //     runningPolicy: runningPolicy,

  //     user_pk_vehicle_id: user,

  //   });

  //   // Log what we're actually setting in formData
  //   console.log('🔍 [EDIT] About to set formData with filenames:', {
  //     AadharFileName: aadharDoc ? aadharDoc.file : '',
  //     PanFileName: panDoc ? panDoc.file : '',
  //     GstFileName: gstDoc ? gstDoc.file : '',
  //     RcBookFileName: rcbookDoc ? rcbookDoc.file : '',
  //     aadharDoc: aadharDoc,
  //     panDoc: panDoc,
  //     gstDoc: gstDoc,
  //     rcbookDoc: rcbookDoc
  //   });

  //   console.log('🔍 [EDIT] Setting form data with debug info:', {
  //     AadharFileName: formData.AadharFileName,
  //     PanFileName: formData.PanFileName,
  //     GstFileName: formData.GstFileName,
  //     debugInfo: formData._debugInfo,
  //     debugDocumentFilenames: formData._debugDocumentFilenames
  //   });

  //   // Debug logging for final form data values

  //   console.log('Final form data values set:', {

  //     Name: completeUserData.Name || completeUserData.name || user.username || completeUserData.username || '',

  //     Email: completeUserData.Email || completeUserData.email || user.email || '',

  //     MobileNumber: completeUserData.MobileNumber || completeUserData.mobile_number || user.mobileNumber || completeUserData.mobileNumber || '',

  //     AgentName: completeUserData.agentName || completeUserData.agent_name || completeUserData.AgentName || '',

  //     AgentCode: completeUserData.agentCode || completeUserData.agent_code || completeUserData.AgentCode || '',

  //     AgentContactNumber: completeUserData.agentContactNumber || completeUserData.agent_contact_number || completeUserData.AgentContactNumber || '',

  //     PolicyExpiryDate: runningPolicy.PolicyTo || runningPolicy.ExpiryDate || runningPolicy.PolicyExpiryDate || '',

  //     NomineeAge: (() => {

  //       if (runningPolicy.NomineeDob) {

  //         const dob = new Date(runningPolicy.NomineeDob);

  //         const today = new Date();

  //         const age = today.getFullYear() - dob.getFullYear();

  //         const monthDiff = today.getMonth() - dob.getMonth();

  //         if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {

  //           return age - 1;

  //         }

  //         return age;

  //       }

  //       return runningPolicy.NomineeAge || '';

  //     })()

  //   });

  //   // Debug logging for final PolicyType value

  //   const finalPolicyType = (() => {

  //     if ((runningPolicy.policy_type_id || runningPolicy.PolicyTypeId) && policyTypes.length > 0) {

  //       const policyTypeId = runningPolicy.policy_type_id || runningPolicy.PolicyTypeId;

  //       const foundPolicyType = policyTypes.find(pt => pt.policy_type_id === policyTypeId);

  //       if (foundPolicyType) {

  //         return foundPolicyType.policy_type_name;

  //       }

  //     }

  //     return runningPolicy.policy_type_name || runningPolicy.policy_type || completeUserData.running_policy_type || completeUserData.vehicle_policy_type || completeUserData.policy_type_dropdown || '';

  //   })();

  //   console.log('Final PolicyType value set:', {

  //     PolicyType: finalPolicyType,

  //     policyTypes_available: policyTypes.map(pt => ({ id: pt.policy_type_id, name: pt.policy_type_name })),

  //     runningPolicy_policy_type_id: runningPolicy.policy_type_id

  //   });

  //   // Debug logging for vehicle data

  //   console.log('Vehicle data in edit:', {

  //     userData_vehicle_type: userData.vehicle_type,

  //     userData_VehicleType: userData.VehicleType,

  //     formData_VehicleType: formData.VehicleType,

  //     vehicleList_length: vehicleList.length,

  //     vehicleList: vehicleList

  //   });

  //   // Ensure vehicle list is populated before opening modal

  //   if (vehicleList.length === 0) {

  //     console.log('Vehicle list is empty, fetching vehicle types first');

  //     fetchVehicleTypes(); // Remove await since function is not async

  //   }

  //   setIsModalOpen(true);

  //   setStep(1);

  // };

  const handleEdit = async (userData) => {
    console.log("🔍 [EDIT POPUP] Opening edit popup for userData:", userData);

    const originalData = userData.originalData || userData;
    console.log("🔍 [EDIT POPUP] Using originalData:", originalData);

    // Extract vehicle_user_id safely
    const vehicleUserId =
      originalData.vehicleRecords?.[0]?.vehicle_user_id ||
      originalData.vehicle_user_id;
    console.log("🔍 [EDIT POPUP] Vehicle user ID:", vehicleUserId);

    let completeUserData = originalData;

    // Function to safely get value or fallback to 'N/A'
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
      return "N/A";
    };

    // Nominee age calculation
    const calculateNomineeAge = (dob) => {
      if (!dob || dob === "N/A") return "";
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
          const runningPolicy = fullData.runningPolicy || {};
          const previousPolicy =
            (Array.isArray(fullData.previousPolicies)
              ? fullData.previousPolicies
                  .filter((p) => p.status !== "active")
                  .sort(
                    (a, b) => new Date(b.PolicyTo) - new Date(a.PolicyTo)
                  )[0]
              : null) ||
            fullData.previousPolicy ||
            null;

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
            runningPolicy,
            previousPolicy,
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
        console.error("❌ [EDIT] Failed to fetch vehicle user data:", error);
        completeUserData = originalData;
      }
    } else {
      console.warn("⚠️ [EDIT] No vehicle_user_id found, using originalData.");
    }

    // Build final form data with fallbacks to 'N/A'
    const user = completeUserData.user_pk_vehicle_id || {};
    const runningPolicy = completeUserData.runningPolicy || {};
    const reference = completeUserData.reference || {};

    const newFormData = {
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
      VehicleType: getValue(completeUserData, "vehicle_type"),
      VehicleNumber: getValue(completeUserData, "vehicle_number"),
      Make: getValue(completeUserData, "make"),
      Model: getValue(completeUserData, "model"),
      ManufacturingYear: getValue(completeUserData, "manufacturing_year"),
      EngineNumber: getValue(completeUserData, "engine_number"),
      ChassisNumber: getValue(completeUserData, "chassis_number"),

      PolicyNumber: getValue(runningPolicy, "PolicyNumber"),
      PolicyIssuedDate: getValue(runningPolicy, "PolicyIssuedDate"),
      PolicyExpiryDate: getValue(
        runningPolicy,
        "PolicyTo",
        "ExpiryDate",
        "PolicyExpiryDate"
      ),
      PolicyTenure: getValue(runningPolicy, "PolicyTenure"),
      PremiumAmount: getValue(runningPolicy, "PremiumAmount"),
      NCB: getValue(runningPolicy, "NCB"),
      IDV: getValue(runningPolicy, "IDV"),

      // If this edit is part of a renewal flow, clear running-policy nominee fields so user can enter new nominee
      // Detect renewal via common flags from the API or incoming data
      ...(function () {
        const isRenewalEdit =
          completeUserData &&
          (completeUserData.policyRadio === "Renewal" ||
            completeUserData.vehicle_policy_type === "Renewal" ||
            completeUserData.runningPolicy?.policy_type === "Renewal");
        if (isRenewalEdit) {
          return {
            NomineeName: "",
            NomineeRelation: "",
            NomineeDob: "",
            NomineeAge: "",
          };
        }
        return {
          NomineeName: getValue(runningPolicy, "NomineeName"),
          NomineeRelation: getValue(runningPolicy, "NomineeRelation"),
          NomineeDob: getValue(runningPolicy, "NomineeDob"),
          NomineeAge: calculateNomineeAge(
            getValue(runningPolicy, "NomineeDob")
          ),
        };
      })(),

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

      Reference: getValue(reference, "reference_name", "Reference"),
      vehicle_user_id: getValue(completeUserData, "vehicle_user_id", "id"),

      AadharFileName: getValue(completeUserData, "AadharFileName", ""),
      PanFileName: getValue(completeUserData, "PanFileName", ""),
      GstFileName: getValue(completeUserData, "GstFileName", ""),
      RcBookFileName: getValue(completeUserData, "RcBookFileName", ""),
      // Clear RunningPolicy file for renewal edits so upload input shows empty
      RunningPolicyFileName: (function () {
        const isRenewalEdit =
          completeUserData &&
          (completeUserData.policyRadio === "Renewal" ||
            completeUserData.vehicle_policy_type === "Renewal" ||
            completeUserData.runningPolicy?.policy_type === "Renewal");
        return isRenewalEdit
          ? ""
          : getValue(runningPolicy, "CurrentPolicyFile", "");
      })(),
      CurrentPolicyFile: (function () {
        const isRenewalEdit =
          completeUserData &&
          (completeUserData.policyRadio === "Renewal" ||
            completeUserData.vehicle_policy_type === "Renewal" ||
            completeUserData.runningPolicy?.policy_type === "Renewal");
        return isRenewalEdit
          ? null
          : getValue(runningPolicy, "CurrentPolicyFile", null);
      })(),

      previousPolicy: completeUserData.previousPolicy || {},
      documents: completeUserData.documents || [],
      user_pk_vehicle_id: user,
    };

    console.log("✅ [EDIT] Final formData with N/A placeholders:", newFormData);

    setFormData(newFormData);
    setEditData(completeUserData);
    setIsModalOpen(true);
    setStep(1);

    console.log("🎯 [EDIT] Modal opened successfully.");
  };

  // Handle renewal edit - move current running policy to previous policy
  const handleRenewalEdit = async (userData) => {
    console.log(
      "🔄 [VEHICLE RENEWAL] Starting renewal edit process for:",
      userData
    );

    setEditData(userData);

    // Fetch complete vehicle user data to get agent details
    let completeUserData = userData;
    if (userData.vehicle_user_id) {
      try {
        const fullData = await getVehicleUserById(userData.vehicle_user_id);

        console.log("🔍 [RENEWAL] Full API response:", fullData);
        console.log("🔍 [RENEWAL] Documents in response:", fullData?.documents);

        if (fullData) {
          completeUserData = fullData;
          console.log(
            "🔄 [VEHICLE RENEWAL] Complete vehicle user data fetched:",
            fullData
          );
        }
      } catch (error) {
        console.error(
          "🔄 [VEHICLE RENEWAL] Failed to fetch complete vehicle user data:",
          error
        );
      }
    }

    const user = completeUserData.user_pk_vehicle_id || {};
    const runningPolicy = completeUserData.runningPolicy || {};
    const reference = completeUserData.reference || {};
    const documents =
      completeUserData.documents || completeUserData.vehicle_documents || [];

    const aadharDoc = documents.find((doc) => doc.categoryId == 1);
    const panDoc = documents.find((doc) => doc.categoryId == 2);
    const gstDoc = documents.find((doc) => doc.categoryId == 3);
    const rcbookDoc = documents.find((doc) => doc.categoryId == 4);

    // Move current running policy to previous policy
    const previousPolicy = {
      PolicyNumber: runningPolicy.PolicyNumber || "",
      CompanyName:
        runningPolicy.CompanyName || completeUserData.company_name || "",
      PolicyFrom: runningPolicy.PolicyFrom || "",
      PolicyTo: runningPolicy.PolicyTo || "",
      PolicyTenure: runningPolicy.PolicyTenure || "",
      PremiumAmount: runningPolicy.PremiumAmount || "",
      IDV: runningPolicy.IDV || "",
      NCB: runningPolicy.NCB || "",
      NomineeName: runningPolicy.NomineeName || "",
      NomineeRelation: runningPolicy.NomineeRelation || "",
      NomineeDob: runningPolicy.NomineeDob || "",
      NomineeAge: runningPolicy.NomineeAge || "",
      PolicyIssuedDate: runningPolicy.PolicyIssuedDate || "",
      PolicyExpiryDate:
        runningPolicy.PolicyTo ||
        runningPolicy.ExpiryDate ||
        runningPolicy.PolicyExpiryDate ||
        "",
      PdfFile:
        runningPolicy.CurrentPolicyFile ||
        runningPolicy.RunningPolicyFileName ||
        null,
      // Also transfer the file name for display purposes
      PdfFileName:
        runningPolicy.CurrentPolicyFile ||
        runningPolicy.RunningPolicyFileName ||
        "",
    };

    console.log(
      "🔄 [VEHICLE RENEWAL] Moved running policy to previous policy:",
      previousPolicy
    );
    console.log("🔄 [VEHICLE RENEWAL] Company name handling:", {
      previousPolicyCompany: previousPolicy.CompanyName,
      runningPolicyCompany: runningPolicy.CompanyName,
      completeUserDataCompany: completeUserData.company_name,
    });

    // Reset running policy data for new entry
    const resetRunningPolicy = {
      PolicyNumber: "",
      PolicyIssuedDate: "",
      PolicyExpiryDate: "",
      PolicyTenure: "",
      From: "",
      To: "",
      PremiumAmount: "",
      NCB: "",
      IDV: "",
      NomineeName: "",
      NomineeRelation: "",
      NomineeAge: "",
      NomineeDob: "",
      Vendor: "",
      CurrentPolicyFile: "",
    };

    console.log(
      "🔄 [VEHICLE RENEWAL] Reset running policy data:",
      resetRunningPolicy
    );

    setFormData({
      // Keep all existing data
      Name:
        completeUserData.Name ||
        completeUserData.name ||
        user.username ||
        completeUserData.username ||
        "",
      Email:
        completeUserData.Email || completeUserData.email || user.email || "",
      MobileNumber:
        completeUserData.MobileNumber ||
        completeUserData.mobile_number ||
        user.mobileNumber ||
        completeUserData.mobileNumber ||
        "",
      ContactPersonName: completeUserData.contact_person_name || "",
      ContactPersonMobileNumber: completeUserData.contact_person_no || "",
      policyRadio: "Renewal", // Set to Renewal for renewal flow
      Type: completeUserData.nominee_type || "Individual",
      VehicleType:
        completeUserData.vehicle_type || completeUserData.VehicleType || "",
      VehicleNumber: completeUserData.vehicle_number || "",
      Make: completeUserData.make || "",
      Model: completeUserData.model || "",
      ManufacturingYear: completeUserData.manufacturing_year || "",
      EngineNumber: completeUserData.engine_number || "",
      ChassisNumber: completeUserData.chassis_number || "",
      CompanyName: "", // Clear company name for new policy
      Vendor: completeUserData.vendor || "",

      // Reset running policy data
      PolicyNumber: resetRunningPolicy.PolicyNumber,
      PolicyIssuedDate: resetRunningPolicy.PolicyIssuedDate,
      PolicyExpiryDate: resetRunningPolicy.PolicyExpiryDate,
      PolicyTenure: resetRunningPolicy.PolicyTenure,
      From: resetRunningPolicy.From,
      To: resetRunningPolicy.To,
      PremiumAmount: resetRunningPolicy.PremiumAmount,
      NCB: resetRunningPolicy.NCB,
      IDV: resetRunningPolicy.IDV,
      NomineeName: resetRunningPolicy.NomineeName,
      NomineeRelation: resetRunningPolicy.NomineeRelation,
      NomineeAge: resetRunningPolicy.NomineeAge,
      NomineeDob: resetRunningPolicy.NomineeDob,
      Vendor: resetRunningPolicy.Vendor,
      CurrentPolicyFile: resetRunningPolicy.CurrentPolicyFile,

      // Set previous policy data
      previousPolicy: previousPolicy,

      // Keep agent details
      AgentName:
        completeUserData.agentName ||
        completeUserData.agent_name ||
        completeUserData.AgentName ||
        "",
      AgentCode:
        completeUserData.agentCode ||
        completeUserData.agent_code ||
        completeUserData.AgentCode ||
        "",
      AgentContactNumber:
        completeUserData.agentContactNumber ||
        completeUserData.agent_contact_number ||
        completeUserData.AgentContactNumber ||
        "",

      // Keep reference
      Reference: (() => {
        if (completeUserData.reference_id && references.length > 0) {
          const foundReference = references.find(
            (r) => r.reference_id === completeUserData.reference_id
          );
          if (foundReference) {
            return foundReference.reference_name;
          }
        }
        return reference.reference_name || "";
      })(),

      // Keep IDs and other data
      vehicle_user_id:
        completeUserData.vehicle_user_id || completeUserData.id || "",
      AadharFileName: aadharDoc ? aadharDoc.file : "",
      PanFileName: panDoc ? panDoc.file : "",
      GstFileName: gstDoc ? gstDoc.file : "",
      RcBookFileName: rcbookDoc ? rcbookDoc.file : "",
      RunningPolicyFileName: "",
      documents: documents,
      reference: reference,
      runningPolicy: resetRunningPolicy,
      user_pk_vehicle_id: user,
    });

    console.log("🔄 [VEHICLE RENEWAL] Form data set for renewal:", {
      previousPolicy: previousPolicy,
      runningPolicy: resetRunningPolicy,
      policyRadio: "Renewal",
    });

    setIsModalOpen(true);
    setStep(1);
  };

  // Open modal if redirected from renewal sheet
  useEffect(() => {
    try {
      const isVehicleRenew = localStorage.getItem("isVehicleRenew");
      const vehicleRenewalDataRaw = localStorage.getItem("vehicleRenewalData");
      if (isVehicleRenew === "true" && vehicleRenewalDataRaw) {
        const parsed = JSON.parse(vehicleRenewalDataRaw);
        console.log(
          "🔄 [VEHICLE INSURANCE] Received pre-transformed renewal data:",
          parsed
        );
        console.log(
          "🔄 [VEHICLE INSURANCE] Previous policy:",
          parsed.previousPolicy
        );
        console.log(
          "🔄 [VEHICLE INSURANCE] Running policy (should be empty):",
          parsed.runningPolicy
        );

        // Move runningPolicy into previousPolicy and reset runningPolicy for a new policy entry
        const user = parsed.user_pk_vehicle_id || {};
        const runningPolicy =
          parsed.runningPolicy || parsed.running_policy || {};

        const previousFromRunning = {
          ...runningPolicy,
          PdfFile:
            runningPolicy.CurrentPolicyFile ||
            runningPolicy.RunningPolicyFileName ||
            runningPolicy.PdfFile ||
            null,
          PdfFileName:
            runningPolicy.CurrentPolicyFile ||
            runningPolicy.RunningPolicyFileName ||
            runningPolicy.PdfFileName ||
            "",
          // Ensure company name is preserved in previous policy
          CompanyName:
            runningPolicy.CompanyName ||
            parsed.company_name ||
            runningPolicy.CompanyType?.company_name ||
            parsed.CompanyName ||
            "",
        };

        const resetRunning = {
          PolicyNumber: "",
          PolicyIssuedDate: "",
          PolicyExpiryDate: "",
          PolicyTenure: "",
          From: "",
          To: "",
          PremiumAmount: "",
          NCB: "",
          IDV: "",
          NomineeName: "",
          NomineeRelation: "",
          NomineeAge: "",
          NomineeDob: "",
          Vendor: "",
          CurrentPolicyFile: "",
          // clear any running policy file/name fields
          RunningPolicyFileName: "",
          CurrentPolicyFileName: "",
          PdfFile: "",
          PdfFileName: "",
          CompanyName: "",
        };

        // Build the editData object that downstream code expects
        const normalized = {
          ...parsed,
          // clear top-level/ running policy fields to avoid repopulation
          PolicyNumber: "",
          PolicyIssuedDate: "",
          PolicyExpiryDate: "",
          PolicyTenure: "",
          From: "",
          To: "",
          PremiumAmount: "",
          NCB: "",
          IDV: "",
          Vendor: "",
          CompanyName: "",
          previousPolicy: {
            ...(parsed.previousPolicy || {}),
            ...previousFromRunning,
          },
          runningPolicy: resetRunning,
        };

        // Prefill formData in the shape the form expects
        const prefill = {
          Name: parsed.Name || user.username || "",
          Email: parsed.Email || user.email || "",
          MobileNumber:
            parsed.MobileNumber ||
            user.mobileNumber ||
            parsed.mobileNumber ||
            "",
          ContactPersonName:
            parsed.ContactPersonName || parsed.contact_person_name || "",
          ContactPersonMobileNumber:
            parsed.ContactPersonMobileNumber || parsed.contact_person_no || "",
          Type: parsed.Type || "Individual",
          VehicleNumber: parsed.VehicleNumber || parsed.vehicle_number || "",
          Make: parsed.Make || parsed.make || "",
          Model: parsed.Model || parsed.model || "",
          ManufacturingYear:
            parsed.ManufacturingYear || parsed.manufacturing_year || "",
          EngineNumber: parsed.EngineNumber || parsed.engine_number || "",
          ChassisNumber: parsed.ChassisNumber || parsed.chassis_number || "",
          VehicleType: parsed.VehicleType || parsed.vehicle_type || "",
          Vendor: parsed.Vendor || parsed.vendor || "",
          // Company name moved to previousPolicy when renewing
          CompanyName: "",

          // Put previous policy under previousPolicy and clear runningPolicy fields
          previousPolicy: normalized.previousPolicy || {},
          runningPolicy: normalized.runningPolicy || {},
          vehicle_policy_type: parsed.vehicle_policy_type || "Renewal",
          policyRadio: "Renewal",
          PolicyPlanType: "",
          PolicyNumber: "",
          PolicyFrom: "",
          PolicyTo: "",
          PolicyIssuedDate: "",
          PolicyTenure: "",
          PremiumAmount: "",
          IDV: "",
          NCB: "",
          PolicyType: "",
          AgentName:
            parsed.AgentName ||
            parsed.agentName ||
            normalized.previousPolicy?.agentName ||
            "",
          AgentCode:
            parsed.AgentCode ||
            parsed.agentCode ||
            normalized.previousPolicy?.agentCode ||
            "",
          AgentContactNumber:
            parsed.AgentContactNumber ||
            parsed.agentContactNumber ||
            normalized.previousPolicy?.agentContactNumber ||
            "",
          NomineeName: normalized.previousPolicy?.NomineeName || "",
          NomineeRelation: normalized.previousPolicy?.NomineeRelation || "",
          NomineeAge: normalized.previousPolicy?.NomineeAge || "",
          NomineeDob: normalized.previousPolicy?.NomineeDob || "",
          Reference: parsed.reference?.reference_name || parsed.Reference || "",
          reference_id:
            parsed.reference_id || parsed.reference?.reference_id || null,
          AadharFileName: parsed.AadharFileName || "",
          PanFileName: parsed.PanFileName || "",
          GstFileName: parsed.GstFileName || "",
          RcBookFileName: parsed.RcBookFileName || "",
          // Ensure running policy filenames and current policy file are cleared in form data
          RunningPolicyFileName: "",
          CurrentPolicyFile: null,
          // Also clear inline nominee fields for running policy
          NomineeName: "",
          NomineeRelation: "",
          NomineeAge: "",
          NomineeDob: "",
          remark: parsed.remark || "",
          consumer_role_id: parsed.consumer_role_id || "",
          user_pk_vehicle_id: user,
          documents: parsed.documents || [],
        };

        setEditData(normalized);
        setFormData((prev) => ({ ...prev, ...prefill }));
        setIsModalOpen(true);
        setStep(1);

        // Clear flags after consuming
        localStorage.removeItem("isVehicleRenew");
        localStorage.removeItem("vehicleRenewalData");
      }
    } catch (e) {
      console.error("Failed to open vehicle renew modal from stored data", e);
    }
  }, []);

  const handleInputChange = (field, value) => {
    console.log(`Setting ${field} to:`, value);

    // Handle hasNominee toggle - clear nominee fields if "no" is selected
    if (field === "hasNominee") {
      if (value === "no") {
        setFormData((prev) => ({
          ...prev,
          hasNominee: value,
          NomineeName: "",
          NomineeRelation: "",
          NomineeAge: "",
          NomineeDob: "",
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          hasNominee: value,
        }));
      }
      return;
    }

    if (field === "NomineeDob") {
      const dobDate = value ? new Date(value) : null;
      let age = "";
      if (dobDate && !isNaN(dobDate.getTime())) {
        const today = new Date();
        age = today.getFullYear() - dobDate.getFullYear();
        const monthDiff = today.getMonth() - dobDate.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < dobDate.getDate())
        ) {
          age = age - 1;
        }
        if (age < 0) age = "";
      }
      setFormData((prev) => ({
        ...prev,
        NomineeDob: value,
        NomineeAge: age,
      }));
      return;
    }

    if (field === "PreviousNomineeDob") {
      const dobDate = value ? new Date(value) : null;
      let age = "";
      if (dobDate && !isNaN(dobDate.getTime())) {
        const today = new Date();
        age = today.getFullYear() - dobDate.getFullYear();
        const monthDiff = today.getMonth() - dobDate.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < dobDate.getDate())
        ) {
          age = age - 1;
        }
        if (age < 0) age = "";
      }
      setFormData((prev) => ({
        ...prev,
        previousPolicy: {
          ...prev.previousPolicy,
          NomineeDob: value,
          NomineeAge: age,
        },
      }));
      return;
    }

    if (field === "To") {
      // Mirror PolicyExpiryDate to the selected To date
      setFormData((prev) => ({
        ...prev,
        To: value,
        PolicyExpiryDate: value,
      }));
      return;
    }

    // Handle previous policy fields
    if (field.startsWith("Previous")) {
      // Remove 'Previous' prefix and keep the field name as is
      let actualFieldName = field.replace("Previous", "");

      // Special handling for agent fields - keep them with lowercase first letter
      if (actualFieldName === "AgentName") actualFieldName = "agentName";
      if (actualFieldName === "AgentCode") actualFieldName = "agentCode";
      if (actualFieldName === "AgentContactNumber")
        actualFieldName = "agentContactNumber";

      setFormData((prev) => ({
        ...prev,
        previousPolicy: {
          ...prev.previousPolicy,
          [actualFieldName]: value,
        },
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,

      [field]: value,
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;

    if (name === "PreviousPolicyPDF") {
      setFormData((prev) => ({
        ...prev,
        previousPolicy: {
          ...prev.previousPolicy,
          PdfFile: files[0] || null,
        },
      }));
    } else if (name === "RunningPolicyPDF") {
      // Handle Running Policy PDF specially
      setFormData((prev) => ({
        ...prev,
        CurrentPolicyFile: files[0] || null,
        RunningPolicyFileName: files[0] ? files[0].name : "",
      }));
      // Store in documentFiles with the correct field name for backend processing
      setDocumentFiles((prev) => ({ ...prev, CurrentPolicyFile: files[0] }));
    } else {
      // Handle standard documents (aadhar, pan, gst, etc.)
      setDocumentFiles((prev) => ({ ...prev, [name]: files[0] }));

      // Also update the corresponding filename in formData for display
      setFormData((prev) => ({
        ...prev,
        [`${name.charAt(0).toUpperCase() + name.slice(1)}FileName`]: files[0]
          ? files[0].name
          : "",
      }));
    }
  };

  const handleCustomDocumentChange = (categoryId, e) => {
    const { files } = e.target;

    if (files && files[0]) {
      setFormData((prev) => ({
        ...prev,

        [`custom_${categoryId}`]: files[0],

        [`custom_${categoryId}_fileName`]: files[0].name,
      }));
    }
  };

  // Function to clear a specific file input
  const clearFileInput = (inputName) => {
    const input = document.querySelector(`input[name="${inputName}"]`);
    if (input) {
      input.value = "";
    }
  };

  // Function to clear all file inputs
  const clearAllFileInputs = () => {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach((input) => {
      input.value = "";
    });
  };

  const handleNext = () => {
    // If we're on step 2 (about to go to step 3 - Vehicle Details), ensure vehicle list is populated

    if (step === 2 && vehicleList.length === 0) {
      toast.error(
        "Vehicle types are still loading. Please wait a moment and try again."
      );

      return;
    }

    // Allow navigation up to step 6
    if (step < 6) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  // const handleSubmit = async () => {

  //   console.log('handleSubmit called - step:', step, 'editData:', editData);

  //   // Only allow submission on the last step based on policy type
  //   const maxStep = (formData.policyRadio === 'Renewal' || formData.policyRadio === 'Portability') ? 6 : 5;

  //   if (step !== maxStep) {
  //     console.log(`Not on step ${maxStep}, returning early`);
  //     return;
  //   }

  //   // Enhanced validation for the final step

  //   if (vehicleList.length === 0) {

  //     toast.error('Vehicle types are still loading. Please wait a moment and try again.');

  //     return;

  //   }

  //   if (!formData.VehicleType) {

  //     toast.error('Please select a Vehicle Type.');

  //     return;

  //   }

  //   // Validate based on nominee selection
  //   const nomineeValidation = formData.hasNominee === 'yes' ? formData.NomineeRelation : true;

  //   if (!formData.policyRadio || !formData.PolicyType || !formData.PolicyPlanType || !nomineeValidation) {

  //     const missingFields = [];
  //     if (!formData.policyRadio) missingFields.push('Policy Type (Consumer)');
  //     if (!formData.PolicyType) missingFields.push('Policy Type (Running)');
  //     if (!formData.PolicyPlanType) missingFields.push('Policy Plan Type');
  //     if (formData.hasNominee === 'yes' && !formData.NomineeRelation) missingFields.push('Nominee Relation');

  //     toast.error(`Please fill all required fields: ${missingFields.join(', ')}.`);

  //     return;

  //   }

  //   // Additional validation for critical fields

  //   if (!formData.Name || !formData.Email || !formData.MobileNumber) {

  //     toast.error('Please fill all required consumer details: Name, Email, and Mobile Number.');

  //     return;

  //   }

  //   setLoading(true);

  //   try {

  //     console.log('Form Data VehicleType:', formData.VehicleType);

  //     console.log('Available vehicles:', vehicleList);

  //     const selectedVehicle = vehicleList.find(v => v.vehicle_name === formData.VehicleType);

  //     const vehicle_id = selectedVehicle ? selectedVehicle.vehicle_id : null;

  //     console.log('Selected vehicle:', selectedVehicle);

  //     console.log('Vehicle ID:', vehicle_id);

  //     if (!selectedVehicle) {

  //       toast.error('Selected vehicle type not found in the vehicle list. Please try selecting again or add a new vehicle type.');

  //       return;

  //     }

  //     // Double-check that the vehicle exists in the current list

  //     const vehicleExists = vehicleList.some(v => v.vehicle_id === vehicle_id);

  //     if (!vehicleExists) {

  //       toast.error('Vehicle validation failed. Please refresh the page and try again.');

  //       return;

  //     }

  //     const selectedReference = references.find(r => r.reference_name === formData.Reference);

  //     const reference_id = selectedReference ? selectedReference.reference_id : null;

  //     const selectedPolicyPlan = policyPlans && formData.PolicyPlanType

  //       ? policyPlans.find(plan => plan.policy_name === formData.PolicyPlanType)

  //       : null;

  //     const runningPolicy = {

  //       PolicyNumber: formData.PolicyNumber || '',

  //       policy_type: formData.PolicyType || '',

  //       PolicyTypeId: (() => {
  //         const selectedPolicyType = policyTypes.find(pt => pt.policy_type_name === formData.PolicyType);
  //         return selectedPolicyType ? selectedPolicyType.policy_type_id : null;
  //       })(),

  //       policy_plan_id: selectedPolicyPlan ? selectedPolicyPlan.policy_plan_id : null,

  //       PolicyTenure: formData.PolicyTenure || '',

  //       PremiumAmount: formData.PremiumAmount || '',

  //       // Only include nominee data if hasNominee is 'yes'
  //       ...(formData.hasNominee === 'yes' && {
  //       NomineeName: formData.NomineeName || '',
  //       NomineeRelation: formData.NomineeRelation || '',
  //         NomineeAge: formData.NomineeAge || '',
  //         NomineeDob: formData.NomineeDob || '',
  //       }),

  //       PolicyFrom: formData.From || '',

  //       PolicyTo: formData.To || '',

  //       PolicyIssuedDate: formData.PolicyIssuedDate || '',

  //       ExpiryDate: formData.To || '',

  //       Vendor: formData.Vendor || '',

  //       IDV: formData.IDV || '',

  //       NCB: formData.NCB || '',

  //       hasNominee: formData.hasNominee || 'no',

  //       CompanyName: formData.CompanyName || '',

  //     };

  //     console.log('🔍 [FORM SUBMISSION] Company name handling:', {
  //       formDataCompanyName: formData.CompanyName,
  //       runningPolicyCompanyName: runningPolicy.CompanyName,
  //       previousPolicyCompanyName: formData.previousPolicy?.CompanyName,
  //       previousPolicyObject: formData.previousPolicy
  //     });

  //     if (formData.CurrentPolicyFile) {

  //       runningPolicy.CurrentPolicyFile = formData.CurrentPolicyFile;

  //     }

  //     console.log('🔍 [SUBMIT] formData.previousPolicy before payload:', formData.previousPolicy);
  //     console.log('🔍 [SUBMIT] formData.policyRadio:', formData.policyRadio);

  //     const payload = {

  //       Name: formData.Name || '',

  //       Email: formData.Email || '',

  //       MobileNumber: formData.MobileNumber || '',

  //       company_name: formData.CompanyName || '',

  //       contact_person_name: formData.ContactPersonName || '',

  //       contact_person_no: formData.ContactPersonMobileNumber || '',

  //       vehicle_number: formData.VehicleNumber || '',

  //       make: formData.Make || '',

  //       model: formData.Model || '',

  //       manufacturing_year: formData.ManufacturingYear || '',

  //       engine_number: formData.EngineNumber || '',

  //       chassis_number: formData.ChassisNumber || '',

  //       agent_name: formData.AgentName || '',

  //       agent_code: formData.AgentCode || '',

  //       agent_contact_number: formData.AgentContactNumber || '',

  //       status: formData.Status || 'interested',

  //       type: formData.Type || '',

  //       vehicle_id: vehicle_id,

  //       reference_id: reference_id,

  //       remark: formData.Remark || '',

  //       runningPolicy: runningPolicy,

  //       previousPolicy: formData.previousPolicy || {},

  //       vehicle_type: formData.VehicleType || '',

  //       vendor: formData.Vendor || '',

  //       policy_plan_type: formData.PolicyPlanType || '',

  //       policy_type: formData.policyRadio || '',

  //       running_policy_type: formData.PolicyType || '',

  //       type: formData.Type || '',

  //       vehicle_user_id: formData.vehicle_user_id,

  //       consumer_role_id: formData.ConsumerRoleId || '',

  //       documentFiles: documentFiles,

  //       customDocuments: customDocuments,

  //     };

  //     if (editData) {

  //       const res = await updateVehicleUserData(payload, formData.vehicle_user_id);

  //       if (!res) {
  //         // Backend/API already showed error toast; stop here
  //         setLoading(false);
  //         return;
  //       }

  //     } else {

  //       const res = await addVehicleUserData(payload);

  //       if (!res) {
  //         // Backend/API already showed error toast; stop here
  //         setLoading(false);
  //         return;
  //       }

  //     }

  //     toggleModal();

  //     getVehicleData();

  //   } catch (error) {

  //     console.error('Error saving vehicle:', error);

  //     toast.error('Failed to save vehicle. Please try again.');

  //   } finally {

  //     setLoading(false);

  //   }

  // };

  const handleSubmit = async () => {
    console.log("handleSubmit called - step:", step, "editData:", editData);

    // Determine max step based on policy type
    const maxStep =
      formData.policyRadio === "Renewal" ||
      formData.policyRadio === "Portability"
        ? 6
        : 5;
    if (step !== maxStep) {
      console.log(`Not on step ${maxStep}, returning early`);
      return;
    }

    // Validate vehicle type
    if (vehicleList.length === 0) {
      toast.error(
        "Vehicle types are still loading. Please wait a moment and try again."
      );
      return;
    }
    if (!formData.VehicleType) {
      toast.error("Please select a Vehicle Type.");
      return;
    }

    // Validate critical fields
    if (!formData.Name || !formData.Email || !formData.MobileNumber) {
      toast.error(
        "Please fill all required consumer details: Name, Email, and Mobile Number."
      );
      return;
    }

    // Validate nominee if applicable
    if (formData.hasNominee === "yes" && !formData.NomineeRelation) {
      toast.error("Please provide Nominee Relation.");
      return;
    }

    setLoading(true);

    try {
      const selectedVehicle = vehicleList.find(
        (v) => v.vehicle_name === formData.VehicleType
      );
      const vehicle_id = selectedVehicle ? selectedVehicle.vehicle_id : null;

      if (!selectedVehicle) {
        toast.error("Selected vehicle type not found. Please try again.");
        return;
      }

      const selectedReference = references.find(
        (r) => r.reference_name === formData.Reference
      );
      const reference_id = selectedReference
        ? selectedReference.reference_id
        : null;

      const selectedPolicyPlan = policyPlans?.find(
        (plan) => plan.policy_name === formData.PolicyPlanType
      );

      const runningPolicy = {
        PolicyNumber: formData.PolicyNumber || "",
        policy_type: formData.PolicyType || "",
        PolicyTypeId: (() => {
          const pt = policyTypes.find(
            (pt) => pt.policy_type_name === formData.PolicyType
          );
          return pt ? pt.policy_type_id : null;
        })(),
        policy_plan_id: selectedPolicyPlan
          ? selectedPolicyPlan.policy_plan_id
          : null,
        PolicyTenure: formData.PolicyTenure || "",
        PremiumAmount: formData.PremiumAmount || "",
        ...(formData.hasNominee === "yes" && {
          NomineeName: formData.NomineeName || "",
          NomineeRelation: formData.NomineeRelation || "",
          NomineeAge: formData.NomineeAge || "",
          NomineeDob: formData.NomineeDob || "",
        }),
        PolicyFrom: formData.From || "",
        PolicyTo: formData.To || "",
        PolicyIssuedDate: formData.PolicyIssuedDate || "",
        ExpiryDate: formData.To || "",
        Vendor: formData.Vendor || "",
        IDV: formData.IDV || "",
        NCB: formData.NCB || "",
        hasNominee: formData.hasNominee || "no",
        CompanyName: formData.CompanyName || "",
        CurrentPolicyFile: formData.CurrentPolicyFile || "",
      };

      const payload = {
        Name: formData.Name || "",
        Email: formData.Email || "",
        MobileNumber: formData.MobileNumber || "",
        company_name: formData.CompanyName || "",
        contact_person_name: formData.ContactPersonName || "",
        contact_person_no: formData.ContactPersonMobileNumber || "",
        vehicle_number: formData.VehicleNumber || "",
        make: formData.Make || "",
        model: formData.Model || "",
        manufacturing_year: formData.ManufacturingYear || "",
        engine_number: formData.EngineNumber || "",
        chassis_number: formData.ChassisNumber || "",
        agent_name: formData.AgentName || "",
        agent_code: formData.AgentCode || "",
        agent_contact_number: formData.AgentContactNumber || "",
        status: formData.Status || "interested",
        type: formData.Type || "",
        vehicle_id: vehicle_id,
        reference_id: reference_id,
        remark: formData.Remark || "",
        runningPolicy: runningPolicy,
        previousPolicy: formData.previousPolicy || {},
        vehicle_type: formData.VehicleType || "",
        vendor: formData.Vendor || "",
        policy_plan_type: formData.PolicyPlanType || "",
        policy_type: formData.policyRadio || "",
        running_policy_type: formData.PolicyType || "",
        vehicle_user_id: formData.vehicle_user_id,
        consumer_role_id: formData.ConsumerRoleId || "",
        documentFiles: documentFiles,
        customDocuments: customDocuments,
        // Add flag to indicate renewal from renewal sheet
        isRenewalFromSheet: formData.isRenewalFromSheet || false,
      };

      let res;

      // Check if this is a renewal from renewal sheet
      const isRenewalFromSheet =
        localStorage.getItem("isVehicleRenew") === "true";

      if (formData.vehicle_user_id) {
        // For renewal from renewal sheet, call renewVehiclePolicy first
        if (isRenewalFromSheet && formData.policyRadio === "Renewal") {
          console.log("🔄 [RENEWAL] Calling renewVehiclePolicy API first");
          try {
            const renewRes = await renewVehiclePolicy(formData.vehicle_user_id);
            if (renewRes && renewRes.status) {
              toast.success("Policy moved to previous successfully");
              console.log(
                "✅ [RENEWAL] renewVehiclePolicy succeeded:",
                renewRes
              );
            } else {
              toast.warning(
                "Could not move policy to previous, continuing with update"
              );
              console.warn("⚠️ [RENEWAL] renewVehiclePolicy failed:", renewRes);
            }
          } catch (error) {
            console.error("❌ [RENEWAL] renewVehiclePolicy error:", error);
            toast.warning(
              "Error moving policy to previous, continuing with update"
            );
          }
        }

        // Then update with new data
        console.log("🔄 Updating existing vehicle", formData.vehicle_user_id);
        res = await updateVehicleUserData(payload, formData.vehicle_user_id);
      } else {
        // Add new vehicle
        console.log("➕ Adding new vehicle");
        res = await addVehicleUserData(payload);
      }

      if (!res) {
        setLoading(false);
        return;
      }

      // Clear renewal flags
      localStorage.removeItem("isVehicleRenew");
      localStorage.removeItem("vehicleRenewalData");

      toggleModal();
      getVehicleData();
      toast.success("Vehicle insurance saved successfully!");
    } catch (error) {
      console.error("Error saving vehicle:", error);
      toast.error("Failed to save vehicle. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const exportData = filteredData.map((item, index) => {
      const user = item.user_pk_vehicle_id || {};

      const runningPolicy = item.runningPolicy || {};

      const reference = item.reference || {};

      const hasVehicleRecord = item.vehicle_user_id && item.vehicle_number;

      return {
        "SR NO.": index + 1,

        "ISSUE DATE": runningPolicy.PolicyIssuedDate
          ? new Date(runningPolicy.PolicyIssuedDate).toLocaleDateString("en-GB")
          : "N/A",

        "POLICY.NO": runningPolicy.PolicyNumber || "N/A",

        NAME: user.username || "N/A",

        MOBILE: user.mobileNumber || "N/A",

        "EMAIL.ID": user.email || "N/A",

        "VEH.NO": hasVehicleRecord ? item.vehicle_number || "N/A" : "N/A",

        MAKE: hasVehicleRecord ? item.make || "N/A" : "N/A",

        VARIENT: hasVehicleRecord ? item.model || "N/A" : "N/A",

        MODEL: hasVehicleRecord ? item.model || "N/A" : "N/A",

        "INSURANCE TYPE":
          runningPolicy.policy_type || item.vehicle_policy_type || "N/A",

        PREMIUM: hasVehicleRecord
          ? runningPolicy.PremiumAmount || "N/A"
          : "N/A",

        COMPANY: hasVehicleRecord ? item.company_name || "N/A" : "N/A",

        FROM: hasVehicleRecord
          ? runningPolicy.PolicyFrom
            ? new Date(runningPolicy.PolicyFrom).toLocaleDateString("en-GB")
            : "N/A"
          : "N/A",

        TO: hasVehicleRecord
          ? runningPolicy.PolicyTo
            ? new Date(runningPolicy.PolicyTo).toLocaleDateString("en-GB")
            : "N/A"
          : "N/A",

        VENDOR: hasVehicleRecord ? runningPolicy.Vendor || "N/A" : "N/A",

        REFRENCE: reference.reference_name || "N/A",

        "CONTACT PERSON NAME": hasVehicleRecord
          ? item.contact_person_name || "N/A"
          : "N/A",

        "CONTACT PERSON NUMBER": hasVehicleRecord
          ? item.contact_person_no || "N/A"
          : "N/A",
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);

    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "VehicleInsurance");

    XLSX.writeFile(wb, "VehicleInsurance.xlsx");
  };

  const getRoleOptions = (categoryId) => {
    if (!data || !Array.isArray(data)) return [];

    const options = data.map((role) => ({
      value: role.user_role_id || role.id,

      label: role.role_name || role.username || role.name || "Unknown Role",
    }));

    return options;
  };

  const getBuilderOptions = () => {
    if (!data || !Array.isArray(data)) return [];

    const options = data
      .map((builder) => {
        const value = builder.user_id || builder.id || builder.builder_id;

        const label = builder.username || builder.name || builder.builder_name;

        return {
          value: value,

          label: label || "Unknown Builder",
        };
      })
      .filter((option) => option.value && option.label);

    return options;
  };

  // Transform data for table display

  const transformedData = filteredData.map((item) => {
    const user = item.user_pk_vehicle_id || {};

    const runningPolicy = item.runningPolicy || {};

    const reference = item.reference || {};

    const hasVehicleRecord = item.vehicle_user_id; // Only check for vehicle_user_id, not vehicle_number

    // Debug logging for edit button visibility
    console.log("🔍 [EDIT BUTTON DEBUG] Item data:", {
      vehicle_user_id: item.vehicle_user_id,
      vehicle_number: item.vehicle_number,
      hasVehicleRecord: hasVehicleRecord,
      user_id: item.user_id,
      username: item.user_pk_vehicle_id?.username,
    });

    // return {

    //   // Display data (transformed for table)
    //   issueDate: runningPolicy.PolicyIssuedDate ? new Date(runningPolicy.PolicyIssuedDate).toLocaleDateString('en-GB') : 'N/A',

    //   name: user.username || 'N/A',

    //   email: user.email || 'N/A',

    //   mobileNumber: user.mobileNumber || 'N/A',

    //   vehicleNumber: hasVehicleRecord ? (item.vehicle_number || 'N/A') : 'No Vehicle Record',

    //   make: hasVehicleRecord ? (item.make || 'N/A') : 'N/A',

    //   model: hasVehicleRecord ? (item.model || 'N/A') : 'N/A',

    //   reference: reference.reference_name || 'N/A',

    //   contactPersonName: hasVehicleRecord ? (item.contact_person_name || 'N/A') : 'N/A',

    //   contactPersonNumber: hasVehicleRecord ? (item.contact_person_no || 'N/A') : 'N/A',

    //   vendor: hasVehicleRecord ? (runningPolicy.Vendor || 'N/A') : 'N/A',

    //   companyName: hasVehicleRecord ? (runningPolicy.CompanyType?.company_name || runningPolicy.CompanyName || item.company_name || 'N/A') : 'N/A',

    //   chassisNumber: hasVehicleRecord ? (item.chassis_number ?? 'N/A') : 'N/A',

    //   policyTenure: hasVehicleRecord ? (runningPolicy.PolicyTenure !== undefined && runningPolicy.PolicyTenure !== null && runningPolicy.PolicyTenure !== '' ? runningPolicy.PolicyTenure : 'N/A') : 'N/A',

    //   policyFrom: hasVehicleRecord ? (runningPolicy.PolicyFrom ? new Date(runningPolicy.PolicyFrom).toLocaleDateString('en-GB') : 'N/A') : 'N/A',

    //   policyTo: hasVehicleRecord ? (runningPolicy.PolicyTo ? new Date(runningPolicy.PolicyTo).toLocaleDateString('en-GB') : 'N/A') : 'N/A',

    //   nomineeName: hasVehicleRecord ? (runningPolicy.NomineeName ?? 'N/A') : 'N/A',

    //   nomineeRelation: hasVehicleRecord ? (runningPolicy.NomineeRelation ?? item.nominee_type ?? 'N/A') : 'N/A',

    //   nomineeAge: hasVehicleRecord ? (runningPolicy.NomineeAge !== undefined && runningPolicy.NomineeAge !== null && runningPolicy.NomineeAge !== '' ? runningPolicy.NomineeAge : 'N/A') : 'N/A',

    //   nomineeDob: hasVehicleRecord ? (runningPolicy.NomineeDob ? new Date(runningPolicy.NomineeDob).toLocaleDateString('en-GB') : 'N/A') : 'N/A',

    //   premiumAmount: hasVehicleRecord ? (runningPolicy.PremiumAmount ? `₹${runningPolicy.PremiumAmount.toLocaleString()}` : 'N/A') : 'N/A',

    //   createdDate: item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB') : 'N/A',

    //   // Original data for edit modal (preserve original structure)
    //   originalData: item,

    //   actions: hasVehicleRecord ? (

    //     <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>

    //       <button

    //         className="action-btn view-btn"

    //         onClick={() => handleViewDetails(item)}

    //         title="View Details"

    //         style={{

    //           cursor: 'pointer',

    //           width: '40px',

    //           height: '40px',

    //           border: '2px solid #3b82f6',

    //           borderRadius: '8px',

    //           background: '#3b82f6',

    //           color: 'white',

    //           display: 'flex',

    //           alignItems: 'center',

    //           justifyContent: 'center',

    //           transition: 'all 0.2s ease',

    //           boxShadow: '0 2px 8px rgba(59,130,246,0.2)'

    //         }}

    //       >

    //         <FiEye size={20} strokeWidth={2.5} />

    //       </button>

    //       <button

    //         className="action-btn edit-btn"

    //         onClick={() => handleEdit(item)}

    //         title="Edit Record"

    //         style={{

    //           cursor: 'pointer',

    //           width: '40px',

    //           height: '40px',

    //           border: '2px solid #f59e0b',

    //           borderRadius: '8px',

    //           background: '#f59e0b',

    //           color: 'white',

    //           display: 'flex',

    //           alignItems: 'center',

    //           justifyContent: 'center',

    //           transition: 'all 0.2s ease',

    //           boxShadow: '0 2px 8px rgba(245,158,11,0.2)'

    //         }}

    //       >

    //         <FiEdit2 size={20} strokeWidth={2.5} />

    //       </button>

    //     </div>

    //   ) : (

    //     <span style={{ color: '#999', fontSize: '12px' }}>No Record</span>

    //   ),

    //   originalData: item // Keep original data for edit/view operations

    // };

    return {
      // Display data (transformed for table)
      issueDate: item?.runningPolicy?.PolicyIssuedDate
        ? new Date(item.runningPolicy.PolicyIssuedDate).toLocaleDateString(
            "en-GB"
          )
        : "N/A",

      name: item.username || "N/A",

      email: item.email || "N/A",

      mobileNumber: item.mobileNumber || "N/A",
      vehicleNumber: item.vehicle_number || "N/A",

      // vehicleNumber: hasVehicleRecord ? (item.vehicle_number || 'N/A') : 'No Vehicle Record',

      // make: hasVehicleRecord ? (item.make || 'N/A') : 'N/A',
      make: item.make || "N/A",

      model: item.model || "N/A",

      reference: item.referenceName || "N/A",
      contactPersonName: item.contact_person_name || "N/A",

      contactPersonNumber: item.contact_person_no || "N/A",

      vendor:
        item.vehicleRecords?.[0]?.vendor ||
        item.vehicleRecords?.[0]?.Vendor ||
        item?.runningPolicy?.vendor ||
        item?.runningPolicy?.Vendor ||
        "N/A",

      companyName: item.company_name || "N/A",

      chassisNumber: item.chassis_number || "N/A",

      policyTenure: item?.runningPolicy?.PolicyTenure || "N/A",

      policyFrom: item?.runningPolicy?.PolicyFrom
        ? new Date(item.runningPolicy.PolicyFrom).toLocaleDateString("en-GB")
        : "N/A",

      policyTo: item?.runningPolicy?.PolicyTo
        ? new Date(item.runningPolicy.PolicyTo).toLocaleDateString("en-GB")
        : "N/A",

      nomineeName: item?.runningPolicy?.NomineeName || "N/A",

      nomineeRelation: item?.runningPolicy?.NomineeRelation || "N/A",

      nomineeAge: item?.runningPolicy?.NomineeAge || "N/A",

      nomineeDob: item?.runningPolicy?.NomineeDob
        ? new Date(item.runningPolicy.NomineeDob).toLocaleDateString("en-GB")
        : "N/A",

      premiumAmount: item?.runningPolicy?.PremiumAmount || "N/A",
      createdDate: item.createdAt
        ? new Date(item.createdAt).toLocaleDateString("en-GB")
        : "N/A",

      // Original data for edit modal (preserve original structure)
      originalData: item,

      actions: hasVehicleRecord ? (
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

          <button
            className="action-btn edit-btn"
            onClick={() => handleEdit(item)}
            title="Edit Record"
            style={{
              cursor: "pointer",

              width: "40px",

              height: "40px",

              border: "2px solid #f59e0b",

              borderRadius: "8px",

              background: "#f59e0b",

              color: "white",

              display: "flex",

              alignItems: "center",

              justifyContent: "center",

              transition: "all 0.2s ease",

              boxShadow: "0 2px 8px rgba(245,158,11,0.2)",
            }}
          >
            <FiEdit2 size={20} strokeWidth={2.5} />
          </button>
        </div>
      ) : (
        <span style={{ color: "#999", fontSize: "12px" }}>No Record</span>
      ),

      originalData: item, // Keep original data for edit/view operations
    };
  });

  const sortedData = transformedData.sort((a, b) => {
    // 'N/A' comes first
    if (a.issueDate === "N/A" && b.issueDate !== "N/A") return -1;
    if (a.issueDate !== "N/A" && b.issueDate === "N/A") return 1;

    // Both have dates, sort descending (latest first)
    if (a.issueDate !== "N/A" && b.issueDate !== "N/A") {
      const [dayA, monthA, yearA] = a.issueDate.split("/").map(Number);
      const [dayB, monthB, yearB] = b.issueDate.split("/").map(Number);

      const dateA = new Date(yearA, monthA - 1, dayA);
      const dateB = new Date(yearB, monthB - 1, dayB);

      return dateB - dateA; // latest first
    }

    return 0; // both 'N/A'
  });

  return (
    <DashboardLayout
      onSearch={(searchQuery) => {
        applyFilters(searchQuery);
      }}
    >
      <div className="consumer-container">
        <div className="consumer-header">
          <h1>Vehicle Insurance Management</h1>

          <Button className="add-consumer-btn" onClick={toggleModal}>
            + Add Vehicle Insurance
          </Button>
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

        <div className="consumer-table-container">
          <Table
            columns={heading.map((h) => ({ key: h.key, title: h.head }))}
            data={sortedData}
            onEdit={handleEdit}
            onView={handleViewDetails}
            pagination={true}
            itemsPerPage={itemsPerPage}
            loading={vehicleLoading}
          />
        </div>

        <Modal
          open={isModalOpen}
          onClose={toggleModal}
          title={
            editData
              ? editData.policyRadio === "Renewal"
                ? "Renew Vehicle Insurance"
                : "Edit Vehicle Insurance"
              : "Add New Vehicle Insurance"
          }
        >
          <form
            className="consumer-form"
            onSubmit={(e) => e.preventDefault()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();

                return;
              }
            }}
          >
            {step === 1 && (
              <div className="form-section">
                <h5>Consumer Details</h5>

                <div className="form-row">
                  <div className="form-group">
                    <label>Name *</label>

                    <Input
                      type="text"
                      value={formData.Name}
                      onChange={(e) =>
                        handleInputChange("Name", e.target.value)
                      }
                      placeholder="Enter full name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Email *</label>

                    <Input
                      type="email"
                      value={formData.Email}
                      onChange={(e) =>
                        handleInputChange("Email", e.target.value)
                      }
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Mobile Number *</label>

                    <div className="phone-style">
                      <div className="flag-section">
                        <img
                          src="https://flagcdn.com/w320/in.png"
                          alt="India"
                          className="country-flag"
                        />

                        <span className="country-code">+91</span>
                      </div>

                      <input
                        type="tel"
                        value={formData.MobileNumber}
                        className="form-control mobile"
                        onChange={(e) =>
                          handleInputChange("MobileNumber", e.target.value)
                        }
                        placeholder="Enter mobile number"
                        required
                        maxLength="10"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Contact Person Name</label>

                    <Input
                      type="text"
                      value={formData.ContactPersonName}
                      onChange={(e) =>
                        handleInputChange("ContactPersonName", e.target.value)
                      }
                      placeholder="Enter contact person name"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Contact Person Mobile Number</label>

                    <Input
                      type="text"
                      value={formData.ContactPersonMobileNumber}
                      onChange={(e) =>
                        handleInputChange(
                          "ContactPersonMobileNumber",
                          e.target.value
                        )
                      }
                      placeholder="Enter contact person mobile number"
                    />
                  </div>

                  <div className="form-group">
                    <label>Type</label>

                    <div className="radio-group">
                      <label>
                        <input
                          type="radio"
                          name="Type"
                          value="Individual"
                          checked={formData.Type === "Individual"}
                          onChange={(e) =>
                            handleInputChange("Type", e.target.value)
                          }
                        />{" "}
                        <span>Individual</span>
                      </label>

                      <label>
                        <input
                          type="radio"
                          name="Type"
                          value="Corporate"
                          checked={formData.Type === "Corporate"}
                          onChange={(e) =>
                            handleInputChange("Type", e.target.value)
                          }
                        />{" "}
                        <span>Corporate</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    Policy Type <span style={{ color: "red" }}>*</span>
                  </label>

                  <div className="radio-group">
                    <label>
                      <input
                        type="radio"
                        name="policyRadio"
                        value="Fresh"
                        checked={formData.policyRadio === "Fresh"}
                        onChange={(e) =>
                          handleInputChange("policyRadio", e.target.value)
                        }
                        required
                      />{" "}
                      <span>Fresh</span>
                    </label>

                    <label>
                      <input
                        type="radio"
                        name="policyRadio"
                        value="Renewal"
                        checked={formData.policyRadio === "Renewal"}
                        onChange={(e) =>
                          handleInputChange("policyRadio", e.target.value)
                        }
                        required
                      />{" "}
                      <span>Renewal</span>
                    </label>

                    <label>
                      <input
                        type="radio"
                        name="policyRadio"
                        value="Portability"
                        checked={formData.policyRadio === "Portability"}
                        onChange={(e) =>
                          handleInputChange("policyRadio", e.target.value)
                        }
                        required
                      />{" "}
                      <span>Portability</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="form-section">
                <h5>Documents</h5>

                <div className="form-row">
                  <div className="form-group">
                    <label>Upload AADHAR CARD PDF</label>

                    <input
                      type="file"
                      name="aadhar"
                      accept="application/pdf"
                      onChange={handleFileChange}
                    />

                    {/* Show current file if uploaded */}
                    {documentFiles.aadhar && (
                      <div
                        style={{
                          fontSize: "0.9em",
                          marginTop: 4,
                          display: "block",
                          color: "#388e3c",
                        }}
                      >
                        <strong>Selected file:</strong>{" "}
                        {documentFiles.aadhar.name}
                        <button
                          type="button"
                          onClick={() => {
                            setDocumentFiles((prev) => ({
                              ...prev,
                              aadhar: null,
                            }));
                            setFormData((prev) => ({
                              ...prev,
                              AadharFileName: "",
                            }));
                            clearFileInput("aadhar");
                          }}
                          style={{
                            marginLeft: "10px",
                            padding: "2px 8px",
                            fontSize: "0.8em",
                            backgroundColor: "#ff4444",
                            color: "white",
                            border: "none",
                            borderRadius: "3px",
                            cursor: "pointer",
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    {formData.AadharFileName && !documentFiles.aadhar && (
                      <div
                        style={{
                          marginTop: "8px",
                          padding: "8px",
                          backgroundColor: "#f0f7ff",
                          borderRadius: "4px",
                          border: "1px solid #d0e7ff",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.85em",
                            color: "#388e3c",
                            marginBottom: "6px",
                          }}
                        >
                          ✓ Stored: {formData.AadharFileName}
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            type="button"
                            onClick={() =>
                              window.open(
                                `${config.API_URL}/user/download/${formData.AadharFileName}`,
                                "_blank"
                              )
                            }
                            style={{
                              padding: "4px 10px",
                              backgroundColor: "#1976d2",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "0.8em",
                              fontWeight: "500",
                              transition: "background-color 0.2s",
                            }}
                            onMouseOver={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#1565c0")
                            }
                            onMouseOut={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#1976d2")
                            }
                          >
                            📥 Download
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Are you sure you want to remove this document?"
                                )
                              ) {
                                setFormData((prev) => ({
                                  ...prev,
                                  AadharFileName: "",
                                }));
                                toast.success("Document marked for removal");
                              }
                            }}
                            style={{
                              padding: "4px 10px",
                              backgroundColor: "#d32f2f",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "0.8em",
                              fontWeight: "500",
                              transition: "background-color 0.2s",
                            }}
                            onMouseOver={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#c62828")
                            }
                            onMouseOut={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#d32f2f")
                            }
                          >
                            🗑️ Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Upload PAN CARD PDF</label>

                    <input
                      type="file"
                      name="pan"
                      accept="application/pdf"
                      onChange={handleFileChange}
                    />

                    {/* Show current file if uploaded */}
                    {documentFiles.pan && (
                      <div
                        style={{
                          fontSize: "0.9em",
                          marginTop: 4,
                          display: "block",
                          color: "#388e3c",
                        }}
                      >
                        <strong>Selected file:</strong> {documentFiles.pan.name}
                        <button
                          type="button"
                          onClick={() => {
                            setDocumentFiles((prev) => ({
                              ...prev,
                              pan: null,
                            }));
                            setFormData((prev) => ({
                              ...prev,
                              PanFileName: "",
                            }));
                            clearFileInput("pan");
                          }}
                          style={{
                            marginLeft: "10px",
                            padding: "2px 8px",
                            fontSize: "0.8em",
                            backgroundColor: "#ff4444",
                            color: "white",
                            border: "none",
                            borderRadius: "3px",
                            cursor: "pointer",
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    {formData.PanFileName && !documentFiles.pan && (
                      <div
                        style={{
                          marginTop: "8px",
                          padding: "8px",
                          backgroundColor: "#f0f7ff",
                          borderRadius: "4px",
                          border: "1px solid #d0e7ff",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.85em",
                            color: "#388e3c",
                            marginBottom: "6px",
                          }}
                        >
                          ✓ Stored: {formData.PanFileName}
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            type="button"
                            onClick={() =>
                              window.open(
                                `${config.API_URL}/user/download/${formData.PanFileName}`,
                                "_blank"
                              )
                            }
                            style={{
                              padding: "4px 10px",
                              backgroundColor: "#1976d2",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "0.8em",
                              fontWeight: "500",
                              transition: "background-color 0.2s",
                            }}
                            onMouseOver={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#1565c0")
                            }
                            onMouseOut={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#1976d2")
                            }
                          >
                            📥 Download
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Are you sure you want to remove this document?"
                                )
                              ) {
                                setFormData((prev) => ({
                                  ...prev,
                                  PanFileName: "",
                                }));
                                toast.success("Document marked for removal");
                              }
                            }}
                            style={{
                              padding: "4px 10px",
                              backgroundColor: "#d32f2f",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "0.8em",
                              fontWeight: "500",
                              transition: "background-color 0.2s",
                            }}
                            onMouseOver={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#c62828")
                            }
                            onMouseOut={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#d32f2f")
                            }
                          >
                            🗑️ Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Upload GST PDF</label>

                    <input
                      type="file"
                      name="gst"
                      accept="application/pdf"
                      onChange={handleFileChange}
                    />

                    {/* Show current file if uploaded */}
                    {documentFiles.gst && (
                      <div
                        style={{
                          fontSize: "0.9em",
                          marginTop: 4,
                          display: "block",
                          color: "#388e3c",
                        }}
                      >
                        <strong>Selected file:</strong> {documentFiles.gst.name}
                        <button
                          type="button"
                          onClick={() => {
                            setDocumentFiles((prev) => ({
                              ...prev,
                              gst: null,
                            }));
                            setFormData((prev) => ({
                              ...prev,
                              GstFileName: "",
                            }));
                            clearFileInput("gst");
                          }}
                          style={{
                            marginLeft: "10px",
                            padding: "2px 8px",
                            fontSize: "0.8em",
                            backgroundColor: "#ff4444",
                            color: "white",
                            border: "none",
                            borderRadius: "3px",
                            cursor: "pointer",
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    {formData.GstFileName && !documentFiles.gst && (
                      <div
                        style={{
                          marginTop: "8px",
                          padding: "8px",
                          backgroundColor: "#f0f7ff",
                          borderRadius: "4px",
                          border: "1px solid #d0e7ff",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.85em",
                            color: "#388e3c",
                            marginBottom: "6px",
                          }}
                        >
                          ✓ Stored: {formData.GstFileName}
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            type="button"
                            onClick={() =>
                              window.open(
                                `${config.API_URL}/user/download/${formData.GstFileName}`,
                                "_blank"
                              )
                            }
                            style={{
                              padding: "4px 10px",
                              backgroundColor: "#1976d2",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "0.8em",
                              fontWeight: "500",
                              transition: "background-color 0.2s",
                            }}
                            onMouseOver={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#1565c0")
                            }
                            onMouseOut={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#1976d2")
                            }
                          >
                            📥 Download
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Are you sure you want to remove this document?"
                                )
                              ) {
                                setFormData((prev) => ({
                                  ...prev,
                                  GstFileName: "",
                                }));
                                toast.success("Document marked for removal");
                              }
                            }}
                            style={{
                              padding: "4px 10px",
                              backgroundColor: "#d32f2f",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "0.8em",
                              fontWeight: "500",
                              transition: "background-color 0.2s",
                            }}
                            onMouseOver={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#c62828")
                            }
                            onMouseOut={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#d32f2f")
                            }
                          >
                            🗑️ Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Upload RC Book PDF</label>

                    <input
                      type="file"
                      name="rcbook"
                      accept="application/pdf"
                      onChange={handleFileChange}
                    />

                    {/* Show current file if uploaded */}
                    {documentFiles.rcbook && (
                      <div
                        style={{
                          fontSize: "0.9em",
                          marginTop: 4,
                          display: "block",
                          color: "#388e3c",
                        }}
                      >
                        <strong>Selected file:</strong>{" "}
                        {documentFiles.rcbook.name}
                        <button
                          type="button"
                          onClick={() => {
                            setDocumentFiles((prev) => ({
                              ...prev,
                              rcbook: null,
                            }));
                            setFormData((prev) => ({
                              ...prev,
                              RcBookFileName: "",
                            }));
                            clearFileInput("rcbook");
                          }}
                          style={{
                            marginLeft: "10px",
                            padding: "2px 8px",
                            fontSize: "0.8em",
                            backgroundColor: "#ff4444",
                            color: "white",
                            border: "none",
                            borderRadius: "3px",
                            cursor: "pointer",
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    {formData.RcBookFileName && !documentFiles.rcbook && (
                      <div
                        style={{
                          marginTop: "8px",
                          padding: "8px",
                          backgroundColor: "#f0f7ff",
                          borderRadius: "4px",
                          border: "1px solid #d0e7ff",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.85em",
                            color: "#388e3c",
                            marginBottom: "6px",
                          }}
                        >
                          ✓ Stored: {formData.RcBookFileName}
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            type="button"
                            onClick={() =>
                              window.open(
                                `${config.API_URL}/user/download/${formData.RcBookFileName}`,
                                "_blank"
                              )
                            }
                            style={{
                              padding: "4px 10px",
                              backgroundColor: "#1976d2",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "0.8em",
                              fontWeight: "500",
                              transition: "background-color 0.2s",
                            }}
                            onMouseOver={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#1565c0")
                            }
                            onMouseOut={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#1976d2")
                            }
                          >
                            📥 Download
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Are you sure you want to remove this document?"
                                )
                              ) {
                                setFormData((prev) => ({
                                  ...prev,
                                  RcBookFileName: "",
                                }));
                                toast.success("Document marked for removal");
                              }
                            }}
                            style={{
                              padding: "4px 10px",
                              backgroundColor: "#d32f2f",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "0.8em",
                              fontWeight: "500",
                              transition: "background-color 0.2s",
                            }}
                            onMouseOver={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#c62828")
                            }
                            onMouseOut={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#d32f2f")
                            }
                          >
                            🗑️ Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Custom Document Upload Fields */}

                {customDocuments.map((doc) => (
                  <div key={doc.category_id} className="form-row">
                    <div className="form-group">
                      <label>Upload {doc.document_name} PDF</label>

                      <input
                        type="file"
                        name={`custom_${doc.category_id}`}
                        accept="application/pdf"
                        onChange={(e) =>
                          handleCustomDocumentChange(doc.category_id, e)
                        }
                      />

                      {formData[`custom_${doc.category_id}_fileName`] && (
                        <div
                          style={{
                            fontSize: "0.9em",
                            marginTop: 4,
                            display: "block",
                          }}
                        >
                          <div style={{ color: "#388e3c" }}>
                            Document already stored:{" "}
                            {formData[`custom_${doc.category_id}_fileName`]}
                          </div>

                          <a
                            href={`${config.API_URL}/user/download/${
                              formData[`custom_${doc.category_id}_fileName`]
                            }`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#1976d2",

                              textDecoration: "underline",

                              cursor: "pointer",

                              marginTop: "4px",

                              display: "inline-block",
                            }}
                            download
                            onClick={async (e) => {
                              try {
                                const response = await fetch(
                                  `${config.API_URL}/user/download/${
                                    formData[
                                      `custom_${doc.category_id}_fileName`
                                    ]
                                  }`
                                );
                                if (!response.ok) {
                                  e.preventDefault();
                                  e.target.style.color = "#f44336";
                                  e.target.textContent =
                                    "⚠️ Not available - Re-upload";
                                  // Update the "Document already stored" message to show error
                                  const parentDiv = e.target.closest("div");
                                  const storedMessage =
                                    parentDiv.querySelector("div");
                                  if (storedMessage) {
                                    storedMessage.style.color = "#f44336";
                                    storedMessage.textContent =
                                      "⚠️ Document stored but file missing - Please re-upload";
                                  }
                                  alert(
                                    "Document not available. Please re-upload the document."
                                  );
                                }
                              } catch (error) {
                                e.preventDefault();
                                e.target.style.color = "#f44336";
                                e.target.textContent =
                                  "⚠️ Not available - Re-upload";
                                // Update the "Document already stored" message to show error
                                const parentDiv = e.target.closest("div");
                                const storedMessage =
                                  parentDiv.querySelector("div");
                                if (storedMessage) {
                                  storedMessage.style.color = "#f44336";
                                  storedMessage.textContent =
                                    "⚠️ Document stored but file missing - Please re-upload";
                                }
                                alert(
                                  "Document not available. Please re-upload the document."
                                );
                              }
                            }}
                          >
                            📄 Download {doc.document_name}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                <div className="form-row">
                  <Button
                    type="button"
                    className="btn-blue"
                    onClick={() => setShowAddDocumentField(true)}
                    style={{ margin: "0 auto" }}
                  >
                    Add Document
                  </Button>
                </div>

                {showAddDocumentField && (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Category Name</label>

                        <Input
                          type="text"
                          value={newDocumentName}
                          onChange={(e) => setNewDocumentName(e.target.value)}
                          placeholder="Enter new category name"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group" style={{ margin: "0 auto" }}>
                        <div
                          style={{
                            display: "flex",
                            gap: "10px",
                            justifyContent: "center",
                          }}
                        >
                          <Button
                            type="button"
                            className="submit-btn"
                            onClick={handleAddDocumentInline}
                            style={{ height: "36px" }}
                          >
                            SAVE
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="form-section">
                <h5>Vehicle Details</h5>

                {vehicleLoading && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "20px",
                      color: "#666",
                    }}
                  >
                    <div>Loading vehicle types...</div>
                  </div>
                )}

                {!vehicleLoading && vehicleList.length === 0 && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "20px",
                      color: "#666",
                    }}
                  >
                    <div>
                      No vehicle types found. Please add a new vehicle type.
                    </div>

                    <Button
                      type="button"
                      className="btn-blue"
                      onClick={() => setShowAddVehicleField(true)}
                      style={{ marginTop: "10px" }}
                    >
                      Add First Vehicle Type
                    </Button>
                  </div>
                )}

                {vehicleList.length > 0 && (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Vehicle *</label>

                        <Select
                          options={vehicleList.map((vehicle) => ({
                            value: vehicle.vehicle_name,

                            label: vehicle.vehicle_name,
                          }))}
                          value={
                            formData.VehicleType
                              ? {
                                  value: formData.VehicleType,
                                  label: formData.VehicleType,
                                }
                              : null
                          }
                          onChange={(option) =>
                            handleInputChange(
                              "VehicleType",
                              option ? option.value : ""
                            )
                          }
                          placeholder="Select Vehicle Type"
                          isClearable
                        />

                        {formData.VehicleType && (
                          <small
                            style={{
                              color: "#388e3c",
                              fontSize: "12px",
                              marginTop: "4px",
                              display: "block",
                            }}
                          >
                            Selected: {formData.VehicleType}
                          </small>
                        )}
                      </div>
                    </div>

                    <div className="form-row">
                      <Button
                        type="button"
                        className="btn-blue"
                        onClick={() => setShowAddVehicleField(true)}
                        style={{ margin: "0 auto" }}
                      >
                        Add Vehicle
                      </Button>
                    </div>

                    {showAddVehicleField && (
                      <div className="form-row">
                        <div className="form-group">
                          <label>New Vehicle Name</label>

                          <div
                            style={{
                              display: "flex",
                              gap: "10px",
                              alignItems: "flex-end",
                              width: "max-content",
                            }}
                          >
                            <Input
                              type="text"
                              value={newVehicleName}
                              onChange={(e) =>
                                setNewVehicleName(e.target.value)
                              }
                              placeholder="Enter new vehicle type name"
                              style={{ flex: 1 }}
                            />

                            <Button
                              type="button"
                              className="submit-btn"
                              onClick={handleAddVehicleInline}
                              style={{ height: "36px" }}
                            >
                              Add
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {vehicleList.length > 0 && (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Vehicle Number</label>

                        <Input
                          type="text"
                          value={formData.VehicleNumber}
                          onChange={(e) =>
                            handleInputChange("VehicleNumber", e.target.value)
                          }
                          placeholder="Enter vehicle number"
                        />
                      </div>

                      <div className="form-group">
                        <label>Make</label>

                        <Input
                          type="text"
                          value={formData.Make}
                          onChange={(e) =>
                            handleInputChange("Make", e.target.value)
                          }
                          placeholder="Enter make"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Model</label>

                        <Input
                          type="text"
                          value={formData.Model}
                          onChange={(e) =>
                            handleInputChange("Model", e.target.value)
                          }
                          placeholder="Enter model"
                        />
                      </div>

                      <div className="form-group">
                        <label>Manufacturing Year</label>

                        <Input
                          type="text"
                          value={formData.ManufacturingYear}
                          onChange={(e) =>
                            handleInputChange(
                              "ManufacturingYear",
                              e.target.value
                            )
                          }
                          placeholder="Enter manufacturing year"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Engine Number</label>

                        <Input
                          type="text"
                          value={formData.EngineNumber}
                          onChange={(e) =>
                            handleInputChange("EngineNumber", e.target.value)
                          }
                          placeholder="Enter engine number"
                        />
                      </div>

                      <div className="form-group">
                        <label>Chassis Number</label>

                        <Input
                          type="text"
                          value={formData.ChassisNumber}
                          onChange={(e) =>
                            handleInputChange("ChassisNumber", e.target.value)
                          }
                          placeholder="Enter chassis number"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="form-section">
                <h5>Running Policy Details</h5>

                <div className="form-row">
                  <div className="form-group">
                    <label>Policy Number</label>

                    <Input
                      type="text"
                      value={formData.PolicyNumber}
                      onChange={(e) =>
                        handleInputChange("PolicyNumber", e.target.value)
                      }
                      placeholder="Enter policy number"
                    />
                  </div>

                  <div className="form-group">
                    <label>Policy Type</label>

                    <Select
                      options={policyTypes.map((policyType) => ({
                        value: policyType.policy_type_name,

                        label: policyType.policy_type_name,
                      }))}
                      value={
                        formData.PolicyType
                          ? {
                              value: formData.PolicyType,
                              label: formData.PolicyType,
                            }
                          : null
                      }
                      onChange={(option) =>
                        handleInputChange(
                          "PolicyType",
                          option ? option.value : ""
                        )
                      }
                      placeholder="Select Policy Type"
                      isClearable
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Company Name</label>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        width: "max-content",
                      }}
                    >
                      {!showAddCompanyField ? (
                        <>
                          <ReactSelect
                            className="react-select-container"
                            classNamePrefix="react-select"
                            name="CompanyName"
                            options={(() => {
                              console.log(
                                "🔍 Company types for options:",
                                companyTypes
                              );
                              const mappedOptions = companyTypes.map(
                                (company) => ({
                                  value: company.company_name,
                                  label: company.company_name,
                                })
                              );
                              console.log("🔍 Mapped options:", mappedOptions);
                              return mappedOptions;
                            })()}
                            value={
                              formData.CompanyName
                                ? {
                                    value: formData.CompanyName,
                                    label: formData.CompanyName,
                                  }
                                : null
                            }
                            onChange={(selected) =>
                              handleInputChange(
                                "CompanyName",
                                selected ? selected.value : ""
                              )
                            }
                            isClearable
                            isSearchable
                            placeholder="Select or type Company Name"
                            styles={{
                              container: (base) => ({ ...base, flex: 1 }),
                            }}
                          />

                          <Button
                            type="button"
                            className="btn-blue"
                            style={{ whiteSpace: "nowrap" }}
                            onClick={() => setShowAddCompanyField(true)}
                          >
                            Add Company
                          </Button>
                        </>
                      ) : (
                        <>
                          <Input
                            type="text"
                            value={newCompanyName}
                            onChange={(e) => setNewCompanyName(e.target.value)}
                            placeholder="New Company Name"
                            style={{ flex: 1 }}
                          />

                          <Button
                            type="button"
                            className="btn-blue"
                            onClick={async () => {
                              if (!newCompanyName.trim()) {
                                toast.error("Company name cannot be empty.");

                                return;
                              }

                              try {
                                console.log(
                                  "🔍 Adding company:",
                                  newCompanyName
                                );
                                const response = await addCompanyType({
                                  company_name: newCompanyName,
                                });
                                console.log(
                                  "🔍 Add company response:",
                                  response
                                );

                                if (response && response.status) {
                                  console.log(
                                    "🔍 Company added successfully, refreshing list..."
                                  );
                                  await fetchCompanyTypes();

                                  handleInputChange(
                                    "CompanyName",
                                    newCompanyName
                                  );

                                  setNewCompanyName("");

                                  setShowAddCompanyField(false);

                                  toast.success("Company added successfully!");
                                } else {
                                  console.log(
                                    "🔍 Failed to add company:",
                                    response
                                  );
                                  toast.error(
                                    "Failed to add company. Please try again."
                                  );
                                }
                              } catch (error) {
                                console.error("Error adding company:", error);

                                toast.error(
                                  "Failed to add company. Please try again."
                                );
                              }
                            }}
                            style={{ minWidth: 70 }}
                          >
                            Save
                          </Button>

                          <Button
                            type="button"
                            className="btn-blue"
                            onClick={() => {
                              setNewCompanyName("");

                              setShowAddCompanyField(false);
                            }}
                            style={{ minWidth: 70 }}
                          >
                            Close
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Company Name Inline Field - New Line */}

                {showAddCompanyField && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>Company Name</label>

                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          alignItems: "flex-end",
                        }}
                      >
                        <Input
                          type="text"
                          value={newCompanyName}
                          onChange={(e) => setNewCompanyName(e.target.value)}
                          placeholder="Enter Company Name"
                          style={{ flex: 1 }}
                        />

                        <Button
                          type="button"
                          className="submit-btn"
                          onClick={handleAddCompanyInline}
                          style={{ height: "36px" }}
                        >
                          SAVE
                        </Button>

                        <Button
                          type="button"
                          className="cancel-btn"
                          onClick={() => {
                            setShowAddCompanyField(false);

                            setNewCompanyName("");
                          }}
                          style={{ height: "36px" }}
                        >
                          CLOSE
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label>Policy Tenure</label>

                    <Input
                      type="number"
                      value={formData.PolicyTenure}
                      onChange={(e) =>
                        handleInputChange("PolicyTenure", e.target.value)
                      }
                      placeholder="Enter policy tenure"
                      min={1}
                      max={10}
                      step={1}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Premium Amount</label>

                    <Input
                      type="text"
                      value={formData.PremiumAmount}
                      onChange={(e) =>
                        handleInputChange("PremiumAmount", e.target.value)
                      }
                      placeholder="Enter premium amount"
                    />
                  </div>

                  <div className="form-group">
                    <label>From</label>

                    <Input
                      type="date"
                      value={formData.From}
                      onChange={(e) =>
                        handleInputChange("From", e.target.value)
                      }
                      placeholder="dd-mm-yyyy"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>To</label>

                    <Input
                      type="date"
                      value={formData.To}
                      onChange={(e) => handleInputChange("To", e.target.value)}
                      placeholder="dd-mm-yyyy"
                    />
                  </div>

                  <div className="form-group">
                    <label>NCB</label>

                    <Input
                      type="text"
                      value={formData.NCB}
                      onChange={(e) => handleInputChange("NCB", e.target.value)}
                      placeholder="Enter NCB"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>IDV</label>

                    <Input
                      type="text"
                      value={formData.IDV}
                      onChange={(e) => handleInputChange("IDV", e.target.value)}
                      placeholder="Enter IDV"
                    />
                  </div>

                  <div className="form-group">
                    <label>Policy Issued Date</label>

                    <Input
                      type="date"
                      value={formData.PolicyIssuedDate}
                      onChange={(e) =>
                        handleInputChange("PolicyIssuedDate", e.target.value)
                      }
                      placeholder="dd-mm-yyyy"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Policy Expiry Date</label>

                    <Input
                      type="date"
                      value={formData.PolicyExpiryDate}
                      onChange={(e) =>
                        handleInputChange("PolicyExpiryDate", e.target.value)
                      }
                      placeholder="dd-mm-yyyy"
                    />
                  </div>

                  <div className="form-group">
                    <label>Policy Plan Type</label>

                    <Select
                      options={policyPlans.map((plan) => ({
                        value: plan.policy_name,

                        label: plan.policy_name,
                      }))}
                      value={
                        formData.PolicyPlanType
                          ? {
                              value: formData.PolicyPlanType,
                              label: formData.PolicyPlanType,
                            }
                          : null
                      }
                      onChange={(option) =>
                        handleInputChange(
                          "PolicyPlanType",
                          option ? option.value : ""
                        )
                      }
                      placeholder="Select or type Policy Plan Type"
                      isClearable
                    />

                    <Button
                      type="button"
                      className="btn-blue"
                      onClick={() => setShowAddPolicyPlanField(true)}
                      style={{ marginTop: "8px" }}
                    >
                      ADD POLICY PLAN
                    </Button>
                  </div>
                </div>

                {/* Policy Plan Type Inline Field - New Line */}

                {showAddPolicyPlanField && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>Policy Plan Name</label>

                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          alignItems: "flex-end",
                        }}
                      >
                        <Input
                          type="text"
                          value={newPolicyPlanName}
                          onChange={(e) => setNewPolicyPlanName(e.target.value)}
                          placeholder="Enter Plan Name"
                          style={{ flex: 1 }}
                        />

                        <Button
                          type="button"
                          className="submit-btn"
                          onClick={handleAddPolicyPlanInline}
                          style={{ height: "36px" }}
                        >
                          SAVE
                        </Button>

                        <Button
                          type="button"
                          className="cancel-btn"
                          onClick={() => {
                            setShowAddPolicyPlanField(false);

                            setNewPolicyPlanName("");
                          }}
                          style={{ height: "36px" }}
                        >
                          CANCEL
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label>Vendor</label>

                    <Input
                      type="text"
                      value={formData.Vendor}
                      onChange={(e) =>
                        handleInputChange("Vendor", e.target.value)
                      }
                      placeholder="Enter vendor"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Has Nominee? <span style={{ color: "red" }}>*</span>
                    </label>

                    <div
                      style={{ display: "flex", gap: "20px", marginTop: "8px" }}
                    >
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="radio"
                          name="hasNominee"
                          value="yes"
                          checked={formData.hasNominee === "yes"}
                          onChange={(e) =>
                            handleInputChange("hasNominee", e.target.value)
                          }
                          style={{ cursor: "pointer" }}
                        />

                        <span>Yes</span>
                      </label>

                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="radio"
                          name="hasNominee"
                          value="no"
                          checked={formData.hasNominee === "no"}
                          onChange={(e) =>
                            handleInputChange("hasNominee", e.target.value)
                          }
                          style={{ cursor: "pointer" }}
                        />

                        <span>No</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Nominee fields - only show if hasNominee is 'yes' */}

                {formData.hasNominee === "yes" && (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Nominee Name</label>

                        <Input
                          type="text"
                          value={formData.NomineeName}
                          onChange={(e) =>
                            handleInputChange("NomineeName", e.target.value)
                          }
                          placeholder="Enter nominee name"
                        />
                      </div>

                      <div className="form-group">
                        <label>Nominee Relation</label>

                        <Input
                          type="text"
                          value={formData.NomineeRelation}
                          onChange={(e) =>
                            handleInputChange("NomineeRelation", e.target.value)
                          }
                          placeholder="Enter nominee relation"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Nominee DOB</label>

                        <Input
                          type="date"
                          value={formData.NomineeDob}
                          onChange={(e) =>
                            handleInputChange("NomineeDob", e.target.value)
                          }
                          placeholder="dd-mm-yyyy"
                        />
                      </div>

                      <div className="form-group">
                        <label>Nominee Age</label>

                        <Input
                          type="text"
                          value={formData.NomineeAge}
                          placeholder="Auto-calculated"
                          readOnly
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label>Upload Running Policy PDF</label>

                    <input
                      type="file"
                      name="RunningPolicyPDF"
                      accept="application/pdf"
                      onChange={handleFileChange}
                    />

                    {/* Show current file if uploaded - only in step 4 */}
                    {step === 4 && formData.CurrentPolicyFile && (
                      <div
                        style={{
                          fontSize: "0.9em",
                          marginTop: 4,
                          display: "block",
                          color: "#388e3c",
                        }}
                      >
                        <strong>Selected file:</strong>{" "}
                        {formData.RunningPolicyFileName ||
                          formData.CurrentPolicyFile.name}
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              CurrentPolicyFile: null,
                              RunningPolicyFileName: "",
                            }));
                            setDocumentFiles((prev) => ({
                              ...prev,
                              CurrentPolicyFile: null,
                            }));
                            clearFileInput("RunningPolicyPDF");
                          }}
                          style={{
                            marginLeft: "10px",
                            padding: "2px 8px",
                            fontSize: "0.8em",
                            backgroundColor: "#ff4444",
                            color: "white",
                            border: "none",
                            borderRadius: "3px",
                            cursor: "pointer",
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    {step === 4 &&
                      formData.RunningPolicyFileName &&
                      !formData.CurrentPolicyFile && (
                        <div
                          style={{
                            marginTop: "8px",
                            padding: "8px",
                            backgroundColor: "#f0f7ff",
                            borderRadius: "4px",
                            border: "1px solid #d0e7ff",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "0.85em",
                              color: "#388e3c",
                              marginBottom: "6px",
                            }}
                          >
                            ✓ Stored: {formData.RunningPolicyFileName}
                          </div>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              type="button"
                              onClick={() =>
                                window.open(
                                  `${config.API_URL}/user/download/${formData.RunningPolicyFileName}`,
                                  "_blank"
                                )
                              }
                              style={{
                                padding: "4px 10px",
                                backgroundColor: "#1976d2",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "0.8em",
                                fontWeight: "500",
                                transition: "background-color 0.2s",
                              }}
                              onMouseOver={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  "#1565c0")
                              }
                              onMouseOut={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  "#1976d2")
                              }
                            >
                              📥 Download
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Are you sure you want to remove this document?"
                                  )
                                ) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    RunningPolicyFileName: "",
                                  }));
                                  toast.success("Document marked for removal");
                                }
                              }}
                              style={{
                                padding: "4px 10px",
                                backgroundColor: "#d32f2f",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "0.8em",
                                fontWeight: "500",
                                transition: "background-color 0.2s",
                              }}
                              onMouseOver={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  "#c62828")
                              }
                              onMouseOut={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  "#d32f2f")
                              }
                            >
                              🗑️ Remove
                            </button>
                          </div>
                        </div>
                      )}

                    {(formData.AadharFileName ||
                      formData.PanFileName ||
                      formData.GstFileName) && (
                      <div style={{ marginTop: 6 }}>
                        {formData.AadharFileName && (
                          <div style={{ fontSize: "0.9em", color: "#555" }}>
                            Aadhar: {formData.AadharFileName}
                          </div>
                        )}

                        {formData.PanFileName && (
                          <div style={{ fontSize: "0.9em", color: "#555" }}>
                            PAN: {formData.PanFileName}
                          </div>
                        )}

                        {formData.GstFileName && (
                          <div style={{ fontSize: "0.9em", color: "#555" }}>
                            GST: {formData.GstFileName}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 5 &&
              (formData.policyRadio === "Renewal" ||
                formData.policyRadio === "Portability") && (
                <div className="form-section">
                  <h5>Previous Policy Details</h5>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Previous Policy Number</label>

                      <Input
                        type="text"
                        value={formData.previousPolicy?.PolicyNumber || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "PreviousPolicyNumber",
                            e.target.value
                          )
                        }
                        placeholder="Enter previous policy number"
                      />
                    </div>

                    <div className="form-group">
                      <label>Previous Company Name</label>

                      <Input
                        type="text"
                        value={formData.previousPolicy?.CompanyName || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "PreviousCompanyName",
                            e.target.value
                          )
                        }
                        placeholder="Enter previous company name"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Previous Policy From</label>

                      <Input
                        type="date"
                        value={formData.previousPolicy?.PolicyFrom || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "PreviousPolicyFrom",
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label>Previous Policy To</label>

                      <Input
                        type="date"
                        value={formData.previousPolicy?.PolicyTo || ""}
                        onChange={(e) =>
                          handleInputChange("PreviousPolicyTo", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Previous Policy Tenure</label>

                      <Input
                        type="number"
                        value={formData.previousPolicy?.PolicyTenure || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "PreviousPolicyTenure",
                            e.target.value
                          )
                        }
                        placeholder="Enter previous policy tenure"
                      />
                    </div>

                    <div className="form-group">
                      <label>Previous Premium Amount</label>

                      <Input
                        type="text"
                        value={formData.previousPolicy?.PremiumAmount || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "PreviousPremiumAmount",
                            e.target.value
                          )
                        }
                        placeholder="Enter previous premium amount"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Previous IDV</label>

                      <Input
                        type="text"
                        value={formData.previousPolicy?.IDV || ""}
                        onChange={(e) =>
                          handleInputChange("PreviousIDV", e.target.value)
                        }
                        placeholder="Enter previous IDV"
                      />
                    </div>

                    <div className="form-group">
                      <label>Previous Policy NCB</label>

                      <Input
                        type="text"
                        value={formData.previousPolicy?.NCB || ""}
                        onChange={(e) =>
                          handleInputChange("PreviousNCB", e.target.value)
                        }
                        placeholder="Enter previous policy NCB"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Previous Nominee Name</label>

                      <Input
                        type="text"
                        value={formData.previousPolicy?.NomineeName || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "PreviousNomineeName",
                            e.target.value
                          )
                        }
                        placeholder="Enter previous nominee name"
                      />
                    </div>

                    <div className="form-group">
                      <label>Previous Nominee Relation</label>

                      <Input
                        type="text"
                        value={formData.previousPolicy?.NomineeRelation || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "PreviousNomineeRelation",
                            e.target.value
                          )
                        }
                        placeholder="Enter previous nominee relation"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Previous Nominee DOB</label>

                      <Input
                        type="date"
                        value={formData.previousPolicy?.NomineeDob || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "PreviousNomineeDob",
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label>Previous Nominee Age</label>

                      <Input
                        type="text"
                        value={formData.previousPolicy?.NomineeAge || ""}
                        readOnly
                        placeholder="Auto-calculated"
                        style={{ backgroundColor: "#f8f9fa", color: "#6c757d" }}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Upload Previous Policy PDF</label>

                      <input
                        type="file"
                        name="PreviousPolicyPDF"
                        accept="application/pdf"
                        onChange={handleFileChange}
                      />

                      {/* Show current file if uploaded */}
                      {formData.previousPolicy?.PdfFile &&
                        typeof formData.previousPolicy.PdfFile === "object" && (
                          <div
                            style={{
                              fontSize: "0.9em",
                              marginTop: 4,
                              display: "block",
                              color: "#388e3c",
                            }}
                          >
                            <strong>Selected file:</strong>{" "}
                            {formData.previousPolicy.PdfFile.name}
                            <button
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  previousPolicy: {
                                    ...prev.previousPolicy,
                                    PdfFile: null,
                                  },
                                }));
                                clearFileInput("PreviousPolicyPDF");
                              }}
                              style={{
                                marginLeft: "10px",
                                padding: "2px 8px",
                                fontSize: "0.8em",
                                backgroundColor: "#ff4444",
                                color: "white",
                                border: "none",
                                borderRadius: "3px",
                                cursor: "pointer",
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        )}

                      {formData.previousPolicy?.PdfFile &&
                        typeof formData.previousPolicy.PdfFile === "string" && (
                          <div
                            style={{
                              marginTop: "8px",
                              padding: "8px",
                              backgroundColor: "#f0f7ff",
                              borderRadius: "4px",
                              border: "1px solid #d0e7ff",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "0.85em",
                                color: "#388e3c",
                                marginBottom: "6px",
                              }}
                            >
                              ✓ Stored: {formData.previousPolicy.PdfFile}
                            </div>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button
                                type="button"
                                onClick={() =>
                                  window.open(
                                    `${config.API_URL}/user/download/${formData.previousPolicy.PdfFile}`,
                                    "_blank"
                                  )
                                }
                                style={{
                                  padding: "4px 10px",
                                  backgroundColor: "#1976d2",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  fontSize: "0.8em",
                                  fontWeight: "500",
                                  transition: "background-color 0.2s",
                                }}
                                onMouseOver={(e) =>
                                  (e.currentTarget.style.backgroundColor =
                                    "#1565c0")
                                }
                                onMouseOut={(e) =>
                                  (e.currentTarget.style.backgroundColor =
                                    "#1976d2")
                                }
                              >
                                📥 Download
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      "Are you sure you want to remove this document?"
                                    )
                                  ) {
                                    setFormData((prev) => ({
                                      ...prev,
                                      previousPolicy: {
                                        ...prev.previousPolicy,
                                        PdfFile: null,
                                      },
                                    }));
                                    toast.success(
                                      "Document marked for removal"
                                    );
                                  }
                                }}
                                style={{
                                  padding: "4px 10px",
                                  backgroundColor: "#d32f2f",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  fontSize: "0.8em",
                                  fontWeight: "500",
                                  transition: "background-color 0.2s",
                                }}
                                onMouseOver={(e) =>
                                  (e.currentTarget.style.backgroundColor =
                                    "#c62828")
                                }
                                onMouseOut={(e) =>
                                  (e.currentTarget.style.backgroundColor =
                                    "#d32f2f")
                                }
                              >
                                🗑️ Remove
                              </button>
                            </div>
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Previous Agent Details - Only for Portability in Step 5 */}
                  {formData.policyRadio === "Portability" && (
                    <div className="form-section">
                      <h5>Previous Agent Details (From Old Company)</h5>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Previous Agent Name</label>
                          <Input
                            type="text"
                            value={formData.previousPolicy?.agentName || ""}
                            onChange={(e) =>
                              handleInputChange(
                                "PreviousAgentName",
                                e.target.value
                              )
                            }
                            placeholder="Enter previous agent name"
                          />
                        </div>
                        <div className="form-group">
                          <label>Previous Agent Contact Number</label>
                          <Input
                            type="text"
                            value={
                              formData.previousPolicy?.agentContactNumber || ""
                            }
                            onChange={(e) =>
                              handleInputChange(
                                "PreviousAgentContactNumber",
                                e.target.value
                              )
                            }
                            placeholder="Enter previous agent contact number"
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Previous Agent Code</label>
                          <Input
                            type="text"
                            value={formData.previousPolicy?.agentCode || ""}
                            onChange={(e) =>
                              handleInputChange(
                                "PreviousAgentCode",
                                e.target.value
                              )
                            }
                            placeholder="Enter previous agent code"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

            {((step === 5 &&
              formData.policyRadio !== "Renewal" &&
              formData.policyRadio !== "Portability") ||
              (step === 6 &&
                (formData.policyRadio === "Renewal" ||
                  formData.policyRadio === "Portability"))) && (
              <div className="form-section">
                <h5>
                  {formData.policyRadio === "Renewal" ||
                  formData.policyRadio === "Portability"
                    ? "Current Agent Details (Your Company)"
                    : "Agent Details"}
                </h5>

                <div className="form-row">
                  <div className="form-group">
                    <label>Agent Name</label>

                    <Input
                      type="text"
                      value={formData.AgentName}
                      onChange={(e) =>
                        handleInputChange("AgentName", e.target.value)
                      }
                      placeholder="Enter agent name"
                    />
                  </div>

                  <div className="form-group">
                    <label>Agent Contact Number</label>

                    <Input
                      type="text"
                      value={formData.AgentContactNumber}
                      onChange={(e) =>
                        handleInputChange("AgentContactNumber", e.target.value)
                      }
                      placeholder="Enter agent contact number"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Agent Code</label>

                    <Input
                      type="text"
                      value={formData.AgentCode}
                      onChange={(e) =>
                        handleInputChange("AgentCode", e.target.value)
                      }
                      placeholder="Enter agent code"
                    />
                  </div>

                  <div className="form-group">
                    <label>Reference</label>

                    <Select
                      options={references.map((ref) => ({
                        value: ref.reference_name,

                        label: ref.reference_name,
                      }))}
                      value={
                        formData.Reference
                          ? {
                              value: formData.Reference,
                              label: formData.Reference,
                            }
                          : null
                      }
                      onChange={(option) =>
                        handleInputChange(
                          "Reference",
                          option ? option.value : ""
                        )
                      }
                      placeholder="Select a reference"
                      isClearable
                    />

                    <Button
                      type="button"
                      className="btn-blue"
                      onClick={() => setShowAddReferenceField(true)}
                      style={{ marginTop: "8px" }}
                    >
                      Add Reference
                    </Button>
                  </div>

                  {showAddReferenceField && (
                    <div className="form-row">
                      <div className="form-group">
                        <label>New Reference Name</label>

                        <div
                          style={{
                            display: "flex",
                            gap: "10px",
                            alignItems: "flex-end",
                          }}
                        >
                          <Input
                            type="text"
                            value={newReferenceName}
                            onChange={(e) =>
                              setNewReferenceName(e.target.value)
                            }
                            placeholder="Enter new reference name"
                            style={{ flex: 1 }}
                          />

                          <Button
                            type="button"
                            className="submit-btn"
                            onClick={handleAddReferenceInline}
                            style={{ height: "36px" }}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="form-actions">
              {step > 1 && (
                <Button
                  type="button"
                  className="cancel-btn"
                  onClick={handleBack}
                >
                  Back
                </Button>
              )}

              {step <
              (formData.policyRadio === "Renewal" ||
              formData.policyRadio === "Portability"
                ? 6
                : 5) ? (
                <Button
                  type="button"
                  className="submit-btn"
                  onClick={handleNext}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="button"
                  className="submit-btn"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? "Saving..." : editData ? "Update" : "Add"}
                </Button>
              )}
            </div>
          </form>
        </Modal>

        {/* View Details Modal */}

        <Modal
          open={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title="Vehicle Insurance"
        >
          {viewData && (
            <div className="consumer-form">
              {/* Consumer Information */}
              <div className="form-section">
                <h5>Consumer Information</h5>
                <div className="form-row">
                  <div className="form-group">
                    <label>Name:</label>
                    <span className="detail-value">
                      {viewData.username || "N/A"}
                    </span>
                  </div>
                  <div className="form-group">
                    <label>Email:</label>
                    <span className="detail-value">
                      {viewData.email || "N/A"}
                    </span>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Mobile:</label>
                    <span className="detail-value">
                      {viewData.mobileNumber || "N/A"}
                    </span>
                  </div>
                  <div className="form-group">
                    <label>Reference:</label>
                    <span className="detail-value">
                      {viewData.reference_name || "N/A"}
                    </span>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Contact Person Name:</label>
                    <span className="detail-value">
                      {viewData.contact_person_name || "N/A"}
                    </span>
                  </div>
                  <div className="form-group">
                    <label>Contact Person Number:</label>
                    <span className="detail-value">
                      {viewData.contact_person_no || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Vehicle Information */}
              {/* VEHICLE INFORMATION */}
              <div className="form-section">
                <h5>Vehicle Information</h5>

                {/* Policy Type */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Policy Type:</label>
                    <span className="detail-value">
                      {(() => {
                        const policyTypeId =
                          viewData.runningPolicy?.PolicyTypeId ||
                          viewData.runningPolicy?.policy_type_id ||
                          viewData.PolicyTypeId;

                        if (
                          policyTypeId &&
                          Array.isArray(policyTypes) &&
                          policyTypes.length > 0
                        ) {
                          const found = policyTypes.find(
                            (pt) => pt.policy_type_id === policyTypeId
                          );
                          if (found?.policy_type_name)
                            return found.policy_type_name;
                        }

                        return (
                          viewData.runningPolicy?.policy_type ||
                          viewData.runningPolicy?.PolicyType ||
                          viewData.policy_type ||
                          viewData.vehicle_policy_type ||
                          "N/A"
                        )
                          .toString()
                          .trim();
                      })()}
                    </span>
                  </div>
                </div>

                {/* Vehicle Details */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Vehicle Number:</label>
                    <span className="detail-value">
                      {viewData.vehicle_number || "N/A"}
                    </span>
                  </div>
                  <div className="form-group">
                    <label>Make:</label>
                    <span className="detail-value">
                      {viewData.make || "N/A"}
                    </span>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Model:</label>
                    <span className="detail-value">
                      {viewData.model || "N/A"}
                    </span>
                  </div>
                  <div className="form-group">
                    <label>Chassis Number:</label>
                    <span className="detail-value">
                      {viewData.chassis_number || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* RUNNING POLICY DETAILS */}
              <div className="form-section">
                <h5>Running Policy Details</h5>

                <div className="form-row">
                  <div className="form-group">
                    <label>Policy Number:</label>
                    <span className="detail-value">
                      {viewData.runningPolicy?.PolicyNumber || "N/A"}
                    </span>
                  </div>

                  <div className="form-group">
                    <label>Policy Type:</label>
                    <span className="detail-value">
                      {(() => {
                        // First try to get the policy type name from ID
                        const policyTypeId =
                          viewData.runningPolicy?.PolicyTypeId ||
                          viewData.runningPolicy?.policy_type_id;

                        if (
                          policyTypeId &&
                          Array.isArray(policyTypes) &&
                          policyTypes.length > 0
                        ) {
                          const found = policyTypes.find(
                            (pt) => pt.policy_type_id === policyTypeId
                          );
                          if (found?.policy_type_name)
                            return found.policy_type_name;
                        }

                        // Fallback to string values
                        const policyType =
                          viewData.runningPolicy?.policy_type ||
                          viewData.runningPolicy?.PolicyType ||
                          viewData.policy_type ||
                          "";

                        return policyType.toString().trim() || "N/A";
                      })()}
                    </span>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Company Name:</label>
                    <span className="detail-value">
                      {viewData.runningPolicy?.CompanyType?.company_name ||
                        viewData.runningPolicy?.CompanyName ||
                        viewData.company_name ||
                        "N/A"}
                    </span>
                  </div>

                  <div className="form-group">
                    <label>Policy Plan:</label>
                    <span className="detail-value">
                      {viewData.runningPolicy?.PolicyPlanType ||
                        viewData.policy_plan_type ||
                        viewData.runningPolicy?.policy_plan_id ||
                        "N/A"}
                    </span>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Policy From:</label>
                    <span className="detail-value">
                      {viewData.runningPolicy?.PolicyFrom
                        ? new Date(
                            viewData.runningPolicy.PolicyFrom
                          ).toLocaleDateString("en-GB")
                        : "N/A"}
                    </span>
                  </div>
                  <div className="form-group">
                    <label>Policy To:</label>
                    <span className="detail-value">
                      {viewData.runningPolicy?.PolicyTo
                        ? new Date(
                            viewData.runningPolicy.PolicyTo
                          ).toLocaleDateString("en-GB")
                        : "N/A"}
                    </span>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Policy Issued Date:</label>
                    <span className="detail-value">
                      {viewData.runningPolicy?.PolicyIssuedDate
                        ? new Date(
                            viewData.runningPolicy.PolicyIssuedDate
                          ).toLocaleDateString("en-GB")
                        : "N/A"}
                    </span>
                  </div>
                  <div className="form-group">
                    <label>Policy Expiry Date:</label>
                    <span className="detail-value">
                      {viewData.runningPolicy?.PolicyTo
                        ? new Date(
                            viewData.runningPolicy.PolicyTo
                          ).toLocaleDateString("en-GB")
                        : "N/A"}
                    </span>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Premium Amount:</label>
                    <span className="detail-value">
                      {viewData.runningPolicy?.PremiumAmount || "N/A"}
                    </span>
                  </div>
                  <div className="form-group">
                    <label>Vendor:</label>
                    <span className="detail-value">
                      {viewData.vendor ||
                        viewData.runningPolicy?.Vendor ||
                        "N/A"}
                    </span>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Nominee Name:</label>
                    <span className="detail-value">
                      {viewData.runningPolicy?.NomineeName || "N/A"}
                    </span>
                  </div>
                  <div className="form-group">
                    <label>Nominee DOB:</label>
                    <span className="detail-value">
                      {viewData.runningPolicy?.NomineeDob
                        ? new Date(
                            viewData.runningPolicy.NomineeDob
                          ).toLocaleDateString("en-GB")
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Documents Section */}
              <div className="form-section">
                <h5>Documents</h5>
                {["Aadhar", "PAN", "GST", "RC Book"].map((docName, idx) => {
                  const categoryId = idx + 1; // Aadhar=1, PAN=2, GST=3, RC=4
                  const doc = viewData.documents?.find(
                    (d) => d.categoryId === categoryId
                  );
                  return (
                    <div className="form-row" key={docName}>
                      <div
                        className="form-group"
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                        }}
                      >
                        <label style={{ fontWeight: 600 }}>{docName}:</label>
                        {doc && doc.file ? (
                          <div
                            style={{
                              // display: 'flex',
                              alignItems: "center",
                              gap: "10px",
                            }}
                          >
                            <a
                              href={`${(
                                process.env.REACT_APP_DOWNLOAD_URL ||
                                config.API_URL + "/upload"
                              ).replace(/\/$/, "")}/${encodeURIComponent(
                                (doc.file || "").split("/").pop() || ""
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-primary"
                            >
                              Download
                            </a>
                            <div style={{ marginTop: "3px" }}>
                              {(doc.file || "").split("/").pop() || "file"}
                            </div>
                          </div>
                        ) : (
                          <span>No document uploaded</span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Running Policy Document */}
                {viewData.runningPolicy?.CurrentPolicyFile && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>Running Policy:</label>
                      <a
                        href={`${(
                          process.env.REACT_APP_DOWNLOAD_URL ||
                          config.API_URL + "/upload"
                        ).replace(/\/$/, "")}/${encodeURIComponent(
                          (viewData.runningPolicy.CurrentPolicyFile || "")
                            .split("/")
                            .pop() || ""
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                )}
              </div>
              {/* Agent Details */}
              <div className="form-section">
                <h5>Agent Details</h5>
                <div className="form-row">
                  <div className="form-group">
                    <label>Agent Name:</label>
                    <span className="detail-value">
                      {viewData.agentName ||
                        viewData.runningPolicy?.agentName ||
                        "N/A"}
                    </span>
                  </div>
                  <div className="form-group">
                    <label>Agent Code:</label>
                    <span className="detail-value">
                      {viewData.agentCode ||
                        viewData.runningPolicy?.agentCode ||
                        "N/A"}
                    </span>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Agent Contact:</label>
                    <span className="detail-value">
                      {viewData.agentContactNumber ||
                        viewData.runningPolicy?.agentContactNumber ||
                        "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div style={{ textAlign: "right", marginTop: "20px" }}>
            <Button onClick={() => setIsViewModalOpen(false)}>Close</Button>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default VehicleInsurance;
