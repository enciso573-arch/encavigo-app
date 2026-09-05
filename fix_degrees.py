with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace ANY instance of Â followed by a degree or ordinal indicator
text = text.replace('Â°', '°')
text = text.replace('Âº', '°')

# And just in case, look for the literal string
text = text.replace('--Â°', '--°')
text = text.replace('32Â°', '32°')
text = text.replace('t + \'Â°\'', 't + \'°\'')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(text)
