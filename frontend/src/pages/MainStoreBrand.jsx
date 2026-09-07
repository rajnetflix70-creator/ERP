import React, { useState, useEffect } from 'react';
import client from '../api/client';

const MainStoreBrand = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    short_name: '',
    status: 'Active'
  });

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const res = await client.get('/main-store/brands');
      if (res.data && Array.isArray(res.data.data)) {
        setBrands(res.data.data);
      } else {
        setBrands([]);
      }
    } catch (err) {
      console.error(err);
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await client.put(`/main-store/brands/${editingId}`, formData);
      } else {
        await client.post('/main-store/brands', formData);
      }
      setFormData({ name: '', short_name: '', status: 'Active' });
      setEditingId(null);
      setView('list');
      fetchBrands();
    } catch (err) {
      alert('Error saving brand: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEdit = (brand) => {
    setEditingId(brand.id);
    setFormData({
      name: brand.name || '',
      short_name: brand.short_name || '',
      status: brand.status || 'Active'
    });
    setView('form');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this brand?')) return;
    try {
      await client.delete(`/main-store/brands/${id}`);
      fetchBrands();
    } catch (err) {
      alert('Error deleting brand');
    }
  };

  const filtered = Array.isArray(brands) ? brands.filter(b => 
    (b.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.short_name || '').toLowerCase().includes(search.toLowerCase())
  ) : [];

  const totalEntries = filtered.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginated = filtered.slice(startIndex, startIndex + entriesPerPage);

  return (
    <div style={{ padding: '20px', background: '#f4f6f9', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#333' }}>
          {view === 'list' ? 'Manage Brand' : editingId ? 'Edit Brand' : 'New Brand'}
        </h2>
      </div>

      {view === 'list' ? (
        <div style={{ background: '#fff', borderRadius: '4px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '12px 20px', background: '#fcfcfc', borderBottom: '1px solid #edf2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#888', letterSpacing: '0.5px' }}>
              BRAND LIST
            </span>
            <button 
              onClick={() => { setEditingId(null); setFormData({ name: '', short_name: '', status: 'Active' }); setView('form'); }}
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
                  <th style={{ padding: '10px 15px' }}>Short Name</th>
                  <th style={{ padding: '10px 15px' }}>Status</th>
                  <th style={{ padding: '10px 15px' }}>Created Date</th>
                  <th style={{ padding: '10px 15px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
                ) : paginated.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#777' }}>No brands found</td></tr>
                ) : (
                  paginated.map((b, idx) => (
                    <tr key={b.id || idx} style={{ borderBottom: '1px solid #edf2f7' }}>
                      <td style={{ padding: '10px 15px', color: '#666' }}>{startIndex + idx + 1}</td>
                      <td style={{ padding: '10px 15px', fontWeight: '500', color: '#2d3748' }}>{b.name}</td>
                      <td style={{ padding: '10px 15px', color: '#4a5568' }}>{b.short_name}</td>
                      <td style={{ padding: '10px 15px' }}>
                        <span style={{ color: b.status === 'Active' ? '#38a169' : '#e53e3e', fontWeight: '600' }}>
                          {b.status || 'Active'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 15px', color: '#718096' }}>
                        {b.created_at ? new Date(b.created_at).toLocaleString() : '-'}
                      </td>
                      <td style={{ padding: '10px 15px' }}>
                        <button onClick={() => handleEdit(b)} title="Edit" style={{ background: 'none', border: 'none', color: '#3182ce', cursor: 'pointer', marginRight: '10px', fontSize: '15px' }}>✏️</button>
                        <button onClick={() => handleDelete(b.id)} title="Delete" style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', fontSize: '15px' }}>🗑️</button>
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
              BRAND FIELDS
            </span>
          </div>

          <form onSubmit={handleSave} style={{ padding: '30px 40px', maxWidth: '600px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <label style={{ width: '120px', fontWeight: '700', fontSize: '14px', color: '#333' }}>
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

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <label style={{ width: '120px', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                Short Name<span style={{ color: 'red' }}>*</span>
              </label>
              <input 
                type="text"
                required
                value={formData.short_name}
                onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
                style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
              <label style={{ width: '120px', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                Status<span style={{ color: 'red' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <label style={{ cursor: 'pointer', fontSize: '14px' }}>
                  <input 
                    type="radio" 
                    name="status" 
                    value="Active" 
                    checked={formData.status === 'Active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{ marginRight: '5px' }}
                  /> Active
                </label>
                <label style={{ cursor: 'pointer', fontSize: '14px' }}>
                  <input 
                    type="radio" 
                    name="status" 
                    value="Inactive" 
                    checked={formData.status === 'Inactive'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{ marginRight: '5px' }}
                  /> Inactive
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginLeft: '120px' }}>
              <button 
                type="submit" 
                style={{ background: '#2b5876', color: '#fff', padding: '8px 24px', borderRadius: '4px', border: 'none', fontWeight: '600', cursor: 'pointer' }}
              >
                Submit
              </button>
              <button 
                type="button" 
                onClick={() => setView('list')}
                style={{ background: '#e2e8f0', color: '#4a5568', padding: '8px 20px', borderRadius: '4px', border: 'none', fontWeight: '600', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default MainStoreBrand;
