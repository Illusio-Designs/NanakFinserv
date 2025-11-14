import React, { useEffect, useState } from "react";
import '../../styles/pages/dashboard/Consumer.css';
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import DashboardLayout from '../../components/DashboardLayout';
import { getAllBuilders, addBuilderUser, updateBuilderUser } from "../../serviceAPI/userAPI";
import Cookies from 'js-cookie';

const Builder = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [editData, setEditData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [heading, setHeading] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    phone_number: '',
    email: '',
    company_name: ''
  });

  const user = Cookies.get('user') && JSON.parse(Cookies.get('user')) || '';

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
    if (!isModalOpen) {
      setEditData(null);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      phone_number: '',
      email: '',
      company_name: ''
    });
  };

  useEffect(() => {
    getBuilderData();
  }, []);

  const getBuilderData = async () => {
    setLoading(true);
    const builderData = await getAllBuilders();
    if (builderData?.data && builderData?.data?.length) {
      setData(builderData?.data);
      setFilteredData(builderData?.data);
    } else {
      setData([]);
      setFilteredData([]);
    }
    setHeading([{ key: 'username', head: 'User Name' }, { key: 'email', head: 'Email' }, { key: 'mobileNumber', head: 'Mobile Number' },{ key: 'builderuser.company_name', head: 'Builder Name' }]);
    setLoading(false);
  };

  const handleEdit = (userData) => {
    setEditData(userData);
    
    // Set form data
    setFormData({
      username: userData.username || '',
      phone_number: userData.mobileNumber || '',
      email: userData.email || '',
      company_name: userData['builderuser.company_name'] || ''
    });

    setIsModalOpen(true);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload = {
        username: formData.username,
        phone_number: formData.phone_number,
        email: formData.email,
        company_name: formData.company_name
      };

      if (editData) {
        payload.user_id = editData.user_id;
        await updateBuilderUser(payload);
      } else {
        await addBuilderUser(payload);
      }
      
      toggleModal();
      getBuilderData();
    } catch (error) {
      console.error('Error saving builder:', error);
    } finally {
      setLoading(false);
    }
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

  return (
    <DashboardLayout onSearch={handleSearch}>
      <div className="consumer-container">
        <div className="consumer-header">
          <h1>Builder Management</h1>
          <Button 
            className="add-consumer-btn" 
            onClick={toggleModal}
          >
            + Add Builder
          </Button>
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

        <Modal
          open={isModalOpen}
          onClose={toggleModal}
          title={editData ? 'Edit Builder' : 'Add New Builder'}
        >
          <form onSubmit={handleSubmit} className="consumer-form">
            <div className="form-section">
              <h5>Basic Information</h5>
              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <Input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Mobile Number *</label>
                  <div className='phone-style'>
                    <div className="flag-section">
                      <img 
                        src="https://flagcdn.com/w320/in.png" 
                        alt="India" 
                        className="country-flag"
                      />
                      <span className="country-code">+91</span>
                    </div>
                    <input 
                      type="tel" 
                      value={formData.phone_number} 
                      className="form-control mobile" 
                      onChange={(e) => handleInputChange('phone_number', e.target.value)} 
                      placeholder="Enter mobile number" 
                      required
                      maxLength="10"
                    />
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter email address"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Builder Name *</label>
                  <Input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    placeholder="Enter builder name"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-actions">
              <Button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                {loading ? 'Saving...' : (editData ? 'Update' : 'Save')}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default Builder;
