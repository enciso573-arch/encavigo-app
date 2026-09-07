
    // FIREBASE AUTHENTICATION LOGIC
    const auth = firebase.auth();

    auth.onAuthStateChanged(user => {
        if (user) {
            document.getElementById('login-overlay').style.display = 'none';
            document.querySelector('.app-container').style.display = 'flex';
        } else {
            document.getElementById('login-overlay').style.display = 'flex';
            document.querySelector('.app-container').style.display = 'none';
        }
    });

    function loginAdmin() {
        const email = document.getElementById('loginEmail').value;
        const pwd = document.getElementById('loginPwd').value;
        const errObj = document.getElementById('loginError');
        errObj.style.display = 'none';
        
        auth.signInWithEmailAndPassword(email, pwd)
            .catch(error => {
                errObj.innerText = error.message;
                errObj.style.display = 'block';
            });
    }

    function logoutAdmin() {
        auth.signOut();
    }

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
                if(document.getElementById('reportes-tbody')) document.getElementById('reportes-tbody').innerHTML = '';
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
                    const trRep = document.createElement('tr');
                    trRep.innerHTML = `
                      <td><strong style="color: #111827;">${camp.title || 'Sin Título'}</strong></td>
                      <td>${camp.badge || '-'}</td>
                      <td>${camp.active ? '<span style="color: #10B981;">● Activo</span>' : '<span style="color: #EF4444;">● Pausado</span>'}</td>
                      <td style="color: #F97316; font-weight: bold;">+${camp.clicks || 0} interacciones</td>
                    `;
                    if(document.getElementById('reportes-tbody')) document.getElementById('reportes-tbody').appendChild(trRep);
                });
            }
        }, err => console.error(err));

        const choferesTbody = document.getElementById('choferes-tbody');
        db.collection('choferes').orderBy('scans', 'desc').onSnapshot(snapshot => {
            if(choferesTbody) {
                choferesTbody.innerHTML = '';
                snapshot.forEach(doc => {
                    const c = doc.data();
                    const tr = document.createElement('tr');
                    
                    // Supongamos que pagas $2 pesos por cada escaneo (ajustable)
                    const comision = (c.scans || 0) * 2.0; 
                    
                    let dateStr = 'Reciente';
                    if (c.lastActive && c.lastActive.toDate) {
                        dateStr = c.lastActive.toDate().toLocaleDateString();
                    }
                    
                    tr.innerHTML = `
                      <td><strong style="color: #111827;">${doc.id}</strong></td>
                      <td>${c.scans || 0}</td>
                      <td>${c.clicks || 0}</td>
                      <td style="color: #10B981; font-weight: bold;">$${comision.toFixed(2)} MXN</td>
                      <td>${dateStr}</td>
                    `;
                    choferesTbody.appendChild(tr);
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

    function switchTab(tab) {
        // Update nav UI
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        document.getElementById('nav-' + tab).classList.add('active');
        
        // Update views
        document.getElementById('view-dashboard').style.display = (tab === 'dashboard') ? 'block' : 'none';
        document.getElementById('view-choferes').style.display = (tab === 'choferes') ? 'block' : 'none';
        const vAna = document.getElementById('view-analiticas');
        if(vAna) vAna.style.display = (tab === 'analiticas') ? 'flex' : 'none';
        const vRep = document.getElementById('view-reportes');
        if(vRep) vRep.style.display = (tab === 'reportes') ? 'block' : 'none';

    }

    function generarReportePDF() {
        db.collection('campaigns').get().then(snapshot => {
            let win = window.open('', '_blank');
            let pdfHtml = `
            <html>
            <head>
                <title>Reporte EncaviGO</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #F3F4F6; padding: 40px; color: #111827; }
                    .report-container { max-width: 800px; margin: 0 auto; background: #FFF; padding: 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
                    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #F97316; padding-bottom: 20px; margin-bottom: 30px; }
                    .header h1 { margin: 0; color: #F97316; font-size: 28px; font-weight: 800; }
                    .header p { margin: 0; color: #6B7280; font-size: 14px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background: #F9FAFB; color: #374151; font-weight: 600; text-align: left; padding: 12px 15px; border-bottom: 2px solid #E5E7EB; font-size: 14px; }
                    td { padding: 15px; border-bottom: 1px solid #E5E7EB; color: #4B5563; font-size: 14px; }
                    .highlight { font-weight: 700; color: #10B981; }
                    .footer { margin-top: 40px; text-align: center; color: #9CA3AF; font-size: 12px; }
                    @media print {
                        body { background: #FFF; padding: 0; }
                        .report-container { box-shadow: none; max-width: 100%; padding: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="report-container">
                    <div class="header">
                        <h1>EncaviGO Analytics</h1>
                        <p>Reporte de Rendimiento<br>Fecha: ${new Date().toLocaleDateString()}</p>
                    </div>
                    <p style="margin-bottom: 30px; line-height: 1.6;">A continuación se detalla el impacto directo y las activaciones generadas por la red de vehículos afiliados a EncaviGO durante el periodo activo.</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre de la Campaña</th>
                                <th>Tipo de Oferta</th>
                                <th>Estado</th>
                                <th>Clics Generados</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            let totalClics = 0;
            snapshot.forEach(doc => {
                const c = doc.data();
                const clics = c.clicks || 0;
                totalClics += clics;
                pdfHtml += `
                            <tr>
                                <td style="font-weight: 600; color: #111827;">${c.title || 'Sin Titulo'}</td>
                                <td>${c.badge || '-'}</td>
                                <td>${c.active ? '<span style="color: #10B981;">● Activo</span>' : '<span style="color: #EF4444;">● Pausado</span>'}</td>
                                <td class="highlight">+${clics} interacciones</td>
                            </tr>
                `;
            });
            
            pdfHtml += `
                        </tbody>
                    </table>
                    
                    <div style="margin-top: 30px; background: #F9FAFB; padding: 20px; border-radius: 8px; text-align: right;">
                        <span style="font-size: 14px; color: #6B7280; margin-right: 15px;">Total de Impactos Globales:</span>
                        <span style="font-size: 24px; font-weight: 800; color: #F97316;">${totalClics}</span>
                    </div>
                    
                    <div class="footer">
                        Este documento es generado automáticamente por el sistema central de EncaviGO.<br>
                        Confidencial y exclusivo para el negocio afiliado.
                    </div>
                </div>
                <script>
                    setTimeout(() => window.print(), 1000);
                <\/script>
            </body>
            </html>
            `;
            win.document.write(pdfHtml);
            win.document.close();
        }).catch(err => alert("Error al generar Reporte: " + err));
    }


