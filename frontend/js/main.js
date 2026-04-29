/**
 * IMPORTACIONES
 * Se trae la base de datos predefinida de productos como respaldo.
 */
import { defaultProducts } from './data.js';

// ==========================================
// 1. CONFIGURACIÓN DE LA API
// ==========================================
const API_URL = 'http://localhost:5000/api';

// ==========================================
// 2. ESTADO GLOBAL DE LA APLICACIÓN
// ==========================================
let currentUserRole = 'guest';
let currentAlias = 'Invitado';
let authToken = localStorage.getItem('pd_token') || null;

// Persistencia en LocalStorage
let cart = JSON.parse(localStorage.getItem('pd_cart_cop')) || [];
let wishlist = JSON.parse(localStorage.getItem('pd_wishlist')) || [];
let categoriaActual = 'todos';
let products = [];

// Objeto para auto-rellenar datos en checkout
let guestInfo = {
    email: '',
    address: '',
    city: '',
    cardNum: '',
    cardExp: '',
    cardCVC: ''
};

// ==========================================
// 3. INICIALIZACIÓN (Ciclo de vida)
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    window.scrollTo(0, 0);
    
    // Verificación de edad
    if (!sessionStorage.getItem('isAdultVerified')) {
        document.getElementById('ageModal').classList.add('active');
        document.body.classList.add('no-scroll');
    } else {
        document.getElementById('ageModal').classList.remove('active');
        document.body.classList.remove('no-scroll');
    }
    
    // Cargar productos desde la API
    await cargarProductosDesdeAPI();
    
    actualizarCarritoUI();
    actualizarWishlistUI();
    iniciarCarrusel();
    
    // Si hay token guardado, restaurar sesión
    if (authToken) {
        await restaurarSesion();
    }
});

// Evitar scroll previo al refrescar
window.onbeforeunload = function () {
    window.scrollTo(0, 0);
};

// ==========================================
// 4. CARGAR PRODUCTOS DESDE LA API
// ==========================================
async function cargarProductosDesdeAPI() {
    try {
        const response = await fetch(`${API_URL}/products`);
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            products = data.data;
        } else {
            // Si la API no responde, usar datos locales como respaldo
            products = JSON.parse(localStorage.getItem('pd_products_cop')) || defaultProducts;
            console.warn('⚠️ Usando datos locales como respaldo');
        }
    } catch (error) {
        // Si hay error de conexión, usar datos locales
        products = JSON.parse(localStorage.getItem('pd_products_cop')) || defaultProducts;
        console.warn('⚠️ Sin conexión al servidor. Usando datos locales.');
    }
    
    renderProducts(products);
}

// ==========================================
// 5. RESTAURAR SESIÓN GUARDADA
// ==========================================
async function restaurarSesion() {
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentAlias = data.user.alias;
            currentUserRole = data.user.rol;
            document.getElementById('userNameDisplay').innerText = currentAlias;
            
            if (currentUserRole === 'admin') {
                document.getElementById('btnAdminPanel').classList.remove('hidden');
            }
        } else {
            // Token inválido, limpiar
            localStorage.removeItem('pd_token');
            authToken = null;
        }
    } catch (error) {
        console.warn('No se pudo restaurar la sesión');
    }
}

// ==========================================
// 6. EVENTOS GENERALES Y SEGURIDAD SFW
// ==========================================

// Manejo del Modal de Control de Edad
document.getElementById('btnYes').onclick = () => {
    sessionStorage.setItem('isAdultVerified', 'true');
    document.getElementById('ageModal').classList.remove('active');
    document.body.classList.remove('no-scroll');
};

document.getElementById('btnNo').onclick = () => {
    window.location.href = "https://www.google.com/search?q=imagenes+de+gatitos+tiernos+jugando&tbm=isch";
};

// Listeners para búsqueda y ordenamiento
document.getElementById('searchInput').addEventListener('input', aplicarFiltros);
document.getElementById('sortSelect').addEventListener('change', aplicarFiltros);

/**
 * Botón de Pánico (Modo SFW - Safe For Work)
 */
let sfwEnabled = true;
window.toggleSFW = function () {
    sfwEnabled = !sfwEnabled;
    document.body.classList.toggle('sfw-mode', sfwEnabled);

    const icon = document.getElementById('sfwIcon');
    if (sfwEnabled) {
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
        window.mostrarToast("Modo Discreto Activado 👁️‍🗨️", "normal");
    } else {
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
        window.mostrarToast("Imágenes Visibles", "normal");
    }
};

