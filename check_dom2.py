from bs4 import BeautifulSoup
with open('index.html', 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')

m = soup.find('main', class_='promo-feed')
for i, child in enumerate(m.children):
    if child.name:
        print(f"[{i}] {child.name} - class: {child.get('class')}")
