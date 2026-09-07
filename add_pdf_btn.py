import time

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

# The existing button is:
# <button class="btn-primary" onclick="document.getElementById('addModal').style.display='flex';">
# <svg ...>
#       Nuevo Negocio
#     </button>

nuevo_negocio_start = """<button class="btn-primary" onclick="document.getElementById('addModal').style.display='flex';">"""
pdf_button = """<button class="btn-secondary" style="margin-right: 15px; background: #FFF; color: #111827; border: 1px solid #E5E7EB;" onclick="generarReportePDF()">
  <svg fill="none" height="16" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="16" style="margin-right: 6px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
  Exportar PDF
</button>\n"""

if pdf_button not in html:
    html = html.replace(nuevo_negocio_start, pdf_button + nuevo_negocio_start)

html += f"<!-- v26 {time.time()} -->"
with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(html)
