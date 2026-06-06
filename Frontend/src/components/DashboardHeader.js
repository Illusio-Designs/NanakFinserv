import { ROLE_IDS } from "../config/ids";
// Header.js
import React, { useState, useEffect } from 'react';
import { FaSearch, FaBell, FaUser, FaSignOutAlt, FaExpand, FaCompress, FaBars } from 'react-icons/fa';
import '../styles/components/DashboardHeader.css';
import Cookies from 'js-cookie';
import NotificationCenter from './NotificationCenter';

const DashboardHeader = ({ toggleSidebar, isSidebarOpen, toggleFullScreen, isFullScreen, onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfilePopup, setShowProfilePopup] = useState(false);

  const user = Cookies.get('user') ? JSON.parse(Cookies.get('user')) : null;

  // Handle search input changes
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // If onSearch callback is provided, call it with the search query
    if (onSearch && typeof onSearch === 'function') {
      onSearch(query);
    }
  };

  const handleLogout = () => {
    Cookies.remove('token');
    Cookies.remove('user');
    Cookies.remove('category');
    window.location.href = '/login';
  };

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <button 
          className="sidebar-toggle-btn-header" 
          onClick={toggleSidebar}
          aria-label="Toggle Sidebar"
        >
          <FaBars />
        </button>
        
        <div className="search-container">
          <form className="search-form">
            <FaSearch className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </form>
        </div>
      </div>

      <div className="header-right">
        <div className="header-actions">
          {/* Notification Center Component */}
          <NotificationCenter />
          
          <button className="action-btn" onClick={toggleFullScreen}>
            {isFullScreen ? <FaCompress /> : <FaExpand />}
          </button>
        </div>

        <div className="header-profile" onClick={() => setShowProfilePopup(!showProfilePopup)}>
          <div className="profile-image">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="profile-info">
            <div className="profile-name">{user?.name || 'User'}</div>
            <div className="profile-role">{user?.role_id === ROLE_IDS.SUPER_ADMIN ? 'Admin' : 'User'}</div>
          </div>
        </div>

        {showProfilePopup && (
          <div className="profile-popup">
            <div className="popup-header">
              <div className="popup-avatar">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="popup-user-info">
                <h4>{user?.name || 'User'}</h4>
                <p>{user?.role_id === ROLE_IDS.SUPER_ADMIN ? 'Administrator' : 'User'}</p>
              </div>
            </div>
            <div className="popup-actions">
              <button className="popup-action-btn" onClick={handleLogout}>
                <FaSignOutAlt />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default DashboardHeader;
