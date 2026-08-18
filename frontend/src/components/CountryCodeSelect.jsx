import React, { useState, useRef, useEffect } from 'react';

export const ALL_COUNTRY_CODES = [
  { code: '+971', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: '+91',  name: 'India', flag: '🇮🇳' },
  { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+974', name: 'Qatar', flag: '🇶🇦' },
  { code: '+968', name: 'Oman', flag: '🇴🇲' },
  { code: '+973', name: 'Bahrain', flag: '🇧🇭' },
  { code: '+965', name: 'Kuwait', flag: '🇰🇼' },
  { code: '+44',  name: 'United Kingdom', flag: '🇬🇧' },
  { code: '+1',   name: 'United States / Canada', flag: '🇺🇸' },
  { code: '+92',  name: 'Pakistan', flag: '🇵🇰' },
  { code: '+880', name: 'Bangladesh', flag: '🇧🇩' },
  { code: '+63',  name: 'Philippines', flag: '🇵🇭' },
  { code: '+20',  name: 'Egypt', flag: '🇪🇬' },
  { code: '+94',  name: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+977', name: 'Nepal', flag: '🇳🇵' },
  { code: '+60',  name: 'Malaysia', flag: '🇲🇾' },
  { code: '+62',  name: 'Indonesia', flag: '🇮🇩' },
  { code: '+962', name: 'Jordan', flag: '🇯🇴' },
  { code: '+961', name: 'Lebanon', flag: '🇱🇧' },
  { code: '+61',  name: 'Australia', flag: '🇦🇺' },
  { code: '+49',  name: 'Germany', flag: '🇩🇪' },
  { code: '+33',  name: 'France', flag: '🇫🇷' },
  { code: '+86',  name: 'China', flag: '🇨🇳' },
  { code: '+81',  name: 'Japan', flag: '🇯🇵' },
  { code: '+65',  name: 'Singapore', flag: '🇸🇬' },
  { code: '+90',  name: 'Turkey', flag: '🇹🇷' },
  { code: '+27',  name: 'South Africa', flag: '🇿🇦' },
];

const CountryCodeSelect = ({ value, onChange, style }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  const selected = ALL_COUNTRY_CODES.find(c => c.code === value) || ALL_COUNTRY_CODES[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = ALL_COUNTRY_CODES.filter(c => {
    const q = search.toLowerCase().trim();
    return c.name.toLowerCase().includes(q) || c.code.includes(q) || c.flag.includes(q);
  });

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block', ...style }}>
      {/* Trigger Button */}
      <button
        type="button"
        className="form-control"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '6px',
          fontWeight: '600',
          cursor: 'pointer',
          background: '#ffffff',
          minWidth: '135px',
          textAlign: 'left'
        }}
      >
        <span>{selected.flag} {selected.code}</span>
        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>▼</span>
      </button>

      {/* Searchable Dropdown Popover */}
      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: '4px',
          width: '260px',
          maxHeight: '280px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.08)',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Search Input Box */}
          <div style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <input
              type="text"
              className="form-control"
              placeholder="🔍 Search country or +code..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
              style={{ fontSize: '0.82rem', padding: '6px 10px' }}
            />
          </div>

          {/* Country Options List */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '12px', fontSize: '0.82rem', color: '#94a3b8', textAlign: 'center' }}>
                No country code found
              </div>
            ) : (
              filtered.map(c => {
                const isSelected = c.code === value;
                return (
                  <button
                    key={c.code + c.name}
                    type="button"
                    onClick={() => {
                      onChange(c.code);
                      setOpen(false);
                      setSearch('');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '8px 12px',
                      border: 'none',
                      background: isSelected ? '#eff6ff' : 'transparent',
                      color: isSelected ? '#1d4ed8' : '#1e293b',
                      fontSize: '0.85rem',
                      fontWeight: isSelected ? '700' : '400',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.12s ease'
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f1f5f9'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span>{c.flag} {c.name}</span>
                    <span style={{ fontWeight: '600', color: '#64748b', fontSize: '0.8rem' }}>{c.code}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountryCodeSelect;
