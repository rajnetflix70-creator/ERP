import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';

// ── Master Sites Data for Deep Linking & Fallback ────────────────
const SITE_DATABASE = {
  'tower-a': {
    id: 'tower-a',
    code: 'S-001',
    name: 'Tower A',
    project: 'Everest Heights',
    projectCode: 'PRJ-101',
    location: 'Chennai',
    area: 'OMR Sholinganallur, Rajiv Gandhi Salai',
    manager: 'Kumar',
    managerRole: 'Senior Site Manager',
    engineer: 'Rajesh Kannan (B.E Civil)',
    startDate: '01-Jan-2025',
    expectedCompletion: '31-Dec-2026',
    duration: '24 Months (8 Months elapsed)',
    budget: '₹5.2 Cr',
    rawBudget: 52000000,
    progress: 62,
    status: 'Active',
    projectValue: '₹5.2 Cr',
    materialBudget: '₹2.1 Cr',
    materialPurchased: '₹1.4 Cr',
    materialConsumed: '₹1.1 Cr',
    floors: '2B + G + 18 Floors',
    type: 'Residential High-Rise Tower',
    address: 'Survey No. 142/3, OMR IT Expressway, Sholinganallur, Chennai - 600119',
    milestone: '5th Floor Slab Casting & 3rd Floor Solid Block Masonry',
    headcount: '86 Workers on Site Today',
  },
  'villa-project': {
    id: 'villa-project',
    code: 'S-002',
    name: 'Villa Project',
    project: 'Green Valley',
    projectCode: 'PRJ-102',
    location: 'OMR',
    area: 'Navalur Junction',
    manager: 'Raj',
    managerRole: 'Project Manager',
    engineer: 'S. Vignesh',
    startDate: '15-Aug-2024',
    expectedCompletion: '30-Nov-2025',
    duration: '15 Months',
    budget: '₹3.8 Cr',
    rawBudget: 38000000,
    progress: 75,
    status: 'Active',
    projectValue: '₹3.8 Cr',
    materialBudget: '₹1.8 Cr',
    materialPurchased: '₹1.5 Cr',
    materialConsumed: '₹1.35 Cr',
    floors: '42 Independent Luxury Villas',
    type: 'Luxury Gated Villa Community',
    address: 'Green Valley Enclave, Navalur, OMR, Chennai - 603103',
    milestone: 'Interior Plastering & Electrical First Fix',
    headcount: '64 Workers on Site Today',
  },
  'warehouse': {
    id: 'warehouse',
    code: 'S-003',
    name: 'Warehouse',
    project: 'Logistics Park',
    projectCode: 'PRJ-103',
    location: 'Tambaram',
    area: 'GST Road Corridor',
    manager: 'Arun',
    managerRole: 'Industrial Site Manager',
    engineer: 'K. Balaji',
    startDate: '01-Mar-2025',
    expectedCompletion: '31-Oct-2025',
    duration: '8 Months',
    budget: '₹2.4 Cr',
    rawBudget: 24000000,
    progress: 35,
    status: 'Hold',
    projectValue: '₹2.4 Cr',
    materialBudget: '₹1.2 Cr',
    materialPurchased: '₹0.6 Cr',
    materialConsumed: '₹0.4 Cr',
    floors: 'Clear Height 12m PEB Shed',
    type: 'PEB Industrial Logistics Hub',
    address: 'Plot 18, SIDCO Industrial Estate, Tambaram, Chennai - 600045',
    milestone: 'Structural Steel Column Erection',
    headcount: '24 Workers on Site Today',
  },
  'tower-b': {
    id: 'tower-b',
    code: 'S-004',
    name: 'Tower B',
    project: 'Everest Heights',
    projectCode: 'PRJ-101',
    location: 'Velachery',
    area: 'Inner Ring Road',
    manager: 'Prakash',
    managerRole: 'Site Manager',
    engineer: 'M. Senthil',
    startDate: '01-Nov-2024',
    expectedCompletion: '30-Jun-2026',
    duration: '20 Months',
    budget: '₹4.9 Cr',
    rawBudget: 49000000,
    progress: 48,
    status: 'Active',
    projectValue: '₹4.9 Cr',
    materialBudget: '₹2.0 Cr',
    materialPurchased: '₹1.1 Cr',
    materialConsumed: '₹0.95 Cr',
    floors: '2B + G + 16 Floors',
    type: 'Residential High-Rise',
    address: 'Bypass Road, Velachery, Chennai - 600042',
    milestone: '3rd Floor Slab Casting',
    headcount: '72 Workers on Site Today',
  },
  'commercial': {
    id: 'commercial',
    code: 'S-005',
    name: 'Commercial',
    project: 'City Center',
    projectCode: 'PRJ-104',
    location: 'Coimbatore',
    area: 'Avinashi Road',
    manager: 'Suresh',
    managerRole: 'Senior Commercial Lead',
    engineer: 'R. Karthikeyan',
    startDate: '01-Feb-2024',
    expectedCompletion: '30-Apr-2025',
    duration: '15 Months',
    budget: '₹6.5 Cr',
    rawBudget: 65000000,
    progress: 90,
    status: 'Completed',
    projectValue: '₹6.5 Cr',
    materialBudget: '₹2.8 Cr',
    materialPurchased: '₹2.75 Cr',
    materialConsumed: '₹2.7 Cr',
    floors: '3B + G + 8 Floors',
    type: 'Commercial Retail & Office Plaza',
    address: 'Avinashi Road, Peelamedu, Coimbatore - 641004',
    milestone: 'Façade Glazing & Final Testing Commissioning',
    headcount: '35 Workers on Site Today',
  },
};

