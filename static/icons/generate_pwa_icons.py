#!/usr/bin/env python3
"""
Generador automático de iconos PWA para el Consultor de Precios
Crea todos los iconos necesarios para la aplicación PWA
"""

import os
from PIL import Image, ImageDraw, ImageFont
import sys

def create_icon(size, output_path):
    """Crear un icono PWA del tamaño especificado"""
    
    # Crear imagen con fondo degradado azul
    img = Image.new('RGB', (size, size), color='#0d6efd')
    draw = ImageDraw.Draw(img)
    
    # Dibujar círculo blanco interior
    margin = size // 20
    draw.ellipse([margin, margin, size-margin, size-margin], 
                fill='white', outline='white')
    
    # Dibujar copa de vino simplificada
    center_x, center_y = size // 2, size // 2
    glass_width = size // 4
    glass_height = size // 3
    
    # Copa (triángulo invertido)
    glass_points = [
        (center_x - glass_width//2, center_y - glass_height//2),
        (center_x + glass_width//2, center_y - glass_height//2),
        (center_x, center_y + glass_height//2)
    ]
    draw.polygon(glass_points, fill='#8B0000', outline='#8B0000')
    
    # Líquido del vino (parte inferior del triángulo)
    liquid_points = [
        (center_x - glass_width//3, center_y),
        (center_x + glass_width//3, center_y),
        (center_x, center_y + glass_height//3)
    ]
    draw.polygon(liquid_points, fill='#DC143C', outline='#DC143C')
    
    # Tallo de la copa
    stem_width = size // 20
    stem_height = size // 6
    stem_x = center_x - stem_width//2
    stem_y = center_y + glass_height//2
    draw.rectangle([stem_x, stem_y, stem_x + stem_width, stem_y + stem_height], 
                  fill='#8B0000', outline='#8B0000')
    
    # Base de la copa
    base_width = size // 6
    base_height = size // 15
    base_x = center_x - base_width//2
    base_y = stem_y + stem_height
    draw.ellipse([base_x, base_y, base_x + base_width, base_y + base_height], 
                fill='#8B0000', outline='#8B0000')
    
    # Agregar símbolos $ y €
    try:
        # Intentar usar una fuente del sistema
        font_size = max(size // 12, 10)
        font = ImageFont.truetype("arial.ttf", font_size)
    except:
        # Usar fuente por defecto si no se encuentra arial
        font = ImageFont.load_default()
    
    # Símbolo $ (izquierda)
    dollar_x = center_x - glass_width
    dollar_y = center_y + glass_height//2
    draw.text((dollar_x, dollar_y), '$', fill='#0d6efd', font=font)
    
    # Símbolo € (derecha)
    euro_x = center_x + glass_width - size//20
    euro_y = center_y + glass_height//2
    draw.text((euro_x, euro_y), '€', fill='#0d6efd', font=font)
    
    # Guardar imagen
    img.save(output_path, 'PNG', quality=95)
    print(f"✅ Icono creado: {output_path} ({size}x{size})")

def generate_all_icons():
    """Generar todos los iconos PWA necesarios"""
    
    # Tamaños requeridos para PWA
    sizes = [72, 96, 128, 144, 152, 192, 384, 512]
    
    # Directorio de salida
    output_dir = os.path.dirname(os.path.abspath(__file__))
    
    print("🎨 Generando iconos PWA para Consultor de Precios...")
    print(f"📁 Directorio: {output_dir}")
    
    for size in sizes:
        output_path = os.path.join(output_dir, f'icon-{size}x{size}.png')
        try:
            create_icon(size, output_path)
        except Exception as e:
            print(f"❌ Error creando icono {size}x{size}: {e}")
    
    print(f"\n🎉 ¡Todos los iconos PWA generados exitosamente!")
    print(f"📂 Ubicación: {output_dir}")
    
    # Verificar archivos creados
    print("\n📋 Archivos creados:")
    for size in sizes:
        icon_path = os.path.join(output_dir, f'icon-{size}x{size}.png')
        if os.path.exists(icon_path):
            file_size = os.path.getsize(icon_path)
            print(f"  ✓ icon-{size}x{size}.png ({file_size} bytes)")
        else:
            print(f"  ✗ icon-{size}x{size}.png (no encontrado)")

if __name__ == "__main__":
    try:
        generate_all_icons()
    except ImportError:
        print("❌ Error: Pillow (PIL) no está instalado.")
        print("📦 Instala con: pip install Pillow")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        sys.exit(1)