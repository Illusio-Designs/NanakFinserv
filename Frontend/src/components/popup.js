// src/Popup.js
import React, { useState } from 'react';
import './popup.css';

const Popup = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="popup-overlay">
      <div className="popup" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>X</button>
        <form className="popup-form">
          <div>
            <label>Name:</label>
            <input type="text" name="name" required />
          </div>
          <div>
            <label>Number:</label>
            <input type="text" name="number" required />
          </div>
          <div>
            <label>Mail:</label>
            <input type="email" name="mail" required />
          </div>
          <div>
            <label>Services:</label>
            <select name="services" required>
              <option value="loan">Loan</option>
              <option value="vehicle-insurance">Vehicle Insurance</option>
              <option value="mediclaim">Mediclaim</option>
              <option value="life-insurance">Life Insurance</option>
            </select>
          </div>
          <button type="submit">Submit</button>
        </form>
      </div>
    </div>
  );
};

export default Popup;
