(function(root){
    'use strict';
    const ADMIN_UID='ZS4cI7hnMXVPpCaQECFg208TLbL2';
    function esAdmin(user){return !!user && user.uid===ADMIN_UID;}
    function enlace(valor){
        if(!valor)return '';
        const u=new URL(valor,'https://encavigo.com/');
        if(u.protocol!=='https:' || u.username || u.password)throw Error('Usa un enlace HTTPS completo, sin usuario ni contraseña.');
        return u.href.replace(/["'()<>]/g,c=>'%'+c.charCodeAt(0).toString(16).toUpperCase());
    }
    function texto(v,max,nombre){v=String(v||'').trim();if(!v || v.length>max)throw Error(nombre+': escribe entre 1 y '+max+' caracteres.');return v;}
    function promocion(v){
        const tipo=v.tipo_campana==='municipal'?'municipal':'local';
        const title=texto(v.title,100,'Nombre del negocio'),desc=texto(v.desc,600,'Promoción y condiciones');
        const lat=v.lat===''?NaN:Number(v.lat),lng=v.lng===''?NaN:Number(v.lng);
        if(!Number.isFinite(lat)||Math.abs(lat)>90||!Number.isFinite(lng)||Math.abs(lng)>180)throw Error('Selecciona la ubicación exacta del negocio en el mapa.');
        const stock=Number(v.stock),tarifa=Number(v.tarifa);
        if(tipo==='local' && (v.stock==null||String(v.stock).trim()===''||!Number.isSafeInteger(stock)||stock<0))throw Error('Los cupones deben ser un número entero igual o mayor que cero.');
        if(tipo==='local' && ![0,25,45,80].includes(tarifa))throw Error('Selecciona la tarifa acordada: $0, $25, $45 o $80.');
        if(tipo==='local' && !/^[A-Za-z0-9_-]{1,80}$/.test(v.caja_id||''))throw Error('Selecciona un código de caja activo; puedes generarlo aquí mismo.');
        const startDate=v.startDate||null,endDate=v.endDate||null;
        for(const f of [startDate,endDate])if(f && (!/^\d{4}-\d{2}-\d{2}$/.test(f)||new Date(f+'T00:00:00Z').toISOString().slice(0,10)!==f))throw Error('La fecha no es válida.');
        if(startDate&&endDate&&startDate>endDate)throw Error('La fecha final debe ser igual o posterior a la inicial.');
        if(tipo==='municipal' && (!startDate||!endDate||(Date.parse(endDate)-Date.parse(startDate))>=30*86400000))throw Error('La Campaña Municipal necesita inicio y fin, con máximo 30 días incluyendo ambos.');
        if(tipo==='municipal' && !['vallarta','bahia'].includes(v.municipio))throw Error('Selecciona el municipio contratado para la campaña.');
        const dias=[...new Set(v.dias||[])].sort();if(dias.some(d=>!Number.isInteger(d)||d<0||d>6))throw Error('Selecciona días válidos.');
        return {title,desc,img:enlace(v.img||'/logo_jackpot.jpg'),badge:String(v.badge||'').trim().slice(0,80),lat,lng,
            stock:tipo==='municipal'?0:stock,tarifa:tipo==='municipal'?0:tarifa,caja_id:tipo==='municipal'?'':v.caja_id,
            tipo_campana:tipo,action_url:tipo==='municipal'?enlace(texto(v.action_url,1000,'Enlace de contacto')):'',
            municipio:tipo==='municipal'?v.municipio:null,
            dias,startDate,endDate,desde_ms:startDate?Date.parse(startDate+'T00:00:00-06:00'):null,
            hasta_ms:endDate?Date.parse(endDate+'T00:00:00-06:00')+86400000:null,active:v.active!==false};
    }
    async function guardarPromocion(db,id,datos,stockOriginal,marcaServidor,evaluacion){
        const calculadora=root.EncaviCalculadora||(typeof require==='function'?require('./calculadora-promociones'):null);
        if(datos.tipo_campana!=='municipal'&&(datos.active||evaluacion))calculadora.validar(evaluacion,datos);
        const ref=db.collection('campaigns').doc(id||undefined);
        await db.runTransaction(async tx=>{
            const previa=id?await tx.get(ref):null;
            if(id&&!previa.exists)throw Error('La promoción ya no existe.');
            if(datos.tipo_campana!=='municipal'){
                const caja=await tx.get(db.collection('codigos').doc(datos.caja_id));
                if(!caja.exists || caja.data().tipo!=='caja' || caja.data().estado!=='activo')throw Error('El código de caja no está activo.');
            }
            const salida={...datos};
            if(id && datos.stock===stockOriginal && datos.tipo_campana!=='municipal')salida.stock=previa.data().stock;
            if(salida.tipo_campana!=='municipal'&&(salida.active||evaluacion)){
                calculadora.validar(evaluacion,salida);
                tx.set(db.collection('evaluaciones_promocion').doc(ref.id),{...evaluacion,fecha:marcaServidor()});
            }
            if(id)tx.update(ref,salida);else tx.set(ref,{...salida,clicks:0,createdAt:marcaServidor()});
        });return ref.id;
    }
    async function registrarCodigo(db,codigo,datos,marcaServidor){
        if(!/^[A-Za-z0-9_-]{1,80}$/.test(codigo))throw Error('Código QR inválido.');
        if(!['vehiculo','caja','calcomania'].includes(datos.tipo))throw Error('Tipo de QR inválido.');
        if(datos.tipo==='vehiculo'&&!['vallarta','bahia'].includes(datos.zona))throw Error('Selecciona el municipio de operación del vehículo.');
        const titular=texto(datos.titular,120,'Titular');
        const tel=String(datos.tel||'').trim();if(tel && !/^[+\d ()-]{7,25}$/.test(tel))throw Error('Revisa el teléfono: usa números, lada y hasta 25 caracteres.');
        const ref=db.collection('codigos').doc(codigo);
        await db.runTransaction(async tx=>{
            if((await tx.get(ref)).exists)throw Error('Ese código ya existe. Genera otro.');
            tx.set(ref,{tipo:datos.tipo,titular,tel:tel||null,nota:String(datos.nota||'').trim().slice(0,200)||null,
                estado:'activo',escaneos:0,zona:datos.tipo==='vehiculo'?datos.zona:null,creado:marcaServidor()});
            if(datos.tipo==='vehiculo')tx.set(db.collection('choferes').doc(codigo),{scans:0,clicks:0,activo:true,zona:datos.zona});
        });
    }
    async function estadoCodigo(db,codigo,activo,motivo,marcaServidor){
        const batch=db.batch();batch.update(db.collection('codigos').doc(codigo),{estado:activo?'activo':'baja',motivo_baja:activo?null:motivo,baja_fecha:marcaServidor()});
        if(activo)batch.delete(db.collection('bajas').doc(codigo));else batch.set(db.collection('bajas').doc(codigo),{fecha:marcaServidor()});
        const c=await db.collection('codigos').doc(codigo).get();
        if(c.exists && c.data().tipo==='vehiculo')batch.set(db.collection('choferes').doc(codigo),{activo},{merge:true});
        await batch.commit();
    }
    function margen({precio,costo,comision,descuento}){
        if([precio,costo,comision,descuento].some(n=>!Number.isFinite(n)||n<0)||descuento>100||precio<=0)throw Error('Escribe precio y costos válidos; descuento de 0 a 100%.');
        const venta=precio*(1-descuento/100),contribucion=venta-costo-comision;
        return {venta,contribucion,maxDescuento:Math.max(0,Math.min(100,(1-(costo+comision)/precio)*100))};
    }
    function propuestas({precio,costo,comision,margenMinimo,canjes}){
        if(!Number.isSafeInteger(canjes)||canjes<1||!Number.isFinite(margenMinimo)||margenMinimo<0)throw Error('Escribe un margen mínimo y un límite entero de canjes aprobados.');
        margen({precio,costo,comision,descuento:0});
        const maximo=Math.min(100,(1-(costo+comision+margenMinimo)/precio)*100);
        if(maximo<=0)throw Error('Con estos costos y el margen mínimo no cabe un descuento. Revisa los costos o considera un complemento cuyo costo puedas cubrir.');
        return [{nombre:'Segura',descuento:Math.min(10,maximo/2),condicion:'Días aprobados por el negocio'},
            {nombre:'Agresiva',descuento:Math.min(30,maximo),condicion:'Un canje por código; inventario limitado'},
            {nombre:'Horario de baja demanda',descuento:Math.min(20,maximo),condicion:'Especificar el horario en las condiciones y acordarlo antes de publicar'}]
            .map(p=>({...p,...margen({precio,costo,comision,descuento:p.descuento}),canjes,costoMaximoPromocion:(precio*(p.descuento/100)+comision)*canjes}));
    }
    function datosReporte(campanas,tickets,clicks,scans){
        const reporte=new Map(),drivers=new Map();
        for(const c of campanas)reporte.set(c.id,{id:c.id,nombre:c.title,caja:c.caja_id,canjes:0,clicks:0,stock:c.stock,tarifa:c.tarifa});
        for(const t of tickets){const r=reporte.get(t.camp_id);if(r)r.canjes++;}
        for(const c of clicks){const r=reporte.get(c.camp_id);if(r)r.clicks++;const d=drivers.get(c.chofer)||{scans:0,clicks:0};d.clicks++;drivers.set(c.chofer,d);}
        for(const s of scans){const d=drivers.get(s.chofer)||{scans:0,clicks:0};d.scans++;drivers.set(s.chofer,d);}
        return {negocios:[...reporte.values()],drivers};
    }
    const api={esAdmin,enlace,promocion,guardarPromocion,registrarCodigo,estadoCodigo,margen,propuestas,datosReporte};root.EncaviOperacion=api;
    if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
