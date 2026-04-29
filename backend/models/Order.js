const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true
        },
        subtotal: {
            type: Number,
            required: true
        }
    }],
    shippingAddress: {
        address: { type: String, required: true },
        city: { 
            type: String, 
            required: true,
            enum: [
                'Medellín', 'Bello', 'Itagüí', 'Envigado',
                'Sabaneta', 'Copacabana', 'La Estrella',
                'Girardota', 'Caldas', 'Barbosa'
            ]
        },
        specialInstructions: String
    },
    paymentInfo: {
        method: {
            type: String,
            enum: ['visa', 'mastercard', 'amex', 'paypal', 'pse'],
            required: true
        },
        lastFourDigits: String,
        transactionId: String,
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'refunded'],
            default: 'pending'
        }
    },
    pricing: {
        subtotal: { type: Number, required: true },
        tax: { type: Number, required: true },
        shipping: { type: Number, required: true },
        discount: { type: Number, default: 0 },
        total: { type: Number, required: true }
    },
    status: {
        type: String,
        enum: [
            'pending',      // Recibido pero sin procesar
            'confirmed',    // Confirmado
            'processing',   // Empacando
            'shipped',      // En camino
            'delivered',    // Entregado
            'cancelled',    // Cancelado
            'refunded'      // Reembolsado
        ],
        default: 'pending'
    },
    statusHistory: [{
        status: String,
        date: {
            type: Date,
            default: Date.now
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        notes: String
    }],
    trackingNumber: {
        type: String,
        unique: true,
        sparse: true
    },
    estimatedDelivery: Date,
    deliveredAt: Date,
    isGift: {
        type: Boolean,
        default: false
    },
    giftMessage: String,
    notes: String
}, {
    timestamps: true
});

// Generar número de pedido automáticamente
orderSchema.pre('save', async function(next) {
    if (!this.orderNumber) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 9000) + 1000;
        this.orderNumber = `PD-${year}${month}-${random}`;
    }

    // Registrar cambio de estado
    if (this.isModified('status')) {
        this.statusHistory.push({
            status: this.status,
            updatedBy: this._updatedBy || this.customer
        });
    }

    next();
});

// Pre-save hook para actualizar stock cuando cambia el estado
orderSchema.pre('save', async function(next) {
    if (this.isModified('status')) {
        const Product = mongoose.model('Product');
        
        // Si se cancela o reembolsa, devolver stock
        if (['cancelled', 'refunded'].includes(this.status)) {
            for (const item of this.items) {
                await Product.findByIdAndUpdate(item.product, {
                    $inc: { stock: item.quantity }
                });
            }
        }
    }
    next();
});

module.exports = mongoose.model('Order', orderSchema);