import re
import time

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# I will modify renderDeck to inject the welcome card
old_render = r"function renderDeck\(deck\) \{(.*?)(?=let html = '';)"
new_render = """function renderDeck(deck) {
        if(!mainFeed) return;
        
        // Inyectar tarjeta de bienvenida al principio
        const welcomeCard = {
            isWelcome: true,
            title: "¡Estás en EncaviGO!",
            desc: "Desliza tu dedo hacia los lados para descubrir ofertas exclusivas, restaurantes y negocios cerca de tu ruta.\\n\\n🎲 ¡Toca el botón naranja de arriba para jugar y ganar tu VIAJE GRATIS!",
            badge: "¡GRACIAS POR ESCANEAR!",
            img: "logo_jackpot.jpg" // Podemos usar el logo negro/naranja para la bienvenida
        };
        deck.unshift(welcomeCard);
        
"""

html = re.sub(old_render, new_render, html, flags=re.DOTALL)

# Now modify the card HTML generation to handle isWelcome
old_card_gen = r"const waMsg = camp\.waMsg \|\| 'Hola';(.*?)<a href=\"\$\{waUrl\}\" target=\"_blank\" class=\"card-action-btn\">Activar cdigo</a>"

new_card_gen = """const waMsg = camp.waMsg || 'Hola';
            const fullMsg = `${waMsg} Mi código de promo es: ${session ? session.code : 'TEST'} (Unidad: ${session ? session.chofer : 'TEST'})`;
            const waUrl = `https://wa.me/523221592596?text=${encodeURIComponent(fullMsg)}`;
            
            // Si es la tarjeta de bienvenida, cambiamos el botón
            const btnHtml = camp.isWelcome 
                ? `<div class="card-action-btn" style="background:#4B5563;">Desliza para descubrir 👉</div>` 
                : `<a href="${waUrl}" target="_blank" class="card-action-btn">Activar código</a>`;

            html += `
            <article class="immersive-card">
                <div class="card-bg" style="background-image: url('${camp.img || ''}'); ${camp.isWelcome ? 'background-size: contain; background-repeat: no-repeat; background-position: center 30%; background-color: #000;' : ''}"></div>
                <div class="card-overlay" style="background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%);"></div>
                <div class="card-ui">
                    <div class="card-badge" style="background: rgba(245, 158, 11, 0.2); border-color: rgba(245, 158, 11, 0.5); color: #FBBF24;">
                        ✨ ${camp.badge || 'PROMO ACTIVA'}
                    </div>
                    
                    <h2 class="card-title">${camp.title}</h2>
                    <p class="card-desc">${camp.desc ? camp.desc.replace(/\\n/g, '<br>') : ''}</p>
                    
                    ${btnHtml}"""

html = re.sub(old_card_gen, new_card_gen, html, flags=re.DOTALL)

html += f"<!-- v53 {time.time()} -->"
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
