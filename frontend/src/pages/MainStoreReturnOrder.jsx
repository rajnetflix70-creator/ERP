import React, { useState, useEffect } from 'react';
import client from '../api/client';
import StoreCrudPage, { FormRow, FormInput, FormRadioGroup } from '../components/StoreCrudPage';

const EMPTY = { return_number: '', return_date: '', reason: '', status: 'Pending' };

const StatusBadgeRet = ({ value }) => {
  const map = {
    Pending:  { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
    Approved: { bg: '#f0fdf4', color: '#15803d', border: '#86efac' },
    Rejected: { bg: '#fef2f2', color: '#b91c1c', border: '#fca5a5' },
  };
  const s = map[value] || map.Pending;
  return <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: '20px', padding: '2px 12px', fontSize: '11px', fontWeight: '700' }}>{value}</span>;
};

const MainStoreReturnOrder = () => {
  const [rows, setRows]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState(EMPTY);

  const fetch = async () => {
    setLoading(true);
    try { const r = await client.get('/main-store/return-orders'); setRows(r.data?.data || []); }
    catch { setRows([]); } finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      editId ? await client.put(`/main-store/return-orders/${editId}`, form)
             : await client.post('/main-store/return-orders', form);
      setShowForm(false); setEditId(null); setForm(EMPTY); fetch();
    } catch (err) { alert(err.response?.data?.message || err.message); }
  };

  const handleEdit = (row) => {
    setEditId(row.id);
    setForm({ return_number: row.return_number, return_date: row.return_date?.slice(0,10) || '', reason: row.reason || '', status: row.status });
    setShowForm(true);
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this return order?')) return;
    try { await client.delete(`/main-store/return-orders/${id}`); fetch(); }
    catch { alert('Delete failed'); }
  };

  const columns = [
    { key: 'return_number', label: 'Return No.',   render: (v) => <b style={{ color: '#b91c1c', fontFamily: 'monospace' }}>{v}</b> },
    { key: 'return_date',   label: 'Return Date',   render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'reason',        label: 'Reason',         render: (v) => <span style={{ color: '#475569', fontSize: '12px' }}>{v || '—'}</span> },
    { key: 'status',        label: 'Status',         render: (v) => <StatusBadgeRet value={v} /> },
  ];

  return (
    <StoreCrudPage
      title="Purchase Returns" icon="🔄" accentColor="#dc2626"
      columns={columns} rows={rows} loading={loading}
      showForm={showForm} formTitle={editId ? 'Edit Return Order' : 'New Return Order'}
      onAdd={() => { setEditId(null); setForm(EMPTY); setShowForm(true); }}
      onEdit={handleEdit} onDelete={handleDelete}
      onCancel={() => setShowForm(false)} onSubmit={handleSubmit}
      formContent={<>
        <FormRow label="Return No." required><FormInput required value={form.return_number} onChange={e => setForm({ ...form, return_number: e.target.value })} placeholder="e.g. RTN-2024-001" /></FormRow>
        <FormRow label="Return Date" required><FormInput required type="date" value={form.return_date} onChange={e => setForm({ ...form, return_date: e.target.value })} /></FormRow>
        <FormRow label="Reason"><FormInput value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Damaged on delivery" /></FormRow>
        <FormRow label="Status" required>
          <FormRadioGroup value={form.status} onChange={v => setForm({ ...form, status: v })} options={['Pending', 'Approved', 'Rejected']} />
        </FormRow>
      </>}
    />
  );
};

export default MainStoreReturnOrder;
