let ws = null;
let ultimaBusqueda = '';
let dropdownVisible = false;
let selectedIndex = -1;
let isOnline = navigator.onLine;
let cacheVersion = null;
let productosCache = new Map();

// Cargar productos reales desde JSON
let productosReales = [];
let productosCargados = false;

// Cargar datos de productos desde JSON
async function cargarProductos() {
    try {
        const response = await fetch('./data/productos.json');
        const data = await response.json();
        productosReales = data.productos || [];
        productosCargados = true;
        console.log(`✅ Productos cargados: ${productosReales.length}`);
        
        // Mostrar algunos ejemplos en consola
        if (productosReales.length > 0) {
            console.log('Ejemplos de productos:', productosReales.slice(0, 3));
        }
        
        return true;
    } catch (error) {
        console.error('Error cargando productos:', error);
        return false;
    }
}

// Datos de ejemplo como fallback
const productosEjemplo = [
    { Producto: "VINO TINTO RESERVA", USD: 15.99, CUP: 380.00 },
    { Producto: "VINO BLANCO CHARDONNAY", USD: 18.75, CUP: 446.25 },
    { Producto: "WHISKY ESCOCÉS", USD: 32.50, CUP: 773.75 },
    { Producto: "VODKA RUSO", USD: 28.90, CUP: 687.25 },
    { Producto: "CERVEZA ARTESANAL", USD: 3.50, CUP: 83.25 }
];

// Estado de conectividad
function updateOnlineStatus() {
    isOnline = navigator.onLine;
    const status = document.getElementById('connection-status');
    if (status) {
        status.className = isOnline ? 'alert alert-success' : 'alert alert-warning';
        status.textContent = isOnline ? '🌐 Conectado' : '📱 Modo Offline';
    }
}

// Escuchar cambios de conectividad
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// Verificar versión del cache
async function checkCacheVersion() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        return new Promise((resolve) => {
            navigator.serviceWorker.controller.postMessage({ type: 'GET_VERSION' });
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.version) {
                    cacheVersion = event.data.version;
                    resolve(cacheVersion);
                }
            }, { once: true });
        });
    }
}

// Cache inteligente de productos
function cacheProductData(query, data) {
    const key = query.toLowerCase().trim();
    productosCache.set(key, {
        data: data,
        timestamp: Date.now()
    });
    
    // Limitar cache a 50 consultas
    if (productosCache.size > 50) {
        const firstKey = productosCache.keys().next().value;
        productosCache.delete(firstKey);
    }
}

// Obtener productos del cache
function getCachedProductData(query) {
    const key = query.toLowerCase().trim();
    const cached = productosCache.get(key);
    
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutos
        return cached.data;
    }
    return null;
}

// Buscar productos en datos reales
function buscarProductos(query) {
    if (!query) return [];
    
    // Usar productos reales si están cargados, sino usar ejemplos
    const productos = productosCargados ? productosReales : productosEjemplo;
    
    query = query.toUpperCase().trim();
    return productos.filter(prod => 
        prod.Producto.toUpperCase().includes(query)
    ).slice(0, 50);
}

// Buscar productos con cache (versión estática)
async function buscar() {
    const query = document.getElementById('busqueda').value;
    ultimaBusqueda = query;
    
    if (!query) {
        document.getElementById('resultados').innerHTML = 
            '<div class="alert alert-info">Escribe algo para buscar...</div>';
        return;
    }

    // Usar productos reales si están cargados, sino datos de ejemplo
    const productos = productosCargados ? productosReales : productosEjemplo;
    const resultados = buscarProductos(query);
    const data = { productos: resultados };
    
    // Cachear resultados exitosos
    if (resultados.length > 0) {
        cacheProductData(query, data);
    }
    
    // Mostrar mensaje sobre fuente de datos
    let mensaje = '';
    if (productosCargados) {
        mensaje = `<div class="alert alert-success mb-3">✅ Mostrando ${resultados.length} productos de tu catálogo (${productos.length} total)</div>`;
    } else {
        mensaje = `<div class="alert alert-warning mb-3">⚠️ Mostrando productos de ejemplo (${resultados.length} de ${productos.length})</div>`;
    }
    
    mostrarResultados(data, false, mensaje);
}

