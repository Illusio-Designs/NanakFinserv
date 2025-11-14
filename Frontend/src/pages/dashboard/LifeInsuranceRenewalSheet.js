import React, { useEffect, useState, useRef } from 'react';
import '../../styles/pages/dashboard/Consumer.css';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import DashboardLayout from '../../components/DashboardLayout';
import { getLifeInsuranceRenewalData } from '../../serviceAPI/userAPI';
import Cookies from 'js-cookie';
import Modal from '../../components/common/Modal';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';

const LifeInsuranceRenewalSheet = () => {
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
    const [remark, setRemark] = useState('');
    const [editIndex, setEditIndex] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const hasLoadedData = useRef(false);

    const categoryId = Cookies.get('category');
    const user = (Cookies.get('user') && JSON.parse(Cookies.get('user'))) || '';

    const getAllLifeInsuranceRenewalData = async (forceReload = false) => {
        if (isLoading || (hasLoadedData.current && !forceReload)) return;
        
        // Don't make API call if dates are not selected
        if (!startDate || !endDate) {
            setData([]);
            setFilteredData([]);
            setIsLoading(false);
            return;
        }
        
        setIsLoading(true);
        try {
            const response = await getLifeInsuranceRenewalData(startDate, endDate);
            if (response && response.status) {
                setData(response.data || []);
                setFilteredData(response.data || []);
                hasLoadedData.current = true;
            } else {
                setData([]);
                setFilteredData([]);
            }
        } catch (error) {
            console.error('Error fetching life insurance renewal data:', error);
            setData([]);
            setFilteredData([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Initialize dates from localStorage only if they exist
    useEffect(() => {
        const savedStartDate = localStorage.getItem('lifeInsuranceRenewalStartDate');
        const savedEndDate = localStorage.getItem('lifeInsuranceRenewalEndDate');
        
        if (savedStartDate && savedEndDate) {
            setStartDate(savedStartDate);
            setEndDate(savedEndDate);
        }
        // If no saved dates, keep them blank (empty strings)
    }, []);

    // Initial load - only load if dates are selected
    useEffect(() => {
        if (categoryId && user && !hasLoadedData.current && startDate && endDate) {
            getAllLifeInsuranceRenewalData();
        }
    }, [categoryId, user, startDate, endDate]);

    // Reload when dates change
    useEffect(() => {
        if (hasLoadedData.current) {
            hasLoadedData.current = false;
            getAllLifeInsuranceRenewalData(true);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        setHeading([
            { key: 'due_date', head: 'Due Date' },
            { key: 'proposer_name', head: 'Proposer Name' },
            { key: 'mobile_number', head: 'Mobile Number' },
            { key: 'email', head: 'Email' },
            { key: 'policy_numbers', head: 'Policy Numbers' },
            { key: 'rcd', head: 'RCD' },
            { key: 'premium_amount', head: 'Premium Amount' },
            { key: 'mode', head: 'Mode' },
            { key: 'company_name', head: 'Company Name' },
            { key: 'product_name', head: 'Product Name' }
        ]);
    }, []);

    const handleView = async (userData) => {
        const globalIndex = data.findIndex((item) => item.id === userData.id);
        if (globalIndex !== -1) {
            setViewIndex(globalIndex);
            setDetail(data[globalIndex]);
            setIsViewModalOpen(true);
        }
    };

    const handleRenewal = (userData) => {
        // Follow Mediclaim pattern: redirect to main Life Insurance page with renewal data
        console.log('🔄 [LIFE INSURANCE RENEWAL] Renew clicked for item:', userData);
        
        // Store the renewal data in localStorage for the Life Insurance page to pick up
        localStorage.setItem('isLifeInsuranceRenew', 'true');
        localStorage.setItem('LifeInsuranceID', userData.id);
        localStorage.setItem('lifeInsuranceRenewalData', JSON.stringify(userData));
        
        // Navigate to Life Insurance page
        navigate('/lifeinsurance');
    };





    const handleDateSearch = async () => {
        localStorage.setItem('lifeInsuranceRenewalStartDate', startDate);
        localStorage.setItem('lifeInsuranceRenewalEndDate', endDate);
        hasLoadedData.current = false;
        getAllLifeInsuranceRenewalData(true);
    };

    const handleClearDateFilter = () => {
        setStartDate('');
        setEndDate('');
        
        localStorage.removeItem('lifeInsuranceRenewalStartDate');
        localStorage.removeItem('lifeInsuranceRenewalEndDate');
        
        // Clear data when dates are cleared
        setData([]);
        setFilteredData([]);
        hasLoadedData.current = false;
    };

    const handleSearch = (searchTerm) => {
        if (!searchTerm) {
            setFilteredData(data);
            return;
        }

        const filtered = data.filter(item => 
            item.proposer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.mobile_number?.includes(searchTerm) ||
            item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.policy_numbers?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredData(filtered);
    };

    const exportToExcel = () => {
        const exportData = filteredData.map(item => ({
            'SR NO': item.sr_no,
            'Due Date': item.due_date,
            'Proposer Name': item.proposer_name,
            'Mobile Number': item.mobile_number,
            'Email': item.email,
            'Policy Numbers': item.policy_numbers,
            'RCD': item.rcd,
            'Premium Amount': item.premium_amount,
            'Mode': item.mode,
            'Company Name': item.company_name,
            'Product Name': item.product_name
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Life Insurance Renewal Sheet');
        XLSX.writeFile(wb, `life-insurance-renewal-sheet-${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const ViewModalContent = ({ data, onClose }) => {
        if (!data) return null;

        const originalData = data.originalData || data;

        return (
            <div className="view-details-content">
                {/* Basic Policy Information */}
                <div className="popup-section">
                    <div className="popup-section-header">
                        <h3>Basic Policy Information</h3>
                    </div>
                    <div className="popup-section-content">
                        <div className="popup-detail-row">
                            <span className="detail-label">Policy ID:</span>
                            <span className="detail-value">{originalData.id || 'N/A'}</span>
                        </div>
                        <div className="popup-detail-row">
                            <span className="detail-label">Policy Number:</span>
                            <span className="detail-value">{originalData.policy_number || originalData.policy_numbers || 'N/A'}</span>
                        </div>
                        <div className="popup-detail-row">
                            <span className="detail-label">Product Name:</span>
                            <span className="detail-value">{originalData.product_name || 'N/A'}</span>
                        </div>
                        <div className="popup-detail-row">
                            <span className="detail-label">Status:</span>
                            <span className="detail-value">{originalData.status || 'N/A'}</span>
                        </div>
                        <div className="popup-detail-row">
                            <span className="detail-label">Premium Amount:</span>
                            <span className="detail-value">₹{originalData.premium_amount ? originalData.premium_amount.toLocaleString() : 'N/A'}</span>
                        </div>
                        <div className="popup-detail-row">
                            <span className="detail-label">Payment Mode:</span>
                            <span className="detail-value">{originalData.premium_payment_mode || 'N/A'}</span>
                        </div>
                        <div className="popup-detail-row">
                            <span className="detail-label">Sum Assured:</span>
                            <span className="detail-value">₹{originalData.sum_assured ? originalData.sum_assured.toLocaleString() : 'N/A'}</span>
                        </div>
                        <div className="popup-detail-row">
                            <span className="detail-label">Policy Term:</span>
                            <span className="detail-value">{originalData.policy_term ? `${originalData.policy_term} years` : 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Proposer Information */}
                <div className="popup-section">
                    <div className="popup-section-header">
                        <h3>Proposer Information</h3>
                    </div>
                    <div className="popup-section-content">
                        <div className="popup-detail-row">
                            <span className="detail-label">Proposer Name:</span>
                            <span className="detail-value">{originalData.proposer_name || 'N/A'}</span>
                        </div>
                        <div className="popup-detail-row">
                            <span className="detail-label">Mobile Number:</span>
                            <span className="detail-value">
                                {originalData.proposer_mobile_numbers && originalData.proposer_mobile_numbers.length > 0 
                                    ? originalData.proposer_mobile_numbers[0] 
                                    : 'N/A'}
                            </span>
                        </div>
                        <div className="popup-detail-row">
                            <span className="detail-label">Email:</span>
                            <span className="detail-value">{originalData.proposer_email || 'N/A'}</span>
                        </div>
                        <div className="popup-detail-row">
                            <span className="detail-label">Date of Birth:</span>
                            <span className="detail-value">
                                {originalData.proposer_dob ? new Date(originalData.proposer_dob).toLocaleDateString() : 'N/A'}
                            </span>
                        </div>
                        <div className="popup-detail-row">
                            <span className="detail-label">Gender:</span>
                            <span className="detail-value">{originalData.proposer_gender || 'N/A'}</span>
                        </div>
                        <div className="popup-detail-row">
                            <span className="detail-label">Marital Status:</span>
                            <span className="detail-value">{originalData.proposer_married_status || 'N/A'}</span>
                        </div>
                        <div className="popup-detail-row">
                            <span className="detail-label">PAN Number:</span>
                            <span className="detail-value">{originalData.proposer_pan_number || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Life Assured Information */}
                <div className="popup-section">
                    <div className="popup-section-header">
                        <h3>Life Assured Information</h3>
                    </div>
                    <div className="popup-section-content">
                        <div className="popup-detail-row">
                            <span className="detail-label">Life Assured Name:</span>
                            <span className="detail-value">{originalData.life_assured_name || 'N/A'}</span>
                        </div>
                        <div className="popup-detail-row">
                            <span className="detail-label">Date of Birth:</span>
                            <span className="detail-value">
                                {originalData.life_assured_dob ? new Date(originalData.life_assured_dob).toLocaleDateString() : 'N/A'}
                            </span>
                        </div>
                        <div className="popup-detail-row">
                            <span className="detail-label">Gender:</span>
                            <span className="detail-value">{originalData.life_assured_gender || 'N/A'}</span>
                        </div>
                        <div className="popup-detail-row">
                            <span className="detail-label">Height:</span>
                            <span className="detail-value">{originalData.height ? `${originalData.height} cm` : 'N/A'}</span>
                        </div>
                        <div className="popup-detail-row">
                            <span className="detail-label">Weight:</span>
                            <span className="detail-value">{originalData.weight ? `${originalData.weight} kg` : 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Nominee Information */}
                <div className="popup-section">
                    <div className="popup-section-header">
                        <h3>Nominee Information</h3>
                    </div>
                    <div className="popup-section-content">
                        <div className="popup-detail-row">
                            <span className="detail-label">Nominee Name:</span>
                            <span className="detail-value">{originalData.nominee_name || 'N/A'}</span>
                        </div>
                        <div className="popup-detail-row">
                            <span className="detail-label">Relationship:</span>
                            <span className="detail-value">{originalData.nominee_relationship_with_life_assured || 'N/A'}</span>
                        </div>
                        <div className="popup-detail-row">
                            <span className="detail-label">Date of Birth:</span>
                            <span className="detail-value">
                                {originalData.nominee_dob ? new Date(originalData.nominee_dob).toLocaleDateString() : 'N/A'}
                            </span>
                        </div>
                        <div className="popup-detail-row">
                            <span className="detail-label">Gender:</span>
                            <span className="detail-value">{originalData.nominee_gender || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Important Dates */}
                <div className="popup-section">
                    <div className="popup-section-header">
                        <h3>Important Dates</h3>
                    </div>
                    <div className="popup-section-content">
                        <div className="popup-detail-row">
                            <span className="detail-label">RCD (Risk Commencement Date):</span>
                            <span className="detail-value">
                                {originalData.rcd ? new Date(originalData.rcd).toLocaleDateString() : 'N/A'}
                            </span>
                        </div>
                        <div className="popup-detail-row">
                            <span className="detail-label">Due Date of Premium:</span>
                            <span className="detail-value">
                                {originalData.due_date_of_premium ? new Date(originalData.due_date_of_premium).toLocaleDateString() : 'N/A'}
                            </span>
                        </div>
                        <div className="popup-detail-row">
                            <span className="detail-label">Date of Maturity:</span>
                            <span className="detail-value">
                                {originalData.date_of_maturity ? new Date(originalData.date_of_maturity).toLocaleDateString() : 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Agent Information */}
                <div className="popup-section">
                    <div className="popup-section-header">
                        <h3>Agent Information</h3>
                    </div>
                    <div className="popup-section-content">
                        <div className="popup-detail-row">
                            <span className="detail-label">Agent Name:</span>
                            <span className="detail-value">{originalData.agent_name || 'N/A'}</span>
                        </div>
                        <div className="popup-detail-row">
                            <span className="detail-label">Agent Code:</span>
                            <span className="detail-value">{originalData.agent_code || 'N/A'}</span>
                        </div>
                        <div className="popup-detail-row">
                            <span className="detail-label">Channel:</span>
                            <span className="detail-value">{originalData.channel || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Additional Information */}
                {(originalData.policy_remarks || originalData.remarks) && (
                    <div className="popup-section">
                        <div className="popup-section-header">
                            <h3>Additional Information</h3>
                        </div>
                        <div className="popup-section-content">
                            <div className="popup-detail-row">
                                <span className="detail-label">Remarks:</span>
                                <span className="detail-value">{originalData.policy_remarks || originalData.remarks || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <DashboardLayout onSearch={handleSearch}>
            <div className="consumer-container">
                <div className="consumer-header">
                    <h1>Life Insurance Renewal Sheet</h1>
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

                <div className="consumer-table-container">
                    <Table
                        columns={heading.map(h => ({ key: h.key, title: h.head }))}
                        data={filteredData}
                        onView={handleView}
                        onRenewal={handleRenewal}
                        pagination={true}
                        itemsPerPage={itemsPerPage}
                        showActions={true}
                        loading={isLoading}
                    />
                </div>

                {/* View Modal */}
                <Modal
                    open={isViewModalOpen}
                    onClose={() => setIsViewModalOpen(false)}
                    title="Life Insurance Policy Details"
                >
                    <ViewModalContent data={detail} onClose={() => setIsViewModalOpen(false)} />
                </Modal>

                {/* Renewal Modal */}
            </div>
        </DashboardLayout>
    );
};

export default LifeInsuranceRenewalSheet;
