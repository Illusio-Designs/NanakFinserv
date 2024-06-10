import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ directories }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(true);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div>
      <div className="sidebar">
        <div className='head'>
          <img src='./Assets/logo.png' />
          <h1>Nanak Finserv</h1>
        </div>
        <div className='side-menu'>
          <a href="/dashboard" className='btn'>Dashboard</a>
          <div className="dropdown">
            <button className="btn dropdown-toggle" onClick={toggleDropdown}>
              Registration 
            </button>
            {isDropdownOpen && (
              <div className="dropdown-content">
                <a href="/consumer">Consumer</a>
                <a href="/builder">Builder</a>
              </div>
            )}
          </div>
          <a href="/lms" className='btn'>LMS</a>
          <a href="/loan" className='btn'>Loan</a>
          <a href="/mediclaim" className='btn'>Mediclaim</a>
          <a href="/lifeinsurance" className='btn'>Life Insurance</a>
          <a href="/vehicleinsurance" className='btn'>Vehicle Insurance</a>
          <a href="/user" className='btn'>User</a>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
