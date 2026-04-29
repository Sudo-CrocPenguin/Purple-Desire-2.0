const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    alias: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 20
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        select: false // No incluir en consultas por defecto
    },
    role: {
        type: String,
        enum: ['customer', 'vendor', 'admin'],
        default: 'customer'
    },
    // Datos de envío (opcionales para autocompletado)
    shippingInfo: {
        address: String,
        city: {
            type: String,
            enum: [
                'Medellín', 'Bello', 'Itagüí', 'Envigado',
                'Sabaneta', 'Copacabana', 'La Estrella',
                'Girardota', 'Caldas', 'Barbosa'
            ]
        },
        phone: String
    },
    // Datos de pago (encriptados)
    paymentInfo: {
        cardLastFour: String,
        cardBrand: String,
        billingAddress: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: Date,
    refreshToken: String
}, {
    timestamps: true
});

// Encriptar contraseña antes de guardar
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Método para generar respuesta segura (sin datos sensibles)
userSchema.methods.toSafeObject = function() {
    const user = this.toObject();
    delete user.password;
    delete user.refreshToken;
    delete user.__v;
    return user;
};

module.exports = mongoose.model('User', userSchema);