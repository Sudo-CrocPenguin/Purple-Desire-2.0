const express = require('express');
const router = express.Router();
const { protect, authorize, isVendorOrAdmin } = require('../middleware/auth');
const {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    getLowStockProducts,
    bulkUpdateStock
} = require('../controllers/productController');

// Rutas públicas
router.get('/', getProducts);
router.get('/:id', getProduct);

// Rutas protegidas para vendedores y admins
router.use(protect);
router.post('/', isVendorOrAdmin, createProduct);
router.put('/:id', isVendorOrAdmin, updateProduct);
router.delete('/:id', isVendorOrAdmin, deleteProduct);

// Rutas específicas de stock para vendedores
router.patch('/:id/stock', isVendorOrAdmin, updateStock);
router.get('/inventory/low-stock', isVendorOrAdmin, getLowStockProducts);
router.post('/bulk-update-stock', isVendorOrAdmin, bulkUpdateStock);

module.exports = router;