// ==========================================
// 7. MODO INVITADO Y PERFIL DESECHABLE
// ==========================================
const authModal = document.getElementById('authModal');
const userNameDisplay = document.getElementById('userNameDisplay');

// Abrir modal de login
document.getElementById('btnLogin').onclick = () => {
    authModal.classList.add('active');
    document.body.classList.add('no-scroll');
};

// Generador de nombres aleatorios
document.getElementById('btnRandomAlias').onclick = () => {
    document.getElementById('alias').value = `Agent_${Math.floor(Math.random() * 9000) + 1000}`;
};

// Ingreso rápido sin guardar datos
document.getElementById('btnGuest').onclick = (e) => {
    e.preventDefault();
    currentUserRole = 'guest';
    currentAlias = 'Invitado';
    userNameDisplay.innerText = currentAlias;
    document.getElementById('btnAdminPanel').classList.add('hidden');
    authToken = null;
    localStorage.removeItem('pd_token');
    authModal.classList.remove('active');
    document.body.classList.remove('no-scroll');
    renderProducts(products);
};

// Ingreso con perfil
document.getElementById('authForm').onsubmit = async (e) => {
    e.preventDefault();
    const aliasInput = document.getElementById('alias').value.trim().toLowerCase();

    // Capturar datos del usuario
    guestInfo.email = document.getElementById('guestEmail').value.trim();
    guestInfo.address = document.getElementById('guestAddress').value.trim();
    guestInfo.city = document.getElementById('guestCity').value;
    guestInfo.cardNum = document.getElementById('guestCardNum').value.trim();
    guestInfo.cardExp = document.getElementById('guestCardExp').value.trim();
    guestInfo.cardCVC = document.getElementById('guestCardCVC').value.trim();

    // Intentar login o registro en la API
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                alias: aliasInput,
                password: aliasInput + '123'
            })
        });

        const data = await response.json();

        if (data.success) {
            // Login exitoso
            authToken = data.token;
            localStorage.setItem('pd_token', authToken);
            currentUserRole = data.user.rol;
            currentAlias = data.user.alias;
        } else {
            // Intentar registrar
            const registerResponse = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    alias: aliasInput,
                    email: guestInfo.email || `${aliasInput}@anon.com`,
                    password: aliasInput + '123',
                    rol: 'cliente'
                })
            });

            const registerData = await registerResponse.json();

            if (registerData.success) {
                authToken = registerData.token;
                localStorage.setItem('pd_token', authToken);
                currentUserRole = 'cliente';
                currentAlias = aliasInput;
            } else {
                // Si falla, entrar como invitado
                currentUserRole = 'guest';
                currentAlias = aliasInput || 'Invitado';
            }
        }
    } catch (error) {
        // Sin conexión, modo local
        if (aliasInput === 'admin') {
            currentUserRole = 'admin';
            currentAlias = 'Dueño';
            document.getElementById('btnAdminPanel').classList.remove('hidden');
        } else {
            currentUserRole = 'anonymous_user';
            currentAlias = aliasInput || 'Invitado';
        }
    }

    userNameDisplay.innerText = currentAlias;

    if (currentUserRole === 'admin') {
        document.getElementById('btnAdminPanel').classList.remove('hidden');
    } else {
        document.getElementById('btnAdminPanel').classList.add('hidden');
    }

    authModal.classList.remove('active');
    document.body.classList.remove('no-scroll');
    renderProducts(products);
};

