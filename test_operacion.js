const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom'),O=require('./operacion'),P=require('./publicidad');
const ADMIN='ZS4cI7hnMXVPpCaQECFg208TLbL2';let passed=0;
async function check(n,f){await f();passed++;console.log('[PASS] '+n);}
const flush=()=>new Promise(r=>setImmediate(r));
async function boot(){
 const html=fs.readFileSync('admin.html','utf8'),dom=new JSDOM(html,{url:'https://encavigo.test/admin.html',runScripts:'outside-only'}),w=dom.window,calls=[],alerts=[],ready=[];
 const datos=new Map(),docObj=(id,data)=>({id,exists:!!data,data:()=>data}),snap=name=>{const docs=[...datos].filter(([k])=>k.startsWith(name+'/')).map(([k,v])=>docObj(k.split('/')[1],v));return {docs,size:docs.length,empty:!docs.length,forEach:fn=>docs.forEach(fn)};};
 const db={collection:name=>({get:async()=>{calls.push('get:'+name);return snap(name);},onSnapshot:fn=>{calls.push('watch:'+name);fn(snap(name));return()=>calls.push('stop:'+name);},where(){return this;},orderBy(){return this;},limit(){return this;},doc:id=>({id:id||'generated',path:name+'/'+(id||'generated'),get:async()=>docObj(id,datos.get(name+'/'+id)),set:async d=>{calls.push('set:'+name);datos.set(name+'/'+id,d);}})}),runTransaction:async fn=>fn({get:async ref=>docObj(ref.id,datos.get(ref.path)),set:(ref,d)=>{calls.push('write:'+ref.path);datos.set(ref.path,d);},update:(ref,d)=>{calls.push('write:'+ref.path);datos.set(ref.path,{...datos.get(ref.path),...d});}})};
 let observer;const auth={currentUser:null,onAuthStateChanged:fn=>{observer=fn;fn(null);},signOut:async()=>{auth.currentUser=null;await observer(null);},signInWithEmailAndPassword:async()=>{auth.currentUser={uid:ADMIN};await observer(auth.currentUser);}};
 w.firebase={initializeApp:()=>{},auth:()=>auth,firestore:Object.assign(()=>db,{FieldValue:{serverTimestamp:()=>new Date()}})};w.alert=t=>alerts.push(t);w.confirm=()=>true;w.prompt=()=>null;
 const mapa={setView(){return this;},on(){return this;},invalidateSize(){},getZoom(){return 15;},removeLayer(){}};
 const pin={addTo(){return this;},on(){return this;},setLatLng(){return this;},getLatLng(){return {lat:20.65,lng:-105.22};}};
 w.L={map:()=>mapa,tileLayer:()=>({addTo(){}}),marker:()=>pin};w.fetch=async()=>({json:async()=>[]});w.open=()=>null;
 const orig=w.document.addEventListener.bind(w.document);w.document.addEventListener=(n,f,o)=>n==='DOMContentLoaded'?ready.push(f):orig(n,f,o);
 for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){const src=m[1].match(/src="([^"]+)"/);if(src&&!src[1].startsWith('https:'))vm.runInContext(fs.readFileSync(src[1],'utf8'),dom.getInternalVMContext());else if(!src&&m[2].trim())vm.runInContext(m[2],dom.getInternalVMContext());}
 ready.forEach(fn=>fn());await flush();
 return {w,dom,calls,datos,alerts,auth,login:()=>auth.signInWithEmailAndPassword(),anon:async()=>{auth.currentUser={uid:'anonimo'};await observer(auth.currentUser);},close:()=>w.close()};
}
(async()=>{
 await check('Validación de promociones, fechas, coordenadas, tarifa y enlaces',()=>{
 const v={title:'Fonda Ejemplo',desc:'Comida autorizada',lat:'20.65',lng:'-105.22',stock:'0',tarifa:'25',caja_id:'CAJA-OK',dias:[1,2],startDate:'2026-10-01',endDate:'2026-10-31',active:false};
 const c=O.promocion(v);assert.equal(c.stock,0);assert.equal(c.active,false);assert.equal(c.desde_ms,Date.parse('2026-10-01T06:00:00Z'));assert.equal(c.hasta_ms,Date.parse('2026-11-01T06:00:00Z'));
 for(const x of [{stock:'1.5'},{lat:''},{tarifa:99},{caja_id:''},{img:'javascript:alert(1)'},{endDate:'2026-09-01'}])assert.throws(()=>O.promocion({...v,...x}));
 const m=O.promocion({...v,tipo_campana:'municipal',caja_id:'',stock:2,tarifa:80,municipio:'vallarta',startDate:'2026-10-01',endDate:'2026-10-30',action_url:'https://wa.me/523220000000'});assert.equal(m.stock,0);assert.equal(m.tarifa,0);
 assert.equal(O.margen({precio:150,costo:65,comision:25,descuento:20}).contribucion,30);
 const propuestas=O.propuestas({precio:150,costo:70,comision:25,margenMinimo:20,canjes:30});assert.equal(propuestas.length,3);assert.ok(propuestas.every(p=>p.contribucion>=19.999));assert.throws(()=>O.propuestas({precio:120,costo:90,comision:25,margenMinimo:20,canjes:30}));
 assert.throws(()=>P.contrato({nombre:'Fonda',importe:25,plan:'cortesia'}));assert.equal(P.contrato({nombre:'Fonda',importe:1000,plan:'local'}).importe_centavos,100000);
 });
 await check('Panel real: sin lecturas antes del login, usuario anónimo bloqueado y ejemplos sin guardar',async()=>{
 const a=await boot();try{assert.deepEqual(a.calls,[]);await a.anon();assert.deepEqual(a.calls,[]);assert.equal(a.w.document.getElementById('login-overlay').style.display,'flex');assert.ok(a.w.document.body.textContent.includes('Fonda Ejemplo'));assert.equal(a.w.document.querySelectorAll('#addModal').length,1);assert.ok(a.w.document.getElementById('codTitularAyuda'));}finally{a.close();}
 });
 await check('Panel real: entrar, alta, edición con stock cero y logout cancelando escuchas',async()=>{
 const a=await boot();try{await a.login();await flush();assert.equal(a.w.document.getElementById('login-overlay').style.display,'none');assert.ok(a.calls.includes('watch:campaigns'));a.w.openAddModal();const set=(id,v)=>a.w.document.getElementById(id).value=v;
 set('cTitle','Fonda');set('cDesc','Comida aprobada');set('cLat','20.65');set('cLng','-105.22');set('cStock','-1');await a.w.saveCampaign();assert.equal([...a.datos].length,0);assert.ok(a.alerts.some(x=>x.includes('entero')));
 a.datos.set('codigos/CAJA-OK',{tipo:'caja',estado:'activo',titular:'Fonda'});await a.w.cajaLlenarLista('CAJA-OK');set('cStock','0');a.w.document.getElementById('cActive').checked=false;await a.w.saveCampaign();assert.equal(a.datos.get('campaigns/generated').stock,0);assert.equal(a.datos.get('campaigns/generated').active,false);
 await a.w.editarCampana('generated');await flush();assert.equal(a.w.document.getElementById('cStock').value,'0');assert.equal(a.w.document.getElementById('cActive').checked,false);
 a.w.switchTab('publicidad');await flush();assert.equal(a.w.document.getElementById('view-publicidad').style.display,'block');a.w.switchTab('analiticas');assert.equal(a.w.document.getElementById('view-publicidad').style.display,'none');
 await a.auth.signOut();assert.ok(a.calls.some(x=>x.startsWith('stop:')));assert.equal(a.w.document.querySelector('.app-container').style.display,'none');}finally{a.close();}
 });
 await check('Reporte real: sin datos inventados ni lecturas para un visitante',async()=>{
 const dom=new JSDOM(fs.readFileSync('dashboard.html','utf8'),{url:'https://encavigo.test/dashboard.html',runScripts:'outside-only'});const w=dom.window;let calls=0;
 w.firebase={initializeApp:()=>{},firestore:()=>({collection:()=>{calls++;throw Error('Lectura no autorizada');}}),auth:()=>({currentUser:null,onAuthStateChanged:f=>f(null)})};
 for(const p of ['operacion.js','comisiones.js','reporte.js'])vm.runInContext(fs.readFileSync(p,'utf8'),dom.getInternalVMContext());assert.equal(calls,0);assert.equal(w.document.getElementById('contenido').hidden,true);assert.ok(w.document.getElementById('estado').textContent.includes('administradora'));w.close();
 });
 await check('Campaña municipal abre contacto sin consumir inventario ni generar ticket; texto del catálogo escapado',async()=>{
 const {boot}=require('./test_demo_integration');const a=await boot('?demo=1');try{const c={id:'municipal',tipo_campana:'municipal',action_url:'https://wa.me/523220000000',active:true,stock:0,title:'<img src=x onerror=alert(1)>',desc:'Contacto <script>peligroso</script>',lat:20.65,lng:-105.22};a.w.loadedCampaigns=[c];let contacto;a.w.open=url=>{contacto=url;};a.w.EncaviCore.renderDeck([c]);const b=a.w.document.querySelector('.track-click');assert.equal(b.textContent.trim(),'Contactar negocio');b.click();assert.equal(contacto,c.action_url);assert.equal(c.stock,0);assert.equal(a.w.document.querySelector('.card-headline img'),null);assert.equal(a.w.document.getElementById('codigoModal').style.display,'none');assert.deepEqual(a.calls,[]);}finally{a.close();}
 });
 await check('Reporte por negocio y mes filtra registros reales sin mezclar otros comercios',async()=>{
 const dom=new JSDOM(fs.readFileSync('dashboard.html','utf8'),{url:'https://encavigo.test/dashboard.html',runScripts:'outside-only'});const w=dom.window;
 const cuando={toDate:()=>new Date('2026-10-04T18:00:00Z')};const datos={campaigns:[{id:'p1',title:'<img src=x>',caja_id:'CAJA1',desc:'Oferta 1',stock:20},{id:'p2',title:'Otro negocio',caja_id:'CAJA2',desc:'Oferta 2',stock:10}],tickets:[{id:'CAJA1_A',negocio:'CAJA1',camp_id:'p1',negocio_nombre:'Nombre',chofer:'V1',comision_centavos:2500,moneda:'MXN',revisar:null,fecha:cuando},{id:'CAJA2_B',negocio:'CAJA2',camp_id:'p2',comision_centavos:8000,moneda:'MXN',revisar:null,fecha:cuando}],click_log:[{id:'c1',camp_id:'p1',fecha:cuando},{id:'c2',camp_id:'p1',fecha:{toDate:()=>new Date('2026-09-30T18:00:00Z')}}],opiniones:[],movimientos_comision:[]};
 const auth={currentUser:{uid:ADMIN},onAuthStateChanged:f=>f(auth.currentUser)};
 w.firebase={initializeApp(){},auth:()=>auth,firestore:()=>({collection:n=>({get:async()=>({docs:datos[n].map(d=>({id:d.id,data:()=>d}))})})})};
 for(const p of ['operacion.js','comisiones.js','reporte.js'])vm.runInContext(fs.readFileSync(p,'utf8'),dom.getInternalVMContext());await flush();await flush();
 w.document.getElementById('mes').value='2026-10';w.document.getElementById('negocio').value='CAJA1';w.document.getElementById('negocio').onchange();assert.equal(w.document.getElementById('canjes').textContent,'1');assert.equal(w.document.getElementById('clicks').textContent,'1');assert.equal(w.document.getElementById('detalle').children.length,1);assert.equal(w.document.getElementById('titulo').querySelector('img'),null);assert.equal(w.document.getElementById('titulo').textContent,'<img src=x>');w.close();
 });
 console.log('Operación: '+passed+' pruebas completas.');
})().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={boot};
