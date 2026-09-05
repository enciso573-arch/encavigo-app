from bs4 import BeautifulSoup
import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')

# Find the promo feed
feed = soup.find('main', class_='promo-feed')
if feed:
    # We will replace its inner contents (keeping driver-trust-badge)
    driver_badge = feed.find('div', class_='driver-trust-badge')
    
    # Clear feed
    feed.clear()
    
    if driver_badge:
        feed.append(driver_badge)

    # New Welcome Message
    welcome = BeautifulSoup('''
    <div class="welcome-msg" style="margin: 0 16px 24px 16px; text-align: center;">
        <h2 style="font-size: 20px; font-weight: 900; color: #F8FAFC; margin-bottom: 8px; letter-spacing: -0.5px;">¡Bienvenido a EncaviGO! 🚀</h2>
        <p style="font-size: 14px; color: #94A3B8; line-height: 1.6; margin: 0;">Descubre <strong>ofertas relámpago, promociones dinámicas y servicios exclusivos</strong> en tiempo real mientras llegas a tu destino.</p>
    </div>
    ''', 'html.parser')
    feed.append(welcome)

    # New CSS for Modern Cards
    new_css = BeautifulSoup('''
    <style>
    .glass-card {
        background: linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-radius: 28px;
        padding: 24px;
        margin: 0 16px 20px 16px;
        position: relative;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: 0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1);
        display: flex;
        flex-direction: column;
        gap: 16px;
    }
    .glass-card::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0; height: 120px;
        background: var(--card-glow, radial-gradient(circle at top left, rgba(37, 99, 235, 0.2), transparent 70%));
        z-index: 0;
        pointer-events: none;
    }
    .glass-content { position: relative; z-index: 1; }
    .glass-tag {
        display: inline-flex; align-items: center; gap: 6px;
        background: rgba(0,0,0,0.4);
        border: 1px solid rgba(255,255,255,0.1);
        padding: 6px 12px;
        border-radius: 999px;
        font-size: 10px; font-weight: 800; letter-spacing: 0.5px;
        color: #F8FAFC;
        margin-bottom: 16px;
    }
    .glass-title {
        font-size: 24px; font-weight: 900; color: #FFFFFF; line-height: 1.2; margin: 0 0 8px 0;
        letter-spacing: -0.5px;
    }
    .glass-desc {
        font-size: 14px; color: #94A3B8; line-height: 1.5; margin: 0;
    }
    .glass-btn {
        display: flex; align-items: center; justify-content: center;
        background: var(--btn-bg, #2563EB);
        color: #FFF; font-weight: 700; font-size: 15px;
        padding: 16px; border-radius: 18px;
        text-decoration: none; border: none;
        box-shadow: 0 8px 20px var(--btn-glow, rgba(37, 99, 235, 0.3));
        transition: transform 0.2s;
    }
    .glass-btn:active { transform: scale(0.97); }
    .pill-group { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
    .pill { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; color: #FFF; }
    </style>
    ''', 'html.parser')
    feed.append(new_css)

    # 1. Streaming Card
    streaming = BeautifulSoup('''
    <div class="glass-card" style="--card-glow: radial-gradient(circle at top left, rgba(16, 185, 129, 0.15), transparent 70%);">
        <div class="glass-content">
            <div class="glass-tag">
                <span style="width: 6px; height: 6px; background: #34D399; border-radius: 50%; box-shadow: 0 0 8px #34D399;"></span>
                ENTREGA INMEDIATA
            </div>
            <h2 class="glass-title">Cuentas Premium de Streaming</h2>
            <p class="glass-desc">Adquiere accesos 100% garantizados a tus plataformas favoritas por una fracción del precio oficial.</p>
            <div class="pill-group">
                <span class="pill" style="background: #E50914;">NETFLIX</span>
                <span class="pill" style="background: #1DB954;">SPOTIFY</span>
                <span class="pill" style="background: #00005E;">DISNEY+</span>
                <span class="pill" style="background: #5B0BB5;">MAX</span>
            </div>
        </div>
        <a href="https://wa.me/521XXXXXXXXXX?text=Hola,%20quiero%20comprar%20una%20cuenta%20de%20streaming." class="glass-btn" style="--btn-bg: linear-gradient(135deg, #10B981, #059669); --btn-glow: rgba(16, 185, 129, 0.4); margin-top: 8px;">
            Ver catálogo y precios
        </a>
    </div>
    ''', 'html.parser')
    feed.append(streaming)

    # 2. Driver Card
    driver = BeautifulSoup('''
    <div class="glass-card" style="--card-glow: radial-gradient(circle at top left, rgba(249, 115, 22, 0.15), transparent 70%);">
        <div class="glass-content">
            <div class="glass-tag">
                <span style="width: 6px; height: 6px; background: #F97316; border-radius: 50%;"></span>
                INDRIVE / UBER / DIDI
            </div>
            <h2 class="glass-title">Únete a la red y genera más</h2>
            <p class="glass-desc">Pon nuestro código QR en tu vehículo y gana comisiones en efectivo por cada pasajero que active nuestras promociones.</p>
        </div>
        <a href="javascript:void(0)" class="glass-btn" style="--btn-bg: linear-gradient(135deg, #F97316, #EA580C); --btn-glow: rgba(249, 115, 22, 0.4); margin-top: 8px;">
            Registrar mi vehículo
        </a>
    </div>
    ''', 'html.parser')
    feed.append(driver)

    # 3. Business Card
    business = BeautifulSoup('''
    <div class="glass-card" style="--card-glow: radial-gradient(circle at top left, rgba(37, 99, 235, 0.15), transparent 70%);">
        <div class="glass-content">
            <div class="glass-tag">
                <span style="width: 6px; height: 6px; background: #3B82F6; border-radius: 50%;"></span>
                ANÚNCIATE CON NOSOTROS
            </div>
            <h2 class="glass-title">Llega a miles de pasajeros hoy</h2>
            <p class="glass-desc">Publica tus ofertas en nuestra red de vehículos de servicio público. Capta clientes locales en movimiento.</p>
        </div>
        <a href="javascript:void(0)" class="glass-btn" style="--btn-bg: linear-gradient(135deg, #2563EB, #1D4ED8); --btn-glow: rgba(37, 99, 235, 0.4); margin-top: 8px;">
            Publicar mi negocio
        </a>
    </div>
    ''', 'html.parser')
    feed.append(business)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(str(soup))
