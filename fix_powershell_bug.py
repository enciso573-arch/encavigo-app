from bs4 import BeautifulSoup

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace the broken addText
broken_text = "const addText =  Mi código de promo es:  (Unidad: );"
fixed_text = "const addText =  Mi código de promo es:  (Unidad: );"
html = html.replace(broken_text, fixed_text)

# Also there's a broken template literal in radar
broken_radar = "html += <div class=\"mini-card\"><div class=\"mini-card-img\" style=\"background-image: url('');\"></div><div class=\"mini-card-info\"><h4 class=\"mini-title\"></h4><p class=\"mini-desc\"> A  mins.</p></div></div>;"
fixed_radar = "html += <div class=\"mini-card\"><div class=\"mini-card-img\" style=\"background-image: url('');\"></div><div class=\"mini-card-info\"><h4 class=\"mini-title\"></h4><p class=\"mini-desc\"> A  mins.</p></div></div>;"
html = html.replace(broken_radar, fixed_radar)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
