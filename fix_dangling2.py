import time

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

dangling = """
,${etiqueta},${clics},${estado},${hoy}\\n`;
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

html = html.replace(dangling.strip(), '')

html += f"<!-- v23 {time.time()} -->"
with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(html)
