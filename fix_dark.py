import re

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update CSS Variables for Full Dark Navy Theme
new_vars = '''
      /* ── Fondos — Azul Profundo (Premium) ── */
      --bg-root:        #060B14;
      --bg-app:         #0A1121;
      --bg-card:        #152033;
      --bg-card-alt:    #152033;

      /* ── Acento — Naranja EncaviGO ── */
      --accent:         #F97316;
      --accent-soft:    rgba(249,115,22,0.15);
      --accent-border:  rgba(249,115,22,0.30);
      --accent-glow:    rgba(249,115,22,0.20);
      --accent-text:    #FFFFFF;
      
      /* Acento secundario (para la tarjeta de negocio) */
      --secondary:      #2563EB;

      /* ── Fondos tarjeta ── */
      --mascot-1: linear-gradient(160deg, #111827 0%, #1F2937 100%);
      --mascot-2: linear-gradient(160deg, #111827 0%, #1F2937 100%);
      --mascot-3: linear-gradient(160deg, #1D4ED8 0%, #1E3A8A 100%);
      --mascot-4: linear-gradient(160deg, #1D4ED8 0%, #1E3A8A 100%);

      /* ── Texto Oscuro ── */
      --text-primary:   #F8FAFC;
      --text-secondary: #94A3B8;
      --text-muted:     #64748B;

      /* ── Estructura ── */
      --border:         #1E293B;
      --border-strong:  #334155;
      --shadow-card:    0 8px 16px -4px rgba(0,0,0,0.4), 0 4px 6px -2px rgba(0,0,0,0.2);
      --shadow-app:     0 0 0 1px rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.5);
      --radius-card:    24px;
      --radius-btn:     999px;
      --radius-pill:    999px;

      /* ── Tipografía nativa - Inter ── */
      --font: 'Inter', system-ui, -apple-system, sans-serif;
'''
text = re.sub(r'--bg-root:.*?--font:.*?sans-serif;', new_vars.strip(), text, flags=re.DOTALL)

# 2. Fix Header Background (it was white, now it must be dark)
text = re.sub(r'background: rgba\(255, 255, 255, 0\.90\);', 'background: rgba(10, 17, 33, 0.85);', text)

# 3. Fix Driver Trust Badge colors to match dark theme
text = text.replace('background: #EFF6FF;', 'background: rgba(37, 99, 235, 0.1);')
text = text.replace('border: 1px solid #BFDBFE;', 'border: 1px solid rgba(37, 99, 235, 0.3);')
text = text.replace('background: #DBEAFE;', 'background: rgba(37, 99, 235, 0.2);')
text = text.replace('color: #2563EB;', 'color: #60A5FA;') # Muted light blue for label
text = text.replace('color: #1E3A8A;', 'color: #F8FAFC;') # White text for driver name

# 4. Make sure CTA buttons stand out
text = re.sub(r'<a class="btn-cta" style="background: #F97316;.*?>', 
              r'<a class="btn-cta" style="background: linear-gradient(135deg, #F97316, #EA580C); width: 100%; justify-content: center; box-shadow: 0 4px 12px rgba(249,115,22,0.3); border: 1px solid rgba(255,255,255,0.1);" href="javascript:void(0)">', text)
text = re.sub(r'<a class="btn-cta" style="background: #1D4ED8;.*?>', 
              r'<a class="btn-cta" style="background: linear-gradient(135deg, #2563EB, #1D4ED8); width: 100%; justify-content: center; box-shadow: 0 4px 12px rgba(37,99,235,0.3); border: 1px solid rgba(255,255,255,0.1);" href="javascript:void(0)">', text)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(text)
