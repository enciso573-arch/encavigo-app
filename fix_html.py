import re
import time

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# The dangling HTML piece to remove:
dangling = """        <div class="scratch-result" id="scratchResult">
            <!-- Dynamic Result -->
        </div>
        <canvas id="scratchCanvas" class="scratch-canvas" width="300" height="150"></canvas>
    </div>
    <button id="scratchClose" class="scratch-close" onclick="closeScratchGame()">Ver Cupones</button>
</div>"""

html = html.replace(dangling, "")

# Also there's another dangling piece from when I moved the banner? Let's check for any <div id="scratchBanner">
# In the previous python script: html = re.sub(r'<div id="scratchBanner".*?</div>', '', html, flags=re.DOTALL)
# It would have left behind the closing tags of scratchBanner. Wait, scratchBanner has no inner divs, so it was removed perfectly.

# But wait! I also need to make sure the app-container is not pushed to the right. 
# Why was app-container pushed to the right? 
# Because the dangling `</div>` tags closed the `<body>` early or closed `<div class="app-container">` early!
# Let's count the divs!
