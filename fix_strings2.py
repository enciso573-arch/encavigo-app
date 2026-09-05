with open('index.html', 'rb') as f:
    b = f.read()

text = b.decode('utf-8', errors='replace')
text = text.replace('Ãšnete', 'Únete')
text = text.replace('mÃ¡s', 'más')
text = text.replace('EncaviGO â€” Promociones', 'EncaviGO - Promociones')
text = text.replace('EncaviGO ?" Promociones', 'EncaviGO - Promociones')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(text)
