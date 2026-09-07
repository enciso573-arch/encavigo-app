import re
import time

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Make loadedCampaigns global
html = html.replace("let loadedCampaigns = []; // Store them for radar", "window.loadedCampaigns = []; // Store them for radar")
html = html.replace("loadedCampaigns.push(camp);", "window.loadedCampaigns.push(camp);")
html = html.replace("loadedCampaigns.forEach", "window.loadedCampaigns.forEach")

# Update openGame logic
old_open_game = r"function openGame\(\) \{.*?winData = \{ title: `<span style=\"color: #F97316;\">¡Descuento en \$\{winFood\.name\}!</span>`, msg: 'Juntaste 2 iguales\. Cierra esto y busca tu promoción en la app\.' \};\s*\}\s*\}"

new_open_game = """function openGame() {
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
    }"""

html = re.sub(old_open_game, new_open_game, html, flags=re.DOTALL)

html += f"<!-- v36 {time.time()} -->"
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
