const Joi = require('joi');

const createItem = Joi.object({
  name: Joi.string().required(),
  asset_code: Joi.string().allow('', null),
  category_id: Joi.number().integer().required(),
  item_type: Joi.string().valid('asset', 'consumable').required(),
  unit: Joi.string().required(),
  reorder_level: Joi.number().min(0).default(0),
  total_quantity: Joi.number().min(0).default(0),
  notes: Joi.string().allow('', null)
}).unknown(true);

const updateItem = Joi.object({
  name: Joi.string(),
  asset_code: Joi.string().allow('', null),
  category_id: Joi.number().integer(),
  item_type: Joi.string().valid('asset', 'consumable'),
  unit: Joi.string(),
  reorder_level: Joi.number().min(0),
  total_quantity: Joi.number().min(0),
  notes: Joi.string().allow('', null)
}).unknown(true);

const stockTransaction = Joi.object({
  equipment_item_id: Joi.string().uuid().required(),
  from_site_id: Joi.string().uuid().allow(null),
  to_site_id: Joi.string().uuid().allow(null),
  transaction_type: Joi.string().valid('issue', 'return', 'transfer', 'restock', 'damaged', 'lost').required(),
  quantity: Joi.number().greater(0).required(),
  issued_to_user_id: Joi.string().uuid().allow(null),
  remarks: Joi.string().allow('', null)
}).unknown(true);

module.exports = {
  createItem,
  updateItem,
  stockTransaction
};
