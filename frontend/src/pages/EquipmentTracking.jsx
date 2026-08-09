import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getDailyEquipmentGrid, updateDailyEquipmentLog, getSiteGroupedFleet, getCalibrationSummary, getEquipmentMachines
} from '../api/equipment_machines';
import Modal from '../components/Modal';

// Date utility helpers
const formatDateStr = (dateObj) => {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getTodayStr = () => formatDateStr(new Date());

const getOffsetDateStr = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return formatDateStr(d);
};

const generateDateArray = (startStr, endStr) => {
  if (!startStr || !endStr) return [getTodayStr()];
  const dates = [];
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return [startStr || getTodayStr()];
  }
  let current = new Date(start);
  let count = 0;
  while (current <= end && count < 60) {
    dates.push(formatDateStr(current));
    current.setDate(current.getDate() + 1);
    count++;
  }
  return dates;
};

const getCalibrationStatus = (expiryDate) => {
  if (!expiryDate) return { label: 'No Cert', color: 'badge-absent', icon: '❓', daysLeft: null };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: `Expired (${Math.abs(diffDays)}d ago)`, color: 'badge-absent', icon: '🔴', daysLeft: diffDays };
  } else if (diffDays <= 30) {
    return { label: `Expiring (${diffDays}d left)`, color: 'badge-warning', icon: '⚠️', daysLeft: diffDays };
  }
  return { label: `Valid (${diffDays}d left)`, color: 'badge-present', icon: '🟢', daysLeft: diffDays };
};

