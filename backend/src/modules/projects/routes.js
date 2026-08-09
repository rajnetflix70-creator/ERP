const router = require('express').Router();
const ctrl = require('./controller');
const requireRole = require('../../middleware/rbac');

const ADMIN = ['super_admin', 'company_admin'];

router.get('/stats', ctrl.getStats);
router.get('/', ctrl.listProjects);
router.get('/:id', ctrl.getProject);
router.post('/', requireRole(...ADMIN), ctrl.createProject);
router.put('/:id', requireRole(...ADMIN), ctrl.updateProject);
router.delete('/:id', requireRole(...ADMIN), ctrl.deleteProject);

module.exports = router;
