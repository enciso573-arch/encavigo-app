from bs4 import BeautifulSoup
import time

# Just touching the files to update their modification time, ensuring github pages rebuilds
with open('index.html', 'a', encoding='utf-8') as f:
    f.write('<!-- ' + str(time.time()) + ' -->')

with open('admin.html', 'a', encoding='utf-8') as f:
    f.write('<!-- ' + str(time.time()) + ' -->')
