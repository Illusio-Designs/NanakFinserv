import React, { useState, useEffect } from "react";
import "../Table.css";
import Search from "../Search";
import { DOWNLOAD_URL } from "../../serviceAPI/userAPI";
import * as XLSX from 'xlsx';

const LoanDisburseTable = ({
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

    useEffect(() => {
        filterData(searchTerm);
    }, [data, searchTerm]);

    const handleSearch = (e) => {
        const searchTerm = e.target.value.toLowerCase();
        setSearchTerm(searchTerm);
        setCurrentPage(1);
    };

    const filterData = (searchTerm) => {
        const newData = data.filter((item) =>
            Object.values(item).some((val) =>
                String(val).toLowerCase().includes(searchTerm)
            )
        );
        setFilteredData(newData);
    };

    const clearSearch = () => {
        setSearchTerm("");
        setFilteredData(data);
    };

    const sortedData = [...filteredData].sort((a, b) => {
        if (sortColumn) {
            const aValue = String(a[sortColumn]).toLowerCase();
            const bValue = String(b[sortColumn]).toLowerCase();
            if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
            if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        }
        return 0;
    });

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
            case "completed":
                return "status-completed";
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
            case "completed":
                return "Completed";
            default:
                return "No Status";
        }
    };

    // Function to format date to dd/mm/yyyy
    const formatDate = (dateString) => {
        if (!dateString) return '';
        
        try {
            // Log the raw date string for debugging
            console.log("Formatting date string:", dateString);
            
            // Try to handle various date formats
            let date;
            
            // Check if it's already in DD/MM/YYYY format
            if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
                return dateString; // Already in the right format
            }
            
            date = new Date(dateString);
            
            // Check if date is valid
            if (isNaN(date.getTime())) {
                console.log("Invalid date, trying alternative parsing");
                
                // Try parsing as ISO string or other formats
                if (typeof dateString === 'string') {
                    // Handle YYYY-MM-DD format specifically
                    const parts = dateString.split('-');
                    if (parts.length === 3) {
                        return `${parts[2].substring(0,2)}/${parts[1]}/${parts[0]}`;
                    }
                }
                
                return '';
            }
            
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            
            const formatted = `${day}/${month}/${year}`;
            console.log("Formatted date:", formatted);
            return formatted;
        } catch (error) {
            console.error("Error formatting date:", error);
            return '';
        }
    };

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


    const redirectpage = (pdf) => {
        const file_path = DOWNLOAD_URL + pdf;
        console.log(file_path, "file");
        var a = document.createElement("A");
        a.href = file_path;
        a.download = file_path.substr(file_path.lastIndexOf("/") + 1);
        a.target = "_blank"; // Open in a new tab
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
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
            const getDisbursementDate = item?.disbursement_details?.disbursementDate ? formatDate(item.disbursement_details.disbursementDate) : '';
            const getDisbursementAmount = item?.disbursement_details?.disbursementAmount || '';
            const getBank = item?.login_details?.bankName || '';
            const getProduct = item?.login_details?.product || '';
            const getPropertyDetails = item?.login_details?.propertyDetails || '';
            const getInsurance = item?.disbursement_details?.insurance || '';
            const getRate = item?.disbursement_details?.disbursementRate || '';
            const getCode = item?.login_details?.code_name || '';
            const getSMName = item?.login_details?.smName || '';
            const getStatus = getStatusLabel(item?.status || '');
            const getRemarks = item?.disbursement_details?.remark_dis || '';

            return {
                'Sr. No.': index + 1,
                'Date': getDisbursementDate,
                'Name': getName,
                'Mobile No.': getMobile,
                'Disbursement Amount': getDisbursementAmount,
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
        XLSX.writeFile(wb, "loan_completed_data.xlsx");
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
                <div style={{width:'100%',overflow:'auto'}}>
                    <table className="universal-table">
                        <thead>
                            <tr>
                                <th>S.No</th>
                                <th>Disbursement Date</th>
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
                                    const loanStatus = item?.status || "";
                                    const disbursementAmount = item?.disbursement_details?.disbursementAmount;
                                    const loanAccount = item?.login_details?.loanAccountNumber;
                                    const product = item?.login_details?.product;
                                    const bank = item?.login_details?.bankName;
                                    
                                    // Format the disbursement date from the nested object
                                    let rawDisbursementDate = null;
                                    
                                    if (item?.disbursement_details?.disbursementDate) {
                                        rawDisbursementDate = item.disbursement_details.disbursementDate;
                                    } else if (item?.disbursement_date) {
                                        rawDisbursementDate = item.disbursement_date;
                                    }
                                    
                                    const disbursementDate = rawDisbursementDate ? formatDate(rawDisbursementDate) : '-';

                                    return (
                                        <tr key={index}>
                                            <td>{indexOfFirstItem + index + 1}</td>
                                            <td>{disbursementDate}</td>
                                            {headings.map((heading, hIndex) => {
                                                // For debugging - log each heading key to help identify issues
                                                console.log(`Processing heading: ${heading.key} for row ${index}`);
                                                
                                                // Handle different field mappings
                                                let cellValue = '';
                                                
                                                if (heading.key === "pdfname") {
                                                    // PDF handling
                                                    cellValue = (
                                                        <>
                                                            {item.pdfname &&
                                                                item.pdfname.split(",").map((pdf, idx) => (
                                                                    <div key={idx}>
                                                                        <a>
                                                                            Year: {item.categoryname?.split(",")[idx]} --
                                                                        </a>
                                                                        <a
                                                                            href="#"
                                                                            onClick={() => redirectpage(pdf)}
                                                                        >
                                                                            {pdf.slice(37)}
                                                                        </a>
                                                                        {idx < item.pdfname.split(",").length - 1 ? ", " : ""}
                                                                    </div>
                                                                ))}
                                                        </>
                                                    );
                                                } else if (heading.key === "status") {
                                                    // Status handling
                                                    cellValue = (
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <span className={`status-box ${getStatusClass(loanStatus)}`}>
                                                                {getStatusLabel(loanStatus) || "No Status"}
                                                            </span>
                                                        </div>
                                                    );
                                                } else if (heading.key === "details.login_details.loanAccountNumber" || 
                                                           heading.key === "login_details.loanAccountNumber") {
                                                    cellValue = loanAccount || '';
                                                } else if (heading.key === "details.login_details.loanAmount" || 
                                                           heading.key === "login_details.loanAmount") {
                                                    cellValue = disbursementAmount || '';
                                                } else if (heading.key === "details.login_details.product" || 
                                                           heading.key === "login_details.product") {
                                                    cellValue = product || '';
                                                } else if (heading.key === "details.login_details.bank" || 
                                                           heading.key === "login_details.bankName") {
                                                    cellValue = bank || '';
                                                } else if (heading.key === "disbursement_details.disbursementDate" || 
                                                           heading.key === "details.disbursement_details.disbursementDate" ||
                                                           heading.key === "disbursementDate") {
                                                    console.log("Found disbursement date column", heading.key, disbursementDate);
                                                    cellValue = disbursementDate;
                                                } else {
                                                    // Default field handling
                                                    cellValue = item[heading.key] || '';
                                                }
                                                
                                                return (
                                                    <td key={hIndex}>
                                                        {cellValue}
                                                    </td>
                                                );
                                            })}
                                            <td>
                                                <div style={{ padding: "0px", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                                    <button 
                                                      className="action-btn edit-btn" 
                                                        onClick={() => handleEdit(item)}
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
                                                        onClick={() => handleView(item)}
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
                </div>
                {filteredData && (
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

export default LoanDisburseTable;