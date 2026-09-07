import re
import time

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Replace the SVG shield in header
old_svg = r"<div class=\"header-logo\">.*?<\/svg>\s*<\/div>"
new_svg = """<div class="header-logo" style="background: white; display: flex; align-items: center; justify-content: center; padding: 2px;">
    <img src="logo_icon.png" style="width: 20px; height: 20px; object-fit: contain;">
</div>"""
html = re.sub(old_svg, new_svg, html, flags=re.DOTALL)

# 2. Update the welcomeCard object
old_welcome_obj = r"const welcomeCard = \{.*?img: \"\" \s*\};"
new_welcome_obj = """const welcomeCard = {
            isWelcome: true,
            title: "¡Bienvenido a EncaviGO!",
            desc: "Desliza tu dedo hacia arriba para descubrir ofertas exclusivas, restaurantes y negocios cerca de tu ruta.\\n\\n🎲 ¡Toca el botón naranja de arriba para jugar y ganar tu VIAJE GRATIS!",
            badge: "¡GRACIAS POR ESCANEAR!",
            img: "logo_full.png" 
        };"""
html = re.sub(old_welcome_obj, new_welcome_obj, html, flags=re.DOTALL)

# 3. Update the card HTML generation to show logo_full.png perfectly
old_card_html = r"<div class=\"card-bg\" style=\"background-image: url\('\$\{camp\.img \|\| ''\}'\); \$\{camp\.isWelcome \? 'background: linear-gradient.*?<\/div>"
new_card_html = """<div class="card-bg" style="background-image: url('${camp.img || ''}'); ${camp.isWelcome ? 'background-color: #FFF6EC; background-size: contain; background-position: center 30%; background-repeat: no-repeat;' : ''}"></div>"""
html = re.sub(old_card_html, new_card_html, html, flags=re.DOTALL)

html += f"<!-- v55 {time.time()} -->"
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
