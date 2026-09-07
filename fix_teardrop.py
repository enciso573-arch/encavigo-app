import re
import time

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace the dynamic_icon_func with the CSS Teardrop marker logic
old_func = r"const getMarkerIcon = \(camp, isClose\) => \{.*?return L\.divIcon.*?\}\);"

new_func = """
    const getMarkerIcon = (camp, isClose) => {
        // Marcador estilo gota (Teardrop) puro CSS para máxima nitidez (cero pixeles)
        const size = isClose ? 36 : 24;
        const color = isClose ? '#F97316' : '#9CA3AF'; // Naranja si está cerca, Gris si está lejos
        const shadow = isClose ? '-3px 3px 12px rgba(249,115,22,0.8)' : '-2px 2px 6px rgba(0,0,0,0.4)';
        const anim = isClose ? 'animation: pulse 1.5s infinite;' : '';
        const zindex = isClose ? 'z-index: 1000;' : '';

        // El HTML es una gota rotada a -45 grados, con un circulito blanco en el centro
        const html = `
            <div style="
                width: ${size}px; 
                height: ${size}px; 
                background: ${color}; 
                border-radius: 50% 50% 50% 0; 
                transform: rotate(-45deg); 
                border: 2px solid white; 
                box-shadow: ${shadow}; 
                position: relative;
                ${anim}
                ${zindex}
            ">
                <div style="
                    width: ${size/2.5}px; 
                    height: ${size/2.5}px; 
                    background: white; 
                    border-radius: 50%; 
                    position: absolute; 
                    top: 50%; 
                    left: 50%; 
                    transform: translate(-50%, -50%);
                "></div>
            </div>
        `;
        
        // iconAnchor asegura que la "punta" de la gota apunte exactamente a la calle (mitad del ancho, fondo total)
        return L.divIcon({ 
            className: 'custom-div-icon', 
            html: html, 
            iconSize: [size, size],
            iconAnchor: [size/2, size]
        });
    };
"""

html = re.sub(old_func, new_func, html, flags=re.DOTALL)

html += f"<!-- v47 {time.time()} -->"
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
