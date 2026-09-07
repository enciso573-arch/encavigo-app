import re
import time

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Add Leaflet CSS to the <head>
leaflet_css = """<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
    #mapModal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: #000; z-index: 2000; display: none; flex-direction: column; }
    #map { flex: 1; width: 100%; }
    .map-header { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; background: #111827; color: white; border-bottom: 1px solid #374151; }
    .map-close { background: transparent; border: none; color: white; font-size: 24px; cursor: pointer; }
    .leaflet-popup-content-wrapper { background: #1F2937; color: white; border-radius: 12px; }
    .leaflet-popup-tip { background: #1F2937; }
    .map-popup-title { font-weight: bold; font-size: 16px; margin-bottom: 8px; color: #F97316; }
    .map-popup-btn { display: inline-block; background: #F97316; color: white; text-decoration: none; padding: 6px 12px; border-radius: 20px; font-weight: bold; font-size: 12px; }
</style>"""
html = html.replace('</head>', leaflet_css + '\n</head>')

# 2. Add Leaflet JS before closing body
leaflet_js = """<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
    let mapInstance = null;
    let mapMarkers = [];

    function openMap() {
        document.getElementById('mapModal').style.display = 'flex';
        
        if (!mapInstance) {
            // Inicializar mapa (Centro en Vallarta por defecto)
            mapInstance = L.map('map').setView([20.6534, -105.2253], 13);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap &copy; CARTO'
            }).addTo(mapInstance);
        }

        // Limpiar marcadores viejos
        mapMarkers.forEach(m => mapInstance.removeLayer(m));
        mapMarkers = [];

        // Tratar de obtener GPS del usuario para centrar
        let userLat = null, userLng = null;
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                userLat = pos.coords.latitude;
                userLng = pos.coords.longitude;
                mapInstance.setView([userLat, userLng], 14);
                
                // Agregar marcador del usuario
                const userIcon = L.divIcon({ className: 'custom-div-icon', html: "<div style='background:#3B82F6; width:15px; height:15px; border-radius:50%; border:2px solid white; box-shadow: 0 0 10px #3B82F6;'></div>", iconSize: [15, 15] });
                const uMarker = L.marker([userLat, userLng], {icon: userIcon}).addTo(mapInstance).bindPopup("Tu ubicación");
                mapMarkers.push(uMarker);
                
                plotCampaigns(userLat, userLng);
            }, () => { plotCampaigns(null, null); });
        } else {
            plotCampaigns(null, null);
        }
    }

    function plotCampaigns(uLat, uLng) {
        const allCamps = window.loadedCampaigns || [];
        
        // Iconos
        const farIcon = L.divIcon({ className: 'custom-div-icon', html: "<div style='background:#9CA3AF; width:12px; height:12px; border-radius:50%; border:2px solid white;'></div>", iconSize: [12, 12] });
        const closeIcon = L.divIcon({ className: 'custom-div-icon', html: "<div style='background:#F97316; width:18px; height:18px; border-radius:50%; border:2px solid white; box-shadow: 0 0 15px #F97316; animation: pulse 2s infinite;'></div>", iconSize: [18, 18] });

        allCamps.forEach(camp => {
            if (camp.lat && camp.lng) {
                let dist = 999;
                if(uLat && uLng) { dist = haversine(uLat, uLng, parseFloat(camp.lat), parseFloat(camp.lng)); }
                
                // Si está a menos de 500m (0.5km), icono especial
                const isClose = dist <= 0.5;
                const iconToUse = isClose ? closeIcon : farIcon;
                
                const waMsg = camp.waMsg || 'Hola';
                const waUrl = `https://wa.me/523221592596?text=${encodeURIComponent(waMsg)}`;
                
                const popupContent = `
                    <div class="map-popup-title">${camp.title}</div>
                    <div style="font-size:12px; margin-bottom:8px;">${isClose ? '🔥 A menos de 500m' : '📍 ' + (dist === 999 ? 'En Vallarta' : dist.toFixed(1) + ' km')}</div>
                    <a href="${waUrl}" target="_blank" class="map-popup-btn">Activar Promo</a>
                `;

                const marker = L.marker([camp.lat, camp.lng], {icon: iconToUse})
                    .addTo(mapInstance)
                    .bindPopup(popupContent);
                
                mapMarkers.push(marker);
            }
        });
    }

    function closeMap() {
        document.getElementById('mapModal').style.display = 'none';
    }
</script>"""
html = html.replace('</body>', leaflet_js + '\n</body>')

# 3. Add the HTML for the Map Modal (right after app-container)
map_html = """
<div id="mapModal">
    <div class="map-header">
        <div style="font-weight:bold; font-size:18px;">Mapa de Promociones</div>
        <button class="map-close" onclick="closeMap()">&times;</button>
    </div>
    <div id="map"></div>
</div>
"""
html = html.replace('<!-- Opción 2: PULL-UP DRAWER -->', map_html + '\n<!-- Opción 2: PULL-UP DRAWER -->')

# 4. Change the pullup-pill onclick to openMap()
# Find the exact current onclick and replace it
old_onclick = r"onclick=\"document\.getElementById\('nearbySheet'\)\.classList\.add\('active'\); document\.getElementById\('sheetBackdrop'\)\.classList\.add\('active'\);\""
html = re.sub(old_onclick, 'onclick="openMap()"', html)

# 5. Remove the old nearbySheet and sheetBackdrop HTML completely to clean up the code
html = re.sub(r'<!-- PULL-UP SHEET CONTENT -->.*?</div>\s*</div>\s*</div>', '', html, flags=re.DOTALL)

html += f"<!-- v38 {time.time()} -->"
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
