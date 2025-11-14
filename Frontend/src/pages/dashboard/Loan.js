import React, { useEffect, useState } from 'react';
import '../../styles/pages/dashboard/Consumer.css';
import DashboardLayout from '../../components/DashboardLayout';
import { getAllLoanConsumer, updateLoanStatus, addConsumerUser } from '../../serviceAPI/userAPI';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import FlagDropdown from '../Flag';
import Cookies from 'js-cookie';
import { useToaster } from '../../components/Toaster';

const Loan = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [heading, setHeading] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  
  // Status Modal State
  const [status, setStatus] = useState('interested');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  // Consumer Form State
  const [formData, setFormData] = useState({
    Name: '',
    MobileNumber: '',
    Email: '',
    ReferenceName: '',
    BuilderName: '',
    BuildingName: '',
    SqFt: '',
    DeedAmount: '',
    Address: ''
  });

  const categoryId = Cookies.get('category');
  const user = (Cookies.get('user') && JSON.parse(Cookies.get('user'))) || '';
  const addToast = useToaster();

  const handleSearch = (searchQuery) => {
    if (!searchQuery.trim()) {
      setFilteredData(data);
      return;
    }
    
    const filtered = data.filter(item => 
      item.Name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.MobileNumber?.includes(searchQuery) ||
      item.Email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.ReferenceName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredData(filtered);
  };

  useEffect(() => {
    getAllLoanConsumerData();
  }, []);

  const getAllLoanConsumerData = async () => {
    setLoading(true);
    try {
      console.log('🔍 [LOAN] Fetching loan consumers...');
      const response = await getAllLoanConsumer();
      console.log('🔍 [LOAN] API Response:', response);
      
      if (response && response.data) {
        console.log('🔍 [LOAN] Raw data received:', response.data);
        console.log('🔍 [LOAN] Data length:', response.data.length);
        
        // Log first few records to understand structure
        if (response.data.length > 0) {
          console.log('🔍 [LOAN] First record structure:', response.data[0]);
          console.log('🔍 [LOAN] First record keys:', Object.keys(response.data[0]));
        }
        
        const processedData = response.data.map(consumer => ({
          id: consumer.user_consumer_id,
          Name: consumer['userConsumers.username'] || '',
          Email: consumer['userConsumers.email'] || '',
          MobileNumber: consumer['userConsumers.mobileNumber'] || '',
          ReferenceName: consumer['userConsumers.referenceName'] || '',
          Role: consumer['userRoles.username'] || ''
        }));
        
        console.log('🔍 [LOAN] Processed data:', processedData);
        
        setData(processedData);
        setFilteredData(processedData);
        
        // Set table headings
        setHeading([
          { key: 'Name', head: 'Name' },
          { key: 'Email', head: 'Email' },
          { key: 'MobileNumber', head: 'Mobile Number' },
          { key: 'ReferenceName', head: 'Reference Name' },
          { key: 'Role', head: 'Role' }
          
        ]);
      } else {
        console.log('🔍 [LOAN] No data in response or response is invalid');
        setData([]);
        setFilteredData([]);
      }
    } catch (error) {
      console.error('🔍 [LOAN] Error fetching loan consumer data:', error);
      addToast('Error fetching data', 'error');
      setData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };


  const toggleStatusModal = () => {
    setIsStatusModalOpen(!isStatusModalOpen);
    if (!isStatusModalOpen) {
      resetForm();
    }
  };

  const handleStatusEdit = (userData) => {
    setEditData(userData);
    setStatus('interested');
    setRemarks('');
    setIsStatusModalOpen(true);
  };

  const handleStatusUpdate = async () => {
    if (!editData) return;
    
    setLoading(true);
    try {
      const updateData = {
        user_consumer_id: editData.id,
        status: status,
        remarks: status === 'notInterested' ? remarks : ''
      };
      
      const response = await updateLoanStatus(updateData, addToast);
      if (response && response.status) {
        setIsStatusModalOpen(false);
        getAllLoanConsumerData(); // Refresh data
      } else {
        addToast('Failed to update status', 'error');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      addToast('Error updating status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConsumerSubmit = async (e) => {
    e.preventDefault();

    const regex = /^\d{10}$/;
    if (!regex.test(formData.MobileNumber)) {
      addToast('Mobile number must be 10 digits', 'error');
      return;
    }

    // Validate property information
    if (!formData.BuilderName.trim()) {
      addToast('Builder name is required', 'error');
      return;
    }
    if (!formData.BuildingName.trim()) {
      addToast('Building name is required', 'error');
      return;
    }
    if (!formData.SqFt || parseFloat(formData.SqFt) <= 0) {
      addToast('Valid Sq. Ft. is required', 'error');
      return;
    }
    if (!formData.DeedAmount || parseFloat(formData.DeedAmount) <= 0) {
      addToast('Valid Deed Amount is required', 'error');
      return;
    }
    if (!formData.Address.trim()) {
      addToast('Address is required', 'error');
      return;
    }

    const userData = {
      username: formData.Name.trim(),
      phone_number: formData.MobileNumber,
      email: formData.Email,
      category: [{ category_id: 2, user_role_id: user.user_id }],
      non_builder_name: formData.BuilderName.trim(),
      non_builder_property_name: formData.BuildingName.trim(),
      sq_ft: parseFloat(formData.SqFt),
      deed_amount: parseFloat(formData.DeedAmount),
      address: formData.Address.trim()
    };

    try {
      const response = await addConsumerUser(userData);
      if (response.status) {
        addToast('Consumer added successfully', 'success');
        getAllLoanConsumerData(); // Refresh data
        setIsStatusModalOpen(false);
        resetForm();
      } else {
        addToast('Failed to add consumer', 'error');
      }
    } catch (error) {
      console.error('Error adding consumer:', error);
      addToast('Error adding consumer', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      Name: '',
      MobileNumber: '',
      Email: '',
      ReferenceName: '',
      BuilderName: '',
      BuildingName: '',
      SqFt: '',
      DeedAmount: '',
      Address: ''
    });
    setStatus('interested');
    setRemarks('');
    setEditData(null);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSort = (column) => {
    const direction = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(column);
    setSortDirection(direction);
  };

  const fetchApi = () => {
    getAllLoanConsumerData();
  };

  return (
    <DashboardLayout onSearch={handleSearch}>
      <div className="consumer-container">
        <div className="consumer-header">
          <h1>Loan Management</h1>
          {((user && user.role_id !== 1) || (categoryId && categoryId.includes(2))) && 
            <Button className="add-consumer-btn" onClick={toggleStatusModal}>+ Add Loan Consumer</Button>
          }
        </div>

        <div className="consumer-table-container">
          <Table 
            columns={heading.map(h => ({ key: h.key, title: h.head }))} 
            data={filteredData} 
            onEdit={handleStatusEdit}
            pagination={true} 
            itemsPerPage={itemsPerPage}
            loading={loading}
          />
        </div>

        {/* Add Consumer / Update Status Modal */}
        <Modal open={isStatusModalOpen} onClose={toggleStatusModal} title={editData ? "Update Loan Status" : "Add Loan Consumer"}>
          <form onSubmit={editData ? (e) => { e.preventDefault(); handleStatusUpdate(); } : handleConsumerSubmit} className="consumer-form">
            {!editData ? (
              // Add Consumer Form
              <>
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

                <div className="form-section">
                  <h5>Property Information</h5>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Builder Name *</label>
                      <Input 
                        type="text" 
                        value={formData.BuilderName} 
                        onChange={(e) => handleInputChange('BuilderName', e.target.value)} 
                        placeholder="Enter builder name" 
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>Building Name *</label>
                      <Input 
                        type="text" 
                        value={formData.BuildingName} 
                        onChange={(e) => handleInputChange('BuildingName', e.target.value)} 
                        placeholder="Enter building name" 
                        required 
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Sq. Ft. *</label>
                      <Input 
                        type="number" 
                        value={formData.SqFt} 
                        onChange={(e) => handleInputChange('SqFt', e.target.value)} 
                        placeholder="Enter area in sq. ft." 
                        required 
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="form-group">
                      <label>Deed Amount *</label>
                      <Input 
                        type="number" 
                        value={formData.DeedAmount} 
                        onChange={(e) => handleInputChange('DeedAmount', e.target.value)} 
                        placeholder="Enter deed amount" 
                        required 
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Address *</label>
                      <textarea 
                        value={formData.Address} 
                        onChange={(e) => handleInputChange('Address', e.target.value)} 
                        placeholder="Enter complete address" 
                        className="form-control" 
                        rows="3" 
                        required 
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // Update Status Form
              <>
            <div className="form-section">
              <h5>Status</h5>
              <div className="form-row">
                <label className="radio-label">
                  <input 
                    type="radio" 
                    name="status" 
                    value="interested" 
                    checked={status === 'interested'} 
                    onChange={() => setStatus('interested')}
                  />
                  <span>Interested</span>
                </label>
                <label className="radio-label">
                  <input 
                    type="radio" 
                    name="status" 
                    value="notInterested" 
                    checked={status === 'notInterested'} 
                    onChange={() => setStatus('notInterested')}
                  />
                  <span>Not Interested</span>
                </label>
              </div>
            </div>
            
            {status === 'notInterested' && (
              <div className="form-section">
                <h5>Remarks</h5>
                <div className="form-row">
                  <div className="form-group">
                    <label>Remarks *</label>
                    <textarea 
                      value={remarks} 
                      onChange={(e) => setRemarks(e.target.value)} 
                      placeholder="Enter remarks for not interested status" 
                      className="form-control" 
                      rows="3" 
                      required 
                    />
                  </div>
                </div>
              </div>
                )}
              </>
            )}
            
            <div className="form-actions">
              <Button type="submit" className="submit-btn" disabled={loading}>
                {loading ? (editData ? 'Updating...' : 'Adding...') : (editData ? 'Update Status' : 'Add Consumer')}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default Loan;
