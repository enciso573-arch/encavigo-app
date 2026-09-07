import re
import time

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Change the map tile URL to CartoDB Light (Positron) - Very clean, no POIs
old_tile = "L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'"
new_tile = "L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'"

html = html.replace(old_tile, new_tile)
html = html.replace("attribution: '&copy; Google Maps'", "attribution: '&copy; CARTO'")

html += f"<!-- v41 {time.time()} -->"
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
