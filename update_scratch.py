import re
import time

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace the decideWinner function
old_decide_winner = r"function decideWinner\(\) \{.*?localStorage\.setItem\('encavigo_played'..*?display = 'none';\s*\}"

new_decide_winner = """function decideWinner() {
        const chance = Math.random();
        const resultDiv = document.getElementById('scratchResult');
        
        let icons = [];
        let title = "";
        let msg = "";

        if (chance <= 0.01) { // 1% Jackpot
            icons = ['🛡️', '🛡️', '🛡️'];
            title = '<span style="color: #10B981;">🎉 ¡VIAJE GRATIS! 🎉</span>';
            msg = "Muéstrale esta pantalla a tu chofer ahora mismo.";
        } else {
            // 99% Consolation Prize
            const foodTypes = [
                { icon: '🍔', name: 'Hamburguesas' },
                { icon: '🌮', name: 'Tacos' },
                { icon: '🍕', name: 'Pizzas' },
                { icon: '🍹', name: 'Bebidas' },
                { icon: '✂️', name: 'Servicios' }
            ];
            
            // Elegir el premio de consolación ganador (2 iguales)
            const winFood = foodTypes[Math.floor(Math.random() * foodTypes.length)];
            
            // Elegir un ícono perdedor para la 3ra posición
            let loseFood = foodTypes[Math.floor(Math.random() * foodTypes.length)];
            while(loseFood.icon === winFood.icon) {
                loseFood = foodTypes[Math.floor(Math.random() * foodTypes.length)];
            }
            
            // El 50% de las veces, el ícono perdedor será 1 escudo de EncaviGO para emocionarlos
            if(Math.random() > 0.5) {
                loseFood = { icon: '🛡️', name: 'EncaviGO' };
            }

            icons = [winFood.icon, winFood.icon, loseFood.icon];
            
            // Revolver los íconos al azar
            icons.sort(() => Math.random() - 0.5);
            
            title = `<span style="color: #F97316;">¡Descuento en ${winFood.name}!</span>`;
            msg = `Juntaste 2 iguales. Busca tu oferta en la app 👇`;
        }
        
        resultDiv.innerHTML = `
            <div style="font-size: 50px; letter-spacing: 15px; margin-bottom: 5px; text-shadow: 0 4px 10px rgba(0,0,0,0.1);">${icons.join('')}</div>
            <h2 style="margin: 0 0 5px 0; font-size: 20px;">${title}</h2>
            <p style="margin: 0; font-size: 14px; color: #4B5563; padding: 0 10px;">${msg}</p>
        `;
        
        // Guardar que ya jugó hoy
        localStorage.setItem('encavigo_played', new Date().toDateString());
        document.getElementById('scratchBanner').style.display = 'none';
    }"""

html = re.sub(old_decide_winner, new_decide_winner, html, flags=re.DOTALL)

html += f"<!-- v32 {time.time()} -->"
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
