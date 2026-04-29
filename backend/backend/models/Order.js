const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    producto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    cantidad: {
        type: Number,
        required: true,
        min: 1
    },
    precio: {
        type: Number,
        required: true
    }
});

const orderSchema = new mongoose.Schema({
    cliente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    items: [orderItemSchema],
    direccionEnvio: {
        nombre: String,
        direccion: String,
        ciudad: String,
        telefono: String
    },
    emailCliente: {
        type: String,
        required: true
    },
    metodoPago: {
        type: String,
        enum: ['Visa', 'Mastercard', 'Amex', 'PayPal', 'PSE'],
        default: 'Visa'
    },
    subtotal: {
        type: Number,
        required: true
    },
    impuestos: {
        type: Number,
        default: 0
    },
    costoEnvio: {
        type: Number,
        default: 0
    },
    total: {
        type: Number,
        required: true
    },
    estado: {
        type: String,
        enum: ['pendiente', 'confirmado', 'empacando', 'en_camino', 'entregado', 'cancelado'],
        default: 'pendiente'
    },
    codigoRastreo: {
        type: String,
        unique: true
    },
    notas: {
        type: String,
        maxlength: 500
    },
    historialEstados: [{
        estado: String,
        fecha: {
            type: Date,
            default: Date.now
        },
        actualizadoPor: String
    }],
    fechaPedido: {
        type: Date,
        default: Date.now
    },
    fechaActualizacion: {
        type: Date,
        default: Date.now
    }
});

// Generar código de rastreo único
orderSchema.pre('save', async function(next) {
    if (!this.codigoRastreo) {
        this.codigoRastreo = 'PD-' + Date.now().toString(36).toUpperCase() + '-' + 
                           Math.random().toString(36).substr(2, 4).toUpperCase();
    }
    this.fechaActualizacion = Date.now();
    next();
});

// Índices
orderSchema.index({ codigoRastreo: 1 });
orderSchema.index({ estado: 1 });
orderSchema.index({ fechaPedido: -1 });

module.exports = mongoose.model('Order', orderSchema);