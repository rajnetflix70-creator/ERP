/**
 * Shared CRUD layout used by all Main Store masters.
 * Props:
 *   title, icon – page heading
 *   columns     – [{ key, label, render? }]
 *   rows        – array of data objects
 *   loading     – bool
 *   formTitle   – string
 *   formContent – JSX rendered inside the form card
 *   onSubmit    – form submit handler
 *   onAdd       – () => void
 *   onEdit      – (row) => void
 *   onDelete    – (id) => void
 *   showForm    – bool
 *   onCancel    – () => void
 *   accentColor – hex colour for header accent (default #2b5876)
 */
import React, { useState } from 'react';

/* ── tiny helpers ── */
const Badge = ({ label, active }) => (
  <span style={{
    display: 'inline-block',
    padding: '2px 12px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.4px',
    background: active ? '#dcfce7' : '#fee2e2',
    color: active ? '#15803d' : '#b91c1c',
    border: `1px solid ${active ? '#86efac' : '#fca5a5'}`,
  }}>{label}</span>
);

const Pagination = ({ current, total, onChange }) => {
  const pages = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
      <PagBtn label="‹ Prev" disabled={current === 1}    onClick={() => onChange(current - 1)} />
      {pages.slice(0, 7).map(p => (
        <PagBtn key={p} label={p} active={p === current} onClick={() => onChange(p)} />
      ))}
      {total > 7 && <span style={{ padding: '0 4px', color: '#94a3b8' }}>…</span>}
      <PagBtn label="Next ›" disabled={current === total || total === 0} onClick={() => onChange(current + 1)} />
    </div>
  );
};

const PagBtn = ({ label, active, disabled, onClick }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      minWidth: '34px', height: '34px', padding: '0 10px',
      border: `1px solid ${active || (typeof label === 'number' && label === currentPage) ? '#f5a623' : '#e2e8f0'}`,
      borderRadius: '6px',
      background: active || (typeof label === 'number' && label === currentPage) ? '#1a1f2e' : disabled ? '#f8fafc' : '#fff',
      color: active || (typeof label === 'number' && label === currentPage) ? '#f5a623' : disabled ? '#cbd5e1' : '#374151',
      fontWeight: active ? '700' : '500',
      fontSize: '12px', cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.15s',
    }}
  >{label}</button>
);

