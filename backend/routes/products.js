const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');

// GET - Obtener todos los productos (público)
router.get('/', async (req, res) => {
    try {
        let query = {};
        
        // Filtros
        if (req.query.categoria) {
            query.categoria = req.query.categoria;
        }
        
        if (req.query.activo !== undefined) {
            query.activo = req.query.activo === 'true';
        } else {
            query.activo = true; // Por defecto solo mostrar activos
        }
        
        // Búsqueda por texto
        if (req.query.search) {
            query.$text = { $search: req.query.search };
        }
        
        // Ordenamiento
        let sort = {};
        if (req.query.sort === 'precio_asc') sort.precio = 1;
        else if (req.query.sort === 'precio_desc') sort.precio = -1;
        else if (req.query.sort === 'nombre') sort.nombre = 1;
        else if (req.query.sort === 'ventas') sort.ventasCount = -1;
        else sort.fechaCreacion = -1;
        
        const products = await Product.find(query).sort(sort);
        
        res.json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// GET - Obtener un producto por ID
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// POST - Crear nuevo producto (solo vendedor/admin)
router.post('/', protect, authorize('vendedor', 'admin'), async (req, res) => {
    try {
        const product = await Product.create(req.body);
        
        res.status(201).json({
            success: true,
            message: 'Producto creado exitosamente',
            data: product
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }
        
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// PUT - Actualizar producto
router.put('/:id', protect, authorize('vendedor', 'admin'), async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }
        
        res.json({
            success: true,
            message: 'Producto actualizado exitosamente',
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// DELETE - Eliminar producto (soft delete)
router.delete('/:id', protect, authorize('vendedor', 'admin'), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }
        
        // Soft delete - marcar como inactivo
        product.activo = false;
        await product.save();
        
        res.json({
            success: true,
            message: 'Producto desactivado exitosamente'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// PATCH - Actualizar stock
router.patch('/:id/stock', protect, authorize('vendedor', 'admin'), async (req, res) => {
    try {
        const { cantidad } = req.body;
        
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }
        
        product.stock += cantidad;
        if (product.stock < 0) {
            return res.status(400).json({
                success: false,
                message: 'Stock insuficiente'
            });
        }
        
        await product.save();
        
        res.json({
            success: true,
            message: `Stock actualizado. Nuevo stock: ${product.stock}`,
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;