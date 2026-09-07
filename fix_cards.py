import re
import time

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Fix renderDeck html generation
old_render_match = re.search(r"let html = '';\s*deck\.forEach\(camp => \{.*?mainFeed\.innerHTML = html;", html, flags=re.DOTALL)
if old_render_match:
    new_render = """let html = '';
        deck.forEach(camp => {
            const waMsg = camp.waMsg || 'Hola';
            const fullMsg = `${waMsg} Mi código de promo es: ${session ? session.code : 'N/A'} (Unidad: ${session ? session.chofer : 'N/A'})`;
            const waUrl = `https://wa.me/523221592596?text=${encodeURIComponent(fullMsg)}`;
            
            html += `
            <article class="immersive-card">
                <div class="card-bg" style="background-image: url('${camp.img || ''}'); background-size: cover; background-position: center;"></div>
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
        mainFeed.innerHTML = html;"""
    html = html.replace(old_render_match.group(0), new_render)

# He also mentioned colors: "no me cuadra muy bien los colores de la pagin principal, la siento muy ia y no tanto una startup"
# The splash screen is currently `#0F172A` (dark slate blue) and the text is white and #F97316 (orange).
# To make it look more like a startup and less generic "AI", let's make the background pure black `#000` or `#111` to match the app, 
# or a very subtle elegant gradient, and make the text cleaner.
old_splash = r'<div id="splashScreen" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: #0F172A;'
new_splash = '<div id="splashScreen" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: #09090B;'
html = html.replace(old_splash, new_splash)

html += f"<!-- v59 {time.time()} -->"
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
