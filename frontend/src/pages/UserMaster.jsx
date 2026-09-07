import React, { useState, useEffect } from 'react';
import client from '../api/client';

const UserMaster = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dob: '',
    gender: 'Male',
    password: '',
    confirm_password: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    country: '',
    pin_code: '',
    role_id: '',
    mobile: '',
    profile_image: '',
    signature_image: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usrRes, roleRes] = await Promise.all([
        client.get('/employees'),
        client.get('/employees/roles')
      ]);
      setUsers(Array.isArray(usrRes.data?.data) ? usrRes.data.data : Array.isArray(usrRes.data) ? usrRes.data : []);
      setRoles(Array.isArray(roleRes.data?.data) ? roleRes.data.data : Array.isArray(roleRes.data) ? roleRes.data : []);
    } catch (err) {
      console.error(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirm_password) {
      alert('Password and Confirm Password do not match');
      return;
    }

    try {
      const payload = {
        full_name: formData.name,
        email: formData.email,
        mobile_number: formData.mobile,
        dob: formData.dob,
        gender: formData.gender,
        password: formData.password || undefined,
        address1: formData.address1,
        address2: formData.address2,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        pin_code: formData.pin_code,
        role_id: formData.role_id ? Number(formData.role_id) : undefined,
        is_active: true
      };

      if (editingId) {
        await client.put(`/employees/${editingId}`, payload);
      } else {
        await client.post('/employees', payload);
      }
      setEditingId(null);
      setView('list');
      fetchData();
    } catch (err) {
      alert('Error saving user: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEdit = (u) => {
    setEditingId(u.id);
    setFormData({
      name: u.full_name || '',
      email: u.email || '',
      dob: u.dob || '',
      gender: u.gender || 'Male',
      password: '',
      confirm_password: '',
      address1: u.address1 || '',
      address2: u.address2 || '',
      city: u.city || '',
      state: u.state || '',
      country: u.country || '',
      pin_code: u.pin_code || '',
      role_id: u.role_id || '',
      mobile: u.mobile_number || u.mobile || '',
      profile_image: '',
      signature_image: ''
    });
    setView('form');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate/delete this user?')) return;
    try {
      await client.delete(`/employees/${id}`);
      fetchData();
    } catch (err) {
      alert('Error deactivating user');
    }
  };

  const filtered = Array.isArray(users) ? users.filter(u => 
    (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.mobile_number || '').toLowerCase().includes(search.toLowerCase())
  ) : [];

  const totalEntries = filtered.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginated = filtered.slice(startIndex, startIndex + entriesPerPage);

  return (
    <div style={{ padding: '20px', background: '#f4f6f9', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#333' }}>
          {view === 'list' ? 'Manage Users' : editingId ? 'Edit User' : 'New User'}
        </h2>
      </div>

      {view === 'list' ? (
        <div style={{ background: '#fff', borderRadius: '4px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '12px 20px', background: '#fcfcfc', borderBottom: '1px solid #edf2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#888', letterSpacing: '0.5px' }}>
              USER LIST
            </span>
            <button 
              onClick={() => { setEditingId(null); setFormData({ name: '', email: '', dob: '', gender: 'Male', password: '', confirm_password: '', address1: '', address2: '', city: '', state: '', country: '', pin_code: '', role_id: '', mobile: '', profile_image: '', signature_image: '' }); setView('form'); }}
              style={{ background: 'none', border: 'none', color: '#3182ce', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
            >
              ADD NEW
            </button>
          </div>

          <div style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ fontSize: '14px', color: '#555' }}>
              Show {' '}
              <select 
                value={entriesPerPage} 
                onChange={(e) => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }}
                style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              {' '} entries
            </div>
            <div>
              <span style={{ fontSize: '14px', color: '#555', marginRight: '8px' }}>Search:</span>
              <input 
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                style={{ padding: '5px 10px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '10px 15px', width: '50px' }}>#</th>
                  <th style={{ padding: '10px 15px' }}>Name</th>
                  <th style={{ padding: '10px 15px' }}>Email</th>
                  <th style={{ padding: '10px 15px' }}>Mobile</th>
                  <th style={{ padding: '10px 15px' }}>Role</th>
                  <th style={{ padding: '10px 15px' }}>Status</th>
                  <th style={{ padding: '10px 15px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
                ) : paginated.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#777' }}>No users found</td></tr>
                ) : (
                  paginated.map((u, idx) => (
                    <tr key={u.id || idx} style={{ borderBottom: '1px solid #edf2f7' }}>
                      <td style={{ padding: '10px 15px', color: '#666' }}>{startIndex + idx + 1}</td>
                      <td style={{ padding: '10px 15px', fontWeight: '600', color: '#2d3748' }}>{u.full_name}</td>
                      <td style={{ padding: '10px 15px', color: '#3182ce' }}>{u.email || '-'}</td>
                      <td style={{ padding: '10px 15px', color: '#4a5568' }}>{u.mobile_number || u.mobile || '-'}</td>
                      <td style={{ padding: '10px 15px', color: '#4a5568' }}>{u.role || u.role_name || 'Worker'}</td>
                      <td style={{ padding: '10px 15px' }}>
                        <span style={{ color: u.is_active !== false ? '#38a169' : '#e53e3e', fontWeight: '600' }}>
                          {u.is_active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 15px' }}>
                        <button onClick={() => handleEdit(u)} title="Edit" style={{ background: 'none', border: 'none', color: '#3182ce', cursor: 'pointer', marginRight: '10px', fontSize: '15px' }}>✏️</button>
                        <button onClick={() => handleDelete(u.id)} title="Delete" style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', fontSize: '15px' }}>🗑️</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ fontSize: '13px', color: '#718096' }}>
              Showing {totalEntries === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + entriesPerPage, totalEntries)} of {totalEntries} entries
            </div>

            <div style={{ display: 'flex', gap: '2px' }}>
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                style={{ padding: '5px 12px', border: '1px solid #cbd5e0', background: currentPage === 1 ? '#edf2f7' : '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '12px', color: '#4a5568', borderRadius: '3px 0 0 3px' }}
              >
                PREVIOUS
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map(num => (
                <button 
                  key={num}
                  onClick={() => setCurrentPage(num)}
                  style={{ padding: '5px 12px', border: '1px solid #cbd5e0', background: currentPage === num ? '#3182ce' : '#fff', color: currentPage === num ? '#fff' : '#4a5568', cursor: 'pointer', fontSize: '12px' }}
                >
                  {num}
                </button>
              ))}
              <button 
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(p => p + 1)}
                style={{ padding: '5px 12px', border: '1px solid #cbd5e0', background: (currentPage === totalPages || totalPages === 0) ? '#edf2f7' : '#fff', cursor: (currentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer', fontSize: '12px', color: '#4a5568', borderRadius: '0 3px 3px 0' }}
              >
                NEXT
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '4px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '12px 20px', background: '#fcfcfc', borderBottom: '1px solid #edf2f7' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#888', letterSpacing: '0.5px' }}>
              USER FIELDS
            </span>
          </div>

          <form onSubmit={handleSave} style={{ padding: '30px 40px' }}>
            {/* Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ width: '150px', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                  Name<span style={{ color: 'red' }}>*</span>
                </label>
                <input 
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ width: '150px', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                  Email<span style={{ color: 'red' }}>*</span>
                </label>
                <input 
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none', background: '#ebf8ff' }}
                />
              </div>
            </div>

            {/* Row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ width: '150px', fontWeight: '700', fontSize: '14px', color: '#333' }}>
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

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ width: '150px', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                  Gender<span style={{ color: 'red' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <label style={{ cursor: 'pointer', fontSize: '14px' }}>
                    <input 
                      type="radio" 
                      name="gender" 
                      value="Male" 
                      checked={formData.gender === 'Male'}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      style={{ marginRight: '5px' }}
                    /> Male
                  </label>
                  <label style={{ cursor: 'pointer', fontSize: '14px' }}>
                    <input 
                      type="radio" 
                      name="gender" 
                      value="Female" 
                      checked={formData.gender === 'Female'}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      style={{ marginRight: '5px' }}
                    /> Female
                  </label>
                </div>
              </div>
            </div>

            {/* Row 3 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ width: '150px', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                  Password<span style={{ color: 'red' }}>*</span>
                </label>
                <input 
                  type="password"
                  required={!editingId}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none', background: '#ebf8ff' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ width: '150px', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                  Confirm Password<span style={{ color: 'red' }}>*</span>
                </label>
                <input 
                  type="password"
                  required={!editingId}
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
                />
              </div>
            </div>

            {/* Row 4 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ width: '150px', fontWeight: '700', fontSize: '14px', color: '#333' }}>
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
                <label style={{ width: '150px', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                  Address 2<span style={{ color: 'red' }}>*</span>
                </label>
                <input 
                  type="text"
                  required
                  value={formData.address2}
                  onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
                />
              </div>
            </div>

            {/* Row 5 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ width: '150px', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                  City<span style={{ color: 'red' }}>*</span>
                </label>
                <input 
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ width: '150px', fontWeight: '700', fontSize: '14px', color: '#333' }}>
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

            {/* Row 6 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ width: '150px', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                  Country<span style={{ color: 'red' }}>*</span>
                </label>
                <input 
                  type="text"
                  required
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ width: '150px', fontWeight: '700', fontSize: '14px', color: '#333' }}>
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

            {/* Row 7 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ width: '150px', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                  User Role<span style={{ color: 'red' }}>*</span>
                </label>
                <select
                  required
                  value={formData.role_id}
                  onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
                >
                  <option value="">Select Role</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ width: '150px', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                  Mobile<span style={{ color: 'red' }}>*</span>
                </label>
                <input 
                  type="text"
                  required
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
                />
              </div>
            </div>

            {/* Row 8 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ width: '150px', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                  Profile Image
                </label>
                <div style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '4px 8px', flex: 1 }}>
                  <input type="file" onChange={(e) => setFormData({ ...formData, profile_image: e.target.files[0]?.name || '' })} style={{ fontSize: '13px' }} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ width: '150px', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                  Signature Image
                </label>
                <div style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '4px 8px', flex: 1 }}>
                  <input type="file" onChange={(e) => setFormData({ ...formData, signature_image: e.target.files[0]?.name || '' })} style={{ fontSize: '13px' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
              <button 
                type="button" 
                onClick={() => setView('list')}
                style={{ background: '#4a5568', color: '#fff', padding: '8px 24px', borderRadius: '4px', border: 'none', fontWeight: '600', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                style={{ background: '#2b5876', color: '#fff', padding: '8px 24px', borderRadius: '4px', border: 'none', fontWeight: '600', cursor: 'pointer' }}
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default UserMaster;
