from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import pandas as pd
import json
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime
import asyncio
import websockets.exceptions
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Consultor de Precios v2.1")

# Montar archivos estáticos
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Gestor de precios (similar al Nivel 1)
class GestorPreciosWeb:
    def __init__(self):
        self.archivo = Path("data/productos_precios.xlsx")
        self.historial = Path("data/historial_cambios.json")
        self.df = None
        self.ultima_modificacion = 0
        self.cargar_datos()
    
    def cargar_datos(self):
        """Carga datos con monitoreo de cambios"""
        try:
            if not self.archivo.exists():
                # Crear archivo de ejemplo si no existe
                self._crear_archivo_ejemplo()
            
            timestamp = self.archivo.stat().st_mtime
            if timestamp != self.ultima_modificacion:
                self.ultima_modificacion = timestamp
                logger.info("🔄 Recargando datos del Excel...")

                df = pd.read_excel(self.archivo)
                logger.info(f"Columnas del Excel: {list(df.columns)}")
                # Si las columnas no tienen los nombres esperados, renombrar las primeras 3
                if df.shape[1] >= 3 and 'Producto' not in df.columns:
                    logger.info("Renombrando columnas automáticamente")
                    df.columns = ['Producto', 'USD', 'CUP'] + list(df.columns[3:])
                df = self._procesar_datos(df)
                self.df = df
                
                logger.info(f"✓ Datos cargados: {len(self.df)} productos")
                return True
            return False
        except Exception as e:
            logger.error(f"Error cargando datos: {e}")
            return False
    
    def _crear_archivo_ejemplo(self):
        """Crea un archivo de ejemplo si no existe"""
        logger.info("Creando archivo de ejemplo...")
        df = pd.DataFrame({
            "Producto": ["VINO TINTO RESERVA", "VINO BLANCO CHARDONNAY", "WHISKY ESCOCÉS"],
            "USD": [15.99, 18.75, 32.50],
            "CUP": [380.00, 446.25, 773.75]
        })
        self.archivo.parent.mkdir(exist_ok=True)
        df.to_excel(self.archivo, index=False)
        logger.info(f"✓ Creado: {self.archivo}")
    
    def _procesar_datos(self, df: pd.DataFrame) -> pd.DataFrame:
        """Procesa y limpia datos"""
        df = df.dropna(subset=["Producto"]).copy()
        df["Producto"] = df["Producto"].astype(str).str.strip().str.upper()
        df = df.drop_duplicates(subset=["Producto"]).copy()
        df["USD"] = pd.to_numeric(df["USD"], errors="coerce").fillna(0)
        df["CUP"] = pd.to_numeric(df["CUP"], errors="coerce").fillna(0)
        df = df.sort_values("Producto").reset_index(drop=True)
        # Mantener solo las columnas necesarias para evitar errores JSON
        df = df[["Producto", "USD", "CUP"]]
        return df
    
    def buscar(self, query: str, limite: int = 50):
        """Busca productos"""
        if self.df is None or self.df.empty:
            return []
        
        query = query.upper().strip()
        if not query:
            return []
        
        # Búsqueda inteligente
        resultados = self.df[self.df["Producto"].str.contains(query, na=False)].head(limite)
        return resultados.to_dict('records')
    
    def get_historial(self):
        """Obtiene historial de cambios"""
        try:
            if self.historial.exists():
                return json.load(open(self.historial, 'r', encoding='utf-8'))
        except:
            pass
        return []

gestor = GestorPreciosWeb()

# WebSocket manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"✓ Cliente conectado. Total: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info(f"✓ Cliente desconectado. Total: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except websockets.exceptions.ConnectionClosed:
            self.disconnect(websocket)
    
    async def broadcast(self, message: str):
        for connection in self.active_connections[:]:
            try:
                await connection.send_text(message)
            except websockets.exceptions.ConnectionClosed:
                self.disconnect(connection)
            except Exception as e:
                logger.error(f"Error broadcasting: {e}")

manager = ConnectionManager()

# Rutas
@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Página principal"""
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/seleccion", response_class=HTMLResponse)
async def seleccion(request: Request):
    """Página de selección múltiple"""
    return templates.TemplateResponse("seleccion.html", {"request": request})

@app.get("/historial", response_class=HTMLResponse)
async def historial(request: Request):
    """Página de historial"""
    return templates.TemplateResponse("historial.html", {"request": request})

@app.get("/api/productos/buscar")
async def api_buscar(q: str, limite: int = 50):
    """API: Buscar productos"""
    gestor.cargar_datos()  # Verificar cambios
    resultados = gestor.buscar(q, limite)
    return {"productos": resultados}

@app.get("/api/historial")
async def api_historial():
    """API: Obtener historial"""
    return {"historial": gestor.get_historial()}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket para actualizaciones en tiempo real"""
    await manager.connect(websocket)
    try:
        while True:
            # Verificar cambios cada 3 segundos
            if gestor.cargar_datos():
                await manager.send_personal_message(
                    json.dumps({"tipo": "recargar", "mensaje": "Datos actualizados"}),
                    websocket
                )
            await asyncio.sleep(3)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"Error WebSocket: {e}")
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)