const knex = require('../db');

// --- Categories ---
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await knex('store_categories').orderBy('id', 'asc');
    res.json({ success: true, data: categories });
  } catch (err) { next(err); }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { name, short_name, status } = req.body;
    const [id] = await knex('store_categories').insert({ name, short_name, status: status || 'Active' }).returning('id');
    const created = await knex('store_categories').where({ id: typeof id === 'object' ? id.id : id }).first();
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, short_name, status } = req.body;
    await knex('store_categories').where({ id }).update({ name, short_name, status, updated_at: knex.fn.now() });
    const updated = await knex('store_categories').where({ id }).first();
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    await knex('store_categories').where({ id }).del();
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (err) { next(err); }
};

// --- Brands ---
exports.getBrands = async (req, res, next) => {
  try {
    const brands = await knex('store_brands').orderBy('id', 'asc');
    res.json({ success: true, data: brands });
  } catch (err) { next(err); }
};

exports.createBrand = async (req, res, next) => {
  try {
    const { name, short_name, status } = req.body;
    const [id] = await knex('store_brands').insert({ name, short_name, status: status || 'Active' }).returning('id');
    const created = await knex('store_brands').where({ id: typeof id === 'object' ? id.id : id }).first();
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
};

exports.updateBrand = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, short_name, status } = req.body;
    await knex('store_brands').where({ id }).update({ name, short_name, status, updated_at: knex.fn.now() });
    const updated = await knex('store_brands').where({ id }).first();
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

exports.deleteBrand = async (req, res, next) => {
  try {
    const { id } = req.params;
    await knex('store_brands').where({ id }).del();
    res.json({ success: true, message: 'Brand deleted successfully' });
  } catch (err) { next(err); }
};

// --- Materials ---
exports.getMaterials = async (req, res, next) => {
  try {
    const materials = await knex('store_materials')
      .leftJoin('store_categories', 'store_materials.category_id', 'store_categories.id')
      .leftJoin('store_brands', 'store_materials.brand_id', 'store_brands.id')
      .select(
        'store_materials.*',
        'store_categories.name as category_name',
        'store_brands.name as brand_name'
      )
      .orderBy('store_materials.id', 'asc');
    res.json({ success: true, data: materials });
  } catch (err) { next(err); }
};

exports.createMaterial = async (req, res, next) => {
  try {
    const { category_id, brand_id, name, quantity, unit, min_quantity, allow_exceed_qty, status } = req.body;
    const [id] = await knex('store_materials').insert({
      category_id: category_id || null,
      brand_id: brand_id || null,
      name,
      quantity: quantity || 0,
      unit: unit || 'pcs',
      min_quantity: min_quantity || 0,
      allow_exceed_qty: allow_exceed_qty !== undefined ? allow_exceed_qty : true,
      status: status || 'Active'
    }).returning('id');
    const created = await knex('store_materials').where({ id: typeof id === 'object' ? id.id : id }).first();
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
};

exports.updateMaterial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { category_id, brand_id, name, quantity, unit, min_quantity, allow_exceed_qty, status } = req.body;
    await knex('store_materials').where({ id }).update({
      category_id: category_id || null,
      brand_id: brand_id || null,
      name,
      quantity: quantity || 0,
      unit: unit || 'pcs',
      min_quantity: min_quantity || 0,
      allow_exceed_qty: allow_exceed_qty !== undefined ? allow_exceed_qty : true,
      status: status || 'Active',
      updated_at: knex.fn.now()
    });
    const updated = await knex('store_materials').where({ id }).first();
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

exports.deleteMaterial = async (req, res, next) => {
  try {
    const { id } = req.params;
    await knex('store_materials').where({ id }).del();
    res.json({ success: true, message: 'Material deleted successfully' });
  } catch (err) { next(err); }
};

// --- Purchase Orders ---
exports.getPurchaseOrders = async (req, res, next) => {
  try {
    const orders = await knex('store_purchase_orders').orderBy('id', 'desc');
    for (let order of orders) {
      order.items = await knex('store_po_items')
        .leftJoin('store_materials', 'store_po_items.material_id', 'store_materials.id')
        .select('store_po_items.*', 'store_materials.name as material_name')
        .where('store_po_items.po_id', order.id);
    }
    res.json({ success: true, data: orders });
  } catch (err) { next(err); }
};

exports.createPurchaseOrder = async (req, res, next) => {
  try {
    const { po_number, supplier_name, po_date, mtc_file_url, items } = req.body;
    const [id] = await knex('store_purchase_orders').insert({
      po_number,
      supplier_name,
      po_date: po_date || knex.fn.now(),
      mtc_file_url: mtc_file_url || null,
      status: 'Pending'
    }).returning('id');

    const poId = typeof id === 'object' ? id.id : id;

    if (Array.isArray(items) && items.length > 0) {
      const itemRows = items.map(item => ({
        po_id: poId,
        material_id: item.material_id,
        quantity: item.quantity
      }));
      await knex('store_po_items').insert(itemRows);
    }

    const created = await knex('store_purchase_orders').where({ id: poId }).first();
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
};

exports.deletePurchaseOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    await knex('store_purchase_orders').where({ id }).del();
    res.json({ success: true, message: 'Purchase Order deleted successfully' });
  } catch (err) { next(err); }
};

// --- Return Orders ---
exports.getReturnOrders = async (req, res, next) => {
  try {
    const returns = await knex('store_purchase_returns')
      .leftJoin('projects', 'store_purchase_returns.project_id', 'projects.id')
      .select('store_purchase_returns.*', 'projects.name as project_name', 'projects.code as project_code')
      .orderBy('store_purchase_returns.id', 'desc');

    for (let ret of returns) {
      ret.items = await knex('store_return_items')
        .leftJoin('store_materials', 'store_return_items.material_id', 'store_materials.id')
        .select('store_return_items.*', 'store_materials.name as material_name')
        .where('store_return_items.return_id', ret.id);
    }
    res.json({ success: true, data: returns });
  } catch (err) { next(err); }
};

exports.createReturnOrder = async (req, res, next) => {
  try {
    const { project_id, return_number, return_date, reason, items } = req.body;
    const [id] = await knex('store_purchase_returns').insert({
      project_id: project_id || null,
      return_number: return_number || `RET-${Date.now()}`,
      return_date: return_date || knex.fn.now(),
      reason: reason || '',
      status: 'Pending'
    }).returning('id');

    const returnId = typeof id === 'object' ? id.id : id;

    if (Array.isArray(items) && items.length > 0) {
      const itemRows = items.map(item => ({
        return_id: returnId,
        material_id: item.material_id,
        quantity: item.quantity
      }));
      await knex('store_return_items').insert(itemRows);
    }

    const created = await knex('store_purchase_returns').where({ id: returnId }).first();
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
};

exports.deleteReturnOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    await knex('store_purchase_returns').where({ id }).del();
    res.json({ success: true, message: 'Return order deleted successfully' });
  } catch (err) { next(err); }
};
