/**
 * IMPORTACIONES
 * Se trae la base de datos predefinida de productos.
 */
import { defaultProducts } from './data.js';

// ==========================================
// 1. ESTADO GLOBAL DE LA APLICACIÓN
// ==========================================
// Manejamos variables de estado que dictan cómo se comporta la web.

let currentUserRole = 'guest'; // Roles posibles: 'guest', 'anonymous_user', 'admin'
let currentAlias = 'Invitado'; 

// Persistencia en LocalStorage: Si hay datos guardados de sesiones anteriores, los carga.
let cart = JSON.parse(localStorage.getItem('pd_cart_cop')) ||[];
let wishlist = JSON.parse(localStorage.getItem('pd_wishlist')) ||[];
let categoriaActual = 'todos';
let products = JSON.parse(localStorage.getItem('pd_products_cop')) || defaultProducts;

// Objeto para auto-rellenar los datos en la pasarela de pago (Checkout)
let guestInfo = { email: '', address: '', city: '', cardNum: '', cardExp: '', cardCVC: '' };

// ==========================================
// 2. INICIALIZACIÓN (Ciclo de vida)
// ==========================================
/**
 * Evento disparado cuando el HTML termina de cargar.
 * Verifica la edad, configura la vista por defecto y arranca el carrusel.
 */
document.addEventListener('DOMContentLoaded', () => {
    window.scrollTo(0, 0); // Forzar scroll arriba al recargar
    
    // Verificación de edad al cargar la página (Usa sessionStorage para recordar en la sesión actual)
    if (!sessionStorage.getItem('isAdultVerified')) {
        document.getElementById('ageModal').classList.add('active');
        document.body.classList.add('no-scroll'); 
    } else {
        document.getElementById('ageModal').classList.remove('active');
        document.body.classList.remove('no-scroll'); 
    }
    
    renderProducts(products); // Dibuja las tarjetas de productos
    actualizarCarritoUI();    // Calcula el total inicial
    actualizarWishlistUI();   // Dibuja el contador de favoritos
    iniciarCarrusel();        // Enciende las animaciones
});

// Evitar mantener el scroll previo al refrescar
window.onbeforeunload = function () { window.scrollTo(0, 0); };


// ==========================================
// 3. EVENTOS GENERALES Y SEGURIDAD SFW
// ==========================================

// Manejo del Modal de Control de Edad
document.getElementById('btnYes').onclick = () => {
    sessionStorage.setItem('isAdultVerified', 'true');
    document.getElementById('ageModal').classList.remove('active');
    document.body.classList.remove('no-scroll'); 
};
document.getElementById('btnNo').onclick = () => window.location.href = "https://www.google.com/search?q=imagenes+de+gatitos+tiernos+jugando&tbm=isch";

// Listeners en tiempo real para el buscador y el selector de orden
document.getElementById('searchInput').addEventListener('input', aplicarFiltros);
document.getElementById('sortSelect').addEventListener('change', aplicarFiltros);

/**
 * Función Botón de Pánico (Modo SFW - Safe For Work)
 * Alterna una clase CSS en el body que desenfoca las imágenes para dar privacidad.
 */
