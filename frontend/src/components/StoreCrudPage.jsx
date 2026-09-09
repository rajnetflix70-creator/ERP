/**
 * Shared CRUD layout used by all master pages.
 * Clean enterprise design matching BuildTrack reference.
 * 
 * Props:
 *   title, icon     – page heading
 *   columns         – [{ key, label, render? }]
 *   rows            – array of data objects
 *   loading         – bool
 *   formTitle       – string
 *   formContent     – JSX rendered inside the form card
 *   onSubmit        – form submit handler
 *   onAdd           – () => void
 *   onEdit          – (row) => void
 *   onDelete        – (id) => void
 *   showForm        – bool
 *   onCancel        – () => void
 */
import React, { useState } from 'react';

/* ── Status Badge ── */
const Badge = ({ label, active }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '2px 10px', borderRadius: '20px',
    fontSize: '0.72rem', fontWeight: '600',
    background: active ? '#dcfce7' : '#fee2e2',
    color: active ? '#15803d' : '#b91c1c',
  }}>{label}</span>
);

/* ── Pagination ── */
const Pagination = ({ current, total, onChange }) => {
  const pages = Array.from({ length: total }, (_, i) => i + 1);
  const visible = pages.length <= 7 ? pages : [...pages.slice(0, 5), -1, pages.length];
  return (
    <div className="pagination">
      <button className="pagination-btn" disabled={current === 1} onClick={() => onChange(current - 1)}>‹</button>
      {visible.map((p, i) =>
        p === -1
          ? <span key={`ellipsis-${i}`} style={{ padding: '0 4px', color: '#94a3b8' }}>…</span>
          : <button key={p} className={`pagination-btn ${p === current ? 'active' : ''}`} onClick={() => onChange(p)}>{p}</button>
      )}
      <button className="pagination-btn" disabled={current === total || total === 0} onClick={() => onChange(current + 1)}>›</button>
    </div>
  );
};

/* ── MAIN EXPORT ── */
const StoreCrudPage = ({
  title = 'Manage',
  icon = '🏷️',
  columns = [],
  rows = [],
  loading = false,
  showForm = false,
  formTitle = 'Add New',
  formContent,
  onSubmit,
  onAdd,
  onEdit,
  onDelete,
  onCancel,
}) => {
  const [search, setSearch] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

  /* filter */
  const filtered = rows.filter(r =>
    columns.some(col => String(r[col.key] ?? '').toLowerCase().includes(search.toLowerCase()))
  );
  const total = filtered.length;
  const totalPgs = Math.ceil(total / perPage) || 1;
  const start = (page - 1) * perPage;
  const paged = filtered.slice(start, start + perPage);

  /* ── FORM VIEW ── */
  if (showForm) {
    return (
      <div>
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <a href="#" onClick={(e) => { e.preventDefault(); onCancel(); }}>{title}</a>
          <span className="breadcrumb-sep">/</span>
          <span>{formTitle}</span>
        </div>

        {/* Form Card */}
        <div className="card" style={{ maxWidth: '700px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            marginBottom: '20px', paddingBottom: '14px',
            borderBottom: '1px solid var(--border)'
          }}>
            <span style={{ fontSize: '1.2rem' }}>{icon}</span>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: 'var(--navy)' }}>{formTitle}</h3>
          </div>

          <form onSubmit={onSubmit}>
            {formContent}
            <div style={{ display: 'flex', gap: '8px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <button type="submit" className="btn btn-primary">
                💾 Save
              </button>
              <button type="button" onClick={onCancel} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  /* ── LIST VIEW ── */
  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">{total} records found</p>
        </div>
        <button onClick={onAdd} className="btn btn-primary">
          ＋ Add New
        </button>
      </div>

      {/* Table Card */}
      <div className="card" style={{ padding: 0 }}>
        {/* Toolbar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 16px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: '10px'
        }}>
          {/* Entries selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <span>Show</span>
            <select value={perPage} onChange={e => { setPerPage(+e.target.value); setPage(1); }}
              style={{
                padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)',
                fontSize: '0.82rem', color: 'var(--text)', outline: 'none', fontFamily: 'var(--font)'
              }}>
              {[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span>entries</span>
          </div>

          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>🔍</span>
            <input
              type="text" placeholder="Search..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="form-control"
              style={{ width: '200px', padding: '6px 10px', fontSize: '0.82rem' }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: '50px' }}>#</th>
                {columns.map(col => (
                  <th key={col.key}>{col.label}</th>
                ))}
                <th style={{ width: '100px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={columns.length + 2} style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--text-muted)' }}>
                    <div className="loading-spinner" />
                    Loading...
                  </div>
                </td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={columns.length + 2}>
                  <div className="empty-state">
                    <div className="empty-state-icon">📭</div>
                    <div className="empty-state-title">No records found</div>
                    <div className="empty-state-text">Try adjusting your search or add a new entry.</div>
                  </div>
                </td></tr>
              ) : paged.map((row, i) => (
                <tr key={row.id || i}>
                  <td style={{ color: 'var(--text-muted)', fontWeight: '500', fontSize: '0.8rem' }}>{start + i + 1}</td>
                  {columns.map(col => (
                    <td key={col.key}>
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <button onClick={() => onEdit(row)} title="Edit"
                        className="btn btn-sm btn-outline"
                        style={{ padding: '4px 8px', fontSize: '0.78rem' }}>
                        ✏️
                      </button>
                      <button onClick={() => onDelete(row.id)} title="Delete"
                        className="btn btn-sm"
                        style={{
                          padding: '4px 8px', fontSize: '0.78rem',
                          background: 'var(--danger-lt)', color: 'var(--danger)',
                          border: '1px solid #fecaca'
                        }}>
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 16px', borderTop: '1px solid var(--border)', flexWrap: 'wrap', gap: '8px'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Showing <b>{total === 0 ? 0 : start + 1}</b> to <b>{Math.min(start + perPage, total)}</b> of <b>{total}</b> entries
          </span>
          <Pagination current={page} total={totalPgs} onChange={p => setPage(p)} />
        </div>
      </div>
    </div>
  );
};

/* ── shared form field helpers ── */
export const FormRow = ({ label, required, children }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '16px', gap: '12px' }}>
    <label style={{
      width: '130px', paddingTop: '8px', fontWeight: '500',
      fontSize: '0.85rem', color: 'var(--text)', flexShrink: 0
    }}>
      {label}{required && <span style={{ color: 'var(--danger)' }}> *</span>}
    </label>
    <div style={{ flex: 1 }}>{children}</div>
  </div>
);

export const FormInput = ({ value, onChange, required, placeholder, type = 'text' }) => (
  <input type={type} value={value} onChange={onChange} required={required} placeholder={placeholder}
    className="form-control"
    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
  />
);

export const FormSelect = ({ value, onChange, options = [], required }) => (
  <select value={value} onChange={onChange} required={required}
    className="form-control"
    style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
    <option value="">-- Select --</option>
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

export const FormRadioGroup = ({ value, onChange, options = [] }) => (
  <div style={{ display: 'flex', gap: '20px', paddingTop: '6px' }}>
    {options.map(o => (
      <label key={o} style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500', color: 'var(--text)'
      }}>
        <input type="radio" name="status" value={o} checked={value === o} onChange={() => onChange(o)}
          style={{ accentColor: 'var(--primary)', width: '15px', height: '15px' }} />
        {o}
      </label>
    ))}
  </div>
);

export const StatusBadge = ({ value }) => (
  <Badge label={value} active={value === 'Active'} />
);

export default StoreCrudPage;
