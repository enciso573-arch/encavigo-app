from bs4 import BeautifulSoup

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')

# 1. Change all swipe-btn texts to "Activar código"
for btn in soup.find_all('a', class_='swipe-btn'):
    # Preserve SVG if it has one
    svg = btn.find('svg')
    btn.string = 'Activar código'
    if svg:
        btn.insert(0, svg)

# 2. Fix JS logic completely
for s in soup.find_all('script'):
    s.decompose()

new_script = '''
<script>
document.addEventListener('DOMContentLoaded', () => {
    // ------------------------------------------------------------
    // 1. SISTEMA DE SESIÓN (24 HORAS) Y CÓDIGO ÚNICO
    // ------------------------------------------------------------
    const SESSION_HOURS = 24;
    const SESSION_KEY = 'encavigo_session';
    
    // Obtener parámetros de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const paramChofer = urlParams.get('chofer');
    
    let session = null;
    try {
        session = JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch(e) {}
    
    const now = Date.now();
    
    // Resetear sesión si hay nuevo parámetro chofer en URL
    if (paramChofer) {
        session = null; 
    }
    
    if (!session) {
        // Generar código único aleatorio
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let uniqueCode = 'ENC-';
        for(let i=0; i<4; i++) uniqueCode += chars.charAt(Math.floor(Math.random() * chars.length));
        
        session = {
            timestamp: now,
            code: uniqueCode,
            chofer: paramChofer || 'orgánico'
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        
        // Limpiar URL
        if(paramChofer) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    } else {
        const diffHours = (now - session.timestamp) / (1000 * 60 * 60);
        if (diffHours > SESSION_HOURS) {
            document.body.innerHTML = 
                <div style="height: 100dvh; width: 100vw; background: #000; color: #FFF; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 30px; text-align: center; font-family: sans-serif;">
                    <div style="font-size: 50px; margin-bottom: 20px;">🔒</div>
                    <h1 style="font-size: 24px; font-weight: 900; margin-bottom: 10px;">Sesión Expirada</h1>
                    <p style="color: #94A3B8; line-height: 1.5;">Tu código promocional ha caducado. Sube a un vehículo afiliado a EncaviGO y escanea un código QR nuevo para desbloquear las ofertas de hoy.</p>
                </div>
            ;
            localStorage.removeItem(SESSION_KEY);
            return;
        }
    }
    
    // ------------------------------------------------------------
    // 2. AÑADIR EL CÓDIGO A WHATSAPP
    // ------------------------------------------------------------
    const waLinks = document.querySelectorAll('a[href*="wa.me"]');
    waLinks.forEach(link => {
        let originalHref = link.getAttribute('href');
        if (!originalHref.includes('código')) {
            const addText =  Mi código de promo es:  (Unidad: );
            link.setAttribute('href', originalHref + encodeURIComponent(addText));
        }
    });

    // ------------------------------------------------------------
    // 3. RADAR GPS INTELIGENTE
    // ------------------------------------------------------------
    const cards = document.querySelectorAll('.immersive-card');
    
    // Asignamos coords a la segunda tarjeta (Restaurante) para que haya una de prueba
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
                if (dist <= 2.0) { // Ampliado a 2km para facilidad de prueba
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
                html += <div class="mini-card"><div class="mini-card-img" style="background-image: url('');"></div><div class="mini-card-info"><h4 class="mini-title"></h4><p class="mini-desc"> A  mins.</p></div></div>;
            });
            sheetContent.innerHTML = html;
        } else if (sheetContent) {
            sheetContent.innerHTML = '<p style="text-align:center; color:#94A3B8; margin-top:20px;">No hay promociones extremadamente cerca de ti en este momento.</p>';
        }
    }

    // Pedir permiso de GPS al tocar cualquier parte de la pantalla si no se ha pedido (Mejor UX para móviles que bloquean peticiones automáticas)
    let gpsRequested = false;
    document.body.addEventListener('click', () => {
        if(!gpsRequested && 'geolocation' in navigator) {
            gpsRequested = true;
            navigator.geolocation.watchPosition((position) => {
                actualizarRadar(position.coords.latitude, position.coords.longitude);
            }, (err) => console.log(err), { enableHighAccuracy: true });
        }
    }, {once: true});
});
</script>
'''
soup.find('body').append(BeautifulSoup(new_script, 'html.parser'))

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(str(soup))
