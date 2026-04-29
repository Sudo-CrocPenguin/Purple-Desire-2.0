const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Proteger rutas - Verificar token JWT
exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No autorizado - Token no proporcionado'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);
        
        if (!req.user || !req.user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado o desactivado'
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'No autorizado - Token inválido'
        });
    }
};

// Autorizar por roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Rol ${req.user.role} no autorizado para esta acción`
            });
        }
        next();
    };
};

// Verificar si es vendedor o admin
exports.isVendorOrAdmin = (req, res, next) => {
    if (!['vendor', 'admin'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado - Se requiere rol de vendedor o administrador'
        });
    }
    next();
};

// Middleware para logging de acciones de vendedor
exports.logVendorAction = (action) => {
    return (req, res, next) => {
        console.log(`[VENDOR ACTION] ${new Date().toISOString()} - ${req.user.alias} - ${action}`);
        next();
    };
};