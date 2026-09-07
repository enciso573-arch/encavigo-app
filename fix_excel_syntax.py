import re
import time

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Fix the broken line
broken_line = "csvContent += ${nombre},,,,\\n;"
fixed_line = "csvContent += `${nombre},${etiqueta},${clics},${estado},${hoy}\\n`;"
html = html.replace(broken_line, fixed_line)

html += f"<!-- v13 {time.time()} -->"
with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(html)
