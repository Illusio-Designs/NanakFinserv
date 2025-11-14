import React from 'react';
import '../../styles/components/common/Pagination.css';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="common-pagination">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous"
      >
        <svg viewBox="0 0 20 20" fill="none"><path d="M13 15l-5-5 5-5" stroke="#6366f1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      {getPages().map((page, idx) =>
        page === '...'
          ? <span key={idx} style={{ padding: '0 8px', color: '#64748b' }}>…</span>
          : <button
              key={page}
              className={page === currentPage ? 'active' : ''}
              aria-current={page === currentPage ? 'true' : undefined}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next"
      >
        <svg viewBox="0 0 20 20" fill="none"><path d="M7 5l5 5-5 5" stroke="#6366f1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
    </div>
  );
};

export default Pagination; 