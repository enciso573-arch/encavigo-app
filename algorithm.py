import re
import time

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# I need to extract the existing HTML building logic and refactor it into renderDeck(deck)
# Let's find the snapshot.forEach block
old_block = r"db\.collection\('campaigns'\)\.where\('active', '==', true\)\.get\(\)\.then\(snapshot => \{.*?\n\s+let html = '';\s*\n\s*snapshot\.forEach\(doc => \{.*?mainFeed\.innerHTML = html;.*?\}\)\.catch\(e => console\.error\(\"Error loading campaigns:\", e\)\);"

new_block = """
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
"""

# Now we need to carefully execute the replacement
match = re.search(r"db\.collection\('campaigns'\)\.where\('active', '==', true\)\.get\(\)\.then\(snapshot => \{.*?\n\s+let html = '';.*?\n\s*snapshot\.forEach\(doc => \{.*?mainFeed\.innerHTML = html;.*?\}\)\.catch\(e => console\.error\(\"Error loading campaigns:\", e\)\);", html, flags=re.DOTALL)

if match:
    html = html.replace(match.group(0), new_block)
    html += f"<!-- v37 {time.time()} -->"
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Algorithm implemented successfully!")
else:
    print("Could not match the old firebase block.")
