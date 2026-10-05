// Ejecuta los scripts y eventos del HTML real. No carga recursos ni utiliza red.
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
    .map(m => m[1]).filter(s => s.includes('firebaseConfig') || s.includes('CONFIG_PILOTO') || s.includes('function quemarCupon'));
const flush = () => new Promise(resolve => setImmediate(resolve));
function storage() {
    const values = new Map();
    return { getItem: k => values.get(k) ?? null, setItem: (k,v) => values.set(k,String(v)), removeItem: k => values.delete(k) };
}
async function boot(search = '?demo=1', shared = storage(), servicioVerificado = null) {
    const dom = new JSDOM(html, { url: 'https://encavigo.test/' + search, runScripts: 'outside-only' });
    const w = dom.window, calls = [], alerts = [], timers = [], ready = [];
    Object.defineProperty(w, 'localStorage', { value: shared });
    // Doble explícito de verificación: los permisos reales se prueban en el emulador.
    w.EncaviSesiones = servicioVerificado || { restaurarOIniciar: async () => {
        try { const s = JSON.parse(shared.getItem('encavigo_session')); return s && s.origen === 'qr' ? s : null; }
        catch { return null; }
    }, consumirJuego: async () => {} };
    for (const target of [w.document,w]) {
        const add = target.addEventListener.bind(target);
        target.addEventListener = (type, fn, options) => type === 'DOMContentLoaded' ? ready.push(fn) : add(type,fn,options);
    }
    w.setTimeout = fn => { timers.push(fn); return timers.length; };
    w.clearTimeout = () => {};
    w.alert = msg => alerts.push(msg);
    Object.defineProperty(w.navigator, 'geolocation', { value: {
        getCurrentPosition: (ok, fail) => fail?.({ code: 1 }), watchPosition: () => 0
    }});
    function log(type, collection, data) { calls.push({type,collection,data}); return Promise.resolve(); }
    const db = { collection: name => ({
        doc: id => ({ set: data => log('set',name,data), update: data => log('update',name,data),
            get: () => { calls.push({type:'get',collection:name}); return Promise.resolve({exists:false,data:()=>({})}); } }),
        add: data => log('add',name,data),
        where: () => ({ get: () => { calls.push({type:'query',collection:name}); return Promise.resolve({forEach:()=>{}}); } })
    })};
    w.firebase = { initializeApp: () => calls.push({type:'initialize'}), firestore: Object.assign(() => {
        calls.push({type:'firestore'}); return db;
    },{FieldValue:{serverTimestamp:()=>0,increment:n=>n}}) };
    // Map UI is not exercised here; any unexpected dependency causes a failure.
    w.L = { divIcon: () => ({}) };
    vm.runInContext(fs.readFileSync(path.join(__dirname,'comisiones.js'),'utf8'), dom.getInternalVMContext());
    scripts.forEach(s => vm.runInContext(s, dom.getInternalVMContext()));
    await Promise.all(ready.map(fn => fn()));
    await flush();
    return { w, dom, calls, alerts, shared, db,
        timers: () => { while(timers.length) timers.shift()(); },
        close: () => dom.window.close() };
}
async function isolation() {
    const app = await boot('?demo=1&desde=CAJA-DEMO-01');
    try {
        const {w} = app;
        assert.equal(w.document.querySelectorAll('.track-click').length,4);
        const reclamar = w.document.querySelector('.track-click');
        const camp = w.loadedCampaigns.find(c => c.id === reclamar.dataset.campid), before = camp.stock;
        reclamar.click();
        assert.equal(w.document.getElementById('codigoModal').style.display,'flex');
        w.document.getElementById('btnEscanearCaja').click();
        assert.equal(w.document.getElementById('successModal').style.display,'flex');
        assert.equal(w.document.getElementById('successTitulo').textContent,'CANJE DE DEMOSTRACIÓN');
        assert.equal(camp.stock,before-1);
        await w.enviarOpinion();
        w.openGame(); w.flipCard(0); w.flipCard(1); w.flipCard(2); app.timers();
        assert.equal(w.document.getElementById('gameResult').style.display,'block');
        assert.equal(app.shared.getItem('encavigo_demo_played'),'true');
        // Render the empty catalogue via the application's real deck renderer.
        w.loadedCampaigns = [];
        w.EncaviCore.renderDeck([]);
        const chip = w.document.querySelector('.vacio-chip');
        assert.ok(chip); chip.click(); app.timers();
        assert.ok(w.document.querySelector('.vacio-gracias'));
        assert.deepEqual(app.calls,[], 'All real demo actions must leave Firebase untouched');
    } finally { app.close(); }
}
async function transitions() {
    const shared = storage();
    const real = JSON.stringify({timestamp:Date.now(),code:'ENC-PRESERVAR',chofer:'V-001',origen:'qr',juegoJugado:true});
    shared.setItem('encavigo_session',real);
    shared.setItem('encavigo_played_ENC-PRESERVAR','true');
    const a = await boot('?demo=1',shared), b = await boot('?demo=1',shared);
    try {
        a.w.openGame(); a.w.flipCard(0);
        assert.equal(shared.getItem('encavigo_session'),real);
        assert.equal(b.w.encaviSession.origen,'demo');
        // JSDOM cannot navigate; capture its navigation diagnostic while running the real reset.
        a.w.reiniciarDemo();
        assert.equal(shared.getItem('encavigo_demo_session'),null);
        assert.equal(shared.getItem('encavigo_demo_played'),null);
        assert.equal(shared.getItem('encavigo_session'),real);
        assert.equal(shared.getItem('encavigo_played_ENC-PRESERVAR'),'true');
        assert.deepEqual(a.calls,[]); assert.deepEqual(b.calls,[]);
        const out = await boot('',shared);
        try {
            assert.equal(out.w.encaviSession.code,'ENC-PRESERVAR');
            assert.equal(out.w.encaviSession.juegoJugado,true);
            assert.equal(shared.getItem('encavigo_session'),real);
        } finally { out.close(); }
    } finally { a.close(); b.close(); }
}
async function corruptStorage() {
    const shared = storage();
    shared.setItem('encavigo_session','{invalid'); shared.setItem('encavigo_demo_session','{invalid');
    const app = await boot('?demo=1',shared);
    try { assert.equal(app.w.encaviSession.origen,'demo'); assert.deepEqual(app.calls,[]); }
    finally { app.close(); }
    const out = await boot('',shared);
    try { assert.ok(out.w.document.body.textContent.includes('Escanea el código en tu transporte')); }
    finally { out.close(); }
}
async function deferredOpinion() {
    for (const reject of [false,true]) {
        const app = await boot('?demo=1');
        try {
            const {w} = app;
            w.__ENCAVI_ENTORNO__ = 'production';
            w.encaviSession = {origen:'qr',code:'ENC-OP',chofer:'V-001'};
            let resolve, decline;
            const response = new Promise((r,j) => { resolve=r; decline=j; });
            w.db = { collection: () => ({add: () => response}) };
            w.document.getElementById('opPaso3').style.display='none';
            const pending = w.enviarOpinion();
            assert.equal(typeof pending?.then,'function');
            assert.equal(w.document.getElementById('opPaso3').style.display,'none');
            if (reject) decline(new Error('offline')); else resolve();
            await pending;
            assert.equal(w.document.getElementById('opPaso3').style.display,reject?'none':'block');
            assert.equal(app.alerts.length,reject?1:0);
        } finally { app.close(); }
    }
}
module.exports = { boot, isolation, transitions, corruptStorage, deferredOpinion };

