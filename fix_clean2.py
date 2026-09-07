from bs4 import BeautifulSoup
import time

script_content = """
<script>
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
    
    const waLinks = document.querySelectorAll('a[href*="wa.me"]');
    waLinks.forEach(link => {
        let originalHref = link.getAttribute('href');
        if (!originalHref.includes('código')) {
            const addText = ` Mi código de promo es: ${session.code} (Unidad: ${session.chofer})`;
            link.setAttribute('href', originalHref + encodeURIComponent(addText));
        }
    });

    const cards = document.querySelectorAll('.immersive-card');
    if(cards.length > 1) {
        cards[1].setAttribute('data-lat', '20.6025');
        cards[1].setAttribute('data-lng', '-105.2325');
        cards[1].setAttribute('data-title', 'Cena al Carbón 2x1');
        cards[1].setAttribute('data-desc', 'Muestra esta pantalla en Asador El Pariente');
        cards[1].setAttribute('data-img', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=300&q=80');
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
    
    function actualizarRadar(userLat, userLng) {
        let cercanas = [];
        cards.forEach(card => {
            const cLat = card.getAttribute('data-lat');
            const cLng = card.getAttribute('data-lng');
            if (cLat && cLng) {
                const dist = haversine(userLat, userLng, parseFloat(cLat), parseFloat(cLng));
                if (dist <= 2.0) { 
                    cercanas.push({
                        title: card.getAttribute('data-title'),
                        desc: card.getAttribute('data-desc'),
                        img: card.getAttribute('data-img'),
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

    document.querySelectorAll('a.swipe-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            try {
                db.collection('stats').doc('global').update({ clicks: firebase.firestore.FieldValue.increment(1) });
                if (session && session.chofer !== 'orgánico') {
                    db.collection('choferes').doc(session.chofer).update({ clicks: firebase.firestore.FieldValue.increment(1) });
                }
            } catch(e) { console.error(e); }
        });
    });
});
</script>
"""

with open('index.html', 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')

# Remove ALL existing scripts except firebase config/sdks
for s in soup.find_all('script'):
    if not s.has_attr('src') and 'DOMContentLoaded' in (s.string or ''):
        s.decompose()

soup.find('body').append(BeautifulSoup(script_content, 'html.parser'))
html = str(soup)
html += f"<!-- v3 {time.time()} -->"

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
