import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import './Login.css';
import { login } from '../serviceAPI/userAPI';
const Login = () => {
  const navigate = useNavigate();
  // const mobileInputRef = useRef(null);
  const firstOtpInputRef = useRef(Array.from({ length: 6 }).map(() => React.createRef()));
  const [mobileNumber, setMobileNumber] = useState('9426818697');
  const [otp, setOtp] = useState(Array.from({ length: 6 }).map(() => ''));
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const setUpRecaptcha = () => {
    window.recaptchaVerifier = new RecaptchaVerifier('recaptcha', {
      'size': 'invisible',
      'callback': (response) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
        // ...
      }
    }, auth);
  };

  useEffect(() => {
    setUpRecaptcha();
  }, []);

  const handleSendOtp = async () => {
    const phoneNumber = `+91${mobileNumber}`;
    const appVerifier = window.recaptchaVerifier;
    console.log(phoneNumber);
    if (!phoneNumber) {
      console.error("Invalid phone number");
      return;
    }

    if (!appVerifier) {
      setUpRecaptcha();
    }
    signInWithPhoneNumber(auth, phoneNumber, appVerifier)
      .then((confirmationResult) => {
        window.confirmationResult = confirmationResult;
        setOtpSent(true);
        if (firstOtpInputRef.current[0] && firstOtpInputRef.current[0].current) {
          firstOtpInputRef.current[0].current.focus();
        }
      }).catch((error) => {
        console.error("Error sending OTP:", error);
      });
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');
    window.confirmationResult.confirm(code).then(async (result) => {
      const user = result.user;
      console.log("OTP verified! User:", user);
      const loggedIn = await login(mobileNumber);
      if (loggedIn) {
        setOtpVerified(true);
        navigate('/dashboard');
        // Redirect or do something after successful login
      } else {
        // Handle login failure
      }

    }).catch((error) => {
      console.error("Error verifying OTP:", error);
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
            // ref={mobileInputRef}
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            disabled={otpSent}
          />
        </div>
        {!otpSent && (
          <button
            className="btn"
            id="send-otp-button"
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
        <div id="recaptcha"></div>
      </div>
    </div>
  );
};

export default Login;