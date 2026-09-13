import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

/* Auth */
import Login from './pages/Login';

/* Dashboard */
import Dashboard from './pages/Dashboard';

/* Project Management */
import ProjectsSites from './pages/ProjectsSites';
import SiteDetails from './pages/SiteDetails';
import ProjectMaster from './pages/ProjectMaster';
import ProjectManagement from './pages/ProjectManagement';

/* Materials */
import MaterialMaster from './pages/MaterialMaster';
import MainStoreCategory from './pages/MainStoreCategory';
import MainStoreBrand from './pages/MainStoreBrand';
import MainStoreMaterial from './pages/MainStoreMaterial';

/* Procurement */
import MaterialRequest from './pages/MaterialRequest';
import CreateMaterialRequest from './pages/CreateMaterialRequest';
import ApprovalCenter from './pages/ApprovalCenter';
import PurchaseRequest from './pages/PurchaseRequest';
import PurchaseOrders from './pages/PurchaseOrders';
import GRNList from './pages/GRNList';
import MainStorePurchaseOrder from './pages/MainStorePurchaseOrder';
import MainStoreReturnOrder from './pages/MainStoreReturnOrder';

/* Vendors */
import VendorsMaster from './pages/VendorsMaster';

/* Inventory */
import InventoryDashboard from './pages/InventoryDashboard';
import SiteStock from './pages/SiteStock';
import MaterialConsumption from './pages/MaterialConsumption';
import StockTransfer from './pages/StockTransfer';
import StockAdjustment from './pages/StockAdjustment';
import MaterialConsumptionReport from './pages/MaterialConsumptionReport';

/* HR & Attendance */
import UserMaster from './pages/UserMaster';
import EmployeeMaster from './pages/EmployeeMaster';
import ManualAttendance from './pages/ManualAttendance';
import BulkAttendance from './pages/BulkAttendance';
import AttendanceHistory from './pages/AttendanceHistory';
import PayrollSummary from './pages/PayrollSummary';

/* Settings */
import CompanySettings from './pages/CompanySettings';
import ApprovalWorkflowSettings from './pages/ApprovalWorkflowSettings';
import NotificationSettings from './pages/NotificationSettings';

/* Equipment (legacy) */
import EquipmentMaster from './pages/EquipmentMaster';
import SiteAllocation from './pages/SiteAllocation';
import EquipmentMovement from './pages/EquipmentMovement';
import DailyLogModule from './pages/DailyLogModule';
import MaintenanceManagement from './pages/MaintenanceManagement';
import BreakdownManagement from './pages/BreakdownManagement';
import DocumentManagement from './pages/DocumentManagement';
import OperatorsMaster from './pages/OperatorsMaster';

/* Billing */
import ClientMaster from './pages/ClientMaster';
import BillingInvoicing from './pages/BillingInvoicing';

/* Reports & Misc */
import ReportsModule from './pages/ReportsModule';
import PurchaseRegister from './pages/PurchaseRegister';
import NotificationCenter from './pages/NotificationCenter';
import AuditLogs from './pages/AuditLogs';

