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

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));

// CORS — locked to CORS_ORIGIN in production, open in development
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : [];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, mobile apps, server-to-server)
    if (!origin) return callback(null, true);
    // In development or if no CORS_ORIGIN set, allow everything
    if (allowedOrigins.length === 0) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
}));

app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

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
app.use('/api/v1/procurement', authMiddleware, procurementRoutes);
app.use('/api/v1/billing', authMiddleware, billingRoutes);
app.use('/api/v1/reports', authMiddleware, reportsRoutes);

// SPA fallback for React Router & 404 for unknown API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: true, message: 'Route not found' });
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

app.use(errorHandler);

module.exports = app;
