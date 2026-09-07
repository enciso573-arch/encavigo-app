from bs4 import BeautifulSoup
import time

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')

main_feed = soup.find('main', class_='immersive-feed')
if main_feed:
    # Remove all hardcoded immersive-cards
    for card in main_feed.find_all('article', class_='immersive-card'):
        card.decompose()

# The JS in index.html needs to fetch campaigns and build HTML
js_script = soup.find_all('script')[-1]

new_js = """
document.addEventListener('DOMContentLoaded', () => {
    const SESSION_HOURS = 24;
    const SESSION_KEY = 'encavigo_session';
    const urlParams = new URLSearchParams(window.location.search);
    const paramChofer = urlParams.get('chofer');
    let session = null;
    try { session = JSON.parse(localStorage.getItem(SESSION_KEY)); } catch(e) {}
    
    const now = Date.now();
    if (paramChofer) session = null; 
    
    if (!session) {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let uniqueCode = 'ENC-';
        for(let i=0; i<4; i++) uniqueCode += chars.charAt(Math.floor(Math.random() * chars.length));
        
        session = { timestamp: now, code: uniqueCode, chofer: paramChofer || 'orgánico' };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        if(paramChofer) window.history.replaceState({}, document.title, window.location.pathname);
    } else {
        const diffHours = (now - session.timestamp) / (1000 * 60 * 60);
        if (diffHours > SESSION_HOURS) {
            document.body.innerHTML = `
                <div style="height: 100dvh; width: 100vw; background: #000; color: #FFF; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 30px; text-align: center; font-family: sans-serif;">
                    <div style="font-size: 50px; margin-bottom: 20px;">🔒</div>
                    <h1 style="font-size: 24px; font-weight: 900; margin-bottom: 10px;">Sesión Expirada</h1>
                    <p style="color: #94A3B8; line-height: 1.5;">Tu código promocional ha caducado. Sube a un vehículo afiliado a EncaviGO y escanea un código QR nuevo para desbloquear las ofertas de hoy.</p>
                </div>
            `;
            localStorage.removeItem(SESSION_KEY);
            return;
        }
    }
    
    function haversine(lat1, lon1, lat2, lon2) {
        const R = 6371; 
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
        return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))); 
    }

    const drawerBadge = document.querySelector('.pullup-badge');
    const sheetContent = document.querySelector('.sheet-content');
    let loadedCampaigns = []; // Store them for radar
    
    function actualizarRadar(userLat, userLng) {
        let cercanas = [];
        loadedCampaigns.forEach(camp => {
            if (camp.lat && camp.lng) {
                const dist = haversine(userLat, userLng, parseFloat(camp.lat), parseFloat(camp.lng));
                if (dist <= 2.0) { 
                    cercanas.push({
                        title: camp.title,
                        desc: camp.desc,
                        img: camp.img,
                        distKm: dist
                    });
                }
            }
        });
        
        if (drawerBadge) drawerBadge.innerText = cercanas.length;
        
        if (sheetContent && cercanas.length > 0) {
            let html = '<p style="font-size: 12px; color: #34D399; text-align: center; margin-top:0;">El conductor se acerca a estos lugares:</p>';
            cercanas.forEach(local => {
                const mins = Math.max(1, Math.round(local.distKm * 5));
                html += `<div class="mini-card"><div class="mini-card-img" style="background-image: url('${local.img}');"></div><div class="mini-card-info"><h4 class="mini-title">${local.title}</h4><p class="mini-desc">${local.desc} A ${mins} mins.</p></div></div>`;
            });
            sheetContent.innerHTML = html;
        } else if (sheetContent) {
            sheetContent.innerHTML = '<p style="text-align:center; color:#94A3B8; margin-top:20px;">No hay promociones extremadamente cerca de ti en este momento.</p>';
        }
    }

    // CARGAR CAMPAÑAS DINÁMICAS DESDE FIREBASE
    const mainFeed = document.querySelector('.immersive-feed');
    
    db.collection('campaigns').where('active', '==', true).get().then(snapshot => {
        if(snapshot.empty && mainFeed) {
            mainFeed.innerHTML = '<div style="color:white; text-align:center; padding:50px; font-family:sans-serif;">No hay campañas activas.</div>';
            return;
        }
        
        let html = '';
        snapshot.forEach(doc => {
            const camp = doc.data();
            camp.id = doc.id;
            loadedCampaigns.push(camp);
            
            // Build Whatsapp URL
            const waMsg = camp.waMsg || 'Hola';
            const fullMsg = `${waMsg} Mi código de promo es: ${session.code} (Unidad: ${session.chofer})`;
            const waUrl = `https://wa.me/523221592596?text=${encodeURIComponent(fullMsg)}`;
            
            // Build the card HTML
            html += `
            <article class="immersive-card">
                <div class="card-bg" style="background-image: url('${camp.img}');"></div>
                <div class="card-overlay" style="background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%);"></div>
                <div class="card-ui">
                    <div class="card-badge" style="background: rgba(245, 158, 11, 0.2); border-color: rgba(245, 158, 11, 0.5); color: #FBBF24;">
                        ✦ ${camp.badge || 'PROMO ACTIVA'}
                    </div>
                    <h2 class="card-headline">${camp.title || ''}</h2>
                    <p class="card-body">${camp.desc || ''}</p>
                    <a class="swipe-btn" href="${waUrl}" data-campid="${doc.id}" style="--btn-bg: #F59E0B; --btn-glow: rgba(245,158,11,0.4); color: #000;">Activar código</a>
                </div>
            </article>
            `;
        });
        
        if (mainFeed) {
            mainFeed.innerHTML = html;
            
            // Re-attach click listeners to the new buttons
            document.querySelectorAll('a.swipe-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const cid = e.target.getAttribute('data-campid');
                    try {
                        db.collection('stats').doc('global').update({ clicks: firebase.firestore.FieldValue.increment(1) });
                        if (session && session.chofer !== 'orgánico') {
                            db.collection('choferes').doc(session.chofer).update({ clicks: firebase.firestore.FieldValue.increment(1) });
                        }
                        if (cid) {
                            db.collection('campaigns').doc(cid).update({ clicks: firebase.firestore.FieldValue.increment(1) });
                        }
                    } catch(err) { console.error(err); }
                });
            });
        }
    }).catch(e => console.error("Error loading campaigns:", e));

    let gpsRequested = false;
    document.body.addEventListener('click', () => {
        if(!gpsRequested && 'geolocation' in navigator) {
            gpsRequested = true;
            navigator.geolocation.watchPosition((position) => {
                actualizarRadar(position.coords.latitude, position.coords.longitude);
            }, (err) => console.log(err), { enableHighAccuracy: true });
        }
    }, {once: true});

    try {
        const docRef = db.collection('stats').doc('global');
        docRef.get().then((doc) => {
            if (doc.exists) {
                docRef.update({ scans: firebase.firestore.FieldValue.increment(1) });
            } else {
                docRef.set({ scans: 1, clicks: 0 });
            }
        });
        
        if (session && session.chofer !== 'orgánico') {
            const chofRef = db.collection('choferes').doc(session.chofer);
            chofRef.get().then(doc => {
                if (doc.exists) {
                    chofRef.update({ scans: firebase.firestore.FieldValue.increment(1) });
                } else {
                    chofRef.set({ scans: 1, clicks: 0, lastActive: new Date() });
                }
            });
        }
    } catch(e) { console.error("Error Firebase:", e); }
});
"""

js_script.string = new_js

html = str(soup)
html += f"<!-- v5 {time.time()} -->"
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
