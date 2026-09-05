from bs4 import BeautifulSoup
import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')

# 1. Remove Bottom Nav
nav = soup.find('nav', class_='bottom-nav')
if nav: nav.decompose()

# 2. Update CSS
style = soup.find('style')
if style:
    css = style.string
    
    # Optional: adjust the bottom padding of card-ui if needed, 
    # but 80px is still safe for the pull-up drawer so we can leave it.
    
    drawer_css = '''
    /* MOCKUP 2: PULL-UP DRAWER */
    .pullup-drawer {
        position: fixed; bottom: 0; left: 0; right: 0;
        background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 50%, transparent 100%);
        height: 100px;
        display: flex; justify-content: center; align-items: flex-end;
        padding-bottom: 24px;
        z-index: 90;
        pointer-events: none; /* Let background clicks pass through */
    }
    .pullup-pill {
        background: rgba(255,255,255,0.15);
        backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px);
        border: 1px solid rgba(255,255,255,0.25);
        padding: 10px 24px;
        border-radius: 30px;
        color: #FFF; font-size: 13px; font-weight: 800;
        display: flex; align-items: center; gap: 8px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.5);
        pointer-events: auto; /* Re-enable clicks */
        cursor: pointer;
        animation: float-up 3s ease-in-out infinite;
    }
    @keyframes float-up {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
    }
    .pullup-badge {
        background: #F97316; color: #FFF;
        font-size: 11px; padding: 2px 6px; border-radius: 10px;
    }
    '''
    style.string = css + drawer_css

# 3. Add Pull-up Drawer HTML
body = soup.find('body')
if body:
    drawer_html = BeautifulSoup('''
    <!-- Opción 2: PULL-UP DRAWER -->
    <div class="pullup-drawer">
        <div class="pullup-pill" onclick="document.getElementById('nearbySheet').classList.add('active'); document.getElementById('sheetBackdrop').classList.add('active');">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
            <span class="pullup-badge">3</span> Promos cerca de ti
        </div>
    </div>
    ''', 'html.parser')
    body.append(drawer_html)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(str(soup))
