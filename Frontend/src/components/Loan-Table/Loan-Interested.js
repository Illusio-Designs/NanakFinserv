import React, { useState, useEffect } from "react";
import "../Table.css";
import Search from "../Search";
import * as XLSX from 'xlsx';

const LoanInterestedTable = ({
  headings,
  data,
  handleEdit,
  handleView,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  sortColumn,
  sortDirection,
  handleSort,
  setItemsPerPage,
}) => {
  const [filteredData, setFilteredData] = useState(data);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(""); // Changed to string

  const getStatusClass = (status) => {
    switch (status) {
      case "documentselected":
        return "status-documentselected";
      case "pickup":
        return "status-pickup";
      case "login":
        return "status-login";
      case "query":
        return "status-query";
      case "sanction":
        return "status-sanction";
      case "disbursement":
        return "status-disburse";
      case "cancel":
        return "status-cancel";
      case "partPayment":
        return "status-partPayment";
      case "notInterested":
        return "status-notInterested";
      default:
        return "status-default";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "documentselected":
        return "Document Selected";
      case "pickup":
        return "Pickup";
      case "login":
        return "Login";
      case "query":
        return "Query";
      case "sanction":
        return "Sanction";
      case "disbursement":
        return "Disbursement";
      case "cancel":
        return "Cancel";
      case "partPayment":
        return "Part Payment";
      case "interested":
        return "No Status";
      case "notInterested":
        return "Not Interested";
      default:
        return "No Status";
    }
  };

  useEffect(() => {
    filterData(searchTerm, selectedStatus);
  }, [data, searchTerm, selectedStatus]);

  const handleSearch = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    setSearchTerm(searchTerm);
    setCurrentPage(1);
  };

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
    setCurrentPage(1); // Reset page to 1 when the status changes
  };

  const filterData = (searchTerm, status) => {
    const newData = data.filter((item) => {
      const matchesSearch = Object.values(item).some((val) =>
        String(val).toLowerCase().includes(searchTerm)
      );
      const matchesStatus = status ? item.details?.status === status : true;
      return matchesSearch && matchesStatus;
    });
    setFilteredData(newData);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setFilteredData(data);
  };

  // Sort by loanDate descending (newest first) by default, unless a different sortColumn is selected
  const sortedData = [...filteredData].sort((a, b) => {
    if (sortColumn) {
      const aValue = String(a[sortColumn]).toLowerCase();
      const bValue = String(b[sortColumn]).toLowerCase();
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    } else {
      // Default: sort by loanDate descending
      const aDate = a?.details?.login_details?.loanDate ? new Date(a.details.login_details.loanDate) : new Date(0);
      const bDate = b?.details?.login_details?.loanDate ? new Date(b.details.login_details.loanDate) : new Date(0);
      return bDate - aDate;
    }
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = sortedData.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleClick = (event) => {
    setCurrentPage(Number(event.target.id));
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const getVisiblePageNumbers = () => {
    const pages = [];
    let startPage, endPage;

    if (totalPages <= 3) {
      startPage = 1;
      endPage = totalPages;
    } else {
      if (currentPage <= 2) {
        startPage = 1;
        endPage = 3;
      } else if (currentPage >= totalPages - 1) {
        startPage = totalPages - 2;
        endPage = totalPages;
      } else {
        startPage = currentPage - 1;
        endPage = currentPage + 1;
      }
    }

    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          id={1}
          onClick={handleClick}
          className={`page-number ${currentPage === 1 ? "active" : ""}`}
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(
          <span key="start-ellipsis" className="ellipsis">
            ...
          </span>
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          id={i}
          onClick={handleClick}
          className={`page-number ${currentPage === i ? "active" : ""}`}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="end-ellipsis" className="ellipsis">
            ...
          </span>
        );
      }
      pages.push(
        <button
          key={totalPages}
          id={totalPages}
          onClick={handleClick}
          className={`page-number ${currentPage === totalPages ? "active" : ""
            }`}
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  const exportToExcel = () => {
    const exportData = data.map((item, index) => {
      const getName = item.userConsumers?.username
        || item['userConsumers.username']
        || item.details?.userConsumers?.username
        || '';
      const getMobile = item.userConsumers?.mobileNumber
        || item['userConsumers.mobileNumber']
        || item.details?.userConsumers?.mobileNumber
        || '';
      const getEmail = item.userConsumers?.email
        || item['userConsumers.email']
        || item.details?.userConsumers?.email
        || '';
      const getReferenceName = item.userConsumers?.referenceName
        || item['userConsumers.referenceName']
        || item.details?.userConsumers?.referenceName
        || item.details?.referenceName
        || '';
      const getLoanDate = item?.details?.login_details?.loanDate ? new Date(item?.details?.login_details?.loanDate).toLocaleDateString() : '';
      const getLoanAmount = item?.details?.login_details?.loanAmount || '';
      const getBank = item?.details?.login_details?.bankName || '';
      const getProduct = item?.details?.login_details?.product || '';
      const getPropertyDetails = item?.details?.login_details?.propertyDetails || '';
      const getInsurance = item?.details?.login_details?.insurance || '';
      const getRate = item?.details?.login_details?.rate || '';
      const getCode = item?.details?.login_details?.code_name || '';
      const getSMName = item?.details?.login_details?.smName || '';
      const getStatus = getStatusLabel(item?.details?.status || '');
      const getRemarks = item?.details?.remarks
        || item?.details?.login_details?.remarks_loan
        || item?.details?.query_details?.remarks
        || item?.details?.cancel_details?.remarks_cancel
        || '';

      return {
        'Sr. No.': index + 1,
        'Date': getLoanDate,
        'Name': getName,
        'Mobile No.': getMobile,
        'Email': getEmail,
        'Reference Name': getReferenceName,
        'Loan Amount': getLoanAmount,
        'Bank': getBank,
        'Product': getProduct,
        'Property Details': getPropertyDetails,
        'Insurance': getInsurance,
        'Rate': getRate,
        'Code': getCode,
        'SM Name': getSMName,
        'Status': getStatus,
        'Remark': getRemarks
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Loan Data");
    XLSX.writeFile(wb, "loan_interested_data.xlsx");
  };

  return (
    <div>
      <div className="table-container">
        <div className="table-h">
          <div className="table-h-c">
            <Search
              searchTerm={searchTerm}
              handleSearch={handleSearch}
              clearSearch={clearSearch}
            />
          </div>
          <div className="table-h-c">
            <select
              value={selectedStatus}
              onChange={handleStatusChange}
              className="status-filter"
            >
              <option value="">All Status</option>
              <option value="documentselected">Document Selected</option>
              <option value="pickup">Pickup</option>
              <option value="login">Login</option>
              <option value="query">Query</option>
              <option value="sanction">Sanction</option>
              <option value="disbursement">Disbursement</option>
              <option value="cancel">Cancel</option>
              <option value="partPayment">Part Payment</option>
              <option value="interested">No Status</option>
              <option value="notInterested">Not Interested</option>
            </select>
          </div>
          <div className="table-h-c">
            <button 
              onClick={exportToExcel}
              className="export-button"
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Export to Excel
            </button>
          </div>
          <div className="show-by table-h-c">
            <label>Show by Rows:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(parseInt(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
        <table className="universal-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Loan Date</th>
              {headings.map((heading, index) => (
                <th key={index} onClick={() => handleSort(heading.key)}>
                  {heading.head}{" "}
                  {sortColumn === heading.key
                    ? sortDirection === "asc"
                      ? "▲"
                      : "▼"
                    : null}
                </th>
              ))}
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {currentData && currentData.length ? (
              currentData.map((item, index) => {
                const loanStatus = item?.details?.status || "";
                const loanAmount = item?.details?.login_details?.loanAmount || '';
                const loanAccount = item?.details?.login_details?.loanAccountNumber || '';
                const product = item?.details?.login_details?.product || '';
                const bank = item?.details?.login_details?.bankName || '';
                const remarks = item?.details?.remarks || 
                              item?.details?.login_details?.remarks_loan || 
                              item?.details?.query_details?.remarks || 
                              item?.details?.cancel_details?.remarks_cancel || '';
                const loanDate = item?.details?.login_details?.loanDate ? new Date(item?.details?.login_details?.loanDate).toLocaleDateString() : '-';
                
                // Enhanced data access with fallbacks for main user fields
                const userName = item.userConsumers?.username
                  || item['userConsumers.username']
                  || item.details?.userConsumers?.username
                  || '';
                const userMobile = item.userConsumers?.mobileNumber
                  || item['userConsumers.mobileNumber']
                  || item.details?.userConsumers?.mobileNumber
                  || '';
                const userEmail = item.userConsumers?.email
                  || item['userConsumers.email']
                  || item.details?.userConsumers?.email
                  || '';
                const userReferenceName = item.userConsumers?.referenceName
                  || item['userConsumers.referenceName']
                  || item.details?.userConsumers?.referenceName
                  || item.details?.referenceName
                  || '';

                // Debug logging for troubleshooting
                if (index === 0) { // Only log first item to avoid console spam
                  console.log('🔍 [DEBUG] Loan Table - First item data structure:', {
                    itemKeys: Object.keys(item),
                    userConsumers: item.userConsumers,
                    userRoles: item.userRoles,
                    details: item.details,
                    extractedData: {
                      userName,
                      userMobile,
                      userEmail,
                      userReferenceName,
                      loanStatus,
                      loanAmount,
                      loanAccount,
                      product,
                      bank
                    }
                  });
                }

                // Create enhanced item object with all user details for view/edit
                const enhancedItem = {
                  ...item,
                  // Ensure referenceName and other user details are at the top level for easy access
                  'userConsumers.username': userName,
                  'userConsumers.mobileNumber': userMobile,
                  'userConsumers.email': userEmail,
                  'userConsumers.referenceName': userReferenceName,
                  // Also add to details for backward compatibility
                  details: {
                    ...item.details,
                    referenceName: userReferenceName,
                    username: userName,
                    mobileNumber: userMobile,
                    email: userEmail
                  }
                };

                return (
                  <tr key={index}>
                    <td>{indexOfFirstItem + index + 1}</td>
                    <td>{loanDate}</td>
                    {headings.map((heading, hIndex) => (
                      <td key={hIndex}>
                        {heading.key === "status" ? (
                          <div style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
                            <span className={`status-box ${getStatusClass(loanStatus)}`}>
                              {getStatusLabel(loanStatus) || "No Status"}
                            </span>
                          </div>
                        ) : heading.key === "remarks" ? remarks :
                           heading.key === "details.login_details.loanAccountNumber" ? loanAccount : 
                           heading.key === "details.login_details.loanAmount" ? loanAmount : 
                           heading.key === "details.login_details.product" ? product : 
                           heading.key === "details.login_details.bank" ? bank : 
                           item[heading.key] || ''
                        }
                      </td>
                    ))}
                    <td>
                      <div style={{ padding: "0px", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <button 
                          className="action-btn edit-btn" 
                          onClick={() => handleEdit(enhancedItem)}
                          title="Edit Record"
                          style={{ 
                            cursor: 'pointer', 
                            width: '36px', 
                            height: '36px',
                            border: 'none',
                            borderRadius: '6px',
                            background: '#fef9c3',
                            color: '#b45309',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            fontSize: '16px'
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          className="action-btn view-btn"
                          onClick={() => handleView(enhancedItem)}
                          title="View Details"
                          style={{ 
                            cursor: 'pointer', 
                            width: '36px', 
                            height: '36px',
                            border: 'none',
                            borderRadius: '6px',
                            background: '#e0e7ff',
                            color: '#3730a3',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            fontSize: '16px'
                          }}
                        >
                          👁️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={headings.length + 2}>No record found</td>
              </tr>
            )}
          </tbody>
        </table>
        {filteredData.length > 0 && (
          <div className="pagination">
            <button onClick={handlePreviousPage} disabled={currentPage === 1}>
              Previous
            </button>
            {getVisiblePageNumbers()}
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanInterestedTable;
