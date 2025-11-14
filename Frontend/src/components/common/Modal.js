import React from 'react';
import '../../styles/components/common/Modal.css';

const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="common-modal-overlay">
      <div className="common-modal" onClick={e => e.stopPropagation()}>
        <div className="common-modal-header">
          <h2>{title}</h2>
          <button className="common-modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="common-modal-body">{children}</div>
      </div>
    </div>
  );
};

export default Modal; 