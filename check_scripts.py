from bs4 import BeautifulSoup

with open('index.html', 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')

scripts = soup.find_all('script')
for i, s in enumerate(scripts):
    print(f"--- SCRIPT {i} ---")
    print(s.string if s.string else s.get('src'))

