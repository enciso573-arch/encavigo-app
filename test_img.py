import urllib.request
url = 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=600&q=80'
req = urllib.request.Request(url, method='HEAD')
resp = urllib.request.urlopen(req)
print(resp.status)