/* Account */
import MyProfile from './pages/MyProfile';
import ChangePassword from './pages/ChangePassword';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              {/* Dashboard */}
              <Route index element={<Dashboard />} />

              {/* ── PROJECT MANAGEMENT ── */}
              <Route path="projects" element={<ProjectsSites initialTab="projects" />} />
              <Route path="sites" element={<ProjectsSites initialTab="sites" />} />
              <Route path="sites/:id" element={<SiteDetails />} />
              <Route path="projects-sites" element={<ProjectsSites />} />
              <Route path="boq" element={<ProjectManagement />} />
              {/* Legacy routes (backward compat) */}
              <Route path="masters/projects" element={<ProjectMaster />} />
              <Route path="project/work-packages" element={<ProjectManagement />} />

              {/* ── MATERIALS ── */}
              <Route path="materials/master" element={<MaterialMaster />} />
              <Route path="materials/categories" element={<MainStoreCategory />} />
              <Route path="materials/units" element={<MainStoreBrand />} />
              {/* Legacy */}
              <Route path="materials/catalog" element={<MaterialMaster />} />

              {/* ── PROCUREMENT ── */}
              <Route path="materials/requests" element={<MaterialRequest />} />
              <Route path="materials/requests/new" element={<CreateMaterialRequest />} />
              <Route path="approvals" element={<ApprovalCenter />} />
              <Route path="procurement/orders" element={<PurchaseOrders />} />
              <Route path="procurement/deliveries" element={<MainStorePurchaseOrder />} />
              <Route path="procurement/grn" element={<GRNList />} />
              {/* Legacy */}
              <Route path="procurement/requests" element={<PurchaseRequest />} />

              {/* ── VENDORS ── */}
              <Route path="vendors" element={<VendorsMaster />} />
              <Route path="vendors/performance" element={<VendorsMaster />} />
              {/* Legacy */}
              <Route path="masters/vendors" element={<VendorsMaster />} />

              {/* ── INVENTORY ── */}
              <Route path="inventory" element={<InventoryDashboard />} />
              <Route path="inventory/stock" element={<SiteStock />} />
              <Route path="inventory/issue" element={<MaterialConsumption />} />
              <Route path="inventory/transfer" element={<StockTransfer />} />
              <Route path="inventory/adjustment" element={<StockAdjustment />} />
              <Route path="inventory/ledger" element={<MaterialConsumptionReport />} />
              {/* Legacy */}
              <Route path="materials/stock" element={<SiteStock />} />
              <Route path="materials/consumption" element={<MaterialConsumption />} />
              <Route path="materials/consumption-report" element={<MaterialConsumptionReport />} />

              {/* ── HR & ATTENDANCE ── */}
              <Route path="hr/users" element={<UserMaster />} />
              <Route path="hr/employees" element={<EmployeeMaster />} />
              <Route path="hr/attendance" element={<ManualAttendance />} />
              <Route path="hr/attendance/reports" element={<AttendanceHistory />} />
              {/* Legacy */}
              <Route path="users/master" element={<UserMaster />} />
              <Route path="masters/employees" element={<EmployeeMaster />} />
              <Route path="attendance/bulk" element={<BulkAttendance />} />
              <Route path="attendance/history" element={<AttendanceHistory />} />
              <Route path="attendance/payroll" element={<PayrollSummary />} />

              {/* ── REPORTS ── */}
              <Route path="reports" element={<ReportsModule />} />
              <Route path="reports/purchase-register" element={<PurchaseRegister />} />
              <Route path="reports/audit-logs" element={<AuditLogs />} />
              <Route path="purchase-register" element={<PurchaseRegister />} />

              {/* ── SETTINGS ── */}
              <Route path="settings" element={<CompanySettings />} />
              <Route path="settings/company" element={<CompanySettings />} />
              <Route path="settings/roles" element={<UserMaster />} />
              <Route path="settings/workflows" element={<ApprovalWorkflowSettings />} />
              <Route path="settings/notifications" element={<NotificationSettings />} />
              <Route path="settings/audit-logs" element={<AuditLogs />} />

              {/* ── EQUIPMENT (legacy - kept) ── */}
              <Route path="equipment/master" element={<EquipmentMaster />} />
              <Route path="equipment/allocation" element={<SiteAllocation />} />
              <Route path="equipment/movement" element={<EquipmentMovement />} />
              <Route path="equipment/daily-log" element={<DailyLogModule />} />
              <Route path="equipment/maintenance" element={<MaintenanceManagement />} />
              <Route path="equipment/breakdown" element={<BreakdownManagement />} />
              <Route path="equipment/documents" element={<DocumentManagement />} />
              <Route path="masters/operators" element={<OperatorsMaster />} />
              <Route path="masters/equipment" element={<EquipmentMaster />} />

              {/* ── BILLING (legacy - kept) ── */}
              <Route path="billing/clients" element={<ClientMaster />} />
              <Route path="billing/invoices" element={<BillingInvoicing />} />

              {/* ── MAIN STORE (legacy - kept) ── */}
              <Route path="main-store/category" element={<MainStoreCategory />} />
              <Route path="main-store/brand" element={<MainStoreBrand />} />
              <Route path="main-store/materials" element={<MainStoreMaterial />} />
              <Route path="main-store/purchase-order" element={<MainStorePurchaseOrder />} />
              <Route path="main-store/return-order" element={<MainStoreReturnOrder />} />

              {/* ── NOTIFICATIONS ── */}
              <Route path="notifications" element={<NotificationSettings />} />

              {/* ── ACCOUNT ── */}
              <Route path="my-profile" element={<MyProfile />} />
              <Route path="change-password" element={<ChangePassword />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
