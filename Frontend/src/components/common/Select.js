import React from 'react';
import ReactSelect from 'react-select';
import '../../styles/components/common/Select.css';

const Select = ({ options, value, onChange, isMulti = false, className = '', ...rest }) => (
  <ReactSelect
    options={options}
    value={value}
    onChange={onChange}
    isMulti={isMulti}
    className={`common-select ${className}`}
    classNamePrefix="common-select"
    {...rest}
  />
);

export default Select; 