// ── Realistic BOQ Sample Data ────────────────────────────────────
const BOQ_ITEMS = [
  {
    code: 'BOQ-001',
    description: 'Earthwork excavation in all kinds of soil & soft rock for foundation raft & footings',
    section: 'Civil & Foundation',
    estimatedQty: 4200,
    unit: 'Cu.m',
    rate: 320,
    totalAmount: 1344000,
    actualConsumed: 4150,
    variance: -1.2,
    status: 'Under Budget',
  },
  {
    code: 'BOQ-002',
    description: 'Providing and laying RCC M25 grade design mix concrete for foundation raft & column footings',
    section: 'Civil & Foundation',
    estimatedQty: 850,
    unit: 'Cu.m',
    rate: 6800,
    totalAmount: 5780000,
    actualConsumed: 840,
    variance: -1.1,
    status: 'Under Budget',
  },
  {
    code: 'BOQ-003',
    description: 'High yield strength deformed TMT Fe 550D reinforcement steel bars cutting, bending & binding',
    section: 'Structural Steel',
    estimatedQty: 180,
    unit: 'MT',
    rate: 68500,
    totalAmount: 12330000,
    actualConsumed: 115,
    variance: 1.8,
    status: 'On Track',
  },
  {
    code: 'BOQ-004',
    description: 'RCC M30 grade concrete for columns, shear walls, beams and suspended floor slabs',
    section: 'Structural Concrete',
    estimatedQty: 620,
    unit: 'Cu.m',
    rate: 7400,
    totalAmount: 4588000,
    actualConsumed: 410,
    variance: 0.5,
    status: 'On Track',
  },
  {
    code: 'BOQ-005',
    description: '200mm thick solid concrete block masonry in cement mortar 1:6 for external and partition walls',
    section: 'Masonry & Plastering',
    estimatedQty: 1450,
    unit: 'Sq.m',
    rate: 920,
    totalAmount: 1334000,
    actualConsumed: 850,
    variance: -2.5,
    status: 'Under Budget',
  },
  {
    code: 'BOQ-006',
    description: '12mm thick cement plaster 1:4 with Neeru smooth finish on internal walls and ceilings',
    section: 'Masonry & Plastering',
    estimatedQty: 6800,
    unit: 'Sq.m',
    rate: 240,
    totalAmount: 1632000,
    actualConsumed: 3900,
    variance: -0.8,
    status: 'Under Budget',
  },
  {
    code: 'BOQ-007',
    description: '600x600mm double charged vitrified floor tiles laid over cement mortar bed with epoxy grout',
    section: 'Flooring & Finishes',
    estimatedQty: 3200,
    unit: 'Sq.m',
    rate: 1150,
    totalAmount: 3680000,
    actualConsumed: 1200,
    variance: 3.4,
    status: 'On Track',
  },
  {
    code: 'BOQ-008',
    description: 'External weatherproof acrylic emulsion painting (2 coats) over exterior primer and surface putty',
    section: 'Painting & Finishing',
    estimatedQty: 5400,
    unit: 'Sq.m',
    rate: 180,
    totalAmount: 972000,
    actualConsumed: 1100,
    variance: 0.0,
    status: 'On Track',
  },
  {
    code: 'BOQ-009',
    description: 'Internal CPVC water supply distribution lines, drainage stacks & chrome-plated brass fittings',
    section: 'MEP & Plumbing',
    estimatedQty: 1,
    unit: 'Lot',
    rate: 2850000,
    totalAmount: 2850000,
    actualConsumed: 0.65,
    variance: -4.0,
    status: 'Under Budget',
  },
  {
    code: 'BOQ-010',
    description: 'Electrical heavy conduits wiring, distribution boards, MCBs & modular switches first fix',
    section: 'Electrical & MEP',
    estimatedQty: 1,
    unit: 'Lot',
    rate: 4040000,
    totalAmount: 4040000,
    actualConsumed: 0.58,
    variance: -1.5,
    status: 'Under Budget',
  },
];

// ── Realistic Stock Sample Data ──────────────────────────────────
const STOCK_ITEMS = [
  {
    id: 1,
    material: 'TMT Steel Fe 550D 16mm (Tata Tiscon)',
    category: 'Steel',
    opening: '8 MT',
    received: '25 MT',
    issued: '21 MT',
    balance: '12 MT',
    balanceQty: 12,
    reorderLevel: '5 MT',
    status: 'Healthy',
  },
  {
    id: 2,
    material: 'UltraTech Cement OPC 53 Grade',
    category: 'Cement',
    opening: '120 Bags',
    received: '600 Bags',
    issued: '580 Bags',
    balance: '140 Bags',
    balanceQty: 140,
    reorderLevel: '150 Bags',
    status: 'Low Stock',
  },
  {
    id: 3,
    material: 'M-Sand (Manufactured Fine Aggregate)',
    category: 'Sand & Aggregate',
    opening: '15 Tonnes',
    received: '60 Tonnes',
    issued: '55 Tonnes',
    balance: '20 Tonnes',
    balanceQty: 20,
    reorderLevel: '10 Tonnes',
    status: 'Healthy',
  },
  {
    id: 4,
    material: '20mm Blue Metal Coarse Aggregate',
    category: 'Sand & Aggregate',
    opening: '10 Tonnes',
    received: '50 Tonnes',
    issued: '42 Tonnes',
    balance: '18 Tonnes',
    balanceQty: 18,
    reorderLevel: '8 Tonnes',
    status: 'Healthy',
  },
  {
    id: 5,
    material: '200mm Solid Concrete Blocks',
    category: 'Masonry',
    opening: '400 Nos',
    received: '4,000 Nos',
    issued: '3,900 Nos',
    balance: '500 Nos',
    balanceQty: 500,
    reorderLevel: '600 Nos',
    status: 'Low Stock',
  },
  {
    id: 6,
    material: 'Heavy Duty UPVC Electrical Conduit 25mm',
    category: 'Electrical',
    opening: '80 Rmt',
    received: '500 Rmt',
    issued: '460 Rmt',
    balance: '120 Rmt',
    balanceQty: 120,
    reorderLevel: '50 Rmt',
    status: 'Healthy',
  },
  {
    id: 7,
    material: 'Birla White Wall Care Putty',
    category: 'Finishes',
    opening: '30 Bags',
    received: '150 Bags',
    issued: '110 Bags',
    balance: '70 Bags',
    balanceQty: 70,
    reorderLevel: '30 Bags',
    status: 'Healthy',
  },
  {
    id: 8,
    material: 'Asian Paints Apex Weatherproof Emulsion',
    category: 'Paint',
    opening: '5 Buckets',
    received: '30 Buckets',
    issued: '28 Buckets',
    balance: '7 Buckets',
    balanceQty: 7,
    reorderLevel: '10 Buckets',
    status: 'Critical',
  },
];