// ==========================================
// 8. RENDERIZACIÓN DINÁMICA DE PRODUCTOS
// ==========================================
function renderProducts(arrayProductos) {
    const productGrid = document.getElementById('productGrid');
    productGrid.innerHTML = '';

    if (!arrayProductos || arrayProductos.length === 0) {
        productGrid.innerHTML = `<h3 style="color:var(--text-muted); grid-column: 1/-1; text-align:center;">No hay productos que coincidan.</h3>`;
        return;
    }

    arrayProductos.forEach(prod => {
        const div = document.createElement('div');
        div.classList.add('product-card', 'fade-in');

        // Botones de admin
        let adminHtml = currentUserRole === 'admin' ? `
            <div class="admin-controls">
                <button class="btn-icon" onclick="editarProducto('${prod._id || prod.id}'); event.stopPropagation();">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn-icon" onclick="eliminarProducto('${prod._id || prod.id}'); event.stopPropagation();">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        ` : '';

        let isWished = wishlist.includes(prod._id || prod.id);
        let heartClass = isWished ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
        let btnClass = isWished ? 'btn-wishlist active' : 'btn-wishlist';

        // FOMO (escasez simulada)
        let fomoOptions = [1, 2, 5, 10];
        let productId = prod._id || prod.id;
        let numericId = typeof productId === 'string' ? productId.length : productId;
        let unitsLeft = fomoOptions[numericId % fomoOptions.length];
        let fomoHtml = (numericId % 3 === 0 || prod.stock <= 5) ?
            `<p class="fomo-text"><i class="fa-solid fa-fire"></i> ¡Últimas ${Math.min(unitsLeft, prod.stock || unitsLeft)} unidades!</p>` : '';

        // Stock bajo
        if (prod.stock !== undefined && prod.stock <= 3 && prod.stock > 0) {
            fomoHtml = `<p class="fomo-text"><i class="fa-solid fa-fire"></i> ¡Solo quedan ${prod.stock}!</p>`;
        }

        div.innerHTML = `
            ${adminHtml}
            <button class="${btnClass}" onclick="toggleWishlist('${prod._id || prod.id}'); event.stopPropagation();" title="Guardar Secreto">
                <i class="${heartClass}"></i>
            </button>
            <img src="${prod.img}" alt="${prod.nombre}" class="product-img" 
                 onclick="abrirDetalles('${prod._id || prod.id}')" 
                 onerror="this.src='https://via.placeholder.com/200?text=Sin+Imagen'">
            <div style="flex-grow: 1;">
                <h4>${prod.nombre}</h4>
                <p class="product-desc">${prod.desc}</p>
            </div>
            <p class="price">$${(prod.precio || 0).toLocaleString('es-CO')}</p>
            ${fomoHtml}
            <button class="btn btn-primary w-100" onclick="agregarAlCarrito('${prod._id || prod.id}')" 
                    ${prod.stock !== undefined && prod.stock <= 0 ? 'disabled style="opacity:0.5;"' : ''}>
                ${prod.stock !== undefined && prod.stock <= 0 ? 'Agotado' : 'Añadir Discretamente'}
            </button>
        `;
        productGrid.appendChild(div);
    });
}

// ==========================================
// 9. CARRUSEL DE NOVEDADES
// ==========================================
function iniciarCarrusel() {
    const track = document.getElementById('sliderTrack');
    const featuredIds = [15, 22, 7, 11];
    const etiquetas = ["🔥 Oferta Top", "✨ Novedad", "💎 Premium", "🤫 Más Vendido"];
    track.innerHTML = '';

    featuredIds.forEach((id, index) => {
        let p = products.find(prod => (prod._id || prod.id) == id);
        if (p) {
            track.innerHTML += `
                <div class="slide-card">
                    <div class="slide-img-container">
                        <img src="${p.img}" class="slide-img" alt="${p.nombre}" 
                             onerror="this.src='https://via.placeholder.com/200?text=Sin+Imagen'">
                    </div>
                    <div class="slide-info">
                        <span class="slide-badge">${etiquetas[index]}</span>
                        <h3 class="slide-title">${p.nombre}</h3>
                        <p class="slide-desc">${p.desc}</p>
                        <p class="slide-price">$${(p.precio || 0).toLocaleString('es-CO')}</p>
                        <button class="btn btn-primary btn-small" style="width: fit-content;" 
                                onclick="agregarAlCarrito('${p._id || p.id}')">
                            <i class="fa-solid fa-cart-plus"></i> Lo Quiero
                        </button>
                    </div>
                </div>
            `;
        }
    });

    let currentSlide = 0;
    let slideInterval;
    const totalSlides = featuredIds.length;

    const arrancarSlider = () => {
        slideInterval = setInterval(() => {
            currentSlide = (currentSlide + 1) % totalSlides;
            track.style.transform = `translateX(-${currentSlide * 100}%)`;
        }, 6000);
    };

    arrancarSlider();

    const sliderContainer = document.getElementById('sliderContainer');
    if (sliderContainer) {
        sliderContainer.addEventListener('mouseenter', () => clearInterval(slideInterval));
        sliderContainer.addEventListener('mouseleave', arrancarSlider);
    }
}

// ==========================================
// 10. MOTOR DE FILTRADO Y BÚSQUEDA
// ==========================================
window.filtrar = function (categoria) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) {
        event.target.classList.add('active');
    }
    categoriaActual = categoria;
    aplicarFiltros();
};

