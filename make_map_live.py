import re
import time

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace the Leaflet JS block
old_leaflet_js = r"let mapInstance = null;.*?function closeMap\(\) \{.*?display = 'none';\s*\}"

new_leaflet_js = """let mapInstance = null;
    let mapMarkers = [];
    let uMarker = null;

    const farIcon = L.divIcon({ className: 'custom-div-icon', html: "<div style='background:#9CA3AF; width:12px; height:12px; border-radius:50%; border:2px solid white;'></div>", iconSize: [12, 12] });
    const closeIcon = L.divIcon({ className: 'custom-div-icon', html: "<div style='background:#F97316; width:18px; height:18px; border-radius:50%; border:2px solid white; box-shadow: 0 0 15px #F97316; animation: pulse 2s infinite;'></div>", iconSize: [18, 18] });
    const userIcon = L.divIcon({ className: 'custom-div-icon', html: "<div style='background:#3B82F6; width:15px; height:15px; border-radius:50%; border:2px solid white; box-shadow: 0 0 10px #3B82F6;'></div>", iconSize: [15, 15] });

    function openMap() {
        document.getElementById('mapModal').style.display = 'flex';
        
        if (!mapInstance) {
            mapInstance = L.map('map').setView([20.6534, -105.2253], 13);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; CARTO'
            }).addTo(mapInstance);
            
            // Crear marcador del usuario vacío (se llenará con el GPS)
            uMarker = L.marker([0, 0], {icon: userIcon}).bindPopup("Tu ubicación");
            
            // Plottear campañas iniciales
            plotCampaignsInicial();
        }

        // Si tenemos la variable global de GPS (guardada por el watchPosition)
        if (window.currentLat && window.currentLng) {
            mapInstance.setView([window.currentLat, window.currentLng], 14);
            updateMapLive(window.currentLat, window.currentLng);
        }
    }

    function plotCampaignsInicial() {
        const allCamps = window.loadedCampaigns || [];
        allCamps.forEach(camp => {
            if (camp.lat && camp.lng) {
                const marker = L.marker([camp.lat, camp.lng], {icon: farIcon}).addTo(mapInstance);
                marker.camp = camp; // Guardamos los datos en el marcador
                mapMarkers.push(marker);
            }
        });
    }

    // Esta función se llamará constantemente mientras el taxi avanza
    function updateMapLive(uLat, uLng) {
        if (!mapInstance) return;

        // Mover el punto azul del usuario
        if (!mapInstance.hasLayer(uMarker)) { uMarker.addTo(mapInstance); }
        uMarker.setLatLng([uLat, uLng]);

        // Actualizar todos los negocios en vivo
        mapMarkers.forEach(marker => {
            const camp = marker.camp;
            const dist = haversine(uLat, uLng, parseFloat(camp.lat), parseFloat(camp.lng));
            const isClose = dist <= 0.5; // 500 metros
            
            // Si te acercas a menos de 500m, se prende en naranja automáticamente!
            marker.setIcon(isClose ? closeIcon : farIcon);
            
            const waMsg = camp.waMsg || 'Hola';
            const waUrl = `https://wa.me/523221592596?text=${encodeURIComponent(waMsg)}`;
            const popupContent = `
                <div class="map-popup-title">${camp.title}</div>
                <div style="font-size:12px; margin-bottom:8px;">${isClose ? '🔥 A menos de 500m de ti' : '📍 A ' + dist.toFixed(1) + ' km'}</div>
                <a href="${waUrl}" target="_blank" class="map-popup-btn">Activar Promo</a>
            `;
            marker.setPopupContent(popupContent);
        });
    }

    function closeMap() {
        document.getElementById('mapModal').style.display = 'none';
    }"""

html = re.sub(old_leaflet_js, new_leaflet_js, html, flags=re.DOTALL)

# Now I need to find watchPosition and make it call updateMapLive
old_watch = r"navigator\.geolocation\.watchPosition\(\(position\) => \{.*?actualizarRadar\(position\.coords\.latitude, position\.coords\.longitude\);.*?\}, \(err\)"
new_watch = """navigator.geolocation.watchPosition((position) => {
                window.currentLat = position.coords.latitude;
                window.currentLng = position.coords.longitude;
                actualizarRadar(position.coords.latitude, position.coords.longitude);
                if (typeof updateMapLive === 'function') { updateMapLive(window.currentLat, window.currentLng); }
            }, (err)"""

html = re.sub(old_watch, new_watch, html, flags=re.DOTALL)

html += f"<!-- v42 {time.time()} -->"
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
