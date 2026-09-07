from bs4 import BeautifulSoup
import re
import time

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')

# 1. Sidebar - Remove Negocios Activos
nav_items = soup.find_all('div', class_='nav-item')
for item in nav_items:
    if 'Negocios Activos' in item.text:
        item.decompose()

# 2. Sidebar - Fix Analíticas
for item in soup.find_all('div', class_='nav-item'):
    if 'Analíticas' in item.text or 'Analticas' in item.text:
        item['onclick'] = "switchTab('analiticas')"
        item['id'] = 'nav-analiticas'

# 3. Add view-analiticas and view-reportes to main div
main_div = soup.find('div', class_='main')
if main_div:
    if not soup.find('div', id='view-analiticas'):
        analiticas_html = """
        <div id="view-analiticas" style="display: none; height: 100%; flex-direction: column;">
            <div class="top-bar" style="margin-bottom: 20px;">
                <h1 class="page-title">Analíticas Avanzadas</h1>
            </div>
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                <div style="width: 90px; height: 90px; background: rgba(249, 115, 22, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; color: #F97316;">
                    <svg fill="none" height="40" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="40"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                </div>
                <h2 style="font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 10px 0;">Módulo en Construcción</h2>
                <p style="color: #6B7280; font-size: 15px; max-width: 450px; text-align: center; line-height: 1.6; margin: 0;">Estamos desarrollando un sistema de métricas de rendimiento y gráficas avanzadas exclusivas para la versión 2.0 de EncaviGO.</p>
            </div>
        </div>
        """
        main_div.append(BeautifulSoup(analiticas_html, 'html.parser'))
        
    if not soup.find('div', id='view-reportes'):
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
                    </tbody>
                </table>
            </div>
        </div>
        """
        main_div.append(BeautifulSoup(reportes_html, 'html.parser'))

# DO NOT TOUCH THE SCRIPT TAGS IN BEAUTIFULSOUP!
# I will output the HTML from soup, but with original scripts preserved to avoid corruption.
# Wait, if I do str(soup), BeautifulSoup might still escape things in the script tag?
# No, it should be fine as long as I didn't MODIFY the script tags.
# BUT I did this earlier and it broke.
# Let's write the modified DOM, then find the JS script block using raw regex and modify it.

new_html_raw = str(soup)

# Now fix the switchTab logic using raw regex
# In the raw file it looks like:
#        document.getElementById('view-choferes').style.display = (tab === 'choferes') ? 'block' : 'none';

switch_tab_fixed = """
        document.getElementById('view-choferes').style.display = (tab === 'choferes') ? 'block' : 'none';
        
        const vAna = document.getElementById('view-analiticas');
        if(vAna) vAna.style.display = (tab === 'analiticas') ? 'flex' : 'none';
        
        const vRep = document.getElementById('view-reportes');
        if(vRep) vRep.style.display = (tab === 'reportes') ? 'block' : 'none';
"""

# Let's only replace it if it's not already there.
if "tab === 'analiticas'" not in new_html_raw:
    new_html_raw = new_html_raw.replace("document.getElementById('view-choferes').style.display = (tab === 'choferes') ? 'block' : 'none';", switch_tab_fixed)

new_html_raw += f"<!-- v24 {time.time()} -->"
with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(new_html_raw)
