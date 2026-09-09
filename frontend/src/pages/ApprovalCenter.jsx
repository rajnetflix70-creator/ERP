import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import Modal from '../components/Modal';

// Initial Material Requests data matching Screen 7 specifications
const INITIAL_MATERIAL_REQUESTS = [
  {
    id: 'mr-1024',
    request_no: 'MR-1024',
    site: 'Tower A',
    site_full: 'Tower A - High Rise Towers',
    project_name: 'High Rise Luxury Towers, Sector 62',
    requested_by: 'Rajesh Kumar',
    requested_by_role: 'Site Engineer',
    amount: 248000,
    date: '09-Sep-2026',
    date_needed: '15-Sep-2026',
    priority: 'Urgent',
    status: 'Pending Approval',
    purpose: 'Slab Casting 8th Floor - Grid A to D',
    delivery_location: 'Tower A - North Gate Unloading Bay 2',
    boq_allowance: '68% consumed of 50 MT allowance (16 MT balance)',
    materials: [
      { name: 'TMT Steel Rebar 16mm (Fe550D)', qty: 20, unit: 'MT', est_rate: 58000, total: 116000, site_stock: '2 MT', wh_stock: '18 MT', boq_quota: '68% consumed (32 MT left)' },
      { name: 'OPC 53 Grade Cement (50kg Bag)', qty: 500, unit: 'Bags', est_rate: 380, total: 190000, site_stock: '120 Bags', wh_stock: '450 Bags', boq_quota: '72% consumed (480 Bags left)' },
      { name: 'Binding Wire 18 Gauge', qty: 300, unit: 'Kg', est_rate: 70, total: 21000, site_stock: '45 Kg', wh_stock: '200 Kg', boq_quota: 'Within quota' },
    ],
    timeline: [
      { step: 1, role: 'Site Engineer', name: 'Rajesh Kumar', status: 'Approved', date: '08-Sep-2026, 17:30', note: 'Indented as per bar bending schedule BBS-08' },
      { step: 2, role: 'Project Manager', name: 'Amit Desai', status: 'Pending', date: 'Action Required', note: 'Pending budget & schedule verification' },
      { step: 3, role: 'Purchase Manager', name: 'S. Raman', status: 'Upcoming', date: 'Step 3', note: 'PO generation upon PM clearance' },
      { step: 4, role: 'Management', name: 'Director / Finance', status: 'Upcoming', date: 'Step 4', note: 'Final financial release' },
    ]
  },
  {
    id: 'mr-1023',
    request_no: 'MR-1023',
    site: 'Tower B',
    site_full: 'Tower B - Luxury Towers',
    project_name: 'High Rise Luxury Towers, Sector 62',
    requested_by: 'Anil Verma',
    requested_by_role: 'Store Incharge',
    amount: 580000,
    date: '09-Sep-2026',
    date_needed: '12-Sep-2026',
    priority: 'High',
    status: 'Pending Approval',
    purpose: 'Columns & Shear Wall Concrete Pour',
    delivery_location: 'Tower B - Concrete Pump Station 1',
    boq_allowance: '60% consumed of 400 Cu.m allowance',
    materials: [
      { name: 'Ready Mix Concrete (RMC) M30', qty: 120, unit: 'Cu.m', est_rate: 4600, total: 552000, site_stock: '0 Cu.m', wh_stock: 'Transit Order', boq_quota: '60% consumed' },
      { name: 'River Sand (Coarse / Plastering)', qty: 800, unit: 'Cu.ft', est_rate: 65, total: 52000, site_stock: '250 Cu.ft', wh_stock: '1,200 Cu.ft', boq_quota: '54% consumed' },
    ],
    timeline: [
      { step: 1, role: 'Site Engineer', name: 'Anil Verma', status: 'Approved', date: '08-Sep-2026, 18:00', note: 'Pour sequence confirmed with batching plant' },
      { step: 2, role: 'Project Manager', name: 'Amit Desai', status: 'Pending', date: 'Action Required', note: 'Review pour schedule & RMC supplier' },
      { step: 3, role: 'Purchase Manager', name: 'S. Raman', status: 'Upcoming', date: 'Step 3', note: 'Transit mixer dispatch coordination' },
      { step: 4, role: 'Management', name: 'Director / Finance', status: 'Upcoming', date: 'Step 4', note: 'Commercial clearance' },
    ]
  },
  {
    id: 'mr-1022',
    request_no: 'MR-1022',
    site: 'Villa Project',
    site_full: 'Palm Grove Villas Phase 2',
    project_name: 'Palm Grove Gated Community, Sohna Road',
    requested_by: 'Vikram Singh',
    requested_by_role: 'Project Engineer',
    amount: 98000,
    date: '08-Sep-2026',
    date_needed: '18-Sep-2026',
    priority: 'Normal',
    status: 'Pending Approval',
    purpose: 'Plumbing Shaft Risers & Internal CPVC Piping',
    delivery_location: 'Villa Sector - Plot 44 Store',
    boq_allowance: 'Within allowance (38% consumed)',
    materials: [
      { name: 'CPVC Pipes 1 inch (SDR 11)', qty: 300, unit: 'Meter', est_rate: 140, total: 42000, site_stock: '45 Meter', wh_stock: '150 Meter', boq_quota: 'Within limit' },
      { name: 'Finolex FRLS Copper Wire 2.5 sq.mm', qty: 15, unit: 'Bundle', est_rate: 2450, total: 36750, site_stock: '3 Bundles', wh_stock: '20 Bundles', boq_quota: '80% consumed' },
      { name: 'CPVC Solvent Cement 500ml', qty: 12, unit: 'Tins', est_rate: 350, total: 4200, site_stock: '2 Tins', wh_stock: '18 Tins', boq_quota: 'Normal' },
      { name: 'Brass Ball Valves 1 inch', qty: 25, unit: 'Nos', est_rate: 450, total: 11250, site_stock: '5 Nos', wh_stock: '30 Nos', boq_quota: 'Normal' },
    ],
    timeline: [
      { step: 1, role: 'Site Engineer', name: 'Vikram Singh', status: 'Approved', date: '08-Sep-2026, 14:15', note: 'MEP consultant approved material brands' },
      { step: 2, role: 'Project Manager', name: 'Amit Desai', status: 'Pending', date: 'Action Required', note: 'Verify against milestone schedule' },
      { step: 3, role: 'Purchase Manager', name: 'S. Raman', status: 'Upcoming', date: 'Step 3', note: 'Local dealer rate comparison' },
      { step: 4, role: 'Management', name: 'Director / Finance', status: 'Upcoming', date: 'Step 4', note: 'Standard approval' },
    ]
  },
  {
    id: 'mr-1021',
    request_no: 'MR-1021',
    site: 'Warehouse',
    site_full: 'Central Logistics Facility',
    project_name: 'Central Warehouse & Fabrication Yard, Manesar',
    requested_by: 'Suresh Patel',
    requested_by_role: 'Store Incharge',
    amount: 175000,
    date: '08-Sep-2026',
    date_needed: '14-Sep-2026',
    priority: 'Normal',
    status: 'Pending Approval',
    purpose: 'Shuttering Stock Replacement & Safety Gear',
    delivery_location: 'Warehouse Dock 4, Manesar',
    boq_allowance: 'Quarterly warehouse replenishment allowance',
    materials: [
      { name: 'Shuttering Plywood 12mm (Marine Grade)', qty: 80, unit: 'Sheet', est_rate: 1450, total: 116000, site_stock: '12 Sheets', wh_stock: '25 Sheets', boq_quota: 'Quarterly quota' },
      { name: 'Safety Helmets & Harness Sets', qty: 45, unit: 'Sets', est_rate: 1250, total: 56250, site_stock: '8 Sets', wh_stock: '15 Sets', boq_quota: 'Safety standard' },
    ],
    timeline: [
      { step: 1, role: 'Site Engineer', name: 'Suresh Patel', status: 'Approved', date: '07-Sep-2026, 16:00', note: 'Stock count verified below minimum safety threshold' },
      { step: 2, role: 'Project Manager', name: 'Amit Desai', status: 'Pending', date: 'Action Required', note: 'Confirm inter-site movement schedule' },
      { step: 3, role: 'Purchase Manager', name: 'S. Raman', status: 'Upcoming', date: 'Step 3', note: 'Bulk plywood vendor rate' },
      { step: 4, role: 'Management', name: 'Director / Finance', status: 'Upcoming', date: 'Step 4', note: 'Signoff' },
    ]
  },
  {
    id: 'mr-1020',
    request_no: 'MR-1020',
    site: 'Tower C',
    site_full: 'Tower C - Commercial & Office',
    project_name: 'High Rise Luxury Towers, Sector 62',
    requested_by: 'Manoj Sharma',
    requested_by_role: 'Site Engineer',
    amount: 320000,
    date: '07-Sep-2026',
    date_needed: '16-Sep-2026',
    priority: 'High',
    status: 'Pending Approval',
    purpose: 'Raft Foundation Reinforcement & Beams',
    delivery_location: 'Tower C - Excavation Bay',
    boq_allowance: '71% consumed of structural steel package',
    materials: [
      { name: 'TMT Steel Rebar 12mm (Fe550D)', qty: 25, unit: 'MT', est_rate: 58500, total: 1462500, site_stock: '4 MT', wh_stock: '12 MT', boq_quota: '71% consumed' },
      { name: 'Binding Wire 18 Gauge', qty: 500, unit: 'Kg', est_rate: 70, total: 35000, site_stock: '20 Kg', wh_stock: '150 Kg', boq_quota: 'Normal' },
    ],
    timeline: [
      { step: 1, role: 'Site Engineer', name: 'Manoj Sharma', status: 'Approved', date: '06-Sep-2026, 18:30', note: 'Structural consultant GFC drawings issued' },
      { step: 2, role: 'Project Manager', name: 'Amit Desai', status: 'Pending', date: 'Action Required', note: 'Steel mill pricing check' },
      { step: 3, role: 'Purchase Manager', name: 'S. Raman', status: 'Upcoming', date: 'Step 3', note: 'Dispatch scheduling' },
      { step: 4, role: 'Management', name: 'Director / Finance', status: 'Upcoming', date: 'Step 4', note: 'Payment milestone' },
    ]
  },
  {
    id: 'mr-1019',
    request_no: 'MR-1019',
    site: 'Commercial',
    site_full: 'Commercial Complex & Retail Mall',
    project_name: 'Metro Hub Business Park, Golf Course Ext.',
    requested_by: 'Pooja Gupta',
    requested_by_role: 'Project Engineer',
    amount: 85000,
    date: '07-Sep-2026',
    date_needed: '20-Sep-2026',
    priority: 'Normal',
    status: 'Pending Approval',
    purpose: 'Exterior Facade Painting & Weatherproofing',
    delivery_location: 'Retail Wing - Gate 4',
    boq_allowance: '52% consumed of finishing contract',
    materials: [
      { name: 'Asian Paints Apex Ultima Exterior', qty: 180, unit: 'Liters', est_rate: 385, total: 69300, site_stock: '10 Liters', wh_stock: '40 Liters', boq_quota: '52% consumed' },
      { name: 'Exterior Wall Primer', qty: 100, unit: 'Liters', est_rate: 160, total: 16000, site_stock: '15 Liters', wh_stock: '30 Liters', boq_quota: 'Normal' },
    ],
    timeline: [
      { step: 1, role: 'Site Engineer', name: 'Pooja Gupta', status: 'Approved', date: '07-Sep-2026, 09:30', note: 'Architect color code approved: Apex White 001' },
      { step: 2, role: 'Project Manager', name: 'Amit Desai', status: 'Pending', date: 'Action Required', note: 'Review scaffolding readiness' },
      { step: 3, role: 'Purchase Manager', name: 'S. Raman', status: 'Upcoming', date: 'Step 3', note: 'Manufacturer direct rate' },
      { step: 4, role: 'Management', name: 'Director / Finance', status: 'Upcoming', date: 'Step 4', note: 'Signoff' },
    ]
  },
  {
    id: 'mr-1018',
    request_no: 'MR-1018',
    site: 'Tower A',
    site_full: 'Tower A - High Rise Towers',
    project_name: 'High Rise Luxury Towers, Sector 62',
    requested_by: 'Rajesh Kumar',
    requested_by_role: 'Site Engineer',
    amount: 410000,
    date: '06-Sep-2026',
    date_needed: '13-Sep-2026',
    priority: 'Urgent',
    status: 'Pending Approval',
    purpose: 'Internal AAC Block Masonry 6th to 8th Floor',
    delivery_location: 'Tower A - Hoist Material Unloading Point',
    boq_allowance: '64% consumed of masonry work package',
    materials: [
      { name: 'AAC Lightweight Blocks (600x200x150mm)', qty: 4000, unit: 'Nos', est_rate: 62, total: 248000, site_stock: '350 Nos', wh_stock: '800 Nos', boq_quota: '64% consumed' },
      { name: 'AAC Block Jointing Adhesive (40kg)', qty: 80, unit: 'Bags', est_rate: 420, total: 33600, site_stock: '10 Bags', wh_stock: '60 Bags', boq_quota: 'Within limit' },
    ],
    timeline: [
      { step: 1, role: 'Site Engineer', name: 'Rajesh Kumar', status: 'Approved', date: '06-Sep-2026, 11:30', note: 'Masonry gangs ready on floor 6 and 7' },
      { step: 2, role: 'Project Manager', name: 'Amit Desai', status: 'Pending', date: 'Action Required', note: 'Verify palletized hoist schedule' },
      { step: 3, role: 'Purchase Manager', name: 'S. Raman', status: 'Upcoming', date: 'Step 3', note: 'Direct factory truck dispatch' },
      { step: 4, role: 'Management', name: 'Director / Finance', status: 'Upcoming', date: 'Step 4', note: 'Final clearance' },
    ]
  },
];

