import React, { useState } from 'react';
import DashboardSidebar from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';
import DashboardFooter from './DashboardFooter';
import '../styles/components/DashboardLayout.css';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const DashboardLayout = ({ children, onSearch }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  const handleGlobalSearch = (query) => {
    setGlobalSearchQuery(query);
    // Pass the search query to the child component if it has an onSearch prop
    if (onSearch && typeof onSearch === 'function') {
      onSearch(query);
    }
  };

  return (
    <div className="dashboard-layout">
      <DashboardSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div className={`main-content ${!isSidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <DashboardHeader 
          toggleSidebar={toggleSidebar} 
          isSidebarOpen={isSidebarOpen}
          toggleFullScreen={toggleFullScreen}
          isFullScreen={isFullScreen}
          onSearch={handleGlobalSearch}
        />
        
        <main className="content-wrapper">
          {children}
        </main>
        
        <DashboardFooter />
      </div>
    </div>
  );
};

export default DashboardLayout;
