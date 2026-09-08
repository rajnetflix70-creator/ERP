import React, { useState, useEffect } from 'react';
import client from '../api/client';
import StoreCrudPage, { FormRow, FormInput, FormSelect, FormRadioGroup, StatusBadge } from '../components/StoreCrudPage';

const EMPTY = { name: '', category_id: '', brand_id: '', quantity: '', unit: 'pcs', min_quantity: '', status: 'Active' };

const MainStoreMaterial = () => {
  const [rows, setRows]         = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState(EMPTY);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [mRes, cRes, bRes] = await Promise.all([
        client.get('/main-store/materials'),
        client.get('/main-store/categories'),
        client.get('/main-store/brands'),
      ]);
      setRows(mRes.data?.data || []);
      setCategories((cRes.data?.data || []).map(c => ({ value: c.id, label: c.name })));
      setBrands((bRes.data?.data || []).map(b => ({ value: b.id, label: b.name })));
    } catch { setRows([]); } finally { setLoading(false); }
  };
  useEffect(() => { fetchAll(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      editId ? await client.put(`/main-store/materials/${editId}`, form)
             : await client.post('/main-store/materials', form);
      setShowForm(false); setEditId(null); setForm(EMPTY); fetchAll();
    } catch (err) { alert(err.response?.data?.message || err.message); }
  };

  const handleEdit = (row) => {
    setEditId(row.id);
    setForm({ name: row.name, category_id: row.category_id || '', brand_id: row.brand_id || '', quantity: row.quantity || '', unit: row.unit || 'pcs', min_quantity: row.min_quantity || '', status: row.status });
    setShowForm(true);
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this material?')) return;
    try { await client.delete(`/main-store/materials/${id}`); fetchAll(); }
    catch { alert('Delete failed'); }
  };

  const columns = [
    { key: 'name',          label: 'Material Name',  render: (v) => <b style={{ color: '#1e293b' }}>{v}</b> },
    { key: 'category_name', label: 'Category',        render: (v, r) => { const c = categories.find(x => x.value === r.category_id); return <span style={{ color: '#0369a1', fontWeight: '600', fontSize: '12px' }}>{c?.label || v || '—'}</span>; } },
    { key: 'brand_name',    label: 'Brand',           render: (v, r) => { const b = brands.find(x => x.value === r.brand_id); return b?.label || v || '—'; } },
    { key: 'quantity',      label: 'Stock',           render: (v) => <span style={{ fontWeight: '700', color: Number(v) > 50 ? '#15803d' : Number(v) > 10 ? '#d97706' : '#dc2626' }}>{v ?? 0}</span> },
    { key: 'unit',          label: 'Unit' },
    { key: 'status',        label: 'Status',          render: (v) => <StatusBadge value={v} /> },
  ];

  const unitOptions = ['pcs', 'kg', 'bags', 'mtrs', 'ltrs', 'sqft', 'tons', 'box'].map(u => ({ value: u, label: u }));

  return (
    <StoreCrudPage
      title="Manage Materials" icon="📦" accentColor="#0369a1"
      columns={columns} rows={rows} loading={loading}
      showForm={showForm} formTitle={editId ? 'Edit Material' : 'New Material'}
      onAdd={() => { setEditId(null); setForm(EMPTY); setShowForm(true); }}
      onEdit={handleEdit} onDelete={handleDelete}
      onCancel={() => setShowForm(false)} onSubmit={handleSubmit}
      formContent={<>
        <FormRow label="Material Name" required><FormInput required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. TMT Bar 12mm" /></FormRow>
        <FormRow label="Category"><FormSelect value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} options={categories} /></FormRow>
        <FormRow label="Brand"><FormSelect value={form.brand_id} onChange={e => setForm({ ...form, brand_id: e.target.value })} options={brands} /></FormRow>
        <FormRow label="Quantity"><FormInput type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="0" /></FormRow>
        <FormRow label="Unit"><FormSelect value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} options={unitOptions} /></FormRow>
        <FormRow label="Min. Quantity"><FormInput type="number" value={form.min_quantity} onChange={e => setForm({ ...form, min_quantity: e.target.value })} placeholder="0" /></FormRow>
        <FormRow label="Status" required><FormRadioGroup value={form.status} onChange={v => setForm({ ...form, status: v })} options={['Active', 'Inactive']} /></FormRow>
      </>}
    />
  );
};

export default MainStoreMaterial;
