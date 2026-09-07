import re
import time

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Fix the syntax error
html = html.replace('};\n\n    };\n\n    const userIcon', '};\n\n    const userIcon')

html += f"<!-- v48 {time.time()} -->"
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
