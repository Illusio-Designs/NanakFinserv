import { ROLE_IDS } from "../../config/ids";
import toast from 'react-hot-toast';
import React, { useEffect, useState } from 'react';
import '../../styles/pages/dashboard/Consumer.css';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import DashboardLayout from '../../components/DashboardLayout';
import { getAllLoanConsumerDetail, getAllLoanInterestedConsumer, updateLoanStatus, addConsumerUser, addNewCode, updateLoanConsumerUser, getAllCodes } from '../../serviceAPI/userAPI';
import { useToaster } from '../../components/Toaster';
import Cookies from 'js-cookie';
import PopupModal from '../../components/View-Loan-Details.popup';
import * as XLSX from 'xlsx';

const Loani = () => {
  const addToast = useToaster()
  const categoryId = Cookies.get('category');
  const user = (Cookies.get('user') && JSON.parse(Cookies.get('user'))) || '';

  const getStartOfFinancialYear = () => {
    const today = new Date();
    const year = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
    return new Date(year, 3, 2).toISOString().split('T')[0]; // 1st April of the financial year
  };

  const getEndOfFinancialYear = () => {
    const today = new Date();
    const year = today.getMonth() >= 3 ? today.getFullYear() + 1 : today.getFullYear();
    console.log(year,'ss')
    return new Date(year, 3, 1).toISOString().split('T')[0]; // Ensures 31st March
  };
  
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [detail, setDetail] = useState(null);
  const [verticle, setVerticle] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [heading, setHeading] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  // Consumer Modal State
  const [formData, setFormData] = useState({
    Name: '',
    MobileNumber: '',
    Email: '',
    ReferenceName: ''
  });
  const [inputValue, setInputValue] = useState({});
  const [showAddCodeField, setShowAddCodeField] = useState(false);
  const [isProperty, setIsProperty] = useState(false);
  const [codes, setCodes] = useState([]);
  const [newCodeName, setNewCodeName] = useState('');
  const [status, setStatus] = useState('');

  const isWithinDateRange = (item, fromDate, toDate) => {
    if (!fromDate || !toDate) return true;
    const start = new Date(new Date(fromDate).setHours(0, 0, 0, 0));
    const end = new Date(new Date(toDate).setHours(23, 59, 59, 999));

    const candidate = item.loanDate || item.details?.login_details?.loanDate || item.details?.document_details?.loanDate || item.details?.disbursement_details?.loanDate || item.details?.updatedAt || item.details?.createdAt;
    if (!candidate) return false;
    const d = new Date(candidate);
    if (isNaN(d)) return false;
    return d >= start && d <= end;
  };

  const handleSearch = (searchQuery) => {
    if (!searchQuery.trim() && !status) {
      setFilteredData(data);
      return;
    }
    
    let filtered = data;
    
    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          String(value || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
    
    // Filter by status
    if (status) {
      filtered = filtered.filter(row => row.details?.status === status);
    }
    
    setFilteredData(filtered);
  };

  const toggleEditModal = () => {
    setIsEditModalOpen(!isEditModalOpen);
    if (!isEditModalOpen) {
      setEditData(null);
      resetForm();
    }
  };

  const toggleViewModal = () => {
    setIsViewModalOpen(!isViewModalOpen);
    if (!isViewModalOpen) {
      setViewData(null);
    }
  };

  const resetForm = () => {
    setFormData({
      Name: '',
      MobileNumber: '',
      Email: '',
      ReferenceName: ''
    });
    setInputValue({ parts: [{ part_amount: "", part_date: "" }] });
    setShowAddCodeField(false);
    setIsProperty(false);
    setNewCodeName('');
    setStatus('');
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleInputValueChange = (e, field) => {
    const { name, value } = e.target;
    setInputValue(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const fetchCodes = async () => {
    try {
      const consumerData = await getAllCodes();
      if (consumerData?.data && consumerData?.data?.length) {
        setCodes(consumerData?.data);
      } else {
        setCodes([]);
      }
    } catch (error) {
      console.error('Error fetching codes:', error);
      setCodes([]);
    }
  };

  // Function to get code name from code ID
  const getCodeName = (codeId) => {
    if (!codeId || !codes.length) return '';
    const code = codes.find(c => c.id === codeId);
    return code ? code.code_name : '';
  };

  const handleAddCode = async () => {
    if (!newCodeName.trim()) {
      return;
    }
    try {
      const response = await addNewCode({ code_name: newCodeName });
      if (response.status) {
        fetchCodes();
        setNewCodeName('');
        setShowAddCodeField(false);
      }
    } catch (error) {
      console.error('Error adding code:', error);
    }
  };

  const getAvailableOptions = () => {
    // List of all possible options
    const allOptions = [
      { value: "documentselected", label: "Document Selected" },
      { value: "pickup", label: "Pickup" },
      { value: "login", label: "Login" },
      { value: "query", label: "Query" },
      { value: "cancel", label: "Cancel" },
      { value: "sanction", label: "Sanction" },
      { value: "partPayment", label: "Part Payment" },
      { value: "disbursement", label: "Disbursement" },
      { value: "completed", label: "Completed" }
    ];

    const stepOrder = [
      "",
      "documentselected",
      "pickup",
      "login",
      "query",
      "cancel",
      "sanction",
      "partPayment",
      "disbursement",
      "completed"
    ];

    const currentStatus = editData?.details?.status;

    if (user.role_id === ROLE_IDS.SUPER_ADMIN) {
      return allOptions; // Admin users can see all options
    }

    if (user.role_id === ROLE_IDS.STAFF) {
      // For Role 4 users, always show all options regardless of current status
      return allOptions;
    }

    return allOptions; // Default case for other roles
  };

  useEffect(() => {
    getAllLoanConsumerData();
    fetchCodes();
  }, []);

  const fetchApi = () => {
    getAllLoanConsumerData();
  };

  // Handler for status change from table dropdown
  const handleStatusChangeFromTable = async (userData, newStatus) => {
    // If status is "interested", just save the status without opening form
    if (newStatus === 'interested') {
      try {
        const updateData = {
          user_consumer_id: userData.user_consumer_id || userData.details?.user_consumer_id,
          status: newStatus,
          laon_id: userData.details?.laon_id || userData.laon_id
        };

        if (!updateData.user_consumer_id) {
          addToast('Missing user ID. Cannot update status.', 'error');
          return;
        }

        const response = await updateLoanStatus(updateData);
        if (response && response.status) {
          addToast(`Status updated to ${newStatus} successfully`, 'success');
          // Refresh data after successful update
          await getAllLoanConsumerData();
        } else {
          addToast('Failed to update status', 'error');
        }
      } catch (error) {
        console.error('Error updating status:', error);
        addToast('Error updating status', 'error');
      }
    } else {
      // For other statuses, open edit modal
      const updatedRow = {
        ...userData,
        status: newStatus,
        details: { ...userData.details, status: newStatus }
      };
      handleEdit(updatedRow);
    }
  };

  const getAllLoanConsumerData = async () => {
    setLoading(true);
    const consumerData = await getAllLoanInterestedConsumer({ startDate, endDate });
    console.log('🔍 [LOAN INTERESTED] Raw API response:', consumerData);
    
    if (consumerData?.data && consumerData?.data?.length) {
      console.log('🔍 [LOAN INTERESTED] Processing data:', consumerData.data.length, 'records');
      console.log('🔍 [LOAN INTERESTED] All statuses in raw data:', consumerData.data.map(u => u.status));
      
      // Status options for dropdown
      const statusOptions = [
        { value: "interested", label: "Interested" },
        { value: "documentselected", label: "Document Selected" },
        { value: "pickup", label: "Pickup" },
        { value: "login", label: "Login" },
        { value: "query", label: "Query" },
        { value: "cancel", label: "Cancel" },
        { value: "sanction", label: "Sanction" },
        { value: "partPayment", label: "Part Payment" },
        { value: "disbursement", label: "Disbursement" },
        { value: "completed", label: "Completed" }
      ];
      
      // Process data to add serial numbers and flatten nested properties for table
      const processedData = consumerData.data.map((user, index) => {
        const processedUser = {
          ...user,
          // Basic fields
          serialNumber: index + 1,
          userName: user.userConsumers?.username || user['userConsumers.username'] || '',
          mobileNumber: user.userConsumers?.mobileNumber || user['userConsumers.mobileNumber'] || '',
          
          // Loan details (flattened) - check ALL possible data sources based on status
          // Also check remarks field for loan details since they might be stored there
          loanDate: (() => {
            // First check the standard data sources
            let date = user.details?.login_details?.loanDate || 
                       user.details?.document_details?.loanDate || 
                       user.details?.part_details?.loanDate || 
                       user.details?.disbursement_details?.loanDate;
            
            // If no date found, check the remarks field
            if (!date && user.details?.remarks) {
              try {
                const remarksData = JSON.parse(user.details.remarks);
                // Look for loan date in various sections of remarks
                date = remarksData?.login_details?.loanDate || 
                       remarksData?.part_details?.loanDate || 
                       remarksData?.document_details?.loanDate;
              } catch (e) {
                console.log('🔍 [REMARKS] Error parsing remarks for loan date:', e);
              }
            }
            return date || '';
          })(),
          
          product: (() => {
            let product = user.details?.login_details?.product || 
                         user.details?.document_details?.product || 
                         user.details?.part_details?.product;
            
            if (!product && user.details?.remarks) {
              try {
                const remarksData = JSON.parse(user.details.remarks);
                product = remarksData?.login_details?.product || 
                         remarksData?.part_details?.product || 
                         remarksData?.document_details?.product;
              } catch (e) {
                console.log('🔍 [REMARKS] Error parsing remarks for product:', e);
              }
            }
            return product || '';
          })(),
          
          bankName: (() => {
            let bank = user.details?.login_details?.bankName || 
                       user.details?.document_details?.bankName || 
                       user.details?.part_details?.bankName;
            
            if (!bank && user.details?.remarks) {
              try {
                const remarksData = JSON.parse(user.details.remarks);
                bank = remarksData?.login_details?.bankName || 
                       remarksData?.part_details?.bankName || 
                       remarksData?.document_details?.bankName;
              } catch (e) {
                console.log('🔍 [REMARKS] Error parsing remarks for bank:', e);
              }
            }
            return bank || '';
          })(),
          
          loanAmount: (() => {
            let amount = user.details?.login_details?.loanAmount || 
                        user.details?.document_details?.loanAmount || 
                        user.details?.part_details?.loanAmount;
            
            if (!amount && user.details?.remarks) {
              try {
                const remarksData = JSON.parse(user.details.remarks);
                amount = remarksData?.login_details?.loanAmount || 
                         remarksData?.part_details?.loanAmount || 
                         remarksData?.document_details?.loanAmount;
              } catch (e) {
                console.log('🔍 [REMARKS] Error parsing remarks for loan amount:', e);
              }
            }
            return amount ? `₹${amount}` : '';
          })(),
          
          loanAccountNumber: (() => {
            let account = user.details?.login_details?.loanAccountNumber || 
                         user.details?.document_details?.loanAccountNumber || 
                         user.details?.part_details?.loanAccountNumber;
            
            if (!account && user.details?.remarks) {
              try {
                const remarksData = JSON.parse(user.details.remarks);
                account = remarksData?.login_details?.loanAccountNumber || 
                          remarksData?.part_details?.loanAccountNumber || 
                          remarksData?.document_details?.loanAccountNumber;
              } catch (e) {
                console.log('🔍 [REMARKS] Error parsing remarks for loan account:', e);
              }
            }
            return account || '';
          })(),
          status: user.details?.status || 'interested'
        };
        
        // Replace status text with dropdown component
        const currentStatus = processedUser.status;
        
        processedUser.status = (
          <select
            value={currentStatus}
            onChange={(e) => {
              const newStatus = e.target.value;
              handleStatusChangeFromTable(processedUser, newStatus);
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '14px',
              cursor: 'pointer',
              width: '100%',
              minWidth: '150px',
              backgroundColor: 'white'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
        
        console.log(`🔍 [LOAN INTERESTED] Processed User ${index + 1}:`, {
          name: processedUser.userName,
          status: processedUser.status,
          loanAmount: processedUser.loanAmount,
          product: processedUser.product,
          bankName: processedUser.bankName,
          loanDate: processedUser.loanDate,
          loanAccountNumber: processedUser.loanAccountNumber
        });
        
        // Add detailed debugging for Maharshi specifically
        if (processedUser.userName === 'Maharshi Bhogayata') {
          console.log('🔍 [MAHARSHI DEBUG] Raw user data:', user);
          console.log('🔍 [MAHARSHI DEBUG] Details object:', user.details);
          console.log('🔍 [MAHARSHI DEBUG] Login details:', user.details?.login_details);
          console.log('🔍 [MAHARSHI DEBUG] Document details:', user.details?.document_details);
          console.log('🔍 [MAHARSHI DEBUG] Part details:', user.details?.part_details);
          console.log('🔍 [MAHARSHI DEBUG] Disbursement details:', user.details?.disbursement_details);
          console.log('🔍 [MAHARSHI DEBUG] Remarks:', user.details?.remarks);
          console.log('🔍 [MAHARSHI DEBUG] Final processed data:', processedUser);
        }
        
        return processedUser;
      });
      
        // Filter out cancelled records and sort by creation date in ascending order (oldest first)
        const nonCancelledData = processedData.filter(user => {
          // Use originalStatus if available, otherwise check details.status
          const statusValue = (user.originalStatus || user.details?.status || '').toLowerCase();
          return statusValue !== 'cancelled' && statusValue !== 'cancel';
        });
        const sortedData = nonCancelledData.sort((a, b) => {
          const dateA = new Date(a.details?.createdAt || a.details?.updatedAt || 0);
          const dateB = new Date(b.details?.createdAt || b.details?.updatedAt || 0);
          return dateA - dateB; // Ascending order (oldest first)
        });
      
      setData(sortedData);
      const byDate = (startDate && endDate) ? sortedData.filter((row) => isWithinDateRange(row, startDate, endDate)) : sortedData;
      const byDateAndStatus = status ? byDate.filter(row => {
        // Use originalStatus if available, otherwise check details.status
        const rowStatus = row.originalStatus || row.details?.status;
        return rowStatus === status;
      }) : byDate;
      setFilteredData(byDateAndStatus);
    } else {
      console.log('🔍 [LOAN INTERESTED] No data received from API');
      setData([]);
      setFilteredData([]);
    }
    setHeading([
      { key: 'loanDate', head: 'LOAN DATE' },
      { key: 'userName', head: 'NAME' }, 
      { key: 'mobileNumber', head: 'MOBILE NUMBER' }, 
      { key: 'product', head: 'PRODUCT' }, 
      { key: 'bankName', head: 'BANK' }, 
      { key: 'loanAmount', head: 'LOAN AMOUNT' }, 
      { key: 'loanAccountNumber', head: 'LOAN ACCOUNT NO.' }, 
      { key: 'status', head: 'STATUS' }
    ]);
    fetchCodes();
    setLoading(false);
  };

  const getLoanConsumerDetail = async (laon_id) => {
    const consumerData = await getAllLoanConsumerDetail({ laon_id }); // Send laon_id to get loan details
    if (consumerData?.data) {
      // Handle both array and object responses
      const data = Array.isArray(consumerData.data) ? consumerData.data[0] : consumerData.data;
      setViewData(data); // Set the detailed data to state
    }
  };

  const handleEdit = (userData) => {
    setEditData(userData);
    setFormData({
      Name: userData['userConsumers.username'] || '',
      MobileNumber: userData['userConsumers.mobileNumber'] || '',
      Email: userData['userConsumers.email'] || '',
      ReferenceName: userData['userConsumers.referenceName'] || ''
    });
    
    if (userData?.details?.status && ['documentselected', 'query', 'sanction', 'login', 'disbursement', 'pickup', 'partPayment', 'cancel', 'interested', 'completed'].includes(userData?.details?.status)) {
      if (userData?.details?.status && userData?.details?.status != "interested") {
        setStatus(userData?.details?.status);
      }
      const details = userData.details || {};
      setInputValue({
        ...(details.login_details || {}),
        ...(details.sanction_details || {}),
        ...(details.query_details || {}),
        ...(details.cancel_details || {}),
        ...({ ['radio-loanType']: details?.document_details?.loan_type, ['loan-Type']: details?.document_details?.loan_type_name, remarks_docs: details?.document_details?.remarks_docs } || {}),
        ...(details.disbursement_details || {}),
        ...(details.completed_details || {}),
        parts: details.part_details?.parts || [{ part_amount: "", part_date: "" }],
      });
      if (!(userData?.details?.builder_consumer_details && userData?.details?.builder_consumer_details?.builderuser && userData?.details?.builder_consumer_details?.floor)) {
        setIsProperty(true);
        setInputValue(prevState => ({
          ...prevState,
          ...(details.property_details || {}),
        }));
      }
    } else {
      setStatus('');
    }
    
    setIsEditModalOpen(true);
  };

  const handleView = async (userData) => {
    const laon_id = userData?.details?.laon_id; // Get loan ID from selected row
      await getLoanConsumerDetail(laon_id); // Fetch detailed loan data for view
    setIsViewModalOpen(true);
  };

  const handleConsumerSubmit = async (e) => {
    e.preventDefault();

    const regex = /^\d{10}$/;
    if (!regex.test(formData.MobileNumber)) {
      toast.error('Mobile number is invalid');
      return;
    }

    const userData = {
      username: formData.Name.trim(),
      phone_number: formData.MobileNumber,
      email: formData.Email,
    };

    const selectedCategories = [];
    selectedCategories.push({ category_id: 2, user_role_id: user.user_id });
    if (!editData || !editData.user_consumer_id) {
      userData.category = selectedCategories;
    }

    if (editData && editData.user_consumer_id) {
      if (status === 'documentselected') {
        userData.document_details = {
          loan_type: inputValue?.['radio-loanType'],
          loan_type_name: inputValue?.['loan-Type'],
          remarks_docs: inputValue?.['remarks_docs']
        };
      } else if (status === 'query') {
        userData.query_details = {
          remarks: inputValue?.['remarks']
        };
      } else if (status === 'cancel') {
        userData.cancel_details = {
          remarks_cancel: inputValue?.['remarks_cancel']
        };
      } else if (status === 'sanction') {
        userData.sanction_details = {
          amount: inputValue?.['amount'],
          rate: inputValue?.['rate'],
          tenure: inputValue?.['tenure'],
          sanctionDate: inputValue?.['sanctionDate']
        };
      } else if (status === 'login') {
        userData.login_details = {
          loanAmount: inputValue?.['loanAmount'],
          loanDate: inputValue?.['loanDate'],
          loanAccountNumber: inputValue?.['loanAccountNumber'],
          bankName: inputValue?.['bankName'],
          product: inputValue?.['product'],
          smName: inputValue?.['smName'],
          amName: inputValue?.['amName'],
          remarks_loan: inputValue?.['remarks_loan'],
          bankCode: inputValue?.['bankCode'],
          dateOfBirth: inputValue?.['dateOfBirth'],
          code_id: inputValue?.['code']
        };
        if (isProperty) {
          userData.property_details = {
            address: inputValue?.['address'],
            sqFeet: inputValue?.['sqFeet'],
            deedAmount: inputValue?.['deedAmount'],
          };
        }
      } else if (status === 'disbursement') {
        userData.disbursement_details = {
          disbursementAmount: inputValue?.['disbursementAmount'],
          disbursementRate: inputValue?.['disbursementRate'],
          insurance: inputValue?.['insurance'],
          fileNumber: inputValue?.['fileNumber'],
          disbursementDate: inputValue?.['disbursementDate'],
          remark_dis: inputValue?.['remark_dis'],
          insuranceAmount: inputValue?.['insuranceAmount'],
          insuranceBankName: inputValue?.['insuranceBankName'],
          insuranceType: inputValue?.['insuranceType'],
        };
      } else if (status === 'partPayment') {
        userData.part_details = {
          parts: inputValue?.['parts']?.map(part => {
            if (part?.part_id) {
              return { ...part, part_id: part.part_id };
            }
            return { ...part };
          })
        };
      }
      userData.status = status;
      userData.user_consumer_id = editData.user_consumer_id;
      userData.laon_id = editData?.details?.laon_id;
    }

    try {
      if (editData && editData.user_consumer_id && userData.laon_id) {
        const response = await updateLoanConsumerUser(userData);
        if (response.status) {
          fetchApi();
          toggleEditModal();
        }
      } else {
        const response = await addConsumerUser(userData);
        if (response.status) {
          fetchApi();
          toggleEditModal();
        }
      }
    } catch (error) {
      console.error('Error submitting consumer:', error);
    }
  };

  const handleSort = (column) => {
    const direction = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(column);
    setSortDirection(direction);
  };

  const handleStatusFilterChange = (option) => {
    const newStatus = option ? option.value : '';
    setStatus(newStatus);
    
    // Apply status filter
    const byDate = (startDate && endDate) ? data.filter((row) => isWithinDateRange(row, startDate, endDate)) : data;
    const byDateAndStatus = newStatus ? byDate.filter(row => row.details?.status === newStatus) : byDate;
    setFilteredData(byDateAndStatus);
  };

  const handleDateSearch = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates.");
      return;
    }
    // Save dates to localStorage
    localStorage.setItem('loanInterestedStartDate', startDate);
    localStorage.setItem('loanInterestedEndDate', endDate);
    
    const consumerData = await getAllLoanInterestedConsumer({ startDate, endDate });
    if (consumerData?.data && consumerData?.data?.length) {
      // Status options for dropdown
      const statusOptions = [
        { value: "interested", label: "Interested" },
        { value: "documentselected", label: "Document Selected" },
        { value: "pickup", label: "Pickup" },
        { value: "login", label: "Login" },
        { value: "query", label: "Query" },
        { value: "cancel", label: "Cancel" },
        { value: "sanction", label: "Sanction" },
        { value: "partPayment", label: "Part Payment" },
        { value: "disbursement", label: "Disbursement" },
        { value: "completed", label: "Completed" }
      ];
      
      // Process data same as in getAllLoanConsumerData to ensure consistency
      const processedData = consumerData.data.map((user, index) => {
        const processedUser = {
          ...user,
          // Basic fields
          serialNumber: index + 1,
          userName: user.userConsumers?.username || user['userConsumers.username'] || '',
          mobileNumber: user.userConsumers?.mobileNumber || user['userConsumers.mobileNumber'] || '',
          
          // Loan details (flattened) - check ALL possible data sources based on status
          // Also check remarks field for loan details since they might be stored there
          loanDate: (() => {
            // First check the standard data sources
            let date = user.details?.login_details?.loanDate || 
                       user.details?.document_details?.loanDate || 
                       user.details?.part_details?.loanDate || 
                       user.details?.disbursement_details?.loanDate;
            
            // If no date found, check the remarks field
            if (!date && user.details?.remarks) {
              try {
                const remarksData = JSON.parse(user.details.remarks);
                // Look for loan date in various sections of remarks
                date = remarksData?.login_details?.loanDate || 
                       remarksData?.part_details?.loanDate || 
                       remarksData?.document_details?.loanDate;
              } catch (e) {
                console.log('🔍 [REMARKS] Error parsing remarks for loan date:', e);
              }
            }
            return date || '';
          })(),
          
          product: (() => {
            let product = user.details?.login_details?.product || 
                         user.details?.document_details?.product || 
                         user.details?.part_details?.product;
            
            if (!product && user.details?.remarks) {
              try {
                const remarksData = JSON.parse(user.details.remarks);
                product = remarksData?.login_details?.product || 
                         remarksData?.part_details?.product || 
                         remarksData?.document_details?.product;
              } catch (e) {
                console.log('🔍 [REMARKS] Error parsing remarks for product:', e);
              }
            }
            return product || '';
          })(),
          
          bankName: (() => {
            let bank = user.details?.login_details?.bankName || 
                       user.details?.document_details?.bankName || 
                       user.details?.part_details?.bankName;
            
            if (!bank && user.details?.remarks) {
              try {
                const remarksData = JSON.parse(user.details.remarks);
                bank = remarksData?.login_details?.bankName || 
                       remarksData?.part_details?.bankName || 
                       remarksData?.document_details?.bankName;
              } catch (e) {
                console.log('🔍 [REMARKS] Error parsing remarks for bank:', e);
              }
            }
            return bank || '';
          })(),
          
          loanAmount: (() => {
            let amount = user.details?.login_details?.loanAmount || 
                        user.details?.document_details?.loanAmount || 
                        user.details?.part_details?.loanAmount;
            
            if (!amount && user.details?.remarks) {
              try {
                const remarksData = JSON.parse(user.details.remarks);
                amount = remarksData?.login_details?.loanAmount || 
                         remarksData?.part_details?.loanAmount || 
                         remarksData?.document_details?.loanAmount;
              } catch (e) {
                console.log('🔍 [REMARKS] Error parsing remarks for loan amount:', e);
              }
            }
            return amount ? `₹${amount}` : '';
          })(),
          
          loanAccountNumber: (() => {
            let account = user.details?.login_details?.loanAccountNumber || 
                         user.details?.document_details?.loanAccountNumber || 
                         user.details?.part_details?.loanAccountNumber;
            
            if (!account && user.details?.remarks) {
              try {
                const remarksData = JSON.parse(user.details.remarks);
                account = remarksData?.login_details?.loanAccountNumber || 
                          remarksData?.part_details?.loanAccountNumber || 
                          remarksData?.document_details?.loanAccountNumber;
              } catch (e) {
                console.log('🔍 [REMARKS] Error parsing remarks for loan account:', e);
              }
            }
            return account || '';
          })(),
          
          status: user.details?.status || 'interested',
          // Store original status for filtering
          originalStatus: user.details?.status || 'interested'
        };
        
        // Replace status text with dropdown component
        const currentStatus = processedUser.status;
        
        processedUser.status = (
          <select
            value={currentStatus}
            onChange={(e) => {
              const newStatus = e.target.value;
              handleStatusChangeFromTable(processedUser, newStatus);
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '14px',
              cursor: 'pointer',
              width: '100%',
              minWidth: '150px',
              backgroundColor: 'white'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
        
        return processedUser;
      });
      
        // Filter out cancelled records and sort by creation date in ascending order (oldest first)
        const nonCancelledData = processedData.filter(user => {
          // Use originalStatus if available, otherwise check details.status
          const statusValue = (user.originalStatus || user.details?.status || '').toLowerCase();
          return statusValue !== 'cancelled' && statusValue !== 'cancel';
        });
        const sortedData = nonCancelledData.sort((a, b) => {
          const dateA = new Date(a.details?.createdAt || a.details?.updatedAt || 0);
          const dateB = new Date(b.details?.createdAt || b.details?.updatedAt || 0);
          return dateA - dateB; // Ascending order (oldest first)
        });
      
      setData(sortedData);
      const byDate = (startDate && endDate) ? sortedData.filter((row) => isWithinDateRange(row, startDate, endDate)) : sortedData;
      const byDateAndStatus = status ? byDate.filter(row => {
        // Use originalStatus if available, otherwise check details.status
        const rowStatus = row.originalStatus || row.details?.status;
        return rowStatus === status;
      }) : byDate;
      setFilteredData(byDateAndStatus);
    } else {
      setData([]);
      setFilteredData([]);
    }
    setHeading([
      { key: 'loanDate', head: 'LOAN DATE' },
      { key: 'userName', head: 'NAME' }, 
      { key: 'mobileNumber', head: 'MOBILE NUMBER' }, 
      { key: 'product', head: 'PRODUCT' }, 
      { key: 'bankName', head: 'BANK' }, 
      { key: 'loanAmount', head: 'LOAN AMOUNT' }, 
      { key: 'loanAccountNumber', head: 'LOAN ACCOUNT NO.' }, 
      { key: 'status', head: 'STATUS' }
    ]);
  };

  const handleClearDateFilter = () => {
    setStartDate('');
    setEndDate('');
    localStorage.removeItem('loanInterestedStartDate');
    localStorage.removeItem('loanInterestedEndDate');
    const byStatus = status ? data.filter(row => row.details?.status === status) : data;
    setFilteredData(byStatus);
  };

  const handleExportExcel = () => {
    const exportData = filteredData.map((item, index) => {
      const getName = item.userConsumers?.username || item['userConsumers.username'] || '';
      const getLoanDate = item?.details?.login_details?.loanDate ? new Date(item?.details?.login_details?.loanDate).toLocaleDateString() : '';
      const getMobile = item.userConsumers?.mobileNumber || item['userConsumers.mobileNumber'] || '';
      const getEmail = item.userConsumers?.email || item['userConsumers.email'] || '';
      const getProduct = item.details?.login_details?.product || '';
      const getBank = item.details?.login_details?.bankName || '';
      const getAmount = item.details?.login_details?.loanAmount || '';
      const getAccountNo = item.details?.login_details?.loanAccountNumber || '';
      const getStatus = item.details?.status || '';

      return {
        'Sr. No.': index + 1,
        'Name': getName,
        'Loan Date': getLoanDate,
        'Mobile Number': getMobile,
        'Email': getEmail,
        'Product': getProduct,
        'Bank': getBank,
        'Loan Amount': getAmount,
        'Loan Account No.': getAccountNo,
        'Status': getStatus
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Loan Interested Data");
    XLSX.writeFile(wb, `loan_interested_${startDate}_to_${endDate}.xlsx`);
  };

  const generatePDF = (data) => {
    // Import jsPDF dynamically to avoid SSR issues
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF();
      
      const pageMargin = 15;
      const pageWidth = 210;
      const pageHeight = 297;
      const lineHeight = 10;
      const boxPadding = 8;
      const headerHeight = 15;
      const sectionSpacing = 10;
      let currentY = pageMargin;

      // Function to handle page overflow
      const checkPageOverflow = (contentHeight) => {
        if (currentY + contentHeight > pageHeight - pageMargin) {
          doc.addPage();
          currentY = pageMargin;
        }
      };

      // Function to calculate section height
      const calculateSectionHeight = (content) => {
        const contentHeight = content.length * lineHeight + boxPadding * 2;
        return headerHeight + 5 + contentHeight;
      };

      // Function to draw section headers
      const drawHeader = (title) => {
        doc.setFillColor(50, 115, 220);
        doc.rect(pageMargin, currentY, pageWidth - pageMargin * 2, headerHeight, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(255, 255, 255);
        doc.text(title, pageWidth / 2, currentY + 10, { align: 'center' });
        currentY += headerHeight + 5;
      };

      // Function to draw content in a bordered box
      const drawContentBox = (content) => {
        const contentHeight = content.length * lineHeight + boxPadding * 2;
        doc.setFillColor(240, 240, 240);
        doc.roundedRect(pageMargin, currentY, pageWidth - pageMargin * 2, contentHeight, 3, 3, 'F');
        doc.setDrawColor(200);
        doc.roundedRect(pageMargin, currentY, pageWidth - pageMargin * 2, contentHeight, 3, 3);
        
        let textY = currentY + boxPadding;
        content.forEach(([key, value]) => {
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'bold');
          doc.text(`${key}:`, pageMargin + 5, textY);
          doc.setFont('helvetica', 'normal');
          doc.text(value, pageMargin + 70, textY);
          textY += lineHeight;
        });

        currentY += contentHeight + sectionSpacing;
      };

      // Title for the PDF
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Loan Consumer Report', pageWidth / 2, currentY, { align: 'center' });
      currentY += 20;

      // Helper function to format currency amounts properly
      const formatCurrency = (amount) => {
        if (!amount) return '';
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount)) return amount;
        return `₹${numAmount.toLocaleString('en-IN')}`;
      };

      // Helper function to format dates properly
      const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return dateString;
          return date.toLocaleDateString('en-IN');
        } catch (error) {
          return dateString;
        }
      };

      // Section data - comprehensive loan information
      const sections = [
        {
          title: 'Consumer Information',
          content: [
            ['Name', data?.['userConsumers.username'] || ''],
            ['Email', data?.['userConsumers.email'] || ''],
            ['Mobile', data?.['userConsumers.mobileNumber'] || ''],
            ['Reference Name', data?.['userConsumers.referenceName'] || ''],
          ],
        },
        {
          title: 'Loan Manager Information',
          content: [
            ['Manager Name', data?.['userRoles.username'] || ''],
            ['Manager Email', data?.['userRoles.email'] || ''],
            ['Manager Mobile', data?.['userRoles.mobileNumber'] || ''],
            ['Manager Reference', data?.['userRoles.referenceName'] || ''],
          ],
        },
        {
          title: 'Loan Status & Dates',
          content: [
            ['Status', data?.details?.status || ''],
            ['Created At', data?.details?.createdAt ? new Date(data.details.createdAt).toLocaleDateString() : ''],
            ['Updated At', data?.details?.updatedAt ? new Date(data.details.updatedAt).toLocaleDateString() : ''],
          ],
        }
      ];

      // Add Document Details if available
      if (data?.details?.document_details) {
        sections.push({
          title: 'Document Details',
          content: [
            ['Loan Type', data.details.document_details.loan_type || ''],
            ['Type Name', data.details.document_details.loan_type_name || ''],
            ['Document Remarks', data.details.document_details.remarks_docs || ''],
          ],
        });
      }

      // Add Login Details if available
      if (data?.details?.login_details) {
        sections.push({
          title: 'Login Details',
          content: [
            ['Loan Amount', formatCurrency(data.details.login_details.loanAmount)],
            ['Loan Date', formatDate(data.details.login_details.loanDate)],
            ['Loan Account Number', data.details.login_details.loanAccountNumber || ''],
            ['Bank Name', data.details.login_details.bankName || ''],
            ['Product', data.details.login_details.product || ''],
            ['SM Name', data.details.login_details.smName || ''],
            ['AM Name', data.details.login_details.amName || ''],
            ['Bank Code', data.details.login_details.bankCode || ''],
            ['Date of Birth', formatDate(data.details.login_details.dateOfBirth)],
            ['Code Number', getCodeName(data.details.login_details.code_id) || data.details.login_details.code_name || ''],
            ['Login Remarks', data.details.login_details.remarks_loan || ''],
          ],
        });
      }

      // Add Query Details if available
      if (data?.details?.query_details) {
        sections.push({
          title: 'Query Details',
          content: [
            ['Query Remarks', data.details.query_details.remarks || ''],
          ],
        });
      }

      // Add Cancel Details if available
      if (data?.details?.cancel_details) {
        sections.push({
          title: 'Cancel Details',
          content: [
            ['Cancel Remarks', data.details.cancel_details.remarks_cancel || ''],
          ],
        });
      }

      // Add Sanction Details if available
      if (data?.details?.sanction_details && data.details.sanction_details.amount) {
        sections.push({
          title: 'Sanction Details',
          content: [
            ['Amount', formatCurrency(data.details.sanction_details.amount)],
            ['Rate', data.details.sanction_details.rate ? `${data.details.sanction_details.rate}%` : ''],
            ['Tenure', data.details.sanction_details.tenure ? `${data.details.sanction_details.tenure} years` : ''],
            ['Sanction Date', formatDate(data.details.sanction_details.sanctionDate)],
          ],
        });
      }

      // Add Part Details if available
      if (data?.details?.part_details?.parts && data.details.part_details.parts.length > 0) {
        const partContent = data.details.part_details.parts.map((part, index) => [
          `Part ${index + 1}`,
          `Amount: ${formatCurrency(part.part_amount)}, Date: ${formatDate(part.part_date)}`
        ]);
        sections.push({
          title: 'Part Payment Details',
          content: partContent,
        });
      }

      // Add Disbursement Details if available
      if (data?.details?.disbursement_details && data.details.disbursement_details.disbursementAmount) {
        sections.push({
          title: 'Disbursement Details',
          content: [
            ['Disbursement Amount', formatCurrency(data.details.disbursement_details.disbursementAmount)],
            ['Disbursement Rate', data.details.disbursement_details.disbursementRate ? `${data.details.disbursement_details.disbursementRate}%` : ''],
            ['Insurance', data.details.disbursement_details.insurance || ''],
            ['File Number', data.details.disbursement_details.fileNumber || ''],
            ['Disbursement Date', formatDate(data.details.disbursement_details.disbursementDate)],
            ['Disbursement Remarks', data.details.disbursement_details.remark_dis || ''],
            ['Insurance Amount', formatCurrency(data.details.disbursement_details.insuranceAmount)],
            ['Insurance Bank Name', data.details.disbursement_details.insuranceBankName || ''],
            ['Insurance Type', data.details.disbursement_details.insuranceType || ''],
          ],
        });
      }

      // Add Property Details if available
      if (data?.details?.property_details && data.details.property_details.address) {
        sections.push({
          title: 'Property Details',
          content: [
            ['Address', data.details.property_details.address || ''],
            ['Square Feet', data.details.property_details.sqFeet || ''],
            ['Deed Amount', formatCurrency(data.details.property_details.deedAmount)],
          ],
        });
      }

      // Add Builder Consumer Details if available
      if (data?.details?.builder_consumer_details && data.details.builder_consumer_details.builderuser?.company_name) {
        sections.push({
          title: 'Builder Consumer Details',
          content: [
            ['Builder Name', data.details.builder_consumer_details.builderuser?.company_name || ''],
            ['Project Name', data.details.builder_consumer_details.builderuser?.unit?.unit_name || ''],
            ['Project Address', data.details.builder_consumer_details.builderuser?.unit?.address || ''],
            ['Wing', data.details.builder_consumer_details.wing?.wing_name || ''],
            ['Floor Number', data.details.builder_consumer_details.floor?.floorNumber || ''],
            ['Office No', data.details.builder_consumer_details.office_no || ''],
            ['Square Feet', data.details.builder_consumer_details.sqFeet || ''],
            ['Serial Number', data.details.builder_consumer_details.srNo || ''],
            ['Builder Remarks', data.details.builder_consumer_details.remarks || ''],
          ],
        });
      }

      // Removed remarks section for cleaner, more professional PDF

      // Add sections only if content exists
      sections.forEach((section) => {
        if (section.content && section.content.length > 0) {
          const sectionHeight = calculateSectionHeight(section.content);
          checkPageOverflow(sectionHeight);
          drawHeader(section.title);
          drawContentBox(section.content);
        }
      });

      // Save the PDF
      doc.save('loan-consumer-report.pdf');
    });
  };

  return (
    <DashboardLayout onSearch={handleSearch}>
      <div className="consumer-container">
        <div className="consumer-header">
          <h1>Loan Interested</h1>
          <Button className="add-consumer-btn" onClick={handleExportExcel}>Export to Excel</Button>
        </div>
        
        <div className="filter-section">
          <div className="filter-inputs">
            <div>
              <label>Start Date:</label>
                <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label>End Date:</label>
                <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
                <Button className="add-consumer-btn" onClick={handleDateSearch}>Search</Button>
                <Button className="cancel-btn" onClick={handleClearDateFilter}>Clear</Button>
              </div>
              <div>
                <label>Status:</label>
                <Select
                  options={[
                    { value: "", label: "All Status" },
                    { value: "interested", label: "Interested" },
                    { value: "documentselected", label: "Document Selected" },
                    { value: "pickup", label: "Pickup" },
                    { value: "login", label: "Login" },
                    { value: "query", label: "Query" },
                    { value: "cancel", label: "Cancel" },
                    { value: "sanction", label: "Sanction" },
                    { value: "partPayment", label: "Part Payment" },
                    { value: "disbursement", label: "Disbursement" },
                    { value: "completed", label: "Completed" }
                  ]}
                  value={status ? { value: status, label: status.charAt(0).toUpperCase() + status.slice(1) } : { value: "", label: "All Status" }}
                  onChange={handleStatusFilterChange}
                  placeholder="Select Status"
                />
              </div>
             
            </div>
          </div>

          <div className="consumer-table-container">
            <Table 
              columns={heading.map(h => ({ key: h.key, title: h.head }))} 
              data={filteredData} 
              onEdit={handleEdit}
              onView={handleView}
              pagination={true} 
              itemsPerPage={itemsPerPage}
              loading={loading}
            />
          </div>

        {/* Edit Consumer Modal */}
        <Modal open={isEditModalOpen} onClose={toggleEditModal} title="Edit Loan Consumer">
          <form onSubmit={handleConsumerSubmit} className="consumer-form">
            <div className="form-section">
              <h5>Basic Information</h5>
              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <Input 
                    type="text" 
                    value={formData.Name} 
                    onChange={(e) => handleInputChange('Name', e.target.value)} 
                    placeholder="Enter full name" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <Input 
                    type="email" 
                    value={formData.Email} 
                    onChange={(e) => handleInputChange('Email', e.target.value)} 
                    placeholder="Enter email address" 
                    required 
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Mobile Number *</label>
                  <div className='phone-style'>
                    <div className="flag-section">
                      <img src="https://flagcdn.com/w320/in.png" alt="India" className="country-flag"/>
                      <span className="country-code">+91</span>
                    </div>
                    <input 
                      type="tel" 
                      value={formData.MobileNumber} 
                      className="form-control mobile" 
                      onChange={(e) => handleInputChange('MobileNumber', e.target.value)} 
                      placeholder="Enter mobile number" 
                      required 
                      maxLength="10"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Reference Name</label>
                  <Input 
                    type="text" 
                    value={formData.ReferenceName} 
                    onChange={(e) => handleInputChange('ReferenceName', e.target.value)} 
                    placeholder="Enter reference name" 
                  />
                </div>
              </div>
            </div>

            {editData && editData.user_consumer_id && (
              <div className="form-section">
                <h5>Status Selection</h5>
                <div className="form-row">
                  <div className="form-group">
                    <label>Select Status</label>
                    <Select
                      options={getAvailableOptions()}
                      value={status ? { value: status, label: status.charAt(0).toUpperCase() + status.slice(1) } : null}
                      onChange={(option) => setStatus(option ? option.value : '')}
                      placeholder="Select Status"
                    />
                  </div>
                </div>

                {status === "documentselected" && (
                  <div className="form-section">
                    <h5>Document Details</h5>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Loan Type</label>
                        <Select
                          options={[
                            { value: "Home", label: "Home" },
                            { value: "Car", label: "Car" },
                            { value: "Personal", label: "Personal" },
                            { value: "Buissness", label: "Buissness" },
                            { value: "NRP", label: "NRP" },
                            { value: "CC && OD", label: "CC && OD" },
                            { value: "TOP UP", label: "TOP UP" }
                          ]}
                          value={inputValue['radio-loanType'] ? { value: inputValue['radio-loanType'], label: inputValue['radio-loanType'] } : null}
                          onChange={(option) => setInputValue(prev => ({ ...prev, 'radio-loanType': option ? option.value : '' }))}
                          placeholder="Select Loan Type"
                        />
                      </div>
                      <div className="form-group">
                        <label>Type</label>
                        <Select
                          options={[
                            { value: "SALARIED", label: "SALARIED" },
                            { value: "PARTNERSHIP", label: "PARTNERSHIP" },
                            { value: "PROPRIETORSHIP", label: "PROPRIETORSHIP" }
                          ]}
                          value={inputValue['loan-Type'] ? { value: inputValue['loan-Type'], label: inputValue['loan-Type'] } : null}
                          onChange={(option) => setInputValue(prev => ({ ...prev, 'loan-Type': option ? option.value : '' }))}
                          placeholder="Select Type"
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Remarks</label>
                        <Input
                          type="text"
                          value={inputValue.remarks_docs || ""}
                          onChange={(e) => setInputValue(prev => ({ ...prev, remarks_docs: e.target.value }))}
                          placeholder="Enter remarks"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {status === "query" && (
                  <div className="form-section">
                    <h5>Query Details</h5>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Remarks</label>
                        <Input
                          type="text"
                          value={inputValue.remarks || ""}
                          onChange={(e) => setInputValue(prev => ({ ...prev, remarks: e.target.value }))}
                          placeholder="Enter remarks"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {status === "cancel" && (
                  <div className="form-section">
                    <h5>Cancel Details</h5>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Remarks</label>
                        <Input
                          type="text"
                          value={inputValue.remarks_cancel || ""}
                          onChange={(e) => setInputValue(prev => ({ ...prev, remarks_cancel: e.target.value }))}
                          placeholder="Enter remarks"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {status === "sanction" && (
                  <div className="form-section">
                    <h5>Sanction Details</h5>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Amount *</label>
                        <Input
                          type="number"
                          value={inputValue.amount || ""}
                          onChange={(e) => setInputValue(prev => ({ ...prev, amount: e.target.value }))}
                          placeholder="Enter amount"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Rate *</label>
                        <Input
                          type="number"
                          value={inputValue.rate || ""}
                          onChange={(e) => setInputValue(prev => ({ ...prev, rate: e.target.value }))}
                          placeholder="Enter rate"
                          required
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Tenure *</label>
                        <Input
                          type="number"
                          value={inputValue.tenure || ""}
                          onChange={(e) => setInputValue(prev => ({ ...prev, tenure: e.target.value }))}
                          placeholder="Enter tenure"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Sanction Date *</label>
                        <Input
                          type="date"
                          value={inputValue.sanctionDate || ""}
                          onChange={(e) => setInputValue(prev => ({ ...prev, sanctionDate: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {status === "login" && (
                  <div className="form-section">
                    <h5>Login Details</h5>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Loan Amount *</label>
                        <Input
                          type="number"
                          value={inputValue.loanAmount || ""}
                          onChange={(e) => setInputValue(prev => ({ ...prev, loanAmount: e.target.value }))}
                          placeholder="Enter loan amount"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Loan Account Number</label>
                        <Input
                          type="text"
                          value={inputValue.loanAccountNumber || ""}
                          onChange={(e) => setInputValue(prev => ({ ...prev, loanAccountNumber: e.target.value }))}
                          placeholder="Enter loan account number"
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Bank Name *</label>
                        <Input
                          type="text"
                          value={inputValue.bankName || ""}
                          onChange={(e) => setInputValue(prev => ({ ...prev, bankName: e.target.value }))}
                          placeholder="Enter bank name"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Product *</label>
                        <Input
                          type="text"
                          value={inputValue.product || ""}
                          onChange={(e) => setInputValue(prev => ({ ...prev, product: e.target.value }))}
                          placeholder="Enter product"
                          required
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>SM Name *</label>
                        <Input
                          type="text"
                          value={inputValue.smName || ""}
                          onChange={(e) => setInputValue(prev => ({ ...prev, smName: e.target.value }))}
                          placeholder="Enter SM name"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Bank Code *</label>
                        <Input
                          type="text"
                          value={inputValue.bankCode || ""}
                          onChange={(e) => setInputValue(prev => ({ ...prev, bankCode: e.target.value }))}
                          placeholder="Enter bank code"
                          required
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>AM Name *</label>
                        <Input
                          type="text"
                          value={inputValue.amName || ""}
                          onChange={(e) => setInputValue(prev => ({ ...prev, amName: e.target.value }))}
                          placeholder="Enter AM name"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Date of Birth *</label>
                        <Input
                          type="date"
                          value={inputValue.dateOfBirth || ""}
                          onChange={(e) => setInputValue(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Login Date *</label>
                        <Input
                          type="date"
                          value={inputValue.loanDate || ""}
                          onChange={(e) => setInputValue(prev => ({ ...prev, loanDate: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Remarks</label>
                        <Input
                          type="text"
                          value={inputValue.remarks_loan || ""}
                          onChange={(e) => setInputValue(prev => ({ ...prev, remarks_loan: e.target.value }))}
                          placeholder="Enter remarks"
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Code</label>
                        <Select
                          options={codes.map(code => ({ value: code.id, label: code.code_name }))}
                          value={inputValue.code ? { value: inputValue.code, label: codes.find(c => c.id === inputValue.code)?.code_name } : null}
                          onChange={(option) => setInputValue(prev => ({ ...prev, code: option ? option.value : '' }))}
                          placeholder="Select Code"
                        />
                        {!showAddCodeField && (
                          <div style={{ marginTop: '10px' }}>
                            <Button 
                              type="button" 
                              className="btn-primary" 
                              onClick={() => setShowAddCodeField(true)}
                            >
                              Add Code
                            </Button>
                          </div>
                        )}
                      </div>
                      {showAddCodeField && (
                        <div className="form-group">
                          <label>New Code Name</label>
                          <Input
                            type="text"
                            value={newCodeName}
                            onChange={(e) => setNewCodeName(e.target.value)}
                            placeholder="Enter new code name"
                          />
                          <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                            <Button 
                              type="button" 
                              className="btn-success" 
                              onClick={handleAddCode}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {isProperty && (
                      <div className="form-section">
                        <h5>Property Details</h5>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Property Address</label>
                            <textarea
                              value={inputValue.address || ""}
                              onChange={(e) => setInputValue(prev => ({ ...prev, address: e.target.value }))}
                              placeholder="Enter property address"
              className="form-control"
                              rows="3"
            />
          </div>
        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Square Feet</label>
                            <Input
                              type="text"
                              value={inputValue.sqFeet || ""}
                              onChange={(e) => setInputValue(prev => ({ ...prev, sqFeet: e.target.value }))}
                              placeholder="Enter square feet"
                            />
      </div>
                          <div className="form-group">
                            <label>Deed Amount</label>
                            <Input
                              type="text"
                              value={inputValue.deedAmount || ""}
                              onChange={(e) => setInputValue(prev => ({ ...prev, deedAmount: e.target.value }))}
                              placeholder="Enter deed amount"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {status === "disbursement" && (
                  <div className="form-section">
                    <h5>Disbursement Details</h5>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Disbursement Amount *</label>
                        <Input
                          type="number"
                          value={inputValue.disbursementAmount || ""}
                          onChange={(e) => setInputValue(prev => ({ ...prev, disbursementAmount: e.target.value }))}
                          placeholder="Enter disbursement amount"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Rate *</label>
                        <Input
                          type="number"
                          value={inputValue.disbursementRate || ""}
                          onChange={(e) => setInputValue(prev => ({ ...prev, disbursementRate: e.target.value }))}
                          placeholder="Enter rate"
                          required
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Insurance *</label>
                        <Select
                          options={[
                            { value: "Yes", label: "Yes" },
                            { value: "No", label: "No" }
                          ]}
                          value={inputValue.insurance ? { value: inputValue.insurance, label: inputValue.insurance } : null}
                          onChange={(option) => setInputValue(prev => ({ ...prev, insurance: option ? option.value : '' }))}
                          placeholder="Select Insurance"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>File Number *</label>
                        <Input
                          type="text"
                          value={inputValue.fileNumber || ""}
                          onChange={(e) => setInputValue(prev => ({ ...prev, fileNumber: e.target.value }))}
                          placeholder="Enter file number"
                          required
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Disbursement Date</label>
                        <Input
                          type="date"
                          value={inputValue.disbursementDate || ""}
                          onChange={(e) => setInputValue(prev => ({ ...prev, disbursementDate: e.target.value }))}
                        />
                      </div>
                      <div className="form-group">
                        <label>Remark</label>
                        <Input
                          type="text"
                          value={inputValue.remark_dis || ""}
                          onChange={(e) => setInputValue(prev => ({ ...prev, remark_dis: e.target.value }))}
                          placeholder="Enter remark"
                        />
                      </div>
                    </div>

                    {inputValue.insurance === 'Yes' && (
                      <div className="form-section">
                        <h5>Insurance Details</h5>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Insurance Amount *</label>
                            <Input
                              type="number"
                              value={inputValue.insuranceAmount || ""}
                              onChange={(e) => setInputValue(prev => ({ ...prev, insuranceAmount: e.target.value }))}
                              placeholder="Enter insurance amount"
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Insurance Bank Name *</label>
                            <Input
                              type="text"
                              value={inputValue.insuranceBankName || ""}
                              onChange={(e) => setInputValue(prev => ({ ...prev, insuranceBankName: e.target.value }))}
                              placeholder="Enter insurance bank name"
                              required
                            />
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Insurance Type *</label>
                            <Input
                              type="text"
                              value={inputValue.insuranceType || ""}
                              onChange={(e) => setInputValue(prev => ({ ...prev, insuranceType: e.target.value }))}
                              placeholder="Enter insurance type"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {status === "partPayment" && (
                  <div className="form-section">
                    <h5>Part Payment Details</h5>
                    <div className="form-row">
                      <div className="form-group">
                        <Button 
                          type="button" 
                          className="btn-primary" 
                          onClick={() => setInputValue(prev => ({ 
                            ...prev, 
                            parts: [...(prev.parts || []), { part_amount: "", part_date: "" }] 
                          }))}
                        >
                          + Add New Part
                        </Button>
                      </div>
                    </div>
                    {(inputValue.parts || []).map((part, index) => (
                      <div key={index} className="form-section">
                        <h6>Part {index + 1}</h6>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Part Amount</label>
                            <Input
                              type="number"
                              value={part.part_amount || ""}
                              onChange={(e) => {
                                const updatedParts = [...(inputValue.parts || [])];
                                updatedParts[index] = { ...updatedParts[index], part_amount: e.target.value };
                                setInputValue(prev => ({ ...prev, parts: updatedParts }));
                              }}
                              placeholder="Enter part amount"
                            />
      </div>
                          <div className="form-group">
                            <label>Part Date</label>
                            <Input
                              type="date"
                              value={part.part_date || ""}
                              onChange={(e) => {
                                const updatedParts = [...(inputValue.parts || [])];
                                updatedParts[index] = { ...updatedParts[index], part_date: e.target.value };
                                setInputValue(prev => ({ ...prev, parts: updatedParts }));
                              }}
                            />
                          </div>
                        </div>
                        {index > 0 && (
                          <div className="form-row">
                            <div className="form-group">
                              <Button 
                                type="button" 
                                className="btn-danger" 
                                onClick={() => {
                                  const updatedParts = (inputValue.parts || []).filter((_, i) => i !== index);
                                  setInputValue(prev => ({ ...prev, parts: updatedParts }));
                                }}
                              >
                                Remove Part {index + 1}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {status === "completed" && (
                  <div className="form-section">
                    <h5>Completed Details</h5>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Completion Date *</label>
                        <Input
                          type="date"
                          value={inputValue.completionDate || ""}
                          onChange={(e) => setInputValue(prev => ({ ...prev, completionDate: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Completion Remarks</label>
                        <Input
                          type="text"
                          value={inputValue.completionRemarks || ""}
                          onChange={(e) => setInputValue(prev => ({ ...prev, completionRemarks: e.target.value }))}
                          placeholder="Enter completion remarks"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="form-actions">
              <Button type="submit" className="submit-btn">
                {editData ? 'Update' : 'Add'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* View Modal - Converted from popup to modal */}
        <Modal open={isViewModalOpen} onClose={toggleViewModal} title="View Loan Details">
          <div className="consumer-form">
            {/* Consumer Information Section */}
            <div className="form-section">
              <h5>Consumer Information</h5>
              <div className="form-row">
                <div className="form-group">
                  <label>Name:</label>
                  <p className="form-value">{viewData?.['userConsumers.username'] || ''}</p>
                </div>
                <div className="form-group">
                  <label>Email:</label>
                  <p className="form-value">{viewData?.['userConsumers.email'] || ''}</p>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Mobile:</label>
                  <p className="form-value">{viewData?.['userConsumers.mobileNumber'] || ''}</p>
                </div>
                <div className="form-group">
                  <label>Reference Name:</label>
                  <p className="form-value">{viewData?.['userConsumers.referenceName'] || ''}</p>
                </div>
              </div>
            </div>

            {/* Loan Manager Information Section */}
            <div className="form-section">
              <h5>Loan Manager Information</h5>
              <div className="form-row">
                <div className="form-group">
                  <label>Manager Name:</label>
                  <p className="form-value">{viewData?.['userRoles.username'] || ''}</p>
                </div>
                <div className="form-group">
                  <label>Manager Email:</label>
                  <p className="form-value">{viewData?.['userRoles.email'] || ''}</p>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Manager Mobile:</label>
                  <p className="form-value">{viewData?.['userRoles.mobileNumber'] || ''}</p>
                </div>
                <div className="form-group">
                  <label>Manager Reference:</label>
                  <p className="form-value">{viewData?.['userRoles.referenceName'] || ''}</p>
                </div>
              </div>
            </div>

                         {/* Loan Status Section */}
             <div className="form-section">
               <h5>Loan Status</h5>
               <div className="form-row">
                 <div className="form-group">
                   <label>Status:</label>
                   <p className="form-value status-value">{(viewData?.details?.status || '').toUpperCase()}</p>
                 </div>
               </div>
               {viewData?.details?.updatedAt && (
                 <div className="form-row">
                   <div className="form-group">
                     <label>Updated At:</label>
                     <p className="form-value">{new Date(viewData.details.updatedAt).toLocaleDateString()}</p>
                   </div>
                 </div>
               )}
             </div>

            {/* Document Details Section */}
            {viewData?.details?.document_details && (
              <div className="form-section">
                <h5>Document Details</h5>
                <div className="form-row">
                  <div className="form-group">
                    <label>Loan Type:</label>
                    <p className="form-value">{viewData?.details?.document_details?.loan_type || ''}</p>
                  </div>
                  <div className="form-group">
                    <label>Type Name:</label>
                    <p className="form-value">{viewData?.details?.document_details?.loan_type_name || ''}</p>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Document Remarks:</label>
                    <p className="form-value">{viewData?.details?.document_details?.remarks_docs || ''}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Login Details Section */}
            {viewData?.details?.login_details && (
              <div className="form-section">
                <h5>Login Details</h5>
                <div className="form-row">
                  <div className="form-group">
                    <label>Loan Amount:</label>
                    <p className="form-value">{viewData?.details?.login_details?.loanAmount || ''}</p>
                  </div>
                  <div className="form-group">
                    <label>Loan Date:</label>
                    <p className="form-value">{viewData?.details?.login_details?.loanDate || ''}</p>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Loan Account Number:</label>
                    <p className="form-value">{viewData?.details?.login_details?.loanAccountNumber || ''}</p>
                  </div>
                  <div className="form-group">
                    <label>Bank Name:</label>
                    <p className="form-value">{viewData?.details?.login_details?.bankName || ''}</p>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Product:</label>
                    <p className="form-value">{viewData?.details?.login_details?.product || ''}</p>
                  </div>
                  <div className="form-group">
                    <label>SM Name:</label>
                    <p className="form-value">{viewData?.details?.login_details?.smName || ''}</p>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>AM Name:</label>
                    <p className="form-value">{viewData?.details?.login_details?.amName || ''}</p>
                  </div>
                  <div className="form-group">
                    <label>Bank Code:</label>
                    <p className="form-value">{viewData?.details?.login_details?.bankCode || ''}</p>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Date of Birth:</label>
                    <p className="form-value">{viewData?.details?.login_details?.dateOfBirth || ''}</p>
                  </div>
                  <div className="form-group">
                    <label>Code Number:</label>
                    <p className="form-value">{getCodeName(viewData?.details?.login_details?.code_id) || viewData?.details?.login_details?.code_name || 'N/A'}</p>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Login Remarks:</label>
                    <p className="form-value">{viewData?.details?.login_details?.remarks_loan || ''}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Query Details Section */}
            {viewData?.details?.query_details && (
              <div className="form-section">
                <h5>Query Details</h5>
                <div className="form-row">
                  <div className="form-group">
                    <label>Query Remarks:</label>
                    <p className="form-value">{viewData?.details?.query_details?.remarks || ''}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Cancel Details Section */}
            {viewData?.details?.cancel_details && (
              <div className="form-section">
                <h5>Cancel Details</h5>
                <div className="form-row">
                  <div className="form-group">
                    <label>Cancel Remarks:</label>
                    <p className="form-value">{viewData?.details?.cancel_details?.remarks_cancel || ''}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Sanction Details Section */}
            {viewData?.details?.sanction_details && (
              <div className="form-section">
                <h5>Sanction Details</h5>
                <div className="form-row">
                  <div className="form-group">
                    <label>Amount:</label>
                    <p className="form-value">{viewData?.details?.sanction_details?.amount || ''}</p>
                  </div>
                  <div className="form-group">
                    <label>Rate:</label>
                    <p className="form-value">{viewData?.details?.sanction_details?.rate || ''}</p>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Tenure:</label>
                    <p className="form-value">{viewData?.details?.sanction_details?.tenure || ''}</p>
                  </div>
                  <div className="form-group">
                    <label>Sanction Date:</label>
                    <p className="form-value">{viewData?.details?.sanction_details?.sanctionDate || ''}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Completed Details Section */}
            {viewData?.details?.completed_details && (
              <div className="form-section">
                <h5>Completed Details</h5>
                <div className="form-row">
                  <div className="form-group">
                    <label>Completion Date:</label>
                    <p className="form-value">{viewData?.details?.completed_details?.completionDate || ''}</p>
                  </div>
                  <div className="form-group">
                    <label>Completion Remarks:</label>
                    <p className="form-value">{viewData?.details?.completed_details?.completionRemarks || ''}</p>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Updated At:</label>
                    <p className="form-value">{viewData?.details?.completed_details?.updated_at ? new Date(viewData.details.completed_details.updated_at).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : ''}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Part Details Section */}
            {viewData?.details?.part_details && viewData?.details?.part_details?.parts && (
              <div className="form-section">
                <h5>Part Details</h5>
                {viewData?.details?.part_details?.parts?.length > 0 ? (
                  viewData.details.part_details.parts.map((part, index) => (
                    <div key={index} className="part-item">
                      <div className="form-row">
                        <div className="form-group">
                          <label>Part {part.part_number || index + 1}:</label>
                          <p className="form-value">Amount: {part.part_amount}, Date: {part.part_date}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No part details available.</p>
                )}
              </div>
            )}

            {/* Disbursement Details Section */}
            {viewData?.details?.disbursement_details && (
              <div className="form-section">
                <h5>Disbursement Details</h5>
                <div className="form-row">
                  <div className="form-group">
                    <label>Disbursement Amount:</label>
                    <p className="form-value">{viewData?.details?.disbursement_details?.disbursementAmount || ''}</p>
                  </div>
                  <div className="form-group">
                    <label>Disbursement Rate:</label>
                    <p className="form-value">{viewData?.details?.disbursement_details?.disbursementRate || ''}</p>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Insurance:</label>
                    <p className="form-value">{viewData?.details?.disbursement_details?.insurance || ''}</p>
                  </div>
                  <div className="form-group">
                    <label>File Number:</label>
                    <p className="form-value">{viewData?.details?.disbursement_details?.fileNumber || ''}</p>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Disbursement Date:</label>
                    <p className="form-value">{viewData?.details?.disbursement_details?.disbursementDate ? new Date(viewData.details.disbursement_details.disbursementDate).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    }) : ''}</p>
                  </div>
                  <div className="form-group">
                    <label>Disbursement Remarks:</label>
                    <p className="form-value">{viewData?.details?.disbursement_details?.remark_dis || ''}</p>
                  </div>
                </div>
                {viewData?.details?.disbursement_details?.insurance === 'Yes' && (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Insurance Amount:</label>
                        <p className="form-value">{viewData?.details?.disbursement_details?.insuranceAmount || ''}</p>
                      </div>
                      <div className="form-group">
                        <label>Insurance Bank Name:</label>
                        <p className="form-value">{viewData?.details?.disbursement_details?.insuranceBankName || ''}</p>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Insurance Type:</label>
                        <p className="form-value">{viewData?.details?.disbursement_details?.insuranceType || ''}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Property Details Section */}
            {viewData?.details?.builder_consumer_details ? (
              <div className="form-section">
                <h5>Property Details</h5>
                <div className="form-row">
                  <div className="form-group">
                    <label>Builder Name:</label>
                    <p className="form-value">{viewData?.details?.builder_consumer_details?.builderuser?.company_name || ''}</p>
                  </div>
                  <div className="form-group">
                    <label>Project Name:</label>
                    <p className="form-value">{viewData?.details?.builder_consumer_details?.builderuser?.unit?.unit_name || ''}</p>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Project Address:</label>
                    <p className="form-value">{viewData?.details?.builder_consumer_details?.builderuser?.unit?.address || ''}</p>
                  </div>
                  <div className="form-group">
                    <label>Wing:</label>
                    <p className="form-value">{viewData?.details?.builder_consumer_details?.wing?.wing_name || ''}</p>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Floor Number:</label>
                    <p className="form-value">{viewData?.details?.builder_consumer_details?.floor?.floorNumber}</p>
                  </div>
                  <div className="form-group">
                    <label>Office No:</label>
                    <p className="form-value">{viewData?.details?.builder_consumer_details?.office_no || ''}</p>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Square Feet:</label>
                    <p className="form-value">{viewData?.details?.builder_consumer_details?.sqFeet || ''}</p>
                  </div>
                  <div className="form-group">
                    <label>Serial Number:</label>
                    <p className="form-value">{viewData?.details?.builder_consumer_details?.srNo || ''}</p>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Builder Remarks:</label>
                    <p className="form-value">{viewData?.details?.builder_consumer_details?.remarks || ''}</p>
                  </div>
                </div>
              </div>
            ) : viewData?.details?.property_details && (
              <div className="form-section">
                <h5>Property Details</h5>
                <div className="form-row">
                  <div className="form-group">
                    <label>Address:</label>
                    <p className="form-value">{viewData?.details?.property_details?.address || ''}</p>
                  </div>
                  <div className="form-group">
                    <label>Square Feet:</label>
                    <p className="form-value">{viewData?.details?.property_details?.sqFeet || ''}</p>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Deed Amount:</label>
                    <p className="form-value">{viewData?.details?.property_details?.deedAmount || ''}</p>
                  </div>
                </div>
              </div>
            )}

            {/* All Remarks Section - Show all remarks in one place */}
            {viewData?.details?.remarks && (
              <div className="form-section">
                <h5>Complete Remarks Data</h5>
                <div className="remarks-display">
                  {(() => {
                    try {
                      const remarksData = JSON.parse(viewData.details.remarks);
                      console.log('🔍 [REMARKS] Raw remarks data:', remarksData);
                      
                      const allFields = [];
                      Object.entries(remarksData).forEach(([sectionKey, sectionData]) => {
                        console.log(`🔍 [REMARKS] Processing section: ${sectionKey}`, sectionData);
                        
                        if (typeof sectionData === 'object' && sectionData !== null) {
                          Object.entries(sectionData).forEach(([fieldKey, fieldValue]) => {
                            console.log(`🔍 [REMARKS] Processing field: ${fieldKey}`, fieldValue);
                            
                            // Handle different types of field values
                            let displayValue = '';
                            
                            if (typeof fieldValue === 'object' && fieldValue !== null) {
                              if (Array.isArray(fieldValue)) {
                                // Handle arrays (like parts array)
                                if (fieldValue.length > 0 && typeof fieldValue[0] === 'object') {
                                  // Array of objects (like parts with part_amount and part_date)
                                  displayValue = fieldValue.map((item, idx) => {
                                    if (item.part_amount !== undefined && item.part_date !== undefined) {
                                      return `Part ${idx + 1}: ₹${item.part_amount} on ${item.part_date}`;
                                    } else {
                                      return JSON.stringify(item);
                                    }
                                  }).join('; ');
                                } else {
                                  // Array of simple values
                                  displayValue = fieldValue.join(', ');
                                }
                              } else if (fieldValue.part_amount !== undefined && fieldValue.part_date !== undefined) {
                                // Single part object
                                displayValue = `Amount: ₹${fieldValue.part_amount}, Date: ${fieldValue.part_date}`;
                              } else {
                                // Other objects - convert to readable format
                                const objEntries = Object.entries(fieldValue);
                                if (objEntries.length > 0) {
                                  displayValue = objEntries.map(([key, value]) => 
                                    `${key.replace(/_/g, ' ')}: ${value}`
                                  ).join(', ');
                                } else {
                                  displayValue = JSON.stringify(fieldValue);
                                }
                              }
                            } else if (fieldKey === 'loanAmount') {
                              displayValue = `₹${fieldValue}`;
                            } else if (fieldKey === 'loanDate' || fieldKey === 'dateOfBirth') {
                              displayValue = new Date(fieldValue).toLocaleDateString();
                            } else if (fieldKey === 'updated_at') {
                              displayValue = new Date(fieldValue).toLocaleString();
                            } else {
                              displayValue = String(fieldValue || '');
                            }
                            
                            console.log(`🔍 [REMARKS] Final display value for ${fieldKey}:`, displayValue);
                            
                            allFields.push({
                              section: sectionKey,
                              field: fieldKey,
                              value: fieldValue,
                              displayValue: displayValue
                            });
                          });
                        } else {
                          allFields.push({
                            section: sectionKey,
                            field: sectionKey,
                            value: sectionData,
                            displayValue: String(sectionData || '')
                          });
                        }
                      });
                      
                      return (
                        <div>
                          {allFields.map((item, index) => (
                            <div key={index} className="remark-line">
                              <label>{item.field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</label>
                              <span className="remark-value">{item.displayValue}</span>
                            </div>
                          ))}
                        </div>
                      );
                    } catch (error) {
                      console.error('🔍 [REMARKS] Error processing remarks:', error);
                      return (
                        <div className="remark-line">
                          <label>Remarks:</label>
                          <span className="remark-value">{viewData.details.remarks}</span>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
            )}

            {/* Export Button */}
            <div className="form-actions">
              <Button className="export-pdf-btn" onClick={() => generatePDF(viewData)}>Export to PDF</Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default Loani;
