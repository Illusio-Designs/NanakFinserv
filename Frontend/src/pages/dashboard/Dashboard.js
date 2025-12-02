// src/dashboard/Dashboard.js
import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import '../../styles/pages/dashboard/Dashboard.css';
import { getConsumerDashboardData } from "../../serviceAPI/userAPI";
import Cookies from 'js-cookie';

const Dashboard = () => {
  const [consumerData, setConsumerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConsumer, setIsConsumer] = useState(false);

  useEffect(() => {
    // Check if user is a consumer (role_id === 3)
    const user = Cookies.get('user') ? JSON.parse(Cookies.get('user')) : null;
    
    if (user && user.role_id === 3) {
      setIsConsumer(true);
      fetchConsumerData();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchConsumerData = async () => {
    try {
      setLoading(true);
      const response = await getConsumerDashboardData();
      if (response && response.status && response.data) {
        setConsumerData(response.data);
      }
    } catch (error) {
      console.error('Error fetching consumer dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="dashboard-container">
          <div className="row">
            <div className="col-12">
              <div className="text-center py-5">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Loading your data...</p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isConsumer && consumerData) {
    const { user, vehicles, mediclaim, loans, summary } = consumerData;
    
    return (
      <DashboardLayout>
        <div className="dashboard-container">
          <div className="row">
            <div className="col-12">
              <div className="py-4">
                <h1 className="mb-4">Welcome, {user.username}!</h1>
                <p className="lead mb-4">Here's an overview of your policies and loans.</p>
                
                {/* Summary Cards */}
                <div className="row mb-4">
                  <div className="col-md-4 mb-3">
                    <div className="card">
                      <div className="card-body">
                        <h5 className="card-title">Vehicles</h5>
                        <h2 className="text-primary">{summary.totalVehicles}</h2>
                        <p className="card-text text-muted">Total vehicle policies</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="card">
                      <div className="card-body">
                        <h5 className="card-title">Mediclaim</h5>
                        <h2 className="text-success">{summary.totalMediclaim}</h2>
                        <p className="card-text text-muted">Total mediclaim policies</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="card">
                      <div className="card-body">
                        <h5 className="card-title">Loans</h5>
                        <h2 className="text-info">{summary.totalLoans}</h2>
                        <p className="card-text text-muted">Total loan applications</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vehicles Section */}
                {vehicles && vehicles.length > 0 && (
                  <div className="card mb-4">
                    <div className="card-header">
                      <h4 className="mb-0">Vehicle Insurance Policies</h4>
                    </div>
                    <div className="card-body">
                      <div className="table-responsive">
                        <table className="table table-striped">
                          <thead>
                            <tr>
                              <th>Vehicle Number</th>
                              <th>Make & Model</th>
                              <th>Year</th>
                              <th>Policy Type</th>
                              <th>Company</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {vehicles.map((vehicle) => (
                              <tr key={vehicle.vehicle_user_id}>
                                <td>{vehicle.vehicle_number || 'N/A'}</td>
                                <td>{vehicle.make} {vehicle.model}</td>
                                <td>{vehicle.manufacturing_year || 'N/A'}</td>
                                <td>{vehicle.vehicle_policy_type || 'N/A'}</td>
                                <td>{vehicle.company_name || 'N/A'}</td>
                                <td>
                                  <span className={`badge ${vehicle.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                                    {vehicle.status || 'N/A'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mediclaim Section */}
                {mediclaim && mediclaim.length > 0 && (
                  <div className="card mb-4">
                    <div className="card-header">
                      <h4 className="mb-0">Mediclaim Policies</h4>
                    </div>
                    <div className="card-body">
                      <div className="table-responsive">
                        <table className="table table-striped">
                          <thead>
                            <tr>
                              <th>Policy Type</th>
                              <th>Mediclaim Type</th>
                              <th>Company</th>
                              <th>Sum Insured</th>
                              <th>No Claim Bonus</th>
                              <th>Agent</th>
                            </tr>
                          </thead>
                          <tbody>
                            {mediclaim.map((policy) => (
                              <tr key={policy.id}>
                                <td>{policy.medicliam_policy_type || 'N/A'}</td>
                                <td>{policy.medicliam_type || 'N/A'}</td>
                                <td>
                                  {policy.mediclaimcompany?.mediclaim_company_name || 'N/A'}
                                </td>
                                <td>₹{policy.sumInsured || '0'}</td>
                                <td>{policy.noClaimBonus || 'N/A'}</td>
                                <td>{policy.agentName || 'N/A'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Loans Section */}
                {loans && loans.length > 0 && (
                  <div className="card mb-4">
                    <div className="card-header">
                      <h4 className="mb-0">Loan Applications</h4>
                    </div>
                    <div className="card-body">
                      <div className="table-responsive">
                        <table className="table table-striped">
                          <thead>
                            <tr>
                              <th>Loan ID</th>
                              <th>Status</th>
                              <th>Loan Amount</th>
                              <th>Bank Name</th>
                              <th>Created Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {loans.map((loan) => (
                              <tr key={loan.laon_id}>
                                <td>{loan.laon_id || 'N/A'}</td>
                                <td>
                                  <span className={`badge ${
                                    loan.status === 'disbursed' ? 'bg-success' : 
                                    loan.status === 'sanctioned' ? 'bg-info' : 
                                    loan.status === 'cancelled' ? 'bg-danger' : 'bg-warning'
                                  }`}>
                                    {loan.status || 'N/A'}
                                  </span>
                                </td>
                                <td>
                                  {loan.loginLoan?.loanAmount ? `₹${loan.loginLoan.loanAmount}` : 'N/A'}
                                </td>
                                <td>{loan.loginLoan?.bankName || 'N/A'}</td>
                                <td>
                                  {loan.createdAt ? new Date(loan.createdAt).toLocaleDateString() : 'N/A'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* No Data Message */}
                {summary.totalVehicles === 0 && summary.totalMediclaim === 0 && summary.totalLoans === 0 && (
                  <div className="alert alert-info">
                    <h5>No Data Available</h5>
                    <p>You don't have any vehicles, mediclaim policies, or loans associated with your account yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Default dashboard for non-consumers
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