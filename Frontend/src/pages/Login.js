import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/Login.css';
import { login } from '../serviceAPI/userAPI';
import FlagDropdown from './Flag';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const firstOtpInputRef = useRef(Array.from({ length: 6 }).map(() => React.createRef()));
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState(Array.from({ length: 6 }).map(() => ''));
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [isResending, setIsResending] = useState(false);
  
  // Initialize MSG91 provider once without identifier; expose methods for later use
  useEffect(() => {
    if (!window.initSendOTP) {
      console.warn('[Login] initSendOTP not available yet');
      return;
    }
    try {
      window.initSendOTP({
        widgetId: "346776667162353937323330",
        tokenAuth: "426738TclvGmDmM66a8ec44P1",
        exposeMethods: true,
        success: () => console.log('[Login] Provider initialized'),
        failure: (e) => console.warn('[Login] Provider init failed', e)
      });
    } catch (e) {
      console.error('[Login] Provider init exception', e);
    }
  }, []);

  // Function to handle sending OTP
  const handleSendOtp = useCallback(async (isResend = false) => {
    const regex = /^\d{10}$/;
    if (!regex.test(mobileNumber)) {
      alert('Mobile number invalid');
      return;
    }

    if (isResend) {
      setIsResending(true);
      // Clear OTP fields when resending
      setOtp(Array.from({ length: 6 }).map(() => ''));
    }

    const identifier = `91${mobileNumber}`;
    const successCb = (data) => {
      console.log('[Login][SendOTP] success', { data, identifier });
      setOtpSent(true);
      setIsResending(false);
      if (isResend) {
        toast.success('OTP resent successfully!', {
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
          },
        });
      }
    };
    const failureCb = (error) => {
      console.error('[Login][SendOTP] failure', { error, identifier });
      setIsResending(false);
      if (isResend) {
        toast.error('Failed to resend OTP. Please try again.', {
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
          },
        });
      }
    };

    if (window.sendOtp) {
      // Preferred: use exposed method from one-time init
      try {
        // IMPORTANT: send only identifier + callbacks; creds were set during init
        window.sendOtp(identifier, successCb, failureCb);
      } catch (err) {
        console.error('[Login] sendOtp threw', err);
        // Fallback retry via init
        if (window.initSendOTP) {
          console.warn('[Login] Retrying via initSendOTP after sendOtp error');
          window.initSendOTP({
            widgetId: "346776667162353937323330",
            tokenAuth: "426738TclvGmDmM66a8ec44P1",
            exposeMethods: true,
            identifier,
            success: successCb,
            failure: failureCb
          });
        }
      }
    } else if (window.initSendOTP) {
      // Fallback: initialize with identifier if exposed method not present
      window.initSendOTP({
        widgetId: "346776667162353937323330",
        tokenAuth: "426738TclvGmDmM66a8ec44P1",
        exposeMethods: true,
        identifier,
        success: successCb,
        failure: failureCb
      });
    } else {
      console.error('OTP provider not available');
      setIsResending(false);
    }
  }, [mobileNumber]);

  // Function to handle verifying OTP
  const handleVerifyOtp = useCallback(async () => {
    const code = otp.join('');

    // Call the verifyOtp method
    window.verifyOtp(code, async (data) => {
      // MSG91 returns the access-token on success (in data.message). Pass it to
      // the backend so the OTP can be verified server-side before login.
      const accessToken =
        (data && (data.message || data['access-token'] || data.accessToken)) || '';
      const loggedIn = await login(mobileNumber, accessToken);
      console.log('🔍 [LOGIN] login result:', loggedIn);
      
      if (loggedIn) {
        setOtpVerified(true);
        navigate('/dashboard');
      } else {
        toast.error('User not found. Please contact administrator to register your account.', {
          duration: 5000, // 5 seconds
          style: {
            background: '#333',
            color: '#fff',
          },
        });
      }
    }, (error) => {
      console.error('Error verifying OTP:', error);
      toast.error('Otp verification faild', {
        duration: 3000, // 5 seconds
        style: {
          background: '#333',
          color: '#fff',
        },
      });
    });
  }, [mobileNumber, otp, navigate]);

  const handleOtpChange = (index, value) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    if (value !== '' && index < newOtp.length - 1 && firstOtpInputRef.current[index + 1] && firstOtpInputRef.current[index + 1].current) {
      firstOtpInputRef.current[index + 1].current.focus();
    } else if (value === '' && index > 0 && firstOtpInputRef.current[index - 1] && firstOtpInputRef.current[index - 1].current) {
      firstOtpInputRef.current[index - 1].current.focus();
    }
    setOtp(newOtp);
  };

  // Avoid Enter-key trigger to prevent accidental double send
  // const handleSendOtpOnEnter = (e) => {
  //   if (e.key === 'Enter' && mobileNumber && mobileNumber.length === 10) {
  //     handleSendOtp();
  //   }
  // };

  // Function to handle Enter key for "Verify OTP"
  const handleVerifyOtpOnEnter = (e) => {
    if (e.key === 'Enter' && otp.every(digit => digit)) {
      handleVerifyOtp();
    }
  };

  return (
    <>
      <div className="login">
        <div className='container'>
          <div className='row'>
            <div className='col-12'>
              <div className='row'>
                <div className='col-lg-6 m-0 p-0'>
                  <div className='login-img' style={{ backgroundImage: "url('Assets/login-img.jpg')", backgroundRepeat: "no-repeat", backgroundSize: "100% 100%", height: "100%" }}></div>
                </div>
                <div className='col-lg-6'>
                  <div className='login-form'>
                    <h2 className='text-center'>Login with OTP</h2>
                    <div className='forms'>
                      <label htmlFor="phoneNumber" className='mb-2 label'>Enter Mobile Number</label>
                      <div className='phone-style'>
                        <FlagDropdown />
                        <input type="tel" id='phoneNumber' value={mobileNumber} className="form-control mb-4 mobile" onChange={(e) => setMobileNumber(e.target.value)} disabled={otpSent} placeholder="Mobile Nmber" />
                      </div>

                      {!otpSent && (
                        <button
                          className="btn btn-white"
                          onClick={handleSendOtp}
                          disabled={!mobileNumber || mobileNumber.length !== 10}
                        >
                          Send OTP
                        </button>

                      )}
                      {otpSent && (
                        <div className="otp-section">
                          <label htmlFor="otp" className='mb-2'>OTP</label>
                          <div className="otp-inputs d-flex">
                            {otp.map((digit, index) => (
                              <input key={index} type="text" className="form-control" ref={firstOtpInputRef.current[index]} maxLength={1} value={digit} onChange={(e) => handleOtpChange(index, e.target.value)}  onKeyDown={handleVerifyOtpOnEnter}/>
                            ))}
                          </div>
                          <button
                            className="btn btn-white mt-4" onClick={handleVerifyOtp} disabled={!otp.every(digit => digit)} >
                            Verify OTP
                          </button>
                          <div className="resend-otp-container mt-3">
                            <button
                              className="btn-resend-otp"
                              onClick={() => handleSendOtp(true)}
                              disabled={isResending}
                            >
                              {isResending ? 'Sending...' : 'Resend OTP'}
                            </button>
                          </div>
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;