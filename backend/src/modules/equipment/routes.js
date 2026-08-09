const express = require('express');
const controller = require('./controller');
const requireRole = require('../../middleware/rbac');

const router = express.Router();

router.get('/categories', controller.listCategories);
router.get('/items', controller.listItems);
router.post('/items', requireRole('company_admin', 'super_admin'), controller.createItem);
router.get('/items/:id', controller.getItem);
router.put('/items/:id', requireRole('company_admin', 'super_admin'), controller.updateItem);

router.get('/site/:siteId/allocations', controller.getSiteAllocations);
router.post('/transactions', requireRole('site_supervisor', 'company_admin', 'super_admin'), controller.recordTransaction);
router.get('/alerts/low-stock', controller.getLowStockAlerts);
router.get('/transactions', controller.getTransactionHistory);

module.exports = router;
