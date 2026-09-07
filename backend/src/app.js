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
const procurementRoutes = require('./modules/procurement/routes');
const billingRoutes = require('./modules/billing/routes');
const reportsRoutes = require('./modules/reports/routes');
const mainStoreRoutes = require('./modules/main_store/routes');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));

// Static assets from frontend build — served BEFORE CORS so JS/CSS never trigger 500 CORS errors
const distPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(distPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

// CORS — locked to CORS_ORIGIN in production, open in development
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()).filter(Boolean)
  : [];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (same-origin, curl, mobile apps)
    if (!origin) return callback(null, true);
    // In development or if no CORS_ORIGIN set, allow everything
    if (allowedOrigins.length === 0) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
}));

app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/api/v1/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/employees', authMiddleware, employeeRoutes);
app.use('/api/v1/projects',  authMiddleware, projectRoutes);
app.use('/api/v1/work-packages', authMiddleware, workPackageRoutes);
app.use('/api/v1/materials', authMiddleware, materialRoutes);
app.use('/api/v1/equipment-machines', authMiddleware, equipmentMachineRoutes);
app.use('/api/v1/attendance', authMiddleware, attendanceRoutes);
app.use('/api/v1/procurement', authMiddleware, procurementRoutes);
app.use('/api/v1/billing', authMiddleware, billingRoutes);
app.use('/api/v1/reports', authMiddleware, reportsRoutes);
app.use('/api/v1/main-store', authMiddleware, mainStoreRoutes);

// SPA fallback for React Router & 404 for unknown API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: true, message: 'Route not found' });
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

app.use(errorHandler);

module.exports = app;
