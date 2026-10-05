/* Opiniones: todos los valores recibidos de Firestore se muestran como texto. */
function escaparTextoAdmin(valor) {
    return String(valor == null ? '' : valor).replace(/[&<>"']/g, c => ({
        '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
    }[c]));
}
function renderOpinionesSeguras(contenedor, opiniones, atender) {
    const doc = contenedor.ownerDocument;
    contenedor.replaceChildren();
    if (!opiniones.length) {
        const vacio = doc.createElement('p');
        vacio.textContent = 'Sin opiniones este mes.';
        contenedor.append(vacio);
        return;
    }
    for (const opinion of opiniones) {
        const fila = doc.createElement('div');
        fila.style.cssText = 'padding:12px 0;border-bottom:1px solid #F3F4F6';
        const encabezado = doc.createElement('div');
        encabezado.style.fontSize = '14px';
        const nombre = doc.createElement('strong');
        nombre.textContent = String(opinion.negocio || 'Negocio');
        const estrellas = Number.isInteger(opinion.estrellas) ? Math.max(0, Math.min(5, opinion.estrellas)) : 0;
        encabezado.append(nombre, ' · ' + '★'.repeat(estrellas) + '☆'.repeat(5 - estrellas));
        if (opinion.respetado === false) {
            const aviso = doc.createElement('span');
            aviso.style.cssText = 'color:#DC2626;font-weight:700';
            aviso.textContent = ' NO respetaron el cupón';
            encabezado.append(aviso);
        }
        fila.append(encabezado);
        if (opinion.comentario) {
            const comentario = doc.createElement('div');
            comentario.style.cssText = 'font-size:13px;color:#6B7280;margin-top:4px';
            comentario.textContent = '“' + String(opinion.comentario) + '”';
            fila.append(comentario);
        }
        if (opinion.atendida) {
            const estado=doc.createElement('p');estado.textContent='Atendida por administración';fila.append(estado);
        } else if (typeof atender === 'function') {
            const b=doc.createElement('button');b.textContent='Marcar atendida';b.type='button';b.onclick=()=>atender(opinion,b);fila.append(b);
        }
        contenedor.append(fila);
    }
}
if (typeof module !== 'undefined') module.exports = { renderOpinionesSeguras, escaparTextoAdmin };
