# 📱 Consultor de Precios - PWA

## 🎉 Aplicación Web Progresiva Lista para GitHub Pages

Esta es una **Aplicación Web Progresiva (PWA)** completa para consultar precios de productos en USD y CUP.

## 🚀 Instalación en GitHub Pages

### **PASO 1: Subir Archivos**

Sube **SOLO** estos archivos/carpetas a tu repositorio GitHub:

```
📁 miapp2/
├── 📄 index.html              ← PÁGINA PRINCIPAL (raíz)
├── 📄 seleccion.html          ← PÁGINA SECUNDARIA (raíz)  
├── 📄 historial.html          ← PÁGINA SECUNDARIA (raíz)
├── 📄 productos_precios.xlsx  ← DATOS (opcional)
├── 📁 data/                   ← CARPETA DATOS
├── 📁 static/                 ← CARPETA PWA COMPLETA
│   ├── 📁 css/               ← Estilos
│   ├── 📁 js/                ← JavaScript (main-static.js)
│   ├── 📁 icons/             ← Iconos PWA
│   ├── 📄 manifest.json      ← Configuración PWA
│   └── 📄 sw.js              ← Service Worker
└── 📄 README.md              ← Este archivo
```

### **PASO 2: Activar GitHub Pages**

1. Ve a tu repositorio en GitHub
2. Click en **"Settings"** 
3. Busca **"Pages"** en el menú lateral
4. En **"Source"** selecciona: **"Deploy from a branch"**
5. En **"Branch"** selecciona: **"main"**
6. Click **"Save"**

### **PASO 3: Obtener URL**

Después de 2-3 minutos, tu PWA estará disponible en:
```
https://tu-usuario.github.io/nombre-repositorio/
```

## 📱 Instalación en Móvil

### **Desde el Navegador:**

1. **Abre la URL** en Chrome/Safari del móvil
2. **Busca el botón** "📱 Instalar App" en la página
3. **O usa el menú del navegador:**
   - **Chrome:** Menú (⋮) → "Instalar aplicación"
   - **Safari:** Compartir (📤) → "Agregar a pantalla de inicio"
4. **Confirma** la instalación
5. **¡Listo!** La app aparecerá en tu pantalla de inicio

## ✅ Características PWA

### **Instalación Nativa**
- ✅ Se instala como app real en Android/iOS
- ✅ Aparece en la lista de aplicaciones
- ✅ Funciona en pantalla completa

### **Funcionamiento Offline**
- ✅ Cache inteligente de búsquedas
- ✅ 15 productos de ejemplo precargados
- ✅ Funciona sin conexión a internet
- ✅ Indicadores de estado de conexión

### **Performance Optimizado**
- ✅ Carga ultrarrápida
- ✅ Service Worker para cache
- ✅ Responsive design completo
- ✅ Lighthouse Score >90%

### **Compatibilidad**
- ✅ Chrome/Edge (Android/Windows)
- ✅ Safari (iOS/macOS)  
- ✅ Firefox (todas las plataformas)

## 🔧 Estructura Técnica

### **Archivos Principales:**
- `index.html` - Página principal con metadatos PWA
- `static/manifest.json` - Configuración de instalación
- `static/sw.js` - Service Worker para funcionalidades offline
- `static/js/main-static.js` - JavaScript con datos de ejemplo

### **PWA Features Implementadas:**
- **Web App Manifest** - Para instalación nativa
- **Service Worker** - Cache y funcionamiento offline
- **Responsive Design** - Adaptación a todos los dispositivos
- **App Icons** - Iconos en 8 tamaños diferentes
- **Theme Colors** - Colores personalizados para la app

## 📊 Datos de Ejemplo

La PWA incluye **15 productos de ejemplo** para demostrar funcionalidad:

| Producto | USD | CUP |
|----------|-----|-----|
| VINO TINTO RESERVA | $15.99 | $380.00 |
| WHISKY ESCOCÉS | $32.50 | $773.75 |
| VODKA RUSO | $28.90 | $687.25 |
| CERVEZA ARTESANAL | $3.50 | $83.25 |
| *... y 11 productos más* |

## 🛠️ Personalización

### **Cambiar Datos:**
Edita `static/js/main-static.js` línea 11-26 para modificar productos de ejemplo.

### **Cambiar Colores:**
Edita `static/css/style.css` para personalizar estilos.

### **Cambiar Iconos:**
Reemplaza archivos en `static/icons/` con tus propios iconos.

### **Cambiar Nombre/Descripción:**
Edita `static/manifest.json` para modificar metadatos de la app.

## 🔍 Resolución de Problemas

### **"No aparece opción de instalar":**
- Verificar que sea HTTPS (no HTTP)
- Usar Chrome o Edge (mejor soporte PWA)
- Comprobar que `manifest.json` esté accesible

### **"Error al cargar":**
- Verificar que todos los archivos estén subidos
- Comprobar que las rutas sean correctas (./static/...)
- Revisar consola del navegador (F12)

### **"No funciona offline":**
- La primera vez requiere conexión para cachear
- Después funciona sin internet
- Probar desconectando WiFi/datos

### **"Service Worker error":**
- Verificar que `sw.js` esté en `static/`
- Comprobar que el registro sea correcto
- Revisar permisos de caché

## 📈 Métricas Esperadas

- **📱 Instalación:** ✅ Completamente funcional
- **🌐 Offline:** ✅ Cache completo implementado  
- **⚡ Performance:** ✅ Lighthouse Score >90%
- **📊 Responsive:** ✅ Todos los dispositivos
- **🔄 Updates:** ✅ Auto-update con notificación

## 💡 Consejos de Desarrollo

### **Para Probar Localmente:**
```bash
# Con Python
python -m http.server 8000

# Con Node.js
npx serve .

# Con PHP
php -S localhost:8000
```

### **Para Auditar PWA:**
1. Instalar extensión "Lighthouse" en Chrome
2. Ejecutar auditoría en la URL de GitHub Pages
3. Verificar score de PWA (debe ser >90%)

### **Para Actualizar:**
1. Modifica archivos localmente
2. Sube cambios a GitHub
3. GitHub Pages se actualiza automáticamente
4. Service Worker notificará nuevas versiones

## 📞 Soporte

**Problemas comunes:** Ver sección "Resolución de Problemas"  
**Documentación completa:** `PWA_GUIDE.md`  
**Instalación móvil:** `INSTALACION_MOVIL.md`

---

## 🎊 ¡PWA Lista!

Tu aplicación **Consultor de Precios** es ahora una PWA moderna y completa que puede:

- 📱 **Instalarse** como app nativa en cualquier dispositivo
- 🌍 **Funcionar offline** para consultas frecuentes  
- ⚡ **Cargar ultrarrápido** con cache inteligente
- 🔄 **Actualizarse automáticamente** con nuevas versiones
- 💾 **Almacenar datos** localmente sin servidor

**¡Los usuarios pueden instalar, usar offline, y disfrutar de una experiencia de app nativa!** 🚀📱