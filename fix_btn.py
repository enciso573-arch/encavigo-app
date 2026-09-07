import re
import time

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

old_btn_block = r'<a href="\$\{waUrl\}" target="_blank" rel="noopener" class="swipe-btn track-click" data-campid="\$\{camp\.id\}">\s*Activar c[ó]digo\s*<\/a>'

new_btn_block = """${camp.isWelcome 
                        ? '<div class="swipe-btn" style="background:#F97316; cursor:default;">Desliza hacia arriba para empezar 👇</div>' 
                        : `<a href="${waUrl}" target="_blank" rel="noopener" class="swipe-btn track-click" data-campid="${camp.id}">Activar código</a>`}"""

html = re.sub(old_btn_block, new_btn_block, html)

html += f"<!-- v57 {time.time()} -->"
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
