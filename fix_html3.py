import re
import time

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# First let's remove the bad string!
bad_string = """    <div class="scratch-container" id="scratchContainer">
        <div class="scratch-result" id="scratchResult">
            <!-- Dynamic Result -->
        </div>
        <canvas id="scratchCanvas" class="scratch-canvas" width="300" height="150"></canvas>
    </div>
    <button id="scratchClose" class="scratch-close" onclick="closeScratchGame()">Ver Cupones</button>
</div>"""

if bad_string in html:
    html = html.replace(bad_string, "")
    # Add a closing div for app-container just before Firebase SDK if missing!
    html += f"<!-- v35 {time.time()} -->"
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Fixed bad string")
else:
    print("Bad string not found!")

