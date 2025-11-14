import React from 'react';
import '../../styles/components/common/Card.css';

const Card = ({ children, className = '', ...rest }) => (
  <div className={`common-card ${className}`} {...rest}>
    {children}
  </div>
);

export default Card; 