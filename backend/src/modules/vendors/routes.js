const router = require('express').Router();
const erpExtra = require('../equipment_machines/erpExtraService');
const requireRole = require('../../middleware/rbac');

const SUPERVISOR = ['super_admin', 'company_admin', 'project_manager', 'site_supervisor'];

router.get('/', async (req, res, next) => {
  try { res.json(await erpExtra.listVendors()); } catch (e) { next(e); }
});

router.post('/', requireRole(...SUPERVISOR), async (req, res, next) => {
  try { res.status(201).json(await erpExtra.createVendor(req.body)); } catch (e) { next(e); }
});

router.put('/:id', requireRole(...SUPERVISOR), async (req, res, next) => {
  try { res.json(await erpExtra.updateVendor(req.params.id, req.body)); } catch (e) { next(e); }
});

router.delete('/:id', requireRole(...SUPERVISOR), async (req, res, next) => {
  try { res.json(await erpExtra.deleteVendor(req.params.id)); } catch (e) { next(e); }
});

module.exports = router;
