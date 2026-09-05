import re

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix all the broken encodings manually!
fixes = {
    'vehÃculo': 'vehículo',
    'vehculo': 'vehículo',
    'VEHÃCULO': 'VEHÍCULO',
    'VEHCULO': 'VEHÍCULO',
    'cÃ³digo': 'código',
    'cdigo': 'código',
    'pÃºblico': 'público',
    'pblico': 'público',
    'RomÃ¡ntica': 'Romántica',
    'Romntica': 'Romántica',
    'ANÃšNCIATE': 'ANÚNCIATE',
    'ANNCIATE': 'ANÚNCIATE',
    'mÃ¡s': 'más',
    'ms': 'más',
    'Únete': 'Únete', # Ensure it stays correct
    'Ãšnete': 'Únete',
    'nete': 'Únete',
}

for bad, good in fixes.items():
    text = text.replace(bad, good)

# Also fix the weird "" character that might be a replacement character
# Actually powershell displays it as "", but the file has Ã...
text = re.sub(r'veh[ÃÂ]culo', 'vehículo', text)
text = re.sub(r'VEH[ÃÂ]CULO', 'VEHÍCULO', text)
text = re.sub(r'c[ÃÂ]digo', 'código', text)
text = re.sub(r'p[ÃÂ]blico', 'público', text)
text = re.sub(r'Rom[ÃÂ]ntica', 'Romántica', text)
text = re.sub(r'AN[ÃÂ]NCIATE', 'ANÚNCIATE', text)
text = re.sub(r'm[ÃÂ]s', 'más', text)
text = re.sub(r'[ÃÂ]nete', 'Únete', text)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(text)
