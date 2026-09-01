import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { login as loginApi, register as registerApi, requestOtp, verifyOtp } from '../api/auth';
import LanguageSwitcher from '../components/LanguageSwitcher';
import './Login.css';

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  
  const [tab, setTab] = useState('email'); // email, otp, google
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isRegister) {
        await registerApi(fullName, email, password);
        const data = await loginApi(email, password);
        login(data.token, data.user);
      } else {
        const data = await loginApi(email, password);
        login(data.token, data.user);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!mobile) return;
    setLoading(true);
    setError(null);
    try {
      await requestOtp(mobile);
      setOtpSent(true);
    } catch (err) {
      setError(err.response?.data?.error || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await verifyOtp(mobile, otpCode);
      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Left Branding Panel */}
      <div className="login-left-panel">
        <div className="login-branding">
          <div className="login-branding-logo">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
            <h1>SITETRACK</h1>
          </div>
          <p>Modern Site Performance Monitoring.</p>
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="login-right-panel">
        <div className="language-switcher-container">
          <LanguageSwitcher />
        </div>

        <div className="login-form-container">
          <div className="login-header">
            <h2>Welcome to SiteTrack</h2>
            <p>Sign in to your dashboard</p>
          </div>

          {error && <div className="alert alert-error mb-4">{error}</div>}

          <div className="login-tabs">
            <button className={`tab-btn ${tab === 'email' ? 'active' : ''}`} onClick={() => setTab('email')}>
              {t('auth.loginWithEmail', 'Email')}
            </button>
            <button className={`tab-btn ${tab === 'otp' ? 'active' : ''}`} onClick={() => setTab('otp')}>
              {t('auth.loginWithOTP', 'OTP')}
            </button>
            <button className={`tab-btn ${tab === 'google' ? 'active' : ''}`} onClick={() => setTab('google')}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              {t('auth.loginWithGoogle', 'Google')}
            </button>
          </div>

          {tab === 'email' && (
            <form onSubmit={handleEmailSubmit}>
              {isRegister && (
                <div className="form-group">
                  <label>Full Name</label>
                  <div className="input-with-icon">
                    <svg className="field-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="John Doe" />
                  </div>
                </div>
              )}
              
              <div className="form-group">
                <label>Work Email</label>
                <div className="input-with-icon">
                  <svg className="field-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="johndoe@company.com" />
                </div>
              </div>
              
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label>Password</label>
                <div className="input-with-icon">
                  <svg className="field-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
                </div>
              </div>
              
              {!isRegister && (
                <a href="#" className="forgot-password">Forgot Password?</a>
              )}
              
              <button type="submit" className="btn-primary-pill" disabled={loading}>
                {loading ? 'LOADING...' : (isRegister ? 'REGISTER' : 'LOGIN')}
              </button>
            </form>
          )}

          {tab === 'otp' && (
            <div>
              <div className="alert alert-info mb-3" style={{ fontSize: '0.85rem' }}>
                💡 <strong>Demo:</strong> Enter any number, use OTP <strong>123456</strong>
              </div>
              {!otpSent ? (
                <div className="form-group">
                  <label>Mobile Number</label>
                  <div className="input-with-icon" style={{ marginBottom: '24px' }}>
                    <svg className="field-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                    <input type="text" placeholder="+971501234567" value={mobile} onChange={e => setMobile(e.target.value)} />
                  </div>
                  <button type="button" className="btn-primary-pill" onClick={handleSendOtp} disabled={loading || !mobile}>
                    {loading ? 'LOADING...' : 'SEND OTP'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleVerifyOtp}>
                  <div className="form-group">
                    <label>Enter OTP Code</label>
                    <div className="input-with-icon" style={{ marginBottom: '24px' }}>
                      <svg className="field-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      <input type="text" placeholder="123456" value={otpCode} onChange={e => setOtpCode(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn-primary-pill" disabled={loading}>
                      {loading ? 'LOADING...' : 'VERIFY OTP'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {tab === 'google' && (
            <div className="text-center" style={{ margin: '40px 0' }}>
              {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
                <div id="googleSignInDiv"></div>
              ) : (
                <div className="alert alert-warning">
                  Google Sign-In requires a Google Client ID set in .env.
                </div>
              )}
            </div>
          )}

          <div className="divider">Or sign in with SSO</div>
          
          <div className="signup-text">
            {isRegister ? 'Already have an account?' : "Don't have an account?"} {' '}
            <button type="button" className="signup-link" onClick={() => setIsRegister(!isRegister)}>
              {isRegister ? 'Sign in' : 'Sign up'}
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Login;
