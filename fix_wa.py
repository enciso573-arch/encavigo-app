import re
import time

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Remove the field from the UI
old_wa_ui = r'<div style="flex:1;">\s*<label>Mensaje Pre-escrito WhatsApp<\/label>\s*<input id="cWaMsg" placeholder="Ej. Hola quiero mi descuento" type="text"\/>\s*<\/div>'
html = re.sub(old_wa_ui, '', html)

# Remove the field from JS gathering
old_js_get = r"const waMsg = document\.getElementById\('cWaMsg'\)\.value;"
html = re.sub(old_js_get, '', html)

# Remove from db.collection.add
old_db_add = r"waMsg: waMsg,"
html = re.sub(old_db_add, '', html)

with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(html)

with open('index.html', 'r', encoding='utf-8') as f:
    index_html = f.read()

# Update renderDeck logic to automatically generate the message based on the title
old_msg_logic = r"const waMsg = camp\.waMsg \|\| 'Hola';\s*const fullMsg = `\$\{waMsg\} Mi código de promo es: \$\{session \? session\.code : 'N/A'\} \(Unidad: \$\{session \? session\.chofer : 'N/A'\}\)`;"
new_msg_logic = r"const fullMsg = `Hola, quiero activar la promo de ${camp.title}. Mi código es: ${session ? session.code : 'N/A'} (Unidad: ${session ? session.chofer : 'N/A'})`;"
index_html = re.sub(old_msg_logic, new_msg_logic, index_html)

index_html += f"<!-- v60 {time.time()} -->"
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(index_html)
