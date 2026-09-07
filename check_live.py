from bs4 import BeautifulSoup
import urllib.request

try:
    url = "https://encavigo.com/admin.html?v=1"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read().decode('utf-8')
    print("Admin HTML length:", len(html))
    print(html[-1000:])
except Exception as e:
    print("Error:", e)
