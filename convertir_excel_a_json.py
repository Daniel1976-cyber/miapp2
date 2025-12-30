#!/usr/bin/env python3
"""
Convertir archivo Excel a JSON para PWA
Convierte productos_precios.xlsx a formato JSON para uso en PWA estática
"""

import pandas as pd
import json
import sys
from pathlib import Path

def convertir_excel_a_json():
    """Convierte el archivo Excel a JSON para la PWA"""
    
    archivo_excel = Path("data/productos_precios.xlsx")
    archivo_json = Path("static/productos.json")
    
    print("🔄 Convirtiendo Excel a JSON para PWA...")
    
    try:
        # Leer archivo Excel
        print(f"📖 Leyendo: {archivo_excel}")
        df = pd.read_excel(archivo_excel)
        
        print(f"📊 Total de filas: {len(df)}")
        print(f"📋 Columnas: {list(df.columns)}")
        
        # Filtrar filas que tienen producto válido
        df_filtrado = df[df['Producto'].notna()].copy()
        print(f"✅ Productos válidos: {len(df_filtrado)}")
        
        # Limpiar y procesar datos
        df_filtrado['Producto'] = df_filtrado['Producto'].astype(str).str.strip().str.upper()
        
        # Usar las columnas USD y CUP si existen, sino usar las últimas columnas numéricas
        columnas_numericas = df_filtrado.select_dtypes(include=['number']).columns.tolist()
        print(f"🔢 Columnas numéricas: {columnas_numericas}")
        
        # Buscar columnas USD y CUP
        usd_col = None
        cup_col = None
        
        for col in df_filtrado.columns:
            if 'USD' in str(col).upper():
                usd_col = col
            elif 'CUP' in str(col).upper():
                cup_col = col
        
        # Si no encuentra USD/CUP exactos, usar las últimas columnas numéricas
        if usd_col is None and len(columnas_numericas) >= 2:
            usd_col = columnas_numericas[-2]
            cup_col = columnas_numericas[-1]
        elif usd_col is None and len(columnas_numericas) >= 1:
            usd_col = columnas_numericas[-1]
            cup_col = columnas_numericas[-1]
        
        print(f"💰 Usando columnas: USD={usd_col}, CUP={cup_col}")
        
        # Crear lista de productos
        productos = []
        for _, row in df_filtrado.iterrows():
            producto = {
                "Producto": row['Producto'],
                "USD": float(row[usd_col]) if usd_col and pd.notna(row[usd_col]) else 0.0,
                "CUP": float(row[cup_col]) if cup_col and pd.notna(row[cup_col]) else 0.0
            }
            
            # Solo agregar productos que tengan nombre y al menos un precio
            if producto["Producto"] and producto["Producto"] != 'NAN' and (producto["USD"] > 0 or producto["CUP"] > 0):
                productos.append(producto)
        
        print(f"📦 Productos procesados: {len(productos)}")
        
        # Crear estructura JSON para PWA
        data_pwa = {
            "metadata": {
                "total_productos": len(productos),
                "fecha_conversion": "2025-12-30",
                "archivo_origen": "productos_precios.xlsx"
            },
            "productos": productos
        }
        
        # Guardar JSON
        archivo_json.parent.mkdir(exist_ok=True)
        with open(archivo_json, 'w', encoding='utf-8') as f:
            json.dump(data_pwa, f, ensure_ascii=False, indent=2)
        
        print(f"✅ JSON creado: {archivo_json}")
        print(f"📏 Tamaño archivo: {archivo_json.stat().st_size / 1024:.1f} KB")
        
        # Mostrar algunos ejemplos
        print("\n🔍 Ejemplos de productos:")
        for i, producto in enumerate(productos[:5]):
            print(f"  {i+1}. {producto['Producto'][:50]} - USD: ${producto['USD']:.2f} - CUP: ${producto['CUP']:.2f}")
        
        if len(productos) > 5:
            print(f"  ... y {len(productos) - 5} productos más")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = convertir_excel_a_json()
    if success:
        print("\n🎉 ¡Conversión completada exitosamente!")
        print("📁 Archivo creado: static/productos.json")
        print("🚀 Listo para usar en PWA")
    else:
        print("\n💥 Error en la conversión")
        sys.exit(1)