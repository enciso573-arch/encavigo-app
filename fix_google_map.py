import re
import time

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Change the map tile URL from OSM to Google Maps
old_tile = "L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'"
new_tile = "L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'"

html = html.replace(old_tile, new_tile)

# Remove OSM attribution as it's Google now
html = html.replace("attribution: '&copy; OpenStreetMap &copy; CARTO'", "attribution: '&copy; Google Maps'")

html += f"<!-- v40 {time.time()} -->"
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
