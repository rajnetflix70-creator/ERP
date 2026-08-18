const svc = require('./service');
const { createWorkPackageSchema, updateWorkPackageSchema, logProgressSchema } = require('./validators');

const handleError = (res, err) => res.status(err.statusCode || 500).json({ error: true, message: err.message });

exports.list = async (req, res) => {
  try { res.json(await svc.listWorkPackages(req.query)); } catch(e) { handleError(res, e); }
};

exports.kanban = async (req, res) => {
  try { res.json(await svc.getKanbanBoard(req.query.project_id)); } catch(e) { handleError(res, e); }
};

exports.get = async (req, res) => {
  try { res.json(await svc.getWorkPackage(req.params.id)); } catch(e) { handleError(res, e); }
};

exports.create = async (req, res) => {
  try {
    const { error, value } = createWorkPackageSchema.validate(req.body);
    if (error) return res.status(400).json({ error: true, message: error.details[0].message });
    res.status(201).json(await svc.createWorkPackage(value, req.user?.id));
  } catch(e) { handleError(res, e); }
};

exports.update = async (req, res) => {
  try {
    const { error, value } = updateWorkPackageSchema.validate(req.body);
    if (error) return res.status(400).json({ error: true, message: error.details[0].message });
    res.json(await svc.updateWorkPackage(req.params.id, value));
  } catch(e) { handleError(res, e); }
};

exports.remove = async (req, res) => {
  try { res.json(await svc.deleteWorkPackage(req.params.id)); } catch(e) { handleError(res, e); }
};

exports.logProgress = async (req, res) => {
  try {
    const { error, value } = logProgressSchema.validate(req.body);
    if (error) return res.status(400).json({ error: true, message: error.details[0].message });
    res.status(201).json(await svc.logProgress(req.params.id, value, req.user?.id));
  } catch(e) { handleError(res, e); }
};

exports.getProgressLogs = async (req, res) => {
  try { res.json(await svc.getProgressLogs(req.params.id)); } catch(e) { handleError(res, e); }
};
