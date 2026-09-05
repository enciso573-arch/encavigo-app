from bs4 import BeautifulSoup
with open('index.html', 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')

print(f"app-container children count: len(soup.find(class_='app-container').contents)")
c = soup.find(class_='app-container')
for i, child in enumerate(c.children):
    if child.name:
        print(f"[{i}] {child.name} - class: {child.get('class')}")
