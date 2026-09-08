import React, { useState, useEffect } from 'react';
import client from '../api/client';
import StoreCrudPage, { FormRow, FormInput, FormRadioGroup, StatusBadge } from '../components/StoreCrudPage';

const EMPTY = { name: '', short_name: '', status: 'Active' };

const MainStoreBrand = () => {
  const [rows, setRows]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState(EMPTY);

  const fetch = async () => {
    setLoading(true);
    try { const r = await client.get('/main-store/brands'); setRows(r.data?.data || []); }
    catch { setRows([]); } finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      editId ? await client.put(`/main-store/brands/${editId}`, form)
             : await client.post('/main-store/brands', form);
      setShowForm(false); setEditId(null); setForm(EMPTY); fetch();
    } catch (err) { alert(err.response?.data?.message || err.message); }
  };

  const handleEdit   = (row) => { setEditId(row.id); setForm({ name: row.name, short_name: row.short_name, status: row.status }); setShowForm(true); };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this brand?')) return;
    try { await client.delete(`/main-store/brands/${id}`); fetch(); }
    catch { alert('Delete failed'); }
  };

  const columns = [
    { key: 'name',       label: 'Brand Name',  render: (v) => <b style={{ color: '#1e293b' }}>{v}</b> },
    { key: 'short_name', label: 'Short Name',   render: (v) => <span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>{v}</span> },
    { key: 'status',     label: 'Status',        render: (v) => <StatusBadge value={v} /> },
    { key: 'created_at', label: 'Created',       render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
  ];

  return (
    <StoreCrudPage
      title="Manage Brand" icon="🏷️" accentColor="#7c3aed"
      columns={columns} rows={rows} loading={loading}
      showForm={showForm} formTitle={editId ? 'Edit Brand' : 'New Brand'}
      onAdd={() => { setEditId(null); setForm(EMPTY); setShowForm(true); }}
      onEdit={handleEdit} onDelete={handleDelete}
      onCancel={() => setShowForm(false)} onSubmit={handleSubmit}
      formContent={<>
        <FormRow label="Brand Name" required><FormInput required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Havells" /></FormRow>
        <FormRow label="Short Name" required><FormInput required value={form.short_name} onChange={e => setForm({ ...form, short_name: e.target.value })} placeholder="e.g. HVL" /></FormRow>
        <FormRow label="Status" required><FormRadioGroup value={form.status} onChange={v => setForm({ ...form, status: v })} options={['Active', 'Inactive']} /></FormRow>
      </>}
    />
  );
};

export default MainStoreBrand;
