const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno
dotenv.config();

// Importar rutas
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');

// Inicializar Express
const app = express();

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (imágenes)
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Ruta de health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'success',
        message: 'Purple Desire API funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

// Manejo de errores 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
    });
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Error del servidor',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// Conexión a MongoDB y inicio del servidor
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('🟢 MongoDB conectado exitosamente');
        
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`🟣 Purple Desire API corriendo en puerto ${PORT}`);
            console.log(`📦 Ambiente: ${process.env.NODE_ENV}`);
        });
    } catch (error) {
        console.error('🔴 Error al conectar MongoDB:', error.message);
        process.exit(1);
    }
};

connectDB();

module.exports = app;