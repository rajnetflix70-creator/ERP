import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { login as loginApi, register as registerApi, requestOtp, verifyOtp } from '../api/auth';
import LanguageSwitcher from '../components/LanguageSwitcher';

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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface)', padding: '20px' }}>
      
      <div style={{ position: 'absolute', top: 20, right: 20, background: 'var(--color-header)', padding: '4px', borderRadius: '6px' }}>
        <LanguageSwitcher />
      </div>

      <div className="card" style={{ width: '100%', maxWidth: '420px' }}>
        <div className="text-center mb-4">
          <h1 style={{ color: 'var(--color-header)', fontSize: '2rem', marginBottom: '8px' }}>🏗 SiteTrack</h1>
        </div>

        {error && <div className="alert alert-error mb-4">{error}</div>}

        <div className="tabs">
          <button className={`tab-btn w-full ${tab === 'email' ? 'active' : ''}`} onClick={() => setTab('email')}>
            {t('auth.loginWithEmail')}
          </button>
          <button className={`tab-btn w-full ${tab === 'otp' ? 'active' : ''}`} onClick={() => setTab('otp')}>
            {t('auth.loginWithOTP')}
          </button>
          <button className={`tab-btn w-full ${tab === 'google' ? 'active' : ''}`} onClick={() => setTab('google')}>
            {t('auth.loginWithGoogle')}
          </button>
        </div>

        {tab === 'email' && (
          <form onSubmit={handleEmailSubmit}>
            {isRegister && (
              <div className="form-group">
                <label className="form-label">{t('common.name')}</label>
                <input type="text" className="form-control" value={fullName} onChange={e => setFullName(e.target.value)} required />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">{t('auth.email')}</label>
              <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">{t('auth.password')}</label>
              <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
              {loading ? t('common.loading') : (isRegister ? t('auth.register') : t('auth.login'))}
            </button>
            <div className="text-center mt-4">
              <button type="button" onClick={() => setIsRegister(!isRegister)} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: '600' }}>
                {isRegister ? t('auth.haveAccount') : t('auth.noAccount')}
              </button>
            </div>
          </form>
        )}

        {tab === 'otp' && (
          <div>
            <div className="alert alert-info mb-3" style={{ fontSize: '0.85rem' }}>
              💡 <strong>Demo Mobile Login:</strong> Enter any mobile number and use OTP code <strong>123456</strong>.
            </div>
            {!otpSent ? (
              <div className="form-group">
                <label className="form-label">{t('auth.mobile')}</label>
                <input type="text" className="form-control mb-3" placeholder="+971501234567" value={mobile} onChange={e => setMobile(e.target.value)} />
                <button type="button" className="btn btn-primary w-full btn-lg" onClick={handleSendOtp} disabled={loading || !mobile}>
                  {loading ? t('common.loading') : t('auth.sendOtp')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleVerifyOtp}>
                <div className="form-group">
                  <label className="form-label">{t('auth.otp')} (Use 123456)</label>
                  <input type="text" className="form-control mb-3" placeholder="123456" value={otpCode} onChange={e => setOtpCode(e.target.value)} required />
                  <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
                    {loading ? t('common.loading') : t('auth.verifyOtp')}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {tab === 'google' && (
          <div className="text-center">
            {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
              <div id="googleSignInDiv"></div>
            ) : (
              <div className="alert alert-warning">
                Google Sign-In requires a Google Client ID. Set VITE_GOOGLE_CLIENT_ID in your .env file.
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Login;
