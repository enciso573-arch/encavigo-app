from bs4 import BeautifulSoup

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')

# Update CSS
style = soup.find('style')
if style:
    css = style.string
    # We will append the immersive CSS
    immersive_css = '''
    /* IMMERSIVE SWIPE FEED */
    html, body {
        height: 100%;
        overflow: hidden; /* Prevent body scroll */
        background: #000;
    }
    .app-container {
        height: 100dvh;
        width: 100%;
        max-width: 450px;
        margin: 0 auto;
        position: relative;
        background: #000;
    }
    .app-header {
        position: absolute;
        top: 0; left: 0; right: 0;
        z-index: 50;
        background: linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%);
        border-bottom: none;
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
        padding: 16px;
    }
    .header-title { color: #FFF; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
    .loc-text, .weather-cond { color: rgba(255,255,255,0.8); text-shadow: 0 1px 2px rgba(0,0,0,0.5); }
    .weather-temp { color: #FFF; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }
    .weather-chip { background: rgba(0,0,0,0.3); border-color: rgba(255,255,255,0.1); backdrop-filter: blur(8px); }

    .immersive-feed {
        height: 100dvh;
        width: 100%;
        overflow-y: scroll;
        scroll-snap-type: y mandatory;
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
    }
    
    /* Hide scrollbar for immersive feel */
    .immersive-feed::-webkit-scrollbar { display: none; }
    .immersive-feed { -ms-overflow-style: none; scrollbar-width: none; }

    .immersive-card {
        height: 100dvh;
        width: 100%;
        scroll-snap-align: start;
        scroll-snap-stop: always;
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
    }
    
    .card-bg {
        position: absolute;
        top: 0; left: 0; width: 100%; height: 100%;
        background-size: cover;
        background-position: center;
        z-index: 1;
    }
    
    .card-overlay {
        position: absolute;
        top: 0; left: 0; width: 100%; height: 100%;
        background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.1) 100%);
        z-index: 2;
    }
    
    .card-ui {
        position: relative;
        z-index: 3;
        padding: 24px;
        padding-bottom: 40px; /* Safe area */
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    
    .card-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(255,255,255,0.15);
        backdrop-filter: blur(10px);
        padding: 6px 12px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 800;
        color: #FFF;
        align-self: flex-start;
        border: 1px solid rgba(255,255,255,0.2);
    }
    
    .card-headline {
        font-size: 32px;
        font-weight: 900;
        color: #FFF;
        margin: 0;
        line-height: 1.1;
        letter-spacing: -0.5px;
        text-shadow: 0 4px 12px rgba(0,0,0,0.5);
    }
    
    .card-body {
        font-size: 15px;
        color: rgba(255,255,255,0.85);
        margin: 0 0 8px 0;
        line-height: 1.4;
        text-shadow: 0 2px 8px rgba(0,0,0,0.5);
    }

    .card-pills {
        display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;
    }
    .card-pills span {
        padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 800; color: #FFF;
    }

    .swipe-btn {
        background: var(--btn-bg, #2563EB);
        color: #FFF;
        font-size: 16px;
        font-weight: 800;
        text-align: center;
        padding: 16px;
        border-radius: 16px;
        text-decoration: none;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 8px;
        box-shadow: 0 8px 24px var(--btn-glow, rgba(37,99,235,0.4));
        transition: transform 0.2s;
        border: 1px solid rgba(255,255,255,0.1);
    }
    .swipe-btn:active { transform: scale(0.96); }

    .swipe-hint {
        position: absolute;
        right: 16px;
        bottom: 120px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        color: rgba(255,255,255,0.6);
        z-index: 10;
        animation: bounce 2s infinite;
    }
    @keyframes bounce {
        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-10px); }
        60% { transform: translateY(-5px); }
    }
    
    /* Hide the old bottom nav / empty state since we are fullscreen */
    .feed-empty, .map-alert, .map-btn, .dist-chip { display: none !important; }
    '''
    style.string = css + immersive_css

