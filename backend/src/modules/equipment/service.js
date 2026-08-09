const db = require('../../db');

async function listCategories() {
  return db('equipment_categories');
}

async function listItems(filters = {}) {
  let query = db('equipment_items')
    .join('equipment_categories', 'equipment_items.category_id', 'equipment_categories.id')
    .select('equipment_items.*', 'equipment_categories.name as category_name');
  
  if (filters.category_id) query = query.where('equipment_items.category_id', filters.category_id);
  if (filters.item_type) query = query.where('equipment_items.item_type', filters.item_type);
  
  return query;
}

async function createItem(data) {
  const [item] = await db('equipment_items').insert(data).returning('*');
  return item;
}

async function getItem(id) {
  const item = await db('equipment_items')
    .join('equipment_categories', 'equipment_items.category_id', 'equipment_categories.id')
    .where('equipment_items.id', id)
    .select('equipment_items.*', 'equipment_categories.name as category_name')
    .first();
  if (!item) {
    const err = new Error('Equipment item not found');
    err.statusCode = 404;
    throw err;
  }
  return item;
}

async function updateItem(id, data) {
  const [updated] = await db('equipment_items').where({ id }).update(data).returning('*');
  if (!updated) {
    const err = new Error('Equipment item not found');
    err.statusCode = 404;
    throw err;
  }
  return updated;
}

async function getSiteAllocations(siteId) {
  return db('equipment_site_allocations')
    .join('equipment_items', 'equipment_site_allocations.equipment_item_id', 'equipment_items.id')
    .join('equipment_categories', 'equipment_items.category_id', 'equipment_categories.id')
    .where('equipment_site_allocations.site_id', siteId)
    .select(
      'equipment_site_allocations.*',
      'equipment_items.name',
      'equipment_items.asset_code',
      'equipment_items.item_type',
      'equipment_items.unit',
      'equipment_items.reorder_level',
      'equipment_categories.name as category_name'
    );
}

async function recordTransaction(data, handledByUserId) {
  return db.transaction(async (trx) => {
    if (['issue', 'damaged', 'lost', 'transfer'].includes(data.transaction_type) && !data.from_site_id) {
      throw Object.assign(new Error('from_site_id is required for this transaction type'), { statusCode: 400 });
    }
    if (['restock', 'return', 'transfer'].includes(data.transaction_type) && !data.to_site_id) {
      throw Object.assign(new Error('to_site_id is required for this transaction type'), { statusCode: 400 });
    }

    const [tx] = await trx('stock_transactions').insert({
      ...data,
      handled_by: handledByUserId
    }).returning('*');

    async function updateAllocation(siteId, quantityDelta) {
      const allocation = await trx('equipment_site_allocations')
        .where({ equipment_item_id: data.equipment_item_id, site_id: siteId })
        .forUpdate()
        .first();

      if (!allocation) {
        if (quantityDelta < 0) {
          throw Object.assign(new Error('Insufficient stock at site'), { statusCode: 400 });
        }
        await trx('equipment_site_allocations').insert({
          equipment_item_id: data.equipment_item_id,
          site_id: siteId,
          quantity: quantityDelta
        });
      } else {
        const newQty = parseFloat(allocation.quantity) + quantityDelta;
        if (newQty < 0) {
          throw Object.assign(new Error('Insufficient stock at site'), { statusCode: 400 });
        }
        await trx('equipment_site_allocations')
          .where({ id: allocation.id })
          .update({ quantity: newQty, updated_at: trx.fn.now() });
      }
    }

    if (['issue', 'damaged', 'lost'].includes(data.transaction_type)) {
      await updateAllocation(data.from_site_id, -data.quantity);
    } else if (['restock', 'return'].includes(data.transaction_type)) {
      await updateAllocation(data.to_site_id, data.quantity);
    } else if (data.transaction_type === 'transfer') {
      await updateAllocation(data.from_site_id, -data.quantity);
      await updateAllocation(data.to_site_id, data.quantity);
    }

    return tx;
  });
}

async function getLowStockAlerts(siteId) {
  let query = db('equipment_site_allocations')
    .join('equipment_items', 'equipment_site_allocations.equipment_item_id', 'equipment_items.id')
    .join('sites', 'equipment_site_allocations.site_id', 'sites.id')
    .where('equipment_items.item_type', 'consumable')
    .andWhereRaw('equipment_site_allocations.quantity <= equipment_items.reorder_level')
    .select(
      'equipment_site_allocations.*',
      'equipment_items.name',
      'equipment_items.reorder_level',
      'equipment_items.unit',
      'sites.name as site_name'
    );
  
  if (siteId) {
    query = query.where('equipment_site_allocations.site_id', siteId);
  }
  
  return query;
}

async function getTransactionHistory(filters = {}) {
  let query = db('stock_transactions')
    .join('equipment_items', 'stock_transactions.equipment_item_id', 'equipment_items.id')
    .join('users as handler', 'stock_transactions.handled_by', 'handler.id')
    .leftJoin('users as receiver', 'stock_transactions.issued_to_user_id', 'receiver.id')
    .leftJoin('sites as from_site', 'stock_transactions.from_site_id', 'from_site.id')
    .leftJoin('sites as to_site', 'stock_transactions.to_site_id', 'to_site.id')
    .select(
      'stock_transactions.*',
      'equipment_items.name as item_name',
      'handler.full_name as handled_by_name',
      'receiver.full_name as issued_to_name',
      'from_site.name as from_site_name',
      'to_site.name as to_site_name'
    )
    .orderBy('transaction_date', 'desc');

  if (filters.site_id) {
    query = query.where(function() {
      this.where('stock_transactions.from_site_id', filters.site_id)
        .orWhere('stock_transactions.to_site_id', filters.site_id);
    });
  }
  if (filters.equipment_item_id) {
    query = query.where('stock_transactions.equipment_item_id', filters.equipment_item_id);
  }

  return query;
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
