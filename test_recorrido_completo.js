// Recorrido entre panel, pasajero, Firebase y reportes. Solo emuladores locales.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {initializeTestEnvironment}=require('@firebase/rules-unit-testing');
const firebase=require('firebase/compat/app');
require('firebase/compat/auth');require('firebase/compat/firestore');
const {pagina,hasta}=require('./scripts/recorrido-dom.cjs');
const Comisiones=require('./comisiones');

assert.equal(process.env.FIRESTORE_EMULATOR_HOST,'127.0.0.1:8787');
assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST,'127.0.0.1:9098');
const PROYECTO='demo-encavigo-audit',ADMIN='ZS4cI7hnMXVPpCaQECFg208TLbL2';
const EMAIL='propietario-prueba@encavigo.invalid',CLAVE='ClaveExclusivaDelEmulador-2026';
const apps=[],paginas=[],resultados=[];let env,admin,cliente,recarga,negocio,vehiculo,campId,ticketId;
firebase.firestore.setLogLevel('silent');
function app(nombre){
    const a=firebase.initializeApp({projectId:PROYECTO,apiKey:'demo-api-key',authDomain:PROYECTO+'.firebaseapp.com'},nombre);
    a.auth().useEmulator('http://127.0.0.1:9098',{disableWarnings:true});a.firestore().useEmulator('127.0.0.1',8787);apps.push(a);return a;
}
async function abrir(file,a,opts){const p=await pagina(file,a,firebase,opts);paginas.push(p);return p;}
async function comprobar(nombre,fn){const inicio=Date.now();await fn();resultados.push({nombre,resultado:'PASS',duracion_ms:Date.now()-inicio});console.log('[PASS] '+nombre);}
async function leer(col,id){const s=await admin.db.collection(col).doc(id).get({source:'server'});return s.exists?s.data():null;}
async function cantidad(col){return (await admin.db.collection(col).get({source:'server'})).size;}
function btn(p,texto){const b=[...p.w.document.querySelectorAll('button')].find(b=>b.textContent.trim()===texto);assert.ok(b,'Botón: '+texto);return b;}
async function clienteNuevo(nombre,opts={}){const p=await abrir('index.html',app(nombre),{search:'?chofer='+vehiculo,...opts});await hasta(()=>p.w.loadedCampaigns?.length,'catálogo de '+nombre);return p;}
async function reclamar(p){p.w.document.querySelector('.track-click[data-campid="'+campId+'"]').click();p.w.document.getElementById('btnEscanearCaja').click();assert.equal(p.w.document.getElementById('scannerModal').style.display,'flex');}
async function resumen(){const ts=await admin.db.collection('tickets').get(),ms=await admin.db.collection('movimientos_comision').get();return Comisiones.resumen(ts.docs.map(d=>({...d.data(),id:d.id})),Object.fromEntries(ms.docs.map(d=>[d.id,d.data()])),{desde:null,hasta:null});}