/* ── MAIN EXPORT ── */
const StoreCrudPage = ({
  title = 'Manage',
  icon = '🏷️',
  accentColor = '#1a1f2e',
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
  const [search, setSearch]         = useState('');
  const [perPage, setPerPage]       = useState(10);
  const [page, setPage]             = useState(1);

  /* filter */
  const filtered = rows.filter(r =>
    columns.some(col => String(r[col.key] ?? '').toLowerCase().includes(search.toLowerCase()))
  );
  const total     = filtered.length;
  const totalPgs  = Math.ceil(total / perPage) || 1;
  const start     = (page - 1) * perPage;
  const paged     = filtered.slice(start, start + perPage);

  /* ── FORM VIEW ── */
  if (showForm) {
    return (
      <div style={{ padding: '24px', background: '#f1f5f9', minHeight: '100vh' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
          <button onClick={onCancel}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#f5a623', fontWeight: '700', padding: 0, fontFamily: 'inherit' }}>
            ← Back to {title}
          </button>
        </div>

        {/* Form Card */}
        <div style={{
          background: '#fff', borderRadius: '12px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.08)', overflow: 'hidden', maxWidth: '680px'
        }}>
          {/* Card header stripe */}
          <div style={{
            background: `linear-gradient(135deg, #1a1f2e, #2e3547)`,
            borderBottom: '3px solid #f5a623',
            padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <span style={{ fontSize: '20px' }}>{icon}</span>
            <span style={{ color: '#f5a623', fontWeight: '700', fontSize: '15px', fontFamily: "'Rajdhani',sans-serif", letterSpacing:'0.05em' }}>{formTitle}</span>
          </div>

          <form onSubmit={onSubmit} style={{ padding: '28px 32px' }}>
            {formContent}
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button type="submit" style={{
                background: 'linear-gradient(135deg, #f5a623, #d4881c)',
                color: '#1a1f2e', padding: '9px 28px', borderRadius: '8px',
                border: 'none', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(245,166,35,0.3)', transition: 'opacity 0.2s'
              }}>💾 Save</button>
              <button type="button" onClick={onCancel} style={{
                background: '#f1f5f9', color: '#475569', padding: '9px 22px',
                borderRadius: '8px', border: '1px solid #e2e8f0',
                fontWeight: '600', fontSize: '14px', cursor: 'pointer'
              }}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  /* ── LIST VIEW ── */
  return (
    <div style={{ padding: '24px', background: '#f1f5f9', minHeight: '100vh' }}>

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #1a1f2e, #2e3547)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
          }}>{icon}</div>
          <div>
            <h2 style={{ margin: 0, fontSize: '21px', fontWeight: '700', color: '#1a1f2e', fontFamily:"'Rajdhani',sans-serif", letterSpacing:'0.03em' }}>{title}</h2>
            <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>{total} records found</p>
          </div>
        </div>
        <button onClick={onAdd} style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          background: 'linear-gradient(135deg,#f5a623,#d4881c)',
          color: '#1a1f2e', padding: '9px 20px', borderRadius: '8px',
          border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer',
          boxShadow: '0 2px 10px rgba(245,166,35,0.3)', transition: 'transform 0.15s, box-shadow 0.15s'
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(245,166,35,0.45)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(245,166,35,0.3)'; }}
        >
          ＋ Add New
        </button>
      </div>

      {/* Table Card */}
      <div style={{
        background: '#fff', borderRadius: '12px',
        boxShadow: '0 2px 16px rgba(0,0,0,0.07)', overflow: 'hidden'
      }}>
        {/* Toolbar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 20px', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '10px'
        }}>
          {/* Entries selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b' }}>
            <span>Show</span>
            <select value={perPage} onChange={e => { setPerPage(+e.target.value); setPage(1); }}
              style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#374151', outline: 'none' }}>
              {[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span>entries</span>
          </div>

          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: '#64748b' }}>🔍</span>
            <input
              type="text" placeholder="Search..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{
                padding: '7px 12px', borderRadius: '8px', border: '1px solid #e2e8f0',
                outline: 'none', fontSize: '13px', width: '220px',
                transition: 'border 0.2s', color: '#374151'
              }}
              onFocus={e => e.target.style.borderColor = '#f5a623'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'linear-gradient(90deg,#f8fafc,#f1f5f9)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#f5a623', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap', borderBottom: '2px solid #f5a623', width: '50px', background: '#1a1f2e', fontFamily:"'Rajdhani',sans-serif" }}>#</th>
                {columns.map(col => (
                  <th key={col.key} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#f5a623', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap', borderBottom: '2px solid #f5a623', background: '#1a1f2e', fontFamily:"'Rajdhani',sans-serif" }}>{col.label}</th>
                ))}
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: '#f5a623', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap', borderBottom: '2px solid #f5a623', width: '100px', background: '#1a1f2e', fontFamily:"'Rajdhani',sans-serif" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={columns.length + 2} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <div style={{ width: '18px', height: '18px', border: '2px solid #e2e8f0', borderTopColor: '#f5a623', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Loading...
                  </div>
                </td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={columns.length + 2} style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>
                  <div style={{ fontSize: '40px', marginBottom: '8px' }}>📭</div>
                  <div style={{ fontWeight: '600' }}>No records found</div>
                </td></tr>
              ) : paged.map((row, i) => (
                <tr key={row.id || i}
                  style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fef3dc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px', color: '#94a3b8', fontWeight: '700', fontSize: '12px', fontFamily:"'Rajdhani',sans-serif" }}>{start + i + 1}</td>
                  {columns.map(col => (
                    <td key={col.key} style={{ padding: '12px 16px', color: '#374151' }}>
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button onClick={() => onEdit(row)} title="Edit"
                        style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #f5a623', background: '#fef3dc', color: '#1a1f2e', cursor: 'pointer', fontSize: '13px', fontWeight: '700', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f5a623'; e.currentTarget.style.color = '#1a1f2e'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#fef3dc'; e.currentTarget.style.color = '#1a1f2e'; }}>
                        ✏️
                      </button>
                      <button onClick={() => onDelete(row.id)} title="Delete"
                        style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; }}>
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
          padding: '14px 20px', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '10px'
        }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Showing <b>{total === 0 ? 0 : start + 1}</b> to <b>{Math.min(start + perPage, total)}</b> of <b>{total}</b> entries
          </span>
          <Pagination current={page} total={totalPgs} onChange={p => setPage(p)} />
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

/* ── shared form field helpers ── */
export const FormRow = ({ label, required, children }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '18px', gap: '16px' }}>
    <label style={{ width: '130px', paddingTop: '9px', fontWeight: '700', fontSize: '13px', color: '#374151', flexShrink: 0 }}>
      {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
    </label>
    <div style={{ flex: 1 }}>{children}</div>
  </div>
);

export const FormInput = ({ value, onChange, required, placeholder, type = 'text' }) => (
  <input type={type} value={value} onChange={onChange} required={required} placeholder={placeholder}
    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '13px', color: '#374151', boxSizing: 'border-box', transition: 'border 0.2s' }}
    onFocus={e => e.target.style.borderColor = '#2b5876'}
    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
  />
);

export const FormSelect = ({ value, onChange, options = [], required }) => (
  <select value={value} onChange={onChange} required={required}
    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '13px', color: '#374151', background: '#fff', boxSizing: 'border-box' }}>
    <option value="">-- Select --</option>
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

export const FormRadioGroup = ({ value, onChange, options = [] }) => (
  <div style={{ display: 'flex', gap: '20px', paddingTop: '6px' }}>
    {options.map(o => (
      <label key={o} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
        <input type="radio" name="status" value={o} checked={value === o} onChange={() => onChange(o)}
          style={{ accentColor: '#2b5876', width: '15px', height: '15px' }} />
        {o}
      </label>
    ))}
  </div>
);

export const StatusBadge = ({ value }) => (
  <Badge label={value} active={value === 'Active'} />
);

export default StoreCrudPage;
