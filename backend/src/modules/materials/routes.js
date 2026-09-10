const router = require('express').Router();
const ctrl   = require('./controller');
const requireRole = require('../../middleware/rbac');

const ADMIN      = ['super_admin', 'company_admin'];
const MANAGER    = ['super_admin', 'company_admin', 'project_manager'];
const SUPERVISOR = ['super_admin', 'company_admin', 'project_manager', 'site_supervisor'];

/* Material requests */
router.get('/requests',                   ctrl.listReqs);
router.get('/requests/all',               ctrl.listReqs);
router.post('/requests',                  requireRole(...SUPERVISOR), ctrl.createReq);
router.put('/requests/:id/approve',       requireRole(...MANAGER),    ctrl.approveReq);
router.put('/requests/:id/issue',         requireRole(...MANAGER),    ctrl.issueReq);

/* Consumption */
router.get('/consumption/history',        ctrl.listConsumeHistory);
router.post('/consumption',               requireRole(...SUPERVISOR), ctrl.logConsume);

/* Stock */
router.get('/low-stock',                  ctrl.lowStock);
router.get('/stock/low-stock',            ctrl.lowStock);
router.get('/stock/site',                 ctrl.siteStock);

/* Material master */
router.get('/',                           ctrl.list);
router.get('/:id',                        ctrl.get);
router.post('/',                          requireRole(...MANAGER), ctrl.create);
router.put('/:id',                        requireRole(...MANAGER), ctrl.update);
router.delete('/:id',                     requireRole(...ADMIN),   ctrl.remove);

module.exports = router;
