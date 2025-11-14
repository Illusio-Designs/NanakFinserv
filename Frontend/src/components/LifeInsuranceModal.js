import React, { useEffect, useState } from 'react';
import Modal from './common/Modal';
import Button from './common/Button';
import Input from './common/Input';
import Select from './common/Select';
import { createLifeInsurance, updateLifeInsurance, getLifeInsuranceDocuments } from '../serviceAPI/userAPI';
import { useToaster } from './Toaster';
import Cookies from 'js-cookie';
import config from '../config/apiConfig';

const LifeInsuranceModal = ({ isOpen, onClose, fetchApi, initialData, view, isEdit = false, isRenewal = false, onSubmit }) => {
  const addToast = useToaster();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Dynamic document management
  const [customDocuments, setCustomDocuments] = useState([]);
  const [showAddDocumentField, setShowAddDocumentField] = useState(false);
  const [newDocumentName, setNewDocumentName] = useState('');
  
  // Existing documents state
  const [existingDocuments, setExistingDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  
  // Same as proposer checkbox
  const [sameAsProposer, setSameAsProposer] = useState(false);
  
  // Same as mailing address checkboxes
  const [proposerSameAsMailing, setProposerSameAsMailing] = useState(false);
  const [lifeAssuredSameAsMailing, setLifeAssuredSameAsMailing] = useState(false);
  
  // Nominee checkboxes
  const [addNominee, setAddNominee] = useState(false);
  const [nomineeSameAsProposer, setNomineeSameAsProposer] = useState(false);
  
  // Individual consumption controls
  const [showTobaccoDetails, setShowTobaccoDetails] = useState(false);
  const [showAlcoholDetails, setShowAlcoholDetails] = useState(false);
  const [showNarcoticsDetails, setShowNarcoticsDetails] = useState(false);

  // Function to fetch existing documents
  const fetchExistingDocuments = async (lifeInsuranceId) => {
    if (!lifeInsuranceId) return;
    
    setDocumentsLoading(true);
    try {
      console.log('🔍 [DOCUMENTS] Fetching existing documents for ID:', lifeInsuranceId);
      const response = await getLifeInsuranceDocuments(lifeInsuranceId);
      if (response && response.status) {
        setExistingDocuments(response.data || []);
        console.log('🔍 [DOCUMENTS] Fetched existing documents:', response.data);
      }
    } catch (error) {
      console.error('❌ [DOCUMENTS] Error fetching existing documents:', error);
      addToast('Error fetching existing documents', 'error');
    } finally {
      setDocumentsLoading(false);
    }
  };

  // Function to get document status
  const getDocumentStatus = (documentName) => {
    console.log('🔍 [DOCUMENT STATUS] Looking for:', documentName);
    console.log('🔍 [DOCUMENT STATUS] Available documents:', existingDocuments.map(doc => doc.document_name));
    
    const existingDoc = existingDocuments.find(doc => 
      doc.document_name && doc.document_name.toLowerCase().includes(documentName.toLowerCase())
    );
    
    console.log('🔍 [DOCUMENT STATUS] Found document:', existingDoc);
    return existingDoc ? 'uploaded' : 'missing';
  };

  // Function to get document upload date
  const getDocumentUploadDate = (documentName) => {
    const existingDoc = existingDocuments.find(doc => 
      doc.document_name && doc.document_name.toLowerCase().includes(documentName.toLowerCase())
    );
    console.log('🔍 [UPLOAD DATE] Looking for:', documentName, 'Found:', existingDoc?.createdAt);
    return existingDoc ? existingDoc.createdAt : null;
  };

  // Function to copy proposer details to life assured
  const copyProposerToLifeAssured = () => {
    setFormState(prevState => ({
      ...prevState,
      formData: {
        ...prevState.formData,
        // Copy all proposer details to life assured
        life_assured_name: prevState.formData.proposer_name,
        life_assured_gender: prevState.formData.proposer_gender,
        life_assured_gender_custom: prevState.formData.proposer_gender_custom,
        life_assured_dob: prevState.formData.proposer_dob,
        life_assured_married_status: prevState.formData.proposer_married_status,
        life_assured_father_name: prevState.formData.proposer_father_name,
        life_assured_mother_name: prevState.formData.proposer_mother_name,
        life_assured_spouse_name: prevState.formData.proposer_spouse_name,
        life_assured_mobile_numbers: prevState.formData.proposer_mobile_numbers,
        life_assured_email: prevState.formData.proposer_email,
        life_assured_pan_number: prevState.formData.proposer_pan_number,
        life_assured_relationship_with_proposer: 'Self',
        life_assured_residential_status: prevState.formData.proposer_residential_status,
        life_assured_mailing_address: prevState.formData.proposer_mailing_address,
        life_assured_permanent_address: prevState.formData.proposer_permanent_address
      }
    }));
  };

  // Handle same as proposer checkbox change
  const handleSameAsProposerChange = (checked) => {
    setSameAsProposer(checked);
    if (checked) {
      copyProposerToLifeAssured();
    }
  };

  // Handle proposer same as mailing address checkbox
  const handleProposerSameAsMailingChange = (checked) => {
    setProposerSameAsMailing(checked);
    if (checked) {
      setFormState(prevState => ({
        ...prevState,
        formData: {
          ...prevState.formData,
          proposer_permanent_address: prevState.formData.proposer_mailing_address
        }
      }));
    }
  };

  // Handle life assured same as mailing address checkbox
  const handleLifeAssuredSameAsMailingChange = (checked) => {
    setLifeAssuredSameAsMailing(checked);
    if (checked) {
      setFormState(prevState => ({
        ...prevState,
        formData: {
          ...prevState.formData,
          life_assured_permanent_address: prevState.formData.life_assured_mailing_address
        }
      }));
    }
  };

  // Handle add nominee checkbox
  const handleAddNomineeChange = (checked) => {
    setAddNominee(checked);
    if (!checked) {
      // Clear nominee fields when unchecked
      setFormState(prevState => ({
        ...prevState,
        formData: {
          ...prevState.formData,
          nominee_name: '',
          nominee_mobile_numbers: '',
          nominee_email: '',
          nominee_gender: '',
          nominee_dob: '',
          nominee_relationship_with_life_assured: '',
          nominee_address: '',
          nominee_pan_number: ''
        }
      }));
      setNomineeSameAsProposer(false);
    }
  };

  // Handle nominee same as proposer checkbox
  const handleNomineeSameAsProposerChange = (checked) => {
    setNomineeSameAsProposer(checked);
    if (checked) {
      setFormState(prevState => ({
        ...prevState,
        formData: {
          ...prevState.formData,
          // Copy proposer details to nominee
          nominee_name: prevState.formData.proposer_name,
          nominee_mobile_numbers: prevState.formData.proposer_mobile_numbers,
          nominee_email: prevState.formData.proposer_email,
          nominee_gender: prevState.formData.proposer_gender,
          nominee_dob: prevState.formData.proposer_dob,
          nominee_relationship_with_life_assured: 'Self',
          nominee_address: prevState.formData.proposer_mailing_address,
          nominee_pan_number: prevState.formData.proposer_pan_number
        }
      }));
    }
  };

  // Handle tobacco consumption change
  const handleTobaccoConsumptionChange = (value) => {
    const stringValue = value ? 'Yes' : 'No';
    setShowTobaccoDetails(value);
    
    setFormState(prevState => ({
      ...prevState,
      formData: {
        ...prevState.formData,
        tobacco_consumption: stringValue,
        tobacco_quantity: value ? prevState.formData.tobacco_quantity : 0,
        tobacco_days: value ? prevState.formData.tobacco_days : 0
      }
    }));
  };

  // Handle alcohol consumption change
  const handleAlcoholConsumptionChange = (value) => {
    const stringValue = value ? 'Yes' : 'No';
    setShowAlcoholDetails(value);
    
    setFormState(prevState => ({
      ...prevState,
      formData: {
        ...prevState.formData,
        alcohol_consumption: stringValue,
        alcohol_quantity: value ? prevState.formData.alcohol_quantity : 0,
        alcohol_days: value ? prevState.formData.alcohol_days : 0
      }
    }));
  };

  // Handle narcotics consumption change
  const handleNarcoticsConsumptionChange = (value) => {
    const stringValue = value ? 'Yes' : 'No';
    setShowNarcoticsDetails(value);
    
    setFormState(prevState => ({
      ...prevState,
      formData: {
        ...prevState.formData,
        narcotics_consumption: stringValue,
        narcotics_quantity: value ? prevState.formData.narcotics_quantity : 0,
        narcotics_days: value ? prevState.formData.narcotics_days : 0
      }
    }));
  };

  const [formState, setFormState] = useState({
    formData: {
      // Agent Details
      agent_code: '',
      agent_name: '',
      channel: '',
      channel_code: '',
      
      // Proposer Details
      proposer_name: '',
      proposer_gender: '',
      proposer_gender_custom: '',
      proposer_dob: '',
      proposer_married_status: '',
      proposer_father_name: '',
      proposer_mother_name: '',
      proposer_spouse_name: '',
      proposer_mobile_numbers: '',
      proposer_email: '',
      proposer_nationality: 'Indian',
      proposer_relationship_with_life_assured: '',
      proposer_residential_status: '',
      proposer_pan_number: '',
      proposer_mailing_address: '',
      proposer_permanent_address: '',
      
      // Life Assured Details
      life_assured_name: '',
      life_assured_gender: '',
      life_assured_gender_custom: '',
      life_assured_dob: '',
      life_assured_married_status: '',
      life_assured_father_name: '',
      life_assured_mother_name: '',
      life_assured_spouse_name: '',
      life_assured_mobile_numbers: '',
      life_assured_email: '',
      life_assured_nationality: 'Indian',
      life_assured_relationship_with_proposer: '',
      life_assured_residential_status: '',
      life_assured_pan_number: '',
      life_assured_mailing_address: '',
      life_assured_permanent_address: '',
      life_assured_education: '',
      life_assured_occupation: '',
      life_assured_organization_name: '',
      life_assured_annual_income: '',
      
      // Nominee Details
      nominee_name: '',
      nominee_mobile_numbers: '',
      nominee_email: '',
      nominee_dob: '',
      nominee_pan_number: '',
      nominee_relationship_with_life_assured: '',
      nominee_gender: '',
      
      // Product Details
      product_name: '',
      premium_payment_term: '',
      sum_assured: '',
      policy_term: '',
      
      // Health Details
      height: '',
      weight: '',
      tobacco_consumption: 'No',
      tobacco_quantity: 0,
      tobacco_days: 0,
      alcohol_consumption: 'No',
      alcohol_quantity: 0,
      alcohol_days: 0,
      narcotics_consumption: 'No',
      narcotics_quantity: 0,
      narcotics_days: 0,
      health_remarks: '',
      
      // Bank Details
      account_type: '',
      bank_name: '',
      branch: '',
      account_number: '',
      micr_code: '',
      preferred_renewal_month: '',
      
      // Policy Details
      policy_number: '',
      rcd: '',
      premium_amount: '',
      premium_payment_mode: '',
      policy_remarks: '',
      policy_amount: '',
      date_of_maturity: '',
      due_date_of_premium: '',
      
      // Consumer reference
      user_consumer_id: '',
      
      // Document upload fields
      policy_document: null,
      identity_document: null,
      address_proof: null,
      medical_certificate: null
    },
    errors: {}
  });

  useEffect(() => {
    if (initialData) {
      // Helper function to format date for HTML date input
      const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
      };

      // Helper function to clean mobile number (single string)
      const cleanMobileNumber = (mobileValue) => {
        if (!mobileValue) return '';
        
        // If it's an array, take the first valid value
        if (Array.isArray(mobileValue)) {
          const validMobile = mobileValue.find(mobile => mobile && mobile.trim());
          return validMobile || '';
        }
        
        // If it's a string, return trimmed value
        if (typeof mobileValue === 'string') {
          return mobileValue.trim();
        }
        
        return '';
      };

      // Check if nominee data exists to auto-check the "Add Nominee" checkbox
      const hasNomineeData = initialData.nominee_name && 
        initialData.nominee_name.trim() !== '' && 
        initialData.nominee_gender && 
        initialData.nominee_gender.trim() !== '';

      setFormState(prevState => ({
        ...prevState,
        formData: {
          ...prevState.formData,
          ...initialData,
          // Format dates for HTML date inputs
          proposer_dob: formatDateForInput(initialData.proposer_dob),
          life_assured_dob: formatDateForInput(initialData.life_assured_dob),
          nominee_dob: formatDateForInput(initialData.nominee_dob),
          rcd: formatDateForInput(initialData.rcd),
          date_of_maturity: formatDateForInput(initialData.date_of_maturity),
          due_date_of_premium: formatDateForInput(initialData.due_date_of_premium),
          // Handle mobile numbers as single strings
          proposer_mobile_numbers: cleanMobileNumber(initialData.proposer_mobile_numbers),
          life_assured_mobile_numbers: cleanMobileNumber(initialData.life_assured_mobile_numbers),
          nominee_mobile_numbers: cleanMobileNumber(initialData.nominee_mobile_numbers)
        }
      }));

      // Auto-check "Add Nominee" checkbox if nominee data exists
      if (hasNomineeData) {
        setAddNominee(true);
        console.log('🔍 [NOMINEE] Auto-checking "Add Nominee" because nominee data exists:', {
          nominee_name: initialData.nominee_name,
          nominee_gender: initialData.nominee_gender
        });
      }

      // Auto-check "Same as Mailing Address" for Proposer if addresses match
      if (initialData.proposer_permanent_address && 
          initialData.proposer_mailing_address && 
          initialData.proposer_permanent_address.trim() === initialData.proposer_mailing_address.trim()) {
        setProposerSameAsMailing(true);
        console.log('🔍 [PROPOSER] Auto-checking "Same as Mailing Address" because addresses match');
      }

      // Auto-check "Same as Mailing Address" for Life Assured if addresses match
      if (initialData.life_assured_permanent_address && 
          initialData.life_assured_mailing_address && 
          initialData.life_assured_permanent_address.trim() === initialData.life_assured_mailing_address.trim()) {
        setLifeAssuredSameAsMailing(true);
        console.log('🔍 [LIFE ASSURED] Auto-checking "Same as Mailing Address" because addresses match');
      }

      // Auto-check "Same as Proposer Details" if life assured details match proposer details
      const lifeAssuredMatchesProposer = (
        initialData.life_assured_name === initialData.proposer_name &&
        initialData.life_assured_gender === initialData.proposer_gender &&
        initialData.life_assured_gender_custom === initialData.proposer_gender_custom &&
        initialData.life_assured_dob === initialData.proposer_dob &&
        initialData.life_assured_married_status === initialData.proposer_married_status &&
        initialData.life_assured_father_name === initialData.proposer_father_name &&
        initialData.life_assured_mother_name === initialData.proposer_mother_name &&
        initialData.life_assured_spouse_name === initialData.proposer_spouse_name &&
        initialData.life_assured_mobile_numbers === initialData.proposer_mobile_numbers &&
        initialData.life_assured_email === initialData.proposer_email &&
        initialData.life_assured_pan_number === initialData.proposer_pan_number &&
        initialData.life_assured_residential_status === initialData.proposer_residential_status &&
        initialData.life_assured_mailing_address === initialData.proposer_mailing_address &&
        initialData.life_assured_permanent_address === initialData.proposer_permanent_address
      );

      if (lifeAssuredMatchesProposer) {
        setSameAsProposer(true);
        console.log('🔍 [LIFE ASSURED] Auto-checking "Same as Proposer Details" because details match');
      }

      // Auto-check "Same as Proposer Details" for Nominee if nominee details match proposer details
      const nomineeMatchesProposer = (
        initialData.nominee_name === initialData.proposer_name &&
        initialData.nominee_gender === initialData.proposer_gender &&
        initialData.nominee_dob === initialData.proposer_dob &&
        initialData.nominee_mobile_numbers === initialData.proposer_mobile_numbers &&
        initialData.nominee_email === initialData.proposer_email &&
        initialData.nominee_pan_number === initialData.proposer_pan_number &&
        initialData.nominee_address === initialData.proposer_mailing_address
      );

      if (hasNomineeData && nomineeMatchesProposer) {
        setNomineeSameAsProposer(true);
        console.log('🔍 [NOMINEE] Auto-checking "Same as Proposer Details" because details match');
      }

      // Fetch existing documents when editing
      if (initialData && initialData.id) {
        fetchExistingDocuments(initialData.id);
      }
    }
  }, [initialData]);


  const handleInputChange = (field, value) => {
    console.log(`🔍 [INPUT] Field: ${field}, Value: "${value}"`);
    
    // Special debugging for days fields
    if (field === 'tobacco_days' || field === 'alcohol_days' || field === 'narcotics_days') {
      console.log(`🔍 [DAYS INPUT] ${field}:`, {
        value: value,
        type: typeof value,
        parsed: parseInt(value, 10),
        isNaN: isNaN(parseInt(value, 10))
      });
    }
    
    setFormState(prevState => ({
      ...prevState,
      formData: {
        ...prevState.formData,
        [field]: value
      },
      errors: {
        ...prevState.errors,
        [field]: ''
      }
    }));
  };

  // Mobile number handling is now just regular input change

  const handleFileChange = (field, e) => {
    const file = e?.target?.files?.[0];
    if (file) {
      // Validate file type (allow PDF and images)
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (allowedTypes.includes(file.type)) {
        setFormState(prevState => ({
          ...prevState,
          formData: {
            ...prevState.formData,
            [field]: file
          }
        }));
      } else {
        alert('Please upload a valid PDF or image file (JPEG, JPG, PNG).');
      }
    }
  };

  // Dynamic document handlers
  const handleAddDocumentInline = () => {
    if (!newDocumentName.trim()) {
      addToast('Please enter category name', 'error');
      return;
    }

    const newDocument = {
      category_id: Date.now(), // Generate a unique ID
      document_name: newDocumentName
    };

    setCustomDocuments([...customDocuments, newDocument]);
    setNewDocumentName('');
    setShowAddDocumentField(false);
  };

  const handleCustomDocumentChange = (categoryId, e) => {
    const file = e?.target?.files?.[0];
    if (file) {
      // Validate file type (allow PDF and images)
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (allowedTypes.includes(file.type)) {
        setFormState(prevState => ({
          ...prevState,
          formData: {
            ...prevState.formData,
            [`custom_${categoryId}`]: file
          }
        }));
      } else {
        alert('Please upload a valid PDF or image file (JPEG, JPG, PNG).');
      }
    }
  };




  const validateForm = () => {
    const errors = {};
    const { formData } = formState;

    console.log('🔍 [VALIDATION] Starting validation...');
    console.log('🔍 [VALIDATION] Form data keys:', Object.keys(formData));
    console.log('🔍 [VALIDATION] Mobile numbers:', {
      proposer: formData.proposer_mobile_numbers,
      life_assured: formData.life_assured_mobile_numbers,
      nominee: formData.nominee_mobile_numbers
    });

    // Only validate when submitting (not during step navigation)
    // Required fields validation for final submission
    if (!formData.agent_code?.trim()) {
      errors.agent_code = 'Agent code is required';
      console.log('❌ [VALIDATION] Missing agent_code');
    }
    if (!formData.agent_name?.trim()) {
      errors.agent_name = 'Agent name is required';
      console.log('❌ [VALIDATION] Missing agent_name');
    }
    if (!formData.channel?.trim()) {
      errors.channel = 'Channel is required';
      console.log('❌ [VALIDATION] Missing channel');
    }
    if (!formData.channel_code?.trim()) {
      errors.channel_code = 'Channel code is required';
      console.log('❌ [VALIDATION] Missing channel_code');
    }

    if (!formData.proposer_name?.trim()) {
      errors.proposer_name = 'Proposer name is required';
      console.log('❌ [VALIDATION] Missing proposer_name');
    }
    if (!formData.proposer_gender) {
      errors.proposer_gender = 'Proposer gender is required';
      console.log('❌ [VALIDATION] Missing proposer_gender');
    }
    if (formData.proposer_gender === 'Other' && !formData.proposer_gender_custom?.trim()) {
      errors.proposer_gender_custom = 'Please specify your gender';
      console.log('❌ [VALIDATION] Missing proposer_gender_custom');
    }
    if (!formData.proposer_dob) {
      errors.proposer_dob = 'Proposer DOB is required';
      console.log('❌ [VALIDATION] Missing proposer_dob');
    }
    if (!formData.proposer_married_status) {
      errors.proposer_married_status = 'Marital status is required';
      console.log('❌ [VALIDATION] Missing proposer_married_status');
    }
    if (!formData.proposer_mobile_numbers?.trim()) {
      errors.proposer_mobile_numbers = 'Proposer mobile number is required';
      console.log('❌ [VALIDATION] Missing proposer_mobile_numbers');
    }
    if (!formData.proposer_relationship_with_life_assured?.trim()) {
      errors.proposer_relationship_with_life_assured = 'Relationship with life assured is required';
      console.log('❌ [VALIDATION] Missing proposer_relationship_with_life_assured');
    }
    if (!formData.proposer_residential_status) {
      errors.proposer_residential_status = 'Residential status is required';
      console.log('❌ [VALIDATION] Missing proposer_residential_status');
    }
    if (!formData.proposer_mailing_address?.trim()) {
      errors.proposer_mailing_address = 'Mailing address is required';
      console.log('❌ [VALIDATION] Missing proposer_mailing_address');
    }
    if (!formData.proposer_permanent_address?.trim()) {
      errors.proposer_permanent_address = 'Permanent address is required';
      console.log('❌ [VALIDATION] Missing proposer_permanent_address');
    }

    if (!formData.life_assured_name?.trim()) errors.life_assured_name = 'Life assured name is required';
    if (!formData.life_assured_gender) errors.life_assured_gender = 'Life assured gender is required';
    if (formData.life_assured_gender === 'Other' && !formData.life_assured_gender_custom?.trim()) {
      errors.life_assured_gender_custom = 'Please specify gender';
      console.log('❌ [VALIDATION] Missing life_assured_gender_custom');
    }
    if (!formData.life_assured_dob) errors.life_assured_dob = 'Life assured DOB is required';
    if (!formData.life_assured_married_status) errors.life_assured_married_status = 'Marital status is required';
    if (!formData.life_assured_mobile_numbers?.trim()) errors.life_assured_mobile_numbers = 'Life assured mobile number is required';
    if (!formData.life_assured_relationship_with_proposer?.trim()) errors.life_assured_relationship_with_proposer = 'Relationship with proposer is required';
    if (!formData.life_assured_residential_status) errors.life_assured_residential_status = 'Residential status is required';
    if (!formData.life_assured_mailing_address?.trim()) errors.life_assured_mailing_address = 'Mailing address is required';
    if (!formData.life_assured_permanent_address?.trim()) errors.life_assured_permanent_address = 'Permanent address is required';

    if (!formData.product_name?.trim()) errors.product_name = 'Product name is required';
    if (!formData.premium_payment_term) errors.premium_payment_term = 'Premium payment term is required';
    if (!formData.sum_assured) errors.sum_assured = 'Sum assured is required';
    if (!formData.policy_term) errors.policy_term = 'Policy term is required';
    if (!formData.premium_amount) errors.premium_amount = 'Premium amount is required';
    if (!formData.premium_payment_mode) errors.premium_payment_mode = 'Premium payment mode is required';
    if (!formData.policy_amount) errors.policy_amount = 'Policy amount is required';

    // Nominee fields are only required if addNominee is true
    if (addNominee) {
      if (!formData.nominee_name?.trim()) errors.nominee_name = 'Nominee name is required';
      if (!formData.nominee_gender) errors.nominee_gender = 'Nominee gender is required';
      if (!formData.nominee_relationship_with_life_assured) errors.nominee_relationship_with_life_assured = 'Nominee relationship is required';
    }

    if (!formData.account_type) errors.account_type = 'Account type is required';
    if (!formData.bank_name?.trim()) errors.bank_name = 'Bank name is required';
    if (!formData.branch?.trim()) errors.branch = 'Branch is required';
    if (!formData.account_number?.trim()) errors.account_number = 'Account number is required';

    setFormState(prevState => ({
      ...prevState,
      errors
    }));

    return Object.keys(errors).length === 0;
  };

  const uploadDocuments = async (lifeInsuranceId) => {
    console.log('🔍 [UPLOAD] uploadDocuments called with ID:', lifeInsuranceId);
    const documents = [];
    
    // Debug: Log document fields
    console.log('🔍 [UPLOAD] Document fields:', {
      policy_document: formState.formData.policy_document,
      identity_document: formState.formData.identity_document,
      address_proof: formState.formData.address_proof,
      medical_certificate: formState.formData.medical_certificate
    });
    
    // Collect all documents with their metadata
    if (formState.formData.policy_document) {
      documents.push({
        file: formState.formData.policy_document,
        documentName: 'Policy Document',
        remarks: 'Original policy document'
      });
    }
    
    if (formState.formData.identity_document) {
      documents.push({
        file: formState.formData.identity_document,
        documentName: 'Identity Proof',
        remarks: 'Identity document for verification'
      });
    }
    
    if (formState.formData.address_proof) {
      documents.push({
        file: formState.formData.address_proof,
        documentName: 'Address Proof',
        remarks: 'Address verification document'
      });
    }
    
    if (formState.formData.medical_certificate) {
      documents.push({
        file: formState.formData.medical_certificate,
        documentName: 'Medical Certificate',
        remarks: 'Health checkup report'
      });
    }

    // Add custom documents
    customDocuments.forEach(doc => {
      const customFile = formState.formData[`custom_${doc.category_id}`];
      if (customFile) {
        documents.push({
          file: customFile,
          documentName: doc.document_name,
          documentType: doc.document_name, // Use custom category name as document type
          remarks: `Custom document: ${doc.document_name}`
        });
      }
    });

    // Debug: Log documents found
    console.log('🔍 [UPLOAD] Documents found:', documents.length, documents);
    console.log('🔍 [UPLOAD] Custom documents:', customDocuments);
    
    // Upload documents if any
    if (documents.length > 0) {
      console.log('🔍 [UPLOAD] Proceeding with document upload...');
      try {
        const formData = new FormData();
        
        // Add document names and remarks as arrays
        documents.forEach(doc => {
          formData.append('documentName', doc.documentName);
          formData.append('remarks', doc.remarks);
          formData.append('document', doc.file);
        });

        const token = Cookies.get('token');
        console.log('🔍 [UPLOAD] Token being sent:', token ? 'Present' : 'Missing');
        console.log('🔍 [UPLOAD] Token length:', token ? token.length : 0);
        console.log('🔍 [UPLOAD] Token preview:', token ? token.substring(0, 20) + '...' : 'N/A');

        const response = await fetch(`${config.API_URL}/user/life-insurance/${lifeInsuranceId}/documents/upload`, {
          method: 'POST',
          headers: {
            'token': token
          },
          body: formData
        });

        const result = await response.json();
        if (result.status) {
          console.log(`✅ Uploaded ${result.count} documents successfully`);
          addToast(`Successfully uploaded ${result.count} documents`, 'success');
        } else {
          console.error('❌ Document upload failed:', result.message);
          addToast('Document upload failed', 'error');
        }
      } catch (error) {
        console.error('❌ Error uploading documents:', error);
        addToast('Error uploading documents', 'error');
      }
    } else {
      console.log('🔍 [UPLOAD] No documents to upload, skipping...');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🔍 [SUBMIT] Form submission started');
    console.log('🔍 [SUBMIT] Current step:', currentStep);
    console.log('🔍 [SUBMIT] isEdit:', !!initialData);
    console.log('🔍 [SUBMIT] Form data:', formState.formData);
    
    if (!validateForm()) {
      console.log('❌ [SUBMIT] Validation failed');
      console.log('❌ [SUBMIT] Validation errors:', formState.errors);
      
      // Show user-friendly error message
      const missingFields = Object.keys(formState.errors);
      let stepMessage = '';
      
      if (missingFields.some(field => ['agent_code', 'agent_name', 'channel', 'channel_code'].includes(field))) {
        stepMessage += 'Please complete Step 1 (Agent Details). ';
      }
      if (missingFields.some(field => ['proposer_name', 'proposer_gender', 'proposer_dob', 'proposer_married_status', 'proposer_mobile_numbers', 'proposer_relationship_with_life_assured', 'proposer_residential_status', 'proposer_mailing_address', 'proposer_permanent_address'].includes(field))) {
        stepMessage += 'Please complete Step 2 (Proposer Details). ';
      }
      if (missingFields.some(field => ['life_assured_name', 'life_assured_gender', 'life_assured_dob', 'life_assured_married_status', 'life_assured_mobile_numbers', 'life_assured_relationship_with_proposer', 'life_assured_residential_status', 'life_assured_mailing_address', 'life_assured_permanent_address'].includes(field))) {
        stepMessage += 'Please complete Step 3 (Life Assured Details). ';
      }
      if (missingFields.some(field => ['product_name', 'premium_payment_term', 'sum_assured', 'policy_term', 'premium_amount', 'premium_payment_mode', 'policy_amount'].includes(field))) {
        stepMessage += 'Please complete Step 5 (Product & Policy Details). ';
      }
      if (addNominee && missingFields.some(field => ['nominee_name', 'nominee_gender', 'nominee_relationship_with_life_assured'].includes(field))) {
        stepMessage += 'Please complete Step 6 (Nominee Details). ';
      }
      if (missingFields.some(field => ['account_type', 'bank_name', 'branch', 'account_number'].includes(field))) {
        stepMessage += 'Please complete Step 7 (Bank Details). ';
      }
      
      addToast(stepMessage || 'Please fill in all required fields', 'error');
      
      // Navigate to the first step with missing fields
      if (missingFields.some(field => ['agent_code', 'agent_name', 'channel', 'channel_code'].includes(field))) {
        setCurrentStep(1);
      } else if (missingFields.some(field => ['proposer_name', 'proposer_gender', 'proposer_dob', 'proposer_married_status', 'proposer_mobile_numbers', 'proposer_relationship_with_life_assured', 'proposer_residential_status', 'proposer_mailing_address', 'proposer_permanent_address'].includes(field))) {
        setCurrentStep(2);
      } else if (missingFields.some(field => ['life_assured_name', 'life_assured_gender', 'life_assured_dob', 'life_assured_married_status', 'life_assured_mobile_numbers', 'life_assured_relationship_with_proposer', 'life_assured_residential_status', 'life_assured_mailing_address', 'life_assured_permanent_address'].includes(field))) {
        setCurrentStep(3);
      } else if (missingFields.some(field => ['product_name', 'premium_payment_term', 'sum_assured', 'policy_term', 'premium_amount', 'premium_payment_mode', 'policy_amount'].includes(field))) {
        setCurrentStep(5);
      } else if (addNominee && missingFields.some(field => ['nominee_name', 'nominee_gender', 'nominee_relationship_with_life_assured'].includes(field))) {
        setCurrentStep(6);
      } else if (missingFields.some(field => ['account_type', 'bank_name', 'branch', 'account_number'].includes(field))) {
        setCurrentStep(7);
      }
      
      return;
    }

    console.log('✅ [SUBMIT] Validation passed, proceeding with submission');
    setIsSubmitting(true);

    try {
      const payload = {
        ...formState.formData,
        proposer_mobile_numbers: formState.formData.proposer_mobile_numbers?.trim() || '',
        life_assured_mobile_numbers: formState.formData.life_assured_mobile_numbers?.trim() || '',
        nominee_mobile_numbers: formState.formData.nominee_mobile_numbers?.trim() || ''
      };
      
      // Remove document fields from payload as they will be uploaded separately
      delete payload.policy_document;
      delete payload.identity_document;
      delete payload.address_proof;
      delete payload.medical_certificate;
      
      // Debug: Log the payload being sent
      console.log('🔍 [LIFE INSURANCE] Form data before filtering:', formState.formData);
      console.log('🔍 [LIFE INSURANCE] Mobile numbers before filtering:', {
        proposer: formState.formData.proposer_mobile_numbers,
        life_assured: formState.formData.life_assured_mobile_numbers,
        nominee: formState.formData.nominee_mobile_numbers
      });
      console.log('🔍 [LIFE INSURANCE] Days fields before filtering:', {
        tobacco_days: formState.formData.tobacco_days,
        alcohol_days: formState.formData.alcohol_days,
        narcotics_days: formState.formData.narcotics_days
      });
      console.log('🔍 [LIFE INSURANCE] Payload being sent:', payload);
      console.log('🔍 [LIFE INSURANCE] Days fields in payload:', {
        tobacco_days: payload.tobacco_days,
        alcohol_days: payload.alcohol_days,
        narcotics_days: payload.narcotics_days
      });

      let response;
      if (isRenewal && onSubmit) {
        // For renewal mode, call the custom onSubmit function
        await onSubmit(payload);
        onClose();
      } else if (initialData) {
        response = await updateLifeInsurance(initialData.id, payload, addToast);
        if (response && response.status) {
          // Upload documents after successful update
          await uploadDocuments(initialData.id);
          fetchApi();
          onClose();
        }
      } else {
        response = await createLifeInsurance(payload, addToast);
        if (response && response.status) {
          // Upload documents after successful creation
          await uploadDocuments(response.data.id);
          fetchApi();
          onClose();
        }
      }
    } catch (error) {
      console.error('Error saving life insurance:', error);
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleNext = (e) => {
    e?.preventDefault();
    console.log('🔍 [NEXT] handleNext called, current step:', currentStep);
    console.log('🔍 [NEXT] Moving to step:', currentStep + 1);
    console.log('🔍 [NEXT] isEdit:', !!initialData, 'isSubmitting:', isSubmitting);
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = (e) => {
    e?.preventDefault();
    setCurrentStep(prev => prev - 1);
  };

  // Sync consumption state with form data
  useEffect(() => {
    setShowTobaccoDetails(formState.formData.tobacco_consumption === 'Yes');
    setShowAlcoholDetails(formState.formData.alcohol_consumption === 'Yes');
    setShowNarcoticsDetails(formState.formData.narcotics_consumption === 'Yes');
  }, [formState.formData.tobacco_consumption, formState.formData.alcohol_consumption, formState.formData.narcotics_consumption]);

  // Reset checkboxes when modal opens for new policy (not editing)
  useEffect(() => {
    if (isOpen && !initialData) {
      setAddNominee(false);
      setNomineeSameAsProposer(false);
      setSameAsProposer(false);
      setProposerSameAsMailing(false);
      setLifeAssuredSameAsMailing(false);
      console.log('🔍 [CHECKBOXES] Resetting all checkboxes for new policy');
    }
  }, [isOpen, initialData]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = previousOverflow || '';
    }
    return () => {
      document.body.style.overflow = previousOverflow || '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={isRenewal ? 'Renew Life Insurance' : (initialData ? 'Edit Life Insurance' : 'Add New Life Insurance')}
    >
      <form 
        onSubmit={handleSubmit} 
        className="consumer-form" 
        noValidate
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            return;
          }
        }}
      >
        {/* Step 1: Agent Details */}
        {currentStep === 1 && (
          <div className="form-section">
            <h5>Agent Details</h5>
            <div className="form-row">
              <div className="form-group">
                <label>Agent Code *</label>
                <Input
                  type="text"
                  value={formState.formData.agent_code}
                  onChange={(e) => handleInputChange('agent_code', e?.target?.value || '')}
                  placeholder="Enter agent code"
                  required
                />
                {formState.errors.agent_code && <span className="error-text">{formState.errors.agent_code}</span>}
              </div>
              <div className="form-group">
                <label>Agent Name *</label>
                <Input
                  type="text"
                  value={formState.formData.agent_name}
                  onChange={(e) => handleInputChange('agent_name', e?.target?.value || '')}
                  placeholder="Enter agent name"
                  required
                />
                {formState.errors.agent_name && <span className="error-text">{formState.errors.agent_name}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Channel *</label>
                <Input
                  type="text"
                  value={formState.formData.channel}
                  onChange={(e) => handleInputChange('channel', e?.target?.value || '')}
                  placeholder="Enter channel"
                  required
                />
                {formState.errors.channel && <span className="error-text">{formState.errors.channel}</span>}
              </div>
              <div className="form-group">
                <label>Channel Code *</label>
                <Input
                  type="text"
                  value={formState.formData.channel_code}
                  onChange={(e) => handleInputChange('channel_code', e?.target?.value || '')}
                  placeholder="Enter channel code"
                  required
                />
                {formState.errors.channel_code && <span className="error-text">{formState.errors.channel_code}</span>}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Proposer Details */}
        {currentStep === 2 && (
          <div className="form-section">
            <h5>Proposer Details</h5>
            <div className="form-row">
              <div className="form-group">
                <label>Proposer Name *</label>
                <Input
                  type="text"
                  value={formState.formData.proposer_name}
                  onChange={(e) => handleInputChange('proposer_name', e?.target?.value || '')}
                  placeholder="Enter full name"
                  required
                />
                {formState.errors.proposer_name && <span className="error-text">{formState.errors.proposer_name}</span>}
              </div>
              <div className="form-group">
                <label>Gender *</label>
                <Select
                  options={[
                    { value: '', label: 'Select Gender' },
                    { value: 'Male', label: 'Male' },
                    { value: 'Female', label: 'Female' },
                    { value: 'Other', label: 'Other' }
                  ]}
                  value={{ value: formState.formData.proposer_gender, label: formState.formData.proposer_gender || 'Select Gender' }}
                  onChange={(selectedOption) => handleInputChange('proposer_gender', selectedOption?.value || '')}
                  required
                />
                {formState.errors.proposer_gender && <span className="error-text">{formState.errors.proposer_gender}</span>}
              </div>
            </div>
            
            {/* Custom Gender Input - Only show if gender is Other */}
            {formState.formData.proposer_gender === 'Other' && (
              <div className="form-row">
                <div className="form-group">
                  <label>Specify Gender *</label>
                  <Input
                    type="text"
                    value={formState.formData.proposer_gender_custom}
                    onChange={(e) => handleInputChange('proposer_gender_custom', e?.target?.value || '')}
                    placeholder="Please specify your gender"
                    required
                  />
                  {formState.errors.proposer_gender_custom && <span className="error-text">{formState.errors.proposer_gender_custom}</span>}
                </div>
              </div>
            )}
            
            <div className="form-row">
              <div className="form-group">
                <label>Date of Birth *</label>
                <Input
                  type="date"
                  value={formState.formData.proposer_dob}
                  onChange={(e) => handleInputChange('proposer_dob', e?.target?.value || '')}
                  required
                />
                {formState.errors.proposer_dob && <span className="error-text">{formState.errors.proposer_dob}</span>}
              </div>
              <div className="form-group">
                <label>Marital Status *</label>
                <Select
                  options={[
                    { value: '', label: 'Select Status' },
                    { value: 'Single', label: 'Single' },
                    { value: 'Married', label: 'Married' },
                    { value: 'Divorced', label: 'Divorced' },
                    { value: 'Widowed', label: 'Widowed' }
                  ]}
                  value={{ value: formState.formData.proposer_married_status, label: formState.formData.proposer_married_status || 'Select Status' }}
                  onChange={(selectedOption) => handleInputChange('proposer_married_status', selectedOption?.value || '')}
                  required
                />
                {formState.errors.proposer_married_status && <span className="error-text">{formState.errors.proposer_married_status}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Father's Name</label>
                <Input
                  type="text"
                  value={formState.formData.proposer_father_name}
                  onChange={(e) => handleInputChange('proposer_father_name', e?.target?.value || '')}
                  placeholder="Enter father's name"
                />
              </div>
              <div className="form-group">
                <label>Mother's Name</label>
                <Input
                  type="text"
                  value={formState.formData.proposer_mother_name}
                  onChange={(e) => handleInputChange('proposer_mother_name', e?.target?.value || '')}
                  placeholder="Enter mother's name"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Spouse Name</label>
                <Input
                  type="text"
                  value={formState.formData.proposer_spouse_name}
                  onChange={(e) => handleInputChange('proposer_spouse_name', e?.target?.value || '')}
                  placeholder="Enter spouse name"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <Input
                  type="email"
                  value={formState.formData.proposer_email}
                  onChange={(e) => handleInputChange('proposer_email', e?.target?.value || '')}
                  placeholder="Enter email address"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Mobile Number *</label>
                <div className='phone-style'>
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
                    value={formState.formData.proposer_mobile_numbers}
                    className="form-control mobile"
                    onChange={(e) => handleInputChange('proposer_mobile_numbers', e.target.value)}
                    placeholder="Enter mobile number"
                    required
                    maxLength="10"
                  />
                </div>
                {formState.errors.proposer_mobile_numbers && <span className="error-text">{formState.errors.proposer_mobile_numbers}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>PAN Number</label>
                <Input
                  type="text"
                  value={formState.formData.proposer_pan_number}
                  onChange={(e) => handleInputChange('proposer_pan_number', e?.target?.value || '')}
                  placeholder="Enter PAN number"
                />
              </div>
              <div className="form-group">
                <label>Nationality</label>
                <Input
                  type="text"
                  value={formState.formData.proposer_nationality}
                  onChange={(e) => handleInputChange('proposer_nationality', e?.target?.value || '')}
                  placeholder="Enter nationality"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Relationship with Life Assured *</label>
                <Input
                  type="text"
                  value={formState.formData.proposer_relationship_with_life_assured}
                  onChange={(e) => handleInputChange('proposer_relationship_with_life_assured', e?.target?.value || '')}
                  placeholder="Enter relationship"
                  required
                />
                {formState.errors.proposer_relationship_with_life_assured && <span className="error-text">{formState.errors.proposer_relationship_with_life_assured}</span>}
              </div>
              <div className="form-group">
                <label>Residential Status *</label>
                <Select
                  options={[
                    { value: '', label: 'Select Status' },
                    { value: 'Resident', label: 'Resident' },
                    { value: 'Non-Resident', label: 'Non-Resident' },
                    { value: 'Resident but Not Ordinarily Resident', label: 'Resident but Not Ordinarily Resident' }
                  ]}
                  value={{ value: formState.formData.proposer_residential_status, label: formState.formData.proposer_residential_status || 'Select Status' }}
                  onChange={(selectedOption) => handleInputChange('proposer_residential_status', selectedOption?.value || '')}
                  required
                />
                {formState.errors.proposer_residential_status && <span className="error-text">{formState.errors.proposer_residential_status}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Mailing Address *</label>
                <textarea
                  value={formState.formData.proposer_mailing_address}
                  onChange={(e) => handleInputChange('proposer_mailing_address', e?.target?.value || '')}
                  placeholder="Enter mailing address"
                  required
                  rows="3"
                />
                {formState.errors.proposer_mailing_address && <span className="error-text">{formState.errors.proposer_mailing_address}</span>}
              </div>
            </div>
            
            {/* Same as Mailing Address Checkbox for Proposer */}
            <div className="form-row">
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={proposerSameAsMailing}
                    onChange={(e) => handleProposerSameAsMailingChange(e.target.checked)}
                  />
                  <span>Same as Mailing Address</span>
                </label>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Permanent Address *</label>
                <textarea
                  value={formState.formData.proposer_permanent_address}
                  onChange={(e) => handleInputChange('proposer_permanent_address', e?.target?.value || '')}
                  placeholder="Enter permanent address"
                  required
                  rows="3"
                />
                {formState.errors.proposer_permanent_address && <span className="error-text">{formState.errors.proposer_permanent_address}</span>}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Life Assured Details */}
        {currentStep === 3 && (
          <div className="form-section">
            <h5>Life Assured Details</h5>
            
            {/* Same as Proposer Checkbox */}
            <div className="form-row">
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={sameAsProposer}
                    onChange={(e) => handleSameAsProposerChange(e.target.checked)}
                  />
                  <span>Same as Proposer Details</span>
                </label>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Life Assured Name *</label>
                <Input
                  type="text"
                  value={formState.formData.life_assured_name}
                  onChange={(e) => handleInputChange('life_assured_name', e?.target?.value || '')}
                  placeholder="Enter full name"
                  required
                />
                {formState.errors.life_assured_name && <span className="error-text">{formState.errors.life_assured_name}</span>}
              </div>
              <div className="form-group">
                <label>Gender *</label>
                <Select
                  options={[
                    { value: '', label: 'Select Gender' },
                    { value: 'Male', label: 'Male' },
                    { value: 'Female', label: 'Female' },
                    { value: 'Other', label: 'Other' }
                  ]}
                  value={{ value: formState.formData.life_assured_gender, label: formState.formData.life_assured_gender || 'Select Gender' }}
                  onChange={(selectedOption) => handleInputChange('life_assured_gender', selectedOption?.value || '')}
                  required
                />
                {formState.errors.life_assured_gender && <span className="error-text">{formState.errors.life_assured_gender}</span>}
              </div>
            </div>
            
            {/* Custom Gender Input for Life Assured - Only show if gender is Other */}
            {formState.formData.life_assured_gender === 'Other' && (
              <div className="form-row">
                <div className="form-group">
                  <label>Specify Gender *</label>
                  <Input
                    type="text"
                    value={formState.formData.life_assured_gender_custom}
                    onChange={(e) => handleInputChange('life_assured_gender_custom', e?.target?.value || '')}
                    placeholder="Please specify gender"
                    required
                  />
                  {formState.errors.life_assured_gender_custom && <span className="error-text">{formState.errors.life_assured_gender_custom}</span>}
                </div>
              </div>
            )}
            
            <div className="form-row">
              <div className="form-group">
                <label>Date of Birth *</label>
                <Input
                  type="date"
                  value={formState.formData.life_assured_dob}
                  onChange={(e) => handleInputChange('life_assured_dob', e?.target?.value || '')}
                  required
                />
                {formState.errors.life_assured_dob && <span className="error-text">{formState.errors.life_assured_dob}</span>}
              </div>
              <div className="form-group">
                <label>Marital Status *</label>
                <Select
                  options={[
                    { value: '', label: 'Select Status' },
                    { value: 'Single', label: 'Single' },
                    { value: 'Married', label: 'Married' },
                    { value: 'Divorced', label: 'Divorced' },
                    { value: 'Widowed', label: 'Widowed' }
                  ]}
                  value={{ value: formState.formData.life_assured_married_status, label: formState.formData.life_assured_married_status || 'Select Status' }}
                  onChange={(selectedOption) => handleInputChange('life_assured_married_status', selectedOption?.value || '')}
                  required
                />
                {formState.errors.life_assured_married_status && <span className="error-text">{formState.errors.life_assured_married_status}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Father's Name</label>
                <Input
                  type="text"
                  value={formState.formData.life_assured_father_name}
                  onChange={(e) => handleInputChange('life_assured_father_name', e?.target?.value || '')}
                  placeholder="Enter father's name"
                />
              </div>
              <div className="form-group">
                <label>Mother's Name</label>
                <Input
                  type="text"
                  value={formState.formData.life_assured_mother_name}
                  onChange={(e) => handleInputChange('life_assured_mother_name', e?.target?.value || '')}
                  placeholder="Enter mother's name"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Spouse Name</label>
                <Input
                  type="text"
                  value={formState.formData.life_assured_spouse_name}
                  onChange={(e) => handleInputChange('life_assured_spouse_name', e?.target?.value || '')}
                  placeholder="Enter spouse name"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Mobile Number *</label>
                <div className='phone-style'>
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
                    value={formState.formData.life_assured_mobile_numbers}
                    className="form-control mobile"
                    onChange={(e) => handleInputChange('life_assured_mobile_numbers', e.target.value)}
                    placeholder="Enter mobile number"
                    required
                    maxLength="10"
                  />
                </div>
                {formState.errors.life_assured_mobile_numbers && <span className="error-text">{formState.errors.life_assured_mobile_numbers}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Email</label>
                <Input
                  type="email"
                  value={formState.formData.life_assured_email}
                  onChange={(e) => handleInputChange('life_assured_email', e?.target?.value || '')}
                  placeholder="Enter email address"
                />
              </div>
              <div className="form-group">
                <label>PAN Number</label>
                <Input
                  type="text"
                  value={formState.formData.life_assured_pan_number}
                  onChange={(e) => handleInputChange('life_assured_pan_number', e?.target?.value || '')}
                  placeholder="Enter PAN number"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Relationship with Proposer *</label>
                <Input
                  type="text"
                  value={formState.formData.life_assured_relationship_with_proposer}
                  onChange={(e) => handleInputChange('life_assured_relationship_with_proposer', e?.target?.value || '')}
                  placeholder="Enter relationship"
                  required
                />
                {formState.errors.life_assured_relationship_with_proposer && <span className="error-text">{formState.errors.life_assured_relationship_with_proposer}</span>}
              </div>
              <div className="form-group">
                <label>Residential Status *</label>
                <Select
                  options={[
                    { value: '', label: 'Select Status' },
                    { value: 'Resident', label: 'Resident' },
                    { value: 'Non-Resident', label: 'Non-Resident' },
                    { value: 'Resident but Not Ordinarily Resident', label: 'Resident but Not Ordinarily Resident' }
                  ]}
                  value={{ value: formState.formData.life_assured_residential_status, label: formState.formData.life_assured_residential_status || 'Select Status' }}
                  onChange={(selectedOption) => handleInputChange('life_assured_residential_status', selectedOption?.value || '')}
                  required
                />
                {formState.errors.life_assured_residential_status && <span className="error-text">{formState.errors.life_assured_residential_status}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Education</label>
                <Input
                  type="text"
                  value={formState.formData.life_assured_education}
                  onChange={(e) => handleInputChange('life_assured_education', e?.target?.value || '')}
                  placeholder="Enter education level"
                />
              </div>
              <div className="form-group">
                <label>Occupation</label>
                <Input
                  type="text"
                  value={formState.formData.life_assured_occupation}
                  onChange={(e) => handleInputChange('life_assured_occupation', e?.target?.value || '')}
                  placeholder="Enter occupation"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Organization Name</label>
                <Input
                  type="text"
                  value={formState.formData.life_assured_organization_name}
                  onChange={(e) => handleInputChange('life_assured_organization_name', e?.target?.value || '')}
                  placeholder="Enter organization name"
                />
              </div>
              <div className="form-group">
                <label>Annual Income</label>
                <Input
                  type="number"
                  value={formState.formData.life_assured_annual_income}
                  onChange={(e) => handleInputChange('life_assured_annual_income', e?.target?.value || '')}
                  placeholder="Enter annual income"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Mailing Address *</label>
                <textarea
                  value={formState.formData.life_assured_mailing_address}
                  onChange={(e) => handleInputChange('life_assured_mailing_address', e?.target?.value || '')}
                  placeholder="Enter mailing address"
                  required
                  rows="3"
                />
                {formState.errors.life_assured_mailing_address && <span className="error-text">{formState.errors.life_assured_mailing_address}</span>}
              </div>
            </div>
            
            {/* Same as Mailing Address Checkbox for Life Assured */}
            <div className="form-row">
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={lifeAssuredSameAsMailing}
                    onChange={(e) => handleLifeAssuredSameAsMailingChange(e.target.checked)}
                  />
                  <span>Same as Mailing Address</span>
                </label>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Permanent Address *</label>
                <textarea
                  value={formState.formData.life_assured_permanent_address}
                  onChange={(e) => handleInputChange('life_assured_permanent_address', e?.target?.value || '')}
                  placeholder="Enter permanent address"
                  required
                  rows="3"
                />
                {formState.errors.life_assured_permanent_address && <span className="error-text">{formState.errors.life_assured_permanent_address}</span>}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Health Details */}
        {currentStep === 4 && (
          <div className="form-section">
            <h5>Health Details</h5>
            
            <div className="form-row">
              <div className="form-group">
                <label>Height (cm)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={formState.formData.height}
                  onChange={(e) => handleInputChange('height', e?.target?.value || '')}
                  placeholder="Enter height in cm"
                />
              </div>
              <div className="form-group">
                <label>Weight (kg)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={formState.formData.weight}
                  onChange={(e) => handleInputChange('weight', e?.target?.value || '')}
                  placeholder="Enter weight in kg"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Tobacco Consumption</label>
                <Select
                  options={[
                    { value: 'No', label: 'No' },
                    { value: 'Yes', label: 'Yes' }
                  ]}
                  value={{ value: formState.formData.tobacco_consumption, label: formState.formData.tobacco_consumption || 'No' }}
                  onChange={(selectedOption) => {
                    const value = selectedOption?.value === 'Yes';
                    handleTobaccoConsumptionChange(value);
                  }}
                />
              </div>
            </div>
            
            {/* Tobacco Details - Only show if tobacco consumption is Yes */}
            {showTobaccoDetails && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>Tobacco Quantity</label>
                    <Input
                      type="text"
                      value={formState.formData.tobacco_quantity}
                      onChange={(e) => handleInputChange('tobacco_quantity', e?.target?.value || '')}
                      placeholder="Enter tobacco quantity"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Tobacco Days</label>
                    <Input
                      type="number"
                      value={formState.formData.tobacco_days}
                      onChange={(e) => handleInputChange('tobacco_days', e?.target?.value || '')}
                      placeholder="Enter number of days"
                    />
                  </div>
                </div>
              </>
            )}
            <div className="form-row">
              <div className="form-group">
                <label>Alcohol Consumption</label>
                <Select
                  options={[
                    { value: 'No', label: 'No' },
                    { value: 'Yes', label: 'Yes' }
                  ]}
                  value={{ value: formState.formData.alcohol_consumption, label: formState.formData.alcohol_consumption || 'No' }}
                  onChange={(selectedOption) => {
                    const value = selectedOption?.value === 'Yes';
                    handleAlcoholConsumptionChange(value);
                  }}
                />
              </div>
            </div>
            
            {/* Alcohol Details - Only show if alcohol consumption is Yes */}
            {showAlcoholDetails && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>Alcohol Quantity</label>
                    <Input
                      type="text"
                      value={formState.formData.alcohol_quantity}
                      onChange={(e) => handleInputChange('alcohol_quantity', e?.target?.value || '')}
                      placeholder="Enter alcohol quantity"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Alcohol Days</label>
                    <Input
                      type="number"
                      value={formState.formData.alcohol_days}
                      onChange={(e) => handleInputChange('alcohol_days', e?.target?.value || '')}
                      placeholder="Enter number of days"
                    />
                  </div>
                </div>
              </>
            )}
            <div className="form-row">
              <div className="form-group">
                <label>Narcotics Consumption</label>
                <Select
                  options={[
                    { value: 'No', label: 'No' },
                    { value: 'Yes', label: 'Yes' }
                  ]}
                  value={{ value: formState.formData.narcotics_consumption, label: formState.formData.narcotics_consumption || 'No' }}
                  onChange={(selectedOption) => {
                    const value = selectedOption?.value === 'Yes';
                    handleNarcoticsConsumptionChange(value);
                  }}
                />
              </div>
            </div>
            
            {/* Narcotics Details - Only show if narcotics consumption is Yes */}
            {showNarcoticsDetails && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>Narcotics Quantity</label>
                    <Input
                      type="text"
                      value={formState.formData.narcotics_quantity}
                      onChange={(e) => handleInputChange('narcotics_quantity', e?.target?.value || '')}
                      placeholder="Enter narcotics quantity"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Narcotics Days</label>
                    <Input
                      type="number"
                      value={formState.formData.narcotics_days}
                      onChange={(e) => handleInputChange('narcotics_days', e?.target?.value || '')}
                      placeholder="Enter number of days"
                    />
                  </div>
                </div>
              </>
            )}
            <div className="form-row">
              <div className="form-group">
                <label>Health Remarks</label>
                <textarea
                  value={formState.formData.health_remarks}
                  onChange={(e) => handleInputChange('health_remarks', e?.target?.value || '')}
                  placeholder="Enter any health-related remarks"
                  rows="3"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Product & Policy Details */}
        {currentStep === 5 && (
          <div className="form-section">
            <h5>Product & Policy Details</h5>
            <div className="form-row">
              <div className="form-group">
                <label>Product Name *</label>
                <Input
                  type="text"
                  value={formState.formData.product_name}
                  onChange={(e) => handleInputChange('product_name', e?.target?.value || '')}
                  placeholder="Enter product name"
                  required
                />
                {formState.errors.product_name && <span className="error-text">{formState.errors.product_name}</span>}
              </div>
              <div className="form-group">
                <label>Sum Assured *</label>
                <Input
                  type="number"
                  value={formState.formData.sum_assured}
                  onChange={(e) => handleInputChange('sum_assured', e?.target?.value || '')}
                  placeholder="Enter sum assured"
                  required
                />
                {formState.errors.sum_assured && <span className="error-text">{formState.errors.sum_assured}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Policy Term (Years) *</label>
                <Input
                  type="number"
                  value={formState.formData.policy_term}
                  onChange={(e) => handleInputChange('policy_term', e?.target?.value || '')}
                  placeholder="Enter policy term"
                  required
                />
                {formState.errors.policy_term && <span className="error-text">{formState.errors.policy_term}</span>}
              </div>
              <div className="form-group">
                <label>Premium Payment Term (Years) *</label>
                <Input
                  type="number"
                  value={formState.formData.premium_payment_term}
                  onChange={(e) => handleInputChange('premium_payment_term', e?.target?.value || '')}
                  placeholder="Enter premium payment term"
                  required
                />
                {formState.errors.premium_payment_term && <span className="error-text">{formState.errors.premium_payment_term}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Premium Amount *</label>
                <Input
                  type="number"
                  value={formState.formData.premium_amount}
                  onChange={(e) => handleInputChange('premium_amount', e?.target?.value || '')}
                  placeholder="Enter premium amount"
                  required
                />
                {formState.errors.premium_amount && <span className="error-text">{formState.errors.premium_amount}</span>}
              </div>
              <div className="form-group">
                <label>Premium Payment Mode *</label>
                <Select
                  options={[
                    { value: '', label: 'Select Mode' },
                    { value: 'Monthly', label: 'Monthly' },
                    { value: 'Quarterly', label: 'Quarterly' },
                    { value: 'Half-Yearly', label: 'Half-Yearly' },
                    { value: 'Yearly', label: 'Yearly' },
                    { value: 'Single', label: 'Single' }
                  ]}
                  value={{ value: formState.formData.premium_payment_mode, label: formState.formData.premium_payment_mode || 'Select Mode' }}
                  onChange={(selectedOption) => handleInputChange('premium_payment_mode', selectedOption?.value || '')}
                  required
                />
                {formState.errors.premium_payment_mode && <span className="error-text">{formState.errors.premium_payment_mode}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Policy Number</label>
                <Input
                  type="text"
                  value={formState.formData.policy_number}
                  onChange={(e) => handleInputChange('policy_number', e?.target?.value || '')}
                  placeholder="Enter policy number"
                />
              </div>
              <div className="form-group">
                <label>Risk Commencement Date</label>
                <Input
                  type="date"
                  value={formState.formData.rcd}
                  onChange={(e) => handleInputChange('rcd', e?.target?.value || '')}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Policy Amount *</label>
                <Input
                  type="number"
                  value={formState.formData.policy_amount}
                  onChange={(e) => handleInputChange('policy_amount', e?.target?.value || '')}
                  placeholder="Enter policy amount"
                  required
                />
                {formState.errors.policy_amount && <span className="error-text">{formState.errors.policy_amount}</span>}
              </div>
              <div className="form-group">
                <label>Date of Maturity</label>
                <Input
                  type="date"
                  value={formState.formData.date_of_maturity}
                  onChange={(e) => handleInputChange('date_of_maturity', e?.target?.value || '')}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Due Date of Premium</label>
                <Input
                  type="date"
                  value={formState.formData.due_date_of_premium}
                  onChange={(e) => handleInputChange('due_date_of_premium', e?.target?.value || '')}
                />
              </div>
              <div className="form-group">
                <label>Policy Remarks</label>
                <textarea
                  value={formState.formData.policy_remarks}
                  onChange={(e) => handleInputChange('policy_remarks', e?.target?.value || '')}
                  placeholder="Enter any policy-related remarks"
                  rows="3"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Nominee Details */}
        {currentStep === 6 && (
          <div className="form-section">
            <h5>Nominee Details</h5>
            
            {/* Add Nominee Checkbox */}
            <div className="form-row">
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={addNominee}
                    onChange={(e) => handleAddNomineeChange(e.target.checked)}
                  />
                  <span>Add Nominee</span>
                </label>
              </div>
            </div>
            
            {/* Nominee Fields - Only show if addNominee is true */}
            {addNominee && (
              <>
                {/* Same as Proposer Checkbox for Nominee */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={nomineeSameAsProposer}
                        onChange={(e) => handleNomineeSameAsProposerChange(e.target.checked)}
                      />
                      <span>Same as Proposer Details</span>
                    </label>
                  </div>
                </div>
                
                <div className="form-row">
              <div className="form-group">
                <label>Nominee Name *</label>
                <Input
                  type="text"
                  value={formState.formData.nominee_name}
                  onChange={(e) => handleInputChange('nominee_name', e?.target?.value || '')}
                  placeholder="Enter nominee name"
                  required
                />
                {formState.errors.nominee_name && <span className="error-text">{formState.errors.nominee_name}</span>}
              </div>
              <div className="form-group">
                <label>Gender *</label>
                <Select
                  options={[
                    { value: '', label: 'Select Gender' },
                    { value: 'Male', label: 'Male' },
                    { value: 'Female', label: 'Female' },
                    { value: 'Other', label: 'Other' }
                  ]}
                  value={{ value: formState.formData.nominee_gender, label: formState.formData.nominee_gender || 'Select Gender' }}
                  onChange={(selectedOption) => handleInputChange('nominee_gender', selectedOption?.value || '')}
                  required
                />
                {formState.errors.nominee_gender && <span className="error-text">{formState.errors.nominee_gender}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Date of Birth</label>
                <Input
                  type="date"
                  value={formState.formData.nominee_dob}
                  onChange={(e) => handleInputChange('nominee_dob', e?.target?.value || '')}
                />
              </div>
              <div className="form-group">
                <label>Relationship with Life Assured *</label>
                <Input
                  type="text"
                  value={formState.formData.nominee_relationship_with_life_assured}
                  onChange={(e) => handleInputChange('nominee_relationship_with_life_assured', e?.target?.value || '')}
                  placeholder="Enter relationship"
                  required
                />
                {formState.errors.nominee_relationship_with_life_assured && <span className="error-text">{formState.errors.nominee_relationship_with_life_assured}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Mobile Number</label>
                <div className='phone-style'>
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
                    value={formState.formData.nominee_mobile_numbers}
                    className="form-control mobile"
                    onChange={(e) => handleInputChange('nominee_mobile_numbers', e.target.value)}
                    placeholder="Enter mobile number"
                    maxLength="10"
                  />
                </div>
                {formState.errors.nominee_mobile_numbers && <span className="error-text">{formState.errors.nominee_mobile_numbers}</span>}
              </div>
              <div className="form-group">
                <label>Email</label>
                <Input
                  type="email"
                  value={formState.formData.nominee_email}
                  onChange={(e) => handleInputChange('nominee_email', e?.target?.value || '')}
                  placeholder="Enter email address"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>PAN Number</label>
                <Input
                  type="text"
                  value={formState.formData.nominee_pan_number}
                  onChange={(e) => handleInputChange('nominee_pan_number', e?.target?.value || '')}
                  placeholder="Enter PAN number"
                />
              </div>
            </div>
              </>
            )}
          </div>
        )}

        {/* Step 7: Bank Details */}
        {currentStep === 7 && (
          <div className="form-section">
            <h5>Bank Details</h5>
            <div className="form-row">
              <div className="form-group">
                <label>Account Type *</label>
                <Select
                  options={[
                    { value: '', label: 'Select Account Type' },
                    { value: 'Savings', label: 'Savings' },
                    { value: 'Current', label: 'Current' },
                    { value: 'Fixed Deposit', label: 'Fixed Deposit' },
                    { value: 'Recurring Deposit', label: 'Recurring Deposit' }
                  ]}
                  value={{ value: formState.formData.account_type, label: formState.formData.account_type || 'Select Account Type' }}
                  onChange={(selectedOption) => handleInputChange('account_type', selectedOption?.value || '')}
                  required
                />
                {formState.errors.account_type && <span className="error-text">{formState.errors.account_type}</span>}
              </div>
              <div className="form-group">
                <label>Bank Name *</label>
                <Input
                  type="text"
                  value={formState.formData.bank_name}
                  onChange={(e) => handleInputChange('bank_name', e?.target?.value || '')}
                  placeholder="Enter bank name"
                  required
                />
                {formState.errors.bank_name && <span className="error-text">{formState.errors.bank_name}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Branch *</label>
                <Input
                  type="text"
                  value={formState.formData.branch}
                  onChange={(e) => handleInputChange('branch', e?.target?.value || '')}
                  placeholder="Enter branch name"
                  required
                />
                {formState.errors.branch && <span className="error-text">{formState.errors.branch}</span>}
              </div>
              <div className="form-group">
                <label>Account Number *</label>
                <Input
                  type="text"
                  value={formState.formData.account_number}
                  onChange={(e) => handleInputChange('account_number', e?.target?.value || '')}
                  placeholder="Enter account number"
                  required
                />
                {formState.errors.account_number && <span className="error-text">{formState.errors.account_number}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>MICR Code</label>
                <Input
                  type="text"
                  value={formState.formData.micr_code}
                  onChange={(e) => handleInputChange('micr_code', e?.target?.value || '')}
                  placeholder="Enter MICR code"
                />
              </div>
              <div className="form-group">
                <label>Preferred Renewal Month</label>
                <Select
                  options={[
                    { value: '', label: 'Select Month' },
                    { value: 'January', label: 'January' },
                    { value: 'February', label: 'February' },
                    { value: 'March', label: 'March' },
                    { value: 'April', label: 'April' },
                    { value: 'May', label: 'May' },
                    { value: 'June', label: 'June' },
                    { value: 'July', label: 'July' },
                    { value: 'August', label: 'August' },
                    { value: 'September', label: 'September' },
                    { value: 'October', label: 'October' },
                    { value: 'November', label: 'November' },
                    { value: 'December', label: 'December' }
                  ]}
                  value={{ value: formState.formData.preferred_renewal_month, label: formState.formData.preferred_renewal_month || 'Select Month' }}
                  onChange={(selectedOption) => handleInputChange('preferred_renewal_month', selectedOption?.value || '')}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 8: Document Upload */}
        {currentStep === 8 && (
          <div className="form-section">
            <h5>Documents</h5>
            
            {documentsLoading && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                Loading existing documents...
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>Upload POLICY DOCUMENT PDF</label>
                <input type="file" name="policy_document" accept="application/pdf" onChange={(e) => handleFileChange('policy_document', e)} />
                {formState.formData.policy_document && (
                  <span style={{ fontSize: "0.9em", color: "#388e3c", marginTop: 4, display: "block" }}>
                    Document selected
                  </span>
                )}
                {initialData && (
                  <div className="document-status">
                    <span className={`status-icon ${getDocumentStatus('Policy Document')}`}>
                      {getDocumentStatus('Policy Document') === 'uploaded' ? '✓' : '✗'}
                    </span>
                    <span className="status-text">
                      {getDocumentStatus('Policy Document') === 'uploaded' ? 'Already uploaded' : 'Not uploaded'}
                    </span>
                    {getDocumentStatus('Policy Document') === 'uploaded' && getDocumentUploadDate('Policy Document') && (
                      <span className="upload-date">
                        Uploaded: {new Date(getDocumentUploadDate('Policy Document')).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Upload IDENTITY DOCUMENT PDF</label>
                <input type="file" name="identity_document" accept="application/pdf" onChange={(e) => handleFileChange('identity_document', e)} />
                {formState.formData.identity_document && (
                  <span style={{ fontSize: "0.9em", color: "#388e3c", marginTop: 4, display: "block" }}>
                    Document selected
                  </span>
                )}
                {initialData && (
                  <div className="document-status">
                    <span className={`status-icon ${getDocumentStatus('Identity Proof')}`}>
                      {getDocumentStatus('Identity Proof') === 'uploaded' ? '✓' : '✗'}
                    </span>
                    <span className="status-text">
                      {getDocumentStatus('Identity Proof') === 'uploaded' ? 'Already uploaded' : 'Not uploaded'}
                    </span>
                    {getDocumentStatus('Identity Proof') === 'uploaded' && getDocumentUploadDate('Identity Proof') && (
                      <span className="upload-date">
                        Uploaded: {new Date(getDocumentUploadDate('Identity Proof')).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Upload ADDRESS PROOF PDF</label>
                <input type="file" name="address_proof" accept="application/pdf" onChange={(e) => handleFileChange('address_proof', e)} />
                {formState.formData.address_proof && (
                  <span style={{ fontSize: "0.9em", color: "#388e3c", marginTop: 4, display: "block" }}>
                    Document selected
                  </span>
                )}
                {initialData && (
                  <div className="document-status">
                    <span className={`status-icon ${getDocumentStatus('Address Proof')}`}>
                      {getDocumentStatus('Address Proof') === 'uploaded' ? '✓' : '✗'}
                    </span>
                    <span className="status-text">
                      {getDocumentStatus('Address Proof') === 'uploaded' ? 'Already uploaded' : 'Not uploaded'}
                    </span>
                    {getDocumentStatus('Address Proof') === 'uploaded' && getDocumentUploadDate('Address Proof') && (
                      <span className="upload-date">
                        Uploaded: {new Date(getDocumentUploadDate('Address Proof')).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Upload MEDICAL CERTIFICATE PDF</label>
                <input type="file" name="medical_certificate" accept="application/pdf" onChange={(e) => handleFileChange('medical_certificate', e)} />
                {formState.formData.medical_certificate && (
                  <span style={{ fontSize: "0.9em", color: "#388e3c", marginTop: 4, display: "block" }}>
                    Document selected
                  </span>
                )}
                {initialData && (
                  <div className="document-status">
                    <span className={`status-icon ${getDocumentStatus('Medical Certificate')}`}>
                      {getDocumentStatus('Medical Certificate') === 'uploaded' ? '✓' : '✗'}
                    </span>
                    <span className="status-text">
                      {getDocumentStatus('Medical Certificate') === 'uploaded' ? 'Already uploaded' : 'Not uploaded'}
                    </span>
                    {getDocumentStatus('Medical Certificate') === 'uploaded' && getDocumentUploadDate('Medical Certificate') && (
                      <span className="upload-date">
                        Uploaded: {new Date(getDocumentUploadDate('Medical Certificate')).toLocaleDateString()}
                      </span>
                    )}
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
                    onChange={(e) => handleCustomDocumentChange(doc.category_id, e)}
                  />
                  {formState.formData[`custom_${doc.category_id}`] && (
                    <span style={{ fontSize: "0.9em", color: "#388e3c", marginTop: 4, display: "block" }}>
                      Document selected
                    </span>
                  )}
                </div>
              </div>
            ))}

            <div className="form-row">
              <Button
                type="button"
                className="btn-blue"
                onClick={() => setShowAddDocumentField(true)}
                style={{ margin: '0 auto' }}
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
                  <div className="form-group" style={{ margin: '0 auto' }}>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                      <Button
                        type="button"
                        className="submit-btn"
                        onClick={handleAddDocumentInline}
                        style={{ height: '36px' }}
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

        <div className="form-actions">
          {currentStep > 1 && (
            <Button
              type="button"
              className="cancel-btn"
              onClick={handleBack}
            >
              Back
            </Button>
          )}
          {currentStep < 8 ? (
            <Button
              type="button"
              className="submit-btn"
              onClick={handleNext}
            >
              Next
            </Button>
          ) : (
            <Button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting}
              onClick={() => console.log('🔍 [BUTTON] Save button clicked')}
            >
              {isSubmitting ? 'Saving...' : (initialData ? 'Update' : 'Save')}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default LifeInsuranceModal;
