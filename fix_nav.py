from bs4 import BeautifulSoup

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')

# 1. Remove the Tiktok side action button
side_btn = soup.find('div', class_='side-actions')
if side_btn: side_btn.decompose()

# 2. Update CSS for Bottom Nav
style = soup.find('style')
if style:
    css = style.string
    
    # Give cards padding so the buttons don't hide behind the nav
    if '.card-ui {' in css:
        css = css.replace('.card-ui {', '.card-ui { padding-bottom: 80px !important; ')
        
    nav_css = '''
    /* BOTTOM NAVIGATION BAR */
    .bottom-nav {
        position: fixed; bottom: 0; left: 0; right: 0;
        height: 65px;
        background: rgba(10, 17, 33, 0.9);
        backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px);
        border-top: 1px solid rgba(255,255,255,0.08);
        display: flex; justify-content: space-around; align-items: center;
        z-index: 90;
        padding-bottom: env(safe-area-inset-bottom);
    }
    .nav-item {
        flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
        gap: 4px; color: #64748B; font-size: 10px; font-weight: 800;
        height: 100%; cursor: pointer; position: relative;
        text-transform: uppercase; letter-spacing: 0.5px;
        transition: color 0.2s;
    }
    .nav-item.active { color: #F97316; }
    .nav-item svg { stroke: currentColor; transition: transform 0.2s; }
    .nav-item.active svg { transform: scale(1.1); stroke-width: 2.5; }
    
    .nav-badge {
        position: absolute; top: 10px; right: calc(50% - 20px);
        background: #E50914; color: #FFF; font-size: 9px; font-weight: 900;
        padding: 2px 5px; border-radius: 10px; border: 2px solid #0A1121;
        box-shadow: 0 2px 4px rgba(0,0,0,0.5);
    }
    '''
    style.string = css + nav_css

# 3. Add Bottom Nav HTML
body = soup.find('body')
if body:
    nav_html = BeautifulSoup('''
    <nav class="bottom-nav">
        <!-- Tab 1: Inicio -->
        <div class="nav-item active" onclick="document.getElementById('nearbySheet').classList.remove('active'); document.getElementById('sheetBackdrop').classList.remove('active');">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            <span>Feed</span>
        </div>
        
        <!-- Tab 2: Cercanos -->
        <div class="nav-item" onclick="document.getElementById('nearbySheet').classList.add('active'); document.getElementById('sheetBackdrop').classList.add('active');">
            <div class="nav-badge">3</div>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <span>Cercanos</span>
        </div>
        
        <!-- Tab 3: Menú/Más -->
        <div class="nav-item">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            <span>Menú</span>
        </div>
    </nav>
    ''', 'html.parser')
    body.append(nav_html)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(str(soup))
