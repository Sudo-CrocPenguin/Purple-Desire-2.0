# 🟣 Purple Desire 2.0 - Boutique Sensual Anónima

**Sistema de E-Commerce con Backend y Panel de Vendedor**

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.x-brightgreen)](https://mongodb.com)
[![Express](https://img.shields.io/badge/Express-4.x-lightgrey)](https://expressjs.com)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)](https://developer.mozilla.org/es/docs/Web/JavaScript)

---

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Requisitos Previos](#-requisitos-previos)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Instalación Paso a Paso](#-instalación-paso-a-paso)
- [Credenciales de Acceso](#-credenciales-de-acceso)
- [URLs de Acceso](#-urls-de-acceso)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Arquitectura](#-arquitectura)
- [Funcionalidades](#-funcionalidades)
- [API Endpoints](#-api-endpoints)
- [Solución de Problemas](#-solución-de-problemas)

---

## 📝 Descripción

"Purple Desire" es una aplicación web completa de comercio electrónico enfocada en la venta de productos de bienestar adulto, lencería y juguetes. El sistema está diseñado con un enfoque en la privacidad y discreción del usuario.

### Características principales:
- 🏪 Tienda online con catálogo de productos
- 👔 Panel de vendedor para gestión completa
- 📦 Control de inventario con stock
- 🚚 Seguimiento de pedidos por estados
- 🔐 Sistema de autenticación con roles
- 👁️ Modo discreto (SFW - Safe For Work)
- 💾 Persistencia en base de datos MongoDB
- 📱 Diseño responsive

---

## 💻 Requisitos Previos

### Software necesario:

| Software | Versión | Descarga |
|----------|---------|----------|
| **Node.js** | 18.x o 20.x LTS | [nodejs.org](https://nodejs.org) |
| **MongoDB** | 7.x o superior | [mongodb.com](https://www.mongodb.com/try/download/community) |
| **Navegador** | Chrome/Firefox/Edge | Cualquiera moderno |
| **Git** | 2.x o superior | [git-scm.com](https://git-scm.com) (opcional) |

### Verificar instalación:
```bash
node --version    # Debe mostrar v18.x.x o v20.x.x
npm --version     # Debe mostrar 9.x.x o 10.x.x
mongosh --version # Debe mostrar la versión de MongoDB


PURPLE DESIRE 2.0/
│
├── backend/                          # Servidor y API
│   ├── config/
│   │   └── db.js                     # Conexión a MongoDB
│   ├── middleware/
│   │   └── auth.js                   # Autenticación JWT
│   ├── models/
│   │   ├── Product.js                # Modelo de productos
│   │   ├── Order.js                  # Modelo de pedidos
│   │   └── User.js                   # Modelo de usuarios
│   ├── routes/
│   │   ├── auth.js                   # Rutas de autenticación
│   │   ├── orders.js                 # Rutas de pedidos
│   │   └── products.js               # Rutas de productos
│   ├── .env                          # Variables de entorno
│   ├── package.json                  # Dependencias
│   ├── seed.js                       # Script para datos iniciales
│   └── server.js                     # Servidor principal
│
├── frontend/                         # Aplicación cliente
│   ├── css/
│   │   ├── base.css                  # Estilos base y reset
│   │   ├── components.css            # Botones, inputs, toasts
│   │   ├── layout.css                # Header, hero, grid, footer
│   │   ├── modals.css                # Modales y paneles
│   │   └── variables.css             # Colores y temas
│   ├── images/                       # Imágenes de productos
│   ├── js/
│   │   ├── data.js                   # Datos de respaldo
│   │   └── main.js                   # Lógica principal
│   ├── payment/                      # Iconos de métodos de pago
│   ├── vendor-panel/                 # Panel de vendedor
│   │   ├── vendor.html               # Interfaz del panel
│   │   ├── vendor.css                # Estilos del panel
│   │   └── vendor.js                 # Lógica del panel
│   └── index.html                    # Tienda principal
│
└── README.md                         # Este archivo


# 🚀 Instalación Paso a Paso

## Paso 1: Instalar Node.js
- Ve a https://nodejs.org  
- Descarga la versión **LTS (recomendada)**  
- Instala con opciones por defecto  
- Verifica:
```bash
node --version
npm --version

Paso 2: Instalar MongoDB
Opción A - MongoDB Local (Recomendado):
Ve a https://mongodb.com/try/download/community
Descarga el instalador según tu sistema operativo
Instala seleccionando Complete
Marca Install MongoD as a Service
Verifica que el servicio esté corriendo
Opción B - MongoDB Atlas (Nube gratuita):
Ve a https://mongodb.com/atlas
Crea una cuenta gratuita
Crea un cluster (M0 Sandbox gratis)
Crea usuario de base de datos
Permite acceso desde: 0.0.0.0/0
Copia la URL de conexión


Paso 3: Configurar variables de entorno

Archivo: backend/.env


PORT=5000
MONGODB_URI=mongodb://localhost:27017/purple_desire
JWT_SECRET=purple_desire_secret_key_2024
JWT_EXPIRE=7d


Si usas Atlas:

MONGODB_URI=mongodb+srv://USUARIO:PASSWORD@CLUSTER.mongodb.net/purple_desire

Paso 4: Instalar dependencias

cd "PURPLE DESIRE 2.0/backend"
npm install

Paso 5: Crear datos iniciales (Seed)

node seed.js

Crea:

3 usuarios (admin, vendedor1, vendedor2)
10 productos de prueba

🔑 Credenciales de Acceso
Rol	Usuario	Contraseña	Acceso
👑 Administrador	admin	Admin123!	Tienda + Panel
👔 Vendedor 1	vendedor1	Vendedor123!	Tienda + Panel
👔 Vendedor 2	vendedor2	Vendedor123!	Tienda + Panel

Paso 6: Iniciar el servidor

npm run dev

Deberías ver:

✅ MongoDB conectado
🚀 Servidor corriendo en http://localhost:5000
📦 API: http://localhost:5000/api
🏪 Tienda: http://localhost:5000
👨‍💼 Panel Vendedor: http://localhost:5000/vendor


Paso 7: Abrir en el navegador

🏪 Tienda: http://localhost:5000
👔 Panel Vendedor: http://localhost:5000/vendor




🌐 URLs de Acceso
Servicio	URL
🏪 Tienda	http://localhost:5000

👔 Panel Vendedor	http://localhost:5000/vendor

📦 API Productos	http://localhost:5000/api/products

📋 API Pedidos	http://localhost:5000/api/orders

🔐 API Auth	http://localhost:5000/api/auth

🛠️ Tecnologías Utilizadas
Frontend
HTML5
CSS3 (Grid, Flexbox, Animaciones)
JavaScript ES6+
FontAwesome 6
Backend
Node.js
Express.js
MongoDB + Mongoose
JWT
bcryptjs
Nodemon
🏗️ Arquitectura
Frontend (Modular)
Productos
Carrito
Usuario
Pedidos
Admin
UI
SFW Mode
Backend (API)

server.js
├── /api/auth
├── /api/products
├── /api/orders
└── /api/orders/stats/dashboard


⚡ Funcionalidades
Tienda
Catálogo de productos
Filtros y búsqueda
Carrito lateral
Wishlist
Checkout
Seguimiento de pedidos
Modo discreto (SFW)
Perfil desechable
Responsive design
Panel Vendedor
Dashboard
Gestión de pedidos
Estados de pedidos
CRUD productos
Control de stock
Alertas de inventario
Sistema
JWT Auth
Roles (admin, vendedor, cliente)
MongoDB persistente
API REST
Modo offline básico
📡 API Endpoints
Auth
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
Productos
GET /api/products
POST /api/products
PUT /api/products/:id
DELETE /api/products/:id
Pedidos
GET /api/orders
POST /api/orders
PUT /api/orders/:id/estado
🔧 Solución de Problemas
npm no funciona

Instalar Node.js y reiniciar terminal

MongoDB no conecta

Verificar servicio MongoDB activo

Puerto ocupado

Cambiar en .env:

PORT=5001

Error de módulos


rm -rf node_modules package-lock.json
npm install



🔄 Comandos Útiles

npm run dev
npm start
node seed.js
npm update
npm list --depth=0


