import toast from 'react-hot-toast';
import React, { useEffect, useState } from 'react';
import './popup-u.css';
import { addMediclaimUser, DOWNLOAD_URL, getAllMediclaimCompany, getAllMediclaimProduct, updateMediclaimUser } from '../serviceAPI/userAPI';
import { useToaster } from './Toaster';
import FlagDropdown from '../pages/Flag';

const MediclaimPopup = ({ isOpen, onClose, fetchApi, initialData, view }) => {
  const addToast = useToaster()
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [companyData, setCompanyData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [productType, setProductType] = useState('');
  const [companyType, setCompanyType] = useState('');
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
       // Proposer Details (separate from Individual Details)
       ProposerDateOfBirth: '',
       ProposerAge: '',
       ProposerGender: '',
       ProposerRelationshipWithPolicyHolder: '',
       ProposerPreExistingIllness: '',

      // Running Policy Data
      runningPolicy: {
        Zone: '',
        PolicyNumber: '',
        PolicyTenure: '',
        PremiumAmount: '',
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
        NomineeName: '',
        NomineeRelation: '',
        NomineeDob: '',
        NomineeAge: '',
        PdfFile: '',
        ClaimExpireInPolicy: '',
        PreviousPolicyNumber: '',
        CompanyName: '',
        ClaimStatementPDFfile: '',
      },

      // Last Policy Data (Historical Reference)
      AgentName: '',
      AgentCode: '',
      AgentContactNumber: '',
      ProductName: '',
      CompanyName: '',
      
      // Additional fields that should be prefilled
      NomineeName: '',
      PreExistingIllness: '',

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


  useEffect(() => {
    console.log('🔍 [MEDICLAIM POPUP] useEffect triggered with initialData:', initialData);
    if (initialData && initialData.id) {
      console.log('🔍 [MEDICLAIM POPUP] Processing initial data for edit mode');
      console.log('🔍 [MEDICLAIM POPUP] Initial data structure:', {
        id: initialData.id,
        user_id: initialData.user_id,
        referenceName: initialData.referenceName,
        runningPolicy: initialData.runningPolicy,
        previousPolicy: initialData.previousPolicy,
        familymembers: initialData.familymembers,
        employees: initialData.employees
      });
      console.log('🔍 [MEDICLAIM POPUP] User data:', initialData.user);
      console.log('🔍 [MEDICLAIM POPUP] Running policy data:', initialData.runningPolicy);
      console.log('🔍 [MEDICLAIM POPUP] All initialData keys:', Object.keys(initialData));
      console.log('🔍 [MEDICLAIM POPUP] Full initialData object:', JSON.stringify(initialData, null, 2));
      console.log('🔍 [MEDICLAIM POPUP] Previous Policy data structure:', initialData.previousPolicy);
      console.log('🔍 [MEDICLAIM POPUP] Running Policy data structure:', initialData.runningPolicy);
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

      console.log(initialData?.familymembers, 'familyMembers')

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
        runningPolicy
      } = initialData;

      // Check for flattened previous policy fields
      console.log('🔍 [MEDICLAIM POPUP] Checking for flattened previous policy fields...');
      Object.keys(initialData).forEach(key => {
        if (key.toLowerCase().includes('previous') || key.toLowerCase().includes('prev')) {
          console.log(`🔍 [MEDICLAIM POPUP] Found potential previous policy field: ${key} =`, initialData[key]);
        }
      });

       console.log('🔍 [DATA EXTRACTION] Extracted values:', {
         medicliam_type,
         medicliam_policy_type,
         dob,
         age,
         gender,
         relationshipWithPolicyHolder,
         sumInsured,
         noClaimBonus,
         preExistingIllness,
         nomineeName
       });

                    const formDataToSet = {
          Name: initialData.user?.username || '',
          MobileNumber: initialData.user?.mobileNumber || '',
          Email: initialData.user?.email || '',
          ReferenceName: initialData.referenceName || '',
          RadioButton: medicliam_type || '',
          policyRadio: medicliam_policy_type || '',
          DateOfBirth: dob ? dob.slice(0, 10) : '',
          Age: age || 0,
          Gender: gender || '',
          RelationshipWithPolicyHolder: relationshipWithPolicyHolder || '',
          DateOfJoining: '', // Individual joining date
          SumInsured: sumInsured || '',
          NoClaimBonus: noClaimBonus || '',
          PreExistingIllness: preExistingIllness || '',
          NomineeName: nomineeName || '',
          // Proposer Details (separate from Individual Details)
          ProposerDateOfBirth: dob ? dob.slice(0, 10) : '',
          ProposerAge: age || 0,
          ProposerGender: gender || '',
          ProposerRelationshipWithPolicyHolder: relationshipWithPolicyHolder || '',
          ProposerPreExistingIllness: preExistingIllness || '',

          runningPolicy: {
            Zone: runningPolicy?.Zone || '',
            PolicyNumber: runningPolicy?.PolicyNumber || '',
            PolicyTenure: runningPolicy?.PolicyTenure,
            PremiumAmount: runningPolicy?.PremiumAmount,
            AddOnCover: runningPolicy?.AddOnCover || '',
            NomineeName: runningPolicy?.NomineeName || '',
            NomineeRelation: runningPolicy?.NomineeRelation || '',
            PolicyPlanType: runningPolicy?.PolicyPlanType || '',
            NomineeAge: runningPolicy?.NomineeAge,
            NomineeDob: runningPolicy?.NomineeDob && runningPolicy?.NomineeDob.slice(0, 10) || '',
            PolicyIssuedDate: runningPolicy?.PolicyIssuedDate && runningPolicy?.PolicyIssuedDate.slice(0, 10) || '',
            ExpiryDate: runningPolicy?.ExpiryDate && runningPolicy?.ExpiryDate.slice(0, 10) || '',
            PreviousPolicyFlag: runningPolicy?.PreviousPolicyFlag && runningPolicy?.PreviousPolicyFlag || '',
            PolicyFrom: runningPolicy?.PolicyFrom ? runningPolicy?.PolicyFrom.slice(0, 10) : '',
            PolicyTo: runningPolicy?.PolicyTo ? runningPolicy?.PolicyTo.slice(0, 10) : '',
            CurrentPolicyFile: runningPolicy?.CurrentPolicyFile && typeof runningPolicy?.CurrentPolicyFile === 'object' ? null : (runningPolicy?.CurrentPolicyFile || null),
          },

          previousPolicy: {
            Zone: previousPolicy?.Zone || '',
            PolicyNumber: previousPolicy?.PolicyNumber || '',
            PolicyFrom: previousPolicy?.PolicyFrom ? previousPolicy?.PolicyFrom.slice(0, 10) : '',
            PolicyTo: previousPolicy?.PolicyTo ? previousPolicy?.PolicyTo.slice(0, 10) : '',
            RenewDate: previousPolicy?.RenewDate ? previousPolicy?.RenewDate.slice(0, 10) : '',
            PolicyTenure: previousPolicy?.PolicyTenure || '',
            PremiumAmount: previousPolicy?.PremiumAmount || '',
            PdfFile: previousPolicy?.PdfFile && typeof previousPolicy?.PdfFile === 'object' ? null : (previousPolicy?.PdfFile || null),
            ClaimStatementPDFfile: previousPolicy?.ClaimStatementPDFfile && typeof previousPolicy?.ClaimStatementPDFfile === 'object' ? null : (previousPolicy?.ClaimStatementPDFfile || null),
            ClaimExpireInPolicy: previousPolicy?.ClaimExpireInPolicy || '',
            NomineeName: previousPolicy?.NomineeName || '',
            NomineeRelation: previousPolicy?.NomineeRelation || '',
            PreviousPolicyNumber: previousPolicy?.PreviousPolicyNumber || '',
            CompanyName: previousPolicy?.CompanyName || '',
            NomineeAge: previousPolicy?.NomineeAge,
            NomineeDob: previousPolicy?.NomineeDob && previousPolicy?.NomineeDob.slice(0, 10) || '',
          },
          AgentName: agentName || '',
          AgentCode: agentCode || '',
          AgentContactNumber: agentContactNumber || '',
          ProductName: mediclaim_product_id || '',
          CompanyName: mediclaim_company_id || '',
        };

      console.log('🔍 [MEDICLAIM POPUP] Form data to be set:', formDataToSet);
      console.log('🔍 [MEDICLAIM POPUP] Previous Policy data being set:', formDataToSet.previousPolicy);
      console.log('🔍 [MEDICLAIM POPUP] Raw previousPolicy from initialData:', previousPolicy);
      console.log('🔍 [MEDICLAIM POPUP] Family members:', familyMembers);
      console.log('🔍 [MEDICLAIM POPUP] Employees:', employees);

      setFormState({
        formData: formDataToSet,
        familyMembers,
        employees,
      });

      // Debug: Log the form state after setting
      setTimeout(() => {
        console.log('🔍 [MEDICLAIM POPUP] Form state after setting:', {
          Name: formDataToSet.Name,
          Email: formDataToSet.Email,
          MobileNumber: formDataToSet.MobileNumber,
          ReferenceName: formDataToSet.ReferenceName,
          AgentName: formDataToSet.AgentName,
          AgentCode: formDataToSet.AgentCode,
          AgentContactNumber: formDataToSet.AgentContactNumber,
          ProductName: formDataToSet.ProductName,
          CompanyName: formDataToSet.CompanyName,
          PreviousPolicy: formDataToSet.previousPolicy
        });
      }, 100);

      setCompanyType(initialData.mediclaim_company_id || '');
      if (initialData.mediclaim_company_id) {
        getProductData(initialData.mediclaim_company_id);
        if (initialData?.previousPolicy?.mediclaim_product_id) {
          setProductType(initialData?.previousPolicy?.mediclaim_product_id);
        }
      }

      // Update form state with company and product type after a short delay
      setTimeout(() => {
        console.log('🔍 [MEDICLAIM POPUP] Updating form state with company and product data');
        console.log('🔍 [MEDICLAIM POPUP] Company ID:', initialData.mediclaim_company_id);
        console.log('🔍 [MEDICLAIM POPUP] Product ID:', initialData?.previousPolicy?.mediclaim_product_id);
        
        setFormState(prevState => ({
          ...prevState,
          formData: {
            ...prevState.formData,
            CompanyName: initialData.mediclaim_company_id || '',
            ProductName: initialData?.previousPolicy?.mediclaim_product_id || ''
          }
        }));
        
        console.log('🔍 [MEDICLAIM POPUP] Form state updated with company and product data');
      }, 200);

      let isRenew = localStorage.getItem('isRenew') || '';
      let MediclaimID = localStorage.getItem('MediclaimID') || '';
      console.log(isRenew, 'isRenew')
      if (isRenew && MediclaimID) {
        setFormState(prevState => {
          console.log(initialData)

          let updatedPreviousPolicy = {
            PolicyNumber: runningPolicy.PolicyNumber || '',
            Zone: runningPolicy.Zone || '',
            PolicyTenure: runningPolicy.PolicyTenure || '',
            PremiumAmount: runningPolicy.PremiumAmount || '',
            NomineeName: runningPolicy.NomineeName || '',
            NomineeRelation: runningPolicy.NomineeRelation || '',
            NomineeAge: runningPolicy.NomineeAge || '',
            NomineeDob: runningPolicy.NomineeDob || '',
            PolicyFrom: runningPolicy.PolicyFrom || '',
            PolicyTo: runningPolicy.PolicyTo || '',
            RenewDate: '',
            PdfFile: '',
            ClaimExpireInPolicy: '',
            PreviousPolicyNumber: '',
            CompanyName: '',
            ClaimStatementPDFfile: '',
          };
          setProductType('')


          return {
            ...prevState,
            formData: {
              ...prevState.formData,
              policyRadio: medicliam_policy_type == 'Fresh' ? "Renewal" : medicliam_policy_type == 'Renewal' ? "Renewal" : "Portability",
              previousPolicy: updatedPreviousPolicy
            }
          };
        });

        // **Ensure localStorage is cleared only after state update**
        setTimeout(() => {
          localStorage.removeItem('isRenew');
          localStorage.removeItem('MediclaimID');
        }, 1000);
      }
    }
  }, [initialData]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setFormState(prevState => ({
        ...prevState,
        formData: {
          ...prevState.formData,
          runningPolicy: {
            ...prevState.formData?.runningPolicy,
            CurrentPolicyFile: file,
          },
        },
      }));
    } else {
      toast.error("Please upload a valid PDF file.");
    }
  };

  useEffect(() => {
    getCompanyData()
  }, []);

  const validateForm = () => {
    const errors = { runningPolicy: {}, previousPolicy: {} };
    const { formData, familyMembers, employees } = formState;
    
    console.log('🔍 [VALIDATE FORM] Current formData:', formData);
    console.log('🔍 [VALIDATE FORM] Current step:', currentStep);

    // Helper function for common validations
    const isValidNumber = (value) => !isNaN(value) && value >= 0;
    const isValidNumber1 = (value) => !isNaN(value) && value >= 0;
    const isValidDate = (date) => date && !isNaN(new Date(date).getTime());

    // Step 1: Basic Information Validation
    if (currentStep === 1) {
      if (!formData.Name) errors.Name = 'Name is required';
      if (!formData.Email || !/\S+@\S+\.\S+/.test(formData.Email)) errors.Email = 'Valid Email is required';
      if (!formData.MobileNumber || formData.MobileNumber.length < 10) errors.MobileNumber = 'Valid Mobile Number is required';
      if (!companyType) errors.CompanyName = 'Company Name is required';
      if (!formData.RadioButton) errors.RadioButton = 'Please select Family or Individual';
      if (!formData.policyRadio) errors.policyRadio = 'Please select Policy Type';
    }

    // Step 2: Policyholder & Family Validation
    else if (currentStep === 2) {
      console.log('🔍 [VALIDATE FORM] Validating Step 2');
      console.log('🔍 [VALIDATE FORM] RadioButton:', formData.RadioButton);
      console.log('🔍 [VALIDATE FORM] Proposer fields:', {
        ProposerDateOfBirth: formData.ProposerDateOfBirth,
        ProposerGender: formData.ProposerGender,
        ProposerRelationshipWithPolicyHolder: formData.ProposerRelationshipWithPolicyHolder
      });
      
      if (!formData.RadioButton) errors.RadioButton = 'Please select Family, Individual, or Employee';

       // Proposer Details Validation (always required)
       if (!formData.ProposerDateOfBirth) errors.ProposerDateOfBirth = 'Proposer Date of Birth is required';
       if (!formData.ProposerGender) errors.ProposerGender = 'Proposer Gender is required';
       if (!formData.ProposerRelationshipWithPolicyHolder) errors.ProposerRelationshipWithPolicyHolder = 'Proposer Relationship with Policy Holder is required';

       // Individual Details Validation (only if Individual is selected)
      if (formData.RadioButton === 'Individual') {
        console.log('🔍 [VALIDATE FORM] Validating Individual fields:', {
          DateOfBirth: formData.DateOfBirth,
          Gender: formData.Gender,
          RelationshipWithPolicyHolder: formData.RelationshipWithPolicyHolder
        });
        
         if (!formData.DateOfBirth) errors.DateOfBirth = 'Individual Date of Birth is required';
         if (!formData.Gender) errors.Gender = 'Individual Gender is required';
         if (!formData.RelationshipWithPolicyHolder) errors.RelationshipWithPolicyHolder = 'Individual Relationship with Policy Holder is required';
      }

      // Sum Insured and No Claim Bonus validation (only for Family and Employee types)
      if (formData.RadioButton === 'Family' || formData.RadioButton === 'Employee') {
      if (!isValidNumber(formData.SumInsured)) errors.SumInsured = 'Valid Sum Insured is required';
      if (!isValidNumber1(formData.NoClaimBonus)) errors.NoClaimBonus = 'Valid No Claim Bonus is required';
      }

      // Additional validation for Family members
      if (formData.RadioButton === 'Family') {
        formState.familyMembers.forEach((member, index) => {
          if (!member.DateOfBirth) errors[`member${index}_DateOfBirth`] = `Date of Birth is required for family member ${index + 1}`;
          if (!member.Gender) errors[`member${index}_Gender`] = `Gender is required for family member ${index + 1}`;
          if (!member.RelationshipWithPolicyHolder) errors[`member${index}_RelationshipWithPolicyHolder`] = `Relationship with Policy Holder is required for family member ${index + 1}`;
          if (!member.FamilyName) errors[`member${index}_FamilyName`] = `Family member name is required for family member ${index + 1}`;
          if (!member.DateOfJoining) errors[`member${index}_DateOfJoining`] = `Date of Joining is required for family member ${index + 1}`;
          if (!member.PreExistingIllness) errors[`member${index}_PreExistingIllness`] = `Pre-existing Illness is required for family member ${index + 1}`;
        });
      }
      // Additional validation for Employees
      else if (formData.RadioButton === 'Employee') {
        if (formState.employees.length === 0) {
          errors.employees = 'At least one employee is required';
        } else {
          formState.employees.forEach((employee, index) => {
            if (!employee.DateOfBirth) errors[`employee${index}_DateOfBirth`] = `Date of Birth is required for employee ${index + 1}`;
            if (!employee.Gender) errors[`employee${index}_Gender`] = `Gender is required for employee ${index + 1}`;
            if (!employee.RelationshipWithPolicyHolder) errors[`employee${index}_RelationshipWithPolicyHolder`] = `Relationship with Policy Holder is required for employee ${index + 1}`;
            if (!employee.EmployeeName) errors[`employee${index}_EmployeeName`] = `Employee name is required for employee ${index + 1}`;
            if (!employee.DateOfJoining) errors[`employee${index}_DateOfJoining`] = `Date of Joining is required for employee ${index + 1}`;
            if (!employee.PreExistingIllness) errors[`employee${index}_PreExistingIllness`] = `Pre-existing Illness is required for employee ${index + 1}`;
          });
        }
      }
    }

    // Update errors in the state
    setFormState((prevState) => ({
      ...prevState,
      errors,
    }));

    const filteredErrors = Object.keys(errors).filter(
      key => key !== "runningPolicy" && key !== "previousPolicy" && key !== "employees"
    );

    const isValid = filteredErrors.length === 0 &&
      Object.keys(errors.runningPolicy).length === 0 &&
      Object.keys(errors.previousPolicy).length === 0;

    console.log('🔍 [VALIDATE FORM] Final validation result:', isValid);
    console.log('🔍 [VALIDATE FORM] All errors:', errors);
    console.log('🔍 [VALIDATE FORM] Filtered errors count:', filteredErrors.length);

    return isValid;
  };


  const getProductData = async (id) => {
    let obj = {
      mediclaim_company_id: id
    }
    const roleData = await getAllMediclaimProduct(obj);
    if (roleData?.data && roleData?.data?.length) {
      setProductData(roleData?.data)
    } else {
      setProductData([])
    }
  }

  const redirectpageproduct = (pdfPath) => {
    // const file_path = `${DOWNLOAD_URL}public${pdfPath}`;
    const file_path = DOWNLOAD_URL + pdfPath;
    console.log(file_path, "file");

    // Create a temporary <a> element
    const a = document.createElement("a");
    a.href = file_path;
    a.target = "_blank"; // Open in a new tab
    a.download = file_path; // Extract filename from path

    // Trigger the click programmatically
    document.body.appendChild(a);
    a.click();

    // Remove the element after triggering
    document.body.removeChild(a);
  };
  const getCompanyData = async () => {
    const roleData = await getAllMediclaimCompany();
    if (roleData?.data && roleData?.data?.length)
      setCompanyData(roleData?.data)
  }

  const handleNext = () => {
    console.log('=== handleNext Debug Logs ===');
    console.log('Current Step:', currentStep);
    console.log('View Mode:', view);
    console.log('Form State:', {
      formData: formState.formData,
      familyMembers: formState.familyMembers,
      employees: formState.employees,
      errors: formState.errors
    });
    console.log('Policy Radio:', formState.formData.policyRadio);
    console.log('Previous Policy Flag:', formState.formData?.runningPolicy?.PreviousPolicyFlag);

    if (view) {
      console.log('In View Mode - Skipping Validation');
      if (currentStep < 5) {
                    if (currentStep === 3 && (formState?.formData?.policyRadio === 'Fresh' && (formState.formData?.runningPolicy?.PreviousPolicyFlag == '' || formState.formData?.runningPolicy?.PreviousPolicyFlag === "No"))) {
              // Check if there's previous policy data to show
              const hasPreviousPolicyData = formState.formData.previousPolicy && (
                formState.formData.previousPolicy.PolicyNumber ||
                formState.formData.previousPolicy.PolicyFrom ||
                formState.formData.previousPolicy.PolicyTo ||
                formState.formData.previousPolicy.Zone ||
                formState.formData.previousPolicy.PolicyTenure ||
                formState.formData.previousPolicy.PremiumAmount ||
                formState.formData.previousPolicy.NomineeName ||
                formState.formData.previousPolicy.PdfFile
              );
              
              if (hasPreviousPolicyData) {
                console.log('Moving to Step 4 (Previous Policy Details) - has data to display');
                setCurrentStep(4);
              } else {
                console.log('Skipping to Step 5 from Step 3 (Fresh Policy - no previous data)');
                setCurrentStep(5);
              }
            } else {
              console.log('Moving to Next Step:', currentStep + 1);
              setCurrentStep(currentStep + 1);
            }
      }
    } else {
      console.log('Validating Form...');
       console.log('🔍 [VALIDATION] Current form state before validation:', {
         RadioButton: formState.formData.RadioButton,
         policyRadio: formState.formData.policyRadio,
         DateOfBirth: formState.formData.DateOfBirth,
         Gender: formState.formData.Gender,
         RelationshipWithPolicyHolder: formState.formData.RelationshipWithPolicyHolder,
         SumInsured: formState.formData.SumInsured,
         NoClaimBonus: formState.formData.NoClaimBonus,
         // Proposer Details
         ProposerDateOfBirth: formState.formData.ProposerDateOfBirth,
         ProposerGender: formState.formData.ProposerGender,
         ProposerRelationshipWithPolicyHolder: formState.formData.ProposerRelationshipWithPolicyHolder
       });
      const isValid = validateForm();
      
        console.log('🔍 [VALIDATION] Validation result:', isValid);
        console.log('🔍 [VALIDATION] Current errors:', formState.errors);
        
      // Use setTimeout to ensure state updates are complete
      setTimeout(() => {
        if (isValid) {
          console.log('Form Validation Passed');
          console.log('Current Step:', currentStep);
          if (currentStep < 5) {
            if (currentStep === 3 && (formState?.formData?.policyRadio === 'Fresh' && (formState.formData?.runningPolicy?.PreviousPolicyFlag == '' || formState.formData?.runningPolicy?.PreviousPolicyFlag === "No"))) {
              // Check if there's previous policy data to show
              const hasPreviousPolicyData = formState.formData.previousPolicy && (
                formState.formData.previousPolicy.PolicyNumber ||
                formState.formData.previousPolicy.PolicyFrom ||
                formState.formData.previousPolicy.PolicyTo ||
                formState.formData.previousPolicy.Zone ||
                formState.formData.previousPolicy.PolicyTenure ||
                formState.formData.previousPolicy.PremiumAmount ||
                formState.formData.previousPolicy.NomineeName ||
                formState.formData.previousPolicy.PdfFile
              );
              
              if (hasPreviousPolicyData) {
                console.log('Moving to Step 4 (Previous Policy Details) - has data to display');
                setCurrentStep(4);
              } else {
                console.log('Skipping to Step 5 from Step 3 (Fresh Policy - no previous data)');
                setCurrentStep(5);
              }
            } else {
              console.log('Moving to Next Step:', currentStep + 1);
              setCurrentStep(currentStep + 1);
            }
          }
        } else {
          console.log('Form Validation Failed');
          console.log('Validation Errors:', formState.errors);
           console.log('🔍 [VALIDATION] Detailed errors:', JSON.stringify(formState.errors, null, 2));
        }
      }, 0);
    }
    console.log('=== End handleNext Debug Logs ===');
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      if (currentStep === 5 && (formState?.formData?.policyRadio === 'Fresh' && (formState.formData?.runningPolicy?.PreviousPolicyFlag == '' || formState.formData?.runningPolicy?.PreviousPolicyFlag === "No"))) {
        // Check if there's previous policy data to show when going back
        const hasPreviousPolicyData = formState.formData.previousPolicy && (
          formState.formData.previousPolicy.PolicyNumber ||
          formState.formData.previousPolicy.PolicyFrom ||
          formState.formData.previousPolicy.PolicyTo ||
          formState.formData.previousPolicy.Zone ||
          formState.formData.previousPolicy.PolicyTenure ||
          formState.formData.previousPolicy.PremiumAmount ||
          formState.formData.previousPolicy.NomineeName ||
          formState.formData.previousPolicy.PdfFile
        );
        
        if (hasPreviousPolicyData) {
          console.log('Going back to Step 4 (Previous Policy Details) - has data to display');
          setCurrentStep(4);
        } else {
          console.log('Going back to Step 3 (Fresh Policy - no previous data)');
          setCurrentStep(3);
        }
      } else {
        setCurrentStep(currentStep - 1);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return; // Prevent form from submitting if already submitting

    // Only submit when we're on Step 5
    if (currentStep === 5) {
      if (validateForm()) {
        // setIsSubmitting(true); // Set flag to true to prevent multiple submissions

        console.log('Form Submitted', formState.formData);

        // Validate mobile number format
        const regex = /^\d{10}$/;
        if (!regex.test(formState?.formData?.MobileNumber)) {
          toast.error('Mobile number is invalid');
          // setIsSubmitting(false); // Reset the flag
          return;
        }

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

        // Clean the payload to prevent empty objects from being sent
        const cleanPayload = (obj) => {
          const cleaned = {};
          Object.keys(obj).forEach(key => {
            if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
              // If it's an object (not array), clean it recursively
              cleaned[key] = cleanPayload(obj[key]);
            } else if (obj[key] && typeof obj[key] === 'object' && Object.keys(obj[key]).length === 0) {
              // If it's an empty object, set to null
              cleaned[key] = null;
            } else {
              cleaned[key] = obj[key];
            }
          });
          return cleaned;
        };

        // Prepare payload with form data and family members
        const payload = cleanPayload({
          ...formState.formData,
          familyMembers: formState.familyMembers,
          employees: formState.employees,
          ProductName: productType,
          CompanyName: companyType,
          // formDataPDF: formDataPDF,
        });

        console.log('Payload:', payload);

        try {
          let response;
          if (initialData && initialData.id) {
            // Update existing record
            console.log('🔍 [MEDICLAIM UPDATE] Updating existing record with ID:', initialData.id);
            console.log('🔍 [MEDICLAIM UPDATE] Initial data:', initialData);
            console.log('🔍 [MEDICLAIM UPDATE] Payload:', payload);
            
            payload.user_id = initialData.user_id;
            payload.id = initialData.id;
            formDataPDF.append("data", JSON.stringify(payload));
            
            console.log('🔍 [MEDICLAIM UPDATE] FormData contents:');
            for (let [key, value] of formDataPDF.entries()) {
              console.log(`  ${key}:`, value);
            }
            
            response = await updateMediclaimUser(formDataPDF, payload.id, addToast);
            console.log('🔍 [MEDICLAIM UPDATE] API response:', response);
          } else {
            formDataPDF.append("data", JSON.stringify(payload));
            // Add new record
            response = await addMediclaimUser(formDataPDF, addToast);
          }

          if (response.status) {
            // Success logic
            fetchApi();
            onClose();
          }
        } catch (error) {
          console.error('Error during submission:', error);
        } finally {
          setIsSubmitting(false); // Reset the flag after submission attempt
        }
      }
    }
  };


  const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleDateChange = (e) => {
    const dateOfBirth = e.target.value;
    const age = calculateAge(dateOfBirth);
    setFormState(prevState => ({
      ...prevState,
      formData: {
        ...prevState.formData,
        DateOfBirth: dateOfBirth,
        Age: age
      }
    }));
  };

  const handleNomineeDateChange = (e) => {
    const dateOfBirth = e.target.value;
    const age = calculateAge(dateOfBirth);
    setFormState(prevState => ({
      ...prevState,
      formData: {
        ...prevState.formData,
        runningPolicy: {
          ...prevState.formData.runningPolicy,
          NomineeDob: dateOfBirth,
          NomineeAge: age
        }
      }
    }));
  };

  const handleNomineePreviousDateChange = (e) => {
    const dateOfBirth = e.target.value;
    const age = calculateAge(dateOfBirth);
    setFormState(prevState => ({
      ...prevState,
      formData: {
        ...prevState.formData,
        previousPolicy: {
          ...prevState.formData.previousPolicy,
          NomineeDob: dateOfBirth,
          NomineeAge: age
        }
      }
    }));
  };
  const handlePolicyRatio = (e) => {
    const newPolicyType = e.target.value;
    setFormState(prevState => {
      let updatedPreviousPolicy = { ...prevState.formData.previousPolicy };
      console.log(initialData)

      if (initialData?.medicliam_policy_type === 'Fresh' && (newPolicyType === 'Renewal' || newPolicyType === "Portability")) {
        updatedPreviousPolicy = {
          PolicyNumber: prevState.formData.runningPolicy.PolicyNumber || '',
          Zone: prevState.formData.runningPolicy.Zone || '',
          PolicyTenure: prevState.formData.runningPolicy.PolicyTenure || '',
          PremiumAmount: prevState.formData.runningPolicy.PremiumAmount || '',
          NomineeName: prevState.formData.runningPolicy.NomineeName || '',
          NomineeRelation: prevState.formData.runningPolicy.NomineeRelation || '',
          NomineeAge: prevState.formData.runningPolicy.NomineeAge || '',
          NomineeDob: prevState.formData.runningPolicy.NomineeDob || '',
          PolicyFrom: prevState.formData.runningPolicy.PolicyFrom || '',
          PolicyTo: prevState.formData.runningPolicy.PolicyTo || '',
          RenewDate: '',
          PdfFile: '',
          ClaimExpireInPolicy: '',
          PreviousPolicyNumber: '',
          CompanyName: '',
          ClaimStatementPDFfile: '',
        };
        setProductType('')
      }

      return {
        ...prevState,
        formData: {
          ...prevState.formData,
          policyRadio: newPolicyType,
          previousPolicy: updatedPreviousPolicy
        }
      };
    });
  }

  const handleFamilyMemberChange = (index, field, value) => {
    const updatedFamilyMembers = [...formState.familyMembers];

    // Ensure the family member at the given index exists or initialize it
    if (!updatedFamilyMembers[index]) {
      updatedFamilyMembers[index] = {
        Name: '',
        DateOfBirth: '',
        Age: '',
        Gender: '',
        RelationshipWithPolicyHolder: '',
        PreExistingIllness: '',
      };
    }

    // Handle 'DateOfBirth' specifically because we need to calculate 'Age'
    if (field === 'DateOfBirth') {
      const age = calculateAge(value); // Calculate the age based on DateOfBirth

      // If age is valid, update the 'Age' field
      if (age !== null) {
        updatedFamilyMembers[index][field] = value; // Update the DateOfBirth
        updatedFamilyMembers[index]['Age'] = age; // Update the Age
      }
    } else {
      // For all other fields, just update the value directly
      updatedFamilyMembers[index][field] = value;
    }

    // Update the formState with the modified family members
    setFormState(prevState => ({
      ...prevState,
      familyMembers: updatedFamilyMembers
    }));
  };

  const addFamilyMember = () => {
    setFormState(prevState => ({
      ...prevState,
      familyMembers: [
        ...prevState.familyMembers,
        { DateOfBirth: '', Age: '', Gender: '', RelationshipWithPolicyHolder: '', FamilyName: '', DateOfJoining: '', PreExistingIllness: '' }
      ]
    }));
  };

  const removeFamilyMember = (index) => {
    const updatedFamilyMembers = [...formState.familyMembers];
    updatedFamilyMembers.splice(index, 1);
    setFormState(prevState => ({ ...prevState, familyMembers: updatedFamilyMembers }));
  };

  const onChangeHandle = (e) => {
    setProductType('');
    setFormState(prevState => ({ ...prevState, CompanyName: e.target.value }));
    getProductData(e.target.value)

  }

  // Add employee handling functions
  const handleEmployeeChange = (index, field, value) => {
    const updatedEmployees = [...formState.employees];

    // Ensure the employee at the given index exists or initialize it
    if (!updatedEmployees[index]) {
      updatedEmployees[index] = {
        EmployeeName: '',
        DateOfBirth: '',
        Age: '',
        Gender: '',
        RelationshipWithPolicyHolder: '',
        PreExistingIllness: '',
        DateOfJoining: ''
      };
    }

    // Handle 'DateOfBirth' specifically because we need to calculate 'Age'
    if (field === 'DateOfBirth') {
      const age = calculateAge(value); // Calculate the age based on DateOfBirth

      // If age is valid, update the 'Age' field
      if (age !== null) {
        updatedEmployees[index][field] = value; // Update the DateOfBirth
        updatedEmployees[index]['Age'] = age; // Update the Age
      }
    } else {
      // For all other fields, just update the value directly
      updatedEmployees[index][field] = value;
    }

    // Update the formState with the modified employees
    setFormState(prevState => ({
      ...prevState,
      employees: updatedEmployees
    }));
  };

  const addEmployee = () => {
    setFormState(prevState => ({
      ...prevState,
      employees: [
        ...prevState.employees,
        {
          EmployeeName: '',
          DateOfBirth: '',
          Age: '',
          Gender: '',
          RelationshipWithPolicyHolder: '',
          DateOfJoining: '',
          PreExistingIllness: ''
        }
      ]
    }));
  };

  const removeEmployee = (index) => {
    setFormState(prevState => ({
      ...prevState,
      employees: prevState.employees.filter((_, i) => i !== index)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <div className='popup-header d-flex justify-content-between align-items-center'>
          <h2>{initialData ? 'Edit Mediclaim' : 'Add Mediclaim'}</h2>
          <span className="close-btn" onClick={onClose}>&times;</span>
        </div>
        <form className="popup-form" onSubmit={handleSubmit}>
          {currentStep === 1 && (
            <>
              <div className='mediclaim-h1'>
                <h3>Consumer Details</h3>
              </div>
              <div className='row'>
                <div className='col-md-6 mb-4'>
                  <label>Proposer Name</label>
                  <input
                    type="text"
                    name="Name"
                    required
                    className='form-control'
                    placeholder="Proposer Name"
                    value={formState.formData.Name}
                    onChange={(e) => setFormState(prevState => ({
                      ...prevState,
                      formData: {
                        ...prevState.formData,
                        Name: e.target.value
                      }
                    }))}
                  />
                  {formState?.errors?.Name && <p className="text-danger">{formState.errors.Name}</p>}
                </div>
                <div className='col-md-6 mb-4'>
                  <label>Email</label>
                  <input
                    type="email"
                    name="Email"
                    required
                    className='form-control'
                    placeholder="Email"
                    value={formState.formData.Email}
                    onChange={(e) => setFormState(prevState => ({
                      ...prevState,
                      formData: {
                        ...prevState.formData,
                        Email: e.target.value
                      }
                    }))}
                  />
                  {formState?.errors?.Email && <p className="text-danger">{formState.errors.Email}</p>}
                </div>
                <div className='col-md-6 mb-4'>
                  <label>Mobile Number</label>
                  <div style={{ display: 'flex' }}>
                    <FlagDropdown />
                    <input
                      type="text"
                      name="MobileNumber"
                      required
                      className='form-control'
                      style={{ margin: '0px' }}
                      placeholder="Mobile Number"
                      value={formState.formData.MobileNumber}
                      onChange={(e) => setFormState(prevState => ({
                        ...prevState,
                        formData: {
                          ...prevState.formData,
                          MobileNumber: e.target.value
                        }
                      }))}
                    />
                  </div>
                  {formState?.errors?.MobileNumber && <p className="text-danger">{formState.errors.MobileNumber}</p>}
                </div>
                <div className='col-md-6 mb-4'>
                  <label>Reference Name</label>
                  <input
                    type="text"
                    name="ReferenceName"
                    className='form-control'
                    placeholder="Reference Name"
                    value={formState.formData.ReferenceName}
                    onChange={(e) => setFormState(prevState => ({
                      ...prevState,
                      formData: {
                        ...prevState.formData,
                        ReferenceName: e.target.value
                      }
                    }))}
                  />
                </div>
                <div className='col-md-6 mb-4'>
                  <label>Company Name</label>
                  <select
                    name="CompanyName"
                    required
                    value={companyType}
                    className='form-select'
                    onChange={(e) => { setCompanyType(e.target.value); onChangeHandle(e) }}
                  >
                    <option value="">Select Company</option>
                    {companyData && companyData.map((item) => (
                      <option key={item.mediclaim_company_id} value={item.mediclaim_company_id}>
                        {item.mediclaim_company_name}
                      </option>
                    ))}
                  </select>
                  {formState?.errors?.CompanyName && <p className="text-danger">{formState.errors.CompanyName}</p>}
                </div>
                <div className='col-md-6 mb-4 d-grid'>
                  <label>Policy Member</label>
                  <label className='flex align-items-center'>
                    <input
                      type="radio"
                      name="RadioButton"
                      required
                      className='me-2'
                      value="Family"
                      checked={formState.formData.RadioButton === 'Family'}
                      onChange={(e) => setFormState(prevState => ({
                        ...prevState,
                        formData: {
                          ...prevState.formData,
                          RadioButton: e.target.value
                        }
                      }))}
                    />
                    Family
                  </label>
                  <label className='flex align-items-center'>
                    <input
                      type="radio"
                      name="RadioButton"
                      className='me-2'
                      value="Individual"
                      checked={formState.formData.RadioButton === 'Individual'}
                      onChange={(e) => setFormState(prevState => ({
                        ...prevState,
                        formData: {
                          ...prevState.formData,
                          RadioButton: e.target.value
                        }
                      }))}
                    />
                    Individual
                  </label>
                  <label className='flex align-items-center'>
                    <input
                      type="radio"
                      name="RadioButton"
                      className='me-2'
                      value="Employee"
                      checked={formState.formData.RadioButton === 'Employee'}
                      onChange={(e) => setFormState(prevState => ({
                        ...prevState,
                        formData: {
                          ...prevState.formData,
                          RadioButton: e.target.value
                        }
                      }))}
                    />
                    Employee
                  </label>
                  {formState?.errors?.RadioButton && <p className="text-danger">{formState.errors.RadioButton}</p>}
                </div>
                <div className='col-md-6 mb-4 d-grid'>
                  <label>Policy Type</label>
                  <label className='flex align-items-center'>
                    <input
                      type="radio"
                      name="policyRadio"
                      required
                      className='me-2'
                      value="Fresh"
                      checked={formState.formData.policyRadio === 'Fresh'}
                      onChange={(e) => handlePolicyRatio(e)}
                    />
                    Fresh
                  </label>
                  <label className='flex align-items-center'>
                    <input
                      type="radio"
                      name="policyRadio"
                      className='me-2'
                      value="Renewal"
                      checked={formState.formData.policyRadio === 'Renewal'}
                      onChange={(e) => handlePolicyRatio(e)}
                    />
                    Renewal
                  </label>
                  <label className='flex align-items-center'>
                    <input
                      type="radio"
                      name="policyRadio"
                      className='me-2'
                      value="Portability"
                      checked={formState.formData.policyRadio === 'Portability'}
                      onChange={(e) => handlePolicyRatio(e)}
                    />
                    Portability
                  </label>
                  {formState?.errors?.policyRadio && <p className="text-danger">{formState.errors.policyRadio}</p>}
                </div>
              </div>
            </>
          )}
          {currentStep === 2 && (
            <>
              <div className='mediclaim-h1'>
                <h3>Policy Details</h3>
              </div>
              {/* <div className='row'>
                    <div className='col-md-6 mb-4'>
                      <label>Date of Birth</label>
                      <input
                        type="date"
                        name="DateOfBirth"
                        className='form-control'
                        value={formState.formData.DateOfBirth}
                        onChange={handleDateChange}
                      />
                      {formState?.errors?.DateOfBirth && <p className="text-danger">{formState.errors.DateOfBirth}</p>}
                    </div>
                    <div className='col-md-6 mb-4'>
                      <label>Age</label>
                      <input
                        type="text"
                        name="Age"
                        className='form-control'
                        value={formState.formData.Age}
                        disabled
                      />
                      {formState?.errors?.Age && <p className="text-danger">{formState.errors.Age}</p>}
                    </div>
                    <div className='col-md-6 mb-4'>
                      <label>Gender</label>
                      <div className='d-flex'>
                        <label className='me-2'>
                          <input
                            type="radio"
                            name="Gender"
                            className='me-2'
                            value="Male"
                            checked={formState.formData.Gender === 'Male'}
                            onChange={(e) => setFormState(prevState => ({
                              ...prevState,
                              formData: {
                                ...prevState.formData,
                                Gender: e.target.value
                              }
                            }))}
                          />
                          Male
                        </label>
                        <label className='me-2'>
                          <input
                            type="radio"
                            name="Gender"
                            className='me-2'
                            value="Female"
                            checked={formState.formData.Gender === 'Female'}
                            onChange={(e) => setFormState(prevState => ({
                              ...prevState,
                              formData: {
                                ...prevState.formData,
                                Gender: e.target.value
                              }
                            }))}
                          />
                          Female
                        </label>
                        <label className='me-2'>
                          <input
                            type="radio"
                            name="Gender"
                            className='me-2'
                            value="Other"
                            checked={formState.formData.Gender === 'Other'}
                            onChange={(e) => setFormState(prevState => ({
                              ...prevState,
                              formData: {
                                ...prevState.formData,
                                Gender: e.target.value
                              }
                            }))}
                          />
                          Other
                        </label>
                      </div>
                      {formState?.errors?.Gender && <p className="text-danger">{formState.errors.Gender}</p>}
                    </div>
                    <div className='col-md-6 mb-4'>
                      <label>Relationship with Policy Holder</label>
                      <input
                        type="text"
                        name="RelationshipWithPolicyHolder"
                        className='form-control'
                        value={formState.formData.RelationshipWithPolicyHolder}
                        onChange={(e) => setFormState(prevState => ({
                          ...prevState,
                          formData: {
                            ...prevState.formData,
                            RelationshipWithPolicyHolder: e.target.value
                          }
                        }))}
                      />
                      {formState?.errors?.RelationshipWithPolicyHolder && <p className="text-danger">{formState.errors.RelationshipWithPolicyHolder}</p>}
                    </div>
                    <div className='col-md-6 mb-4'>
                      <label>Date of Joining</label>
                      <input
                        type="date"
                        name="DateOfJoining"
                        className='form-control'
                        value={formState.formData.DateOfJoining}
                        onChange={(e) => setFormState(prevState => ({
                          ...prevState,
                          formData: {
                            ...prevState.formData,
                            DateOfJoining: e.target.value
                          }
                        }))}
                      />
                      {formState?.errors?.DateOfJoining && <p className="text-danger">{formState.errors.DateOfJoining}</p>}
                    </div>
                    <div className='col-md-6 mb-4'>
                      <label>Pre-existing Illness</label>
                      <input
                        type="text"
                        name="PreExistingIllness"
                        className='form-control'
                        value={formState.formData.PreExistingIllness}
                        onChange={(e) => setFormState(prevState => ({
                          ...prevState,
                          formData: {
                            ...prevState.formData,
                            PreExistingIllness: e.target.value
                          }
                        }))}
                      />
                      {formState?.errors?.PreExistingIllness && <p className="text-danger">{formState.errors.PreExistingIllness}</p>}
                    </div>
                  </div> */}

                             {/* Proposer Details Section */}
               <div className='mediclaim-h1 mt-4'>
                 <h3>Proposer Details</h3>
               </div>
               <div className='row'>
                                    <div className='col-md-6 mb-4'>
                     <label>Date of Birth</label>
                     <input
                       type="date"
                       name="ProposerDateOfBirth"
                       className='form-control'
                       value={formState.formData.ProposerDateOfBirth || ''}
                       onChange={(e) => {
                         const dateOfBirth = e.target.value;
                         const age = calculateAge(dateOfBirth);
                         setFormState(prevState => ({
                           ...prevState,
                           formData: {
                             ...prevState.formData,
                             ProposerDateOfBirth: dateOfBirth,
                             ProposerAge: age
                           }
                         }));
                       }}
                     />
                     {formState?.errors?.ProposerDateOfBirth && <p className="text-danger">{formState.errors.ProposerDateOfBirth}</p>}
                   </div>
                 <div className='col-md-6 mb-4'>
                   <label>Age</label>
                   <input
                     type="text"
                     name="ProposerAge"
                     className='form-control'
                     value={formState.formData.ProposerAge || ''}
                     disabled
                   />
                 </div>
                                    <div className='col-md-6 mb-4'>
                     <label>Gender</label>
                     <div className='d-flex'>
                       <label className='me-2'>
                         <input
                           type="radio"
                           name="ProposerGender"
                           className='me-2'
                           value="Male"
                           checked={formState.formData.ProposerGender === 'Male'}
                           onChange={(e) => setFormState(prevState => ({
                             ...prevState,
                             formData: {
                               ...prevState.formData,
                               ProposerGender: e.target.value
                             }
                           }))}
                         />
                         Male
                       </label>
                       <label className='me-2'>
                         <input
                           type="radio"
                           name="ProposerGender"
                           className='me-2'
                           value="Female"
                           checked={formState.formData.ProposerGender === 'Female'}
                           onChange={(e) => setFormState(prevState => ({
                             ...prevState,
                             formData: {
                               ...prevState.formData,
                               ProposerGender: e.target.value
                             }
                           }))}
                         />
                         Female
                       </label>
                       <label className='me-2'>
                         <input
                           type="radio"
                           name="ProposerGender"
                           className='me-2'
                           value="Other"
                           checked={formState.formData.ProposerGender === 'Other'}
                           onChange={(e) => setFormState(prevState => ({
                             ...prevState,
                             formData: {
                               ...prevState.formData,
                               ProposerGender: e.target.value
                             }
                           }))}
                         />
                         Other
                       </label>
                     </div>
                     {formState?.errors?.ProposerGender && <p className="text-danger">{formState.errors.ProposerGender}</p>}
                   </div>
                                    <div className='col-md-6 mb-4'>
                     <label>Relationship with Policy Holder</label>
                     <input
                       type="text"
                       name="ProposerRelationshipWithPolicyHolder"
                       className='form-control'
                       value={formState.formData.ProposerRelationshipWithPolicyHolder || ''}
                       onChange={(e) => setFormState(prevState => ({
                         ...prevState,
                         formData: {
                           ...prevState.formData,
                           ProposerRelationshipWithPolicyHolder: e.target.value
                         }
                       }))}
                     />
                     {formState?.errors?.ProposerRelationshipWithPolicyHolder && <p className="text-danger">{formState.errors.ProposerRelationshipWithPolicyHolder}</p>}
                   </div>
                   <div className='col-md-6 mb-4'>
                     <label>Pre-existing Illness</label>
                     <input
                       type="text"
                       name="ProposerPreExistingIllness"
                       className='form-control'
                       value={formState.formData.ProposerPreExistingIllness || ''}
                       onChange={(e) => setFormState(prevState => ({
                         ...prevState,
                         formData: {
                           ...prevState.formData,
                           ProposerPreExistingIllness: e.target.value
                         }
                       }))}
                     />
                   </div>
               </div>

              {formState.formData.RadioButton === 'Individual' && (
                <>
                  <div className='mediclaim-h1 mt-4'>
                    <h3>Individual Details</h3>
                  </div>
                  <div className='row'>
                    <div className='col-md-6 mb-4'>
                      <label>Date of Birth</label>
                      <input
                        type="date"
                        name="DateOfBirth"
                        className='form-control'
                        value={formState.formData.DateOfBirth}
                        onChange={handleDateChange}
                      />
                      {formState?.errors?.DateOfBirth && <p className="text-danger">{formState.errors.DateOfBirth}</p>}
                    </div>
                    <div className='col-md-6 mb-4'>
                      <label>Age</label>
                      <input
                        type="text"
                        name="Age"
                        className='form-control'
                        value={formState.formData.Age}
                        disabled
                      />
                      {formState?.errors?.Age && <p className="text-danger">{formState.errors.Age}</p>}
                    </div>
                    <div className='col-md-6 mb-4'>
                      <label>Gender</label>
                      <div className='d-flex'>
                        <label className='me-2'>
                          <input
                            type="radio"
                            name="Gender"
                            className='me-2'
                            value="Male"
                            checked={formState.formData.Gender === 'Male'}
                            onChange={(e) => setFormState(prevState => ({
                              ...prevState,
                              formData: {
                                ...prevState.formData,
                                Gender: e.target.value
                              }
                            }))}
                          />
                          Male
                        </label>
                        <label className='me-2'>
                          <input
                            type="radio"
                            name="Gender"
                            className='me-2'
                            value="Female"
                            checked={formState.formData.Gender === 'Female'}
                            onChange={(e) => setFormState(prevState => ({
                              ...prevState,
                              formData: {
                                ...prevState.formData,
                                Gender: e.target.value
                              }
                            }))}
                          />
                          Female
                        </label>
                        <label className='me-2'>
                          <input
                            type="radio"
                            name="Gender"
                            className='me-2'
                            value="Other"
                            checked={formState.formData.Gender === 'Other'}
                            onChange={(e) => setFormState(prevState => ({
                              ...prevState,
                              formData: {
                                ...prevState.formData,
                                Gender: e.target.value
                              }
                            }))}
                          />
                          Other
                        </label>
                      </div>
                      {formState?.errors?.Gender && <p className="text-danger">{formState.errors.Gender}</p>}
                    </div>
                    <div className='col-md-6 mb-4'>
                      <label>Relationship with Policy Holder</label>
                      <input
                        type="text"
                        name="RelationshipWithPolicyHolder"
                        className='form-control'
                        value={formState.formData.RelationshipWithPolicyHolder}
                        onChange={(e) => setFormState(prevState => ({
                          ...prevState,
                          formData: {
                            ...prevState.formData,
                            RelationshipWithPolicyHolder: e.target.value
                          }
                        }))}
                      />
                      {formState?.errors?.RelationshipWithPolicyHolder && <p className="text-danger">{formState.errors.RelationshipWithPolicyHolder}</p>}
                    </div>
                    <div className='col-md-6 mb-4'>
                      <label>Date of Joining</label>
                      <input
                        type="date"
                        name="DateOfJoining"
                        className='form-control'
                        value={formState.formData.DateOfJoining}
                        onChange={(e) => setFormState(prevState => ({
                          ...prevState,
                          formData: {
                            ...prevState.formData,
                            DateOfJoining: e.target.value
                          }
                        }))}
                      />
                      {formState?.errors?.DateOfJoining && <p className="text-danger">{formState.errors.DateOfJoining}</p>}
                    </div>
                    <div className='col-md-6 mb-4'>
                      <label>Pre-existing Illness</label>
                      <input
                        type="text"
                        name="PreExistingIllness"
                        className='form-control'
                        value={formState.formData.PreExistingIllness}
                        onChange={(e) => setFormState(prevState => ({
                          ...prevState,
                          formData: {
                            ...prevState.formData,
                            PreExistingIllness: e.target.value
                          }
                        }))}
                      />
                      {formState?.errors?.PreExistingIllness && <p className="text-danger">{formState.errors.PreExistingIllness}</p>}
                    </div>
                  </div>
                </>
              )}

              {formState.formData.RadioButton === 'Family' && (
                <>
                  <div className='mediclaim-h1 mt-4'>
                    <h3>Family Member Details</h3>
                  </div>
                  <div>
                    <button type="button" className='btn btn-blue mb-2' onClick={addFamilyMember}>Add Family Member</button>
                  </div>
                  {formState.familyMembers && formState.familyMembers.map((member, index) => (
                    <div key={index} className="family-section mt-3">
                      <h5>Family Member {index + 1}</h5>
                      <div className='row'>
                        <div className='col-md-6 mb-3'>
                          <label>Member Name</label>
                          <input
                            type="text"
                            className='form-control'
                            value={member.FamilyName}
                            onChange={(e) => handleFamilyMemberChange(index, 'FamilyName', e.target.value)}
                          />
                          {formState?.errors && formState?.errors[`member${index}_FamilyName`] && (
                            <div className="text-danger">{formState.errors[`member${index}_FamilyName`]}</div>
                          )}
                        </div>
                        <div className='col-md-6 mb-3'>
                          <label>Date of Birth</label>
                          <input
                            type="date"
                            className='form-control'
                            value={member.DateOfBirth}
                            onChange={(e) => handleFamilyMemberChange(index, 'DateOfBirth', e.target.value)}
                          />
                          {formState?.errors && formState?.errors[`member${index}_DateOfBirth`] && (
                            <div className="text-danger">{formState.errors[`member${index}_DateOfBirth`]}</div>
                          )}
                        </div>
                        <div className="col-md-6 mb-3">
                          <label>Age</label>
                          <input
                            type="text"
                            value={member.Age}
                            disabled
                            className="form-control"
                          />
                          {formState?.errors && formState?.errors[`member${index}_Age`] && (
                            <div className="text-danger">{formState.errors[`member${index}_Age`]}</div>
                          )}
                        </div>
                        <div className='col-md-6 mb-3'>
                          <label>Gender</label>
                          <div className='d-flex'>
                            <label className='me-2'>
                              <input
                                type="radio"
                                name={`memberGender-${index}`}
                                className='me-2'
                                value="Male"
                                checked={member.Gender === 'Male'}
                                onChange={(e) => handleFamilyMemberChange(index, 'Gender', e.target.value)}
                              />
                              Male
                            </label>
                            <label className='me-2'>
                              <input
                                type="radio"
                                name={`memberGender-${index}`}
                                className='me-2'
                                value="Female"
                                checked={member.Gender === 'Female'}
                                onChange={(e) => handleFamilyMemberChange(index, 'Gender', e.target.value)}
                              />
                              Female
                            </label>
                            <label className='me-2'>
                              <input
                                type="radio"
                                name={`memberGender-${index}`}
                                className='me-2'
                                value="Other"
                                checked={member.Gender === 'Other'}
                                onChange={(e) => handleFamilyMemberChange(index, 'Gender', e.target.value)}
                              />
                              Other
                            </label>
                          </div>
                          {formState?.errors && formState?.errors[`member${index}_Gender`] && (
                            <div className="text-danger">{formState.errors[`member${index}_Gender`]}</div>
                          )}
                        </div>
                        <div className='col-md-6 mb-3'>
                          <label>Relationship with Policy Holder</label>
                          <input
                            type="text"
                            className='form-control'
                            value={member.RelationshipWithPolicyHolder}
                            onChange={(e) => handleFamilyMemberChange(index, 'RelationshipWithPolicyHolder', e.target.value)}
                          />
                          {formState?.errors && formState?.errors[`member${index}_RelationshipWithPolicyHolder`] && (
                            <div className="text-danger">{formState.errors[`member${index}_RelationshipWithPolicyHolder`]}</div>
                          )}
                        </div>
                        <div className='col-md-6 mb-3'>
                          <label>Date of Joining</label>
                          <input
                            type="date"
                            className='form-control'
                            value={member.DateOfJoining}
                            onChange={(e) => handleFamilyMemberChange(index, 'DateOfJoining', e.target.value)}
                          />
                          {formState?.errors && formState?.errors[`member${index}_DateOfJoining`] && (
                            <div className="text-danger">{formState.errors[`member${index}_DateOfJoining`]}</div>
                          )}
                        </div>
                        <div className='col-md-6 mb-3'>
                          <label>Pre-existing Illness</label>
                          <input
                            type="text"
                            className='form-control'
                            value={member.PreExistingIllness}
                            onChange={(e) => handleFamilyMemberChange(index, 'PreExistingIllness', e.target.value)}
                          />
                          {formState?.errors && formState?.errors[`member${index}_PreExistingIllness`] && (
                            <div className="text-danger">{formState.errors[`member${index}_PreExistingIllness`]}</div>
                          )}
                        </div>
                        <div className='col-md-12'>
                          <button
                            type="button"
                            className='btn btn-danger'
                            onClick={() => removeFamilyMember(index)}
                          >
                            Remove Family Member
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="row mt-4">
                    <div className="col-md-6 mb-4">
                      <label>Sum Insured</label>
                      <input
                        type="number"
                        name="SumInsured"
                        className="form-control"
                        value={formState.formData.SumInsured}
                        onChange={(e) => setFormState(prevState => ({
                          ...prevState,
                          formData: {
                            ...prevState.formData,
                            SumInsured: e.target.value
                          }
                        }))}
                      />
                      {formState?.errors?.SumInsured && <p className="text-danger">{formState.errors.SumInsured}</p>}
                    </div>
                    <div className="col-md-6 mb-4">
                      <label>No Claim Bonus</label>
                      <input
                        type="number"
                        name="NoClaimBonus"
                        className="form-control"
                        value={formState.formData.NoClaimBonus}
                        onChange={(e) => setFormState(prevState => ({
                          ...prevState,
                          formData: {
                            ...prevState.formData,
                            NoClaimBonus: e.target.value
                          }
                        }))}
                      />
                      {formState?.errors?.NoClaimBonus && <p className="text-danger">{formState.errors.NoClaimBonus}</p>}
                    </div>
                  </div>
                </>
              )}

              {formState.formData.RadioButton === 'Employee' && (
                <>
                  <div className='mediclaim-h1 mt-4'>
                    <h3>Employee Details</h3>
                  </div>
                  <div>
                    <button type="button" className='btn btn-blue mb-2' onClick={addEmployee}>Add Employee</button>
                  </div>
                  {formState.employees && formState.employees.map((employee, index) => (
                    <div key={index} className="employee-section mt-3">
                      <h5>Employee {index + 1}</h5>
                      <div className='row'>
                        <div className='col-md-6 mb-3'>
                          <label>Name</label>
                          <input
                            type="text"
                            className='form-control'
                            value={employee.EmployeeName}
                            onChange={(e) => handleEmployeeChange(index, 'EmployeeName', e.target.value)}
                          />
                          {formState?.errors && formState?.errors[`employee${index}_EmployeeName`] && (
                            <div className="text-danger">{formState.errors[`employee${index}_EmployeeName`]}</div>
                          )}
                        </div>
                        <div className='col-md-6 mb-3'>
                          <label>Date of Birth</label>
                          <input
                            type="date"
                            className='form-control'
                            value={employee.DateOfBirth}
                            onChange={(e) => handleEmployeeChange(index, 'DateOfBirth', e.target.value)}
                          />
                          {formState?.errors && formState?.errors[`employee${index}_DateOfBirth`] && (
                            <div className="text-danger">{formState.errors[`employee${index}_DateOfBirth`]}</div>
                          )}
                        </div>
                        <div className="col-md-6 mb-3">
                          <label>Age</label>
                          <input
                            type="text"
                            value={employee.Age}
                            disabled
                            className="form-control"
                          />
                          {formState?.errors && formState?.errors[`employee${index}_Age`] && (
                            <div className="text-danger">{formState.errors[`employee${index}_Age`]}</div>
                          )}
                        </div>
                        <div className='col-md-6 mb-3'>
                          <label>Gender</label>
                          <div className='d-flex'>
                            <label className='me-2'>
                              <input
                                type="radio"
                                name={`employeeGender-${index}`}
                                className='me-2'
                                value="Male"
                                checked={employee.Gender === 'Male'}
                                onChange={(e) => handleEmployeeChange(index, 'Gender', e.target.value)}
                              />
                              Male
                            </label>
                            <label className='me-2'>
                              <input
                                type="radio"
                                name={`employeeGender-${index}`}
                                className='me-2'
                                value="Female"
                                checked={employee.Gender === 'Female'}
                                onChange={(e) => handleEmployeeChange(index, 'Gender', e.target.value)}
                              />
                              Female
                            </label>
                            <label className='me-2'>
                              <input
                                type="radio"
                                name={`employeeGender-${index}`}
                                className='me-2'
                                value="Other"
                                checked={employee.Gender === 'Other'}
                                onChange={(e) => handleEmployeeChange(index, 'Gender', e.target.value)}
                              />
                              Other
                            </label>
                          </div>
                          {formState?.errors && formState?.errors[`employee${index}_Gender`] && (
                            <div className="text-danger">{formState.errors[`employee${index}_Gender`]}</div>
                          )}
                        </div>
                        <div className='col-md-6 mb-3'>
                          <label>Relationship with Policy Holder</label>
                          <input
                            type="text"
                            className='form-control'
                            value={employee.RelationshipWithPolicyHolder}
                            onChange={(e) => handleEmployeeChange(index, 'RelationshipWithPolicyHolder', e.target.value)}
                          />
                          {formState?.errors && formState?.errors[`employee${index}_RelationshipWithPolicyHolder`] && (
                            <div className="text-danger">{formState.errors[`employee${index}_RelationshipWithPolicyHolder`]}</div>
                          )}
                        </div>
                        <div className='col-md-6 mb-3'>
                          <label>Date of Joining</label>
                          <input
                            type="date"
                            className='form-control'
                            value={employee.DateOfJoining}
                            onChange={(e) => handleEmployeeChange(index, 'DateOfJoining', e.target.value)}
                          />
                          {formState?.errors && formState?.errors[`employee${index}_DateOfJoining`] && (
                            <div className="text-danger">{formState.errors[`employee${index}_DateOfJoining`]}</div>
                          )}
                        </div>
                        <div className='col-md-6 mb-3'>
                          <label>Pre-existing Illness</label>
                          <input
                            type="text"
                            className='form-control'
                            value={employee.PreExistingIllness}
                            onChange={(e) => handleEmployeeChange(index, 'PreExistingIllness', e.target.value)}
                          />
                          {formState?.errors && formState?.errors[`employee${index}_PreExistingIllness`] && (
                            <div className="text-danger">{formState.errors[`employee${index}_PreExistingIllness`]}</div>
                          )}
                        </div>
                        <div className='col-md-12'>
                          <button
                            type="button"
                            className='btn btn-danger'
                            onClick={() => removeEmployee(index)}
                          >
                            Remove Employee
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="row mt-4">
                    <div className="col-md-6 mb-4">
                      <label>Sum Insured</label>
                      <input
                        type="number"
                        name="SumInsured"
                        className="form-control"
                        value={formState.formData.SumInsured}
                        onChange={(e) => setFormState(prevState => ({
                          ...prevState,
                          formData: {
                            ...prevState.formData,
                            SumInsured: e.target.value
                          }
                        }))}
                      />
                      {formState?.errors?.SumInsured && <p className="text-danger">{formState.errors.SumInsured}</p>}
                    </div>
                    <div className="col-md-6 mb-4">
                      <label>No Claim Bonus</label>
                      <input
                        type="number"
                        name="NoClaimBonus"
                        className="form-control"
                        value={formState.formData.NoClaimBonus}
                        onChange={(e) => setFormState(prevState => ({
                          ...prevState,
                          formData: {
                            ...prevState.formData,
                            NoClaimBonus: e.target.value
                          }
                        }))}
                      />
                      {formState?.errors?.NoClaimBonus && <p className="text-danger">{formState.errors.NoClaimBonus}</p>}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
          {currentStep === 3 && (
            <>
              <div className="mediclaim-h1">
                <h3>Running Policy Details</h3>
              </div>
              <div className="row">
                <div className="col-md-6 mb-4">
                  <label>Policy Number</label>
                  <input
                    type="text"
                    name="RunningPolicyNumber"
                    className="form-control"
                    placeholder="Policy Number"
                    value={formState?.formData?.runningPolicy?.PolicyNumber}
                    onChange={(e) => setFormState(prevState => ({
                      ...prevState,
                      formData: {
                        ...prevState.formData,
                        runningPolicy: {
                          ...prevState.formData?.runningPolicy,
                          PolicyNumber: e.target.value
                        }
                      }
                    }))}
                  />
                  {formState.errors?.runningPolicy?.PolicyNumber && <div className="text-danger">{formState.errors?.runningPolicy?.PolicyNumber}</div>}
                </div>

                <div className="col-md-6 mb-4">
                  <label>Zone</label>
                  <input
                    type="text"
                    name="RunningZone"
                    className="form-control"
                    placeholder="Zone"
                    value={formState?.formData?.runningPolicy?.Zone}
                    onChange={(e) => setFormState(prevState => ({
                      ...prevState,
                      formData: {
                        ...prevState.formData,
                        runningPolicy: {
                          ...prevState.formData?.runningPolicy,
                          Zone: e.target.value
                        }
                      }
                    }))}
                  />
                  {formState.errors?.runningPolicy?.Zone && <div className="text-danger">{formState.errors?.runningPolicy?.Zone}</div>}
                </div>

                <div className="col-md-6 mb-4">
                  <label>Policy Tenure</label>
                  <input
                    type="number"
                    name="RunningPolicyTenure"
                    className="form-control"
                    placeholder="Policy Tenure"
                    value={formState?.formData?.runningPolicy?.PolicyTenure}
                    onChange={(e) => setFormState(prevState => ({
                      ...prevState,
                      formData: {
                        ...prevState.formData,
                        runningPolicy: {
                          ...prevState.formData?.runningPolicy,
                          PolicyTenure: e.target.value
                        }
                      }
                    }))}
                  />
                  {formState.errors?.runningPolicy?.PolicyTenure && <div className="text-danger">{formState.errors?.runningPolicy?.PolicyTenure}</div>}
                </div>

                <div className="col-md-6 mb-4">
                  <label>Premium Amount</label>
                  <input
                    type="number"
                    name="RunningPremiumAmount"
                    className="form-control"
                    placeholder="Premium Amount"
                    value={formState?.formData?.runningPolicy?.PremiumAmount}
                    onChange={(e) => setFormState(prevState => ({
                      ...prevState,
                      formData: {
                        ...prevState.formData,
                        runningPolicy: {
                          ...prevState.formData?.runningPolicy,
                          PremiumAmount: e.target.value
                        }
                      }
                    }))}
                  />
                  {formState.errors?.runningPolicy?.PremiumAmount && <div className="text-danger">{formState.errors?.runningPolicy?.PremiumAmount}</div>}
                </div>

                <div className="col-md-6 mb-4">
                  <label>From</label>
                  <input
                    type="date"
                    name="poifrom"
                    className="form-control"
                    value={formState?.formData?.runningPolicy?.PolicyFrom}
                    onChange={(e) => {
                      const poifrom = e.target.value;
                      setFormState(prevState => ({
                        ...prevState,
                        formData: {
                          ...prevState.formData,
                          runningPolicy: {
                            ...prevState.formData?.runningPolicy,
                            PolicyFrom: poifrom
                          }
                        }
                      }));
                    }}
                  />
                  {formState.errors?.runningPolicy?.PolicyFrom && <div className="text-danger">{formState.errors?.runningPolicy?.PolicyFrom}</div>}
                </div>

                <div className="col-md-6 mb-4">
                  <label>To</label>
                  <input
                    type="date"
                    name="poito"
                    className="form-control"
                    value={formState.formData?.runningPolicy?.PolicyTo}
                    onChange={(e) => {
                      const poito = e.target.value;
                      setFormState(prevState => ({
                        ...prevState,
                        formData: {
                          ...prevState.formData,
                          runningPolicy: {
                            ...prevState.formData?.runningPolicy,
                            PolicyTo: poito,
                            ExpiryDate: poito
                          }
                        }
                      }));
                    }}
                  />
                  {formState.errors?.runningPolicy?.PolicyTo && <div className="text-danger">{formState.errors?.runningPolicy?.PolicyTo}</div>}
                </div>

                <div className="col-md-6 mb-4">
                  <label>Add On Cover</label>
                  <input
                    type="text"
                    name="AddOnCover"
                    className="form-control"
                    placeholder="Add On Cover"
                    value={formState?.formData?.runningPolicy?.AddOnCover}
                    onChange={(e) => setFormState(prevState => ({
                      ...prevState,
                      formData: {
                        ...prevState.formData,
                        runningPolicy: {
                          ...prevState.formData?.runningPolicy,
                          AddOnCover: e.target.value
                        }
                      }
                    }))}
                  />
                  {formState.errors?.runningPolicy?.AddOnCover && <div className="text-danger">{formState.errors?.runningPolicy?.AddOnCover}</div>}
                </div>

                <div className="col-md-6 mb-4">
                  <label>Policy Issued Date</label>
                  <input
                    type="date"
                    name="PolicyIssuedDate"
                    className="form-control"
                    value={formState?.formData?.runningPolicy?.PolicyIssuedDate}
                    onChange={(e) => {
                      const policyIssuedDate = e.target.value;
                      setFormState(prevState => ({
                        ...prevState,
                        formData: {
                          ...prevState.formData,
                          runningPolicy: {
                            ...prevState.formData?.runningPolicy,
                            PolicyIssuedDate: policyIssuedDate
                          }
                        }
                      }));
                    }}
                  />
                  {formState.errors?.runningPolicy?.PolicyIssuedDate && <div className="text-danger">{formState.errors?.runningPolicy?.PolicyIssuedDate}</div>}
                </div>

                <div className="col-md-6 mb-4">
                  <label>Policy Expiry Date</label>
                  <input
                    type="date"
                    name="ExpiryDate"
                    className="form-control"
                    value={formState?.formData?.runningPolicy?.ExpiryDate}
                    disabled
                  />
                  {formState.errors?.runningPolicy?.ExpiryDate && <div className="text-danger">{formState.errors?.runningPolicy?.ExpiryDate}</div>}
                </div>

                <div className="col-md-6 mb-4">
                  <label>Policy Plan Type</label>
                  <input
                    type="text"
                    name="PolicyPlanType"
                    className="form-control"
                    placeholder="Policy Plan Type"
                    value={formState?.formData?.runningPolicy?.PolicyPlanType}
                    onChange={(e) => setFormState(prevState => ({
                      ...prevState,
                      formData: {
                        ...prevState.formData,
                        runningPolicy: {
                          ...prevState.formData?.runningPolicy,
                          PolicyPlanType: e.target.value
                        }
                      }
                    }))}
                  />
                  {formState.errors?.runningPolicy?.PolicyPlanType && <div className="text-danger">{formState.errors?.runningPolicy?.PolicyPlanType}</div>}
                </div>

                <div className="col-md-6 mb-4">
                  <label>Nominee Name</label>
                  <input
                    type="text"
                    name="NomineeName"
                    className="form-control"
                    placeholder="Nominee Name"
                    value={formState?.formData?.runningPolicy?.NomineeName}
                    onChange={(e) => setFormState(prevState => ({
                      ...prevState,
                      formData: {
                        ...prevState.formData,
                        runningPolicy: {
                          ...prevState.formData?.runningPolicy,
                          NomineeName: e.target.value
                        }
                      }
                    }))}
                  />
                  {formState.errors?.runningPolicy?.NomineeName && <div className="text-danger">{formState.errors?.runningPolicy?.NomineeName}</div>}
                </div>

                <div className="col-md-6 mb-4">
                  <label>Nominee Relation</label>
                  <input
                    type="text"
                    name="NomineeRelation"
                    className="form-control"
                    placeholder="Nominee Relation"
                    value={formState?.formData?.runningPolicy?.NomineeRelation}
                    onChange={(e) => setFormState(prevState => ({
                      ...prevState,
                      formData: {
                        ...prevState.formData,
                        runningPolicy: {
                          ...prevState.formData?.runningPolicy,
                          NomineeRelation: e.target.value
                        }
                      }
                    }))}
                  />
                  {formState.errors?.runningPolicy?.NomineeRelation && <div className="text-danger">{formState.errors?.runningPolicy?.NomineeRelation}</div>}
                </div>

                <div className="col-md-6 mb-4">
                  <label>Nominee DOB</label>
                  <input
                    type="date"
                    name="RunningNomineeDob"
                    className="form-control"
                    placeholder="Nominee DOB"
                    value={formState?.formData?.runningPolicy?.NomineeDob}
                    onChange={handleNomineeDateChange}
                  />
                  {formState.errors?.runningPolicy?.NomineeDob && <div className="text-danger">{formState.errors?.runningPolicy?.NomineeDob}</div>}
                </div>

                <div className="col-md-6 mb-4">
                  <label>Nominee Age</label>
                  <input
                    type="text"
                    name="RunningNomineeAge"
                    className="form-control"
                    placeholder="Nominee Age"
                    value={formState?.formData?.runningPolicy?.NomineeAge}
                    readOnly
                  />
                  {formState.errors?.runningPolicy?.NomineeAge && <div className="text-danger">{formState.errors?.runningPolicy?.NomineeAge}</div>}
                </div>

                {formState?.formData?.policyRadio && formState?.formData?.policyRadio === 'Fresh' && <div className="col-md-6 mb-4">
                  <label>Do you have previous policy</label>
                  <select
                    name="PreviousPolicyFlag"
                    className="form-select"
                    value={formState?.formData?.runningPolicy?.PreviousPolicyFlag || ""}
                    onChange={(e) => setFormState(prevState => ({
                      ...prevState,
                      formData: {
                        ...prevState.formData,
                        runningPolicy: {
                          ...prevState.formData?.runningPolicy,
                          PreviousPolicyFlag: e.target.value
                        }
                      }
                    }))}
                  >
                    <option value="" disabled>Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                  {formState.errors?.runningPolicy?.PreviousPolicyFlag && <div className="text-danger">{formState.errors?.runningPolicy?.PreviousPolicyFlag}</div>}
                </div>}

                <div className="col-md-6 mb-4">
                  <label>Upload Running Policy PDF</label>
                  {initialData?.runningPolicy?.CurrentPolicyFile && (
                    <div>
                      <a
                        href={initialData?.runningPolicy?.CurrentPolicyFile}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.preventDefault();
                          redirectpageproduct(initialData?.runningPolicy?.CurrentPolicyFile);
                        }}
                        style={{
                          color: "blue",
                          textDecoration: "underline",
                          fontSize: "12px",
                        }}
                      >
                        View Existing PDF {initialData?.runningPolicy?.CurrentPolicyFile.slice(0, 5) + '...'}
                      </a>
                    </div>
                  )}
                  <input
                    type="file"
                    name="CurrentPolicyFile"
                    className="form-control"
                    accept="application/pdf"
                    onChange={handleFileChange}
                  />
                  {formState?.formData?.runningPolicy?.CurrentPolicyFile && (
                    <p>Selected File: {formState.formData.runningPolicy.CurrentPolicyFile.name}</p>
                  )}
                  {formState.errors?.runningPolicy?.CurrentPolicyFile && <div className="text-danger">{formState.errors?.runningPolicy?.CurrentPolicyFile}</div>}
                </div>
              </div>



              {formState.formData.RadioButton === 'Employee' && (
                <>
                  <div className='mediclaim-h1 mt-4'>
                    <h3>Employee Details</h3>
                  </div>
                  <div>
                    <button type="button" className='btn btn-blue mb-2' onClick={addEmployee}>Add Employee</button>
                  </div>
                  {formState.employees && formState.employees.map((employee, index) => (
                    <div key={index} className="employee-section mt-3">
                      <h5>Employee {index + 1}</h5>
                      <div className='row'>
                        <div className='col-md-6 mb-3'>
                          <label>Name</label>
                          <input
                            type="text"
                            className='form-control'
                            value={employee.EmployeeName}
                            onChange={(e) => handleEmployeeChange(index, 'EmployeeName', e.target.value)}
                          />
                          {formState?.errors && formState?.errors[`employee${index}_EmployeeName`] && (
                            <div className="text-danger">{formState.errors[`employee${index}_EmployeeName`]}</div>
                          )}
                        </div>
                        <div className='col-md-6 mb-3'>
                          <label>Date of Birth</label>
                          <input
                            type="date"
                            className='form-control'
                            value={employee.DateOfBirth}
                            onChange={(e) => handleEmployeeChange(index, 'DateOfBirth', e.target.value)}
                          />
                          {formState?.errors && formState?.errors[`employee${index}_DateOfBirth`] && (
                            <div className="text-danger">{formState.errors[`employee${index}_DateOfBirth`]}</div>
                          )}
                        </div>
                        <div className="col-md-6 mb-3">
                          <label>Age</label>
                          <input
                            type="text"
                            value={employee.Age}
                            disabled
                            className="form-control"
                          />
                          {formState?.errors && formState?.errors[`employee${index}_Age`] && (
                            <div className="text-danger">{formState.errors[`employee${index}_Age`]}</div>
                          )}
                        </div>
                        <div className='col-md-6 mb-3'>
                          <label>Gender</label>
                          <div className='d-flex'>
                            <label className='me-2'>
                              <input
                                type="radio"
                                name={`employeeGender-${index}`}
                                className='me-2'
                                value="Male"
                                checked={employee.Gender === 'Male'}
                                onChange={(e) => handleEmployeeChange(index, 'Gender', e.target.value)}
                              />
                              Male
                            </label>
                            <label className='me-2'>
                              <input
                                type="radio"
                                name={`employeeGender-${index}`}
                                className='me-2'
                                value="Female"
                                checked={employee.Gender === 'Female'}
                                onChange={(e) => handleEmployeeChange(index, 'Gender', e.target.value)}
                              />
                              Female
                            </label>
                            <label className='me-2'>
                              <input
                                type="radio"
                                name={`employeeGender-${index}`}
                                className='me-2'
                                value="Other"
                                checked={employee.Gender === 'Other'}
                                onChange={(e) => handleEmployeeChange(index, 'Gender', e.target.value)}
                              />
                              Other
                            </label>
                          </div>
                          {formState?.errors && formState?.errors[`employee${index}_Gender`] && (
                            <div className="text-danger">{formState.errors[`employee${index}_Gender`]}</div>
                          )}
                        </div>
                        <div className='col-md-6 mb-3'>
                          <label>Relationship with Policy Holder</label>
                          <input
                            type="text"
                            className='form-control'
                            value={employee.RelationshipWithPolicyHolder}
                            onChange={(e) => handleEmployeeChange(index, 'RelationshipWithPolicyHolder', e.target.value)}
                          />
                          {formState?.errors && formState?.errors[`employee${index}_RelationshipWithPolicyHolder`] && (
                            <div className="text-danger">{formState.errors[`employee${index}_RelationshipWithPolicyHolder`]}</div>
                          )}
                        </div>
                        <div className='col-md-6 mb-3'>
                          <label>Date of Joining</label>
                          <input
                            type="date"
                            className='form-control'
                            value={employee.DateOfJoining}
                            onChange={(e) => handleEmployeeChange(index, 'DateOfJoining', e.target.value)}
                          />
                          {formState?.errors && formState?.errors[`employee${index}_DateOfJoining`] && (
                            <div className="text-danger">{formState.errors[`employee${index}_DateOfJoining`]}</div>
                          )}
                        </div>
                        <div className='col-md-6 mb-3'>
                          <label>Pre-existing Illness</label>
                          <input
                            type="text"
                            className='form-control'
                            value={employee.PreExistingIllness}
                            onChange={(e) => handleEmployeeChange(index, 'PreExistingIllness', e.target.value)}
                          />
                          {formState?.errors && formState?.errors[`employee${index}_PreExistingIllness`] && (
                            <div className="text-danger">{formState.errors[`employee${index}_PreExistingIllness`]}</div>
                          )}
                        </div>
                        <div className='col-md-12'>
                          <button
                            type="button"
                            className='btn btn-danger'
                            onClick={() => removeEmployee(index)}
                          >
                            Remove Employee
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="row mt-4">
                    <div className="col-md-6 mb-4">
                      <label>Sum Insured</label>
                      <input
                        type="number"
                        name="SumInsured"
                        className="form-control"
                        value={formState.formData.SumInsured}
                        onChange={(e) => setFormState(prevState => ({
                          ...prevState,
                          formData: {
                            ...prevState.formData,
                            SumInsured: e.target.value
                          }
                        }))}
                      />
                      {formState?.errors?.SumInsured && <p className="text-danger">{formState.errors.SumInsured}</p>}
                    </div>
                    <div className="col-md-6 mb-4">
                      <label>No Claim Bonus</label>
                      <input
                        type="number"
                        name="NoClaimBonus"
                        className="form-control"
                        value={formState.formData.NoClaimBonus}
                        onChange={(e) => setFormState(prevState => ({
                          ...prevState,
                          formData: {
                            ...prevState.formData,
                            NoClaimBonus: e.target.value
                          }
                        }))}
                      />
                      {formState?.errors?.NoClaimBonus && <p className="text-danger">{formState.errors.NoClaimBonus}</p>}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
          {currentStep === 4 && (
            <>
              <div className="mediclaim-h1">
                <h3>Previous Policy Details</h3>
              </div>
              <div className="row">
                {/* Policy Number */}
                <div className="col-md-6 mb-4">
                  <label>Policy Number</label>
                  <input
                    type="text"
                    name="PolicyNumber"
                    className="form-control"
                    placeholder="Policy Number"
                    value={formState?.formData?.previousPolicy?.PolicyNumber}
                    onChange={(e) => setFormState(prevState => ({
                      ...prevState,
                      formData: {
                        ...prevState.formData,
                        previousPolicy: {
                          ...prevState.formData?.previousPolicy,
                          PolicyNumber: e.target.value
                        }
                      }
                    }))}
                  />
                  {formState.errors?.previousPolicy?.PolicyNumber && <div className="text-danger">{formState.errors?.previousPolicy?.PolicyNumber}</div>}
                </div>

                {/* Upload PDF for the policy */}
                <div className="col-md-6 mb-4">
                  <label>Upload PDF</label>
                  {initialData?.previousPolicy?.PdfFile && (
                    <div>
                      <a
                        href={initialData?.previousPolicy?.PdfFile}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.preventDefault(); // Prevent default link behavior
                          redirectpageproduct(initialData?.previousPolicy?.PdfFile); // Use the redirectpage function
                        }}
                        style={{
                          color: "blue",
                          textDecoration: "underline",
                          fontSize: "12px",
                        }}
                      >
                        View Existing PDF {initialData?.previousPolicy?.PdfFile?.slice(0, 5) + '...'}
                      </a>
                    </div>
                  )}
                  <input
                    type="file"
                    name="PdfFile"
                    accept="application/pdf"
                    className="form-control"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file && file.type === "application/pdf") {
                        setFormState(prevState => ({
                          ...prevState,
                          formData: {
                            ...prevState.formData,
                            previousPolicy: {
                              ...prevState.formData?.previousPolicy,
                              PdfFile: file,
                            },
                          },
                        }));
                      } else {
                        toast.error("Please upload a valid PDF file.");
                      }
                    }}
                  />
                  {formState?.formData?.previousPolicy?.PdfFile && (
                    <p>Selected File: {formState.formData.previousPolicy.PdfFile.name}</p>
                  )}
                  {formState.errors?.previousPolicy?.PdfFile && <div className="text-danger">{formState.errors?.previousPolicy?.PdfFile}</div>}
                </div>


                {/* From Date */}
                <div className="col-md-6 mb-4">
                  <label>From</label>
                  <input
                    type="date"
                    name="poifrom"
                    className="form-control"
                    value={formState.formData?.previousPolicy?.PolicyFrom}
                    onChange={(e) => setFormState(prevState => ({
                      ...prevState,
                      formData: {
                        ...prevState.formData,
                        previousPolicy: {
                          ...prevState.formData?.previousPolicy,
                          PolicyFrom: e.target.value
                        }
                      }
                    }))}
                  />
                  {formState.errors?.previousPolicy?.PolicyFrom && <div className="text-danger">{formState.errors?.previousPolicy?.PolicyFrom}</div>}
                </div>

                {/* To Date */}
                <div className="col-md-6 mb-4">
                  <label>To</label>
                  <input
                    type="date"
                    name="poito"
                    className="form-control"
                    value={formState.formData?.previousPolicy?.PolicyTo}
                    onChange={(e) => setFormState(prevState => ({
                      ...prevState,
                      formData: {
                        ...prevState.formData,
                        previousPolicy: {
                          ...prevState.formData?.previousPolicy,
                          PolicyTo: e.target.value
                        }
                      }
                    }))}
                  />
                  {formState.errors?.previousPolicy?.PolicyTo && <div className="text-danger">{formState.errors?.previousPolicy?.PolicyTo}</div>}
                </div>

                {/* Zone */}
                <div className="col-md-6 mb-4">
                  <label>Zone</label>
                  <input
                    type="text"
                    name="Zone"
                    className="form-control"
                    placeholder="Zone"
                    value={formState.formData?.previousPolicy?.Zone}
                    onChange={(e) => setFormState(prevState => ({
                      ...prevState,
                      formData: {
                        ...prevState.formData,
                        previousPolicy: {
                          ...prevState.formData?.previousPolicy,
                          Zone: e.target.value
                        }
                      }
                    }))}
                  />
                  {formState.errors?.previousPolicy?.Zone && <div className="text-danger">{formState.errors?.previousPolicy?.Zone}</div>}
                </div>

                {/* Policy Tenure */}
                <div className="col-md-6 mb-4">
                  <label>Policy Tenure</label>
                  <input
                    type="number"
                    name="PolicyTenure"
                    className="form-control"
                    placeholder="Policy Tenure"
                    value={formState.formData?.previousPolicy?.PolicyTenure}
                    onChange={(e) => setFormState(prevState => ({
                      ...prevState,
                      formData: {
                        ...prevState.formData,
                        previousPolicy: {
                          ...prevState.formData.previousPolicy,
                          PolicyTenure: e.target.value
                        }
                      }
                    }))}
                  />
                  {formState.errors?.previousPolicy?.PolicyTenure && <div className="text-danger">{formState.errors?.previousPolicy?.PolicyTenure}</div>}
                </div>

                {/* Premium Amount */}
                <div className="col-md-6 mb-4">
                  <label>Premium Amount</label>
                  <input
                    type="number"
                    name="PremiumAmount"
                    className="form-control"
                    placeholder="Premium Amount"
                    value={formState?.formData?.previousPolicy?.PremiumAmount}
                    onChange={(e) => setFormState(prevState => ({
                      ...prevState,
                      formData: {
                        ...prevState.formData,
                        previousPolicy: {
                          ...prevState.formData?.previousPolicy,
                          PremiumAmount: e.target.value
                        }
                      }
                    }))}
                  />
                  {formState.errors?.previousPolicy?.PremiumAmount && <div className="text-danger">{formState.errors?.previousPolicy?.PremiumAmount}</div>}
                </div>

                {/* Renew Date */}
                <div className="col-md-6 mb-4">
                  <label>Renew Date</label>
                  <input
                    type="date"
                    name="RenewDate"
                    className="form-control"
                    value={formState.formData?.previousPolicy?.RenewDate}
                    onChange={(e) => setFormState(prevState => ({
                      ...prevState,
                      formData: {
                        ...prevState.formData,
                        previousPolicy: {
                          ...prevState.formData?.previousPolicy,
                          RenewDate: e.target.value
                        }
                      }
                    }))}
                  />
                  {formState.errors?.previousPolicy?.RenewDate && <div className="text-danger">{formState.errors?.previousPolicy?.RenewDate}</div>}
                </div>

                {/* Claim Expire in Policy (Yes/No) */}
                <div className="col-md-6 mb-4">
                  <label>Claim Expire in Policy</label>
                  <select
                    name="ClaimExpireInPolicy"
                    className="form-select"
                    value={formState.formData?.previousPolicy?.ClaimExpireInPolicy || ""}
                    onChange={(e) => setFormState(prevState => ({
                      ...prevState,
                      formData: {
                        ...prevState.formData,
                        previousPolicy: {
                          ...prevState.formData?.previousPolicy,
                          ClaimExpireInPolicy: e.target.value
                        }
                      }
                    }))}
                  >
                    <option value="" disabled>Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                  {formState.errors?.previousPolicy?.ClaimExpireInPolicy && <div className="text-danger">{formState.errors?.previousPolicy?.ClaimExpireInPolicy}</div>}
                </div>

                {/* Upload Claim Statement PDF */}
                {formState.formData?.previousPolicy?.ClaimExpireInPolicy === 'Yes' && <div className="col-md-6 mb-4">
                  <label>Claim Statement PDF</label>
                  {initialData?.previousPolicy?.ClaimStatementPDFfile && (
                    <div>
                      <a
                        href={initialData?.previousPolicy?.ClaimStatementPDFfile}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.preventDefault(); // Prevent default link behavior
                          redirectpageproduct(initialData?.previousPolicy?.ClaimStatementPDFfile); // Use the redirectpage function
                        }}
                        style={{
                          color: "blue",
                          textDecoration: "underline",
                          fontSize: "12px",
                        }}
                      >
                        View Existing PDF {initialData?.previousPolicy?.ClaimStatementPDFfile?.slice(0, 5) + '...'}
                      </a>
                    </div>
                  )}
                  <input
                    type="file"
                    name="ClaimStatementPDFfile"
                    accept="application/pdf"
                    className="form-control"
                    onChange={(e) => setFormState(prevState => ({
                      ...prevState,
                      formData: {
                        ...prevState.formData,
                        previousPolicy: {
                          ...prevState.formData?.previousPolicy,
                          ClaimStatementPDFfile: e.target.files[0]
                        }
                      }
                    }))}
                  />
                  {formState?.formData?.previousPolicy?.ClaimStatementPDFfile && (
                    <p>Selected File: {formState.formData.previousPolicy.ClaimStatementPDFfile.name}</p>
                  )}
                  {formState.errors?.previousPolicy?.ClaimStatementPDFfile && <div className="text-danger">{formState.errors?.previousPolicy?.ClaimStatementPDFfile}</div>}
                </div>}
                {/* Nominee Name */}
                <div className="col-md-6 mb-4">
                  <label>Nominee Relation</label>
                  <input
                    type="text"
                    name="NomineeRelation"
                    className="form-control"
                    placeholder="Nominee Relation"
                    value={formState.formData?.previousPolicy?.NomineeRelation}
                    onChange={(e) => setFormState(prevState => ({
                      ...prevState,
                      formData: {
                        ...prevState.formData,
                        previousPolicy: {
                          ...prevState.formData?.previousPolicy,
                          NomineeRelation: e.target.value
                        }
                      }
                    }))}
                  />
                  {formState.errors?.previousPolicy?.NomineeRelation && <div className="text-danger">{formState.errors?.previousPolicy?.NomineeRelation}</div>}
                </div>

                <div className="col-md-6 mb-4">
                  <label>Nominee Name</label>
                  <input
                    type="text"
                    name="NomineeName"
                    className="form-control"
                    placeholder="Nominee Name"
                    value={formState.formData?.previousPolicy?.NomineeName}
                    onChange={(e) => setFormState(prevState => ({
                      ...prevState,
                      formData: {
                        ...prevState.formData,
                        previousPolicy: {
                          ...prevState.formData?.previousPolicy,
                          NomineeName: e.target.value
                        }
                      }
                    }))}
                  />
                  {formState.errors?.previousPolicy?.NomineeName && <div className="text-danger">{formState.errors?.previousPolicy?.NomineeName}</div>}
                </div>

                {/* Previous Policy Number */}
                <div className="col-md-6 mb-4">
                  <label>Previous Policy Number</label>
                  <input
                    type="text"
                    name="PreviousPolicyNumber"
                    className="form-control"
                    placeholder="Previous Policy Number"
                    value={formState.formData?.previousPolicy?.PreviousPolicyNumber}
                    onChange={(e) => setFormState(prevState => ({
                      ...prevState,
                      formData: {
                        ...prevState.formData,
                        previousPolicy: {
                          ...prevState.formData?.previousPolicy,
                          PreviousPolicyNumber: e.target.value
                        }
                      }
                    }))}
                  />
                  {formState.errors?.previousPolicy?.PreviousPolicyNumber && <div className="text-danger">{formState.errors?.previousPolicy?.PreviousPolicyNumber}</div>}
                </div>

                {/* Age */}
                <div className="col-md-6 mb-4">
                  <label>Nominee DOB</label>
                  <input
                    type="date"
                    name="PreviousNomineeDob"
                    className="form-control"
                    placeholder="Nominee DOB"
                    value={formState?.formData?.previousPolicy?.NomineeDob}
                    onChange={handleNomineePreviousDateChange}
                  />
                  {formState.errors?.previousPolicy?.NomineeDob && <div className="text-danger">{formState.errors?.previousPolicy?.NomineeDob}</div>}
                </div>
                <div className="col-md-6 mb-4">
                  <label>Nominee Age</label>
                  <input
                    type="number"
                    name="Age"
                    className="form-control"
                    placeholder="Age"
                    value={formState.formData?.previousPolicy?.NomineeAge}
                    readOnly
                  />
                  {formState.errors?.previousPolicy?.NomineeAge && <div className="text-danger">{formState.errors?.previousPolicy?.NomineeAge}</div>}
                </div>

                {/* Product Selection */}
                <div className="col-md-6 mb-4">
                  <label>Select Product</label>
                  <select
                    name="productType"
                    className="form-select"
                    value={productType || ""}
                    onChange={(e) => setProductType(e.target.value)}
                  >
                    <option value="" disabled hidden>Select Product</option>
                    {productData && productData.map((item) => (
                      <option key={item.mediclaim_product_id} value={item.mediclaim_product_id}>
                        {item.mediclaim_product_name}
                      </option>
                    ))}
                  </select>
                  {formState?.errors?.ProductName && <div className="text-danger">{formState.errors.ProductName}</div>}
                </div>

                {/* Company Name */}
                <div className="col-md-6 mb-4">
                  <label>Company Name</label>
                  <input
                    type="text"
                    name="CompanyName"
                    className="form-control"
                    placeholder="Company Name"
                    value={formState.formData?.previousPolicy?.CompanyName}
                    onChange={(e) => setFormState(prevState => ({
                      ...prevState,
                      formData: {
                        ...prevState.formData,
                        previousPolicy: {
                          ...prevState.formData?.previousPolicy,
                          CompanyName: e.target.value
                        }
                      }
                    }))}
                  />
                  {formState.errors?.previousPolicy?.CompanyName && <div className="text-danger">{formState.errors?.previousPolicy?.CompanyName}</div>}
                </div>
              </div>
            </>
          )}


          {currentStep === 5 && (
            <>
              <div className='mediclaim-h1'>
                <h3>Agent Details</h3>
              </div>
              <div className='row'>
                <div className='col-md-6 mb-4'>
                  <label>Agent Name</label>
                  <input
                    type="text"
                    name="AgentName"
                    className='form-control'
                    placeholder="Agent Name"
                    value={formState.formData?.AgentName}
                    onChange={(e) => setFormState(prevState => ({
                      ...prevState,
                      formData: {
                        ...prevState.formData,
                        AgentName: e.target.value
                      }
                    }))}
                  />
                  {formState?.errors?.AgentName && <div className="text-danger">{formState.errors.AgentName}</div>}
                </div>
                <div className='col-md-6 mb-4'>
                  <label>Agent Contact Number</label>
                  <input
                    type="text"
                    name="AgentContactNumber"
                    className='form-control'
                    placeholder="Agent Contact Number"
                    value={formState.formData?.AgentContactNumber}
                    onChange={(e) => setFormState(prevState => ({
                      ...prevState,
                      formData: {
                        ...prevState.formData,
                        AgentContactNumber: e.target.value
                      }
                    }))}
                  />
                  {formState?.errors?.AgentContactNumber && <div className="text-danger">{formState.errors.AgentContactNumber}</div>}
                </div>
                <div className='col-md-6 mb-4'>
                  <label>Agent Code</label>
                  <input
                    type="text"
                    name="AgentCode"
                    className='form-control'
                    placeholder="Agent Code"
                    value={formState.formData?.AgentCode}
                    onChange={(e) => setFormState(prevState => ({
                      ...prevState,
                      formData: {
                        ...prevState.formData,
                        AgentCode: e.target.value
                      }
                    }))}
                  />
                  {formState?.errors?.AgentCode && <div className="text-danger">{formState.errors.AgentCode}</div>}
                </div>
              </div>
            </>
          )}
          <div className="button-group d-flex justify-content-between">
            {currentStep > 1 && (
              <button className='btn btn-blue' type="button" onClick={(e) => { e.preventDefault(); handlePrev(); }}>Back</button>
            )}
            {currentStep < 5 ? (
              <button className='btn btn-blue' type="button" onClick={(e) => { e.preventDefault(); handleNext(); }}>Next</button>
            ) : (
              !view && currentStep === 5 && (
                <button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              )
            )}
          </div>
        </form>
      </div>
    </div>
  );
};


export default MediclaimPopup;
