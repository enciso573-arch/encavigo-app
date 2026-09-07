import re
import time

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Change the map tile URL from Dark to Standard Light (OpenStreetMap)
old_tile = "L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'"
new_tile = "L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'"

html = html.replace(old_tile, new_tile)

# Also change the map header to be a bit lighter so it matches the bright map
old_header = ".map-header { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; background: #111827; color: white; border-bottom: 1px solid #374151; }"
new_header = ".map-header { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; background: #FFFFFF; color: #111827; border-bottom: 1px solid #E5E7EB; box-shadow: 0 2px 10px rgba(0,0,0,0.1); z-index: 1000; position: relative; }"

html = html.replace(old_header, new_header)

# Change popup colors to be light mode friendly
old_popup_wrapper = ".leaflet-popup-content-wrapper { background: #1F2937; color: white; border-radius: 12px; }"
old_popup_tip = ".leaflet-popup-tip { background: #1F2937; }"
new_popup_wrapper = ".leaflet-popup-content-wrapper { background: #FFFFFF; color: #111827; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }"
new_popup_tip = ".leaflet-popup-tip { background: #FFFFFF; }"

html = html.replace(old_popup_wrapper, new_popup_wrapper)
html = html.replace(old_popup_tip, new_popup_tip)

# Make the close button dark
html = html.replace('.map-close { background: transparent; border: none; color: white;', '.map-close { background: transparent; border: none; color: #111827;')

html += f"<!-- v39 {time.time()} -->"
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
