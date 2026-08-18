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
              <Route path="reports" element={<ReportsModule />} />
              <Route path="notifications" element={<NotificationCenter />} />
              <Route path="masters/equipment" element={<EquipmentMaster />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
