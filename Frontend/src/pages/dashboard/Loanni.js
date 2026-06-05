import toast from 'react-hot-toast';
import React, { useEffect, useState } from 'react';
import '../../styles/pages/dashboard/Consumer.css';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import DashboardLayout from '../../components/DashboardLayout';
import { getAllLoanNotInterestedConsumer, updateLoanStatus } from '../../serviceAPI/userAPI';
import { useToaster } from '../../components/Toaster';
import * as XLSX from 'xlsx';

const Loanni = () => {
  const addToast = useToaster();
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [heading, setHeading] = useState([]);
  const [itemsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState('interested');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
    if (!isModalOpen) {
      resetForm();
    }
  };

  const resetForm = () => {
    setStatus('interested');
    setRemarks('');
    setEditData(null);
  };

  useEffect(() => {
    getAllLoanConsumerData();
  }, []);

  useEffect(() => {
    filterData();
  }, [data, searchTerm]);

  const getAllLoanConsumerData = async () => {
    setLoading(true);
    try {
      console.log('🔍 [LOAN NOT INTERESTED] Fetching Not Interested loan data...');
      
      // Use only the Not Interested API
      const notInterestedResponse = await getAllLoanNotInterestedConsumer();
      console.log('🔍 [LOAN NOT INTERESTED] Not Interested API response:', notInterestedResponse);
      console.log('🔍 [LOAN NOT INTERESTED] Response status:', notInterestedResponse?.status);
      console.log('🔍 [LOAN NOT INTERESTED] Response message:', notInterestedResponse?.message);
      console.log('🔍 [LOAN NOT INTERESTED] Data type:', typeof notInterestedResponse?.data);
      console.log('🔍 [LOAN NOT INTERESTED] Data length:', Array.isArray(notInterestedResponse?.data) ? notInterestedResponse.data.length : 'Not an array');
      console.log('🔍 [LOAN NOT INTERESTED] Full response structure:', JSON.stringify(notInterestedResponse, null, 2));
      
      // Ensure data is an array
      let dataArray = [];
      if (notInterestedResponse?.data) {
        if (Array.isArray(notInterestedResponse.data)) {
          dataArray = notInterestedResponse.data;
        } else if (typeof notInterestedResponse.data === 'object') {
          // If it's a single object, wrap it in an array
          dataArray = [notInterestedResponse.data];
        }
      }
      
      console.log('🔍 [LOAN NOT INTERESTED] Processed data array length:', dataArray.length);
      
      if (dataArray.length > 0) {
        console.log('🔍 [LOAN NOT INTERESTED] Found Not Interested data:', dataArray.length, 'records');
        
        // Process the Not Interested data
        const processedData = dataArray.map((user, index) => {
          const processedUser = {
            ...user,
            serialNumber: index + 1,
            userName: user.userConsumers?.username || user['userConsumers.username'] || '',
            mobileNumber: user.userConsumers?.mobileNumber || user['userConsumers.mobileNumber'] || '',
            email: user.userConsumers?.email || user['userConsumers.email'] || '',
            user_consumer_id: user.user_consumer_id || user.details?.user_consumer_id,
            laon_id: user.details?.laon_id || user.laon_id,
            status: user.status || user.details?.status || 'notInterested',
            remarks: user.details?.remarks || '',
            details: user
          };
          return processedUser;
        });
        
        console.log('🔍 [LOAN NOT INTERESTED] Processed Not Interested data:', processedData.length, 'records');
        setData(processedData || []);
        setFilteredData(processedData || []);
        
        // Set table headings
        setHeading([
          { key: 'loanDate', head: 'Loan Date' },
          { key: 'userName', head: 'Name' }, 
          { key: 'email', head: 'Email' }, 
          { key: 'mobileNumber', head: 'Mobile Number' },
          { key: 'status', head: 'Status' },
          { key: 'remarks', head: 'Remarks' }
        ]);
      } else {
        console.log('🔍 [LOAN NOT INTERESTED] No Not Interested data found');
        setData([]);
        setFilteredData([]);
        setHeading([
          { key: 'loanDate', head: 'Loan Date' },
          { key: 'userName', head: 'Name' }, 
          { key: 'email', head: 'Email' }, 
          { key: 'mobileNumber', head: 'Mobile Number' },
          { key: 'status', head: 'Status' },
          { key: 'remarks', head: 'Remarks' }
        ]);
      }
    } catch (error) {
      console.error('❌ Error fetching Not Interested loan data:', error);
      setData([]);
      setFilteredData([]);
      setHeading([
        { key: 'loanDate', head: 'Loan Date' },
        { key: 'userName', head: 'Name' }, 
        { key: 'email', head: 'Email' }, 
        { key: 'mobileNumber', head: 'Mobile Number' },
        { key: 'status', head: 'Status' },
        { key: 'remarks', head: 'Remarks' }
      ]);
    }
    setLoading(false);
  };


  const handleEdit = (userData) => {
    setEditData(userData);
    setStatus(userData?.status || 'interested');
    setRemarks(userData?.remarks || '');
    setIsModalOpen(true);
  };

  const handleStatusUpdate = async () => {
    if (status === 'notInterested' && !remarks.trim()) {
      toast.error('Please enter remarks for not interested status');
      return;
    }

    const loanStatus = {
      status: status,
      user_consumer_id: editData?.user_consumer_id || editData?.details?.user_consumer_id,
      remarks: status === 'notInterested' ? remarks : ''
    };
    const possibleLaonId = editData?.laon_id || editData?.details?.laon_id;
    if (possibleLaonId) loanStatus.laon_id = possibleLaonId;
    const possibleMobile = editData?.mobileNumber || editData?.userConsumers?.mobileNumber || editData?.['userConsumers.mobileNumber'];
    if (possibleMobile) loanStatus.mobileNumber = possibleMobile;

    if (!loanStatus.user_consumer_id) {
      addToast('Missing user id. Cannot update.', 'error');
      return;
    }

    try {
      const res = await updateLoanStatus(loanStatus);
      if (!res || res.status === false) {
        throw new Error(res?.message || 'Update failed');
      }
      addToast('Status updated successfully', 'success');
      console.log('🔍 [LOAN NOT INTERESTED] Status updated successfully, refreshing data...');
      
      // Close modal first
      toggleModal();
      
      // Always refresh data to ensure consistency
      await getAllLoanConsumerData();
      
      console.log('🔍 [LOAN NOT INTERESTED] Data refreshed after status update');
    } catch (error) {
      console.error('Error updating status:', error);
      addToast('Error updating status', 'error');
    }
  };

  const filterData = () => {
    let filtered = data;
    
    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(item => 
        Object.values(item).some(value => 
          String(value || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    
    setFilteredData(filtered);
  };

  const handleSearch = (searchQuery) => {
    setSearchTerm(searchQuery);
  };


  const exportToExcel = () => {
    const exportData = data.map((item, index) => {
      return {
        'Sr. No.': index + 1,
        'Name': item.userName || '',
        'Loan Date': item.loanDate ? new Date(item.loanDate).toLocaleDateString() : '',
        'Email': item.email || '',
        'Mobile No.': item.mobileNumber || '',
        'Status': item.status || '',
        'Remarks': item.remarks || ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Loan Not Interested Data");
    XLSX.writeFile(wb, "loan_not_interested_data.xlsx");
  };

  return (
    <DashboardLayout onSearch={handleSearch}>
      <div className="consumer-container">
        <div className="consumer-header">
          <h1>Loan Not Interested</h1>
          <Button className="add-consumer-btn" onClick={exportToExcel}>Export to Excel</Button>
        </div>
        

        <div className="consumer-table-container">
          <Table 
            columns={heading.map(h => ({ key: h.key, title: h.head }))} 
            data={filteredData} 
            onEdit={handleEdit}
            pagination={true} 
            itemsPerPage={itemsPerPage}
            loading={loading}
          />
        </div>

        {/* Status Update Modal */}
        <Modal open={isModalOpen} onClose={toggleModal} title="Update Loan Status">
          <form onSubmit={(e) => { e.preventDefault(); handleStatusUpdate(); }} className="consumer-form">
            <div className="form-section">
              <h3>Loan Status</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Status:</label>
                  <div className="radio-group">
                    <label>
                      <input
                        type="radio"
                        name="status"
                        value="interested"
                        checked={status === 'interested'}
                        onChange={(e) => setStatus(e.target.value)}
                      />
                      Interested
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="status"
                        value="notInterested"
                        checked={status === 'notInterested'}
                        onChange={(e) => setStatus(e.target.value)}
                      />
                      Not Interested
                    </label>
                  </div>
                </div>
              </div>
              {status === 'notInterested' && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Remarks:</label>
                    <Input
                      type="text"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Enter remarks"
                      required
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="form-actions">
              <Button type="submit" className="submit-btn">Update Status</Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default Loanni;
