// Importes históricos en centavos; la mensualidad de publicidad se administra aparte.
(function (root) {
    'use strict';
    const TARIFAS = [0, 25, 45, 80];
    function captura(campana) {
        if (!TARIFAS.includes(campana.tarifa)) throw new Error('La promoción necesita una tarifa acordada válida.');
        return { comision_centavos: campana.tarifa * 100, moneda: 'MXN', negocio_nombre: String(campana.title || campana.caja_id) };
    }
    function historicoValido(t) {
        return t.moneda === 'MXN' && [0,2500,4500,8000].includes(t.comision_centavos);
    }
    function fecha(valor) { return valor && typeof valor.toDate === 'function' ? valor.toDate() : new Date(valor); }
    function periodo(tipo, valor, ahora = new Date()) {
        if (tipo === 'todos') return { desde: null, hasta: null };
        if (tipo === 'mes') {
            const [a,m] = valor.split('-').map(Number);
            return { desde: new Date(a,m-1,1), hasta: new Date(a,m,1) };
        }
        const d = valor ? new Date(valor + 'T00:00:00') : new Date(ahora.getFullYear(),ahora.getMonth(),ahora.getDate());
        d.setDate(d.getDate() - (d.getDay()+6)%7);
        const hasta = new Date(d); hasta.setDate(hasta.getDate()+7);
        return { desde:d, hasta };
    }
    function estado(t, movimientos) {
        const revision = movimientos[t.id + '_revision'];
        const valido = historicoValido(t);
        const aprobado = valido && (!t.revisar || (revision && revision.tipo === 'aprobar')) && !(revision && revision.tipo === 'rechazar');
        return { valido, aprobado, rechazado: !!revision && revision.tipo === 'rechazar',
            cobrado: !!movimientos[t.id+'_cobro'], pagado: !!movimientos[t.id+'_pago'] };
    }
    function resumen(tickets, movimientos, rango) {
        const negocios = Object.create(null), choferes = Object.create(null), filas = [];
        let cobrar = 0, pagar = 0, cobrado = 0, pagado = 0, anticipado = 0;
        for (const t of tickets) {
            const f = fecha(t.fecha);
            if (rango.desde && !(f >= rango.desde && f < rango.hasta)) continue;
            const e = estado(t,movimientos); filas.push({t,e});
            if (!e.aprobado) continue;
            const monto = t.comision_centavos;
            const n = negocios[t.negocio] || (negocios[t.negocio] = {id:t.negocio,nombre:t.negocio_nombre || t.negocio,n:0,total:0,pendiente:0});
            const c = choferes[t.chofer] || (choferes[t.chofer] = {id:t.chofer,n:0,total:0,pendiente:0});
            n.n++; c.n++; n.total += monto; c.total += monto;
            if (e.cobrado) cobrado += monto; else { cobrar += monto; n.pendiente += monto; }
            if (e.pagado) pagado += monto; else { pagar += monto; c.pendiente += monto; }
            if (e.pagado && !e.cobrado) anticipado += monto;
        }
        return {negocios,choferes,filas,cobrar,pagar,cobrado,pagado,anticipado};
    }
    async function registrar(db, ticketId, tipo, referencia, uid, marcaServidor) {
        if (!['cobro','pago','aprobar','rechazar'].includes(tipo)) throw new Error('Movimiento inválido.');
        referencia = String(referencia || '').trim();
        if (!referencia || referencia.length > 200) throw new Error('Escribe una referencia o motivo de hasta 200 caracteres.');
        const revision = tipo === 'aprobar' || tipo === 'rechazar';
        const id = ticketId + '_' + (revision ? 'revision' : tipo);
        await db.runTransaction(async tx => {
            const tRef = db.collection('tickets').doc(ticketId);
            const rRef = db.collection('movimientos_comision').doc(ticketId+'_revision');
            const mRef = db.collection('movimientos_comision').doc(id);
            const tSnap = await tx.get(tRef), rSnap = await tx.get(rRef), mSnap = await tx.get(mRef);
            if (!tSnap.exists) throw new Error('El canje ya no existe.');
            if (mSnap.exists) throw new Error('Este movimiento ya fue registrado.');
            const t = {...tSnap.data(),id:ticketId};
            const e = estado(t, rSnap.exists ? {[ticketId+'_revision']:rSnap.data()} : {});
            if (!e.valido) throw new Error('Canje sin tarifa histórica: no se puede liquidar automáticamente.');
            if (revision ? !t.revisar : (!e.aprobado || t.comision_centavos <= 0)) throw new Error('Este canje no autoriza el movimiento solicitado.');
            tx.set(mRef,{ticket_id:ticketId,tipo,referencia,importe_centavos:revision ? 0 : t.comision_centavos,
                admin_uid:uid,fecha:marcaServidor()});
        });
    }
    const api = {captura,historicoValido,periodo,estado,resumen,registrar};
    root.EncaviComisiones = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
