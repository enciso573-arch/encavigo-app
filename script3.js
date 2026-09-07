
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
    window.loadedCampaigns = []; // Store them for radar
    
    function actualizarRadar(userLat, userLng) {
        let cercanas = [];
        window.loadedCampaigns.forEach(camp => {
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
    
    
    // ALGORITMO DE BARAJA INTELIGENTE (Max 15 Tarjetas)
    function renderDeck(deck) {
        if(!mainFeed) return;
        if(deck.length === 0) {
            mainFeed.innerHTML = '<div style="color:white; text-align:center; padding:50px; font-family:sans-serif;">No hay promociones activas en este momento.</div>';
            return;
        }
        
        let html = '';
        deck.forEach(camp => {
            const waMsg = camp.waMsg || 'Hola';
            const fullMsg = `${waMsg} Mi código de promo es: ${session.code} (Unidad: ${session.chofer})`;
            const waUrl = `https://wa.me/523221592596?text=${encodeURIComponent(fullMsg)}`;
            
            html += `
            <article class="immersive-card">
                <div class="card-bg" style="background-image: url('${camp.img || ''}');"></div>
                <div class="card-overlay" style="background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%);"></div>
                <div class="card-ui">
                    <div class="card-badge" style="background: rgba(245, 158, 11, 0.2); border-color: rgba(245, 158, 11, 0.5); color: #FBBF24;">
                        ✨ ${camp.badge || 'PROMO ACTIVA'}
                    </div>
                    <h2 class="card-headline">${camp.title || ''}</h2>
                    <p class="card-body">${camp.desc || ''}</p>
                    <a href="${waUrl}" target="_blank" rel="noopener" class="swipe-btn track-click" data-campid="${camp.id}">
                        Activar código
                    </a>
                </div>
            </article>
            `;
        });
        mainFeed.innerHTML = html;

        // Re-attach click listeners
        document.querySelectorAll('.track-click').forEach(btn => {
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

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function buildSmartDeck(userLat, userLng) {
        let allCamps = [...window.loadedCampaigns];
        
        if (allCamps.length <= 15) {
            // Si hay menos de 15 en total, solo revuélvelas todas y muéstralas
            renderDeck(shuffleArray(allCamps));
            return;
        }

        let finalDeck = [];
        
        if (userLat && userLng) {
            // 1. Filtrar por cercanía (Los 10 más cercanos)
            allCamps.forEach(c => {
                if(c.lat && c.lng) {
                    c._dist = haversine(userLat, userLng, parseFloat(c.lat), parseFloat(c.lng));
                } else {
                    c._dist = 9999;
                }
            });
            allCamps.sort((a, b) => a._dist - b._dist);
            
            const closest = allCamps.slice(0, 10);
            const remaining = allCamps.slice(10);
            const randomFill = shuffleArray(remaining).slice(0, 5);
            
            finalDeck = shuffleArray([...closest, ...randomFill]);
        } else {
            // Si no hay GPS, solo muestra 15 al azar
            finalDeck = shuffleArray(allCamps).slice(0, 15);
        }
        
        renderDeck(finalDeck);
    }

    db.collection('campaigns').where('active', '==', true).get().then(snapshot => {
        snapshot.forEach(doc => {
            const camp = doc.data();
            camp.id = doc.id;
            window.loadedCampaigns.push(camp);
        });
        
        // Renderizar inicial (Al azar, 15 max)
        buildSmartDeck(null, null);
        
        // Intentar obtener GPS de inmediato sin esperar clic
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition((pos) => {
                // Si da permiso, reconstruimos la baraja usando el GPS!
                buildSmartDeck(pos.coords.latitude, pos.coords.longitude);
                actualizarRadar(pos.coords.latitude, pos.coords.longitude); // Actualizar burbuja inferior
            }, (err) => console.log("GPS no autorizado de inicio"), { enableHighAccuracy: true });
        }

    }).catch(e => console.error("Error loading campaigns:", e));


    let gpsRequested = false;
    document.body.addEventListener('click', () => {
        if(!gpsRequested && 'geolocation' in navigator) {
            gpsRequested = true;
            navigator.geolocation.watchPosition((position) => {
                window.currentLat = position.coords.latitude;
                window.currentLng = position.coords.longitude;
                actualizarRadar(position.coords.latitude, position.coords.longitude);
                if (typeof updateMapLive === 'function') { updateMapLive(window.currentLat, window.currentLng); }
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

    


    // 6-Card Mini Game Logic
    let taps = 0;
    let sequence = [];
    let winData = {};
    let isJackpot = false;
    let selectedCards = [];

    const logoImg = '<img src="logo_jackpot.jpg" style="width:50px; height:50px; border-radius:50%; vertical-align:middle; object-fit:cover; box-shadow:0 2px 8px rgba(0,0,0,0.15); margin: 0 5px;">';

    function initGame() {
        const today = new Date().toDateString();
        const lastPlayed = localStorage.getItem('encavigo_played');
        if (lastPlayed !== today) {
            document.getElementById('scratchBanner').style.display = 'block';
        }
    }

    function openGame() {
        document.getElementById('gameModal').style.display = 'flex';
        document.getElementById('scratchBanner').style.display = 'none';
        
        const chance = Math.random();
        isJackpot = (chance <= 0.01);

        if (isJackpot) {
            sequence = [logoImg, logoImg, logoImg];
            winData = { title: '<span style="color: #10B981;">🎉 VIAJE GRATIS 🎉</span>', msg: 'Muéstrale esta pantalla a tu chofer ahora.' };
        } else {
            // CONECTADO A BASE DE DATOS DE FIREBASE
            const activeCampaigns = window.loadedCampaigns || [];
            if (activeCampaigns.length === 0) {
                // Fallback de seguridad si el internet falló
                activeCampaigns.push({ title: 'Comida Local', imgUrl: null, fallbackIcon: '🍔' });
                activeCampaigns.push({ title: 'Servicios', imgUrl: null, fallbackIcon: '✂️' });
            }
            
            const winIndex = Math.floor(Math.random() * activeCampaigns.length);
            const winCamp = activeCampaigns[winIndex];
            
            let loseIndex = Math.floor(Math.random() * activeCampaigns.length);
            while(loseIndex === winIndex && activeCampaigns.length > 1) { loseIndex = Math.floor(Math.random() * activeCampaigns.length); }
            const loseCamp = activeCampaigns[loseIndex];
            
            // Build the HTML for the card faces (Use their actual image from Firebase!)
            const getIconHTML = (camp) => {
                if (camp.imgUrl) return `<img src="${camp.imgUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:10px;">`;
                return `<div style="font-size:45px;">${camp.fallbackIcon || '🎁'}</div>`;
            };

            const winIconHTML = getIconHTML(winCamp);
            let loseIconHTML = getIconHTML(loseCamp);
            
            if(Math.random() > 0.5) { loseIconHTML = logoImg; } // EncaviGO tease
            
            sequence = [winIconHTML, loseIconHTML, winIconHTML];
            winData = { title: `<span style="color: #F97316;">¡Cupón en <br>${winCamp.title}!</span>`, msg: 'Cierra esta pantalla y baja a reclamarlo.' };
        }
    }

    function flipCard(index) {
        const card = document.getElementById('card-' + index);
        // Prevent double clicking or clicking more than 3
        if (taps >= 3 || card.classList.contains('flipped')) return;
        
        // Reveal the pre-determined icon
        document.getElementById('back-' + index).innerHTML = sequence[taps];
        card.classList.add('flipped');
        selectedCards.push(index);
        taps++;
        
        document.getElementById('gameTitle').innerHTML = `Llevas ${taps} de 3 intentos`;

        if (taps === 3) {
            setTimeout(triggerAnimation, 800);
        }
    }

    function triggerAnimation() {
        document.getElementById('gameTitle').style.display = 'none';
        
        // Fade out all unselected cards, and the 2nd selected card (the loser icon)
        for (let i = 0; i < 6; i++) {
            const card = document.getElementById('card-' + i);
            if (!selectedCards.includes(i) || (i === selectedCards[1] && !isJackpot)) {
                card.classList.add('fade-out');
            }
        }

        // Animate the winning cards to the center
        setTimeout(() => {
            const match1 = document.getElementById('inner-' + selectedCards[0]);
            let match2 = document.getElementById('inner-' + selectedCards[2]);
            if(isJackpot) { match2 = document.getElementById('inner-' + selectedCards[1]); const match3 = document.getElementById('inner-' + selectedCards[2]); match3.classList.add('merge-animate'); }
            
            // Remove them from normal flow and throw them to center
            match1.classList.add('merge-animate');
            match2.classList.add('merge-animate');
            
            // Show result text
            setTimeout(() => {
                document.getElementById('resultTitle').innerHTML = winData.title;
                document.getElementById('resultMsg').innerHTML = winData.msg;
                document.getElementById('gameResult').style.display = 'block';
                localStorage.setItem('encavigo_played', new Date().toDateString());
            }, 800);
            
        }, 500);
    }

    function closeGame() {
        document.getElementById('gameModal').style.display = 'none';
    }

    window.addEventListener('DOMContentLoaded', initGame);

