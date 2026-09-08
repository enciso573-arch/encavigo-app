import re

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Add Stock and Caja ID to Admin HTML
old_inputs = r'<div class="form-group" style="display:flex; gap:10px;">\s*<div style="flex:1;">\s*<label>Latitud GPS \(Para Radar\).*?<\/div>\s*<\/div>'

new_inputs = """<div class="form-group" style="display:flex; gap:10px;">
        <div style="flex:1;">
            <label>Latitud GPS (Para Radar)</label>
            <input id="cLat" placeholder="Ej. 20.6025" type="text"/>
        </div>
        <div style="flex:1;">
            <label>Longitud GPS (Para Radar)</label>
            <input id="cLng" placeholder="Ej. -105.2325" type="text"/>
        </div>
    </div>
    <div class="form-group" style="display:flex; gap:10px; margin-top: 15px;">
        <div style="flex:1;">
            <label>Inventario (Stock de Cupones)</label>
            <input id="cStock" placeholder="Ej. 50" type="number" value="50"/>
        </div>
        <div style="flex:1;">
            <label>Código Secreto del Acrílico (Caja ID)</label>
            <input id="cCaja" placeholder="Ej. pizzerialosarcos" type="text"/>
        </div>
    </div>"""
html = re.sub(old_inputs, new_inputs, html, flags=re.DOTALL)

# Add to JavaScript
old_js_vars = r"const lat = document\.getElementById\('cLat'\)\.value;\s*const lng = document\.getElementById\('cLng'\)\.value;"
new_js_vars = """const lat = document.getElementById('cLat').value;
        const lng = document.getElementById('cLng').value;
        const stock = parseInt(document.getElementById('cStock').value) || 0;
        const caja_id = document.getElementById('cCaja').value.trim();"""
html = re.sub(old_js_vars, new_js_vars, html)

old_db_add = r"lng: lng\s*\}"
new_db_add = """lng: lng,
            stock: stock,
            caja_id: caja_id
        }"""
html = re.sub(old_db_add, new_db_add, html)

with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(html)
