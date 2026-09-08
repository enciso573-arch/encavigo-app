import re
import time

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Add html5-qrcode
if 'html5-qrcode' not in html:
    html = html.replace('</head>', '<script src="https://unpkg.com/html5-qrcode"></script>\n</head>')

# 2. Add Modals HTML
modals_html = """
<!-- SCANNER MODAL -->
<div id="scannerModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.95); z-index: 10000; display: none; flex-direction: column; align-items: center; justify-content: center;">
    <h2 style="color: white; margin-bottom: 20px; text-align: center;">Escanea el código de la caja</h2>
    <div id="reader" style="width: 300px; border-radius: 12px; overflow: hidden; background: #000; margin-bottom: 30px;"></div>
    <button onclick="cerrarScanner()" style="background: #4B5563; color: white; border: none; padding: 12px 30px; border-radius: 30px; font-size: 16px;">Cancelar</button>
</div>

<!-- SUCCESS MODAL -->
<div id="successModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: #10B981; z-index: 11000; display: none; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 20px;">
    <div style="font-size: 80px; margin-bottom: 10px;">✅</div>
    <h1 style="color: white; font-size: 32px; margin-bottom: 10px;">CUPÓN APROBADO</h1>
    <h2 id="successRestaurante" style="color: rgba(255,255,255,0.9); font-size: 24px; margin-bottom: 30px;">Restaurante</h2>
    <div style="background: rgba(0,0,0,0.2); padding: 15px 30px; border-radius: 12px; color: white; font-size: 20px; font-weight: bold; font-family: monospace;" id="successTime">
        14:35 hrs
    </div>
    <button onclick="cerrarSuccess()" style="background: white; color: #10B981; border: none; padding: 15px 40px; border-radius: 30px; font-size: 18px; font-weight: bold; margin-top: 50px;">Aceptar</button>
</div>
"""
if 'scannerModal' not in html:
    html = html.replace('</body>', modals_html + '\n</body>')

# 3. Update renderDeck button
old_btn = r'<a href="\$\{waUrl\}" target="_blank" rel="noopener" class="swipe-btn track-click" data-campid="\$\{camp\.id\}">\s*Activar código\s*<\/a>'
new_btn = """<button class="swipe-btn track-click" data-campid="${camp.id}" data-cajaid="${camp.caja_id || ''}" data-stock="${camp.stock || 0}" data-title="${camp.title}" style="border:none; width:100%;">
                        Generar y Escanear Cupón
                    </button>"""
html = re.sub(old_btn, new_btn, html)

# 4. Update the event listener for the button
old_listener = r"// Re-attach click listeners\s*document\.querySelectorAll\('\.track-click'\)\.forEach\(btn => \{\s*btn\.addEventListener\('click', \(e\) => \{\s*const cid = e\.target\.getAttribute\('data-campid'\);\s*try \{\s*db\.collection\('stats'\)\.doc\('global'\)\.update\(\{ clicks: firebase\.firestore\.FieldValue\.increment\(1\) \}\);\s*\} catch\(err\)\{\}\s*\}\);\s*\}\);"

new_listener = """// Re-attach click listeners para el Escáner O2O
        document.querySelectorAll('.track-click').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cid = e.target.getAttribute('data-campid');
                const cajaId = e.target.getAttribute('data-cajaid');
                const title = e.target.getAttribute('data-title');
                let stock = parseInt(e.target.getAttribute('data-stock'));
                
                if (stock <= 0) {
                    alert('Lo sentimos, los cupones para esta promoción se han agotado por hoy.');
                    return;
                }
                
                if (!cajaId) {
                    // Si el negocio no tiene cajaId configurado (Ej. promos viejas), comportarse como antes
                    alert('Este negocio aún no tiene activado el escáner QR en caja.');
                    return;
                }
                
                abrirScanner(cid, cajaId, title);
            });
        });"""
html = re.sub(old_listener, new_listener, html, flags=re.DOTALL)

# 5. Add Scanner JS Logic
scanner_js = """
let html5QrcodeScanner = null;

function abrirScanner(campId, expectedCajaId, title) {
    document.getElementById('scannerModal').style.display = 'flex';
    
    if (!html5QrcodeScanner) {
        html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: {width: 250, height: 250} }, false);
    }
    
    html5QrcodeScanner.render((decodedText, decodedResult) => {
        // Se detectó un QR
        console.log("QR Leido: ", decodedText);
        
        // Verificamos si el QR coincide con el esperado (o si contiene el id)
        if (decodedText.includes(expectedCajaId) || decodedText === expectedCajaId) {
            html5QrcodeScanner.clear();
            document.getElementById('scannerModal').style.display = 'none';
            quemarCupon(campId, title);
        } else {
            alert('Código incorrecto. Asegúrate de escanear el QR de la caja de este negocio.');
        }
    }, (error) => {
        // Ignoring scan errors, runs continuously
    });
}

function cerrarScanner() {
    document.getElementById('scannerModal').style.display = 'none';
    if (html5QrcodeScanner) {
        html5QrcodeScanner.clear();
    }
}

async function quemarCupon(campId, title) {
    try {
        // 1. Restar 1 al inventario
        await db.collection('campaigns').doc(campId).update({
            stock: firebase.firestore.FieldValue.increment(-1)
        });
        
        // 2. Registrar el ticket en la bóveda
        await db.collection('tickets').add({
            camp_id: campId,
            chofer: session ? session.chofer : 'DESCONOCIDO',
            status: 'quemado',
            fecha: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // 3. Sumar comisión al chofer (Ej. $5 pesos simulados)
        if (session && session.chofer) {
            await db.collection('drivers').doc(session.chofer).set({
                earnings: firebase.firestore.FieldValue.increment(5),
                redemptions: firebase.firestore.FieldValue.increment(1)
            }, {merge: true});
        }
        
        // Mostrar pantalla de éxito
        mostrarSuccess(title);
        
    } catch (error) {
        console.error("Error quemando cupón: ", error);
        alert('Hubo un error de conexión al validar el cupón.');
    }
}

function mostrarSuccess(title) {
    const modal = document.getElementById('successModal');
    document.getElementById('successRestaurante').innerText = title;
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) + ' hrs';
    document.getElementById('successTime').innerText = timeStr;
    
    modal.style.display = 'flex';
}

function cerrarSuccess() {
    document.getElementById('successModal').style.display = 'none';
}
"""

if 'html5QrcodeScanner' not in html:
    html = html.replace('</script>\n</body>', scanner_js + '\n</script>\n</body>')

html += f"<!-- v61 {time.time()} -->"
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
