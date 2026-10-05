// HTML y controladores reales, con SDK real conectado previamente al emulador.
// No se descargan recursos de la página ni se modifican sus archivos publicados.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {JSDOM, VirtualConsole} = require('jsdom');

function datosSDK(v) {
    if (Array.isArray(v)) return Array.from(v, datosSDK);
    if (v && Object.getPrototypeOf(v)?.constructor?.name === 'Object') {
        return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,datosSDK(x)]));
    }
    return v; // Conserva Timestamp y FieldValue del SDK, sin convertirlos a JSON.
}
function baseSDK(db) {
    const raw = r => r.__sdk || r;
    function ref(r) {
        return {__sdk:r,id:r.id,path:r.path,
            get:opts=>r.get(opts),set:(d,opts)=>opts?r.set(datosSDK(d),datosSDK(opts)):r.set(datosSDK(d)),
            update:d=>r.update(datosSDK(d)),delete:()=>r.delete()};
    }
    function query(q) {
        return {get:opts=>q.get(opts),onSnapshot:(...args)=>q.onSnapshot(...args),
            where:(...args)=>query(q.where(...args)),orderBy:(...args)=>query(q.orderBy(...args)),
            limit:n=>query(q.limit(n)),doc:id=>ref(id?q.doc(id):q.doc()),add:d=>q.add(datosSDK(d))};
    }
    return {collection:n=>query(db.collection(n)),runTransaction:fn=>db.runTransaction(tx=>fn({
        get:r=>tx.get(raw(r)),set:(r,d,opts)=>opts?tx.set(raw(r),datosSDK(d),datosSDK(opts)):tx.set(raw(r),datosSDK(d)),
        update:(r,d)=>tx.update(raw(r),datosSDK(d)),delete:r=>tx.delete(raw(r))
    })),batch:()=>{const b=db.batch();return {
        set:(r,d,opts)=>opts?b.set(raw(r),datosSDK(d),datosSDK(opts)):b.set(raw(r),datosSDK(d)),
        update:(r,d)=>b.update(raw(r),datosSDK(d)),delete:r=>b.delete(raw(r)),commit:()=>b.commit()
    };}};
}
async function hasta(fn, nombre, timeout=15000) {
    const limite=Date.now()+timeout;let valor;
    while(Date.now()<limite) {valor=await fn();if(valor)return valor;await new Promise(r=>setTimeout(r,25));}
    throw Error('Tiempo agotado: '+nombre);
}
async function pagina(file, app, sdk, opciones={}) {
    if(app.options.projectId!=='demo-encavigo-audit')throw Error('Solo admite el proyecto local ficticio.');
    const html=fs.readFileSync(path.join(__dirname,'..',file),'utf8');
    const errores=[],avisos=[],impresos=[],callbacks=[],suscripciones=[];
    const vc=new VirtualConsole();vc.on('jsdomError',e=>errores.push(e.message));
    vc.on('error',(...args)=>errores.push(args.map(x=>x?.message||String(x)).join(' ')));
    const dom=new JSDOM(html,{url:'https://encavigo.test/'+(file==='index.html'?'':file)+(opciones.search||''),runScripts:'outside-only',virtualConsole:vc});
    const w=dom.window,db=baseSDK(app.firestore());
    const auth={get currentUser(){return app.auth().currentUser;},
        onAuthStateChanged:(ok,fallo)=>{const stop=app.auth().onAuthStateChanged(ok,fallo);suscripciones.push(stop);return stop;},
        signInAnonymously:()=>app.auth().signInAnonymously(),
        signInWithEmailAndPassword:(e,p)=>app.auth().signInWithEmailAndPassword(e,p),signOut:()=>app.auth().signOut()};
    w.firebase={initializeApp:()=>app,auth:()=>auth,firestore:Object.assign(()=>db,{FieldValue:sdk.firestore.FieldValue})};
    w.alert=t=>avisos.push(t);w.confirm=()=>true;w.prompt=()=>opciones.respuesta||'PRUEBA';
    w.fetch=async()=>{throw Error('La prueba no permite consultas externas.');};
    w.open=()=>{let texto='';const p={document:{write:s=>{texto+=s;},close:()=>impresos.push(texto)}};return p;};
    Object.defineProperty(w.navigator,'geolocation',{value:{
        getCurrentPosition:(ok,fail)=>opciones.gps===false?fail({code:1}):ok({coords:{latitude:20.65,longitude:-105.22,accuracy:10}}),
        watchPosition:()=>0,clearWatch:()=>{}
    }});
    w.Html5QrcodeScanner=class {render(ok){w.__lectorQR=ok;}clear(){return Promise.resolve();}};
    const mapa={setView(){return this;},on(){return this;},invalidateSize(){},getZoom(){return 15;},removeLayer(){}};
    const pin={addTo(){return this;},on(){return this;},setLatLng(){return this;},getLatLng(){return {lat:20.65,lng:-105.22};},bindPopup(){return this;}};
    w.L={map:()=>mapa,tileLayer:()=>({addTo(){}}),marker:()=>pin,divIcon:()=>({})};
    const add=w.document.addEventListener.bind(w.document);
    w.document.addEventListener=(n,f,o)=>n==='DOMContentLoaded'?callbacks.push(f):add(n,f,o);
    // Las escuchas de Firestore sí reciben cambios reales; se cancelan al cerrar.
    const col=db.collection;db.collection=n=>{const q=col(n),watch=q.onSnapshot;q.onSnapshot=(...a)=>{const stop=watch(...a);suscripciones.push(stop);return stop;};return q;};
    for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
        const src=m[1].match(/src="([^"]+)"/);
        if(src){if(/^https?:/.test(src[1]))continue;vm.runInContext(fs.readFileSync(path.join(__dirname,'..',src[1]),'utf8'),dom.getInternalVMContext(),{filename:src[1]});}
        else if(m[2].trim())vm.runInContext(m[2],dom.getInternalVMContext(),{filename:file});
    }
    await Promise.all(callbacks.map(fn=>fn()));
    return {w,db,avisos,errores,impresos,set:(id,v)=>{w.document.getElementById(id).value=v;},
        close:()=>{suscripciones.splice(0).forEach(fn=>fn());w.close();}};
}
module.exports={pagina,hasta};
