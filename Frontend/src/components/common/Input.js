import React from 'react';
import '../../styles/components/common/Input.css';
import 'react-phone-input-2/lib/style.css';
import PhoneInput from 'react-phone-input-2';

const Input = ({ type = 'text', value, onChange, ...props }) => {
  if (type === 'file') {
    return (
      <input
        type="file"
        className="common-input"
        onChange={onChange}
        {...props}
      />
    );
  }
  if (type === 'tel') {
    return (
      <PhoneInput
        country={'in'}
        value={value}
        onChange={onChange}
        inputClass="common-input phone-input"
        containerClass="phone-input"
        inputStyle={{ width: '100%' }}
        {...props}
      />
    );
  }
  if (type === 'otp') {
    return (
      <div className="otp-input-wrapper">
        {[...Array(6)].map((_, idx) => (
          <input
            key={idx}
            type="text"
            maxLength={1}
            className="common-input otp-input-box"
            onChange={e => onChange(e, idx)}
            {...(props.otpValues ? { value: props.otpValues[idx] || '' } : {})}
            {...props}
          />
        ))}
      </div>
    );
  }
  return (
    <input
      type={type}
      className="common-input"
      value={value}
      onChange={onChange}
      {...props}
    />
  );
};

export default Input; 