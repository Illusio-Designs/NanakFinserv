import React, { useState, useEffect } from 'react';

import DashboardLayout from '../../components/DashboardLayout';

import { getAllMedicalimConsumerData } from '../../serviceAPI/userAPI';

import * as XLSX from 'xlsx';

import toast from 'react-hot-toast';

import { FiEye } from 'react-icons/fi';

import Table from '../../components/common/Table';

import Button from '../../components/common/Button';

import Modal from '../../components/common/Modal';

import config from '../../config/apiConfig';

import '../../styles/pages/dashboard/Consumer.css';



const MediclaimAllPolicies = () => {

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



  // Fetch mediclaim policy records

  const fetchMediclaimPolicies = async () => {

    setLoading(true);

    try {

      const response = await getAllMedicalimConsumerData();

      if (response && response.data) {

        let mediclaimData = Array.isArray(response.data) ? response.data : [];



        // Sort by PolicyIssuedDate descending

        mediclaimData = mediclaimData.sort((a, b) => {

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



        setData(mediclaimData);

        setFilteredData(mediclaimData);

        

        // Set table headings

        setHeading([

          { key: 'expiryDate', head: 'Expiry Date' },

          { key: 'name', head: 'Name' },

          { key: 'email', head: 'Email' },

          { key: 'mobileNumber', head: 'Mobile Number' },

          { key: 'reference', head: 'Reference' },

          { key: 'policyType', head: 'Policy Type' },

          { key: 'policyNumber', head: 'Policy Number' },

          { key: 'companyName', head: 'Company Name' },

          { key: 'sumInsured', head: 'Sum Insured' },

          { key: 'noClaimBonus', head: 'No Claim Bonus' },

          { key: 'premiumAmount', head: 'Premium Amount' },

          { key: 'policyFrom', head: 'Policy From' },

          { key: 'policyTo', head: 'Policy To' },

          { key: 'policyTenure', head: 'Policy Tenure' },

          { key: 'nomineeName', head: 'Nominee Name' },

          { key: 'nomineeRelation', head: 'Nominee Relation' },

          { key: 'nomineeAge', head: 'Nominee Age' },

          { key: 'nomineeDob', head: 'Nominee DOB' },

          { key: 'createdDate', head: 'Created Date' },

          { key: 'issueDate', head: 'Issue Date' },

          { key: 'actions', head: 'Actions' }

        ]);

      }

    } catch (error) {

      console.error('Error fetching mediclaim policy records:', error);

      toast.error('Failed to fetch mediclaim policy records');

    } finally {

      setLoading(false);

    }

  };



  useEffect(() => {

    fetchMediclaimPolicies();

  }, []);



  // Function to apply both search and date filtering

  const applyFilters = React.useCallback((searchQuery = '') => {

    // First apply search filter

    let searchFiltered = data;

    if (searchQuery.trim()) {

      searchFiltered = data.filter(row => {

        const user = row.user || {};

        const runningPolicy = row.runningPolicy || {};

        const previousPolicies = row.previousPolicies || [];

        const mediclaimCompany = row.mediclaimcompany || {};

        

        // Check if any previous policy matches search

        const previousPolicyMatch = previousPolicies.some(prevPolicy => 

          prevPolicy.PolicyNumber?.toLowerCase().includes(searchQuery.toLowerCase())

        );

        

        return (

          user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||

          user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||

          user.mobileNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||

          row.referenceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||

          runningPolicy.PolicyNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||

          mediclaimCompany.mediclaim_company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||

          row.medicliam_policy_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||

          row.medicliam_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||

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

  }, [data, searchQuery, startDate, endDate, applyFilters]);



  // Transform data for table display - separate rows for running and previous policies

  const transformedData = [];

  

  filteredData.forEach(item => {

    const user = item.user || {};

    const runningPolicy = item.runningPolicy || {};

    const previousPolicies = item.previousPolicies || []; // Now an array

    const mediclaimCompany = item.mediclaimcompany || {};



    // Helper function to create a policy row

    const createPolicyRow = (policy, policyType, companyName) => ({

      issueDate: policy.PolicyIssuedDate ? new Date(policy.PolicyIssuedDate).toLocaleDateString('en-GB') : 'N/A',

      expiryDate: policy.PolicyTo ? new Date(policy.PolicyTo).toLocaleDateString('en-GB') : (policy.ExpiryDate ? new Date(policy.ExpiryDate).toLocaleDateString('en-GB') : 'N/A'),

      name: user.username || 'N/A',

      email: user.email || 'N/A',

      mobileNumber: user.mobileNumber || 'N/A',

      reference: item.referenceName || 'N/A',

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

      companyName: companyName || 'N/A',

      sumInsured: policy.SumInsured ? `₹${policy.SumInsured.toLocaleString()}` : (item.sumInsured ? `₹${item.sumInsured.toLocaleString()}` : 'N/A'),

      noClaimBonus: policy.NoClaimBonus || item.noClaimBonus || 'N/A',

      premiumAmount: policy.PremiumAmount ? `₹${policy.PremiumAmount.toLocaleString()}` : 'N/A',

      policyFrom: policy.PolicyFrom ? new Date(policy.PolicyFrom).toLocaleDateString('en-GB') : 'N/A',

      policyTo: policy.PolicyTo ? new Date(policy.PolicyTo).toLocaleDateString('en-GB') : 'N/A',

      policyTenure: policy.PolicyTenure || 'N/A',

      nomineeName: policy.NomineeName || 'N/A',

      nomineeRelation: policy.NomineeRelation || 'N/A',

      nomineeAge: policy.NomineeAge || 'N/A',

      nomineeDob: policy.NomineeDob ? new Date(policy.NomineeDob).toLocaleDateString('en-GB') : 'N/A',

      createdDate: item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB') : 'N/A',

      actions: (

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

      ),

      originalData: item, // Keep original data for view operations

      // Add raw expiry date for filtering

      rawExpiryDate: policy.PolicyTo || policy.ExpiryDate

    });



    // Add running policy row

    if (runningPolicy && Object.keys(runningPolicy).length > 0) {

      transformedData.push(createPolicyRow(

        runningPolicy, 

        'Running',

        mediclaimCompany.mediclaim_company_name || runningPolicy.CompanyName

      ));

    }



    // Add ALL previous policy rows (now handles multiple previous policies)

    if (previousPolicies && Array.isArray(previousPolicies) && previousPolicies.length > 0) {

      previousPolicies.forEach(prevPolicy => {

        const prevCompanyName = prevPolicy.CompanyName || 'N/A';

        transformedData.push(createPolicyRow(

          prevPolicy, 

          'Previous',

          prevCompanyName

        ));

      });

    }

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

      'Reference': row.reference,

      'Policy Type': row.policyTypeText, // Use text version for Excel

      'Policy Number': row.policyNumber,

      'Company Name': row.companyName,

      'Sum Insured': row.sumInsured,

      'No Claim Bonus': row.noClaimBonus,

      'Premium Amount': row.premiumAmount,

      'Policy From': row.policyFrom,

      'Policy To': row.policyTo,

      'Policy Tenure': row.policyTenure,

      'Nominee Name': row.nomineeName,

      'Nominee Relation': row.nomineeRelation,

      'Nominee Age': row.nomineeAge,

      'Nominee DOB': row.nomineeDob,

      'Created Date': row.createdDate,

      'Issue Date': row.issueDate,

    }));



    const ws = XLSX.utils.json_to_sheet(exportData);

    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "MediclaimPolicies");

    XLSX.writeFile(wb, "MediclaimPolicies.xlsx");

    toast.success('Excel file exported successfully!');

  };



  return (

    <DashboardLayout onSearch={(searchQuery) => {

      applyFilters(searchQuery);

    }}>

      <div className="consumer-container">

        <div className="consumer-header">

          <h1>Mediclaim Policy Records</h1>

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

          title="Mediclaim Policy Details"

        >

          {viewData && (

            <div className="consumer-form">

                {/* Consumer Information */}

                <div className="form-section">

                  <h5>Consumer Information</h5>

                  <div className="form-row">

                    <div className="form-group">

                      <label>Proposer Name:</label>

                      <span className="detail-value">{viewData.user?.username || 'N/A'}</span>

                    </div>

                    <div className="form-group">

                      <label>Mail ID:</label>

                      <span className="detail-value">{viewData.user?.email || 'N/A'}</span>

                    </div>

                  </div>

                  <div className="form-row">

                    <div className="form-group">

                      <label>Mobile Number:</label>

                      <span className="detail-value">{viewData.user?.mobileNumber || 'N/A'}</span>

                    </div>

                    <div className="form-group">

                      <label>Policy Member:</label>

                      <span className="detail-value">{viewData.medicliam_type || 'N/A'}</span>

                    </div>

                  </div>

                  <div className="form-row">

                    <div className="form-group">

                      <label>Policy Type:</label>

                      <span className="detail-value">{viewData.medicliam_policy_type || 'N/A'}</span>

                    </div>

                    <div className="form-group">

                      <label>Reference Name:</label>

                      <span className="detail-value">{viewData.referenceName || 'N/A'}</span>

                    </div>

                  </div>

                </div>



                <div className="form-section">

                  <h5>Documents</h5>

                  <div className="form-row">

                    <div className="form-group" style={{ flex: '1 1 100%' }}>

                      <label>Aadhar Card:</label>

                      {viewData.AadharFileName ? (

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

                            📄 {viewData.AadharFileName}

                          </span>

                          <button

                            onClick={() => window.open(`${config.API_URL}/user/download/${viewData.AadharFileName}`, '_blank')}

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

                      {viewData.PanFileName ? (

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

                            📄 {viewData.PanFileName}

                          </span>

                          <button

                            onClick={() => window.open(`${config.API_URL}/user/download/${viewData.PanFileName}`, '_blank')}

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

                      {viewData.GstFileName ? (

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

                            📄 {viewData.GstFileName}

                          </span>

                          <button

                            onClick={() => window.open(`${config.API_URL}/user/download/${viewData.GstFileName}`, '_blank')}

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

                  

                  {viewData.customDocuments && JSON.parse(viewData.customDocuments || '[]').map((doc, idx) => (

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

                {viewData.medicliam_type === 'Individual' && (

                  <div className="form-section">

                    <h5>Policyholder Details</h5>

                    <div className="form-row">

                      <div className="form-group">

                        <label>Proposer Name:</label>

                        <span className="detail-value">{viewData.user?.username || 'N/A'}</span>

                      </div>

                      <div className="form-group">

                        <label>Date of Birth:</label>

                        <span className="detail-value">{viewData.dob ? new Date(viewData.dob).toLocaleDateString('en-GB') : 'N/A'}</span>

                      </div>

                      <div className="form-group">

                        <label>Age:</label>

                        <span className="detail-value">{viewData.age || 'N/A'}</span>

                      </div>

                    </div>

                    <div className="form-row">

                      <div className="form-group">

                        <label>Gender:</label>

                        <span className="detail-value">{viewData.gender || 'N/A'}</span>

                      </div>

                      <div className="form-group">

                        <label>Relationship with Policy Holder:</label>

                        <span className="detail-value">{viewData.relationshipWithPolicyHolder || 'N/A'}</span>

                      </div>

                    </div>

                    <div className="form-row">

                      <div className="form-group">

                        <label>Sum Insured:</label>

                        <span className="detail-value">{viewData.sumInsured || 'N/A'}</span>

                      </div>

                      <div className="form-group">

                        <label>No Claim Bonus:</label>

                        <span className="detail-value">{viewData.noClaimBonus || 'N/A'}</span>

                      </div>

                    </div>

                    

                    {viewData.insuredPersonName && (

                      <>

                        <h5 style={{marginTop: '15px', marginBottom: '10px'}}>Insured Person Details</h5>

                        <div className="form-row">

                          <div className="form-group">

                            <label>Insured Person Name:</label>

                            <span className="detail-value">{viewData.insuredPersonName || 'N/A'}</span>

                          </div>

                          <div className="form-group">

                            <label>Relationship:</label>

                            <span className="detail-value">{viewData.insuredPersonRelationship || 'N/A'}</span>

                          </div>

                        </div>

                        <div className="form-row">

                          <div className="form-group">

                            <label>Date of Birth:</label>

                            <span className="detail-value">{viewData.insuredPersonDateOfBirth ? new Date(viewData.insuredPersonDateOfBirth).toLocaleDateString('en-GB') : 'N/A'}</span>

                          </div>

                          <div className="form-group">

                            <label>Age:</label>

                            <span className="detail-value">{viewData.insuredPersonAge || 'N/A'}</span>

                          </div>

                        </div>

                        <div className="form-row">

                          <div className="form-group">

                            <label>Gender:</label>

                            <span className="detail-value">{viewData.insuredPersonGender || 'N/A'}</span>

                          </div>

                          <div className="form-group">

                            <label>Date of Joining:</label>

                            <span className="detail-value">{viewData.insuredPersonDateOfJoining ? new Date(viewData.insuredPersonDateOfJoining).toLocaleDateString('en-GB') : 'N/A'}</span>

                          </div>

                        </div>

                        <div className="form-row">

                          <div className="form-group">

                            <label>Pre-existing Illness:</label>

                            <span className="detail-value">{viewData.insuredPersonPreExistingIllness || 'N/A'}</span>

                          </div>

                        </div>

                      </>

                    )}

                  </div>

                )}



                {viewData.medicliam_type === 'Family' && (

                  <div className="form-section">

                    <h5>Policyholder Details</h5>

                    <div className="form-row">

                      <div className="form-group">

                        <label>Proposer Name:</label>

                        <span>{viewData.user?.username || 'N/A'}</span>

                      </div>

                      <div className="form-group">

                        <label>Date of Birth:</label>

                        <span>{viewData.dob ? new Date(viewData.dob).toLocaleDateString('en-GB') : 'N/A'}</span>

                      </div>

                      <div className="form-group">

                        <label>Age:</label>

                        <span>{viewData.age || 'N/A'}</span>

                      </div>

                      <div className="form-group">

                        <label>Gender:</label>

                        <span>{viewData.gender || 'N/A'}</span>

                      </div>

                      <div className="form-group">

                        <label>Relationship with Policy Holder:</label>

                        <span>{viewData.relationshipWithPolicyHolder || 'N/A'}</span>

                      </div>

                      <div className="form-group">

                        <label>Sum Insured:</label>

                        <span>{viewData.sumInsured || 'N/A'}</span>

                      </div>

                      <div className="form-group">

                        <label>No Claim Bonus:</label>

                        <span>{viewData.noClaimBonus || 'N/A'}</span>

                      </div>

                    </div>

                    

                    {viewData.familymembers && viewData.familymembers.length > 0 && (

                      <>

                        <h5 style={{marginTop: '15px', marginBottom: '10px'}}>Family Members</h5>

                        {viewData.familymembers.map((member, index) => (

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



                {viewData.medicliam_type === 'Employee' && (

                  <div className="form-section">

                    <h5>Policyholder Details</h5>

                    <div className="form-row">

                      <div className="form-group">

                        <label>Proposer Name:</label>

                        <span>{viewData.user?.username || 'N/A'}</span>

                      </div>

                      <div className="form-group">

                        <label>Date of Birth:</label>

                        <span>{viewData.dob ? new Date(viewData.dob).toLocaleDateString('en-GB') : 'N/A'}</span>

                      </div>

                      <div className="form-group">

                        <label>Age:</label>

                        <span>{viewData.age || 'N/A'}</span>

                      </div>

                      <div className="form-group">

                        <label>Gender:</label>

                        <span>{viewData.gender || 'N/A'}</span>

                      </div>

                      <div className="form-group">

                        <label>Relationship with Policy Holder:</label>

                        <span>{viewData.relationshipWithPolicyHolder || 'N/A'}</span>

                      </div>

                      <div className="form-group">

                        <label>Sum Insured:</label>

                        <span>{viewData.sumInsured || 'N/A'}</span>

                      </div>

                      <div className="form-group">

                        <label>No Claim Bonus:</label>

                        <span>{viewData.noClaimBonus || 'N/A'}</span>

                      </div>

                    </div>

                    

                    {viewData.employees && viewData.employees.length > 0 && (

                      <>

                        <h5 style={{marginTop: '15px', marginBottom: '10px'}}>Employees</h5>

                        {viewData.employees.map((employee, index) => (

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



                {viewData.runningPolicy && viewData.runningPolicy.PolicyNumber && (

                  <div className="form-section">

                    <h5>Running Policy Details</h5>

                    <div className="form-row">

                      <div className="form-group">

                        <label>Policy Number:</label>

                        <span>{viewData.runningPolicy?.PolicyNumber || 'N/A'}</span>

                      </div>

                      <div className="form-group">

                        <label>Zone:</label>

                        <span>{viewData.runningPolicy?.Zone || 'N/A'}</span>

                      </div>

                      <div className="form-group">

                        <label>Policy Plan Type:</label>

                        <span>{viewData.runningPolicy?.PolicyPlanType || 'N/A'}</span>

                      </div>

                      <div className="form-group">

                        <label>Policy Tenure:</label>

                        <span>{viewData.runningPolicy?.PolicyTenure ? `${viewData.runningPolicy.PolicyTenure} years` : 'N/A'}</span>

                      </div>

                      <div className="form-group">

                        <label>Premium Amount:</label>

                        <span>{viewData.runningPolicy?.PremiumAmount || 'N/A'}</span>

                      </div>

                      <div className="form-group">

                        <label>Policy From:</label>

                        <span>{viewData.runningPolicy?.PolicyFrom ? new Date(viewData.runningPolicy.PolicyFrom).toLocaleDateString('en-GB') : 'N/A'}</span>

                      </div>

                      <div className="form-group">

                        <label>Policy To:</label>

                        <span>{viewData.runningPolicy?.PolicyTo ? new Date(viewData.runningPolicy.PolicyTo).toLocaleDateString('en-GB') : 'N/A'}</span>

                      </div>

                      <div className="form-group">

                        <label>Policy Issued Date:</label>

                        <span>{viewData.runningPolicy?.PolicyIssuedDate ? new Date(viewData.runningPolicy.PolicyIssuedDate).toLocaleDateString('en-GB') : 'N/A'}</span>

                      </div>

                      <div className="form-group">

                        <label>Expiry Date:</label>

                        <span>{viewData.runningPolicy?.ExpiryDate ? new Date(viewData.runningPolicy.ExpiryDate).toLocaleDateString('en-GB') : 'N/A'}</span>

                      </div>

                      <div className="form-group">

                        <label>Add On Cover:</label>

                        <span>{viewData.runningPolicy?.AddOnCover || 'N/A'}</span>

                      </div>

                      <div className="info-item" style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>

                        <label style={{ fontWeight: '600', color: '#333' }}>Current Policy File:</label>

                        {viewData.runningPolicy?.CurrentPolicyFile ? (

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

                              📄 {viewData.runningPolicy.CurrentPolicyFile}

                            </span>

                            <button

                              onClick={() => window.open(`${config.API_URL}/user/download/${viewData.runningPolicy.CurrentPolicyFile}`, '_blank')}

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

                {viewData.previousPolicy && viewData.previousPolicy.PolicyNumber && (

                  <div className="form-section">

                    <h5>Previous Policy Details</h5>

                    <div className="form-row">

                      <div className="form-group">

                        <label>Policy Number:</label>

                        <span>{viewData.previousPolicy.PolicyNumber || 'N/A'}</span>

                      </div>

                      <div className="form-group">

                        <label>Zone:</label>

                        <span>{viewData.previousPolicy.Zone || 'N/A'}</span>

                      </div>

                      <div className="form-group">

                        <label>Policy From:</label>

                        <span>{viewData.previousPolicy.PolicyFrom ? new Date(viewData.previousPolicy.PolicyFrom).toLocaleDateString('en-GB') : 'N/A'}</span>

                      </div>

                      <div className="form-group">

                        <label>Policy To:</label>

                        <span>{viewData.previousPolicy.PolicyTo ? new Date(viewData.previousPolicy.PolicyTo).toLocaleDateString('en-GB') : 'N/A'}</span>

                      </div>

                      <div className="form-group">

                        <label>Policy Tenure:</label>

                        <span>{viewData.previousPolicy.PolicyTenure ? `${viewData.previousPolicy.PolicyTenure} years` : 'N/A'}</span>

                      </div>

                      <div className="form-group">

                        <label>Premium Amount:</label>

                        <span>{viewData.previousPolicy.PremiumAmount || 'N/A'}</span>

                      </div>

                      <div className="form-group">

                        <label>Sum Insured:</label>

                        <span>{viewData.previousPolicy.SumInsured || 'N/A'}</span>

                      </div>

                      <div className="form-group">

                        <label>No Claim Bonus:</label>

                        <span>{viewData.previousPolicy.NoClaimBonus || 'N/A'}</span>

                      </div>

                      <div className="form-group">

                        <label>Renew Date:</label>

                        <span>{viewData.previousPolicy.RenewDate ? new Date(viewData.previousPolicy.RenewDate).toLocaleDateString('en-GB') : 'N/A'}</span>

                      </div>

                      <div className="form-group">

                        <label>Claim Expire In Policy:</label>

                        <span>{viewData.previousPolicy.ClaimExpireInPolicy || 'N/A'}</span>

                      </div>

                      <div className="form-group">

                        <label>Previous Policy Number:</label>

                        <span>{viewData.previousPolicy.PreviousPolicyNumber || 'N/A'}</span>

                      </div>

                      <div className="form-group">

                        <label>Company Name:</label>

                        <span>{viewData.previousPolicy.CompanyName || 'N/A'}</span>

                      </div>

                      <div className="info-item" style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>

                        <label style={{ fontWeight: '600', color: '#333' }}>PDF File:</label>

                        {viewData.previousPolicy.PdfFile ? (

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

                              📄 {viewData.previousPolicy.PdfFile}

                            </span>

                            <button

                              onClick={() => window.open(`${config.API_URL}/user/download/${viewData.previousPolicy.PdfFile}`, '_blank')}

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

                      {viewData.previousPolicy.ClaimExpireInPolicy === 'Yes' && (

                        <div className="info-item" style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>

                          <label style={{ fontWeight: '600', color: '#333' }}>Claim Statement PDF:</label>

                          {viewData.previousPolicy.ClaimStatementPDFfile ? (

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

                                📄 {viewData.previousPolicy.ClaimStatementPDFfile}

                              </span>

                              <button

                                onClick={() => window.open(`${config.API_URL}/user/download/${viewData.previousPolicy.ClaimStatementPDFfile}`, '_blank')}

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

                    {viewData.medicliam_policy_type === 'Portability' && (viewData.previousPolicy.PreviousAgentName || viewData.previousPolicy.PreviousAgentCode || viewData.previousPolicy.PreviousAgentContactNumber) && (

                      <>

                        <h5 style={{marginTop: '15px', marginBottom: '10px'}}>Previous Agent Details</h5>

                        <div className="form-row">

                          <div className="form-group">

                            <label>Previous Agent Name:</label>

                            <span>{viewData.previousPolicy.PreviousAgentName || 'N/A'}</span>

                          </div>

                          <div className="form-group">

                            <label>Previous Agent Code:</label>

                            <span>{viewData.previousPolicy.PreviousAgentCode || 'N/A'}</span>

                          </div>

                          <div className="form-group">

                            <label>Previous Agent Contact Number:</label>

                            <span>{viewData.previousPolicy.PreviousAgentContactNumber || 'N/A'}</span>

                          </div>

                        </div>

                      </>

                    )}

                  </div>

                )}



                {/* Phase 6: Nominee Details */}

                {viewData.runningPolicy && viewData.runningPolicy.NomineeName && (

                  <div className="form-section">

                    <h5>Nominee Details</h5>

                    <div className="form-row">

                      <div className="form-group">

                        <label>Nominee Name:</label>

                        <span>{viewData.runningPolicy.NomineeName || 'N/A'}</span>

                      </div>

                      <div className="form-group">

                        <label>Nominee Relation:</label>

                        <span>{viewData.runningPolicy.NomineeRelation || 'N/A'}</span>

                      </div>

                      <div className="form-group">

                        <label>Nominee DOB:</label>

                        <span>{viewData.runningPolicy.NomineeDob ? new Date(viewData.runningPolicy.NomineeDob).toLocaleDateString('en-GB') : 'N/A'}</span>

                      </div>

                      <div className="form-group">

                        <label>Nominee Age:</label>

                        <span>{viewData.runningPolicy.NomineeAge || 'N/A'}</span>

                      </div>

                    </div>

                  </div>

                )}



                {/* Phase 7: Agent Details */}

                {viewData.agentName && (

                  <div className="form-section">

                    <h5>Agent Details</h5>

                    <div className="form-row">

                      <div className="form-group">

                        <label>Agent Name:</label>

                        <span>{viewData.agentName || 'N/A'}</span>

                      </div>

                      <div className="form-group">

                        <label>Agent Code:</label>

                        <span>{viewData.agentCode || 'N/A'}</span>

                      </div>

                      <div className="form-group">

                        <label>Agent Contact Number:</label>

                        <span>{viewData.agentContactNumber || 'N/A'}</span>

                      </div>

                    </div>

                  </div>

                )}



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



export default MediclaimAllPolicies;