// Purchase Orders pending approvals (Tab 2)
const INITIAL_PURCHASE_ORDERS = [
  {
    id: 'po-8821',
    request_no: 'PO-8821',
    site: 'Tower A',
    site_full: 'Tower A - High Rise Towers',
    project_name: 'High Rise Luxury Towers, Sector 62',
    vendor_name: 'UltraTech Cement Ltd',
    requested_by: 'Deepak Shah',
    requested_by_role: 'Purchase Officer',
    amount: 540000,
    date: '09-Sep-2026',
    priority: 'Urgent',
    status: 'Pending Approval',
    purpose: 'Bulk OPC 53 Cement Delivery (1400 Bags)',
    delivery_location: 'Tower A Silo & Storage Shed',
    boq_allowance: 'Cement Annual Master Contract',
    materials: [
      { name: 'OPC 53 Grade Cement (50kg Bag)', qty: 1400, unit: 'Bags', est_rate: 380, total: 532000, site_stock: '150 Bags', wh_stock: 'Central Silo' },
      { name: 'Unloading & Pallet Freight', qty: 1, unit: 'LumpSum', est_rate: 8000, total: 8000, site_stock: 'N/A', wh_stock: 'N/A' },
    ],
    timeline: [
      { step: 1, role: 'Purchase Officer', name: 'Deepak Shah', status: 'Approved', date: '08-Sep-2026, 16:45', note: 'Best rate negotiated against UltraTech rate card' },
      { step: 2, role: 'Procurement Head', name: 'S. Raman', status: 'Pending', date: 'Action Required', note: 'Verify credit terms (30 days)' },
      { step: 3, role: 'Finance Controller', name: 'Rajiv Kapoor', status: 'Upcoming', date: 'Step 3', note: 'Invoice processing clearance' },
      { step: 4, role: 'Management', name: 'Managing Director', status: 'Upcoming', date: 'Step 4', note: 'High value PO signoff' },
    ]
  },
  {
    id: 'po-8820',
    request_no: 'PO-8820',
    site: 'Commercial',
    site_full: 'Commercial Complex & Retail Mall',
    project_name: 'Metro Hub Business Park, Golf Course Ext.',
    vendor_name: 'Tata Steel Ltd (Distributor: Jindal Traders)',
    requested_by: 'Sunil Mehta',
    requested_by_role: 'Procurement Lead',
    amount: 1280000,
    date: '08-Sep-2026',
    priority: 'High',
    status: 'Pending Approval',
    purpose: 'TMT Rebar Fe550D Bundle Consignment (22 MT)',
    delivery_location: 'Commercial - North Material Yard',
    boq_allowance: 'Foundation & Core Wall Quota',
    materials: [
      { name: 'TMT Steel Rebar 25mm (Fe550D)', qty: 12, unit: 'MT', est_rate: 57800, total: 693600, site_stock: '1 MT', wh_stock: 'Yard' },
      { name: 'TMT Steel Rebar 20mm (Fe550D)', qty: 10, unit: 'MT', est_rate: 58200, total: 582000, site_stock: '2 MT', wh_stock: 'Yard' },
    ],
    timeline: [
      { step: 1, role: 'Procurement Lead', name: 'Sunil Mehta', status: 'Approved', date: '07-Sep-2026, 19:10', note: 'Mill test certificates verified for heat numbers' },
      { step: 2, role: 'Project Director', name: 'Amit Desai', status: 'Pending', date: 'Action Required', note: 'Structural package allocation review' },
      { step: 3, role: 'Finance Head', name: 'Rajiv Kapoor', status: 'Upcoming', date: 'Step 3', note: 'LC / Advance verification' },
      { step: 4, role: 'Management', name: 'Executive Committee', status: 'Upcoming', date: 'Step 4', note: 'Board signoff > ₹10L' },
    ]
  },
  {
    id: 'po-8819',
    request_no: 'PO-8819',
    site: 'Villa Project',
    site_full: 'Palm Grove Villas Phase 2',
    project_name: 'Palm Grove Gated Community, Sohna Road',
    vendor_name: 'Finolex Cables & Electricals',
    requested_by: 'Deepak Shah',
    requested_by_role: 'Purchase Officer',
    amount: 315000,
    date: '07-Sep-2026',
    priority: 'Normal',
    status: 'Pending Approval',
    purpose: 'FRLS Copper Wiring & Distribution Boards',
    delivery_location: 'Villa Central Store',
    boq_allowance: 'Electrical 1st Fix Allowance',
    materials: [
      { name: 'Finolex FRLS Copper Wire 4.0 sq.mm', qty: 30, unit: 'Bundle', est_rate: 3850, total: 115500, site_stock: '4 Bundles', wh_stock: 'Store' },
      { name: 'Finolex FRLS Copper Wire 2.5 sq.mm', qty: 50, unit: 'Bundle', est_rate: 2450, total: 122500, site_stock: '6 Bundles', wh_stock: 'Store' },
      { name: 'Modular Distribution Boards 8-Way', qty: 25, unit: 'Nos', est_rate: 3080, total: 77000, site_stock: '2 Nos', wh_stock: 'Store' },
    ],
    timeline: [
      { step: 1, role: 'Purchase Officer', name: 'Deepak Shah', status: 'Approved', date: '07-Sep-2026, 11:20', note: 'Distributor discount 28% off list price' },
      { step: 2, role: 'Project Manager', name: 'Amit Desai', status: 'Pending', date: 'Action Required', note: 'Review electrical conduit completion' },
      { step: 3, role: 'Procurement Head', name: 'S. Raman', status: 'Upcoming', date: 'Step 3', note: 'PO issuance' },
      { step: 4, role: 'Management', name: 'Management', status: 'Upcoming', date: 'Step 4', note: 'Clearance' },
    ]
  },
];

