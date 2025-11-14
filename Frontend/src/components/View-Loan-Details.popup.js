import React, { useState } from 'react';
import './view-modal.css';
import { jsPDF } from 'jspdf';
const PopupModal = ({ initialData, onClose }) => {

    // Debug logging for disbursement details
    console.log('🔍 [VIEW POPUP] initialData:', initialData);
    console.log('🔍 [VIEW POPUP] details:', initialData?.details);
    console.log('🔍 [VIEW POPUP] disbursement_details:', initialData?.details?.disbursement_details);
    console.log('🔍 [VIEW POPUP] remarks:', initialData?.details?.remarks);

    // Helper function to parse and format remarks data
    const parseAndFormatRemarks = (remarks) => {
        if (!remarks || typeof remarks !== 'string') {
            return [];
        }
        
        try {
            const parsedRemarks = JSON.parse(remarks);
            let remarksText = '';
            
            Object.entries(parsedRemarks).forEach(([key, value]) => {
                if (typeof value === 'object' && value !== null) {
                    // Look for remarks fields in nested objects
                    if (value.remark_dis) {
                        remarksText = value.remark_dis;
                    } else if (value.remarks) {
                        remarksText = value.remarks;
                    } else if (value.remarks_loan) {
                        remarksText = value.remarks_loan;
                    }
                }
            });
            
            if (remarksText) {
                return [['Remarks', remarksText]];
            } else {
                return [['Remarks', 'No remarks available']];
            }
        } catch (error) {
            // If parsing fails, return the original remarks as a single item
            return [['Remarks', remarks]];
        }
    };

    // Robust extractor for a single Remarks string from many possible locations
    const extractRemarks = (data) => {
        if (!data) return '';
        // 1) direct string on details.remarks
        if (typeof data.remarks === 'string' && data.remarks.trim()) {
            try {
                // try parse JSON string and pull inner remark fields
                const parsed = JSON.parse(data.remarks);
                const fromParsed =
                    parsed?.disbursement_details?.remark_dis ||
                    parsed?.login_details?.remarks_loan ||
                    parsed?.document_details?.remarks_docs ||
                    parsed?.query_details?.remarks ||
                    parsed?.cancel_details?.remarks_cancel || '';
                return fromParsed || data.remarks;
            } catch (_) {
                return data.remarks;
            }
        }
        // 2) nested objects (preferred explicit sources)
        if (data.cancel_details?.remarks_cancel) return data.cancel_details.remarks_cancel;
        if (data.query_details?.remarks) return data.query_details.remarks;
        if (data.disbursement_details?.remark_dis) return data.disbursement_details.remark_dis;
        if (data.login_details?.remarks_loan) return data.login_details.remarks_loan;
        if (data.document_details?.remarks_docs) return data.document_details.remarks_docs;
        // 3) sometimes API may return different shape at root level
        if (typeof data.remarks === 'object' && data.remarks !== null) {
            const obj = data.remarks;
            return obj.remark_dis || obj.remarks_loan || obj.remarks_docs || obj.remarks || '';
        }
        return '';
    };

    const formatDateTime = (dateTime) => {
        if (!dateTime) return '';
        const date = new Date(dateTime);
        return date.toLocaleDateString(); // Returns only date (e.g., "08/03/2025")
    }
    const generatePDF = () => {
        const doc = new jsPDF();

        const pageMargin = 15;
        const pageWidth = 210;
        const pageHeight = 297;
        const lineHeight = 10;
        const boxPadding = 8;
        const headerHeight = 15;
        const sectionSpacing = 10;
        let currentY = pageMargin;

        // Function to handle page overflow
        const checkPageOverflow = (contentHeight) => {
            if (currentY + contentHeight > pageHeight - pageMargin) {
                doc.addPage();
                currentY = pageMargin;
            }
        };

        // Function to calculate section height (header + content)
        const calculateSectionHeight = (content) => {
            const contentHeight = content.length * lineHeight + boxPadding * 2; // Content height
            return headerHeight + 5 + contentHeight; // Total height (header + spacing + content)
        };

        // Function to draw section headers
        const drawHeader = (title) => {
            doc.setFillColor(50, 115, 220); // Gradient dark blue
            doc.rect(pageMargin, currentY, pageWidth - pageMargin * 2, headerHeight, 'F'); // Draw header background
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.setTextColor(255, 255, 255); // White text
            doc.text(title, pageWidth / 2, currentY + 10, { align: 'center' });
            currentY += headerHeight + 5; // Move position for content
        };

        // Function to draw content in a bordered box with light background
        const drawContentBox = (content) => {
            const contentHeight = content.length * lineHeight + boxPadding * 2;

            // Draw the background
            doc.setFillColor(240, 240, 240); // Light gray background
            doc.roundedRect(
                pageMargin,
                currentY,
                pageWidth - pageMargin * 2,
                contentHeight,
                3,
                3,
                'F'
            );

            // Draw the border
            doc.setDrawColor(200); // Light gray border
            doc.roundedRect(pageMargin, currentY, pageWidth - pageMargin * 2, contentHeight, 3, 3);

            // Add content
            let textY = currentY + boxPadding; // Starting position inside the box
            content.forEach(([key, value]) => {
                doc.setTextColor(0, 0, 0); // Black text
                doc.setFont('helvetica', 'bold');
                doc.text(`${key}:`, pageMargin + 5, textY); // Field key (bold)
                doc.setFont('helvetica', 'normal');
                doc.text(value, pageMargin + 70, textY); // Field value
                textY += lineHeight;
            });

            currentY += contentHeight + sectionSpacing; // Move position for the next section
        };

        // Title for the PDF
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Loan Consumer Report', pageWidth / 2, currentY, { align: 'center' });
        currentY += 20;

        // Section data with validation for empty content
        const sections = [
            {
                title: 'Consumer Information',
                content: [
                    ['Name', initialData?.['userConsumers.username'] || ''],
                    ['Email', initialData?.['userConsumers.email'] || ''],
                    ['Mobile', initialData?.['userConsumers.mobileNumber'] || ''],
                    ['Reference Name', initialData?.['userConsumers.referenceName'] || initialData?.details?.referenceName || ''],
                ],
            },
            {
                title: 'Loan Manager Information',
                content: [
                    ['Manager Name', initialData?.['userRoles.username'] || ''],
                    ['Manager Email', initialData?.['userRoles.email'] || ''],
                    ['Manager Mobile', initialData?.['userRoles.mobileNumber'] || ''],
                ],
            },
            {
                title: 'Loan Status',
                content: [
                    ['Status', initialData?.details?.status || ''],
                    // Parse remarks for better PDF display
                    ...parseAndFormatRemarks(initialData?.details?.remarks),
                    ['Created At', formatDateTime(initialData?.details?.createdAt)],
                    ['Updated At', formatDateTime(initialData?.details?.updatedAt)]
                ],
            },
            {
                title: 'Login Details',
                content: initialData?.details?.login_details
                    ? [
                        ['Loan Amount', initialData.details.login_details.loanAmount || ''],
                        ['Loan Date', initialData.details.login_details.loanDate || ''],
                        ['Loan Account Number', initialData.details.login_details.loanAccountNumber || ''],
                        ['Bank Name', initialData.details.login_details.bankName || ''],
                        ['Product', initialData.details.login_details.product || ''],
                        ['SM Name', initialData.details.login_details.smName || ''],
                        ['AM Name', initialData.details.login_details.amName || ''],
                        ['Remarks', initialData.details.login_details.remarks_loan || ''],
                        ['Bank Code', initialData.details.login_details.bankCode || ''],
                        ['Date of Birth', initialData.details.login_details.dateOfBirth || ''],
                        ['Code', initialData.details.login_details.code_name || ''],
                        ['Created At', formatDateTime(initialData.details.login_details?.createdAt)],
                        ['Updated At', formatDateTime(initialData.details.login_details?.updatedAt)],
                    ]
                    : null, // Skip if no login details
            },
            {
                title: 'Query Details',
                content: initialData?.details?.query_details?.remarks
                    ? [
                        ['Remarks', initialData.details.query_details.remarks],
                        ['Created At', formatDateTime(initialData.details.query_details?.createdAt)],
                        ['Updated At', formatDateTime(initialData.details.query_details?.updatedAt)]
                    ]
                    : null, // Skip if no remarks
            },
            {
                title: 'Cancel Details',
                content: initialData?.details?.cancel_details?.remarks
                    ? [
                        ['Remarks', initialData.details.cancel_details.remarks_cancel],
                        ['Created At', formatDateTime(initialData.details.cancel_details?.createdAt)],
                        ['Updated At', formatDateTime(initialData.details.cancel_details?.updatedAt)]
                    ]
                    : null, // Skip if no remarks
            },
            {
                title: 'Sanction Details',
                content: initialData?.details?.sanction_details
                    ? [
                        ['Amount', initialData.details.sanction_details.amount || ''],
                        ['Rate', initialData.details.sanction_details.rate || ''],
                        ['Tenure', initialData.details.sanction_details.tenure || ''],
                        ['Sanction Date', initialData.details?.sanction_details?.sanctionDate || ''],
                        ['Created At', formatDateTime(initialData.details.sanction_details?.createdAt)],
                        ['Updated At', formatDateTime(initialData.details.sanction_details?.updatedAt)]
                    ]
                    : null, // Skip if no sanction details
            },
            {
                title: 'Part Payment Details',
                content: initialData?.details?.part_details?.parts
                    ? initialData.details.part_details.parts.map((part, index) => [
                        `Part ${index + 1}`,
                        `Amount: ${part.part_amount || ''}, Date: ${part.part_date || ''}`,
                    ])
                    : null, // Skip if no part payment details
            },
            {
                title: 'Pickup Details',
                content: initialData?.details?.pickup_details
                    ? [
                        ['Pickup Date', initialData.details.pickup_details.pickupDate || ''],
                        ['Pickup Remarks', initialData.details.pickup_details.pickupRemarks || ''],
                        ['Created At', formatDateTime(initialData.details.pickup_details?.createdAt)],
                        ['Updated At', formatDateTime(initialData.details.pickup_details?.updatedAt)]
                    ]
                    : null, // Skip if no pickup details
            },
            {
                title: 'Document Details',
                content: initialData?.details?.document_details
                    ? [
                        ['Loan Type', initialData.details.document_details.loan_type_name || ''],
                        ['Document Remarks', initialData.details.document_details.remarks_docs || ''],
                        ['Created At', formatDateTime(initialData.details.document_details?.createdAt)],
                        ['Updated At', formatDateTime(initialData.details.document_details?.updatedAt)]
                    ]
                    : null, // Skip if no document details
            },
            {
                title: 'Completed Details',
                content: initialData?.details?.completed_details
                    ? [
                        ['Completion Date', initialData.details.completed_details.completionDate || ''],
                        ['Completion Remarks', initialData.details.completed_details.completionRemarks || ''],
                        ['Created At', formatDateTime(initialData.details.completed_details?.createdAt)],
                        ['Updated At', formatDateTime(initialData.details.completed_details?.updatedAt)]
                    ]
                    : null, // Skip if no completed details
            },
            {
                title: 'Disbursement Details',
                content: (() => {
                    // First try to get from main details
                    if (initialData?.details?.disbursement_details) {
                        return [
                            ['Disbursement Amount', initialData.details.disbursement_details.disbursementAmount || ''],
                            ['Disbursement Rate', initialData.details.disbursement_details.disbursementRate || ''],
                            ['Insurance', initialData.details.disbursement_details.insurance || ''],
                            ['File Number', initialData.details.disbursement_details.fileNumber || ''],
                            ['Disbursement Date', initialData.details.disbursement_details.disbursementDate ? new Date(initialData.details.disbursement_details.disbursementDate).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                            }) : ''],
                            ['Remark', initialData.details.disbursement_details.remark_dis || ''],
                            ['Created At', formatDateTime(initialData.details.disbursement_details?.createdAt)],
                            ['Updated At', formatDateTime(initialData.details.disbursement_details?.updatedAt)]
                        ];
                    }
                    // Fallback: try to parse from remarks
                    else if (initialData?.details?.remarks) {
                        try {
                            const parsedRemarks = JSON.parse(initialData.details.remarks);
                            if (parsedRemarks.disbursement_details) {
                                return [
                                    ['Disbursement Amount', parsedRemarks.disbursement_details.disbursementAmount || ''],
                                    ['Disbursement Rate', parsedRemarks.disbursement_details.disbursementRate || ''],
                                    ['Insurance', parsedRemarks.disbursement_details.insurance || ''],
                                    ['File Number', parsedRemarks.disbursement_details.fileNumber || ''],
                                    ['Disbursement Date', parsedRemarks.disbursement_details.disbursementDate ? new Date(parsedRemarks.disbursement_details.disbursementDate).toLocaleDateString('en-GB', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric'
                                    }) : ''],
                                    ['Remark', parsedRemarks.disbursement_details.remark_dis || ''],
                                    ['Insurance Amount', parsedRemarks.disbursement_details.insuranceAmount || ''],
                                    ['Insurance Bank Name', parsedRemarks.disbursement_details.insuranceBankName || ''],
                                    ['Insurance Type', parsedRemarks.disbursement_details.insuranceType || ''],
                                    ['Updated At', parsedRemarks.disbursement_details.updated_at ? new Date(parsedRemarks.disbursement_details.updated_at).toLocaleDateString('en-GB', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric'
                                    }) : '']
                                ];
                            }
                        } catch (error) {
                            console.log('🔍 [PDF] Error parsing remarks for disbursement details:', error);
                        }
                    }
                    return null; // No disbursement details available
                })()
            },
            {
                title: 'Property Details',
                content: initialData?.details?.builder_consumer_details
                    ? [
                        ['Builder Name', initialData.details?.builder_consumer_details?.builderuser?.company_name || ''],
                        ['Project Name', initialData.details?.builder_consumer_details?.builderuser?.unit?.unit_name || ''],
                        ['Project Address', initialData.details?.builder_consumer_details?.builderuser?.unit?.address || ''],
                        ['Wing', initialData.details?.builder_consumer_details?.wing?.wing_name || ''],
                        ['Floor Number', String(initialData?.details?.builder_consumer_details?.floor?.floorNumber)],
                        ['Office No', String(initialData.details?.builder_consumer_details?.office_no || '')],
                        ['Square Feet', initialData.details?.builder_consumer_details?.sqFeet || ''],
                        ['Deed Amount', initialData.details?.builder_consumer_details?.srNo || '']
                    ] :
                    initialData?.details?.property_details ? [
                        ['Address', initialData.details?.property_details?.address || ''],
                        ['Square Feet', initialData.details?.property_details?.sqFeet || ''],
                        ['Deed Amount', initialData.details?.property_details?.deedAmount || ''],
                    ] : null,
            },
        ];

        // Add sections only if content exists
        sections.forEach((section) => {
            if (section.content && section.content.length > 0) {  // Check if the section has valid content
                const sectionHeight = calculateSectionHeight(section.content);
                checkPageOverflow(sectionHeight); // Ensure the entire section fits on the page
                drawHeader(section.title); // Add section header
                drawContentBox(section.content); // Add section content
            }
        });

        // Save the PDF
        doc.save('loan-consumer-report.pdf');
    };


    return (
        <div className="popup-overlay">
            <div className="popup-content">
                {/* Popup Header */}
                <div className="popup-header d-flex justify-content-between align-items-center">
                    <h2>{initialData ? 'View Loan Details' : 'Add Loan Consumer'}</h2>
                    <span className="close-btn" onClick={onClose}>&times;</span>
                </div>

                {/* Consumer Information Section */}
                <div className="section-header">Consumer Information</div>
                <div className="section-content">
                    <p><strong>Name:</strong> {initialData?.['userConsumers.username'] || ''}</p>
                    <p><strong>Email:</strong> {initialData?.['userConsumers.email'] || ''}</p>
                    <p><strong>Mobile:</strong> {initialData?.['userConsumers.mobileNumber'] || ''}</p>
                    <p><strong>Reference Name:</strong> {initialData?.['userConsumers.referenceName'] || initialData?.details?.referenceName || ''}</p>
                </div>

                {/* Loan Manager Information Section */}
                <div className="section-header">Loan Manager Information</div>
                <div className="section-content">
                    <p><strong>Manager Name:</strong> {initialData?.['userRoles.username'] || ''}</p>
                    <p><strong>Manager Email:</strong> {initialData?.['userRoles.email'] || ''}</p>
                    <p><strong>Manager Mobile:</strong> {initialData?.['userRoles.mobileNumber'] || ''}</p>
                </div>

                {/* Loan Details Section */}
                <div className="section-header">Loan Status</div>
                <div className="section-content">
                    <p><strong>Status:</strong> <span style={{ color: 'red', fontWeight: 'bold' }}>{(initialData?.details?.status || initialData?.status || '').toString().toUpperCase()}</span></p>
                    {/* Robust Remarks resolution across shapes */}
                    {(() => {
                        const resolved = extractRemarks(initialData?.details || initialData);
                        return <p><strong>Remarks:</strong> {resolved || 'No remarks available'}</p>;
                    })()}
                    {initialData?.details?.updatedAt ? (
                        <p><strong>Updated At:</strong> {formatDateTime(initialData.details.updatedAt)}</p>
                    ) : initialData?.details?.createdAt ? (
                        <p><strong>Created At:</strong> {formatDateTime(initialData.details.createdAt)}</p>
                    ) : null}
                </div>

                {initialData?.details?.login_details && <>
                    <div className="section-header">Login Details</div>
                    <div className="section-content">
                        <p><strong>Loan Amount:</strong> {initialData?.details?.login_details?.loanAmount || ''}</p>
                        <p><strong>Loan Date:</strong> {initialData?.details?.login_details?.loanDate || ''}</p>
                        <p><strong>Loan Account Number:</strong> {initialData?.details?.login_details?.loanAccountNumber || ''}</p>
                        <p><strong>Bank Name:</strong> {initialData?.details?.login_details?.bankName || ''}</p>
                        <p><strong>Product:</strong> {initialData?.details?.login_details?.product || ''}</p>
                        <p><strong>SM Name:</strong> {initialData?.details?.login_details?.smName || ''}</p>
                        <p><strong>AM Name:</strong> {initialData?.details?.login_details?.amName || ''}</p>
                        <p><strong>Remarks:</strong> {initialData?.details?.login_details?.remarks_loan || ''}</p>
                        <p><strong>Bank Code:</strong> {initialData?.details?.login_details?.bankCode || ''}</p>
                        <p><strong>Date of Birth:</strong> {initialData?.details?.login_details?.dateOfBirth || ''}</p>
                        <p><strong>Code:</strong> {initialData?.details?.login_details?.code_name || ''}</p>
                        <p><strong>Created At:</strong> {formatDateTime(initialData.details.login_details?.createdAt)}</p>
                        <p><strong>Updated At:</strong> {formatDateTime(initialData.details.login_details?.createdAt)}</p>
                    </div>
                </>}

                {initialData?.details?.query_details && <>
                    <div className="section-header">Query Details</div>
                    <div className="section-content">
                        <p><strong>Remarks:</strong> {initialData?.details?.query_details?.remarks || ''}</p>
                        <p><strong>Created At:</strong> {formatDateTime(initialData.details.query_details?.createdAt)}</p>
                        <p><strong>Updated At:</strong> {formatDateTime(initialData.details.query_details?.createdAt)}</p>
                    </div>
                </>}

                {initialData?.details?.cancel_details && <>
                    <div className="section-header">Cancel Details</div>
                    <div className="section-content">
                        <p><strong>Remarks:</strong> {initialData?.details?.cancel_details?.remarks_cancel || ''}</p>
                        <p><strong>Created At:</strong> {formatDateTime(initialData.details.cancel_details?.createdAt)}</p>
                        <p><strong>Updated At:</strong> {formatDateTime(initialData.details.cancel_details?.createdAt)}</p>
                    </div>
                </>}

                {initialData?.details?.sanction_details && <>
                    <div className="section-header">Sanction Details</div>
                    <div className="section-content">
                        <p><strong>Amount:</strong> {initialData?.details?.sanction_details?.amount || ''}</p>
                        <p><strong>Rate:</strong> {initialData?.details?.sanction_details?.rate || ''}</p>
                        <p><strong>Tenure:</strong> {initialData?.details?.sanction_details?.tenure || ''}</p>
                        <p><strong>Sanction Date:</strong> {initialData?.details?.sanction_details?.sanctionDate || ''}</p>
                        <p><strong>Created At:</strong> {formatDateTime(initialData.details.sanction_details?.createdAt)}</p>
                        <p><strong>Updated At:</strong> {formatDateTime(initialData.details.sanction_details?.createdAt)}</p>
                    </div>
                </>}

                {initialData?.details?.part_details && initialData?.details?.part_details?.parts && <>
                    <div className="section-header">Part Details</div>
                    <div className="section-content">
                        {initialData?.details?.part_details?.parts?.length > 0 ? (
                            initialData.details.part_details.parts.map((part, index) => (
                                <div key={index}>
                                    <p><strong>Part {part.part_number}:</strong> Amount: {part.part_amount}, Date: {part.part_date}</p>
                                    {/* Truncate Created At and Updated At */}
                                    <p><strong>Created At:</strong> {formatDateTime(part?.createdAt)}, <strong>Updated At:</strong> {formatDateTime(part?.updatedAt)}</p>
                                </div>
                            ))
                        ) : (
                            <p>No part details available.</p>
                        )}
                    </div>
                </>}

                {initialData?.details?.pickup_details && <>
                    <div className="section-header">Pickup Details</div>
                    <div className="section-content">
                        <p><strong>Pickup Date:</strong> {initialData?.details?.pickup_details?.pickupDate || ''}</p>
                        <p><strong>Pickup Remarks:</strong> {initialData?.details?.pickup_details?.pickupRemarks || ''}</p>
                        <p><strong>Created At:</strong> {formatDateTime(initialData.details.pickup_details?.createdAt)}</p>
                        <p><strong>Updated At:</strong> {formatDateTime(initialData.details.pickup_details?.updatedAt)}</p>
                    </div>
                </>}

                {initialData?.details?.document_details && <>
                    <div className="section-header">Document Details</div>
                    <div className="section-content">
                        <p><strong>Loan Type:</strong> {initialData?.details?.document_details?.loan_type_name || ''}</p>
                        <p><strong>Document Remarks:</strong> {initialData?.details?.document_details?.remarks_docs || ''}</p>
                        <p><strong>Created At:</strong> {formatDateTime(initialData.details.document_details?.createdAt)}</p>
                        <p><strong>Updated At:</strong> {formatDateTime(initialData.details.document_details?.updatedAt)}</p>
                    </div>
                </>}

                {initialData?.details?.completed_details && <>
                    <div className="section-header">Completed Details</div>
                    <div className="section-content">
                        <p><strong>Completion Date:</strong> {initialData?.details?.completed_details?.completionDate || ''}</p>
                        <p><strong>Completion Remarks:</strong> {initialData?.details?.completed_details?.completionRemarks || ''}</p>
                        <p><strong>Created At:</strong> {formatDateTime(initialData.details.completed_details?.createdAt)}</p>
                        <p><strong>Updated At:</strong> {formatDateTime(initialData.details.completed_details?.updatedAt)}</p>
                    </div>
                </>}

                {initialData?.details?.disbursement_details && <>
                    <div className="section-header">Disbursement Details</div>
                    <div className="section-content">
                        {console.log('🔍 [VIEW POPUP] Rendering disbursement details section with data:', initialData?.details?.disbursement_details)}
                        <p><strong>Disbursement Amount:</strong> {initialData?.details?.disbursement_details?.disbursementAmount || ''}</p>
                        <p><strong>Disbursement Rate:</strong> {initialData?.details?.disbursement_details?.disbursementRate || ''}</p>
                        <p><strong>Insurance:</strong> {initialData?.details?.disbursement_details?.insurance || ''}</p>
                        <p><strong>File Number:</strong> {initialData?.details?.disbursement_details?.fileNumber || ''}</p>
                        <p><strong>Disbursement Date:</strong> {initialData?.details?.disbursement_details?.disbursementDate ? new Date(initialData.details.disbursement_details.disbursementDate).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                        }) : ''}</p>
                        <p><strong>Remark:</strong> {initialData?.details?.disbursement_details?.remark_dis || ''}</p>
                        <p><strong>Created At:</strong> {formatDateTime(initialData.details.disbursement_details?.createdAt)}</p>
                        <p><strong>Updated At:</strong> {formatDateTime(initialData.details.disbursement_details?.updatedAt)}</p>
                    </div>
                </>}

                {/* Fallback: Try to parse disbursement details from remarks if not in main details */}
                {!initialData?.details?.disbursement_details && initialData?.details?.remarks && (() => {
                    try {
                        const parsedRemarks = JSON.parse(initialData.details.remarks);
                        if (parsedRemarks.disbursement_details) {
                            console.log('🔍 [VIEW POPUP] Found disbursement details in remarks:', parsedRemarks.disbursement_details);
                            return (
                                <>
                                    <div className="section-header">Disbursement Details (from remarks)</div>
                                    <div className="section-content">
                                        <p><strong>Disbursement Amount:</strong> {parsedRemarks.disbursement_details.disbursementAmount || ''}</p>
                                        <p><strong>Disbursement Rate:</strong> {parsedRemarks.disbursement_details.disbursementRate || ''}</p>
                                        <p><strong>Insurance:</strong> {parsedRemarks.disbursement_details.insurance || ''}</p>
                                        <p><strong>File Number:</strong> {parsedRemarks.disbursement_details.fileNumber || ''}</p>
                                        <p><strong>Disbursement Date:</strong> {parsedRemarks.disbursement_details.disbursementDate ? new Date(parsedRemarks.disbursement_details.disbursementDate).toLocaleDateString('en-GB', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric'
                                        }) : ''}</p>
                                        <p><strong>Remark:</strong> {parsedRemarks.disbursement_details.remark_dis || ''}</p>
                                        <p><strong>Insurance Amount:</strong> {parsedRemarks.disbursement_details.insuranceAmount || ''}</p>
                                        <p><strong>Insurance Bank Name:</strong> {parsedRemarks.disbursement_details.insuranceBankName || ''}</p>
                                        <p><strong>Insurance Type:</strong> {parsedRemarks.disbursement_details.insuranceType || ''}</p>
                                        <p><strong>Updated At:</strong> {parsedRemarks.disbursement_details.updated_at ? new Date(parsedRemarks.disbursement_details.updated_at).toLocaleDateString('en-GB', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric'
                                        }) : ''}</p>
                                    </div>
                                </>
                            );
                        }
                    } catch (error) {
                        console.log('🔍 [VIEW POPUP] Error parsing remarks for disbursement details:', error);
                    }
                    return null;
                })()}

                {initialData?.details?.builder_consumer_details ? <>
                    <div className="section-header">Property Details</div>
                    <div className="section-content">
                        <p><strong>Builder Name:</strong> {initialData?.details?.builder_consumer_details?.builderuser?.company_name || ''}</p>
                        <p><strong>Project Name:</strong> {initialData?.details?.builder_consumer_details?.builderuser?.unit?.unit_name || ''}</p>
                        <p><strong>Project Address:</strong> {initialData?.details?.builder_consumer_details?.builderuser?.unit?.address || ''}</p>
                        <p><strong>Wing:</strong> {initialData?.details?.builder_consumer_details?.wing?.wing_name || ''}</p>
                        <p><strong>Floor Number:</strong> {initialData?.details?.builder_consumer_details?.floor?.floorNumber}</p>
                        <p><strong>Office No:</strong> {initialData?.details?.builder_consumer_details?.office_no || ''}</p>
                        <p><strong>Square Feet:</strong> {initialData?.details?.builder_consumer_details?.sqFeet || ''}</p>
                        <p><strong>Deed Amount:</strong> {initialData?.details?.builder_consumer_details?.srNo || ''}</p>
                    </div>
                </> : initialData?.details?.property_details && 
                <>
                    <div className="section-header">Property Details</div>
                    <div className="section-content">
                        <p><strong>Address:</strong> {initialData?.details?.property_details?.address || ''}</p>
                        <p><strong>Square Feet:</strong> {initialData?.details?.property_details?.sqFeet || ''}</p>
                        <p><strong>Deed Amount:</strong> {initialData?.details?.property_details?.deedAmount || ''}</p>
                    </div>
                </>}


                {/* Export Button */}
                <div style={{ textAlign: 'center' }}>
                    <button className="btn btn-green" onClick={generatePDF}>Export to PDF</button>
                </div>

            </div>
        </div>
    );
};

export default PopupModal;
