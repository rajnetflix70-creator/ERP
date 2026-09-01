const service = require('./service');

async function getPRs(req, res, next) {
  try { res.json(await service.getPRs()); } catch(e) { next(e); }
}

async function createPR(req, res, next) {
  try { res.status(201).json(await service.createPR(req.body, req.user.id)); } catch(e) { next(e); }
}

async function approvePR(req, res, next) {
  try { res.json(await service.approvePR(req.params.id, req.user.id, req.body.status)); } catch(e) { next(e); }
}

async function getPOs(req, res, next) {
  try { res.json(await service.getPOs()); } catch(e) { next(e); }
}

async function createPO(req, res, next) {
  try { res.status(201).json(await service.createPO(req.body, req.user.id)); } catch(e) { next(e); }
}

async function updatePOStatus(req, res, next) {
  try { res.json(await service.updatePOStatus(req.params.id, req.body.status, req.user.id)); } catch(e) { next(e); }
}

async function createGRN(req, res, next) {
  try { res.status(201).json(await service.createGRN(req.body, req.user.id)); } catch(e) { next(e); }
}

module.exports = {
  getPRs, createPR, approvePR,
  getPOs, createPO, updatePOStatus,
  createGRN
};
