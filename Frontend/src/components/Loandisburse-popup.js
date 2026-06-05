import toast from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import './popup-u.css';
import Cookies from 'js-cookie';
import { useToaster } from './Toaster';
import { addUpdateLoanDisburse } from '../serviceAPI/userAPI';

const LoandisbursePopup = ({ isOpen, onClose, fetchApi, initialData }) => {
  const addToast = useToaster();
  const [formState, setFormState] = useState({
    dropdownValue: '',
    file: null,
  });

  const getFiscalYears = () => {
    const currentYear = new Date().getFullYear();
    return [
      `${currentYear - 3}-${currentYear - 2}`,
      `${currentYear - 2}-${currentYear - 1}`,
      `${currentYear - 1}-${currentYear}`,
      `${currentYear}-${currentYear + 1}`
    ];
    
  };

  const user = Cookies.get('user') && JSON.parse(Cookies.get('user')) || '';

  useEffect(() => {
    if (initialData) {
      setFormState({
        dropdownValue: initialData.dropdownValue || '',
        file: null
      });
    } else {
      setFormState({
        dropdownValue: '',
        file: null
      });
    }
  }, [initialData]);

  const handleDropdownChange = (e) => {
    const { value } = e.target;
    console.log(value)
    setFormState(prevState => ({
      ...prevState,
      dropdownValue: value,
    }));
  };

  console.log(formState)

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setFormState(prevState => ({
        ...prevState,
        file: file
      }));
    } else {
      toast.error('Please upload a PDF file.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formState.file) {
      toast.error('File is required.');
      return;
    }
    console.log(initialData,'initialData')

    const formData = new FormData();
    if(initialData?.user_consumer_id){
      formData.append('user_id', initialData?.user_consumer_id);
      formData.append('categoryname', formState.dropdownValue);
      if (formState.file) {
        formData.append('pdfFile', formState.file);
      }
      console.log(formData,'formData',formState)
  
      let response = await addUpdateLoanDisburse(formData, addToast);
      if (response) {
        fetchApi();
        onClose();
      }
    }
    

    // try {
    //   const response = await fetch('http://localhost:5000/api/disburse', {
    //     method: 'POST',
    //     body: formData,
    //   });

    //   const result = await response.json();

    //   if (response.ok) {
    //     addToast({ message: result.message, type: 'success' });
    //     fetchApi();
    //     onClose();
    //   } else {
    //     addToast({ message: result.message, type: 'error' });
    //   }
    // } catch (error) {
    //   addToast({ message: 'Server error', type: 'error' });
    // }
  };

  if (!isOpen) return null;

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <div className='popup-header d-flex justify-content-between align-items-center'>
          <h2>{initialData ? 'Edit Disburse' : 'Add Disburse'}</h2>
          <span className="close-btn" onClick={onClose}>&times;</span>
        </div>
        <form className="popup-form" onSubmit={handleSubmit}>
          <div className='row'>
            <div className='col-md-6 mb-4'>
              <label>Dropdown</label>
              <select value={formState.dropdownValue} className='form-select' onChange={handleDropdownChange} required>
              <option key={'select'} value={''}>{'Select Year'}</option>
                {getFiscalYears().map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className='col-md-6 mb-4'>
            <label>Upload PDF</label>
            <input type="file" className='form-control' accept="application/pdf" onChange={handleFileChange} />
            </div>
          </div>
          <button className="btn btn-blue" type="submit">{initialData ? 'Update' : 'Add'}</button>
        </form>
      </div>
    </div>
  );
};

export default LoandisbursePopup;
