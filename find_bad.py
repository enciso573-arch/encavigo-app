import re

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Print unique words containing Ã or Â
words = set(re.findall(r'\b\w*[ÃÂ]\w*\b', text))
print("Corrupted words:", words)
