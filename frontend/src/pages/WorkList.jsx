import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getProjects, getProjectStats } from '../api/projects';

const STATUS_BADGES = {
  active: { label: 'Active', color: 'badge-present' },
  needs_supervisor: { label: 'Supervisor Required', color: 'badge-absent' },
  pending: { label: 'Pending', color: 'badge-half-day' },
  grouting_pending: { label: 'Grouting Pending', color: 'badge-warning' },
  strengthening: { label: 'Strengthening', color: 'badge-asset' },
  completed: { label: 'Completed', color: 'badge-on-leave' },
  stopped: { label: 'Stopped', color: 'badge-absent' },
};

const WorkList = () => {
  const { t } = useTranslation();
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [onlyShortage, setOnlyShortage] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [projData, statsData] = await Promise.all([
        getProjects(),
        getProjectStats(),
      ]);
      setProjects(projData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load work list', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredProjects = projects.filter(p => {
    if (filterStatus && p.status !== filterStatus) return false;
    if (onlyShortage && (p.supervisors_required || 0) <= 0 && p.status !== 'needs_supervisor') return false;
    if (search) {
      const q = search.toLowerCase();
      const nameMatch = p.project_name?.toLowerCase().includes(q);
      const codeMatch = p.ak_job_no?.toLowerCase().includes(q);
      const folderMatch = p.folder_no?.toString().includes(q);
      const supMatch = p.supervisor_names?.toLowerCase().includes(q);
      return nameMatch || codeMatch || folderMatch || supMatch;
    }
    return true;
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus, onlyShortage]);

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / PAGE_SIZE));
  const pagedProjects = filteredProjects.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const totalArea = projects.reduce((acc, p) => acc + (parseFloat(p.area_sqft) || 0), 0);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">📋 {t('nav.workList', 'Project Work List')}</h1>
          <p className="page-subtitle">Overview of active UAE job sites, supervisor deployment requirements, and machinery allocation.</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadData}>🔄 Refresh Data</button>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid-4" style={{ marginBottom: 24 }}>
          <div className="stat-card" style={{ borderColor: 'var(--color-header)' }}>
            <div className="stat-number" style={{ color: 'var(--color-header)' }}>{stats.total}</div>
            <div className="stat-label">Total Job Sites</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
              Total Area: <strong>{Math.round(totalArea).toLocaleString()}</strong> sq ft
            </div>
          </div>

          <div className="stat-card" style={{ borderColor: 'var(--color-success)' }}>
            <div className="stat-number" style={{ color: 'var(--color-success)' }}>{stats.active}</div>
            <div className="stat-label">Active Operational Sites</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
              Site teams deployed
            </div>
          </div>

          <div className="stat-card" style={{ borderColor: 'var(--color-danger)', background: stats.supervisors_gap > 0 ? 'var(--color-danger-lt)' : 'white' }}>
            <div className="stat-number" style={{ color: 'var(--color-danger)' }}>{stats.supervisors_gap}</div>
            <div className="stat-label">Supervisor Vacancies / Gap</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-danger)', fontWeight: 600, marginTop: 4 }}>
              {stats.needs_supervisor || 0} sites need supervisors
            </div>
          </div>

          <div className="stat-card" style={{ borderColor: 'var(--color-warning)' }}>
            <div className="stat-number" style={{ color: 'var(--color-warning)' }}>
              {(stats.grouting_pending || 0) + (stats.pending || 0)}
            </div>
            <div className="stat-label">Pending & Grouting Pending</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
              {stats.completed || 0} sites completed
            </div>
          </div>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 280px' }}>
            <input
              className="form-control"
              placeholder="Search by job code (AK-24-...), project name, or supervisor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div style={{ width: 180 }}>
            <select className="form-control" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="needs_supervisor">Supervisor Required</option>
              <option value="grouting_pending">Grouting Pending</option>
              <option value="strengthening">Strengthening</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="stopped">Stopped</option>
            </select>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-danger)' }}>
            <input
              type="checkbox"
              checked={onlyShortage}
              onChange={e => setOnlyShortage(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'var(--color-danger)' }}
            />
            ⚠️ Show Supervisor Shortages Only
          </label>
        </div>
      </div>

      {/* Work List Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : filteredProjects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No matching projects found</h3>
            <p>Try clearing your filters or searching for another term.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Job / Folder</th>
                <th>Project Name & Details</th>
                <th>Area (sq ft)</th>
                <th>Assigned Supervisors</th>
                <th>Supervisor Needs</th>
                <th>Equipment Deployed</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pagedProjects.map((prj) => {
                const badge = STATUS_BADGES[prj.status] || { label: prj.status, color: 'badge-asset' };
                const hasRequirement = (prj.supervisors_required || 0) > 0;

                return (
                  <tr key={prj.id} style={{ background: hasRequirement ? '#FFF5F5' : 'white' }}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div className="font-semibold" style={{ color: 'var(--color-header)' }}>
                        {prj.ak_job_no || (prj.folder_no ? `Folder #${prj.folder_no}` : '—')}
                      </div>
                      {prj.folder_no && prj.ak_job_no && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                          Folder #{prj.folder_no}
                        </div>
                      )}
                    </td>

                    <td>
                      <div className="font-semibold" style={{ color: 'var(--color-text)' }}>
                        {prj.project_name}
                      </div>
                      {prj.notes && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                          📝 {prj.notes}
                        </div>
                      )}
                    </td>

                    <td style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                      {prj.area_sqft ? parseFloat(prj.area_sqft).toLocaleString() : '—'}
                    </td>

                    <td>
                      {prj.supervisor_names ? (
                        <div style={{ fontSize: '0.88rem', color: '#1E293B' }}>
                          👤 {prj.supervisor_names}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>None assigned</span>
                      )}
                    </td>

                    <td>
                      {hasRequirement ? (
                        <span className="badge badge-absent" style={{ display: 'inline-flex', gap: 4 }}>
                          ⚠️ {prj.supervisors_required} Required
                          {prj.technicians_required > 0 && ` (${prj.technicians_required} Tech)`}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-success)', fontSize: '0.85rem', fontWeight: 600 }}>
                          ✓ Staffed
                        </span>
                      )}
                      {prj.supervisors_available_march > 0 && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-warning)', marginTop: 2 }}>
                          📅 {prj.supervisors_available_march} available March end
                        </div>
                      )}
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {prj.has_stressing_machine && <span className="badge badge-asset">Stressing</span>}
                        {prj.has_onion_machine && <span className="badge badge-consumable">Onion</span>}
                        {prj.has_gun_machine && <span className="badge badge-half-day">Gun</span>}
                        {prj.has_grouting_machine && <span className="badge badge-present">Grouting</span>}
                        {!prj.has_stressing_machine && !prj.has_onion_machine && !prj.has_gun_machine && !prj.has_grouting_machine && (
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Standard</span>
                        )}
                      </div>
                    </td>

                    <td>
                      <span className={`badge ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, flexWrap: 'wrap', gap: 12 }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', margin: 0 }}>
          Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredProjects.length)}–{Math.min(currentPage * PAGE_SIZE, filteredProjects.length)} of {filteredProjects.length} projects
        </p>

        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-sm btn-secondary"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              style={{ minWidth: 36, opacity: currentPage === 1 ? 0.4 : 1 }}
            >
              ◀
            </button>

            {(() => {
              const pages = [];
              const show = new Set([1, totalPages]);
              for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) show.add(i);
              const sorted = [...show].sort((a, b) => a - b);
              sorted.forEach((page, idx) => {
                if (idx > 0 && page - sorted[idx - 1] > 1) {
                  pages.push(<span key={`e${page}`} style={{ padding: '0 6px', color: 'var(--color-text-muted)', fontSize: '0.85rem', userSelect: 'none' }}>…</span>);
                }
                pages.push(
                  <button
                    key={page}
                    className={`btn btn-sm ${page === currentPage ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setCurrentPage(page)}
                    style={{ minWidth: 36, fontWeight: page === currentPage ? 700 : 400 }}
                  >
                    {page}
                  </button>
                );
              });
              return pages;
            })()}

            <button
              className="btn btn-sm btn-secondary"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              style={{ minWidth: 36, opacity: currentPage === totalPages ? 0.4 : 1 }}
            >
              ▶
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkList;
