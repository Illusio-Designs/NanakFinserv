// frontend/src/components/Popup.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Builder-popup.css';

const Popup = ({ isOpen, onClose, addEntry, initialData }) => {
  const [name, setName] = useState(initialData ? initialData.name : '');
  const [mobile, setMobile] = useState(initialData ? initialData.mobile : '');
  const [email, setEmail] = useState(initialData ? initialData.email : '');
  const [userType, setUserType] = useState(initialData ? initialData.userType : '1');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setMobile(initialData.mobile);
      setEmail(initialData.email);
      setUserType(initialData.userType);
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post('http://localhost:3001/api/users/register', {
        name,
        phone_number: mobile,
        email,
        role: userType
      });

      setMessage('User registered successfully!');
      addEntry(response.data); // Assuming your addEntry function updates the UI
    } catch (error) {
      setMessage('Error registering user: ' + error.response.data.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="popup">
      <div className="popup-inner">
        <h2>{initialData ? 'Edit Entry' : 'Add Entry'}</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Name:</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label>Mobile Number:</label>
            <input type="text" value={mobile} onChange={(e) => setMobile(e.target.value)} required />
          </div>
          <div>
            <label>Email:</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label>User Type:</label>
            <select value={userType} onChange={(e) => setUserType(e.target.value)} required>
              <option value="1">Super admin</option>
              <option value="2">LMS</option>
              <option value="3">Loan</option>
              <option value="4">Mediclaim</option>
              <option value="5">Life Insurance</option>
              <option value="6">Vehicle Insurance</option>
            </select>
          </div>
          <button type="submit">{initialData ? 'Update' : 'Add'}</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </form>
        {message && <p>{message}</p>}
      </div>
    </div>
  );
};

export default Popup;
