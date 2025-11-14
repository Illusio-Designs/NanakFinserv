import React, { useState } from 'react';
import './view-modal.css';
import { jsPDF } from 'jspdf';
const RenewalPopupDetail = ({ initialData, onClose }) => {
    console.log('🔍 View Popup - initialData:', initialData);
    console.log('🔍 View Popup - referenceName from mediclaim:', initialData?.referenceName);
    console.log('🔍 View Popup - referenceName from user:', initialData?.['user.referenceName']);
    console.log('🔍 View Popup - all keys:', Object.keys(initialData || {}));


    // const formatDate = (dateTime) => {
    //     if (!dateTime) return '';
    //     const date = new Date(dateTime);
    //     return date.toLocaleString(); // Returns a readable date and time (e.g., "12/29/2024, 4:04:55 PM")
    // }
    // const generatePDF = () => {
    //     const doc = new jsPDF();

    //     const pageMargin = 15;
    //     const pageWidth = 210;
    //     const pageHeight = 297;
    //     const lineHeight = 10;
    //     const boxPadding = 8;
    //     const headerHeight = 15;
    //     const sectionSpacing = 10;
    //     let currentY = pageMargin;

    //     // Function to handle page overflow
    //     const checkPageOverflow = (contentHeight) => {
    //         if (currentY + contentHeight > pageHeight - pageMargin) {
    //             doc.addPage();
    //             currentY = pageMargin;
    //         }
    //     };

    //     // Function to calculate section height (header + content)
    //     const calculateSectionHeight = (content) => {
    //         const contentHeight = content.length * lineHeight + boxPadding * 2; // Content height
    //         return headerHeight + 5 + contentHeight; // Total height (header + spacing + content)
    //     };

    //     // Function to draw section headers
    //     const drawHeader = (title) => {
    //         doc.setFillColor(50, 115, 220); // Gradient dark blue
    //         doc.rect(pageMargin, currentY, pageWidth - pageMargin * 2, headerHeight, 'F'); // Draw header background
    //         doc.setFont('helvetica', 'bold');
    //         doc.setFontSize(14);
    //         doc.setTextColor(255, 255, 255); // White text
    //         doc.text(title, pageWidth / 2, currentY + 10, { align: 'center' });
    //         currentY += headerHeight + 5; // Move position for content
    //     };

    //     // Function to draw content in a bordered box with light background
    //     const drawContentBox = (content) => {
    //         const contentHeight = content.length * lineHeight + boxPadding * 2;

    //         // Draw the background
    //         doc.setFillColor(240, 240, 240); // Light gray background
    //         doc.roundedRect(
    //             pageMargin,
    //             currentY,
    //             pageWidth - pageMargin * 2,
    //             contentHeight,
    //             3,
    //             3,
    //             'F'
    //         );

    //         // Draw the border
    //         doc.setDrawColor(200); // Light gray border
    //         doc.roundedRect(pageMargin, currentY, pageWidth - pageMargin * 2, contentHeight, 3, 3);

    //         // Add content
    //         let textY = currentY + boxPadding; // Starting position inside the box
    //         content.forEach(([key, value]) => {
    //             doc.setTextColor(0, 0, 0); // Black text
    //             doc.setFont('helvetica', 'bold');
    //             doc.text(`${key}:`, pageMargin + 5, textY); // Field key (bold)
    //             doc.setFont('helvetica', 'normal');
    //             doc.text(value, pageMargin + 70, textY); // Field value
    //             textY += lineHeight;
    //         });

    //         currentY += contentHeight + sectionSpacing; // Move position for the next section
    //     };

    //     // Title for the PDF
    //     doc.setFontSize(18);
    //     doc.setFont('helvetica', 'bold');
    //     doc.setTextColor(0, 0, 0);
    //     doc.text('Loan Consumer Report', pageWidth / 2, currentY, { align: 'center' });
    //     currentY += 20;

    //     // Section data with validation for empty content
    //     const sections = [
    //         {
    //             title: 'Consumer Information',
    //             content: [
    //                 ['Name', initialData?.['userConsumers.username'] || ''],
    //                 ['Email', initialData?.['userConsumers.email'] || ''],
    //                 ['Mobile', initialData?.['userConsumers.mobileNumber'] || ''],
    //             ],
    //         },
    //         {
    //             title: 'Loan Manager Information',
    //             content: [
    //                 ['Manager Name', initialData?.['userRoles.username'] || ''],
    //                 ['Manager Email', initialData?.['userRoles.email'] || ''],
    //                 ['Manager Mobile', initialData?.['userRoles.mobileNumber'] || ''],
    //             ],
    //         },
    //         {
    //             title: 'Loan Status',
    //             content: [['Status', initialData?.details?.status || '']],
    //         },
    //         {
    //             title: 'Login Details',
    //             content: initialData?.details?.login_details
    //                 ? [
    //                     ['Loan Amount', initialData.details.login_details.loanAmount || ''],
    //                     ['Loan Date', initialData.details.login_details.loanDate || ''],
    //                     ['Loan Account Number', initialData.details.login_details.loanAccountNumber || ''],
    //                     ['Bank Name', initialData.details.login_details.bankName || ''],
    //                     ['Product', initialData.details.login_details.product || ''],
    //                     ['SM Name', initialData.details.login_details.smName || ''],
    //                     ['Date of Birth', initialData.details.login_details.dateOfBirth || ''],
    //                     ['Code', initialData.details.login_details.code_name || ''],
    //                     ['Created At', formatDateTime(initialData.details.login_details?.createdAt)],
    //                     ['Updated At', formatDateTime(initialData.details.login_details?.updatedAt)],
    //                 ]
    //                 : null, // Skip if no login details
    //         },
    //         {
    //             title: 'Query Details',
    //             content: initialData?.details?.query_details?.remarks
    //                 ? [
    //                     ['Remarks', initialData.details.query_details.remarks],
    //                     ['Created At', formatDateTime(initialData.details.query_details?.createdAt)],
    //                     ['Updated At', formatDateTime(initialData.details.query_details?.updatedAt)]
    //                 ]
    //                 : null, // Skip if no remarks
    //         },
    //         {
    //             title: 'Sanction Details',
    //             content: initialData?.details?.sanction_details
    //                 ? [
    //                     ['Amount', initialData.details.sanction_details.amount || ''],
    //                     ['Rate', initialData.details.sanction_details.rate || ''],
    //                     ['Tenure', initialData.details.sanction_details.tenure || ''],
    //                     ['Created At', formatDateTime(initialData.details.sanction_details?.createdAt)],
    //                     ['Updated At', formatDateTime(initialData.details.sanction_details?.updatedAt)]
    //                 ]
    //                 : null, // Skip if no sanction details
    //         },
    //         {
    //             title: 'Part Payment Details',
    //             content: initialData?.details?.part_details?.parts
    //                 ? initialData.details.part_details.parts.map((part, index) => [
    //                     `Part ${index + 1}`,
    //                     `Amount: ${part.part_amount || ''}, Date: ${part.part_date || ''}`,
    //                 ])
    //                 : null, // Skip if no part payment details
    //         },
    //         {
    //             title: 'Disbursement Details',
    //             content: initialData?.details?.disbursement_details
    //                 ? [
    //                     ['Disbursement Amount', initialData.details.disbursement_details.disbursementAmount || ''],
    //                     ['Disbursement Rate', initialData.details.disbursement_details.disbursementRate || ''],
    //                     ['Insurance', initialData.details.disbursement_details.insurance || ''],
    //                     ['File Number', initialData.details.disbursement_details.fileNumber || ''],
    //                     ['Disbursement Date', initialData.details.disbursement_details.disbursementDate || ''],
    //                     ['Created At', formatDateTime(initialData.details.disbursement_details?.createdAt)],
    //                     ['Updated At', formatDateTime(initialData.details.disbursement_details?.updatedAt)]
    //                 ]
    //                 : null, // Skip if no disbursement details
    //         },
    //         {
    //             title: 'Property Details',
    //             content: initialData?.details?.builder_consumer_details
    //                 ? [
    //                     ['Builder Name', initialData.details?.builder_consumer_details?.builderuser?.company_name || ''],
    //                     ['Project Name', initialData.details?.builder_consumer_details?.builderuser?.unit?.unit_name || ''],
    //                     ['Project Address', initialData.details?.builder_consumer_details?.builderuser?.unit?.address || ''],
    //                     ['Wing', initialData.details?.builder_consumer_details?.wing?.wing_name || ''],
    //                     ['Floor Number', String(initialData?.details?.builder_consumer_details?.floor?.floorNumber)],
    //                     ['Office No', String(initialData.details?.builder_consumer_details?.office_no || '')],
    //                     ['Square Feet', initialData.details?.builder_consumer_details?.sqFeet || ''],
    //                     ['Deed Amount', initialData.details?.builder_consumer_details?.srNo || '']
    //                 ] :
    //                 initialData?.details?.property_details ? [
    //                     ['Address', initialData.details?.property_details?.address || ''],
    //                     ['Square Feet', initialData.details?.property_details?.sqFeet || ''],
    //                     ['Deed Amount', initialData.details?.property_details?.deedAmount || ''],
    //                 ] : null,
    //         },
    //     ];

    //     // Add sections only if content exists
    //     sections.forEach((section) => {
    //         if (section.content && section.content.length > 0) {  // Check if the section has valid content
    //             const sectionHeight = calculateSectionHeight(section.content);
    //             checkPageOverflow(sectionHeight); // Ensure the entire section fits on the page
    //             drawHeader(section.title); // Add section header
    //             drawContentBox(section.content); // Add section content
    //         }
    //     });

    //     // Save the PDF
    //     doc.save('loan-consumer-report.pdf');
    // };


    return (
        <div className="popup-overlay">
            <div className="popup-content">
                {/* Popup Header */}
                <div className="popup-header d-flex justify-content-between align-items-center">
                    <h2>View Mediclaim Details</h2>
                    <span className="close-btn" onClick={onClose}>&times;</span>
                </div>

                {/* Consumer Information Section */}
                <div className="section-header">Consumer Information</div>
                <div className="section-content">
                    <p><strong>Proposer Name:</strong> {initialData?.['user.username'] || ''}</p>
                    <p><strong>Email:</strong> {initialData?.['user.email'] || ''}</p>
                    <p><strong>Mobile:</strong> {initialData?.['user.mobileNumber'] || ''}</p>
                    <p><strong>Reference Name:</strong> {initialData?.referenceName || initialData?.['user.referenceName'] || initialData?.user?.referenceName || ''}</p>
                    <p><strong>Gender:</strong> {initialData?.gender || ''}</p>
                    <p><strong>Age:</strong> {initialData?.age || 0}</p>
                    <p><strong>Relationship With Policy Holder:</strong> {initialData?.relationshipWithPolicyHolder || ''}</p>
                </div>

                {/* Mediclaim Information */}
                <div className="section-header">Mediclaim Information</div>
                <div className="section-content">
                    <p><strong>Type Member:</strong> {initialData?.medicliam_type || ''}</p>
                    <p><strong>Policy Type:</strong> {initialData?.medicliam_policy_type || ''}</p>
                    <p><strong>Company Name:</strong> {initialData?.['mediclaimcompany.mediclaim_company_name'] || ''}</p>
                    <p><strong>Sum Insured:</strong> {initialData?.sumInsured || ''}</p>
                    <p><strong>No Claim Bonus:</strong> {initialData?.noClaimBonus || ''}</p>
                </div>

                <div className="section-header" style={{ marginBottom: '10px' }}>Running Policy Details</div>
                {/* Family Member Details (if any) */}
                {initialData?.familymembers?.length > 0 && (
                    <>
                        <div className="section-content">
                            {initialData.familymembers.map((member, index) => (
                                <>
                                    <div className="section-header-normal">Family Members {index + 1}</div>
                                    <p><strong>Gender:</strong> {member?.Gender || ''}</p>
                                    <p><strong>Age:</strong> {member?.Age || 0}</p>
                                    <p><strong>Date Of Birth:</strong> {member?.DateOfBirth || ''}</p>
                                    <p><strong>Relationship With Policy Holder:</strong> {member?.RelationshipWithPolicyHolder || ''}</p>
                                    <p><strong>Family Member Name:</strong> {member?.FamilyName || ''}</p>
                                    <p><strong>Pre Existing Illness:</strong> {member?.PreExistingIllness || 'NONE'}</p>
                                    <p><strong>Date of Joining:</strong> {member?.DateOfJoining || ''}</p>
                                </>
                            ))}
                        </div>
                    </>
                )}

                {/* Employee Details (if any) */}
                {initialData?.employees?.length > 0 && (
                    <>
                        <div className="section-header">Employee Details</div>
                        <div className="section-content">
                            {initialData.employees.map((employee, index) => (
                                <div key={index} className="employee-details">
                                    <div className="section-header-normal">Employee {index + 1}</div>
                                    <p><strong>Employee Name:</strong> {employee?.EmployeeName || ''}</p>
                                    <p><strong>Gender:</strong> {employee?.Gender || ''}</p>
                                    <p><strong>Age:</strong> {employee?.Age || 0}</p>
                                    <p><strong>Date Of Birth:</strong> {employee?.DateOfBirth || ''}</p>
                                    <p><strong>Relationship With Policy Holder:</strong> {employee?.RelationshipWithPolicyHolder || ''}</p>
                                    <p><strong>Pre Existing Illness:</strong> {employee?.PreExistingIllness || 'NONE'}</p>
                                    <p><strong>Date of Joining:</strong> {employee?.DateOfJoining || ''}</p>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Running Policy Details */}
                {initialData?.runningPolicy && (
                    <>
                        <div className="section-content">
                            <p><strong>Policy Number:</strong> {initialData.runningPolicy.PolicyNumber || ''}</p>
                            <p><strong>Zone:</strong> {initialData.runningPolicy.Zone || ''}</p>
                            <p><strong>Policy Plan Type:</strong> {initialData.runningPolicy.PolicyPlanType || ''}</p>
                            <p><strong>Policy Tenure:</strong> {initialData.runningPolicy.PolicyTenure} years</p>
                            <p><strong>Premium Amount:</strong> {initialData.runningPolicy.PremiumAmount}</p>
                            <p><strong>Policy From:</strong> {initialData.runningPolicy.PolicyFrom}</p>
                            <p><strong>Policy To:</strong> {initialData.runningPolicy.PolicyTo}</p>
                            <p><strong>Policy Issued Date:</strong> {initialData.runningPolicy.PolicyIssuedDate}</p>
                            <p><strong>Expiry Date:</strong> {initialData.runningPolicy.ExpiryDate}</p>
                            <p><strong>Additional Sum Insured:</strong> {initialData.runningPolicy.AdditionalSumInsured}</p>
                            <p><strong>Add On Cover:</strong> {initialData.runningPolicy.AddOnCover}</p>
                            <p><strong>Nominee Name:</strong> {initialData.runningPolicy.NomineeName}</p>
                            <p><strong>Nominee Relation:</strong> {initialData.runningPolicy.NomineeRelation}</p>
                            <p><strong>Nominee Age:</strong> {initialData.runningPolicy.NomineeAge}</p>
                            <p><strong>Nominee DOB:</strong> {initialData.runningPolicy.NomineeDob}</p>
                        </div>
                    </>
                )}

                {/* Previous Policy (Active) */}
                {initialData?.previousPolicy?.status === 'active' && (
                    <>
                        <div className="section-header">Previous Policy (Active)</div>
                        <div className="section-content">
                            <p><strong>Policy Number:</strong> {initialData.previousPolicy.PolicyNumber || ''}</p>
                            <p><strong>Zone:</strong> {initialData.previousPolicy.Zone || ''}</p>
                            <p><strong>Company Name:</strong> {initialData.previousPolicy.CompanyName || ''}</p>
                            <p><strong>Previous Policy Number:</strong> {initialData.previousPolicy.PreviousPolicyNumber || ''}</p>
                            <p><strong>Policy Tenure:</strong> {initialData.previousPolicy.PolicyTenure} years</p>
                            <p><strong>Premium Amount:</strong> {initialData.previousPolicy.PremiumAmount}</p>
                            <p><strong>Policy From:</strong> {initialData.previousPolicy.PolicyFrom}</p>
                            <p><strong>Policy To:</strong> {initialData.previousPolicy.PolicyTo}</p>
                            <p><strong>Renew Date:</strong> {initialData.previousPolicy.RenewDate}</p>
                            <p><strong>Nominee Name:</strong> {initialData.previousPolicy.NomineeName}</p>
                            <p><strong>Nominee Relation:</strong> {initialData.previousPolicy.NomineeRelation}</p>
                            <p><strong>Nominee Age:</strong> {initialData.previousPolicy.NomineeAge}</p>
                            <p><strong>Nominee DOB:</strong> {initialData.previousPolicy.NomineeDob}</p>
                        </div>
                    </>
                )}

                {initialData?.previousHistory?.length > 0 && (
                    <>
                        <div className="section-header">Previous Policy History</div>
                        <div className="section-content">
                            {initialData.previousHistory
                                .filter(policy => policy.status !== 'active') // Exclude active policies
                                .map((policy, index) => (
                                    <>
                                        <div className="section-header-normal">Policy {index + 1} Date: {policy?.createdAt && policy?.createdAt.slice(0,10)}</div>
                                        <div key={index} className="policy-history-item">
                                            <p><strong>Policy Number:</strong> {policy.PolicyNumber}</p>
                                            <p><strong>Zone:</strong> {policy.Zone || ''}</p>
                                            <p><strong>Company Name:</strong> {policy.CompanyName}</p>
                                            <p><strong>Previous Policy Number:</strong> {policy.PreviousPolicyNumber}</p>
                                            <p><strong>Policy Tenure:</strong> {policy.PolicyTenure} years</p>
                                            <p><strong>Premium Amount:</strong> {policy.PremiumAmount}</p>
                                            <p><strong>Policy From:</strong> {policy.PolicyFrom}</p>
                                            <p><strong>Policy To:</strong> {policy.PolicyTo}</p>
                                            <p><strong>Renew Date:</strong> {policy.RenewDate}</p>
                                            <p><strong>Nominee Name:</strong> {policy.NomineeName}</p>
                                            <p><strong>Nominee Relation:</strong> {policy.NomineeRelation}</p>
                                            <p><strong>Nominee Age:</strong> {policy.NomineeAge}</p>
                                            <p><strong>Nominee DOB:</strong> {policy.NomineeDob}</p>
                                        </div>
                                    </>
                                ))}
                        </div>
                    </>
                )}

                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <button className="btn btn-green" onClick={onClose}>Close</button>
                </div>

            </div>
        </div>
    );
};

export default RenewalPopupDetail;