// Mostrar resultados
function mostrarResultados(data, fromCache = false, mensajeAdicional = '') {
    const resultadosDiv = document.getElementById('resultados');
    
    if (data.productos.length === 0) {
        resultadosDiv.innerHTML = 
            '<div class="alert alert-warning">No se encontraron productos.</div>';
        return;
    }

    // Crear tabla
    let tabla = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead class="table-dark">
                    <tr>
                        <th>Producto</th>
                        <th style="width: 120px;">USD</th>
                        <th style="width: 120px;">CUP</th>
                        ${fromCache ? '<th style="width: 100px;">Estado</th>' : ''}
                    </tr>
                </thead>
                <tbody>
    `;

    data.productos.forEach(prod => {
        tabla += `
            <tr>
                <td><strong>${prod.Producto}</strong></td>
                <td class="text-success">${parseFloat(prod.USD).toFixed(2)}</td>
                <td class="text-primary">${parseFloat(prod.CUP).toFixed(2)}</td>
                ${fromCache ? '<td><span class="badge bg-info">Cache</span></td>' : ''}
            </tr>
        `;
    });

    tabla += '</tbody></table></div>';
    
    // Construir contenido final
    let contenidoFinal = '';
    
    // Agregar mensaje adicional si existe
    if (mensajeAdicional) {
        contenidoFinal += mensajeAdicional;
    }
    
    // Agregar indicador de estado
    if (fromCache) {
        contenidoFinal += `<div class="alert alert-info mb-3">📱 Mostrando datos desde cache (modo offline)</div>`;
    }
    
    contenidoFinal += tabla;
    
    resultadosDiv.innerHTML = contenidoFinal;
}

// Obtener sugerencias (versión estática)
async function obtenerSugerencias(query) {
    try {
        const productos = productosCargados ? productosReales : productosEjemplo;
        const resultados = buscarProductos(query);
        return resultados.slice(0, 10).map(prod => prod.Producto);
    } catch (error) {
        console.error('Error obteniendo sugerencias:', error);
        return [];
    }
}

// Agregar indicador de estado de conexión
function addConnectionStatus() {
    const navbar = document.querySelector('.navbar + .container .card');
    if (navbar && !document.getElementById('connection-status')) {
        const statusDiv = document.createElement('div');
        statusDiv.id = 'connection-status';
        
        let mensaje = '';
        if (productosCargados) {
            mensaje = `✅ PWA con ${productosReales.length} productos reales cargados`;
            statusDiv.className = 'alert alert-success mb-3';
        } else {
            mensaje = '⚠️ PWA con datos de ejemplo (productos no cargados)';
            statusDiv.className = 'alert alert-warning mb-3';
        }
        
        statusDiv.innerHTML = mensaje;
        
        const cardBody = navbar.querySelector('.card-body');
        if (cardBody) {
            cardBody.insertBefore(statusDiv, cardBody.firstChild);
        }
    }
}

// Mostrar dropdown con sugerencias
function mostrarDropdown(sugerencias) {
    const dropdown = document.getElementById('autocomplete-dropdown');
    if (sugerencias.length === 0) {
        dropdown.style.display = 'none';
        dropdownVisible = false;
        return;
    }

    let html = '';
    sugerencias.forEach((sugerencia, index) => {
        html += `<div class="autocomplete-item" data-index="${index}">${sugerencia}</div>`;
    });

    dropdown.innerHTML = html;
    dropdown.style.display = 'block';
    dropdownVisible = true;
    selectedIndex = -1;

    // Event listeners para items
    document.querySelectorAll('.autocomplete-item').forEach(item => {
        item.addEventListener('click', function() {
            seleccionarSugerencia(this.textContent);
        });
    });
}

// Ocultar dropdown
function ocultarDropdown() {
    const dropdown = document.getElementById('autocomplete-dropdown');
    if (dropdown) {
        dropdown.style.display = 'none';
    }
    dropdownVisible = false;
    selectedIndex = -1;
}

// Seleccionar sugerencia
function seleccionarSugerencia(sugerencia) {
    const busquedaInput = document.getElementById('busqueda');
    if (busquedaInput) {
        busquedaInput.value = sugerencia;
    }
    ocultarDropdown();
    buscar();
}

// Manejar navegación por teclado
function manejarTeclado(e) {
    const dropdown = document.getElementById('autocomplete-dropdown');
    const items = document.querySelectorAll('.autocomplete-item');

    if (!dropdownVisible || items.length === 0) return;

    // Flecha abajo
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = (selectedIndex + 1) % items.length;
        actualizarSeleccion();
    }
    // Flecha arriba
    else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = selectedIndex <= 0 ? items.length - 1 : selectedIndex - 1;
        actualizarSeleccion();
    }
    // Enter
    else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        seleccionarSugerencia(items[selectedIndex].textContent);
    }
    // Escape
    else if (e.key === 'Escape') {
        ocultarDropdown();
    }
}

function actualizarSeleccion() {
    document.querySelectorAll('.autocomplete-item').forEach((item, index) => {
        item.classList.toggle('selected', index === selectedIndex);
    });
}

// Event listener para input
document.addEventListener('DOMContentLoaded', function() {
    const busquedaInput = document.getElementById('busqueda');
    if (busquedaInput) {
        busquedaInput.addEventListener('input', async function(e) {
            const query = e.target.value.trim();

            if (query.length >= 2) { // Reducido a 2 caracteres para mejor UX
                const sugerencias = await obtenerSugerencias(query);
                mostrarDropdown(sugerencias);
            } else {
                ocultarDropdown();
            }
        });

        // Buscar al presionar Enter (solo si no hay dropdown visible)
        busquedaInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                if (dropdownVisible && selectedIndex >= 0) {
                    // Si hay selección en dropdown, ya se maneja en manejarTeclado
                    return;
                }
                buscar();
            }
        });

        // Event listener para teclado
        busquedaInput.addEventListener('keydown', manejarTeclado);
    }
});

// Ocultar dropdown al hacer click fuera
document.addEventListener('click', function(e) {
    const input = document.getElementById('busqueda');
    const dropdown = document.getElementById('autocomplete-dropdown');
    if (input && dropdown && !input.contains(e.target) && !dropdown.contains(e.target)) {
        ocultarDropdown();
    }
});

// Inicialización PWA al cargar la página
window.addEventListener('load', function() {
    console.log("🚀 Consultor de Precios PWA Estático iniciado");
    
    // Actualizar estado de conectividad
    updateOnlineStatus();
    
    // Agregar indicador de conexión
    addConnectionStatus();
    
    // Verificar versión del cache
    checkCacheVersion();
    
    // Mostrar información PWA en consola
    console.log('PWA Features:', {
        serviceWorker: 'serviceWorker' in navigator,
        online: isOnline,
        cacheVersion: cacheVersion,
        appCache: productosCache.size,
        productosEjemplo: productosEjemplo.length
    });
});

// Exportar funciones para uso global
window.PWAApp = {
    buscar,
    isOnline: () => isOnline,
    checkCacheVersion,
    productosCache: () => productosCache,
    productosEjemplo
};