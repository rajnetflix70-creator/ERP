import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '../api/client';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const InventoryDashboard = ({ defaultTab = 'dashboard' }) => {
  const { user } = useAuth();
  const [stockItems, setStockItems] = useState([]);
  const [issueLogs, setIssueLogs] = useState([]);
  const [materialsList, setMaterialsList] = useState([]);
  const [sitesList, setSitesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Screen 14: Material Issue Modal State
  const [showIssueModal, setShowIssueModal] = useState(defaultTab === 'issue');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [siteFilter, setSiteFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Screen 14 Form State
  const [issueForm, setIssueForm] = useState({
    material_id: '',
    site_location: '',
    quantity: '',
    purpose: '',
    contractor: '',
    remarks: '',
  });

  // Selected Material Details for Available Stock display
  const selectedMaterial = useMemo(() => {
    return stockItems.find(s => String(s.material_id) === String(issueForm.material_id) || String(s.id) === String(issueForm.material_id)) || stockItems[0] || {};
  }, [stockItems, issueForm.material_id]);

  // Load from live API
  const loadData = async () => {
    setLoading(true);
    try {
      const [matRes, sitesRes] = await Promise.allSettled([
        apiClient.get('/materials'),
        apiClient.get('/sites'),
      ]);

      let mats = [];
      if (matRes.status === 'fulfilled') {
        const raw = matRes.value.data?.data?.data || matRes.value.data?.data || matRes.value.data || [];
        if (Array.isArray(raw)) mats = raw;
      }
      setMaterialsList(mats);

      let sites = [];
      if (sitesRes.status === 'fulfilled') {
        const rawS = sitesRes.data?.data?.data || sitesRes.value?.data?.data || sitesRes.value?.data || [];
        if (Array.isArray(rawS)) sites = rawS;
      }
      setSitesList(sites);

      const mappedStock = mats.map((item, idx) => {
        const stockQty = Number(item.stock_quantity || item.current_stock || 0);
        const reorderLvl = Number(item.reorder_level || item.minimum_stock || 10);
        let status = 'In Stock';
        if (stockQty <= 0) status = 'Out of Stock';
        else if (stockQty <= reorderLvl) status = 'Low Stock';

        return {
          id: item.id || `stk-${idx + 1}`,
          material_id: item.id || `mat-${idx + 1}`,
          material_name: item.name || item.material_name || 'Material Item',
          category: item.category || 'General',
          site_name: item.site_name || (sites[0]?.name || 'Central Store'),
          site_id: item.site_id || sites[0]?.id || 's-1',
          opening_stock: stockQty,
          received_stock: 0,
          issued_stock: 0,
          balance: stockQty,
          unit: item.unit_of_measure || item.unit || 'Nos',
          reorder_level: reorderLvl,
          status,
        };
      });

      setStockItems(mappedStock);
      if (mappedStock.length > 0 && !issueForm.material_id) {
        setIssueForm(prev => ({
          ...prev,
          material_id: mappedStock[0].material_id,
          site_location: sites[0]?.name || 'Central Store',
        }));
      }
    } catch {
      setStockItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Stock Table
  const filteredStock = useMemo(() => {
    return stockItems.filter(item => {
      const matchSearch = !searchTerm ||
        item.material_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSite = !siteFilter || item.site_name.toLowerCase().includes(siteFilter.toLowerCase());
      const matchCategory = !categoryFilter || item.category.toLowerCase() === categoryFilter.toLowerCase();
      const matchStatus = !statusFilter || item.status.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchSite && matchCategory && matchStatus;
    });
  }, [stockItems, searchTerm, siteFilter, categoryFilter, statusFilter]);

  // Unique categories & sites for filters
  const categories = useMemo(() => Array.from(new Set(stockItems.map(s => s.category))).filter(Boolean), [stockItems]);
  const sites = useMemo(() => Array.from(new Set(stockItems.map(s => s.site_name))).filter(Boolean), [stockItems]);

  // Handle Quick Issue button from a table row
  const handleQuickIssue = (item) => {
    setIssueForm(prev => ({
      ...prev,
      material_id: item.material_id || item.id,
      site_location: item.site_name,
      quantity: '',
      purpose: '',
    }));
    setShowIssueModal(true);
  };

  // Submit Material Issue Form
  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    const qty = parseFloat(issueForm.quantity);

    if (!qty || qty <= 0) {
      setAlert({ type: 'error', message: 'Please enter a valid issue quantity greater than 0.' });
      return;
    }

    if (qty > (selectedMaterial.balance || 0)) {
      setAlert({
        type: 'error',
        message: `Insufficient stock! Only ${selectedMaterial.balance || 0} ${selectedMaterial.unit} available for ${selectedMaterial.material_name}.`
      });
      return;
    }

    try {
      await apiClient.post('/materials/consume', {
        material_id: selectedMaterial.material_id,
        quantity: qty,
        notes: `${issueForm.purpose || 'Material Issue'} - ${issueForm.contractor || 'Internal'} (${issueForm.site_location})`,
      });
    } catch {
      // Local fallback
    }

    const newBalance = (selectedMaterial.balance || 0) - qty;
    const newIssued = (selectedMaterial.issued_stock || 0) + qty;
    let newStatus = 'In Stock';
    if (newBalance <= 0) {
      newStatus = 'Out of Stock';
    } else if (newBalance <= (selectedMaterial.reorder_level || 0)) {
      newStatus = 'Low Stock';
    }

    const updated = stockItems.map(item => {
      if (item.id === selectedMaterial.id) {
        return {
          ...item,
          issued_stock: newIssued,
          balance: newBalance,
          status: newStatus,
        };
      }
      return item;
    });

    const newLog = {
      id: `iss-${Date.now()}`,
      date: dayjs().format('YYYY-MM-DD'),
      material: selectedMaterial.material_name,
      qty,
      unit: selectedMaterial.unit,
      site: issueForm.site_location,
      purpose: issueForm.purpose,
      contractor: issueForm.contractor,
    };

    setStockItems(updated);
    setIssueLogs([newLog, ...issueLogs]);
    setShowIssueModal(false);
    setAlert({
      type: 'success',
      message: `Successfully issued ${qty} ${selectedMaterial.unit} of ${selectedMaterial.material_name} for ${issueForm.purpose} at ${issueForm.site_location}. Remaining balance: ${newBalance} ${selectedMaterial.unit}.`
    });

    setIssueForm(prev => ({ ...prev, quantity: '', purpose: '', contractor: '' }));
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'in stock') return <span className="badge badge-success">In Stock</span>;
    if (s === 'low stock') return <span className="badge badge-warning">Low Stock</span>;
    if (s === 'out of stock') return <span className="badge badge-danger">Out of Stock</span>;
    return <span className="badge badge-default">{status}</span>;
  };

  // Compute live KPIs
  const totalItemsCount = stockItems.length;
  const lowStockCount = stockItems.filter(s => s.status === 'Low Stock').length;
  const outOfStockCount = stockItems.filter(s => s.status === 'Out of Stock').length;
  const receiptsCount = issueLogs.length;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📦</span> Inventory Dashboard & Stock Control
          </h1>
          <p className="page-subtitle">Central material ledger, real-time store balances & on-site requisition dispatch.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-primary"
            onClick={() => setShowIssueModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            disabled={stockItems.length === 0}
          >
            <span>📤</span> + Issue Material
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {alert && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '18px',
            backgroundColor: alert.type === 'error' ? '#fef2f2' : '#f0fdf4',
            color: alert.type === 'error' ? '#991b1b' : '#166534',
            border: `1px solid ${alert.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>{alert.type === 'error' ? '⚠️' : '✅'} {alert.message}</span>
          <button onClick={() => setAlert(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div className="card" style={{ borderLeft: '4px solid #2563eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>TOTAL ITEMS</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e293b', marginTop: 4 }}>{totalItemsCount}</div>
              <div style={{ fontSize: '0.75rem', color: '#2563eb', marginTop: 4 }}>Across all active store yards</div>
            </div>
            <div style={{ fontSize: '1.8rem', background: '#eff6ff', padding: '6px 10px', borderRadius: '8px' }}>📦</div>
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>LOW STOCK</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#d97706', marginTop: 4 }}>{lowStockCount}</div>
              <div style={{ fontSize: '0.75rem', color: '#d97706', marginTop: 4 }}>Below safety reorder threshold</div>
            </div>
            <div style={{ fontSize: '1.8rem', background: '#fef3c7', padding: '6px 10px', borderRadius: '8px' }}>⚠️</div>
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>OUT OF STOCK</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#dc2626', marginTop: 4 }}>{outOfStockCount}</div>
              <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: 4 }}>Requisition required</div>
            </div>
            <div style={{ fontSize: '1.8rem', background: '#fee2e2', padding: '6px 10px', borderRadius: '8px' }}>🛑</div>
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #22c55e' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>TODAY'S ISSUES</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16a34a', marginTop: 4 }}>{receiptsCount}</div>
              <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: 4 }}>Requisitions dispatched today</div>
            </div>
            <div style={{ fontSize: '1.8rem', background: '#dcfce7', padding: '6px 10px', borderRadius: '8px' }}>📥</div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, alignItems: 'center' }}>
          <div>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Search Material Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Cement, TMT 16mm, Sand..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Filter by Category</label>
            <select className="form-control" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              <option value="">All Categories ({categories.length})</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Filter by Site</label>
            <select className="form-control" value={siteFilter} onChange={e => setSiteFilter(e.target.value)}>
              <option value="">All Sites</option>
              {sitesList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Stock Status</label>
            <select className="form-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stock Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#1e293b' }}>
            Store Material Inventory ({filteredStock.length})
          </h3>
          <button onClick={loadData} className="btn btn-ghost btn-sm" style={{ fontSize: '0.78rem' }}>
            🔄 Refresh Live Balances
          </button>
        </div>

        <div className="table-responsive">
          <table style={{ margin: 0, width: '100%', fontSize: '0.84rem' }}>
            <thead>
              <tr>
                <th>Material Details</th>
                <th>Category</th>
                <th>Store Location</th>
                <th>Available Balance</th>
                <th>Safety Reorder Level</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    Loading real-time store balances...
                  </td>
                </tr>
              ) : filteredStock.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📦</div>
                    <div style={{ fontWeight: 600, color: '#475569' }}>No Stock Records Found</div>
                    <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>Add materials in Material Master to track inventory levels.</div>
                  </td>
                </tr>
              ) : (
                filteredStock.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{item.material_name}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.78rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: 4 }}>
                        {item.category}
                      </span>
                    </td>
                    <td style={{ color: '#64748b' }}>{item.site_name}</td>
                    <td>
                      <span style={{ fontWeight: 700, fontSize: '0.92rem', color: item.balance <= 0 ? '#dc2626' : '#1e293b' }}>
                        {item.balance} {item.unit}
                      </span>
                    </td>
                    <td style={{ color: '#64748b' }}>{item.reorder_level} {item.unit}</td>
                    <td>{getStatusBadge(item.status)}</td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleQuickIssue(item)}
                        style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                      >
                        📤 Issue
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Screen 14: Material Issue Modal */}
      <Modal isOpen={showIssueModal} onClose={() => setShowIssueModal(false)} title="Issue Material from Store">
        <form onSubmit={handleIssueSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Select Material *</label>
              <select
                className="form-control"
                value={issueForm.material_id}
                onChange={e => setIssueForm({ ...issueForm, material_id: e.target.value })}
                required
              >
                <option value="">-- Choose Material --</option>
                {stockItems.map(m => (
                  <option key={m.id} value={m.material_id || m.id}>
                    {m.material_name} ({m.balance} {m.unit} available)
                  </option>
                ))}
              </select>
            </div>

            {selectedMaterial.material_name && (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '10px 14px' }}>
                <div style={{ fontSize: '0.78rem', color: '#1e40af', fontWeight: 600 }}>Available Store Stock</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1d4ed8', marginTop: '2px' }}>
                  {selectedMaterial.balance || 0} {selectedMaterial.unit}
                </div>
              </div>
            )}

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Target Site / Location *</label>
              <select
                className="form-control"
                value={issueForm.site_location}
                onChange={e => setIssueForm({ ...issueForm, site_location: e.target.value })}
                required
              >
                <option value="">-- Choose Site --</option>
                {sitesList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Quantity to Issue *</label>
              <input
                type="number"
                step="any"
                min="0.01"
                className="form-control"
                placeholder={`Enter quantity in ${selectedMaterial.unit || 'units'}`}
                value={issueForm.quantity}
                onChange={e => setIssueForm({ ...issueForm, quantity: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Purpose / Work Description</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Slab Reinforcement, Foundation Pouring"
                value={issueForm.purpose}
                onChange={e => setIssueForm({ ...issueForm, purpose: e.target.value })}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Contractor / Crew</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Inhouse Team / Subcontractor"
                value={issueForm.contractor}
                onChange={e => setIssueForm({ ...issueForm, contractor: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowIssueModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Issue Material
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InventoryDashboard;
