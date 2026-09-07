from bs4 import BeautifulSoup
import time

script_content = """
<script>
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
                    tr.innerHTML = `
                      <td>
                        <div class="business-cell">
                          <div class="biz-avatar" style="background-image: url('${camp.img || ''}');"></div>
                          <div class="biz-info">
                            <span class="biz-name">${camp.title || 'Sin Título'}</span>
                            <span class="biz-type">${camp.badge || 'Anuncio'}</span>
                          </div>
                        </div>
                      </td>
                      <td style="width: 25%;">
                        <div style="font-weight: 500; color: #111827; margin-bottom: 4px;">${camp.clicks || 0} clics</div>
                        <div class="performance-bar"><div class="performance-fill" style="width: ${Math.min((camp.clicks||0), 100)}%;"></div></div>
                      </td>
                      <td>Activa</td>
                      <td><span class="badge-active">Online</span></td>
                      <td>
                        <button class="action-icon" onclick="deleteCampaign('${doc.id}')" title="Eliminar">🗑️</button>
                      </td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        }, err => console.error(err));
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
</script>
"""

with open('admin.html', 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')

scripts = soup.find_all('script')
# The last script in admin.html is the broken one. Let's replace it entirely.
scripts[-1].replace_with(BeautifulSoup(script_content, 'html.parser'))

html = str(soup)
html += f"<!-- v6 {time.time()} -->"
with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(html)
