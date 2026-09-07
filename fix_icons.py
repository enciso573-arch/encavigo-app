import re
import time

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# I need to replace the farIcon and closeIcon static definitions with a dynamic function
# First, remove the static ones
html = re.sub(r"const farIcon = L\.divIcon.*?iconSize: \[12, 12\] \}\);", "", html, flags=re.DOTALL)
html = re.sub(r"const closeIcon = L\.divIcon.*?iconSize: \[18, 18\] \}\);", "", html, flags=re.DOTALL)

# Now, add the dynamic function right where they were
dynamic_icon_func = """
    const getMarkerIcon = (camp, isClose) => {
        const size = isClose ? 45 : 30; // Más grandes para que se vean bien
        const border = isClose ? '3px solid #F97316' : '2px solid white';
        const shadow = isClose ? '0 0 15px #F97316' : '0 3px 6px rgba(0,0,0,0.4)';
        const anim = isClose ? 'animation: pulse 1.5s infinite;' : '';
        
        // Usar la foto del negocio o el logo por defecto
        const bgImg = camp.img || 'logo_jackpot.jpg';
        const bg = `background-image: url('${bgImg}'); background-size: cover; background-position: center;`;
        
        const html = `<div style="width:${size}px; height:${size}px; border-radius:50%; border:${border}; box-shadow:${shadow}; ${anim} ${bg}"></div>`;
        return L.divIcon({ className: 'custom-div-icon', html: html, iconSize: [size, size] });
    };
"""
html = html.replace("const userIcon", dynamic_icon_func + "\n    const userIcon")

# In plotCampaignsInicial, update the marker creation
old_plot = r"const marker = L\.marker\(\[camp\.lat, camp\.lng\], \{icon: farIcon\}\)\.addTo\(mapInstance\);"
new_plot = "const marker = L.marker([camp.lat, camp.lng], {icon: getMarkerIcon(camp, false)}).addTo(mapInstance);"
html = re.sub(old_plot, new_plot, html)

# In updateMapLive, update the setIcon logic
old_set = r"marker\.setIcon\(isClose \? closeIcon : farIcon\);"
new_set = "marker.setIcon(getMarkerIcon(camp, isClose));"
html = re.sub(old_set, new_set, html)

# Also let's add `img: 'logo_jackpot.jpg'` to the fake spots so they look like real brands
old_fake = r"\{ title: 'Fake Marina', lat: 20\.6625, lng: -105\.2530, waMsg: 'Hola' \}"
new_fake = "{ title: 'Fake Marina', lat: 20.6625, lng: -105.2530, waMsg: 'Hola', img: 'logo_jackpot.jpg' }"
html = html.replace(old_fake, new_fake)
html = html.replace("waMsg: 'Hola' }", "waMsg: 'Hola', img: 'logo_jackpot.jpg' }")

html += f"<!-- v46 {time.time()} -->"
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
