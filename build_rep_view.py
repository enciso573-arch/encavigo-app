from bs4 import BeautifulSoup
import time

with open('admin.html', 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')

# 1. Update sidebar item
for item in soup.find_all('div', class_='nav-item'):
    if 'nav-reporte' in item.get('id', ''):
        item.string = ""
        item.append(BeautifulSoup('<svg fill="none" height="16" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> Reportes a Clientes', 'html.parser'))
        item['onclick'] = "switchTab('reportes')"
        item['id'] = 'nav-reportes'

# 2. Add view-reportes HTML
main_div = soup.find('div', class_='main')
reportes_html = """
<div id="view-reportes" style="display: none;">
    <div class="top-bar">
        <h1 class="page-title">Reportes para Clientes</h1>
        <button class="btn-primary" onclick="generarReportePDF()">
            <svg fill="none" height="16" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="16"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Exportar PDF
        </button>
    </div>
    
    <div class="data-section">
        <div class="data-header">
            <h3>Vista Previa del Reporte de Impacto</h3>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Nombre de la Campaña</th>
                    <th>Tipo de Oferta</th>
                    <th>Estado</th>
                    <th>Clics / Impactos Generados</th>
                </tr>
            </thead>
            <tbody id="reportes-tbody">
                <!-- Dynamic -->
            </tbody>
        </table>
    </div>
</div>
"""
if main_div:
    main_div.append(BeautifulSoup(reportes_html, 'html.parser'))

# 3. Update JS Logic
scripts = soup.find_all('script')
target_script = scripts[-1]
js = target_script.string

# Update switchTab function
if "tab === 'analiticas'" in js:
    js = js.replace("if(vAna) vAna.style.display = (tab === 'analiticas') ? 'flex' : 'none';",
                    "if(vAna) vAna.style.display = (tab === 'analiticas') ? 'flex' : 'none';\n        const vRep = document.getElementById('view-reportes');\n        if(vRep) vRep.style.display = (tab === 'reportes') ? 'block' : 'none';")

# Hook into existing campaigns snapshot to populate reportes-tbody
campaigns_hook = """
                    const trRep = document.createElement('tr');
                    trRep.innerHTML = `
                      <td><strong style="color: #111827;">${camp.title || 'Sin Título'}</strong></td>
                      <td>${camp.badge || '-'}</td>
                      <td>${camp.active ? '<span style="color: #10B981;">● Activo</span>' : '<span style="color: #EF4444;">● Pausado</span>'}</td>
                      <td style="color: #F97316; font-weight: bold;">+${camp.clicks || 0} interacciones</td>
                    `;
                    if(document.getElementById('reportes-tbody')) document.getElementById('reportes-tbody').appendChild(trRep);
"""

# Find where tbody.appendChild(tr) is and insert our hook right after
js = js.replace('tbody.appendChild(tr);', 'tbody.appendChild(tr);\n' + campaigns_hook)

# Add clearing for reportes-tbody
js = js.replace("tbody.innerHTML = '';", "tbody.innerHTML = '';\n                if(document.getElementById('reportes-tbody')) document.getElementById('reportes-tbody').innerHTML = '';")

target_script.string = js

html = str(soup)
html += f"<!-- v18 {time.time()} -->"
with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(html)
