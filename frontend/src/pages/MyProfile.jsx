import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import client from '../api/client';

const MyProfile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    gender: 'Male',
    profile_image: null,
    email: '',
    mobile: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    country: '',
    pin_code: '',
    signature_image: null
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.full_name || user.name || 'Store Admin',
        dob: user.dob || '1985-03-10',
        gender: user.gender || 'Male',
        profile_image: null,
        email: user.email || '',
        mobile: user.mobile_number || user.mobile || '',
        address1: user.address1 || '',
        address2: user.address2 || '',
        city: user.city || '',
        state: user.state || '',
        country: user.country || '',
        pin_code: user.pin_code || '',
        signature_image: null
      });
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    try {
      const payload = {
        full_name: formData.name,
        dob: formData.dob,
        gender: formData.gender,
        mobile_number: formData.mobile,
        address1: formData.address1,
        address2: formData.address2,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        pin_code: formData.pin_code
      };
      if (user?.id) {
        await client.put(`/employees/${user.id}`, payload);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Error updating profile: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', background: '#f4f6f9', minHeight: '100vh' }}>
      {/* Profile Header / Avatar */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{
          width: '90px', height: '90px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #2b5876 0%, #4e8098 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '36px', color: '#fff', fontWeight: '700',
          boxShadow: '0 4px 15px rgba(43,88,118,0.3)',
          marginBottom: '8px'
        }}>
          {(formData.name || 'S').charAt(0).toUpperCase()}
        </div>
        <div style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>{formData.name}</div>
        <div style={{ fontSize: '12px', color: '#888' }}>{user?.role || 'Store Admin'}</div>
      </div>

      {saved && (
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '4px', padding: '10px 16px', marginBottom: '15px', color: '#16a34a', fontWeight: '600' }}>
          ✅ Profile updated successfully!
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: '4px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <form onSubmit={handleSave} style={{ padding: '30px 40px' }}>

          {/* Row 1: Name & DOB */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ width: '140px', fontWeight: '700', fontSize: '14px', color: '#333' }}>Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none', background: '#fafafa' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ width: '140px', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                Date of Birth<span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="date"
                required
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
              />
            </div>
          </div>

          {/* Row 2: Gender & Profile Image */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ width: '140px', fontWeight: '700', fontSize: '14px', color: '#333' }}>Gender</label>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <label style={{ cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <input type="radio" name="gender" value="Male"
                    checked={formData.gender === 'Male'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    style={{ accentColor: '#3182ce' }}
                  /> Male
                </label>
                <label style={{ cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <input type="radio" name="gender" value="Female"
                    checked={formData.gender === 'Female'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    style={{ accentColor: '#3182ce' }}
                  /> Female
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ width: '140px', fontWeight: '700', fontSize: '14px', color: '#333' }}>Profile Image</label>
              <div style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '4px 8px', flex: 1 }}>
                <input type="file" accept="image/*"
                  onChange={(e) => setFormData({ ...formData, profile_image: e.target.files[0] })}
                  style={{ fontSize: '13px' }}
                />
              </div>
            </div>
          </div>

          {/* Row 3: Email & Mobile */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ width: '140px', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                Email id<span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                readOnly
                style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none', background: '#f0f4f8', color: '#555' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ width: '140px', fontWeight: '700', fontSize: '14px', color: '#333' }}>Mobile No</label>
              <input
                type="text"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none', background: '#f0f4f8' }}
              />
            </div>
          </div>

          {/* Row 4: Address 1 & Address 2 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ width: '140px', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                Address 1<span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={formData.address1}
                onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ width: '140px', fontWeight: '700', fontSize: '14px', color: '#333' }}>Address 2</label>
              <input
                type="text"
                value={formData.address2}
                onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
                style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
              />
            </div>
          </div>

          {/* Row 5: City & State */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ width: '140px', fontWeight: '700', fontSize: '14px', color: '#333' }}>City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ width: '140px', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                State<span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
              />
            </div>
          </div>

          {/* Row 6: Country & Pin Code */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ width: '140px', fontWeight: '700', fontSize: '14px', color: '#333' }}>Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ width: '140px', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                Pin Code<span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={formData.pin_code}
                onChange={(e) => setFormData({ ...formData, pin_code: e.target.value })}
                style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
              />
            </div>
          </div>

          {/* Row 7: Signature Image */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ width: '140px', fontWeight: '700', fontSize: '14px', color: '#333' }}>Signature Image</label>
              <div style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '4px 8px', flex: 1 }}>
                <input type="file" accept="image/*"
                  onChange={(e) => setFormData({ ...formData, signature_image: e.target.files[0] })}
                  style={{ fontSize: '13px' }}
                />
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', color: '#777', fontStyle: 'italic', fontSize: '13px', marginBottom: '25px' }}>
            Digital signature not found
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
            <button
              type="button"
              onClick={() => window.history.back()}
              style={{ background: '#4a5568', color: '#fff', padding: '8px 24px', borderRadius: '4px', border: 'none', fontWeight: '600', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ background: '#2b5876', color: '#fff', padding: '8px 24px', borderRadius: '4px', border: 'none', fontWeight: '600', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Saving…' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MyProfile;
