import React from 'react';
import '../../styles/components/common/Search.css';

const Search = ({ value, onChange, placeholder = 'Search...', className = '', ...rest }) => (
  <input
    type="text"
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`common-search ${className}`}
    {...rest}
  />
);

export default Search; 