# 📱 Cómo Instalar la PWA en tu Teléfono

## 🎯 OPCIONES RECOMENDADAS

### **OPCIÓN 1: Hosting Gratuito (MÁS FÁCIL)**

#### **GitHub Pages (Recomendado)**
1. Crear cuenta en [github.com](https://github.com)
2. Crear repositorio público
3. Subir todos los archivos de `miapp2` al repositorio
4. Activar GitHub Pages en Settings → Pages
5. Tu PWA estará disponible en: `https://tu-usuario.github.io/nombre-repo`
6. **En el teléfono**: Abrir el enlace y tocar "Instalar"

#### **Netlify/Vercel (Alternativas)**
- Similar a GitHub Pages pero con arrastrar y soltar
- Deploy instantáneo
- URLs automáticas como `https://miapp-random123.netlify.app`

### **OPCIÓN 2: Servidor Local con Tunneling**

#### **Usando ngrok (Para desarrollo)**
```bash
# 1. Instalar ngrok
# 2. Ejecutar la app
python main.py

# 3. En otra terminal
ngrok http 8000

# 4. Usar la URL HTTPS que te da ngrok en el teléfono
```

### **OPCIÓN 3: Subir a Hosting Existente**

Si tienes hosting web:
1. Subir **TODA** la carpeta `miapp2` al servidor
2. La PWA estará en: `https://tu-dominio.com/miapp2/`
3. Acceder desde el teléfono e instalar

## 📋 INSTRUCCIONES DETALLADAS

### Para GitHub Pages (Más Popular):

1. **Crear repositorio**:
   - Ve a [github.com](https://github.com) → "New repository"
   - Nombre: `consultor-precios-pwa`
   - Público → Create

2. **Subir archivos**:
   - Click "uploading an existing file"
   - Arrastra TODOS los archivos de la carpeta `miapp2`
   - Commit changes

3. **Activar GitHub Pages**:
   - Ve a Settings → Pages
   - Source: "Deploy from a branch"
   - Branch: "main" → Save

4. **Esperar 2-3 minutos** y tu PWA estará en:
   `https://tu-usuario.github.io/consultor-precios-pwa`

5. **Instalar en móvil**:
   - Abre la URL en Chrome/Safari
   - Busca el botón "📱 Instalar App" o usa el menú del navegador
   - Confirma la instalación

### Para Netlify (Más Rápido):

1. Ve a [netlify.com](https://netlify.com)
2. Arrastra la carpeta `miapp2` completa
3. Obtienes URL instantánea como: `https://amazing-name-123456.netlify.app`
4. Abre en móvil e instala

## ⚠️ IMPORTANTE: Qué Archivos Subir

### **SÍ SUBIR** (Toda la carpeta):
```
miapp2/
├── main.py
├── productos_precios.xlsx  
├── test_websocket.py
├── data/
├── static/
├── templates/
├── PWA_GUIDE.md
├── PWA_RESUMEN.md
└── INSTALACION_MOVIL.md (este archivo)
```

### **NO SUBIR**:
- Carpetas como `__pycache__/`
- Archivos temporales del sistema
- `.git/` (GitHub lo maneja automáticamente)

## 🔧 VERIFICACIÓN EN MÓVIL

Una vez instalada, la PWA debe:

1. **Abrirse en pantalla completa** (sin barra del navegador)
2. **Funcionar offline** (sin internet)
3. **Mostrar icono** en la pantalla de inicio
4. **Detectar estado de conexión** (indicador en la app)

## 🆘 Solución de Problemas

### "No aparece opción de instalar":
- Verificar que sea HTTPS (no HTTP)
- Usar Chrome o Edge (mejor soporte PWA)
- Verificar que manifest.json esté accesible

### "Error al cargar":
- Verificar que todos los archivos estén subidos
- Comprobar que las rutas sean correctas
- Revisar consola del navegador (F12)

### "No funciona offline":
- La primera vez requiere conexión para cachear
- Después funciona sin internet
- Probar desconectando WiFi/datos

## 💡 CONSEJOS FINALES

- **GitHub Pages**: Gratuito y confiable
- **Netlify**: Más rápido para probar
- **Probar primero**: Usa un servicio antes de tu dominio propio
- **Compartir**: La URL funciona en cualquier dispositivo

## 🎯 RESUMEN RÁPIDO

1. **Opción más fácil**: Subir a GitHub Pages
2. **Opción más rápida**: Netlify drag & drop  
3. **Opción profesional**: Tu hosting propio
4. **En el móvil**: Abrir URL → Instalar

¡La PWA estará funcionando en tu teléfono en menos de 10 minutos! 🚀📱