# Completely replace the feed
feed = soup.find('main', class_='promo-feed')
if feed:
    feed['class'] = 'immersive-feed'
    feed.clear()
    
    # 1. STREAMING CARD
    feed.append(BeautifulSoup('''
    <article class="immersive-card">
        <div class="card-bg" style="background-image: url('https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&q=80&w=600');"></div>
        <div class="card-overlay"></div>
        
        <div class="swipe-hint">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
            <span style="font-size:10px; font-weight:bold;">Desliza</span>
        </div>

        <div class="card-ui">
            <div class="card-badge" style="background: rgba(229, 9, 20, 0.2); border-color: rgba(229, 9, 20, 0.5); color: #FFF;">
                🔥 ENTREGA INMEDIATA
            </div>
            <h2 class="card-headline">Tus series<br>sin interrupciones.</h2>
            <p class="card-body">Cuentas premium 100% garantizadas a una fracción del precio. Disfruta tu viaje con el mejor entretenimiento.</p>
            <div class="card-pills">
                <span style="background: #E50914;">NETFLIX</span>
                <span style="background: #1DB954;">SPOTIFY</span>
                <span style="background: #00005E;">DISNEY+</span>
                <span style="background: #5B0BB5;">MAX</span>
            </div>
            <a href="https://wa.me/521XXXXXXXXXX?text=Hola,%20quiero%20comprar%20una%20cuenta%20de%20streaming." class="swipe-btn" style="--btn-bg: #E50914; --btn-glow: rgba(229,9,20,0.4);">
                Comprar ahora
            </a>
        </div>
    </article>
    ''', 'html.parser'))

    # 2. RESTAURANT AD (Example Business)
    feed.append(BeautifulSoup('''
    <article class="immersive-card">
        <div class="card-bg" style="background-image: url('https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=600');"></div>
        <div class="card-overlay" style="background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%);"></div>
        
        <div class="card-ui">
            <div class="card-badge" style="background: rgba(245, 158, 11, 0.2); border-color: rgba(245, 158, 11, 0.5); color: #FBBF24;">
                📍 A 5 MINUTOS DE TI
            </div>
            <h2 class="card-headline">Cena al Carbón<br>con 2x1</h2>
            <p class="card-body">Muestra esta pantalla en <strong>Asador El Pariente</strong> y llévate tu segunda hamburguesa a la parrilla completamente gratis hoy.</p>
            <a href="javascript:void(0)" class="swipe-btn" style="--btn-bg: #F59E0B; --btn-glow: rgba(245,158,11,0.4); color: #000;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                Ver ruta al local
            </a>
        </div>
    </article>
    ''', 'html.parser'))

    # 3. DRIVER RECRUITMENT
    feed.append(BeautifulSoup('''
    <article class="immersive-card">
        <div class="card-bg" style="background-image: url('https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=600');"></div>
        <div class="card-overlay" style="background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.3) 100%);"></div>
        
        <div class="card-ui">
            <div class="card-badge">
                🚘 CHOFERES INDRIVE / UBER
            </div>
            <h2 class="card-headline">Gana más<br>en cada viaje.</h2>
            <p class="card-body">Pon este QR en tu vehículo y genera comisiones automáticas cada vez que un pasajero compre o active un descuento.</p>
            <a href="javascript:void(0)" class="swipe-btn" style="--btn-bg: #F97316; --btn-glow: rgba(249,115,22,0.4);">
                Registrar mi vehículo
            </a>
        </div>
    </article>
    ''', 'html.parser'))

    # 4. BUSINESS RECRUITMENT
    feed.append(BeautifulSoup('''
    <article class="immersive-card">
        <div class="card-bg" style="background-image: url('https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=600');"></div>
        <div class="card-overlay" style="background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.3) 100%);"></div>
        
        <div class="card-ui">
            <div class="card-badge" style="background: rgba(37, 99, 235, 0.2); border-color: rgba(37, 99, 235, 0.5);">
                🏪 ANUNCIA TU NEGOCIO
            </div>
            <h2 class="card-headline">Capta clientes<br>en movimiento.</h2>
            <p class="card-body">Toma una foto profesional de tu local (¡nosotros te ayudamos!) y publícala aquí para que la vean miles de turistas en Puerto Vallarta.</p>
            <a href="javascript:void(0)" class="swipe-btn" style="--btn-bg: #2563EB; --btn-glow: rgba(37,99,235,0.4);">
                Subir mi negocio hoy
            </a>
        </div>
    </article>
    ''', 'html.parser'))

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(str(soup))
