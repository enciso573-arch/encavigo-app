from bs4 import BeautifulSoup
import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')

# 1. Remove the driver recruitment card
for article in soup.find_all('article', class_='immersive-card'):
    if 'CHOFERES INDRIVE / UBER' in article.get_text():
        article.decompose()

# 2. Add Bottom Sheet CSS and HTML
style = soup.find('style')
if style:
    sheet_css = '''
    /* BOTTOM SHEET MODAL (TikTok Comments Style) */
    .sheet-backdrop {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.6);
        backdrop-filter: blur(4px);
        z-index: 100;
        opacity: 0; pointer-events: none;
        transition: opacity 0.3s ease;
    }
    .sheet-backdrop.active { opacity: 1; pointer-events: auto; }
    
    .bottom-sheet {
        position: fixed; bottom: 0; left: 0; width: 100%;
        height: 75vh;
        background: #152033;
        border-top-left-radius: 24px; border-top-right-radius: 24px;
        z-index: 101;
        transform: translateY(100%);
        transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.1);
        display: flex; flex-direction: column;
        box-shadow: 0 -10px 40px rgba(0,0,0,0.5);
    }
    .bottom-sheet.active { transform: translateY(0); }
    
    .sheet-header {
        padding: 16px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.05);
        position: relative;
    }
    .sheet-drag-handle {
        width: 40px; height: 4px; background: rgba(255,255,255,0.2);
        border-radius: 4px; margin: 0 auto 12px auto;
    }
    .sheet-title { font-size: 16px; font-weight: 800; color: #FFF; margin: 0; }
    .sheet-close {
        position: absolute; right: 16px; top: 16px;
        background: rgba(255,255,255,0.1); width: 30px; height: 30px;
        border-radius: 50%; display: flex; align-items: center; justify-content: center;
        color: #FFF; font-weight: bold; font-size: 14px;
    }
    
    .sheet-content {
        flex: 1; overflow-y: auto; padding: 16px;
        display: flex; flex-direction: column; gap: 16px;
    }
    
    /* MINI CARD FOR NEARBY PROMOS */
    .mini-card {
        background: linear-gradient(145deg, #1E293B, #0F172A);
        border-radius: 16px; border: 1px solid rgba(245,158,11,0.3);
        display: flex; overflow: hidden; height: 100px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    .mini-card-img { width: 100px; background-size: cover; background-position: center; }
    .mini-card-info { flex: 1; padding: 12px; display: flex; flex-direction: column; justify-content: center; }
    .mini-title { font-size: 14px; font-weight: bold; color: #FFF; margin: 0 0 4px 0; }
    .mini-desc { font-size: 11px; color: #94A3B8; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    
    /* RADAR NOTIFICATION (Dynamic Island Style) */
    .radar-notif {
        position: fixed; top: 80px; left: 50%; transform: translateX(-50%) translateY(-150%);
        background: rgba(0,0,0,0.8); backdrop-filter: blur(12px);
        border: 1px solid rgba(245,158,11,0.4);
        padding: 10px 16px; border-radius: 999px;
        display: flex; align-items: center; gap: 10px;
        z-index: 90; box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.2);
    }
    .radar-notif.show { transform: translateX(-50%) translateY(0); }
    .radar-icon { font-size: 18px; animation: pulse 2s infinite; }
    .radar-text { font-size: 13px; font-weight: 700; color: #FFF; }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
    }
    '''
    style.string = style.string + sheet_css

# 3. Add the HTML for Notification and Bottom Sheet right inside the body, outside the feed
body = soup.find('body')
if body:
    ui_html = BeautifulSoup('''
    <!-- NOTIFICACIÓN TIPO DYNAMIC ISLAND -->
    <div class="radar-notif show" onclick="document.getElementById('nearbySheet').classList.add('active'); document.getElementById('sheetBackdrop').classList.add('active');">
        <span class="radar-icon">📍</span>
        <span class="radar-text">¡3 promociones a 5 minutos!</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
    </div>

    <!-- BOTTOM SHEET (LA "VENTANA NUEVA") -->
    <div class="sheet-backdrop" id="sheetBackdrop" onclick="document.getElementById('nearbySheet').classList.remove('active'); this.classList.remove('active');"></div>
    <div class="bottom-sheet" id="nearbySheet">
        <div class="sheet-header">
            <div class="sheet-drag-handle"></div>
            <h3 class="sheet-title">Promociones en tu zona</h3>
            <div class="sheet-close" onclick="document.getElementById('nearbySheet').classList.remove('active'); document.getElementById('sheetBackdrop').classList.remove('active');">✕</div>
        </div>
        <div class="sheet-content">
            <p style="font-size: 12px; color: #34D399; text-align: center; margin-top:0;">El conductor se acerca a estos lugares:</p>
            
            <div class="mini-card">
                <div class="mini-card-img" style="background-image: url('https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=300&q=80');"></div>
                <div class="mini-card-info">
                    <h4 class="mini-title">Asador El Pariente</h4>
                    <p class="mini-desc">Cena al carbón con 2x1 en hamburguesas. A 5 mins.</p>
                </div>
            </div>
            
            <div class="mini-card" style="border-color: rgba(37,99,235,0.3);">
                <div class="mini-card-img" style="background-image: url('https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=300&q=80');"></div>
                <div class="mini-card-info">
                    <h4 class="mini-title">Spa Pacífico</h4>
                    <p class="mini-desc">Masaje relajante 50% descuento. A 8 mins.</p>
                </div>
            </div>
            
        </div>
    </div>
    ''', 'html.parser')
    body.append(ui_html)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(str(soup))
