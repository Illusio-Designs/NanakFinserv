import React from 'react';
import './popup.css';

const VehicleRenewalDetailsPopup = ({ data, onClose }) => {
    if (!data) return null;

    const DetailRow = ({ label, value }) => (
        <div className="popup-detail-row">
            <div className="popup-detail-label">{label}:</div>
            <div className="popup-detail-value">{value || ''}</div>
        </div>
    );

    const previousPolicy = data.previousPolicy || {};
    const runningPolicy = data.runningPolicy || {};
    const vehicle = data.vehicle || {};
    const user = data.user_pk_vehicle_id || {};

    return (
        <div className="popup-overlay" onClick={onClose}>
            <div className="popup-container view-details-popup vehicle-popup-scrollable" onClick={e => e.stopPropagation()}>
                <div className="popup-header">
                    <h3>View Vehicle Details</h3>
                    <button onClick={onClose} className="popup-close-btn">&times;</button>
                </div>
                <div className="popup-body">
                    <div className="popup-section">
                        <div className="popup-section-header">Consumer Information</div>
                        <div className="popup-section-content single-column">
                            <DetailRow label="Name" value={user.username} />
                            <DetailRow label="Email" value={user.email} />
                            <DetailRow label="Mobile" value={user.mobileNumber} />
                        </div>
                    </div>

                    <div className="popup-section">
                        <div className="popup-section-header">Vehicle Information</div>
                        <div className="popup-section-content single-column">
                            <DetailRow label="Policy Type" value={data.vehicle_policy_type} />
                            <DetailRow label="Company Name" value={data.company_name} />
                            <DetailRow label="Contact Person Name" value={data.contact_person_name} />
                            <DetailRow label="Contact Person Mobile Number" value={data.contact_person_no} />
                            <DetailRow label="Vehicle Number" value={data.vehicle_number} />
                            <DetailRow label="Make" value={data.make} />
                            <DetailRow label="Model" value={data.model} />
                            <DetailRow label="Chassis Number" value={data.chassis_number} />
                        </div>
                    </div>

                    <div className="popup-section">
                        <div className="popup-section-header">Running Policy Details</div>
                        <div className="popup-section-content single-column">
                            <DetailRow label="Policy Number" value={runningPolicy.PolicyNumber} />
                            <DetailRow label="Policy Tenure" value={runningPolicy.PolicyTenure} />
                            <DetailRow label="Premium Amount" value={runningPolicy.PremiumAmount} />
                            <DetailRow label="Policy From" value={runningPolicy.PolicyFrom ? new Date(runningPolicy.PolicyFrom).toLocaleDateString('en-GB') : ''} />
                            <DetailRow label="Policy To" value={runningPolicy.PolicyTo ? new Date(runningPolicy.PolicyTo).toLocaleDateString('en-GB') : ''} />
                            <DetailRow label="Policy Issued Date" value={runningPolicy.PolicyIssuedDate ? new Date(runningPolicy.PolicyIssuedDate).toLocaleDateString('en-GB') : ''} />
                            <DetailRow label="Expiry Date" value={runningPolicy.ExpiryDate ? new Date(runningPolicy.ExpiryDate).toLocaleDateString('en-GB') : ''} />
                            <DetailRow label="Nominee Name" value={runningPolicy.NomineeName} />
                            <DetailRow label="Nominee Relation" value={runningPolicy.NomineeRelation} />
                            <DetailRow label="Nominee Age" value={runningPolicy.NomineeAge} />
                            <DetailRow label="Nominee DOB" value={runningPolicy.NomineeDob ? new Date(runningPolicy.NomineeDob).toLocaleDateString('en-GB') : ''} />
                        </div>
                    </div>
                </div>
                <div className="popup-footer">
                    <button onClick={onClose} className="btn btn-primary">Close</button>
                </div>
            </div>
        </div>
    );
};

export default VehicleRenewalDetailsPopup;