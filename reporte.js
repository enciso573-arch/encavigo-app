(function(){
    'use strict';
    firebase.initializeApp({apiKey:'AIzaSyBS87d1Dv9nx6Yg_dqq-E3x9GI4gpSA7ps',authDomain:'encavi-go.firebaseapp.com',projectId:'encavi-go',appId:'1:1073579842188:web:0b415778424a7bce5639a9'});
    const db=firebase.firestore(),auth=firebase.auth(),C=EncaviComisiones;
    const el=id=>document.getElementById(id),pesos=n=>(n/100).toLocaleString('es-MX',{style:'currency',currency:'MXN'});
    const fecha=t=>t&&typeof t.toDate==='function'?t.toDate():new Date(t);
    const fechaTexto=t=>fecha(t).toLocaleString('es-MX',{timeZone:'America/Mexico_City'});
    const negocio=c=>c.caja_id||c.id;
    let datos=null,csvFilas=[],carga=0;
    function tabla(id,filas,columnas){el(id).replaceChildren();for(const fila of filas){const tr=document.createElement('tr');for(const valor of fila){const td=document.createElement('td');td.textContent=valor;tr.append(td);}el(id).append(tr);}if(!filas.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=columnas;td.textContent='Sin registros en este periodo.';tr.append(td);el(id).append(tr);}}
    function pintar(){
        if(!datos||!EncaviOperacion.esAdmin(auth.currentUser))return;
        const key=el('negocio').value,mes=el('mes').value;
        if(!/^\d{4}-\d{2}$/.test(mes)){el('estado').textContent='Selecciona un mes válido.';return;}
        const inicio=new Date(mes+'-01T00:00:00-06:00'),[a,m]=mes.split('-').map(Number),siguiente=new Date(Date.UTC(a,m,1,6));
        const delMes=x=>fecha(x.fecha)>=inicio && fecha(x.fecha)<siguiente;
        const camp=datos.campaigns.filter(c=>negocio(c)===key),ids=new Set(camp.map(c=>c.id));
        const tickets=datos.tickets.filter(t=>(t.negocio===key||ids.has(t.camp_id))&&delMes(t)),clicks=datos.click_log.filter(c=>ids.has(c.camp_id)&&delMes(c));
        const resumen=C.resumen(tickets,datos.movimientos,{desde:inicio,hasta:siguiente});
        el('titulo').textContent=camp[0]?.title||tickets[0]?.negocio_nombre||key;el('periodo').textContent='Mes: '+mes+' · corte horario de Puerto Vallarta (UTC-6)';
        el('clicks').textContent=clicks.length;el('canjes').textContent=tickets.length;el('comision').textContent=pesos(resumen.cobrado+resumen.cobrar);el('cobros').textContent=pesos(resumen.cobrado);
        const revision=resumen.filas.filter(f=>!f.e.aprobado&&!f.e.rechazado).length;
        el('pendientes').textContent='Por cobrar de los canjes aprobados: '+pesos(resumen.cobrar)+'. Pendientes de revisión: '+revision+'.';
        tabla('promos',camp.map(c=>[c.desc,c.active===false?'Pausada':'Publicada',c.tipo_campana==='municipal'?'No aplica':c.stock,clicks.filter(k=>k.camp_id===c.id).length,tickets.filter(t=>t.camp_id===c.id).length]),5);
        csvFilas=resumen.filas.map(({t,e})=>[fechaTexto(t.fecha),camp.find(c=>c.id===t.camp_id)?.desc||t.camp_id,pesos(t.comision_centavos||0),e.rechazado?'Rechazado':e.aprobado?'Aprobado':'Por revisar',e.cobrado?'Recibido':'Pendiente']);
        tabla('detalle',csvFilas,5);el('opiniones').replaceChildren();
        const ops=datos.opiniones.filter(o=>(ids.has(o.camp_id)||tickets.some(t=>t.id===o.id))&&delMes(o));
        for(const op of ops){const p=document.createElement('p');p.textContent=fechaTexto(op.fecha)+' · '+(op.respetado?'Promoción respetada':'Reportó un problema')+' · '+op.estrellas+'/5 · '+op.comentario+(op.atendida?' · Atendida':'');el('opiniones').append(p);}
        if(!ops.length)el('opiniones').textContent='Sin opiniones registradas este mes.';
        el('estado').textContent='Datos cargados. Actualizado: '+new Date().toLocaleString('es-MX',{timeZone:'America/Mexico_City'});for(const id of ['imprimir','csv'])el(id).disabled=!key;
    }
    async function cargar(){
        const turno=++carga;if(!EncaviOperacion.esAdmin(auth.currentUser))return;el('estado').textContent='Cargando registros…';el('actualizar').disabled=true;
        try{const nombres=['campaigns','tickets','click_log','opiniones','movimientos_comision'],snaps=await Promise.all(nombres.map(n=>db.collection(n).get()));
            if(turno!==carga||!EncaviOperacion.esAdmin(auth.currentUser))return;
            datos=Object.fromEntries(snaps.map((s,i)=>[nombres[i],s.docs.map(d=>({...d.data(),id:d.id}))]));datos.movimientos=Object.fromEntries(datos.movimientos_comision.map(m=>[m.id,m]));
            const prev=el('negocio').value;el('negocio').replaceChildren();const negocios=new Map(datos.campaigns.map(c=>[negocio(c),c.title]));for(const t of datos.tickets)if(!negocios.has(t.negocio))negocios.set(t.negocio,t.negocio_nombre||t.negocio);
            for(const [key,nombre] of negocios){const o=document.createElement('option');o.value=key;o.textContent=nombre+' · '+key;el('negocio').append(o);}if(negocios.has(prev))el('negocio').value=prev;
            if(!negocios.size){el('estado').textContent='Aún no hay negocios. Da de alta el primero en el panel; aquí aparecerán sus registros.';el('imprimir').disabled=el('csv').disabled=true;return;}pintar();
        }catch(e){el('estado').textContent='No se pudo cargar el reporte: '+e.message;}finally{el('actualizar').disabled=false;}
    }
    el('mes').value=new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Mexico_City'}).format(new Date()).slice(0,7);el('actualizar').onclick=cargar;el('negocio').onchange=pintar;el('mes').onchange=pintar;el('imprimir').onclick=()=>window.print();
    el('csv').onclick=()=>{const seguro=v=>'"'+(/^[=+@-]/.test(String(v))?"'":'')+String(v).replace(/"/g,'""')+'"';const contenido='\uFEFF'+[['Fecha','Promoción','Comisión MXN','Revisión','Cobro'],...csvFilas].map(f=>f.map(seguro).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([contenido],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='encavigo-'+el('negocio').value+'-'+el('mes').value+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
    auth.onAuthStateChanged(user=>{++carga;datos=null;el('contenido').hidden=!EncaviOperacion.esAdmin(user);if(EncaviOperacion.esAdmin(user))cargar();else{el('estado').textContent='Inicia sesión con tu cuenta administradora en el panel para ver el reporte.';el('detalle').replaceChildren();el('opiniones').replaceChildren();}});
})();
