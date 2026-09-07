import re
import time

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# This is the exact bad string that closes app-container early and creates column 1
bad_string = """    <div class="scratch-container" id="scratchContainer">
        <div class="scratch-result" id="scratchResult">
            <!-- Dynamic Result -->
        </div>
        <canvas id="scratchCanvas" class="scratch-canvas" width="300" height="150"></canvas>
    </div>
    <button id="scratchClose" class="scratch-close" onclick="closeScratchGame()">Ver Cupones</button>
</div>"""

html = html.replace(bad_string, "")

# Since that bad string contained a </div> which was incorrectly acting as the closing tag for app-container,
# Wait! Let's check the bottom of index.html to see if app-container is actually closed there!
