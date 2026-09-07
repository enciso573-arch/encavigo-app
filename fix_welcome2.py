import re
import time

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Fix the Welcome card
old_card_inject = r"const welcomeCard = \{.*?img: \"logo_jackpot\.jpg\".*?\};"

new_card_inject = """const welcomeCard = {
            isWelcome: true,
            title: "¡Bienvenido a EncaviGO!",
            desc: "Desliza tu dedo hacia arriba para descubrir ofertas exclusivas, restaurantes y negocios cerca de tu ruta.\\n\\n🎲 ¡Toca el botón naranja de arriba para jugar y ganar tu VIAJE GRATIS!",
            badge: "¡GRACIAS POR ESCANEAR!",
            img: "" 
        };"""
html = re.sub(old_card_inject, new_card_inject, html, flags=re.DOTALL)

# Fix the HTML generation for the Welcome card to show a nice text logo instead of the shield
old_card_html = r"<div class=\"card-bg\" style=\"background-image: url\('\$\{camp\.img \|\| ''\}'\); \$\{camp\.isWelcome \? 'background-size: contain; background-repeat: no-repeat; background-position: center 30%; background-color: #000;' : ''\}\"><\/div>"

new_card_html = """<div class="card-bg" style="background-image: url('${camp.img || ''}'); ${camp.isWelcome ? 'background: linear-gradient(135deg, #111827 0%, #000000 100%);' : ''}">
                    ${camp.isWelcome ? '<div style="position:absolute; top:35%; left:50%; transform:translate(-50%, -50%); color:white; font-size:42px; font-weight:900; letter-spacing:1px; text-shadow: 0 4px 15px rgba(249,115,22,0.5);">Encavi<span style="color:#F97316;">GO</span></div>' : ''}
                </div>"""

html = re.sub(old_card_html, new_card_html, html)

# Fix the button text for vertical swiping
old_btn = r"<div class=\"card-action-btn\" style=\"background:#4B5563;\">Desliza para descubrir 👉<\/div>"
new_btn = """<div class="card-action-btn" style="background:#F97316;">Desliza hacia arriba para empezar 👇</div>"""
html = html.replace(old_btn, new_btn)

html += f"<!-- v54 {time.time()} -->"
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
