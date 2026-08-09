const service = require('./service');
const validators = require('./validators');

async function listCategories(req, res, next) {
  try {
    const categories = await service.listCategories();
    res.json(categories);
  } catch (err) {
    next(err);
  }
}

async function listItems(req, res, next) {
  try {
    const items = await service.listItems(req.query);
    res.json(items);
  } catch (err) {
    next(err);
  }
}

async function createItem(req, res, next) {
  try {
    const data = await validators.createItem.validateAsync(req.body);
    const item = await service.createItem(data);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

async function getItem(req, res, next) {
  try {
    const item = await service.getItem(req.params.id);
    res.json(item);
  } catch (err) {
    next(err);
  }
}

async function updateItem(req, res, next) {
  try {
    const data = await validators.updateItem.validateAsync(req.body);
    const item = await service.updateItem(req.params.id, data);
    res.json(item);
  } catch (err) {
    next(err);
  }
}

async function getSiteAllocations(req, res, next) {
  try {
    const allocations = await service.getSiteAllocations(req.params.siteId);
    res.json(allocations);
  } catch (err) {
    next(err);
  }
}

async function recordTransaction(req, res, next) {
  try {
    const data = await validators.stockTransaction.validateAsync(req.body);
    const tx = await service.recordTransaction(data, req.user.id);
    res.status(201).json(tx);
  } catch (err) {
    next(err);
  }
}

async function getLowStockAlerts(req, res, next) {
  try {
    const alerts = await service.getLowStockAlerts(req.query.site_id);
    res.json(alerts);
  } catch (err) {
    next(err);
  }
}

async function getTransactionHistory(req, res, next) {
  try {
    const history = await service.getTransactionHistory(req.query);
    res.json(history);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listCategories,
  listItems,
  createItem,
  getItem,
  updateItem,
  getSiteAllocations,
  recordTransaction,
  getLowStockAlerts,
  getTransactionHistory
};
