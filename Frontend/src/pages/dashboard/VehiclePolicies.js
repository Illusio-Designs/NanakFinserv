import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { getVehicleUserData } from '../../serviceAPI/userAPI';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { FiEye } from 'react-icons/fi';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import '../../styles/pages/dashboard/Consumer.css';

const VehiclePolicies = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [heading, setHeading] = useState([]);
  const [itemsPerPage] = useState(25);

  // Fetch vehicle policy records
  const fetchVehiclePolicies = async () => {
    setLoading(true);
    try {
      const response = await getVehicleUserData();
      console.log('🔍 [VehiclePolicies] API Response:', response);
      if (response && response.data) {
        let renewalData = Array.isArray(response.data) ? response.data : [];
        console.log('🔍 [VehiclePolicies] Renewal Data:', renewalData);
        console.log('🔍 [VehiclePolicies] First record previousPolicies:', renewalData[0]?.previousPolicies);

        // Sort by PolicyIssuedDate descending
        renewalData = renewalData.sort((a, b) => {
          const parseDate = (d) => {
            if (!d) return new Date(0);
            const parts = d.split('/');
            if (parts.length === 3) {
              const day = parseInt(parts[0], 10);
              const month = parseInt(parts[1], 10) - 1;
              const year = parseInt(parts[2], 10);
              if (!isNaN(day) && !isNaN(month) && !isNaN(year) && year > 1900 && year < 2100) {
                return new Date(year, month, day);
              }
            }
            const dateObj = new Date(d);
            return isNaN(dateObj.getTime()) ? new Date(0) : dateObj;
          };

          const dateA = parseDate(a.runningPolicy?.PolicyIssuedDate);
          const dateB = parseDate(b.runningPolicy?.PolicyIssuedDate);
          return dateB - dateA;
        });

        setData(renewalData);
        setFilteredData(renewalData);
        
        // Set table headings
        setHeading([
          { key: 'expiryDate', head: 'Expiry Date' },
          { key: 'name', head: 'Name' },
          { key: 'email', head: 'Email' },
          { key: 'mobileNumber', head: 'Mobile Number' },
          { key: 'vehicleNumber', head: 'Vehicle Number' },
          { key: 'make', head: 'Make' },
          { key: 'model', head: 'Model' },
          { key: 'policyType', head: 'Policy Type' },
          { key: 'policyNumber', head: 'Policy Number' },
          { key: 'reference', head: 'Reference' },
          { key: 'contactPersonName', head: 'Contact Person Name' },
          { key: 'contactPersonNumber', head: 'Contact Person Number' },
          { key: 'vendor', head: 'Vendor' },
          { key: 'companyName', head: 'Company Name' },
          { key: 'chassisNumber', head: 'Chassis Number' },
          { key: 'policyTenure', head: 'Policy Tenure' },
          { key: 'policyFrom', head: 'Policy From' },
          { key: 'policyTo', head: 'Policy To' },
          { key: 'ncb', head: 'NCB' },
          { key: 'idv', head: 'IDV' },
          { key: 'nomineeName', head: 'Nominee Name' },
          { key: 'nomineeRelation', head: 'Nominee Relation' },
          { key: 'nomineeAge', head: 'Nominee Age' },
          { key: 'nomineeDob', head: 'Nominee DOB' },
          { key: 'premiumAmount', head: 'Premium Amount' },
          { key: 'createdDate', head: 'Created Date' },
          { key: 'issueDate', head: 'Issue Date' },
          { key: 'actions', head: 'Actions' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching vehicle policy records:', error);
      toast.error('Failed to fetch vehicle policy records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehiclePolicies();
  }, []);

  // Function to apply both search and date filtering
  const applyFilters = React.useCallback((searchQuery = '') => {
    // First apply search filter
    let searchFiltered = data;
    if (searchQuery.trim()) {
      searchFiltered = data.filter(row => {
        const user = row.user_pk_vehicle_id || {};
        const runningPolicy = row.runningPolicy || {};
        const previousPolicies = row.previousPolicies || [];
        const reference = row.reference || {};
        const hasVehicleRecord = row.vehicle_user_id && row.vehicle_number;
        
        // Check if any previous policy matches search
        const previousPolicyMatch = previousPolicies.some(prevPolicy => 
          hasVehicleRecord && prevPolicy.PolicyNumber?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        return (
          user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.mobileNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (hasVehicleRecord && row.vehicle_number?.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (hasVehicleRecord && row.make?.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (hasVehicleRecord && row.model?.toLowerCase().includes(searchQuery.toLowerCase())) ||
          reference.reference_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (hasVehicleRecord && row.contact_person_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (hasVehicleRecord && row.contact_person_no?.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (hasVehicleRecord && row.company_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (hasVehicleRecord && runningPolicy.Vendor?.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (hasVehicleRecord && runningPolicy.PolicyNumber?.toLowerCase().includes(searchQuery.toLowerCase())) ||
          previousPolicyMatch
        );
      });
    }

    // Then apply date filter by Expiry Date if dates are selected
    let finalFiltered = searchFiltered;
    if (startDate && endDate) {
      const start = new Date(new Date(startDate).setHours(0, 0, 0, 0));
      const end = new Date(new Date(endDate).setHours(23, 59, 59, 999));
      
      finalFiltered = searchFiltered.filter(item => {
        const runningPolicy = item?.runningPolicy || {};
        const previousPolicies = item?.previousPolicies || [];
        
        // Check running policy expiry date (PolicyTo or ExpiryDate)
        const runningExpiryDate = runningPolicy.PolicyTo || runningPolicy.ExpiryDate;
        
        // Check if any expiry date falls within the range
        let isInRange = false;
        
        if (runningExpiryDate) {
          const runningExpiry = new Date(runningExpiryDate);
          if (!isNaN(runningExpiry.getTime()) && runningExpiry >= start && runningExpiry <= end) {
            isInRange = true;
          }
        }
        
        // Check ALL previous policies for expiry dates
        previousPolicies.forEach(previousPolicy => {
          const previousExpiryDate = previousPolicy.PolicyTo || previousPolicy.ExpiryDate;
          if (previousExpiryDate) {
            const previousExpiry = new Date(previousExpiryDate);
            if (!isNaN(previousExpiry.getTime()) && previousExpiry >= start && previousExpiry <= end) {
              isInRange = true;
            }
          }
        });
        
        return isInRange;
      });
    }

    setFilteredData(finalFiltered);
  }, [data, startDate, endDate]);

  // Apply filters when data, searchQuery, startDate, or endDate changes
  useEffect(() => {
    applyFilters(searchQuery);
  }, [data, searchQuery, startDate, endDate]); // Removed applyFilters to prevent circular dependency

  // Transform data for table display - separate rows for running and previous policies
  const transformedData = [];
  
  filteredData.forEach((item, idx) => {
    const user = item.user_pk_vehicle_id || {};
    const runningPolicy = item.runningPolicy || {};
    const previousPolicies = item.previousPolicies || []; // Now an array
    const reference = item.reference || {};
    const hasVehicleRecord = item.vehicle_user_id;

    if (idx === 0) {
      console.log('🔍 [VehiclePolicies Transform] First item:', item);
      console.log('🔍 [VehiclePolicies Transform] previousPolicies count:', previousPolicies.length);
      console.log('🔍 [VehiclePolicies Transform] previousPolicies:', previousPolicies);
    }

    // Helper function to create a policy row
    const createPolicyRow = (policy, policyType, companyName) => {
      if (idx === 0 && policyType === 'Previous') {
        console.log('🔍 [VehiclePolicies] createPolicyRow Debug:', {
          policyType,
          companyName,
          policyCompanyType: policy.CompanyType,
          policyCompanyName: policy.CompanyName
        });
      }
      return {
      issueDate: policy.PolicyIssuedDate ? new Date(policy.PolicyIssuedDate).toLocaleDateString('en-GB') : 'N/A',
      expiryDate: policy.PolicyTo ? new Date(policy.PolicyTo).toLocaleDateString('en-GB') : (policy.ExpiryDate ? new Date(policy.ExpiryDate).toLocaleDateString('en-GB') : 'N/A'),
      name: user.username || 'N/A',
      email: user.email || 'N/A',
      mobileNumber: user.mobileNumber || 'N/A',
      vehicleNumber: hasVehicleRecord ? (item.vehicle_number || 'N/A') : 'No Vehicle Record',
      make: hasVehicleRecord ? (item.make || 'N/A') : 'N/A',
      model: hasVehicleRecord ? (item.model || 'N/A') : 'N/A',
      reference: reference.reference_name || 'N/A',
      contactPersonName: hasVehicleRecord ? (item.contact_person_name || 'N/A') : 'N/A',
      contactPersonNumber: hasVehicleRecord ? (item.contact_person_no || 'N/A') : 'N/A',
      vendor: hasVehicleRecord ? (policy.Vendor || 'N/A') : 'N/A',
      companyName: hasVehicleRecord ? (companyName || 'N/A') : 'N/A',
      chassisNumber: hasVehicleRecord ? (item.chassis_number ?? 'N/A') : 'N/A',
      policyTypeText: policyType, // Store text for Excel export
      policyType: (
        <span style={{
          padding: '4px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '600',
          backgroundColor: policyType === 'Running' ? '#e8f5e9' : '#fff3e0',
          color: policyType === 'Running' ? '#2e7d32' : '#e65100',
          border: `1px solid ${policyType === 'Running' ? '#4caf50' : '#ff9800'}`,
          display: 'inline-block',
          whiteSpace: 'nowrap'
        }}>
          {policyType}
        </span>
      ), // 'Running' or 'Previous'
      policyNumber: policy.PolicyNumber || 'N/A',
      policyTenure: hasVehicleRecord ? (policy.PolicyTenure !== undefined && policy.PolicyTenure !== null && policy.PolicyTenure !== '' ? policy.PolicyTenure : 'N/A') : 'N/A',
      policyFrom: hasVehicleRecord ? (policy.PolicyFrom ? new Date(policy.PolicyFrom).toLocaleDateString('en-GB') : 'N/A') : 'N/A',
      policyTo: hasVehicleRecord ? (policy.PolicyTo ? new Date(policy.PolicyTo).toLocaleDateString('en-GB') : 'N/A') : 'N/A',
      nomineeName: hasVehicleRecord ? (policy.NomineeName ?? 'N/A') : 'N/A',
      nomineeRelation: hasVehicleRecord ? (policy.NomineeRelation ?? item.nominee_type ?? 'N/A') : 'N/A',
      nomineeAge: hasVehicleRecord ? (policy.NomineeAge !== undefined && policy.NomineeAge !== null && policy.NomineeAge !== '' ? policy.NomineeAge : 'N/A') : 'N/A',
      nomineeDob: hasVehicleRecord ? (policy.NomineeDob ? new Date(policy.NomineeDob).toLocaleDateString('en-GB') : 'N/A') : 'N/A',
      premiumAmount: hasVehicleRecord ? (policy.PremiumAmount ? `₹${policy.PremiumAmount.toLocaleString()}` : 'N/A') : 'N/A',
      ncb: hasVehicleRecord ? (policy.NCB || 'N/A') : 'N/A',
      idv: hasVehicleRecord ? (policy.IDV || 'N/A') : 'N/A',
      createdDate: item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB') : 'N/A',
      actions: hasVehicleRecord ? (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button
            className="action-btn view-btn"
            onClick={() => handleViewDetails(item)}
            title="View Details"
            style={{
              cursor: 'pointer',
              width: '40px',
              height: '40px',
              border: '2px solid #3b82f6',
              borderRadius: '8px',
              background: '#3b82f6',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(59,130,246,0.2)'
            }}
          >
            <FiEye size={20} strokeWidth={2.5} />
          </button>
        </div>
      ) : (
        <span style={{ color: '#999', fontSize: '12px' }}>No Record</span>
      ),
      originalData: item, // Keep original data for view operations
      // Add raw expiry date for filtering and sorting
      rawExpiryDate: policy.PolicyTo || policy.ExpiryDate,
      // Add user ID for grouping
      userId: item.user_id || item.vehicle_user_id
      };
    };

    // Collect all policies for this user
    const userPolicies = [];

    // Add running policy
    if (runningPolicy && Object.keys(runningPolicy).length > 0) {
      const runningCompanyName = runningPolicy.CompanyType?.company_name || runningPolicy.CompanyName || item.company_name;
      if (idx === 0) {
        console.log('🔍 [VehiclePolicies] Running Policy Company Debug:', {
          runningPolicyCompanyType: runningPolicy.CompanyType,
          runningPolicyCompanyName: runningPolicy.CompanyName,
          itemCompanyName: item.company_name,
          finalRunningCompanyName: runningCompanyName
        });
      }
      userPolicies.push({
        policy: runningPolicy,
        type: 'Running',
        companyName: runningCompanyName
      });
    }

    // Add ALL previous policies
    if (previousPolicies && Array.isArray(previousPolicies) && previousPolicies.length > 0) {
      previousPolicies.forEach(prevPolicy => {
        const prevCompanyName = prevPolicy.CompanyType?.company_name || prevPolicy.CompanyName || 'N/A';
        if (idx === 0) {
          console.log('🔍 [VehiclePolicies] Previous Policy Company Debug:', {
            prevPolicyCompanyType: prevPolicy.CompanyType,
            prevPolicyCompanyName: prevPolicy.CompanyName,
            finalPrevCompanyName: prevCompanyName
          });
        }
        userPolicies.push({
          policy: prevPolicy,
          type: 'Previous',
          companyName: prevCompanyName
        });
      });
    }

    // Sort policies by expiry date (newest first) for this user
    userPolicies.sort((a, b) => {
      const parseDate = (policy) => {
        const dateStr = policy.policy.PolicyTo || policy.policy.ExpiryDate;
        if (!dateStr) return new Date(0);
        const dateObj = new Date(dateStr);
        return isNaN(dateObj.getTime()) ? new Date(0) : dateObj;
      };

      const dateA = parseDate(a);
      const dateB = parseDate(b);
      return dateB - dateA; // Sort newest first (descending)
    });

    // Add sorted policies to transformed data
    userPolicies.forEach(({ policy, type, companyName }) => {
      transformedData.push(createPolicyRow(policy, type, companyName));
    });
  });

  // Apply date filter to transformed data if dates are selected
  let finalTransformedData = transformedData;
  if (startDate && endDate) {
    const start = new Date(new Date(startDate).setHours(0, 0, 0, 0));
    const end = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    
    finalTransformedData = transformedData.filter(row => {
      if (!row.rawExpiryDate) return false;
      const expiryDate = new Date(row.rawExpiryDate);
      if (isNaN(expiryDate.getTime())) return false;
      return expiryDate >= start && expiryDate <= end;
    });
  }

  // No global sorting needed - each user's policies are already sorted by expiry date

  // Handle view details
  const handleViewDetails = (record) => {
    setViewData(record);
    setIsViewModalOpen(true);
  };

  // Export to Excel
  const exportToExcel = () => {
    const exportData = finalTransformedData.map(row => ({
      'Expiry Date': row.expiryDate,
      'Name': row.name,
      'Email': row.email,
      'Mobile Number': row.mobileNumber,
      'Vehicle Number': row.vehicleNumber,
      'Make': row.make,
      'Model': row.model,
      'Policy Type': row.policyTypeText, // Use text version for Excel
      'Policy Number': row.policyNumber,
      'Reference': row.reference,
      'Contact Person Name': row.contactPersonName,
      'Contact Person Number': row.contactPersonNumber,
      'Vendor': row.vendor,
      'Company Name': row.companyName,
      'Chassis Number': row.chassisNumber,
      'Policy Tenure': row.policyTenure,
      'Policy From': row.policyFrom,
      'Policy To': row.policyTo,
      'NCB': row.ncb,
      'IDV': row.idv,
      'Nominee Name': row.nomineeName,
      'Nominee Relation': row.nomineeRelation,
      'Nominee Age': row.nomineeAge,
      'Nominee DOB': row.nomineeDob,
      'Premium Amount': row.premiumAmount,
      'Created Date': row.createdDate,
      'Issue Date': row.issueDate,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "VehiclePolicies");
    XLSX.writeFile(wb, "VehiclePolicies.xlsx");
    toast.success('Excel file exported successfully!');
  };

  return (
    <DashboardLayout onSearch={(searchQuery) => {
      applyFilters(searchQuery);
    }}>
      <div className="consumer-container">
        <div className="consumer-header">
          <h1>Vehicle Policy Records</h1>
        </div>

        <div className="filter-section">
          <div className="filter-inputs">
            <div>
              <label>Expiry Start Date:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="form-control"
              />
            </div>
            <div>
              <label>Expiry End Date:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="form-control"
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
              <Button 
                className="add-consumer-btn" 
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
              >
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
            columns={heading.map(h => ({ key: h.key, title: h.head }))}
            data={finalTransformedData}
            pagination={true}
            itemsPerPage={itemsPerPage}
            loading={loading}
          />
        </div>

        {/* View Modal */}
        <Modal
          open={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title="Vehicle Policy Details"
        >
          {viewData && (
            <div className="consumer-form">
                {/* Consumer Information */}
                <div className="form-section">
                  <h5>Consumer Information</h5>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Name:</label>
                      <span className="detail-value">{viewData.user_pk_vehicle_id?.username || 'N/A'}</span>
                    </div>
                    <div className="form-group">
                      <label>Email:</label>
                      <span className="detail-value">{viewData.user_pk_vehicle_id?.email || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Mobile Number:</label>
                      <span className="detail-value">{viewData.user_pk_vehicle_id?.mobileNumber || 'N/A'}</span>
                    </div>
                    <div className="form-group">
                      <label>Reference:</label>
                      <span className="detail-value">{viewData.reference?.reference_name || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Contact Person Name:</label>
                      <span className="detail-value">{viewData.contact_person_name || 'N/A'}</span>
                    </div>
                    <div className="form-group">
                      <label>Contact Person Number:</label>
                      <span className="detail-value">{viewData.contact_person_no || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div className="form-section">
                  <h5>Vehicle Information</h5>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Vehicle Number:</label>
                      <span className="detail-value">{viewData.vehicle_number || 'N/A'}</span>
                    </div>
                    <div className="form-group">
                      <label>Make:</label>
                      <span className="detail-value">{viewData.make || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Model:</label>
                      <span className="detail-value">{viewData.model || 'N/A'}</span>
                    </div>
                    <div className="form-group">
                      <label>Manufacturing Year:</label>
                      <span className="detail-value">{viewData.manufacturing_year || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Chassis Number:</label>
                      <span className="detail-value">{viewData.chassis_number || 'N/A'}</span>
                    </div>
                    <div className="form-group">
                      <label>Company Name:</label>
                      <span className="detail-value">{viewData.company_name || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Running Policy Details */}
                {viewData.runningPolicy && (
                  <div className="form-section">
                    <h5>Running Policy Details</h5>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Policy Number:</label>
                        <span className="detail-value">{viewData.runningPolicy.PolicyNumber || 'N/A'}</span>
                      </div>
                      <div className="form-group">
                        <label>Policy Type:</label>
                        <span className="detail-value">{viewData.runningPolicy.policyType?.PolicyTypeName || viewData.runningPolicy.policy_type_name || viewData.runningPolicy.policy_type || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Company Name:</label>
                        <span className="detail-value">{viewData.runningPolicy.CompanyType?.company_name || viewData.runningPolicy.CompanyName || viewData.company_name || 'N/A'}</span>
                      </div>
                      <div className="form-group">
                        <label>Policy Plan:</label>
                        <span className="detail-value">{viewData.runningPolicy.policyPlan?.PolicyPlanType || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Policy Tenure:</label>
                        <span className="detail-value">{viewData.runningPolicy.PolicyTenure || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Premium Amount:</label>
                        <span className="detail-value">{viewData.runningPolicy.PremiumAmount ? `₹${viewData.runningPolicy.PremiumAmount.toLocaleString()}` : 'N/A'}</span>
                      </div>
                      <div className="form-group">
                        <label>Policy From:</label>
                        <span className="detail-value">{viewData.runningPolicy.PolicyFrom ? new Date(viewData.runningPolicy.PolicyFrom).toLocaleDateString('en-GB') : 'N/A'}</span>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Policy To:</label>
                        <span className="detail-value">{viewData.runningPolicy.PolicyTo ? new Date(viewData.runningPolicy.PolicyTo).toLocaleDateString('en-GB') : 'N/A'}</span>
                      </div>
                      <div className="form-group">
                        <label>Policy Issued Date:</label>
                        <span className="detail-value">{viewData.runningPolicy.PolicyIssuedDate ? new Date(viewData.runningPolicy.PolicyIssuedDate).toLocaleDateString('en-GB') : 'N/A'}</span>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>NCB:</label>
                        <span className="detail-value">{viewData.runningPolicy.NCB || 'N/A'}</span>
                      </div>
                      <div className="form-group">
                        <label>IDV:</label>
                        <span className="detail-value">{viewData.runningPolicy.IDV || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Vendor:</label>
                        <span className="detail-value">{viewData.runningPolicy.Vendor || 'N/A'}</span>
                      </div>
                      <div className="form-group">
                        <label>Nominee Name:</label>
                        <span className="detail-value">{viewData.runningPolicy.NomineeName || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Nominee Relation:</label>
                        <span className="detail-value">{viewData.runningPolicy.NomineeRelation || 'N/A'}</span>
                      </div>
                      <div className="form-group">
                        <label>Nominee DOB:</label>
                        <span className="detail-value">{viewData.runningPolicy.NomineeDob ? new Date(viewData.runningPolicy.NomineeDob).toLocaleDateString('en-GB') : 'N/A'}</span>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Nominee Age:</label>
                        <span className="detail-value">{viewData.runningPolicy.NomineeAge || 'N/A'}</span>
                      </div>
                    </div>
                    
                    {/* Current Agent Details */}
                    {(viewData.agentName || viewData.agentCode || viewData.agentContactNumber) && (
                      <>
                        <h6 style={{ marginTop: '15px', marginBottom: '10px' }}>Current Agent Details (Your Company)</h6>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Agent Name:</label>
                            <span className="detail-value">{viewData.agentName || 'N/A'}</span>
                          </div>
                          <div className="form-group">
                            <label>Agent Code:</label>
                            <span className="detail-value">{viewData.agentCode || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Agent Contact Number:</label>
                            <span className="detail-value">{viewData.agentContactNumber || 'N/A'}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Previous Policies Details - Now handles multiple previous policies */}
                {viewData.previousPolicies && Array.isArray(viewData.previousPolicies) && viewData.previousPolicies.length > 0 && 
                  viewData.previousPolicies.map((previousPolicy, index) => (
                    <div className="form-section" key={index}>
                      <h5>Previous Policy Details {viewData.previousPolicies.length > 1 ? `#${index + 1}` : ''}</h5>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Previous Policy Number:</label>
                          <span className="detail-value">{previousPolicy.PolicyNumber || 'N/A'}</span>
                        </div>
                        <div className="form-group">
                          <label>Previous Policy Type:</label>
                          <span className="detail-value">{previousPolicy.policyType?.PolicyTypeName || previousPolicy.policy_type_name || previousPolicy.policy_type || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Previous Company Name:</label>
                          <span className="detail-value">{previousPolicy.CompanyType?.company_name || previousPolicy.CompanyName || 'N/A'}</span>
                        </div>
                        <div className="form-group">
                          <label>Previous Policy Plan:</label>
                          <span className="detail-value">{previousPolicy.policyPlan?.PolicyPlanType || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Previous Policy Tenure:</label>
                          <span className="detail-value">{previousPolicy.PolicyTenure || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Previous Premium Amount:</label>
                          <span className="detail-value">{previousPolicy.PremiumAmount ? `₹${previousPolicy.PremiumAmount.toLocaleString()}` : 'N/A'}</span>
                        </div>
                        <div className="form-group">
                          <label>Previous Policy From:</label>
                          <span className="detail-value">{previousPolicy.PolicyFrom ? new Date(previousPolicy.PolicyFrom).toLocaleDateString('en-GB') : 'N/A'}</span>
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Previous Policy To:</label>
                          <span className="detail-value">{previousPolicy.PolicyTo ? new Date(previousPolicy.PolicyTo).toLocaleDateString('en-GB') : 'N/A'}</span>
                        </div>
                        <div className="form-group">
                          <label>Previous Policy Issued Date:</label>
                          <span className="detail-value">{previousPolicy.PolicyIssuedDate ? new Date(previousPolicy.PolicyIssuedDate).toLocaleDateString('en-GB') : 'N/A'}</span>
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Previous NCB:</label>
                          <span className="detail-value">{previousPolicy.NCB || 'N/A'}</span>
                        </div>
                        <div className="form-group">
                          <label>Previous IDV:</label>
                          <span className="detail-value">{previousPolicy.IDV || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Previous Nominee Name:</label>
                          <span className="detail-value">{previousPolicy.NomineeName || 'N/A'}</span>
                        </div>
                        <div className="form-group">
                          <label>Previous Nominee Relation:</label>
                          <span className="detail-value">{previousPolicy.NomineeRelation || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Previous Nominee DOB:</label>
                          <span className="detail-value">{previousPolicy.NomineeDob ? new Date(previousPolicy.NomineeDob).toLocaleDateString('en-GB') : 'N/A'}</span>
                        </div>
                        <div className="form-group">
                          <label>Previous Nominee Age:</label>
                          <span className="detail-value">{previousPolicy.NomineeAge || 'N/A'}</span>
                        </div>
                      </div>
                      
                      {/* Previous Agent Details - Only for Portability */}
                      {(previousPolicy.agentName || previousPolicy.agentCode || previousPolicy.agentContactNumber) && (
                        <>
                          <h6 style={{ marginTop: '15px', marginBottom: '10px' }}>Previous Agent Details (From Old Company)</h6>
                          <div className="form-row">
                            <div className="form-group">
                              <label>Previous Agent Name:</label>
                              <span className="detail-value">{previousPolicy.agentName || 'N/A'}</span>
                            </div>
                            <div className="form-group">
                              <label>Previous Agent Code:</label>
                              <span className="detail-value">{previousPolicy.agentCode || 'N/A'}</span>
                            </div>
                          </div>
                          <div className="form-row">
                            <div className="form-group">
                              <label>Previous Agent Contact Number:</label>
                              <span className="detail-value">{previousPolicy.agentContactNumber || 'N/A'}</span>
                            </div>
                          </div>
                        </>
                      )}
                      
                      {index < viewData.previousPolicies.length - 1 && (
                        <hr style={{ margin: '20px 0', border: 'none', borderTop: '2px dashed #ddd' }} />
                      )}
                    </div>
                  ))
                }

              <div className="form-actions">
                <Button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setIsViewModalOpen(false)}
                >
                  Close
                </Button>
            </div>
          </div>
        )}
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default VehiclePolicies;
