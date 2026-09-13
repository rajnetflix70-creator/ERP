const service = require('./service');
const { logAudit } = require('../../services/auditService');

async function getPRs(req, res, next) {
  try { res.json(await service.getPRs()); } catch(e) { next(e); }
}

async function createPR(req, res, next) {
  try {
    const result = await service.createPR(req.body, req.user?.id);
    logAudit({
      req,
      module: 'PROCUREMENT',
      action: 'CREATE_PR',
      entityType: 'PurchaseRequest',
      entityId: result.id,
      entityNumber: result.pr_number,
      details: `Created purchase request ${result.pr_number} with ${req.body.items?.length || 0} items`
    });
    res.status(201).json(result);
  } catch(e) { next(e); }
}

async function approvePR(req, res, next) {
  try {
    const result = await service.approvePR(req.params.id, req.user?.id, req.body.status);
    logAudit({
      req,
      module: 'PROCUREMENT',
      action: `PR_${(req.body.status || 'UPDATED').toUpperCase()}`,
      entityType: 'PurchaseRequest',
      entityId: req.params.id,
      details: `Purchase Request status updated to ${req.body.status}`
    });
    res.json(result);
  } catch(e) { next(e); }
}

async function getPOs(req, res, next) {
  try { res.json(await service.getPOs()); } catch(e) { next(e); }
}

async function createPO(req, res, next) {
  try {
    const result = await service.createPO(req.body, req.user?.id);
    logAudit({
      req,
      module: 'PROCUREMENT',
      action: 'CREATE_PO',
      entityType: 'PurchaseOrder',
      entityId: result.id,
      entityNumber: result.po_number,
      details: `Created Purchase Order ${result.po_number} with ${req.body.items?.length || 0} items`
    });
    res.status(201).json(result);
  } catch(e) { next(e); }
}

async function updatePOStatus(req, res, next) {
  try {
    const result = await service.updatePOStatus(req.params.id, req.body.status, req.user?.id);
    logAudit({
      req,
      module: 'PROCUREMENT',
      action: `PO_${(req.body.status || 'UPDATED').toUpperCase()}`,
      entityType: 'PurchaseOrder',
      entityId: req.params.id,
      details: `Purchase Order status changed to ${req.body.status}`
    });
    res.json(result);
  } catch(e) { next(e); }
}

async function getGRNs(req, res, next) {
  try { res.json(await service.getGRNs()); } catch(e) { next(e); }
}

async function createGRN(req, res, next) {
  try {
    const result = await service.createGRN(req.body, req.user?.id);
    logAudit({
      req,
      module: 'PROCUREMENT',
      action: 'CREATE_GRN',
      entityType: 'GRN',
      entityId: req.body.po_id,
      details: `Goods Received Note processed for PO (items received: ${req.body.items?.length || 0})`
    });
    res.status(201).json(result);
  } catch(e) { next(e); }
}

module.exports = {
  getPRs, createPR, approvePR,
  getPOs, createPO, updatePOStatus,
  getGRNs, createGRN
};
