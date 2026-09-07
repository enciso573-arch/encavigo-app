from bs4 import BeautifulSoup
with open('admin.html', 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')
with open('test.js', 'w', encoding='utf-8') as f:
    f.write(soup.find_all('script')[-1].string)
