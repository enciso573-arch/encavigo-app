import time
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()
html += f"<!-- force deployment {time.time()} -->"
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
