import React from 'react';
import '../../styles/components/common/Button.css';

const Button = ({ type = 'button', onClick, children, className = '', ...rest }) => (
  <button type={type} onClick={onClick} className={`common-btn ${className}`} {...rest}>
    {children}
  </button>
);

export default Button; 