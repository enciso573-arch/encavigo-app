import json
from bs4 import BeautifulSoup
with open('index.html', 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')

bad_nodes = []
for text in soup.find_all(string=True):
    if 'Â' in text or 'Ã' in text:
        bad_nodes.append(text.strip())

print(json.dumps(bad_nodes, indent=2, ensure_ascii=False))
