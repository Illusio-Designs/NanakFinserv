import React, { useState, useEffect } from 'react';
import { addPublicInquiry } from '../serviceAPI/userAPI';
import { useToaster } from './Toaster';
import '../styles/components/CTAPopup.css';

const CTAPopup = ({ isOpen, onClose }) => {
  const addToast = useToaster();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: ''
  });
  const [errors, setErrors] = useState({});

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    const newErrors = { ...errors };

    setFormData({ ...formData, [name]: value });

    if (name === 'name') {
      if (!value.trim()) {
        newErrors.name = 'Name is required.';
      } else {
        delete newErrors.name;
      }
    }

    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value.trim() || !emailRegex.test(value)) {
        newErrors.email = 'A valid email is required.';
      } else {
        delete newErrors.email;
      }
    }

    if (name === 'phone') {
      if (!value.trim() || value.length !== 10 || isNaN(value)) {
        newErrors.phone = 'Phone number must be exactly 10 digits.';
      } else {
        delete newErrors.phone;
      }
    }

    if (name === 'service') {
      if (!value) {
        newErrors.service = 'Please select a service.';
      } else {
        delete newErrors.service;
      }
    }

    setErrors(newErrors);
  };

  // Form validation
  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.name.trim()) newErrors.name = 'Name is required.';
    if (!formData.email.trim() || !emailRegex.test(formData.email)) newErrors.email = 'A valid email is required.';
    if (!formData.phone.trim() || formData.phone.length !== 10 || isNaN(formData.phone))
      newErrors.phone = 'Phone number must be exactly 10 digits.';
    if (!formData.service) newErrors.service = 'Please select a service.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      const userData = {
        username: formData.name.trim(),
        phone_number: formData.phone,
        email: formData.email,
        service: formData.service
      };

      const response = await addPublicInquiry(userData, addToast);
      if (response.status) {
        setFormData({ name: '', email: '', phone: '', service: '' });
        onClose(); // Close popup after successful submission
      }
    }
  };

  // Close popup when clicking outside
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Close popup on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset'; // Restore scrolling
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="cta-popup-overlay" onClick={handleBackdropClick}>
      <div className="cta-popup-container">
        <button className="cta-popup-close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
        
        <div className="cta-popup-content">
          <div className="cta-popup-title">
            <h2>Get Connected Instantly</h2>
            <p>Fill out the form below and we'll get back to you within 24 hours with your personalized insurance quote</p>
          </div>
          
          <div className="cta">
            <form onSubmit={handleSubmit}>
              <div className="row align-items-center">
                <div className="col-lg-6 col-md-6">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Name"
                  />
                  {errors.name && <small className="text-error">{errors.name}</small>}
                </div>
                <div className="col-lg-6 col-md-6">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Email"
                  />
                  {errors.email && <small className="text-error">{errors.email}</small>}
                </div>
                <div className="col-lg-6 col-md-6">
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Phone Number"
                    maxLength="10"
                  />
                  {errors.phone && <small className="text-error">{errors.phone}</small>}
                </div>
                <div className="col-lg-6 col-md-6">
                  <select
                    name="service"
                    value={formData.service}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="" disabled>Services</option>
                    <option value="Loan Insurance">Loan Insurance</option>
                    <option value="Life Insurance">Life Insurance</option>
                    <option value="Vehicle Insurance">Vehicle Insurance</option>
                    <option value="Mediclaim Insurance">Mediclaim Insurance</option>
                  </select>
                  {errors.service && <small className="text-error">{errors.service}</small>}
                </div>
                <div className="col-12 text-center mt-4">
                  <button type="submit" className="btn btn-white">Submit</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CTAPopup; 