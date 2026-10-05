(function(root){
    'use strict';
    function contrato(v){
        const nombre=String(v.nombre||'').trim(),importe=Number(v.importe),plan=v.plan;
        if(!nombre||nombre.length>120)throw Error('Escribe el nombre del negocio (máximo 120 caracteres).');
        if(v.importe===''||!Number.isFinite(importe)||importe<0||Math.abs(Math.round(importe*100)-importe*100)>0.000001||importe>100000)throw Error('Escribe el importe mensual acordado, con hasta dos decimales.');
        if(!['local','municipal','cortesia'].includes(plan))throw Error('Elige el plan.');
        if(plan==='cortesia'&&importe!==0)throw Error('La publicidad de cortesía lleva mensualidad $0; la comisión se configura aparte en la promoción.');
        return {nombre,importe_centavos:Math.round(importe*100),plan,activo:v.activo!==false};
    }
    async function cobrar(db,negocio,periodo,referencia,uid,marcaServidor){
        if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(periodo))throw Error('Selecciona el mes cubierto por el pago.');
        referencia=String(referencia||'').trim();if(!referencia||referencia.length>200)throw Error('Escribe una referencia del pago recibido (máximo 200 caracteres).');
        const ref=db.collection('pagos_publicidad').doc(negocio+'_'+periodo);
        await db.runTransaction(async tx=>{
            const c=await tx.get(db.collection('contratos_publicidad').doc(negocio)),p=await tx.get(ref);
            if(!c.exists||!c.data().activo||!Number.isSafeInteger(c.data().importe_centavos)||c.data().importe_centavos<=0)throw Error('El acuerdo debe estar activo y tener mensualidad mayor que cero.');
            if(p.exists)throw Error('Ese negocio ya tiene el pago de este mes registrado.');
            tx.set(ref,{negocio,periodo,referencia,importe_centavos:c.data().importe_centavos,nombre:c.data().nombre,plan:c.data().plan,admin_uid:uid,fecha:marcaServidor()});
        });
    }
    const api={contrato,cobrar};root.EncaviPublicidad=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
