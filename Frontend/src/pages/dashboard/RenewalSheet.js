import React, { useEffect, useState, useCallback } from 'react';
import '../../styles/pages/dashboard/Consumer.css';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import StatCard from '../../components/common/StatCard';
import DashboardLayout from '../../components/DashboardLayout';
import { getAllMedicalimConsumerRenewalData } from '../../serviceAPI/userAPI';
import Cookies from 'js-cookie';
import Modal from '../../components/common/Modal';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import config from '../../config/apiConfig';

const RenewalSheet = () => {
    const navigate = useNavigate();
    
    const getStartOfMonth = () => {
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), 2).toISOString().split('T')[0];
    };

    const getEndOfMonth = () => {
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString().split('T')[0];
    };

    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [detail, setDetail] = useState(null);
    const [viewIndex, setViewIndex] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [heading, setHeading] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(100);
    const [sortColumn, setSortColumn] = useState(null);
    const [sortDirection, setSortDirection] = useState('asc');
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState(null); // 'expired', 'week', 'month', 'year', null

    const categoryId = Cookies.get('category');
    const user = (Cookies.get('user') && JSON.parse(Cookies.get('user'))) || '';

    const toggleViewModal = () => {
        setIsViewModalOpen(!isViewModalOpen);
        setViewIndex(null);
        setDetail(null);
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

    // Wrap fetchRenewalData in useCallback
    const fetchRenewalData = useCallback(async () => {
        setLoading(true);
        console.log('🔄 [REFRESH] Fetching mediclaim renewal data...');
        console.log('🔄 [REFRESH] Date range:', { startDate, endDate });
        
        try {
            const consumerData = await getAllMedicalimConsumerRenewalData({ startDate, endDate });
            console.log('🔄 [REFRESH] Raw API response:', consumerData);
            
            if (consumerData?.data && consumerData?.data?.length) {
                // Robust sort by ExpiryDate (newest first)
                let renewalData = Array.isArray(consumerData?.data) ? consumerData.data : [];
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
                    const dateA = parseDate(a.runningPolicy?.ExpiryDate);
                    const dateB = parseDate(b.runningPolicy?.ExpiryDate);
                    return dateB - dateA;
                });
                
                const processedData = renewalData.map((item, index) => ({
                    ...item,
                    'runningPolicy.IssueDate': item.runningPolicy?.IssueDate ? new Date(item.runningPolicy.IssueDate).toLocaleDateString('en-GB') : 
                                             item.runningPolicy?.PolicyIssuedDate ? new Date(item.runningPolicy.PolicyIssuedDate).toLocaleDateString('en-GB') : 
                                             item.issueDate ? new Date(item.issueDate).toLocaleDateString('en-GB') : '',
                    'runningPolicy.ExpiryDate': item.runningPolicy?.ExpiryDate ? new Date(item.runningPolicy.ExpiryDate).toLocaleDateString('en-GB') : 
                                              item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('en-GB') : '',
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
                }));
                
                console.log('🔄 [REFRESH] Processed data:', processedData);
                console.log('🔄 [REFRESH] Data length:', processedData.length);
                
                setData(processedData);
                
                const byDate = processedData.filter(item => {
                    const date = item?.runningPolicy?.ExpiryDate || item?.runningPolicy?.PolicyIssuedDate || item?.createdAt || '';
                    return isWithinDateRange(date, startDate, endDate);
                });
                setFilteredData(byDate);
            } else {
                console.log('🔄 [REFRESH] No data received or empty array');
                setData([]);
                setFilteredData([]);
            }
            
            setHeading([
                { key: 'runningPolicy.ExpiryDate', head: 'Expiry Date' },
                { key: 'displayName', head: 'Name' }, 
                { key: 'displayEmail', head: 'Email' }, 
                { key: 'displayMobile', head: 'Mobile Number' },
                { key: 'displayReference', head: 'Reference Name' },
                { key: 'displayPolicyNumber', head: 'Policy Number' },
                { key: 'runningPolicy.IssueDate', head: 'Issue Date' },
                { key: 'displayCompany', head: 'Company Name' },
                { key: 'displaySumInsured', head: 'Sum Insured' },
                { key: 'displayNoClaimBonus', head: 'No Claim Bonus' },
                { key: 'displayPremiumAmount', head: 'Premium' },
                { key: 'displayPolicyTenure', head: 'Policy Tenure' },
                { key: 'displayPolicyPlanType', head: 'Policy Plan Type' }
            ]);
        } catch (error) {
            console.error('💥 [FRONTEND] Error in fetchRenewalData:', error);
            toast.error('An error occurred while fetching mediclaim renewal data');
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]);

    // Only run on mount or when startDate/endDate changes
    useEffect(() => {
        fetchRenewalData();
    }, [fetchRenewalData]);

    useEffect(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        let filtered = data.filter(item => {
            const user = item.user || {};
            const runningPolicy = item.runningPolicy || {};
            return Object.values(user).some(val => String(val).toLowerCase().includes(lowercasedFilter)) ||
                Object.values(runningPolicy).some(val => String(val).toLowerCase().includes(lowercasedFilter)) ||
                String(item.displayName || '').toLowerCase().includes(lowercasedFilter) ||
                String(item.displayEmail || '').toLowerCase().includes(lowercasedFilter) ||
                String(item.displayMobile || '').toLowerCase().includes(lowercasedFilter) ||
                String(item.displayReference || '').toLowerCase().includes(lowercasedFilter) ||
                String(item.displayPolicyNumber || '').toLowerCase().includes(lowercasedFilter) ||
                String(item.displayCompany || '').toLowerCase().includes(lowercasedFilter)
        });

        // Apply active filter from card clicks
        if (activeFilter) {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            const oneMonthFromNow = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
            const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

            filtered = filtered.filter(item => {
                const runningPolicy = item.runningPolicy || {};
                const expiryDateStr = runningPolicy.ExpiryDate;

                if (!expiryDateStr) return false;

                // Parse expiry date
                const parseDate = (d) => {
                    if (!d) return null;
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
                    return isNaN(dateObj.getTime()) ? null : dateObj;
                };

                const expiryDate = parseDate(expiryDateStr);
                if (!expiryDate) return false;

                switch (activeFilter) {
                    case 'expired':
                        return expiryDate < now;
                    case 'week':
                        return expiryDate >= now && expiryDate <= oneWeekFromNow;
                    case 'month':
                        return expiryDate >= now && expiryDate <= oneMonthFromNow;
                    case 'year':
                        return expiryDate >= now && expiryDate <= oneYearFromNow;
                    default:
                        return true;
                }
            });
        }

        setFilteredData(filtered);
    }, [searchTerm, data, activeFilter]);

    const handleDateSearch = async () => {
        if (!startDate || !endDate) {
            toast.error("Please select both start and end dates.");
            return;
        }
        localStorage.setItem('mediclaimRenewalStartDate', startDate);
        localStorage.setItem('mediclaimRenewalEndDate', endDate);
        fetchRenewalData();
    };

    const handleClearDateFilter = () => {
        setStartDate('');
        setEndDate('');
        localStorage.removeItem('mediclaimRenewalStartDate');
        localStorage.removeItem('mediclaimRenewalEndDate');
        fetchRenewalData();
    };

    const handleCardClick = (filterType) => {
        // Toggle filter: if same card clicked, clear filter; otherwise set new filter
        setActiveFilter(activeFilter === filterType ? null : filterType);
    };

    const handleRenewClick = (item) => {
        // Handle renew button click - redirect to mediclaim page with this item data
        console.log('Renew clicked for item:', item);
        
        // Store the item data in localStorage for the mediclaim page to pick up
        localStorage.setItem('isRenew', 'true');
        localStorage.setItem('MediclaimID', item.id);
        localStorage.setItem('renewalData', JSON.stringify(item));
        
        // Navigate to mediclaim page - use the correct path
        navigate('/mediclaim');
    };

    const handleView = async (userData) => {
        const globalIndex = data.findIndex((item) => item.id === userData.id);
        if (globalIndex !== -1) {
            setViewIndex(globalIndex);
            setDetail(data[globalIndex]);
            setIsViewModalOpen(true);
        }
    };

    const handleSort = (column) => {
        const direction = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortColumn(column);
        setSortDirection(direction);
    };

    // Calculate statistics for renewal counts
    const calculateRenewalStats = () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Set to start of today
        const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const oneMonthFromNow = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
        const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

        let expiredCount = 0;
        let totalPolicies = data.length; // Count all policies
        let weekCount = 0;
        let monthCount = 0;
        let yearCount = 0;

        data.forEach(item => {
            const runningPolicy = item.runningPolicy || {};
            const expiryDateStr = runningPolicy.ExpiryDate;
            
            // Only process policies with expiry dates for other counts
            if (expiryDateStr) {
                
                // Parse expiry date
                const parseDate = (d) => {
                    if (!d) return null;
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
                    return isNaN(dateObj.getTime()) ? null : dateObj;
                };

                const expiryDate = parseDate(expiryDateStr);
                
                if (expiryDate) {
                    // Check if expired (before today)
                    if (expiryDate < now) {
                        expiredCount++;
                    }
                    // Count renewals by time period (only future expirations)
                    else if (expiryDate >= now && expiryDate <= oneWeekFromNow) {
                        weekCount++;
                    }
                    if (expiryDate >= now && expiryDate <= oneMonthFromNow) {
                        monthCount++;
                    }
                    if (expiryDate >= now && expiryDate <= oneYearFromNow) {
                        yearCount++;
                    }
                }
            }
        });

        return {
            expiredCount,
            totalPolicies,
            weekCount,
            monthCount,
            yearCount
        };
    };

    const stats = calculateRenewalStats();

    const exportToExcel = async () => {
        try {
            console.log("Starting export process for Renewal Sheet...");
            console.log("Using date range:", { startDate, endDate });
            
            // Fetch data with current date range
            const consumerData = await getAllMedicalimConsumerRenewalData({ startDate, endDate });
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
                toast.error("No data available to export for the selected date range");
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
                    'Issue Date': runningPolicy.IssueDate || runningPolicy.PolicyIssuedDate || '',
                    'Name': userData.username || '',
                    'Email': userData.email || '',
                    'Mobile Number': userData.mobileNumber || '',
                    'Reference Name': item.referenceName || '',
                    'Policy Number': runningPolicy.PolicyNumber || '',
                    'Expiry Date': runningPolicy.ExpiryDate || '',
                    'Company Name': mediclaimCompany.mediclaim_company_name || '',
                    'Status': item.status || item.medicliam_status || 'Active',
                    'Created At': item.createdAt || '',
                    'Updated At': item.updatedAt || '',
                    'Gender': item.gender || '',
                    'Age': item.age || '',
                    'Relationship With Policy Holder': item.relationshipWithPolicyHolder || '',
                    'Type Member': item.medicliam_type || '',
                    'Policy Type': item.medicliam_policy_type || '',
                    'Sum Insured': item.sumInsured || '',
                    'No Claim Bonus': item.noClaimBonus || '',
                    'Policy Plan Type': item['runningPolicy.PolicyPlanType'] || runningPolicy.PolicyPlanType || '',
                    'Policy Tenure': item['runningPolicy.PolicyTenure'] || runningPolicy.PolicyTenure || '',
                    'Premium Amount': item['runningPolicy.PremiumAmount'] || runningPolicy.PremiumAmount || '',
                    'Policy From': item['runningPolicy.PolicyFrom'] || runningPolicy.PolicyFrom || '',
                    'Policy To': item['runningPolicy.PolicyTo'] || runningPolicy.PolicyTo || '',
                    'Additional Sum Insured': item['runningPolicy.AdditionalSumInsured'] || runningPolicy.AdditionalSumInsured || '',
                    'Add On Cover': item['runningPolicy.AddOnCover'] || runningPolicy.AddOnCover || '',
                    'Nominee Name': item['runningPolicy.NomineeName'] || runningPolicy.NomineeName || '',
                    'Nominee Relation': item['runningPolicy.NomineeRelation'] || runningPolicy.NomineeRelation || '',
                    'Nominee Age': item['runningPolicy.NomineeAge'] || runningPolicy.NomineeAge || '',
                    'Nominee DOB': item['runningPolicy.NomineeDob'] || runningPolicy.NomineeDob || ''
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
                {wch: 15}, // Issue Date
                {wch: 20}, // Name
                {wch: 30}, // Email
                {wch: 15}, // Mobile Number
                {wch: 20}, // Reference Name
                {wch: 20}, // Policy Number
                {wch: 15}, // Expiry Date
                {wch: 25}, // Company Name
                {wch: 15}, // Status
                {wch: 20}, // Created At
                {wch: 20}, // Updated At
                {wch: 10}, // Gender
                {wch: 10}, // Age
                {wch: 25}, // Relationship
                {wch: 15}, // Type Member
                {wch: 15}, // Policy Type
                {wch: 15}, // Sum Insured
                {wch: 15}, // No Claim Bonus
                {wch: 20}, // Policy Plan Type
                {wch: 15}, // Policy Tenure
                {wch: 15}, // Premium Amount
                {wch: 15}, // Policy From
                {wch: 15}, // Policy To
                {wch: 20}, // Additional Sum Insured
                {wch: 15}, // Add On Cover
                {wch: 20}, // Nominee Name
                {wch: 20}, // Nominee Relation
                {wch: 15}, // Nominee Age
                {wch: 15}  // Nominee DOB
            ];
            ws['!cols'] = wscols;
            
            // Create workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Renewal Sheet Data");
            
            // Generate Excel file
            XLSX.writeFile(wb, "renewal_sheet_data.xlsx");
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
        <DashboardLayout onSearch={(query) => setSearchTerm(query)}>
            <div className="consumer-container">
                <div className="consumer-header">
                <h1>Renewal Sheet</h1>
                    <Button className="add-consumer-btn me-2" onClick={exportToExcel}>Export to Excel</Button>
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
                        description="Next 7 days"
                        color="#FF9800"
                        isActive={activeFilter === 'week'}
                        onClick={() => handleCardClick('week')}
                    />
                    
                    <StatCard
                        title="This Month"
                        count={stats.monthCount}
                        description="Next 30 days"
                        color="#00BCD4"
                        isActive={activeFilter === 'month'}
                        onClick={() => handleCardClick('month')}
                    />
                    
                    <StatCard
                        title="This Year"
                        count={stats.yearCount}
                        description="Next 365 days"
                        color="#4CAF50"
                        isActive={activeFilter === 'year'}
                        onClick={() => handleCardClick('year')}
                    />
                    
                    <StatCard
                        title="Expired"
                        count={stats.expiredCount}
                        description="Already expired"
                        color="#F44336"
                        isActive={activeFilter === 'expired'}
                        onClick={() => handleCardClick('expired')}
                    />
                </div>

                <div className="consumer-table-container">
                    <Table
                        columns={heading.map(h => ({ key: h.key, title: h.head }))}
                        data={filteredData}
                        pagination={true}
                        itemsPerPage={itemsPerPage}
                        loading={loading}
                        onView={handleView}
                        onRenewal={handleRenewClick}
                    />
                </div>

                

                {isViewModalOpen && (
                    <Modal
                        open={isViewModalOpen}
                        onClose={toggleViewModal}
                        title="Renewal Sheet Details"
                    >
                        <ViewModalContent />
                    </Modal>
                )}
            </div>
        </DashboardLayout>
    );
};

export default RenewalSheet;
