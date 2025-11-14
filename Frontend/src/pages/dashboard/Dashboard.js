// src/dashboard/Dashboard.js
import React from "react";
import DashboardLayout from "../../components/DashboardLayout";
import '../../styles/pages/dashboard/Dashboard.css';

const Dashboard = () => {
  return (
    <DashboardLayout>
      <div className="dashboard-container">
        <div className="row">
          <div className="col-12">
            <div className="text-center py-5">
              <h1 className="mb-4">Welcome to Nanak Finserv Dashboard</h1>
              <p className="lead">Navigate through the sidebar to access different modules.</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;