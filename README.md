# Documentación Técnica y Funcional del Proyecto

## Sistema de E-Commerce: "Purple Desire"

**Tipo de Proyecto:** Aplicación Web de Comercio Electrónico (Boutique Sensual Anónima)  
**Tecnologías:** HTML5, CSS3, Vanilla JavaScript (DOM & LocalStorage)

---

## 1. Introducción y Justificación del Proyecto

"Purple Desire" es un prototipo funcional de una tienda en línea enfocada en la venta de productos de bienestar adulto, lencería y juguetes.

### Problema a resolver
El principal obstáculo en esta industria es:
- Vergüenza al comprar
- Falta de privacidad
- Miedo al juicio social

### Solución propuesta
Se diseñó una plataforma basada en:
- Navegación anónima
- Interfaz discreta
- Experiencia centrada en privacidad

El objetivo es reducir la fricción de compra y aumentar la confianza del usuario.

---

## 2. Tecnologías Utilizadas

El proyecto sigue un enfoque **Vanilla Web Development**, sin frameworks.

- **HTML5**
  - Estructura completa de la aplicación
  - Uso de modales, formularios y secciones semánticas

- **CSS3**
  - Diseño responsive
  - Variables globales (`:root`)
  - Animaciones y efectos visuales (Glassmorphism, neón)

- **JavaScript (ES6+)**
  - Lógica completa de la aplicación
  - Manipulación del DOM
  - Eventos
  - Persistencia con LocalStorage

- **FontAwesome**
  - Iconos visuales para mejorar la UI

---

## 3. Arquitectura del Proyecto (Modular)

El proyecto está dividido en **módulos independientes**, cada uno con una responsabilidad clara.

### Estructura general


/PURPLE-DESIRE-2.0
│
├── index.html
├── style.css
├── app.js
│
├── /js
│ ├── config.js
│ ├── ui.js
│ ├── productos.js
│ ├── carrito.js
│ ├── DocumentacionJs.txt
│
├── /css
│ ├── variables.css
│ ├── components.css
│ ├── header-footer.css
│ ├── cart.css
│ ├── hero-slider.css
│ ├── products.css
│ ├── modals-extra.css
│ ├── DocumentacionCss.txt
│
├── /images
└── /payment


---

## 4. Documentación por Módulos

Cada módulo del sistema tiene su propia documentación detallada en archivos `.txt`.

### Importante
- **DocumentacionCss.txt**
  - Explica toda la organización del CSS
  - Cómo modificar estilos
  - Cómo funcionan las clases

- **DocumentacionJs.txt**
  - Explica toda la lógica de JavaScript
  - Flujo completo de la aplicación
  - Interacción entre módulos

Esto permite que cualquier persona pueda entender el proyecto módulo por módulo sin necesidad de leer todo el código.

---

## 5. Arquitectura de Almacenamiento (Persistencia de Datos)

Se utiliza **LocalStorage** para simular una base de datos.

### Claves utilizadas

- `pd_products_cop`
  - Guarda todos los productos (incluyendo los creados por admin)

- `pd_cart_cop`
  - Guarda el carrito de compras

- `pd_wishlist`
  - Guarda productos favoritos

- `isAdultVerified` (sessionStorage)
  - Guarda si el usuario confirmó ser mayor de edad

---

## 6. Módulos y Funcionalidades Principales

### A. Módulo de Inicialización (app.js)

Es el **orquestador principal**:
- Espera a que cargue el DOM
- Inicializa:
  - Productos
  - Carrito
  - Wishlist
  - Carrusel
- Ejecuta verificaciones (edad)

---

### B. Módulo de Configuración (config.js)

Contiene:
- Estado global:
  - Usuario
  - Carrito
  - Wishlist
  - Categoría activa
- Datos base:
  - Lista de productos por defecto

Es la "base de datos" del sistema.

---

### C. Módulo de Interfaz (ui.js)

Controla:
- Modales (abrir/cerrar)
- Toasts (notificaciones)
- Alertas personalizadas
- Carrusel de productos
- Modo discreto (SFW)

Es el encargado de todo lo visual dinámico.

---

### D. Módulo de Productos (productos.js)

Responsable de:
- Renderizar productos en pantalla
- Filtrar productos:
  - Por categoría
  - Por texto
- Ordenar productos por precio
- CRUD de productos (admin)

---

### E. Módulo de Carrito (carrito.js)

Controla:
- Agregar productos al carrito
- Cambiar cantidades
- Eliminar productos
- Cálculo de:
  - Subtotal
  - Impuestos
  - Envío
  - Total

También incluye:
- Wishlist
- Checkout
- Autenticación básica (alias)

---

## 7. Flujo General de la Aplicación

1. Carga la página
2. Se ejecuta `app.js`
3. Se valida edad
4. Se renderizan productos
5. Usuario interactúa:
   - Filtra
   - Agrega al carrito
   - Guarda en wishlist
6. Puede hacer checkout
7. Se simula pago y rastreo

---

## 8. Estrategias de Psicología de Ventas

El sistema incluye técnicas de marketing:

### 1. FOMO (Urgencia)
- Mensajes como:
  - "Últimas unidades"
- Generados dinámicamente

### 2. Prueba Social
- Reseñas simuladas
- Usuarios anónimos

### 3. Refuerzo positivo
- Toasts
- Alertas visuales

---

## 9. Diseño Responsivo

- Uso de:
  - Flexbox
  - CSS Grid
- Adaptable a:
  - Móviles
  - Tablets
  - Escritorio

---

## 10. Características Especiales

- Navegación anónima
- Empaque ciego (concepto UX)
- Carrito lateral dinámico
- Barra de progreso de envío
- Modal de rastreo simulado
- Panel de administración oculto

---

## 11. Mantenibilidad y Escalabilidad

El proyecto está preparado para crecer:

- Código modular
- Separación de responsabilidades
- Cada archivo tiene una función clara
- Documentación independiente por módulo

Esto permite:
- Agregar nuevas funcionalidades fácilmente
- Cambiar partes sin romper otras
- Entender el sistema rápidamente

---

## 12. Conclusión

"Purple Desire" no es solo una tienda, es una demostración de:

- Arquitectura modular en frontend
- Manejo completo del DOM
- Persistencia sin backend
- Diseño UX enfocado en privacidad

Combina:
- Desarrollo técnico sólido
- Diseño centrado en usuario
- Estrategias de conversión

Es un proyecto completo a nivel de frontend que simula un sistema real de e-commerce.