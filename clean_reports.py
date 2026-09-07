import re
import time

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Remove the "Reportes a Clientes" sidebar button
html = re.sub(
    r'<div class="nav-item" id="nav-reportes" onclick="switchTab\(\'reportes\'\)">.*?Reportes a Clientes</div>',
    '',
    html,
    flags=re.DOTALL
)

# 2. Add the Export PDF button directly to the Dashboard top bar
dashboard_top_bar = """<div class="top-bar">
  <h1 class="page-title">Métricas Principales</h1>"""
new_dashboard_top_bar = """<div class="top-bar">
  <h1 class="page-title">Métricas Principales</h1>
  <button class="btn-primary" onclick="generarReportePDF()">
      <svg fill="none" height="16" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="16" style="margin-right: 8px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
      Exportar PDF de Clientes
  </button>"""
html = html.replace(dashboard_top_bar, new_dashboard_top_bar)

# 3. Remove the view-reportes div completely
html = re.sub(
    r'<div id="view-reportes" style="display: none;">.*?</div>\s*</div>\s*</div>',
    '</div>\n</div>',
    html,
    flags=re.DOTALL
)

# 4. Clean up the switchTab JS logic for reportes
html = html.replace("const vRep = document.getElementById('view-reportes');\n        if(vRep) vRep.style.display = (tab === 'reportes') ? 'block' : 'none';", "")

# 5. Remove the duplicate JS hook that populated reportes-tbody
html = re.sub(
    r"const trRep = document\.createElement\('tr'\);.*?if\(document\.getElementById\('reportes-tbody'\)\) document\.getElementById\('reportes-tbody'\)\.appendChild\(trRep\);",
    '',
    html,
    flags=re.DOTALL
)
html = html.replace("if(document.getElementById('reportes-tbody')) document.getElementById('reportes-tbody').innerHTML = '';", "")


html += f"<!-- v25 {time.time()} -->"
with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(html)
