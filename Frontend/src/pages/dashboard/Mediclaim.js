import { ROLE_IDS, CATEGORY_IDS } from "../../config/ids";
import toast from 'react-hot-toast';
import React, { useEffect, useState } from 'react';
import '../../styles/pages/dashboard/Consumer.css';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import DashboardLayout from '../../components/DashboardLayout';
import { getAllMedicalimConsumerData } from '../../serviceAPI/userAPI';
import Cookies from 'js-cookie';
import * as XLSX from 'xlsx';
import Modal from '../../components/common/Modal';
import MediclaimModal from '../../components/MediclaimModal';
import config from '../../config/apiConfig';

const Mediclaim = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [heading, setHeading] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [detail, setDetail] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewIndex, setViewIndex] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const categoryId = Cookies.get('category');
  const user = (Cookies.get('user') && JSON.parse(Cookies.get('user'))) || '';

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
    if (!isModalOpen) {
      setEditData(null);
    }
  };

  const toggleViewModal = () => {
    setIsViewModalOpen(!isViewModalOpen);
    setViewIndex(null);
    setDetail(null);
  };

  useEffect(() => {
    getAllMediclaimConsumerData();
  }, []);

  // Handle renewal data when component mounts
  useEffect(() => {
    const isRenew = localStorage.getItem('isRenew');
    const MediclaimID = localStorage.getItem('MediclaimID');
    const renewalData = localStorage.getItem('renewalData');
    
    if (isRenew === 'true' && MediclaimID && renewalData) {
      console.log('🔄 [RENEWAL MOUNT] Processing renewal request on mount for ID:', MediclaimID);
      
      try {
        const parsedRenewalData = JSON.parse(renewalData);
        console.log('🔄 [RENEWAL MOUNT] Parsed renewal data on mount:', parsedRenewalData);
        
        // Set the renewal data for editing
        setEditData(parsedRenewalData);
        setIsModalOpen(true);
        
        // Note: Don't clear localStorage here - let MediclaimModal handle it after processing renewal logic
        
        console.log('🔄 [RENEWAL MOUNT] Renewal modal opened successfully on mount');
      } catch (error) {
        console.error('🔄 [RENEWAL MOUNT] Error parsing renewal data on mount:', error);
        // Clear invalid data
        localStorage.removeItem('isRenew');
        localStorage.removeItem('MediclaimID');
        localStorage.removeItem('renewalData');
      }
    }
  }, []);

  // Filter data when search query changes
  const handleSearch = (searchQuery) => {
    if (!searchQuery.trim()) {
      setFilteredData(data);
      return;
    }
    
    const filtered = data.filter(row =>
      Object.values(row).some(value =>
        String(value || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
    setFilteredData(filtered);
  };

  // Date range filter functions
  const isWithinDateRange = (dateStr, fromDate, toDate) => {
    if (!fromDate || !toDate) return true;
    if (!dateStr) return false;
    const start = new Date(new Date(fromDate).setHours(0, 0, 0, 0));
    const end = new Date(new Date(toDate).setHours(23, 59, 59, 999));
    const d = new Date(dateStr);
    if (isNaN(d)) return false;
    return d >= start && d <= end;
  };

  const handleDateSearch = () => {
    if (!startDate || !endDate) {
      setFilteredData(data);
      return;
    }

    const filtered = data.filter(item => {
      // Check various date fields that might be relevant for mediclaim
      const policyIssuedDate = item.runningPolicy?.PolicyIssuedDate;
      const policyFromDate = item.runningPolicy?.PolicyFrom;
      const policyToDate = item.runningPolicy?.PolicyTo;
      const expiryDate = item.runningPolicy?.ExpiryDate;

      return isWithinDateRange(policyIssuedDate, startDate, endDate) ||
             isWithinDateRange(policyFromDate, startDate, endDate) ||
             isWithinDateRange(policyToDate, startDate, endDate) ||
             isWithinDateRange(expiryDate, startDate, endDate);
    });

    setFilteredData(filtered);
  };

  const handleClearDateFilter = () => {
    setStartDate('');
    setEndDate('');
    setFilteredData(data);
  };

  const getAllMediclaimConsumerData = async () => {
    setLoading(true);
    const consumerData = await getAllMedicalimConsumerData();
    if (consumerData?.data && consumerData?.data?.length) {
      const processedData = consumerData?.data.map((item, index) => {
        console.log(`🔍 Processing item ${index}:`, item);
        console.log(`🔍 Item ${index} referenceName:`, item.referenceName);
        return {
        ...item,
          'runningPolicy.PolicyIssuedDate': item.runningPolicy?.PolicyIssuedDate ? new Date(item.runningPolicy.PolicyIssuedDate).toLocaleDateString('en-GB') : '',
          'runningPolicy.ExpiryDate': item.runningPolicy?.ExpiryDate ? new Date(item.runningPolicy.ExpiryDate).toLocaleDateString('en-GB') : '',
          // Add display fields for better table visibility
          'displayName': item.user?.username || '',
          'displayEmail': item.user?.email || '',
          'displayMobile': item.user?.mobileNumber || '',
          'displayReference': item.referenceName || '',
          'displayPolicyNumber': item.runningPolicy?.PolicyNumber || '',
          'displayCompany': item.mediclaimcompany?.mediclaim_company_name || '',
          'displaySumInsured': item.sumInsured || '',
          'displayNoClaimBonus': item.noClaimBonus || '',
          'displayPremiumAmount': item.runningPolicy?.PremiumAmount || '',
          'displayPolicyTenure': item.runningPolicy?.PolicyTenure || '',
          'displayPolicyPlanType': item.runningPolicy?.PolicyPlanType || ''
        };
      });
      console.log('🔍 Processed data:', processedData);
      setData(processedData);
      setFilteredData(processedData);
      
      // Check if this is a renewal request
      let isRenew = localStorage.getItem('isRenew');
      let MediclaimID = localStorage.getItem('MediclaimID');
      let renewalData = localStorage.getItem('renewalData');
      
      if (isRenew === 'true' && MediclaimID && renewalData) {
        console.log('🔄 [RENEWAL] Processing renewal request for ID:', MediclaimID);
        console.log('🔄 [RENEWAL] Renewal data:', renewalData);
        
        try {
          const parsedRenewalData = JSON.parse(renewalData);
          console.log('🔄 [RENEWAL] Parsed renewal data:', parsedRenewalData);
          
          // Set the renewal data for editing
          setEditData(parsedRenewalData);
          setIsModalOpen(true);
          
          // Note: Don't clear localStorage here - let MediclaimModal handle it after processing renewal logic
          
          console.log('🔄 [RENEWAL] Renewal modal opened successfully');
        } catch (error) {
          console.error('🔄 [RENEWAL] Error parsing renewal data:', error);
          // Clear invalid data
          localStorage.removeItem('isRenew');
          localStorage.removeItem('MediclaimID');
          localStorage.removeItem('renewalData');
        }
      }
    } else {
      setData([]);
      setFilteredData([]);
    }
    
    setHeading([
      { key: 'runningPolicy.PolicyIssuedDate', head: 'Issue Date' },
      { key: 'displayName', head: 'Name' }, 
      { key: 'displayEmail', head: 'Email' }, 
      { key: 'displayMobile', head: 'Mobile Number' },
      { key: 'displayReference', head: 'Reference Name' },
      { key: 'displayPolicyNumber', head: 'Policy Number' },
      { key: 'runningPolicy.ExpiryDate', head: 'Expiry Date' },
      { key: 'displayCompany', head: 'Company Name' },
      { key: 'displaySumInsured', head: 'Sum Insured' },
      { key: 'displayNoClaimBonus', head: 'No Claim Bonus' },
      { key: 'displayPremiumAmount', head: 'Premium' },
      { key: 'displayPolicyTenure', head: 'Policy Tenure' },
      { key: 'displayPolicyPlanType', head: 'Policy Plan Type' }
    ]);
    setLoading(false);
  };

  const handleView = async (userData) => {
    console.log('🔍 [MEDICLAIM VIEW] View clicked for userData:', userData);
    const globalIndex = data.findIndex((item) => item.id === userData.id);
    console.log('🔍 [MEDICLAIM VIEW] Found at globalIndex:', globalIndex);
    if (globalIndex !== -1) {
      setViewIndex(globalIndex);
      const detailData = data[globalIndex];
      console.log('🔍 [MEDICLAIM VIEW] Detail data:', detailData);
      console.log('🔍 [MEDICLAIM VIEW] Data structure:', {
        id: detailData.id,
        user: detailData.user,
        runningPolicy: detailData.runningPolicy,
        previousPolicy: detailData.previousPolicy,
        familymembers: detailData.familymembers,
        employees: detailData.employees,
        medicliam_type: detailData.medicliam_type,
        medicliam_policy_type: detailData.medicliam_policy_type,
        agentName: detailData.agentName,
        agentCode: detailData.agentCode,
        agentContactNumber: detailData.agentContactNumber
      });
      setDetail(detailData);
      setIsViewModalOpen(true);
    }
  };

  const handleEdit = (userData) => {
    console.log('🔍 [MEDICLAIM EDIT] Edit clicked for userData:', userData);
    const globalIndex = data.findIndex((item) => item.id === userData.id);
    console.log('🔍 [MEDICLAIM EDIT] Found at globalIndex:', globalIndex);
    if (globalIndex !== -1) {
      const itemData = data[globalIndex];
      console.log('🔍 [MEDICLAIM EDIT] Item data being passed to popup:', itemData);
      console.log('🔍 [MEDICLAIM EDIT] Item structure:', {
        id: itemData.id,
        user: itemData.user,
        runningPolicy: itemData.runningPolicy,
        previousPolicy: itemData.previousPolicy,
        familymembers: itemData.familymembers,
        employees: itemData.employees,
        medicliam_type: itemData.medicliam_type,
        medicliam_policy_type: itemData.medicliam_policy_type,
        agentName: itemData.agentName,
        agentCode: itemData.agentCode,
        agentContactNumber: itemData.agentContactNumber
      });
      setEditData(itemData);
      setIsModalOpen(true);
    }
  };

  const handleSort = (column) => {
    const direction = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(column);
    setSortDirection(direction);
  };

  const fetchApi = () => {
    getAllMediclaimConsumerData();
  };

  const exportToExcel = async () => {
    try {
      console.log("Starting export process...");
      
      // Fetch all data without any filters
      const consumerData = await getAllMedicalimConsumerData();
      console.log("Raw API Response:", JSON.stringify(consumerData, null, 2));

      if (!consumerData) {
        console.error("No consumer data received from API");
        toast.error("No data available to export");
        return;
      }

      if (!consumerData.data) {
        console.error("No data property in API response");
        console.log("API Response structure:", consumerData);
        toast.error("No data available to export");
        return;
      }

      if (!consumerData.data.length) {
        console.error("Empty data array in API response");
        toast.error("No data available to export");
        return;
      }

      // Prepare data for export
      const exportData = consumerData.data.map((item, index) => {
        console.log(`\nProcessing item ${index + 1}:`, JSON.stringify(item, null, 2));
        
        // Log the exact structure of the item
        console.log("Item keys:", Object.keys(item));
        console.log("Item user:", item.user);
        console.log("Item runningPolicy:", item.runningPolicy);
        console.log("Item mediclaimcompany:", item.mediclaimcompany);
        
        // Extract nested data with debug logging
        const userData = item.user || {};
        console.log(`User data for item ${index + 1}:`, JSON.stringify(userData, null, 2));
        
        const runningPolicy = item.runningPolicy || {};
        console.log(`Running policy for item ${index + 1}:`, JSON.stringify(runningPolicy, null, 2));
        
        const mediclaimCompany = item.mediclaimcompany || {};
        console.log(`Mediclaim company for item ${index + 1}:`, JSON.stringify(mediclaimCompany, null, 2));
        
        const exportItem = {
          'Proposer Name': item.user?.username || userData.username || '',
          'Email': item.user?.email || userData.email || '',
          'Mobile Number': item.user?.mobileNumber || userData.mobileNumber || '',
          'Reference Name': item.referenceName || '',
          'Issue Date': item.runningPolicy?.PolicyIssuedDate || runningPolicy.PolicyIssuedDate || '',
          'Company Name': item.mediclaimcompany?.mediclaim_company_name || mediclaimCompany.mediclaim_company_name || '',
          'Status': item.status || item.medicliam_status || 'Active',
          'Policy Number': item.runningPolicy?.PolicyNumber || runningPolicy.PolicyNumber || '',
          'Expiry Date': item.runningPolicy?.ExpiryDate || runningPolicy.ExpiryDate || '',
          'Created At': item.createdAt || '',
          'Updated At': item.updatedAt || '',
          'Gender': item.gender || '',
          'Age': item.age || '',
          'Relationship With Policy Holder': item.relationshipWithPolicyHolder || '',
          'Type Member': item.medicliam_type || '',
          'Policy Type': item.medicliam_policy_type || '',
          'Sum Insured': item.sumInsured || '',
          'No Claim Bonus': item.noClaimBonus || ''
        };
        
        console.log(`Mapped export item ${index + 1}:`, JSON.stringify(exportItem, null, 2));
        return exportItem;
      });

      console.log("\nFinal export data array:", JSON.stringify(exportData, null, 2));

      if (!exportData.length) {
        console.error("No data was mapped for export");
        toast.error("No data available to export");
        return;
      }

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      const wscols = [
        {wch: 20}, // Proposer Name
        {wch: 30}, // Email
        {wch: 15}, // Mobile Number
        {wch: 20}, // Reference Name
        {wch: 15}, // Issue Date
        {wch: 25}, // Company Name
        {wch: 15}, // Status
        {wch: 20}, // Policy Number
        {wch: 15}, // Expiry Date
        {wch: 20}, // Created At
        {wch: 20}, // Updated At
        {wch: 10}, // Gender
        {wch: 10}, // Age
        {wch: 25}, // Relationship
        {wch: 15}, // Type Member
        {wch: 15}, // Policy Type
        {wch: 15}, // Sum Insured
        {wch: 15}  // No Claim Bonus
      ];
      ws['!cols'] = wscols;
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Mediclaim Data");
      
      // Generate Excel file
      XLSX.writeFile(wb, "mediclaim_data.xlsx");
      console.log("Excel file generated successfully");
    } catch (error) {
      console.error("Detailed error in export process:", error);
      console.error("Error stack:", error.stack);
      toast.error("Error exporting data. Please check console for details.");
    }
  };

  // View Modal Content
  const ViewModalContent = () => {
    console.log('🔍 [VIEW MODAL] Rendering with detail:', detail);
    return (
    <div className="consumer-form">
      {detail && (
        <>
          <div className="form-section">
            <h5>Consumer Information</h5>
            <div className="form-row">
              <div className="form-group">
                <label>Proposer Name:</label>
                <span className="detail-value">{detail.user?.username || detail.displayName || 'N/A'}</span>
              </div>
              <div className="form-group">
                <label>Mail ID:</label>
                <span className="detail-value">{detail.user?.email || detail.displayEmail || 'N/A'}</span>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Mobile Number:</label>
                <span className="detail-value">{detail.user?.mobileNumber || detail.displayMobile || 'N/A'}</span>
              </div>
              <div className="form-group">
                <label>Policy Member:</label>
                <span className="detail-value">{detail.medicliam_type || 'N/A'}</span>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Policy Type:</label>
                <span className="detail-value">{detail.medicliam_policy_type || 'N/A'}</span>
              </div>
              <div className="form-group">
                <label>Reference Name:</label>
                <span className="detail-value">{detail.referenceName || detail.displayReference || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h5>Documents</h5>
            <div className="form-row">
              <div className="form-group" style={{ flex: '1 1 100%' }}>
                <label>Aadhar Card:</label>
                {detail.AadharFileName ? (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '8px 12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    border: '1px solid #e9ecef',
                    marginTop: '6px'
                  }}>
                    <span style={{ fontSize: '0.85em', color: '#495057', flex: 1, wordBreak: 'break-all' }}>
                      📄 {detail.AadharFileName}
                    </span>
                    <button
                      onClick={() => window.open(`${config.API_URL}/user/download/${detail.AadharFileName}`, '_blank')}
                    style={{ 
                        padding: '5px 12px',
                        backgroundColor: '#1976d2',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8em',
                        fontWeight: '500',
                        transition: 'background-color 0.2s',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
                    >
                      📥 Download
                    </button>
                  </div>
                ) : (
                  <span className="detail-value">No document uploaded</span>
                )}
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group" style={{ flex: '1 1 100%' }}>
                <label>PAN Card:</label>
                {detail.PanFileName ? (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '8px 12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    border: '1px solid #e9ecef',
                    marginTop: '6px'
                  }}>
                    <span style={{ fontSize: '0.85em', color: '#495057', flex: 1, wordBreak: 'break-all' }}>
                      📄 {detail.PanFileName}
                    </span>
                    <button
                      onClick={() => window.open(`${config.API_URL}/user/download/${detail.PanFileName}`, '_blank')}
                    style={{ 
                        padding: '5px 12px',
                        backgroundColor: '#1976d2',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8em',
                        fontWeight: '500',
                        transition: 'background-color 0.2s',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
                    >
                      📥 Download
                    </button>
                  </div>
                ) : (
                  <span className="detail-value">No document uploaded</span>
                )}
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group" style={{ flex: '1 1 100%' }}>
                <label>GST:</label>
                {detail.GstFileName ? (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '8px 12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    border: '1px solid #e9ecef',
                    marginTop: '6px'
                  }}>
                    <span style={{ fontSize: '0.85em', color: '#495057', flex: 1, wordBreak: 'break-all' }}>
                      📄 {detail.GstFileName}
                    </span>
                    <button
                      onClick={() => window.open(`${config.API_URL}/user/download/${detail.GstFileName}`, '_blank')}
                    style={{ 
                        padding: '5px 12px',
                        backgroundColor: '#1976d2',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8em',
                        fontWeight: '500',
                        transition: 'background-color 0.2s',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
                    >
                      📥 Download
                    </button>
                  </div>
                ) : (
                  <span className="detail-value">No document uploaded</span>
                )}
              </div>
            </div>
            
              {detail.customDocuments && JSON.parse(detail.customDocuments || '[]').map((doc, idx) => (
              <div className="form-row" key={idx}>
                <div className="form-group" style={{ flex: '1 1 100%' }}>
                  <label>{doc.name}:</label>
                  {doc.file ? (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      gap: '12px',
                      padding: '8px 12px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '4px',
                      border: '1px solid #e9ecef',
                      marginTop: '6px'
                    }}>
                      <span style={{ fontSize: '0.85em', color: '#495057', flex: 1, wordBreak: 'break-all' }}>
                        📄 {doc.file}
                      </span>
                      <button
                        onClick={() => window.open(`${config.API_URL}/user/download/${doc.file}`, '_blank')}
                      style={{ 
                          padding: '5px 12px',
                          backgroundColor: '#1976d2',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8em',
                          fontWeight: '500',
                          transition: 'background-color 0.2s',
                          whiteSpace: 'nowrap'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
                      >
                        📥 Download
                      </button>
                    </div>
                  ) : (
                    <span className="detail-value">N/A</span>
                  )}
                </div>
                </div>
              ))}
          </div>

          {/* Phase 3: Conditional based on Policy Member */}
          {detail.medicliam_type === 'Individual' && (
            <div className="form-section">
              <h5>Policyholder Details</h5>
              <div className="form-row">
                <div className="form-group">
                  <label>Proposer Name:</label>
                  <span className="detail-value">{detail.user?.username || detail.displayName || 'N/A'}</span>
                </div>
                <div className="form-group">
                  <label>Date of Birth:</label>
                  <span className="detail-value">{detail.dob ? new Date(detail.dob).toLocaleDateString('en-GB') : 'N/A'}</span>
                </div>
              <div className="form-group">
                  <label>Age:</label>
                <span className="detail-value">{detail.age || 'N/A'}</span>
                </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                  <label>Gender:</label>
                  <span className="detail-value">{detail.gender || 'N/A'}</span>
                </div>
                <div className="form-group">
                  <label>Relationship with Policy Holder:</label>
                <span className="detail-value">{detail.relationshipWithPolicyHolder || 'N/A'}</span>
                </div>
            </div>
            <div className="form-row">
                <div className="form-group">
                  <label>Sum Insured:</label>
                  <span className="detail-value">{detail.sumInsured || 'N/A'}</span>
                </div>
                <div className="form-group">
                  <label>No Claim Bonus:</label>
                  <span className="detail-value">{detail.noClaimBonus || 'N/A'}</span>
                </div>
            </div>
              
              {detail.insuredPersonName && (
                <>
                  <h5 style={{marginTop: '15px', marginBottom: '10px'}}>Insured Person Details</h5>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Insured Person Name:</label>
                      <span className="detail-value">{detail.insuredPersonName || 'N/A'}</span>
                    </div>
                    <div className="form-group">
                      <label>Relationship:</label>
                      <span className="detail-value">{detail.insuredPersonRelationship || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Date of Birth:</label>
                      <span className="detail-value">{detail.insuredPersonDateOfBirth ? new Date(detail.insuredPersonDateOfBirth).toLocaleDateString('en-GB') : 'N/A'}</span>
                    </div>
                    <div className="form-group">
                      <label>Age:</label>
                      <span className="detail-value">{detail.insuredPersonAge || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Gender:</label>
                      <span className="detail-value">{detail.insuredPersonGender || 'N/A'}</span>
                    </div>
                    <div className="form-group">
                      <label>Date of Joining:</label>
                      <span className="detail-value">{detail.insuredPersonDateOfJoining ? new Date(detail.insuredPersonDateOfJoining).toLocaleDateString('en-GB') : 'N/A'}</span>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Pre-existing Illness:</label>
                      <span className="detail-value">{detail.insuredPersonPreExistingIllness || 'N/A'}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {detail.medicliam_type === 'Family' && (
          <div className="form-section">
              <h5>Policyholder Details</h5>
            <div className="form-row">
              <div className="form-group">
                  <label>Proposer Name:</label>
                  <span>{detail.user?.username || detail.displayName || 'N/A'}</span>
                </div>
              <div className="form-group">
                  <label>Date of Birth:</label>
                  <span>{detail.dob ? new Date(detail.dob).toLocaleDateString('en-GB') : 'N/A'}</span>
                </div>
              <div className="form-group">
                  <label>Age:</label>
                  <span>{detail.age || 'N/A'}</span>
                </div>
              <div className="form-group">
                  <label>Gender:</label>
                  <span>{detail.gender || 'N/A'}</span>
                </div>
                <div className="form-group">
                  <label>Relationship with Policy Holder:</label>
                  <span>{detail.relationshipWithPolicyHolder || 'N/A'}</span>
                </div>
              <div className="form-group">
                  <label>Sum Insured:</label>
                  <span>{detail.sumInsured || 'N/A'}</span>
                </div>
              <div className="form-group">
                  <label>No Claim Bonus:</label>
                  <span>{detail.noClaimBonus || 'N/A'}</span>
                </div>
              </div>
              
              {detail.familymembers && detail.familymembers.length > 0 && (
                <>
                  <h5 style={{marginTop: '15px', marginBottom: '10px'}}>Family Members</h5>
                  {detail.familymembers.map((member, index) => (
                <div key={index} className="family-member-section" style={{marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px'}}>
                  <h5>Family Member {index + 1}</h5>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Family Member Name:</label>
                      <span>{member.FamilyName || 'N/A'}</span>
                    </div>
                    <div className="form-group">
                      <label>Relationship With Policy Holder:</label>
                      <span>{member.RelationshipWithPolicyHolder || 'N/A'}</span>
                    </div>
                    <div className="form-group">
                      <label>Date Of Birth:</label>
                      <span>{member.DateOfBirth ? new Date(member.DateOfBirth).toLocaleDateString('en-GB') : 'N/A'}</span>
                    </div>
                    <div className="form-group">
                      <label>Age:</label>
                      <span>{member.Age || 'N/A'}</span>
                    </div>
                    <div className="form-group">
                      <label>Gender:</label>
                      <span>{member.Gender || 'N/A'}</span>
              </div>
              <div className="form-group">
                <label>Date of Joining:</label>
                      <span>{member.DateOfJoining ? new Date(member.DateOfJoining).toLocaleDateString('en-GB') : 'N/A'}</span>
              </div>
                    <div className="form-group">
                      <label>Pre Existing Illness:</label>
                      <span>{member.PreExistingIllness || 'N/A'}</span>
            </div>
          </div>
                  </div>
                ))}
                </>
              )}
            </div>
          )}

          {detail.medicliam_type === 'Employee' && (
            <div className="form-section">
              <h5>Policyholder Details</h5>
              <div className="form-row">
                <div className="form-group">
                  <label>Proposer Name:</label>
                  <span>{detail.user?.username || detail.displayName || 'N/A'}</span>
                </div>
                <div className="form-group">
                  <label>Date of Birth:</label>
                  <span>{detail.dob ? new Date(detail.dob).toLocaleDateString('en-GB') : 'N/A'}</span>
                </div>
                <div className="form-group">
                  <label>Age:</label>
                  <span>{detail.age || 'N/A'}</span>
                </div>
                <div className="form-group">
                  <label>Gender:</label>
                  <span>{detail.gender || 'N/A'}</span>
                </div>
                <div className="form-group">
                  <label>Relationship with Policy Holder:</label>
                  <span>{detail.relationshipWithPolicyHolder || 'N/A'}</span>
                </div>
                <div className="form-group">
                  <label>Sum Insured:</label>
                  <span>{detail.sumInsured || 'N/A'}</span>
                </div>
                <div className="form-group">
                  <label>No Claim Bonus:</label>
                  <span>{detail.noClaimBonus || 'N/A'}</span>
                </div>
              </div>
              
              {detail.employees && detail.employees.length > 0 && (
                <>
                  <h5 style={{marginTop: '15px', marginBottom: '10px'}}>Employees</h5>
                  {detail.employees.map((employee, index) => (
                <div key={index} className="family-member-section" style={{marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px'}}>
                  <h5>Employee {index + 1}</h5>
              <div className="form-row">
                <div className="form-group">
                      <label>Employee Name:</label>
                      <span>{employee.EmployeeName || 'N/A'}</span>
                </div>
                <div className="form-group">
                      <label>Relationship With Policy Holder:</label>
                      <span>{employee.RelationshipWithPolicyHolder || 'N/A'}</span>
                </div>
                <div className="form-group">
                      <label>Date Of Birth:</label>
                      <span>{employee.DateOfBirth ? new Date(employee.DateOfBirth).toLocaleDateString('en-GB') : 'N/A'}</span>
                </div>
                <div className="form-group">
                  <label>Age:</label>
                      <span>{employee.Age || 'N/A'}</span>
                </div>
                <div className="form-group">
                  <label>Gender:</label>
                      <span>{employee.Gender || 'N/A'}</span>
                </div>
                <div className="form-group">
                  <label>Date of Joining:</label>
                      <span>{employee.DateOfJoining ? new Date(employee.DateOfJoining).toLocaleDateString('en-GB') : 'N/A'}</span>
                </div>
                <div className="form-group">
                      <label>Pre Existing Illness:</label>
                      <span>{employee.PreExistingIllness || 'N/A'}</span>
                </div>
              </div>
                  </div>
                ))}
                </>
              )}
            </div>
          )}

          {detail.runningPolicy && detail.runningPolicy.PolicyNumber && (
          <div className="form-section">
            <h5>Running Policy Details</h5>
            <div className="form-row">
              <div className="form-group">
                <label>Policy Number:</label>
                <span>{detail.runningPolicy?.PolicyNumber || detail.displayPolicyNumber || 'N/A'}</span>
              </div>
              <div className="form-group">
                <label>Zone:</label>
                <span>{detail.runningPolicy?.Zone || 'N/A'}</span>
              </div>
              <div className="form-group">
                <label>Policy Plan Type:</label>
                <span>{detail.runningPolicy?.PolicyPlanType || 'N/A'}</span>
              </div>
              <div className="form-group">
                <label>Policy Tenure:</label>
                <span>{detail.runningPolicy?.PolicyTenure ? `${detail.runningPolicy.PolicyTenure} years` : 'N/A'}</span>
              </div>
              <div className="form-group">
                <label>Premium Amount:</label>
                <span>{detail.runningPolicy?.PremiumAmount || 'N/A'}</span>
              </div>
              <div className="form-group">
                <label>Policy From:</label>
                <span>{detail.runningPolicy?.PolicyFrom ? new Date(detail.runningPolicy.PolicyFrom).toLocaleDateString('en-GB') : 'N/A'}</span>
              </div>
              <div className="form-group">
                <label>Policy To:</label>
                <span>{detail.runningPolicy?.PolicyTo ? new Date(detail.runningPolicy.PolicyTo).toLocaleDateString('en-GB') : 'N/A'}</span>
              </div>
              <div className="form-group">
                <label>Policy Issued Date:</label>
                <span>{detail.runningPolicy?.PolicyIssuedDate ? new Date(detail.runningPolicy.PolicyIssuedDate).toLocaleDateString('en-GB') : 'N/A'}</span>
              </div>
              <div className="form-group">
                <label>Expiry Date:</label>
                <span>{detail.runningPolicy?.ExpiryDate ? new Date(detail.runningPolicy.ExpiryDate).toLocaleDateString('en-GB') : 'N/A'}</span>
              </div>
              <div className="form-group">
                <label>Add On Cover:</label>
                <span>{detail.runningPolicy?.AddOnCover || 'N/A'}</span>
              </div>
              <div className="info-item" style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
                <label style={{ fontWeight: '600', color: '#333' }}>Current Policy File:</label>
                {detail.runningPolicy?.CurrentPolicyFile ? (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '8px 12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    border: '1px solid #e9ecef'
                  }}>
                    <span style={{ fontSize: '0.85em', color: '#495057', flex: 1, wordBreak: 'break-all' }}>
                      📄 {detail.runningPolicy.CurrentPolicyFile}
                    </span>
                    <button
                      onClick={() => window.open(`${config.API_URL}/user/download/${detail.runningPolicy.CurrentPolicyFile}`, '_blank')}
                    style={{ 
                        padding: '5px 12px',
                        backgroundColor: '#1976d2',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8em',
                        fontWeight: '500',
                        transition: 'background-color 0.2s',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
                    >
                      📥 Download
                    </button>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.9em', color: '#6c757d' }}>No document uploaded</span>
                )}
              </div>
            </div>
            </div>
          )}

          {/* Previous Policy Details */}
          {detail.previousPolicy && detail.previousPolicy.PolicyNumber && (
            <div className="form-section">
              <h5>Previous Policy Details</h5>
              <div className="form-row">
                <div className="form-group">
                  <label>Policy Number:</label>
                  <span>{detail.previousPolicy.PolicyNumber || 'N/A'}</span>
                </div>
                <div className="form-group">
                  <label>Zone:</label>
                  <span>{detail.previousPolicy.Zone || 'N/A'}</span>
                </div>
                <div className="form-group">
                  <label>Policy From:</label>
                  <span>{detail.previousPolicy.PolicyFrom ? new Date(detail.previousPolicy.PolicyFrom).toLocaleDateString('en-GB') : 'N/A'}</span>
                </div>
                <div className="form-group">
                  <label>Policy To:</label>
                  <span>{detail.previousPolicy.PolicyTo ? new Date(detail.previousPolicy.PolicyTo).toLocaleDateString('en-GB') : 'N/A'}</span>
                </div>
                <div className="form-group">
                  <label>Policy Tenure:</label>
                  <span>{detail.previousPolicy.PolicyTenure ? `${detail.previousPolicy.PolicyTenure} years` : 'N/A'}</span>
                </div>
                <div className="form-group">
                  <label>Premium Amount:</label>
                  <span>{detail.previousPolicy.PremiumAmount || 'N/A'}</span>
                </div>
                <div className="form-group">
                  <label>Sum Insured:</label>
                  <span>{detail.previousPolicy.SumInsured || 'N/A'}</span>
                </div>
                <div className="form-group">
                  <label>No Claim Bonus:</label>
                  <span>{detail.previousPolicy.NoClaimBonus || 'N/A'}</span>
                </div>
                <div className="form-group">
                  <label>Renew Date:</label>
                  <span>{detail.previousPolicy.RenewDate ? new Date(detail.previousPolicy.RenewDate).toLocaleDateString('en-GB') : 'N/A'}</span>
                </div>
                <div className="form-group">
                  <label>Claim Expire In Policy:</label>
                  <span>{detail.previousPolicy.ClaimExpireInPolicy || 'N/A'}</span>
                </div>
                <div className="form-group">
                  <label>Previous Policy Number:</label>
                  <span>{detail.previousPolicy.PreviousPolicyNumber || 'N/A'}</span>
                </div>
                <div className="form-group">
                  <label>Company Name:</label>
                  <span>{detail.previousPolicy.CompanyName || 'N/A'}</span>
                </div>
                <div className="info-item" style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
                  <label style={{ fontWeight: '600', color: '#333' }}>PDF File:</label>
                  {detail.previousPolicy.PdfFile ? (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      gap: '12px',
                      padding: '8px 12px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '4px',
                      border: '1px solid #e9ecef'
                    }}>
                      <span style={{ fontSize: '0.85em', color: '#495057', flex: 1, wordBreak: 'break-all' }}>
                        📄 {detail.previousPolicy.PdfFile}
                      </span>
                      <button
                        onClick={() => window.open(`${config.API_URL}/user/download/${detail.previousPolicy.PdfFile}`, '_blank')}
                      style={{ 
                          padding: '5px 12px',
                          backgroundColor: '#1976d2',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8em',
                          fontWeight: '500',
                          transition: 'background-color 0.2s',
                          whiteSpace: 'nowrap'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
                      >
                        📥 Download
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.9em', color: '#6c757d' }}>No document uploaded</span>
                  )}
                </div>
                {detail.previousPolicy.ClaimExpireInPolicy === 'Yes' && (
                <div className="info-item" style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
                    <label style={{ fontWeight: '600', color: '#333' }}>Claim Statement PDF:</label>
                    {detail.previousPolicy.ClaimStatementPDFfile ? (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        gap: '12px',
                        padding: '8px 12px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '4px',
                        border: '1px solid #e9ecef'
                      }}>
                        <span style={{ fontSize: '0.85em', color: '#495057', flex: 1, wordBreak: 'break-all' }}>
                          📄 {detail.previousPolicy.ClaimStatementPDFfile}
                        </span>
                        <button
                          onClick={() => window.open(`${config.API_URL}/user/download/${detail.previousPolicy.ClaimStatementPDFfile}`, '_blank')}
                        style={{ 
                            padding: '5px 12px',
                            backgroundColor: '#1976d2',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.8em',
                            fontWeight: '500',
                            transition: 'background-color 0.2s',
                            whiteSpace: 'nowrap'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
                        >
                          📥 Download
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.9em', color: '#6c757d' }}>No document uploaded</span>
                    )}
                  </div>
                )}
              </div>
              
              {/* Previous Agent Details - Only for Portability */}
              {detail.medicliam_policy_type === 'Portability' && (detail.previousPolicy.PreviousAgentName || detail.previousPolicy.PreviousAgentCode || detail.previousPolicy.PreviousAgentContactNumber) && (
                <>
                  <h5 style={{marginTop: '15px', marginBottom: '10px'}}>Previous Agent Details</h5>
                  <div className="form-row">
                <div className="form-group">
                      <label>Previous Agent Name:</label>
                      <span>{detail.previousPolicy.PreviousAgentName || 'N/A'}</span>
                    </div>
                <div className="form-group">
                      <label>Previous Agent Code:</label>
                      <span>{detail.previousPolicy.PreviousAgentCode || 'N/A'}</span>
                    </div>
                  <div className="form-group">
                      <label>Previous Agent Contact Number:</label>
                      <span>{detail.previousPolicy.PreviousAgentContactNumber || 'N/A'}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Phase 6: Nominee Details */}
          {detail.runningPolicy && detail.runningPolicy.NomineeName && (
            <div className="form-section">
              <h5>Nominee Details</h5>
                  <div className="form-row">
                    <div className="form-group">
                  <label>Nominee Name:</label>
                  <span>{detail.runningPolicy.NomineeName || 'N/A'}</span>
                </div>
                    <div className="form-group">
                  <label>Nominee Relation:</label>
                  <span>{detail.runningPolicy.NomineeRelation || 'N/A'}</span>
                </div>
                    <div className="form-group">
                  <label>Nominee DOB:</label>
                  <span>{detail.runningPolicy.NomineeDob ? new Date(detail.runningPolicy.NomineeDob).toLocaleDateString('en-GB') : 'N/A'}</span>
                </div>
                    <div className="form-group">
                  <label>Nominee Age:</label>
                  <span>{detail.runningPolicy.NomineeAge || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Phase 7: Agent Details */}
          {detail.agentName && (
            <div className="form-section">
              <h5>Agent Details</h5>
              <div className="form-row">
                    <div className="form-group">
                  <label>Agent Name:</label>
                  <span>{detail.agentName || 'N/A'}</span>
                </div>
                    <div className="form-group">
                  <label>Agent Code:</label>
                  <span>{detail.agentCode || 'N/A'}</span>
                </div>
                    <div className="form-group">
                  <label>Agent Contact Number:</label>
                  <span>{detail.agentContactNumber || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}
          </>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout onSearch={handleSearch}>
      <div className="consumer-container">
        <div className="consumer-header">
          <h1>Mediclaim Management</h1>
        <div>
                <Button className="add-consumer-btn me-2" onClick={exportToExcel}>Export to Excel</Button>
                {((user && user.role_id !== ROLE_IDS.SUPER_ADMIN) || (categoryId && categoryId.includes(CATEGORY_IDS.MEDICLAIM))) && (
                    <Button className="add-consumer-btn" onClick={toggleModal}>+ Add Mediclaim</Button>
                )}
        </div>
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
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
            <Button className="add-consumer-btn" onClick={handleDateSearch}>Search</Button>
            <Button className="cancel-btn" onClick={handleClearDateFilter}>Clear</Button>
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

        {isModalOpen && (
          <MediclaimModal
            isOpen={isModalOpen}
            onClose={toggleModal}
            fetchApi={fetchApi}
            initialData={editData}
            view={false}
          />
        )}

        {isViewModalOpen && (
          <Modal
            open={isViewModalOpen}
            onClose={toggleViewModal}
            title="Mediclaim Details"
          >
            <ViewModalContent />
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Mediclaim;
