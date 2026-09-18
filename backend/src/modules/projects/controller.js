const service = require('./service');

async function listProjects(req, res, next) {
  try {
    const filters = {
      status: req.query.status || null,
      search: req.query.search || null,
      is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined,
    };
    res.json(await service.listProjects(filters));
  } catch (e) { next(e); }
}

async function getProject(req, res, next) {
  try { res.json(await service.getProject(req.params.id)); } catch (e) { next(e); }
}

async function createProject(req, res, next) {
  try { res.status(201).json(await service.createProject(req.body)); } catch (e) { next(e); }
}

async function updateProject(req, res, next) {
  try { res.json(await service.updateProject(req.params.id, req.body)); } catch (e) { next(e); }
}

async function deleteProject(req, res, next) {
  try { res.json(await service.deleteProject(req.params.id)); } catch (e) { next(e); }
}

async function getProjectDetails(req, res, next) {
  try { res.json(await service.getProjectWithDetails(req.params.id)); } catch (e) { next(e); }
}

/* Slabs */
async function listSlabs(req, res, next) {
  try { res.json(await service.getSlabs(req.params.id)); } catch (e) { next(e); }
}

async function upsertSlab(req, res, next) {
  try { res.json(await service.upsertSlab(req.params.id, req.body)); } catch (e) { next(e); }
}

async function batchUpdateSlabs(req, res, next) {
  try { res.json(await service.batchUpdateSlabs(req.params.id, req.body.slabs || req.body)); } catch (e) { next(e); }
}

async function deleteSlab(req, res, next) {
  try { res.json(await service.deleteSlab(req.params.id, req.params.slabId)); } catch (e) { next(e); }
}

/* Drawings */
async function listDrawings(req, res, next) {
  try { res.json(await service.getDrawings(req.params.id)); } catch (e) { next(e); }
}

async function createDrawing(req, res, next) {
  try { res.status(201).json(await service.createDrawing(req.params.id, req.body)); } catch (e) { next(e); }
}

async function updateDrawing(req, res, next) {
  try { res.json(await service.updateDrawing(req.params.id, req.params.drawingId, req.body)); } catch (e) { next(e); }
}

async function deleteDrawing(req, res, next) {
  try { res.json(await service.deleteDrawing(req.params.id, req.params.drawingId)); } catch (e) { next(e); }
}

/* Supervisors */
async function listSupervisors(req, res, next) {
  try { res.json(await service.getSupervisors(req.params.id)); } catch (e) { next(e); }
}

async function addSupervisor(req, res, next) {
  try { res.status(201).json(await service.addSupervisor(req.params.id, req.body)); } catch (e) { next(e); }
}

async function removeSupervisor(req, res, next) {
  try { res.json(await service.removeSupervisor(req.params.id, req.params.supervisorId)); } catch (e) { next(e); }
}

/* Commercials */
async function getCommercials(req, res, next) {
  try { res.json(await service.getCommercials(req.params.id)); } catch (e) { next(e); }
}

async function upsertCommercials(req, res, next) {
  try { res.json(await service.upsertCommercials(req.params.id, req.body)); } catch (e) { next(e); }
}

module.exports = {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getStats,
  getProjectDetails,
  listSlabs,
  upsertSlab,
  batchUpdateSlabs,
  deleteSlab,
  listDrawings,
  createDrawing,
  updateDrawing,
  deleteDrawing,
  listSupervisors,
  addSupervisor,
  removeSupervisor,
  getCommercials,
  upsertCommercials,
};

