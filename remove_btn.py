from bs4 import BeautifulSoup
import time

with open('admin.html', 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')

nav_items = soup.find_all('div', class_='nav-item')
for item in nav_items:
    if 'Negocios Activos' in item.text:
        item.decompose()

html = str(soup)
html += f"<!-- v16 {time.time()} -->"
with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(html)
