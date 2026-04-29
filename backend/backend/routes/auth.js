const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// POST - Registro
router.post('/register', async (req, res) => {
    try {
        const { alias, email, password, rol } = req.body;
        
        // Verificar si el alias ya existe
        const userExists = await User.findOne({ alias });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'El alias ya está en uso'
            });
        }
        
        const user = await User.create({
            alias,
            email,
            password,
            rol: rol || 'cliente'
        });
        
        // Crear token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );
        
        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                alias: user.alias,
                email: user.email,
                rol: user.rol
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// POST - Login
router.post('/login', async (req, res) => {
    try {
        const { alias, password } = req.body;
        
        // Verificar usuario
        const user = await User.findOne({ alias }).select('+password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }
        
        // Verificar contraseña
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }
        
        // Actualizar última conexión
        user.ultimaConexion = Date.now();
        await user.save();
        
        // Crear token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );
        
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                alias: user.alias,
                email: user.email,
                rol: user.rol,
                ultimaConexion: user.ultimaConexion
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// GET - Obtener perfil del usuario autenticado
router.get('/me', protect, async (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});

module.exports = router;