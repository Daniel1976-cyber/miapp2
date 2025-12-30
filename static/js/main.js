let ws = null;
let ultimaBusqueda = '';
let dropdownVisible = false;
let selectedIndex = -1;
let isOnline = navigator.onLine;
let cacheVersion = null;
let productosCache = new Map();

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

// Buscar productos con cache
async function buscar() {
    const query = document.getElementById('busqueda').value;
    ultimaBusqueda = query;
    
    if (!query) {
        document.getElementById('resultados').innerHTML = 
            '<div class="alert alert-info">Escribe algo para buscar...</div>';
        return;
    }

    // Verificar cache primero si está offline
    if (!isOnline) {
        const cachedData = getCachedProductData(query);
        if (cachedData) {
            mostrarResultados(cachedData, true);
            return;
        } else {
            document.getElementById('resultados').innerHTML = 
                '<div class="alert alert-warning">📱 Modo offline - No hay datos cacheados para esta búsqueda.</div>';
            return;
        }
    }

    try {
        const response = await fetch(`/api/productos/buscar?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        // Cachear resultados exitosos
        if (data.productos && data.productos.length > 0) {
            cacheProductData(query, data);
        }
        
        mostrarResultados(data, false);

    } catch (error) {
        console.error('Error en búsqueda:', error);
        
        // Fallback al cache en caso de error de red
        const cachedData = getCachedProductData(query);
        if (cachedData) {
            mostrarResultados(cachedData, true);
            document.getElementById('resultados').innerHTML += 
                '<div class="alert alert-warning mt-2">⚠️ Usando datos cacheados - Error de conexión.</div>';
        } else {
            document.getElementById('resultados').innerHTML = 
                '<div class="alert alert-danger">❌ Error al buscar. Verifica tu conexión.</div>';
        }
    }
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
                <td class="text-success">${parseFloat(prod.USD).toFixed(2)}</td>
                <td class="text-primary">${parseFloat(prod.CUP).toFixed(2)}</td>
                ${fromCache ? '<td><span class="badge bg-info">Cache</span></td>' : ''}
            </tr>
        `;
    });

    tabla += '</tbody></table></div>';
    
    // Agregar indicador de estado
    if (fromCache) {
        tabla = `<div class="alert alert-info mb-3">📱 Mostrando datos desde cache (modo offline)</div>` + tabla;
    }
    
    resultadosDiv.innerHTML = tabla;
}

// Cargar historial con manejo de cache
async function cargarHistorial() {
    try {
        const response = await fetch('/api/historial');
        const data = await response.json();
        const container = document.getElementById('historial-content');

        if (data.historial.length === 0) {
            container.innerHTML = '<div class="alert alert-info">No hay historial disponible.</div>';
            return;
        }

        let html = '<ul class="list-group">';
        data.historial.forEach(item => {
            html += `<li class="list-group-item">${item}</li>`;
        });
        html += '</ul>';
        container.innerHTML = html;
    } catch (error) {
        document.getElementById('historial-content').innerHTML =
            '<div class="alert alert-danger">Error al cargar historial.</div>';
    }
}

// Agregar indicador de estado de conexión
function addConnectionStatus() {
    const navbar = document.querySelector('.navbar + .container .card');
    if (navbar && !document.getElementById('connection-status')) {
        const statusDiv = document.createElement('div');
        statusDiv.id = 'connection-status';
        statusDiv.className = 'alert alert-success mb-3';
        statusDiv.innerHTML = '🌐 Conectado';
        
        const cardBody = navbar.querySelector('.card-body');
        cardBody.insertBefore(statusDiv, cardBody.firstChild);
    }
}

// Función de utilidad para formatear fechas
function formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleString('es-ES');
}

// Exportar funciones para uso global
window.PWAApp = {
    buscar,
    cargarHistorial,
    isOnline: () => isOnline,
    checkCacheVersion,
    productosCache: () => productosCache
};

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
    document.getElementById('autocomplete-dropdown').style.display = 'none';
    dropdownVisible = false;
    selectedIndex = -1;
}

// Seleccionar sugerencia
function seleccionarSugerencia(sugerencia) {
    document.getElementById('busqueda').value = sugerencia;
    ocultarDropdown();
    buscar();
}

// Obtener sugerencias
async function obtenerSugerencias(query) {
    try {
        const response = await fetch(`/api/productos/buscar?q=${encodeURIComponent(query)}&limite=10`);
        const data = await response.json();
        return data.productos.map(prod => prod.Producto);
    } catch (error) {
        console.error('Error obteniendo sugerencias:', error);
        return [];
    }
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
document.getElementById('busqueda').addEventListener('input', async function(e) {
    const query = e.target.value.trim();

    if (query.length >= 4) {
        const sugerencias = await obtenerSugerencias(query);
        mostrarDropdown(sugerencias);
    } else {
        ocultarDropdown();
    }
});

// Buscar al presionar Enter (solo si no hay dropdown visible)
document.getElementById('busqueda').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        if (dropdownVisible && selectedIndex >= 0) {
            // Si hay selección en dropdown, ya se maneja en manejarTeclado
            return;
        }
        buscar();
    }
});

// Event listener para teclado
document.getElementById('busqueda').addEventListener('keydown', manejarTeclado);

// Ocultar dropdown al hacer click fuera
document.addEventListener('click', function(e) {
    const input = document.getElementById('busqueda');
    const dropdown = document.getElementById('autocomplete-dropdown');
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
        ocultarDropdown();
    }
});

// Inicialización PWA al cargar la página
window.onload = function() {
    console.log("🚀 Consultor de Precios PWA iniciado");
    
    // Actualizar estado de conectividad
    updateOnlineStatus();
    
    // Agregar indicador de conexión
    addConnectionStatus();
    
    // Verificar versión del cache
    checkCacheVersion();
    
    // Conectar WebSocket solo si está online
    if (isOnline) {
        conectarWebSocket();
    } else {
        console.log("📱 Modo offline - WebSocket deshabilitado");
    }
    
    // Mostrar información PWA en consola
    console.log('PWA Features:', {
        serviceWorker: 'serviceWorker' in navigator,
        online: isOnline,
        cacheVersion: cacheVersion,
        appCache: productosCache.size
    });
};