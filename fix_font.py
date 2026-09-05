import re

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Change lang and add notranslate
text = text.replace('<html lang="es">', '<html lang="es-MX" translate="no">')
if '<meta name="google" content="notranslate">' not in text:
    text = text.replace('<meta charset="utf-8"/>', '<meta charset="utf-8"/>\n<meta name="google" content="notranslate"/>')

# 2. Fix the title encoding glitch
text = re.sub(r'<title>.*?</title>', '<title>EncaviGO — Promociones en tu Ruta</title>', text)
text = re.sub(r'<meta content=".*?" name="description"/>', '<meta content="Descubre promociones exclusivas de negocios locales en Puerto Vallarta y Bahía de Banderas. Ofertas en tiempo real a bordo de tu transporte." name="description"/>', text)
text = re.sub(r'<meta content=".*?" property="og:description"/>', '<meta content="Descubre promociones exclusivas de negocios locales en Puerto Vallarta y Bahía de Banderas." property="og:description"/>', text)

# 3. Change font to Montserrat
font_link = '<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>'
text = re.sub(r'<link href="https://fonts.googleapis.com/css2\?family=Inter.*?/>', font_link, text)
text = text.replace("--font: 'Inter'", "--font: 'Montserrat'")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(text)
