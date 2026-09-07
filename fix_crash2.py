import re
import time

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Fix the multiline string in the welcomeCard desc
old_desc = r'desc: "Desliza tu dedo.*?VIAJE GRATIS!",'
new_desc = 'desc: "Desliza tu dedo hacia arriba para descubrir ofertas exclusivas, restaurantes y negocios cerca de tu ruta.<br><br>🎲 ¡Toca el botón naranja de arriba para jugar y ganar tu VIAJE GRATIS!",'
html = re.sub(old_desc, new_desc, html, flags=re.DOTALL)

# 2. Fix the card-bg replacement (it failed in the last script)
# First we find the immersive-card block
old_card_block_match = re.search(r'<article class="immersive-card">\s*<div class="card-bg"[^>]*></div>', html)
if old_card_block_match:
    new_card_block = """<article class="immersive-card">
                  <div class="card-bg" style="background-image: url('${camp.img || ''}'); ${camp.isWelcome ? 'background-color: #FFF6EC; background-size: contain; background-position: center 30%; background-repeat: no-repeat;' : ''}"></div>"""
    html = html.replace(old_card_block_match.group(0), new_card_block)

# 3. Check for the old fullMsg that crashed if session is undefined
old_fullmsg = r"const fullMsg = `\$\{waMsg\} Mi cdigo de promo es: \$\{session\.code\} \(Unidad: \$\{session\.chofer\}\)`;"
new_fullmsg = "const fullMsg = `${waMsg} Mi código de promo es: ${session ? session.code : 'N/A'} (Unidad: ${session ? session.chofer : 'N/A'})`;"
html = html.replace("const fullMsg = `${waMsg} Mi código de promo es: ${session.code} (Unidad: ${session.chofer})`;", new_fullmsg)

html += f"<!-- v56 {time.time()} -->"
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
