from bs4 import BeautifulSoup
import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')

# 1. Fix the Header Overlap (make title slightly smaller on mobile)
style_tag = soup.find('style')
if style_tag:
    css = style_tag.string
    css = css.replace('.header-title {', '.header-title { font-size: 18px; /* Was bigger before */')
    style_tag.string = css

# 2. Fix Flex Shrink on feed children
feed = soup.find('main', class_='promo-feed')
if feed:
    # Add flex-shrink: 0 to all direct children to prevent squashing
    for child in feed.find_all(recursive=False):
        if child.name in ['div', 'a', 'h3']:
            existing_style = child.get('style', '')
            child['style'] = existing_style + '; flex-shrink: 0;'

    # 3. Replace Emojis with sleek SVGs
    for item in feed.find_all('a', class_='app-item'):
        icon_div = item.find('div', class_='app-item-icon')
        if icon_div:
            text_content = icon_div.get_text(strip=True)
            if '🚘' in text_content:
                icon_div.string = ''
                # SVG for Car
                icon_div.append(BeautifulSoup('<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H8c-.7 0-1.3.3-1.8.7C5.3 8.6 4 10 4 10s-2.7.6-4.5 1.1C.7 11.3 0 12.1 0 13v3c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>', 'html.parser'))
            elif '🏪' in text_content:
                icon_div.string = ''
                # SVG for Store
                icon_div.append(BeautifulSoup('<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>', 'html.parser'))

    # 4. Make Welcome Text More Compact (Less forum-like)
    welcome = feed.find('div', class_='welcome-msg')
    if welcome:
        welcome['style'] = 'margin: 0 16px 16px 16px; text-align: left; display: flex; align-items: center; gap: 12px; flex-shrink: 0; background: rgba(255,255,255,0.03); padding: 16px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05);'
        welcome.clear()
        welcome.append(BeautifulSoup('''
            <div style="font-size: 32px;">🚀</div>
            <div>
                <h2 style="font-size: 16px; font-weight: 800; color: #F8FAFC; margin: 0 0 4px 0; letter-spacing: -0.3px;">Bienvenido a EncaviGO</h2>
                <p style="font-size: 12px; color: #94A3B8; line-height: 1.4; margin: 0;">Descubre promos dinámicas y servicios locales en tiempo real.</p>
            </div>
        ''', 'html.parser'))

    # 5. Fix text truncation on app-item-title by allowing it to wrap up to 2 lines
    style_tag2 = feed.find('style')
    if style_tag2:
        css = style_tag2.string
        css = css.replace('white-space: nowrap; overflow: hidden; text-overflow: ellipsis;', 'display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; white-space: normal;')
        style_tag2.string = css

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(str(soup))
