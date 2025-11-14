import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../../styles/components/common/DatePicker.css';

const CommonDatePicker = ({ value, onChange, ...props }) => {
  return (
    <DatePicker
      selected={value}
      onChange={onChange}
      className="common-datepicker"
      calendarClassName="common-datepicker-calendar"
      dateFormat="dd/MM/yyyy"
      placeholderText="Select date"
      {...props}
    />
  );
};

export default CommonDatePicker; 