import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/components/DashboardFooter.css';
import { FaHeadset } from 'react-icons/fa';

const DashboardFooter = () => (
  <footer className="dashboard-footer">
    <div className="footer-content">
      <div className="footer-text">
        © {new Date().getFullYear()} Nanak Finserv. All rights reserved.
      </div>
      <div className="footer-actions">
        <Link to="/dashboard/support" className="support-btn">
          <FaHeadset className="support-icon" />
          Support
        </Link>
      </div>
    </div>
  </footer>
);

export default DashboardFooter; 