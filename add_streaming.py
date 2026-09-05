from bs4 import BeautifulSoup
import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')

# Find the driver badge to insert the welcome message and streaming card right after it
driver_badge = soup.find('div', class_='driver-trust-badge')

# 1. Create Welcome Message
welcome_html = '''
<div class="welcome-msg" style="margin: 0 16px 20px 16px; text-align: center;">
    <h2 style="font-size: 18px; font-weight: 800; color: #F8FAFC; margin-bottom: 8px;">¡Bienvenido a bordo! 🍿</h2>
    <p style="font-size: 14px; color: #94A3B8; line-height: 1.5; margin: 0;">Disfruta tu viaje. Adquiere tus cuentas de <strong>streaming premium</strong> al instante y a precios increíbles.</p>
</div>
'''
welcome_soup = BeautifulSoup(welcome_html, 'html.parser')

# 2. Create Streaming Card
streaming_card_html = '''
<article class="promo-card" data-start="00:00" data-end="23:59">
    <div class="card-content">
        <div class="content-top">
            <span class="status-chip active" style="background: rgba(16, 185, 129, 0.1); color: #34D399; margin-bottom: 8px;">DISPONIBILIDAD INMEDIATA</span>
            <h2 class="card-title" style="font-size: 22px; font-weight: 900; color: #F8FAFC;">Cuentas de Streaming Premium</h2>
            <p class="card-desc" style="color: #94A3B8; font-size: 14px; margin-top: 6px;">Netflix, Max, Disney+, Spotify, YouTube Premium y más. 100% garantizadas y sin caídas.</p>
            <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
                <span style="background: #E50914; color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold;">NETFLIX</span>
                <span style="background: #00005E; color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold;">DISNEY+</span>
                <span style="background: #1DB954; color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold;">SPOTIFY</span>
                <span style="background: #5B0BB5; color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold;">MAX</span>
            </div>
        </div>
        <div class="content-bottom" style="margin-top: 20px;">
            <a class="btn-cta" href="https://wa.me/521XXXXXXXXXX?text=Hola,%20vengo%20del%20QR%20y%20quiero%20comprar%20una%20cuenta%20de%20streaming." target="_blank" style="background: linear-gradient(135deg, #10B981, #059669); width: 100%; justify-content: center; box-shadow: 0 4px 12px rgba(16,185,129,0.3); border: 1px solid rgba(255,255,255,0.1);">
                <span style="color:white;font-weight:700;font-size:15px;">Ver catálogo y precios</span>
            </a>
        </div>
    </div>
</article>
'''
streaming_soup = BeautifulSoup(streaming_card_html, 'html.parser')

if driver_badge:
    driver_badge.insert_after(streaming_soup)
    driver_badge.insert_after(welcome_soup)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(str(soup))
