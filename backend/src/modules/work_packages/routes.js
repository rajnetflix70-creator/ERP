const router = require('express').Router();
const ctrl = require('./controller');
const requireRole = require('../../middleware/rbac');

const ADMIN      = ['super_admin', 'company_admin'];
const MANAGER    = ['super_admin', 'company_admin', 'project_manager'];
const SUPERVISOR = ['super_admin', 'company_admin', 'project_manager', 'site_supervisor'];

router.get('/kanban',    ctrl.kanban);
router.get('/',          ctrl.list);
router.get('/:id',       ctrl.get);
router.post('/',         requireRole(...MANAGER), ctrl.create);
router.put('/:id',       requireRole(...SUPERVISOR), ctrl.update);
router.delete('/:id',    requireRole(...ADMIN), ctrl.remove);
router.post('/:id/progress',  requireRole(...SUPERVISOR), ctrl.logProgress);
router.get('/:id/progress',   ctrl.getProgressLogs);

module.exports = router;
