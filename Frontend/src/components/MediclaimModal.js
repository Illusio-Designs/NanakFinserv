import React, { useEffect, useState } from 'react';
import Modal from './common/Modal';
import Button from './common/Button';
import Input from './common/Input';
import Select from './common/Select';
import { addMediclaimUser, getAllMediclaimCompany, getAllMediclaimProduct, updateMediclaimUser } from '../serviceAPI/userAPI';
import { useToaster } from './Toaster';
import FlagDropdown from '../pages/Flag';
import config from '../config/apiConfig';

const MediclaimModal = ({ isOpen, onClose, fetchApi, initialData, view }) => {
  const addToast = useToaster();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [companyData, setCompanyData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [productType, setProductType] = useState('');
  const [companyType, setCompanyType] = useState('');
  
  // Document upload states
  const [documentFiles, setDocumentFiles] = useState({});
  const [customDocuments, setCustomDocuments] = useState([]);
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [removedDocuments, setRemovedDocuments] = useState([]); // Track documents marked for removal

  const hasMeaningfulPreviousPolicyPayload = (policy) => {
    if (!policy || typeof policy !== 'object') return false;

    const fieldsToCheck = [
      'PolicyNumber',
      'PolicyFrom',
      'PolicyTo',
      'PolicyIssuedDate',
      'CompanyName',
      'SumInsured',
      'PremiumAmount',
      'NoClaimBonus',
      'RenewDate',
      'PdfFile',
      'PdfFileName',
      'ClaimStatementPDFfile',
      'ClaimStatementPDFfileName',
      'PreviousPolicyNumber',
      'NomineeName',
      'NomineeRelation',
      'NomineeDob',
      'NomineeAge',
      'AddOnCover',
      'ClaimExpireInPolicy',
      'PreviousAgentName',
      'PreviousAgentCode',
      'PreviousAgentContactNumber'
    ];

    return fieldsToCheck.some((field) => {
      const value = policy[field];

      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim() !== '';
      if (typeof value === 'number') return !isNaN(value);
      if (typeof value === 'boolean') return true;
      return !!value;
    });
  };
  const [formState, setFormState] = useState({
    formData: {
      Name: '',
      MobileNumber: '',
      Email: '',
      ReferenceName: '',
      RadioButton: '', // Fresh, Renew, Portability
      policyRadio: '',
      DateOfBirth: '',
      Age: '',
      Gender: '',
      RelationshipWithPolicyHolder: '',
      SumInsured: '',
      NoClaimBonus: '',
      PreExistingIllness: '',
      DateOfJoining: '',

      // Individual Insured Person fields
      InsuredPersonName: '',
      InsuredPersonRelationship: '',
      InsuredPersonDateOfBirth: '',
      InsuredPersonAge: '',
      InsuredPersonGender: '',
      InsuredPersonDateOfJoining: '',
      InsuredPersonPreExistingIllness: '',

      // Running Policy Data
      runningPolicy: {
        Zone: '',
        PolicyNumber: '',
        PolicyTenure: '',
        PremiumAmount: '',
        ClaimExpireInPolicy: '',
        NomineeName: '',
        NomineeRelation: '',
        NomineeAge: '',
        NomineeDob: '',
        PolicyTo: '',
        PolicyFrom: '',
        PolicyPlanType: '',
        PreviousPolicyFlag: '',
        AddOnCover: '',
        ExpiryDate: '',
        CurrentPolicyFile: '',
        PolicyIssuedDate: '',
      },

      // Previous Policy Data (For Renewals and Portability)
      previousPolicy: {
        PolicyTo: '',
        PolicyFrom: '',
        Zone: '',
        RenewDate: '',
        PolicyNumber: '',
        PolicyTenure: '',
        PremiumAmount: '',
        SumInsured: '',
        NoClaimBonus: '',
        NomineeName: '',
        NomineeRelation: '',
        NomineeDob: '',
        NomineeAge: '',
        PdfFile: '',
        PdfFileName: '',
        ClaimExpireInPolicy: '',
        PreviousPolicyNumber: '',
        CompanyName: '',
        ClaimStatementPDFfile: '',
        ClaimStatementPDFfileName: '',
        PreviousAgentName: '',
        PreviousAgentCode: '',
        PreviousAgentContactNumber: '',
      },

      // Last Policy Data (Historical Reference)
      AgentName: '',
      AgentCode: '',
      AgentContactNumber: '',
      ProductName: '',
      CompanyName: '',
      
      // Document file names
      AadharFileName: '',
      PanFileName: '',
      GstFileName: '',
    },
    familyMembers: [
      {
        DateOfBirth: '',
        Age: '',
        Gender: '',
        RelationshipWithPolicyHolder: '',
        FamilyName: '',
        DateOfJoining: '',
        PreExistingIllness: '',
      },
    ],
    employees: [
      {
        DateOfBirth: '',
        Age: '',
        Gender: '',
        RelationshipWithPolicyHolder: '',
        EmployeeName: '',
        DateOfJoining: '',
        PreExistingIllness: '',
      },
    ],
    errors: {},
  });

  // useEffect(() => {
  //   console.log('🔍 [MEDICLAIM MODAL] initialData received:', initialData);
  //   if (initialData && initialData.id) {
  //     // Initialize form with existing data for edit mode
  //     const familyMembers = initialData.familymembers?.map(item => ({
  //       DateOfBirth: item.DateOfBirth ? item.DateOfBirth.slice(0, 10) : "",
  //       Age: item.Age || 0,
  //       Gender: item.Gender || "",
  //       RelationshipWithPolicyHolder: item.RelationshipWithPolicyHolder || "",
  //       FamilyName: item.FamilyName || "",
  //       DateOfJoining: item.DateOfJoining ? item.DateOfJoining.slice(0, 10) : "",
  //       PreExistingIllness: item.PreExistingIllness || "",
  //     })) || [];

  //     const employees = initialData.employees?.map(item => ({
  //       DateOfBirth: item.DateOfBirth ? item.DateOfBirth.slice(0, 10) : "",
  //       Age: item.Age || 0,
  //       Gender: item.Gender || "",
  //       RelationshipWithPolicyHolder: item.RelationshipWithPolicyHolder || "",
  //       EmployeeName: item.EmployeeName || "",
  //       DateOfJoining: item.DateOfJoining ? item.DateOfJoining.slice(0, 10) : "",
  //       PreExistingIllness: item.PreExistingIllness || "",
  //     })) || [];

  //     const {
  //       medicliam_type,
  //       medicliam_policy_type,
  //       dob,
  //       age,
  //       gender,
  //       relationshipWithPolicyHolder,
  //       sumInsured,
  //       noClaimBonus,
  //       preExistingIllness,
  //       nomineeName,
  //       previousPolicy,
  //       agentName,
  //       agentCode,
  //       agentContactNumber,
  //       mediclaim_product_id,
  //       mediclaim_company_id,
  //       runningPolicy,
  //       // Individual Insured Person fields
  //       insuredPersonName,
  //       insuredPersonRelationship,
  //       insuredPersonDateOfBirth,
  //       insuredPersonAge,
  //       insuredPersonGender,
  //       insuredPersonDateOfJoining,
  //       insuredPersonPreExistingIllness
  //     } = initialData;

  //     // Check if this is a renewal BEFORE setting form state
  //     let isRenew = localStorage.getItem('isRenew') || '';
  //     let MediclaimID = localStorage.getItem('MediclaimID') || '';
      
  //     console.log('🔍 [MEDICLAIM MODAL] Checking renewal flags:', { isRenew, MediclaimID });
  //     console.log('🔍 [MEDICLAIM MODAL] Initial runningPolicy:', runningPolicy);
  //     console.log('🔍 [MEDICLAIM MODAL] Initial previousPolicy:', previousPolicy);
      
  //     let finalRunningPolicy = runningPolicy;
  //     let finalPreviousPolicy = previousPolicy;
  //     let finalPolicyType = medicliam_policy_type;
      
  //     if (isRenew && MediclaimID) {
  //       console.log('🔄 [MEDICLAIM RENEWAL] Processing renewal - moving running policy to previous policy');
  //       console.log('🔄 [MEDICLAIM RENEWAL] Current running policy:', runningPolicy);
        
  //       // Move current running policy to previous policy
  //       finalPreviousPolicy = {
  //         PolicyNumber: runningPolicy?.PolicyNumber || '',
  //         Zone: runningPolicy?.Zone || '',
  //         PolicyTenure: runningPolicy?.PolicyTenure || '',
  //         PremiumAmount: runningPolicy?.PremiumAmount || '',
  //         SumInsured: sumInsured || '',
  //         NoClaimBonus: noClaimBonus || '',
  //         NomineeName: runningPolicy?.NomineeName || '',
  //         NomineeRelation: runningPolicy?.NomineeRelation || '',
  //         NomineeAge: runningPolicy?.NomineeAge || '',
  //         NomineeDob: runningPolicy?.NomineeDob || '',
  //         PolicyFrom: runningPolicy?.PolicyFrom || '',
  //         PolicyTo: runningPolicy?.PolicyTo || '',
  //         PolicyIssuedDate: runningPolicy?.PolicyIssuedDate || '',
  //         ExpiryDate: runningPolicy?.ExpiryDate || '',
  //         PolicyPlanType: runningPolicy?.PolicyPlanType || '',
  //         AddOnCover: runningPolicy?.AddOnCover || '',
  //         PdfFile: runningPolicy?.CurrentPolicyFile || '',
  //         PdfFileName: runningPolicy?.CurrentPolicyFile || '',
  //         RenewDate: new Date().toISOString().split('T')[0], // ✅ Set to today's date for renewal
  //         ClaimExpireInPolicy: runningPolicy?.ClaimExpireInPolicy || '', // ✅ Transfer from running policy
  //         PreviousPolicyNumber: runningPolicy?.PolicyNumber || '', // ✅ Set to current policy number
  //         CompanyName: mediclaim_company_id || '',
  //         mediclaim_product_id: mediclaim_product_id || '', // ✅ Transfer product selection
  //         ClaimStatementPDFfile: '',
  //         ClaimStatementPDFfileName: '',
  //         PreviousAgentName: '',
  //         PreviousAgentCode: '',
  //         PreviousAgentContactNumber: '',
  //       };
        
  //       // Reset running policy for new entry
  //       finalRunningPolicy = {
  //         Zone: '',
  //         PolicyNumber: '',
  //         PolicyTenure: '',
  //         PremiumAmount: '',
  //         AddOnCover: '',
  //         NomineeName: '',
  //         NomineeRelation: '',
  //         PolicyPlanType: '',
  //         NomineeAge: '',
  //         NomineeDob: '',
  //         PolicyIssuedDate: '',
  //         ExpiryDate: '',
  //         PreviousPolicyFlag: '',
  //         PolicyFrom: '',
  //         PolicyTo: '',
  //         CurrentPolicyFile: '',
  //         CurrentPolicyFileName: '',
  //       };
        
  //       // Set policy type to Renewal
  //       finalPolicyType = medicliam_policy_type == 'Fresh' ? "Renewal" : medicliam_policy_type == 'Renewal' ? "Renewal" : "Portability";
        
  //       console.log('🔄 [MEDICLAIM RENEWAL] Updated previous policy:', finalPreviousPolicy);
  //       console.log('🔄 [MEDICLAIM RENEWAL] Reset running policy:', finalRunningPolicy);
  //       console.log('🔄 [MEDICLAIM RENEWAL] Claim Expiry transferred:', finalPreviousPolicy.ClaimExpireInPolicy);
  //       console.log('🔄 [MEDICLAIM RENEWAL] Product ID transferred:', finalPreviousPolicy.mediclaim_product_id);
  //       console.log('🔄 [MEDICLAIM RENEWAL] Renew Date set:', finalPreviousPolicy.RenewDate);
  //       console.log('🔄 [MEDICLAIM RENEWAL] Previous Policy Number set:', finalPreviousPolicy.PreviousPolicyNumber);
        
  //       // Don't reset productType - keep it for the previous policy
  //       // setProductType(''); // ❌ This was clearing the product selection
        
  //       // Clear renewal flags
  //       setTimeout(() => {
  //         localStorage.removeItem('isRenew');
  //         localStorage.removeItem('MediclaimID');
  //         console.log('🔄 [MEDICLAIM RENEWAL] Cleanup complete - removed renewal flags from localStorage');
  //       }, 1000);
  //     }

  //     setFormState({
  //       formData: {
  //         Name: initialData.user?.username || initialData.displayName || '',
  //         MobileNumber: initialData.user?.mobileNumber || initialData.displayMobile || '',
  //         Email: initialData.user?.email || initialData.displayEmail || '',
  //         ReferenceName: initialData.referenceName || initialData.displayReference || '',
  //         RadioButton: medicliam_type || '',
  //         policyRadio: finalPolicyType || '',
  //         DateOfBirth: dob ? dob.slice(0, 10) : '',
  //         Age: age || 0,
  //         Gender: gender || '',
  //         RelationshipWithPolicyHolder: relationshipWithPolicyHolder || '',
  //         SumInsured: sumInsured || '',
  //         NoClaimBonus: noClaimBonus || '',
  //         PreExistingIllness: preExistingIllness || '',
  //         NomineeName: nomineeName || '',
          
  //         // Individual Insured Person fields
  //         InsuredPersonName: insuredPersonName || '',
  //         InsuredPersonRelationship: insuredPersonRelationship || '',
  //         InsuredPersonDateOfBirth: insuredPersonDateOfBirth ? insuredPersonDateOfBirth.slice(0, 10) : '',
  //         InsuredPersonAge: insuredPersonAge || 0,
  //         InsuredPersonGender: insuredPersonGender || '',
  //         InsuredPersonDateOfJoining: insuredPersonDateOfJoining ? insuredPersonDateOfJoining.slice(0, 10) : '',
  //         InsuredPersonPreExistingIllness: insuredPersonPreExistingIllness || '',

  //         runningPolicy: {
  //           Zone: finalRunningPolicy?.Zone || '',
  //           PolicyNumber: finalRunningPolicy?.PolicyNumber || '',
  //           PolicyTenure: finalRunningPolicy?.PolicyTenure,
  //           PremiumAmount: finalRunningPolicy?.PremiumAmount,
  //           AddOnCover: finalRunningPolicy?.AddOnCover || '',
  //           NomineeName: finalRunningPolicy?.NomineeName || '',
  //           NomineeRelation: finalRunningPolicy?.NomineeRelation || '',
  //           PolicyPlanType: finalRunningPolicy?.PolicyPlanType || '',
  //           NomineeAge: finalRunningPolicy?.NomineeAge,
  //           NomineeDob: finalRunningPolicy?.NomineeDob && finalRunningPolicy?.NomineeDob.slice(0, 10) || '',
  //           PolicyIssuedDate: finalRunningPolicy?.PolicyIssuedDate && finalRunningPolicy?.PolicyIssuedDate.slice(0, 10) || '',
  //           ExpiryDate: finalRunningPolicy?.ExpiryDate && finalRunningPolicy?.ExpiryDate.slice(0, 10) || '',
  //           PreviousPolicyFlag: finalRunningPolicy?.PreviousPolicyFlag && finalRunningPolicy?.PreviousPolicyFlag || '',
  //           PolicyFrom: finalRunningPolicy?.PolicyFrom ? finalRunningPolicy?.PolicyFrom.slice(0, 10) : '',
  //           PolicyTo: finalRunningPolicy?.PolicyTo ? finalRunningPolicy?.PolicyTo.slice(0, 10) : '',
  //           CurrentPolicyFile: finalRunningPolicy?.CurrentPolicyFile || '',
  //           CurrentPolicyFileName: finalRunningPolicy?.CurrentPolicyFile || '',
  //         },

  //         previousPolicy: {
  //           Zone: finalPreviousPolicy?.Zone || '',
  //           PolicyNumber: finalPreviousPolicy?.PolicyNumber || '',
  //           PolicyFrom: finalPreviousPolicy?.PolicyFrom ? finalPreviousPolicy?.PolicyFrom.slice(0, 10) : '',
  //           PolicyTo: finalPreviousPolicy?.PolicyTo ? finalPreviousPolicy?.PolicyTo.slice(0, 10) : '',
  //           RenewDate: finalPreviousPolicy?.RenewDate ? finalPreviousPolicy?.RenewDate.slice(0, 10) : '',
  //           PolicyTenure: finalPreviousPolicy?.PolicyTenure || '',
  //           PremiumAmount: finalPreviousPolicy?.PremiumAmount || '',
  //           SumInsured: finalPreviousPolicy?.SumInsured || '',
  //           NoClaimBonus: finalPreviousPolicy?.NoClaimBonus || '',
  //           PdfFile: finalPreviousPolicy?.PdfFile || '',
  //           PdfFileName: finalPreviousPolicy?.PdfFileName || '',
  //           ClaimStatementPDFfile: finalPreviousPolicy?.ClaimStatementPDFfile || '',
  //           ClaimStatementPDFfileName: finalPreviousPolicy?.ClaimStatementPDFfileName || '',
  //           ClaimExpireInPolicy: finalPreviousPolicy?.ClaimExpireInPolicy || '',
  //           NomineeName: finalPreviousPolicy?.NomineeName || '',
  //           NomineeRelation: finalPreviousPolicy?.NomineeRelation || '',
  //           PreviousPolicyNumber: finalPreviousPolicy?.PreviousPolicyNumber || '',
  //           CompanyName: finalPreviousPolicy?.CompanyName || '',
  //           NomineeAge: finalPreviousPolicy?.NomineeAge,
  //           NomineeDob: finalPreviousPolicy?.NomineeDob && finalPreviousPolicy?.NomineeDob.slice(0, 10) || '',
  //           PreviousAgentName: finalPreviousPolicy?.PreviousAgentName || '',
  //           PreviousAgentCode: finalPreviousPolicy?.PreviousAgentCode || '',
  //           PreviousAgentContactNumber: finalPreviousPolicy?.PreviousAgentContactNumber || '',
  //         },
  //         AgentName: agentName || '',
  //         AgentCode: agentCode || '',
  //         AgentContactNumber: agentContactNumber || '',
  //         ProductName: mediclaim_product_id || '',
  //         CompanyName: mediclaim_company_id || '',
          
  //         // Document file names
  //         AadharFileName: initialData.AadharFileName || '',
  //         PanFileName: initialData.PanFileName || '',
  //         GstFileName: initialData.GstFileName || '',
  //       },
  //       familyMembers,
  //       employees,
  //     });
      
  //     // Load custom documents if any
  //     if (initialData.customDocuments && initialData.customDocuments.length > 0) {
  //       setCustomDocuments(initialData.customDocuments);
  //     }
      
  //     // Reset removed documents tracking
  //     setRemovedDocuments([]);

  //     console.log('🔍 [MEDICLAIM MODAL] Setting company type:', initialData.mediclaim_company_id);
  //     setCompanyType(initialData.mediclaim_company_id || '');
  //     if (initialData.mediclaim_company_id) {
  //       console.log('🔍 [MEDICLAIM MODAL] Loading products for company:', initialData.mediclaim_company_id);
  //       getProductData(initialData.mediclaim_company_id);
  //       if (initialData?.previousPolicy?.mediclaim_product_id) {
  //         setProductType(initialData?.previousPolicy?.mediclaim_product_id);
  //       }
  //     }
  //   }
  // }, [initialData]);

 
 
 
 // Update the useEffect to handle product selection for previous policy
// Replace the existing useEffect around line 200-400
useEffect(() => {
  console.log('🔍 [MEDICLAIM MODAL] initialData received:', initialData);
  if (initialData && initialData.id) {
    // Initialize form with existing data for edit mode
    const familyMembers = initialData.familymembers?.map(item => ({
      DateOfBirth: item.DateOfBirth ? item.DateOfBirth.slice(0, 10) : "",
      Age: item.Age || 0,
      Gender: item.Gender || "",
      RelationshipWithPolicyHolder: item.RelationshipWithPolicyHolder || "",
      FamilyName: item.FamilyName || "",
      DateOfJoining: item.DateOfJoining ? item.DateOfJoining.slice(0, 10) : "",
      PreExistingIllness: item.PreExistingIllness || "",
    })) || [];

    const employees = initialData.employees?.map(item => ({
      DateOfBirth: item.DateOfBirth ? item.DateOfBirth.slice(0, 10) : "",
      Age: item.Age || 0,
      Gender: item.Gender || "",
      RelationshipWithPolicyHolder: item.RelationshipWithPolicyHolder || "",
      EmployeeName: item.EmployeeName || "",
      DateOfJoining: item.DateOfJoining ? item.DateOfJoining.slice(0, 10) : "",
      PreExistingIllness: item.PreExistingIllness || "",
    })) || [];

    const {
      medicliam_type,
      medicliam_policy_type,
      dob,
      age,
      gender,
      relationshipWithPolicyHolder,
      sumInsured,
      noClaimBonus,
      preExistingIllness,
      nomineeName,
      previousPolicy,
      agentName,
      agentCode,
      agentContactNumber,
      mediclaim_product_id,
      mediclaim_company_id,
      runningPolicy,
      insuredPersonName,
      insuredPersonRelationship,
      insuredPersonDateOfBirth,
      insuredPersonAge,
      insuredPersonGender,
      insuredPersonDateOfJoining,
      insuredPersonPreExistingIllness
    } = initialData;

    // Check if this is a renewal BEFORE setting form state
    let isRenew = localStorage.getItem('isRenew') || '';
    let MediclaimID = localStorage.getItem('MediclaimID') || '';
    
    console.log('🔍 [MEDICLAIM MODAL] Checking renewal flags:', { isRenew, MediclaimID });
    console.log('🔍 [MEDICLAIM MODAL] Initial runningPolicy:', runningPolicy);
    console.log('🔍 [MEDICLAIM MODAL] Initial previousPolicy:', previousPolicy);
    console.log('🔍 [MEDICLAIM MODAL] Current product ID:', mediclaim_product_id);
    
    let finalRunningPolicy = runningPolicy;
    let finalPreviousPolicy = previousPolicy;
    let finalPolicyType = medicliam_policy_type;
    let previousPolicyProductId = previousPolicy?.mediclaim_product_id || null;
    let runningPolicyProductId = null; // ✅ Default to null for renewal
    
    if (isRenew && MediclaimID) {
      console.log('🔄 [MEDICLAIM RENEWAL] Processing renewal - moving running policy to previous policy');
      console.log('🔄 [MEDICLAIM RENEWAL] Current running policy:', runningPolicy);
      console.log('🔄 [MEDICLAIM RENEWAL] Transferring product ID:', mediclaim_product_id);
      
      // Move current running policy to previous policy
      finalPreviousPolicy = {
        PolicyNumber: runningPolicy?.PolicyNumber || '',
        Zone: runningPolicy?.Zone || '',
        PolicyTenure: runningPolicy?.PolicyTenure || '',
        PremiumAmount: runningPolicy?.PremiumAmount || '',
        SumInsured: sumInsured || '',
        NoClaimBonus: noClaimBonus || '',
        NomineeName: runningPolicy?.NomineeName || '',
        NomineeRelation: runningPolicy?.NomineeRelation || '',
        NomineeAge: runningPolicy?.NomineeAge || '',
        NomineeDob: runningPolicy?.NomineeDob || '',
        PolicyFrom: runningPolicy?.PolicyFrom || '',
        PolicyTo: runningPolicy?.PolicyTo || '',
        PolicyIssuedDate: runningPolicy?.PolicyIssuedDate || '',
        ExpiryDate: runningPolicy?.ExpiryDate || '',
        PolicyPlanType: runningPolicy?.PolicyPlanType || '',
        AddOnCover: runningPolicy?.AddOnCover || '',
        PdfFile: runningPolicy?.CurrentPolicyFile || '',
        PdfFileName: runningPolicy?.CurrentPolicyFile || '',
        RenewDate: new Date().toISOString().split('T')[0],
        ClaimExpireInPolicy: runningPolicy?.ClaimExpireInPolicy || '',
        PreviousPolicyNumber: runningPolicy?.PolicyNumber || '',
        CompanyName: mediclaim_company_id || '',
        mediclaim_product_id: mediclaim_product_id || '', // ✅ Transfer product ID to previous policy
        ClaimStatementPDFfile: '',
        ClaimStatementPDFfileName: '',
        PreviousAgentName: '',
        PreviousAgentCode: '',
        PreviousAgentContactNumber: '',
      };
      
      // ✅ Set previous policy product ID for renewal
      previousPolicyProductId = mediclaim_product_id;
      
      // ✅ KEEP runningPolicyProductId as null (empty) for renewal
      runningPolicyProductId = null;
      
      // Reset running policy for new entry
      finalRunningPolicy = {
        Zone: '',
        PolicyNumber: '',
        PolicyTenure: '',
        PremiumAmount: '',
        AddOnCover: '',
        NomineeName: '',
        NomineeRelation: '',
        PolicyPlanType: '',
        NomineeAge: '',
        NomineeDob: '',
        PolicyIssuedDate: '',
        ExpiryDate: '',
        PreviousPolicyFlag: '',
        PolicyFrom: '',
        PolicyTo: '',
        CurrentPolicyFile: '',
        CurrentPolicyFileName: '',
      };
      
      // Set policy type to Renewal
      finalPolicyType = medicliam_policy_type == 'Fresh' ? "Renewal" : medicliam_policy_type == 'Renewal' ? "Renewal" : "Portability";
      
      console.log('🔄 [MEDICLAIM RENEWAL] Updated previous policy:', finalPreviousPolicy);
      console.log('🔄 [MEDICLAIM RENEWAL] Reset running policy:', finalRunningPolicy);
      console.log('🔄 [MEDICLAIM RENEWAL] Previous policy product ID:', previousPolicyProductId);
      console.log('🔄 [MEDICLAIM RENEWAL] Running policy product ID (should be null):', runningPolicyProductId);
      
      // Clear renewal flags
      setTimeout(() => {
        localStorage.removeItem('isRenew');
        localStorage.removeItem('MediclaimID');
        console.log('🔄 [MEDICLAIM RENEWAL] Cleanup complete - removed renewal flags from localStorage');
      }, 1000);
    } else {
      // ✅ For non-renewal cases, keep the existing product
      runningPolicyProductId = mediclaim_product_id;
    }

    setFormState({
      formData: {
        Name: initialData.user?.username || initialData.displayName || '',
        MobileNumber: initialData.user?.mobileNumber || initialData.displayMobile || '',
        Email: initialData.user?.email || initialData.displayEmail || '',
        ReferenceName: initialData.referenceName || initialData.displayReference || '',
        RadioButton: medicliam_type || '',
        policyRadio: finalPolicyType || '',
        DateOfBirth: dob ? dob.slice(0, 10) : '',
        Age: age || 0,
        Gender: gender || '',
        RelationshipWithPolicyHolder: relationshipWithPolicyHolder || '',
        SumInsured: sumInsured || '',
        NoClaimBonus: noClaimBonus || '',
        PreExistingIllness: preExistingIllness || '',
        NomineeName: nomineeName || '',
        
        InsuredPersonName: insuredPersonName || '',
        InsuredPersonRelationship: insuredPersonRelationship || '',
        InsuredPersonDateOfBirth: insuredPersonDateOfBirth ? insuredPersonDateOfBirth.slice(0, 10) : '',
        InsuredPersonAge: insuredPersonAge || 0,
        InsuredPersonGender: insuredPersonGender || '',
        InsuredPersonDateOfJoining: insuredPersonDateOfJoining ? insuredPersonDateOfJoining.slice(0, 10) : '',
        InsuredPersonPreExistingIllness: insuredPersonPreExistingIllness || '',

        runningPolicy: {
          Zone: finalRunningPolicy?.Zone || '',
          PolicyNumber: finalRunningPolicy?.PolicyNumber || '',
          PolicyTenure: finalRunningPolicy?.PolicyTenure,
          PremiumAmount: finalRunningPolicy?.PremiumAmount,
          ClaimExpireInPolicy: finalRunningPolicy?.ClaimExpireInPolicy || '',
          AddOnCover: finalRunningPolicy?.AddOnCover || '',
          NomineeName: finalRunningPolicy?.NomineeName || '',
          NomineeRelation: finalRunningPolicy?.NomineeRelation || '',
          PolicyPlanType: finalRunningPolicy?.PolicyPlanType || '',
          NomineeAge: finalRunningPolicy?.NomineeAge,
          NomineeDob: finalRunningPolicy?.NomineeDob && finalRunningPolicy?.NomineeDob.slice(0, 10) || '',
          PolicyIssuedDate: finalRunningPolicy?.PolicyIssuedDate && finalRunningPolicy?.PolicyIssuedDate.slice(0, 10) || '',
          ExpiryDate: finalRunningPolicy?.ExpiryDate && finalRunningPolicy?.ExpiryDate.slice(0, 10) || '',
          PreviousPolicyFlag: finalRunningPolicy?.PreviousPolicyFlag && finalRunningPolicy?.PreviousPolicyFlag || '',
          PolicyFrom: finalRunningPolicy?.PolicyFrom ? finalRunningPolicy?.PolicyFrom.slice(0, 10) : '',
          PolicyTo: finalRunningPolicy?.PolicyTo ? finalRunningPolicy?.PolicyTo.slice(0, 10) : '',
          CurrentPolicyFile: finalRunningPolicy?.CurrentPolicyFile || '',
          CurrentPolicyFileName: finalRunningPolicy?.CurrentPolicyFile || '',
        },

        previousPolicy: {
          Zone: finalPreviousPolicy?.Zone || '',
          PolicyNumber: finalPreviousPolicy?.PolicyNumber || '',
          PolicyFrom: finalPreviousPolicy?.PolicyFrom ? finalPreviousPolicy?.PolicyFrom.slice(0, 10) : '',
          PolicyTo: finalPreviousPolicy?.PolicyTo ? finalPreviousPolicy?.PolicyTo.slice(0, 10) : '',
          RenewDate: finalPreviousPolicy?.RenewDate ? finalPreviousPolicy?.RenewDate.slice(0, 10) : '',
          PolicyTenure: finalPreviousPolicy?.PolicyTenure || '',
          PremiumAmount: finalPreviousPolicy?.PremiumAmount || '',
          SumInsured: finalPreviousPolicy?.SumInsured || '',
          NoClaimBonus: finalPreviousPolicy?.NoClaimBonus || '',
          PdfFile: finalPreviousPolicy?.PdfFile || '',
          PdfFileName: finalPreviousPolicy?.PdfFileName || '',
          ClaimStatementPDFfile: finalPreviousPolicy?.ClaimStatementPDFfile || '',
          ClaimStatementPDFfileName: finalPreviousPolicy?.ClaimStatementPDFfileName || '',
          ClaimExpireInPolicy: finalPreviousPolicy?.ClaimExpireInPolicy || '',
          NomineeName: finalPreviousPolicy?.NomineeName || '',
          NomineeRelation: finalPreviousPolicy?.NomineeRelation || '',
          PreviousPolicyNumber: finalPreviousPolicy?.PreviousPolicyNumber || '',
          CompanyName: finalPreviousPolicy?.CompanyName || '',
          mediclaim_product_id: previousPolicyProductId, // ✅ Store product ID in previous policy
          NomineeAge: finalPreviousPolicy?.NomineeAge,
          NomineeDob: finalPreviousPolicy?.NomineeDob && finalPreviousPolicy?.NomineeDob.slice(0, 10) || '',
          PreviousAgentName: finalPreviousPolicy?.PreviousAgentName || '',
          PreviousAgentCode: finalPreviousPolicy?.PreviousAgentCode || '',
          PreviousAgentContactNumber: finalPreviousPolicy?.PreviousAgentContactNumber || '',
        },
        AgentName: agentName || '',
        AgentCode: agentCode || '',
        AgentContactNumber: agentContactNumber || '',
        ProductName: runningPolicyProductId || '', // ✅ Use the correct product for running policy (empty for renewal)
        CompanyName: mediclaim_company_id || '',
        
        AadharFileName: initialData.AadharFileName || '',
        PanFileName: initialData.PanFileName || '',
        GstFileName: initialData.GstFileName || '',
      },
      familyMembers,
      employees,
    });
    
    // Load custom documents if any
    if (initialData.customDocuments && initialData.customDocuments.length > 0) {
      setCustomDocuments(initialData.customDocuments);
    }
    
    // Reset removed documents tracking
    setRemovedDocuments([]);

    console.log('🔍 [MEDICLAIM MODAL] Setting company type:', initialData.mediclaim_company_id);
    setCompanyType(initialData.mediclaim_company_id || '');
    
    if (initialData.mediclaim_company_id) {
      console.log('🔍 [MEDICLAIM MODAL] Loading products for company:', initialData.mediclaim_company_id);
      getProductData(initialData.mediclaim_company_id);
      
      // ✅ For renewal cases, DON'T set productType (keep it empty for running policy)
      if (isRenew && MediclaimID) {
        console.log('🔄 [MEDICLAIM MODAL] Renewal case - keeping product empty for running policy');
        setProductType(''); // ✅ Keep empty for running policy during renewal
      } else if (previousPolicyProductId) {
        console.log('🔄 [MEDICLAIM MODAL] Setting product type for previous policy:', previousPolicyProductId);
        setProductType(previousPolicyProductId);
      } else if (mediclaim_product_id) {
        // Fallback to main product ID for non-renewal cases
        console.log('🔄 [MEDICLAIM MODAL] Setting product type for running policy:', mediclaim_product_id);
        setProductType(mediclaim_product_id);
      }
    }
  }
}, [initialData]);
 
  useEffect(() => {
    getCompanyData();
  }, []);

  const getCompanyData = async () => {
    console.log('🔍 [MEDICLAIM MODAL] Fetching company data...');
    const roleData = await getAllMediclaimCompany();
    console.log('🔍 [MEDICLAIM MODAL] Company data response:', roleData);
    if (roleData?.data && roleData?.data?.length) {
      setCompanyData(roleData?.data);
      console.log('🔍 [MEDICLAIM MODAL] Company data set:', roleData?.data);
    }
  };

  const getProductData = async (id) => {
    console.log('🔍 [MEDICLAIM MODAL] Fetching product data for company:', id);
    let obj = {
      mediclaim_company_id: id
    };
    const roleData = await getAllMediclaimProduct(obj);
    console.log('🔍 [MEDICLAIM MODAL] Product data response:', roleData);
    if (roleData?.data && roleData?.data?.length) {
      setProductData(roleData?.data);
      console.log('🔍 [MEDICLAIM MODAL] Product data set:', roleData?.data);
    } else {
      setProductData([]);
      console.log('🔍 [MEDICLAIM MODAL] No product data found');
    }
  };

  const handleNext = () => {
    console.log('🔍 [NEXT] Next button clicked, current step:', currentStep);
    console.log('🔍 [NEXT] View mode:', view);
    
    if (view) {
      if (currentStep < 7) {
        if (currentStep === 4 && (formState?.formData?.policyRadio === 'Fresh' && (formState.formData?.runningPolicy?.PreviousPolicyFlag == '' || formState.formData?.runningPolicy?.PreviousPolicyFlag === "No"))) {
          console.log('🔍 [NEXT] Skipping step 5, going directly to step 6');
          setCurrentStep(6);
        } else {
          console.log('🔍 [NEXT] Going to next step:', currentStep + 1);
          setCurrentStep(currentStep + 1);
        }
      } else {
        console.log('🔍 [NEXT] Already at final step, cannot go further');
      }
    } else {
      if (currentStep < 7) {
        if (currentStep === 4 && (formState?.formData?.policyRadio === 'Fresh' && (formState.formData?.runningPolicy?.PreviousPolicyFlag == '' || formState.formData?.runningPolicy?.PreviousPolicyFlag === "No"))) {
          console.log('🔍 [NEXT] Skipping step 5, going directly to step 6');
          setCurrentStep(6);
        } else {
          console.log('🔍 [NEXT] Going to next step:', currentStep + 1);
          setCurrentStep(currentStep + 1);
        }
      } else {
        console.log('🔍 [NEXT] Already at final step, cannot go further');
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      if (currentStep === 6 && (formState?.formData?.policyRadio === 'Fresh' && (formState.formData?.runningPolicy?.PreviousPolicyFlag == '' || formState.formData?.runningPolicy?.PreviousPolicyFlag === "No"))) {
        setCurrentStep(4);
      } else if (currentStep === 5 && (formState?.formData?.policyRadio === 'Fresh' && (formState.formData?.runningPolicy?.PreviousPolicyFlag == '' || formState.formData?.runningPolicy?.PreviousPolicyFlag === "No"))) {
        setCurrentStep(3);
      } else {
        setCurrentStep(currentStep - 1);
      }
    }
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   console.log('🔍 [SUBMIT] Form submission triggered, current step:', currentStep);
    
  //   if (isSubmitting) {
  //     console.log('🔍 [SUBMIT] Already submitting, returning');
  //     return;
  //   }

  //   if (currentStep !== 6) {
  //     console.log('🔍 [SUBMIT] Not on final step, returning');
  //     return;
  //   }

  //   console.log('🔍 [SUBMIT] Starting submission process...');
  //   setIsSubmitting(true);
    
  //   try {
  //     const formDataPDF = new FormData();
  //     if (formState?.formData?.runningPolicy?.CurrentPolicyFile) {
  //       formDataPDF.append('CurrentPolicyFile', formState?.formData?.runningPolicy?.CurrentPolicyFile);
  //     }
  //     if (formState?.formData?.previousPolicy?.ClaimStatementPDFfile && formState?.formData?.previousPolicy?.ClaimExpireInPolicy === 'Yes') {
  //       formDataPDF.append('ClaimStatementPDFfile', formState?.formData?.previousPolicy?.ClaimStatementPDFfile);
  //     }
  //     if (formState?.formData?.previousPolicy?.PdfFile) {
  //       formDataPDF.append('PdfFile', formState?.formData?.previousPolicy?.PdfFile);
  //     }
      
  //     // Add document files
  //     if (documentFiles.aadhar) {
  //       formDataPDF.append('aadhar', documentFiles.aadhar);
  //     }
  //     if (documentFiles.pan) {
  //       formDataPDF.append('pan', documentFiles.pan);
  //     }
  //     if (documentFiles.gst) {
  //       formDataPDF.append('gst', documentFiles.gst);
  //     }
      
  //     // Add custom documents
  //     customDocuments.forEach((doc, idx) => {
  //       if (doc.file) {
  //         formDataPDF.append(`customDocument_${idx}`, doc.file);
  //       }
  //     });

  //     // Create a clean payload without File objects (they're sent separately in FormData)
  //     const cleanRunningPolicy = { ...formState.formData.runningPolicy };
  //     const cleanPreviousPolicy = { ...formState.formData.previousPolicy };
      
  //     // Remove File objects from running policy (keep only strings for existing files)
  //     if (cleanRunningPolicy.CurrentPolicyFile && typeof cleanRunningPolicy.CurrentPolicyFile === 'object') {
  //       delete cleanRunningPolicy.CurrentPolicyFile;
  //       delete cleanRunningPolicy.CurrentPolicyFileName;
  //     }
      
  //     // Remove File objects from previous policy (keep only strings for existing files)
  //     if (cleanPreviousPolicy.PdfFile && typeof cleanPreviousPolicy.PdfFile === 'object') {
  //       delete cleanPreviousPolicy.PdfFile;
  //       delete cleanPreviousPolicy.PdfFileName;
  //     }
  //     if (cleanPreviousPolicy.ClaimStatementPDFfile && typeof cleanPreviousPolicy.ClaimStatementPDFfile === 'object') {
  //       delete cleanPreviousPolicy.ClaimStatementPDFfile;
  //       delete cleanPreviousPolicy.ClaimStatementPDFfileName;
  //     }

  //     const shouldIncludePreviousPolicy = hasMeaningfulPreviousPolicyPayload(cleanPreviousPolicy);

  //     const payload = {
  //       ...formState.formData,
  //       runningPolicy: cleanRunningPolicy,
  //       previousPolicy: shouldIncludePreviousPolicy ? cleanPreviousPolicy : null,
  //       familyMembers: formState.familyMembers,
  //       employees: formState.employees,
  //       ProductName: productType,
  //       CompanyName: companyType,
  //       customDocuments: customDocuments.map(doc => ({ name: doc.name })),
  //       removedDocuments: removedDocuments, // Include list of documents to remove
  //     };

  //     console.log('🔍 [SUBMIT] Payload prepared:', payload);
  //     console.log('🔍 [SUBMIT] Documents to remove:', removedDocuments);

  //     let response;
  //     if (initialData && initialData.id) {
  //       payload.user_id = initialData.user_id;
  //       payload.id = initialData.id;
  //       formDataPDF.append("data", JSON.stringify(payload));
  //       console.log('🔍 [SUBMIT] Updating existing mediclaim with ID:', payload.id);
  //       response = await updateMediclaimUser(formDataPDF, payload.id, addToast);
  //     } else {
  //       formDataPDF.append("data", JSON.stringify(payload));
  //       console.log('🔍 [SUBMIT] Creating new mediclaim');
  //       response = await addMediclaimUser(formDataPDF, addToast);
  //     }

  //     console.log('🔍 [SUBMIT] API response:', response);

  //     if (response.status) {
  //       console.log('🔍 [SUBMIT] Success! Closing modal and refreshing data');
  //       fetchApi();
  //       onClose();
  //     } else {
  //       console.log('🔍 [SUBMIT] API returned error status');
  //     }
  //   } catch (error) {
  //     console.error('🔍 [SUBMIT] Error during submission:', error);
  //   } finally {
  //     console.log('🔍 [SUBMIT] Setting isSubmitting to false');
  //     setIsSubmitting(false);
  //   }
  // };




  // Update the handleSubmit function to properly handle previous policy product
// Replace your existing handleSubmit function

// const handleSubmit = async (e) => {
//   e.preventDefault();
//   console.log('🔍 [SUBMIT] Form submission triggered, current step:', currentStep);
  
//   if (isSubmitting) {
//     console.log('🔍 [SUBMIT] Already submitting, returning');
//     return;
//   }

//   if (currentStep !== 6) {
//     console.log('🔍 [SUBMIT] Not on final step, returning');
//     return;
//   }

//   console.log('🔍 [SUBMIT] Starting submission process...');
//   setIsSubmitting(true);
  
//   try {
//     const formDataPDF = new FormData();
//     if (formState?.formData?.runningPolicy?.CurrentPolicyFile) {
//       formDataPDF.append('CurrentPolicyFile', formState?.formData?.runningPolicy?.CurrentPolicyFile);
//     }
//     if (formState?.formData?.previousPolicy?.ClaimStatementPDFfile && formState?.formData?.previousPolicy?.ClaimExpireInPolicy === 'Yes') {
//       formDataPDF.append('ClaimStatementPDFfile', formState?.formData?.previousPolicy?.ClaimStatementPDFfile);
//     }
//     if (formState?.formData?.previousPolicy?.PdfFile) {
//       formDataPDF.append('PdfFile', formState?.formData?.previousPolicy?.PdfFile);
//     }
    
//     // Add document files
//     if (documentFiles.aadhar) {
//       formDataPDF.append('aadhar', documentFiles.aadhar);
//     }
//     if (documentFiles.pan) {
//       formDataPDF.append('pan', documentFiles.pan);
//     }
//     if (documentFiles.gst) {
//       formDataPDF.append('gst', documentFiles.gst);
//     }
    
//     // Add custom documents
//     customDocuments.forEach((doc, idx) => {
//       if (doc.file) {
//         formDataPDF.append(`customDocument_${idx}`, doc.file);
//       }
//     });

//     // Create a clean payload without File objects (they're sent separately in FormData)
//     const cleanRunningPolicy = { ...formState.formData.runningPolicy };
//     const cleanPreviousPolicy = { ...formState.formData.previousPolicy };
    
//     // Remove File objects from running policy (keep only strings for existing files)
//     if (cleanRunningPolicy.CurrentPolicyFile && typeof cleanRunningPolicy.CurrentPolicyFile === 'object') {
//       delete cleanRunningPolicy.CurrentPolicyFile;
//       delete cleanRunningPolicy.CurrentPolicyFileName;
//     }
    
//     // Remove File objects from previous policy (keep only strings for existing files)
//     if (cleanPreviousPolicy.PdfFile && typeof cleanPreviousPolicy.PdfFile === 'object') {
//       delete cleanPreviousPolicy.PdfFile;
//       delete cleanPreviousPolicy.PdfFileName;
//     }
//     if (cleanPreviousPolicy.ClaimStatementPDFfile && typeof cleanPreviousPolicy.ClaimStatementPDFfile === 'object') {
//       delete cleanPreviousPolicy.ClaimStatementPDFfile;
//       delete cleanPreviousPolicy.ClaimStatementPDFfileName;
//     }

//     const shouldIncludePreviousPolicy = hasMeaningfulPreviousPolicyPayload(cleanPreviousPolicy);

//     // ✅ Determine which product to use based on policy type
//     let productToSubmit = productType;
    
//     // For Fresh policy: use running policy product (productType)
//     // For Renewal/Portability: use previous policy product if available
//     if ((formState.formData.policyRadio === 'Renewal' || formState.formData.policyRadio === 'Portability') 
//         && cleanPreviousPolicy.mediclaim_product_id) {
//       productToSubmit = cleanPreviousPolicy.mediclaim_product_id;
//       console.log('🔍 [SUBMIT] Using previous policy product:', productToSubmit);
//     }

//     const payload = {
//       ...formState.formData,
//       runningPolicy: cleanRunningPolicy,
//       previousPolicy: shouldIncludePreviousPolicy ? cleanPreviousPolicy : null,
//       familyMembers: formState.familyMembers,
//       employees: formState.employees,
//       ProductName: productToSubmit, // ✅ Use the correct product based on policy type
//       CompanyName: companyType,
//       customDocuments: customDocuments.map(doc => ({ name: doc.name })),
//       removedDocuments: removedDocuments,
//     };

//     console.log('🔍 [SUBMIT] Payload prepared:', payload);
//     console.log('🔍 [SUBMIT] Product being submitted:', productToSubmit);
//     console.log('🔍 [SUBMIT] Documents to remove:', removedDocuments);

//     let response;
//     if (initialData && initialData.id) {
//       payload.user_id = initialData.user_id;
//       payload.id = initialData.id;
//       formDataPDF.append("data", JSON.stringify(payload));
//       console.log('🔍 [SUBMIT] Updating existing mediclaim with ID:', payload.id);
//       response = await updateMediclaimUser(formDataPDF, payload.id, addToast);
//     } else {
//       formDataPDF.append("data", JSON.stringify(payload));
//       console.log('🔍 [SUBMIT] Creating new mediclaim');
//       response = await addMediclaimUser(formDataPDF, addToast);
//     }

//     console.log('🔍 [SUBMIT] API response:', response);

//     if (response.status) {
//       console.log('🔍 [SUBMIT] Success! Closing modal and refreshing data');
//       fetchApi();
//       onClose();
//     } else {
//       console.log('🔍 [SUBMIT] API returned error status');
//     }
//   } catch (error) {
//     console.error('🔍 [SUBMIT] Error during submission:', error);
//   } finally {
//     console.log('🔍 [SUBMIT] Setting isSubmitting to false');
//     setIsSubmitting(false);
//   }
// };


const handleSubmit = async (e) => {
  e.preventDefault();
  console.log('🔍 [SUBMIT] Form submission triggered, current step:', currentStep);
  
  if (isSubmitting) {
    console.log('🔍 [SUBMIT] Already submitting, returning');
    return;
  }

  if (currentStep !== 6) {
    console.log('🔍 [SUBMIT] Not on final step, returning');
    return;
  }

  console.log('🔍 [SUBMIT] Starting submission process...');
  setIsSubmitting(true);
  
  try {
    const formDataPDF = new FormData();
    if (formState?.formData?.runningPolicy?.CurrentPolicyFile) {
      formDataPDF.append('CurrentPolicyFile', formState?.formData?.runningPolicy?.CurrentPolicyFile);
    }
    if (formState?.formData?.previousPolicy?.ClaimStatementPDFfile && formState?.formData?.previousPolicy?.ClaimExpireInPolicy === 'Yes') {
      formDataPDF.append('ClaimStatementPDFfile', formState?.formData?.previousPolicy?.ClaimStatementPDFfile);
    }
    if (formState?.formData?.previousPolicy?.PdfFile) {
      formDataPDF.append('PdfFile', formState?.formData?.previousPolicy?.PdfFile);
    }
    
    // Add document files
    if (documentFiles.aadhar) {
      formDataPDF.append('aadhar', documentFiles.aadhar);
    }
    if (documentFiles.pan) {
      formDataPDF.append('pan', documentFiles.pan);
    }
    if (documentFiles.gst) {
      formDataPDF.append('gst', documentFiles.gst);
    }
    
    // Add custom documents
    customDocuments.forEach((doc, idx) => {
      if (doc.file) {
        formDataPDF.append(`customDocument_${idx}`, doc.file);
      }
    });

    // Create a clean payload without File objects (they're sent separately in FormData)
    const cleanRunningPolicy = { ...formState.formData.runningPolicy };
    const cleanPreviousPolicy = { ...formState.formData.previousPolicy };
    
    // Remove File objects from running policy (keep only strings for existing files)
    if (cleanRunningPolicy.CurrentPolicyFile && typeof cleanRunningPolicy.CurrentPolicyFile === 'object') {
      delete cleanRunningPolicy.CurrentPolicyFile;
      delete cleanRunningPolicy.CurrentPolicyFileName;
    }
    
    // Remove File objects from previous policy (keep only strings for existing files)
    if (cleanPreviousPolicy.PdfFile && typeof cleanPreviousPolicy.PdfFile === 'object') {
      delete cleanPreviousPolicy.PdfFile;
      delete cleanPreviousPolicy.PdfFileName;
    }
    if (cleanPreviousPolicy.ClaimStatementPDFfile && typeof cleanPreviousPolicy.ClaimStatementPDFfile === 'object') {
      delete cleanPreviousPolicy.ClaimStatementPDFfile;
      delete cleanPreviousPolicy.ClaimStatementPDFfileName;
    }

    const shouldIncludePreviousPolicy = hasMeaningfulPreviousPolicyPayload(cleanPreviousPolicy);

    // ✅ FIX: Determine which product to use based on policy type
    let productToSubmit;
    
    if (formState.formData.policyRadio === 'Fresh') {
      // For Fresh policy: use the product selected in running policy (Step 4)
      productToSubmit = formState.formData.ProductName;
      console.log('🔍 [SUBMIT] Fresh policy - using running policy product:', productToSubmit);
    } else if ((formState.formData.policyRadio === 'Renewal' || formState.formData.policyRadio === 'Portability') 
        && cleanPreviousPolicy.mediclaim_product_id) {
      // For Renewal/Portability: use previous policy product
      productToSubmit = cleanPreviousPolicy.mediclaim_product_id;
      console.log('🔍 [SUBMIT] Renewal/Portability - using previous policy product:', productToSubmit);
    } else {
      // Fallback to productType state or ProductName
      productToSubmit = formState.formData.ProductName || productType;
      console.log('🔍 [SUBMIT] Fallback - using product:', productToSubmit);
    }

    const payload = {
      ...formState.formData,
      runningPolicy: cleanRunningPolicy,
      previousPolicy: shouldIncludePreviousPolicy ? cleanPreviousPolicy : null,
      familyMembers: formState.familyMembers,
      employees: formState.employees,
      ProductName: productToSubmit, // ✅ Use the correctly determined product
      CompanyName: companyType,
      customDocuments: customDocuments.map(doc => ({ name: doc.name })),
      removedDocuments: removedDocuments,
    };

    console.log('🔍 [SUBMIT] Payload prepared:', payload);
    console.log('🔍 [SUBMIT] Product being submitted:', productToSubmit);
    console.log('🔍 [SUBMIT] Documents to remove:', removedDocuments);

    let response;
    if (initialData && initialData.id) {
      payload.user_id = initialData.user_id;
      payload.id = initialData.id;
      formDataPDF.append("data", JSON.stringify(payload));
      console.log('🔍 [SUBMIT] Updating existing mediclaim with ID:', payload.id);
      response = await updateMediclaimUser(formDataPDF, payload.id, addToast);
    } else {
      formDataPDF.append("data", JSON.stringify(payload));
      console.log('🔍 [SUBMIT] Creating new mediclaim');
      response = await addMediclaimUser(formDataPDF, addToast);
    }

    console.log('🔍 [SUBMIT] API response:', response);

    if (response.status) {
      console.log('🔍 [SUBMIT] Success! Closing modal and refreshing data');
      fetchApi();
      onClose();
    } else {
      console.log('🔍 [SUBMIT] API returned error status');
    }
  } catch (error) {
    console.error('🔍 [SUBMIT] Error during submission:', error);
  } finally {
    console.log('🔍 [SUBMIT] Setting isSubmitting to false');
    setIsSubmitting(false);
  }
};
  const calculateAge = (dob) => {
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
      
      return age > 0 ? age : '';
    } catch (error) {
      console.error('Error calculating age:', error);
      return '';
    }
  };

  const handleDateChange = (e) => {
    const dateOfBirth = e.target.value;
    const age = calculateAge(dateOfBirth);
    console.log('Mediclaim - Date changed:', dateOfBirth, 'Calculated age:', age);
    setFormState(prevState => ({
      ...prevState,
      formData: {
        ...prevState.formData,
        DateOfBirth: dateOfBirth,
        Age: age
      }
    }));
  };

  const handleInputChange = (field, value) => {
    setFormState(prevState => ({
      ...prevState,
      formData: {
        ...prevState.formData,
        [field]: value
      }
    }));
  };

  // Handle relationship change - auto-fill when SELF is selected
  const handleRelationshipChange = (value) => {
    setFormState(prevState => ({
      ...prevState,
      formData: {
        ...prevState.formData,
        RelationshipWithPolicyHolder: value
      }
    }));
    
    // Only auto-fill when SELF is entered - for other relationships, user fills manually
    // The Insured Person Details will show the same data only when SELF is selected
  };

  // Handle insured person date of birth change and calculate age
  const handleInsuredPersonDateChange = (e) => {
    const dateOfBirth = e.target.value;
    const age = calculateAge(dateOfBirth);
    
    setFormState(prevState => ({
      ...prevState,
      formData: {
        ...prevState.formData,
        InsuredPersonDateOfBirth: dateOfBirth,
        InsuredPersonAge: age
      }
    }));
  };

  // Handle insured person date of joining change
  const handleInsuredPersonDateOfJoiningChange = (e) => {
    const dateOfJoining = e.target.value;
    
    setFormState(prevState => ({
      ...prevState,
      formData: {
        ...prevState.formData,
        InsuredPersonDateOfJoining: dateOfJoining
      }
    }));
  };

  // Handle family member input changes
  const handleFamilyMemberChange = (index, field, value) => {
    setFormState(prevState => {
      const updatedFamilyMembers = [...prevState.familyMembers];
      updatedFamilyMembers[index] = {
        ...updatedFamilyMembers[index],
        [field]: value
      };
      
      // Auto-calculate age when date of birth changes
      if (field === 'DateOfBirth') {
        const calculatedAge = calculateAge(value);
        updatedFamilyMembers[index].Age = calculatedAge;
      }
      
      return {
        ...prevState,
        familyMembers: updatedFamilyMembers
      };
    });
  };

  // Handle employee input changes
  const handleEmployeeChange = (index, field, value) => {
    setFormState(prevState => {
      const updatedEmployees = [...prevState.employees];
      updatedEmployees[index] = {
        ...updatedEmployees[index],
        [field]: value
      };
      
      // Auto-calculate age when date of birth changes
      if (field === 'DateOfBirth') {
        const calculatedAge = calculateAge(value);
        updatedEmployees[index].Age = calculatedAge;
      }
      
      return {
        ...prevState,
        employees: updatedEmployees
      };
    });
  };

  // Add new family member
  const addFamilyMember = () => {
    setFormState(prevState => ({
      ...prevState,
      familyMembers: [
        ...prevState.familyMembers,
        {
          DateOfBirth: '',
          Age: '',
          Gender: '',
          RelationshipWithPolicyHolder: '',
          FamilyName: '',
          DateOfJoining: '',
          PreExistingIllness: '',
        }
      ]
    }));
  };

  // Remove family member
  const removeFamilyMember = (index) => {
    setFormState(prevState => ({
      ...prevState,
      familyMembers: prevState.familyMembers.filter((_, i) => i !== index)
    }));
  };

  // Add new employee
  const addEmployee = () => {
    setFormState(prevState => ({
      ...prevState,
      employees: [
        ...prevState.employees,
        {
          DateOfBirth: '',
          Age: '',
          Gender: '',
          RelationshipWithPolicyHolder: '',
          EmployeeName: '',
          DateOfJoining: '',
          PreExistingIllness: '',
        }
      ]
    }));
  };

  // Remove employee
  const removeEmployee = (index) => {
    setFormState(prevState => ({
      ...prevState,
      employees: prevState.employees.filter((_, i) => i !== index)
    }));
  };

  const handleRunningPolicyChange = (field, value) => {
    setFormState(prevState => {
      let updatedRunningPolicy = {
        ...prevState.formData.runningPolicy,
        [field]: value
      };

      // Auto-calculate expiry date when PolicyTo changes
      if (field === 'PolicyTo') {
        updatedRunningPolicy.ExpiryDate = value;
      }

      // Auto-calculate nominee age when NomineeDob changes
      if (field === 'NomineeDob') {
        const calculatedAge = calculateAge(value);
        updatedRunningPolicy.NomineeAge = calculatedAge;
      }

      return {
        ...prevState,
        formData: {
          ...prevState.formData,
          runningPolicy: updatedRunningPolicy
        }
      };
    });
  };

  const handlePreviousPolicyChange = (field, value) => {
    setFormState(prevState => {
      let updatedPreviousPolicy = {
        ...prevState.formData.previousPolicy,
        [field]: value
      };

      // Auto-calculate nominee age when NomineeDob changes
      if (field === 'NomineeDob') {
        const calculatedAge = calculateAge(value);
        updatedPreviousPolicy.NomineeAge = calculatedAge;
      }

      return {
        ...prevState,
        formData: {
          ...prevState.formData,
          previousPolicy: updatedPreviousPolicy
        }
      };
    });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];
    
    if (!file) return;
    
    if (file.type !== "application/pdf") {
      alert("Please upload a valid PDF file.");
      return;
    }
    
    // Handle document uploads (aadhar, pan, gst)
    if (name === 'aadhar' || name === 'pan' || name === 'gst') {
      setDocumentFiles(prev => ({ ...prev, [name]: file }));
      return;
    }
    
    // Handle running policy file
    if (name === 'CurrentPolicyFile' || !name) {
      setFormState(prevState => ({
        ...prevState,
        formData: {
          ...prevState.formData,
          runningPolicy: {
            ...prevState.formData?.runningPolicy,
            CurrentPolicyFile: file,
            CurrentPolicyFileName: file.name,
          },
        },
      }));
    }
  };

  // Function to clear a specific file input
  const clearFileInput = (inputName) => {
    const input = document.querySelector(`input[name="${inputName}"]`);
    if (input) {
      input.value = '';
    }
  };

  // Function to clear all file inputs
  const clearAllFileInputs = () => {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
      input.value = '';
    });
  };

  // Document upload functions
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
    if (file && file.type === "application/pdf") {
      setCustomDocuments(prev => prev.map((doc, i) => i === idx ? { ...doc, file } : doc));
    } else if (file) {
      alert("Please upload a valid PDF file.");
    }
  };

  const handleCompanyChange = (e) => {
    setCompanyType(e.target.value);
    getProductData(e.target.value);
  };

  const handlePolicyTypeChange = (e) => {
    const newPolicyType = e.target.value;
    console.log('🔄 [POLICY TYPE CHANGE] Changing policy type from', formState.formData.policyRadio, 'to', newPolicyType);
    
    setFormState(prevState => {
      let updatedPreviousPolicy = { ...prevState.formData.previousPolicy };
      let updatedRunningPolicy = { ...prevState.formData.runningPolicy };

      // When changing from Fresh to Renewal/Portability, move running policy to previous
      if (initialData?.medicliam_policy_type === 'Fresh' && (newPolicyType === 'Renewal' || newPolicyType === "Portability")) {
        console.log('🔄 [POLICY TYPE CHANGE] Moving running policy to previous policy (Fresh -> Renewal/Portability)');
        updatedPreviousPolicy = {
          PolicyNumber: prevState.formData.runningPolicy.PolicyNumber || '',
          Zone: prevState.formData.runningPolicy.Zone || '',
          PolicyTenure: prevState.formData.runningPolicy.PolicyTenure || '',
          PremiumAmount: prevState.formData.runningPolicy.PremiumAmount || '',
          SumInsured: prevState.formData.sumInsured || '',
          NoClaimBonus: prevState.formData.noClaimBonus || '',
          NomineeName: prevState.formData.runningPolicy.NomineeName || '',
          NomineeRelation: prevState.formData.runningPolicy.NomineeRelation || '',
          NomineeAge: prevState.formData.runningPolicy.NomineeAge || '',
          NomineeDob: prevState.formData.runningPolicy.NomineeDob || '',
          PolicyFrom: prevState.formData.runningPolicy.PolicyFrom || '',
          PolicyTo: prevState.formData.runningPolicy.PolicyTo || '',
          PolicyIssuedDate: prevState.formData.runningPolicy.PolicyIssuedDate || '',
          ExpiryDate: prevState.formData.runningPolicy.ExpiryDate || '',
          PolicyPlanType: prevState.formData.runningPolicy.PolicyPlanType || '',
          AddOnCover: prevState.formData.runningPolicy.AddOnCover || '',
          PdfFile: prevState.formData.runningPolicy.CurrentPolicyFile || '',
          PdfFileName: prevState.formData.runningPolicy.CurrentPolicyFile || '',
          RenewDate: new Date().toISOString().split('T')[0], // ✅ Set to today's date for renewal
          ClaimExpireInPolicy: prevState.formData.runningPolicy.ClaimExpireInPolicy || '', // ✅ Transfer from running policy
          PreviousPolicyNumber: prevState.formData.runningPolicy.PolicyNumber || '', // ✅ Set to current policy number
          CompanyName: prevState.formData.CompanyName || '',
          mediclaim_product_id: prevState.formData.ProductName || '', // ✅ Transfer product selection
          ClaimStatementPDFfile: '',
          ClaimStatementPDFfileName: '',
        };
        
        // Clear running policy for new entry
        updatedRunningPolicy = {
          Zone: '',
          PolicyNumber: '',
          PolicyTenure: '',
          PremiumAmount: '',
          ClaimExpireInPolicy: '',
          AddOnCover: '',
          NomineeName: '',
          NomineeRelation: '',
          PolicyPlanType: '',
          NomineeAge: '',
          NomineeDob: '',
          PolicyIssuedDate: '',
          ExpiryDate: '',
          PreviousPolicyFlag: '',
          PolicyFrom: '',
          PolicyTo: '',
          CurrentPolicyFile: '',
          CurrentPolicyFileName: '',
        };
        
        setProductType('');
        console.log('🔄 [POLICY TYPE CHANGE] Running policy cleared, previous policy updated');
      }
      
      // When changing to Fresh, clear previous policy
      if (newPolicyType === 'Fresh') {
        console.log('🔄 [POLICY TYPE CHANGE] Clearing previous policy (changing to Fresh)');
        updatedPreviousPolicy = {
          PolicyNumber: '',
          Zone: '',
          PolicyTenure: '',
          PremiumAmount: '',
          SumInsured: '',
          NoClaimBonus: '',
          NomineeName: '',
          NomineeRelation: '',
          NomineeAge: '',
          NomineeDob: '',
          PolicyFrom: '',
          PolicyTo: '',
          PolicyIssuedDate: '',
          ExpiryDate: '',
          PolicyPlanType: '',
          AddOnCover: '',
          PdfFile: '',
          PdfFileName: '',
          RenewDate: '',
          ClaimExpireInPolicy: '',
          PreviousPolicyNumber: '',
          CompanyName: '',
          ClaimStatementPDFfile: '',
          ClaimStatementPDFfileName: '',
          PreviousAgentName: '',
          PreviousAgentCode: '',
          PreviousAgentContactNumber: '',
        };
      }

      return {
        ...prevState,
        formData: {
          ...prevState.formData,
          policyRadio: newPolicyType,
          previousPolicy: updatedPreviousPolicy,
          runningPolicy: updatedRunningPolicy
        }
      };
    });
  };

  if (!isOpen) return null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Mediclaim' : 'Add New Mediclaim'}
    >
      <form onSubmit={handleSubmit} className="consumer-form" noValidate>
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="form-section">
            <h5>Consumer Information</h5>
            
            {/* Row 1: Proposer Name & Email */}
            <div className="form-row">
              <div className="form-group">
                <label>Proposer Name *</label>
                <Input
                  type="text"
                  value={formState.formData.Name}
                  onChange={(e) => handleInputChange('Name', e.target.value)}
                  placeholder="Enter full name"
                  required
                  disabled={view}
                />
              </div>
              <div className="form-group">
                <label>Mail ID *</label>
                <Input
                  type="email"
                  value={formState.formData.Email}
                  onChange={(e) => handleInputChange('Email', e.target.value)}
                  placeholder="Enter email address"
                  required
                  disabled={view}
                />
              </div>
            </div>

            {/* Row 2: Mobile Number */}
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
                    value={formState.formData.MobileNumber} 
                    className="form-control mobile" 
                    onChange={(e) => handleInputChange('MobileNumber', e.target.value)} 
                    placeholder="Enter mobile number" 
                    required
                    maxLength="10"
                    disabled={view}
                  />
                </div>
              </div>
            </div>

            {/* Row 3: Policy Member (full width) */}
            <div className="form-row">
              <div className="form-group">
                <label>Policy Member *</label>
                <div className="radio-group">
                  <label>
                    <input
                      type="radio"
                      name="RadioButton"
                      value="Family"
                      checked={formState.formData.RadioButton === 'Family'}
                      onChange={(e) => handleInputChange('RadioButton', e.target.value)}
                      required
                      disabled={view}
                    />
                    <span>Family</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="RadioButton"
                      value="Individual"
                      checked={formState.formData.RadioButton === 'Individual'}
                      onChange={(e) => handleInputChange('RadioButton', e.target.value)}
                      disabled={view}
                    />
                    <span>Individual</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="RadioButton"
                      value="Employee"
                      checked={formState.formData.RadioButton === 'Employee'}
                      onChange={(e) => handleInputChange('RadioButton', e.target.value)}
                      disabled={view}
                    />
                    <span>Employee</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Row 4: Policy Type (full width) */}
            <div className="form-row">
              <div className="form-group">
                <label>Policy Type *</label>
                <div className="radio-group">
                  <label>
                    <input
                      type="radio"
                      name="policyRadio"
                      value="Fresh"
                      checked={formState.formData.policyRadio === 'Fresh'}
                      onChange={handlePolicyTypeChange}
                      required
                      disabled={view}
                    />
                    <span>Fresh</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="policyRadio"
                      value="Renewal"
                      checked={formState.formData.policyRadio === 'Renewal'}
                      onChange={handlePolicyTypeChange}
                      disabled={view}
                    />
                    <span>Renewal</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="policyRadio"
                      value="Portability"
                      checked={formState.formData.policyRadio === 'Portability'}
                      onChange={handlePolicyTypeChange}
                      disabled={view}
                    />
                    <span>Portability</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Row 5: Reference Name & Company Name */}
            <div className="form-row">
              <div className="form-group">
                <label>Reference Name</label>
                <Input
                  type="text"
                  value={formState.formData.ReferenceName}
                  onChange={(e) => handleInputChange('ReferenceName', e.target.value)}
                  placeholder="Enter reference name"
                  disabled={view}
                />
              </div>
              <div className="form-group">
                <label>Company Name *</label>
                <Select
                  options={companyData && companyData.map((item) => ({
                    value: item.mediclaim_company_id,
                    label: item.mediclaim_company_name
                  }))}
                  value={companyData && companyData.find(item => item.mediclaim_company_id === companyType) ? 
                    { value: companyType, label: companyData.find(item => item.mediclaim_company_id === companyType).mediclaim_company_name } : null}
                  onChange={(option) => handleCompanyChange({ target: { value: option ? option.value : '' } })}
                  placeholder="Select Company"
                  isClearable
                  isDisabled={view}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Documents */}
        {currentStep === 2 && (
          <div className="form-section">
            <h5>Documents</h5>
            <div className="documents-row" style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label><b>Upload AADHAR CARD PDF</b></label>
                  <input type="file" name="aadhar" accept="application/pdf" onChange={handleFileChange} />
                  {documentFiles.aadhar && (
                    <span style={{ fontSize: "0.9em", color: "#1976d2", marginTop: 4, display: "block" }}>
                      Selected: {documentFiles.aadhar.name}
                    </span>
                  )}
                  {!documentFiles.aadhar && formState.formData.AadharFileName && (
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
                        ✓ Stored: {formState.formData.AadharFileName}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => window.open(`${config.API_URL}/user/download/${formState.formData.AadharFileName}`, '_blank')}
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
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
                        >
                          📥 Download
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to remove this document?')) {
                              // Mark for removal
                              setRemovedDocuments(prev => [...prev, 'aadhar']);
                              // Clear from display
                              setFormState(prev => ({
                                ...prev,
                                formData: { ...prev.formData, AadharFileName: '' }
                              }));
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
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c62828'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#d32f2f'}
                        >
                          🗑️ Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label><b>Upload PAN CARD PDF</b></label>
                  <input type="file" name="pan" accept="application/pdf" onChange={handleFileChange} />
                  {documentFiles.pan && (
                    <span style={{ fontSize: "0.9em", color: "#1976d2", marginTop: 4, display: "block" }}>
                      Selected: {documentFiles.pan.name}
                    </span>
                  )}
                  {!documentFiles.pan && formState.formData.PanFileName && (
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
                        ✓ Stored: {formState.formData.PanFileName}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => window.open(`${config.API_URL}/user/download/${formState.formData.PanFileName}`, '_blank')}
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
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
                        >
                          📥 Download
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to remove this document?')) {
                              // Mark for removal
                              setRemovedDocuments(prev => [...prev, 'pan']);
                              // Clear from display
                              setFormState(prev => ({
                                ...prev,
                                formData: { ...prev.formData, PanFileName: '' }
                              }));
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
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c62828'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#d32f2f'}
                        >
                          🗑️ Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label><b>Upload GST PDF</b></label>
                  <input type="file" name="gst" accept="application/pdf" onChange={handleFileChange} />
                  {documentFiles.gst && (
                    <span style={{ fontSize: "0.9em", color: "#1976d2", marginTop: 4, display: "block" }}>
                      Selected: {documentFiles.gst.name}
                    </span>
                  )}
                  {!documentFiles.gst && formState.formData.GstFileName && (
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
                        ✓ Stored: {formState.formData.GstFileName}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => window.open(`${config.API_URL}/user/download/${formState.formData.GstFileName}`, '_blank')}
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
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
                        >
                          📥 Download
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to remove this document?')) {
                              // Mark for removal
                              setRemovedDocuments(prev => [...prev, 'gst']);
                              // Clear from display
                              setFormState(prev => ({
                                ...prev,
                                formData: { ...prev.formData, GstFileName: '' }
                              }));
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
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c62828'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#d32f2f'}
                        >
                          🗑️ Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {customDocuments.map((doc, idx) => (
                  <div className="form-group" style={{ marginBottom: '20px' }} key={idx}>
                    <label><b>Upload {doc.name} PDF</b></label>
                    <input type="file" accept="application/pdf" onChange={e => handleCustomFileChange(e, idx)} />
                    {doc.file && (
                      <span style={{ fontSize: "0.9em", color: "#1976d2", marginTop: 4, display: "block" }}>
                        Selected: {doc.file.name}
                      </span>
                    )}
                  </div>
                ))}
                {!showCategoryInput && (
                  <div className="button-group" style={{ marginTop: '8px' }}>
                    <Button 
                      type="button"
                      onClick={handleAddDocument}
                      style={{ backgroundColor: '#1976d2', color: 'white' }}
                    >
                      Add Document
                    </Button>
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                {showCategoryInput && (
                  <div className="form-group" style={{ marginTop: 0 }}>
                    <label><b>Category Name</b></label>
                    <Input
                      type="text"
                      value={newCategoryName}
                      onChange={e => setNewCategoryName(e.target.value)}
                      placeholder="Enter new category name"
                    />
                    <div className="button-group" style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                      <Button 
                        type="button"
                        onClick={handleSaveCategory}
                        style={{ backgroundColor: '#1976d2', color: 'white' }}
                      >
                        Save
                      </Button>
                      <Button 
                        type="button"
                        onClick={() => { setShowCategoryInput(false); setNewCategoryName(''); }}
                        style={{ backgroundColor: '#757575', color: 'white' }}
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Running Policy Details */}
        {currentStep === 4 && (
          <div className="form-section">
            <h5>Running Policy Details</h5>
            <div className="form-row">
              <div className="form-group">
                <label>Policy Number</label>
                <Input
                  type="text"
                  value={formState.formData.runningPolicy.PolicyNumber}
                  onChange={(e) => handleRunningPolicyChange('PolicyNumber', e.target.value)}
                  placeholder="Enter policy number"
                />
              </div>
              <div className="form-group">
                <label>Zone</label>
                <Input
                  type="text"
                  value={formState.formData.runningPolicy.Zone}
                  onChange={(e) => handleRunningPolicyChange('Zone', e.target.value)}
                  placeholder="Enter zone"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Policy Tenure</label>
                <Input
                  type="number"
                  value={formState.formData.runningPolicy.PolicyTenure}
                  onChange={(e) => handleRunningPolicyChange('PolicyTenure', e.target.value)}
                  placeholder="Enter policy tenure"
                />
              </div>
              <div className="form-group">
                <label>Premium Amount</label>
                <Input
                  type="number"
                  value={formState.formData.runningPolicy.PremiumAmount}
                  onChange={(e) => handleRunningPolicyChange('PremiumAmount', e.target.value)}
                  placeholder="Enter premium amount"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Policy From</label>
                <Input
                  type="date"
                  value={formState.formData.runningPolicy.PolicyFrom}
                  onChange={(e) => handleRunningPolicyChange('PolicyFrom', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Policy To</label>
                <Input
                  type="date"
                  value={formState.formData.runningPolicy.PolicyTo}
                  onChange={(e) => handleRunningPolicyChange('PolicyTo', e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Policy Issued Date</label>
                <Input
                  type="date"
                  value={formState.formData.runningPolicy.PolicyIssuedDate}
                  onChange={(e) => handleRunningPolicyChange('PolicyIssuedDate', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Expiry Date</label>
                <Input
                  type="date"
                  value={formState.formData.runningPolicy.ExpiryDate}
                  onChange={(e) => handleRunningPolicyChange('ExpiryDate', e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Policy Plan Type</label>
                <Input
                  type="text"
                  value={formState.formData.runningPolicy.PolicyPlanType}
                  onChange={(e) => handleRunningPolicyChange('PolicyPlanType', e.target.value)}
                  placeholder="Enter policy plan type"
                />
              </div>
              <div className="form-group">
                <label>Add On Cover</label>
                <Input
                  type="text"
                  value={formState.formData.runningPolicy.AddOnCover}
                  onChange={(e) => handleRunningPolicyChange('AddOnCover', e.target.value)}
                  placeholder="Enter add on cover"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Nominee Name</label>
                <Input
                  type="text"
                  value={formState.formData.runningPolicy.NomineeName}
                  onChange={(e) => handleRunningPolicyChange('NomineeName', e.target.value)}
                  placeholder="Enter nominee name"
                />
              </div>
              <div className="form-group">
                <label>Nominee Relation</label>
                <Input
                  type="text"
                  value={formState.formData.runningPolicy.NomineeRelation}
                  onChange={(e) => handleRunningPolicyChange('NomineeRelation', e.target.value)}
                  placeholder="Enter nominee relation"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Nominee DOB</label>
                <Input
                  type="date"
                  value={formState.formData.runningPolicy.NomineeDob}
                  onChange={(e) => handleRunningPolicyChange('NomineeDob', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Nominee Age</label>
                <Input
                  type="number"
                  value={formState.formData.runningPolicy.NomineeAge}
                  disabled
                />
              </div>
            </div>
            {(formState.formData.policyRadio === 'Fresh' || formState.formData.policyRadio === 'Renewal') && (
              <div className="form-row">
                <div className="form-group">
                  <label>Claim Expire in Policy</label>
                  <select
                    value={formState.formData.runningPolicy.ClaimExpireInPolicy || ""}
                    onChange={(e) => handleRunningPolicyChange('ClaimExpireInPolicy', e.target.value)}
                    className="form-select"
                    disabled={view}
                  >
                    <option value="" disabled>Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
            )}
{/* 
            {formState.formData.policyRadio === 'Fresh' && (
              <div className="form-row">
                <div className="form-group">
                  <label>Do you have previous policy?</label>
                  <select
                    value={formState.formData.runningPolicy.PreviousPolicyFlag || ""}
                    onChange={(e) => handleRunningPolicyChange('PreviousPolicyFlag', e.target.value)}
                    className="form-select"
                  >
                    <option value="" disabled>Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
            )} */}
{formState.formData.policyRadio === "Fresh" && (
  <div className="form-row">
    <div className="form-group">
      <label>Select Product</label>
      <select
        value={formState.formData.ProductName || ""}
        onChange={(e) => handleInputChange('ProductName', e.target.value)}
        className="form-select"
        disabled={view}
      >
        <option value="" disabled hidden>Select Product</option>
        {productData && productData.map((item) => (
          <option key={item.mediclaim_product_id} value={item.mediclaim_product_id}>
            {item.mediclaim_product_name}
          </option>
        ))}
      </select>
    </div>
  </div>
)}

            <div className="form-row">
              <div className="form-group">
                <label>Upload Running Policy PDF</label>
                <Input
                  type="file"
                  name="CurrentPolicyFile"
                  accept="application/pdf"
                  onChange={handleFileChange}
                />
                
                {/* Show current file if uploaded */}
                {formState.formData.runningPolicy?.CurrentPolicyFile && typeof formState.formData.runningPolicy.CurrentPolicyFile === 'object' && (
                  <div style={{ fontSize: "0.9em", marginTop: 4, display: "block", color: "#388e3c" }}>
                    <strong>Selected file:</strong> {formState.formData.runningPolicy.CurrentPolicyFile.name}
                    <button 
                      type="button" 
                      onClick={() => {
                        setFormState(prev => ({
                          ...prev,
                          formData: {
                            ...prev.formData,
                            runningPolicy: {
                              ...prev.formData?.runningPolicy,
                              CurrentPolicyFile: null,
                              CurrentPolicyFileName: ''
                            }
                          }
                        }));
                        clearFileInput('CurrentPolicyFile');
                      }}
                      style={{ 
                        marginLeft: '10px', 
                        padding: '2px 8px', 
                        fontSize: '0.8em', 
                        backgroundColor: '#ff4444', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}

                {formState.formData.runningPolicy?.CurrentPolicyFile && typeof formState.formData.runningPolicy.CurrentPolicyFile === 'string' && (
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
                      ✓ Stored: {formState.formData.runningPolicy.CurrentPolicyFile}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => window.open(`${config.API_URL}/user/download/${formState.formData.runningPolicy.CurrentPolicyFile}`, '_blank')}
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
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
                      >
                        📥 Download
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to remove this document?')) {
                            setFormState(prev => ({
                              ...prev,
                              formData: {
                                ...prev.formData,
                                runningPolicy: {
                                  ...prev.formData.runningPolicy,
                                  CurrentPolicyFile: '',
                                  CurrentPolicyFileName: ''
                                }
                              }
                            }));
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
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c62828'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#d32f2f'}
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Previous Policy Details */}
        {currentStep === 5 && (
          <div className="form-section">
            <h5>Previous Policy Details</h5>
            <div className="form-row">
              <div className="form-group">
                <label>Policy Number</label>
                <Input
                  type="text"
                  value={formState.formData.previousPolicy.PolicyNumber}
                  onChange={(e) => handlePreviousPolicyChange('PolicyNumber', e.target.value)}
                  placeholder="Enter policy number"
                />
              </div>
              <div className="form-group">
                <label>Zone</label>
                <Input
                  type="text"
                  value={formState.formData.previousPolicy.Zone}
                  onChange={(e) => handlePreviousPolicyChange('Zone', e.target.value)}
                  placeholder="Enter zone"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Policy From</label>
                <Input
                  type="date"
                  value={formState.formData.previousPolicy.PolicyFrom}
                  onChange={(e) => handlePreviousPolicyChange('PolicyFrom', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Policy To</label>
                <Input
                  type="date"
                  value={formState.formData.previousPolicy.PolicyTo}
                  onChange={(e) => handlePreviousPolicyChange('PolicyTo', e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Policy Tenure</label>
                <Input
                  type="number"
                  value={formState.formData.previousPolicy.PolicyTenure}
                  onChange={(e) => handlePreviousPolicyChange('PolicyTenure', e.target.value)}
                  placeholder="Enter policy tenure"
                />
              </div>
              <div className="form-group">
                <label>Premium Amount</label>
                <Input
                  type="number"
                  value={formState.formData.previousPolicy.PremiumAmount}
                  onChange={(e) => handlePreviousPolicyChange('PremiumAmount', e.target.value)}
                  placeholder="Enter premium amount"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Sum Insured</label>
                <Input
                  type="number"
                  value={formState.formData.previousPolicy.SumInsured}
                  onChange={(e) => handlePreviousPolicyChange('SumInsured', e.target.value)}
                  placeholder="Enter sum insured amount"
                />
              </div>
              <div className="form-group">
                <label>No Claim Bonus</label>
                <Input
                  type="number"
                  value={formState.formData.previousPolicy.NoClaimBonus}
                  onChange={(e) => handlePreviousPolicyChange('NoClaimBonus', e.target.value)}
                  placeholder="Enter no claim bonus percentage"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Renew Date</label>
                <Input
                  type="date"
                  value={formState.formData.previousPolicy.RenewDate}
                  onChange={(e) => handlePreviousPolicyChange('RenewDate', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Claim Expire in Policy</label>
                <select
                  value={formState.formData.previousPolicy.ClaimExpireInPolicy || ""}
                  onChange={(e) => handlePreviousPolicyChange('ClaimExpireInPolicy', e.target.value)}
                  className="form-select"
                >
                  <option value="" disabled>Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Previous Policy Number</label>
                <Input
                  type="text"
                  value={formState.formData.previousPolicy.PreviousPolicyNumber}
                  onChange={(e) => handlePreviousPolicyChange('PreviousPolicyNumber', e.target.value)}
                  placeholder="Enter previous policy number"
                />
              </div>
              {/* <div className="form-group">
                <label>Company Name</label>
                <Input
                  type="text"
                  value={formState.formData.previousPolicy.CompanyName}
                  onChange={(e) => handlePreviousPolicyChange('CompanyName', e.target.value)}
                  placeholder="Enter company name"
                />
                
              
              </div> */}
           
           <div className="form-row">
              <div className="form-group">
                <label>Company Name</label>
                <Select
                  options={companyData && companyData.map((item) => ({
                    value: item.mediclaim_company_id,
                    label: item.mediclaim_company_name
                  }))}
                  value={companyData && companyData.find(item => item.mediclaim_company_id === formState.formData.previousPolicy.CompanyName) ? 
                    { value: formState.formData.previousPolicy.CompanyName, label: companyData.find(item => item.mediclaim_company_id === formState.formData.previousPolicy.CompanyName).mediclaim_company_name } : null}
                  onChange={(option) => {
                    const companyId = option ? option.value : '';
                    handlePreviousPolicyChange('CompanyName', companyId);
                    if (companyId) {
                      getProductData(companyId);
                    } else {
                      setProductData([]);
                    }
                  }}
                  placeholder="Select Company"
                  isClearable
                  isDisabled={view}
                />
              </div>
            </div>


            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Nominee Name</label>
                <Input
                  type="text"
                  value={formState.formData.previousPolicy.NomineeName}
                  onChange={(e) => handlePreviousPolicyChange('NomineeName', e.target.value)}
                  placeholder="Enter nominee name"
                />
              </div>
              <div className="form-group">
                <label>Nominee Relation</label>
                <Input
                  type="text"
                  value={formState.formData.previousPolicy.NomineeRelation}
                  onChange={(e) => handlePreviousPolicyChange('NomineeRelation', e.target.value)}
                  placeholder="Enter nominee relation"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Nominee DOB</label>
                <Input
                  type="date"
                  value={formState.formData.previousPolicy.NomineeDob}
                  onChange={(e) => handlePreviousPolicyChange('NomineeDob', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Nominee Age</label>
                <Input
                  type="number"
                  value={formState.formData.previousPolicy.NomineeAge}
                  disabled
                />
              </div>
            </div>

            {/* <div className="form-row">
              <div className="form-group">
                <label>Select Product</label>
                <select
                  value={productType || ""}
                  onChange={(e) => setProductType(e.target.value)}
                  className="form-select"
                >
                  <option value="" disabled hidden>Select Product</option>
                  {productData && productData.map((item) => (
                    <option key={item.mediclaim_product_id} value={item.mediclaim_product_id}>
                      {item.mediclaim_product_name}
                    </option>
                  ))}
                </select>
              </div>
            </div> */}
<div className="form-row">
  <div className="form-group">
    <label>Select Product</label>
    <select
      value={formState.formData.previousPolicy.mediclaim_product_id || productType || ""}
      onChange={(e) => {
        const selectedProduct = e.target.value;
        setProductType(selectedProduct);
        handlePreviousPolicyChange('mediclaim_product_id', selectedProduct);
      }}
      className="form-select"
      disabled={view}
    >
      <option value="" disabled hidden>Select Product</option>
      {productData && productData.map((item) => (
        <option key={item.mediclaim_product_id} value={item.mediclaim_product_id}>
          {item.mediclaim_product_name}
        </option>
      ))}
    </select>
  </div>
</div>
            <div className="form-row">
              <div className="form-group">
                <label>Upload Previous Policy PDF</label>
                <Input
                  type="file"
                  name="PreviousPolicyPDF"
                  accept="application/pdf"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file && file.type === "application/pdf") {
                      handlePreviousPolicyChange('PdfFile', file);
                      handlePreviousPolicyChange('PdfFileName', file.name);
                    } else {
                      alert("Please upload a valid PDF file.");
                    }
                  }}
                />
                
                {/* Show current file if uploaded */}
                {formState.formData.previousPolicy?.PdfFile && typeof formState.formData.previousPolicy.PdfFile === 'object' && (
                  <div style={{ fontSize: "0.9em", marginTop: 4, display: "block", color: "#388e3c" }}>
                    <strong>Selected file:</strong> {formState.formData.previousPolicy.PdfFile.name}
                    <button 
                      type="button" 
                      onClick={() => {
                        setFormState(prev => ({
                          ...prev,
                          formData: {
                            ...prev.formData,
                            previousPolicy: {
                              ...prev.formData.previousPolicy,
                              PdfFile: null,
                              PdfFileName: ''
                            }
                          }
                        }));
                        clearFileInput('PreviousPolicyPDF');
                      }}
                      style={{ 
                        marginLeft: '10px', 
                        padding: '2px 8px', 
                        fontSize: '0.8em', 
                        backgroundColor: '#ff4444', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}

                {formState.formData.previousPolicy?.PdfFile && typeof formState.formData.previousPolicy.PdfFile === 'string' && (
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
                      ✓ Stored: {formState.formData.previousPolicy.PdfFile}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => window.open(`${config.API_URL}/user/download/${formState.formData.previousPolicy.PdfFile}`, '_blank')}
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
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
                      >
                        📥 Download
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to remove this document?')) {
                            setFormState(prev => ({
                              ...prev,
                              formData: {
                                ...prev.formData,
                                previousPolicy: {
                                  ...prev.formData.previousPolicy,
                                  PdfFile: '',
                                  PdfFileName: ''
                                }
                              }
                            }));
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
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c62828'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#d32f2f'}
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {formState.formData.previousPolicy.ClaimExpireInPolicy === 'Yes' && (
                <div className="form-group">
                  <label>Upload Claim Statement PDF</label>
                  <Input
                    type="file"
                    name="ClaimStatementPDF"
                    accept="application/pdf"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file && file.type === "application/pdf") {
                        handlePreviousPolicyChange('ClaimStatementPDFfile', file);
                        handlePreviousPolicyChange('ClaimStatementPDFfileName', file.name);
                      } else {
                        alert("Please upload a valid PDF file.");
                      }
                    }}
                  />
                  
                  {/* Show current file if uploaded */}
                  {formState.formData.previousPolicy?.ClaimStatementPDFfile && typeof formState.formData.previousPolicy.ClaimStatementPDFfile === 'object' && (
                    <div style={{ fontSize: "0.9em", marginTop: 4, display: "block", color: "#388e3c" }}>
                      <strong>Selected file:</strong> {formState.formData.previousPolicy.ClaimStatementPDFfile.name}
                      <button 
                        type="button" 
                        onClick={() => {
                          setFormState(prev => ({
                            ...prev,
                            formData: {
                              ...prev.formData,
                              previousPolicy: {
                                ...prev.formData.previousPolicy,
                                ClaimStatementPDFfile: null,
                                ClaimStatementPDFfileName: ''
                              }
                            }
                          }));
                          clearFileInput('ClaimStatementPDF');
                        }}
                        style={{ 
                          marginLeft: '10px', 
                          padding: '2px 8px', 
                          fontSize: '0.8em', 
                          backgroundColor: '#ff4444', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        Remove
                      </button>
                </div>
                  )}

                  {formState.formData.previousPolicy?.ClaimStatementPDFfile && typeof formState.formData.previousPolicy.ClaimStatementPDFfile === 'string' && (
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
                        ✓ Stored: {formState.formData.previousPolicy.ClaimStatementPDFfile}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => window.open(`${config.API_URL}/user/download/${formState.formData.previousPolicy.ClaimStatementPDFfile}`, '_blank')}
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
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
                        >
                          📥 Download
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to remove this document?')) {
                              setFormState(prev => ({
                                ...prev,
                                formData: {
                                  ...prev.formData,
                                  previousPolicy: {
                                    ...prev.formData.previousPolicy,
                                    ClaimStatementPDFfile: '',
                                    ClaimStatementPDFfileName: ''
                                  }
                                }
                              }));
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
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c62828'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#d32f2f'}
                        >
                          🗑️ Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Previous Agent Details - Only for Portability */}
            {formState.formData.policyRadio === 'Portability' && (
              <>
                <h5 style={{marginTop: '20px', marginBottom: '10px'}}>Previous Agent Details</h5>
                <div className="form-row">
                  <div className="form-group">
                    <label>Previous Agent Name</label>
                    <Input
                      type="text"
                      value={formState.formData.previousPolicy.PreviousAgentName}
                      onChange={(e) => handlePreviousPolicyChange('PreviousAgentName', e.target.value)}
                      placeholder="Enter previous agent name"
                      disabled={view}
                    />
                  </div>
                  <div className="form-group">
                    <label>Previous Agent Code</label>
                    <Input
                      type="text"
                      value={formState.formData.previousPolicy.PreviousAgentCode}
                      onChange={(e) => handlePreviousPolicyChange('PreviousAgentCode', e.target.value)}
                      placeholder="Enter previous agent code"
                      disabled={view}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Previous Agent Contact Number</label>
                    <Input
                      type="text"
                      value={formState.formData.previousPolicy.PreviousAgentContactNumber}
                      onChange={(e) => handlePreviousPolicyChange('PreviousAgentContactNumber', e.target.value)}
                      placeholder="Enter previous agent contact number"
                      disabled={view}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 3: Policyholder Details + Family Members / Employees */}
        {currentStep === 3 && (
          <div className="form-section">
            {/* Policyholder Details Section */}
            <h5>Policyholder Details</h5>
            <div className="form-row">
              <div className="form-group">
                <label>Proposer Name *</label>
                <Input
                  type="text"
                  value={formState.formData.Name}
                  onChange={(e) => handleInputChange('Name', e.target.value)}
                  placeholder="Enter proposer name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Date of Birth *</label>
                <Input
                  type="date"
                  value={formState.formData.DateOfBirth}
                  onChange={handleDateChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Age</label>
                <Input
                  type="text"
                  value={formState.formData.Age || ''}
                  disabled
                  placeholder="Auto-calculated"
                />
              </div>
              <div className="form-group">
                {/* Empty div for layout balance */}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Gender *</label>
                <div className="radio-group">
                  <label>
                    <input
                      type="radio"
                      name="Gender"
                      value="Male"
                      checked={formState.formData.Gender === 'Male'}
                      onChange={(e) => handleInputChange('Gender', e.target.value)}
                      required
                    />
                    <span>Male</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="Gender"
                      value="Female"
                      checked={formState.formData.Gender === 'Female'}
                      onChange={(e) => handleInputChange('Gender', e.target.value)}
                    />
                    <span>Female</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="Gender"
                      value="Other"
                      checked={formState.formData.Gender === 'Other'}
                      onChange={(e) => handleInputChange('Gender', e.target.value)}
                    />
                    <span>Other</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Relationship with Policy Holder *</label>
                <Input
                  type="text"
                  value={formState.formData.RelationshipWithPolicyHolder}
                  onChange={(e) => handleRelationshipChange(e.target.value)}
                  placeholder="Enter relationship (e.g., SELF)"
                  required
                />
              </div>
            </div>

            


            {/* Family Members / Employees / Insured Person Section */}
            {formState.formData.RadioButton === 'Family' && (
              <>
                <h3 style={{ marginTop: '30px' }}>Family Members</h3>
              </>
            )}
            
            {formState.formData.RadioButton === 'Employee' && (
              <>
                <h3 style={{ marginTop: '30px' }}>Employees</h3>
              </>
            )}

            
            {formState.formData.RadioButton === 'Family' && (
              <div>
                <div className="form-actions" style={{ marginBottom: '20px' }}>
                  <Button
                    type="button"
                    className="add-consumer-btn"
                    onClick={addFamilyMember}
                  >
                    + Add Family Member
                  </Button>
                </div>
                
                {formState.familyMembers.map((member, index) => (
                  <div key={index} className="member-form" style={{ 
                    border: '1px solid #ddd', 
                    padding: '15px', 
                    marginBottom: '15px', 
                    borderRadius: '5px',
                    backgroundColor: '#f9f9f9'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <h4>Family Member {index + 1}</h4>
                      <Button
                        type="button"
                        className="cancel-btn"
                        onClick={() => removeFamilyMember(index)}
                        style={{ padding: '5px 10px', fontSize: '12px' }}
                      >
                        Remove
                      </Button>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>Family Member Name *</label>
                        <Input
                          type="text"
                          value={member.FamilyName}
                          onChange={(e) => handleFamilyMemberChange(index, 'FamilyName', e.target.value)}
                          placeholder="Enter family member name"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Relationship with Policy Holder *</label>
                        <Input
                          type="text"
                          value={member.RelationshipWithPolicyHolder}
                          onChange={(e) => handleFamilyMemberChange(index, 'RelationshipWithPolicyHolder', e.target.value)}
                          placeholder="Enter relationship with policy holder"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>Date of Birth *</label>
                        <Input
                          type="date"
                          value={member.DateOfBirth}
                          onChange={(e) => handleFamilyMemberChange(index, 'DateOfBirth', e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Age</label>
                        <Input
                          type="text"
                          value={member.Age || ''}
                          disabled
                          placeholder="Auto-calculated"
                          style={{backgroundColor: '#f8f9fa', color: '#6c757d'}}
                        />
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>Gender *</label>
                        <select
                          value={member.Gender}
                          onChange={(e) => handleFamilyMemberChange(index, 'Gender', e.target.value)}
                          className="form-select"
                          required
                        >
                          <option value="">Select gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Date of Joining</label>
                        <Input
                          type="date"
                          value={member.DateOfJoining}
                          onChange={(e) => handleFamilyMemberChange(index, 'DateOfJoining', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>Pre-existing Illness</label>
                        <Input
                          type="text"
                          value={member.PreExistingIllness}
                          onChange={(e) => handleFamilyMemberChange(index, 'PreExistingIllness', e.target.value)}
                          placeholder="Enter any pre-existing illness"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {formState.formData.RadioButton === 'Employee' && (
              <div>
                <div className="form-actions" style={{ marginBottom: '20px' }}>
                  <Button
                    type="button"
                    className="add-consumer-btn"
                    onClick={addEmployee}
                  >
                    + Add Employee
                  </Button>
                </div>
                
                {formState.employees.map((employee, index) => (
                  <div key={index} className="employee-form" style={{ 
                    border: '1px solid #ddd', 
                    padding: '15px', 
                    marginBottom: '15px', 
                    borderRadius: '5px',
                    backgroundColor: '#f9f9f9'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <h4>Employee {index + 1}</h4>
                      <Button
                        type="button"
                        className="cancel-btn"
                        onClick={() => removeEmployee(index)}
                        style={{ padding: '5px 10px', fontSize: '12px' }}
                      >
                        Remove
                      </Button>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>Employee Name *</label>
                        <Input
                          type="text"
                          value={employee.EmployeeName}
                          onChange={(e) => handleEmployeeChange(index, 'EmployeeName', e.target.value)}
                          placeholder="Enter employee name"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Relationship with Policy Holder *</label>
                        <Input
                          type="text"
                          value={employee.RelationshipWithPolicyHolder}
                          onChange={(e) => handleEmployeeChange(index, 'RelationshipWithPolicyHolder', e.target.value)}
                          placeholder="Enter relationship with policy holder"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>Date of Birth *</label>
                        <Input
                          type="date"
                          value={employee.DateOfBirth}
                          onChange={(e) => handleEmployeeChange(index, 'DateOfBirth', e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Age</label>
                        <Input
                          type="text"
                          value={employee.Age || ''}
                          disabled
                          placeholder="Auto-calculated"
                          style={{backgroundColor: '#f8f9fa', color: '#6c757d'}}
                        />
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>Gender *</label>
                        <select
                          value={employee.Gender}
                          onChange={(e) => handleEmployeeChange(index, 'Gender', e.target.value)}
                          className="form-select"
                          required
                        >
                          <option value="">Select gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Date of Joining</label>
                        <Input
                          type="date"
                          value={employee.DateOfJoining}
                          onChange={(e) => handleEmployeeChange(index, 'DateOfJoining', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>Pre-existing Illness</label>
                        <Input
                          type="text"
                          value={employee.PreExistingIllness}
                          onChange={(e) => handleEmployeeChange(index, 'PreExistingIllness', e.target.value)}
                          placeholder="Enter any pre-existing illness"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {formState.formData.RadioButton === 'Individual' && (
              <div>
                <div className="member-form" style={{ 
                  border: '1px solid #ddd', 
                  padding: '15px', 
                  marginBottom: '15px', 
                  borderRadius: '5px'
                }}>
                  <h4 style={{ marginBottom: '15px' }}>
                    Insured Person Information
                    {formState.formData.RelationshipWithPolicyHolder?.toUpperCase() === 'SELF' && (
                      <span style={{ fontSize: '14px', color: '#4caf50', marginLeft: '10px' }}>
                        (Auto-filled from Policyholder Details)
                      </span>
                    )}
                  </h4>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Insured Person Name *</label>
                      <Input
                        type="text"
                        value={formState.formData.RelationshipWithPolicyHolder?.toUpperCase() === 'SELF' ? formState.formData.Name : (formState.formData.InsuredPersonName || '')}
                        onChange={(e) => handleInputChange('InsuredPersonName', e.target.value)}
                        placeholder="Enter insured person name"
                        disabled={formState.formData.RelationshipWithPolicyHolder?.toUpperCase() === 'SELF'}
                        required
                        style={formState.formData.RelationshipWithPolicyHolder?.toUpperCase() === 'SELF' ? {cursor: 'not-allowed'} : {}}
                      />
                    </div>
                     <div className="form-group">
                       <label>Relationship with Policy Holder *</label>
                       <Input
                         type="text"
                         value={formState.formData.RelationshipWithPolicyHolder?.toUpperCase() === 'SELF' ? formState.formData.RelationshipWithPolicyHolder : (formState.formData.InsuredPersonRelationship || '')}
                         onChange={(e) => handleInputChange('InsuredPersonRelationship', e.target.value)}
                         disabled={formState.formData.RelationshipWithPolicyHolder?.toUpperCase() === 'SELF'}
                         placeholder="Enter relationship (e.g., Sister, Father)"
                         required
                         style={formState.formData.RelationshipWithPolicyHolder?.toUpperCase() === 'SELF' ? {cursor: 'not-allowed'} : {}}
                       />
                     </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Date of Birth *</label>
                      <Input
                        type="date"
                        value={formState.formData.RelationshipWithPolicyHolder?.toUpperCase() === 'SELF' ? formState.formData.DateOfBirth : (formState.formData.InsuredPersonDateOfBirth || '')}
                        onChange={handleInsuredPersonDateChange}
                        disabled={formState.formData.RelationshipWithPolicyHolder?.toUpperCase() === 'SELF'}
                        required
                        style={formState.formData.RelationshipWithPolicyHolder?.toUpperCase() === 'SELF' ? {backgroundColor: '#f5f5f5', cursor: 'not-allowed'} : {}}
                      />
                    </div>
                    <div className="form-group">
                      <label>Age</label>
                      <Input
                        type="text"
                        value={formState.formData.RelationshipWithPolicyHolder?.toUpperCase() === 'SELF' ? (formState.formData.Age || '') : (formState.formData.InsuredPersonAge || '')}
                        disabled
                        placeholder="Auto-calculated"
                        style={{backgroundColor: '#f8f9fa', color: '#6c757d'}}
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Gender *</label>
                      <select
                        value={formState.formData.RelationshipWithPolicyHolder?.toUpperCase() === 'SELF' ? formState.formData.Gender : (formState.formData.InsuredPersonGender || '')}
                        onChange={(e) => handleInputChange('InsuredPersonGender', e.target.value)}
                        className="form-select"
                        disabled={formState.formData.RelationshipWithPolicyHolder?.toUpperCase() === 'SELF'}
                        required
                        style={formState.formData.RelationshipWithPolicyHolder?.toUpperCase() === 'SELF' ? {backgroundColor: '#f5f5f5', cursor: 'not-allowed'} : {}}
                      >
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Date of Joining</label>
                      <Input
                        type="date"
                        value={formState.formData.InsuredPersonDateOfJoining || ''}
                        onChange={handleInsuredPersonDateOfJoiningChange}
                        placeholder="Select date of joining"
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Pre-existing Illness</label>
                      <Input
                        type="text"
                        value={formState.formData.InsuredPersonPreExistingIllness || ''}
                        onChange={(e) => handleInputChange('InsuredPersonPreExistingIllness', e.target.value)}
                        placeholder="Enter any pre-existing illness"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sum Insured and No Claim Bonus Section */}
            <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
              <h4 style={{ marginBottom: '20px', color: '#495057' }}>Policy Details</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Sum Insured *</label>
                  <Input
                    type="number"
                    value={formState.formData.SumInsured}
                    onChange={(e) => handleInputChange('SumInsured', e.target.value)}
                    placeholder="Enter sum insured"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>No Claim Bonus *</label>
                  <Input
                    type="number"
                    value={formState.formData.NoClaimBonus}
                    onChange={(e) => handleInputChange('NoClaimBonus', e.target.value)}
                    placeholder="Enter no claim bonus"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Agent Details */}
        {currentStep === 6 && (
          <div className="form-section">
            <h5>Agent Details</h5>
            <div className="form-row">
              <div className="form-group">
                <label>Agent Name</label>
                <Input
                  type="text"
                  value={formState.formData.AgentName}
                  onChange={(e) => handleInputChange('AgentName', e.target.value)}
                  placeholder="Enter agent name"
                />
              </div>
              <div className="form-group">
                <label>Agent Code</label>
                <Input
                  type="text"
                  value={formState.formData.AgentCode}
                  onChange={(e) => handleInputChange('AgentCode', e.target.value)}
                  placeholder="Enter agent code"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Agent Contact Number</label>
                <Input
                  type="text"
                  value={formState.formData.AgentContactNumber}
                  onChange={(e) => handleInputChange('AgentContactNumber', e.target.value)}
                  placeholder="Enter agent contact number"
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="form-actions">
          {currentStep > 1 && (
            <Button
              type="button"
              className="cancel-btn"
              onClick={handlePrev}
            >
              Previous
            </Button>
          )}
          
          {currentStep < 6 ? (
            <Button
              type="button"
              className="add-consumer-btn"
              onClick={handleNext}
            >
              Next
            </Button>
          ) : (
            !view && (
              <Button
                type="button"
                className="add-consumer-btn"
                disabled={isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            )
          )}
          
        </div>
      </form>
    </Modal>
  );
};

export default MediclaimModal;
