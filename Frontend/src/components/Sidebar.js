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
          <p>Nanak Finserv</p>
        </div>
        <div className='side-menu'>
          <a href="/dashboard" className='btn'>Dashboard</a>
          <a href="/consumer" className='btn'>Consumer</a>
          <a href="/builder" className='btn'>Builder</a>
          <a href="/lms" className='btn'>LMS</a>
          <a href="/loan" className='btn'>Loan</a>
          <a href="/mediclaim" className='btn'>Mediclaim</a>
          <a href="/lifeinsurance" className='btn'>Life Insurance</a>
          <a href="/vehicleinsurance" className='btn'>Vehicle Insurance</a>
          <a href="/user" className='btn'>Role Manager</a>
          <a href="/table" className='btn'>Table</a>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
