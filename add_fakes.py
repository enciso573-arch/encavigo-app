import re
import time

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

inject_fake_data = """
        if (!window.fakesAdded) {
            window.fakesAdded = true;
            const fakeSpots = [
                { title: 'Fake Marina', lat: 20.6625, lng: -105.2530, waMsg: 'Hola' },
                { title: 'Fake Centro', lat: 20.6125, lng: -105.2340, waMsg: 'Hola' },
                { title: 'Fake Olas Altas', lat: 20.5980, lng: -105.2395, waMsg: 'Hola' },
                { title: 'Fake Versalles', lat: 20.6400, lng: -105.2280, waMsg: 'Hola' },
                { title: 'Fake Nvo Vallarta', lat: 20.6970, lng: -105.2890, waMsg: 'Hola' },
                { title: 'Fake Bucerias', lat: 20.7550, lng: -105.3340, waMsg: 'Hola' },
                { title: 'Fake La Cruz', lat: 20.7380, lng: -105.3780, waMsg: 'Hola' },
                { title: 'Fake Fluvial', lat: 20.6480, lng: -105.2250, waMsg: 'Hola' },
                { title: 'Fake Pitillal', lat: 20.6485, lng: -105.2100, waMsg: 'Hola' },
                { title: 'Fake Malecon', lat: 20.6080, lng: -105.2350, waMsg: 'Hola' }
            ];
            window.loadedCampaigns.push(...fakeSpots);
        }
"""

# Insert it at the top of openMap()
html = html.replace('function openMap() {', 'function openMap() {\n' + inject_fake_data)

html += f"<!-- v45 {time.time()} -->"
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
