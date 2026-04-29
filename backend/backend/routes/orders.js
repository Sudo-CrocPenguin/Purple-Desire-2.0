const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');

// GET - Obtener todos los pedidos (vendedor/admin)
router.get('/', protect, authorize('vendedor', 'admin'), async (req, res) => {
    try {
        let query = {};
        
        // Filtros para vendedor
        if (req.query.estado) {
            query.estado = req.query.estado;
        }
        
        if (req.query.search) {
            query.codigoRastreo = { $regex: req.query.search, $options: 'i' };
        }
        
        // Paginación
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        
        const orders = await Order.find(query)
            .populate('items.producto', 'nombre precio img')
            .sort({ fechaPedido: -1 })
            .skip(skip)
            .limit(limit);
        
        const total = await Order.countDocuments(query);
        
        res.json({
            success: true,
            count: orders.length,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            data: orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// GET - Obtener un pedido específico
router.get('/:id', protect, authorize('vendedor', 'admin'), async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('items.producto', 'nombre precio img desc');
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// POST - Crear nuevo pedido (desde la tienda)
router.post('/', async (req, res) => {
    try {
        const { items, direccionEnvio, emailCliente, metodoPago } = req.body;
        
        // Verificar stock y calcular totales
        let subtotal = 0;
        const orderItems = [];
        
        for (const item of items) {
            const product = await Product.findById(item.producto);
            
            if (!product || !product.activo) {
                return res.status(400).json({
                    success: false,
                    message: `Producto ${item.producto} no disponible`
                });
            }
            
            if (product.stock < item.cantidad) {
                return res.status(400).json({
                    success: false,
                    message: `Stock insuficiente para ${product.nombre}`
                });
            }
            
            // Reducir stock
            product.stock -= item.cantidad;
            product.ventasCount += item.cantidad;
            await product.save();
            
            const precio = product.precio;
            subtotal += precio * item.cantidad;
            
            orderItems.push({
                producto: item.producto,
                cantidad: item.cantidad,
                precio: precio
            });
        }
        
        const impuestos = subtotal * 0.10;
        const costoEnvio = subtotal >= 150000 ? 0 : 15000;
        const total = subtotal + impuestos + costoEnvio;
        
        const order = await Order.create({
            items: orderItems,
            direccionEnvio,
            emailCliente,
            metodoPago: metodoPago || 'Visa',
            subtotal,
            impuestos,
            costoEnvio,
            total,
            historialEstados: [{
                estado: 'pendiente',
                actualizadoPor: 'Sistema'
            }]
        });
        
        // Emitir evento de nuevo pedido (para Socket.IO si se usa)
        if (req.app.get('io')) {
            req.app.get('io').emit('nuevoPedido', order);
        }
        
        res.status(201).json({
            success: true,
            message: 'Pedido creado exitosamente',
            data: order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// PUT - Actualizar estado del pedido
router.put('/:id/estado', protect, authorize('vendedor', 'admin'), async (req, res) => {
    try {
        const { estado, notas } = req.body;
        
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado'
            });
        }
        
        // Validar transiciones de estado
        const estadosValidos = {
            'pendiente': ['confirmado', 'cancelado'],
            'confirmado': ['empacando', 'cancelado'],
            'empacando': ['en_camino', 'cancelado'],
            'en_camino': ['entregado'],
            'entregado': [],
            'cancelado': []
        };
        
        if (!estadosValidos[order.estado].includes(estado)) {
            return res.status(400).json({
                success: false,
                message: `No se puede cambiar de ${order.estado} a ${estado}`
            });
        }
        
        // Si cancela, devolver stock
        if (estado === 'cancelado' && order.estado !== 'entregado') {
            for (const item of order.items) {
                const product = await Product.findById(item.producto);
                if (product) {
                    product.stock += item.cantidad;
                    product.ventasCount -= item.cantidad;
                    await product.save();
                }
            }
        }
        
        order.estado = estado;
        if (notas) order.notas = notas;
        order.historialEstados.push({
            estado,
            actualizadoPor: req.user.alias || 'Vendedor',
            fecha: Date.now()
        });
        
        await order.save();
        
        res.json({
            success: true,
            message: `Pedido actualizado a ${estado}`,
            data: order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// GET - Dashboard del vendedor
router.get('/stats/dashboard', protect, authorize('vendedor', 'admin'), async (req, res) => {
    try {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        const totalPedidos = await Order.countDocuments();
        const pedidosHoy = await Order.countDocuments({
            fechaPedido: { $gte: hoy }
        });
        const pedidosPendientes = await Order.countDocuments({ estado: 'pendiente' });
        const pedidosEnCamino = await Order.countDocuments({ estado: 'en_camino' });
        
        // Ingresos totales
        const ingresos = await Order.aggregate([
            { $match: { estado: { $ne: 'cancelado' } } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);
        
        const ingresosTotales = ingresos.length > 0 ? ingresos[0].total : 0;
        
        // Ingresos de hoy
        const ingresosHoy = await Order.aggregate([
            { $match: { 
                estado: { $ne: 'cancelado' },
                fechaPedido: { $gte: hoy }
            }},
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);
        
        const ingresosHoyTotal = ingresosHoy.length > 0 ? ingresosHoy[0].total : 0;
        
        // Productos más vendidos
        const topProductos = await Product.find({ activo: true })
            .sort({ ventasCount: -1 })
            .limit(5)
            .select('nombre ventasCount stock');
        
        // Productos con bajo stock
        const bajoStock = await Product.find({ 
            activo: true, 
            stock: { $lt: 5 } 
        }).select('nombre stock');
        
        res.json({
            success: true,
            data: {
                totalPedidos,
                pedidosHoy,
                pedidosPendientes,
                pedidosEnCamino,
                ingresosTotales,
                ingresosHoyTotal,
                topProductos,
                bajoStock,
                resumenEstados: await Order.aggregate([
                    { $group: { 
                        _id: '$estado', 
                        count: { $sum: 1 },
                        total: { $sum: '$total' }
                    }}
                ])
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;