function aplicarFiltros() {
    let textoBusqueda = document.getElementById('searchInput').value.toLowerCase();
    let orden = document.getElementById('sortSelect').value;

    let filtrados = products.filter(p => {
        let coincideCategoria = categoriaActual === 'todos' || p.categoria === categoriaActual;
        let coincideTexto = (p.nombre && p.nombre.toLowerCase().includes(textoBusqueda)) ||
            (p.desc && p.desc.toLowerCase().includes(textoBusqueda));
        return coincideCategoria && coincideTexto;
    });

    // Ordenamiento
    if (orden === 'low-high') {
        filtrados.sort((a, b) => (a.precio || 0) - (b.precio || 0));
    } else if (orden === 'high-low') {
        filtrados.sort((a, b) => (b.precio || 0) - (a.precio || 0));
    }

    renderProducts(filtrados);
}

// ==========================================
// 11. SISTEMA DE ALERTAS (TOASTS Y MODALES)
// ==========================================
window.mostrarToast = function (mensaje, tipo = 'normal') {
    const contenedor = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.classList.add('toast');
    if (tipo === 'success') toast.classList.add('success');

    let icono = tipo === 'success' ?
        '<i class="fa-solid fa-check-circle" style="color:#4cd137"></i>' :
        '<i class="fa-solid fa-heart" style="color:var(--neon-pink)"></i>';

    toast.innerHTML = `${icono} <span>${mensaje}</span>`;
    contenedor.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
};

window.mostrarAlertaPersonalizada = function (tipo, titulo, mensaje) {
    const modal = document.getElementById('customAlertModal');
    const iconDiv = document.getElementById('alertIcon');

    if (tipo === 'error') {
        iconDiv.innerHTML = '<i class="fa-solid fa-circle-exclamation" style="color: #ff2a75;"></i>';
    } else if (tipo === 'success') {
        iconDiv.innerHTML = '<i class="fa-solid fa-circle-check" style="color: #4cd137;"></i>';
    } else if (tipo === 'warning') {
        iconDiv.innerHTML = '<i class="fa-solid fa-triangle-exclamation" style="color: #fbc531;"></i>';
    }

    document.getElementById('alertTitle').innerText = titulo;
    document.getElementById('alertMessage').innerHTML = mensaje;
    modal.classList.add('active');
    document.body.classList.add('no-scroll');
};

window.cerrarAlertaPersonalizada = () => {
    document.getElementById('customAlertModal').classList.remove('active');
    document.body.classList.remove('no-scroll');
};

// ==========================================
// 12. LÓGICA DEL CARRITO Y CHECKOUT
// ==========================================
const cartSidebar = document.getElementById('cartSidebar');
document.getElementById('btnCartToggle').onclick = () => cartSidebar.classList.add('open');
document.getElementById('closeCart').onclick = () => cartSidebar.classList.remove('open');

window.agregarAlCarrito = function (id) {
    const producto = products.find(p => (p._id || p.id) == id);

    if (!producto) {
        window.mostrarToast("Producto no encontrado", "normal");
        return;
    }

    if (producto.stock !== undefined && producto.stock <= 0) {
        window.mostrarAlertaPersonalizada('warning', 'Producto Agotado',
            'Lo sentimos, este producto no tiene stock disponible.');
        return;
    }

    const itemEnCarrito = cart.find(item => (item._id || item.id) == id);

    if (itemEnCarrito) {
        itemEnCarrito.cantidad++;
    } else {
        cart.push({
            ...producto,
            _id: producto._id || producto.id,
            id: producto._id || producto.id,
            cantidad: 1
        });
    }

    guardarYActualizarCarrito();
    window.mostrarToast(`${producto.nombre} añadido al carrito`, 'normal');
};

window.cambiarCantidad = function (id, delta) {
    const item = cart.find(i => (i._id || i.id) == id);
    if (item) {
        item.cantidad += delta;
        if (item.cantidad <= 0) {
            cart = cart.filter(i => (i._id || i.id) != id);
        }
        guardarYActualizarCarrito();
    }
};

window.eliminarDelCarrito = function (id) {
    cart = cart.filter(i => (i._id || i.id) != id);
    guardarYActualizarCarrito();
};

function guardarYActualizarCarrito() {
    localStorage.setItem('pd_cart_cop', JSON.stringify(cart));
    actualizarCarritoUI();
}

