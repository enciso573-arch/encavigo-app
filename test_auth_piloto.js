// Proveedor anónimo del SDK real contra emuladores locales. Nunca usa encavi-go.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {initializeTestEnvironment} = require('@firebase/rules-unit-testing');
const {doc,setDoc} = require('firebase/firestore');
const firebase = require('firebase/compat/app');
require('firebase/compat/auth'); require('firebase/compat/firestore');
const {configurarSesionesFirebase} = require('./sesiones-servidor');
assert.equal(process.env.FIRESTORE_EMULATOR_HOST,'127.0.0.1:8787');
assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST,'127.0.0.1:9098');
let env,app;
(async()=>{
    env=await initializeTestEnvironment({projectId:'demo-encavigo-audit',firestore:{host:'127.0.0.1',port:8787,rules:fs.readFileSync('firestore.rules','utf8')}});
    await env.clearFirestore();
    await env.withSecurityRulesDisabled(async ctx=>{
        const db=ctx.firestore();
        await setDoc(doc(db,'codigos/V-PILOTO'),{tipo:'vehiculo',estado:'activo'});
    });
    app=firebase.initializeApp({projectId:'demo-encavigo-audit',apiKey:'demo-api-key',authDomain:'demo-encavigo-audit.firebaseapp.com'},'piloto-aislado');
    app.auth().useEmulator('http://127.0.0.1:9098',{disableWarnings:true});
    app.firestore().useEmulator('127.0.0.1',8787);
    const cliente={auth:()=>app.auth(),firestore:Object.assign(()=>app.firestore(),{FieldValue:firebase.firestore.FieldValue})};
    const servicio=configurarSesionesFirebase(cliente);
    assert.equal(await servicio.restaurarOIniciar(null),null);
    assert.equal(app.auth().currentUser.isAnonymous,true);
    console.log('[PASS] Proveedor anónimo real: entrada sin QR no abre sesión promocional');
    const original=await servicio.restaurarOIniciar('V-PILOTO');
    assert.equal(original.uid,app.auth().currentUser.uid);assert.equal(original.chofer,'V-PILOTO');assert.equal(original.verificada,true);
    assert.match(original.code,/^ENC-[A-F0-9]{8}$/);
    await assert.rejects(app.firestore().collection('codigos').doc('V-PILOTO').get());
    await assert.rejects(app.firestore().collection('campaigns').doc('no-autorizado').set({active:true}));
    console.log('[PASS] Identidad anónima crea sesión válida y conserva restricciones administrativas');
    await servicio.consumirJuego();
    const restaurada=await configurarSesionesFirebase(cliente).restaurarOIniciar('V-OTRO');
    assert.equal(restaurada.timestamp,original.timestamp);assert.equal(restaurada.code,original.code);assert.equal(restaurada.chofer,'V-PILOTO');assert.equal(restaurada.juegoJugado,true);
    await assert.rejects(servicio.consumirJuego());
    console.log('[PASS] SDK y reglas conservan sesión y bloquean repetir juego');
    await app.auth().signOut();
    const nueva=await servicio.restaurarOIniciar('V-PILOTO');
    assert.notEqual(nueva.uid,original.uid);assert.notEqual(nueva.code,original.code);
    console.log('[PASS] Limitación comprobada: una identidad anónima nueva recibe otra sesión');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{
    if(app){await app.firestore().terminate();await app.delete();}if(env)await env.cleanup();
});
