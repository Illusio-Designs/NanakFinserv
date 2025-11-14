import React, { useState } from 'react';
import '../../styles/components/common/Table.css';
import Button from './Button';
import { FiEye, FiEdit2, FiTrash2, FiRefreshCw } from 'react-icons/fi';

const Table = ({ columns, data, onEdit, onDelete, onView, onRenewal, pagination = true, itemsPerPage = 25, showActions = false, actionButtons = [], loading = false }) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Safety check for data and columns
  const safeData = data || [];
  const safeColumns = columns || [];

  const totalPages = Math.ceil(safeData.length / itemsPerPage);
  const paginatedData = safeData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
   console.log("🧮 [Table] Props received:");
  console.log("Columns:", columns);
  console.log("Data:", data);
  console.log("Paginated Data:", paginatedData);

  return (
    <div className="common-table-wrapper">
      {loading ? (
        <div className="table-loader-container">
          <div className="table-loader">
            <div className="spinner"></div>
            <p>Loading data...</p>
          </div>
        </div>
      ) : (
        <>
          <table className="common-table">
            <thead>
              <tr>
                <th>S.No</th>
                {safeColumns.map(col => (
                  <th key={col.key}>{col.title}</th>
                ))}
                {(onEdit || onDelete || onView || onRenewal || showActions) && <th>Actions</th>}
              </tr>
            </thead>
           <tbody>
  {paginatedData.length === 0 ? (
    <tr>
      <td colSpan={safeColumns.length + 2}>No data found</td>
    </tr>
  ) : (
    paginatedData.map((row, idx) => {
      // ✅ You can safely log inside this block
      console.log("➡️ Rendering row:", row);

      return (
        <tr key={idx}>
          <td>{(currentPage - 1) * itemsPerPage + idx + 1}</td>
          {safeColumns.map(col => (
            <td key={col.key}>{row[col.key]}</td>
          ))}

          {(onEdit || onDelete || onView || onRenewal || showActions) && (
            <td className="action-buttons">
              {onView && (
                <button
                  onClick={() => onView(row)}
                  className="action-btn view-btn"
                  title="View Details"
                  style={{
                    cursor: 'pointer',
                    width: '40px',
                    height: '40px',
                    border: '2px solid #3b82f6',
                    borderRadius: '8px',
                    background: '#3b82f6',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    margin: '0 4px',
                    boxShadow: '0 2px 8px rgba(59,130,246,0.2)',
                  }}
                >
                  <FiEye size={20} strokeWidth={2.5} />
                </button>
              )}

              {onEdit && (
                <button
                  onClick={() => onEdit(row)}
                  className="action-btn edit-btn"
                  title="Edit Record"
                  style={{
                    cursor: 'pointer',
                    width: '40px',
                    height: '40px',
                    border: '2px solid #f59e0b',
                    borderRadius: '8px',
                    background: '#f59e0b',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    margin: '0 4px',
                    boxShadow: '0 2px 8px rgba(245,158,11,0.2)',
                  }}
                >
                  <FiEdit2 size={20} strokeWidth={2.5} />
                </button>
              )}

              {onRenewal && (
                <button
                  onClick={() => onRenewal(row)}
                  className="action-btn renewal-btn"
                  title="Renew Policy"
                  style={{
                    cursor: 'pointer',
                    width: '40px',
                    height: '40px',
                    border: '2px solid #10b981',
                    borderRadius: '8px',
                    background: '#10b981',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    margin: '0 4px',
                    boxShadow: '0 2px 8px rgba(16,185,129,0.2)',
                  }}
                >
                  <FiRefreshCw size={20} strokeWidth={2.5} />
                </button>
              )}

              {onDelete && (
                <button
                  onClick={() => onDelete(row)}
                  className="action-btn delete-btn"
                  title="Delete Record"
                  style={{
                    cursor: 'pointer',
                    width: '40px',
                    height: '40px',
                    border: '2px solid #ef4444',
                    borderRadius: '8px',
                    background: '#ef4444',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    margin: '0 4px',
                    boxShadow: '0 2px 8px rgba(239,68,68,0.2)',
                  }}
                >
                  <FiTrash2 size={20} strokeWidth={2.5} />
                </button>
              )}
            </td>
          )}
        </tr>
      );
    })
  )}
</tbody>

          </table>
          {pagination && totalPages > 1 && (
            <div className="common-table-pagination">
              <Button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</Button>
              <span>Page {currentPage} of {totalPages}</span>
              <Button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Table; 