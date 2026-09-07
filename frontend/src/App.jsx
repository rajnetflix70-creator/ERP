import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EquipmentMaster from './pages/EquipmentMaster';
import SiteAllocation from './pages/SiteAllocation';
import EquipmentMovement from './pages/EquipmentMovement';
import DailyLogModule from './pages/DailyLogModule';
import BulkAttendance from './pages/BulkAttendance';
import PayrollSummary from './pages/PayrollSummary';
import AttendanceHistory from './pages/AttendanceHistory';
import PurchaseRequest from './pages/PurchaseRequest';
import PurchaseOrders from './pages/PurchaseOrders';
import ClientMaster from './pages/ClientMaster';
import BillingInvoicing from './pages/BillingInvoicing';
import MaintenanceManagement from './pages/MaintenanceManagement';
import BreakdownManagement from './pages/BreakdownManagement';
import DocumentManagement from './pages/DocumentManagement';
import OperatorsMaster from './pages/OperatorsMaster';
import ProjectMaster from './pages/ProjectMaster';
import VendorsMaster from './pages/VendorsMaster';
import EmployeeMaster from './pages/EmployeeMaster';
import ReportsModule from './pages/ReportsModule';
import NotificationCenter from './pages/NotificationCenter';
import ProjectManagement from './pages/ProjectManagement';
import MaterialMaster from './pages/MaterialMaster';
import MaterialRequest from './pages/MaterialRequest';
import SiteStock from './pages/SiteStock';
import MainStoreCategory from './pages/MainStoreCategory';
import MainStoreBrand from './pages/MainStoreBrand';
import MainStoreMaterial from './pages/MainStoreMaterial';
import MainStorePurchaseOrder from './pages/MainStorePurchaseOrder';
import MainStoreReturnOrder from './pages/MainStoreReturnOrder';
import MaterialConsumption from './pages/MaterialConsumption';
import MaterialConsumptionReport from './pages/MaterialConsumptionReport';
import UserMaster from './pages/UserMaster';
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
              <Route index element={<Dashboard />} />
              <Route path="equipment/master" element={<EquipmentMaster />} />
              <Route path="equipment/allocation" element={<SiteAllocation />} />
              <Route path="equipment/movement" element={<EquipmentMovement />} />
              <Route path="equipment/daily-log" element={<DailyLogModule />} />
              <Route path="attendance/bulk" element={<BulkAttendance />} />
              <Route path="attendance/payroll" element={<PayrollSummary />} />
              <Route path="attendance/history" element={<AttendanceHistory />} />
              <Route path="equipment/maintenance" element={<MaintenanceManagement />} />
              <Route path="equipment/breakdown" element={<BreakdownManagement />} />
              <Route path="equipment/documents" element={<DocumentManagement />} />
              <Route path="masters/employees" element={<EmployeeMaster />} />
              <Route path="masters/operators" element={<OperatorsMaster />} />
              <Route path="masters/projects" element={<ProjectMaster />} />
              <Route path="masters/vendors" element={<VendorsMaster />} />
              <Route path="project/work-packages" element={<ProjectManagement />} />
              <Route path="materials/catalog" element={<MaterialMaster />} />
              <Route path="materials/requests" element={<MaterialRequest />} />
              <Route path="materials/stock" element={<SiteStock />} />
              <Route path="procurement/requests" element={<PurchaseRequest />} />
              <Route path="procurement/orders" element={<PurchaseOrders />} />
              <Route path="billing/clients" element={<ClientMaster />} />
              <Route path="billing/invoices" element={<BillingInvoicing />} />
              <Route path="reports" element={<ReportsModule />} />
              <Route path="notifications" element={<NotificationCenter />} />
              <Route path="masters/equipment" element={<EquipmentMaster />} />

              {/* Main Store routes */}
              <Route path="main-store/category" element={<MainStoreCategory />} />
              <Route path="main-store/brand" element={<MainStoreBrand />} />
              <Route path="main-store/materials" element={<MainStoreMaterial />} />
              <Route path="main-store/purchase-order" element={<MainStorePurchaseOrder />} />
              <Route path="main-store/return-order" element={<MainStoreReturnOrder />} />
              <Route path="materials/consumption" element={<MaterialConsumption />} />
              <Route path="materials/consumption-report" element={<MaterialConsumptionReport />} />
              <Route path="users/master" element={<UserMaster />} />
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
