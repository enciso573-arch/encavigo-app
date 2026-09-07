import re
import time

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Fix the undefined array crash in openMap
old_push = r"window\.loadedCampaigns\.push\(\.\.\.fakeSpots\);"
new_push = "window.loadedCampaigns = window.loadedCampaigns || [];\n            window.loadedCampaigns.push(...fakeSpots);"
html = re.sub(old_push, new_push, html)

html += f"<!-- v52 {time.time()} -->"
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
