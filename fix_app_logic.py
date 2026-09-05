from bs4 import BeautifulSoup
import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')

# 1. UPDATE WHATSAPP LINKS to actual phone number
for a in soup.find_all('a', href=True):
    if 'wa.me/521XXXXXXXXXX' in a['href']:
        a['href'] = a['href'].replace('521XXXXXXXXXX', '523221592596')

# Ensure Driver recruitment uses the number too
for a in soup.find_all('a', class_='swipe-btn'):
    if 'Registrar mi vehículo' in a.text or 'Subir mi negocio hoy' in a.text:
        a['href'] = 'https://wa.me/523221592596?text=Hola,%20quiero%20informaci%C3%B3n%20para%20afiliarme%20a%20EncaviGO.'

# 2. INJECT JS LOGIC
script_content = '''
<script>
document.addEventListener('DOMContentLoaded', () => {
    // ------------------------------------------------------------
    // 1. SISTEMA DE SESIÓN (24 HORAS) Y CÓDIGO ÚNICO
    // ------------------------------------------------------------
    const SESSION_HOURS = 24;
    const SESSION_KEY = 'encavigo_session';
    
    // Obtener parámetros de la URL (Ej. ?chofer=001)
    const urlParams = new URLSearchParams(window.location.search);
    const paramChofer = urlParams.get('chofer');
    
    let session = JSON.parse(localStorage.getItem(SESSION_KEY));
    const now = Date.now();
    
    // Si la URL trae un parámetro ?chofer, siempre reseteamos la sesión 
    // (significa que es un nuevo escaneo fresco en el carro)
    if (paramChofer) {
        session = null; 
    }
    
    if (!session) {
        // Nueva sesión
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let uniqueCode = 'ENC-';
        for(let i=0; i<4; i++) uniqueCode += chars.charAt(Math.floor(Math.random() * chars.length));
        
        session = {
            timestamp: now,
            code: uniqueCode,
            chofer: paramChofer || 'orgánico'
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        
        // Limpiamos la URL visualmente para que no se vea el parámetro
        window.history.replaceState({}, document.title, window.location.pathname);
    } else {
        // Verificar si caducó
        const diffHours = (now - session.timestamp) / (1000 * 60 * 60);
        if (diffHours > SESSION_HOURS) {
            // BLOQUEAR APLICACIÓN
            document.body.innerHTML = 
                <div style="height: 100dvh; width: 100vw; background: #000; color: #FFF; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 30px; text-align: center; font-family: sans-serif;">
                    <div style="font-size: 50px; margin-bottom: 20px;">🔒</div>
                    <h1 style="font-size: 24px; font-weight: 900; margin-bottom: 10px;">Sesión Expirada</h1>
                    <p style="color: #94A3B8; line-height: 1.5;">Tu código promocional ha caducado. Sube a un vehículo afiliado a EncaviGO y escanea un código QR nuevo para desbloquear las ofertas de hoy.</p>
                </div>
            ;
            localStorage.removeItem(SESSION_KEY);
            return; // Detener ejecución
        }
    }
    
    // Mostrar el ID del chofer en la interfaz (opcional, en el escudo)
    const driverLabel = document.getElementById('driverNameLabel');
    if (driverLabel && session.chofer !== 'orgánico') {
        driverLabel.innerHTML = 'Vehículo ID: ' + session.chofer;
    }

    // ------------------------------------------------------------
    // 2. AÑADIR EL CÓDIGO A LOS BOTONES DE WHATSAPP
    // ------------------------------------------------------------
    const waLinks = document.querySelectorAll('a[href*="wa.me"]');
    waLinks.forEach(link => {
        let originalHref = link.getAttribute('href');
        // Solo añadirlo una vez
        if (!originalHref.includes('código')) {
            const addText =  Mi código de promo es:  (Unidad: );
            link.setAttribute('href', originalHref + encodeURIComponent(addText));
        }
    });

    // ------------------------------------------------------------
    // 3. RADAR GPS INTELIGENTE
    // ------------------------------------------------------------
    // Añadiremos coordenadas de ejemplo a las tarjetas de negocios para poder medirlas.
    const cards = document.querySelectorAll('.immersive-card');
    
    // Asignamos coords ficticias a la tarjeta del Asador para pruebas (Ej. Zona Romántica)
    if(cards.length > 1) {
        cards[1].setAttribute('data-lat', '20.6025');
        cards[1].setAttribute('data-lng', '-105.2325');
        cards[1].setAttribute('data-title', 'Asador El Pariente');
        cards[1].setAttribute('data-desc', 'Cena al carbón con 2x1 en hamburguesas.');
        cards[1].setAttribute('data-img', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=300&q=80');
    }
    
    function haversine(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radio de la Tierra en km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c; // Distancia en km
    }

    const drawerBadge = document.querySelector('.pullup-badge');
    const sheetContent = document.querySelector('.sheet-content');
    
    function actualizarRadar(userLat, userLng) {
        let cercanas = [];
        
        cards.forEach((card, index) => {
            const cLat = card.getAttribute('data-lat');
            const cLng = card.getAttribute('data-lng');
            if (cLat && cLng) {
                const dist = haversine(userLat, userLng, parseFloat(cLat), parseFloat(cLng));
                // Si está a menos de 1km (1000 metros)
                if (dist <= 1.0) {
                    cercanas.push({
                        title: card.getAttribute('data-title'),
                        desc: card.getAttribute('data-desc'),
                        img: card.getAttribute('data-img'),
                        distKm: dist
                    });
                }
            }
        });
        
        // Actualizar UI del Cajón Flotante
        if (drawerBadge) {
            drawerBadge.innerText = cercanas.length;
        }
        
        // Actualizar contenido de la Ventana (Bottom Sheet)
        if (sheetContent && cercanas.length > 0) {
            let html = '<p style="font-size: 12px; color: #34D399; text-align: center; margin-top:0;">El conductor se acerca a estos lugares:</p>';
            cercanas.forEach(local => {
                const mins = Math.max(1, Math.round(local.distKm * 5)); // Estimado 5 mins por km
                html += 
                <div class="mini-card">
                    <div class="mini-card-img" style="background-image: url('');"></div>
                    <div class="mini-card-info">
                        <h4 class="mini-title"></h4>
                        <p class="mini-desc"> A  mins.</p>
                    </div>
                </div>;
            });
            sheetContent.innerHTML = html;
        } else if (sheetContent) {
            sheetContent.innerHTML = '<p style="text-align:center; color:#94A3B8; margin-top:20px;">No hay promociones extremadamente cerca de ti en este momento. Sigue en tu viaje para descubrir más.</p>';
        }
    }

    // Simular GPS (ya que estamos en un teléfono real, pedimos permiso real)
    if ('geolocation' in navigator) {
        navigator.geolocation.watchPosition((position) => {
            actualizarRadar(position.coords.latitude, position.coords.longitude);
        }, (error) => {
            console.log("GPS Denegado o Error:", error);
            // Mostrar 0 si denegó el GPS
            if(drawerBadge) drawerBadge.innerText = "0";
        }, { enableHighAccuracy: true });
    }
});
</script>
'''

# Find the end of body and inject the script BEFORE any existing scripts that might conflict
body = soup.find('body')
if body:
    # First, let's remove any old old scripts that might interfere
    for s in body.find_all('script'):
        if 'notificarProxima' in s.text or 'haversine' in s.text:
            s.decompose()
            
    body.append(BeautifulSoup(script_content, 'html.parser'))

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(str(soup))
