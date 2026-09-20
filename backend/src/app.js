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
const siteRoutes     = require('./modules/sites/routes');
const workPackageRoutes = require('./modules/work_packages/routes');
const materialRoutes = require('./modules/materials/routes');
const materialRequestRoutes = require('./modules/materials/requestRoutes');
const equipmentMachineRoutes = require('./modules/equipment_machines/routes');
const attendanceRoutes = require('./modules/attendance/routes');
const procurementRoutes = require('./modules/procurement/routes');
const billingRoutes = require('./modules/billing/routes');
const reportsRoutes = require('./modules/reports/routes');
const mainStoreRoutes = require('./modules/main_store/routes');
const vendorRoutes = require('./modules/vendors/routes');

const fs = require('fs');
const app = express();

app.use(helmet({ contentSecurityPolicy: false }));

// Static assets from frontend build — served BEFORE CORS so JS/CSS never trigger 500 CORS errors
const candidateDistPaths = [
  path.join(__dirname, '../../frontend/dist'),
  path.join(process.cwd(), 'frontend/dist'),
  path.join(__dirname, '../../../frontend/dist'),
  path.join(__dirname, '../public'),
];
const distPath = candidateDistPaths.find(p => fs.existsSync(p)) || candidateDistPaths[0];

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

const autoAudit = require('./middleware/auditMiddleware');
const lookupRoutes = require('./modules/lookup/routes');
const db = require('./db');

app.get('/api/v1/health', async (req, res) => {
  try {
    await db.raw('SELECT 1');
    res.json({
      status: 'ok',
      db: 'connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (err) {
    res.status(503).json({
      status: 'degraded',
      db: 'disconnected',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.use('/api/v1/auth', authRoutes);
app.use(authMiddleware);
app.use(autoAudit());

app.use('/api/v1/lookup', lookupRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/projects',  projectRoutes);
app.use('/api/v1/sites',     siteRoutes);
app.use('/api/v1/work-packages', workPackageRoutes);
app.use('/api/v1/materials', materialRoutes);
app.use('/api/v1/material-requests', materialRequestRoutes);
app.use('/api/v1/equipment-machines', equipmentMachineRoutes);
app.use('/api/v1/vendors', vendorRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/procurement', procurementRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/main-store', mainStoreRoutes);

// SPA fallback for React Router & 404 for unknown API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: true, message: 'Route not found' });
  }
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head><title>SiteTrack ERP</title></head>
        <body style="font-family:sans-serif;padding:2rem;text-align:center;">
          <h2>🏗️ SiteTrack ERP Server Active</h2>
          <p>Health check: <a href="/api/v1/health">/api/v1/health</a></p>
        </body>
        </html>
      `);
    }
  });
});

app.use(errorHandler);

module.exports = app;
