import re
import time

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Add the CSS for the Scratch Game
scratch_css = """
    /* Scratch Game Styles */
    .scratch-banner { background: linear-gradient(135deg, #F97316, #EAB308); color: white; padding: 15px; border-radius: 12px; margin: 20px; text-align: center; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(249, 115, 22, 0.4); cursor: pointer; animation: pulse 2s infinite; display: none; }
    @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.02); } 100% { transform: scale(1); } }
    .scratch-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 1000; display: none; align-items: center; justify-content: center; flex-direction: column; }
    .scratch-container { position: relative; width: 300px; height: 150px; background: #FFF; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .scratch-result { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; text-align: center; padding: 20px; box-sizing: border-box; flex-direction: column; }
    .scratch-result h2 { margin: 0 0 10px 0; font-size: 22px; }
    .scratch-result p { margin: 0; font-size: 14px; color: #4B5563; }
    .scratch-canvas { position: absolute; top: 0; left: 0; z-index: 2; cursor: pointer; }
    .scratch-close { margin-top: 20px; background: white; color: #111827; border: none; padding: 10px 20px; border-radius: 20px; font-weight: bold; cursor: pointer; display: none; }
"""
html = html.replace('</style>', scratch_css + '\n</style>')

# 2. Add the HTML for the Scratch Game
scratch_html = """
<div id="scratchBanner" class="scratch-banner" onclick="openScratchGame()">
    🎁 ¡Raspa y Gana un Viaje GRATIS! 🎁
</div>

<div id="scratchModal" class="scratch-modal">
    <div style="color: white; font-weight: bold; margin-bottom: 15px; font-size: 20px;">Talla la tarjeta 👇</div>
    <div class="scratch-container" id="scratchContainer">
        <div class="scratch-result" id="scratchResult">
            <!-- Dynamic Result -->
        </div>
        <canvas id="scratchCanvas" class="scratch-canvas" width="300" height="150"></canvas>
    </div>
    <button id="scratchClose" class="scratch-close" onclick="closeScratchGame()">Ver Cupones</button>
</div>
"""
# Insert right after <body>
html = html.replace('<body>', '<body>\n' + scratch_html)

# 3. Add the JS Logic
scratch_js = """
    // Scratch Game Logic
    let isDrawing = false;
    let canvas, ctx;

    function initScratch() {
        const today = new Date().toDateString();
        const lastPlayed = localStorage.getItem('encavigo_played');
        
        // Show banner only if they haven't played today
        if (lastPlayed !== today) {
            document.getElementById('scratchBanner').style.display = 'block';
        }
    }

    function openScratchGame() {
        document.getElementById('scratchModal').style.display = 'flex';
        setupCanvas();
        decideWinner();
    }

    function decideWinner() {
        // MATEMÁTICA SECRETA: 1% de ganar
        const chance = Math.random();
        const resultDiv = document.getElementById('scratchResult');
        
        if (chance <= 0.01) { // 1%
            resultDiv.innerHTML = '<h2 style="color: #10B981;">🎉 ¡VIAJE GRATIS! 🎉</h2><p>Muéstrale esta pantalla a tu chofer ahora mismo.</p>';
        } else {
            resultDiv.innerHTML = '<h2 style="color: #EF4444;">¡Casi! 😅</h2><p>Hoy no hubo suerte, pero baja a ver las ofertas increíbles.</p>';
        }
        
        // Guardar que ya jugó hoy
        localStorage.setItem('encavigo_played', new Date().toDateString());
        document.getElementById('scratchBanner').style.display = 'none';
    }

    function setupCanvas() {
        canvas = document.getElementById('scratchCanvas');
        ctx = canvas.getContext('2d');
        
        // Pintar la capa plateada
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Texto de "Raspa Aquí"
        ctx.fillStyle = '#4B5563';
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Raspa con tu dedo', canvas.width / 2, canvas.height / 2 + 5);

        // Eventos táctiles y de mouse
        canvas.addEventListener('mousedown', startScratch);
        canvas.addEventListener('touchstart', startScratch, {passive: false});
        canvas.addEventListener('mousemove', scratch);
        canvas.addEventListener('touchmove', scratch, {passive: false});
        window.addEventListener('mouseup', endScratch);
        window.addEventListener('touchend', endScratch);
    }

    function getMousePos(evt) {
        const rect = canvas.getBoundingClientRect();
        let clientX = evt.clientX;
        let clientY = evt.clientY;
        
        if(evt.touches && evt.touches.length > 0) {
            clientX = evt.touches[0].clientX;
            clientY = evt.touches[0].clientY;
        }
        
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    function startScratch(e) {
        isDrawing = true;
        scratch(e);
    }

    function scratch(e) {
        if (!isDrawing) return;
        e.preventDefault(); // Evitar que la pantalla haga scroll al raspar
        
        const pos = getMousePos(e);
        
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2); // 20 es el grosor del "dedo"
        ctx.fill();
        
        checkWinCondition();
    }

    function endScratch() {
        isDrawing = false;
    }

    let revealed = false;
    function checkWinCondition() {
        if(revealed) return;
        
        // Calcular qué porcentaje se ha borrado
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        let transparentPixels = 0;
        
        for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] === 0) {
                transparentPixels++;
            }
        }
        
        const transparentPercentage = (transparentPixels / (pixels.length / 4)) * 100;
        
        // Si borró más del 40%, revelamos todo el resultado y mostramos el botón
        if (transparentPercentage > 40) {
            revealed = true;
            canvas.style.transition = 'opacity 0.5s';
            canvas.style.opacity = '0';
            setTimeout(() => {
                canvas.style.display = 'none';
                document.getElementById('scratchClose').style.display = 'block';
            }, 500);
        }
    }

    function closeScratchGame() {
        document.getElementById('scratchModal').style.display = 'none';
    }

    // Call init on load
    window.addEventListener('DOMContentLoaded', initScratch);
"""
# Insert right before the closing </script> in index.html
html = html.replace('</script>\n</body>', scratch_js + '\n</script>\n</body>')

html += f"<!-- v30 {time.time()} -->"
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
