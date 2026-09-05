import re
with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix encoding artifacts
text = text.replace('Ãšnete', 'Únete')
text = text.replace('snete', 'Únete')
text = text.replace('mÃ¡s', 'más')
text = text.replace('mǭs', 'más')
text = text.replace('cÃ³digo', 'código')
text = text.replace('cdigo', 'código')
text = text.replace('vehÃculo', 'vehículo')
text = text.replace('vehǭculo', 'vehículo')
text = text.replace('ANÃšNCIATE', 'ANÚNCIATE')
text = text.replace('ANsNCIATE', 'ANÚNCIATE')
text = text.replace('pÃºblico', 'público')
text = text.replace('pblico', 'público')
text = text.replace('VEHÃCULO', 'VEHÍCULO')
text = text.replace('VEHCULO', 'VEHÍCULO')
text = text.replace('â€¢', '•')
text = text.replace('?', '•')

# Fix emoji 🛡️
text = re.sub(r'ðŸ›¡ï¸\s*|Y>\s*', '🛡️', text)

# The user wants "Option 2 color azul".
# Let's make the main accent Blue, and the secondary Orange.
# Currently: --accent is #F97316 (Orange). --mascot-1 is Orange. --mascot-3 is Blue.
# Let's flip them! 
# Main Accent (Buttons, etc): Blue (#1D4ED8)
# Secondary: Orange (#F97316)
# Mascot 1 (Conductor): Blue
# Mascot 3 (Negocios): Orange

new_vars = '''
      /* ── Acento — Azul EncaviGO ── */
      --accent:         #1D4ED8;
      --accent-soft:    rgba(29,78,216,0.10);
      --accent-border:  rgba(29,78,216,0.22);
      --accent-glow:    rgba(29,78,216,0.08);
      --accent-text:    #FFFFFF;
      
      /* Acento secundario (para la tarjeta de negocio) */
      --secondary:      #F97316;

      /* ── Fondos tarjeta — corporativos ── */
      --mascot-1: linear-gradient(160deg, #1D4ED8 0%, #1E3A8A 100%);
      --mascot-2: linear-gradient(160deg, #111827 0%, #1F2937 100%);
      --mascot-3: linear-gradient(160deg, #F97316 0%, #EA580C 100%);
      --mascot-4: linear-gradient(160deg, #1D4ED8 0%, #1E3A8A 100%);
'''
# Replace the CSS vars block
text = re.sub(r'/\* ── Acento — Naranja EncaviGO ── \*/.*?--mascot-4: linear-gradient.*?100%\);', new_vars.strip(), text, flags=re.DOTALL)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(text)