// GRN pending verification & approvals (Tab 3)
const INITIAL_GRN_LIST = [
  {
    id: 'grn-4012',
    request_no: 'GRN-4012',
    site: 'Tower B',
    site_full: 'Tower B - Luxury Towers',
    project_name: 'High Rise Luxury Towers, Sector 62',
    vendor_name: 'ACC Concrete Ltd',
    requested_by: 'Anil Verma',
    requested_by_role: 'Store Incharge',
    amount: 465000,
    date: '09-Sep-2026',
    priority: 'Normal',
    status: 'Pending Approval',
    purpose: 'Transit Mixer RMC Pour Inspection (40 Cu.m M30)',
    delivery_location: 'Tower B Pump 2',
    boq_allowance: 'PO-8802 Material Receipt',
    materials: [
      { name: 'Ready Mix Concrete M30', qty: 40, unit: 'Cu.m', est_rate: 4600, total: 184000, site_stock: 'Received', wh_stock: 'Poured', boq_quota: 'Slump test passed (120mm)' },
      { name: 'Admixture & Retarder Dosing', qty: 40, unit: 'LumpSum', est_rate: 200, total: 8000, site_stock: 'Verified', wh_stock: 'N/A', boq_quota: 'Lab test cubes casted' },
    ],
    timeline: [
      { step: 1, role: 'Store / QC', name: 'Anil Verma', status: 'Approved', date: '09-Sep-2026, 11:30', note: 'Challan verified, 7-day cube specimens taken' },
      { step: 2, role: 'Site In-Charge', name: 'Rajesh Kumar', status: 'Pending', date: 'Action Required', note: 'Verify pour log sheet against delivery slips' },
      { step: 3, role: 'Project Manager', name: 'Amit Desai', status: 'Upcoming', date: 'Step 3', note: 'Bill booking approval' },
      { step: 4, role: 'Accounts', name: 'Store Accounts', status: 'Upcoming', date: 'Step 4', note: 'ERP inventory ledger update' },
    ]
  },
  {
    id: 'grn-4011',
    request_no: 'GRN-4011',
    site: 'Tower A',
    site_full: 'Tower A - High Rise Towers',
    project_name: 'High Rise Luxury Towers, Sector 62',
    vendor_name: 'Asian Paints Regional Depot',
    requested_by: 'Kavita Rao',
    requested_by_role: 'Quality Inspector',
    amount: 190000,
    date: '08-Sep-2026',
    priority: 'High',
    status: 'Pending Approval',
    purpose: 'Exterior Emulsion & Sealer Inward Consignment',
    delivery_location: 'Central Store Paint Bunker',
    boq_allowance: 'PO-8801 Material Receipt',
    materials: [
      { name: 'Asian Paints Apex Ultima White', qty: 300, unit: 'Liters', est_rate: 385, total: 115500, site_stock: '300 Ltr', wh_stock: 'Store', boq_quota: 'Batch tested' },
      { name: 'Acrylic Exterior Wall Primer', qty: 200, unit: 'Liters', est_rate: 160, total: 32000, site_stock: '200 Ltr', wh_stock: 'Store', boq_quota: 'Seal intact' },
    ],
    timeline: [
      { step: 1, role: 'Quality Inspector', name: 'Kavita Rao', status: 'Approved', date: '08-Sep-2026, 15:40', note: 'Batch seal and manufacturing dates verified' },
      { step: 2, role: 'Store Head', name: 'Suresh Patel', status: 'Pending', date: 'Action Required', note: 'Bin card entry confirmation' },
      { step: 3, role: 'Project Manager', name: 'Amit Desai', status: 'Upcoming', date: 'Step 3', note: 'GRN signoff' },
      { step: 4, role: 'Accounts', name: 'Store Accounts', status: 'Upcoming', date: 'Step 4', note: 'GRN closing' },
    ]
  },
];

