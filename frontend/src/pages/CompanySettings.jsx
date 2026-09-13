import React, { useState } from 'react';

const CompanySettings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [saved, setSaved] = useState(false);

  const [companyInfo, setCompanyInfo] = useState({
    company_name: 'SiteTrack Construction & Infra Tech LLC',
    trade_license: 'CN-1029384-UAE',
    gst_vat_number: '100293847500003',
    email: 'info@sitetrack.ae',
    phone: '+971 4 392 8800',
    alt_phone: '+971 50 123 4567',
    website: 'https://sitetrack.ae',
    address_line1: 'Level 18, Commercial Tower, Business Bay',
    address_line2: 'Sheikh Zayed Road, P.O. Box 48291',
    city: 'Dubai',
    state: 'Dubai',
    pincode: '00000',
    country: 'United Arab Emirates',
    financial_year_start: '01-01',
    financial_year_end: '12-31',
    currency: 'AED (د.إ)',
    timezone: 'Asia/Dubai (GMT+4:00)',
    date_format: 'DD-MMM-YYYY',
    tax_type: 'VAT',
    default_gst_rate: 5,
    bank_name: 'HDFC Bank Ltd',
    bank_branch: 'OMR Velachery Branch',
    bank_account: '50200012345678',
    ifsc_code: 'HDFC0001234',
    swift_code: 'HDFCINBB',
    upi_id: 'sitetrack@hdfcbank'
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Company Settings</h1>
          <p className="page-subtitle">Configure enterprise organization profile, tax registrations, and operational defaults</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave}>
          💾 Save Changes
        </button>
      </div>

      {saved && (
        <div className="alert alert-success" style={{ marginBottom: '16px' }}>
          ✓ Company settings and enterprise profile updated successfully!
        </div>
      )}

      {/* Tabs */}
      <div className="tab-bar">
        <button
          className={`tab-item ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          🏢 Organization Profile
        </button>
        <button
          className={`tab-item ${activeTab === 'tax' ? 'active' : ''}`}
          onClick={() => setActiveTab('tax')}
        >
          📄 Tax & Statutory
        </button>
        <button
          className={`tab-item ${activeTab === 'banking' ? 'active' : ''}`}
          onClick={() => setActiveTab('banking')}
        >
          🏦 Banking & Invoicing
        </button>
        <button
          className={`tab-item ${activeTab === 'system' ? 'active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          ⚙️ Regional & System Defaults
        </button>
      </div>

      <form onSubmit={handleSave}>
        {/* Organization Profile */}
        {activeTab === 'general' && (
          <div className="card" style={{ maxWidth: '900px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--navy)', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
              Primary Corporate Identity
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group">
                <label className="form-label">Registered Legal Name *</label>
                <input
                  type="text"
                  required
                  value={companyInfo.company_name}
                  onChange={e => setCompanyInfo({ ...companyInfo, company_name: e.target.value })}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Trade / Brand Name</label>
                <input
                  type="text"
                  value={companyInfo.trade_name}
                  onChange={e => setCompanyInfo({ ...companyInfo, trade_name: e.target.value })}
                  className="form-control"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group">
                <label className="form-label">Official Work Email *</label>
                <input
                  type="email"
                  required
                  value={companyInfo.email}
                  onChange={e => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Primary Telephone *</label>
                <input
                  type="text"
                  required
                  value={companyInfo.phone}
                  onChange={e => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Company Website</label>
                <input
                  type="url"
                  value={companyInfo.website}
                  onChange={e => setCompanyInfo({ ...companyInfo, website: e.target.value })}
                  className="form-control"
                />
              </div>
            </div>

            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--navy)', marginTop: '24px', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
              Registered Head Office Address
            </h3>

            <div className="form-group">
              <label className="form-label">Address Line 1</label>
              <input
                type="text"
                value={companyInfo.address_line1}
                onChange={e => setCompanyInfo({ ...companyInfo, address_line1: e.target.value })}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Address Line 2</label>
              <input
                type="text"
                value={companyInfo.address_line2}
                onChange={e => setCompanyInfo({ ...companyInfo, address_line2: e.target.value })}
                className="form-control"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  type="text"
                  value={companyInfo.city}
                  onChange={e => setCompanyInfo({ ...companyInfo, city: e.target.value })}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label className="form-label">State / Province</label>
                <input
                  type="text"
                  value={companyInfo.state}
                  onChange={e => setCompanyInfo({ ...companyInfo, state: e.target.value })}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label className="form-label">PIN / Postal Code</label>
                <input
                  type="text"
                  value={companyInfo.pincode}
                  onChange={e => setCompanyInfo({ ...companyInfo, pincode: e.target.value })}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Country</label>
                <input
                  type="text"
                  value={companyInfo.country}
                  onChange={e => setCompanyInfo({ ...companyInfo, country: e.target.value })}
                  className="form-control"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tax & Statutory */}
        {activeTab === 'tax' && (
          <div className="card" style={{ maxWidth: '900px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--navy)', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
              Statutory Tax Identifiers
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group">
                <label className="form-label">GSTIN (Goods & Services Tax ID) *</label>
                <input
                  type="text"
                  required
                  value={companyInfo.gstin}
                  onChange={e => setCompanyInfo({ ...companyInfo, gstin: e.target.value.toUpperCase() })}
                  className="form-control"
                  style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: '600' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Permanent Account Number (PAN) *</label>
                <input
                  type="text"
                  required
                  value={companyInfo.pan}
                  onChange={e => setCompanyInfo({ ...companyInfo, pan: e.target.value.toUpperCase() })}
                  className="form-control"
                  style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: '600' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Corporate Identification Number (CIN)</label>
                <input
                  type="text"
                  value={companyInfo.cin_number}
                  onChange={e => setCompanyInfo({ ...companyInfo, cin_number: e.target.value.toUpperCase() })}
                  className="form-control"
                  style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Default GST Rate on Procurement (%)</label>
                <select
                  value={companyInfo.default_gst_rate}
                  onChange={e => setCompanyInfo({ ...companyInfo, default_gst_rate: Number(e.target.value) })}
                  className="form-control"
                >
                  {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Banking */}
        {activeTab === 'banking' && (
          <div className="card" style={{ maxWidth: '900px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--navy)', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
              Primary Settlement Bank Details (Printed on Invoices & POs)
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group">
                <label className="form-label">Bank Name *</label>
                <input
                  type="text"
                  required
                  value={companyInfo.bank_name}
                  onChange={e => setCompanyInfo({ ...companyInfo, bank_name: e.target.value })}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Branch Name</label>
                <input
                  type="text"
                  value={companyInfo.bank_branch}
                  onChange={e => setCompanyInfo({ ...companyInfo, bank_branch: e.target.value })}
                  className="form-control"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group">
                <label className="form-label">Account Number *</label>
                <input
                  type="text"
                  required
                  value={companyInfo.bank_account}
                  onChange={e => setCompanyInfo({ ...companyInfo, bank_account: e.target.value })}
                  className="form-control"
                  style={{ fontFamily: 'monospace' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">IFSC Code *</label>
                <input
                  type="text"
                  required
                  value={companyInfo.ifsc_code}
                  onChange={e => setCompanyInfo({ ...companyInfo, ifsc_code: e.target.value.toUpperCase() })}
                  className="form-control"
                  style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">SWIFT / BIC Code</label>
                <input
                  type="text"
                  value={companyInfo.swift_code}
                  onChange={e => setCompanyInfo({ ...companyInfo, swift_code: e.target.value.toUpperCase() })}
                  className="form-control"
                  style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">UPI VPA Handle</label>
              <input
                type="text"
                placeholder="company@bank"
                value={companyInfo.upi_id}
                onChange={e => setCompanyInfo({ ...companyInfo, upi_id: e.target.value })}
                className="form-control"
                style={{ width: '320px' }}
              />
            </div>
          </div>
        )}

        {/* Regional & System Defaults */}
        {activeTab === 'system' && (
          <div className="card" style={{ maxWidth: '900px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--navy)', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
              Regional Configuration & Business Year
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group">
                <label className="form-label">Base Currency</label>
                <select
                  value={companyInfo.currency}
                  onChange={e => setCompanyInfo({ ...companyInfo, currency: e.target.value })}
                  className="form-control"
                >
                  <option value="AED (د.إ)">UAE Dirham — AED (د.إ)</option>
                  <option value="USD ($)">US Dollar — USD ($)</option>
                  <option value="SAR (﷼)">Saudi Riyal — SAR (﷼)</option>
                  <option value="INR (₹)">Indian Rupee — INR (₹)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">System Timezone</label>
                <select
                  value={companyInfo.timezone}
                  onChange={e => setCompanyInfo({ ...companyInfo, timezone: e.target.value })}
                  className="form-control"
                >
                  <option value="Asia/Kolkata (GMT+5:30)">Asia/Kolkata (IST, GMT+5:30)</option>
                  <option value="Asia/Dubai (GMT+4:00)">Asia/Dubai (GST, GMT+4:00)</option>
                  <option value="UTC (GMT+0:00)">UTC (GMT+0:00)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Display Date Format</label>
                <select
                  value={companyInfo.date_format}
                  onChange={e => setCompanyInfo({ ...companyInfo, date_format: e.target.value })}
                  className="form-control"
                >
                  <option value="DD-MMM-YYYY">DD-MMM-YYYY (e.g. 09-Sep-2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-09-09)</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 09/09/2026)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Financial Year Cycle</label>
                <select className="form-control" disabled value="April - March">
                  <option value="April - March">April 1st – March 31st (Standard India)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: '20px' }}>
          <button type="submit" className="btn btn-primary">
            💾 Save Company Settings
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanySettings;
