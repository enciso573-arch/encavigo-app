from bs4 import BeautifulSoup
import time

with open('admin.html', 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')

# Update onclick for Negocios Activos
nav_items = soup.find_all('div', class_='nav-item')
for item in nav_items:
    if 'Negocios Activos' in item.text:
        item['onclick'] = "switchTab('dashboard')"
    elif 'Analíticas' in item.text:
        item['onclick'] = "alert('Módulo de analíticas avanzadas en construcción. Por ahora, revisa el Dashboard.')"
    elif 'Reportes Excel' in item.text:
        item['onclick'] = "descargarExcel()"

# Update JS logic to include descargarExcel
script_tags = soup.find_all('script')
target_script = script_tags[-1]
js = target_script.string

excel_logic = """
    function descargarExcel() {
        db.collection('campaigns').get().then(snapshot => {
            let csvContent = "data:text/csv;charset=utf-8,";
            // Header
            csvContent += "Nombre del Negocio,Etiqueta,Clics Generados,Estado,Fecha de Reporte\\n";
            
            const hoy = new Date().toLocaleDateString();
            
            snapshot.forEach(doc => {
                const c = doc.data();
                const nombre = (c.title || 'Sin Titulo').replace(/,/g, ''); // Evitar comas en CSV
                const etiqueta = (c.badge || '').replace(/,/g, '');
                const clics = c.clicks || 0;
                const estado = c.active ? 'Activo' : 'Pausado';
                
                csvContent += ${nombre},,,,\\n;
            });
            
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "Reporte_EncaviGO_" + hoy.replace(/\\//g, '-') + ".csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }).catch(err => alert("Error al generar Excel: " + err));
    }
"""

js = js + "\n" + excel_logic
target_script.string = js

html = str(soup)
html += f"<!-- v12 {time.time()} -->"
with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(html)
