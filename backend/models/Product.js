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
        min: [0, 'El precio no puede ser negativo']
    },
    categoria: {
        type: String,
        required: true,
        enum: ['juguetes', 'lenceria', 'bienestar']
    },
    img: {
        type: String,
        required: true,
        default: 'images/default-product.png'
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 10
    },
    featured: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tags: [String],
    specs: {
        material: String,
        dimensions: String,
        weight: String,
        color: String
    },
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    numReviews: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Índices para búsquedas rápidas
productSchema.index({ nombre: 'text', desc: 'text' });
productSchema.index({ categoria: 1 });
productSchema.index({ precio: 1 });

// Virtual para calcular si hay poco stock (FOMO)
productSchema.virtual('lowStock').get(function() {
    return this.stock <= 5;
});

// Virtual para el estado de disponibilidad
productSchema.virtual('availability').get(function() {
    if (this.stock === 0) return 'Agotado';
    if (this.stock <= 3) return 'Últimas unidades';
    if (this.stock <= 10) return 'Stock limitado';
    return 'Disponible';
});

module.exports = mongoose.model('Product', productSchema);