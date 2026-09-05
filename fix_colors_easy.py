import re
with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

text = re.sub(r'--accent:\s*#[0-9A-Fa-f]+;', '--accent: #F97316;', text)
text = re.sub(r'--secondary:\s*#[0-9A-Fa-f]+;', '--secondary: #1D4ED8;', text)
text = re.sub(r'--mascot-1:\s*linear-gradient[^;]+;', '--mascot-1: linear-gradient(160deg, #111827 0%, #1F2937 100%);', text)
text = re.sub(r'--mascot-3:\s*linear-gradient[^;]+;', '--mascot-3: linear-gradient(160deg, #1D4ED8 0%, #1E3A8A 100%);', text)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(text)
