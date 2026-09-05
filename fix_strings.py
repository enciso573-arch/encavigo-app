with open('index.html', 'rb') as f:
    b = f.read()

# Try to decode it
try:
    text = b.decode('utf-8')
except Exception as e:
    print('Decode error:', e)
    text = b.decode('utf-8', errors='replace')

# Replace known bad sequences
text = text.replace('VehÃ­culo', 'Vehículo')
text = text.replace('vehÃ­culo', 'vehículo')
text = text.replace('vehÃ­culos', 'vehículos')
text = text.replace('cÃ³digo', 'código')
text = text.replace('pÃºblico', 'público')
text = text.replace('RomÃ¡ntica', 'Romántica')
text = text.replace('ANÃšNCIATE', 'ANÚNCIATE')
text = text.replace('--Âº', '--°')
text = text.replace('32Âº', '32°')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(text)
