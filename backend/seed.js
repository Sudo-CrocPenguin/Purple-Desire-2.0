/**
 * SCRIPT DE SEMILLA - Crear usuarios iniciales
 * Ejecutar: node seed.js
 * 
 * Ubicación: PURPLE DESIRE 2.0/backend/seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB conectado para seed'))
    .catch(err => {
        console.error('❌ Error conectando a MongoDB:', err.message);
        process.exit(1);
    });

const seedData = async () => {
    try {
        // Limpiar datos existentes
        console.log('🗑️  Eliminando datos anteriores...');
        await User.deleteMany({});
        await Product.deleteMany({});
        
        // ==========================================
        // CREAR USUARIOS
        // ==========================================
        console.log('👤 Creando usuarios...');
        
        const users = await User.create([
            {
                alias: 'admin',
                email: 'admin@purpledesire.com',
                password: 'Admin123!',
                rol: 'admin'
            },
            {
                alias: 'vendedor1',
                email: 'vendedor1@purpledesire.com',
                password: 'Vendedor123!',
                rol: 'vendedor'
            },
            {
                alias: 'vendedor2',
                email: 'vendedor2@purpledesire.com',
                password: 'Vendedor123!',
                rol: 'vendedor'
            }
        ]);
        
        console.log('✅ Usuarios creados:');
        users.forEach(user => {
            console.log(`   - ${user.alias} (${user.rol})`);
        });
        
        // ==========================================
        // CREAR PRODUCTOS INICIALES
        // ==========================================
        console.log('📦 Creando productos iniciales...');
        
        const products = await Product.create([
            {
                nombre: "Condones DUO Hot Action",
                desc: "Sensación caliente excitante. Caja x 3.",
                precio: 22000,
                categoria: "bienestar",
                img: "images/duo.png",
                stock: 50
            },
            {
                nombre: "Condones Poseidon Classic",
                desc: "Látex natural, máxima seguridad. Caja x 3.",
                precio: 16000,
                categoria: "bienestar",
                img: "images/poseidon.png",
                stock: 40
            },
            {
                nombre: "Condones Trojan Clásico-ENZ",
                desc: "Lubricados, receptáculo especial. La marca #1.",
                precio: 28000,
                categoria: "bienestar",
                img: "images/trojan.png",
                stock: 35
            },
            {
                nombre: "Lubricante Crema de Whisky",
                desc: "Sen Intimo. Saborizado, sensación caliente. 30ml.",
                precio: 60000,
                categoria: "bienestar",
                img: "images/lub-whisky.png",
                stock: 25
            },
            {
                nombre: "Consolador Neón Púrpura",
                desc: "Diseño ergonómico translúcido con base de succión.",
                precio: 152000,
                categoria: "juguetes",
                img: "images/dildo-purpura.png",
                stock: 15
            },
            {
                nombre: "Dildo Realista Thin Dong",
                desc: "Textura piel realista de 7 pulgadas. Base adherente.",
                precio: 168000,
                categoria: "juguetes",
                img: "images/dildo-realista.png",
                stock: 12
            },
            {
                nombre: "Succionador Louviva",
                desc: "Estimulador de clítoris de silicona suave. Recargable.",
                precio: 220000,
                categoria: "juguetes",
                img: "images/succionador-rosa.jpg",
                stock: 8
            },
            {
                nombre: "Body Lencería Pasión",
                desc: "Atrevido body de encaje rojo con transparencias.",
                precio: 140000,
                categoria: "lenceria",
                img: "images/lenceria-roja.jpg",
                stock: 20
            },
            {
                nombre: "Conjunto Encaje Negro",
                desc: "Dos piezas con diseño de tiras en la espalda.",
                precio: 160000,
                categoria: "lenceria",
                img: "images/lenceria-negra.jpg",
                stock: 18
            },
            {
                nombre: "Conjunto Dominatrix Cuero",
                desc: "Estilo látex/cuero negro con faldita y ligueros.",
                precio: 192000,
                categoria: "lenceria",
                img: "images/lenceria-cuero.jpg",
                stock: 10
            }
        ]);
        
        console.log('✅ Productos creados:', products.length);
        
        // ==========================================
        // RESUMEN FINAL
        // ==========================================
        console.log('\n' + '='.repeat(50));
        console.log('📋 CREDENCIALES DE ACCESO');
        console.log('='.repeat(50));
        console.log('🔑 Admin:     admin      / Admin123!');
        console.log('🔑 Vendedor1: vendedor1  / Vendedor123!');
        console.log('🔑 Vendedor2: vendedor2  / Vendedor123!');
        console.log('='.repeat(50));
        console.log('\n🌐 Panel de Vendedor: http://localhost:5000/vendor');
        console.log('🏪 Tienda: http://localhost:5000');
        console.log('='.repeat(50));
        
        // Cerrar conexión
        await mongoose.connection.close();
        console.log('\n✅ Seed completado exitosamente!');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error durante el seed:', error.message);
        await mongoose.connection.close();
        process.exit(1);
    }
};

// Ejecutar el seed
seedData();