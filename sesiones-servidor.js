/* La interfaz usa este servicio; la autorización final vive en firestore.rules. */
(function (root) {
    const HORAS_24 = 24 * 60 * 60 * 1000;
    function crearServicioSesiones({ identidad, db, marcaServidor, codigoNuevo, reloj = Date.now }) {
        function presentar(data, uid) {
            if (!data) return null;
            const inicio = data.issuedAt && data.issuedAt.toMillis();
            if (!Number.isFinite(inicio)) throw new Error('Sesión pendiente de confirmación');
            return { uid, origen:'qr', verificada:true, timestamp:inicio, code:data.code,
                chofer:data.chofer, juegoJugado:data.juegoJugado === true, caducada:reloj() >= inicio + HORAS_24 };
        }
        async function restaurarOIniciar(chofer) {
            const uid = await identidad();
            const ref = db.collection('sesiones').doc(uid);
            const snap = await ref.get({ source:'server' });
            const actual = presentar(snap.exists ? snap.data() : null, uid);
            if (actual && !actual.caducada) return actual;
            if (!chofer) return actual;
            const code = codigoNuevo();
            await db.runTransaction(async tx => {
                const fresco = await tx.get(ref);
                const sesion = presentar(fresco.exists ? fresco.data() : null, uid);
                if (sesion && !sesion.caducada) return;
                const issuedAt = marcaServidor();
                tx.set(ref, { code, chofer, issuedAt, juegoJugado:false });
                tx.set(db.collection('reservas_codigos').doc(code), { uid, issuedAt });
            });
            const confirmado = await ref.get({ source:'server' });
            return presentar(confirmado.data(), uid);
        }
        async function consumirJuego() {
            const uid = await identidad();
            const ref = db.collection('sesiones').doc(uid);
            await db.runTransaction(async tx => {
                const snap = await tx.get(ref);
                const sesion = presentar(snap.exists ? snap.data() : null, uid);
                if (!sesion || sesion.caducada || sesion.juegoJugado) throw new Error('Intento no disponible');
                tx.update(ref, { juegoJugado:true });
            });
        }
        return { restaurarOIniciar, consumirJuego };
    }
    function configurarSesionesFirebase(firebase) {
        const auth = firebase.auth();
        const identidad = async () => {
            await new Promise((resolve, reject) => {
                const cancelar = auth.onAuthStateChanged(() => { cancelar(); resolve(); }, reject);
            });
            if (!auth.currentUser) await auth.signInAnonymously();
            return auth.currentUser.uid;
        };
        return crearServicioSesiones({ identidad, db:firebase.firestore(),
            marcaServidor:()=>firebase.firestore.FieldValue.serverTimestamp(),
            codigoNuevo:()=>{
                const bytes = new Uint8Array(4); root.crypto.getRandomValues(bytes);
                return 'ENC-' + Array.from(bytes, b=>b.toString(16).padStart(2,'0')).join('').toUpperCase();
            }
        });
    }
    root.crearServicioSesiones = crearServicioSesiones;
    root.configurarSesionesFirebase = configurarSesionesFirebase;
    if (typeof module !== 'undefined') module.exports = { crearServicioSesiones, configurarSesionesFirebase };
})(typeof window !== 'undefined' ? window : globalThis);