// ── Realistic Recent Material Requests ───────────────────────────
const RECENT_REQUESTS = [
  {
    id: 'MR-2025-089',
    material: 'TMT Steel Fe 550D 16mm',
    quantity: '15 MT',
    requestedBy: 'Rajesh Kannan',
    date: '08-Sep-2025',
    status: 'Approved',
    priority: 'High',
  },
  {
    id: 'MR-2025-088',
    material: 'UltraTech Cement OPC 53',
    quantity: '500 Bags',
    requestedBy: 'Rajesh Kannan',
    date: '06-Sep-2025',
    status: 'In Transit',
    priority: 'Normal',
  },
  {
    id: 'MR-2025-087',
    material: 'M-Sand (River Sand Substitute)',
    quantity: '40 Tonnes',
    requestedBy: 'M. Senthil',
    date: '04-Sep-2025',
    status: 'Approved',
    priority: 'Normal',
  },
  {
    id: 'MR-2025-086',
    material: 'Solid Concrete Blocks 200mm',
    quantity: '3,000 Nos',
    requestedBy: 'Kumar',
    date: '02-Sep-2025',
    status: 'Approved',
    priority: 'Normal',
  },
  {
    id: 'MR-2025-085',
    material: '25mm Heavy Duty PVC Conduit',
    quantity: '450 Rmt',
    requestedBy: 'S. Murugan',
    date: '30-Aug-2025',
    status: 'Delivered',
    priority: 'Low',
  },
];

// ── Realistic Recent Deliveries (GRN) ────────────────────────────
const RECENT_DELIVERIES = [
  {
    grnNo: 'GRN-0412',
    supplier: 'Tata Steel BSL Ltd',
    material: 'TMT Steel 16mm',
    qtyReceived: '15 MT',
    date: '07-Sep-2025',
    challan: 'CH-88910',
    verifiedBy: 'Storekeeper Murugan',
    inspection: 'Passed',
  },
  {
    grnNo: 'GRN-0411',
    supplier: 'UltraTech Cement Ltd',
    material: 'OPC 53 Grade',
    qtyReceived: '400 Bags',
    date: '05-Sep-2025',
    challan: 'CH-88742',
    verifiedBy: 'Storekeeper Murugan',
    inspection: 'Passed',
  },
  {
    grnNo: 'GRN-0410',
    supplier: 'Southern Aggregates Corp',
    material: '20mm Blue Metal',
    qtyReceived: '32 Tonnes',
    date: '03-Sep-2025',
    challan: 'DC-11029',
    verifiedBy: 'Storekeeper Murugan',
    inspection: 'Passed',
  },
  {
    grnNo: 'GRN-0409',
    supplier: 'Asian Paints Depot',
    material: 'Apex Weatherproof Emulsion',
    qtyReceived: '25 Buckets',
    date: '30-Aug-2025',
    challan: 'INV-4491',
    verifiedBy: 'Storekeeper Murugan',
    inspection: 'Passed',
  },
  {
    grnNo: 'GRN-0408',
    supplier: 'Supreme Industries',
    material: '110mm SWR Pipes',
    qtyReceived: '120 Nos',
    date: '28-Aug-2025',
    challan: 'INV-2230',
    verifiedBy: 'Storekeeper Murugan',
    inspection: 'Passed',
  },
];

// ── Other Tabs Sample Data ───────────────────────────────────────
const PURCHASE_ORDERS = [
  {
    poNo: 'PO-2025-104',
    date: '05-Sep-2025',
    vendor: 'Tata Steel BSL Ltd',
    items: 'TMT Steel Fe 550D 16mm & 20mm (30 MT)',
    amount: '₹20,55,000',
    status: 'Issued',
    expectedDate: '12-Sep-2025',
  },
  {
    poNo: 'PO-2025-098',
    date: '28-Aug-2025',
    vendor: 'UltraTech Cement Ltd',
    items: 'OPC 53 Grade Cement (800 Bags)',
    amount: '₹3,40,000',
    status: 'Partially Delivered',
    expectedDate: '07-Sep-2025',
  },
  {
    poNo: 'PO-2025-092',
    date: '18-Aug-2025',
    vendor: 'Southern Aggregates Corp',
    items: 'M-Sand 100 Tonnes & 20mm Aggregates 80 Tonnes',
    amount: '₹2,16,000',
    status: 'Delivered',
    expectedDate: '24-Aug-2025',
  },
  {
    poNo: 'PO-2025-081',
    date: '02-Aug-2025',
    vendor: 'Supreme Industries Ltd',
    items: 'CPVC & SWR Drainage Pipes with fittings',
    amount: '₹4,85,000',
    status: 'Delivered',
    expectedDate: '10-Aug-2025',
  },
];

const SITE_DOCUMENTS = [
  {
    id: 'DOC-01',
    title: 'Architectural Working Drawings (Rev 4)',
    category: 'Architectural',
    date: '15-Jan-2025',
    size: '18.4 MB',
    format: 'PDF',
    status: 'Approved',
  },
  {
    id: 'DOC-02',
    title: 'Structural Column & Shear Wall Reinforcement Details',
    category: 'Structural',
    date: '28-Jan-2025',
    size: '24.1 MB',
    format: 'PDF',
    status: 'Approved',
  },
  {
    id: 'DOC-03',
    title: 'Geotechnical Soil Investigation & Safe Bearing Capacity Report',
    category: 'Soil & Foundation',
    date: '10-Dec-2024',
    size: '6.8 MB',
    format: 'PDF',
    status: 'Approved',
  },
  {
    id: 'DOC-04',
    title: 'CMDA Building Sanction Permit & NOC',
    category: 'Statutory Approval',
    date: '05-Jan-2025',
    size: '4.2 MB',
    format: 'PDF',
    status: 'Approved',
  },
  {
    id: 'DOC-05',
    title: 'Fire & Rescue Services Provisional NOC',
    category: 'Safety & Compliance',
    date: '18-Jan-2025',
    size: '3.1 MB',
    format: 'PDF',
    status: 'Approved',
  },
];

