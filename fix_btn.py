import re
with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix second button to be blue
text = re.sub(r'<a class="btn-cta" style="background: #F97316;" href="https://wa.me.*?>\s*<svg.*?</svg>\s*Publicar mi negocio\s*</a>',
              r'<a class="btn-cta" style="background: #1D4ED8; width: 100%;" href="javascript:void(0)"><span style="color:white;font-weight:700;">Publicar mi negocio</span></a>', text, flags=re.DOTALL)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(text)
