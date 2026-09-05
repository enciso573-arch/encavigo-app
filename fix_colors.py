import re
with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Set variables exactly as Option 2 + Orange buttons
new_vars = '''
      /* ── Acento — Naranja (Botones) ── */
      --accent:         #F97316;
      --accent-soft:    rgba(249,115,22,0.10);
      --accent-border:  rgba(249,115,22,0.22);
      --accent-glow:    rgba(249,115,22,0.15);
      --accent-text:    #FFFFFF;
      
      /* Acento secundario */
      --secondary:      #1D4ED8;

      /* ── Fondos tarjeta — Corporativos ── */
      /* Conductor: Azul Profundo/Navy */
      --mascot-1: linear-gradient(160deg, #111827 0%, #1F2937 100%);
      
      /* Negocios: Azul Rey */
      --mascot-3: linear-gradient(160deg, #1D4ED8 0%, #1E3A8A 100%);
'''

# Replace the CSS vars block
text = re.sub(r'/\* ── Acento — Azul EncaviGO ── \*/.*?--mascot-3: linear-gradient.*?100%\);', new_vars.strip(), text, flags=re.DOTALL)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(text)
