import re
import time

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# I will update the getMarkerIcon function inside the <script> block
old_getMarker = r"const getMarkerIcon = \(camp, isClose\) => \{.*?return L\.divIcon.*?\}\);"

new_getMarker = """const getMarkerIcon = (camp, isClose) => {
        const size = isClose ? 40 : 30; // Un poco más grandes para que destaquen siempre
        // Lejos: Gota Negra con centro Naranja. Cerca: Gota Naranja con centro Blanco y pulso.
        const bg = isClose ? '#F97316' : '#111827'; 
        const inner = isClose ? '#FFFFFF' : '#F97316';
        
        const shadow = isClose ? '-3px 3px 15px rgba(249,115,22,0.9)' : '-2px 2px 8px rgba(0,0,0,0.6)';
        const anim = isClose ? 'animation: pulse 1.5s infinite;' : '';
        const zindex = isClose ? 'z-index: 1000;' : 'z-index: 500;';

        const html = `
            <div style="
                width: ${size}px; 
                height: ${size}px; 
                background: ${bg}; 
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
                    background: ${inner}; 
                    border-radius: 50%; 
                    position: absolute; 
                    top: 50%; 
                    left: 50%; 
                    transform: translate(-50%, -50%);
                "></div>
            </div>
        `;
        return L.divIcon({ 
            className: 'custom-div-icon', 
            html: html, 
            iconSize: [size, size],
            iconAnchor: [size/2, size]
        });
    };"""

html = re.sub(old_getMarker, new_getMarker, html, flags=re.DOTALL)

html += f"<!-- v50 {time.time()} -->"
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
