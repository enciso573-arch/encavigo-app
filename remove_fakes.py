import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Remove the fake spots injection block
old_fake_block = r"if \(!window\.fakesAdded\) \{.*?window\.loadedCampaigns\.push\(\.\.\.fakeSpots\);\s*\}"
html = re.sub(old_fake_block, "", html, flags=re.DOTALL)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
