import re
import time

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Update Sidebar Items
html = re.sub(
    r'<div class="nav-item">\s*<svg.*?Negocios Activos\s*</div>',
    '',
    html,
    flags=re.DOTALL
)

html = re.sub(
    r'<div class="nav-item">\s*<svg.*?>.*?</svg>\s*Analíticas\s*</div>',
    '<div class="nav-item" id="nav-analiticas" onclick="switchTab(\'analiticas\')"><svg fill="none" height="16" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="16"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> Analíticas</div>',
    html,
    flags=re.DOTALL
)

html = re.sub(
    r'<div class="nav-item" onclick="descargarExcel\(\)">\s*<svg.*?>.*?</svg>\s*Reportes Excel\s*</div>',
    '<div class="nav-item" id="nav-reportes" onclick="switchTab(\'reportes\')"><svg fill="none" height="16" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> Reportes a Clientes</div>',
    html,
    flags=re.DOTALL
)

# 2. Add New Views HTML
new_views = """
<div id="view-analiticas" style="display: none; height: 100%; flex-direction: column;">
    <div class="top-bar" style="margin-bottom: 20px;">
        <h1 class="page-title">Analíticas Avanzadas</h1>
    </div>
    <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
        <div style="width: 90px; height: 90px; background: rgba(249, 115, 22, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; color: #F97316;">
            <svg fill="none" height="40" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="40"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
        </div>
        <h2 style="font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 10px 0;">Módulo en Construcción</h2>
        <p style="color: #6B7280; font-size: 15px; max-width: 450px; text-align: center; line-height: 1.6; margin: 0;">Estamos desarrollando un sistema de métricas de rendimiento y gráficas avanzadas exclusivas para la versión 2.0 de EncaviGO.</p>
    </div>
</div>

<div id="view-reportes" style="display: none;">
    <div class="top-bar">
        <h1 class="page-title">Reportes para Clientes</h1>
        <button class="btn-primary" onclick="generarReportePDF()">
            <svg fill="none" height="16" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="16"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Exportar PDF
        </button>
    </div>
    <div class="data-section">
        <div class="data-header">
            <h3>Vista Previa del Reporte de Impacto</h3>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Nombre de la Campaña</th>
                    <th>Tipo de Oferta</th>
                    <th>Estado</th>
                    <th>Clics / Impactos Generados</th>
                </tr>
            </thead>
            <tbody id="reportes-tbody">
            </tbody>
        </table>
    </div>
</div>
"""
# Insert right after view-choferes closing div
# we can just append it before the main div closes.
html = html.replace('</div>\n</div>\n    <script>', new_views + '\n</div>\n</div>\n    <script>')

# 3. Update switchTab function
old_switch = "document.getElementById('view-choferes').style.display = (tab === 'choferes') ? 'block' : 'none';"
new_switch = old_switch + """
        const vAna = document.getElementById('view-analiticas');
        if(vAna) vAna.style.display = (tab === 'analiticas') ? 'flex' : 'none';
        const vRep = document.getElementById('view-reportes');
        if(vRep) vRep.style.display = (tab === 'reportes') ? 'block' : 'none';
"""
html = html.replace(old_switch, new_switch)

# 4. Insert campaigns_hook
old_tbody_append = "tbody.appendChild(tr);"
new_tbody_append = """tbody.appendChild(tr);
                    const trRep = document.createElement('tr');
                    trRep.innerHTML = `
                      <td><strong style="color: #111827;">${camp.title || 'Sin Título'}</strong></td>
                      <td>${camp.badge || '-'}</td>
                      <td>${camp.active ? '<span style="color: #10B981;">● Activo</span>' : '<span style="color: #EF4444;">● Pausado</span>'}</td>
                      <td style="color: #F97316; font-weight: bold;">+${camp.clicks || 0} interacciones</td>
                    `;
                    if(document.getElementById('reportes-tbody')) document.getElementById('reportes-tbody').appendChild(trRep);"""
html = html.replace(old_tbody_append, new_tbody_append)

html = html.replace("tbody.innerHTML = '';", "tbody.innerHTML = '';\n                if(document.getElementById('reportes-tbody')) document.getElementById('reportes-tbody').innerHTML = '';")

# 5. Replace descargarExcel() with generarReportePDF()
pdf_js = r"""
    function generarReportePDF() {
        db.collection('campaigns').get().then(snapshot => {
            let win = window.open('', '_blank');
            let pdfHtml = `
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
                        <p>Reporte de Rendimiento<br>Fecha: ${new Date().toLocaleDateString()}</p>
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
            `;
            
            let totalClics = 0;
            snapshot.forEach(doc => {
                const c = doc.data();
                const clics = c.clicks || 0;
                totalClics += clics;
                pdfHtml += `
                            <tr>
                                <td style="font-weight: 600; color: #111827;">${c.title || 'Sin Titulo'}</td>
                                <td>${c.badge || '-'}</td>
                                <td>${c.active ? '<span style="color: #10B981;">● Activo</span>' : '<span style="color: #EF4444;">● Pausado</span>'}</td>
                                <td class="highlight">+${clics} interacciones</td>
                            </tr>
                `;
            });
            
            pdfHtml += `
                        </tbody>
                    </table>
                    
                    <div style="margin-top: 30px; background: #F9FAFB; padding: 20px; border-radius: 8px; text-align: right;">
                        <span style="font-size: 14px; color: #6B7280; margin-right: 15px;">Total de Impactos Globales:</span>
                        <span style="font-size: 24px; font-weight: 800; color: #F97316;">${totalClics}</span>
                    </div>
                    
                    <div class="footer">
                        Este documento es generado automáticamente por el sistema central de EncaviGO.<br>
                        Confidencial y exclusivo para el negocio afiliado.
                    </div>
                </div>
                <script>
                    setTimeout(() => window.print(), 1000);
                <\/script>
            </body>
            </html>
            `;
            win.document.write(pdfHtml);
            win.document.close();
        }).catch(err => alert("Error al generar Reporte: " + err));
    }
"""
html = re.sub(r'\s*function descargarExcel\(\) \{.*?\}\s*', '\n' + pdf_js + '\n', html, flags=re.DOTALL)


html += f"<!-- v21 {time.time()} -->"
with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(html)
