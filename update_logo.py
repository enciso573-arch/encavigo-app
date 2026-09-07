import re
import time

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# The logo HTML string
logo_img = """<img src="logo_jackpot.jpg" style="width:55px; height:55px; border-radius:50%; vertical-align:middle; object-fit:cover; box-shadow:0 2px 8px rgba(0,0,0,0.15); margin: 0 5px;">"""

# Replace in Jackpot
html = html.replace("icons = ['🛡️', '🛡️', '🛡️'];", f"icons = ['{logo_img}', '{logo_img}', '{logo_img}'];")

# Replace in loseFood
html = html.replace("loseFood = { icon: '🛡️', name: 'EncaviGO' };", f"loseFood = {{ icon: '{logo_img}', name: 'EncaviGO' }};")

html += f"<!-- v33 {time.time()} -->"
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
