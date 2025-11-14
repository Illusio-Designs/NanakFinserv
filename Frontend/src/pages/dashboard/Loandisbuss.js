import React, { useEffect, useState } from 'react';
import '../../styles/pages/dashboard/Consumer.css';
import Modal from '../../components/common/Modal';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import DashboardLayout from '../../components/DashboardLayout';
import { getAllLoanDisburseConsumer } from '../../serviceAPI/userAPI';
import * as XLSX from 'xlsx';

const Loandisbuss = () => {
  

  const getStartOfFinancialYear = () => {
    const today = new Date();
    const year = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
    return new Date(year, 3, 2).toISOString().split('T')[0]; // 1st April of the financial year
  };

  const handleClearDateFilter = () => {
    setStartDate('');
    setEndDate('');
    localStorage.removeItem('loanCompletedStartDate');
    localStorage.removeItem('loanCompletedEndDate');
    // Apply filters without date constraints
    applyFilters();
  };

  const getEndOfFinancialYear = () => {
    const today = new Date();
    const year = today.getMonth() >= 3 ? today.getFullYear() + 1 : today.getFullYear();
    console.log(year,'ss')
    return new Date(year, 3, 1).toISOString().split('T')[0]; // Ensures 31st March
  };
  
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [viewIndex, setViewIndex] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [heading, setHeading] = useState([]);
  const [loading, setLoading] = useState(false);

  const isWithinDateRange = (dateStr, fromDate, toDate) => {
    if (!fromDate || !toDate) return true;
    if (!dateStr) return false;
    const start = new Date(new Date(fromDate).setHours(0, 0, 0, 0));
    const end = new Date(new Date(toDate).setHours(23, 59, 59, 999));
    const d = new Date(dateStr);
    if (isNaN(d)) return false;
    return d >= start && d <= end;
  };

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
    setEditIndex(null);
    setViewIndex(null);
  };

  const resetForm = () => {
    setDetail(null);
    setEditIndex(null);
    setViewIndex(null);
  };

  useEffect(() => {
    // Set headings immediately so they're always displayed
    setHeading([
      { key: 'loanDate', title: 'LOAN DATE' },
      { key: 'userName', title: 'NAME' },
      { key: 'mobileNumber', title: 'MOBILE NUMBER' },
      { key: 'product', title: 'PRODUCT' },
      { key: 'bankName', title: 'BANK' },
      { key: 'loanAmount', title: 'LOAN AMOUNT' },
      { key: 'loanAccountNumber', title: 'LOAN ACCOUNT NO.' },
      { key: 'codeName', title: 'CODE NUMBER' },
      { key: 'status', title: 'STATUS' },
      { key: 'pdfname', title: 'Detail' }
    ]);
    
    getAllLoanConsumerData()
  }, []);

  // Apply filters when dates change
  useEffect(() => {
    applyFilters();
  }, [startDate, endDate, data]);

  const handleView = async (userData) => {
    const globalIndex = data.findIndex((item) => item.laon_id === userData.laon_id);
    if (globalIndex !== -1) {
      setViewIndex(globalIndex);
      const laon_id = data[globalIndex]?.laon_id; // Get loan ID from selected row
      await getLoanConsumerDetail(laon_id); // Fetch detailed loan data for view
      setIsModalOpen(true)
    }
  };

  const handlePDFDownload = (userData) => {
    generatePDF(userData);
  };

  const getLoanConsumerDetail = async (laon_id) => {
    // Find the loan details from the filtered data (current view)
    const loanDetails = filteredData.find(item => item.laon_id === laon_id);
    if (loanDetails) {
      setDetail(loanDetails); // Set the detailed data to state
    }
  };

    const getAllLoanConsumerData = async () => {
    setLoading(true);
    // Always send empty object to get all data - frontend will handle filtering
    const consumerData = await getAllLoanDisburseConsumer({});
    console.log('🔍 [LOAN COMPLETED] Raw API response:', consumerData);
    
    if (consumerData?.data && consumerData?.data?.length) {
      console.log('🔍 [LOAN COMPLETED] Processing data:', consumerData.data.length, 'records');
      
      // Process the data directly from the API response - no need for additional API calls
      const processedData = consumerData.data.map((user, index) => {
        const processedUser = {
        ...user,
          // Basic fields from the API response
        userName: user.userConsumers?.username || user['userConsumers.username'] || '',
        mobileNumber: user.userConsumers?.mobileNumber || user['userConsumers.mobileNumber'] || '',
          status: user.status || 'completed',
          
          // Loan details from the API response
          loanDate: user.login_details?.loanDate || '',
          product: user.login_details?.product || '',
          bankName: user.login_details?.bankName || '',
          loanAmount: user.login_details?.loanAmount ? `₹${user.login_details.loanAmount}` : '',
          loanAccountNumber: user.login_details?.loanAccountNumber || '',
          
          // Disbursement details for filtering
          disbursementDate: user.disbursement_details?.disbursementDate || user.login_details?.loanDate || '',
          
          // Additional fields for display
          pdfname: user.pdfname || '',
          laon_id: user.laon_id,
          codeName: user.login_details?.code_name || ''
        };
        
        return processedUser;
      });
      
      console.log('🔍 [LOAN COMPLETED] Final processed data:', processedData);
      setData(processedData);
      applyFilters(processedData);
    } else {
      console.log('🔍 [LOAN COMPLETED] No data received from API');
      setData([]);
      setFilteredData([]);
    }
    setLoading(false);
  };

  const applyFilters = (dataToFilter = data) => {
    let filtered = dataToFilter;
    
    // Apply date filter if both dates are provided
    if (startDate && endDate) {
      filtered = filtered.filter(item => {
        // Use disbursement date for filtering completed loans
        const dateToCheck = item.disbursementDate || item.loanDate;
        return isWithinDateRange(dateToCheck, startDate, endDate);
      });
    }
    
    setFilteredData(filtered);
  };

  const handleEdit = (userData) => {
    const globalIndex = data.findIndex((item) => item.laon_id === userData.laon_id);
    if (globalIndex !== -1) {
      setEditIndex(globalIndex);
      setIsModalOpen(true);
    }
  };

  const fetchApi = () => {
    getAllLoanConsumerData();
  };

  const handleVerticalChange = (index, newVertical) => {
    const updatedData = data.map((item, idx) =>
      idx === index ? { ...item, vertical: newVertical } : item
    );
    setData(updatedData);
  };

  const handleSearch = () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates.");
      return;
    }
    // Save dates to localStorage
    localStorage.setItem('loanCompletedStartDate', startDate);
    localStorage.setItem('loanCompletedEndDate', endDate);
    
    // Apply filters to existing data
    applyFilters();
  };

  const exportToExcel = () => {
    const exportData = filteredData.map((item, index) => {
      const getName = item.userName || '';
      const getDisbursementDate = item.disbursementDate ? new Date(item.disbursementDate).toLocaleDateString() : '';
      const getMobile = item.mobileNumber || '';
      const getProduct = item.product || '';
      const getBank = item.bankName || '';
      const getAmount = item.loanAmount || '';
      const getAccountNo = item.loanAccountNumber || '';
      const getStatus = item.status || '';

      return {
        'Sr. No.': index + 1,
        'Name': getName,
        'Disbursement Date': getDisbursementDate,
        'Mobile Number': getMobile,
        'Product': getProduct,
        'Bank': getBank,
        'Disbursement Amount': getAmount,
        'Loan Account No.': getAccountNo,
        'Status': getStatus
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Loan Disbursed Data");
    XLSX.writeFile(wb, "loan_disbursed_data.xlsx");
  };

  const generatePDF = (data) => {
    // Import jsPDF dynamically to avoid SSR issues
    import('jspdf').then(({ jsPDF }) => {
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

      // Function to calculate section height
      const calculateSectionHeight = (content) => {
        const contentHeight = content.length * lineHeight + boxPadding * 2;
        return headerHeight + 5 + contentHeight;
      };

      // Function to draw section headers
      const drawHeader = (title) => {
        doc.setFillColor(50, 115, 220);
        doc.rect(pageMargin, currentY, pageWidth - pageMargin * 2, headerHeight, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(255, 255, 255);
        doc.text(title, pageWidth / 2, currentY + 10, { align: 'center' });
        currentY += headerHeight + 5;
      };

      // Function to draw content in a bordered box
      const drawContentBox = (content) => {
        const contentHeight = content.length * lineHeight + boxPadding * 2;
        doc.setFillColor(240, 240, 240);
        doc.roundedRect(pageMargin, currentY, pageWidth - pageMargin * 2, contentHeight, 3, 3, 'F');
        doc.setDrawColor(200);
        doc.roundedRect(pageMargin, currentY, pageWidth - pageMargin * 2, contentHeight, 3, 3);
        
        let textY = currentY + boxPadding;
        content.forEach(([key, value]) => {
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'bold');
          doc.text(`${key}:`, pageMargin + 5, textY);
          doc.setFont('helvetica', 'normal');
          doc.text(value, pageMargin + 70, textY);
          textY += lineHeight;
        });

        currentY += contentHeight + sectionSpacing;
      };

      // Title for the PDF
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Loan Completed Report', pageWidth / 2, currentY, { align: 'center' });
      currentY += 20;

      // Section data - comprehensive loan information
      const sections = [
        {
          title: 'Consumer Information',
          content: [
            ['Name', data?.userName || ''],
            ['Email', data?.email || ''],
            ['Mobile', data?.mobileNumber || ''],
            ['Reference Name', data?.referenceName || ''],
          ],
        },
        {
          title: 'Loan Manager Information',
          content: [
            ['Manager Name', data?.managerName || ''],
            ['Manager Email', data?.managerEmail || ''],
            ['Manager Mobile', data?.managerMobile || ''],
            ['Manager Reference', data?.managerReference || ''],
          ],
        },
        {
          title: 'Loan Status & Dates',
          content: [
            ['Status', data?.status || ''],
            ['Loan Date', data?.loanDate || ''],
            ['Disbursement Date', data?.disbursementDate || ''],
            ['Created At', data?.createdAt ? new Date(data.createdAt).toLocaleDateString() : ''],
            ['Updated At', data?.updatedAt ? new Date(data.updatedAt).toLocaleDateString() : ''],
          ],
        },
        {
          title: 'Loan Details',
          content: [
            ['Product', data?.product || ''],
            ['Bank Name', data?.bankName || ''],
            ['Loan Amount', data?.loanAmount || ''],
            ['Loan Account Number', data?.loanAccountNumber || ''],
            ['Code Number', data?.codeName || ''],
            ['File Number', data?.fileNumber || ''],
          ],
        },
        {
          title: 'Disbursement Information',
          content: [
            ['Disbursement Amount', data?.disbursementAmount || ''],
            ['Disbursement Rate', data?.disbursementRate || ''],
            ['Insurance', data?.insurance || ''],
            ['Insurance Amount', data?.insuranceAmount || ''],
            ['Insurance Bank Name', data?.insuranceBankName || ''],
            ['Insurance Type', data?.insuranceType || ''],
          ],
        },
        {
          title: 'Additional Information',
          content: [
            ['PDF File', data?.pdfname || 'No file available'],
            ['Loan ID', data?.laon_id || ''],
            ['User Consumer ID', data?.user_consumer_id || ''],
            ['Category ID', data?.category_id || ''],
          ],
        }
      ];

      // Add sections only if content exists
      sections.forEach((section) => {
        if (section.content && section.content.length > 0) {
          const sectionHeight = calculateSectionHeight(section.content);
          checkPageOverflow(sectionHeight);
          drawHeader(section.title);
          drawContentBox(section.content);
        }
      });

      // Save the PDF
      doc.save('loan-completed-report.pdf');
    });
  };

  // Helper to get the disbursement date from an item
  const getDisbursementDate = (item) => {
    return item?.disbursementDate || item?.disbursement_details?.disbursementDate || item?.disbursement_date || '';
  };

  // Sort filtered data by disbursement date descending (latest first)
  const sortedData = [...filteredData].sort((a, b) => {
    const dateA = new Date(getDisbursementDate(a));
    const dateB = new Date(getDisbursementDate(b));
    if (isNaN(dateA.getTime())) return 1;
    if (isNaN(dateB.getTime())) return -1;
    return dateB - dateA;
  });

  return (
    <DashboardLayout>
      <div className="consumer-container">
        <div className="consumer-header">
          <h1>Completed</h1>
          <div className="header-buttons">
          <Button className="add-consumer-btn" onClick={exportToExcel}>Export to Excel</Button>
            <Button className="download-btn" onClick={exportToExcel}>Download</Button>
          </div>
        </div>

        <div className="filter-section">
          <div className="filter-inputs">
            <div>
              <label>Start Date:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="form-control"
              />
            </div>
            <div>
              <label>End Date:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="form-control"
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
              <Button className="add-consumer-btn" onClick={handleSearch}>Search</Button>
              <Button className="cancel-btn" onClick={handleClearDateFilter}>Clear</Button>
            </div>
          </div>
        </div>

        <div className="consumer-table-container">
          <Table
            columns={heading}
            data={sortedData}
            onEdit={handleEdit}
            onView={handleView}
            pagination={true}
            itemsPerPage={25}
            loading={loading}
            actionButtons={[
              {
                label: 'PDF',
                icon: '📄',
                onClick: handlePDFDownload,
                className: 'pdf-download-btn',
                title: 'Download PDF'
              }
            ]}
          />
        </div>

        {isModalOpen && (
          <Modal
            open={isModalOpen}
            onClose={toggleModal}
            title={viewIndex !== null ? "View Loan Details" : "Edit Loan Details"}
          >
            {viewIndex !== null && detail ? (
              <div className="loan-details-modal">
                <div className="info-section">
                  <h3>Loan Information</h3>
                  <div className="form-section">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Name:</label>
                        <p className="detail-value">{detail.userName || 'N/A'}</p>
                      </div>
                      <div className="form-group">
                        <label>Mobile Number:</label>
                        <p className="detail-value">{detail.mobileNumber || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Loan Amount:</label>
                        <p className="detail-value">{detail.loanAmount || 'N/A'}</p>
                      </div>
                      <div className="form-group">
                        <label>Bank Name:</label>
                        <p className="detail-value">{detail.bankName || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Product:</label>
                        <p className="detail-value">{detail.product || 'N/A'}</p>
                      </div>
                      <div className="form-group">
                        <label>Loan Account Number:</label>
                        <p className="detail-value">{detail.loanAccountNumber || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Loan Date:</label>
                        <p className="detail-value">{detail.loanDate || 'N/A'}</p>
                      </div>
                      <div className="form-group">
                        <label>Disbursement Date:</label>
                        <p className="detail-value">{detail.disbursementDate || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Status:</label>
                        <p className="detail-value">{detail.status || 'N/A'}</p>
                      </div>
                      <div className="form-group">
                        <label>PDF File:</label>
                        <p className="detail-value">{detail.pdfname || 'No file available'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-actions">
                  <Button className="export-pdf-btn" onClick={() => generatePDF(detail)}>Export to PDF</Button>
                  <Button onClick={toggleModal}>Close</Button>
                </div>
              </div>
            ) : (
              <div className="edit-form">
                <p>Edit functionality can be implemented here based on your requirements.</p>
                <div className="modal-actions">
                  <Button onClick={toggleModal}>Close</Button>
                </div>
              </div>
            )}
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Loandisbuss;
