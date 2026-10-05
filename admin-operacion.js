/* Ayuda permanente y operación del panel. Los ejemplos nunca escriben datos. */
function ajustarPlan(){
    const municipal=document.getElementById('cPlan').value==='municipal';
    document.getElementById('grupoAction').hidden=!municipal;
    document.getElementById('grupoMunicipio').hidden=!municipal;
    for(const id of ['cStock','cTarifa','cCaja'])document.getElementById(id).disabled=municipal;
}
let refrescoChofer=0;
async function refrescarChoferes(){
    if(!EncaviOperacion.esAdmin(auth.currentUser))return;
    const turno=++refrescoChofer;
    try{
        const [cod,sc,cl,tk]=await Promise.all(['codigos','scan_log','click_log','tickets'].map(c=>db.collection(c).get()));
        if(turno!==refrescoChofer || !EncaviOperacion.esAdmin(auth.currentUser))return;
        const datos=s=>s.docs.map(d=>({...d.data(),id:d.id}));
        window.clicksPorCampana={};datos(cl).forEach(c=>window.clicksPorCampana[c.camp_id]=(window.clicksPorCampana[c.camp_id]||0)+1);
        window.scansPorCodigo={};datos(sc).forEach(s=>window.scansPorCodigo[s.chofer]=(window.scansPorCodigo[s.chofer]||0)+1);
        if(window.panelCampanas)pintarCampanas(window.panelCampanas);
        pintarAnaliticas(datos(sc),datos(cl),datos(tk));
        const r=EncaviOperacion.datosReporte([],datos(tk),datos(cl),datos(sc));
        const quemados=new Map();datos(tk).forEach(t=>quemados.set(t.chofer,(quemados.get(t.chofer)||0)+1));
        const body=document.getElementById('choferes-tbody');body.replaceChildren();
        let top=null;
        for(const c of datos(cod).filter(c=>c.tipo==='vehiculo')){
            const d=r.drivers.get(c.id)||{scans:0,clicks:0};
            if(!top || d.scans>top.scans)top={nombre:c.titular,scans:d.scans};
            const tr=document.createElement('tr');
            for(const v of [c.titular+' · '+c.id,d.scans,d.clicks,quemados.get(c.id)||0,c.estado==='activo'?'Activo':'De baja']){
                const td=document.createElement('td');td.textContent=v;tr.append(td);
            }body.append(tr);
        }
        if(!body.children.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=5;td.textContent='Aún no hay choferes. Registra el primero en Códigos QR → Acrílico de vehículo.';tr.append(td);body.append(tr);}
        document.getElementById('val-top-chofer').textContent=top?top.nombre:'Sin choferes';
        document.getElementById('val-top-scans').textContent=top?top.scans+' escaneos registrados':'Da de alta tu primera unidad';
    }catch(e){console.error('No se cargaron los choferes',e);}
}
function pintarCampanas(snapshot){
    const body=document.querySelector('#view-dashboard tbody');body.replaceChildren();
    for(const doc of snapshot.docs){const c=doc.data(),tr=document.createElement('tr');
        for(const v of [c.title+' · '+(c.badge||'Promoción'),(window.clicksPorCampana?.[doc.id]||0)+' interacciones',diasTexto(c.dias),c.active===false?'Pausada':saleHoy(c)?c.tipo_campana==='municipal'?'Contacto activo':c.stock>0?'Disponible hoy':'Agotada':'Programada / fuera de vigencia']){const td=document.createElement('td');td.textContent=v;tr.append(td);}
        const td=document.createElement('td');for(const [text,fn] of [['Editar',editarCampana],['Copiar oferta',duplicarCampana],['Eliminar',deleteCampaign]]){const b=document.createElement('button');b.className='action-icon';b.textContent=text;b.onclick=()=>fn(doc.id);td.append(b);}tr.append(td);body.append(tr);
    }
    if(!snapshot.size){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=5;td.textContent='Aún no hay promociones. Pulsa Nuevo Negocio para registrar la primera.';tr.append(td);body.append(tr);}
}
function pintarAnaliticas(scans,clicks,tickets){
    const body=document.getElementById('anaDias');if(!body)return;body.replaceChildren();
    const local=t=>{const d=t?.toDate?t.toDate():new Date(t);return isNaN(d)?'':new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Mexico_City'}).format(d);};
    const dias=new Set([...scans,...clicks,...tickets].map(d=>local(d.fecha)).filter(Boolean));
    for(const dia of [...dias].sort().reverse().slice(0,31)){const tr=document.createElement('tr');for(const v of [dia,scans.filter(s=>local(s.fecha)===dia).length,clicks.filter(s=>local(s.fecha)===dia).length,tickets.filter(s=>local(s.fecha)===dia).length]){const td=document.createElement('td');td.textContent=v;tr.append(td);}body.append(tr);}
    if(!dias.size){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=4;td.textContent='Las métricas aparecerán cuando se use el primer QR real.';tr.append(td);body.append(tr);}
}
(function(){
    const guia=document.createElement('details');guia.className='guia';
    guia.innerHTML='<summary>Cómo empezar: chofer, negocio y primer canje</summary><ol><li>En Códigos QR elige Acrílico de vehículo. Ejemplo: base CENTRO, titular Juan Ejemplo, unidad 12. Genera el código y usa Acrílico para imprimirlo. El teléfono es opcional y privado.</li><li>En Nuevo Negocio construye la oferta con los costos y el precio habitual del negocio, calcula y confirma el acuerdo antes de publicar. Para Plan Local genera el QR de caja; las promociones del mismo negocio deben compartirlo. Programa fechas, días, stock y tarifa.</li><li>Imprime el QR de caja y déjalo en el mostrador. El pasajero escanea el QR del vehículo; al llegar al negocio abre su tarjeta y escanea el código de caja para canjear.</li><li>Revisa los canjes en Comisiones y pagos. Aprueba los marcados solo después de confirmarlos; registra cobros recibidos y pagos realmente entregados.</li><li>Usa el <a href="dashboard.html">reporte del negocio</a> para elegir el negocio, mes e imprimir sus resultados reales. El viaje gratis sigue desactivado hasta configurar una campaña financiada.</li></ol><p>Esta guía no crea choferes, negocios ni movimientos. El catálogo DEMO usa datos locales de ejemplo.</p>';
    document.getElementById('view-dashboard').insertBefore(guia,document.querySelector('.metrics'));
    const ayudas={codPrefijo:'Ejemplo: CENTRO identifica tu base; para caja, FONDA identifica al negocio. El sistema agrega una terminación única.',codTitular:'Vehículo: nombre real del chofer. Caja o calcomanía: nombre comercial del negocio.',codTel:'Ejemplo de formato: 322 000 0000. Guarda aquí el teléfono real solo si lo necesitas; no aparece en el catálogo público.',codNota:'Vehículo: Unidad 12 o placas. Negocio: Calle Ejemplo 123, colonia Centro.'};
    for(const [id,txt] of Object.entries(ayudas)){const p=document.createElement('p');p.className='ayuda';p.id=id+'Ayuda';p.textContent=txt;document.getElementById(id).after(p);document.getElementById(id).setAttribute('aria-describedby',p.id);}
    const entrada=document.createElement('div');entrada.id='calculadoraEntrada';document.getElementById('view-dashboard').append(entrada);
    ajustarPlan();
    const zona=document.createElement('div');zona.className='form-group';zona.id='grupoZona';zona.innerHTML='<label for="codZona">Municipio de operación</label><select id="codZona"><option value="">Elige dónde circulará</option><option value="vallarta">Puerto Vallarta</option><option value="bahia">Bahía de Banderas</option></select><p class="ayuda">Ejemplo: Puerto Vallarta si la unidad opera ahí. Determina las campañas municipales que verá el pasajero; no rastrea recorridos.</p>';
    document.getElementById('codTipo').parentElement.after(zona);
    const camposAnteriores=codPintarCampos;window.codPintarCampos=function(){camposAnteriores();zona.hidden=document.getElementById('codTipo').value!=='vehiculo';};codPintarCampos();
    for(const input of document.querySelectorAll('.form-group input,.form-group select,.form-group textarea')){const label=input.parentElement.querySelector('label');if(label&&input.id)label.htmlFor=input.id;}
})();
