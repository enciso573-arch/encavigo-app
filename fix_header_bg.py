from bs4 import BeautifulSoup

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')

# 1. Hide "EncaviGO" text to prevent overlap
style = soup.find('style')
if style:
    css = style.string
    if '.header-title {' in css:
        css = css.replace('.header-title { font-size: 18px;', '.header-title { display: none;')
    style.string = css

# 2. Change the Streaming card background to Netflix
streaming_card = soup.find('h2', string=lambda t: t and 'Tus series' in t)
if streaming_card:
    # Go up to the article
    article = streaming_card.find_parent('article')
    if article:
        bg = article.find('div', class_='card-bg')
        if bg:
            # Netflix on a TV in a dark room (Unsplash)
            bg['style'] = "background-image: url('https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&q=80&w=600');"

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(str(soup))
