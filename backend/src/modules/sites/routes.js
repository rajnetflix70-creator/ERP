const express = require('express');
const controller = require('./controller');
const requireRole = require('../../middleware/rbac');

const router = express.Router();

router.get('/', controller.listSites);
router.post('/', requireRole('company_admin', 'super_admin'), controller.createSite);
router.get('/:id', controller.getSite);
router.put('/:id', requireRole('company_admin', 'super_admin'), controller.updateSite);
router.delete('/:id', requireRole('company_admin', 'super_admin'), controller.deleteSite);

router.post('/:id/assignments', requireRole('company_admin', 'super_admin'), controller.assignUser);
router.get('/:id/assignments', requireRole('site_supervisor', 'company_admin', 'super_admin'), controller.listAssignments);

module.exports = router;
