import React from 'react';
import DashboardHeader from '../components/DashboardHeader';
import DashboardFooter from '../components/DashboardFooter';
import DashboardSidebar from '../components/DashboardSidebar';
import '../../styles/layout/DashboardLayout.css';

const DashboardLayout = ({ children }) => {
  return (
    <div className="dashboard-layout">
      <DashboardHeader />
      <DashboardSidebar />
      <main className="dashboard-main">{children}</main>
      <DashboardFooter />
    </div>
  );
};

export default DashboardLayout; 