// src/pages/Login.js
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '../firebase';

const Login = () => {
  const navigate = useNavigate();
  const mobileInputRef = useRef(null);
  const firstOtpInputRef = useRef(Array.from({ length: 6 }).map(() => React.createRef()));
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState(Array.from({ length: 6 }).map(() => ''));
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [verificationId, setVerificationId] = useState(null);

  const handleSendOtp = () => {
    window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
      'size': 'invisible',
      'callback': (response) => {
        console.log('reCAPTCHA solved');
      }
    }, auth);

    signInWithPhoneNumber(auth, `+1${mobileNumber}`, window.recaptchaVerifier)
      .then((confirmationResult) => {
        setVerificationId(confirmationResult.verificationId);
        setOtpSent(true);
        if (firstOtpInputRef.current[0] && firstOtpInputRef.current[0].current) {
          firstOtpInputRef.current[0].current.focus();
        }
      }).catch((error) => {
        console.error('Error during signInWithPhoneNumber:', error);
      });
  };

  const handleVerifyOtp = () => {
    const code = otp.join('');
    const credential = auth.PhoneAuthProvider.credential(verificationId, code);

    auth.signInWithCredential(credential)
      .then((result) => {
        console.log('User signed in successfully:', result.user);
        setOtpVerified(true);
        navigate('/dashboard');
      }).catch((error) => {
        console.error('Error during signInWithCredential:', error);
      });
  };

  const handleOtpChange = (index, value) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    if (value !== '' && index < newOtp.length - 1 && firstOtpInputRef.current[index + 1] && firstOtpInputRef.current[index + 1].current) {
      firstOtpInputRef.current[index + 1].current.focus();
    }
    setOtp(newOtp);
  };

  return (
    <div className='main'>
      <div className="login-container">
        <h2>Login with OTP</h2>
        <div className="input-group">
          <label htmlFor="phoneNumber">Mobile Number</label>
          <input
            type="text"
            id="phoneNumber"
            ref={mobileInputRef}
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            disabled={otpSent}
          />
        </div>
        <div id="recaptcha-container"></div>
        {!otpSent && (
          <button
            className="btn"
            onClick={handleSendOtp}
            disabled={!mobileNumber || mobileNumber.length !== 10}
          >
            Send OTP
          </button>
        )}
        {otpSent && (
          <div className="otp-section">
            <div className="input-group">
              <label htmlFor="otp">OTP</label>
              <div className="otp-inputs">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    className="otp-input"
                    ref={firstOtpInputRef.current[index]}
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                  />
                ))}
              </div>
            </div>
            <button
              className="btn"
              onClick={handleVerifyOtp}
              disabled={!otp.every(digit => digit)}
            >
              Verify OTP
            </button>
          </div>
        )}
        {otpVerified && (
          <div className="verified-message">
            <p>OTP Verified!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