const SITE_PHOTOS = [
  {
    title: 'Foundation Raft Concrete Pouring',
    date: '14-Feb-2025',
    stage: 'Sub-structure',
    author: 'Kumar (Site Manager)',
    color: '#3b82f6',
    icon: '🏗️',
  },
  {
    title: 'Basement 1 Retaining Wall Shuttering',
    date: '28-Mar-2025',
    stage: 'Basement 1',
    author: 'Rajesh Kannan',
    color: '#0f766e',
    icon: '🏢',
  },
  {
    title: 'Podium Level Slab Reinforcement Inspection',
    date: '18-May-2025',
    stage: 'Podium',
    author: 'Structural Consultant',
    color: '#8b5cf6',
    icon: '📐',
  },
  {
    title: 'Tower 3rd Floor Solid Block Masonry Work',
    date: '22-Jul-2025',
    stage: 'Super-structure',
    author: 'Rajesh Kannan',
    color: '#ea580c',
    icon: '🧱',
  },
  {
    title: '5th Floor Column Rebar Cage Fabrication',
    date: '02-Sep-2025',
    stage: 'Super-structure',
    author: 'M. Senthil',
    color: '#16a34a',
    icon: '⚙️',
  },
  {
    title: 'Batching Plant Slump Test & Cube Casting',
    date: '07-Sep-2025',
    stage: 'Quality Control',
    author: 'QC Lab Engineer',
    color: '#2563eb',
    icon: '🧪',
  },
];

