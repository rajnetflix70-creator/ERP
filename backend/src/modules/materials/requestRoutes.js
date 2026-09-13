const router = require('express').Router();
const ctrl = require('./controller');
const requireRole = require('../../middleware/rbac');

const MANAGER = ['super_admin', 'company_admin', 'project_manager'];
const SUPERVISOR = ['super_admin', 'company_admin', 'project_manager', 'site_supervisor'];

router.get('/', ctrl.listReqs);
router.get('/all', ctrl.listReqs);
router.post('/', requireRole(...SUPERVISOR), ctrl.createReq);
router.put('/:id/approve', requireRole(...MANAGER), ctrl.approveReq);
router.patch('/:id/status', requireRole(...MANAGER), ctrl.approveReq);
router.put('/:id/issue', requireRole(...MANAGER), ctrl.issueReq);

module.exports = router;
