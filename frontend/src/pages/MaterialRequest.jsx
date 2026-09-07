import React, { useState, useEffect } from 'react';
import client from '../api/client';

const MaterialRequest = () => {
  const [requests, setRequests] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [view, setView] = useState('list'); // 'list' | 'form'

  const [formData, setFormData] = useState({
    job_no: '',
    client_name: '',
    project_name: '',
    project_location: '',
    address: '',
    engineer: '',
    total_area: '',
    items: []
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqRes, matRes, empRes] = await Promise.all([
        client.get('/materials/requests'),
        client.get('/main-store/materials'),
        client.get('/employees')
      ]);
      setRequests(Array.isArray(reqRes.data?.data) ? reqRes.data.data : Array.isArray(reqRes.data) ? reqRes.data : []);
      
      const matList = Array.isArray(matRes.data?.data) ? matRes.data.data : [];
      setMaterials(matList);

      const empList = Array.isArray(empRes.data?.data) ? empRes.data.data : Array.isArray(empRes.data) ? empRes.data : [];
      setEngineers(empList);

      // Initialize form material rows
      if (matList.length > 0) {
        setFormData(prev => ({
          ...prev,
          items: matList.map(m => ({
            material_id: m.id,
            name: m.name,
            brand_name: m.brand_name || 'Generic',
            main_qty: m.quantity || 0,
            unit: m.unit || 'pcs',
            requested_qty: 0,
            selected: false
          }))
        }));
      }
    } catch (err) {
      console.error(err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCheckboxChange = (index) => {
    setFormData(prev => {
      const updated = [...prev.items];
      updated[index].selected = !updated[index].selected;
      return { ...prev, items: updated };
    });
  };

  const handleQtyChange = (index, value) => {
    setFormData(prev => {
      const updated = [...prev.items];
      updated[index].requested_qty = value;
      return { ...prev, items: updated };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const selectedMaterials = formData.items.filter(i => i.selected && Number(i.requested_qty) > 0);
      if (selectedMaterials.length === 0) {
        alert('Please select at least one material with a quantity greater than 0');
        return;
      }

      const payload = {
        job_no: formData.job_no,
        client_name: formData.client_name,
        project_name: formData.project_name,
        project_location: formData.project_location,
        address: formData.address,
        engineer: formData.engineer,
        total_area: formData.total_area,
        items: selectedMaterials.map(m => ({
          material_id: m.material_id,
          qty_requested: Number(m.requested_qty)
        }))
      };

      await client.post('/materials/requests', payload);
      setView('list');
      fetchData();
    } catch (err) {
      alert('Error saving material request: ' + (err.response?.data?.message || err.message));
    }
  };

  const filtered = Array.isArray(requests) ? requests.filter(r => 
    (r.mr_number || r.job_no || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.project_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.client_name || '').toLowerCase().includes(search.toLowerCase())
  ) : [];

  const totalEntries = filtered.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginated = filtered.slice(startIndex, startIndex + entriesPerPage);

  return (
    <div style={{ padding: '20px', background: '#f4f6f9', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#333' }}>
          {view === 'list' ? 'Material Requests' : 'New Material Request'}
        </h2>
      </div>

      {view === 'list' ? (
        <div style={{ background: '#fff', borderRadius: '4px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '12px 20px', background: '#fcfcfc', borderBottom: '1px solid #edf2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#888', letterSpacing: '0.5px' }}>
              MATERIAL REQUEST LIST
            </span>
            <button 
              onClick={() => setView('form')}
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
                  <th style={{ padding: '10px 15px' }}>Job No / Req No</th>
                  <th style={{ padding: '10px 15px' }}>Project Name</th>
                  <th style={{ padding: '10px 15px' }}>Client/Contractor</th>
                  <th style={{ padding: '10px 15px' }}>Engineer</th>
                  <th style={{ padding: '10px 15px' }}>Status</th>
                  <th style={{ padding: '10px 15px' }}>Created Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
                ) : paginated.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#777' }}>No material requests found</td></tr>
                ) : (
                  paginated.map((r, idx) => (
                    <tr key={r.id || idx} style={{ borderBottom: '1px solid #edf2f7' }}>
                      <td style={{ padding: '10px 15px', color: '#666' }}>{startIndex + idx + 1}</td>
                      <td style={{ padding: '10px 15px', fontWeight: '600', color: '#3182ce' }}>{r.job_no || r.mr_number || '-'}</td>
                      <td style={{ padding: '10px 15px', color: '#2d3748', fontWeight: '500' }}>{r.project_name || '-'}</td>
                      <td style={{ padding: '10px 15px', color: '#4a5568' }}>{r.client_name || '-'}</td>
                      <td style={{ padding: '10px 15px', color: '#4a5568' }}>{r.engineer || '-'}</td>
                      <td style={{ padding: '10px 15px' }}>
                        <span style={{ background: '#fefce8', color: '#ca8a04', padding: '2px 8px', borderRadius: '4px', fontWeight: '600', fontSize: '12px' }}>
                          {r.status || 'Pending'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 15px', color: '#718096' }}>
                        {r.created_at ? new Date(r.created_at).toLocaleDateString() : '-'}
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
              MATERIAL REQUEST FIELDS
            </span>
          </div>

          <form onSubmit={handleSave} style={{ padding: '30px 40px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ width: '170px', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                  Job No<span style={{ color: 'red' }}>*</span>
                </label>
                <input 
                  type="text"
                  required
                  value={formData.job_no}
                  onChange={(e) => setFormData({ ...formData, job_no: e.target.value })}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ width: '170px', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                  Client/Contractor Name<span style={{ color: 'red' }}>*</span>
                </label>
                <input 
                  type="text"
                  required
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ width: '170px', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                  Project Name<span style={{ color: 'red' }}>*</span>
                </label>
                <input 
                  type="text"
                  required
                  value={formData.project_name}
                  onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ width: '170px', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                  Project Location<span style={{ color: 'red' }}>*</span>
                </label>
                <input 
                  type="text"
                  required
                  value={formData.project_location}
                  onChange={(e) => setFormData({ ...formData, project_location: e.target.value })}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <label style={{ width: '170px', fontWeight: '700', fontSize: '14px', color: '#333', marginTop: '8px' }}>
                  Address
                </label>
                <textarea 
                  rows="3"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ width: '170px', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                  Engineer<span style={{ color: 'red' }}>*</span>
                </label>
                <select
                  required
                  value={formData.engineer}
                  onChange={(e) => setFormData({ ...formData, engineer: e.target.value })}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
                >
                  <option value="">Select</option>
                  <option value="Project Engineer 1">Project Engineer 1</option>
                  <option value="Project Engineer 2">Project Engineer 2</option>
                  <option value="Project Engineer 3">Project Engineer 3</option>
                  <option value="Project Engineer 4">Project Engineer 4</option>
                  {engineers.map(e => (
                    <option key={e.id} value={e.full_name || e.name}>{e.full_name || e.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ width: '170px', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                  Total Area<span style={{ color: 'red' }}>*</span>
                </label>
                <input 
                  type="text"
                  required
                  value={formData.total_area}
                  onChange={(e) => setFormData({ ...formData, total_area: e.target.value })}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
                />
              </div>
            </div>

            {/* Materials Checklist Table */}
            <div style={{ marginBottom: '30px' }}>
              <label style={{ fontWeight: '700', fontSize: '14px', color: '#333', marginBottom: '10px', display: 'block' }}>
                Materials<span style={{ color: 'red' }}>*</span>
              </label>

              <div style={{ border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '10px 15px', textAlign: 'left', width: '35%' }}>Material Description</th>
                      <th style={{ padding: '10px 15px', textAlign: 'left', width: '25%' }}>Brand Name</th>
                      <th style={{ padding: '10px 15px', textAlign: 'left', width: '15%' }}>Main Qty</th>
                      <th style={{ padding: '10px 15px', textAlign: 'left', width: '10%' }}>Unit</th>
                      <th style={{ padding: '10px 15px', textAlign: 'left', width: '15%' }}>Req Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.length === 0 ? (
                      <tr><td colSpan="5" style={{ padding: '15px', textAlign: 'center', color: '#777' }}>No materials configured in store</td></tr>
                    ) : (
                      formData.items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #edf2f7' }}>
                          <td style={{ padding: '10px 15px' }}>
                            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <input 
                                type="checkbox"
                                checked={item.selected}
                                onChange={() => handleCheckboxChange(idx)}
                              />
                              <span style={{ fontWeight: '500' }}>{item.name}</span>
                            </label>
                          </td>
                          <td style={{ padding: '10px 15px', color: '#555' }}>{item.brand_name}</td>
                          <td style={{ padding: '10px 15px', fontWeight: '600' }}>{item.main_qty}</td>
                          <td style={{ padding: '10px 15px', color: '#777' }}>{item.unit}</td>
                          <td style={{ padding: '10px 15px' }}>
                            <input 
                              type="number"
                              value={item.requested_qty}
                              onChange={(e) => handleQtyChange(idx, e.target.value)}
                              disabled={!item.selected}
                              style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #ccc', background: item.selected ? '#fff' : '#f7fafc' }}
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
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

export default MaterialRequest;
