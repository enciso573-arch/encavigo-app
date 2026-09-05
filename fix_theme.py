from bs4 import BeautifulSoup
import re

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace the dark theme CSS variables/colors with Light Theme
css_replacements = {
    'background: #000; color: #EDEDED;': 'background: #F3F4F6; color: #111827;', # Body bg and text
    'background: #050505;': 'background: #FFFFFF;', # Sidebar
    'border-right: 1px solid #1A1A1A;': 'border-right: 1px solid #E5E7EB;',
    'color: #FFF;': 'color: #111827;', # Main headings
    'color: #888;': 'color: #6B7280;', # Nav items / metrics labels
    'hover { color: #FFF; background: #111; }': 'hover { color: #111827; background: #F9FAFB; }',
    'active { background: #1A1A1A; color: #FFF;': 'active { background: #FFF7ED; color: #EA580C;',
    'background: radial-gradient(circle at top, #0A0A0A 0%, #000 100%);': 'background: #F4F5F7;', # Main area bg
    'background: #FFF; color: #000;': 'background: #111827; color: #FFF;', # Primary Button
    'background: #0A0A0A; border: 1px solid #1A1A1A;': 'background: #FFFFFF; border: 1px solid #E5E7EB;', # Cards
    'box-shadow: 0 4px 20px rgba(0,0,0,0.5);': 'box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);', # Light shadow
    'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)': 'linear-gradient(90deg, transparent, rgba(0,0,0,0.05), transparent)', # Card highlight
    'border-bottom: 1px solid #1A1A1A;': 'border-bottom: 1px solid #E5E7EB;', # Table borders
    'color: #666;': 'color: #6B7280;', # Table headers
    'color: #CCC;': 'color: #4B5563;', # Table cells
    'background: #050505;': 'background: #F9FAFB;', # Table header bg
    'hover td { background: #111;': 'hover td { background: #F9FAFB;',
    'border: 1px solid #333;': 'border: 1px solid #E5E7EB;', # Avatar border
    'background: #1A1A1A;': 'background: #E5E7EB;', # Performance bar empty
    'box-shadow: 0 2px 10px rgba(255,255,255,0.1);': 'box-shadow: 0 4px 12px rgba(0,0,0,0.1);' # Btn shadow
}

for old, new in css_replacements.items():
    html = html.replace(old, new)

# One specific fix for the sidebar SVG stroke in dark vs light mode
html = html.replace("stroke='#FFF'", "stroke='#FFF'") # Brand icon still white because it has orange bg

with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(html)
