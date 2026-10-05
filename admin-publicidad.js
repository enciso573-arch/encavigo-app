(function(){
    'use strict';
    const nodo=(tag,text)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;return e;},el=id=>document.getElementById(id);
    const view=nodo('div');view.id='view-publicidad';view.style.display='none';
    view.innerHTML='<h1>Mensualidades de publicidad</h1><p class="ayuda">Esto registra acuerdos y pagos que ya recibiste. No cobra tarjetas, no emite facturas y no mezcla mensualidades con comisiones del chofer. Las promociones del mismo negocio comparten un solo acuerdo.</p><details class="guia"><summary>Ejemplo: primeros espacios gratuitos y primer negocio pagado</summary><p>Para un espacio gratuito elige Cortesía, importe 0. Cuando termine, cambia al plan y precio que el negocio aprobó. Ejemplo de Plan Local: $1,000 por mes; Campaña Municipal: $2,990. Son importes de publicidad; la tarifa por canje se configura en la promoción. Registrar pago recibido guarda un cobro completo por negocio y mes. No marques cobrado antes de recibir el dinero.</p></details><div class="form-group"><label>Negocio</label><select id="pubNegocio"></select></div><div class="form-group"><label>Plan acordado</label><select id="pubPlan"><option value="cortesia">Cortesía: publicidad gratuita</option><option value="local">Plan Local</option><option value="municipal">Campaña Municipal</option></select></div><div class="form-group"><label>Mensualidad acordada (MXN)</label><input id="pubImporte" type="number" min="0" step="0.01" placeholder="Ej. 1000, 2990 o 0 si es cortesía"></div><label><input id="pubActivo" type="checkbox" checked> Acuerdo activo</label><p><button class="btn-primary" id="pubGuardar">Guardar acuerdo</button></p><div class="form-group"><label>Mes cubierto por el cobro</label><input id="pubMes" type="month"></div><div class="form-group"><label>Referencia de dinero recibido</label><input id="pubReferencia" maxlength="200" placeholder="Ej. Transferencia del 5 de octubre, folio real del banco"></div><button class="btn-primary" id="pubCobrar">Registrar pago recibido</button><p id="pubEstado" role="status"></p><h2>Pagos de publicidad</h2><div class="data-section"><table><thead><tr><th>Negocio</th><th>Mes</th><th>Importe MXN</th><th>Referencia</th></tr></thead><tbody id="pubLista"></tbody></table></div>';
    document.querySelector('.main').append(view);
    const nav=nodo('div','Mensualidades');nav.id='nav-publicidad';nav.className='nav-item';nav.onclick=()=>switchTab('publicidad');document.querySelector('.nav-menu').append(nav);
    let contratos={},nombres=new Map(),carga=0;
    el('pubMes').value=new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Mexico_City'}).format(new Date()).slice(0,7);
    function seleccion(){const c=contratos[el('pubNegocio').value];el('pubPlan').value=c?.plan||'cortesia';el('pubImporte').value=c?c.importe_centavos/100:'';el('pubActivo').checked=c?.activo!==false;el('pubEstado').textContent=c?'Acuerdo cargado. Los cambios no alteran pagos anteriores.':'Sin acuerdo guardado. Completa el precio aprobado.';}
    window.cargarPublicidad=async function(){
        const turno=++carga;if(!EncaviOperacion.esAdmin(auth.currentUser))return;
        try{
            el('pubEstado').textContent='Cargando…';const [camp,cod,con,pag]=await Promise.all(['campaigns','codigos','contratos_publicidad','pagos_publicidad'].map(n=>db.collection(n).get()));
            if(turno!==carga||!EncaviOperacion.esAdmin(auth.currentUser))return;
            nombres=new Map();cod.docs.forEach(d=>{if(d.data().tipo==='caja')nombres.set(d.id,d.data().titular);});camp.docs.forEach(d=>{const c=d.data();nombres.set(c.caja_id||d.id,c.title);});
            contratos=Object.fromEntries(con.docs.map(d=>[d.id,d.data()]));for(const [id,c] of Object.entries(contratos))if(!nombres.has(id))nombres.set(id,c.nombre);
            const prev=el('pubNegocio').value;el('pubNegocio').replaceChildren();for(const [id,nombre] of nombres){const o=nodo('option',nombre+' · '+id);o.value=id;el('pubNegocio').append(o);}if(nombres.has(prev))el('pubNegocio').value=prev;
            seleccion();el('pubLista').replaceChildren();
            for(const d of pag.docs.sort((a,b)=>b.data().periodo.localeCompare(a.data().periodo))){const p=d.data(),tr=nodo('tr');for(const v of [p.nombre,p.periodo,(p.importe_centavos/100).toLocaleString('es-MX',{style:'currency',currency:'MXN'}),p.referencia])tr.append(nodo('td',v));el('pubLista').append(tr);}
            if(!pag.size){const tr=nodo('tr'),td=nodo('td','Aún no hay pagos de publicidad registrados.');td.colSpan=4;tr.append(td);el('pubLista').append(tr);}
            if(!nombres.size)el('pubEstado').textContent='Registra primero el negocio y su promoción. Aquí no se crean ejemplos reales.';
            el('pubGuardar').disabled=el('pubCobrar').disabled=!nombres.size;
        }catch(e){el('pubEstado').textContent='No se pudo cargar: '+e.message;}
    };
    el('pubNegocio').onchange=seleccion;
    el('pubPlan').onchange=()=>{if(el('pubPlan').value==='cortesia')el('pubImporte').value=0;};
    async function accion(boton,fn){el(boton).disabled=true;try{if(!EncaviOperacion.esAdmin(auth.currentUser))throw Error('Inicia sesión administradora.');await fn();await cargarPublicidad();el('pubEstado').textContent='Registro guardado.';}catch(e){el('pubEstado').textContent=e.message;}finally{el(boton).disabled=false;}}
    el('pubGuardar').onclick=()=>accion('pubGuardar',async()=>{const id=el('pubNegocio').value;if(!nombres.has(id))throw Error('Selecciona un negocio registrado.');const c=EncaviPublicidad.contrato({nombre:nombres.get(id),importe:el('pubImporte').value,plan:el('pubPlan').value,activo:el('pubActivo').checked});await db.collection('contratos_publicidad').doc(id).set(c);});
    el('pubCobrar').onclick=()=>accion('pubCobrar',()=>EncaviPublicidad.cobrar(db,el('pubNegocio').value,el('pubMes').value,el('pubReferencia').value,auth.currentUser.uid,()=>firebase.firestore.FieldValue.serverTimestamp()));
})();
