import re

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Add Start and End Date fields
old_stock_ui = r'<div class="form-group" style="display:flex; gap:10px; margin-top: 15px;">\s*<div style="flex:1;">\s*<label>Inventario \(Stock de Cupones\)<\/label>.*?<\/div>'

new_dates_ui = """<div class="form-group" style="display:flex; gap:10px; margin-top: 15px;">
        <div style="flex:1;">
            <label>Fecha de Inicio (Opcional)</label>
            <input id="cStart" type="date"/>
        </div>
        <div style="flex:1;">
            <label>Fecha de Fin (Opcional)</label>
            <input id="cEnd" type="date"/>
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
html = re.sub(old_stock_ui, new_dates_ui, html, flags=re.DOTALL)

# 2. JS for Dates and Editing State
old_js_vars = r"const stock = parseInt\(document\.getElementById\('cStock'\)\.value\) \|\| 0;"
new_js_vars = """const startDate = document.getElementById('cStart').value;
        const endDate = document.getElementById('cEnd').value;
        const stock = parseInt(document.getElementById('cStock').value) || 0;"""
html = re.sub(old_js_vars, new_js_vars, html)

old_db_add = r"caja_id: caja_id\s*\}"
new_db_add = """caja_id: caja_id,
            startDate: startDate || null,
            endDate: endDate || null
        }"""
html = re.sub(old_db_add, new_db_add, html)

# 3. Add Edit Mode Logic
js_edit_logic = """
    let editModeId = null;

    function cargarParaEditar(id, title, desc, img, badge, lat, lng, stock, caja_id, start, end) {
        document.getElementById('cTitle').value = title || '';
        document.getElementById('cDesc').value = desc || '';
        document.getElementById('cImg').value = img || '';
        document.getElementById('cBadge').value = badge || '';
        document.getElementById('cLat').value = lat || '';
        document.getElementById('cLng').value = lng || '';
        document.getElementById('cStock').value = stock || '';
        document.getElementById('cCaja').value = caja_id || '';
        document.getElementById('cStart').value = start || '';
        document.getElementById('cEnd').value = end || '';
        
        editModeId = id;
        document.querySelector('button[onclick="guardarCampaña()"]').innerText = 'Actualizar Campaña';
        window.scrollTo(0,0);
    }
    
    // Modify guardarCampaña to handle updates
    const oldGuardar = guardarCampaña;
    guardarCampaña = function() {
        const title = document.getElementById('cTitle').value;
        const desc = document.getElementById('cDesc').value;
        const img = document.getElementById('cImg').value;
        const badge = document.getElementById('cBadge').value;
        const lat = document.getElementById('cLat').value;
        const lng = document.getElementById('cLng').value;
        const stock = parseInt(document.getElementById('cStock').value) || 0;
        const caja_id = document.getElementById('cCaja').value.trim();
        const startDate = document.getElementById('cStart').value;
        const endDate = document.getElementById('cEnd').value;

        if(!title || !img) { alert('Título e Imagen son obligatorios'); return; }

        const data = {
            title, desc, img, badge, lat, lng, stock, caja_id,
            startDate: startDate || null,
            endDate: endDate || null,
            active: true
        };

        if (editModeId) {
            db.collection('campaigns').doc(editModeId).update(data).then(() => {
                alert('Campaña actualizada');
                limpiarFormulario();
            });
        } else {
            db.collection('campaigns').add(data).then(() => {
                alert('Campaña guardada');
                limpiarFormulario();
            });
        }
    }
    
    function limpiarFormulario() {
        document.getElementById('cTitle').value = '';
        document.getElementById('cDesc').value = '';
        document.getElementById('cImg').value = '';
        document.getElementById('cBadge').value = '';
        document.getElementById('cLat').value = '';
        document.getElementById('cLng').value = '';
        document.getElementById('cStock').value = '50';
        document.getElementById('cCaja').value = '';
        document.getElementById('cStart').value = '';
        document.getElementById('cEnd').value = '';
        editModeId = null;
        document.querySelector('button[onclick="guardarCampaña()"]').innerText = 'Guardar Campaña';
    }
"""

if 'editModeId' not in html:
    html = html.replace('function guardarCampaña() {', js_edit_logic + '\n// Ignorar vieja funcion\n/*')
    html = html.replace('document.getElementById(\'cLng\').value = \'\';\n        }', '*/')


# 4. Add Editar button in render
old_li_render = r"<li>\s*<strong>\$\{camp\.title\}<\/strong> <br> <small>\$\{camp\.desc\}<\/small>\s*<div>\s*<button onclick=\"toggleActive\('\$\{camp\.id\}', \$\{camp\.active\}\)\">\$\{camp\.active \? 'Pausar' : 'Activar'\}<\/button>\s*<button onclick=\"eliminarCampaña\('\$\{camp\.id\}'\)\" style=\"background:#EF4444;\">Eliminar<\/button>\s*<\/div>\s*<\/li>"

# Escape single quotes in strings for the onclick handler
new_li_render = """<li>
                <strong>${camp.title}</strong> <br> <small>Stock: ${camp.stock || 0} | Caja: ${camp.caja_id || 'N/A'}</small>
                <div style="margin-top: 10px;">
                    <button onclick="toggleActive('${camp.id}', ${camp.active})">${camp.active ? 'Pausar' : 'Activar'}</button>
                    <button onclick="cargarParaEditar('${camp.id}', \`${camp.title||''}\`, \`${camp.desc||''}\`, \`${camp.img||''}\`, \`${camp.badge||''}\`, \`${camp.lat||''}\`, \`${camp.lng||''}\`, ${camp.stock||0}, \`${camp.caja_id||''}\`, \`${camp.startDate||''}\`, \`${camp.endDate||''}\`)" style="background:#3B82F6;">Editar</button>
                    <button onclick="eliminarCampaña('${camp.id}')" style="background:#EF4444;">Eliminar</button>
                </div>
            </li>"""
html = re.sub(old_li_render, new_li_render, html, flags=re.DOTALL)

with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(html)


with open('index.html', 'r', encoding='utf-8') as f:
    index_html = f.read()

# Filter active campaigns by date
date_filter_logic = """
            let isActiveByDate = true;
            const hoy = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            if (data.startDate && hoy < data.startDate) isActiveByDate = false;
            if (data.endDate && hoy > data.endDate) isActiveByDate = false;

            if (data.active !== false && isActiveByDate) {"""
index_html = index_html.replace('if (data.active !== false) {', date_filter_logic)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(index_html)