const EquipmentTracking = () => {
  const { t } = useTranslation();
  const todayStr = getTodayStr();

  // View Mode: 'site_cards' | 'timeline' | 'calibration'
  const [viewMode, setViewMode] = useState('site_cards');

  // Timeline States
  const [startDate, setStartDate] = useState(getTodayStr());
  const [endDate, setEndDate] = useState(getTodayStr());
  const [presetMode, setPresetMode] = useState('today');

  // Data States
  const [siteFleet, setSiteFleet] = useState([]);
  const [gridData, setGridData] = useState([]);
  const [calibrationData, setCalibrationData] = useState([]);
  const [calibrationSummary, setCalibrationSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('stressing');
  const [search, setSearch] = useState('');
  const [editCell, setEditCell] = useState(null); // { machine, date, currentLocation }
  const [newLocation, setNewLocation] = useState('');
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  // Load Data based on active view mode
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (viewMode === 'site_cards') {
        const fleet = await getSiteGroupedFleet({
          machine_type: filterType === 'all' ? null : filterType,
          search: search || null,
        });
        setSiteFleet(fleet);
      } else if (viewMode === 'timeline') {
        const data = await getDailyEquipmentGrid({
          start_date: startDate,
          end_date: endDate,
          machine_type: filterType === 'all' ? null : filterType,
        });
        setGridData(data);
      } else if (viewMode === 'calibration') {
        const [listRes, summaryRes] = await Promise.all([
          getEquipmentMachines({ machine_type: filterType === 'all' ? null : filterType, search: search || null }),
          getCalibrationSummary(),
        ]);
        setCalibrationData(listRes.filter(m => ['stressing', 'flower', 'grouting'].includes(m.machine_type)));
        setCalibrationSummary(summaryRes);
      }
    } catch (e) {
      setAlert({ type: 'error', message: 'Failed to load equipment command center data' });
    } finally {
      setLoading(false);
    }
  }, [viewMode, filterType, search, startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Preset Handlers for Timeline
  const handleSelectPreset = (mode) => {
    setPresetMode(mode);
    if (mode === 'yesterday') {
      const y = getOffsetDateStr(-1);
      setStartDate(y); setEndDate(y);
    } else if (mode === 'today') {
      const tDay = getTodayStr();
      setStartDate(tDay); setEndDate(tDay);
    } else if (mode === 'tomorrow') {
      const tm = getOffsetDateStr(1);
      setStartDate(tm); setEndDate(tm);
    } else if (mode === '3days') {
      setStartDate(getOffsetDateStr(-1)); setEndDate(getOffsetDateStr(1));
    } else if (mode === '7days') {
      setStartDate(getOffsetDateStr(-3)); setEndDate(getOffsetDateStr(3));
    } else if (mode === 'feb2026') {
      setStartDate('2026-02-01'); setEndDate('2026-02-21');
    }
  };

  const openTransferModal = (machine, date, currentLocation) => {
    setEditCell({ machine, date: date || todayStr, currentLocation });
    setNewLocation(currentLocation || 'ABDUL AZIZ STORE');
  };

  const handleSaveTransfer = async () => {
    if (!editCell || !newLocation) return;
    setSaving(true);
    try {
      await updateDailyEquipmentLog({
        machine_id: editCell.machine.id,
        log_date: editCell.date,
        location_name: newLocation,
      });

      setAlert({
        type: 'success',
        message: `Updated location of ${editCell.machine.machine_no} to "${newLocation}" on ${editCell.date}`,
      });
      setEditCell(null);
      loadData();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Transfer failed' });
    } finally {
      setSaving(false);
    }
  };

  const activeDates = generateDateArray(startDate, endDate);

  const filteredTimelineData = gridData.filter(m => {
    if (search) {
      const q = search.toLowerCase();
      const matchNo = m.machine_no?.toLowerCase().includes(q);
      const matchBrand = m.brand?.toLowerCase().includes(q);
      const matchJack = m.jack_no?.toLowerCase().includes(q);
      const matchPump = m.pump_no?.toLowerCase().includes(q);
      return matchNo || matchBrand || matchJack || matchPump;
    }
    return true;
  });

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">🚚 {t('nav.equipmentTracking', 'Equipment Fleet Command Center')}</h1>
          <p className="page-subtitle">Site-by-site machinery deployment cards, daily allocation matrix, and ISO calibration compliance dashboard.</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadData}>🔄 Refresh Data</button>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type === 'success' ? 'success' : 'error'}`} style={{ marginBottom: 16 }}>
          <span>{alert.type === 'success' ? '✅' : '❌'}</span>
          <span>{alert.message}</span>
          <button
            style={{ marginInlineStart: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
            onClick={() => setAlert(null)}
          >✕</button>
        </div>
      )}

      {/* Main View Mode Selector */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          className={`btn ${viewMode === 'site_cards' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setViewMode('site_cards')}
          style={{ fontWeight: 700, padding: '10px 18px' }}
        >
          📍 Site Fleet Cards View
        </button>
        <button
          className={`btn ${viewMode === 'timeline' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setViewMode('timeline')}
          style={{ fontWeight: 700, padding: '10px 18px' }}
        >
          🗓 Deployment Timeline Matrix
        </button>
        <button
          className={`btn ${viewMode === 'calibration' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setViewMode('calibration')}
          style={{ fontWeight: 700, padding: '10px 18px' }}
        >
          📜 Calibration Compliance Health
        </button>
      </div>

      {/* Filter Tabs for Machine Type */}
      <div className="tabs">
        <button className={`tab-btn ${filterType === 'stressing' ? 'active' : ''}`} onClick={() => setFilterType('stressing')}>
          ⚙ Stressing Machines
        </button>
        <button className={`tab-btn ${filterType === 'flower' ? 'active' : ''}`} onClick={() => setFilterType('flower')}>
          🧅 Flower / Onion Machines
        </button>
        <button className={`tab-btn ${filterType === 'grouting' ? 'active' : ''}`} onClick={() => setFilterType('grouting')}>
          💧 Grouting Machines
        </button>
        <button className={`tab-btn ${filterType === 'all' ? 'active' : ''}`} onClick={() => setFilterType('all')}>
          🌐 All Machinery
        </button>
      </div>

      {/* ── VIEW 1: SITE FLEET CARDS VIEW ── */}
      {viewMode === 'site_cards' && (
        <>
          {/* Toolbar */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: '1 1 280px' }}>
                <input
                  className="form-control"
                  placeholder="Filter site fleet by machine #, brand, store name..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <span style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginInlineStart: 'auto' }}>
                Showing <strong>{siteFleet.length}</strong> active stores & job sites
              </span>
            </div>
          </div>

          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : siteFleet.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📍</div>
              <h3>No matching site fleet found</h3>
              <p>Try adjusting your search or category filter.</p>
            </div>
          ) : (
            <div className="grid-2" style={{ gap: 20 }}>
              {siteFleet.map((site) => (
                <div
                  key={site.location_name}
                  className="card"
                  style={{
                    borderTop: site.is_store ? '4px solid var(--color-warning)' : '4px solid var(--color-primary)',
                    background: 'white',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  }}
                >
                  <div>
                    {/* Site Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '1.3rem' }}>{site.is_store ? '📦' : '🏗'}</span>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-header)', margin: 0 }}>
                            {site.location_name}
                          </h3>
                        </div>
                        <span className={`badge ${site.is_store ? 'badge-warning' : 'badge-present'}`} style={{ marginTop: 6, display: 'inline-block' }}>
                          {site.is_store ? 'Central Store Repository' : 'Active Field Project Site'}
                        </span>
                      </div>

                      <div style={{ textAlign: 'end' }}>
                        <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                          {site.total_count}
                        </span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Units Deployed</div>
                      </div>
                    </div>

                    {/* Machinery List inside Card */}
                    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>
                        Deployed Equipment Units ({site.machines.length})
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto', paddingRight: 4 }}>
                        {site.machines.map(m => {
                          const cal = getCalibrationStatus(m.calibration_expiry_date);
                          return (
                            <div
                              key={m.id}
                              style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '8px 12px', background: 'var(--color-surface)', borderRadius: 8,
                                border: '1px solid var(--color-border)', fontSize: '0.85rem'
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ fontWeight: 700, color: 'var(--color-header)' }}>{m.machine_no}</span>
                                  <span className="badge badge-asset" style={{ fontSize: '0.72rem' }}>{m.brand}</span>
                                  {m.paired_set_code && (
                                    <span style={{ fontSize: '0.72rem', color: 'var(--color-primary-dk)', background: 'rgba(37,99,235,0.08)', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                                      {m.paired_set_code}
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                                  {m.jack_no && <span>Jack #{m.jack_no} • </span>}
                                  {m.pump_no && <span>Pump #{m.pump_no} • </span>}
                                  {m.pressure_gauge_no && <span>Gauge #{m.pressure_gauge_no}</span>}
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span className={`badge ${cal.color}`} style={{ fontSize: '0.72rem' }} title={`Cert: ${m.calibration_cert_no || 'None'}`}>
                                  {cal.icon} {cal.label}
                                </span>

                                <button
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                                  onClick={() => openTransferModal(m, todayStr, m.current_location_name)}
                                >
                                  🚚 Transfer
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── VIEW 2: TIMELINE DEPLOYMENT MATRIX ── */}
      {viewMode === 'timeline' && (
        <>
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--color-border)', paddingBottom: 12 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-header)', marginInlineEnd: 4 }}>
                📅 Quick Date Select:
              </span>
              <button className={`btn btn-sm ${presetMode === 'yesterday' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => handleSelectPreset('yesterday')}>
                ◀ Yesterday ({getOffsetDateStr(-1)})
              </button>
              <button className={`btn btn-sm ${presetMode === 'today' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => handleSelectPreset('today')} style={{ fontWeight: 700 }}>
                ⭐ Today ({todayStr})
              </button>
              <button className={`btn btn-sm ${presetMode === 'tomorrow' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => handleSelectPreset('tomorrow')}>
                Tomorrow ▶ ({getOffsetDateStr(1)})
              </button>
              <button className={`btn btn-sm ${presetMode === '3days' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => handleSelectPreset('3days')}>
                🗓 3-Day Window (Yest – Tom)
              </button>
              <button className={`btn btn-sm ${presetMode === '7days' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => handleSelectPreset('7days')}>
                📆 7 Days Range
              </button>
              <button className={`btn btn-sm ${presetMode === 'feb2026' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => handleSelectPreset('feb2026')}>
                📄 Feb 2026 Log Sheet
              </button>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 240px' }}>
                <label className="form-label" style={{ fontSize: '0.82rem', marginBottom: 4 }}>Search Machinery</label>
                <input
                  className="form-control"
                  placeholder="Search machine #, brand, pump/jack code..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <div style={{ flex: '0 0 150px' }}>
                <label className="form-label" style={{ fontSize: '0.82rem', marginBottom: 4 }}>Start Date</label>
                <input type="date" className="form-control" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPresetMode('custom'); }} />
              </div>

              <div style={{ flex: '0 0 150px' }}>
                <label className="form-label" style={{ fontSize: '0.82rem', marginBottom: 4 }}>End Date</label>
                <input type="date" className="form-control" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPresetMode('custom'); }} />
              </div>

              <button className="btn btn-secondary btn-sm" onClick={loadData} style={{ height: 38 }}>
                🔄 Refresh Grid
              </button>
            </div>
          </div>

          <div className="table-container" style={{ maxHeight: '65vh', overflow: 'auto' }}>
            {loading ? (
              <div className="loading-center"><div className="spinner" /></div>
            ) : filteredTimelineData.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🚚</div>
                <h3>No daily logs found</h3>
                <p>Select another date range or machinery type.</p>
              </div>
            ) : (
              <table style={{ minWidth: Math.max(800, activeDates.length * 130 + 400) }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--color-surface)' }}>
                  <tr>
                    <th style={{ position: 'sticky', left: 0, zIndex: 11, background: 'var(--color-surface)', borderRight: '2px solid var(--color-border)' }}>
                      Machine Details
                    </th>
                    <th>Brand</th>
                    <th>Hardware Specs (Jack / Pump / Gauge)</th>
                    {activeDates.map(d => {
                      const isToday = d === todayStr;
                      const dateObj = new Date(d);
                      const dayName = isNaN(dateObj.getTime()) ? '' : dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                      return (
                        <th
                          key={d}
                          style={{
                            textAlign: 'center',
                            minWidth: 120,
                            background: isToday ? 'rgba(37, 99, 235, 0.12)' : 'transparent',
                            borderBottom: isToday ? '3px solid var(--color-primary)' : undefined,
                          }}
                        >
                          <div style={{ fontSize: '0.85rem', fontWeight: isToday ? 700 : 600, color: isToday ? 'var(--color-primary)' : 'inherit' }}>
                            {isToday ? '⭐ TODAY' : d}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 400 }}>
                            {dayName} ({d.slice(5)})
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {filteredTimelineData.map((m) => (
                    <tr key={m.id}>
                      <td style={{
                        position: 'sticky', left: 0, zIndex: 2, background: 'white', borderRight: '2px solid var(--color-border)',
                        fontWeight: 700, color: 'var(--color-header)', whiteSpace: 'nowrap',
                      }}>
                        {m.machine_no}
                      </td>

                      <td style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                        {m.brand || '—'}
                      </td>

                      <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {m.jack_no && <span>Jack #{m.jack_no} </span>}
                        {m.pump_no && <span>Pump #{m.pump_no} </span>}
                        {m.motor_no && <span>Motor #{m.motor_no}</span>}
                      </td>

                      {activeDates.map(d => {
                        const loc = m.daily_locations?.[d] || m.current_location_name || 'STORE';
                        const isStore = loc.includes('STORE');
                        const isToday = d === todayStr;

                        return (
                          <td
                            key={d}
                            style={{
                              textAlign: 'center',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              background: isToday
                                ? (isStore ? '#FEF3C7' : '#DCFCE7')
                                : (isStore ? '#FFFBEB' : '#F0FDF4'),
                              border: isToday ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                              padding: '6px 8px',
                            }}
                            title={`Click to reassign ${m.machine_no} on ${d}`}
                            onClick={() => openTransferModal(m, d, loc)}
                          >
                            <span style={{
                              color: isStore ? 'var(--color-warning)' : 'var(--color-success)',
                              whiteSpace: 'nowrap',
                            }}>
                              {loc}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ── VIEW 3: CALIBRATION & COMPLIANCE HEALTH ── */}
      {viewMode === 'calibration' && (
        <>
          {/* KPI Cards */}
          {calibrationSummary && (
            <div className="grid-4" style={{ marginBottom: 24 }}>
              <div className="stat-card" style={{ borderColor: 'var(--color-header)' }}>
                <div className="stat-number" style={{ color: 'var(--color-header)' }}>{calibrationSummary.total_tracked}</div>
                <div className="stat-label">Tracked PT Machines</div>
              </div>
              <div className="stat-card" style={{ borderColor: 'var(--color-success)' }}>
                <div className="stat-number" style={{ color: 'var(--color-success)' }}>{calibrationSummary.valid}</div>
                <div className="stat-label">🟢 Valid Calibration</div>
              </div>
              <div className="stat-card" style={{ borderColor: 'var(--color-warning)' }}>
                <div className="stat-number" style={{ color: 'var(--color-warning)' }}>{calibrationSummary.expiring_soon}</div>
                <div className="stat-label">⚠️ Expiring Soon (30 Days)</div>
              </div>
              <div className="stat-card" style={{ borderColor: 'var(--color-danger)' }}>
                <div className="stat-number" style={{ color: 'var(--color-danger)' }}>{calibrationSummary.expired}</div>
                <div className="stat-label">🔴 Expired / Needs Recalibration</div>
              </div>
            </div>
          )}

          {/* Search bar for calibration */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: '1 1 280px' }}>
                <input
                  className="form-control"
                  placeholder="Search certificate #, machine ID, brand..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="table-container">
            {loading ? (
              <div className="loading-center"><div className="spinner" /></div>
            ) : calibrationData.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📜</div>
                <h3>No calibration records found</h3>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Machine Code</th>
                    <th>Type</th>
                    <th>Brand</th>
                    <th>Hardware Specs</th>
                    <th>Current Location</th>
                    <th>ISO Cert Number</th>
                    <th>Expiry Date</th>
                    <th>Compliance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {calibrationData.map(m => {
                    const cal = getCalibrationStatus(m.calibration_expiry_date);
                    return (
                      <tr key={m.id} style={{ background: cal.daysLeft < 0 ? '#FFF5F5' : 'white' }}>
                        <td className="font-semibold" style={{ color: 'var(--color-header)' }}>{m.machine_no}</td>
                        <td>
                          <span className="badge badge-asset" style={{ fontSize: '0.78rem' }}>
                            {m.machine_type?.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{m.brand}</td>
                        <td style={{ fontSize: '0.82rem' }}>
                          {m.jack_no && <span>Jack #{m.jack_no} • </span>}
                          {m.pump_no && <span>Pump #{m.pump_no}</span>}
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--color-primary-dk)' }}>📍 {m.current_location_name || 'STORE'}</td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{m.calibration_cert_no || 'N/A'}</td>
                        <td style={{ fontWeight: 600 }}>{m.calibration_expiry_date ? new Date(m.calibration_expiry_date).toLocaleDateString() : '—'}</td>
                        <td>
                          <span className={`badge ${cal.color}`}>
                            {cal.icon} {cal.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Transfer Modal */}
      <Modal
        isOpen={!!editCell}
        onClose={() => setEditCell(null)}
        title="Transfer / Dispatch Location"
        subtitle={editCell ? `${editCell.machine.machine_no} (${editCell.machine.brand}) on ${editCell.date}` : ''}
        icon="🚚"
        size="default"
      >
        {editCell && (
          <div>
            <div className="form-group">
              <label className="form-label">Destination Site or Store Location</label>
              <input
                className="form-control"
                value={newLocation}
                onChange={e => setNewLocation(e.target.value)}
                placeholder="e.g. 309.LUXRIDGE, ABDUL AZIZ STORE, PIVOT AUH..."
              />
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', width: '100%', marginBottom: 4 }}>Quick Location Picks:</span>
              {['ABDUL AZIZ STORE', 'PELAGOS STORE', 'TYCOON STORE', 'PIVOT AUH', '309.LUXRIDGE', '250.LUMINAR 2', '175.TIGER VOLGHA', '317.NAF BARARI'].map(loc => (
                <button
                  key={loc}
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                  onClick={() => setNewLocation(loc)}
                >
                  {loc}
                </button>
              ))}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setEditCell(null)}>Cancel</button>
              <button type="button" className="btn btn-primary" disabled={saving} onClick={handleSaveTransfer}>
                {saving ? <><span className="spinner" /> Saving…</> : '💾 Confirm Transfer'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EquipmentTracking;
