from bs4 import BeautifulSoup
import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')

# 1. Remove old radar-notif CSS
style = soup.find('style')
if style:
    css = style.string
    # Strip out the old radar-notif css by slicing it out or replacing it
    # We will just append the new CSS to override or hide the old one.
    # Actually, let's just find and remove the HTML element first.

# 2. Remove old radar HTML
old_radar = soup.find('div', class_='radar-notif')
if old_radar:
    old_radar.decompose()

# 3. Add new Side Action Button CSS
if style:
    new_css = '''
    /* SIDE ACTION BUTTONS (TikTok Style) */
    .side-actions {
        position: fixed;
        right: 12px;
        bottom: 140px; /* Float above the description */
        display: flex;
        flex-direction: column;
        gap: 16px;
        z-index: 50;
    }
    .action-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        color: #FFF;
        text-shadow: 0 2px 4px rgba(0,0,0,0.8);
        cursor: pointer;
        transition: transform 0.2s;
    }
    .action-btn:active { transform: scale(0.9); }
    
    .action-icon {
        width: 48px; height: 48px;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1.5px solid rgba(255,255,255,0.2);
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 8px 16px rgba(0,0,0,0.4);
        position: relative;
    }
    
    .action-icon svg { stroke: #FFF; }
    
    .action-badge {
        position: absolute;
        top: -4px; right: -4px;
        background: #F97316; /* Orange brand color */
        color: #FFF;
        font-size: 11px;
        font-weight: 900;
        min-width: 20px;
        height: 20px;
        border-radius: 10px;
        display: flex; align-items: center; justify-content: center;
        border: 2px solid #000;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    
    .action-label {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.5px;
    }
    
    /* Overwrite old radar if any CSS was left */
    .radar-notif { display: none !important; }
    '''
    style.string = style.string + new_css

# 4. Add the Side Actions HTML
body = soup.find('body')
if body:
    side_html = BeautifulSoup('''
    <!-- TIKTOK STYLE SIDE BUTTON -->
    <div class="side-actions">
        <div class="action-btn" onclick="document.getElementById('nearbySheet').classList.add('active'); document.getElementById('sheetBackdrop').classList.add('active');">
            <div class="action-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <div class="action-badge">3</div>
            </div>
            <span class="action-label">Cerca</span>
        </div>
    </div>
    ''', 'html.parser')
    
    # Insert it before the bottom sheet
    sheet = soup.find('div', id='sheetBackdrop')
    if sheet:
        sheet.insert_before(side_html)
    else:
        body.append(side_html)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(str(soup))
