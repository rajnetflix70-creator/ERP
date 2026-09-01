const service = require('./service');

async function getClients(req, res, next) {
  try { res.json(await service.getClients()); } catch(e) { next(e); }
}
async function createClient(req, res, next) {
  try { res.status(201).json(await service.createClient(req.body)); } catch(e) { next(e); }
}
async function updateClient(req, res, next) {
  try { res.json(await service.updateClient(req.params.id, req.body)); } catch(e) { next(e); }
}

async function getInvoices(req, res, next) {
  try { res.json(await service.getInvoices()); } catch(e) { next(e); }
}
async function getInvoiceById(req, res, next) {
  try { res.json(await service.getInvoiceById(req.params.id)); } catch(e) { next(e); }
}
async function createInvoice(req, res, next) {
  try { res.status(201).json(await service.createInvoice(req.body)); } catch(e) { next(e); }
}
async function updateInvoiceStatus(req, res, next) {
  try { res.json(await service.updateInvoiceStatus(req.params.id, req.body.status)); } catch(e) { next(e); }
}
async function recordPayment(req, res, next) {
  try { res.status(201).json(await service.recordPayment(req.body)); } catch(e) { next(e); }
}

module.exports = {
  getClients, createClient, updateClient,
  getInvoices, getInvoiceById, createInvoice, updateInvoiceStatus,
  recordPayment
};
