import React, { useEffect } from 'react';
import '../../styles/components/common/Toaster.css';

const Toaster = ({ message, type = 'info', open, onClose, duration = 3000 }) => {
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        onClose && onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [open, duration, onClose]);

  if (!open) return null;

  return (
    <div className={`common-toaster ${type}`}>
      <span className="toaster-icon">
        {type === 'success' && '✔️'}
        {type === 'error' && '❌'}
        {type === 'info' && 'ℹ️'}
        {type === 'warning' && '⚠️'}
      </span>
      <span className="toaster-message">{message}</span>
      <button className="toaster-close" onClick={onClose}>×</button>
    </div>
  );
};

export default Toaster; 