const router = require('express').Router();
const ctrl = require('./controller');

// Category CRUD
router.get('/categories', ctrl.getCategories);
router.post('/categories', ctrl.createCategory);
router.put('/categories/:id', ctrl.updateCategory);
router.delete('/categories/:id', ctrl.deleteCategory);

// Brand CRUD
router.get('/brands', ctrl.getBrands);
router.post('/brands', ctrl.createBrand);
router.put('/brands/:id', ctrl.updateBrand);
router.delete('/brands/:id', ctrl.deleteBrand);

// Material CRUD
router.get('/materials', ctrl.getMaterials);
router.post('/materials', ctrl.createMaterial);
router.put('/materials/:id', ctrl.updateMaterial);
router.delete('/materials/:id', ctrl.deleteMaterial);

// Purchase Order CRUD
router.get('/purchase-orders', ctrl.getPurchaseOrders);
router.post('/purchase-orders', ctrl.createPurchaseOrder);
router.delete('/purchase-orders/:id', ctrl.deletePurchaseOrder);

// Return Order CRUD
router.get('/return-orders', ctrl.getReturnOrders);
router.post('/return-orders', ctrl.createReturnOrder);
router.delete('/return-orders/:id', ctrl.deleteReturnOrder);

module.exports = router;
