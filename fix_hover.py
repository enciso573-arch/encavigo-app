with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

html = html.replace('.nav-item:hover { color: #111827; background: #111; }', '.nav-item:hover { color: #111827; background: #F3F4F6; }')

import time
html += f"<!-- v11 {time.time()} -->"

with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(html)