function actualizarCarritoUI() {
    const cartItemsCont = document.getElementById('cartItems');
    cartItemsCont.innerHTML = '';
    let subtotal = 0;
    let cantidadTotal = 0;

    cart.forEach(item => {
        subtotal += (item.precio || 0) * item.cantidad;
        cantidadTotal += item.cantidad;
        const itemId = item._id || item.id;

        cartItemsCont.innerHTML += `
            <div class="cart-item fade-in">
                <img src="${item.img}" alt="${item.nombre}" 
                     onerror="this.src='https://via.placeholder.com/60'">
                <div class="cart-item-info">
                    <h4>${item.nombre}</h4>
                    <p style="color:var(--neon-pink); font-weight:bold;">
                        $${(item.precio || 0).toLocaleString('es-CO')}
                    </p>
                    <div style="margin-top:5px; display:flex; gap:10px; align-items:center;">
                        <button onclick="cambiarCantidad('${itemId}', -1)" class="btn-icon">
                            <i class="fa-solid fa-minus"></i>
                        </button>
                        <span>${item.cantidad}</span>
                        <button onclick="cambiarCantidad('${itemId}', 1)" class="btn-icon">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                    </div>
                </div>
                <div class="cart-item-actions">
                    <button onclick="eliminarDelCarrito('${itemId}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });

    document.getElementById('cartCount').innerText = cantidadTotal;

    // Lógica de envío gratis
    const metaEnvio = 150000;
    let shipping = 0;
    const txtEnvio = document.getElementById('shippingText');
    const fillEnvio = document.getElementById('shippingFill');

    if (subtotal === 0) {
        txtEnvio.innerHTML = `Faltan <strong>$${metaEnvio.toLocaleString('es-CO')}</strong> para envío gratis`;
        fillEnvio.style.width = '0%';
        shipping = 0;
    } else if (subtotal >= metaEnvio) {
        txtEnvio.innerHTML = `<i class="fa-solid fa-gift"></i> ¡Envío Discreto <strong>GRATIS</strong>!`;
        fillEnvio.style.width = '100%';
        fillEnvio.style.background = 'linear-gradient(90deg, #4cd137, #20bf6b)';
        shipping = 0;
    } else {
        let faltante = metaEnvio - subtotal;
        let porcentaje = (subtotal / metaEnvio) * 100;
        txtEnvio.innerHTML = `Faltan <strong>$${faltante.toLocaleString('es-CO')}</strong> para envío gratis`;
        fillEnvio.style.width = `${porcentaje}%`;
        fillEnvio.style.background = 'linear-gradient(90deg, var(--neon-purple), var(--neon-pink))';
        shipping = 15000;
    }

    let taxes = subtotal > 0 ? (subtotal * 0.10) : 0;

    document.getElementById('cartSubtotal').innerText = subtotal.toLocaleString('es-CO');
    document.getElementById('cartTax').innerText = taxes.toLocaleString('es-CO');
    document.getElementById('cartShipping').innerText = shipping.toLocaleString('es-CO');
    document.getElementById('cartTotal').innerText = (subtotal + taxes + shipping).toLocaleString('es-CO');
}

// ==========================================
// 13. CHECKOUT Y PAGO
// ==========================================
window.abrirCheckout = function () {
    if (cart.length === 0) {
        window.mostrarAlertaPersonalizada('error', 'Carrito Vacío',
            'Añade productos antes de proceder al pago.');
        return;
    }

    // Autocompletado con datos guardados
    document.getElementById('checkoutEmail').value = guestInfo.email || '';
    let addressValue = guestInfo.address;
    if (guestInfo.city) addressValue += (addressValue ? ', ' : '') + guestInfo.city;
    document.getElementById('checkoutAddress').value = addressValue || '';

    document.getElementById('checkoutCardNum').value = guestInfo.cardNum || '';
    document.getElementById('checkoutCardExp').value = guestInfo.cardExp || '';
    document.getElementById('checkoutCardCVC').value = guestInfo.cardCVC || '';

    document.getElementById('checkoutTotal').innerText = document.getElementById('cartTotal').innerText;
    cartSidebar.classList.remove('open');
    document.getElementById('checkoutModal').classList.add('active');
    document.body.classList.add('no-scroll');
};

// Selección de método de pago
window.selectPayment = function (element) {
    document.querySelectorAll('.payment-card').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
};

// Procesar pago
document.getElementById('paymentForm').onsubmit = async function (e) {
    e.preventDefault();

    let direccionInput = document.getElementById('checkoutAddress').value;
    let emailInput = document.getElementById('checkoutEmail').value;

    // Preparar datos para la API
    const orderData = {
        items: cart.map(item => ({
            producto: item._id || item.id,
            cantidad: item.cantidad
        })),
        direccionEnvio: {
            nombre: currentAlias,
            direccion: direccionInput,
            ciudad: guestInfo.city || 'Medellín',
            telefono: 'No especificado'
        },
        emailCliente: emailInput || 'anon@purpledesire.com',
        metodoPago: 'Visa'
    };

    try {
        // Intentar crear pedido en la API
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        const data = await response.json();

        if (data.success) {
            // Pedido creado exitosamente
            document.getElementById('checkoutModal').classList.remove('active');
            window.mostrarAlertaPersonalizada('success', '¡Pago Exitoso!',
                `Se procesó el pago de <strong>$${document.getElementById('checkoutTotal').innerText} COP</strong>.<br><br>
                 📦 Enviaremos tu paquete al Valle de Aburrá en:<br>
                 <strong>${direccionInput}</strong><br><br>
                 🔍 Código de rastreo:<br>
                 <strong style="color:var(--neon-pink); font-size:1.15rem;">${data.data.codigoRastreo}</strong><br><br>
                 📧 Recibo enviado a:<br><strong>${emailInput}</strong>`);

            cart = [];
            guardarYActualizarCarrito();
            document.getElementById('paymentForm').reset();
            await cargarProductosDesdeAPI(); // Recargar productos para actualizar stock
            renderProducts(products);
        } else {
            window.mostrarAlertaPersonalizada('error', 'Error en el Pedido',
                data.message || 'No se pudo procesar el pedido. Intenta de nuevo.');
        }
    } catch (error) {
        // Si no hay conexión, simular pedido localmente
        console.warn('Sin conexión al servidor. Simulando pedido local.');
        let codigoRastreo = "PD-LOCAL-" + (Math.floor(Math.random() * 90000000) + 10000000);

        document.getElementById('checkoutModal').classList.remove('active');
        window.mostrarAlertaPersonalizada('success', '¡Pago Exitoso! (Modo Local)',
            `Se procesó el pago de <strong>$${document.getElementById('checkoutTotal').innerText} COP</strong>.<br><br>
             📦 Enviaremos tu paquete al Valle de Aburrá en:<br>
             <strong>${direccionInput}</strong><br><br>
             🔍 Código de rastreo:<br>
             <strong style="color:var(--neon-pink); font-size:1.15rem;">${codigoRastreo}</strong><br><br>
             ⚠️ Modo sin conexión - Pedido guardado localmente.`);

        cart = [];
        guardarYActualizarCarrito();
        document.getElementById('paymentForm').reset();
    }
};

// ==========================================
// 14. LISTA DE DESEOS (WISHLIST)
// ==========================================
window.toggleWishlist = function (id) {
    const index = wishlist.indexOf(id);
    if (index === -1) {
        wishlist.push(id);
        window.mostrarToast("Añadido a tus favoritos 🤍", "normal");
    } else {
        wishlist.splice(index, 1);
        window.mostrarToast("Eliminado de favoritos", "normal");
    }

    localStorage.setItem('pd_wishlist', JSON.stringify(wishlist));
    actualizarWishlistUI();
    renderProducts(products);
};

function actualizarWishlistUI() {
    document.getElementById('wishlistCount').innerText = wishlist.length;
}

window.abrirWishlistModal = function () {
    document.body.classList.add('no-scroll');
    const cont = document.getElementById('wishlistItemsContainer');
    cont.innerHTML = '';

    if (wishlist.length === 0) {
        cont.innerHTML = '<p style="color:var(--text-muted); text-align:center;">Aún no tienes secretos guardados.</p>';
    } else {
        wishlist.forEach(id => {
            const prod = products.find(p => (p._id || p.id) == id);
            if (prod) {
                cont.innerHTML += `
                    <div style="display: flex; align-items: center; justify-content: space-between; 
                                background: #070707; padding: 10px; margin-bottom: 10px; 
                                border-radius: 8px; border: 1px solid #222;">
                        <img src="${prod.img}" alt="${prod.nombre}" 
                             style="width: 50px; height: 50px; background: white; border-radius: 5px; object-fit: contain;"
                             onerror="this.src='https://via.placeholder.com/50?text=N/A'">
                        <div style="flex-grow: 1; margin: 0 15px; text-align: left;">
                            <h4 style="font-size: 0.9rem;">${prod.nombre}</h4>
                            <p style="color: var(--neon-pink); font-weight: bold;">
                                $${(prod.precio || 0).toLocaleString('es-CO')}
                            </p>
                        </div>
                        <div style="display: flex; gap: 5px;">
                            <button class="btn-icon" onclick="agregarAlCarrito('${prod._id || prod.id}')" 
                                    style="color: #4cd137;" title="Al carrito">
                                <i class="fa-solid fa-cart-plus"></i>
                            </button>
                            <button class="btn-icon" 
                                    onclick="toggleWishlist('${prod._id || prod.id}'); abrirWishlistModal();" 
                                    style="color: var(--text-muted);" title="Quitar">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            }
        });
    }
    document.getElementById('wishlistModal').classList.add('active');
};

