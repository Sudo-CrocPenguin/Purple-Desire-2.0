const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre del producto es requerido'],
        trim: true,
        maxlength: [100, 'El nombre no puede exceder 100 caracteres']
    },
    desc: {
        type: String,
        required: [true, 'La descripción es requerida'],
        maxlength: [500, 'La descripción no puede exceder 500 caracteres']
    },
    precio: {
        type: Number,
        required: [true, 'El precio es requerido'],
        min: [0, 'El precio debe ser mayor a 0']
    },
    categoria: {
        type: String,
        required: [true, 'La categoría es requerida'],
        enum: ['juguetes', 'lenceria', 'bienestar']
    },
    img: {
        type: String,
        required: [true, 'La imagen es requerida']
    },
    stock: {
        type: Number,
        required: [true, 'El stock es requerido'],
        default: 10,
        min: [0, 'El stock no puede ser negativo']
    },
    activo: {
        type: Boolean,
        default: true
    },
    ventasCount: {
        type: Number,
        default: 0
    },
    fechaCreacion: {
        type: Date,
        default: Date.now
    },
    ultimaActualizacion: {
        type: Date,
        default: Date.now
    }
});

// Middleware para actualizar la fecha de modificación
productSchema.pre('save', function(next) {
    this.ultimaActualizacion = Date.now();
    next();
});

// Índice para búsqueda
productSchema.index({ nombre: 'text', desc: 'text' });

module.exports = mongoose.model('Product', productSchema);