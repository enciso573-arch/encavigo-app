from bs4 import BeautifulSoup
with open('index.html', 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')

streaming_card = soup.find('h2', string=lambda t: t and 'Tus series' in t)
print(streaming_card)
