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

async function getStats(req, res, next) {
  try { res.json(await service.getStats()); } catch (e) { next(e); }
}

module.exports = { listProjects, getProject, createProject, updateProject, deleteProject, getStats };
