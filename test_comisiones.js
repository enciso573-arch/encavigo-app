const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {JSDOM} = require('jsdom');
const C = require('./comisiones');
const fecha = d => ({toDate:()=>new Date(d)});
const base = {negocio:'A',negocio_nombre:'Mismo nombre',chofer:'V1',moneda:'MXN',comision_centavos:2500,revisar:null,fecha:fecha('2026-10-04T12:00:00')};
const tickets = [{...base,id:'t1'},{...base,id:'t2',comision_centavos:4500},{...base,id:'t3',negocio:'B',chofer:'V2',comision_centavos:8000},
    {...base,id:'t4',comision_centavos:undefined},{...base,id:'t5',revisar:'sin_ubicacion'}, {...base,id:'t6',comision_centavos:0}];
let r=C.resumen(tickets,{},C.periodo('todos'));
assert.equal(r.cobrar,15000);assert.equal(r.pagar,15000);
assert.equal(r.negocios.A.total,7000);assert.equal(r.negocios.B.total,8000);
assert.equal(r.filas.filter(x=>!x.e.aprobado).length,2);
assert.throws(()=>C.captura({tarifa:'25'}));assert.throws(()=>C.captura({}));
const semana=C.periodo('semana','2026-10-04');
assert.equal(semana.desde.getDay(),1);assert.equal(semana.hasta.getDay(),1);
const limites=[{...base,id:'primero',fecha:fecha(semana.desde)},
    {...base,id:'ultimo',fecha:fecha(new Date(semana.hasta.getTime()-1))},
    {...base,id:'siguiente',fecha:fecha(semana.hasta)}];
assert.equal(C.resumen(limites,{},semana).filas.length,2);
const movimientos={t1_pago:{tipo:'pago'},t2_cobro:{tipo:'cobro'},t5_revision:{tipo:'rechazar'}};
r=C.resumen(tickets,movimientos,C.periodo('todos'));
assert.equal(r.anticipado,2500);assert.equal(r.cobrar,10500);assert.equal(r.pagar,12500);
console.log('[PASS] Importes mixtos, negocios homónimos, cortesías, históricos faltantes y límites de semana');

(async()=>{
    // HTML y módulo reales del panel, con Firebase sustituido explícitamente. Sin red ni datos reales.
    const dom=new JSDOM(fs.readFileSync('admin.html','utf8'),{runScripts:'outside-only',url:'https://encavigo.test/admin.html'});
    const w=dom.window, ctx=dom.getInternalVMContext();
    const data={tickets:tickets.map(t=>({...t,negocio_nombre:'<img src=x onerror=alert(1)>'})),movimientos_comision:[],opiniones:[]};
    const writes=[];
    w.db={collection:name=>({get:async()=>({forEach:fn=>data[name].forEach(t=>fn({id:t.id,data:()=>t}))})})};
    w.firebase={auth:()=>({currentUser:{uid:'admin'}}),firestore:{FieldValue:{serverTimestamp:()=>0}}};
    w.renderOpinionesSeguras=()=>{};w.alert=msg=>{throw Error(msg);};w.prompt=()=> 'Recibo confirmado';
    vm.runInContext(fs.readFileSync('comisiones.js','utf8'),ctx);
    w.EncaviComisiones.registrar=async(db,id,tipo,ref,uid)=>writes.push({id,tipo,ref,uid});
    vm.runInContext(fs.readFileSync('admin-comisiones.js','utf8'),ctx);
    w.document.getElementById('cobTipo').value='todos';await w.calcularCobros();
    const detalle=w.document.getElementById('cobDetalle');
    assert.equal(detalle.querySelector('img'),null);
    assert.ok(detalle.textContent.includes('<img src=x onerror=alert(1)>'));
    assert.ok(detalle.textContent.includes('Sin tarifa histórica'));
    assert.equal(detalle.querySelectorAll('button').length,8); // 3 canjes válidos x 2 + revisión x 2.
    detalle.querySelector('button').click();
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(writes.length,1);assert.equal(writes[0].tipo,'cobro');
    w.document.getElementById('cobTipo').value='semana';await w.calcularCobros();
    assert.equal(w.document.getElementById('cobMes').type,'date');
    w.document.getElementById('cobTipo').value='mes';await w.calcularCobros();
    assert.equal(w.document.getElementById('cobMes').type,'month');
    console.log('[PASS] Panel real: filtros, texto seguro y botón de registro conectado al servicio');
    dom.window.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
