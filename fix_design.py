import re
from bs4 import BeautifulSoup

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Update CSS variables (Opción 2 con Naranja)
old_theme = re.search(r':root\s*\{.*?\}(?=\s*/\* =============================================\s*RESET)', html, flags=re.DOTALL)
if old_theme:
    new_theme = ''':root {
      /* ── Fondos — Limpio / Corporativo (Opción 2) ── */
      --bg-root:        #F9FAFB;
      --bg-app:         #F9FAFB;
      --bg-card:        #FFFFFF;
      --bg-card-alt:    #FFFFFF;

      /* ── Acento — Naranja EncaviGO ── */
      --accent:         #F97316;
      --accent-soft:    rgba(249,115,22,0.10);
      --accent-border:  rgba(249,115,22,0.22);
      --accent-glow:    rgba(249,115,22,0.08);
      --accent-text:    #FFFFFF;
      
      /* Acento secundario (para la tarjeta de negocio) */
      --secondary:      #059669;

      /* ── Fondos tarjeta — corporativos ── */
      --mascot-1: linear-gradient(160deg, #F97316 0%, #EA580C 100%);
      --mascot-2: linear-gradient(160deg, #111827 0%, #1F2937 100%);
      --mascot-3: linear-gradient(160deg, #059669 0%, #047857 100%);
      --mascot-4: linear-gradient(160deg, #1D4ED8 0%, #1E3A8A 100%);

      /* ── Texto ── */
      --text-primary:   #111827;
      --text-secondary: #4B5563;
      --text-muted:     #9CA3AF;

      /* ── Estructura ── */
      --border:         #E5E7EB;
      --border-strong:  #D1D5DB;
      --shadow-card:    0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
      --shadow-app:     0 0 0 1px rgba(0,0,0,0.02), 0 8px 32px rgba(0,0,0,0.08);
      --radius-card:    24px;
      --radius-btn:     999px;
      --radius-pill:    999px;

      /* ── Tipografía nativa - Inter ── */
      --font: 'Inter', system-ui, -apple-system, sans-serif;
    }
'''
    html = html.replace(old_theme.group(0), new_theme)

# Fix header background in CSS
html = re.sub(r'background:\s*rgba\(23,\s*23,\s*23,\s*0\.80\);', 'background: rgba(255, 255, 255, 0.90);', html)
# Fix app-container background if any
# Let's fix the header logo and text colors in CSS so they show on white background
# Since --text-primary is dark, it should inherit correctly, but the logo might have explicit fill.
# The logo fill is usually ill: var(--accent) or similar.

# Replace font import
html = re.sub(r'<link.*?fonts\.googleapis\.com.*?>', '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">', html)

# Modify DOM
soup = BeautifulSoup(html, 'html.parser')

# Remove topics section (Explorar Canales)
topics = soup.find('section', class_='topics-section')
if topics:
    topics.decompose()

# Ensure we have the trust badge
feed = soup.find('main', class_='promo-feed')
if feed:
    # Check if we already added it
    if not feed.find('div', class_='driver-trust-badge'):
        badge_html = '''
        <div class="driver-trust-badge" style="margin: 0 16px 24px 16px; padding: 12px 16px; background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 16px; display: flex; align-items: center; gap: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
            <div style="width: 44px; height: 44px; border-radius: 50%; background: #DBEAFE; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0;">🛡️</div>
            <div>
                <div style="font-size: 11px; font-weight: 700; color: #2563EB; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Vehículo Registrado</div>
                <div style="font-size: 14px; font-weight: 600; color: #1E3A8A; line-height: 1.3;" id="driverNameLabel">Carlos M. &bull; Nissan Versa</div>
            </div>
        </div>
        '''
        badge_soup = BeautifulSoup(badge_html, 'html.parser')
        feed.insert(0, badge_soup)

# Write back
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(str(soup))
