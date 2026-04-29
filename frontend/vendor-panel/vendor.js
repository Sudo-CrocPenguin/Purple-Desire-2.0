/**
 * PANEL DE VENDEDOR - Purple Desire
 * Gestión completa de pedidos, productos e inventario
 */

const API_URL = 'http://localhost:5000/api';
let token = localStorage.getItem('pd_vendor_token');
let currentOrderId = null;

// ==========================================
// 1. INICIALIZACIÓN Y AUTENTICACIÓN
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    if (!token) {
        showLoginForm();
    } else {
        initializePanel();
    }
});

function showLoginForm() {
    document.body.innerHTML = `
        <div class="login-container" style="display:flex; justify-content:center; align-items:center; height:100vh; background:#0a0a0a;">
            <div class="login-card" style="background:#1a1a1a; padding:40px; border-radius:15px; border:1px solid #8a2be2; width:400px; box-shadow:0 10px 30px rgba(138,43,226,0.3);">
                <h1 style="text-align:center; margin-bottom:10px; font-weight:300;">Purple <span style="color:#ff2a75;">Desire</span></h1>
                <p style="text-align:center; color:#888; margin-bottom:30px;">Panel de Vendedor</p>
                <form id="loginForm" onsubmit="login(event)">
                    <div style="margin-bottom:20px;">
                        <label style="display:block; color:#888; margin-bottom:5px;">Usuario</label>
                        <input type="text" id="loginUser" placeholder="Tu alias" required 
                            style="width:100%; padding:10px; background:#111; border:1px solid #333; color:white; border-radius:5px;">
                    </div>
                    <div style="margin-bottom:20px;">
                        <label style="display:block; color:#888; margin-bottom:5px;">Contraseña</label>
                        <input type="password" id="loginPass" placeholder="Contraseña" required 
                            style="width:100%; padding:10px; background:#111; border:1px solid #333; color:white; border-radius:5px;">
                    </div>
                    <button type="submit" style="width:100%; padding:12px; background:linear-gradient(45deg, #8a2be2, #ff2a75); color:white; border:none; border-radius:5px; cursor:pointer; font-size:1rem; margin-top:15px;">
                        <i class="fas fa-sign-in-alt"></i> Ingresar
                    </button>
                </form>
            </div>
        </div>
    `;
}

async function login(event) {
    event.preventDefault();
    
    const alias = document.getElementById('loginUser').value;
    const password = document.getElementById('loginPass').value;
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ alias, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (data.user.rol !== 'vendedor' && data.user.rol !== 'admin') {
                showToast('Acceso denegado. Solo para vendedores.', 'error');
                return;
            }
            
            token = data.token;
            localStorage.setItem('pd_vendor_token', token);
            localStorage.setItem('pd_vendor_name', data.user.alias);
            location.reload();
        } else {
            showToast(data.message || 'Error de autenticación', 'error');
        }
    } catch (error) {
        showToast('Error de conexión con el servidor', 'error');
    }
}

function logout() {
    localStorage.removeItem('pd_vendor_token');
    localStorage.removeItem('pd_vendor_name');
    token = null;
    location.reload();
}

function initializePanel() {
    document.getElementById('vendorName').textContent = 
        localStorage.getItem('pd_vendor_name') || 'Vendedor';
    
    loadDashboard();
    loadOrders();
    
    // Cargar datos cuando se cambia de tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.getAttribute('onclick').match(/'([^']+)'/)[1];
            if (tab === 'orders') loadOrders();
            else if (tab === 'products') loadProducts();
            else if (tab === 'inventory') loadInventory();
        });
    });
}

// ==========================================
// 2. DASHBOARD
// ==========================================

