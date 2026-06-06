import React, { useState, useEffect } from 'react';
import '../../styles/pages/dashboard/Consumer.css';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import DashboardLayout from '../../components/DashboardLayout';
import { getRoleUserList, addRoleUser, updateRoleUser, getRoles } from '../../serviceAPI/userAPI';
import Cookies from 'js-cookie';

const User = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [editData, setEditData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [heading, setHeading] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roleData, setRoleData] = useState([]);
  const [formData, setFormData] = useState({
    username: '',
    phone_number: '',
    email: '',
    referenceName: '',
    roleId: []
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
      referenceName: '',
      roleId: []
    });
  };

  useEffect(() => {
    getRoleUserData();
    getRoleData();
  }, []);

  const getRoleData = async () => {
    const roleData = await getRoles();
    if (roleData?.data && roleData?.data?.length) {
      setRoleData(roleData?.data);
    }
  };

  const getRoleUserData = async () => {
    setLoading(true);
    const roleData = await getRoleUserList();
    if (roleData?.data && roleData?.data?.length) {
      setData(roleData?.data);
      setFilteredData(roleData?.data);
    }
    setHeading([
      { key: 'username', head: 'User Name' }, 
      { key: 'email', head: 'Email' }, 
      { key: 'mobileNumber', head: 'Mobile Number' },
      { key: 'categories_name', head: 'Categories' }
    ]);
    setLoading(false);
  };

  const handleEdit = (userData) => {
    setEditData(userData);
    
    // Set form data
    setFormData({
      username: userData.username || '',
      phone_number: userData.mobileNumber || '',
      email: userData.email || '',
      referenceName: userData.referenceName || '',
      roleId: Array.isArray(userData.categories)
        ? userData.categories
        : (userData.categories || '').split(',').map(s => s.trim()).filter(Boolean)
    });

    setIsModalOpen(true);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCategoryChange = (selectedOptions) => {
    const selectedValues = selectedOptions ? selectedOptions.map(option => option.value) : [];
    setFormData(prev => ({
      ...prev,
      roleId: selectedValues
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
        referenceName: formData.referenceName,
        role: 4, // Default to employee role (4) for new users
        roleId: formData.roleId.join(',')
      };

      if (editData) {
        payload.user_id = editData.user_id;
        await updateRoleUser(payload);
      } else {
        await addRoleUser(payload);
      }
      
      toggleModal();
      getRoleUserData();
    } catch (error) {
      console.error('Error saving user:', error);
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

  const getRoleOptions = () => {
    return roleData.map(role => ({
      value: role.category_id,
      label: role.category_name
    }));
  };

  return (
    <DashboardLayout onSearch={handleSearch}>
      <div className="consumer-container">
        <div className="consumer-header">
        <h1>Role Manager</h1>
          <Button 
            className="add-consumer-btn" 
            onClick={toggleModal}
          >
            + Add User
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
          title={editData ? 'Edit User' : 'Add New User'}
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
                {!editData && (
                  <div className="form-group">
                    <label>Reference Name</label>
                    <Input
                      type="text"
                      value={formData.referenceName}
                      onChange={(e) => handleInputChange('referenceName', e.target.value)}
                      placeholder="Enter reference name"
                    />
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Select Categories *</label>
                  <Select
                    options={getRoleOptions()}
                    value={formData.roleId.map(id => getRoleOptions().find(option => option.value === id)).filter(Boolean)}
                    onChange={handleCategoryChange}
                    placeholder="Select categories"
                    isMulti
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

export default User;
