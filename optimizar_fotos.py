import os
from PIL import Image, ImageOps

INPUT_DIR = 'nuevas_fotos'
OUTPUT_DIR = 'assets'
TARGET_WIDTH = 1080
TARGET_HEIGHT = 1920

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

for filename in os.listdir(INPUT_DIR):
    if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
        filepath = os.path.join(INPUT_DIR, filename)
        
        try:
            with Image.open(filepath) as img:
                # Convert to RGB if it has alpha channel (for saving as JPG)
                if img.mode in ('RGBA', 'P'):
                    img = img.convert('RGB')
                
                # Resize and crop to center
                img_cropped = ImageOps.fit(img, (TARGET_WIDTH, TARGET_HEIGHT), method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))
                
                # Save as optimized JPG
                new_filename = os.path.splitext(filename)[0] + '.jpg'
                output_path = os.path.join(OUTPUT_DIR, new_filename)
                
                img_cropped.save(output_path, 'JPEG', quality=80, optimize=True)
                
            # Delete original after processing
            os.remove(filepath)
            print(f"✅ Procesada y optimizada: {new_filename}")
        except Exception as e:
            print(f"❌ Error al procesar {filename}: {e}")
