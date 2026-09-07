import React, { useState, useEffect } from 'react';
import client from '../api/client';

const MainStoreReturnOrder = () => {
  const [returns, setReturns] = useState([]);
  const [projects, setProjects] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [view, setView] = useState('list'); // 'list' | 'form'

  const [formData, setFormData] = useState({
    project_id: '',
    return_date: new Date().toISOString().split('T')[0],
    material_id: '',
    quantity: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [retRes, projRes, matRes] = await Promise.all([
        client.get('/main-store/return-orders'),
        client.get('/projects'),
        client.get('/main-store/materials')
      ]);
      setReturns(Array.isArray(retRes.data?.data) ? retRes.data.data : []);
      setProjects(Array.isArray(projRes.data?.data) ? projRes.data.data : []);
      setMaterials(Array.isArray(matRes.data?.data) ? matRes.data.data : []);
    } catch (err) {
      console.error(err);
      setReturns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        project_id: formData.project_id ? Number(formData.project_id) : null,
        return_number: `RET-${Date.now().toString().slice(-6)}`,
        return_date: formData.return_date,
        items: [
          {
            material_id: Number(formData.material_id),
            quantity: Number(formData.quantity) || 1
          }
        ]
      };

      await client.post('/main-store/return-orders', payload);
      setView('list');
      fetchData();
    } catch (err) {
      alert('Error saving Return Order: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this return order?')) return;
    try {
      await client.delete(`/main-store/return-orders/${id}`);
      fetchData();
    } catch (err) {
      alert('Error deleting return order');
    }
  };

  const filtered = Array.isArray(returns) ? returns.filter(r => 
    (r.return_number || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.project_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.project_code || '').toLowerCase().includes(search.toLowerCase())
  ) : [];

  const totalEntries = filtered.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginated = filtered.slice(startIndex, startIndex + entriesPerPage);

  return (
    <div style={{ padding: '20px', background: '#f4f6f9', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#333' }}>
          {view === 'list' ? 'Manage Return Order' : 'New Return Order'}
        </h2>
      </div>

      {view === 'list' ? (
        <div style={{ background: '#fff', borderRadius: '4px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '12px 20px', background: '#fcfcfc', borderBottom: '1px solid #edf2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#888', letterSpacing: '0.5px' }}>
              RETURN ORDER LIST
            </span>
            <button 
              onClick={() => { setFormData({ project_id: '', return_date: new Date().toISOString().split('T')[0], material_id: '', quantity: '' }); setView('form'); }}
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
                  <th style={{ padding: '10px 15px' }}>Return No</th>
                  <th style={{ padding: '10px 15px' }}>Project</th>
                  <th style={{ padding: '10px 15px' }}>Return Date</th>
                  <th style={{ padding: '10px 15px' }}>Items</th>
                  <th style={{ padding: '10px 15px' }}>Status</th>
                  <th style={{ padding: '10px 15px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
                ) : paginated.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#777' }}>No return orders found</td></tr>
                ) : (
                  paginated.map((r, idx) => (
                    <tr key={r.id || idx} style={{ borderBottom: '1px solid #edf2f7' }}>
                      <td style={{ padding: '10px 15px', color: '#666' }}>{startIndex + idx + 1}</td>
                      <td style={{ padding: '10px 15px', fontWeight: '600', color: '#3182ce' }}>{r.return_number}</td>
                      <td style={{ padding: '10px 15px', color: '#2d3748' }}>{r.project_name ? `${r.project_code || ''} - ${r.project_name}` : '-'}</td>
                      <td style={{ padding: '10px 15px', color: '#718096' }}>{r.return_date ? new Date(r.return_date).toLocaleDateString() : '-'}</td>
                      <td style={{ padding: '10px 15px', color: '#4a5568' }}>
                        {Array.isArray(r.items) ? r.items.map(i => `${i.material_name || 'Material'} (${i.quantity})`).join(', ') : '-'}
                      </td>
                      <td style={{ padding: '10px 15px' }}>
                        <span style={{ background: '#fffaf0', color: '#dd6b20', padding: '2px 8px', borderRadius: '4px', fontWeight: '600', fontSize: '12px' }}>
                          {r.status || 'Pending'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 15px' }}>
                        <button onClick={() => handleDelete(r.id)} title="Delete" style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', fontSize: '15px' }}>🗑️</button>
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
              RETURN ORDER FIELDS
            </span>
          </div>

          <form onSubmit={handleSave} style={{ padding: '30px 40px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ width: '120px', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                  Project<span style={{ color: 'red' }}>*</span>
                </label>
                <select
                  required
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
                >
                  <option value="">Select</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.code ? `${p.code} - ${p.name}` : p.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ width: '120px', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                  Return Date<span style={{ color: 'red' }}>*</span>
                </label>
                <input 
                  type="date"
                  required
                  value={formData.return_date}
                  onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
              <label style={{ width: '120px', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                Material 1<span style={{ color: 'red' }}>*</span>
              </label>
              <select
                required
                value={formData.material_id}
                onChange={(e) => setFormData({ ...formData, material_id: e.target.value })}
                style={{ width: '280px', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
              >
                <option value="">Select</option>
                {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>

              <input 
                type="number"
                placeholder="Quantity 1"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                style={{ width: '160px', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
              />

              <button 
                type="button" 
                style={{ background: '#70b62c', color: '#fff', border: 'none', borderRadius: '4px', width: '36px', height: '36px', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                +
              </button>
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

export default MainStoreReturnOrder;
