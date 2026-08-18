const svc = require('./service');
const {
  createMaterialSchema, updateMaterialSchema,
  createRequestSchema, approveRequestSchema, issueRequestSchema, consumptionSchema,
} = require('./validators');

const err = (res, e) => res.status(e.statusCode || 500).json({ error: true, message: e.message });

/* Material master */
exports.list       = async (req, res) => { try { res.json(await svc.listMaterials(req.query)); } catch(e) { err(res,e); } };
exports.get        = async (req, res) => { try { res.json(await svc.getMaterial(req.params.id)); } catch(e) { err(res,e); } };
exports.create     = async (req, res) => { try { const {error,value} = createMaterialSchema.validate(req.body); if(error) return res.status(400).json({error:true,message:error.details[0].message}); res.status(201).json(await svc.createMaterial(value)); } catch(e) { err(res,e); } };
exports.update     = async (req, res) => { try { const {error,value} = updateMaterialSchema.validate(req.body); if(error) return res.status(400).json({error:true,message:error.details[0].message}); res.json(await svc.updateMaterial(req.params.id, value)); } catch(e) { err(res,e); } };
exports.remove     = async (req, res) => { try { res.json(await svc.deleteMaterial(req.params.id)); } catch(e) { err(res,e); } };

/* Material requests */
exports.listReqs   = async (req, res) => { try { res.json(await svc.listRequests(req.query)); } catch(e) { err(res,e); } };
exports.createReq  = async (req, res) => { try { const {error,value} = createRequestSchema.validate(req.body); if(error) return res.status(400).json({error:true,message:error.details[0].message}); res.status(201).json(await svc.createRequest(value, req.user?.id)); } catch(e) { err(res,e); } };
exports.approveReq = async (req, res) => { try { const {error,value} = approveRequestSchema.validate(req.body); if(error) return res.status(400).json({error:true,message:error.details[0].message}); res.json(await svc.approveRequest(req.params.id, value, req.user?.id)); } catch(e) { err(res,e); } };
exports.issueReq   = async (req, res) => { try { const {error,value} = issueRequestSchema.validate(req.body); if(error) return res.status(400).json({error:true,message:error.details[0].message}); res.json(await svc.issueRequest(req.params.id, value, req.user?.id)); } catch(e) { err(res,e); } };

/* Consumption */
exports.logConsume = async (req, res) => { try { const {error,value} = consumptionSchema.validate(req.body); if(error) return res.status(400).json({error:true,message:error.details[0].message}); res.status(201).json(await svc.recordConsumption(value, req.user?.id)); } catch(e) { err(res,e); } };
exports.listConsumeHistory = async (req, res) => { try { res.json(await svc.listConsumption(req.query)); } catch(e) { err(res,e); } };

/* Stock */
exports.siteStock   = async (req, res) => { try { res.json(await svc.getSiteStock(req.query)); } catch(e) { err(res,e); } };
exports.lowStock    = async (req, res) => { try { res.json(await svc.getLowStockAlerts()); } catch(e) { err(res,e); } };
