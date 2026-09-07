import re
import time

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

# The regex left this dangling block:
# ,${etiqueta},${clics},${estado},${hoy}\n`;
#             });
#             
#             const encodedUri = encodeURI(csvContent);
#             const link = document.createElement("a");
#             link.setAttribute("href", encodedUri);
#             link.setAttribute("download", "Reporte_EncaviGO_" + hoy.replace(/\//g, '-') + ".csv");
#             document.body.appendChild(link);
#             link.click();
#             document.body.removeChild(link);
#         }).catch(err => alert("Error al generar Excel: " + err));
#     }

dangling = r",\$\{etiqueta\},\$\{clics\},\$\{estado\},\$\{hoy\}\\n`;\s*}\);\s*const encodedUri = encodeURI\(csvContent\);\s*const link = document\.createElement\(\"a\"\);\s*link\.setAttribute\(\"href\", encodedUri\);\s*link\.setAttribute\(\"download\", \"Reporte_EncaviGO_\" \+ hoy\.replace\(/\\\\//g, '-'\) \+ \".csv\"\);\s*document\.body\.appendChild\(link\);\s*link\.click\(\);\s*document\.body\.removeChild\(link\);\s*}\)\.catch\(err => alert\(\"Error al generar Excel: \" \+ err\)\);\s*}"

html = re.sub(dangling, '', html, flags=re.DOTALL)

html += f"<!-- v22 {time.time()} -->"
with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(html)
