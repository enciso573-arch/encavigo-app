from bs4 import BeautifulSoup
import time

with open('admin.html', 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')

# 1. Add CSS for the modal
style_tag = soup.find('style')
if style_tag:
    modal_css = """
  /* MODAL */
  .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: none; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(5px); }
  .modal { background: #0A0A0A; border: 1px solid #1A1A1A; border-radius: 12px; width: 450px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
  .modal h2 { margin: 0 0 20px 0; font-size: 18px; }
  .form-group { margin-bottom: 15px; }
  .form-group label { display: block; margin-bottom: 5px; font-size: 12px; color: #888; }
  .form-group input, .form-group textarea { width: 100%; padding: 10px; background: #111; border: 1px solid #333; border-radius: 6px; color: #FFF; font-family: 'Inter', sans-serif; }
  .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 25px; }
  .btn-cancel { background: transparent; color: #888; border: none; cursor: pointer; padding: 10px 20px; font-weight: 500; }
  .btn-cancel:hover { color: #FFF; }
"""
    # Replace light theme variables with light theme colors since we switched to light theme
    # Wait, the current admin.html is already light theme (Pearl). Let me adapt the modal for Light Theme.
    modal_css_light = """
  /* MODAL */
  .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: none; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(4px); }
  .modal { background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 12px; width: 450px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); color: #111827; }
  .modal h2 { margin: 0 0 20px 0; font-size: 18px; }
  .form-group { margin-bottom: 15px; }
  .form-group label { display: block; margin-bottom: 5px; font-size: 12px; color: #6B7280; font-weight: 500; }
  .form-group input, .form-group textarea { width: 100%; padding: 10px; background: #F9FAFB; border: 1px solid #D1D5DB; border-radius: 6px; color: #111827; font-family: 'Inter', sans-serif; font-size: 13px; }
  .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 25px; }
  .btn-cancel { background: transparent; color: #6B7280; border: none; cursor: pointer; padding: 10px 20px; font-weight: 500; }
  .btn-cancel:hover { color: #111827; }
"""
    style_tag.append(modal_css_light)

# 2. Add Modal HTML to body
modal_html = """
<div class="modal-overlay" id="addModal">
  <div class="modal">
    <h2>Nuevo Negocio / Campaña</h2>
    <div class="form-group">
      <label>Nombre del Negocio (Título)</label>
      <input type="text" id="cTitle" placeholder="Ej. Cena al Carbón 2x1">
    </div>
    <div class="form-group">
      <label>Descripción Corta</label>
      <textarea id="cDesc" rows="2" placeholder="Ej. Muestra esta pantalla en el Asador..."></textarea>
    </div>
    <div class="form-group">
      <label>URL de la Imagen de Fondo (Link)</label>
      <input type="text" id="cImg" placeholder="https://unsplash.com/foto...">
    </div>
    <div class="form-group" style="display:flex; gap:10px;">
      <div style="flex:1;">
        <label>Etiqueta Superior</label>
        <input type="text" id="cBadge" placeholder="Ej. 🚀 PROMO FLASH">
      </div>
      <div style="flex:1;">
        <label>Mensaje Pre-escrito WhatsApp</label>
        <input type="text" id="cWaMsg" placeholder="Ej. Hola quiero mi descuento">
      </div>
    </div>
    <div class="form-group" style="display:flex; gap:10px;">
      <div style="flex:1;">
        <label>Latitud GPS (Para Radar)</label>
        <input type="text" id="cLat" placeholder="Ej. 20.6025">
      </div>
      <div style="flex:1;">
        <label>Longitud GPS (Para Radar)</label>
        <input type="text" id="cLng" placeholder="Ej. -105.2325">
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn-cancel" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary" onclick="saveCampaign()">Guardar Campaña</button>
    </div>
  </div>
</div>
"""
soup.body.append(BeautifulSoup(modal_html, 'html.parser'))

# 3. Add ID to the Nuevo Negocio button
btn = soup.find('button', class_='btn-primary')
if btn:
    btn['onclick'] = "document.getElementById('addModal').style.display='flex';"

# 4. Modify existing JS to handle campaigns
script_tag = soup.find_all('script')[-1]
new_js = """
    document.addEventListener('DOMContentLoaded', () => {
        const valScans = document.getElementById('val-scans');
        const valClicks = document.getElementById('val-clicks');
        const tbody = document.querySelector('tbody');
        
        // Leer estadísticas globales
        db.collection('stats').doc('global').onSnapshot((doc) => {
            if(doc.exists) {
                const data = doc.data();
                if(valScans) valScans.innerText = (data.scans || 0).toLocaleString();
                if(valClicks) valClicks.innerText = (data.clicks || 0).toLocaleString();
            }
        });
        
        // Leer Top Chofer
        db.collection('choferes').orderBy('scans', 'desc').limit(1).onSnapshot(snapshot => {
            if(!snapshot.empty) {
                const topChofer = snapshot.docs[0];
                const topName = document.getElementById('val-top-chofer');
                const topScans = document.getElementById('val-top-scans');
                if(topName) topName.innerText = topChofer.id;
                if(topScans) topScans.innerText = topChofer.data().scans + " escaneos";
            }
        });

        // LEER CAMPAÑAS EN VIVO Y PINTAR LA TABLA
        db.collection('campaigns').onSnapshot(snapshot => {
            if(tbody) {
                tbody.innerHTML = '';
                snapshot.forEach(doc => {
                    const camp = doc.data();
                    const tr = document.createElement('tr');
                    tr.innerHTML = 
                      <td>
                        <div class="business-cell">
                          <div class="biz-avatar" style="background-image: url('');"></div>
                          <div class="biz-info">
                            <span class="biz-name"></span>
                            <span class="biz-type"></span>
                          </div>
                        </div>
                      </td>
                      <td style="width: 25%;">
                        <div style="font-weight: 500; color: #111827; margin-bottom: 4px;"> clics</div>
                        <div class="performance-bar"><div class="performance-fill" style="width: %;"></div></div>
                      </td>
                      <td>Activa</td>
                      <td><span class="badge-active">Online</span></td>
                      <td>
                        <button class="action-icon" onclick="deleteCampaign('')" title="Eliminar">🗑️</button>
                      </td>
                    ;
                    tbody.appendChild(tr);
                });
            }
        });
    });

    function closeModal() {
        document.getElementById('addModal').style.display = 'none';
    }

    function saveCampaign() {
        const title = document.getElementById('cTitle').value;
        const desc = document.getElementById('cDesc').value;
        const img = document.getElementById('cImg').value;
        const badge = document.getElementById('cBadge').value;
        const waMsg = document.getElementById('cWaMsg').value;
        const lat = document.getElementById('cLat').value;
        const lng = document.getElementById('cLng').value;

        if(!title || !img) { alert('Título e Imagen son obligatorios'); return; }

        db.collection('campaigns').add({
            title: title,
            desc: desc,
            img: img,
            badge: badge,
            waMsg: waMsg || 'Hola',
            lat: lat,
            lng: lng,
            clicks: 0,
            active: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            closeModal();
            // Limpiar form
            document.getElementById('cTitle').value = '';
            document.getElementById('cDesc').value = '';
            document.getElementById('cImg').value = '';
            document.getElementById('cBadge').value = '';
            document.getElementById('cWaMsg').value = '';
        }).catch(err => alert('Error guardando: ' + err));
    }

    function deleteCampaign(id) {
        if(confirm('¿Seguro que quieres borrar este negocio? Desaparecerá de los taxis inmediatamente.')) {
            db.collection('campaigns').doc(id).delete();
        }
    }
"""
script_tag.string = new_js

html = str(soup)
html += f"<!-- v4 {time.time()} -->"
with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(html)
