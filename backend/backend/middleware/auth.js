const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Proteger rutas
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
        req.user = await User.findById(decoded.id).select('-password');
        
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado'
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

// Autorizar roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.rol)) {
            return res.status(403).json({
                success: false,
                message: `El rol ${req.user.rol} no tiene permiso para esta acción`
            });
        }
        next();
    };
};