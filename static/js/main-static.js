let ws = null;
let ultimaBusqueda = '';
let dropdownVisible = false;
let selectedIndex = -1;
let isOnline = navigator.onLine;
let cacheVersion = null;
let productosCache = new Map();

// Datos de ejemplo para PWA estática
const productosEjemplo = [
    { Producto: "VINO TINTO RESERVA", USD: 15.99, CUP: 380.00 },
    { Producto: "VINO BLANCO CHARDONNAY", USD: 18.75, CUP: 446.25 },
    { Producto: "WHISKY ESCOCÉS", USD: 32.50, CUP: 773.75 },
    { Producto: "VODKA RUSO", USD: 28.90, CUP: 687.25 },
    { Producto: "CERVEZA ARTESANAL", USD: 3.50, CUP: 83.25 },
    { Producto: "RON CARIBEÑO", USD: 25.40, CUP: 604.50 },
    { Producto: "GINEBRA LONDON", USD: 35.75, CUP: 850.75 },
    { Producto: "TEQUILA BLANCO", USD: 22.30, CUP: 530.70 },
    { Producto: "BRANDY FRANCÉS", USD: 42.80, CUP: 1018.50 },
    { Producto: "VERMÚ DULCE", USD: 12.50, CUP: 297.50 },
    { Producto: "WHISKY AMERICANO", USD: 38.90, CUP: 925.25 },
    { Producto: "VINO ROSADO", USD: 14.25, CUP: 339.00 },
    { Producto: "LIMONCELLO", USD: 19.60, CUP: 466.50 },
    { Producto: "GRAPPA ITALIANA", USD: 31.20, CUP: 742.80 },
    { Producto: "CAVA ESPAÑOL", USD: 16.75, CUP: 398.75 }
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

// Buscar productos en datos de ejemplo
function buscarProductosEstatico(query) {
    if (!query) return [];
    
    query = query.toUpperCase().trim();
    return productosEjemplo.filter(prod => 
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

    // Usar datos de ejemplo para PWA estática
    const resultados = buscarProductosEstatico(query);
    const data = { productos: resultados };
    
    // Cachear resultados exitosos
    if (resultados.length > 0) {
        cacheProductData(query, data);
    }
    
    mostrarResultados(data, false);
}

// Mostrar resultados
function mostrarResultados(data, fromCache = false) {
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
                <td class="text-success">$${parseFloat(prod.USD).toFixed(2)}</td>
                <td class="text-primary">$${parseFloat(prod.CUP).toFixed(2)}</td>
                ${fromCache ? '<td><span class="badge bg-info">Cache</span></td>' : ''}
            </tr>
        `;
    });

    tabla += '</tbody></table></div>';
    
    // Agregar indicador de estado
    if (fromCache) {
        tabla = `<div class="alert alert-info mb-3">📱 Mostrando datos desde cache (modo offline)</div>` + tabla;
    } else {
        tabla = `<div class="alert alert-success mb-3">✅ Mostrando ${data.productos.length} productos de ejemplo</div>` + tabla;
    }
    
    resultadosDiv.innerHTML = tabla;
}

// Obtener sugerencias (versión estática)
async function obtenerSugerencias(query) {
    try {
        const resultados = buscarProductosEstatico(query);
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
        statusDiv.className = 'alert alert-success mb-3';
        statusDiv.innerHTML = '🌐 PWA Estática - Datos de Ejemplo';
        
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