const SITE_FILTER_OPTIONS = ['All Sites', 'Tower A', 'Tower B', 'Villa Project', 'Warehouse', 'Tower C', 'Commercial'];
const PRIORITY_FILTER_OPTIONS = ['All Priorities', 'Urgent', 'High', 'Normal'];
const DATE_FILTER_OPTIONS = ['All Dates', 'Today', 'Last 7 Days', 'This Month'];

const formatINR = (val) => {
  if (!val && val !== 0) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
};

const ApprovalCenter = () => {
  // Active Tab: 'mr' (Material Requests) | 'po' (Purchase Orders) | 'grn' (GRN)
  const [activeTab, setActiveTab] = useState('mr');

  // Lists state
  const [materialRequests, setMaterialRequests] = useState(() => {
    try {
      const stored = localStorage.getItem('sitetrack_pending_approvals');
      if (stored) {
        const parsed = JSON.parse(stored);
        const storedIds = new Set(parsed.map(p => p.request_no || p.id));
        const combined = [...parsed, ...INITIAL_MATERIAL_REQUESTS.filter(d => !storedIds.has(d.request_no))];
        return combined;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_MATERIAL_REQUESTS;
  });

  const [purchaseOrders, setPurchaseOrders] = useState(INITIAL_PURCHASE_ORDERS);
  const [grnList, setGrnList] = useState(INITIAL_GRN_LIST);

  // Filters
  const [siteFilter, setSiteFilter] = useState('All Sites');
  const [priorityFilter, setPriorityFilter] = useState('All Priorities');
  const [dateFilter, setDateFilter] = useState('All Dates');
  const [searchQuery, setSearchQuery] = useState('');

  // Review Drawer / Modal State
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [currentReviewItem, setCurrentReviewItem] = useState(null);
  const [reviewComments, setReviewComments] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionAlert, setActionAlert] = useState(null);

  // Quick chips for review comments
  const QUICK_COMMENTS = [
    'Approved as per verified BOQ quota & daily schedule.',
    'Verified with central store; available stock insufficient, purchase recommended.',
    'Please reduce ordered quantity by 15% to match weekly casting limit.',
    'Material rate verified with procurement contract.',
    'Ensure mill test report and slump test certificate on delivery.',
  ];

  // Counts for tabs
  const mrCount = materialRequests.filter(m => m.status === 'Pending Approval').length;
  const poCount = purchaseOrders.filter(p => p.status === 'Pending Approval').length;
  const grnCount = grnList.filter(g => g.status === 'Pending Approval').length;
  const totalPending = mrCount + poCount + grnCount;

  const totalPendingValue = useMemo(() => {
    const mrVal = materialRequests.filter(m => m.status === 'Pending Approval').reduce((s, i) => s + (i.amount || 0), 0);
    const poVal = purchaseOrders.filter(p => p.status === 'Pending Approval').reduce((s, i) => s + (i.amount || 0), 0);
    const grnVal = grnList.filter(g => g.status === 'Pending Approval').reduce((s, i) => s + (i.amount || 0), 0);
    return mrVal + poVal + grnVal;
  }, [materialRequests, purchaseOrders, grnList]);

  // Current dataset based on active tab
  const currentDataset = useMemo(() => {
    if (activeTab === 'mr') return materialRequests;
    if (activeTab === 'po') return purchaseOrders;
    return grnList;
  }, [activeTab, materialRequests, purchaseOrders, grnList]);

  // Filtered dataset
  const filteredDataset = useMemo(() => {
    return currentDataset.filter(item => {
      // Site filter
      if (siteFilter !== 'All Sites') {
        const siteText = (item.site || '').toLowerCase();
        if (!siteText.includes(siteFilter.toLowerCase())) return false;
      }

      // Priority filter
      if (priorityFilter !== 'All Priorities') {
        if ((item.priority || '').toLowerCase() !== priorityFilter.toLowerCase()) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNo = (item.request_no || '').toLowerCase().includes(q);
        const matchSite = (item.site || '').toLowerCase().includes(q);
        const matchReq = (item.requested_by || '').toLowerCase().includes(q);
        const matchPurp = (item.purpose || '').toLowerCase().includes(q);
        const matchVendor = (item.vendor_name || '').toLowerCase().includes(q);
        if (!matchNo && !matchSite && !matchReq && !matchPurp && !matchVendor) return false;
      }

      return true;
    });
  }, [currentDataset, siteFilter, priorityFilter, searchQuery]);

  // Review button click
  const handleOpenReview = (item) => {
    setCurrentReviewItem(item);
    setReviewComments('');
    setActionAlert(null);
    setIsReviewOpen(true);
  };

  // Workflow actions handler
  const handleWorkflowAction = async (actionType) => {
    if (!currentReviewItem) return;

    setActionLoading(true);
    const itemNo = currentReviewItem.request_no;
    let newStatus = 'Pending Approval';
    let alertMsg = '';
    let alertType = 'success';

    if (actionType === 'approve') {
      newStatus = 'Approved';
      alertMsg = `Request ${itemNo} has been APPROVED successfully and routed to Purchase Manager.`;
    } else if (actionType === 'approve_changes') {
      newStatus = 'Approved with Changes';
      alertMsg = `Request ${itemNo} has been APPROVED WITH MODIFICATIONS. Notes logged into audit trail.`;
    } else if (actionType === 'send_back') {
      newStatus = 'Sent Back for Revision';
      alertMsg = `Request ${itemNo} was SENT BACK to ${currentReviewItem.requested_by} for required clarifications.`;
      alertType = 'warning';
    } else if (actionType === 'reject') {
      newStatus = 'Rejected';
      alertMsg = `Request ${itemNo} was REJECTED. Reason recorded in audit log.`;
      alertType = 'danger';
    }

    try {
      // 1. Attempt API update
      try {
        if (activeTab === 'mr') {
          await client.put(`/materials/requests/${currentReviewItem.id}/approve`, {
            status: actionType === 'approve' ? 'approved' : actionType === 'reject' ? 'rejected' : 'reviewed',
            approval_notes: reviewComments || `${actionType} via Approval Center`
          });
        }
      } catch (apiErr) {
        console.warn('API endpoint note:', apiErr.message);
      }

      // 2. Update local state
      const updateTimeline = (item) => {
        const currentTimeline = item.timeline ? [...item.timeline] : [];
        if (currentTimeline.length >= 2) {
          currentTimeline[1] = {
            ...currentTimeline[1],
            status: newStatus,
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
            note: reviewComments || `Actioned: ${actionType}`
          };
        }
        return {
          ...item,
          status: newStatus,
          review_notes: reviewComments,
          timeline: currentTimeline
        };
      };

      if (activeTab === 'mr') {
        setMaterialRequests(prev => prev.map(m => m.id === currentReviewItem.id ? updateTimeline(m) : m));
      } else if (activeTab === 'po') {
        setPurchaseOrders(prev => prev.map(p => p.id === currentReviewItem.id ? updateTimeline(p) : p));
      } else {
        setGrnList(prev => prev.map(g => g.id === currentReviewItem.id ? updateTimeline(g) : g));
      }

      setActionAlert({ type: alertType, message: alertMsg });

      // Update in stored material requests as well
      try {
        const stored = JSON.parse(localStorage.getItem('sitetrack_material_requests') || '[]');
        const updated = stored.map(s => s.mr_number === itemNo ? { ...s, status: newStatus } : s);
        localStorage.setItem('sitetrack_material_requests', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }

      setTimeout(() => {
        setIsReviewOpen(false);
        setActionAlert(null);
      }, 1400);

    } catch (err) {
      console.error(err);
      setActionAlert({ type: 'danger', message: 'Error processing approval. Please try again.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Badge helpers
  const renderPriorityBadge = (p) => {
    const priority = (p || 'Normal').toLowerCase();
    if (priority === 'urgent') {
      return (
        <span style={{
          padding: '3px 9px',
          borderRadius: '4px',
          fontSize: '0.74rem',
          fontWeight: '700',
          background: '#fee2e2',
          color: '#dc2626',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          🔥 Urgent
        </span>
      );
    }
    if (priority === 'high') {
      return (
        <span style={{
          padding: '3px 9px',
          borderRadius: '4px',
          fontSize: '0.74rem',
          fontWeight: '600',
          background: '#fef3c7',
          color: '#d97706',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          ⚡ High
        </span>
      );
    }
    return (
      <span style={{
        padding: '3px 9px',
        borderRadius: '4px',
        fontSize: '0.74rem',
        fontWeight: '500',
        background: '#eff6ff',
        color: '#2563eb'
      }}>
        Normal
      </span>
    );
  };

  const renderStatusBadge = (status) => {
    const s = (status || 'Pending Approval').toLowerCase();
    if (s.includes('approved') && !s.includes('changes')) {
      return <span className="badge badge-success badge-dot">Approved</span>;
    }
    if (s.includes('changes')) {
      return <span className="badge badge-info badge-dot">Approved w/ Changes</span>;
    }
    if (s.includes('sent back') || s.includes('revision')) {
      return <span className="badge badge-warning badge-dot">Sent Back</span>;
    }
    if (s.includes('reject')) {
      return <span className="badge badge-danger badge-dot">Rejected</span>;
    }
    return <span className="badge badge-warning badge-dot">Pending Approval</span>;
  };

  return (
    <div className="page-container" style={{ paddingBottom: '40px' }}>
      {/* ── Top Header ── */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 className="page-title" style={{ margin: 0 }}>Approval Center</h1>
            <span style={{
              background: '#fee2e2',
              color: '#dc2626',
              fontSize: '0.75rem',
              fontWeight: '700',
              padding: '2px 8px',
              borderRadius: '12px'
            }}>
              Screen 7
            </span>
          </div>
          <p className="page-subtitle">
            Review and approve pending requests across sites
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{
            background: '#fff',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '6px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: 'var(--shadow-xs)'
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Pending Value:</span>
            <span style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--navy)' }}>
              {formatINR(totalPendingValue)}
            </span>
          </div>

          <Link to="/materials/requests" className="btn btn-secondary">
            View All Requests
          </Link>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div
          className="stat-card"
          onClick={() => setActiveTab('mr')}
          style={{
            cursor: 'pointer',
            borderLeft: activeTab === 'mr' ? '4px solid var(--primary)' : '1px solid var(--border)',
            background: activeTab === 'mr' ? 'var(--primary-50)' : '#fff'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-number" style={{ color: 'var(--primary)' }}>{mrCount}</div>
              <div className="stat-label">Material Requests</div>
            </div>
            <div className="stat-icon" style={{ background: 'var(--primary-lt)', color: 'var(--primary)' }}>
              📦
            </div>
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            7 site indents pending approval
          </div>
        </div>

        <div
          className="stat-card"
          onClick={() => setActiveTab('po')}
          style={{
            cursor: 'pointer',
            borderLeft: activeTab === 'po' ? '4px solid #8b5cf6' : '1px solid var(--border)',
            background: activeTab === 'po' ? '#f5f3ff' : '#fff'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-number" style={{ color: '#8b5cf6' }}>{poCount}</div>
              <div className="stat-label">Purchase Orders</div>
            </div>
            <div className="stat-icon" style={{ background: '#ede9fe', color: '#8b5cf6' }}>
              🛒
            </div>
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            3 vendor purchase orders pending signoff
          </div>
        </div>

        <div
          className="stat-card"
          onClick={() => setActiveTab('grn')}
          style={{
            cursor: 'pointer',
            borderLeft: activeTab === 'grn' ? '4px solid var(--success)' : '1px solid var(--border)',
            background: activeTab === 'grn' ? 'var(--success-lt)' : '#fff'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-number" style={{ color: 'var(--success)' }}>{grnCount}</div>
              <div className="stat-label">Goods Receipt Notes (GRN)</div>
            </div>
            <div className="stat-icon" style={{ background: 'var(--success-lt)', color: 'var(--success)' }}>
              📥
            </div>
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            2 delivery verification indents
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--navy)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-number" style={{ color: 'var(--navy)' }}>{totalPending}</div>
              <div className="stat-label">Total Pending Actions</div>
            </div>
            <div className="stat-icon" style={{ background: '#f1f5f9', color: 'var(--navy)' }}>
              ⚡
            </div>
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            High priority items flagged
          </div>
        </div>
      </div>

      {/* ── Tab Navigation Bar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        borderBottom: '2px solid var(--border)',
        marginBottom: '16px',
        paddingLeft: '4px'
      }}>
        {/* Tab 1: Material Requests (7) */}
        <button
          type="button"
          onClick={() => setActiveTab('mr')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '0.88rem',
            fontWeight: activeTab === 'mr' ? '700' : '500',
            color: activeTab === 'mr' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'mr' ? '3px solid var(--primary)' : '3px solid transparent',
            marginBottom: '-2px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s'
          }}
        >
          <span>📦 Material Requests</span>
          <span style={{
            background: activeTab === 'mr' ? 'var(--primary)' : 'var(--border-strong)',
            color: '#fff',
            fontSize: '0.72rem',
            fontWeight: '700',
            padding: '2px 7px',
            borderRadius: '10px'
          }}>
            {mrCount}
          </span>
        </button>

        {/* Tab 2: Purchase Orders (3) */}
        <button
          type="button"
          onClick={() => setActiveTab('po')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '0.88rem',
            fontWeight: activeTab === 'po' ? '700' : '500',
            color: activeTab === 'po' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'po' ? '3px solid var(--primary)' : '3px solid transparent',
            marginBottom: '-2px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s'
          }}
        >
          <span>🛒 Purchase Orders</span>
          <span style={{
            background: activeTab === 'po' ? 'var(--primary)' : 'var(--border-strong)',
            color: '#fff',
            fontSize: '0.72rem',
            fontWeight: '700',
            padding: '2px 7px',
            borderRadius: '10px'
          }}>
            {poCount}
          </span>
        </button>

        {/* Tab 3: GRN (2) */}
        <button
          type="button"
          onClick={() => setActiveTab('grn')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '0.88rem',
            fontWeight: activeTab === 'grn' ? '700' : '500',
            color: activeTab === 'grn' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'grn' ? '3px solid var(--primary)' : '3px solid transparent',
            marginBottom: '-2px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s'
          }}
        >
          <span>📥 GRN</span>
          <span style={{
            background: activeTab === 'grn' ? 'var(--primary)' : 'var(--border-strong)',
            color: '#fff',
            fontSize: '0.72rem',
            fontWeight: '700',
            padding: '2px 7px',
            borderRadius: '10px'
          }}>
            {grnCount}
          </span>
        </button>
      </div>

      {/* ── Filters Bar ── */}
      <div className="filter-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
          {/* Site Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Site:</span>
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              style={{ minWidth: '130px' }}
            >
              {SITE_FILTER_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{ minWidth: '120px' }}
            >
              {PRIORITY_FILTER_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Date Range:</span>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{ minWidth: '110px' }}
            >
              {DATE_FILTER_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <input
              type="text"
              placeholder="Search request #, site, requester, material..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: '28px' }}
            />
            <span style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              🔍
            </span>
          </div>
        </div>

        {(siteFilter !== 'All Sites' || priorityFilter !== 'All Priorities' || searchQuery) && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setSiteFilter('All Sites');
              setPriorityFilter('All Priorities');
              setSearchQuery('');
            }}
            style={{ fontSize: '0.78rem', color: 'var(--danger)' }}
          >
            ✕ Reset Filters
          </button>
        )}
      </div>

      {/* ── Approvals Table ── */}
      <div className="table-responsive" style={{ background: '#fff', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr>
              <th style={{ width: '120px' }}>Request No</th>
              <th style={{ width: '140px' }}>Site</th>
              <th style={{ width: '170px' }}>Requested By</th>
              <th style={{ width: '130px' }}>Amount</th>
              <th style={{ width: '120px' }}>Date</th>
              <th style={{ width: '110px' }}>Priority</th>
              <th style={{ width: '140px' }}>Status</th>
              <th style={{ width: '100px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredDataset.length === 0 ? (
              <tr>
                <td colSpan="8">
                  <div className="empty-state">
                    <div className="empty-state-icon">✓</div>
                    <div className="empty-state-title">No pending approvals found</div>
                    <div className="empty-state-text">
                      All requests under this filter have been actioned or no matching items exist.
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredDataset.map((row) => (
                <tr key={row.id} style={{ cursor: 'pointer' }} onClick={() => handleOpenReview(row)}>
                  {/* Request No */}
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: '700', color: 'var(--primary)', fontFamily: 'monospace', fontSize: '0.88rem' }}>
                        {row.request_no}
                      </span>
                      {row.vendor_name && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                          {row.vendor_name}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Site */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.9rem' }}>🏗️</span>
                      <span style={{ fontWeight: '600', color: 'var(--navy)' }}>
                        {row.site}
                      </span>
                    </div>
                  </td>

                  {/* Requested By */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'var(--navy-50)',
                        border: '1px solid var(--border)',
                        color: 'var(--navy)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '0.75rem',
                        flexShrink: 0
                      }}>
                        {(row.requested_by || 'U').charAt(0)}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '500', color: 'var(--text)', fontSize: '0.83rem' }}>
                          {row.requested_by}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {row.requested_by_role || 'Site Engineer'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Amount */}
                  <td>
                    <span style={{ fontWeight: '700', color: 'var(--navy)', fontSize: '0.88rem' }}>
                      {formatINR(row.amount)}
                    </span>
                  </td>

                  {/* Date */}
                  <td>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {row.date}
                    </span>
                  </td>

                  {/* Priority */}
                  <td>
                    {renderPriorityBadge(row.priority)}
                  </td>

                  {/* Status */}
                  <td>
                    {renderStatusBadge(row.status)}
                  </td>

                  {/* Action Button */}
                  <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleOpenReview(row)}
                      style={{ padding: '5px 14px', fontSize: '0.8rem', fontWeight: '600' }}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Review Drawer / Modal (Slide-Over / Large Modal) ── */}
      <Modal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        title={`Approval Review: ${currentReviewItem?.request_no || ''}`}
        subtitle={`${currentReviewItem?.site_full || currentReviewItem?.site} • Submitted on ${currentReviewItem?.date}`}
        icon="⚖️"
        size="xl"
      >
        {currentReviewItem && (
          <div>
            {actionAlert && (
              <div className={`alert alert-${actionAlert.type}`} style={{ marginBottom: '16px' }}>
                <span>{actionAlert.type === 'success' ? '✓' : '⚠️'}</span>
                <span>{actionAlert.message}</span>
              </div>
            )}

            {/* Visual 4-Step Approval Timeline */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '16px 20px',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '0.74rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
                Visual Approval Workflow
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', position: 'relative' }}>
                {(currentReviewItem.timeline || []).map((step, idx) => {
                  const isApproved = step.status === 'Approved';
                  const isPending = step.status === 'Pending' || step.status === 'Pending Approval';
                  const isUpcoming = step.status === 'Upcoming';

                  return (
                    <div
                      key={idx}
                      style={{
                        background: isPending ? '#fff' : isApproved ? '#f0fdf4' : '#fff',
                        border: isPending ? '2px solid var(--primary)' : isApproved ? '1px solid #bbf7d0' : '1px solid var(--border)',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        boxShadow: isPending ? '0 2px 8px rgba(37,99,235,0.12)' : 'none',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          background: isApproved ? 'var(--success)' : isPending ? 'var(--primary)' : 'var(--border)',
                          color: isUpcoming ? 'var(--text-secondary)' : '#fff'
                        }}>
                          {isApproved ? '✓' : step.step}
                        </div>

                        <div style={{ fontWeight: '700', fontSize: '0.82rem', color: 'var(--navy)' }}>
                          {step.role}
                        </div>
                      </div>

                      <div style={{ fontSize: '0.78rem', fontWeight: '600', color: isApproved ? '#15803d' : isPending ? 'var(--primary)' : 'var(--text-muted)' }}>
                        {step.name}
                      </div>

                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {step.date}
                      </div>

                      {step.note && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px', fontStyle: 'italic' }}>
                          "{step.note}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Site & Requester Metadata Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              {/* Card 1: Site & Location Details */}
              <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '6px', padding: '14px 16px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Site & Job Location
                </div>
                <div style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--navy)' }}>
                  {currentReviewItem.site_full || currentReviewItem.site}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Project: {currentReviewItem.project_name}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text)', marginTop: '6px' }}>
                  <strong>Activity:</strong> {currentReviewItem.purpose}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  <strong>Unloading Bay:</strong> {currentReviewItem.delivery_location || 'Main Site Store'}
                </div>
              </div>

              {/* Card 2: Requester & Financial Summary */}
              <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '6px', padding: '14px 16px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Requester & Priority
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--navy)' }}>
                      {currentReviewItem.requested_by}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Role: {currentReviewItem.requested_by_role}
                    </div>
                  </div>
                  <div>
                    {renderPriorityBadge(currentReviewItem.priority)}
                  </div>
                </div>

                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Estimated Value:</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary)' }}>
                      {formatINR(currentReviewItem.amount)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Target Delivery:</span>
                    <div style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--navy)' }}>
                      {currentReviewItem.date_needed || currentReviewItem.date}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Materials List Table */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--navy)', textTransform: 'uppercase' }}>
                  Materials Breakdown & Stock Allowance
                </div>
                <span style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: '600', background: '#dcfce7', padding: '2px 8px', borderRadius: '4px' }}>
                  ✓ Within BOQ Allowance
                </span>
              </div>

              <div className="table-responsive" style={{ border: '1px solid var(--border)', borderRadius: '6px' }}>
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Material Name</th>
                      <th>Requested Qty</th>
                      <th>Est. Unit Cost</th>
                      <th>Line Total</th>
                      <th>Available Stock</th>
                      <th>BOQ Quota Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(currentReviewItem.materials || []).map((m, idx) => (
                      <tr key={idx}>
                        <td style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                        <td style={{ fontWeight: '600', color: 'var(--navy)' }}>{m.name}</td>
                        <td style={{ fontWeight: '700', color: 'var(--primary)' }}>
                          {m.qty} {m.unit}
                        </td>
                        <td>{m.est_rate ? formatINR(m.est_rate) : '-'}</td>
                        <td style={{ fontWeight: '600', color: 'var(--navy)' }}>
                          {formatINR(m.total)}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                              Site: <strong style={{ color: 'var(--navy)' }}>{m.site_stock || 'None'}</strong>
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              Warehouse: {m.wh_stock || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.76rem', color: '#15803d', fontWeight: '500' }}>
                            {m.boq_quota || currentReviewItem.boq_allowance || 'Within quota'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Reviewer Comments & Quick Chips */}
            <div style={{ marginBottom: '22px' }}>
              <label className="form-label" style={{ fontWeight: '600' }}>
                Reviewer Remarks & Audit Notes
              </label>
              <textarea
                className="form-control"
                rows="3"
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                placeholder="Enter remarks, approval conditions, or justification notes..."
                style={{ fontSize: '0.85rem' }}
              />

              <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Quick insert:</span>
                {QUICK_COMMENTS.map((chip, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setReviewComments(chip)}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      background: '#fff',
                      fontSize: '0.72rem',
                      padding: '2px 8px',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--navy-50)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                  >
                    + {chip.slice(0, 32)}...
                  </button>
                ))}
              </div>
            </div>

            {/* Workflow Action Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '16px',
              borderTop: '1px solid var(--border)',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsReviewOpen(false)}
                disabled={actionLoading}
              >
                Close Drawer
              </button>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {/* Send Back (Amber) */}
                <button
                  type="button"
                  className="btn btn-warning"
                  onClick={() => handleWorkflowAction('send_back')}
                  disabled={actionLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>↩️</span>
                  <span>Send Back</span>
                </button>

                {/* Reject (Red) */}
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleWorkflowAction('reject')}
                  disabled={actionLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>✕</span>
                  <span>Reject</span>
                </button>

                {/* Approve with Changes (Blue) */}
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleWorkflowAction('approve_changes')}
                  disabled={actionLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>✏️</span>
                  <span>Approve with Changes</span>
                </button>

                {/* Approve (Green) */}
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => handleWorkflowAction('approve')}
                  disabled={actionLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}
                >
                  <span>✓</span>
                  <span>Approve</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ApprovalCenter;
