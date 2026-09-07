import re
import time

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Extract the scratch HTML block
scratch_html_regex = r'<div id="scratchBanner".*?</button>\s*</div>'
match = re.search(scratch_html_regex, html, flags=re.DOTALL)
if match:
    scratch_block = match.group(0)
    # Remove from current location
    html = html.replace(scratch_block, '')
    
    # Insert it right AFTER <div class="app-container">
    html = html.replace('<div class="app-container">', '<div class="app-container">\n' + scratch_block)
    
    # Let's also fix the scratch-banner CSS so it floats beautifully at the top of the app container
    # Since app-container has position relative and overflow hidden, we can make the banner absolute!
    new_css = """
    /* Scratch Game Styles */
    .scratch-banner { position: absolute; top: 60px; left: 20px; right: 20px; z-index: 100; background: linear-gradient(135deg, #F97316, #EAB308); color: white; padding: 15px; border-radius: 12px; text-align: center; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(249, 115, 22, 0.4); cursor: pointer; animation: pulse 2s infinite; display: none; }
    """
    # Replace the old css
    old_css_regex = r'/\* Scratch Game Styles \*/.*?\.scratch-banner \{.*?\}'
    html = re.sub(old_css_regex, new_css, html, flags=re.DOTALL)

    html += f"<!-- v31 {time.time()} -->"
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Done")
else:
    print("Not found")
