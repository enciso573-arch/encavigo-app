from bs4 import BeautifulSoup
import time

with open('admin.html', 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')

# Find the main container and wrap existing content in view-dashboard
main_div = soup.find('div', class_='main')

# We need to restructure the main div to support tabs
if main_div:
    html_content = str(main_div)
    # If not already wrapped
    if 'id="view-dashboard"' not in html_content:
        # Wrap children
        new_content = f'<div id="view-dashboard">{main_div.decode_contents()}</div>'
        
        # Add the Choferes view
        choferes_view = """
        <div id="view-choferes" style="display: none;">
            <div class="top-bar">
                <h1 class="page-title">Gestión de Choferes</h1>
            </div>
            
            <div class="data-section">
                <div class="data-header">
                  <h3>Comisiones y Rendimiento por Unidad</h3>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Identificador (ID)</th>
                      <th>Escaneos Generados</th>
                      <th>Clics a Negocios</th>
                      <th>Comisión Sugerida ($)</th>
                      <th>Última Actividad</th>
                    </tr>
                  </thead>
                  <tbody id="choferes-tbody">
                    <!-- Dynamic from Firebase -->
                  </tbody>
                </table>
            </div>
        </div>
        """
        new_content += choferes_view
        main_div.clear()
        main_div.append(BeautifulSoup(new_content, 'html.parser'))

# Update Sidebar items with onclick
nav_items = soup.find_all('div', class_='nav-item')
for item in nav_items:
    if 'Dashboard' in item.text:
        item['onclick'] = "switchTab('dashboard')"
        item['id'] = "nav-dashboard"
    elif 'Flotilla' in item.text:
        item['onclick'] = "switchTab('choferes')"
        item['id'] = "nav-choferes"

# Update JS logic
script_tags = soup.find_all('script')
target_script = script_tags[-1]
js = target_script.string

if "switchTab" not in js:
    tab_logic = """
    function switchTab(tab) {
        // Update nav UI
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        document.getElementById('nav-' + tab).classList.add('active');
        
        // Update views
        document.getElementById('view-dashboard').style.display = (tab === 'dashboard') ? 'block' : 'none';
        document.getElementById('view-choferes').style.display = (tab === 'choferes') ? 'block' : 'none';
    }
    """
    
    choferes_logic = """
        const choferesTbody = document.getElementById('choferes-tbody');
        db.collection('choferes').orderBy('scans', 'desc').onSnapshot(snapshot => {
            if(choferesTbody) {
                choferesTbody.innerHTML = '';
                snapshot.forEach(doc => {
                    const c = doc.data();
                    const tr = document.createElement('tr');
                    
                    // Supongamos que pagas  pesos por cada escaneo (ajustable)
                    const comision = (c.scans || 0) * 2.0; 
                    
                    let dateStr = 'Reciente';
                    if (c.lastActive && c.lastActive.toDate) {
                        dateStr = c.lastActive.toDate().toLocaleDateString();
                    }
                    
                    tr.innerHTML = 
                      <td><strong style="color: #FFF;"></strong></td>
                      <td></td>
                      <td></td>
                      <td style="color: #10B981; font-weight: bold;">{comision.toFixed(2)} MXN</td>
                      <td></td>
                    ;
                    choferesTbody.appendChild(tr);
                });
            }
        });
    """
    
    # Insert new logic safely
    js = js.replace('});', choferes_logic + '\n    });', 1)
    js = js + tab_logic
    target_script.string = js

html = str(soup)
html += f"<!-- v7 {time.time()} -->"
with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(html)
