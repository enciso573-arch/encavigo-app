
    let mapInstance = null;
    let mapMarkers = [];
    let uMarker = null;

    const getMarkerIcon = (camp, isClose) => {
        const size = isClose ? 40 : 28;
        const bg = isClose ? '#F97316' : '#111827'; 
        const inner = isClose ? '#FFFFFF' : '#F97316';
        
        const shadow = isClose ? '-3px 3px 15px rgba(249,115,22,0.9)' : '-2px 2px 6px rgba(0,0,0,0.4)';
        const anim = isClose ? 'animation: pulse 1.5s infinite;' : '';
        const zindex = isClose ? 'z-index: 1000;' : 'z-index: 500;';

        const html = `
            <div style="
                width: ${size}px; 
                height: ${size}px; 
                background: ${bg}; 
                border-radius: 50% 50% 50% 0; 
                transform: rotate(-45deg); 
                border: 2px solid white; 
                box-shadow: ${shadow}; 
                position: relative;
                ${anim}
                ${zindex}
            ">
                <div style="
                    width: ${size/2.5}px; 
                    height: ${size/2.5}px; 
                    background: ${inner}; 
                    border-radius: 50%; 
                    position: absolute; 
                    top: 50%; 
                    left: 50%; 
                    transform: translate(-50%, -50%);
                "></div>
            </div>
        `;
        return L.divIcon({ 
            className: 'custom-div-icon', 
            html: html, 
            iconSize: [size, size],
            iconAnchor: [size/2, size]
        });
    };

    const userIcon = L.divIcon({ className: 'custom-div-icon', html: "<div style='background:#3B82F6; width:15px; height:15px; border-radius:50%; border:2px solid white; box-shadow: 0 0 10px #3B82F6;'></div>", iconSize: [15, 15] });

    function openMap() {
        if (!window.fakesAdded) {
            window.fakesAdded = true;
            const fakeSpots = [
                { title: 'Fake Marina', lat: 20.6625, lng: -105.2530, waMsg: 'Hola' },
                { title: 'Fake Centro', lat: 20.6125, lng: -105.2340, waMsg: 'Hola' },
                { title: 'Fake Olas Altas', lat: 20.5980, lng: -105.2395, waMsg: 'Hola' },
                { title: 'Fake Versalles', lat: 20.6400, lng: -105.2280, waMsg: 'Hola' },
                { title: 'Fake Nvo Vallarta', lat: 20.6970, lng: -105.2890, waMsg: 'Hola' },
                { title: 'Fake Bucerias', lat: 20.7550, lng: -105.3340, waMsg: 'Hola' },
                { title: 'Fake La Cruz', lat: 20.7380, lng: -105.3780, waMsg: 'Hola' },
                { title: 'Fake Fluvial', lat: 20.6480, lng: -105.2250, waMsg: 'Hola' },
                { title: 'Fake Pitillal', lat: 20.6485, lng: -105.2100, waMsg: 'Hola' },
                { title: 'Fake Malecon', lat: 20.6080, lng: -105.2350, waMsg: 'Hola' }
            ];
            window.loadedCampaigns.push(...fakeSpots);
        }

        document.getElementById('mapModal').style.display = 'flex';
        
        if (!mapInstance) {
            mapInstance = L.map('map').setView([20.6534, -105.2253], 13);
            L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
                attribution: '&copy; Google Maps'
            }).addTo(mapInstance);
            
            uMarker = L.marker([0, 0], {icon: userIcon}).bindPopup("Tu ubicación");
            plotCampaignsInicial();
        }

        if (window.currentLat && window.currentLng) {
            mapInstance.setView([window.currentLat, window.currentLng], 14);
            updateMapLive(window.currentLat, window.currentLng);
        }
    }

    function plotCampaignsInicial() {
        const allCamps = window.loadedCampaigns || [];
        allCamps.forEach(camp => {
            if (camp.lat && camp.lng) {
                const marker = L.marker([camp.lat, camp.lng], {icon: getMarkerIcon(camp, false)}).addTo(mapInstance);
                marker.camp = camp;
                mapMarkers.push(marker);
            }
        });
    }

    function updateMapLive(uLat, uLng) {
        if (!mapInstance) return;
        if (!mapInstance.hasLayer(uMarker)) { uMarker.addTo(mapInstance); }
        uMarker.setLatLng([uLat, uLng]);

        mapMarkers.forEach(marker => {
            const camp = marker.camp;
            const dist = haversine(uLat, uLng, parseFloat(camp.lat), parseFloat(camp.lng));
            const isClose = dist <= 0.5;
            
            marker.setIcon(getMarkerIcon(camp, isClose));
            
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

    function centerMapOnUser() {
        if (mapInstance && window.currentLat && window.currentLng) {
            mapInstance.setView([window.currentLat, window.currentLng], 15);
        }
    }

    function closeMap() {
        document.getElementById('mapModal').style.display = 'none';
    }