// ==========================================
// 15. TRACKER DE ENVÍOS SIMULADO
// ==========================================
window.abrirTracker = function () {
    document.body.classList.add('no-scroll');
    document.getElementById('trackerModal').classList.add('active');
    document.getElementById('trackerInput').value = '';
    document.getElementById('trackerSteps').style.display = 'none';
};

document.getElementById('trackerForm').onsubmit = function (e) {
    e.preventDefault();
    let input = document.getElementById('trackerInput').value.trim();
    if (!input) return;

    document.getElementById('trackerSteps').style.display = 'block';
    let stepEls = [
        document.getElementById('step1'),
        document.getElementById('step2'),
        document.getElementById('step3')
    ];

    stepEls.forEach(el => el.classList.remove('active'));

    setTimeout(() => stepEls[0].classList.add('active'), 500);
    setTimeout(() => stepEls[1].classList.add('active'), 1800);
    setTimeout(() => {
        stepEls[2].classList.add('active');
        // Sincronizar con API si hay código real
        if (input.startsWith('PD-') && authToken) {
            verificarEstadoPedidoAPI(input);
        }
    }, 3200);
};

async function verificarEstadoPedidoAPI(codigoRastreo) {
    try {
        const response = await fetch(`${API_URL}/orders?search=${codigoRastreo}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();

        if (data.success && data.data.length > 0) {
            const order = data.data[0];
            window.mostrarToast(`Pedido encontrado: ${formatearEstadoAPI(order.estado)}`, 'success');
        }
    } catch (error) {
        console.log('Verificación de pedido solo disponible online');
    }
}

function formatearEstadoAPI(estado) {
    const estados = {
        'pendiente': '⏳ Pendiente',
        'confirmado': '✅ Confirmado',
        'empacando': '📦 Empacando',
        'en_camino': '🚚 En Camino',
        'entregado': '🏠 Entregado',
        'cancelado': '❌ Cancelado'
    };
    return estados[estado] || estado;
}

// ==========================================
// 16. DETALLES DEL PRODUCTO (MODAL CON ZOOM)
// ==========================================
window.abrirDetalles = function (id) {
    const prod = products.find(p => (p._id || p.id) == id);
    if (!prod) return;

    document.body.classList.add('no-scroll');
    document.getElementById('detailImg').src = prod.img;
    document.getElementById('detailName').innerText = prod.nombre;
    document.getElementById('detailDesc').innerText = prod.desc || 'Sin descripción';
    document.getElementById('detailPrice').innerText = `$${(prod.precio || 0).toLocaleString('es-CO')}`;

    // Stock info
    let stockInfo = '';
    if (prod.stock !== undefined) {
        if (prod.stock <= 0) {
            stockInfo = '<p style="color:#e84118; font-weight:bold;">⚠️ Producto Agotado</p>';
        } else if (prod.stock <= 5) {
            stockInfo = `<p style="color:#fbc531;">⚠️ Solo quedan ${prod.stock} unidades</p>`;
        } else {
            stockInfo = `<p style="color:#4cd137;">✅ En stock: ${prod.stock} unidades</p>`;
        }
    }

    // Reseñas simuladas
    let numericId = typeof (prod._id || prod.id) === 'string' ?
        (prod._id || prod.id).length : (prod._id || prod.id);

    document.getElementById('detailReviews').innerHTML = `
        ${stockInfo}
        <div class="reviews-container" style="margin-top:10px;">
            <div class="review-item">
                <div class="star-rating">
                    <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i>
                </div>
                <strong>Agent_${(numericId * 123) % 9000 + 1000}:</strong> 
                "Excelente calidad, entrega súper discreta."
            </div>
            <div class="review-item">
                <div class="star-rating">
                    <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star-half-stroke"></i>
                </div>
                <strong>Agent_${(numericId * 321) % 9000 + 1000}:</strong> 
                "Llegó rapidísimo, nadie se dio cuenta."
            </div>
        </div>
    `;

    document.getElementById('detailBtnAdd').onclick = function () {
        window.agregarAlCarrito(id);
        document.getElementById('productModal').classList.remove('active');
        document.body.classList.remove('no-scroll');
    };

    // Deshabilitar botón si no hay stock
    if (prod.stock !== undefined && prod.stock <= 0) {
        document.getElementById('detailBtnAdd').disabled = true;
        document.getElementById('detailBtnAdd').style.opacity = '0.5';
        document.getElementById('detailBtnAdd').innerHTML = '<i class="fa-solid fa-times"></i> Agotado';
    } else {
        document.getElementById('detailBtnAdd').disabled = false;
        document.getElementById('detailBtnAdd').style.opacity = '1';
        document.getElementById('detailBtnAdd').innerHTML = '<i class="fa-solid fa-cart-plus"></i> Añadir al Carrito';
    }

    document.getElementById('productModal').classList.add('active');
};

// Cerrar modales
document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        const modal = this.closest('.modal-overlay');
        if (modal) {
            modal.classList.remove('active');
            document.body.classList.remove('no-scroll');
        }
    });
});

// Cerrar modales al hacer clic fuera
window.addEventListener('click', function (event) {
    if (event.target.classList.contains('modal-overlay')) {
        event.target.classList.remove('active');
        document.body.classList.remove('no-scroll');
    }
});

// ==========================================
// 17. PANEL DE ADMINISTRADOR (CRUD SIMULADO)
// ==========================================
window.abrirAdminModal = function () {
    document.getElementById('adminModalTitle').innerText = "Nuevo Producto";
    document.getElementById('adminForm').reset();
    document.getElementById('prodId').value = '';
    document.getElementById('adminModal').classList.add('active');
    document.body.classList.add('no-scroll');
};

document.getElementById('adminForm').onsubmit = async function (e) {
    e.preventDefault();
    const idProd = document.getElementById('prodId').value;

    const productoData = {
        nombre: document.getElementById('prodName').value,
        desc: document.getElementById('prodDesc').value,
        precio: parseFloat(document.getElementById('prodPrice').value),
        categoria: document.getElementById('prodCategory').value,
        img: document.getElementById('prodImg').value,
        stock: 10 // Stock por defecto para nuevos productos
    };

    try {
        let response;
        if (idProd) {
            // Actualizar producto existente
            response = await fetch(`${API_URL}/products/${idProd}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(productoData)
            });
        } else {
            // Crear nuevo producto
            response = await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(productoData)
            });
        }

        const data = await response.json();

        if (data.success) {
            await cargarProductosDesdeAPI();
            renderProducts(products);
            window.mostrarToast(idProd ? "Producto actualizado" : "Producto creado", "success");
            iniciarCarrusel();
        } else {
            window.mostrarAlertaPersonalizada('error', 'Error',
                data.message || 'No se pudo guardar el producto');
        }
    } catch (error) {
        // Modo local como respaldo
        if (idProd) {
            const index = products.findIndex(p => (p._id || p.id) == idProd);
            if (index !== -1) {
                products[index] = { ...products[index], ...productoData, id: parseInt(idProd) };
            }
        } else {
            const newId = Date.now();
            products.push({ ...productoData, id: newId, _id: newId.toString() });
        }
        localStorage.setItem('pd_products_cop', JSON.stringify(products));
        renderProducts(products);
        window.mostrarToast("Producto guardado (modo local)", "success");
        iniciarCarrusel();
    }

    document.getElementById('adminModal').classList.remove('active');
    document.body.classList.remove('no-scroll');
};

