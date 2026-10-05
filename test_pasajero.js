// Recorridos contra el HTML y módulos reales. Sin red ni permisos del navegador real.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {boot} = require('./test_demo_integration');
const flush = () => new Promise(r => setImmediate(r));
let pasadas = 0;
async function caso(nombre, fn) { await fn(); pasadas++; console.log('[PASS] ' + nombre); }
(async () => {
  await caso('Búsqueda: coincidencias, acentos, ningún resultado y quitar filtro sin Firebase', async () => {
    const a = await boot(); const w = a.w, d = w.document;
    try {
      const c = {id:'busqueda',title:'Café de prueba',desc:'Comida del día',active:true,stock:4,lat:20.65,lng:-105.22};
      w.loadedCampaigns = [c]; w.actualizarCatalogo();
      d.getElementById('buscarPromos').click(); const input = d.getElementById('consultaPromos');
      input.value='cafe'; input.dispatchEvent(new w.Event('input')); assert.equal(d.querySelectorAll('.track-click').length,1);
      input.value='<script>sin resultado</script>'; input.dispatchEvent(new w.Event('input'));
      assert.equal(d.querySelectorAll('.track-click').length,0); assert.ok(d.querySelector('.immersive-feed').textContent.includes('No hay promociones que coincidan')); assert.equal(d.getElementById('catalogoEstado').querySelector('script'),null);
      [...d.getElementById('catalogoContenido').querySelectorAll('button')].find(b=>b.textContent==='Quitar búsqueda').click();
      assert.equal(d.querySelectorAll('.track-click').length,1); assert.equal(d.getElementById('catalogoDialogo').hidden,true); assert.deepEqual(a.calls,[]);
    } finally { a.close(); }
  });
  await caso('Sin GPS: sin locales ficticios, mapa conectado y demo sin permisos ni escrituras', async () => {
    const a = await boot(); const w=a.w,d=w.document;
    try {
      assert.ok(!d.querySelector('.sheet-content').textContent.includes('El Pariente')); assert.ok(d.querySelector('.sheet-content').textContent.includes('No se calcula cercanía'));
      let mapa=0; w.openMap=()=>mapa++; d.getElementById('mapBtn').click(); assert.equal(mapa,1);
      d.getElementById('ubicacionPromos').click(); assert.ok(d.getElementById('catalogoContenido').textContent.includes('no solicita tu ubicación')); assert.equal(d.querySelector('.loc-text').textContent,'Ver ubicación');
      d.getElementById('notifBtn').click(); assert.ok(d.getElementById('catalogoContenido').textContent.includes('desactivadas en la demostración')); assert.deepEqual(a.calls,[]);
    } finally { a.close(); }
  });
  await caso('Sin sesión: los controles no desbloquean catálogo, mapa ni diálogo', async () => {
    const a=await boot('');try{let mapa=0;a.w.openMap=()=>mapa++;for(const id of ['mapBtn','buscarPromos','ubicacionPromos','notifBtn'])a.w.document.getElementById(id)?.click();assert.equal(mapa,0);assert.ok(!a.w.document.getElementById('catalogoDialogo') || a.w.document.getElementById('catalogoDialogo').hidden);assert.equal(a.w.encaviSession,null);}finally{a.close();}
  });
  await caso('Ubicación solo al solicitarla: rechazo, reintento, orden y notificaciones no disponibles', async () => {
    const s={origen:'qr',uid:'cliente',chofer:'V1',code:'ENC-P',timestamp:Date.now(),juegoJugado:false};
    const a=await boot('?chofer=V1',undefined,{restaurarOIniciar:async()=>s,consumirJuego:async()=>{}});const w=a.w,d=w.document;
    try {
      let peticiones=0,exito,error;
      w.navigator.geolocation.watchPosition=(ok,fail)=>{peticiones++;exito=ok;error=fail;return peticiones;};w.navigator.geolocation.clearWatch=()=>{};
      d.body.click();assert.equal(peticiones,0);
      d.getElementById('ubicacionPromos').click();const b=[...d.getElementById('catalogoContenido').querySelectorAll('button')].find(b=>b.textContent==='Usar mi ubicación');
      b.click();assert.equal(peticiones,1);error({code:1});assert.ok(d.getElementById('catalogoContenido').textContent.includes('Permiso de ubicación rechazado'));
      b.click();assert.equal(peticiones,2);
      w.loadedCampaigns=[{id:'cerca',title:'Cercano',desc:'Oferta',active:true,lat:20.65,lng:-105.22,stock:2}];exito({coords:{latitude:20.65,longitude:-105.22,accuracy:10}});
      assert.equal(d.querySelector('.loc-text').textContent,'Ubicación del teléfono');assert.ok(d.querySelector('.sheet-content').textContent.includes('Cercano'));
      d.getElementById('notifBtn').click();assert.ok(d.getElementById('catalogoContenido').textContent.includes('no permite estas notificaciones'));
      const antes=a.calls.length;await flush();assert.equal(a.calls.length,antes);
    } finally { a.close(); }
  });
  await caso('Alertas precisas: una por negocio, sesión caducada y GPS impreciso no notifican', async () => {
    const s={origen:'qr',uid:'cliente',chofer:'V1',code:'ENC-P',timestamp:Date.now()};
    const a=await boot('?chofer=V1',undefined,{restaurarOIniciar:async()=>s});const w=a.w,d=w.document;
    try {
      const avisos=[];w.Notification=class {static permission='granted';constructor(t,o){avisos.push({t,o});}};
      w.solicitarUbicacion=fn=>{w.currentLat=20.65;w.currentLng=-105.22;w.egGpsAcc=15;fn(true,'Activa');};
      w.loadedCampaigns=[{id:'uno',title:'Negocio real',desc:'Oferta',lat:20.65,lng:-105.22}];d.getElementById('notifBtn').click();d.getElementById('catalogoContenido').querySelector('button').click();await flush();assert.equal(avisos.length,1);
      w.actualizarRadar(20.65,-105.22);await flush();assert.equal(avisos.length,1);
      w.loadedCampaigns.push({id:'dos',title:'Otro',desc:'Oferta',lat:20.65,lng:-105.22});w.egGpsAcc=800;w.actualizarRadar(20.65,-105.22);await flush();assert.equal(avisos.length,1);
      w.encaviSession.timestamp=Date.now()-25*3600000;w.egGpsAcc=10;w.actualizarRadar(20.65,-105.22);await flush();assert.equal(avisos.length,1);
    } finally { a.close(); }
  });
  await caso('Opinión sin emojis decorativos: respuesta negativa y escala numérica utilizables', async () => {
    const a=await boot();const w=a.w,d=w.document;
    try {
      assert.equal(d.querySelectorAll('#opinionModal .op-emoji').length,0);assert.equal(d.querySelectorAll('#opEstrellas button').length,5);
      w.opRespeto(true);d.querySelectorAll('#opEstrellas button')[3].click();assert.equal(d.querySelectorAll('#opEstrellas button.on').length,4);
      w.opRespeto(false);assert.equal(d.getElementById('opEstrellas').style.display,'none');assert.equal(d.getElementById('opIcono').textContent,'Reportar un problema');
      const css=fs.readFileSync('pasajero.css','utf8');assert.ok(css.includes('font-weight:500'));assert.ok(css.includes('var(--encavi-orange-bright)'));assert.ok(!/#(?:d5cbbb|e4ddd1|315d50|233c35)/i.test(css));
    } finally { a.close(); }
  });
  console.log('Pasajero: '+pasadas+' recorridos completos.');
})().catch(e=>{console.error(e);process.exitCode=1;});
