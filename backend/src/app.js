const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/auth');

const authRoutes = require('./modules/auth/routes');
const employeeRoutes = require('./modules/employees/routes');
const projectRoutes  = require('./modules/projects/routes');
const workPackageRoutes = require('./modules/work_packages/routes');
const materialRoutes = require('./modules/materials/routes');
const equipmentMachineRoutes = require('./modules/equipment_machines/routes');
const attendanceRoutes = require('./modules/attendance/routes');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Static assets from frontend build
const distPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(distPath));

app.get('/api/v1/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/employees', authMiddleware, employeeRoutes);
app.use('/api/v1/projects',  authMiddleware, projectRoutes);
app.use('/api/v1/work-packages', authMiddleware, workPackageRoutes);
app.use('/api/v1/materials', authMiddleware, materialRoutes);
app.use('/api/v1/equipment-machines', authMiddleware, equipmentMachineRoutes);
app.use('/api/v1/attendance', authMiddleware, attendanceRoutes);

// SPA fallback for React Router & 404 for unknown API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: true, message: 'Route not found' });
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

app.use(errorHandler);

module.exports = app;