window.editarProducto = function (id) {
    const prod = products.find(p => (p._id || p.id) == id);
    if (!prod) return;

    document.getElementById('adminModalTitle').innerText = "Editar Producto";
    document.getElementById('prodId').value = prod._id || prod.id;
    document.getElementById('prodName').value = prod.nombre;
    document.getElementById('prodDesc').value = prod.desc || '';
    document.getElementById('prodPrice').value = prod.precio || 0;
    document.getElementById('prodCategory').value = prod.categoria;
    document.getElementById('prodImg').value = prod.img;

    document.getElementById('adminModal').classList.add('active');
    document.body.classList.add('no-scroll');
};

window.eliminarProducto = async function (id) {
    if (!confirm("¿Seguro que deseas eliminar este producto?")) return;

    try {
        const response = await fetch(`${API_URL}/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();

        if (data.success) {
            await cargarProductosDesdeAPI();
            renderProducts(products);
            window.mostrarToast("Producto eliminado", "success");
            iniciarCarrusel();
        }
    } catch (error) {
        // Modo local
        products = products.filter(p => (p._id || p.id) != id);
        localStorage.setItem('pd_products_cop', JSON.stringify(products));
        renderProducts(products);
        window.mostrarToast("Producto eliminado (modo local)", "success");
        iniciarCarrusel();
    }
};

console.log('🟣 Purple Desire - Sistema inicializado correctamente');
console.log('📡 API:', API_URL);
console.log('👤 Modo:', authToken ? 'Conectado' : 'Local');