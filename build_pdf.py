from bs4 import BeautifulSoup
import time

with open('admin.html', 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')

# 1. Update the sidebar button text and onclick
for item in soup.find_all('div', class_='nav-item'):
    if 'Reportes Excel' in item.text:
        item.string = ""
        # Re-add icon and text
        item.append(BeautifulSoup('<svg fill="none" height="16" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> Reporte PDF (Clientes)', 'html.parser'))
        item['onclick'] = "generarReportePDF()"
        item['id'] = 'nav-reporte'

# 2. Update the JS logic
scripts = soup.find_all('script')
target_script = scripts[-1]
js = target_script.string

pdf_logic = """
    function generarReportePDF() {
        db.collection('campaigns').get().then(snapshot => {
            let win = window.open('', '_blank');
            let html = 
            <html>
            <head>
                <title>Reporte EncaviGO</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #F3F4F6; padding: 40px; color: #111827; }
                    .report-container { max-width: 800px; margin: 0 auto; background: #FFF; padding: 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
                    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #F97316; padding-bottom: 20px; margin-bottom: 30px; }
                    .header h1 { margin: 0; color: #F97316; font-size: 28px; font-weight: 800; }
                    .header p { margin: 0; color: #6B7280; font-size: 14px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background: #F9FAFB; color: #374151; font-weight: 600; text-align: left; padding: 12px 15px; border-bottom: 2px solid #E5E7EB; font-size: 14px; }
                    td { padding: 15px; border-bottom: 1px solid #E5E7EB; color: #4B5563; font-size: 14px; }
                    .highlight { font-weight: 700; color: #10B981; }
                    .footer { margin-top: 40px; text-align: center; color: #9CA3AF; font-size: 12px; }
                    @media print {
                        body { background: #FFF; padding: 0; }
                        .report-container { box-shadow: none; max-width: 100%; padding: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="report-container">
                    <div class="header">
                        <h1>EncaviGO Analytics</h1>
                        <p>Reporte de Rendimiento<br>Fecha: </p>
                    </div>
                    <p style="margin-bottom: 30px; line-height: 1.6;">A continuación se detalla el impacto directo y las activaciones generadas por la red de vehículos afiliados a EncaviGO durante el periodo activo.</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre de la Campaña</th>
                                <th>Tipo de Oferta</th>
                                <th>Estado</th>
                                <th>Clics Generados</th>
                            </tr>
                        </thead>
                        <tbody>
            ;
            
            let totalClics = 0;
            snapshot.forEach(doc => {
                const c = doc.data();
                const clics = c.clicks || 0;
                totalClics += clics;
                html += 
                            <tr>
                                <td style="font-weight: 600; color: #111827;"></td>
                                <td></td>
                                <td></td>
                                <td class="highlight">+ interacciones</td>
                            </tr>
                ;
            });
            
            html += 
                        </tbody>
                    </table>
                    
                    <div style="margin-top: 30px; background: #F9FAFB; padding: 20px; border-radius: 8px; text-align: right;">
                        <span style="font-size: 14px; color: #6B7280; margin-right: 15px;">Total de Impactos Globales:</span>
                        <span style="font-size: 24px; font-weight: 800; color: #F97316;"></span>
                    </div>
                    
                    <div class="footer">
                        Este documento es generado automáticamente por el sistema central de EncaviGO.<br>
                        Confidencial y exclusivo para el negocio afiliado.
                    </div>
                </div>
                <script>
                    setTimeout(() => window.print(), 1000);
                </script>
            </body>
            </html>
            ;
            win.document.write(html);
            win.document.close();
        }).catch(err => alert("Error al generar Reporte: " + err));
    }
"""

js = js.replace('function descargarExcel() {', pdf_logic + '\n    function descargarExcel_OLD() {')
target_script.string = js

html = str(soup)
html += f"<!-- v17 {time.time()} -->"
with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(html)
