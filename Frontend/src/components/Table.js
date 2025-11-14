import React, { useState, useEffect } from "react";
import "./Table.css";
import Search from "./Search";
import { useNavigate, useParams } from "react-router-dom";
import { DOWNLOAD_URL } from "../serviceAPI/userAPI";

const Table = ({
  headings,
  data,
  handleEdit,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  sortColumn,
  sortDirection,
  handleSort,
  setItemsPerPage,
  verticleOptions,
  onVerticalChange,
  onStatusChange,
  handleDelete,
}) => {
  // Ensure data is always an array
  const safeData = Array.isArray(data) ? data : [];
  const [filteredData, setFilteredData] = useState(safeData);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState({});
  const [inputValue, setInputValue] = useState({});
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    // Update filteredData when data or searchTerm changes
    const dataToFilter = Array.isArray(data) ? data : [];
    const newData = dataToFilter.filter((item) =>
      Object.values(item).some((val) =>
        String(val).toLowerCase().includes(searchTerm)
      )
    );
    setFilteredData(newData);
  }, [data, searchTerm]);

  const handleSearch = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    setSearchTerm(searchTerm);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchTerm("");
    const dataToFilter = Array.isArray(data) ? data : [];
    setFilteredData(dataToFilter);
  };

  const sortedData = [...filteredData].sort((a, b) => {
    if (sortColumn) {
      const aValue = String(a[sortColumn] || '').toLowerCase();
      const bValue = String(b[sortColumn] || '').toLowerCase();
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    }
    return 0;
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
          className={`page-number ${
            currentPage === totalPages ? "active" : ""
            }`}
        >
          {totalPages}
        </button>
      );
    }

    return pages;
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
          <div className="table-h-c"></div>
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
            {currentData && currentData.length > 0 ? (
              currentData.map((item, index) => {
                return (
                  <tr key={index}>
                    <td>{indexOfFirstItem + index + 1}</td>
                    {headings.map((heading, hIndex) => (
                      <td key={hIndex}>
                        {item[heading.key] || ''}
                      </td>
                    ))}
                    <td>
                      <div style={{ display: 'flex', gap: '8px', padding: '0px' }}>
                        <div onClick={() => handleEdit(item)}>
                          <img className="table-edit" src="/Assets/edit.png" alt="edit" />
                        </div>
                        {typeof handleDelete === 'function' && item.id && (
                          <div onClick={() => handleDelete(item.id)}>
                            <img className="table-edit" src="/Assets/delete.png" alt="delete" />
                          </div>
                        )}
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
        {filteredData && totalPages > 1 && (
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

export default Table;
