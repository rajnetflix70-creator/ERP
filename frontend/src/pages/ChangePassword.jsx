import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import client from '../api/client';

const ChangePassword = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (formData.new_password !== formData.confirm_password) {
      setError('New Password and Confirm Password do not match.');
      return;
    }
    if (formData.new_password.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await client.put(`/employees/${user?.id}`, {
        password: formData.new_password,
        old_password: formData.old_password
      });
      setSuccess(true);
      setFormData({ old_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password. Please check your old password.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    outline: 'none',
    fontSize: '14px',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    width: '160px',
    fontWeight: '700',
    fontSize: '14px',
    color: '#2d3748',
    textAlign: 'right',
    paddingRight: '20px',
    flexShrink: 0
  };

  return (
    <div style={{ padding: '20px', background: '#f4f6f9', minHeight: '100vh' }}>
      <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#333', marginBottom: '20px' }}>
        Change Password
      </h2>

      <div style={{ background: '#fff', borderRadius: '4px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {/* Header strip */}
        <div style={{ padding: '10px 16px', background: '#2b3a52', borderBottom: '1px solid #edf2f7' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#fff', letterSpacing: '0.5px' }}>
            PASSWORD FIELDS
          </span>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '35px 60px', maxWidth: '780px', margin: '0 auto' }}>
          {/* Success / Error alerts */}
          {success && (
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '4px', padding: '10px 16px', marginBottom: '20px', color: '#16a34a', fontWeight: '600' }}>
              ✅ Password changed successfully!
            </div>
          )}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '4px', padding: '10px 16px', marginBottom: '20px', color: '#dc2626', fontWeight: '600' }}>
              ❌ {error}
            </div>
          )}

          {/* Profile Name (read-only display) */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '22px' }}>
            <span style={labelStyle}>Profile Name</span>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#2d3748', background: '#f7fafc', padding: '8px 14px', borderRadius: '4px', border: '1px solid #e2e8f0', minWidth: '160px' }}>
              {user?.full_name || user?.name || 'Store Admin'}
            </span>
          </div>

          {/* Old Password */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '22px' }}>
            <label style={labelStyle}>Old Password</label>
            <input
              type="password"
              required
              value={formData.old_password}
              onChange={(e) => setFormData({ ...formData, old_password: e.target.value })}
              style={inputStyle}
            />
          </div>

          {/* New Password */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '22px' }}>
            <label style={labelStyle}>New Password</label>
            <input
              type="password"
              required
              value={formData.new_password}
              onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
              style={inputStyle}
            />
          </div>

          {/* Confirm Password */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '35px' }}>
            <label style={labelStyle}>Confirm Password</label>
            <input
              type="password"
              required
              value={formData.confirm_password}
              onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
              style={inputStyle}
            />
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: '#2b5876',
                color: '#fff',
                padding: '10px 32px',
                borderRadius: '4px',
                border: 'none',
                fontWeight: '700',
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Changing…' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