let sfwEnabled = true; // El blur inicia activado por defecto
window.toggleSFW = function() {
    sfwEnabled = !sfwEnabled;
    document.body.classList.toggle('sfw-mode', sfwEnabled);
    
    const icon = document.getElementById('sfwIcon');
    if(sfwEnabled) {
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
// 4. MODO INVITADO Y PERFIL DESECHABLE
// ==========================================
const authModal = document.getElementById('authModal');
const userNameDisplay = document.getElementById('userNameDisplay');

// Abrir el modal de login simulado
document.getElementById('btnLogin').onclick = () => {
    authModal.classList.add('active');
    document.body.classList.add('no-scroll');
};

// Generador de nombres aleatorios "Agentes"
document.getElementById('btnRandomAlias').onclick = () => document.getElementById('alias').value = `Agent_${Math.floor(Math.random() * 9000) + 1000}`;

// Ingreso rápido sin guardar datos
document.getElementById('btnGuest').onclick = (e) => {
    e.preventDefault();
    currentUserRole = 'guest'; currentAlias = 'Invitado';
    userNameDisplay.innerText = currentAlias;
    document.getElementById('btnAdminPanel').classList.add('hidden');
    authModal.classList.remove('active');
    document.body.classList.remove('no-scroll');
    renderProducts(products);
};

// Ingreso creando perfil para Autorelleno (Checkout)
document.getElementById('authForm').onsubmit = (e) => {
    e.preventDefault();
    const aliasInput = document.getElementById('alias').value.trim().toLowerCase();
    
    // Capturar y almacenar en memoria RAM temporal los datos del usuario
    guestInfo.email = document.getElementById('guestEmail').value.trim();
    guestInfo.address = document.getElementById('guestAddress').value.trim();
    guestInfo.city = document.getElementById('guestCity').value;
    guestInfo.cardNum = document.getElementById('guestCardNum').value.trim();
    guestInfo.cardExp = document.getElementById('guestCardExp').value.trim();
    guestInfo.cardCVC = document.getElementById('guestCardCVC').value.trim();

    // Lógica para detectar si entró el Administrador
    if(aliasInput === 'admin') {
        currentUserRole = 'admin'; currentAlias = 'Dueño';
        document.getElementById('btnAdminPanel').classList.remove('hidden');
    } else {
        currentUserRole = 'anonymous_user'; currentAlias = document.getElementById('alias').value.trim();
        document.getElementById('btnAdminPanel').classList.add('hidden');
    }
    userNameDisplay.innerText = currentAlias;
    authModal.classList.remove('active');
    document.body.classList.remove('no-scroll');
    renderProducts(products); // Volver a dibujar para ocultar/mostrar botones de edición
};

// ==========================================
// 5. RENDERIZACIÓN DINÁMICA DE PRODUCTOS
// ==========================================
/**
 * Crea las tarjetas HTML dinámicamente según el array recibido.
 * @param {Array} arrayProductos Lista de objetos de producto a iterar.
 */
function renderProducts(arrayProductos) {
    const productGrid = document.getElementById('productGrid');
    productGrid.innerHTML = '';
    
    if(arrayProductos.length === 0) {
        productGrid.innerHTML = `<h3 style="color:var(--text-muted); grid-column: 1/-1; text-align:center;">No hay productos que coincidan.</h3>`;
        return;
    }

    arrayProductos.forEach(prod => {
        const div = document.createElement('div');
        div.classList.add('product-card', 'fade-in');
        
        // Si el usuario actual es ADMIN, se inyectan los botones CRUD
        let adminHtml = currentUserRole === 'admin' ? `
            <div class="admin-controls">
                <button class="btn-icon" onclick="editarProducto(${prod.id}); event.stopPropagation();"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-icon" onclick="eliminarProducto(${prod.id}); event.stopPropagation();"><i class="fa-solid fa-trash"></i></button>
            </div>
        ` : '';

        let isWished = wishlist.includes(prod.id);
        let heartClass = isWished ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
        let btnClass = isWished ? 'btn-wishlist active' : 'btn-wishlist';
        
        // Gamificación: Escasez simulada (FOMO)
        let fomoOptions = [1, 2, 5, 10];
        let unitsLeft = fomoOptions[prod.id % fomoOptions.length]; 
        let fomoHtml = (prod.id % 3 === 0) ? `<p class="fomo-text"><i class="fa-solid fa-fire"></i> ¡Últimas ${unitsLeft} unidades!</p>` : '';

        div.innerHTML = `
            ${adminHtml}
            <button class="${btnClass}" onclick="toggleWishlist(${prod.id}); event.stopPropagation();" title="Guardar Secreto">
                <i class="${heartClass}"></i>
            </button>
            <img src="${prod.img}" alt="${prod.nombre}" class="product-img" onclick="abrirDetalles(${prod.id})" onerror="this.src='https://via.placeholder.com/200?text=Sin+Imagen'">
            <div style="flex-grow: 1;">
                <h4>${prod.nombre}</h4>
                <p class="product-desc">${prod.desc}</p>
            </div>
            <p class="price">$${prod.precio.toLocaleString('es-CO')}</p>
            ${fomoHtml}
            <button class="btn btn-primary w-100" onclick="agregarAlCarrito(${prod.id})">Añadir Discretamente</button>
        `;
        productGrid.appendChild(div);
    });
}

/**
 * Controla la animación automática del banner deslizante.
 */
function iniciarCarrusel() {
    const track = document.getElementById('sliderTrack');
    const featuredIds =[15, 22, 7, 11]; // Productos estáticos elegidos para promoción
    const etiquetas =["🔥 Oferta Top", "✨ Novedad", "💎 Premium", "🤫 Más Vendido"];
    track.innerHTML = '';
    
    featuredIds.forEach((id, index) => {
        let p = products.find(prod => prod.id === id);
        if(p) {
            track.innerHTML += `
                <div class="slide-card">
                    <div class="slide-img-container">
                        <img src="${p.img}" class="slide-img" alt="${p.nombre}" onerror="this.src='https://via.placeholder.com/200?text=Sin+Imagen'">
                    </div>
                    <div class="slide-info">
                        <span class="slide-badge">${etiquetas[index]}</span>
                        <h3 class="slide-title">${p.nombre}</h3>
                        <p class="slide-desc">${p.desc}</p>
                        <p class="slide-price">$${p.precio.toLocaleString('es-CO')}</p>
                        <button class="btn btn-primary btn-small" style="width: fit-content;" onclick="agregarAlCarrito(${p.id})"><i class="fa-solid fa-cart-plus"></i> Lo Quiero</button>
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
        }, 6000); // Rota cada 6 segundos
    };
    arrancarSlider();
    // Detiene la animación si el usuario pone el mouse encima
    document.getElementById('sliderContainer').addEventListener('mouseenter', () => clearInterval(slideInterval));
    document.getElementById('sliderContainer').addEventListener('mouseleave', arrancarSlider);
}

// ==========================================
// 6. MOTOR DE FILTRADO Y BÚSQUEDA
// ==========================================
window.filtrar = function(categoria) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    categoriaActual = categoria;
    aplicarFiltros();
};

/**
 * Lógica cruzada entre la búsqueda por texto, filtro de categoría y ordenamiento.
 */
function aplicarFiltros() {
    let textoBusqueda = document.getElementById('searchInput').value.toLowerCase();
    let orden = document.getElementById('sortSelect').value;

    let filtrados = products.filter(p => {
        let coincideCategoria = categoriaActual === 'todos' || p.categoria === categoriaActual;
        let coincideTexto = p.nombre.toLowerCase().includes(textoBusqueda) || p.desc.toLowerCase().includes(textoBusqueda);
        return coincideCategoria && coincideTexto;
    });

    // Ordenamiento numérico nativo de Javascript
    if (orden === 'low-high') filtrados.sort((a, b) => a.precio - b.precio);
    else if (orden === 'high-low') filtrados.sort((a, b) => b.precio - a.precio);

    renderProducts(filtrados);
}

// ==========================================
// 7. SISTEMA DE ALERTAS (TOASTS Y MODALES)
// ==========================================
/**
 * Crea burbujas de notificación temporales.
 */
window.mostrarToast = function(mensaje, tipo = 'normal') {
    const contenedor = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.classList.add('toast');
    if(tipo === 'success') toast.classList.add('success');
    let icono = tipo === 'success' ? '<i class="fa-solid fa-check-circle" style="color:#4cd137"></i>' : '<i class="fa-solid fa-heart" style="color:var(--neon-pink)"></i>';
    toast.innerHTML = `${icono} <span>${mensaje}</span>`;
    contenedor.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000); // Destruye el elemento a los 3 segundos
}

/**
 * Reemplaza el clásico `alert()` nativo por un modal con el diseño de la tienda.
 */
window.mostrarAlertaPersonalizada = function(tipo, titulo, mensaje) {
    const modal = document.getElementById('customAlertModal');
    const iconDiv = document.getElementById('alertIcon');
    if(tipo === 'error') iconDiv.innerHTML = '<i class="fa-solid fa-circle-exclamation" style="color: #ff2a75;"></i>';
    else if (tipo === 'success') iconDiv.innerHTML = '<i class="fa-solid fa-circle-check" style="color: #4cd137;"></i>';
    
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
// 8. LÓGICA DEL CARRITO Y CHECKOUT
// ==========================================
const cartSidebar = document.getElementById('cartSidebar');
document.getElementById('btnCartToggle').onclick = () => cartSidebar.classList.add('open'); 
document.getElementById('closeCart').onclick = () => cartSidebar.classList.remove('open'); 

window.agregarAlCarrito = function(id) {
    const producto = products.find(p => p.id === id);
    const itemEnCarrito = cart.find(item => item.id === id);
    if (itemEnCarrito) itemEnCarrito.cantidad++;
    else cart.push({ ...producto, cantidad: 1 });
    
    guardarYActualizarCarrito();
    window.mostrarToast(`${producto.nombre} añadido.`, 'normal');
};

window.cambiarCantidad = function(id, delta) {
    const item = cart.find(i => i.id === id);
    if(item) { 
        item.cantidad += delta; 
        if(item.cantidad <= 0) cart = cart.filter(i => i.id !== id); 
        guardarYActualizarCarrito(); 
    }
};

window.eliminarDelCarrito = function(id) {
    cart = cart.filter(i => i.id !== id);
    guardarYActualizarCarrito();
};

function guardarYActualizarCarrito() {
    localStorage.setItem('pd_cart_cop', JSON.stringify(cart)); // Persiste en LocalStorage
    actualizarCarritoUI();
}

/**
 * Redibuja todos los ítems en el panel lateral de carrito y calcula precios e impuestos.
 */
function actualizarCarritoUI() {
    const cartItemsCont = document.getElementById('cartItems');
    cartItemsCont.innerHTML = '';
    let subtotal = 0; let cantidadTotal = 0;

    cart.forEach(item => {
        subtotal += item.precio * item.cantidad;
        cantidadTotal += item.cantidad;
        cartItemsCont.innerHTML += `
            <div class="cart-item fade-in">
                <img src="${item.img}" onerror="this.src='https://via.placeholder.com/60'">
                <div class="cart-item-info">
                    <h4>${item.nombre}</h4>
                    <p style="color:var(--neon-pink); font-weight:bold;">$${item.precio.toLocaleString('es-CO')}</p>
                    <div style="margin-top:5px; display:flex; gap:10px; align-items:center;">
                        <button onclick="cambiarCantidad(${item.id}, -1)" class="btn-icon"><i class="fa-solid fa-minus"></i></button>
                        <span>${item.cantidad}</span>
                        <button onclick="cambiarCantidad(${item.id}, 1)" class="btn-icon"><i class="fa-solid fa-plus"></i></button>
                    </div>
                </div>
                <div class="cart-item-actions"><button onclick="eliminarDelCarrito(${item.id})"><i class="fa-solid fa-trash"></i></button></div>
            </div>
        `;
    });

    document.getElementById('cartCount').innerText = cantidadTotal;
    
    // Lógica dinámica para la barra de envío gratis (Meta: $150,000 COP)
    const metaEnvio = 150000;
    let shipping = 0;
    const txtEnvio = document.getElementById('shippingText');
    const fillEnvio = document.getElementById('shippingFill');

    if (subtotal === 0) {
        txtEnvio.innerHTML = `Faltan <strong>$${metaEnvio.toLocaleString('es-CO')}</strong> para envío gratis`;
        fillEnvio.style.width = '0%';
        fillEnvio.style.background = 'linear-gradient(90deg, var(--neon-purple), var(--neon-pink))';
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
        shipping = 15000; // Costo fijo simulado
    }
    
    let taxes = subtotal > 0 ? (subtotal * 0.10) : 0; // 10% impuesto ficticio
    document.getElementById('cartSubtotal').innerText = subtotal.toLocaleString('es-CO');
    document.getElementById('cartTax').innerText = taxes.toLocaleString('es-CO');
    document.getElementById('cartShipping').innerText = shipping.toLocaleString('es-CO');
    document.getElementById('cartTotal').innerText = (subtotal + taxes + shipping).toLocaleString('es-CO');
}

/**
 * Maneja la transición del Carrito hacia la Pasarela de Pago
 * Inyecta los datos que el usuario haya dejado guardados en su Perfil Desechable.
 */
window.abrirCheckout = function() {
    if(cart.length === 0) { window.mostrarAlertaPersonalizada('error', 'Carrito Vacío', 'Añade productos antes de proceder.'); return; }
    
    // Autocompletado inteligente usando los datos en memoria
    document.getElementById('checkoutEmail').value = guestInfo.email || '';
    let addressValue = guestInfo.address;
    if(guestInfo.city) addressValue += (addressValue ? ', ' : '') + guestInfo.city;
    document.getElementById('checkoutAddress').value = addressValue || '';

    document.getElementById('checkoutCardNum').value = guestInfo.cardNum || '';
    document.getElementById('checkoutCardExp').value = guestInfo.cardExp || '';
    document.getElementById('checkoutCardCVC').value = guestInfo.cardCVC || '';

    document.getElementById('checkoutTotal').innerText = document.getElementById('cartTotal').innerText;
    cartSidebar.classList.remove('open');
    document.getElementById('checkoutModal').classList.add('active');
    document.body.classList.add('no-scroll'); 
};

// Tarjetas interactivas en la pasarela de pago
window.selectPayment = function(element) { document.querySelectorAll('.payment-card').forEach(el => el.classList.remove('active')); element.classList.add('active'); };

/**
 * Simulación de Pago Completo
 * Resetea el carrito tras completarse la "transacción".
 */
document.getElementById('paymentForm').onsubmit = function(e) {
    e.preventDefault(); 
    let direccionInput = document.getElementById('checkoutAddress').value;
    let emailInput = document.getElementById('checkoutEmail').value;
    let codigoRastreo = "PD-" + (Math.floor(Math.random() * 90000000) + 10000000);
    
    document.getElementById('checkoutModal').classList.remove('active');
    window.mostrarAlertaPersonalizada('success', '¡Pago Exitoso!', `Se procesó el pago de <strong>$${document.getElementById('checkoutTotal').innerText} COP</strong>.<br><br>📦 Enviaremos tu paquete ciego al Valle de Aburrá en:<br><strong>${direccionInput}</strong><br><br>🔍 Tu guía de rastreo es:<br><strong style="color:var(--neon-pink); font-size:1.15rem;">${codigoRastreo}</strong><br><br>📧 Recibo anónimo enviado a:<br><strong>${emailInput}</strong>`);
    
    cart =[]; guardarYActualizarCarrito(); // Vaciar e impactar storage
    document.getElementById('paymentForm').reset();
};

// ==========================================
// 9. LISTA DE DESEOS (WISHLIST) Y TRACKER DE ENVÍOS
// ==========================================
window.toggleWishlist = function(id) {
    const index = wishlist.indexOf(id);
    if(index === -1) { wishlist.push(id); window.mostrarToast("Añadido a tus favoritos 🤍", "normal"); } 
    else { wishlist.splice(index, 1); window.mostrarToast("Eliminado de favoritos", "normal"); }
    
    localStorage.setItem('pd_wishlist', JSON.stringify(wishlist));
    actualizarWishlistUI();
    renderProducts(products); // Necesario para actualizar el color del icono en la tarjeta
};

function actualizarWishlistUI() { document.getElementById('wishlistCount').innerText = wishlist.length; }

window.abrirWishlistModal = function() {
    document.body.classList.add('no-scroll');
    const cont = document.getElementById('wishlistItemsContainer');
    cont.innerHTML = '';
    
    if(wishlist.length === 0) cont.innerHTML = '<p style="color:var(--text-muted); text-align:center;">Aún no tienes secretos guardados.</p>';
    else {
        wishlist.forEach(id => {
            const prod = products.find(p => p.id === id);
            if(prod) {
                cont.innerHTML += `
                    <div style="display: flex; align-items: center; justify-content: space-between; background: #070707; padding: 10px; margin-bottom: 10px; border-radius: 8px; border: 1px solid #222;">
                        <img src="${prod.img}" style="width: 50px; height: 50px; background: white; border-radius: 5px; object-fit: contain;">
                        <div style="flex-grow: 1; margin: 0 15px; text-align: left;">
                            <h4 style="font-size: 0.9rem;">${prod.nombre}</h4>
                            <p style="color: var(--neon-pink); font-weight: bold;">$${prod.precio.toLocaleString('es-CO')}</p>
                        </div>
                        <div style="display: flex; gap: 5px;">
                            <button class="btn-icon" onclick="agregarAlCarrito(${prod.id})" style="color: #4cd137;" title="Al carrito"><i class="fa-solid fa-cart-plus"></i></button>
                            <button class="btn-icon" onclick="toggleWishlist(${prod.id}); abrirWishlistModal();" style="color: var(--text-muted);" title="Quitar"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                `;
            }
        });
    }
    document.getElementById('wishlistModal').classList.add('active');
};

/**
 * Animación escalonada que simula el rastreo de envíos en tiempo real
 */
window.abrirTracker = function() {
    document.body.classList.add('no-scroll');
    document.getElementById('trackerModal').classList.add('active');
    document.getElementById('trackerInput').value = '';
    document.getElementById('trackerSteps').style.display = 'none';
};

document.getElementById('trackerForm').onsubmit = function(e) {
    e.preventDefault();
    let input = document.getElementById('trackerInput').value.trim();
    if(!input) return;
    
    document.getElementById('trackerSteps').style.display = 'block';
    let stepEls =[document.getElementById('step1'), document.getElementById('step2'), document.getElementById('step3')];
    
    stepEls.forEach(el => el.classList.remove('active')); // Reinicia el estado visual
    
    // Simula tiempos de carga de servidores (Timeout)
    setTimeout(() => stepEls[0].classList.add('active'), 500);
    setTimeout(() => stepEls[1].classList.add('active'), 1800);
    setTimeout(() => stepEls[2].classList.add('active'), 3200);
};

// ==========================================
// 10. DETALLES DEL PRODUCTO (MODAL CON ZOOM)
// ==========================================
/**
 * Abre el QuickView e inyecta la información específica y reseñas dinámicas/simuladas.
 */
window.abrirDetalles = function(id) {
    const prod = products.find(p => p.id === id);
    if(!prod) return;
    
    document.body.classList.add('no-scroll');
    document.getElementById('detailImg').src = prod.img;
    document.getElementById('detailName').innerText = prod.nombre;
    document.getElementById('detailDesc').innerText = prod.desc;
    document.getElementById('detailPrice').innerText = `$${prod.precio.toLocaleString('es-CO')}`;
    
    let rev1 = "Excelente calidad, la entrega fue súper discreta.";
    let rev2 = "Llegó rapidísimo, nadie en mi casa se dio cuenta.";
    
    // Inyección de reseñas usando identificadores anónimos simulados por matemática
    document.getElementById('detailReviews').innerHTML = `
        <div class="review-item">
            <div class="star-rating"><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i></div>
            <strong>Agent_${(prod.id * 123) % 9000 + 1000}:</strong> "${rev1}"
        </div>
        <div class="review-item">
            <div class="star-rating"><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star-half-stroke"></i></div>
            <strong>Agent_${(prod.id * 321) % 9000 + 1000}:</strong> "${rev2}"
        </div>
    `;
    
    document.getElementById('detailBtnAdd').onclick = function() {
        window.agregarAlCarrito(prod.id);
        document.getElementById('productModal').classList.remove('active');
        document.body.classList.remove('no-scroll');
    };
    document.getElementById('productModal').classList.add('active');
};

// ==========================================
// 11. PANEL DE ADMINISTRADOR (CRUD SIMULADO)
// ==========================================
/**
 * Operaciones Create (Crear), Read (Listar), Update (Actualizar) y Delete (Eliminar).
 * Todo recae sobre la variable LocalStorage para mantenerlo vivo entre recargas.
 */
window.abrirAdminModal = function() { 
    document.getElementById('adminModalTitle').innerText = "Nuevo Producto"; 
    document.getElementById('adminForm').reset(); 
    document.getElementById('prodId').value = ''; 
    document.getElementById('adminModal').classList.add('active'); 
    document.body.classList.add('no-scroll');
};

document.getElementById('adminForm').onsubmit = function(e) {
    e.preventDefault();
    const idProd = document.getElementById('prodId').value;
    
    const nuevoProducto = { 
        id: idProd ? parseInt(idProd) : Date.now(), // Date.now() genera ID único
        nombre: document.getElementById('prodName').value, 
        desc: document.getElementById('prodDesc').value, 
        precio: parseFloat(document.getElementById('prodPrice').value), 
        categoria: document.getElementById('prodCategory').value, 
        img: document.getElementById('prodImg').value 
    };

    if (idProd) {
        // Modo Edición
        products[products.findIndex(p => p.id == idProd)] = nuevoProducto; 
    } else {
        // Modo Creación
        products.push(nuevoProducto);
    }

    localStorage.setItem('pd_products_cop', JSON.stringify(products)); // Guardar cambios localmente
    renderProducts(products); 
    
    document.getElementById('adminModal').classList.remove('active'); 
    document.body.classList.remove('no-scroll');
    window.mostrarToast("Producto guardado", "success"); 
    iniciarCarrusel();
};

window.editarProducto = function(id) {
    const prod = products.find(p => p.id === id); if(!prod) return;
    
    document.getElementById('adminModalTitle').innerText = "Editar Producto"; 
    document.getElementById('prodId').value = prod.id; 
    document.getElementById('prodName').value = prod.nombre; 
    document.getElementById('prodDesc').value = prod.desc || ''; 
    document.getElementById('prodPrice').value = prod.precio; 
    document.getElementById('prodCategory').value = prod.categoria; 
    document.getElementById('prodImg').value = prod.img; 
    
    document.getElementById('adminModal').classList.add('active');
    document.body.classList.add('no-scroll');
};

window.eliminarProducto = function(id) {
    if(confirm("¿Seguro que deseas eliminar este producto?")) { 
        products = products.filter(p => p.id !== id); 
        localStorage.setItem('pd_products_cop', JSON.stringify(products)); 
        renderProducts(products); 
        window.mostrarToast("Producto eliminado", "success"); 
        iniciarCarrusel(); 
    }
};