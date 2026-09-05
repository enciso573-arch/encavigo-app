with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('photo-1593784991095-a205069470b6', 'photo-1574375927938-d5a98e8ffe85')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(text)
