import re
import time

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Remove old scratch game CSS
html = re.sub(r'/\* Scratch Game Styles \*/.*?\.scratch-close \{.*?\}', '', html, flags=re.DOTALL)

# 2. Add New Mini-Game CSS
new_css = """
    /* 6-Card Mini Game Styles */
    .scratch-banner { position: absolute; top: 60px; left: 20px; right: 20px; z-index: 100; background: linear-gradient(135deg, #F97316, #EAB308); color: white; padding: 15px; border-radius: 12px; text-align: center; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(249, 115, 22, 0.4); cursor: pointer; animation: pulse 2s infinite; display: none; }
    @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.02); } 100% { transform: scale(1); } }
    
    .game-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); z-index: 1000; display: none; align-items: center; justify-content: center; flex-direction: column; overflow: hidden; }
    .game-title { color: white; font-weight: bold; margin-bottom: 30px; font-size: 22px; text-align: center; }
    
    .cards-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; width: 320px; position: relative; }
    
    .flip-card { background-color: transparent; width: 90px; height: 110px; perspective: 1000px; cursor: pointer; }
    .flip-card-inner { position: relative; width: 100%; height: 100%; text-align: center; transition: transform 0.6s; transform-style: preserve-3d; }
    .flip-card.flipped .flip-card-inner { transform: rotateY(180deg); }
    
    .flip-card-front, .flip-card-back { position: absolute; width: 100%; height: 100%; -webkit-backface-visibility: hidden; backface-visibility: hidden; border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
    
    .flip-card-front { background: linear-gradient(135deg, #CBD5E1, #94A3B8); color: #111827; font-size: 24px; font-weight: bold; border: 2px solid #E2E8F0; }
    .flip-card-front::after { content: '?'; color: rgba(255,255,255,0.5); font-size: 40px; }
    
    .flip-card-back { background: white; transform: rotateY(180deg); font-size: 45px; border: 2px solid #F97316; }
    
    /* Animation classes for merging */
    .fade-out { opacity: 0; transition: opacity 0.5s ease; pointer-events: none; }
    .merge-animate { position: absolute !important; z-index: 50; transition: all 1s ease-in-out !important; transform: rotateY(180deg) scale(1.5) translate(0, 0) !important; left: 50% !important; top: 50% !important; margin-left: -45px; margin-top: -55px; }
    
    .game-result { display: none; text-align: center; margin-top: 150px; z-index: 100; animation: popIn 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
    @keyframes popIn { 0% { transform: scale(0); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
    
    .btn-close-game { margin-top: 25px; background: linear-gradient(135deg, #F97316, #EA580C); color: white; border: none; padding: 12px 30px; border-radius: 25px; font-weight: bold; font-size: 16px; cursor: pointer; box-shadow: 0 4px 15px rgba(249, 115, 22, 0.4); }
"""
html = html.replace('</style>', new_css + '\n</style>')


# 3. Remove Old HTML (scratchBanner, scratchModal, etc.)
html = re.sub(r'<div id="scratchBanner".*?</div>', '', html, flags=re.DOTALL)
html = re.sub(r'<div id="scratchModal".*?</div>', '', html, flags=re.DOTALL)

# 4. Add New HTML
new_html = """
<div id="scratchBanner" class="scratch-banner" onclick="openGame()">
    🎁 ¡Encuentra tu Premio! 🎁
</div>

<div id="gameModal" class="game-modal">
    <div class="game-title" id="gameTitle">Elige 3 tarjetas <br><span style="font-size: 14px; font-weight: normal; color: #9CA3AF;">Tienes 3 intentos</span></div>
    
    <div class="cards-grid" id="cardsGrid">
        <div class="flip-card" id="card-0" onclick="flipCard(0)"><div class="flip-card-inner" id="inner-0"><div class="flip-card-front"></div><div class="flip-card-back" id="back-0"></div></div></div>
        <div class="flip-card" id="card-1" onclick="flipCard(1)"><div class="flip-card-inner" id="inner-1"><div class="flip-card-front"></div><div class="flip-card-back" id="back-1"></div></div></div>
        <div class="flip-card" id="card-2" onclick="flipCard(2)"><div class="flip-card-inner" id="inner-2"><div class="flip-card-front"></div><div class="flip-card-back" id="back-2"></div></div></div>
        <div class="flip-card" id="card-3" onclick="flipCard(3)"><div class="flip-card-inner" id="inner-3"><div class="flip-card-front"></div><div class="flip-card-back" id="back-3"></div></div></div>
        <div class="flip-card" id="card-4" onclick="flipCard(4)"><div class="flip-card-inner" id="inner-4"><div class="flip-card-front"></div><div class="flip-card-back" id="back-4"></div></div></div>
        <div class="flip-card" id="card-5" onclick="flipCard(5)"><div class="flip-card-inner" id="inner-5"><div class="flip-card-front"></div><div class="flip-card-back" id="back-5"></div></div></div>
    </div>
    
    <div class="game-result" id="gameResult">
        <h2 id="resultTitle" style="margin: 0 0 10px 0; font-size: 26px;"></h2>
        <p id="resultMsg" style="margin: 0; font-size: 15px; color: #D1D5DB; padding: 0 20px;"></p>
        <button class="btn-close-game" onclick="closeGame()">¡Canjear Cupón!</button>
    </div>
</div>
"""
# Insert right after <div class="app-container">
html = html.replace('<div class="app-container">', '<div class="app-container">\n' + new_html)


# 5. Remove old scratch JS
html = re.sub(r'// Scratch Game Logic.*window\.addEventListener\(\'DOMContentLoaded\', initScratch\);', '', html, flags=re.DOTALL)

# 6. Add New JS Logic
new_js = """
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
        
        // Setup secret math
        const chance = Math.random();
        isJackpot = (chance <= 0.01);
        
        const foodTypes = [
            { icon: '🍔', name: 'Hamburguesas' },
            { icon: '🌮', name: 'Tacos' },
            { icon: '🍕', name: 'Pizzas' },
            { icon: '🍹', name: 'Bebidas' },
            { icon: '✂️', name: 'Servicios' }
        ];

        if (isJackpot) {
            sequence = [logoImg, logoImg, logoImg];
            winData = { title: '<span style="color: #10B981;">🎉 VIAJE GRATIS 🎉</span>', msg: 'Muéstrale esta pantalla a tu chofer ahora.' };
        } else {
            // Consolation
            const winFood = foodTypes[Math.floor(Math.random() * foodTypes.length)];
            let loseFood = foodTypes[Math.floor(Math.random() * foodTypes.length)];
            while(loseFood.icon === winFood.icon) { loseFood = foodTypes[Math.floor(Math.random() * foodTypes.length)]; }
            if(Math.random() > 0.5) { loseFood = { icon: logoImg, name: 'EncaviGO' }; }
            
            // Build the sequence of reveals: Match, Miss, Match (Builds tension!)
            sequence = [winFood.icon, loseFood.icon, winFood.icon];
            winData = { title: `<span style="color: #F97316;">¡Descuento en ${winFood.name}!</span>`, msg: 'Juntaste 2 iguales. Cierra esto y busca tu promoción en la app.' };
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
"""
html = html.replace('</script>\n</body>', new_js + '\n</script>\n</body>')

html += f"<!-- v34 {time.time()} -->"
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
