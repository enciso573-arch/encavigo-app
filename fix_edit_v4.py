import re

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

# The table row action column currently looks like:
# <td>
#   <button class="action-icon" onclick="deleteCampaign('${doc.id}')" title="Eliminar">🗑️</button>
# </td>

old_actions = r"<button class=\"action-icon\" onclick=\"deleteCampaign\('\$\{doc\.id\}'\)[\s\n]*title=\"Eliminar\">[^<]*<\/button>"

# The Edit icon svg: ✏️
# Function openEditModal will be triggered
new_actions = """<button class="action-icon" onclick="openEditModal('${doc.id}', \\`${camp.title||''}\\`, \\`${camp.desc||''}\\`, \\`${camp.img||''}\\`, \\`${camp.badge||''}\\`, \\`${camp.lat||''}\\`, \\`${camp.lng||''}\\`, ${camp.stock||0}, \\`${camp.caja_id||''}\\`, \\`${camp.startDate||''}\\`, \\`${camp.endDate||''}\\`)" title="Editar" style="color: #3B82F6;">✏️</button>
                          <button class="action-icon" onclick="deleteCampaign('${doc.id}')" title="Eliminar">🗑️</button>"""

html = re.sub(old_actions, new_actions, html)

# Modify js logic to use openEditModal
js_edit = """
    let editModeId = null;

    function openEditModal(id, title, desc, img, badge, lat, lng, stock, caja_id, start, end) {
        document.getElementById('cTitle').value = title || '';
        document.getElementById('cDesc').value = desc || '';
        document.getElementById('cImg').value = img || '';
        document.getElementById('cBadge').value = badge || '';
        document.getElementById('cLat').value = lat || '';
        document.getElementById('cLng').value = lng || '';
        document.getElementById('cStock').value = stock || '50';
        document.getElementById('cCaja').value = caja_id || '';
        document.getElementById('cStart').value = start || '';
        document.getElementById('cEnd').value = end || '';
        
        editModeId = id;
        document.getElementById('addModal').style.display = 'flex';
    }

    function openAddModal() {
        limpiarFormulario();
        document.getElementById('addModal').style.display = 'flex';
    }
"""
if 'openEditModal(' not in html:
    html = html.replace('function closeModal() {', js_edit + '\nfunction closeModal() {')

with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(html)