export default function SiteDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Find site by id (e.g. 'tower-a') or default to Tower A
  const initialSite = SITE_DATABASE[id] || SITE_DATABASE['tower-a'];
  const [site, setSite] = useState(initialSite);

  // Tabs: [Overview], [BOQ], [Material Requirements], [Requests], [PO], [GRN], [Stock], [Reports], [Documents], [Photos]
  const [activeTab, setActiveTab] = useState('Overview');

  // Edit Site Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: site.name,
    project: site.project,
    location: site.location,
    manager: site.manager,
    engineer: site.engineer,
    startDate: site.startDate,
    expectedCompletion: site.expectedCompletion,
    budget: site.budget,
    progress: site.progress,
    status: site.status,
  });

  // BOQ Filter & Search State
  const [boqSearch, setBoqSearch] = useState('');
  const [boqSection, setBoqSection] = useState('All');

  // Stock Filter & Search State
  const [stockSearch, setStockSearch] = useState('');

  // Toast Notification
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setSite(prev => ({
      ...prev,
      ...editForm,
      progress: Number(editForm.progress) || 0,
    }));
    setEditModalOpen(false);
    showToast(`Site "${editForm.name}" updated successfully.`);
  };

  // Filtered BOQ items
  const filteredBoq = useMemo(() => {
    return BOQ_ITEMS.filter(item => {
      const matchSearch =
        !boqSearch ||
        item.description.toLowerCase().includes(boqSearch.toLowerCase()) ||
        item.code.toLowerCase().includes(boqSearch.toLowerCase());
      const matchSection = boqSection === 'All' || item.section === boqSection;
      return matchSearch && matchSection;
    });
  }, [boqSearch, boqSection]);

  // Filtered Stock items
  const filteredStock = useMemo(() => {
    return STOCK_ITEMS.filter(item => {
      return (
        !stockSearch ||
        item.material.toLowerCase().includes(stockSearch.toLowerCase()) ||
        item.category.toLowerCase().includes(stockSearch.toLowerCase())
      );
    });
  }, [stockSearch]);

  const allTabs = [
    { key: 'Overview', label: 'Overview', icon: '📊' },
    { key: 'BOQ', label: 'BOQ', icon: '📋', count: 10 },
    { key: 'Material Requirements', label: 'Material Requirements', icon: '🧱', count: 8 },
    { key: 'Requests', label: 'Requests', icon: '📤', count: 5 },
    { key: 'PO', label: 'PO', icon: '🛒', count: 4 },
    { key: 'GRN', label: 'GRN', icon: '📥', count: 5 },
    { key: 'Stock', label: 'Stock', icon: '📦', count: 8 },
    { key: 'Reports', label: 'Reports', icon: '📈', count: 6 },
    { key: 'Documents', label: 'Documents', icon: '📁', count: 5 },
    { key: 'Photos', label: 'Photos', icon: '📷', count: 6 },
  ];

  return (
    <div className="page-container" style={{ paddingBottom: '40px' }}>
      {/* Toast alert */}
      {toast && (
        <div
          className="alert alert-success"
          style={{
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{toast}</span>
          <button
            onClick={() => setToast(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Breadcrumb ──────────────────────────────────────────── */}
      <div className="breadcrumb" style={{ marginBottom: '14px', fontSize: '0.82rem' }}>
        <Link to="/sites" style={{ textDecoration: 'none', color: '#2563eb' }}>
          Projects & Sites
        </Link>
        <span className="breadcrumb-sep">/</span>
        <Link to="/sites" style={{ textDecoration: 'none', color: '#2563eb' }}>
          Sites
        </Link>
        <span className="breadcrumb-sep">/</span>
        <span style={{ color: '#1e293b', fontWeight: 600 }}>{site.name}</span>
      </div>

      {/* ── Screen 3 Header ─────────────────────────────────────── */}
      <div
        className="card"
        style={{
          marginBottom: '20px',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          background: '#fff',
          border: '1px solid #e2e8f0',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
              {site.name} - Site Details
            </h1>
            <span
              className={`badge ${
                site.status === 'Active'
                  ? 'badge-success'
                  : site.status === 'Hold'
                  ? 'badge-warning'
                  : 'badge-info'
              } badge-dot`}
              style={{ fontSize: '0.75rem', padding: '3px 10px' }}
            >
              {site.status}
            </span>
            <span
              style={{
                fontSize: '0.78rem',
                fontFamily: 'monospace',
                fontWeight: 700,
                color: '#2563eb',
                background: '#eff6ff',
                padding: '2px 8px',
                borderRadius: '4px',
              }}
            >
              {site.code}
            </span>
          </div>

          <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '6px', margin: '6px 0 0 0' }}>
            Project: <strong style={{ color: '#1e293b' }}>{site.project}</strong> | Location:{' '}
            <strong style={{ color: '#1e293b' }}>{site.location}</strong> |{' '}
            <strong style={{ color: '#2563eb' }}>{site.progress}% Completed</strong>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setEditForm({
                name: site.name,
                project: site.project,
                location: site.location,
                manager: site.manager,
                engineer: site.engineer,
                startDate: site.startDate,
                expectedCompletion: site.expectedCompletion,
                budget: site.budget,
                progress: site.progress,
                status: site.status,
              });
              setEditModalOpen(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontWeight: 600 }}
          >
            <span>✏️</span> Edit Site
          </button>

          <button
            className="btn btn-primary"
            onClick={() => {
              setActiveTab('Requests');
              showToast('Navigated to Material Requests for ' + site.name);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontWeight: 600 }}
          >
            <span>➕</span> + New Request
          </button>
        </div>
      </div>

      {/* ── Tabs Bar: 10 Tabs matching Screen 3 ──────────────────── */}
      <div
        className="tab-bar"
        style={{
          marginBottom: '20px',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          paddingBottom: '2px',
        }}
      >
        {allTabs.map(t => (
          <button
            key={t.key}
            className={`tab-item ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              fontSize: '0.84rem',
            }}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
            {t.count && (
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: activeTab === t.key ? '#dbeafe' : '#f1f5f9',
                  color: activeTab === t.key ? '#1d4ed8' : '#64748b',
                  fontWeight: 700,
                  marginLeft: '2px',
                }}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TAB 1: OVERVIEW
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'Overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Key Figures 4 Cards */}
          <div className="grid-4">
            <div className="stat-card" style={{ borderLeft: '4px solid #2563eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="stat-label">Project Value</span>
                <span style={{ fontSize: '1.2rem' }}>💰</span>
              </div>
              <div className="stat-number" style={{ marginTop: '8px', color: '#1e293b' }}>
                {site.projectValue || '₹5.2 Cr'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                Total site milestone contract
              </div>
            </div>

            <div className="stat-card" style={{ borderLeft: '4px solid #0f766e' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="stat-label">Material Budget</span>
                <span style={{ fontSize: '1.2rem' }}>📦</span>
              </div>
              <div className="stat-number" style={{ marginTop: '8px', color: '#0f766e' }}>
                {site.materialBudget || '₹2.1 Cr'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                Raw materials & MEP budget
              </div>
            </div>

            <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="stat-label">Material Purchased</span>
                <span style={{ fontSize: '1.2rem' }}>🛒</span>
              </div>
              <div className="stat-number" style={{ marginTop: '8px', color: '#b45309' }}>
                {site.materialPurchased || '₹1.4 Cr'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '4px' }}>
                66.7% of budget utilized
              </div>
            </div>

            <div className="stat-card" style={{ borderLeft: '4px solid #22c55e' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="stat-label">Material Consumed</span>
                <span style={{ fontSize: '1.2rem' }}>🏗️</span>
              </div>
              <div className="stat-number" style={{ marginTop: '8px', color: '#15803d' }}>
                {site.materialConsumed || '₹1.1 Cr'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '4px' }}>
                78.5% of purchased consumed
              </div>
            </div>
          </div>

          {/* Main 2-Column Overview Section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {/* Left Side: Site Summary Card */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="card-header" style={{ marginBottom: '8px', paddingBottom: '8px' }}>
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🏗️</span> Site Summary & Field Status
                </h3>
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    fontWeight: 600,
                  }}
                >
                  {site.code}
                </span>
              </div>

              {/* Blueprint / Visual Placeholder */}
              <div
                style={{
                  height: '140px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                  color: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '16px',
                  boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    right: '-10px',
                    bottom: '-10px',
                    fontSize: '5rem',
                    opacity: 0.15,
                    pointerEvents: 'none',
                  }}
                >
                  🏢
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      backdropFilter: 'blur(4px)',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                    }}
                  >
                    {site.type || 'Residential High-Rise'}
                  </span>
                  <span
                    style={{
                      background: '#22c55e',
                      color: '#fff',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '12px',
                    }}
                  >
                    ● On Schedule
                  </span>
                </div>

                <div>
                  <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>{site.name}</h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                    {site.floors || '2B + G + 18 Floors'}
                  </p>
                </div>
              </div>

              {/* Progress Bar & Metric */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>Physical Completion</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#2563eb' }}>{site.progress}%</span>
                </div>
                <div className="progress-bar" style={{ height: '8px', background: '#e2e8f0' }}>
                  <div className="progress-bar-fill" style={{ width: `${site.progress}%`, background: '#2563eb' }} />
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Milestone 4 of 6</span>
                  <span>Target: 65% by end of month</span>
                </div>
              </div>

              {/* Site Details List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.84rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Project Manager:</span>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>{site.manager}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Site Engineer:</span>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>{site.engineer}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Start Date:</span>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>{site.startDate}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Expected Completion:</span>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>{site.expectedCompletion}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Site Address:</span>
                  <span style={{ fontWeight: 500, color: '#334155', textAlign: 'right', maxWidth: '60%' }}>
                    {site.address}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Active Milestone:</span>
                  <span style={{ fontWeight: 600, color: '#2563eb', textAlign: 'right', maxWidth: '60%' }}>
                    {site.milestone}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Side: Quick Links & Summary Tables */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Quick Links */}
              <div className="card" style={{ padding: '16px' }}>
                <div className="card-header" style={{ marginBottom: '12px', paddingBottom: '8px' }}>
                  <h3 className="card-title" style={{ fontSize: '0.92rem' }}>
                    ⚡ Quick Navigation Links
                  </h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                  {[
                    { label: 'Material Requests', icon: '📤', count: '24 Req', tab: 'Requests' },
                    { label: 'Purchase Orders', icon: '🛒', count: '18 POs', tab: 'PO' },
                    { label: 'GRN / Deliveries', icon: '📥', count: '42 GRN', tab: 'GRN' },
                    { label: 'Site Inventory', icon: '📦', count: '156 Items', tab: 'Stock' },
                    { label: 'Daily Reports', icon: '📊', count: 'DPR / QC', tab: 'Reports' },
                  ].map(link => (
                    <div
                      key={link.label}
                      onClick={() => setActiveTab(link.tab)}
                      style={{
                        padding: '12px 10px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = '#eff6ff';
                        e.currentTarget.style.borderColor = '#93c5fd';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = '#f8fafc';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                      }}
                    >
                      <div style={{ fontSize: '1.25rem', marginBottom: '4px' }}>{link.icon}</div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b' }}>{link.label}</div>
                      <div style={{ fontSize: '0.72rem', color: '#2563eb', marginTop: '2px' }}>{link.count}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Material Requests Table */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', margin: 0 }}>
                    Recent Material Requests
                  </h3>
                  <button
                    onClick={() => setActiveTab('Requests')}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.78rem', color: '#2563eb' }}
                  >
                    View All →
                  </button>
                </div>
                <div className="table-responsive">
                  <table style={{ margin: 0, fontSize: '0.82rem' }}>
                    <thead>
                      <tr>
                        <th>Req ID</th>
                        <th>Material</th>
                        <th>Quantity</th>
                        <th>Requested By</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {RECENT_REQUESTS.map(req => (
                        <tr key={req.id}>
                          <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>{req.id}</td>
                          <td style={{ fontWeight: 600, color: '#1e293b' }}>{req.material}</td>
                          <td>{req.quantity}</td>
                          <td style={{ color: '#475569' }}>{req.requestedBy}</td>
                          <td style={{ color: '#64748b' }}>{req.date}</td>
                          <td>
                            <span
                              className={`badge ${
                                req.status === 'Approved'
                                  ? 'badge-success'
                                  : req.status === 'Delivered'
                                  ? 'badge-info'
                                  : 'badge-warning'
                              }`}
                            >
                              {req.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Deliveries (GRN) Table */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', margin: 0 }}>
                    Recent Deliveries (GRN)
                  </h3>
                  <button
                    onClick={() => setActiveTab('GRN')}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.78rem', color: '#2563eb' }}
                  >
                    View All →
                  </button>
                </div>
                <div className="table-responsive">
                  <table style={{ margin: 0, fontSize: '0.82rem' }}>
                    <thead>
                      <tr>
                        <th>GRN No</th>
                        <th>Supplier</th>
                        <th>Material</th>
                        <th>Qty Received</th>
                        <th>Date</th>
                        <th>Challan</th>
                        <th>Verified By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {RECENT_DELIVERIES.map(grn => (
                        <tr key={grn.grnNo}>
                          <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f766e' }}>{grn.grnNo}</td>
                          <td style={{ fontWeight: 600, color: '#1e293b' }}>{grn.supplier}</td>
                          <td>{grn.material}</td>
                          <td style={{ fontWeight: 600, color: '#15803d' }}>{grn.qtyReceived}</td>
                          <td style={{ color: '#64748b' }}>{grn.date}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{grn.challan}</td>
                          <td style={{ color: '#475569' }}>{grn.verifiedBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 2: BOQ (BILL OF QUANTITIES)
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'BOQ' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* BOQ Summary Card */}
          <div className="grid-4">
            <div className="stat-card">
              <span className="stat-label">Total BOQ Value</span>
              <div className="stat-number" style={{ color: '#1e293b' }}>
                ₹3,85,50,000
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                10 Civil & MEP packages
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-label">Actual Consumed</span>
              <div className="stat-number" style={{ color: '#2563eb' }}>
                ₹2,38,75,000
              </div>
              <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '4px' }}>
                61.9% of total BOQ scope
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-label">Remaining Balance</span>
              <div className="stat-number" style={{ color: '#0f766e' }}>
                ₹1,46,75,000
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                Allocated for finishing
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-label">Net Variance</span>
              <div className="stat-number" style={{ color: '#16a34a' }}>
                -2.8%
              </div>
              <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '4px' }}>
                Favorable under-budget variance
              </div>
            </div>
          </div>

          {/* Filter & Search for BOQ */}
          <div
            className="filter-bar"
            style={{
              padding: '12px 16px',
              background: '#fff',
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <input
              type="text"
              className="form-control"
              placeholder="🔍 Search BOQ item code or description..."
              value={boqSearch}
              onChange={e => setBoqSearch(e.target.value)}
              style={{ maxWidth: '340px' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Section:</span>
              <select
                value={boqSection}
                onChange={e => setBoqSection(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.82rem' }}
              >
                <option value="All">All Sections</option>
                <option value="Civil & Foundation">Civil & Foundation</option>
                <option value="Structural Steel">Structural Steel</option>
                <option value="Structural Concrete">Structural Concrete</option>
                <option value="Masonry & Plastering">Masonry & Plastering</option>
                <option value="Flooring & Finishes">Flooring & Finishes</option>
                <option value="MEP & Plumbing">MEP & Plumbing</option>
                <option value="Electrical & MEP">Electrical & MEP</option>
              </select>
            </div>
            {boqSearch && (
              <button
                onClick={() => setBoqSearch('')}
                className="btn btn-secondary btn-sm"
                style={{ color: '#ef4444' }}
              >
                Clear
              </button>
            )}
          </div>

          {/* BOQ Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-responsive">
              <table style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th style={{ width: '90px' }}>Item</th>
                    <th>Description</th>
                    <th style={{ width: '110px' }}>Estimated Qty</th>
                    <th style={{ width: '70px' }}>Unit</th>
                    <th style={{ width: '100px' }}>Rate (₹)</th>
                    <th style={{ width: '130px' }}>Total Amount (₹)</th>
                    <th style={{ width: '120px' }}>Actual Consumed</th>
                    <th style={{ width: '90px' }}>Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBoq.map(boq => (
                    <tr key={boq.code}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>{boq.code}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{boq.description}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                          Section: {boq.section}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{boq.estimatedQty.toLocaleString('en-IN')}</td>
                      <td style={{ color: '#475569' }}>{boq.unit}</td>
                      <td>₹{boq.rate.toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: 700, color: '#0f766e' }}>
                        ₹{boq.totalAmount.toLocaleString('en-IN')}
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{boq.actualConsumed.toLocaleString('en-IN')}</span>{' '}
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{boq.unit}</span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            boq.variance > 2 ? 'badge-warning' : boq.variance < 0 ? 'badge-success' : 'badge-default'
                          }`}
                        >
                          {boq.variance > 0 ? `+${boq.variance}%` : `${boq.variance}%`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 3: MATERIAL REQUIREMENTS
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'Material Requirements' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Material Forecast & Requirements Schedule</h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                Upcoming work package material bills for Tower A
              </p>
            </div>
            <button className="btn btn-primary btn-sm">+ Create Indent</button>
          </div>
          <div className="table-responsive">
            <table style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Material Specification</th>
                  <th>Category</th>
                  <th>Required Qty</th>
                  <th>Indented Qty</th>
                  <th>Delivered Qty</th>
                  <th>Pending Balance</th>
                  <th>Delivery Target</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Fe 550D TMT Rebar 20mm', cat: 'Steel', req: '24 MT', ind: '24 MT', del: '16 MT', pen: '8 MT', target: '15-Sep-2025', priority: 'High' },
                  { name: 'UltraTech OPC 53 Cement', cat: 'Cement', req: '800 Bags', ind: '800 Bags', del: '600 Bags', pen: '200 Bags', target: '18-Sep-2025', priority: 'High' },
                  { name: 'River M-Sand (Zone II)', cat: 'Sand', req: '90 Tonnes', ind: '90 Tonnes', del: '60 Tonnes', pen: '30 Tonnes', target: '20-Sep-2025', priority: 'Normal' },
                  { name: 'Solid Concrete Blocks 150mm', cat: 'Blocks', req: '5,000 Nos', ind: '3,000 Nos', del: '2,000 Nos', pen: '3,000 Nos', target: '25-Sep-2025', priority: 'Normal' },
                  { name: 'Double Charged Vitrified Tiles 600x600', cat: 'Tiles', req: '3,200 Sq.m', ind: '1,500 Sq.m', del: '800 Sq.m', pen: '2,400 Sq.m', target: '10-Oct-2025', priority: 'Low' },
                ].map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600, color: '#1e293b' }}>{row.name}</td>
                    <td>{row.cat}</td>
                    <td style={{ fontWeight: 600 }}>{row.req}</td>
                    <td>{row.ind}</td>
                    <td style={{ color: '#16a34a', fontWeight: 600 }}>{row.del}</td>
                    <td style={{ color: '#b45309', fontWeight: 600 }}>{row.pen}</td>
                    <td style={{ color: '#64748b' }}>{row.target}</td>
                    <td>
                      <span className={`badge ${row.priority === 'High' ? 'badge-danger' : 'badge-default'}`}>
                        {row.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 4: REQUESTS (MATERIAL REQUESTS)
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'Requests' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Site Material Requisitions</h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                All requisitions indented by site supervisors for Tower A
              </p>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => showToast('Opening New Material Request Form')}
            >
              + Raise New Request
            </button>
          </div>
          <div className="table-responsive">
            <table style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Item Description</th>
                  <th>Quantity</th>
                  <th>Raised By</th>
                  <th>Date</th>
                  <th>Urgency</th>
                  <th>Approval Status</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_REQUESTS.map(req => (
                  <tr key={req.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>{req.id}</td>
                    <td style={{ fontWeight: 600, color: '#1e293b' }}>{req.material}</td>
                    <td style={{ fontWeight: 600 }}>{req.quantity}</td>
                    <td>{req.requestedBy}</td>
                    <td style={{ color: '#64748b' }}>{req.date}</td>
                    <td>
                      <span className={`badge ${req.priority === 'High' ? 'badge-danger' : 'badge-default'}`}>
                        {req.priority}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          req.status === 'Approved'
                            ? 'badge-success'
                            : req.status === 'Delivered'
                            ? 'badge-info'
                            : 'badge-warning'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 5: PURCHASE ORDERS (PO)
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'PO' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Purchase Orders Linked to Tower A</h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                Committed vendor purchase orders and delivery tracking
              </p>
            </div>
            <button className="btn btn-primary btn-sm">+ Generate PO</button>
          </div>
          <div className="table-responsive">
            <table style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>PO Date</th>
                  <th>Supplier / Vendor</th>
                  <th>Materials Included</th>
                  <th>PO Value (₹)</th>
                  <th>Expected Delivery</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {PURCHASE_ORDERS.map(po => (
                  <tr key={po.poNo}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>{po.poNo}</td>
                    <td style={{ color: '#64748b' }}>{po.date}</td>
                    <td style={{ fontWeight: 600, color: '#1e293b' }}>{po.vendor}</td>
                    <td>{po.items}</td>
                    <td style={{ fontWeight: 700, color: '#0f766e' }}>{po.amount}</td>
                    <td style={{ color: '#475569' }}>{po.expectedDate}</td>
                    <td>
                      <span
                        className={`badge ${
                          po.status === 'Delivered'
                            ? 'badge-success'
                            : po.status === 'Issued'
                            ? 'badge-info'
                            : 'badge-warning'
                        }`}
                      >
                        {po.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 6: GRN (GOODS RECEIPT NOTES)
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'GRN' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Goods Receipt Notes (Gate Entries)</h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                Delivery challans verified by site storekeeper Murugan
              </p>
            </div>
            <button className="btn btn-primary btn-sm">+ Log Material Inward</button>
          </div>
          <div className="table-responsive">
            <table style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>GRN No</th>
                  <th>Delivery Date</th>
                  <th>Supplier</th>
                  <th>Material Received</th>
                  <th>Qty Verified</th>
                  <th>Challan / Invoice</th>
                  <th>Storekeeper</th>
                  <th>Quality Inspection</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_DELIVERIES.map(grn => (
                  <tr key={grn.grnNo}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f766e' }}>{grn.grnNo}</td>
                    <td style={{ color: '#64748b' }}>{grn.date}</td>
                    <td style={{ fontWeight: 600, color: '#1e293b' }}>{grn.supplier}</td>
                    <td>{grn.material}</td>
                    <td style={{ fontWeight: 700, color: '#15803d' }}>{grn.qtyReceived}</td>
                    <td style={{ fontFamily: 'monospace' }}>{grn.challan}</td>
                    <td>{grn.verifiedBy}</td>
                    <td>
                      <span className="badge badge-success">✓ {grn.inspection}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 7: STOCK (SITE INVENTORY)
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'Stock' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Stock KPI Cards */}
          <div className="grid-4">
            <div className="stat-card">
              <span className="stat-label">Total Material SKUs</span>
              <div className="stat-number" style={{ color: '#1e293b' }}>
                18 Items
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                Tracked in site yard
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-label">Estimated Stock Value</span>
              <div className="stat-number" style={{ color: '#0f766e' }}>
                ₹36.4 Lakhs
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                Physical stock valuation
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-label">Low Stock Alerts</span>
              <div className="stat-number" style={{ color: '#f59e0b' }}>
                3 Materials
              </div>
              <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '4px' }}>
                Below minimum threshold
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-label">Today's Consumption</span>
              <div className="stat-number" style={{ color: '#2563eb' }}>
                8 Slips
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                Issued to work packages
              </div>
            </div>
          </div>

          {/* Search bar for stock */}
          <div
            className="filter-bar"
            style={{
              padding: '12px 16px',
              background: '#fff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <input
              type="text"
              className="form-control"
              placeholder="🔍 Search site stock material or category..."
              value={stockSearch}
              onChange={e => setStockSearch(e.target.value)}
              style={{ maxWidth: '340px' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => showToast('Generating Site Stock Ledger Report')}
              >
                📊 Stock Ledger
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => showToast('Opening Material Issue Form')}
              >
                📤 Issue Material
              </button>
            </div>
          </div>

          {/* Stock Table matching specification */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-responsive">
              <table style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Material</th>
                    <th style={{ width: '130px' }}>Opening</th>
                    <th style={{ width: '130px' }}>Received</th>
                    <th style={{ width: '130px' }}>Issued</th>
                    <th style={{ width: '130px' }}>Balance</th>
                    <th style={{ width: '110px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStock.map(s => (
                    <tr key={s.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{s.material}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                          Category: {s.category} | Reorder Level: {s.reorderLevel}
                        </div>
                      </td>
                      <td style={{ color: '#64748b' }}>{s.opening}</td>
                      <td style={{ color: '#16a34a', fontWeight: 600 }}>{s.received}</td>
                      <td style={{ color: '#b45309' }}>{s.issued}</td>
                      <td>
                        <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1e293b' }}>
                          {s.balance}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            s.status === 'Healthy'
                              ? 'badge-success'
                              : s.status === 'Low Stock'
                              ? 'badge-warning'
                              : 'badge-danger'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 8: REPORTS
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'Reports' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {[
            { title: 'Daily Progress Report (DPR)', date: 'Today, 09-Sep-2025', desc: 'Concrete pour logs, workforce attendance, shuttering output, weather log', icon: '📋' },
            { title: 'Material Reconciliation Report', date: 'Monthly: Aug 2025', desc: 'Theoretical vs actual consumption of cement, rebar, sand and blocks', icon: '📊' },
            { title: 'Labor & Manpower Muster Roll', date: 'Weekly Summary', desc: '86 headcounts tracked via biometric & manual attendance', icon: '👥' },
            { title: 'Concrete Pour & Cube Test Results', date: '04-Sep-2025', desc: '7-day & 28-day compressive strength compliance test reports', icon: '🧪' },
          ].map((r, i) => (
            <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{r.icon}</div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 600, color: '#1e293b' }}>{r.title}</h4>
                <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600, marginBottom: '8px' }}>{r.date}</div>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>{r.desc}</p>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => showToast(`Previewing ${r.title}`)}
                >
                  View Preview
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => showToast(`Downloading PDF for ${r.title}`)}
                >
                  📥 Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 9: DOCUMENTS
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'Documents' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Approved Drawings & Engineering Documents</h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                Certified drawings, soil investigation reports, and municipal approvals
              </p>
            </div>
            <button className="btn btn-primary btn-sm">+ Upload Document</button>
          </div>
          <div className="table-responsive">
            <table style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Doc ID</th>
                  <th>Document Title</th>
                  <th>Category</th>
                  <th>Date Issued</th>
                  <th>File Size</th>
                  <th>Format</th>
                  <th style={{ textAlign: 'center' }}>Download</th>
                </tr>
              </thead>
              <tbody>
                {SITE_DOCUMENTS.map(doc => (
                  <tr key={doc.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>{doc.id}</td>
                    <td style={{ fontWeight: 600, color: '#1e293b' }}>{doc.title}</td>
                    <td>{doc.category}</td>
                    <td style={{ color: '#64748b' }}>{doc.date}</td>
                    <td style={{ fontSize: '0.78rem' }}>{doc.size}</td>
                    <td>
                      <span className="badge badge-info">{doc.format}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => showToast(`Downloading ${doc.title}`)}
                        style={{ padding: '3px 10px' }}
                      >
                        📥 Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 10: PHOTOS (SITE PROGRESS GALLERY)
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'Photos' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {SITE_PHOTOS.map((photo, i) => (
            <div key={i} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div
                style={{
                  height: '160px',
                  backgroundColor: photo.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '3.5rem',
                  color: '#fff',
                  position: 'relative',
                }}
              >
                {photo.icon}
                <span
                  style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    background: 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(4px)',
                    color: '#fff',
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 600,
                  }}
                >
                  {photo.stage}
                </span>
                <span
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    background: 'rgba(0,0,0,0.5)',
                    color: '#fff',
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  📅 {photo.date}
                </span>
              </div>
              <div style={{ padding: '14px' }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>
                  {photo.title}
                </h4>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Captured by: {photo.author}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Edit Site Modal ──────────────────────────────────────── */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit Details - ${site.name}`}
        subtitle="Update project assignments, engineering supervision, dates and budget"
        icon="✏️"
        size="lg"
      >
        <form onSubmit={handleEditSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Site Name *</label>
              <input
                type="text"
                className="form-control"
                required
                value={editForm.name}
                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Associated Project *</label>
              <input
                type="text"
                className="form-control"
                required
                value={editForm.project}
                onChange={e => setEditForm({ ...editForm, project: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Location / City *</label>
              <input
                type="text"
                className="form-control"
                required
                value={editForm.location}
                onChange={e => setEditForm({ ...editForm, location: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Site Manager *</label>
              <input
                type="text"
                className="form-control"
                required
                value={editForm.manager}
                onChange={e => setEditForm({ ...editForm, manager: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Site Engineer</label>
              <input
                type="text"
                className="form-control"
                value={editForm.engineer}
                onChange={e => setEditForm({ ...editForm, engineer: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="text"
                className="form-control"
                value={editForm.startDate}
                onChange={e => setEditForm({ ...editForm, startDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Expected Completion</label>
              <input
                type="text"
                className="form-control"
                value={editForm.expectedCompletion}
                onChange={e => setEditForm({ ...editForm, expectedCompletion: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Site Budget (₹)</label>
              <input
                type="text"
                className="form-control"
                value={editForm.budget}
                onChange={e => setEditForm({ ...editForm, budget: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Progress Percentage (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                className="form-control"
                value={editForm.progress}
                onChange={e => setEditForm({ ...editForm, progress: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Site Status</label>
              <select
                className="form-control"
                value={editForm.status}
                onChange={e => setEditForm({ ...editForm, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Hold">Hold</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="modal-actions" style={{ marginTop: '24px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setEditModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
