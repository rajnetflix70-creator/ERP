const router = require('express').Router();
const ctrl = require('./controller');
const requireRole = require('../../middleware/rbac');

const ADMIN = ['super_admin', 'company_admin'];

router.get('/stats', ctrl.getStats);
router.get('/', ctrl.listProjects);
router.get('/:id', ctrl.getProject);
router.get('/:id/details', ctrl.getProjectDetails);

/* Slabs */
router.get('/:id/slabs', ctrl.listSlabs);
router.post('/:id/slabs', ctrl.upsertSlab);
router.put('/:id/slabs/batch', ctrl.batchUpdateSlabs);
router.delete('/:id/slabs/:slabId', requireRole(...ADMIN), ctrl.deleteSlab);

/* Drawings */
router.get('/:id/drawings', ctrl.listDrawings);
router.post('/:id/drawings', ctrl.createDrawing);
router.put('/:id/drawings/:drawingId', ctrl.updateDrawing);
router.delete('/:id/drawings/:drawingId', requireRole(...ADMIN), ctrl.deleteDrawing);

/* Supervisors */
router.get('/:id/supervisors', ctrl.listSupervisors);
router.post('/:id/supervisors', ctrl.addSupervisor);
router.delete('/:id/supervisors/:supervisorId', requireRole(...ADMIN), ctrl.removeSupervisor);

/* Commercials */
router.get('/:id/commercials', ctrl.getCommercials);
router.put('/:id/commercials', ctrl.upsertCommercials);

router.post('/', requireRole(...ADMIN), ctrl.createProject);
router.put('/:id', requireRole(...ADMIN), ctrl.updateProject);
router.delete('/:id', requireRole(...ADMIN), ctrl.deleteProject);

module.exports = router;

