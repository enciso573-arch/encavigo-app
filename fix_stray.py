import re

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix the stray </div> after <article class="promo-card"...>
text = re.sub(r'(<article class="promo-card"[^>]*>)\s*</div>', r'\1', text)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(text)