async function loadDashboard() {
    try {
        const response = await fetch(`${API_URL}/orders/stats/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('totalOrders').textContent = data.data.totalPedidos;
            document.getElementById('pendingOrders').textContent = data.data.pedidosPendientes;
            document.getElementById('inTransitOrders').textContent = data.data.pedidosEnCamino;
            document.getElementById('totalRevenue').textContent = 
                `$${data.data.ingresosTotales.toLocaleString('es-CO')}`;
        }
    } catch (error) {
        console.error('Error cargando dashboard:', error);
    }
}

// ==========================================
// 3. GESTIÓN DE PEDIDOS
// ==========================================

async function loadOrders() {
    const filter = document.getElementById('orderFilter')?.value || '';
    const search = document.getElementById('orderSearch')?.value || '';
    
    let url = `${API_URL}/orders?`;
    if (filter) url += `estado=${filter}&`;
    if (search) url += `search=${search}&`;
    
    try {
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
            renderOrders(data.data);
        }
    } catch (error) {
        showToast('Error cargando pedidos', 'error');
    }
}

function renderOrders(orders) {
    const container = document.getElementById('ordersList');
    
    if (!orders || orders.length === 0) {
        container.innerHTML = '<p class="loading">No hay pedidos para mostrar</p>';
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div>
                    <span class="order-id">#${order.codigoRastreo}</span>
                    <span class="order-date">
                        <i class="far fa-calendar"></i> 
                        ${new Date(order.fechaPedido).toLocaleDateString('es-CO', {
                            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                    </span>
                </div>
                <span class="order-status status-${order.estado}">${formatearEstado(order.estado)}</span>
            </div>
            
            <div class="order-items">
                ${order.items.map(item => `
                    <div class="order-item">
                        <img src="${item.producto?.img || 'https://via.placeholder.com/50'}" 
                             alt="${item.producto?.nombre || 'Producto'}"
                             onerror="this.src='https://via.placeholder.com/50?text=N/A'">
                        <div class="order-item-info">
                            <h4>${item.producto?.nombre || 'Producto no disponible'}</h4>
                            <p>Cant: ${item.cantidad} | $${item.precio.toLocaleString('es-CO')} c/u</p>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="order-footer">
                <div class="order-total">
                    Total: $${order.total.toLocaleString('es-CO')}
                </div>
                <div class="order-actions">
                    ${getOrderActions(order)}
                    <button class="btn-status" style="background:#555;" onclick="viewOrderDetail('${order._id}')">
                        <i class="fas fa-eye"></i> Detalles
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function getOrderActions(order) {
    let actions = '';
    
    switch(order.estado) {
        case 'pendiente':
            actions += `<button class="btn-status btn-confirm" onclick="updateOrderStatus('${order._id}', 'confirmado')">
                <i class="fas fa-check"></i> Confirmar
            </button>`;
            actions += `<button class="btn-status btn-cancel" onclick="confirmCancelOrder('${order._id}')">
                <i class="fas fa-times"></i> Cancelar
            </button>`;
            break;
        case 'confirmado':
            actions += `<button class="btn-status btn-pack" onclick="updateOrderStatus('${order._id}', 'empacando')">
                <i class="fas fa-box"></i> Empacar
            </button>`;
            break;
        case 'empacando':
            actions += `<button class="btn-status btn-ship" onclick="updateOrderStatus('${order._id}', 'en_camino')">
                <i class="fas fa-truck"></i> Enviar
            </button>`;
            break;
        case 'en_camino':
            actions += `<button class="btn-status btn-deliver" onclick="updateOrderStatus('${order._id}', 'entregado')">
                <i class="fas fa-check-circle"></i> Entregado
            </button>`;
            break;
    }
    
    return actions;
}

function formatearEstado(estado) {
    const estados = {
        'pendiente': 'Pendiente',
        'confirmado': 'Confirmado',
        'empacando': 'Empacando',
        'en_camino': 'En Camino',
        'entregado': 'Entregado',
        'cancelado': 'Cancelado'
    };
    return estados[estado] || estado;
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}/estado`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ estado: newStatus })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(`Pedido actualizado a: ${formatearEstado(newStatus)}`, 'success');
            loadOrders();
            loadDashboard();
        } else {
            showToast(data.message || 'Error al actualizar', 'error');
        }
    } catch (error) {
        showToast('Error de conexión', 'error');
    }
}

function confirmCancelOrder(orderId) {
    currentOrderId = orderId;
    document.getElementById('confirmTitle').textContent = 'Cancelar Pedido';
    document.getElementById('confirmMessage').textContent = '¿Estás seguro de cancelar este pedido? Se devolverá el stock de los productos.';
    document.getElementById('confirmBtn').onclick = () => {
        updateOrderStatus(orderId, 'cancelado');
        closeModal('confirmModal');
    };
    openModal('confirmModal');
}

async function viewOrderDetail(orderId) {
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const order = data.data;
            const content = document.getElementById('orderDetailContent');
            
            content.innerHTML = `
                <div class="detail-section">
                    <h4><i class="fas fa-hashtag"></i> Código de Rastreo</h4>
                    <p style="font-size:1.2rem; color:var(--neon-pink);">${order.codigoRastreo}</p>
                </div>
                
                <div class="detail-section">
                    <h4><i class="fas fa-user"></i> Datos del Cliente</h4>
                    <p><strong>Email:</strong> ${order.emailCliente}</p>
                    <p><strong>Dirección:</strong> ${order.direccionEnvio?.direccion || 'No especificada'}, ${order.direccionEnvio?.ciudad || ''}</p>
                    <p><strong>Nombre:</strong> ${order.direccionEnvio?.nombre || 'Anónimo'}</p>
                    <p><strong>Teléfono:</strong> ${order.direccionEnvio?.telefono || 'No especificado'}</p>
                </div>
                
                <div class="detail-section">
                    <h4><i class="fas fa-boxes"></i> Productos</h4>
                    ${order.items.map(item => `
                        <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px; padding:8px; background:#0a0a0a; border-radius:5px;">
                            <img src="${item.producto?.img || 'https://via.placeholder.com/40'}" 
                                 style="width:40px; height:40px; object-fit:contain; background:white; border-radius:3px;"
                                 onerror="this.src='https://via.placeholder.com/40?text=N/A'">
                            <div>
                                <strong>${item.producto?.nombre || 'Producto'}</strong>
                                <p style="color:#888; font-size:0.85rem;">${item.cantidad} x $${item.precio.toLocaleString('es-CO')}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="detail-section">
                    <h4><i class="fas fa-calculator"></i> Totales</h4>
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                        <span>Subtotal:</span><span>$${order.subtotal.toLocaleString('es-CO')}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                        <span>Impuestos (10%):</span><span>$${order.impuestos.toLocaleString('es-CO')}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                        <span>Envío:</span><span>$${order.costoEnvio.toLocaleString('es-CO')}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:1.1rem; margin-top:8px; padding-top:8px; border-top:1px solid #333;">
                        <span>Total:</span><span style="color:#ff2a75;">$${order.total.toLocaleString('es-CO')}</span>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4><i class="fas fa-history"></i> Historial de Estados</h4>
                    <div class="order-timeline">
                        ${order.historialEstados.map(h => `
                            <div class="timeline-item ${h.estado === order.estado ? 'active' : ''}">
                                <div>
                                    <strong>${formatearEstado(h.estado)}</strong>
                                    <div class="timeline-date">
                                        ${new Date(h.fecha).toLocaleString('es-CO')} - ${h.actualizadoPor}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            
            openModal('orderDetailModal');
        }
    } catch (error) {
        showToast('Error cargando detalles', 'error');
    }
}

// ==========================================
// 4. GESTIÓN DE PRODUCTOS
// ==========================================

async function loadProducts() {
    const filter = document.getElementById('productFilter')?.value || '';
    const search = document.getElementById('productSearch')?.value || '';
    
    let url = `${API_URL}/products?activo=true&`;
    if (filter) url += `categoria=${filter}&`;
    if (search) url += `search=${search}&`;
    
    try {
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
            renderProducts(data.data);
        }
    } catch (error) {
        showToast('Error cargando productos', 'error');
    }
}

function renderProducts(products) {
    const container = document.getElementById('productsList');
    
    if (!products || products.length === 0) {
        container.innerHTML = '<p class="loading">No hay productos para mostrar</p>';
        return;
    }
    
    container.innerHTML = products.map(product => {
        let stockClass = product.stock > 10 ? 'stock-high' : product.stock > 3 ? 'stock-medium' : 'stock-low';
        
        return `
            <div class="product-card">
                <img src="${product.img}" alt="${product.nombre}"
                     onerror="this.src='https://via.placeholder.com/200?text=Sin+Imagen'">
                <h4>${product.nombre}</h4>
                <p class="desc">${product.desc}</p>
                <p class="price">$${product.precio.toLocaleString('es-CO')}</p>
                <p class="stock ${stockClass}">
                    <i class="fas fa-cubes"></i> Stock: ${product.stock} unidades
                </p>
                <p style="color:#888; font-size:0.8rem; margin-bottom:10px;">
                    <i class="fas fa-tag"></i> ${product.categoria} | 
                    <i class="fas fa-shopping-bag"></i> ${product.ventasCount} vendidos
                </p>
                <div class="product-actions">
                    <button class="btn-edit" onclick="editProduct('${product._id}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn-delete" onclick="confirmDeleteProduct('${product._id}', '${product.nombre}')">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

async function saveProduct(event) {
    event.preventDefault();
    
    const productId = document.getElementById('productId').value;
    const productData = {
        nombre: document.getElementById('productName').value,
        desc: document.getElementById('productDesc').value,
        precio: parseFloat(document.getElementById('productPrice').value),
        stock: parseInt(document.getElementById('productStock').value),
        categoria: document.getElementById('productCategory').value,
        img: document.getElementById('productImg').value
    };
    
    const url = productId ? 
        `${API_URL}/products/${productId}` : 
        `${API_URL}/products`;
    
    const method = productId ? 'PUT' : 'POST';
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(productId ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente', 'success');
            resetForm();
            switchTab('products');
            loadProducts();
        } else {
            showToast(data.message || 'Error al guardar producto', 'error');
        }
    } catch (error) {
        showToast('Error de conexión', 'error');
    }
}

async function editProduct(productId) {
    try {
        const response = await fetch(`${API_URL}/products/${productId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const product = data.data;
            
            document.getElementById('formTitle').textContent = 'Editar Producto';
            document.getElementById('productId').value = product._id;
            document.getElementById('productName').value = product.nombre;
            document.getElementById('productDesc').value = product.desc;
            document.getElementById('productPrice').value = product.precio;
            document.getElementById('productStock').value = product.stock;
            document.getElementById('productCategory').value = product.categoria;
            document.getElementById('productImg').value = product.img;
            
            switchTab('add-product');
        }
    } catch (error) {
        showToast('Error cargando producto', 'error');
    }
}

function confirmDeleteProduct(productId, productName) {
    currentOrderId = productId;
    document.getElementById('confirmTitle').textContent = 'Eliminar Producto';
    document.getElementById('confirmMessage').textContent = 
        `¿Estás seguro de eliminar "${productName}"? Se desactivará y no será visible en la tienda.`;
    document.getElementById('confirmBtn').onclick = async () => {
        try {
            const response = await fetch(`${API_URL}/products/${productId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const data = await response.json();
            
            if (data.success) {
                showToast('Producto eliminado exitosamente', 'success');
                loadProducts();
                loadInventory();
            } else {
                showToast(data.message || 'Error al eliminar', 'error');
            }
        } catch (error) {
            showToast('Error de conexión', 'error');
        }
        closeModal('confirmModal');
    };
    openModal('confirmModal');
}

function resetForm() {
    document.getElementById('formTitle').textContent = 'Agregar Nuevo Producto';
    document.getElementById('productId').value = '';
    document.getElementById('productForm').reset();
    document.getElementById('productStock').value = '10';
}

// ==========================================
// 5. GESTIÓN DE INVENTARIO
// ==========================================

async function loadInventory() {
    try {
        const response = await fetch(`${API_URL}/products?activo=true`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
            renderInventory(data.data);
        }
    } catch (error) {
        showToast('Error cargando inventario', 'error');
    }
}

function renderInventory(products) {
    const container = document.getElementById('inventoryList');
    const lowStockContainer = document.getElementById('lowStockList');
    
    if (!products || products.length === 0) {
        container.innerHTML = '<p class="loading">No hay productos en inventario</p>';
        return;
    }
    
    // Productos con stock bajo
    const lowStock = products.filter(p => p.stock <= 5);
    
    if (lowStock.length > 0) {
        document.getElementById('lowStockAlerts').style.display = 'block';
        lowStockContainer.innerHTML = lowStock.map(p => `
            <div class="alert-item">
                <span><i class="fas fa-exclamation-circle"></i> ${p.nombre}</span>
                <span style="color:var(--danger); font-weight:bold;">${p.stock} unidades</span>
            </div>
        `).join('');
    } else {
        document.getElementById('lowStockAlerts').style.display = 'none';
    }
    
    container.innerHTML = products.map(product => {
        let stockPercent = (product.stock / 50) * 100; // Asumiendo 50 como máximo
        let stockClass = product.stock > 10 ? 'high' : product.stock > 3 ? 'medium' : 'low';
        
        return `
            <div class="inventory-item">
                <img src="${product.img}" alt="${product.nombre}"
                     onerror="this.src='https://via.placeholder.com/60?text=N/A'">
                <div class="inventory-info">
                    <h4>${product.nombre}</h4>
                    <p style="color:#888; font-size:0.85rem;">$${product.precio.toLocaleString('es-CO')}</p>
                    <div class="stock-bar">
                        <div class="stock-fill ${stockClass}" style="width:${Math.min(stockPercent, 100)}%"></div>
                    </div>
                    <p style="font-size:0.8rem; margin-top:5px;">
                        <span class="${product.stock > 10 ? 'stock-high' : product.stock > 3 ? 'stock-medium' : 'stock-low'}">
                            Stock: ${product.stock}
                        </span>
                    </p>
                </div>
                <div class="stock-controls">
                    <button onclick="updateStock('${product._id}', -1, ${product.stock})" ${product.stock <= 0 ? 'disabled' : ''}>
                        <i class="fas fa-minus"></i>
                    </button>
                    <span>${product.stock}</span>
                    <button onclick="updateStock('${product._id}', 1)">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

async function updateStock(productId, cantidad, currentStock) {
    if (currentStock !== undefined && currentStock + cantidad < 0) {
        showToast('No se puede reducir el stock por debajo de 0', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/products/${productId}/stock`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ cantidad })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message, 'success');
            loadInventory();
            loadProducts();
        } else {
            showToast(data.message || 'Error al actualizar stock', 'error');
        }
    } catch (error) {
        showToast('Error de conexión', 'error');
    }
}

// ==========================================
// 6. UTILIDADES
// ==========================================

function switchTab(tabName) {
    // Actualizar botones
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const tabBtn = document.querySelector(`[onclick*="${tabName}"]`);
    if (tabBtn) tabBtn.classList.add('active');
    
    // Actualizar contenido
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    const tabContent = document.getElementById(`${tabName}-tab`);
    if (tabContent) tabContent.classList.add('active');
    
    // Cargar datos según tab
    if (tabName === 'orders') loadOrders();
    else if (tabName === 'products') loadProducts();
    else if (tabName === 'inventory') loadInventory();
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = '';
    if (type === 'success') icon = '<i class="fas fa-check-circle"></i>';
    else if (type === 'error') icon = '<i class="fas fa-times-circle"></i>';
    else if (type === 'warning') icon = '<i class="fas fa-exclamation-triangle"></i>';
    
    toast.innerHTML = `${icon} ${message}`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s reverse forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Cerrar modales al hacer clic fuera
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
}

// ==========================================
// 7. SCRIPT PARA CREAR USUARIO VENDEDOR
// ==========================================
// Ejecutar en consola del navegador o en el backend:
/*
fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        alias: 'vendedor1',
        email: 'vendedor@purpledesire.com',
        password: 'Vendedor123!',
        rol: 'vendedor'
    })
})
.then(res => res.json())
.then(data => console.log(data));
*/