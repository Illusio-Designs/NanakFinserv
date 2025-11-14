import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import Button from './common/Button';
import Input from './common/Input';
import { addMediclaimCompany, updateMediclaimCompany } from '../serviceAPI/userAPI';
import { useToaster } from './Toaster';

const MediclaimCompanyModal = ({ isOpen, onClose, fetchApi, initialData }) => {
  const addToast = useToaster();
  const [formValues, setFormValues] = useState({
    name: ''
  });

  useEffect(() => {
    if (initialData && initialData.mediclaim_company_id) {
      setFormValues({
        name: initialData?.mediclaim_company_name || ''
      });
    } else {
      setFormValues({
        name: ''
      });
    }
  }, [initialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formValues.name.trim()) {
      addToast('Company name is required', 'error');
      return;
    }

    const userData = {
      mediclaim_company_name: formValues.name.trim()
    };

    try {
      if (initialData && initialData.mediclaim_company_id) {
        // Update existing company
        userData.mediclaim_company_id = initialData.mediclaim_company_id;
        console.log('🔍 [UPDATE] Updating company with data:', userData);
        
        const response = await updateMediclaimCompany(userData, addToast);
        console.log('🔍 [UPDATE] Update response:', response);
        
        if (response && response.status) {
          // Toast already shown by API function
          fetchApi();
          onClose();
        } else {
          console.error('🔍 [UPDATE] Update failed - no status in response');
        }
      } else {
        // Add new company
        console.log('🔍 [ADD] Adding new company with data:', userData);
        
        const response = await addMediclaimCompany(userData, addToast);
        console.log('🔍 [ADD] Add response:', response);
        
        if (response && response.status) {
          // Toast already shown by API function
          fetchApi();
          onClose();
        } else {
          console.error('🔍 [ADD] Add failed - no status in response');
        }
      }
    } catch (error) {
      console.error('🔍 [ERROR] Error in handleSubmit:', error);
      // Error toast already shown by API errorHandel function
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Mediclaim Company' : 'Add New Company'}
    >
      <form onSubmit={handleSubmit} className="consumer-form">
        <div className="form-section">
          <div className="form-row">
            <div className="form-group">
              <label>Company Name *</label>
              <Input
                type="text"
                name="name"
                value={formValues.name}
                onChange={handleInputChange}
                placeholder="Enter company name"
                required
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <Button
            type="submit"
            className="submit-btn"
          >
            {initialData ? 'Update' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default MediclaimCompanyModal;
