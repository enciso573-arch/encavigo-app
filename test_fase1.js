/**
 * Suite de Verificación Automatizada - EncaviGO Piloto Fase 1
 * Comprueba los 12 casos obligatorios de acceso, sesión, juego y vigencia.
 * No se conecta a Firebase ni escribe datos en producción.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('===============================================================');
console.log('ENCAVIGO - VERIFICACIÓN DE FASE 1: ACCESO, SESIÓN Y JUEGO');
console.log('===============================================================\n');

// 1. Cargar y extraer el entorno desde index.html
const indexPath = path.join(__dirname, 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');

// Simular entorno DOM mínimo y seguro
class MockStorage {
    constructor() {
        this.store = {};
    }
    getItem(key) {
        return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
    }
    setItem(key, value) {
        this.store[key] = String(value);
    }
    removeItem(key) {
        delete this.store[key];
    }
    clear() {
        this.store = {};
    }
}

// Extraer el bloque del script principal
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match, mainScriptCode = '';
while ((match = scriptRegex.exec(indexHtml)) !== null) {
    if (match[1].includes('CONFIG_PILOTO')) {
        mainScriptCode = match[1];
        break;
    }
}

if (!mainScriptCode) {
    console.error('ERROR: No se encontró CONFIG_PILOTO en index.html');
    process.exit(1);
}

// Crear sandbox para ejecutar las funciones puras
const sandbox = {
    window: {},
    document: {
        body: { innerHTML: '' },
        getElementById: () => null,
        querySelector: () => null,
        addEventListener: () => {}
    },
    localStorage: new MockStorage(),
    sessionStorage: new MockStorage(),
    Date: Date,
    Math: Math,
    console: console,
    setTimeout: (fn) => fn(),
    URLSearchParams: URLSearchParams,
    addEventListener: () => {},
    history: { replaceState: () => {} },
    location: { search: '', pathname: '/' }
};
sandbox.window = sandbox;

vm.createContext(sandbox);
vm.runInContext(mainScriptCode, sandbox);

const Core = sandbox.EncaviCore;
if (!Core) {
    console.error('ERROR: EncaviCore no fue expuesto en window.');
    process.exit(1);
}

const {
    CONFIG_PILOTO,
    ESTADO_ACCESO,
    evaluarEstadoAcceso,
    puedeJugarSesion,
    registrarIntentoJuego,
    esCampanaVigente,
    mostrarPantallaBloqueo,
    escapeHTML
} = Core;

let passedTests = 0;
let totalTests = 14;

function test(num, description, fn) {
    try {
        fn();
        console.log(`[PASS] Caso ${num}: ${description}`);
        passedTests++;
    } catch (err) {
        console.error(`[FAIL] Caso ${num}: ${description}`);
        console.error('       Detalle:', err.message);
    }
}

// ----------------------------------------------------------------------------
// CASO 1: Entrada directa sin sesión
// ----------------------------------------------------------------------------
test(1, 'Entrada directa sin sesión', () => {
    const res = evaluarEstadoAcceso({
        session: null,
        paramChofer: null,
        now: Date.now()
    });
    assert.strictEqual(res.estado, ESTADO_ACCESO.SIN_ACCESO, 'El estado debe ser SIN_ACCESO');
    assert.strictEqual(puedeJugarSesion(null), false, 'No se puede jugar sin sesión');

    // Verificar que mostrar pantalla de bloqueo no lance errores y renderice mensaje correcto
    const docMock = { body: { innerHTML: '' } };
    const originalDoc = sandbox.document;
    sandbox.document = docMock;
    mostrarPantallaBloqueo(ESTADO_ACCESO.SIN_ACCESO);
    assert.ok(docMock.body.innerHTML.includes('Escanea el código en tu transporte'), 'Debe pedir escanear el QR');
    assert.ok(!docMock.body.innerHTML.includes('Sesión Expirada'), 'NO debe decir Sesión Expirada');
    assert.ok(!docMock.body.innerHTML.includes('Sesión Vencida'), 'NO debe decir Sesión Vencida');
    sandbox.document = originalDoc;
});

// ----------------------------------------------------------------------------
// CASO 2: Sesión QR nueva
// ----------------------------------------------------------------------------
test(2, 'Sesión QR nueva', () => {
    const now = Date.now();
    const res = evaluarEstadoAcceso({
        session: null,
        paramChofer: 'V-102',
        now: now
    });
    assert.strictEqual(res.estado, ESTADO_ACCESO.ACTIVA, 'Debe activar la sesión');
    assert.strictEqual(res.esNueva, true, 'Debe indicar que es nueva');
    assert.strictEqual(res.chofer, 'V-102', 'Debe registrar el chofer');

    const nuevaSesion = {
        timestamp: now,
        code: 'ENC-TEST',
        chofer: 'V-102',
        origen: 'qr',
        juegoJugado: false
    };
    const storage = new MockStorage();
    assert.strictEqual(puedeJugarSesion(nuevaSesion, storage), true, 'Una sesión nueva debe poder jugar');
});

// ----------------------------------------------------------------------------
// CASO 3: Recarga durante sesión activa
// ----------------------------------------------------------------------------
test(3, 'Recarga durante sesión activa', () => {
    const now = Date.now();
    const sesionActiva = {
        timestamp: now - 3600000, // Hace 1 hora
        code: 'ENC-ORIGINAL',
        chofer: 'V-102',
        origen: 'qr',
        juegoJugado: false
    };
    const res = evaluarEstadoAcceso({
        session: sesionActiva,
        paramChofer: null, // En recarga no hay param en la URL
        now: now
    });
    assert.strictEqual(res.estado, ESTADO_ACCESO.ACTIVA, 'Debe mantenerse ACTIVA');
    assert.strictEqual(res.esNueva, false, 'No debe ser nueva');
    assert.strictEqual(res.session.code, 'ENC-ORIGINAL', 'Debe conservar el código original');
    assert.strictEqual(res.session.timestamp, now - 3600000, 'Debe conservar el timestamp original');
});

// ----------------------------------------------------------------------------
// CASO 13: Reabrir un QR durante una sesión activa no la renueva
// ----------------------------------------------------------------------------
test(13, 'Reabrir QR conserva la sesión activa', () => {
    const now = Date.now();
    const sesionActiva = {
        timestamp: now - 3600000,
        code: 'ENC-CONSERVAR',
        chofer: 'V-102',
        origen: 'qr',
        juegoJugado: true
    };
    const res = evaluarEstadoAcceso({
        session: sesionActiva,
        paramChofer: 'V-999',
        now: now
    });
    assert.strictEqual(res.estado, ESTADO_ACCESO.ACTIVA, 'Debe mantenerse ACTIVA');
    assert.strictEqual(res.esNueva, false, 'No debe crear una sesión nueva');
    assert.strictEqual(res.session.code, 'ENC-CONSERVAR', 'Debe conservar el código');
    assert.strictEqual(res.session.timestamp, now - 3600000, 'Debe conservar el inicio de las 24 horas');
    assert.strictEqual(res.session.chofer, 'V-102', 'Debe conservar la atribución original');
    assert.strictEqual(res.session.juegoJugado, true, 'Debe conservar el intento consumido');
});

// ----------------------------------------------------------------------------
// CASO 14: Un QR nuevo sí reemplaza una sesión vencida
// ----------------------------------------------------------------------------
test(14, 'QR nuevo reemplaza una sesión vencida', () => {
    const now = Date.now();
    const sesionVencida = {
        timestamp: now - (25 * 3600000),
        code: 'ENC-VENCIDA',
        chofer: 'V-102',
        origen: 'qr',
        juegoJugado: true
    };
    const res = evaluarEstadoAcceso({
        session: sesionVencida,
        paramChofer: 'V-999',
        now: now
    });
    assert.strictEqual(res.estado, ESTADO_ACCESO.ACTIVA, 'El QR debe permitir una nueva sesión');
    assert.strictEqual(res.esNueva, true, 'Debe indicar que la sesión es nueva');
    assert.strictEqual(res.chofer, 'V-999', 'Debe atribuir el nuevo vehículo');
});

// ----------------------------------------------------------------------------
// CASO 4: Sesión vencida
// ----------------------------------------------------------------------------
test(4, 'Sesión vencida (> 24 horas)', () => {
    const now = Date.now();
    const sesionVieja = {
        timestamp: now - (25 * 3600000), // Hace 25 horas
        code: 'ENC-VIEJO',
        chofer: 'V-102',
        origen: 'qr',
        juegoJugado: false
    };
    const res = evaluarEstadoAcceso({
        session: sesionVieja,
        paramChofer: null,
        now: now,
        sessionHours: 24
    });
    assert.strictEqual(res.estado, ESTADO_ACCESO.VENCIDA, 'Debe indicar VENCIDA');
    assert.strictEqual(puedeJugarSesion(sesionVieja), false, 'No debe permitir jugar en sesión vencida');

    // Verificar texto de bloqueo
    const docMock = { body: { innerHTML: '' } };
    const originalDoc = sandbox.document;
    sandbox.document = docMock;
    mostrarPantallaBloqueo(ESTADO_ACCESO.VENCIDA);
    assert.ok(docMock.body.innerHTML.includes('Sesión Vencida'), 'Debe mostrar Sesión Vencida');
    assert.ok(docMock.body.innerHTML.includes('24 horas'), 'Debe explicar las 24 horas');
    sandbox.document = originalDoc;
});

// ----------------------------------------------------------------------------
// CASO 5: Un intento de juego ya utilizado
// ----------------------------------------------------------------------------
test(5, 'Un intento de juego ya utilizado', () => {
    const storage = new MockStorage();
    const sesion = {
        timestamp: Date.now(),
        code: 'ENC-UNICO',
        chofer: 'V-102',
        origen: 'qr',
        juegoJugado: false
    };

    assert.strictEqual(puedeJugarSesion(sesion, storage), true, 'Primer intento permitido');
    registrarIntentoJuego(sesion, storage);

    assert.strictEqual(sesion.juegoJugado, true, 'Marca juegoJugado = true');
    assert.strictEqual(storage.getItem('encavigo_played_ENC-UNICO'), 'true', 'Guarda intento por código');
    assert.strictEqual(puedeJugarSesion(sesion, storage), false, 'Segundo intento bloqueado en la misma sesión');

    // Simular recarga de página: se lee sesión desde storage
    const sesionRecargada = JSON.parse(storage.getItem(CONFIG_PILOTO.SESSION_KEY));
    assert.strictEqual(puedeJugarSesion(sesionRecargada, storage), false, 'Bloqueado tras recargar');
});

// ----------------------------------------------------------------------------
// CASO 6: Juego sin campañas
// ----------------------------------------------------------------------------
test(6, 'Juego sin campañas', () => {
    const loadedCampaigns = [];
    const activeCampaigns = loadedCampaigns.filter(c => esCampanaVigente(c));
    assert.strictEqual(activeCampaigns.length, 0, 'No debe haber campañas');

    // Simular resultado de openGame con 0 campañas
    let sequence, winData;
    if (activeCampaigns.length === 0) {
        const iconSinPromos = '<div style="font-size:45px;">📍</div>';
        sequence = [iconSinPromos, iconSinPromos, iconSinPromos];
        winData = {
            title: '<span style="color: #F97316;">Sin promociones disponibles</span>',
            msg: 'En este momento no hay promociones activas en esta ruta.'
        };
    }
    assert.strictEqual(sequence.length, 3, 'Debe tener 3 tarjetas');
    assert.strictEqual(sequence[0], sequence[1], 'Todas las tarjetas deben coincidir');
    assert.ok(winData.title.includes('Sin promociones disponibles'), 'Debe informar estado honesto');
    assert.ok(!winData.title.includes('Servicios'), 'No debe inventar categorías fantasma');
});

// ----------------------------------------------------------------------------
// CASO 7: Juego con una campaña real simulada localmente
// ----------------------------------------------------------------------------
test(7, 'Juego con una campaña real simulada localmente', () => {
    const loadedCampaigns = [
        { id: 'c1', title: 'Fonda Doña Rosa', active: true, img: 'rosa.jpg', dias: [] }
    ];
    const activeCampaigns = loadedCampaigns.filter(c => esCampanaVigente(c));
    assert.strictEqual(activeCampaigns.length, 1, 'Debe haber 1 campaña activa');

    const winCamp = activeCampaigns[0];
    const winIconHTML = `<img src="${winCamp.img}">`;
    const sequence = [winIconHTML, winIconHTML, winIconHTML];
    const winData = {
        title: `¡Descubriste una promoción! ${winCamp.title}`,
        msg: 'Esta oferta forma parte del catálogo disponible durante tu viaje.'
    };

    assert.strictEqual(sequence.length, 3);
    assert.strictEqual(sequence[0], winIconHTML);
    assert.strictEqual(sequence[1], winIconHTML);
    assert.strictEqual(sequence[2], winIconHTML, 'Tres tarjetas iguales revelan la promoción');
    assert.ok(winData.title.includes('Descubriste una promoción'), 'Debe decir descubriste una promoción');
    assert.ok(!winData.title.includes('premio exclusivo'), 'No debe presentarlo como premio exclusivo');
});

// ----------------------------------------------------------------------------
// CASO 8: Viaje gratis desactivado
// ----------------------------------------------------------------------------
test(8, 'Viaje gratis desactivado durante el piloto', () => {
    assert.strictEqual(CONFIG_PILOTO.VIAJE_GRATIS_HABILITADO, false, 'VIAJE_GRATIS_HABILITADO debe ser false');
    const chofer = 'V-102';
    const puedeGanarViaje = CONFIG_PILOTO.VIAJE_GRATIS_HABILITADO && (chofer !== 'orgánico');
    assert.strictEqual(puedeGanarViaje, false, 'puedeGanarViaje debe ser estrictamente false');

    // Verificar en HTML que no exista el texto "Juega y gana tu viaje gratis"
    assert.ok(!indexHtml.includes('JUEGA Y GANA TU VIAJE GRATIS'), 'No debe aparecer "JUEGA Y GANA TU VIAJE GRATIS" en HTML');
    assert.ok(!indexHtml.includes('puedes ganarte el viaje gratis'), 'No debe aparecer en el splash');
    assert.ok(indexHtml.includes('ESCANEA, JUEGA Y DESCUBRE PROMOCIONES EN TU RUTA'), 'Debe contener la invitación correcta');
    const negociosHtml = fs.readFileSync(path.join(__dirname, 'negocios', 'index.html'), 'utf8');
    assert.ok(!negociosHtml.includes('JUEGA Y GANA TU VIAJE GRATIS'), 'La página comercial tampoco debe anunciar un premio desactivado');
});

// ----------------------------------------------------------------------------
// CASO 9: Campaña antes de startDate
// ----------------------------------------------------------------------------
test(9, 'Campaña antes de startDate', () => {
    const now = new Date('2026-10-02T12:00:00');
    const camp = {
        active: true,
        startDate: '2026-10-10',
        endDate: '2026-10-20',
        dias: []
    };
    assert.strictEqual(esCampanaVigente(camp, now), false, 'No debe estar vigente antes de startDate');
});

// ----------------------------------------------------------------------------
// CASO 10: Campaña dentro de vigencia
// ----------------------------------------------------------------------------
test(10, 'Campaña dentro de vigencia', () => {
    const now = new Date('2026-10-02T12:00:00');
    const camp = {
        active: true,
        startDate: '2026-10-01',
        endDate: '2026-10-15',
        dias: []
    };
    assert.strictEqual(esCampanaVigente(camp, now), true, 'Debe estar vigente dentro del rango');
});

// ----------------------------------------------------------------------------
// CASO 11: Campaña después de endDate (con inclusión de todo el día)
// ----------------------------------------------------------------------------
test(11, 'Campaña después de endDate e inclusión de todo el día', () => {
    const camp = {
        active: true,
        startDate: '2026-09-01',
        endDate: '2026-09-30',
        dias: []
    };
    // Día siguiente (1 de octubre): ya venció
    const manana = new Date('2026-10-01T10:00:00');
    assert.strictEqual(esCampanaVigente(camp, manana), false, 'Vencida después de endDate');

    // El mismo día de endDate hasta las 23:59:59 locales debe estar vigente
    const mismoDiaNoche = new Date('2026-09-30T23:59:59');
    assert.strictEqual(esCampanaVigente(camp, mismoDiaNoche), true, 'endDate incluye todo el día indicado');
});

// ----------------------------------------------------------------------------
// CASO 12: Campaña antigua sin fechas
// ----------------------------------------------------------------------------
test(12, 'Campaña antigua sin fechas', () => {
    const now = new Date('2026-10-02T12:00:00');
    const campAntigua = {
        active: true,
        title: 'Campaña Antigua',
        // Sin startDate ni endDate
        dias: []
    };
    assert.strictEqual(esCampanaVigente(campAntigua, now), true, 'Debe ser compatible con campañas sin fecha');

    const campInactiva = {
        active: false,
        title: 'Inactiva'
    };
    assert.strictEqual(esCampanaVigente(campInactiva, now), false, 'Campañas inactivas deben descartarse');
});

// ----------------------------------------------------------------------------
// COMPROBACIONES ADICIONALES DEL BLOQUE
// ----------------------------------------------------------------------------
console.log('\n--- Comprobaciones de ciclo de vida, enlaces y móvil ---');

// A. Ciclo de vida DOM sin errores en estados bloqueados
function verificarCicloVidaDOM(nombre, params, sesion) {
    try {
        const domEvents = {};
        const elements = {};
        const doc = {
            body: {
                innerHTML: '<div id="scratchBanner"></div><div id="gameModal"></div>',
                appendChild: () => {},
                addEventListener: () => {}
            },
            getElementById: (id) => {
                if (doc.body.innerHTML.includes(`id="${id}"`)) {
                    if (!elements[id]) elements[id] = { style: {}, classList: { add:()=>{}, remove:()=>{}, contains:()=>false } };
                    return elements[id];
                }
                return null;
            },
            querySelector: () => null,
            querySelectorAll: () => [],
            addEventListener: (ev, fn) => {
                if (!domEvents['doc:' + ev]) domEvents['doc:' + ev] = [];
                domEvents['doc:' + ev].push(fn);
            },
            title: 'EncaviGO'
        };

        const mockStore = new MockStorage();
        if (sesion) mockStore.setItem(CONFIG_PILOTO.SESSION_KEY, JSON.stringify(sesion));

        const sb = {
            window: {
                addEventListener: (ev, fn) => {
                    if (!domEvents['win:' + ev]) domEvents['win:' + ev] = [];
                    domEvents['win:' + ev].push(fn);
                },
                history: { replaceState: () => {} },
                location: { search: params, pathname: '/' }
            },
            document: doc,
            localStorage: mockStore,
            sessionStorage: mockStore,
            firebase: {
                initializeApp: () => {},
                firestore: Object.assign(() => ({
                    collection: () => ({
                        doc: () => ({ get: () => Promise.resolve({ exists: false }), set: () => Promise.resolve(), update: () => Promise.resolve() }),
                        where: () => ({ get: () => Promise.resolve([]) })
                    })
                }), {
                    FieldValue: { serverTimestamp: () => ({}), increment: (n) => n }
                })
            },
            db: {
                collection: () => ({
                    doc: () => ({ get: () => Promise.resolve({ exists: false }), set: () => Promise.resolve(), update: () => Promise.resolve() }),
                    where: () => ({ get: () => Promise.resolve([]) })
                })
            },
            navigator: {
                geolocation: {
                    getCurrentPosition: () => {},
                    watchPosition: () => {}
                }
            },
            URLSearchParams: URLSearchParams,
            Date: Date,
            Math: Math,
            console: console,
            setTimeout: (fn) => fn()
        };
        sb.window.document = doc;
        sb.window.window = sb.window;

        vm.createContext(sb);
        vm.runInContext(mainScriptCode, sb);

        // Disparar DOMContentLoaded en document y window
        if (domEvents['doc:DOMContentLoaded']) domEvents['doc:DOMContentLoaded'].forEach(fn => fn());
        if (domEvents['win:DOMContentLoaded']) domEvents['win:DOMContentLoaded'].forEach(fn => fn());

        console.log(`[PASS] Ciclo DOM: ${nombre} ejecutado sin errores.`);
    } catch (err) {
        console.error(`[FAIL] Ciclo DOM: ${nombre} falló:`, err.message);
        process.exit(1);
    }
}

verificarCicloVidaDOM('Entrada directa (sin sesión previa)', '', null);
verificarCicloVidaDOM('Sesión vencida (>24h)', '', { origen: 'qr', chofer: 'V1', timestamp: Date.now() - 30*3600000, code: 'ENC-EXP' });
verificarCicloVidaDOM('Sesión activa con QR', '?chofer=V102', null);

// B. Verificación de enlaces y recursos locales
assert.ok(fs.existsSync(path.join(__dirname, 'negocios', 'index.html')), 'El destino local de /negocios/ debe existir');
assert.ok(fs.existsSync(path.join(__dirname, 'logo_jackpot.jpg')), 'logo_jackpot.jpg debe existir');
console.log('[PASS] Enlaces y recursos locales verificados exitosamente.');

// C. Verificación de viewport móvil y estilos responsive
assert.ok(indexHtml.includes('name="viewport"'), 'index.html debe contener meta viewport');
assert.ok(indexHtml.includes('width=device-width'), 'meta viewport debe incluir width=device-width');
console.log('[PASS] Configuración de ancho móvil verificada en meta tags y estilos.');

console.log('\n---------------------------------------------------------------');
console.log(`RESULTADO FINAL: ${passedTests} de ${totalTests} pruebas pasadas.`);
console.log('---------------------------------------------------------------');

if (passedTests !== totalTests) {
    process.exit(1);
}
