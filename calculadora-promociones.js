(function(root){
    'use strict';
    const CAMPOS=['title','desc','img','badge','lat','lng','caja_id','tarifa','dias','startDate','endDate','desde_ms','hasta_ms'];
    function publicacion(c){return Object.fromEntries(CAMPOS.map(k=>[k,c[k]??(['title','desc','img','badge','caja_id'].includes(k)?'':k==='dias'?[]:null)]));}
    function centavos(v,nombre){
        const s=String(v??'').trim();
        if(!/^\d+(\.\d{1,2})?$/.test(s))throw Error(nombre+': escribe un importe con hasta dos decimales; usa 0 si no aplica.');
        const n=Math.round(Number(s)*100);if(!Number.isSafeInteger(n)||n>10000000)throw Error(nombre+': importe fuera de rango.');return n;
    }
    function texto(v,nombre,max){const s=String(v??'').trim();if(!s||s.length>max)throw Error(nombre+': escribe entre 1 y '+max+' caracteres.');return s;}
    function calcular(v){
        if(!['descuento','complemento','paquete'].includes(v.tipo))throw Error('Elige descuento, complemento o paquete.');
        const d={...v};
        for(const k of ['precio_habitual','precio_oferta','costo_base','costo_extra','costo_trabajo','empaque','valor_extra','comision','minimo']){
            if(!Number.isSafeInteger(d[k])||d[k]<0||d[k]>10000000)throw Error('Completa los importes del cálculo.');
        }
        if(d.precio_habitual<=0||d.precio_oferta<=0||d.minimo<=0)throw Error('Precio habitual, precio de oferta y contribución mínima deben ser mayores que cero.');
        if(![0,2500,4500,8000].includes(d.comision))throw Error('La comisión debe coincidir con la tarifa acordada.');
        if(d.precio_oferta>d.precio_habitual)throw Error('La oferta no puede aumentar el precio habitual de referencia.');
        if(d.tipo!=='complemento'&&d.valor_extra!==0)throw Error('Para descuento o paquete, el precio habitual ya debe incluir todos sus componentes; valor extra debe ser 0.');
        if(d.tipo==='complemento'&&d.valor_extra<=0)throw Error('Indica el valor habitual del complemento que no estaba incluido.');
        if(!Number.isSafeInteger(d.canjes)||d.canjes<1||d.canjes>1000000)throw Error('Indica un límite entero de canjes autorizado por el negocio.');
        const ahorro=d.precio_habitual-d.precio_oferta+d.valor_extra;
        const contribucion=d.precio_oferta-d.costo_base-d.costo_extra-d.costo_trabajo-d.empaque-d.comision;
        if(ahorro<=0)throw Error('La oferta necesita un ahorro o complemento adicional real para el cliente.');
        if(contribucion<d.minimo)throw Error('La oferta conserva $'+(contribucion/100).toFixed(2)+' por canje, por debajo del mínimo acordado. Revisa precio, costos o beneficio.');
        return {ahorro,contribucion,desembolso:d.costo_extra+d.comision+(d.precio_habitual-d.precio_oferta),limite:d.canjes};
    }
    function validar(f,c){
        if(!f||f.version!==1||f.confirmado!==true)throw Error('Antes de publicar, calcula la oferta y confirma el acuerdo con el negocio.');
        texto(f.referencia,'Producto o servicio habitual y qué incluye',600);texto(f.beneficio,'Beneficio exclusivo y motivo de visita',600);texto(f.aprobador,'Persona que aprobó la oferta',120);
        const r=calcular(f.numeros);
        if(f.numeros.comision!==c.tarifa*100)throw Error('Cambió la comisión: vuelve a calcular y aprobar la oferta.');
        if(c.stock>f.numeros.canjes)throw Error('El inventario supera los canjes autorizados en el cálculo.');
        if(JSON.stringify(f.publicacion)!==JSON.stringify(publicacion(c)))throw Error('Cambió la promoción o sus condiciones: vuelve a calcular y confirmar el acuerdo.');
        if(f.resultado?.ahorro!==r.ahorro||f.resultado?.contribucion!==r.contribucion)throw Error('El resultado no coincide con los datos del cálculo.');
        return r;
    }
    function alternativas(v){
        // Explora únicamente los costos y el complemento que proporcionó el negocio.
        // Solo se quita el costo del añadido si se explora la compra base sin ese añadido.
        const extraDescuento=v.tipo==='complemento'?0:v.costo_extra;
        const piso=v.costo_base+v.costo_trabajo+v.empaque+v.comision+v.minimo+extraDescuento;
        const maxDescuento=v.precio_habitual-piso;
        if(!Number.isSafeInteger(maxDescuento))throw Error('Completa los importes antes de explorar alternativas.');
        const opciones=[['Descuento moderado',Math.min(Math.floor(v.precio_habitual*.10),Math.floor(maxDescuento/2))],['Descuento mayor',Math.min(Math.floor(v.precio_habitual*.30),maxDescuento)]]
            .filter(([,d])=>d>0).map(([nombre,d])=>({nombre,numeros:{...v,tipo:'descuento',precio_oferta:v.precio_habitual-d,costo_extra:extraDescuento,valor_extra:0}}));
        if(v.valor_extra>0)opciones.push({nombre:'Precio habitual con complemento adicional',numeros:{...v,tipo:'complemento',precio_oferta:v.precio_habitual}});
        return opciones.flatMap(p=>{try{return [{...p,resultado:calcular(p.numeros)}];}catch{return [];}});
    }
    const api={publicacion,centavos,calcular,validar,alternativas};root.EncaviCalculadora=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
