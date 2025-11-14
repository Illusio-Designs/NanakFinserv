import React, { useEffect, useState } from 'react';
import '../../styles/pages/dashboard/Consumer.css';
import Modal from '../../components/common/Modal';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import DashboardLayout from '../../components/DashboardLayout';
import { getAllLoanConsumerDetail, getAllConfiguration, addUpdateLoanConfiguration } from '../../serviceAPI/userAPI';
import config from '../../config/apiConfig';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';

const LoanConfiguration = () => {

  const [data, setData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [viewIndex, setViewIndex] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [heading, setHeading] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    categoryname: '',
    pdfFile: null,
    existingPdfName: ''
  });
  const [fileName, setFileName] = useState('');
  const [showAddCategoryField, setShowAddCategoryField] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
    setEditIndex(null);
    setViewIndex(null);
    resetForm();
  };

  const resetForm = () => {
    setDetail(null);
    setEditIndex(null);
    setViewIndex(null);
    setFormData({
      categoryname: '',
      pdfFile: null,
      existingPdfName: ''
    });
    setFileName('');
    setShowAddCategoryField(false);
    setNewCategoryName('');
  };

  useEffect(() => {
    // Set headings immediately so they're always displayed
    setHeading([
      { key: 'categoryname', title: 'Category' },
      { key: 'pdfname', title: 'Detail' }
    ]);
    
    getAllLoanConsumerData()
    getCategories()
  }, []);

  const getCategories = async () => {
    try {
      // Fetch unique categories from existing data
      const consumerData = await getAllConfiguration();
      if (consumerData?.data && consumerData?.data?.length) {
        const uniqueCategories = [...new Set(consumerData.data.map(item => item.categoryname))].filter(Boolean);
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const getLoanConsumerDetail = async (laon_id) => {
    const consumerData = await getAllLoanConsumerDetail({ laon_id }); // Send laon_id to get loan details
    if (consumerData?.data) {
      setDetail(consumerData?.data); // Set the detailed data to state
    }
  };

  const getAllLoanConsumerData = async () => {
    setLoading(true);
    const consumerData = await getAllConfiguration();
    if (consumerData?.data && consumerData?.data?.length) {
      setData(consumerData?.data);
    } else {
      setData([]);
    }
    setLoading(false);
  };

  const handleEdit = (userData) => {
    const globalIndex = data.findIndex((item) => item.config_id === userData.config_id);
    if (globalIndex !== -1) {
      setEditIndex(globalIndex);
      const item = data[globalIndex];
      setFormData({
        categoryname: item.categoryname || '',
        pdfFile: null,
        existingPdfName: item.pdfname || ''
      });
      setFileName('');
      setIsModalOpen(true);
    }
  };

  const fetchApi = () => {
    getAllLoanConsumerData();
  };

  const handleVerticalChange = (index, newVertical) => {
    const updatedData = data.map((item, idx) =>
      idx === index ? { ...item, vertical: newVertical } : item
    );
    setData(updatedData);
  };

  const filterData = () => {
    let filtered = data;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    return filtered;
  };

  useEffect(() => {
    filterData();
  }, [searchTerm, data]);

  const exportToExcel = () => {
    const exportData = data.map((item, index) => {
      const getCategory = item.categoryname || '';
      const getDetail = item.pdfname || '';

      return {
        'Sr. No.': index + 1,
        'Category': getCategory,
        'Detail': getDetail
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Loan Configuration Data");
    XLSX.writeFile(wb, "loan_configuration_data.xlsx");
  };

  const handleAddNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleAddCategoryInline = () => {
    if (!newCategoryName.trim()) {
      toast.error('Please enter a category name');
      return;
    }
    
    // Check if category already exists
    if (categories.includes(newCategoryName.trim())) {
      toast.error('Category already exists');
      return;
    }
    
    // Add to categories list
    setCategories(prev => [...prev, newCategoryName.trim()]);
    
    // Set as selected category
    setFormData(prev => ({
      ...prev,
      categoryname: newCategoryName.trim()
    }));
    
    // Reset and hide the field
    setNewCategoryName('');
    setShowAddCategoryField(false);
    
    toast.success('Category added successfully');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a PDF file only');
        return;
      }
      setFormData(prev => ({
        ...prev,
        pdfFile: file
      }));
      setFileName(file.name);
    }
  };

  const handleRemoveFile = () => {
    setFormData(prev => ({
      ...prev,
      pdfFile: null
    }));
    setFileName('');
    // Reset the file input
    const fileInput = document.getElementById('pdfUpload');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.categoryname) {
      toast.error('Please select a category');
      return;
    }

    // For new entries, require a PDF file
    if (editIndex === null && !formData.pdfFile) {
      toast.error('Please upload a PDF file');
      return;
    }

    // For edits, file is optional (can keep existing or upload new)
    if (editIndex !== null && !formData.pdfFile && !formData.existingPdfName) {
      toast.error('Please upload a PDF file');
      return;
    }

    try {
      // Get user from cookies
      const userStr = Cookies.get('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('categoryname', formData.categoryname);
      
      // Only append new file if one was selected
      if (formData.pdfFile) {
        submitData.append('pdfFile', formData.pdfFile);
      }
      
      submitData.append('user_id', user?.user_id || '');

      // If editing, include the config_id
      if (editIndex !== null) {
        submitData.append('config_id', data[editIndex].config_id);
      }

      const response = await addUpdateLoanConfiguration(submitData);
      
      if (response && response.status) {
        toast.success(editIndex !== null ? 'Configuration updated successfully' : 'Configuration added successfully');
        toggleModal();
        getAllLoanConsumerData(); // Refresh the data
        getCategories(); // Refresh categories
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error('Failed to save configuration');
    }
  };

  const filteredData = filterData();

  return (
    <DashboardLayout>
      <div className="consumer-container">
        <div className="consumer-header">
          <h1>Loan Configuration</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button className="add-consumer-btn" onClick={handleAddNew}>
              + Add Configuration
            </Button>
            <Button className="add-consumer-btn" onClick={exportToExcel}>
              Export to Excel
            </Button>
          </div>
        </div>

        <div className="consumer-table-container">
          <Table
            columns={heading}
            data={filteredData}
            onEdit={handleEdit}
            pagination={true}
            itemsPerPage={25}
            loading={loading}
          />
        </div>

        {isModalOpen && (
          <Modal
            open={isModalOpen}
            onClose={toggleModal}
            title={editIndex !== null ? "Edit Configuration" : "Add Configuration"}
          >
            <form className="consumer-form" onSubmit={(e) => e.preventDefault()}>
                  <div className="form-section">
                <h5>Configuration Details</h5>
                
                {categories.length > 0 && (
                  <>
                    {/* Category Selection */}
                    <div className="form-row">
                      <div className="form-group">
                        <label>Category *</label>
                        <Select
                          options={categories.map((cat) => ({
                            value: cat,
                            label: cat
                          }))}
                          value={formData.categoryname ? { value: formData.categoryname, label: formData.categoryname } : null}
                          onChange={(option) => setFormData(prev => ({ ...prev, categoryname: option ? option.value : '' }))}
                          placeholder="Select Category"
                          isClearable
                        />
                        {formData.categoryname && (
                          <small style={{ color: '#388e3c', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                            Selected: {formData.categoryname}
                          </small>
                        )}
                      </div>
                    </div>

                    {/* Add Category Button */}
                    <div className="form-row">
                      <Button
                        type="button"
                        className="btn-blue"
                        onClick={() => setShowAddCategoryField(true)}
                        style={{ margin: '0 auto' }}
                      >
                        Add Category
                      </Button>
                    </div>

                    {/* Add Category Field */}
                    {showAddCategoryField && (
                    <div className="form-row">
                      <div className="form-group">
                          <label>New Category Name</label>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', width: 'max-content' }}>
                            <Input
                              type="text"
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              placeholder="Enter new category name"
                              style={{ flex: 1 }}
                            />
                            <Button
                              type="button"
                              className="submit-btn"
                              onClick={handleAddCategoryInline}
                              style={{ height: '36px' }}
                            >
                              Add
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {categories.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                    <div>No categories found. Please add a new category.</div>
                    {!showAddCategoryField ? (
                      <Button
                        type="button"
                        className="btn-blue"
                        onClick={() => setShowAddCategoryField(true)}
                        style={{ marginTop: '10px' }}
                      >
                        Add First Category
                      </Button>
                    ) : (
                      <div className="form-row" style={{ marginTop: '20px' }}>
                        <div className="form-group">
                          <label>New Category Name</label>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', width: 'max-content', margin: '0 auto' }}>
                            <Input
                              type="text"
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              placeholder="Enter new category name"
                              style={{ flex: 1 }}
                            />
                            <Button
                              type="button"
                              className="submit-btn"
                              onClick={handleAddCategoryInline}
                              style={{ height: '36px' }}
                            >
                              Add
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                      </div>
                )}

                {/* Document Upload */}
                <div className="form-row">
                      <div className="form-group">
                    <label>Upload PDF Document *</label>
                          <input
                            type="file"
                      accept="application/pdf"
                            id="pdfUpload"
                      name="pdfFile"
                      onChange={handleFileChange}
                    />
                    
                    {/* Show newly selected file */}
                    {fileName && (
                      <div style={{ fontSize: "0.9em", marginTop: 4, display: "block", color: "#388e3c" }}>
                        <strong>Selected file:</strong> {fileName}
                        <button 
                          type="button" 
                          onClick={handleRemoveFile}
                          style={{ 
                            marginLeft: '10px', 
                            padding: '2px 8px', 
                            fontSize: '0.8em', 
                            backgroundColor: '#ff4444', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '3px',
                            cursor: 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    {/* Show existing PDF for edit mode */}
                    {editIndex !== null && formData.existingPdfName && !fileName && (
                      <div style={{ 
                        marginTop: '8px', 
                        padding: '8px',
                        backgroundColor: '#f0f7ff',
                        borderRadius: '4px',
                        border: '1px solid #d0e7ff'
                      }}>
                        <div style={{ 
                          fontSize: "0.85em", 
                          color: "#388e3c",
                          marginBottom: '6px'
                        }}>
                          ✓ Stored: {formData.existingPdfName}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => window.open(`${config.API_URL}/user/download/${formData.existingPdfName}`, '_blank')}
                            style={{ 
                              padding: '4px 10px',
                              backgroundColor: '#1976d2',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.8em',
                              fontWeight: '500',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
                          >
                            📥 Download
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to remove this document?')) {
                                setFormData(prev => ({ ...prev, existingPdfName: '' }));
                                toast.success('Document marked for removal');
                              }
                            }}
                            style={{
                              padding: '4px 10px',
                              backgroundColor: '#d32f2f',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.8em',
                              fontWeight: '500',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c62828'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#d32f2f'}
                          >
                            🗑️ Remove
                          </button>
                        </div>
                      </div>
                    )}
                    </div>
                  </div>
                </div>

              <div className="form-actions">
                <Button 
                  type="button"
                  className="cancel-btn" 
                  onClick={toggleModal}
                >
                  Cancel
                </Button>
                <Button 
                  type="button"
                  className="submit-btn" 
                  onClick={handleSubmit}
                >
                  {editIndex !== null ? "UPDATE" : "SAVE"}
                </Button>
                </div>
            </form>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
};

export default LoanConfiguration;
