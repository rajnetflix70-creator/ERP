const router = require('express').Router();
const ctrl = require('./controller');
const requireRole = require('../../middleware/rbac');

const ADMIN = ['super_admin', 'company_admin', 'project_manager'];

// Clients
router.get('/clients', requireRole(...ADMIN), ctrl.getClients);
router.post('/clients', requireRole(...ADMIN), ctrl.createClient);
router.put('/clients/:id', requireRole(...ADMIN), ctrl.updateClient);

// Invoices
router.get('/invoices', requireRole(...ADMIN), ctrl.getInvoices);
router.get('/invoices/:id', requireRole(...ADMIN), ctrl.getInvoiceById);
router.post('/invoices', requireRole(...ADMIN), ctrl.createInvoice);
router.patch('/invoices/:id/status', requireRole(...ADMIN), ctrl.updateInvoiceStatus);
router.post('/payments', requireRole(...ADMIN), ctrl.recordPayment);

module.exports = router;
