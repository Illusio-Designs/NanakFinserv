import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import Button from './common/Button';
import Input from './common/Input';
import { addMediclaimProduct, updateMediclaimProduct } from '../serviceAPI/userAPI';
import { useToaster } from './Toaster';
import { useParams } from 'react-router';
import config from '../config/apiConfig';
import toast from 'react-hot-toast';

const MediclaimProductModal = ({ isOpen, onClose, fetchApi, initialData }) => {
  const addToast = useToaster();
  const { id } = useParams();
  const [formValues, setFormValues] = useState({
    name: '',
  });
  const [files, setFiles] = useState([]);
  const [existingPdfs, setExistingPdfs] = useState([]);
  const [removedPdfIds, setRemovedPdfIds] = useState([]); // Track PDFs marked for removal

  useEffect(() => {
    if (initialData && initialData.mediclaim_company_id) {
      setFormValues({
        name: initialData?.mediclaim_product_name || '',
      });
      // Set existing PDFs from initialData
      if (initialData.mediclaimproductpdfs && initialData.mediclaimproductpdfs.length > 0) {
        setExistingPdfs(initialData.mediclaimproductpdfs);
      }
      setRemovedPdfIds([]); // Reset removed PDFs
    } else {
      setFormValues({
        name: '',
      });
      setExistingPdfs([]);
      setRemovedPdfIds([]);
    }
    setFiles([]); // Reset new files
  }, [initialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const totalFiles = files.length + existingPdfs.length;
    if (selectedFiles.length + totalFiles > 3) {
      toast.error('You can upload a maximum of 3 PDF files.');
      return;
    }
    const validFiles = selectedFiles.filter((file) => file.type === 'application/pdf');
    if (validFiles.length !== selectedFiles.length) {
      toast.error('Only PDF files are allowed.');
      return;
    }
    setFiles((prevFiles) => [...prevFiles, ...validFiles]);
  };

  const handleFileRemove = (index) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    // Clear file input
    const fileInput = document.getElementById('pdfFileInput');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleExistingPdfRemove = (pdfId) => {
    if (window.confirm('Are you sure you want to remove this document?')) {
      // Remove from display
      setExistingPdfs((prevPdfs) => prevPdfs.filter((pdf) => pdf.mediclaim_product_pdf_id !== pdfId));
      // Track for backend deletion
      setRemovedPdfIds((prevIds) => [...prevIds, pdfId]);
      toast.success('Document marked for removal');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('mediclaim_product_name', formValues.name.trim());
    formData.append('mediclaim_company_id', id);

    files.forEach((file, index) => {
      formData.append(`pdfFile${index + 1}`, file);
    });

    let response;
    if (initialData && initialData.mediclaim_product_id) {
      formData.append('mediclaim_product_id', initialData.mediclaim_product_id);
      // Send list of PDF IDs to remove (if any)
      if (removedPdfIds.length > 0) {
        formData.append('removedPdfIds', JSON.stringify(removedPdfIds));
      }
      response = await updateMediclaimProduct(formData, addToast);
    } else {
      response = await addMediclaimProduct(formData, addToast);
    }

    if (response.status) {
      fetchApi();
      onClose();
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Mediclaim Product' : 'Add New Product'}
    >
      <form onSubmit={handleSubmit} className="consumer-form">
        <div className="form-section">
          <h5>Product Information</h5>
          
          <div className="form-row">
            <div className="form-group">
              <label>Product Name *</label>
              <Input
                type="text"
                name="name"
                value={formValues.name}
                onChange={handleInputChange}
                placeholder="Enter product name"
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h5>Documents</h5>
          
          {/* Show existing PDFs in edit mode */}
          {existingPdfs.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              {existingPdfs.map((pdf, index) => (
                <div key={pdf.mediclaim_product_pdf_id} style={{ 
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
                    ✓ Stored: {pdf.pdf_name || `Document ${index + 1}`}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => window.open(`${config.BASE_URL}${pdf.pdf_path}`, '_blank')}
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
                      onClick={() => handleExistingPdfRemove(pdf.mediclaim_product_pdf_id)}
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
              ))}
            </div>
          )}
          
          <div className="form-row">
            <div className="form-group">
              <label>Upload PDF Files (Max 3 total)</label>
              <input
                type="file"
                id="pdfFileInput"
                accept="application/pdf"
                multiple
                onChange={handleFileChange}
                style={{ display: 'block', marginTop: '8px' }}
              />
              <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                Current: {existingPdfs.length + files.length} of 3 files
              </small>
              
              {/* Show newly selected files */}
              {files.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  {files.map((file, index) => (
                    <div key={index} style={{ fontSize: "0.9em", marginTop: 4, display: "block", color: "#388e3c" }}>
                      <strong>Selected file:</strong> {file.name}
                      <button 
                        type="button" 
                        onClick={() => handleFileRemove(index)}
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
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <Button
            type="button"
            className="cancel-btn"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="submit-btn"
          >
            {initialData ? 'UPDATE' : 'SAVE'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default MediclaimProductModal;
