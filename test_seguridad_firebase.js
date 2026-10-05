// Solo emulador: no aceptar proyectos ni hosts reales.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const { collection, doc, getDoc, getDocFromServer, setDoc, updateDoc, deleteDoc, runTransaction, serverTimestamp, Timestamp } = require('firebase/firestore');
const { JSDOM } = require('jsdom');
const { renderOpinionesSeguras, escaparTextoAdmin } = require('./admin-seguridad');
const { boot } = require('./test_demo_integration');
const { crearServicioSesiones } = require('./sesiones-servidor');
const Comisiones = require('./comisiones');

const host = process.env.FIRESTORE_EMULATOR_HOST;
assert.equal(host, '127.0.0.1:8787', 'Esta suite exige el emulador local en 8787');
let env, passed = 0;
async function check(name, fn) { await env.clearFirestore(); await fn(); passed++; console.log('[PASS] ' + name); }
async function seed(stock = 1) {
    await env.withSecurityRulesDisabled(async ctx => {
        const db = ctx.firestore();
        await setDoc(doc(db, 'campaigns/promo'), { active: true, stock, caja_id: 'CAJA-OK', clicks: 0, tarifa:25, title:'Negocio' });
        await setDoc(doc(db, 'codigos/V-001'), { tipo:'vehiculo', estado:'activo', telefono: 'dato-privado', escaneos: 0 });
        for (const [uid,code] of [['passenger','A'],['passengerB','B']]) {
            await setDoc(doc(db,'sesiones/'+uid),{code,chofer:'V-001',issuedAt:Timestamp.now(),juegoJugado:false});
        }
    });
}
function ticket(code) {
    return { camp_id:'promo', negocio:'CAJA-OK', code, chofer:'V-001', dev:'device', status:'quemado',
        lat:null, lng:null, acc:null, dist_m:null, revisar:'sin_ubicacion', fecha:serverTimestamp(),
        comision_centavos:2500, moneda:'MXN', negocio_nombre:'Negocio' };
}
function operation(tx, db, ticketId, campId = 'promo') {
    const op = doc(collection(db,'operaciones_canje'));
    tx.set(op,{ticket_id:ticketId,camp_id:campId,fecha:serverTimestamp()});
    return op.id;
}
function redeem(db, code) {
    return runTransaction(db, async tx => {
        const p = doc(db, 'campaigns/promo'), t = doc(db, 'tickets/CAJA-OK_' + code);
        const data = (await tx.get(p)).data();
        if (!data || data.stock <= 0) throw new Error('agotado');
        const op = doc(collection(db,'operaciones_canje'));
        tx.set(t, {...ticket(code),...Comisiones.captura(data)}); tx.set(op, {ticket_id:t.id,camp_id:'promo',fecha:serverTimestamp()});
        tx.update(p, { stock:data.stock-1, ultima_operacion:op.id });
    });
}
function adapter(db) {
    const wrap = ref => ({ id:ref.id, raw:ref, get:async(options)=>{
        const s = options && options.source === 'server' ? await getDocFromServer(ref) : await getDoc(ref);
        return {exists:s.exists(),data:()=>s.data()};
    } });
    return {
        collection: name => ({ doc: id => wrap(id ? doc(db, name, id) : doc(collection(db, name))) }),
        runTransaction: fn => runTransaction(db, tx => fn({
            get: async ref => { const s = await tx.get(ref.raw); return { exists:s.exists(), data:()=>s.data() }; },
            // Objetos del VM se convierten a objetos del SDK, sin alterar los sentinels.
            set: (ref, data) => tx.set(ref.raw, {...data}),
            update: (ref, data) => tx.update(ref.raw, {...data})
        }))
    };
}
function sessionService(uid, code = 'ENC-0123ABCD') {
    return crearServicioSesiones({ identidad:async()=>uid,
        db:adapter(env.authenticatedContext(uid).firestore()), marcaServidor:serverTimestamp,
        codigoNuevo:()=>code });
}
async function client(db, code) {
    const app = await boot('?demo=1');
    app.w.__ENCAVI_ENTORNO__ = 'production';
    app.w.encaviSession = { origen:'qr', code, chofer:'V-001', timestamp:Date.now() };
    app.w.db = adapter(db);
    app.w.firebase.firestore.FieldValue.serverTimestamp = serverTimestamp;
    app.w.loadedCampaigns = [{ id:'promo', title:'Negocio', caja_id:'CAJA-OK', stock:10, active:true }];
    return app;
}
async function readPrivate(path) {
    let data;
    await env.withSecurityRulesDisabled(async ctx => { data = (await getDoc(doc(ctx.firestore(), path))).data(); });
    return data;
}
(async () => {
    env = await initializeTestEnvironment({ projectId:'demo-encavigo-audit', firestore:{ host:'127.0.0.1', port:8787, rules:fs.readFileSync('firestore.rules','utf8') } });
    const publicDb = (uid = 'passenger') => env.authenticatedContext(uid).firestore();
    await check('Cuenta normal sin permisos administrativos ni lectura de datos privados', async () => {
        await seed(); const db = env.authenticatedContext('visitor').firestore();
        await assertFails(updateDoc(doc(db,'campaigns/promo'),{stock:999}));
        await assertFails(getDoc(doc(db,'codigos/V-001')));
        await assertFails(setDoc(doc(db,'admins/visitor'),{activo:true}));
        await assertSucceeds(updateDoc(doc(env.authenticatedContext('ZS4cI7hnMXVPpCaQECFg208TLbL2').firestore(),'campaigns/promo'),{stock:5}));
    });
    await check('Ticket suelto y descuento de stock sin ticket rechazados', async () => {
        await seed(); const db = publicDb();
        await assertFails(setDoc(doc(db,'tickets/CAJA-OK_A'),ticket('A')));
        await assertFails(updateDoc(doc(db,'campaigns/promo'),{stock:0}));
        assert.equal((await readPrivate('campaigns/promo')).stock,1);
    });
    await check('Canje atómico permitido y repetición rechazada sin descontar otra vez', async () => {
        await seed(3); const db = publicDb();
        await assertSucceeds(redeem(db,'A')); await assertFails(redeem(db,'A'));
        assert.equal((await readPrivate('campaigns/promo')).stock,2);
        const campaign = await readPrivate('campaigns/promo');
        assert.ok(!campaign.ultima_operacion.includes('CAJA-OK_'));
        await assertFails(getDoc(doc(db,'operaciones_canje/'+campaign.ultima_operacion)));
        await assertFails(getDoc(doc(db,'tickets/CAJA-OK_A')));
    });
    await check('Negocio inventado y stock sin decremento invalidan todo el canje', async () => {
        await seed(); const db = publicDb();
        await assertFails(runTransaction(db, async tx => {
            const p = doc(db,'campaigns/promo'); await tx.get(p);
            tx.set(doc(db,'tickets/FALSO_A'),{...ticket('A'),negocio:'FALSO'});
            tx.update(p,{stock:0,ultima_operacion:operation(tx,db,'FALSO_A')});
        }));
        assert.equal((await readPrivate('campaigns/promo')).stock,1);
        assert.equal(await readPrivate('tickets/FALSO_A'),undefined);
    });
    await check('Dos clientes reales del HTML compiten por el último cupón: un solo éxito', async () => {
        await seed(); const a = await client(publicDb(),'A'), b = await client(publicDb('passengerB'),'B');
        try {
            await Promise.all([a.w.quemarCupon('promo','Negocio'), b.w.quemarCupon('promo','Negocio')]);
            const winners = [a,b].filter(c => c.w.document.getElementById('successModal').style.display === 'flex');
            assert.equal(winners.length,1, JSON.stringify({a:a.alerts,b:b.alerts})); assert.equal((await readPrivate('campaigns/promo')).stock,0);
            const tickets = await Promise.all(['A','B'].map(c=>readPrivate('tickets/CAJA-OK_'+c)));
            assert.equal(tickets.filter(Boolean).length,1);
        } finally { a.close(); b.close(); }
    });
    await check('HTML real: código repetido rechazado y stock local no cambia al fallar', async () => {
        await seed(3); await redeem(publicDb(),'A'); const app = await client(publicDb(),'A');
        try {
            await app.w.quemarCupon('promo','Negocio');
            assert.notEqual(app.w.document.getElementById('successModal').style.display,'flex');
            assert.equal(app.w.loadedCampaigns[0].stock,10);
            assert.equal((await readPrivate('campaigns/promo')).stock,2);
        } finally { app.close(); }
    });
    await check('Premio piloto bloqueado y opiniones con tipos inválidos rechazadas', async () => {
        const db = publicDb();
        await assertFails(setDoc(doc(db,'premios/falso'),{chofer:'V-001',dev:'x',fecha:serverTimestamp()}));
        const opinion = {camp_id:'promo',negocio:'Negocio',chofer:'V-001',respetado:true,estrellas:5,comentario:'Bien',atendida:false,fecha:serverTimestamp()};
        await assertSucceeds(setDoc(doc(db,'opiniones/valida'),opinion));
        await assertFails(setDoc(doc(db,'opiniones/invalida'),{...opinion,comentario:[]}));
        await assertFails(setDoc(doc(db,'opiniones/falsa'),{...opinion,atendida:true}));
    });
    await check('Dos promociones del mismo negocio no admiten repetir el código', async () => {
        await seed(3); await redeem(publicDb(),'A');
        await env.withSecurityRulesDisabled(ctx => setDoc(doc(ctx.firestore(),'campaigns/otra'), {active:true,stock:2,caja_id:'CAJA-OK',tarifa:25,title:'Negocio'}));
        const db = publicDb();
        await assertFails(runTransaction(db, async tx => {
            const p = doc(db,'campaigns/otra'); await tx.get(p);
            tx.set(doc(db,'tickets/CAJA-OK_A'),{...ticket('A'),camp_id:'otra'});
            tx.update(p,{stock:1,ultima_operacion:operation(tx,db,'CAJA-OK_A','otra')});
        }));
        assert.equal((await readPrivate('campaigns/otra')).stock,2);
    });
    await check('Promoción desactivada y dos tickets por un descuento se rechazan', async () => {
        await seed(2); const db = publicDb();
        await assertFails(runTransaction(db, async tx => {
            const p = doc(db,'campaigns/promo'); await tx.get(p);
            tx.set(doc(db,'tickets/CAJA-OK_A'),ticket('A'));
            tx.set(doc(db,'tickets/CAJA-OK_B'),ticket('B'));
            tx.update(p,{stock:1,ultima_operacion:operation(tx,db,'CAJA-OK_B')});
        }));
        assert.equal((await readPrivate('campaigns/promo')).stock,2);
        await env.withSecurityRulesDisabled(ctx => updateDoc(doc(ctx.firestore(),'campaigns/promo'),{active:false}));
        await assertFails(redeem(db,'A'));
        assert.equal((await readPrivate('campaigns/promo')).stock,2);
    });
    await check('Opiniones con HTML malicioso se presentan como texto sin crear etiquetas', async () => {
        const dom = new JSDOM('<div id="ops"></div>');
        try {
            const box = dom.window.document.getElementById('ops');
            renderOpinionesSeguras(box,[{negocio:'<img src=x onerror=alert(1)>',comentario:'<script>alert(1)</script>',estrellas:999}]);
            assert.equal(box.querySelectorAll('img,script').length,0);
            assert.ok(box.textContent.includes('<script>'));
            assert.ok(box.textContent.includes('★★★★★'));
            assert.equal(escaparTextoAdmin('<img src=x onerror="a">'), '&lt;img src=x onerror=&quot;a&quot;&gt;');
        } finally { dom.window.close(); }
    });
    await check('Primera sesión QR con fecha de servidor; acceso directo no crea sesión', async () => {
        await seed(); const service = sessionService('nuevo');
        assert.equal(await service.restaurarOIniciar(null),null);
        const s = await service.restaurarOIniciar('V-001');
        assert.equal(s.code,'ENC-0123ABCD'); assert.equal(s.chofer,'V-001');
        assert.equal(s.caducada,false); assert.equal(s.verificada,true);
        assert.ok(Math.abs(Date.now()-s.timestamp)<10000);
    });
    await check('Recarga y reescaneo conservan inicio, código, conductor e intento', async () => {
        await seed(); const a = sessionService('nuevo'), b = sessionService('nuevo','ENC-FEDCBA98');
        const first = await a.restaurarOIniciar('V-001'); await a.consumirJuego();
        const direct = await b.restaurarOIniciar(null), rescanned = await b.restaurarOIniciar('OTRO');
        assert.equal(direct.code,first.code); assert.equal(rescanned.timestamp,first.timestamp);
        assert.equal(rescanned.chofer,'V-001'); assert.equal(rescanned.juegoJugado,true);
    });
    await check('Vehículo desconocido, inactivo, dado de baja o QR de caja no crean sesión', async () => {
        await seed();
        await env.withSecurityRulesDisabled(async ctx => {
            const db=ctx.firestore();
            await setDoc(doc(db,'codigos/INACTIVO'),{tipo:'vehiculo',estado:'baja'});
            await setDoc(doc(db,'codigos/CAJA'),{tipo:'caja',estado:'activo'});
            await setDoc(doc(db,'codigos/BAJA'),{tipo:'vehiculo',estado:'activo'});
            await setDoc(doc(db,'bajas/BAJA'),{fecha:Timestamp.now()});
        });
        for (const code of ['INVENTADO','INACTIVO','CAJA','BAJA']) {
            await assert.rejects(sessionService('nuevo').restaurarOIniciar(code));
            assert.equal(await readPrivate('sesiones/nuevo'),undefined);
        }
    });
    await check('Manipular fecha, código o chofer y leer sesiones ajenas se rechaza', async () => {
        await seed(); const db=publicDb();
        await assertFails(updateDoc(doc(db,'sesiones/passenger'),{issuedAt:serverTimestamp()}));
        await assertFails(updateDoc(doc(db,'sesiones/passenger'),{code:'ENC-FFFFFFFF'}));
        await assertFails(updateDoc(doc(db,'sesiones/passenger'),{chofer:'FALSO'}));
        await assertFails(getDoc(doc(db,'sesiones/passengerB')));
        await assertFails(setDoc(doc(db,'sesiones/visitor'),{code:'A',chofer:'V-001',issuedAt:serverTimestamp(),juegoJugado:false}));
    });
    await check('Sesión vencida niega canje; nuevo QR permite renovar con otro código', async () => {
        await seed();
        await env.withSecurityRulesDisabled(ctx=>updateDoc(doc(ctx.firestore(),'sesiones/passenger'),{
            issuedAt:Timestamp.fromMillis(Date.now()-24*3600000-10000), juegoJugado:true
        }));
        await assertFails(redeem(publicDb(),'A'));
        const service=sessionService('passenger');
        assert.equal((await service.restaurarOIniciar(null)).caducada,true);
        const fresh=await service.restaurarOIniciar('V-001');
        assert.equal(fresh.caducada,false); assert.equal(fresh.juegoJugado,false);
        assert.notEqual(fresh.code,'A');
    });
    await check('Un intento de juego entre dos pestañas y sin restablecimiento desde cliente', async () => {
        await seed(); const a=sessionService('passenger'), b=sessionService('passenger');
        const results=await Promise.allSettled([a.consumirJuego(),b.consumirJuego()]);
        assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
        assert.equal((await a.restaurarOIniciar(null)).juegoJugado,true);
        await assertFails(updateDoc(doc(publicDb(),'sesiones/passenger'),{juegoJugado:false}));
    });
    await check('Código reservado no se reasigna a otro pasajero ni deja una sesión parcial', async () => {
        await seed(); await sessionService('nuevo').restaurarOIniciar('V-001');
        await assert.rejects(sessionService('otro').restaurarOIniciar('V-001'));
        assert.equal(await readPrivate('sesiones/otro'),undefined);
    });
    await check('Canje sin identidad, con código ajeno o vehículo dado de baja se rechaza', async () => {
        await seed(3);
        await assertFails(redeem(env.unauthenticatedContext().firestore(),'A'));
        await assertFails(redeem(publicDb('passengerB'),'A'));
        await env.withSecurityRulesDisabled(ctx=>setDoc(doc(ctx.firestore(),'bajas/V-001'),{fecha:Timestamp.now()}));
        await assertFails(redeem(publicDb(),'A'));
        await assert.rejects(sessionService('passenger').restaurarOIniciar(null));
        assert.equal((await readPrivate('campaigns/promo')).stock,3);
    });
    await check('HTML ignora sesión local inventada y toma el código confirmado por servidor', async () => {
        await seed(); const values=new Map();
        values.set('encavigo_session',JSON.stringify({origen:'qr',code:'ENC-FALSO',chofer:'FALSO',timestamp:Date.now()}));
        const store={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
        const service=sessionService('nuevo');
        const direct=await boot('',store,service);
        try { assert.equal(direct.w.encaviSession,null); }
        finally { direct.close(); }
        const qr=await boot('?chofer=V-001',store,service);
        try {
            assert.equal(qr.w.encaviSession.code,'ENC-0123ABCD');
            assert.equal(qr.w.encaviSession.chofer,'V-001');
            assert.equal(qr.w.encaviSession.verificada,true);
            assert.equal(JSON.parse(store.getItem('encavigo_session')).code,'ENC-0123ABCD');
        } finally { qr.close(); }
    });
    await check('HTML no voltea la tarjeta hasta confirmar el intento en servidor', async () => {
        await seed(); const a=await boot('',undefined,sessionService('passenger'));
        const b=await boot('',undefined,sessionService('passenger'));
        try {
            a.w.openGame(); b.w.openGame();
            await Promise.all([a.w.flipCard(0),b.w.flipCard(0)]);
            const flipped=[a,b].filter(x=>x.w.document.getElementById('card-0').classList.contains('flipped'));
            assert.equal(flipped.length,1);
        } finally { a.close(); b.close(); }
    });
    await check('Adelantar el reloj del cliente no permite renovar una sesión vigente', async () => {
        await seed(); const db=adapter(publicDb());
        const manipulated=crearServicioSesiones({identidad:async()=> 'passenger',db,marcaServidor:serverTimestamp,
            codigoNuevo:()=> 'ENC-0123ABCD',reloj:()=>Date.now()+48*3600000});
        await assert.rejects(manipulated.restaurarOIniciar('V-001'));
        assert.equal((await readPrivate('sesiones/passenger')).code,'A');
    });
    await check('Si no hay verificación de red, no se restaura la sesión desde una copia local', async () => {
        const service=crearServicioSesiones({identidad:async()=> 'passenger',db:{collection:()=>({doc:()=>({get:async options=>{
            assert.equal(options.source,'server'); throw new Error('offline');
        }})})},marcaServidor:serverTimestamp,codigoNuevo:()=> 'ENC-0123ABCD'});
        const app=await boot('',undefined,service);
        try { assert.equal(app.w.encaviSession,null); assert.ok(app.w.document.body.textContent.includes('No pudimos verificar')); }
        finally { app.close(); }
    });
    await check('Tarifa histórica inmutable aunque se edite o borre la promoción', async () => {
        await seed(); await redeem(publicDb(),'A');
        const admin=env.authenticatedContext('ZS4cI7hnMXVPpCaQECFg208TLbL2').firestore();
        await updateDoc(doc(admin,'campaigns/promo'),{tarifa:80});
        await deleteDoc(doc(admin,'campaigns/promo'));
        assert.equal((await readPrivate('tickets/CAJA-OK_A')).comision_centavos,2500);
        await assertFails(updateDoc(doc(admin,'tickets/CAJA-OK_A'),{comision_centavos:8000}));
    });
    await check('Cliente no puede introducir una comisión inventada ni registrar pagos', async () => {
        await seed(); const db=publicDb();
        await assertFails(runTransaction(db,async tx=>{
            const p=doc(db,'campaigns/promo');await tx.get(p);
            tx.set(doc(db,'tickets/CAJA-OK_A'),{...ticket('A'),comision_centavos:8000});
            tx.update(p,{stock:0,ultima_operacion:operation(tx,db,'CAJA-OK_A')});
        }));
        await redeem(db,'A');
        await assert.rejects(Comisiones.registrar(adapter(db),'CAJA-OK_A','pago','falso','passenger',serverTimestamp));
    });
    await check('Revisión, adelanto y recuperación; dobles pagos y cambios de historial bloqueados', async () => {
        await seed(); await redeem(publicDb(),'A');
        const uid='ZS4cI7hnMXVPpCaQECFg208TLbL2', db=env.authenticatedContext(uid).firestore();
        const registrar=(tipo,ref)=>Comisiones.registrar(adapter(db),'CAJA-OK_A',tipo,ref,uid,serverTimestamp);
        await assert.rejects(registrar('pago','antes de revisión'));
        await registrar('aprobar','Verificado con el negocio');
        const intentos=await Promise.allSettled([registrar('pago','Transferencia 001'),registrar('pago','Transferencia 002')]);
        assert.equal(intentos.filter(x=>x.status==='fulfilled').length,1);
        const t={...(await readPrivate('tickets/CAJA-OK_A')),id:'CAJA-OK_A'};
        const movimientos={'CAJA-OK_A_revision':await readPrivate('movimientos_comision/CAJA-OK_A_revision'),
            'CAJA-OK_A_pago':await readPrivate('movimientos_comision/CAJA-OK_A_pago')};
        assert.equal(Comisiones.resumen([t],movimientos,{desde:null}).anticipado,2500);
        await registrar('cobro','Recibo negocio 001');
        movimientos['CAJA-OK_A_cobro']=await readPrivate('movimientos_comision/CAJA-OK_A_cobro');
        const r=Comisiones.resumen([t],movimientos,{desde:null});
        assert.equal(r.anticipado,0);assert.equal(r.cobrar,0);assert.equal(r.pagar,0);
        await assertFails(updateDoc(doc(db,'movimientos_comision/CAJA-OK_A_pago'),{referencia:'otra'}));
        await assert.rejects(registrar('rechazar','cambiar decisión'));
    });
    await check('Reglas niegan pago sin aprobación, importes incorrectos y duplicación con otro ID', async () => {
        await seed();await redeem(publicDb(),'A');
        const uid='ZS4cI7hnMXVPpCaQECFg208TLbL2',db=env.authenticatedContext(uid).firestore();
        const movimiento={ticket_id:'CAJA-OK_A',tipo:'pago',referencia:'recibo',importe_centavos:2500,admin_uid:uid,fecha:serverTimestamp()};
        await assertFails(setDoc(doc(db,'movimientos_comision/CAJA-OK_A_pago'),movimiento));
        await Comisiones.registrar(adapter(db),'CAJA-OK_A','aprobar','Verificado',uid,serverTimestamp);
        await assertFails(setDoc(doc(db,'movimientos_comision/CAJA-OK_A_pago'),{...movimiento,importe_centavos:8000}));
        await assertFails(setDoc(doc(db,'movimientos_comision/otro-id'),movimiento));
        await assertSucceeds(setDoc(doc(db,'movimientos_comision/CAJA-OK_A_pago'),movimiento));
    });
    await check('Canje sin marca de revisión permite cobro y pago completos por administración', async () => {
        await seed(); const app=await client(publicDb(),'A');
        // Ubicación confiable del negocio: flujo real sin revisión pendiente.
        app.w.loadedCampaigns[0].lat=19.4; app.w.loadedCampaigns[0].lng=-99.1;
        app.w.leerUbicacion=async()=>({lat:19.4,lng:-99.1,acc:5});
        try {await app.w.quemarCupon('promo','Negocio');} finally {app.close();}
        const t=await readPrivate('tickets/CAJA-OK_A');assert.equal(t.revisar,null);
        const uid='ZS4cI7hnMXVPpCaQECFg208TLbL2',db=adapter(env.authenticatedContext(uid).firestore());
        await Comisiones.registrar(db,'CAJA-OK_A','cobro','Recibo 01',uid,serverTimestamp);
        await Comisiones.registrar(db,'CAJA-OK_A','pago','Transferencia 01',uid,serverTimestamp);
    });
    await check('Cortesía genera cero deuda y canje rechazado no permite cobro ni pago', async () => {
        await seed();
        await env.withSecurityRulesDisabled(ctx=>updateDoc(doc(ctx.firestore(),'campaigns/promo'),{tarifa:0}));
        await redeem(publicDb(),'A');
        const uid='ZS4cI7hnMXVPpCaQECFg208TLbL2',db=adapter(env.authenticatedContext(uid).firestore());
        await Comisiones.registrar(db,'CAJA-OK_A','rechazar','Negocio no confirmó el canje',uid,serverTimestamp);
        await assert.rejects(Comisiones.registrar(db,'CAJA-OK_A','cobro','recibo',uid,serverTimestamp));
        await assert.rejects(Comisiones.registrar(db,'CAJA-OK_A','pago','pago',uid,serverTimestamp));
        const t={...(await readPrivate('tickets/CAJA-OK_A')),id:'CAJA-OK_A'};
        assert.equal(t.comision_centavos,0);assert.equal(Comisiones.resumen([t],{}, {desde:null}).pagar,0);
    });
    console.log(`Seguridad: ${passed}/28 pruebas pasadas en emulador.`);
})().catch(err=>{console.error(err);process.exitCode=1;}).finally(async()=>{if(env)await env.cleanup();});