(async()=>{
    env=await initializeTestEnvironment({projectId:PROYECTO,firestore:{host:'127.0.0.1',port:8787,rules:fs.readFileSync('firestore.rules','utf8')}});
    await env.clearFirestore();
    const adminApp=app('propietario-recorrido');
    // Token sin firma admitido SOLO por Auth Emulator para fijar el UID autorizado.
    // Después se configura y prueba el login normal por correo/contraseña ficticios.
    const ahora=Math.floor(Date.now()/1000),b64=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
    const token=b64({alg:'none',typ:'JWT'})+'.'+b64({iss:'prueba@'+PROYECTO+'.iam.gserviceaccount.com',sub:'prueba@'+PROYECTO+'.iam.gserviceaccount.com',aud:'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',iat:ahora,exp:ahora+3600,uid:ADMIN})+'.';
    await adminApp.auth().signInWithCustomToken(token);await adminApp.auth().currentUser.updateEmail(EMAIL);await adminApp.auth().currentUser.updatePassword(CLAVE);await adminApp.auth().signOut();
    await comprobar('Panel real: login por correo y contraseña contra Auth Emulator',async()=>{
        admin=await abrir('admin.html',adminApp);assert.equal(admin.w.document.getElementById('login-overlay').style.display,'flex');
        admin.set('loginEmail',EMAIL);admin.set('loginPwd',CLAVE);admin.w.loginAdmin();
        await hasta(()=>admin.w.document.getElementById('login-overlay').style.display==='none','login propietario');
        assert.equal(adminApp.auth().currentUser.uid,ADMIN);assert.equal(await cantidad('campaigns'),0);
    });
    await comprobar('Alta de chofer desde el formulario: código privado y flotilla pública',async()=>{
        admin.set('codTipo','vehiculo');admin.set('codPrefijo','PRUEBA');admin.set('codTitular','Chofer ficticio del recorrido');admin.set('codZona','vallarta');admin.set('codNota','Unidad de prueba');
        await admin.w.codGenerar();const docs=(await admin.db.collection('codigos').get()).docs;
        assert.equal(docs.length,1);vehiculo=docs[0].id;assert.equal(docs[0].data().estado,'activo');assert.equal((await leer('choferes',vehiculo)).zona,'vallarta');
    });
    await comprobar('Alta de caja y promoción desde Nuevo Negocio: tres cupones a $25',async()=>{
        admin.w.openAddModal();admin.set('cTitle','Fonda ficticia del recorrido');await admin.w.cajaGenerarDesdeCampana();
        negocio=admin.w.document.getElementById('cCaja').value;assert.ok(negocio);assert.equal((await leer('codigos',negocio)).tipo,'caja');
        admin.set('cDesc','Oferta ficticia exclusiva para comprobar el sistema');admin.set('cLat','20.65');admin.set('cLng','-105.22');admin.set('cStock','3');admin.set('cTarifa','25');await admin.w.saveCampaign();
        const cs=await admin.db.collection('campaigns').get();assert.equal(cs.size,1);campId=cs.docs[0].id;assert.equal(cs.docs[0].data().stock,3);
    });
    await comprobar('Impresión: el QR del vehículo contiene su URL y el de caja su código exacto',async()=>{
        await admin.w.codCargar();admin.w.codImprimir(vehiculo);admin.w.codImprimir(negocio);assert.equal(admin.impresos.length,2);
        for(const [i,esperado] of ['https://encavigo.com/?chofer='+vehiculo,negocio].entries()){
            const html=admin.impresos[i],m=html.match(/text: ("[^"]*")/);assert.ok(m);assert.equal(JSON.parse(m[1]),esperado);assert.ok(html.includes('Imprimir'));
        }
    });
    await comprobar('Entrada sin QR bloqueada: no abre sesión ni muestra promociones',async()=>{
        const a=app('visitante-sin-qr'),sin=await abrir('index.html',a);assert.equal(sin.w.encaviSession,null);assert.ok(sin.w.document.body.textContent.includes('Escanea el código en tu transporte'));assert.equal((await a.firestore().collection('sesiones').doc(a.auth().currentUser.uid).get({source:'server'})).exists,false);sin.close();
    });
    await comprobar('Pasajero: QR válido abre sesión de 24 h y carga la promoción creada',async()=>{
        cliente=await clienteNuevo('pasajero-recorrido');assert.equal(cliente.w.encaviSession.chofer,vehiculo);assert.match(cliente.w.encaviSession.code,/^ENC-[A-F0-9]{8}$/);
        assert.equal(cliente.w.encaviSession.verificada,true);assert.equal(cliente.w.loadedCampaigns[0].id,campId);await hasta(async()=>await cantidad('scan_log')===1,'escaneo registrado');
    });
    await comprobar('Juego: cerrar no consume; primera tarjeta consume una vez; premio monetario desactivado',async()=>{
        const ref=apps.find(a=>a.name==='pasajero-recorrido').firestore().collection('sesiones').doc(cliente.w.encaviSession.uid);
        cliente.w.openGame();cliente.w.closeGame();assert.equal((await ref.get({source:'server'})).data().juegoJugado,false);
        cliente.w.openGame();await cliente.w.flipCard(0);assert.equal((await ref.get({source:'server'})).data().juegoJugado,true);assert.equal(cliente.w.EncaviCore.CONFIG_PILOTO.VIAJE_GRATIS_HABILITADO,false);assert.equal(await cantidad('premios'),0);
    });
    await comprobar('Recarga: conserva código, hora, vehículo e intento, sin duplicar el escaneo',async()=>{
        const a=apps.find(a=>a.name==='pasajero-recorrido');recarga=await abrir('index.html',a,{search:'?chofer=NO-REGISTRADO'});await hasta(()=>recarga.w.loadedCampaigns?.length,'catálogo tras recarga');
        for(const k of ['code','timestamp','chofer'])assert.equal(recarga.w.encaviSession[k],cliente.w.encaviSession[k]);assert.equal(recarga.w.encaviSession.juegoJugado,true);await assert.rejects(recarga.w.EncaviSesiones.consumirJuego());assert.equal(await cantidad('scan_log'),1);
    });
    await comprobar('Caja incorrecta rechazada, incluido un texto que solo contiene el código válido',async()=>{
        await reclamar(cliente);cliente.w.mostrarCodigoManual();cliente.set('inputCaja','OTRA-CAJA');cliente.w.confirmarCodigoManual();assert.equal(cliente.w.document.getElementById('errorCaja').style.display,'block');assert.equal(await cantidad('tickets'),0);
        cliente.set('inputCaja','FALSO-'+negocio+'-FALSO');cliente.w.confirmarCodigoManual();assert.equal(cliente.w.document.getElementById('errorCaja').style.display,'block');assert.equal(await cantidad('tickets'),0);
        cliente.w.__lectorQR('FALSO-'+negocio+'-FALSO');assert.ok(cliente.avisos.some(t=>t.includes('Código incorrecto')));assert.equal(await cantidad('tickets'),0);
    });
    await comprobar('Canje con código de caja correcto: éxito, un ticket, stock de tres a dos y comisión histórica',async()=>{
        cliente.set('inputCaja',negocio);cliente.w.confirmarCodigoManual();await hasta(()=>cliente.w.document.getElementById('successModal').style.display==='flex','canje confirmado');ticketId=negocio+'_'+cliente.w.encaviSession.code;
        assert.equal(cliente.w.document.getElementById('successTitulo').textContent,'CUPÓN APROBADO');assert.equal(await cantidad('tickets'),1);assert.equal((await leer('campaigns',campId)).stock,2);const t=await leer('tickets',ticketId);assert.equal(t.comision_centavos,2500);assert.equal(t.chofer,vehiculo);assert.equal(t.revisar,null);
    });
    await comprobar('Opinión del pasajero guardada y visible para administración',async()=>{
        cliente.w.cerrarSuccess();cliente.w.opRespeto(true);cliente.w.opEstrella(5);cliente.set('opComentario','Promoción ficticia respetada durante la prueba');await cliente.w.enviarOpinion();assert.equal(cliente.w.document.getElementById('opPaso3').style.display,'block');const o=await leer('opiniones',ticketId);assert.equal(o.estrellas,5);assert.equal(o.respetado,true);
    });
    await comprobar('Canje repetido rechazado: no muestra éxito ni descuenta inventario otra vez',async()=>{
        cliente.w.document.getElementById('successModal').style.display='none';await cliente.w.EncaviCore.quemarCupon(campId,'Fonda ficticia del recorrido');assert.equal(cliente.w.document.getElementById('successModal').style.display,'none');assert.equal(await cantidad('tickets'),1);assert.equal((await leer('campaigns',campId)).stock,2);assert.ok(cliente.avisos.some(t=>t.includes('No se autorizó')));
    });
    await comprobar('Pago adelantado y recuperación de la comisión desde los botones del panel',async()=>{
        admin.set('cobTipo','todos');await admin.w.calcularCobros();assert.equal((await resumen()).cobrar,2500);btn(admin,'Registrar adelanto al chofer').click();await hasta(async()=>!!await leer('movimientos_comision',ticketId+'_pago'),'adelanto');assert.equal((await resumen()).anticipado,2500);
        await admin.w.calcularCobros();btn(admin,'Registrar cobro recibido').click();await hasta(async()=>!!await leer('movimientos_comision',ticketId+'_cobro'),'cobro');const r=await resumen();assert.equal(r.anticipado,0);assert.equal(r.cobrar,0);assert.equal(r.pagar,0);assert.equal(r.cobrado,2500);assert.equal(r.pagado,2500);
        await assert.rejects(admin.w.EncaviComisiones.registrar(admin.db,ticketId,'pago','Duplicado',ADMIN,()=>firebase.firestore.FieldValue.serverTimestamp()));
    });
    await comprobar('Publicidad: cortesía, primer acuerdo pagado y mensualidad sin duplicados',async()=>{
        await admin.w.cargarPublicidad();admin.set('pubNegocio',negocio);admin.set('pubPlan','cortesia');admin.set('pubImporte','0');await admin.w.document.getElementById('pubGuardar').onclick();assert.equal((await leer('contratos_publicidad',negocio)).importe_centavos,0);
        admin.set('pubPlan','local');admin.set('pubImporte','1000');await admin.w.document.getElementById('pubGuardar').onclick();admin.set('pubReferencia','Pago ficticio en el emulador');await admin.w.document.getElementById('pubCobrar').onclick();assert.equal(await cantidad('pagos_publicidad'),1);assert.equal((await admin.db.collection('pagos_publicidad').get()).docs[0].data().importe_centavos,100000);await admin.w.document.getElementById('pubCobrar').onclick();assert.equal(await cantidad('pagos_publicidad'),1);assert.ok(admin.w.document.getElementById('pubEstado').textContent.includes('ya tiene'));
    });
    await comprobar('Reporte del negocio: canje, interacción, opinión y $25 cobrados coinciden',async()=>{
        const reporte=await abrir('dashboard.html',adminApp);await hasta(()=>reporte.w.document.getElementById('canjes').textContent==='1','reporte');assert.equal(reporte.w.document.getElementById('clicks').textContent,'1');assert.match(reporte.w.document.getElementById('cobros').textContent,/25/);assert.ok(reporte.w.document.getElementById('opiniones').textContent.includes('Promoción ficticia respetada'));reporte.close();
    });
    await comprobar('Cambiar la tarifa de la promoción no altera la comisión de un canje anterior',async()=>{
        admin.w.editarCampana(campId);await hasta(()=>admin.w.document.getElementById('addModal').style.display==='flex'&&admin.w.document.getElementById('cCaja').value===negocio,'formulario de edición cargado');admin.set('cTarifa','45');await admin.w.saveCampaign();assert.equal((await leer('campaigns',campId)).tarifa,45);assert.equal((await leer('tickets',ticketId)).comision_centavos,2500);assert.equal((await resumen()).pagado,2500);
    });
    await comprobar('Dos canjes simultáneos con una unidad: un solo éxito y stock cero',async()=>{
        await admin.db.collection('campaigns').doc(campId).update({stock:1});const a=await clienteNuevo('simultaneo-a'),b=await clienteNuevo('simultaneo-b');await Promise.all([a.w.EncaviCore.quemarCupon(campId,'Prueba'),b.w.EncaviCore.quemarCupon(campId,'Prueba')]);assert.equal([a,b].filter(p=>p.w.document.getElementById('successModal').style.display==='flex').length,1);assert.equal((await leer('campaigns',campId)).stock,0);assert.equal(await cantidad('tickets'),2);a.close();b.close();
    });
    await comprobar('Sin GPS: canje en revisión, sin comisión liquidable hasta aprobación',async()=>{
        await admin.db.collection('campaigns').doc(campId).update({stock:1});const p=await clienteNuevo('sin-gps',{gps:false});await p.w.EncaviCore.quemarCupon(campId,'Prueba');const id=negocio+'_'+p.w.encaviSession.code;assert.equal((await leer('tickets',id)).revisar,'sin_ubicacion');await assert.rejects(admin.w.EncaviComisiones.registrar(admin.db,id,'pago','Sin aprobar',ADMIN,()=>firebase.firestore.FieldValue.serverTimestamp()));
        admin.set('cobTipo','todos');await admin.w.calcularCobros();btn(admin,'Aprobar canje').click();await hasta(async()=>!!await leer('movimientos_comision',id+'_revision'),'revisión');assert.equal((await leer('movimientos_comision',id+'_revision')).tipo,'aprobar');p.close();
    });
    await comprobar('Promoción agotada y promoción pausada rechazan canjes sin crear tickets',async()=>{
        const p=await clienteNuevo('agotada-pausada');const antes=await cantidad('tickets');await p.w.EncaviCore.quemarCupon(campId,'Prueba');assert.ok(p.avisos.some(t=>t.includes('agoto')));assert.equal(await cantidad('tickets'),antes);
        await admin.db.collection('campaigns').doc(campId).update({stock:2});p.close();const q=await clienteNuevo('pausada');await admin.db.collection('campaigns').doc(campId).update({active:false});await q.w.EncaviCore.quemarCupon(campId,'Prueba');assert.equal(q.w.document.getElementById('successModal').style.display,'none');assert.equal(await cantidad('tickets'),antes);assert.equal((await leer('campaigns',campId)).stock,2);await admin.db.collection('campaigns').doc(campId).update({active:true});q.close();
    });
    await comprobar('Caja dada de baja rechaza incluso un resultado de lector con el código correcto',async()=>{
        const p=await clienteNuevo('caja-baja');await reclamar(p);const antes=await cantidad('tickets');await admin.w.EncaviOperacion.estadoCodigo(admin.db,negocio,false,'Baja de prueba',()=>firebase.firestore.FieldValue.serverTimestamp());
        p.w.__lectorQR(negocio);await hasta(()=>p.avisos.some(t=>t.includes('No se autorizó')),'rechazo de caja dada de baja');assert.equal(p.w.document.getElementById('successModal').style.display,'none');assert.equal(await cantidad('tickets'),antes);assert.equal((await leer('campaigns',campId)).stock,2);await admin.w.EncaviOperacion.estadoCodigo(admin.db,negocio,true,null,()=>firebase.firestore.FieldValue.serverTimestamp());p.close();
    });
    await comprobar('Sesión después de 24 h: canje rechazado, reapertura bloqueada y nuevo QR renueva',async()=>{
        const a=app('pasajero-vencido'),p=await abrir('index.html',a,{search:'?chofer='+vehiculo});await hasta(()=>p.w.loadedCampaigns?.length,'catálogo antes del vencimiento');const original=p.w.encaviSession.code,antes=await cantidad('tickets');
        // Simula esperar 25 horas solo en el emulador; no cambia el reloj ni las reglas.
        await env.withSecurityRulesDisabled(async ctx=>{await ctx.firestore().collection('sesiones').doc(p.w.encaviSession.uid).update({issuedAt:firebase.firestore.Timestamp.fromMillis(Date.now()-25*3600000)});});
        await p.w.EncaviCore.quemarCupon(campId,'Prueba');assert.equal(p.w.document.getElementById('successModal').style.display,'none');assert.equal(await cantidad('tickets'),antes);
        const vencida=await abrir('index.html',a);assert.equal(vencida.w.encaviSession.caducada,true);assert.ok(vencida.w.document.body.textContent.includes('Tu sesión de 24 horas ha terminado'));const nueva=await abrir('index.html',a,{search:'?chofer='+vehiculo});await hasta(()=>nueva.w.loadedCampaigns?.length,'sesión nueva');assert.notEqual(nueva.w.encaviSession.code,original);assert.equal(nueva.w.encaviSession.caducada,false);p.close();vencida.close();nueva.close();
    });
    await comprobar('Vehículo dado de baja bloquea la reapertura y los canjes',async()=>{
        await admin.w.EncaviOperacion.estadoCodigo(admin.db,vehiculo,false,'Baja ficticia',()=>firebase.firestore.FieldValue.serverTimestamp());const p=await abrir('index.html',apps.find(a=>a.name==='pasajero-recorrido'),{search:'?chofer='+vehiculo});assert.equal(p.w.encaviSession,null);assert.ok(p.w.document.body.textContent.includes('No pudimos verificar'));p.close();
        await admin.w.EncaviOperacion.estadoCodigo(admin.db,vehiculo,true,null,()=>firebase.firestore.FieldValue.serverTimestamp());
    });
    await comprobar('Registro privado del chofer y administración inaccesibles al pasajero',async()=>{
        const a=apps.find(a=>a.name==='pasajero-recorrido');await assert.rejects(a.firestore().collection('codigos').doc(vehiculo).get({source:'server'}));await assert.rejects(a.firestore().collection('pagos_publicidad').get());await assert.rejects(a.firestore().collection('campaigns').doc(campId).update({stock:999}));
        const p=await abrir('admin.html',a);assert.equal(p.w.document.getElementById('login-overlay').style.display,'flex');p.close();
    });
    await comprobar('Sin errores de JavaScript en las páginas del recorrido',async()=>{for(const p of paginas)assert.deepEqual(p.errores,[]);});
    console.log('RECORRIDO COMPLETO: '+resultados.length+' comprobaciones aprobadas; cero datos en producción.');
})().catch(e=>{console.error(e);resultados.push({nombre:'Recorrido interrumpido',resultado:'FAIL',error:e.message});process.exitCode=1;}).finally(async()=>{
    fs.mkdirSync('qa',{recursive:true});fs.writeFileSync('qa/recorrido-resultado.json',JSON.stringify({fecha:new Date().toISOString(),proyecto:PROYECTO,firestore:'127.0.0.1:8787',auth:'127.0.0.1:9098',produccion:false,alcance:'HTML y controladores reales en JSDOM; SDK y reglas reales en emuladores. GPS y lector de cámara sustituidos explícitamente; se verifica el contenido del QR, no su impresión física.',resultados},null,2)+'\n');
    paginas.forEach(p=>p.close());for(const a of apps){await a.firestore().terminate();await a.delete();}if(env)await env.cleanup();
});
