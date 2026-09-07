from bs4 import BeautifulSoup
with open('admin.html', 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')

scripts = soup.find_all('script')
text = scripts[-1].string
if text:
    print(text.encode('ascii', 'ignore').decode('ascii'))
