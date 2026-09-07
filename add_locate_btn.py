import re
import time

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Add the locate-me button HTML and CSS
new_css = """
    .locate-btn { position: absolute; bottom: 30px; right: 20px; z-index: 1000; background: white; border: none; width: 45px; height: 45px; border-radius: 50%; box-shadow: 0 2px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; cursor: pointer; color: #3B82F6; }
    .locate-btn svg { width: 24px; height: 24px; }
"""
html = html.replace('</style>', new_css + '\n</style>')

locate_html = """
    <div id="map"></div>
    <button class="locate-btn" onclick="centerMapOnUser()">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>
    </button>
"""
html = html.replace('<div id="map"></div>', locate_html)

locate_js = """
    function centerMapOnUser() {
        if (mapInstance && window.currentLat && window.currentLng) {
            mapInstance.setView([window.currentLat, window.currentLng], 15);
        }
    }
"""
html = html.replace('function closeMap() {', locate_js + '\n    function closeMap() {')

html += f"<!-- v43 {time.time()} -->"
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
