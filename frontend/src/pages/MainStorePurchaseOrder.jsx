import React, { useState, useEffect } from 'react';
import client from '../api/client';
import StoreCrudPage, { FormRow, FormInput, FormRadioGroup } from '../components/StoreCrudPage';

const EMPTY = { po_number: '', supplier_name: '', po_date: '', status: 'Pending' };

const StatusBadgePO = ({ value }) => {
  const map = {
    Pending:   { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
    Completed: { bg: '#f0fdf4', color: '#15803d', border: '#86efac' },
    Cancelled: { bg: '#fef2f2', color: '#b91c1c', border: '#fca5a5' },
  };
  const s = map[value] || map.Pending;
  return <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: '20px', padding: '2px 12px', fontSize: '11px', fontWeight: '700' }}>{value}</span>;
};

const MainStorePurchaseOrder = () => {
  const [rows, setRows]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState(EMPTY);

  const fetch = async () => {
    setLoading(true);
    try { const r = await client.get('/main-store/purchase-orders'); setRows(r.data?.data || []); }
    catch { setRows([]); } finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      editId ? await client.put(`/main-store/purchase-orders/${editId}`, form)
             : await client.post('/main-store/purchase-orders', form);
      setShowForm(false); setEditId(null); setForm(EMPTY); fetch();
    } catch (err) { alert(err.response?.data?.message || err.message); }
  };

  const handleEdit = (row) => {
    setEditId(row.id);
    setForm({ po_number: row.po_number, supplier_name: row.supplier_name, po_date: row.po_date?.slice(0,10) || '', status: row.status });
    setShowForm(true);
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this purchase order?')) return;
    try { await client.delete(`/main-store/purchase-orders/${id}`); fetch(); }
    catch { alert('Delete failed'); }
  };

  const columns = [
    { key: 'po_number',      label: 'PO Number',    render: (v) => <b style={{ color: '#1e40af', fontFamily: 'monospace' }}>{v}</b> },
    { key: 'supplier_name',  label: 'Supplier',      render: (v) => <span style={{ fontWeight: '600', color: '#1e293b' }}>{v}</span> },
    { key: 'po_date',        label: 'PO Date',       render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'status',         label: 'Status',         render: (v) => <StatusBadgePO value={v} /> },
  ];

  return (
    <StoreCrudPage
      title="Purchase Orders" icon="🛒" accentColor="#d97706"
      columns={columns} rows={rows} loading={loading}
      showForm={showForm} formTitle={editId ? 'Edit Purchase Order' : 'New Purchase Order'}
      onAdd={() => { setEditId(null); setForm(EMPTY); setShowForm(true); }}
      onEdit={handleEdit} onDelete={handleDelete}
      onCancel={() => setShowForm(false)} onSubmit={handleSubmit}
      formContent={<>
        <FormRow label="PO Number" required><FormInput required value={form.po_number} onChange={e => setForm({ ...form, po_number: e.target.value })} placeholder="e.g. PO-2024-001" /></FormRow>
        <FormRow label="Supplier Name" required><FormInput required value={form.supplier_name} onChange={e => setForm({ ...form, supplier_name: e.target.value })} placeholder="e.g. Al Habtoor Traders" /></FormRow>
        <FormRow label="PO Date" required><FormInput required type="date" value={form.po_date} onChange={e => setForm({ ...form, po_date: e.target.value })} /></FormRow>
        <FormRow label="Status" required>
          <FormRadioGroup value={form.status} onChange={v => setForm({ ...form, status: v })} options={['Pending', 'Completed', 'Cancelled']} />
        </FormRow>
      </>}
    />
  );
};

export default MainStorePurchaseOrder;
