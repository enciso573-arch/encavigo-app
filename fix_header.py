from bs4 import BeautifulSoup

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')

style = soup.find('style')
if style:
    css = style.string
    
    # 1. Bring back the brand text
    if '.header-title { display: none;' in css:
        css = css.replace('.header-title { display: none;', '.header-title { font-size: 18px;')
    
    # 2. Hide the weather chip
    if '.weather-chip {' in css:
        css = css.replace('.weather-chip {', '.weather-chip { display: none !important;')
        
    style.string = css

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(str(soup))
