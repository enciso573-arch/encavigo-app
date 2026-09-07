from bs4 import BeautifulSoup
import time

with open('admin.html', 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')

# 1. Update onclick for Analiticas in sidebar
for item in soup.find_all('div', class_='nav-item'):
    if 'Analíticas' in item.text:
        item['onclick'] = "switchTab('analiticas')"
        item['id'] = "nav-analiticas"

# 2. Add the view-analiticas div inside the main container
main_div = soup.find('div', class_='main')
if main_div:
    analiticas_html = """
    <div id="view-analiticas" style="display: none; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center;">
        <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80" alt="Analíticas" style="width: 300px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); margin-bottom: 30px;">
        <h2 style="font-size: 28px; font-weight: 700; color: #111827; margin-bottom: 10px;">Módulo en Construcción</h2>
        <p style="color: #6B7280; font-size: 16px; max-width: 500px; line-height: 1.6;">Estamos trabajando en un sistema avanzado de gráficas y reportes inteligentes impulsados por IA para que conozcas a fondo a tus pasajeros. ¡Próximamente en EncaviGO 2.0!</p>
    </div>
    """
    main_div.append(BeautifulSoup(analiticas_html, 'html.parser'))

# 3. Update the switchTab logic
scripts = soup.find_all('script')
target_script = scripts[-1]
js = target_script.string

old_switch_logic = """
        // Update views
        document.getElementById('view-dashboard').style.display = (tab === 'dashboard') ? 'block' : 'none';
        document.getElementById('view-choferes').style.display = (tab === 'choferes') ? 'block' : 'none';
"""
new_switch_logic = """
        // Update views
        document.getElementById('view-dashboard').style.display = (tab === 'dashboard') ? 'block' : 'none';
        document.getElementById('view-choferes').style.display = (tab === 'choferes') ? 'block' : 'none';
        
        const vAna = document.getElementById('view-analiticas');
        if(vAna) vAna.style.display = (tab === 'analiticas') ? 'flex' : 'none';
"""

if old_switch_logic in js:
    js = js.replace(old_switch_logic, new_switch_logic)
    target_script.string = js

html = str(soup)
html += f"<!-- v14 {time.time()} -->"
with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(html)
