const service = require('./service');
const validators = require('./validators');

async function listSites(req, res, next) {
  try {
    const sites = await service.listSites(req.user);
    res.json(sites);
  } catch (err) {
    next(err);
  }
}

async function createSite(req, res, next) {
  try {
    const data = await validators.createSite.validateAsync(req.body);
    const site = await service.createSite(data);
    res.status(201).json(site);
  } catch (err) {
    next(err);
  }
}

async function getSite(req, res, next) {
  try {
    const site = await service.getSite(req.params.id);
    res.json(site);
  } catch (err) {
    next(err);
  }
}

async function updateSite(req, res, next) {
  try {
    const data = await validators.updateSite.validateAsync(req.body);
    const site = await service.updateSite(req.params.id, data);
    res.json(site);
  } catch (err) {
    next(err);
  }
}

async function deleteSite(req, res, next) {
  try {
    await service.updateSite(req.params.id, { is_active: false });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function assignUser(req, res, next) {
  try {
    const data = await validators.assignUser.validateAsync(req.body);
    const assignment = await service.assignUser(req.params.id, data.user_id, data.assigned_from, data.assigned_to);
    res.status(201).json(assignment);
  } catch (err) {
    next(err);
  }
}

async function listAssignments(req, res, next) {
  try {
    const assignments = await service.listAssignments(req.params.id);
    res.json(assignments);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listSites,
  createSite,
  getSite,
  updateSite,
  deleteSite,
  assignUser,
  listAssignments
};
