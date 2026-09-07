import React, { useState, useEffect } from 'react';
import client from '../api/client';

const MaterialConsumption = () => {
  const [consumptions, setConsumptions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [view, setView] = useState('list'); // 'list' | 'form'

  const [formData, setFormData] = useState({
    project_id: '',
    consumption_date: new Date().toISOString().split('T')[0],
    area: '',
    floor_slab: '',
    material_id: '',
    quantity: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [conRes, projRes, matRes] = await Promise.all([
        client.get('/materials/consumption/history'),
        client.get('/projects'),
        client.get('/main-store/materials')
      ]);
      setConsumptions(Array.isArray(conRes.data?.data) ? conRes.data.data : Array.isArray(conRes.data) ? conRes.data : []);
      setProjects(Array.isArray(projRes.data?.data) ? projRes.data.data : Array.isArray(projRes.data) ? projRes.data : []);
      setMaterials(Array.isArray(matRes.data?.data) ? matRes.data.data : Array.isArray(matRes.data) ? matRes.data : []);
    } catch (err) {
      console.error(err);
      setConsumptions([]);
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
        consumption_date: formData.consumption_date,
        area: formData.area,
        floor_slab: formData.floor_slab,
        material_id: Number(formData.material_id),
        qty_consumed: Number(formData.quantity) || 1
      };

      await client.post('/materials/consumption', payload);
      setView('list');
      fetchData();
    } catch (err) {
      alert('Error saving consumption entry: ' + (err.response?.data?.message || err.message));
    }
  };

  const filtered = Array.isArray(consumptions) ? consumptions.filter(c => 
    (c.project_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.material_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.area || '').toLowerCase().includes(search.toLowerCase())
  ) : [];

  const totalEntries = filtered.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginated = filtered.slice(startIndex, startIndex + entriesPerPage);

  return (
    <div style={{ padding: '20px', background: '#f4f6f9', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#333' }}>
          {view === 'list' ? 'Manage Consumption' : 'New Consumption'}
        </h2>
      </div>

      {view === 'list' ? (
        <div style={{ background: '#fff', borderRadius: '4px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '12px 20px', background: '#fcfcfc', borderBottom: '1px solid #edf2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#888', letterSpacing: '0.5px' }}>
              CONSUMPTION LIST
            </span>
            <button 
              onClick={() => { setFormData({ project_id: '', consumption_date: new Date().toISOString().split('T')[0], area: '', floor_slab: '', material_id: '', quantity: '' }); setView('form'); }}
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
                  <th style={{ padding: '10px 15px' }}>Project Name</th>
                  <th style={{ padding: '10px 15px' }}>Consumption Date</th>
                  <th style={{ padding: '10px 15px' }}>Area</th>
                  <th style={{ padding: '10px 15px' }}>Floor / Slab</th>
                  <th style={{ padding: '10px 15px' }}>Material</th>
                  <th style={{ padding: '10px 15px' }}>Qty Consumed</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
                ) : paginated.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#777' }}>No consumption entries found</td></tr>
                ) : (
                  paginated.map((c, idx) => (
                    <tr key={c.id || idx} style={{ borderBottom: '1px solid #edf2f7' }}>
                      <td style={{ padding: '10px 15px', color: '#666' }}>{startIndex + idx + 1}</td>
                      <td style={{ padding: '10px 15px', fontWeight: '500', color: '#2d3748' }}>{c.project_name || '-'}</td>
                      <td style={{ padding: '10px 15px', color: '#718096' }}>{c.consumption_date ? new Date(c.consumption_date).toLocaleDateString() : '-'}</td>
                      <td style={{ padding: '10px 15px', color: '#4a5568' }}>{c.area || '-'}</td>
                      <td style={{ padding: '10px 15px', color: '#4a5568' }}>{c.floor_slab || '-'}</td>
                      <td style={{ padding: '10px 15px', fontWeight: '600', color: '#3182ce' }}>{c.material_name || '-'}</td>
                      <td style={{ padding: '10px 15px', fontWeight: '700', color: '#e53e3e' }}>{c.qty_consumed || c.quantity || 0}</td>
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
              CONSUMPTION FIELDS
            </span>
          </div>

          <form onSubmit={handleSave} style={{ padding: '30px 40px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ width: '160px', fontWeight: '700', fontSize: '14px', color: '#333' }}>
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
                <label style={{ width: '160px', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                  Consumption Date<span style={{ color: 'red' }}>*</span>
                </label>
                <input 
                  type="date"
                  required
                  value={formData.consumption_date}
                  onChange={(e) => setFormData({ ...formData, consumption_date: e.target.value })}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ width: '160px', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                  Area<span style={{ color: 'red' }}>*</span>
                </label>
                <input 
                  type="text"
                  required
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ width: '160px', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                  Floor/Slab<span style={{ color: 'red' }}>*</span>
                </label>
                <input 
                  type="text"
                  required
                  value={formData.floor_slab}
                  onChange={(e) => setFormData({ ...formData, floor_slab: e.target.value })}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ width: '160px', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                  Materials<span style={{ color: 'red' }}>*</span>
                </label>
                <select
                  required
                  value={formData.material_id}
                  onChange={(e) => setFormData({ ...formData, material_id: e.target.value })}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
                >
                  <option value="">Select Material</option>
                  {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ width: '160px', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                  Quantity<span style={{ color: 'red' }}>*</span>
                </label>
                <input 
                  type="number"
                  required
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginLeft: '160px' }}>
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

export default MaterialConsumption;
