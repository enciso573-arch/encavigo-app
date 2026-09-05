with open('index.html', 'rb') as f:
    text = f.read().decode('utf-8')

# The bad characters might actually be literal 'Ã' and 'Â' in the file now
fixes = {
    'VehÃ\xadculo': 'Vehículo',
    'vehÃ\xadculo': 'vehículo',
    'vehÃ\xadculos': 'vehículos',
    'cÃ³digo': 'código',
    'pÃºblico': 'público',
    'RomÃ¡ntica': 'Romántica',
    'ANÃšNCIATE': 'ANÚNCIATE',
    '--Âº': '--°',
    '32Âº': '32°',
    'Â·': '·'
}

for bad, good in fixes.items():
    text = text.replace(bad, good)

# Also let's try the literal strings if they don't have the soft hyphen
text = text.replace('VehÃculo', 'Vehículo')
text = text.replace('vehÃculo', 'vehículo')
text = text.replace('vehÃculos', 'vehículos')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(text)
