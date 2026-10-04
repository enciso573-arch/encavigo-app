// Solo emulador: no aceptar proyectos ni hosts reales.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const { collection, doc, getDoc, setDoc, updateDoc, runTransaction, serverTimestamp } = require('firebase/firestore');
const { JSDOM } = require('jsdom');
const { renderOpinionesSeguras, escaparTextoAdmin } = require('./admin-seguridad');
const { boot } = require('./test_demo_integration');

const host = process.env.FIRESTORE_EMULATOR_HOST;
assert.equal(host, '127.0.0.1:8787', 'Esta suite exige el emulador local en 8787');
let env, passed = 0;
async function check(name, fn) { await env.clearFirestore(); await fn(); passed++; console.log('[PASS] ' + name); }
async function seed(stock = 1) {
    await env.withSecurityRulesDisabled(async ctx => {
        const db = ctx.firestore();
        await setDoc(doc(db, 'campaigns/promo'), { active: true, stock, caja_id: 'CAJA-OK', clicks: 0 });
        await setDoc(doc(db, 'codigos/V-001'), { telefono: 'dato-privado', escaneos: 0 });
    });
}
function ticket(code) {
    return { camp_id:'promo', negocio:'CAJA-OK', code, chofer:'V-001', dev:'device', status:'quemado',
        lat:null, lng:null, acc:null, dist_m:null, revisar:'sin_ubicacion', fecha:serverTimestamp() };
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
        tx.set(t, ticket(code)); tx.set(op, {ticket_id:t.id,camp_id:'promo',fecha:serverTimestamp()});
        tx.update(p, { stock:data.stock-1, ultima_operacion:op.id });
    });
}
function adapter(db) {
    return {
        collection: name => ({ doc: id => id ? doc(db, name, id) : doc(collection(db, name)) }),
        runTransaction: fn => runTransaction(db, tx => fn({
            get: async ref => { const s = await tx.get(ref); return { exists:s.exists(), data:()=>s.data() }; },
            // Objetos del VM se convierten a objetos del SDK, sin alterar los sentinels.
            set: (ref, data) => tx.set(ref, {...data}),
            update: (ref, data) => tx.update(ref, {...data})
        }))
    };
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
    const publicDb = () => env.unauthenticatedContext().firestore();
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
        await seed(); const a = await client(publicDb(),'A'), b = await client(publicDb(),'B');
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
        await env.withSecurityRulesDisabled(ctx => setDoc(doc(ctx.firestore(),'campaigns/otra'), {active:true,stock:2,caja_id:'CAJA-OK'}));
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
    console.log(`Seguridad: ${passed}/10 pruebas pasadas en emulador.`);
})().catch(err=>{console.error(err);process.exitCode=1;}).finally(async()=>{if(env)await env.cleanup();});
