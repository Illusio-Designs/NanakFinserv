import React, { useEffect, useState } from 'react';
import '../../styles/pages/dashboard/Consumer.css';
import '../../styles/pages/dashboard/LifeInsurance.css';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import DashboardLayout from '../../components/DashboardLayout';
import { getAllLifeInsurance, createLifeInsurance, updateLifeInsurance } from '../../serviceAPI/userAPI';
import * as XLSX from 'xlsx';
import Modal from '../../components/common/Modal';
import LifeInsuranceModal from '../../components/LifeInsuranceModal';
import { FiEye, FiEdit2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

const LifeInsurance = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [heading, setHeading] = useState([]);
  const [itemsPerPage] = useState(25);
  const [detail, setDetail] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
    if (!isModalOpen) {
      setEditData(null);
    }
  };

  const toggleViewModal = () => {
    setIsViewModalOpen(!isViewModalOpen);
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

  // Initialize dates from localStorage on mount
  useEffect(() => {
    const savedStartDate = localStorage.getItem('lifeInsuranceStartDate');
    const savedEndDate = localStorage.getItem('lifeInsuranceEndDate');
    
    if (savedStartDate) setStartDate(savedStartDate);
    if (savedEndDate) setEndDate(savedEndDate);
  }, []);

  // Load data only once on mount
  useEffect(() => {
    getAllLifeInsuranceData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle renewal data when component mounts (following Mediclaim pattern)
  useEffect(() => {
    const isLifeInsuranceRenew = localStorage.getItem('isLifeInsuranceRenew');
    const LifeInsuranceID = localStorage.getItem('LifeInsuranceID');
    const renewalData = localStorage.getItem('lifeInsuranceRenewalData');
    
    if (isLifeInsuranceRenew === 'true' && LifeInsuranceID && renewalData) {
      console.log('🔄 [LIFE INSURANCE RENEWAL] Processing renewal request on mount for ID:', LifeInsuranceID);
      
      try {
        const parsedRenewalData = JSON.parse(renewalData);
        console.log('🔄 [LIFE INSURANCE RENEWAL] Parsed renewal data on mount:', parsedRenewalData);
        
        // Set the renewal data for editing
        setEditData(parsedRenewalData.originalData);
        setIsModalOpen(true);
        
        // Clear the renewal data from localStorage after use
        localStorage.removeItem('isLifeInsuranceRenew');
        localStorage.removeItem('LifeInsuranceID');
        localStorage.removeItem('lifeInsuranceRenewalData');
        
        console.log('🔄 [LIFE INSURANCE RENEWAL] Renewal modal opened successfully on mount');
      } catch (error) {
        console.error('🔄 [LIFE INSURANCE RENEWAL] Error parsing renewal data on mount:', error);
        // Clear invalid data
        localStorage.removeItem('isLifeInsuranceRenew');
        localStorage.removeItem('LifeInsuranceID');
        localStorage.removeItem('lifeInsuranceRenewalData');
      }
    }
  }, []);

  const getAllLifeInsuranceData = async () => {
    if (isLoading) return; // Prevent multiple simultaneous calls
    
    setIsLoading(true);
    try {
      const response = await getAllLifeInsurance();
      if (response && response.status) {
        const allData = response.data || [];
        
        // Sort data by creation date (newest first)
        const sortedData = allData.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.updatedAt || 0);
          const dateB = new Date(b.createdAt || b.updatedAt || 0);
          return dateB - dateA;
        });
        
        setData(sortedData);
        
        // Apply date filtering only if dates are selected
        const filteredByDate = (startDate && endDate) ? sortedData.filter(item => {
          const itemDate = item.createdAt || item.updatedAt || '';
          return isWithinDateRange(itemDate, startDate, endDate);
        }) : sortedData;
        
        setFilteredData(filteredByDate);
        setHeading([
          { key: 'createdDate', head: 'Created Date' },
          { key: 'proposer_name', head: 'Proposer Name' },
          { key: 'proposer_mobile_numbers', head: 'Mobile' },
          { key: 'life_assured_name', head: 'Life Assured' },
          { key: 'product_name', head: 'Product' },
          { key: 'sum_assured', head: 'Sum Assured' },
          { key: 'premium_amount', head: 'Premium' },
          { key: 'status', head: 'Status' },
          { key: 'actions', head: 'Actions' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching life insurance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (searchTerm) => {
    if (!searchTerm) {
      setFilteredData(data);
      return;
    }
    
    const filtered = data.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (item.proposer_name && item.proposer_name.toLowerCase().includes(searchLower)) ||
        (item.life_assured_name && item.life_assured_name.toLowerCase().includes(searchLower)) ||
        (item.product_name && item.product_name.toLowerCase().includes(searchLower)) ||
        (item.status && item.status.toLowerCase().includes(searchLower)) ||
        (item.proposer_mobile_numbers && 
          Array.isArray(item.proposer_mobile_numbers) && 
          item.proposer_mobile_numbers.some(mobile => mobile.toLowerCase().includes(searchLower)))
      );
    });
    setFilteredData(filtered);
  };

  const handleDateSearch = () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates.");
      return;
    }
    localStorage.setItem('lifeInsuranceStartDate', startDate);
    localStorage.setItem('lifeInsuranceEndDate', endDate);
    // No need to call API again, just filter existing data
    const filteredByDate = data.filter(item => {
      const itemDate = item.createdAt || item.updatedAt || '';
      return isWithinDateRange(itemDate, startDate, endDate);
    });
    setFilteredData(filteredByDate);
  };

  const handleClearDateFilter = () => {
    setStartDate('');
    setEndDate('');
    localStorage.removeItem('lifeInsuranceStartDate');
    localStorage.removeItem('lifeInsuranceEndDate');
    // Reset to show all data
    setFilteredData(data);
  };


  const handleView = async (userData) => {
    console.log('🔍 [LIFE INSURANCE VIEW] View clicked for userData:', userData);
    const globalIndex = data.findIndex((item) => item.id === userData.id);
    console.log('🔍 [LIFE INSURANCE VIEW] Found at globalIndex:', globalIndex);
    if (globalIndex !== -1) {
      const itemData = data[globalIndex];
      console.log('🔍 [LIFE INSURANCE VIEW] Item data being passed to view modal:', itemData);
      setDetail(itemData);
      setIsViewModalOpen(true);
    }
  };

  const handleEdit = (userData) => {
    console.log('🔍 [LIFE INSURANCE EDIT] Edit clicked for userData:', userData);
    const globalIndex = data.findIndex((item) => item.id === userData.id);
    console.log('🔍 [LIFE INSURANCE EDIT] Found at globalIndex:', globalIndex);
    if (globalIndex !== -1) {
      const itemData = data[globalIndex];
      console.log('🔍 [LIFE INSURANCE EDIT] Item data being passed to popup:', itemData);
      setEditData(itemData);
      setIsModalOpen(true);
    }
  };


  const fetchApi = () => {
    getAllLifeInsuranceData();
  };

  const exportToExcel = async () => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(filteredData.map(item => ({
        'Created Date': item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB') : 'N/A',
        'Proposer Name': item.proposer_name || 'N/A',
        'Mobile': Array.isArray(item.proposer_mobile_numbers) ? item.proposer_mobile_numbers.join(', ') : (item.proposer_mobile_numbers || 'N/A'),
        'Life Assured': item.life_assured_name || 'N/A',
        'Product': item.product_name || 'N/A',
        'Sum Assured': item.sum_assured ? `₹${item.sum_assured.toLocaleString()}` : 'N/A',
        'Premium': item.premium_amount ? `₹${item.premium_amount.toLocaleString()}` : 'N/A',
        'Status': item.status || 'N/A'
      })));

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Life Insurance Data');
      XLSX.writeFile(workbook, 'life_insurance_data.xlsx');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    }
  };

  // Transform data for table display
  const transformedData = filteredData.map(item => {
    return {
      createdDate: item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB') : 'N/A',
      proposer_name: item.proposer_name || 'N/A',
      proposer_mobile_numbers: Array.isArray(item.proposer_mobile_numbers) ? item.proposer_mobile_numbers.join(', ') : (item.proposer_mobile_numbers || 'N/A'),
      life_assured_name: item.life_assured_name || 'N/A',
      product_name: item.product_name || 'N/A',
      sum_assured: item.sum_assured ? `₹${item.sum_assured.toLocaleString()}` : 'N/A',
      premium_amount: item.premium_amount ? `₹${item.premium_amount.toLocaleString()}` : 'N/A',
      status: item.status || 'N/A',
      actions: (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button
            className="action-btn view-btn"
            onClick={() => handleView(item)}
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
          <button
            className="action-btn edit-btn"
            onClick={() => handleEdit(item)}
            title="Edit Record"
            style={{
              cursor: 'pointer',
              width: '40px',
              height: '40px',
              border: '2px solid #f59e0b',
              borderRadius: '8px',
              background: '#f59e0b',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(245,158,11,0.2)'
            }}
          >
            <FiEdit2 size={20} strokeWidth={2.5} />
          </button>
        </div>
      ),
      originalData: item // Keep original data for edit/view operations
    };
  });

  const ViewModalContent = () => (
    <div className="view-details-content">
      {detail && (
        <>
          <div className="popup-section">
            <div className="popup-section-header">Proposer Details</div>
            <div className="popup-section-content">
              <div className="popup-detail-row">
                <strong>Name:</strong> {detail.proposer_name || 'N/A'}
              </div>
              <div className="popup-detail-row">
                <strong>Gender:</strong> {detail.proposer_gender || 'N/A'}
              </div>
              <div className="popup-detail-row">
                <strong>DOB:</strong> {detail.proposer_dob ? new Date(detail.proposer_dob).toLocaleDateString() : 'N/A'}
              </div>
              <div className="popup-detail-row">
                <strong>Marital Status:</strong> {detail.proposer_married_status || 'N/A'}
              </div>
              <div className="popup-detail-row">
                <strong>Mobile:</strong> {Array.isArray(detail.proposer_mobile_numbers) ? detail.proposer_mobile_numbers.join(', ') : (detail.proposer_mobile_numbers || 'N/A')}
              </div>
              <div className="popup-detail-row">
                <strong>Email:</strong> {detail.proposer_email || 'N/A'}
              </div>
              <div className="popup-detail-row">
                <strong>PAN:</strong> {detail.proposer_pan_number || 'N/A'}
              </div>
            </div>
          </div>

          <div className="popup-section">
            <div className="popup-section-header">Life Assured Details</div>
            <div className="popup-section-content">
              <div className="popup-detail-row">
                <strong>Name:</strong> {detail.life_assured_name || 'N/A'}
              </div>
              <div className="popup-detail-row">
                <strong>Gender:</strong> {detail.life_assured_gender || 'N/A'}
              </div>
              <div className="popup-detail-row">
                <strong>DOB:</strong> {detail.life_assured_dob ? new Date(detail.life_assured_dob).toLocaleDateString() : 'N/A'}
              </div>
              <div className="popup-detail-row">
                <strong>Marital Status:</strong> {detail.life_assured_married_status || 'N/A'}
              </div>
              <div className="popup-detail-row">
                <strong>Mobile:</strong> {Array.isArray(detail.life_assured_mobile_numbers) ? detail.life_assured_mobile_numbers.join(', ') : (detail.life_assured_mobile_numbers || 'N/A')}
              </div>
              <div className="popup-detail-row">
                <strong>Email:</strong> {detail.life_assured_email || 'N/A'}
              </div>
              <div className="popup-detail-row">
                <strong>PAN:</strong> {detail.life_assured_pan_number || 'N/A'}
              </div>
            </div>
          </div>

          <div className="popup-section">
            <div className="popup-section-header">Policy Details</div>
            <div className="popup-section-content">
              <div className="popup-detail-row">
                <strong>Product Name:</strong> {detail.product_name || 'N/A'}
              </div>
              <div className="popup-detail-row">
                <strong>Sum Assured:</strong> {detail.sum_assured ? `₹${detail.sum_assured.toLocaleString()}` : 'N/A'}
              </div>
              <div className="popup-detail-row">
                <strong>Premium Amount:</strong> {detail.premium_amount ? `₹${detail.premium_amount.toLocaleString()}` : 'N/A'}
              </div>
              <div className="popup-detail-row">
                <strong>Policy Term:</strong> {detail.policy_term ? `${detail.policy_term} years` : 'N/A'}
              </div>
              <div className="popup-detail-row">
                <strong>Premium Payment Term:</strong> {detail.premium_payment_term ? `${detail.premium_payment_term} years` : 'N/A'}
              </div>
              <div className="popup-detail-row">
                <strong>Premium Payment Mode:</strong> {detail.premium_payment_mode || 'N/A'}
              </div>
              <div className="popup-detail-row">
                <strong>Status:</strong> {detail.status || 'N/A'}
              </div>
            </div>
          </div>

          <div className="popup-section">
            <div className="popup-section-header">Nominee Details</div>
            <div className="popup-section-content">
              <div className="popup-detail-row">
                <strong>Name:</strong> {detail.nominee_name || 'N/A'}
              </div>
              <div className="popup-detail-row">
                <strong>Gender:</strong> {detail.nominee_gender || 'N/A'}
              </div>
              <div className="popup-detail-row">
                <strong>DOB:</strong> {detail.nominee_dob ? new Date(detail.nominee_dob).toLocaleDateString() : 'N/A'}
              </div>
              <div className="popup-detail-row">
                <strong>Relationship:</strong> {detail.nominee_relationship_with_life_assured || 'N/A'}
              </div>
              <div className="popup-detail-row">
                <strong>Mobile:</strong> {Array.isArray(detail.nominee_mobile_numbers) ? detail.nominee_mobile_numbers.join(', ') : (detail.nominee_mobile_numbers || 'N/A')}
              </div>
              <div className="popup-detail-row">
                <strong>Email:</strong> {detail.nominee_email || 'N/A'}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <DashboardLayout onSearch={handleSearch}>
      <div className="consumer-container">
        <div className="consumer-header">
          <h1>Life Insurance Management</h1>
          <Button
            className="add-consumer-btn"
            onClick={toggleModal}
          >
            + Add Life Insurance
          </Button>
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
              <Button className="add-consumer-btn" onClick={exportToExcel}>Export to Excel</Button>
            </div>
          </div>
      </div>

        <div className="consumer-table-container">
        <Table
          columns={heading.map(h => ({ key: h.key, title: h.head }))}
            data={transformedData}
          pagination={true}
          itemsPerPage={itemsPerPage}
          loading={isLoading}
        />
        </div>

        {isModalOpen && (
          <LifeInsuranceModal
            isOpen={isModalOpen}
            onClose={toggleModal}
            fetchApi={fetchApi}
            initialData={editData}
            view={false}
            isEdit={!!editData}
            isRenewal={false}
          />
        )}

        {isViewModalOpen && (
          <Modal
            open={isViewModalOpen}
            onClose={toggleViewModal}
            title="Life Insurance Details"
          >
            <ViewModalContent />
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
};

export default LifeInsurance;
