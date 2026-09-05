import re

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. KILL ALL WEIRD ENCODING CHARACTERS
text = re.sub(r'[ÃÂ]šnete', 'Únete', text)
text = re.sub(r'm[ÃÂ]¡s', 'más', text)
text = re.sub(r'c[ÃÂ]³digo', 'código', text)
text = re.sub(r'veh[ÃÂ]culo', 'vehículo', text)
text = re.sub(r'VEH[ÃÂ]CULO', 'VEHÍCULO', text)
text = re.sub(r'AN[ÃÂ]šNCIATE', 'ANÚNCIATE', text)
text = re.sub(r'p[ÃÂ]ºblico', 'público', text)
text = re.sub(r'â€¢', '•', text)
text = re.sub(r'Ã³', 'ó', text)
text = re.sub(r'Ã¡', 'á', text)
text = re.sub(r'Ã', 'í', text)
text = text.replace('vehículo', 'vehículo') # Just in case

# 2. FIX LAYOUT - Remove the colored left blocks (.card-mascot)
text = re.sub(r'<div class="card-mascot".*?</div>', '', text, flags=re.DOTALL)

# 3. FIX CARD CSS
# Since we removed mascot, .promo-card needs to be a standard column layout.
css_fix = '''
    .promo-card {
      background: var(--bg-card);
      border-radius: var(--radius-card);
      border: 1px solid var(--border);
      box-shadow: var(--shadow-card);
      overflow: hidden;
      margin: 0 16px 20px 16px;
      display: flex;
      flex-direction: column;
      position: relative;
    }
    .card-content {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      flex: 1;
    }
    .content-bottom {
      margin-top: 10px;
    }
'''
text = re.sub(r'\.promo-card \{.*?\.content-bottom \{.*?\}', css_fix.strip(), text, flags=re.DOTALL)

# 4. FIX BUTTON COLORS
# We want Card 1 button to be Orange, Card 2 button to be Blue.
# Let's add inline styles to the buttons to override global.
text = text.replace('<a class="btn-cta"', '<a class="btn-cta" style="background: #F97316;"')
text = text.replace('<a class="btn-cta" style="background: #F97316;"', '<a class="btn-cta" style="background: #1D4ED8;"', 1) # First button is Orange, wait...
# Let's do it with specific IDs or finding the text
# Find the Conductor section button:
text = text.replace('<a class="btn-cta" onclick="window.location.href=\'\'">', '<a class="btn-cta" style="background: #F97316;" href="javascript:void(0)">')
text = text.replace('<a class="btn-cta" href="javascript:void(0)">', '<a class="btn-cta" style="background: #1D4ED8;" href="javascript:void(0)">')

# Replace the specific CTA buttons properly
text = re.sub(r'<a class="btn-cta".*?>\s*<svg.*?Registrar mi veh.*?\s*</a>', 
              r'<a class="btn-cta" style="background: #F97316; width: 100%;"><span style="color:white;font-weight:700;">Registrar mi vehículo</span></a>', text, flags=re.DOTALL)
text = re.sub(r'<a class="btn-cta".*?>\s*<svg.*?Mandar mensaje.*?\s*</a>', 
              r'<a class="btn-cta" style="background: #1D4ED8; width: 100%;"><span style="color:white;font-weight:700;">Mandar mensaje</span></a>', text, flags=re.DOTALL)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(text)
