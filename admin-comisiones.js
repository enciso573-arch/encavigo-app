(function () {
    'use strict';
    const C = window.EncaviComisiones;
    let carga = 0;
    const dinero = n => (n/100).toLocaleString('es-MX',{style:'currency',currency:'MXN'});
    const nodo = (tag,text) => { const el = document.createElement(tag); if(text != null) el.textContent = text; return el; };
    function tabla(id, filas) {
        const body = document.getElementById(id); body.replaceChildren();
        for (const valores of filas) {
            const tr = nodo('tr');
            valores.forEach(v => { const td = nodo('td',v); td.style.padding='10px'; tr.append(td); });
            body.append(tr);
        }
        if (!filas.length) { const tr=nodo('tr'), td=nodo('td','Sin canjes para este periodo.'); td.colSpan=4; tr.append(td); body.append(tr); }
    }
    async function accion(ticket,tipo,btn) {
        const textos = {cobro:'Referencia del cobro recibido del negocio',pago:'Referencia del pago entregado al chofer',aprobar:'Motivo para aprobar el canje',rechazar:'Motivo para rechazar el canje'};
        const ref = window.prompt(textos[tipo] + '. Esto registra un movimiento; no transfiere dinero.');
        if (ref === null) return;
        btn.disabled=true;
        try {
            const usuario=firebase.auth().currentUser;
            if (!usuario) throw new Error('Inicia sesión administradora.');
            await C.registrar(db,ticket.id,tipo,ref,usuario.uid,()=>firebase.firestore.FieldValue.serverTimestamp());
            await window.calcularCobros();
        } catch(e) { window.alert('No se registró el movimiento: '+e.message); btn.disabled=false; }
    }
    function boton(fila,t,tipo,texto) {
        const b=nodo('button',texto); b.type='button'; b.style.margin='6px';
        b.addEventListener('click',()=>accion(t,tipo,b)); fila.append(b);
    }
    window.calcularCobros = async function () {
        const turno=++carga;
        const tipo=document.getElementById('cobTipo').value;
        const campo=document.getElementById('cobMes');
        campo.type=tipo==='mes'?'month':'date'; campo.hidden=tipo==='todos';
        const hoy=new Date(), fechaLocal=[hoy.getFullYear(),String(hoy.getMonth()+1).padStart(2,'0'),String(hoy.getDate()).padStart(2,'0')].join('-');
        if (!campo.value) campo.value=tipo==='mes'?fechaLocal.slice(0,7):fechaLocal;
        const rango=C.periodo(tipo,campo.value);
        document.getElementById('cobPeriodo').textContent=rango.desde
            ? 'Canjes del '+rango.desde.toLocaleDateString('es-MX')+' al '+new Date(rango.hasta.getTime()-1).toLocaleDateString('es-MX')+'. Semana de lunes a domingo; no fija un día de pago.'
            : 'Todos los canjes, incluyendo pendientes de periodos anteriores.';
        document.getElementById('cobDetalle').textContent='Cargando…';
        document.getElementById('cobResumen').replaceChildren();
        tabla('cobNegocios',[]); tabla('cobChoferes',[]);
        try {
            // Lecturas completas para el primer piloto; los movimientos posteriores conservan el periodo del canje.
            const [ts,ms,os]=await Promise.all([db.collection('tickets').get(),db.collection('movimientos_comision').get(),db.collection('opiniones').get()]);
            if(turno!==carga)return;
            const tickets=[], movimientos=Object.create(null), opiniones=[];
            ts.forEach(d=>tickets.push({...d.data(),id:d.id})); ms.forEach(d=>{movimientos[d.id]=d.data();});
            os.forEach(d=>{const o={...d.data(),id:d.id}, f=o.fecha && o.fecha.toDate && o.fecha.toDate(); if(!rango.desde || (f>=rango.desde && f<rango.hasta))opiniones.push(o);});
            const r=C.resumen(tickets,movimientos,rango);
            window.quemadosPorChofer=Object.create(null);
            r.filas.forEach(({t})=>{window.quemadosPorChofer[t.chofer]=(window.quemadosPorChofer[t.chofer]||0)+1;});
            const resumen=document.getElementById('cobResumen'); resumen.replaceChildren();
            for(const [texto,monto] of [['Pendiente de cobrar',r.cobrar],['Pendiente de pagar',r.pagar],['Cobrado',r.cobrado],['Pagado al chofer',r.pagado],['Adelantado por recuperar',r.anticipado]]) {
                const box=nodo('div'); box.style.cssText='background:white;padding:16px;border:1px solid #E5E7EB;border-radius:12px';
                box.append(nodo('div',texto),nodo('strong',dinero(monto))); resumen.append(box);
            }
            tabla('cobNegocios',Object.values(r.negocios).map(n=>[n.nombre+' · '+n.id,n.n,dinero(n.total),dinero(n.pendiente)]));
            tabla('cobChoferes',Object.values(r.choferes).map(c=>[c.id,c.n,dinero(c.pendiente)]));
            const detalle=document.getElementById('cobDetalle'); detalle.replaceChildren();
            for(const {t,e} of r.filas) {
                const fila=nodo('div'); fila.style.cssText='padding:12px 0;border-bottom:1px solid #E5E7EB';
                const rev=movimientos[t.id+'_revision'];
                const estado=!e.valido?'Sin tarifa histórica: requiere revisión manual':e.rechazado?'Rechazado':!e.aprobado?'Por revisar: '+t.revisar:t.comision_centavos===0?'Sin comisión (cortesía)':
                    (e.cobrado?'Cobrado':'Por cobrar')+' · '+(e.pagado?'Pagado al chofer':'Por pagar al chofer')+(e.pagado&&!e.cobrado?' · Adelanto pendiente de recuperar':'');
                fila.append(nodo('strong',(t.negocio_nombre||t.negocio)+' · '+t.chofer),nodo('div',t.id+' · '+(e.valido?dinero(t.comision_centavos):'Importe no registrado')+' · '+estado));
                for(const sufijo of ['revision','cobro','pago']) {
                    const m=movimientos[t.id+'_'+sufijo];
                    if(m)fila.append(nodo('div',m.tipo+': '+m.referencia+' · '+(m.fecha&&m.fecha.toDate?m.fecha.toDate().toLocaleString('es-MX'):'')));
                }
                if(e.valido && t.revisar && !rev) {boton(fila,t,'aprobar','Aprobar canje');boton(fila,t,'rechazar','Rechazar canje');}
                if(e.aprobado && t.comision_centavos>0) {
                    if(!e.cobrado)boton(fila,t,'cobro','Registrar cobro recibido');
                    if(!e.pagado)boton(fila,t,'pago',e.cobrado?'Registrar pago al chofer':'Registrar adelanto al chofer');
                }
                detalle.append(fila);
            }
            if(!r.filas.length)detalle.textContent='Sin canjes para este periodo.';
            document.getElementById('cobRevisionCaja').style.display='none';
            renderOpinionesSeguras(document.getElementById('cobOpiniones'),opiniones,async(op,b)=>{
                if(!window.confirm('¿Ya atendiste esta opinión con el negocio?'))return;
                b.disabled=true;
                try{await db.collection('opiniones').doc(op.id).update({atendida:true});await window.calcularCobros();}
                catch(e){window.alert('No se marcó atendida: '+e.message);b.disabled=false;}
            });
        } catch(e) { if(turno===carga)document.getElementById('cobDetalle').textContent='No se pudo cargar: '+e.message; }
    };
})();
