import React, { useState } from 'react';
import './popup.css';
import './popup-u.css';

const Popup = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="h-popup-overlay">
      <div className="popup-content" onClick={(e) => e.stopPropagation()}>
      <span className="close-btn" onClick={onClose}>&times;</span>
        <form className="h-popup-form">
          <div>
            <input type="text" name="name" placeholder='Name' required />
          </div>
          <div>
            <input type="text" name="number" placeholder='Number' required />
          </div>
          <div>
            <input type="email" name="mail" placeholder='Mail' required />
          </div>
          <div>
            <label>Services</label>
            <select name="services" required>
              <option value="loan">Loan</option>
              <option value="vehicle-insurance">Vehicle Insurance</option>
              <option value="mediclaim">Mediclaim</option>
              <option value="life-insurance">Life Insurance</option>
            </select>
          </div>
          <button className="btn" type="submit">Submit</button>
        </form>
      </div>
    </div>
  );
};

export default Popup;
