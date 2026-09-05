from bs4 import BeautifulSoup

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')

feed = soup.find('main', class_='promo-feed')
if feed:
    # Save driver badge and welcome msg
    driver_badge = feed.find('div', class_='driver-trust-badge')
    welcome = feed.find('div', class_='welcome-msg')
    
    feed.clear()
    if driver_badge: feed.append(driver_badge)
    if welcome: feed.append(welcome)

    new_css = BeautifulSoup('''
    <style>
    /* NATIVE APP HORIZONTAL LIST ITEMS */
    .app-item {
        background: #152033;
        border-radius: 20px;
        padding: 16px;
        margin: 0 16px 14px 16px;
        display: flex;
        align-items: center;
        gap: 16px;
        border: 1px solid rgba(255,255,255,0.05);
        text-decoration: none;
        transition: transform 0.15s, background 0.15s;
    }
    .app-item:active {
        transform: scale(0.97);
        background: #1E2B42;
    }
    .app-item-icon {
        width: 64px; height: 64px;
        border-radius: 18px;
        display: flex; align-items: center; justify-content: center;
        font-size: 32px; flex-shrink: 0;
        box-shadow: 0 8px 16px rgba(0,0,0,0.2);
    }
    .app-item-info {
        flex: 1; min-width: 0;
        display: flex; flex-direction: column; gap: 4px;
    }
    .app-item-title {
        font-size: 16px; font-weight: 800; color: #F8FAFC; margin: 0;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        letter-spacing: -0.3px;
    }
    .app-item-desc {
        font-size: 13px; color: #94A3B8; margin: 0; line-height: 1.3;
        display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .app-item-action {
        width: 32px; height: 32px;
        border-radius: 50%;
        background: rgba(255,255,255,0.05);
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0; color: #94A3B8;
    }
    
    /* FEATURED APP BANNER (For Streaming) */
    .app-featured {
        background: linear-gradient(145deg, #1E293B, #0F172A);
        border-radius: 24px;
        padding: 20px;
        margin: 0 16px 20px 16px;
        display: flex;
        flex-direction: column;
        border: 1px solid rgba(16, 185, 129, 0.2);
        box-shadow: 0 12px 30px rgba(0,0,0,0.3);
        text-decoration: none;
        position: relative; overflow: hidden;
    }
    .app-featured::after {
        content: ''; position: absolute; right: -20px; bottom: -20px;
        width: 150px; height: 150px; background: radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%);
        pointer-events: none;
    }
    .app-featured-header {
        display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;
    }
    .app-featured-tag {
        background: rgba(16, 185, 129, 0.15); color: #34D399; font-size: 10px; font-weight: 800;
        padding: 4px 10px; border-radius: 12px; letter-spacing: 0.5px;
    }
    .app-featured-title {
        font-size: 22px; font-weight: 900; color: #FFF; margin: 0 0 6px 0; letter-spacing: -0.5px;
    }
    .app-featured-desc {
        font-size: 14px; color: #94A3B8; margin: 0 0 16px 0; line-height: 1.4;
    }
    .app-featured-logos {
        display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;
    }
    .app-featured-logos span {
        padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; color: #FFF;
    }
    .app-featured-btn {
        background: linear-gradient(135deg, #10B981, #059669);
        color: #FFF; font-weight: 800; font-size: 15px; text-align: center;
        padding: 14px; border-radius: 16px;
        box-shadow: 0 6px 16px rgba(16,185,129,0.3);
    }
    </style>
    ''', 'html.parser')
    feed.append(new_css)

    # 1. FEATURED STREAMING CARD
    streaming = BeautifulSoup('''
    <a href="https://wa.me/521XXXXXXXXXX?text=Hola,%20quiero%20comprar%20una%20cuenta%20de%20streaming." class="app-featured">
        <div class="app-featured-header">
            <div class="app-featured-tag">🔥 ENTREGA INMEDIATA</div>
        </div>
        <h2 class="app-featured-title">Cuentas Premium</h2>
        <p class="app-featured-desc">Acceso garantizado a tus series y música favoritas por una fracción del precio.</p>
        <div class="app-featured-logos">
            <span style="background: #E50914;">NETFLIX</span>
            <span style="background: #1DB954;">SPOTIFY</span>
            <span style="background: #00005E;">DISNEY+</span>
        </div>
        <div class="app-featured-btn">Ver catálogo y precios</div>
    </a>
    ''', 'html.parser')
    feed.append(streaming)

    # TITLE FOR SERVICES
    feed.append(BeautifulSoup('<h3 style="margin: 10px 16px 12px 16px; font-size: 14px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px;">Servicios para ti</h3>', 'html.parser'))

    # 2. DRIVER LIST ITEM
    driver = BeautifulSoup('''
    <a href="javascript:void(0)" class="app-item">
        <div class="app-item-icon" style="background: linear-gradient(135deg, #F97316, #EA580C);">
            🚘
        </div>
        <div class="app-item-info">
            <h3 class="app-item-title">Únete como conductor</h3>
            <p class="app-item-desc">Gana comisiones en efectivo por mostrar este menú en tu vehículo.</p>
        </div>
        <div class="app-item-action">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </div>
    </a>
    ''', 'html.parser')
    feed.append(driver)

    # 3. BUSINESS LIST ITEM
    business = BeautifulSoup('''
    <a href="javascript:void(0)" class="app-item">
        <div class="app-item-icon" style="background: linear-gradient(135deg, #2563EB, #1D4ED8);">
            🏪
        </div>
        <div class="app-item-info">
            <h3 class="app-item-title">Anuncia tu negocio</h3>
            <p class="app-item-desc">Llega a miles de pasajeros locales publicando aquí tus ofertas.</p>
        </div>
        <div class="app-item-action">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </div>
    </a>
    ''', 'html.parser')
    feed.append(business)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(str(soup))
