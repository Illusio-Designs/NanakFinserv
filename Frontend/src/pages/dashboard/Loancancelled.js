import React, { useEffect, useState } from 'react';
import '../../styles/pages/dashboard/Consumer.css';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import DashboardLayout from '../../components/DashboardLayout';
import { getAllLoanInterestedConsumer, getAllLoanConsumerDetail, updateLoanConsumerUser } from '../../serviceAPI/userAPI';
import { useToaster } from '../../components/Toaster';
import Cookies from 'js-cookie';
import PopupModal from '../../components/View-Loan-Details.popup';
import * as XLSX from 'xlsx';

const Loancancelled = () => {
  const addToast = useToaster()
  const categoryId = Cookies.get('category');
  const user = (Cookies.get('user') && JSON.parse(Cookies.get('user'))) || '';

  const getStartOfFinancialYear = () => {
    const today = new Date();
    const year = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
    return new Date(year, 3, 2).toISOString().split('T')[0]; // 1st April of the financial year
  };

  const getEndOfFinancialYear = () => {
    const today = new Date();
    const year = today.getMonth() >= 3 ? today.getFullYear() + 1 : today.getFullYear();
    return new Date(year, 3, 1).toISOString().split('T')[0]; // Ensures 31st March
  };
  
  const [data, setData] = useState([]); // display-ready rows (with JSX in remark cell)
  const [rawData, setRawData] = useState([]); // plain rows from API (no JSX)
  const [detail, setDetail] = useState(null);
  const [verticle, setVerticle] = useState([]);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [heading, setHeading] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [loading, setLoading] = useState(false);
  const [remark, setRemark] = useState('');
  const [editIndex, setEditIndex] = useState(null);


  const getAllLoanConsumerData = async () => {
    setLoading(true);
    try {
      const response = await getAllLoanInterestedConsumer();
      console.log('🔍 [LOAN CANCELLED] Raw API response:', response);
      
      if (response?.data && response?.data?.length) {
        console.log('🔍 [LOAN CANCELLED] Processing data:', response.data.length, 'records');
        
        // Process data to add serial numbers and flatten nested properties for table
        const processedData = response.data.map((user, index) => {
          const processedUser = {
            ...user,
            // Basic fields
            serialNumber: index + 1,
            userName: user.userConsumers?.username || user['userConsumers.username'] || '',
            mobileNumber: user.userConsumers?.mobileNumber || user['userConsumers.mobileNumber'] || '',
            // IDs used for updates/view
            laon_id: user.details?.laon_id || user.laon_id,
            user_consumer_id: user.user_consumer_id || user.details?.user_consumer_id,
            
            // Loan details (flattened) - check ALL possible data sources based on status
            loanDate: (() => {
              let date = user.details?.login_details?.loanDate || 
                         user.details?.document_details?.loanDate || 
                         user.details?.part_details?.loanDate || 
                         user.details?.disbursement_details?.loanDate;
              
              if (!date && user.details?.remarks) {
                try {
                  const remarksData = JSON.parse(user.details.remarks);
                  date = remarksData?.login_details?.loanDate || 
                         remarksData?.part_details?.loanDate || 
                         remarksData?.document_details?.loanDate;
                } catch (e) {
                  console.log('🔍 [REMARKS] Error parsing remarks for loan date:', e);
                }
              }
              
              return date || '';
            })(),
            
            product: user.details?.login_details?.product || 
                     user.details?.document_details?.product || 
                     user.details?.part_details?.product || 
                     user.details?.disbursement_details?.product || '',
            
            bankName: user.details?.login_details?.bankName || 
                      user.details?.document_details?.bankName || 
                      user.details?.part_details?.bankName || 
                      user.details?.disbursement_details?.bankName || '',
            
            loanAmount: user.details?.login_details?.loanAmount || 
                        user.details?.document_details?.loanAmount || 
                        user.details?.part_details?.loanAmount || 
                        user.details?.disbursement_details?.loanAmount || '',
            
            loanAccountNumber: user.details?.login_details?.loanAccountNumber || 
                               user.details?.document_details?.loanAccountNumber || 
                               user.details?.part_details?.loanAccountNumber || 
                               user.details?.disbursement_details?.loanAccountNumber || '',
            
            status: user.details?.status || '',
            remark: (() => {
              // Prefer explicit remarks saved under specific status sections
              const d = user.details || {};
              const explicit = d.cancel_details?.remarks_cancel 
                || d.query_details?.remarks 
                || d.disbursement_details?.remark_dis 
                || d.login_details?.remarks_loan 
                || d.document_details?.remarks_docs;
              if (explicit) return explicit;
              // Fallback to generic remarks which may be raw text or JSON string
              const generic = d.remarks || user.remarks || '';
              if (typeof generic === 'string' && generic.trim()) {
                try {
                  const parsed = JSON.parse(generic);
                  return parsed?.cancel_details?.remarks_cancel 
                    || parsed?.query_details?.remarks 
                    || parsed?.disbursement_details?.remark_dis 
                    || parsed?.login_details?.remarks_loan 
                    || parsed?.document_details?.remarks_docs 
                    || generic;
                } catch (_) {
                  return generic;
                }
              }
              if (typeof generic === 'object' && generic !== null) {
                return generic.remark_dis || generic.remarks_loan || generic.remarks_docs || generic.remarks || '';
              }
              return '';
            })(),
            // IMPORTANT: pass only the nested details object for the view popup
            details: user.details || {}
          };
          
          return processedUser;
        });
        
        // Filter only cancelled records and sort by creation date in ascending order (oldest first)
        console.log('🔍 [LOAN CANCELLED] All processed data statuses:', processedData.map(u => ({ id: u.laon_id, status: u.status })));
        const cancelledData = processedData.filter(user => {
          const status = user.status?.toLowerCase();
          console.log('🔍 [LOAN CANCELLED] Checking status:', status, 'for user:', user.laon_id);
          return status === 'cancelled' || status === 'cancel';
        });
        console.log('🔍 [LOAN CANCELLED] Filtered cancelled data:', cancelledData.length, 'records');
        const sortedData = cancelledData.sort((a, b) => {
          const dateA = new Date(a.details?.createdAt || a.details?.updatedAt || 0);
          const dateB = new Date(b.details?.createdAt || b.details?.updatedAt || 0);
          return dateA - dateB; // Ascending order (oldest first)
        });
        
        console.log('🔍 [LOAN CANCELLED] Cancelled records found:', sortedData.length);
        
        // Save plain rows; rendering of remark cell will be handled reactively
        setRawData(sortedData || []);
      } else {
        console.log('🔍 [LOAN CANCELLED] No data received from API');
        setData([]);
      }
    } catch (error) {
      console.error('Error fetching loan cancelled data:', error);
      addToast('Error fetching cancelled loan data', 'error');
    } finally {
      setLoading(false);
    }
  };


  const getLoanConsumerDetail = async (laon_id) => {
    try {
      const consumerData = await getAllLoanConsumerDetail({ laon_id });
      if (consumerData?.data) {
        setViewData(consumerData.data);
      } else {
        setViewData(null);
      }
    } catch (e) {
      setViewData(null);
      console.error('Error fetching loan consumer detail:', e);
    }
  };

  const handleViewDetails = async (row) => {
    const laonId = row?.details?.laon_id || row?.laon_id;
    if (laonId) {
      try {
        const consumerData = await getAllLoanConsumerDetail({ laon_id: laonId });
        let merged = consumerData?.data || {};
        // If inline table remark exists, use it as a fallback so popup shows the same
        if (row?.remark) {
          merged = {
            ...merged,
            details: {
              ...(merged?.details || {}),
              remarks: (merged?.details?.remarks) || row.remark
            }
          };
        }
        setViewData(merged);
      } catch (e) {
        console.error('Error fetching loan consumer detail:', e);
        setViewData(row);
      }
    } else {
      setViewData(row);
    }
    setIsViewModalOpen(true);
  };

  const handleRemarkEdit = (index, currentRemark) => {
    setEditIndex(index);
    setRemark(currentRemark || '');
  };

  const handleRemarkSave = async (rowIndex) => {
    try {
      const target = rawData[rowIndex];
      const laonId = target?.laon_id || target?.details?.laon_id || target?.details?.login_details?.laon_id;
      const userConsumerId = target?.user_consumer_id || target?.details?.user_consumer_id || target?.details?.login_details?.user_consumer_id;

      if (laonId && userConsumerId) {
        const payload = {
          user_consumer_id: userConsumerId,
          laon_id: laonId,
          // Ensure mobileNumber is a defined, non-undefined string
          mobileNumber: String(target?.mobileNumber || target?.userConsumers?.mobileNumber || target?.['userConsumers.mobileNumber'] || ''),
          // Extra aliases in case backend expects different keys
          phone_number: String(target?.mobileNumber || target?.userConsumers?.mobileNumber || target?.['userConsumers.mobileNumber'] || ''),
          user_mobile_number: String(target?.mobileNumber || target?.userConsumers?.mobileNumber || target?.['userConsumers.mobileNumber'] || ''),
          username: target?.userName || target?.userConsumers?.username || '',
          email: target?.userConsumers?.email || '',
          status: 'cancel',
          cancel_details: {
            remarks_cancel: remark
          }
        };
        
        if (!payload.mobileNumber) {
          addToast('Cannot save: mobile number missing on this record.', 'error');
          return;
        }
        await updateLoanConsumerUser(payload);
      }
      // Update raw rows; renderer will refresh display data
      setRawData(prev => prev.map((item, idx) => (
        idx === rowIndex ? { ...item, remark } : item
      )));
      setEditIndex(null);
      setRemark('');
      addToast('Remark updated successfully!', 'success');
    } catch (error) {
      const serverMsg = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Unknown server error';
      addToast(`Failed to save remark: ${serverMsg}`, 'error');
      console.error('Remark save error:', error?.response || error);
    }
  };

  const handleCancelEdit = () => {
    setEditIndex(null);
    setRemark('');
  };

  // Rebuild display rows (with live editable remark cell) whenever rawData/editIndex/remark change
  useEffect(() => {
    const displayRows = rawData.map((item, index) => ({
      ...item,
      remark: (
        <div style={{ minWidth: '250px', position: 'relative' }}>
          {editIndex === index ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="Enter remark here..."
                style={{
                  width: '100%',
                  minHeight: '60px',
                  padding: '8px 12px',
                  border: '2px solid #007bff',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleCancelEdit}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRemarkSave(index)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              minHeight: '40px'
            }}>
              <span style={{ 
                flex: 1,
                fontSize: '13px',
                color: item.remark ? '#495057' : '#6c757d',
                fontStyle: item.remark ? 'normal' : 'italic',
                lineHeight: '1.4'
              }}>
                {item.remark || 'No remark added'}
              </span>
              <button
                onClick={() => handleRemarkEdit(index, item.remark || '')}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Edit
              </button>
            </div>
          )}
        </div>
      )
    }));
    setData(displayRows);
  }, [rawData, editIndex, remark]);

  const handleExportToExcel = () => {
    const exportData = data.map((row, index) => ({
      'S.No': index + 1,
      'Loan Date': row.loanDate,
      'Name': row.userName,
      'Mobile Number': row.mobileNumber,
      'Product': row.product,
      'Bank': row.bankName,
      'Loan Amount': row.loanAmount,
      'Loan Account No.': row.loanAccountNumber,
      'Status': row.status
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cancelled Loan Records');
    XLSX.writeFile(wb, `cancelled_loan_records_${new Date().toISOString().split('T')[0]}.xlsx`);
    addToast('Excel file exported successfully!', 'success');
  };


  useEffect(() => {
    // Set headings immediately so they're always displayed
    setHeading([
      { key: 'loanDate', head: 'LOAN DATE' },
      { key: 'userName', head: 'NAME' }, 
      { key: 'mobileNumber', head: 'MOBILE NUMBER' }, 
      { key: 'product', head: 'PRODUCT' }, 
      { key: 'bankName', head: 'BANK' }, 
      { key: 'loanAmount', head: 'LOAN AMOUNT' }, 
      { key: 'loanAccountNumber', head: 'LOAN ACCOUNT NO.' }, 
      { key: 'status', head: 'STATUS' },
      { key: 'remark', head: 'REMARKS' }
    ]);
    getAllLoanConsumerData();
  }, []);

  return (
    <DashboardLayout>
      <div className="consumer-container">
        <div className="consumer-header">
          <h2>Cancelled Loan Records</h2>
          <div className="consumer-actions">
            <Button onClick={handleExportToExcel} className="download-btn">
              Export to Excel
            </Button>
          </div>
        </div>


        <div className="consumer-table">
          <Table
            data={data || []}
            columns={heading.map(h => ({ key: h.key, title: h.head }))}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={(column, direction) => {
              setSortColumn(column);
              setSortDirection(direction);
            }}
            onView={handleViewDetails}
            showViewButton={true}
            loading={loading}
          />
        </div>

        {isViewModalOpen && (
          <PopupModal initialData={viewData} onClose={() => setIsViewModalOpen(false)} />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Loancancelled;
