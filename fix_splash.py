import re
import time

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Update Header Logo
old_header = r'<div class="header-logo"[^>]*>.*?<\/div>\s*<div class="header-brand-stack">\s*<span class="header-title">Encavi<em>GO<\/em><\/span>'
new_header = """<div class="header-brand-stack" style="margin-left: 5px;">
    <span class="header-title" style="font-size: 20px; font-weight: 900; letter-spacing: 0.5px;">Encavi<span style="color: #F97316;">GO</span></span>"""
html = re.sub(old_header, new_header, html, flags=re.DOTALL)

# 2. Remove Welcome Card from renderDeck
old_render = r"// Inyectar tarjeta de bienvenida al principio.*?deck\.unshift\(welcomeCard\);"
html = re.sub(old_render, "", html, flags=re.DOTALL)

# Also remove the ternary logic for btnHtml and just use the normal button
old_btn_logic = r"\$\{camp\.isWelcome.*?\?.*?'.*?'.*?:.*?\`(.*?)\`\}"
html = re.sub(old_btn_logic, r"\1", html, flags=re.DOTALL)

# Clean up card-bg background style to remove isWelcome logic
old_card_bg = r"<div class=\"card-bg\" style=\"background-image: url\('\$\{camp\.img \|\| ''\}'\); \$\{camp\.isWelcome \? '.*?' : ''\}\"><\/div>"
html = re.sub(old_card_bg, r"""<div class="card-bg" style="background-image: url('${camp.img || ''}');"></div>""", html)


# 3. Add Splash Screen HTML right inside body, before the app-container
splash_html = """
<!-- SPLASH SCREEN DE BIENVENIDA -->
<div id="splashScreen" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: #0F172A; z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; text-align: center; transition: opacity 0.4s ease, visibility 0.4s ease;">
    <!-- LOGO TIPOGRAFICO GIGANTE -->
    <div style="font-size: 60px; font-weight: 900; letter-spacing: 1px; margin-bottom: 20px; text-shadow: 0 4px 15px rgba(249,115,22,0.3);">
        <span style="color: white;">Encavi</span><span style="color: #F97316;">GO</span>
    </div>
    
    <h1 style="color: white; font-size: 24px; margin-bottom: 15px;">¡Bienvenido!</h1>
    
    <p style="color: #94A3B8; font-size: 16px; line-height: 1.5; max-width: 300px; margin-bottom: 40px;">
        Descubre descuentos exclusivos y promociones dinámicas en tu ruta.<br><br>
        Las mejores ofertas se mueven y cambian todos los días. ¡Atrápalas mientras viajas!
    </p>
    
    <button onclick="cerrarSplash()" style="background: #F97316; color: white; border: none; padding: 15px 30px; border-radius: 30px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 15px rgba(249,115,22,0.4); cursor: pointer;">
        Comenzar a explorar 👉
    </button>
</div>

<script>
function cerrarSplash() {
    const splash = document.getElementById('splashScreen');
    splash.style.opacity = '0';
    setTimeout(() => { splash.style.visibility = 'hidden'; }, 400);
}
</script>
"""

# Insert right after <body>
html = html.replace('<body>', '<body>\n' + splash_html)


html += f"<!-- v58 {time.time()} -->"
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
