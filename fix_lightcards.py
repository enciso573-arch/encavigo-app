import re

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Make the cards lighter
text = text.replace('--bg-card:        #152033;', '--bg-card:        #1F2E47;')
text = text.replace('--bg-card-alt:    #152033;', '--bg-card-alt:    #253655;')

# Also, update the border to be slightly lighter so the card pops
text = text.replace('--border:         #1E293B;', '--border:         #334A6E;')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(text)
