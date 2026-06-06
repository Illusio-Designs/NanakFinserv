import { DOCUMENT_IDS } from "../config/ids";
import React, { useState, useEffect } from 'react';
import './EditVehiclePopup.css';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import toast from 'react-hot-toast';
import { addPolicyplanDetails, getAllPolicyPlans, getAllReferences, addReference, getAllVehicles, addVehicleDetails, getAllPolicyTypes, getAllCompanyTypes, addCompanyType } from '../serviceAPI/userAPI';
import Select from 'react-select';
import { FaDownload, FaTrash } from 'react-icons/fa';
import config from '../config/apiConfig';

// Helper to convert empty string/undefined to null for IDs
const toNullIfEmpty = (val) => (val === '' || val === undefined ? null : val);

function formatDateToDDMMYYYY(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatDateForInput(dateStr) {
  if (!dateStr) return "";
  
  // If it's already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // If it's a partial date (like just year), return as is to prevent clearing
  if (/^\d{4}$/.test(dateStr) || /^\d{4}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Try to parse as a date
  const d = new Date(dateStr);
  if (isNaN(d)) {
    // If parsing fails, return the original string to prevent clearing
    return dateStr;
  }
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function calculateAgeFromDOB(dob) {
    if (!dob) return '';
    
    try {
    const birthDate = new Date(dob);
    const today = new Date();
        
        // Check if the date is valid
        if (isNaN(birthDate.getTime())) {
            return '';
        }
        
    let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
        
        return age > 0 ? age.toString() : '';
    } catch (error) {
        console.error('Error calculating age:', error);
        return '';
    }
}

const EditVehiclePopup = ({ data, onClose, onSubmit, mode = 'edit', isOpen }) => {
    const [step, setStep] = useState(1);
    const defaultFormData = {
                // Step 1 - Consumer Details
                Name: '',
                Email: '',
                MobileNumber: '',
                ContactPersonName: '',
                ContactPersonMobileNumber: '',
        PolicyType: '',
        Type: '',
                // Step 2 - Vehicle Details
                VehicleType: '',
                VehicleNumber: '',
                Make: '',
                Model: '',
                Vendor: '',
                CompanyName: '',
                ManufacturingYear: '',
                EngineNumber: '',
                ChassisNumber: '',
                // IDs
                vehicle_user_id: '',
                NomineeDob: '',
                // Step 4 - Policy Details
        AgentName: '',
        AgentContactNumber: '',
        AgentCode: '',
        Reference: '',
        PolicyPlanType: '',
                From: '',
                To: '',
                PolicyIssuedDate: '',
                PolicyNumber: '',
                PremiumAmount: '',
                NCB: '',
                IDV: '',
                NomineeName: '',
                NomineeRelation: '',
                NomineeAge: '',
                PolicyTenure: '',
                vehicle_id: '',
                reference_id: '',
                vehicle_policy_type: '',
                nominee_type: '',
                policyRadio: '',
                nomineeRadio: '',
                policy_type_id: '',
                policy_plan_id: '',
                company_id: '',
                isNomineeFlag: '',
                CurrentPolicyFile: '',
        // Document file names
        AadharFileName: '',
        PanFileName: '',
        GstFileName: '',
        RunningPolicyFileName: '',
        previousPolicy: {},
        documents: [],
        reference: {},
        runningPolicy: {},
        user_pk_vehicle_id: {},
        consumer_role_id: '',
    };

    const [formData, setFormData] = useState(defaultFormData);
    const [documentFiles, setDocumentFiles] = useState({
        aadhar: null,
        pan: null,
        gst: null,
    });
    const [showCategoryInput, setShowCategoryInput] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [customDocuments, setCustomDocuments] = useState([]);
    const [showVehicleInput, setShowVehicleInput] = useState(false);
    const [newVehicleName, setNewVehicleName] = useState('');
    const [vehicleList, setVehicleList] = useState([]);
    const [showPolicyPlanFields, setShowPolicyPlanFields] = useState(false);
    const [newPolicyPlanType, setNewPolicyPlanType] = useState('');
    const [newPlanName, setNewPlanName] = useState('');
    const [showCompanyNameField, setShowCompanyNameField] = useState(false);
    const [showAddPolicyPlan, setShowAddPolicyPlan] = useState(false);
    const [newCompanyName, setNewCompanyName] = useState("");
    const [policyPlans, setPolicyPlans] = useState([]);
    const [runningPolicyFileName, setRunningPolicyFileName] = useState('');
    const [references, setReferences] = useState([]);
    const [showReferenceInput, setShowReferenceInput] = useState(false);
    const [newReference, setNewReference] = useState('');
    const [vehicleTypes, setVehicleTypes] = useState([]);
    const [policyTypes, setPolicyTypes] = useState([]);
    const [companyTypes, setCompanyTypes] = useState([]);
    const [documentsToRemove, setDocumentsToRemove] = useState([]);

    const handleDownloadDocument = async (fileName) => {
        if (!fileName) return;
        try {
            const url = `${config.API_URL}/user/download/${fileName}`;
            window.open(url, '_blank');
        } catch (error) {
            console.error('Error downloading document:', error);
            toast.error('Failed to download document');
        }
    };

    const handleRemoveDocument = (categoryId, fileName) => {
        if (window.confirm('Are you sure you want to remove this document?')) {
            // Track document to remove
            setDocumentsToRemove(prev => [...prev, { categoryId, fileName }]);
            
            // Update formData to clear the file name
            if (categoryId === DOCUMENT_IDS.AADHAR) {
                setFormData(prev => ({ ...prev, AadharFileName: '' }));
            } else if (categoryId === DOCUMENT_IDS.PAN) {
                setFormData(prev => ({ ...prev, PanFileName: '' }));
            } else if (categoryId === DOCUMENT_IDS.GST) {
                setFormData(prev => ({ ...prev, GstFileName: '' }));
            }
            
            toast.success('Document marked for removal');
        }
    };

    const fetchPolicyPlans = async () => {
        const response = await getAllPolicyPlans();
        if (response && response.data) {
            setPolicyPlans(response.data);
        }
    };

    const fetchReferences = async () => {
        // Mocking API call for now
        const response = {
            data: [
                { reference_id: 1, reference_name: 'SUNNYSIR' },
                { reference_id: 2, reference_name: 'ANOTHER_REF' }
            ]
        };
        if (response && response.data) {
            setReferences(response.data);
        }
    };

    const fetchVehicleTypes = async () => {
        const response = await getAllVehicles();
        if (response && response.data) {
            setVehicleTypes(response.data);
        }
    };

    const fetchCompanyTypes = async () => {
        console.log('🔍 Fetching company types...');
        const response = await getAllCompanyTypes();
        console.log('🔍 Company types response:', response);
        if (response && response.data) {
            setCompanyTypes(response.data);
            console.log('🔍 Company types set:', response.data);
        }
    };

    useEffect(() => {
        fetchPolicyPlans();
        fetchReferences();
        fetchVehicleTypes();
        fetchCompanyTypes();
        // Fetch policy types and companies
        const fetchTypesAndCompanies = async () => {
            try {
                const policyTypeRes = await getAllPolicyTypes();
                if (policyTypeRes && policyTypeRes.data) setPolicyTypes(policyTypeRes.data);
            } catch (e) { console.error('Failed to fetch policy types', e); }
        };
        fetchTypesAndCompanies();
    }, []);

    useEffect(() => {
        if ((mode === 'edit' || mode === 'renewal') && data && isOpen) {
            console.log('🔧 [EditVehiclePopup] Processing data for mode:', mode);
            console.log('🔧 [EditVehiclePopup] Received data:', data);
            console.log('🔧 [EditVehiclePopup] Data type:', typeof data);
            console.log('🔧 [EditVehiclePopup] Data keys:', data ? Object.keys(data) : 'No data');
            console.log('🔧 [EditVehiclePopup] Specific problematic fields in received data:', {
                'data.PremiumAmount': data.PremiumAmount,
                'data.AgentName': data.AgentName,
                'data.AgentContactNumber': data.AgentContactNumber,
                'data.AgentCode': data.AgentCode,
                'data.runningPolicy?.PremiumAmount': data.runningPolicy?.PremiumAmount,
                'data.runningPolicy?.AgentName': data.runningPolicy?.AgentName
            });
            
            // Extract document file names by categoryId (handle string/number)
            const aadharDoc = (data.documents && Array.isArray(data.documents)) ? data.documents.find(doc => doc.categoryId == DOCUMENT_IDS.AADHAR) : null;
            const panDoc = (data.documents && Array.isArray(data.documents)) ? data.documents.find(doc => doc.categoryId == DOCUMENT_IDS.PAN) : null;
            const gstDoc = (data.documents && Array.isArray(data.documents)) ? data.documents.find(doc => doc.categoryId == DOCUMENT_IDS.GST) : null;
            // Helper function to find policy type name by ID
            const getPolicyTypeName = (policyTypeId) => {
                if (!policyTypes || !policyTypeId) return '';
                const policyType = policyTypes.find(pt => pt.policy_type_id === policyTypeId);
                return policyType ? policyType.policy_type_name : '';
            };

            // Helper function to find policy plan name by ID
            const getPolicyPlanName = (policyPlanId) => {
                if (!policyPlans || !policyPlanId) return '';
                const policyPlan = policyPlans.find(pp => pp.policy_plan_id === policyPlanId);
                return policyPlan ? policyPlan.policy_name : '';
            };

            // Enhanced mapping with better fallbacks
            const getPolicyTypeFromRunningPolicy = () => {
                // This should map to the PolicyType dropdown (FULL/NORMAL/THIRD PARTY)
                if (data.runningPolicy?.policy_type_id) {
                    return getPolicyTypeName(data.runningPolicy.policy_type_id);
                }
                // Try to infer from other fields
                if (data.runningPolicy?.PolicyType) return data.runningPolicy.PolicyType;
                if (data.policy_plan_type) return data.policy_plan_type;
                return '';
            };

            const getPolicyPlanFromRunningPolicy = () => {
                if (data.runningPolicy?.policy_plan_id) {
                    return getPolicyPlanName(data.runningPolicy.policy_plan_id);
                }
                // Try to infer from other fields
                if (data.runningPolicy?.PolicyPlanType) return data.runningPolicy.PolicyPlanType;
                if (data.policy_plan_type) return data.policy_plan_type;
                return '';
            };

            const getPolicyRadioFromData = () => {
                // Try multiple sources for policy type
                if (data.vehicle_policy_type && data.vehicle_policy_type !== '') return data.vehicle_policy_type;
                if (data.policyRadio && data.policyRadio !== '') return data.policyRadio;
                if (data.runningPolicy?.PolicyType) return data.runningPolicy.PolicyType;
                // Default to Fresh if no data
                return 'Fresh';
            };

            const getTypeFromData = () => {
                // Try multiple sources for nominee type
                if (data.nominee_type && data.nominee_type !== null && data.nominee_type !== '') return data.nominee_type;
                if (data.Type && data.Type !== '') return data.Type;
                if (data.runningPolicy?.NomineeName) return 'Individual'; // If nominee exists, likely individual
                return 'Individual'; // Default to Individual
            };

            const initialFormData = {
                ...defaultFormData,
                ...data,
                // Map backend fields to frontend form fields with enhanced fallbacks
                policyRadio: getPolicyRadioFromData(),
                Type: getTypeFromData(),
                PolicyType: getPolicyTypeFromRunningPolicy(),
                PolicyPlanType: getPolicyPlanFromRunningPolicy(),
                // Document file names
                AadharFileName: aadharDoc ? aadharDoc.file : '',
                PanFileName: panDoc ? panDoc.file : '',
                GstFileName: gstDoc ? gstDoc.file : '',
                RunningPolicyFileName: (data.runningPolicy && data.runningPolicy.CurrentPolicyFile) ? data.runningPolicy.CurrentPolicyFile : '',
            };

            console.log('🔧 [EditVehiclePopup] Initial form data:', initialFormData);
            console.log('🔧 [EditVehiclePopup] About to call setFormData with:', initialFormData);
            setFormData(initialFormData);
            console.log('🔧 [EditVehiclePopup] setFormData called');
            
            // Debug: Log the key fields that should be populated
            console.log('🔧 [EditVehiclePopup] Key fields check:', {
                Name: initialFormData.Name,
                Email: initialFormData.Email,
                MobileNumber: initialFormData.MobileNumber,
                VehicleNumber: initialFormData.VehicleNumber,
                Make: initialFormData.Make,
                Model: initialFormData.Model,
                EngineNumber: initialFormData.EngineNumber,
                ChassisNumber: initialFormData.ChassisNumber,
                policyRadio: initialFormData.policyRadio,
                Type: initialFormData.Type,
                PolicyType: initialFormData.PolicyType,
                PolicyPlanType: initialFormData.PolicyPlanType,
                PolicyNumber: initialFormData.PolicyNumber,
                PolicyIssuedDate: initialFormData.PolicyIssuedDate,
                From: initialFormData.From,
                To: initialFormData.To,
                PremiumAmount: initialFormData.PremiumAmount,
                NCB: initialFormData.NCB,
                IDV: initialFormData.IDV,
                PolicyTenure: initialFormData.PolicyTenure,
                NomineeName: initialFormData.NomineeName,
                NomineeRelation: initialFormData.NomineeRelation,
                NomineeDob: initialFormData.NomineeDob,
                NomineeAge: initialFormData.NomineeAge,
                AgentName: initialFormData.AgentName,
                AgentContactNumber: initialFormData.AgentContactNumber,
                AgentCode: initialFormData.AgentCode
            });
            
            // Debug: Check if PremiumAmount is 0 and not being displayed
            console.log('🔧 [EditVehiclePopup] PremiumAmount debug:', {
                'PremiumAmount value': initialFormData.PremiumAmount,
                'PremiumAmount type': typeof initialFormData.PremiumAmount,
                'PremiumAmount === 0': initialFormData.PremiumAmount === 0,
                'PremiumAmount === "0"': initialFormData.PremiumAmount === "0",
                'PremiumAmount || ""': initialFormData.PremiumAmount || ""
            });
            
            // Debug: Check form field values after setFormData
            console.log('🔧 [EditVehiclePopup] Form field values after setFormData:', {
                'formData.PremiumAmount': formData.PremiumAmount,
                'formData.AgentName': formData.AgentName,
                'formData.AgentContactNumber': formData.AgentContactNumber,
                'formData.AgentCode': formData.AgentCode
            });
            
            // Debug: Check if the form is actually rendering with the data
            console.log('🔧 [EditVehiclePopup] Form rendering check:', {
                'formData object': formData,
                'formData keys': Object.keys(formData),
                'PremiumAmount exists': 'PremiumAmount' in formData,
                'AgentName exists': 'AgentName' in formData,
                'AgentContactNumber exists': 'AgentContactNumber' in formData,
                'AgentCode exists': 'AgentCode' in formData
            });
            
            // Debug: Check current step and form rendering
            console.log('🔧 [EditVehiclePopup] Form rendering debug:', {
                'current step': step,
                'is step 4 (policy details)': step === 4,
                'is step 5 (agent details)': step === 5,
                'formData keys': Object.keys(formData),
                'AgentName in formData': 'AgentName' in formData,
                'AgentContactNumber in formData': 'AgentContactNumber' in formData,
                'AgentCode in formData': 'AgentCode' in formData,
                'PremiumAmount in formData': 'PremiumAmount' in formData,
                'PremiumAmount value': formData.PremiumAmount,
                'AgentName value': formData.AgentName,
                'AgentContactNumber value': formData.AgentContactNumber,
                'AgentCode value': formData.AgentCode
            });
        } else if (mode === 'add' && isOpen) {
            setFormData(defaultFormData);
        }
    }, [data, mode, isOpen, policyTypes, policyPlans]);

    useEffect(() => {
    // Debug: Log when popup opens
        if (data) {
            console.log('🔧 [EditVehiclePopup] All Policy Fields Data:', {
                vehicle_policy_type: data.vehicle_policy_type,  // Fresh/Renewal/Portability
                nominee_type: data.nominee_type,                // Individual/Corporate
                policy_plan_type: data.policy_plan_type,        // FULL/NORMAL/THIRD PARTY
                policyRadio: data.policyRadio,
                Type: data.Type,
                PolicyType: data.PolicyType,
                runningPolicy_policy_type_id: data.runningPolicy?.policy_type_id // Debug: Check if ID is present
            });
        }
    }, [data, formData, policyTypes, policyPlans]);

    // Update form data when policy types and plans are loaded
    useEffect(() => {
        if ((mode === 'edit' || mode === 'renewal') && data && isOpen && policyTypes.length > 0 && policyPlans.length > 0) {
            // Re-run the mapping logic when policy types and plans are available
            const getPolicyTypeName = (policyTypeId) => {
                if (!policyTypes || !policyTypeId) return '';
                const policyType = policyTypes.find(pt => pt.policy_type_id === policyTypeId);
                return policyType ? policyType.policy_type_name : '';
            };

            const getPolicyPlanName = (policyPlanId) => {
                if (!policyPlans || !policyPlanId) return '';
                const policyPlan = policyPlans.find(pp => pp.policy_plan_id === policyPlanId);
                return policyPlan ? policyPlan.policy_name : '';
            };

            const getPolicyTypeFromRunningPolicy = () => {
                // Get from running policy policy_type_id
                if (data.runningPolicy?.policy_type_id) {
                    return getPolicyTypeName(data.runningPolicy.policy_type_id);
                }
                // Fallback to other fields if available
                if (data.runningPolicy?.PolicyType) return data.runningPolicy.PolicyType;
                return '';
            };

            const getPolicyPlanFromRunningPolicy = () => {
                if (data.runningPolicy?.policy_plan_id) {
                    return getPolicyPlanName(data.runningPolicy.policy_plan_id);
                }
                if (data.runningPolicy?.PolicyPlanType) return data.runningPolicy.PolicyPlanType;
                if (data.policy_plan_type) return data.policy_plan_type;
                return '';
            };

            const getPolicyRadioFromData = () => {
                if (data.vehicle_policy_type && data.vehicle_policy_type !== '') return data.vehicle_policy_type;
                if (data.policyRadio && data.policyRadio !== '') return data.policyRadio;
                if (data.runningPolicy?.PolicyType) return data.runningPolicy.PolicyType;
                return 'Fresh';
            };

            const getTypeFromData = () => {
                if (data.nominee_type && data.nominee_type !== null && data.nominee_type !== '') return data.nominee_type;
                if (data.Type && data.Type !== '') return data.Type;
                if (data.runningPolicy?.NomineeName) return 'Individual';
                return 'Individual';
            };

            setFormData(prev => ({
                ...prev,
                policyRadio: getPolicyRadioFromData(),
                Type: getTypeFromData(),
                PolicyType: getPolicyTypeFromRunningPolicy(),
                PolicyPlanType: getPolicyPlanFromRunningPolicy(),
            }));

            console.log('🔧 [EditVehiclePopup] Updated All Policy Fields:', {
                policyRadio: getPolicyRadioFromData(),           // Fresh/Renewal/Portability
                Type: getTypeFromData(),                         // Individual/Corporate
                PolicyType: getPolicyTypeFromRunningPolicy(),   // FULL/NORMAL/THIRD PARTY
                runningPolicy_policy_type_id: data.runningPolicy?.policy_type_id // Debug: Check if ID is present
            });
        }
    }, [data, mode, isOpen, policyTypes, policyPlans]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'NomineeDob') {
            const calculatedAge = calculateAgeFromDOB(value);
            console.log('handleChange - Date changed:', value, 'Calculated age:', calculatedAge);
            setFormData(prev => ({
                ...prev,
                NomineeDob: value,
                NomineeAge: calculatedAge
            }));
        } else if (name.startsWith('Previous')) {
            // Handle previous policy fields
            const fieldName = name.replace('Previous', '');
            setFormData(prev => ({
                ...prev,
                previousPolicy: {
                    ...prev.previousPolicy,
                    [fieldName]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleDateChange = (e, fieldName) => {
        const { value } = e.target;
        
        // If the value is empty, allow it (user is clearing the field)
        if (!value) {
            if (fieldName.startsWith('Previous')) {
                const actualFieldName = fieldName.replace('Previous', '');
                setFormData(prev => ({
                    ...prev,
                    previousPolicy: {
                        ...prev.previousPolicy,
                        [actualFieldName]: ''
                    }
                }));
            } else {
            setFormData(prev => ({ ...prev, [fieldName]: '' }));
            }
            return;
        }
        
        // If it's a valid date format, store it directly
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            if (fieldName.startsWith('Previous')) {
                const actualFieldName = fieldName.replace('Previous', '');
                setFormData(prev => ({
                    ...prev,
                    previousPolicy: {
                        ...prev.previousPolicy,
                        [actualFieldName]: value
                    }
                }));
            } else {
            setFormData(prev => ({ ...prev, [fieldName]: value }));
            }
            return;
        }
        
        // If it's a partial date (like just year or year-month), store it as is
        if (/^\d{4}$/.test(value) || /^\d{4}-\d{2}$/.test(value)) {
            if (fieldName.startsWith('Previous')) {
                const actualFieldName = fieldName.replace('Previous', '');
                setFormData(prev => ({
                    ...prev,
                    previousPolicy: {
                        ...prev.previousPolicy,
                        [actualFieldName]: value
                    }
                }));
            } else {
            setFormData(prev => ({ ...prev, [fieldName]: value }));
            }
            return;
        }
        
        // Try to parse and format the date
        const date = new Date(value);
        if (!isNaN(date)) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;
            
            if (fieldName.startsWith('Previous')) {
                const actualFieldName = fieldName.replace('Previous', '');
                setFormData(prev => ({
                    ...prev,
                    previousPolicy: {
                        ...prev.previousPolicy,
                        [actualFieldName]: formattedDate
                    }
                }));
            } else {
            setFormData(prev => ({ ...prev, [fieldName]: formattedDate }));
            }
        } else {
            // If parsing fails, store the original value to prevent clearing
            if (fieldName.startsWith('Previous')) {
                const actualFieldName = fieldName.replace('Previous', '');
                setFormData(prev => ({
                    ...prev,
                    previousPolicy: {
                        ...prev.previousPolicy,
                        [actualFieldName]: value
                    }
                }));
            } else {
            setFormData(prev => ({ ...prev, [fieldName]: value }));
            }
        }
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (name === 'RunningPolicyPDF') {
            setRunningPolicyFileName(files[0] ? files[0].name : '');
        } else if (name === 'PreviousPolicyPDF') {
            setFormData(prev => ({
                ...prev,
                previousPolicy: {
                    ...prev.previousPolicy,
                    PdfFile: files[0] || null
                }
            }));
        } else {
        setDocumentFiles(prev => ({ ...prev, [name]: files[0] }));
        }
    };

    const handleNext = (e) => {
        if (e) e.preventDefault();
        if (step < 6) {
        setStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (step > 1) {
        setStep(prev => prev - 1);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Debug: Log the current form data
        console.log('🔧 [EditVehiclePopup] All Policy Fields at submit:', {
            policyRadio: formData.policyRadio,        // Fresh/Renewal/Portability
            Type: formData.Type,                      // Individual/Corporate
            PolicyType: formData.PolicyType           // FULL/NORMAL/THIRD PARTY
        });
        
        if (!formData.VehicleType || !formData.policyRadio || !formData.PolicyPlanType || !formData.NomineeRelation) {
            console.warn('[EditVehiclePopup] Missing required fields:', {
          VehicleType: formData.VehicleType,
          policyRadio: formData.policyRadio,
          PolicyPlanType: formData.PolicyPlanType,
          NomineeRelation: formData.NomineeRelation
        });
            toast.error('Please fill all required fields: Vehicle Type, Policy Type, Policy Plan Type, Nominee Relation.');
            return;
        }
        // Map VehicleType (name) to vehicle_id
        const selectedVehicle = vehicleTypes.find(v => v.vehicle_name === formData.VehicleType);
        const vehicle_id = selectedVehicle ? selectedVehicle.vehicle_id : null;
        // Map Reference (name) to reference_id
        const selectedReference = references.find(r => r.reference_name === formData.Reference);
        const reference_id = selectedReference ? selectedReference.reference_id : null;
        // Find the selected policy type and company objects by name
        const selectedPolicyType = policyTypes && formData.PolicyType
            ? policyTypes.find(type => type.policy_type_name === formData.PolicyType)
            : null;
        const selectedCompany = null; // Removed companies state, so this will be null
        // Find the selected policy plan object by name
        const selectedPolicyPlan = policyPlans && formData.PolicyPlanType
            ? policyPlans.find(plan => plan.policy_name === formData.PolicyPlanType)
            : null;
        // Construct runningPolicy object from form fields
        const runningPolicy = {
            PolicyNumber: formData.PolicyNumber || '',
            policy_type_id: selectedPolicyType ? selectedPolicyType.policy_type_id : null,
            policy_plan_id: selectedPolicyPlan ? selectedPolicyPlan.policy_plan_id : null, // Use ID, not string
            PolicyTenure: formData.PolicyTenure || '',
            PremiumAmount: formData.PremiumAmount || '',
            NomineeName: formData.NomineeName || '',
            NomineeRelation: formData.NomineeRelation || '',
            PolicyFrom: formData.From || '',
            PolicyTo: formData.To || '',
            PolicyIssuedDate: formData.PolicyIssuedDate || '',
            ExpiryDate: formData.To || '',
            NomineeDob: formData.NomineeDob || '',
            Vendor: formData.Vendor || '',
            IDV: formData.IDV || '',
            NCB: formData.NCB || '',
            NomineeAge: formData.NomineeAge || '',
            company_id: selectedCompany ? selectedCompany.company_id : null,
            isNomineeFlag: formData.isNomineeFlag || '',
        };
        // Only include CurrentPolicyFile if a file is selected
        if (formData.CurrentPolicyFile) {
            runningPolicy.CurrentPolicyFile = formData.CurrentPolicyFile;
        }
        // Log only the most important debug info
        console.log('[EditVehiclePopup] Selected PolicyType:', selectedPolicyType);
        console.log('[EditVehiclePopup] Selected Company:', selectedCompany);
        console.log('[EditVehiclePopup] RunningPolicy to send:', runningPolicy);
        // Build previous policy object
        const previousPolicy = {
            PolicyNumber: formData.previousPolicy?.PolicyNumber || '',
            CompanyName: formData.previousPolicy?.CompanyName || '',
            PolicyFrom: formData.previousPolicy?.PolicyFrom || '',
            PolicyTo: formData.previousPolicy?.PolicyTo || '',
            PolicyTenure: formData.previousPolicy?.PolicyTenure || '',
            PremiumAmount: formData.previousPolicy?.PremiumAmount || '',
            NomineeName: formData.previousPolicy?.NomineeName || '',
            NomineeRelation: formData.previousPolicy?.NomineeRelation || '',
            NomineeDob: formData.previousPolicy?.NomineeDob || '',
            NomineeAge: formData.previousPolicy?.NomineeAge || '',
            PdfFile: formData.previousPolicy?.PdfFile || null,
        };

        // Build payload with backend-expected snake_case keys only
        const payload = {
            Name: formData.Name || '',
            Email: formData.Email || '',
            MobileNumber: formData.MobileNumber || '',
            company_name: formData.CompanyName || '',
            contact_person_name: formData.ContactPersonName || '',
            contact_person_no: formData.ContactPersonMobileNumber || '',
            vehicle_number: formData.VehicleNumber || '',
            make: formData.Make || '',
            model: formData.Model || '',
            manufacturing_year: formData.ManufacturingYear || '',
            engine_number: formData.EngineNumber || '',
            chassis_number: formData.ChassisNumber || '',
            agent_name: formData.AgentName || '',
            agent_code: formData.AgentCode || '',
            agent_contact_number: formData.AgentContactNumber || '',
            status: formData.Status || 'interested',
            type: formData.Type || '', // Type radio (Individual/Corporate)
            vehicle_id: toNullIfEmpty(vehicle_id),
            reference_id: toNullIfEmpty(reference_id),
            remark: formData.Remark || '',
            runningPolicy: runningPolicy,
            previousPolicy: previousPolicy,
            vehicle_type: formData.VehicleType || '',
            vendor: formData.Vendor || '',
            policy_plan_type: formData.PolicyPlanType || '', // Policy Plan Type dropdown (COMPREHENSIVE/SAOD/THIRD PARTY)
            policy_type: formData.policyRadio || '', // Policy Type radio (Fresh/Renewal/Portability)
            type: formData.Type || '', // Type radio (Individual/Corporate)
            vehicle_user_id: formData.vehicle_user_id,
            consumer_role_id: formData.ConsumerRoleId || '',
            // Document files
            documentFiles: documentFiles,
            customDocuments: customDocuments,
        };
        console.log('[EditVehiclePopup] Submitting payload:', payload);
        console.log('[EditVehiclePopup] Form data being sent:', {
            policyRadio: formData.policyRadio,        // Fresh/Renewal/Portability
            Type: formData.Type,                      // Individual/Corporate
            PolicyType: formData.PolicyType,          // First dropdown (FULL/NORMAL/THIRD PARTY)
            PolicyPlanType: formData.PolicyPlanType   // Second dropdown (COMPREHENSIVE/SAOD/THIRD PARTY)
        });
        onSubmit(payload);
    };

    const handleAddDocument = (e) => {
        e.preventDefault();
        setShowCategoryInput(true);
    };

    const handleSaveCategory = () => {
        if (newCategoryName.trim() !== '') {
            setCustomDocuments([...customDocuments, { name: newCategoryName, file: null }]);
            setNewCategoryName('');
            setShowCategoryInput(false);
        }
    };

    const handleCustomFileChange = (e, idx) => {
        const file = e.target.files[0];
        setCustomDocuments(prev => prev.map((doc, i) => i === idx ? { ...doc, file } : doc));
    };

    const handleAddVehicle = (e) => {
        e.preventDefault();
        setShowVehicleInput(true);
    };

    const handleSaveVehicle = async () => {
        if (!newVehicleName.trim()) {
            toast.error("Vehicle type name cannot be empty.");
            return;
        }
        try {
            const response = await addVehicleDetails({ vehicle_name: newVehicleName });
            if (response && response.status) {
                toast.success("Vehicle type added successfully!");
            setShowVehicleInput(false);
                setNewVehicleName('');
                await fetchVehicleTypes(); // Refresh the list
            } else {
                toast.error(response.message || "Failed to add vehicle type.");
            }
        } catch (error) {
            toast.error("An error occurred while saving the vehicle type.");
            console.error(error);
        }
    };

    const handleSavePolicyPlan = async () => {
        if (!newPolicyPlanType.trim()) {
            toast.error("Policy plan name cannot be empty.");
            return;
        }
        try {
            const response = await addPolicyplanDetails({ policy_name: newPolicyPlanType });
            if (response.status) {
                toast.success("Policy plan added successfully!");
                setShowAddPolicyPlan(false);
                setNewPolicyPlanType('');
                await fetchPolicyPlans(); // Refresh the list
            } else {
                toast.error(response.message || "Failed to add policy plan.");
            }
        } catch (error) {
            toast.error("An error occurred while saving the policy plan.");
            console.error(error);
        }
    };

    const handleSaveCompanyName = () => {
        if (newCompanyName.trim() !== "") {
            setFormData(prev => ({ ...prev, CompanyName: newCompanyName }));
            setShowCompanyNameField(false);
            setNewCompanyName("");
        }
    };

    const handleCancelCompanyName = () => {
        setShowCompanyNameField(false);
        setNewCompanyName("");
    };

    const handleSaveReference = async () => {
        if (!newReference.trim()) {
            toast.error("Reference name cannot be empty.");
            return;
        }
        try {
            // Mocking API call
            // const response = await addReference({ reference_name: newReference });
            toast.success("Reference added successfully!");
            setShowReferenceInput(false);
            setNewReference('');
            await fetchReferences(); // Refresh the list
        } catch (error) {
            toast.error("An error occurred while saving the reference.");
            console.error(error);
        }
    };

    if (!data) return null;

    const popupTitle = mode === 'add' ? 'Add Vehicle' : 'Edit Vehicle';
    const submitButtonText = mode === 'add' ? 'Add' : 'Update';

    return (
        <div className="edit-popup-overlay">
            <div className="edit-popup-container" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="edit-popup-header">
                    <h2>{popupTitle}</h2>
                    <button onClick={onClose} className="edit-popup-close-btn">&times;</button>
                </div>
                <form className="edit-popup-body" onSubmit={handleSubmit}>
                    {step === 1 && (
                        <div className="form-step">
                            <h3 className="step-title">Consumer Details</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Name</label>
                                    <input type="text" name="Name" value={formData.Name || ''} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input type="email" name="Email" value={formData.Email || ''} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Mobile Number</label>
                                    <input type="text" name="MobileNumber" value={formData.MobileNumber || ''} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Contact Person Name</label>
                                    <input type="text" name="ContactPersonName" value={formData.ContactPersonName || ''} onChange={handleChange} />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Contact Person Mobile Number</label>
                                        <input type="text" name="ContactPersonMobileNumber" value={formData.ContactPersonMobileNumber || ''} onChange={handleChange} />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Type</label>
                                        <div className="radio-group">
                                            <label><input type="radio" name="Type" value="Individual" checked={formData.Type === 'Individual'} onChange={handleChange} /> <span>Individual</span></label>
                                            <label><input type="radio" name="Type" value="Corporate" checked={formData.Type === 'Corporate'} onChange={handleChange} /> <span>Corporate</span></label>
                                        </div>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Policy Type <span style={{color:'red'}}>*</span></label>
                                    <div className="radio-group">
                                        <label><input type="radio" name="policyRadio" value="Fresh" checked={formData.policyRadio === 'Fresh'} onChange={handleChange} required /> <span>Fresh</span></label>
                                        <label><input type="radio" name="policyRadio" value="Renewal" checked={formData.policyRadio === 'Renewal'} onChange={handleChange} required /> <span>Renewal</span></label>
                                        <label><input type="radio" name="policyRadio" value="Portability" checked={formData.policyRadio === 'Portability'} onChange={handleChange} required /> <span>Portability</span></label>
                                    </div>
                                </div>
                            </div>
                            <div className="popup-footer">
                                <button type="button" className="btn-next" onClick={handleNext}>Next</button>
                            </div>
                        </div>
                    )}
                    {step === 2 && (
                        <div className="form-step">
                            <h3 className="step-title">Documents</h3>
                            {console.log('🔍 [Step 2] Document filenames:', {
                                AadharFileName: formData.AadharFileName,
                                PanFileName: formData.PanFileName,
                                GstFileName: formData.GstFileName
                            })}
                            <div className="documents-row" style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <div className="form-group full-width">
                                        <label><b>Upload AADHAR CARD PDF</b></label>
                                        <input type="file" name="aadhar" accept="application/pdf" onChange={handleFileChange} />
                                        {formData.AadharFileName && (
                                            <div style={{ 
                                                marginTop: '8px', 
                                                padding: '8px',
                                                backgroundColor: '#f0f7ff',
                                                borderRadius: '4px',
                                                border: '1px solid #d0e7ff'
                                            }}>
                                                <div style={{ 
                                                    fontSize: "0.85em", 
                                                    color: "#388e3c",
                                                    marginBottom: '6px'
                                                }}>
                                                    ✓ Stored: {formData.AadharFileName}
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDownloadDocument(formData.AadharFileName)}
                                                        style={{
                                                            padding: '4px 10px',
                                                            backgroundColor: '#1976d2',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.8em',
                                                            fontWeight: '500',
                                                            transition: 'background-color 0.2s'
                                                        }}
                                                        onMouseOver={(e) => e.target.style.backgroundColor = '#1565c0'}
                                                        onMouseOut={(e) => e.target.style.backgroundColor = '#1976d2'}
                                                    >
                                                        📥 Download
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveDocument(1, formData.AadharFileName)}
                                                        style={{
                                                            padding: '4px 10px',
                                                            backgroundColor: '#d32f2f',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.8em',
                                                            fontWeight: '500',
                                                            transition: 'background-color 0.2s'
                                                        }}
                                                        onMouseOver={(e) => e.target.style.backgroundColor = '#c62828'}
                                                        onMouseOut={(e) => e.target.style.backgroundColor = '#d32f2f'}
                                                    >
                                                        🗑️ Remove
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="form-group full-width">
                                        <label><b>Upload PAN CARD PDF</b></label>
                                        <input type="file" name="pan" accept="application/pdf" onChange={handleFileChange} />
                                        {formData.PanFileName && (
                                            <div style={{ 
                                                marginTop: '8px', 
                                                padding: '8px',
                                                backgroundColor: '#f0f7ff',
                                                borderRadius: '4px',
                                                border: '1px solid #d0e7ff'
                                            }}>
                                                <div style={{ 
                                                    fontSize: "0.85em", 
                                                    color: "#388e3c",
                                                    marginBottom: '6px'
                                                }}>
                                                    ✓ Stored: {formData.PanFileName}
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDownloadDocument(formData.PanFileName)}
                                                        style={{
                                                            padding: '4px 10px',
                                                            backgroundColor: '#1976d2',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.8em',
                                                            fontWeight: '500',
                                                            transition: 'background-color 0.2s'
                                                        }}
                                                        onMouseOver={(e) => e.target.style.backgroundColor = '#1565c0'}
                                                        onMouseOut={(e) => e.target.style.backgroundColor = '#1976d2'}
                                                    >
                                                        📥 Download
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveDocument(2, formData.PanFileName)}
                                                        style={{
                                                            padding: '4px 10px',
                                                            backgroundColor: '#d32f2f',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.8em',
                                                            fontWeight: '500',
                                                            transition: 'background-color 0.2s'
                                                        }}
                                                        onMouseOver={(e) => e.target.style.backgroundColor = '#c62828'}
                                                        onMouseOut={(e) => e.target.style.backgroundColor = '#d32f2f'}
                                                    >
                                                        🗑️ Remove
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="form-group full-width">
                                        <label><b>Upload GST PDF</b></label>
                                        <input type="file" name="gst" accept="application/pdf" onChange={handleFileChange} />
                                        {formData.GstFileName && (
                                            <div style={{ 
                                                marginTop: '8px', 
                                                padding: '8px',
                                                backgroundColor: '#f0f7ff',
                                                borderRadius: '4px',
                                                border: '1px solid #d0e7ff'
                                            }}>
                                                <div style={{ 
                                                    fontSize: "0.85em", 
                                                    color: "#388e3c",
                                                    marginBottom: '6px'
                                                }}>
                                                    ✓ Stored: {formData.GstFileName}
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDownloadDocument(formData.GstFileName)}
                                                        style={{
                                                            padding: '4px 10px',
                                                            backgroundColor: '#1976d2',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.8em',
                                                            fontWeight: '500',
                                                            transition: 'background-color 0.2s'
                                                        }}
                                                        onMouseOver={(e) => e.target.style.backgroundColor = '#1565c0'}
                                                        onMouseOut={(e) => e.target.style.backgroundColor = '#1976d2'}
                                                    >
                                                        📥 Download
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveDocument(3, formData.GstFileName)}
                                                        style={{
                                                            padding: '4px 10px',
                                                            backgroundColor: '#d32f2f',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.8em',
                                                            fontWeight: '500',
                                                            transition: 'background-color 0.2s'
                                                        }}
                                                        onMouseOver={(e) => e.target.style.backgroundColor = '#c62828'}
                                                        onMouseOut={(e) => e.target.style.backgroundColor = '#d32f2f'}
                                                    >
                                                        🗑️ Remove
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {customDocuments.map((doc, idx) => {
                                        // Check if there's an existing document for this category
                                        const existingDoc = data?.documents?.find(d => d.document_name === doc.name || d.categoryId === doc.category_id);
                                        const hasExistingDoc = existingDoc && existingDoc.file;
                                        
                                        return (
                                        <div className="form-group full-width" key={idx}>
                                            <label><b>Upload {doc.name} PDF</b></label>
                                            <input type="file" accept="application/pdf" onChange={e => handleCustomFileChange(e, idx)} />
                                                {hasExistingDoc && (
                                                    <div style={{ 
                                                        marginTop: '8px', 
                                                        padding: '8px',
                                                        backgroundColor: '#f0f7ff',
                                                        borderRadius: '4px',
                                                        border: '1px solid #d0e7ff'
                                                    }}>
                                                        <div style={{ 
                                                            fontSize: "0.85em", 
                                                            color: "#388e3c",
                                                            marginBottom: '6px'
                                                        }}>
                                                            ✓ Stored: {existingDoc.file}
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDownloadDocument(existingDoc.file)}
                                                                style={{
                                                                    padding: '4px 10px',
                                                                    backgroundColor: '#1976d2',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '0.8em',
                                                                    fontWeight: '500',
                                                                    transition: 'background-color 0.2s'
                                                                }}
                                                                onMouseOver={(e) => e.target.style.backgroundColor = '#1565c0'}
                                                                onMouseOut={(e) => e.target.style.backgroundColor = '#1976d2'}
                                                            >
                                                                📥 Download
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (window.confirm('Are you sure you want to remove this document?')) {
                                                                        setDocumentsToRemove(prev => [...prev, { categoryId: existingDoc.categoryId, fileName: existingDoc.file }]);
                                                                        setCustomDocuments(prev => prev.filter((_, i) => i !== idx));
                                                                        toast.success('Document marked for removal');
                                                                    }
                                                                }}
                                                                style={{
                                                                    padding: '4px 10px',
                                                                    backgroundColor: '#d32f2f',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '0.8em',
                                                                    fontWeight: '500',
                                                                    transition: 'background-color 0.2s'
                                                                }}
                                                                onMouseOver={(e) => e.target.style.backgroundColor = '#c62828'}
                                                                onMouseOut={(e) => e.target.style.backgroundColor = '#d32f2f'}
                                                            >
                                                                🗑️ Remove
                                                            </button>
                                                        </div>
                                                    </div>
                                            )}
                                        </div>
                                        );
                                    })}
                                    {!showCategoryInput && (
                                        <div className="button-group d-flex justify-content-between" style={{ width: '100%', marginTop: '8px' }}>
                                            <button type="button" className="btn-next" onClick={handleAddDocument}>Add Document</button>
                                        </div>
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    {showCategoryInput && (
                                        <div className="form-group full-width" style={{ marginTop: 0 }}>
                                            <label><b>Category Name</b></label>
                                            <input
                                                type="text"
                                                value={newCategoryName}
                                                onChange={e => setNewCategoryName(e.target.value)}
                                                placeholder="Enter new category name"
                                            />
                                            <div className="button-group d-flex justify-content-between" style={{ marginTop: '16px' }}>
                                                <button type="button" className="btn btn-blue" onClick={handleSaveCategory}>Save</button>
                                                <button type="button" className="btn btn-blue" onClick={() => { setShowCategoryInput(false); setNewCategoryName(''); }}>Close</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="button-group d-flex justify-content-between" style={{ width: '100%', marginTop: '32px' }}>
                                <button type="button" className="btn btn-blue" onClick={handleBack}>Back</button>
                                <button type="button" className="btn btn-blue" onClick={handleNext}>Next</button>
                            </div>
                        </div>
                    )}
                    {step === 3 && (
                        <div className="form-step">
                            <h3 className="step-title" style={{ color: '#1976d2' }}>Vehicle Details</h3>
                            {!showVehicleInput ? (
                                <div style={{ width: '50%', paddingRight: '16px', marginBottom: 24 }}>
                                    <div className="form-group">
                                        <label style={{ fontWeight: 'bold' }}>Vehicle</label>
                                        <Select
                                            options={vehicleTypes.map((vehicle) => ({
                                                value: vehicle.vehicle_name,
                                                label: vehicle.vehicle_name
                                            }))}
                                            value={formData.VehicleType ? { value: formData.VehicleType, label: formData.VehicleType } : null}
                                            onChange={(option) => handleChange({ target: { name: 'VehicleType', value: option ? option.value : '' } })}
                                            placeholder="Select Vehicle Type"
                                            isClearable
                                        />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                                        <button type="button" className="btn-next" onClick={handleAddVehicle}>Add Vehicle</button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ width: '100%', display: 'flex', gap: '32px', marginBottom: 24 }}>
                                    <div style={{ flex: 1 }}>
                                        <div className="form-group">
                                            <label style={{ fontWeight: 'bold' }}>Vehicle</label>
                                            <Select
                                                options={vehicleTypes.map((vehicle) => ({
                                                    value: vehicle.vehicle_name,
                                                    label: vehicle.vehicle_name
                                                }))}
                                                value={formData.VehicleType ? { value: formData.VehicleType, label: formData.VehicleType } : null}
                                                onChange={(option) => handleChange({ target: { name: 'VehicleType', value: option ? option.value : '' } })}
                                                placeholder="Select Vehicle Type"
                                                isClearable
                                            />
                                        </div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div className="form-group">
                                            <label style={{ fontWeight: 'bold' }}>Vehicle Name</label>
                                            <input
                                                type="text"
                                                value={newVehicleName}
                                                onChange={e => setNewVehicleName(e.target.value)}
                                                placeholder="New Vehicle Name"
                                                className="form-control"
                                            />
                                        </div>
                                        <div className="button-group d-flex justify-content-center" style={{ width: '100%', marginTop: 24, gap: '32px' }}>
                                            <button type="button" className="btn btn-blue" onClick={handleSaveVehicle}>Save</button>
                                            <button type="button" className="btn btn-blue" onClick={() => { setShowVehicleInput(false); setNewVehicleName(''); }}>Close</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="form-grid" style={{ marginTop: '24px' }}>
                                <div className="form-group">
                                    <label>Vehicle Number</label>
                                    <input type="text" name="VehicleNumber" value={formData.VehicleNumber || ''} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Make</label>
                                    <input type="text" name="Make" value={formData.Make || ''} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Model</label>
                                    <input type="text" name="Model" value={formData.Model || ''} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Manufacturing Year</label>
                                    <input type="text" name="ManufacturingYear" value={formData.ManufacturingYear || ''} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Engine Number</label>
                                    <input type="text" name="EngineNumber" value={formData.EngineNumber || ''} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Chassis Number</label>
                                    <input type="text" name="ChassisNumber" value={formData.ChassisNumber || ''} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="button-group d-flex justify-content-between" style={{ width: '100%', marginTop: '32px' }}>
                                <button type="button" className="btn btn-blue" onClick={handleBack}>Back</button>
                                <button type="button" className="btn btn-blue" onClick={handleNext}>Next</button>
                            </div>
                        </div>
                    )}
                    {step === 4 && (
                        <div className="form-step">
                            <h3
                                style={{
                                    color: "#0288d1",
                                    fontWeight: 700,
                                    marginTop: 24,
                                    marginBottom: 24,
                                    fontSize: "1.4rem",
                                }}
                            >
                                Running Policy Details
                            </h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Policy Number</label>
                                    <input type="text" className="form-control" name="PolicyNumber" value={formData.PolicyNumber || ""} onChange={handleChange} />
                                </div>

                                <div className="form-group">
                                    <label>Policy Type</label>
                                    <Select
                                        options={policyTypes.map((policyType) => ({
                                            value: policyType.policy_type_name,
                                            label: policyType.policy_type_name
                                        }))}
                                        value={formData.PolicyType ? { value: formData.PolicyType, label: formData.PolicyType } : null}
                                        onChange={(option) => handleChange({ target: { name: 'PolicyType', value: option ? option.value : '' } })}
                                        placeholder="Select Policy Type"
                                        isClearable
                                    />
                                    {!showPolicyPlanFields && (
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                                            <button
                                                type="button"
                                                className="btn btn-blue"
                                                onClick={() => setShowPolicyPlanFields(true)}
                                            >
                                                Add Policy Plan
                                            </button>
                                        </div>
                                    )}
                                    {showPolicyPlanFields && (
                                        <div className="add-new-container" style={{ marginTop: 10 }}>
                                            <div className="form-group">
                                                <label>New Policy Plan</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Enter Plan Name"
                                                    value={newPlanName}
                                                    onChange={e => setNewPlanName(e.target.value)}
                                                />
                                            </div>
                                            <div className="add-new-actions">
                                                <button
                                                    type="button"
                                                    className="btn btn-blue"
                                                    onClick={async () => {
                                                        if (!newPlanName.trim()) {
                                                            toast.error("Policy plan name cannot be empty.");
                                                            return;
                                                        }
                                                        await addPolicyplanDetails({ policy_name: newPlanName });
                                                        toast.success("Policy plan added successfully!");
                                                        setShowPolicyPlanFields(false);
                                                        setNewPlanName('');
                                                        await fetchPolicyPlans();
                                                    }}
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-blue"
                                                    onClick={() => {
                                                        setNewPlanName('');
                                                        setShowPolicyPlanFields(false);
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>Company Name</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <Select
                                                    options={companyTypes.map((company) => ({
                                                        value: company.company_name,
                                                        label: company.company_name
                                                    }))}
                                                    value={
                                                        formData.CompanyName
                                                            ? { value: formData.CompanyName, label: formData.CompanyName }
                                                            : null
                                                    }
                                                    onChange={selected =>
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            CompanyName: selected ? selected.value : ''
                                                        }))
                                                    }
                                            placeholder="Select Company Name"
                                                    isClearable
                                            style={{ flex: 1 }}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-blue"
                                            style={{ whiteSpace: 'nowrap' }}
                                            onClick={() => setShowCompanyNameField(true)}
                                        >
                                            Add Company
                                        </button>
                                    </div>
                                    {showCompanyNameField && (
                                        <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        className="form-control"
                                                    placeholder="New Company Name"
                                                    value={newCompanyName}
                                                    onChange={(e) => setNewCompanyName(e.target.value)}
                                                    style={{ flex: 1 }}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn btn-blue"
                                                    onClick={async () => {
                                                        if (!newCompanyName.trim()) {
                                                            toast.error("Company name cannot be empty.");
                                                            return;
                                                        }
                                                        try {
                                                            const response = await addCompanyType({ company_name: newCompanyName });
                                                            if (response && response.status) {
                                                                await fetchCompanyTypes();
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    CompanyName: newCompanyName
                                                                }));
                                                                setNewCompanyName("");
                                                                setShowCompanyNameField(false);
                                                                toast.success("Company added successfully!");
                                                            } else {
                                                                toast.error("Failed to add company. Please try again.");
                                                            }
                                                        } catch (error) {
                                                            console.error('Error adding company:', error);
                                                            toast.error("Failed to add company. Please try again.");
                                                        }
                                                    }}
                                                    style={{ minWidth: 70 }}
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-blue"
                                                    onClick={() => {
                                                        setNewCompanyName("");
                                                        setShowCompanyNameField(false);
                                                    }}
                                                    style={{ minWidth: 70 }}
                                                >
                                                    Close
                                                </button>
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>Policy Tenure</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        name="PolicyTenure"
                                        value={formData.PolicyTenure || data.runningPolicy?.PolicyTenure || ""}
                                        onChange={handleChange}
                                        min={1}
                                        max={10}
                                        step={1}
                                    />
                                </div>
                            </div>

                            <div className="form-grid" style={{ marginTop: '24px' }}>
                                <div className="form-group">
                                    <label>Premium Amount</label>
                                    <input type="text" className="form-control" name="PremiumAmount" value={formData.PremiumAmount || ""} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>From</label>
                                    <input
                                        type="date"
                                        name="From"
                                        className="form-control"
                                        value={formData.From || ""}
                                        onChange={e => handleDateChange(e, 'From')}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>To</label>
                                    <input
                                        type="date"
                                        name="To"
                                        className="form-control"
                                        value={formData.To || ""}
                                        onChange={e => handleDateChange(e, 'To')}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>NCB</label>
                                    <input type="text" className="form-control" name="NCB" value={formData.NCB || ""} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>IDV</label>
                                    <input type="text" className="form-control" name="IDV" value={formData.IDV || ""} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Policy Issued Date</label>
                                    <input
                                        type="date"
                                        name="PolicyIssuedDate"
                                        className="form-control"
                                        value={formData.PolicyIssuedDate || ""}
                                        onChange={e => handleDateChange(e, 'PolicyIssuedDate')}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Policy Expiry Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        name="PolicyExpiryDate"
                                        value={formData.To || ""}
                                        readOnly
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Policy Plan Type</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                                        {!showAddPolicyPlan ? (
                                            <>
                                                <Select
                                                    className="react-select-container"
                                                    classNamePrefix="react-select"
                                        name="PolicyPlanType"
                                                    options={policyPlans.map((plan) => ({
                                                        value: plan.policy_name,
                                                        label: plan.policy_name
                                                    }))}
                                                    value={
                                                        formData.PolicyPlanType
                                                            ? { value: formData.PolicyPlanType, label: formData.PolicyPlanType }
                                                            : null
                                                    }
                                                    onChange={selected =>
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            PolicyPlanType: selected ? selected.value : ''
                                                        }))
                                                    }
                                                    isClearable
                                                    isSearchable
                                        placeholder="Select or type Policy Plan Type"
                                                    styles={{ container: base => ({ ...base, flex: 1 }) }}
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="New Policy Plan"
                                                    value={newPolicyPlanType}
                                                    onChange={(e) => setNewPolicyPlanType(e.target.value)}
                                                    style={{ flex: 1 }}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn btn-blue"
                                                    onClick={handleSavePolicyPlan}
                                                    style={{ minWidth: 70 }}
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-blue"
                                                    onClick={() => {
                                                        setShowAddPolicyPlan(false);
                                                        setNewPolicyPlanType('');
                                                    }}
                                                    style={{ minWidth: 70 }}
                                                >
                                                    Close
                                                </button>
                                            </>
                                        )}
                                        {!showAddPolicyPlan && (
                                            <button
                                                type="button"
                                                className="btn btn-blue"
                                                style={{ whiteSpace: 'nowrap' }}
                                                onClick={() => setShowAddPolicyPlan(true)}
                                            >
                                                Add Policy Plan
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Vendor</label>
                                    <input type="text" className="form-control" name="Vendor" value={formData.Vendor || ""} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Nominee Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="NomineeName"
                                        value={formData.NomineeName || ""}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Nominee Relation</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="NomineeRelation"
                                        value={formData.NomineeRelation || ""}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Nominee DOB</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        name="NomineeDob"
                                        value={formData.NomineeDob || ""}
                                        onChange={e => {
                                            const { value } = e.target;
                                            const calculatedAge = calculateAgeFromDOB(value);
                                            console.log('Date changed:', value, 'Calculated age:', calculatedAge);
                                            setFormData(prev => ({
                                                ...prev,
                                                NomineeDob: value,
                                                NomineeAge: calculatedAge
                                            }));
                                        }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Nominee Age</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="NomineeAge"
                                        value={formData.NomineeAge || ""}
                                        readOnly
                                        placeholder="Auto-calculated"
                                        style={{backgroundColor: '#f8f9fa', color: '#6c757d'}}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Upload Running Policy PDF</label>
                                    <input type="file" className="form-control" name="RunningPolicyPDF" accept="application/pdf" onChange={handleFileChange} />
                                    {formData.RunningPolicyFileName && (
                                        <span style={{ fontSize: "0.9em", color: "#388e3c", marginTop: 4, display: "block" }}>
                                            Document already stored
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="button-group d-flex justify-content-between" style={{ width: "100%", marginTop: "32px" }}>
                                <button type="button" className="btn btn-blue" onClick={handleBack}>Back</button>
                                <button type="button" className="btn btn-blue" onClick={handleNext}>Next</button>
                            </div>
                        </div>
                    )}
                    {step === 5 && (
                        <div className="form-step">
                            <h3 className="step-title">Previous Policy Details</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Previous Policy Number</label>
                                    <input type="text" name="PreviousPolicyNumber" value={formData.previousPolicy?.PreviousPolicyNumber || ''} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Previous Company Name</label>
                                    <input type="text" name="PreviousCompanyName" value={formData.previousPolicy?.CompanyName || ''} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Previous Policy From</label>
                                    <input
                                        type="date"
                                        name="PreviousPolicyFrom"
                                        value={formData.previousPolicy?.PolicyFrom || ''}
                                        onChange={e => handleDateChange(e, 'PreviousPolicyFrom')}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Previous Policy To</label>
                                    <input
                                        type="date"
                                        name="PreviousPolicyTo"
                                        value={formData.previousPolicy?.PolicyTo || ''}
                                        onChange={e => handleDateChange(e, 'PreviousPolicyTo')}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Previous Policy Tenure</label>
                                    <input type="number" name="PreviousPolicyTenure" value={formData.previousPolicy?.PolicyTenure || ''} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Previous Premium Amount</label>
                                    <input type="text" name="PreviousPremiumAmount" value={formData.previousPolicy?.PremiumAmount || ''} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Previous Nominee Name</label>
                                    <input type="text" name="PreviousNomineeName" value={formData.previousPolicy?.NomineeName || ''} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Previous Nominee Relation</label>
                                    <input type="text" name="PreviousNomineeRelation" value={formData.previousPolicy?.NomineeRelation || ''} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Previous Nominee DOB</label>
                                    <input
                                        type="date"
                                        name="PreviousNomineeDob"
                                        value={formData.previousPolicy?.NomineeDob || ''}
                                        onChange={e => handleDateChange(e, 'PreviousNomineeDob')}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Previous Nominee Age</label>
                                    <input
                                        type="text"
                                        name="PreviousNomineeAge"
                                        value={formData.previousPolicy?.NomineeAge || ''}
                                        readOnly
                                        placeholder="Auto-calculated"
                                        style={{backgroundColor: '#f8f9fa', color: '#6c757d'}}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Upload Previous Policy PDF</label>
                                    <input type="file" name="PreviousPolicyPDF" accept="application/pdf" onChange={handleFileChange} />
                                    {formData.previousPolicy?.PdfFile && (
                                        <span style={{ fontSize: "0.9em", color: "#388e3c", marginTop: 4, display: "block" }}>
                                            Document already stored
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="button-group d-flex justify-content-between" style={{ width: "100%", marginTop: "32px" }}>
                                <button type="button" className="btn btn-blue" onClick={handleBack}>Back</button>
                                <button type="button" className="btn btn-blue" onClick={handleNext}>Next</button>
                            </div>
                        </div>
                    )}
                    {step === 6 && (
                        <div className="form-step">
                            <h3 className="step-title">Agent Details</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Agent Name</label>
                                    <input type="text" name="AgentName" value={formData.AgentName || ''} className="form-control" onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Agent Contact Number</label>
                                    <input type="text" name="AgentContactNumber" value={formData.AgentContactNumber || ''} className="form-control" onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Agent Code</label>
                                    <input type="text" name="AgentCode" value={formData.AgentCode || ''} className="form-control" onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Reference</label>
                                    <Select
                                        options={references.map(ref => ({
                                            value: ref.reference_name,
                                            label: ref.reference_name
                                        }))}
                                        value={formData.Reference ? { value: formData.Reference, label: formData.Reference } : null}
                                        onChange={(option) => handleChange({ target: { name: 'Reference', value: option ? option.value : '' } })}
                                        placeholder="Select a reference"
                                        isClearable
                                        isDisabled={showReferenceInput}
                                    />
                                    <div style={{ textAlign: 'right', marginTop: '10px' }}>
                                        {!showReferenceInput && (
                                            <button type="button" className="btn-blue" onClick={() => setShowReferenceInput(true)}>Add Reference</button>
                                        )}
                                    </div>
                                    {showReferenceInput && (
                                        <div className="add-new-container" style={{ marginTop: '10px' }}>
                                            <div className="form-group">
                                                <label>New Reference</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="New Reference"
                                                    value={newReference}
                                                    onChange={(e) => setNewReference(e.target.value)}
                                                />
                                            </div>
                                            <div className="add-new-actions">
                                                <button type="button" className="btn btn-blue" onClick={handleSaveReference}>Save</button>
                                                <button type="button" className="btn btn-blue" onClick={() => setShowReferenceInput(false)}>Close</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="button-group d-flex justify-content-between" style={{ width: "100%", marginTop: "32px" }}>
                                <button type="button" className="btn btn-blue" onClick={handleBack}>Back</button>
                                <button type="submit" className="btn btn-blue">{submitButtonText}</button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default EditVehiclePopup; 