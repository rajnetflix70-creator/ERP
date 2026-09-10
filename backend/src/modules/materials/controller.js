const svc = require('./service');
const {
  createMaterialSchema, updateMaterialSchema,
  createRequestSchema, approveRequestSchema, issueRequestSchema, consumptionSchema,
} = require('./validators');

const err = (res, e) => res.status(e.statusCode || 500).json({ error: true, message: e.message });

const { logAudit } = require('../../services/auditService');

/* Material master */
exports.list       = async (req, res) => { try { res.json(await svc.listMaterials(req.query)); } catch(e) { err(res,e); } };
exports.get        = async (req, res) => { try { res.json(await svc.getMaterial(req.params.id)); } catch(e) { err(res,e); } };
exports.create     = async (req, res) => {
  try {
    const {error,value} = createMaterialSchema.validate(req.body);
    if(error) return res.status(400).json({error:true,message:error.details[0].message});
    const result = await svc.createMaterial(value);
    logAudit({ req, module: 'MATERIALS', action: 'CREATE_MATERIAL', entityNumber: result.material_code, details: `Added material: ${result.name}` });
    res.status(201).json(result);
  } catch(e) { err(res,e); }
};
exports.update     = async (req, res) => {
  try {
    const {error,value} = updateMaterialSchema.validate(req.body);
    if(error) return res.status(400).json({error:true,message:error.details[0].message});
    const result = await svc.updateMaterial(req.params.id, value);
    logAudit({ req, module: 'MATERIALS', action: 'UPDATE_MATERIAL', entityId: req.params.id, details: `Updated material: ${result.name}` });
    res.json(result);
  } catch(e) { err(res,e); }
};
exports.remove     = async (req, res) => {
  try {
    const result = await svc.deleteMaterial(req.params.id);
    logAudit({ req, module: 'MATERIALS', action: 'DELETE_MATERIAL', entityId: req.params.id, details: `Deleted material ID: ${req.params.id}` });
    res.json(result);
  } catch(e) { err(res,e); }
};

/* Material requests */
exports.listReqs   = async (req, res) => { try { res.json(await svc.listRequests(req.query)); } catch(e) { err(res,e); } };
exports.createReq  = async (req, res) => {
  try {
    const {error,value} = createRequestSchema.validate(req.body);
    if(error) return res.status(400).json({error:true,message:error.details[0].message});
    const result = await svc.createRequest(value, req.user?.id);
    logAudit({ req, module: 'MATERIALS', action: 'CREATE_MATERIAL_REQUEST', entityId: result.id, details: `Created MR for qty ${value.qty_requested}` });
    res.status(201).json(result);
  } catch(e) { err(res,e); }
};
exports.approveReq = async (req, res) => {
  try {
    const {error,value} = approveRequestSchema.validate(req.body);
    if(error) return res.status(400).json({error:true,message:error.details[0].message});
    const result = await svc.approveRequest(req.params.id, value, req.user?.id);
    logAudit({ req, module: 'MATERIALS', action: `MR_${(value.status || 'UPDATED').toUpperCase()}`, entityId: req.params.id, details: `MR marked as ${value.status}` });
    res.json(result);
  } catch(e) { err(res,e); }
};
exports.issueReq   = async (req, res) => {
  try {
    const {error,value} = issueRequestSchema.validate(req.body);
    if(error) return res.status(400).json({error:true,message:error.details[0].message});
    const result = await svc.issueRequest(req.params.id, value, req.user?.id);
    logAudit({ req, module: 'INVENTORY', action: 'ISSUE_MATERIAL', entityId: req.params.id, details: `Issued qty ${value.qty_issued}` });
    res.json(result);
  } catch(e) { err(res,e); }
};

/* Consumption */
exports.logConsume = async (req, res) => {
  try {
    const {error,value} = consumptionSchema.validate(req.body);
    if(error) return res.status(400).json({error:true,message:error.details[0].message});
    const result = await svc.recordConsumption(value, req.user?.id);
    logAudit({ req, module: 'INVENTORY', action: 'RECORD_CONSUMPTION', details: `Recorded site consumption: qty ${value.qty_consumed}` });
    res.status(201).json(result);
  } catch(e) { err(res,e); }
};
exports.listConsumeHistory = async (req, res) => { try { res.json(await svc.listConsumption(req.query)); } catch(e) { err(res,e); } };

/* Stock */
exports.siteStock   = async (req, res) => { try { res.json(await svc.getSiteStock(req.query)); } catch(e) { err(res,e); } };
exports.lowStock    = async (req, res) => { try { res.json(await svc.getLowStockAlerts()); } catch(e) { err(res,e); } };
