from bs4 import BeautifulSoup
import time

with open('admin.html', 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')

old_div = soup.find('div', id='view-analiticas')
if old_div:
    new_html = """
    <div id="view-analiticas" style="display: none; height: 100%; flex-direction: column;">
        <div class="top-bar" style="margin-bottom: 20px;">
            <h1 class="page-title">Analíticas Avanzadas</h1>
        </div>
        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
            <div style="width: 90px; height: 90px; background: rgba(249, 115, 22, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; color: #F97316;">
                <svg fill="none" height="40" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="40">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
            </div>
            <h2 style="font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 10px 0;">Módulo en Construcción</h2>
            <p style="color: #6B7280; font-size: 15px; max-width: 450px; text-align: center; line-height: 1.6; margin: 0;">
                Estamos desarrollando un sistema de métricas de rendimiento y gráficas avanzadas exclusivas para la versión 2.0 de EncaviGO.
            </p>
        </div>
    </div>
    """
    old_div.replace_with(BeautifulSoup(new_html, 'html.parser'))

html = str(soup)
html += f"<!-- v15 {time.time()} -->"
with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(html)
