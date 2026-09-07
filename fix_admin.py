import re

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

old_label = r"<label>URL de la Imagen de Fondo \(Link\)<\/label>"
new_label = """<label>URL de la Imagen de Fondo (Link)</label>
<p style="font-size: 12px; color: #64748b; margin-top: 4px; margin-bottom: 8px; line-height: 1.4;">
    <strong>Formato Ideal:</strong> Vertical (9:16) estilo TikTok/Reels.<br>
    <strong>Medidas Recomendadas:</strong> 1080 x 1920 píxeles (Mínimo 720 x 1280).<br>
    <strong>Peso:</strong> Menor a 500KB (Formato JPG o WEBP) para que no gaste los datos del pasajero.<br>
    <em>Nota: Si subes una foto cuadrada u horizontal, el sistema la recortará automáticamente (Zoom) para llenar la pantalla vertical.</em>
</p>"""

html = re.sub(old_label, new_label, html)

with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(html)
