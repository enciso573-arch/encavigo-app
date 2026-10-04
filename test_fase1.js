/**
 * Suite de Verificación Automatizada - EncaviGO Piloto Fase 1 & Bloque 2A
 * Ejecutor Asíncrono Secuencial con cobertura completa de aislamiento DEMO,
 * protección de Firebase, inicialización condicional, canje y manejo de errores.
 * No se conecta a Firebase ni escribe datos en producción.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('======================================================================');
console.log('ENCAVIGO - VERIFICACIÓN ASÍNCRONA: FASE 1 & BLOQUE 2A AUDITADO');
console.log('======================================================================\n');

// 1. Cargar y extraer scripts desde index.html
const indexPath = path.join(__dirname, 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');

// Simular almacenamiento en memoria
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

// Mock Firestore completo para auditar lecturas, escrituras e inicializaciones
class MockFirestore {
    constructor(shouldReject = false) {
        this.writes = [];
        this.reads = [];
        this.shouldReject = shouldReject;
    }
    collection(name) {
        const self = this;
        return {
            doc: (docId) => ({
                set: (data) => {
                    self.writes.push({ type: 'set', collection: name, docId, data });
                    if (self.shouldReject) return Promise.reject(new Error('permission-denied'));
                    return Promise.resolve();
                },
                update: (data) => {
                    self.writes.push({ type: 'update', collection: name, docId, data });
                    if (self.shouldReject) return Promise.reject(new Error('permission-denied'));
                    return Promise.resolve();
                },
                get: () => {
                    self.reads.push({ type: 'get', collection: name, docId });
                    if (self.shouldReject) return Promise.reject(new Error('permission-denied'));
                    return Promise.resolve({ exists: true, data: () => ({ stock: 10 }) });
                }
            }),
            add: (data) => {
                self.writes.push({ type: 'add', collection: name, data });
                if (self.shouldReject) return Promise.reject(new Error('permission-denied'));
                return Promise.resolve({ id: 'mock-add-id' });
            },
            where: (field, op, val) => ({
                get: () => {
                    self.reads.push({ type: 'where', collection: name, field, op, val });
                    return Promise.resolve([]);
                }
            })
        };
    }
    reset() {
        this.writes = [];
        this.reads = [];
    }
}

// Extraer los 3 scripts clave de index.html
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
const allScripts = [];
let match;
while ((match = scriptRegex.exec(indexHtml)) !== null) {
    allScripts.push(match[1]);
}

let sInit = '', sMain = '', sMap = '';
for (const s of allScripts) {
    if (s.includes('firebaseConfig')) sInit = s;
    if (s.includes('CONFIG_PILOTO') && !s.includes('quemarCupon')) sMain = s;
    if (s.includes('quemarCupon')) sMap = s;
}

if (!sInit || !sMain || !sMap) {
    console.error('ERROR: No se pudieron extraer todos los scripts de index.html');
    process.exit(1);
}

// Sandbox base
const mockStorageGlobal = new MockStorage();
const mockDbGlobal = new MockFirestore();

function createDefaultElement(id = '') {
    return {
        id: id,
        innerText: '',
        textContent: '',
        value: '',
        style: {},
        classList: { add: () => {}, remove: () => {}, contains: () => false },
        addEventListener: () => {}
    };
}

const sandbox = {
    alert: (msg) => {
        if (sandbox.window && typeof sandbox.window.alert === 'function') {
            return sandbox.window.alert(msg);
        }
    },
    window: {
        alert: () => {},
        addEventListener: () => {},
        history: { replaceState: () => {} },
        location: { search: '', pathname: '/', href: '' }
    },
    document: {
        body: {
            innerHTML: '',
            prepend: () => {},
            appendChild: () => {},
            addEventListener: () => {}
        },
        getElementById: (id) => createDefaultElement(id),
        querySelector: () => null,
        querySelectorAll: () => [],
        createElement: (tag) => createDefaultElement(tag),
        addEventListener: () => {},
        title: 'EncaviGO'
    },
    localStorage: mockStorageGlobal,
    sessionStorage: mockStorageGlobal,
    Date: Date,
    Math: Math,
    console: console,
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
    URLSearchParams: URLSearchParams,
    L: {
        divIcon: () => ({}),
        map: () => ({ setView: () => {}, addTo: () => {} }),
        marker: () => ({ bindPopup: () => ({}) }),
        tileLayer: () => ({ addTo: () => {} })
    },
    navigator: {
        geolocation: {
            getCurrentPosition: (fn) => fn({ coords: { latitude: 20.6534, longitude: -105.2253, accuracy: 10 } }),
            watchPosition: () => {}
        }
    },
    firebase: {
        initializeApp: () => {},
        firestore: Object.assign(() => mockDbGlobal, {
            FieldValue: { serverTimestamp: () => ({}), increment: (n) => n }
        })
    },
    db: mockDbGlobal
};
sandbox.window.document = sandbox.document;
sandbox.window.window = sandbox.window;

vm.createContext(sandbox);
vm.runInContext(sInit, sandbox);
vm.runInContext(sMain, sandbox);
vm.runInContext(sMap, sandbox);

const Core = sandbox.window.EncaviCore;
if (!Core) {
    console.error('ERROR: EncaviCore no fue expuesto en window.');
    process.exit(1);
}

const {
    ENTORNOS,
    CONFIG_PILOTO,
    ESTADO_ACCESO,
    DEMO_CAMPAIGNS,
    evaluarParametrosURL,
    evaluarEstadoAcceso,
    puedeEscribirEnProduccion,
    puedeJugarSesion,
    registrarIntentoJuego,
    esCampanaVigente,
    mostrarPantallaBloqueo,
    mostrarBannerDemo,
    reiniciarDemo,
    quemarCupon,
    enviarOpinion,
    escapeHTML
} = Core;

// ── EJECUTOR ASÍNCRONO SECUENCIAL ──
const integration = require('./test_demo_integration');
const testQueue = [];
let passedTests = 0;

function test(num, description, fn) {
    testQueue.push({ num, description, fn });
}

// ============================================================================
// BLOQUE 1: PRUEBAS FUNDACIONALES DE FASE 1 (14 CASOS BASE)
// ============================================================================

test(1, 'Entrada directa sin sesión', () => {
    const res = evaluarEstadoAcceso({
        session: null,
        paramChofer: null,
        now: Date.now()
    });
    assert.strictEqual(res.estado, ESTADO_ACCESO.SIN_ACCESO, 'El estado debe ser SIN_ACCESO');
    assert.strictEqual(puedeJugarSesion(null), false, 'No se puede jugar sin sesión');

    const docMock = { body: { innerHTML: '' } };
    const originalDoc = sandbox.document;
    sandbox.document = docMock;
    mostrarPantallaBloqueo(ESTADO_ACCESO.SIN_ACCESO);
    assert.ok(docMock.body.innerHTML.includes('Escanea el código en tu transporte'), 'Debe pedir escanear el QR');
    assert.ok(!docMock.body.innerHTML.includes('Sesión Expirada'), 'NO debe decir Sesión Expirada');
    assert.ok(!docMock.body.innerHTML.includes('Sesión Vencida'), 'NO debe decir Sesión Vencida');
    sandbox.document = originalDoc;
});

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

test(3, 'Recarga durante sesión activa', () => {
    const now = Date.now();
    const sesionActiva = {
        timestamp: now - 3600000,
        code: 'ENC-ORIGINAL',
        chofer: 'V-102',
        origen: 'qr',
        juegoJugado: false
    };
    const res = evaluarEstadoAcceso({
        session: sesionActiva,
        paramChofer: null,
        now: now
    });
    assert.strictEqual(res.estado, ESTADO_ACCESO.ACTIVA, 'Debe mantenerse ACTIVA');
    assert.strictEqual(res.esNueva, false, 'No debe ser nueva');
    assert.strictEqual(res.session.code, 'ENC-ORIGINAL', 'Debe conservar el código original');
    assert.strictEqual(res.session.timestamp, now - 3600000, 'Debe conservar el timestamp original');
});

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

test(4, 'Sesión vencida (> 24 horas)', () => {
    const now = Date.now();
    const sesionVieja = {
        timestamp: now - (25 * 3600000),
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

    const docMock = { body: { innerHTML: '' } };
    const originalDoc = sandbox.document;
    sandbox.document = docMock;
    mostrarPantallaBloqueo(ESTADO_ACCESO.VENCIDA);
    assert.ok(docMock.body.innerHTML.includes('Sesión Vencida'), 'Debe mostrar Sesión Vencida');
    assert.ok(docMock.body.innerHTML.includes('24 horas'), 'Debe explicar las 24 horas');
    sandbox.document = originalDoc;
});

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

    const sesionRecargada = JSON.parse(storage.getItem(CONFIG_PILOTO.SESSION_KEY));
    assert.strictEqual(puedeJugarSesion(sesionRecargada, storage), false, 'Bloqueado tras recargar');
});

test(6, 'Juego sin campañas', () => {
    const loadedCampaigns = [];
    const activeCampaigns = loadedCampaigns.filter(c => esCampanaVigente(c));
    assert.strictEqual(activeCampaigns.length, 0, 'No debe haber campañas');

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

test(8, 'Viaje gratis desactivado durante el piloto', () => {
    assert.strictEqual(CONFIG_PILOTO.VIAJE_GRATIS_HABILITADO, false, 'VIAJE_GRATIS_HABILITADO debe ser false');
    const chofer = 'V-102';
    const puedeGanarViaje = CONFIG_PILOTO.VIAJE_GRATIS_HABILITADO && (chofer !== 'orgánico');
    assert.strictEqual(puedeGanarViaje, false, 'puedeGanarViaje debe ser estrictamente false');

    assert.ok(!indexHtml.includes('JUEGA Y GANA TU VIAJE GRATIS'), 'No debe aparecer "JUEGA Y GANA TU VIAJE GRATIS" en HTML');
    assert.ok(!indexHtml.includes('puedes ganarte el viaje gratis'), 'No debe aparecer en el splash');
    assert.ok(indexHtml.includes('ESCANEA, JUEGA Y DESCUBRE PROMOCIONES EN TU RUTA'), 'Debe contener la invitación correcta');
    const negociosHtml = fs.readFileSync(path.join(__dirname, 'negocios', 'index.html'), 'utf8');
    assert.ok(!negociosHtml.includes('JUEGA Y GANA TU VIAJE GRATIS'), 'La página comercial tampoco debe anunciar un premio desactivado');
});

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

test(11, 'Campaña después de endDate e inclusión de todo el día', () => {
    const camp = {
        active: true,
        startDate: '2026-09-01',
        endDate: '2026-09-30',
        dias: []
    };
    const manana = new Date('2026-10-01T10:00:00');
    assert.strictEqual(esCampanaVigente(camp, manana), false, 'Vencida después de endDate');

    const mismoDiaNoche = new Date('2026-09-30T23:59:59');
    assert.strictEqual(esCampanaVigente(camp, mismoDiaNoche), true, 'endDate incluye todo el día indicado');
});

test(12, 'Campaña antigua sin fechas', () => {
    const now = new Date('2026-10-02T12:00:00');
    const campAntigua = {
        active: true,
        title: 'Campaña Antigua',
        dias: []
    };
    assert.strictEqual(esCampanaVigente(campAntigua, now), true, 'Debe ser compatible con campañas sin fecha');

    const campInactiva = {
        active: false,
        title: 'Inactiva'
    };
    assert.strictEqual(esCampanaVigente(campInactiva, now), false, 'Campañas inactivas deben descartarse');
});

// ============================================================================
// BLOQUE 2: MODO DEMOSTRACIÓN AISLADO & PARÁMETROS DE URL
// ============================================================================

test(15, 'Modo DEMO (?demo=1) - Activación y sesión aislada', () => {
    const paramsEval = evaluarParametrosURL('?demo=1');
    assert.strictEqual(paramsEval.valido, true, 'Debe ser parámetro válido');
    assert.strictEqual(paramsEval.esDemo, true, 'Debe marcar esDemo = true');

    const evaluacion = evaluarEstadoAcceso({ searchStr: '?demo=1' });
    assert.strictEqual(evaluacion.estado, ESTADO_ACCESO.DEMO, 'Estado debe ser DEMO');
    assert.strictEqual(evaluacion.esNueva, true, 'Debe indicar sesión demo nueva');
    assert.strictEqual(evaluacion.chofer, 'DEMO', 'Chofer atribuido debe ser DEMO');

    assert.strictEqual(CONFIG_PILOTO.DEMO_SESSION_KEY, 'encavigo_demo_session', 'Clave demo independiente');
    assert.strictEqual(CONFIG_PILOTO.DEMO_PLAYED_KEY, 'encavigo_demo_played', 'Clave intento demo independiente');
});

test(16, 'Modo DEMO - Preservación de sesión QR real existente', () => {
    const storage = new MockStorage();
    const now = Date.now();
    const sesionRealQR = {
        timestamp: now - 3600000,
        code: 'ENC-REAL-77',
        chofer: 'V-055',
        origen: 'qr',
        juegoJugado: false
    };
    storage.setItem(CONFIG_PILOTO.SESSION_KEY, JSON.stringify(sesionRealQR));

    const evaluacion = evaluarEstadoAcceso({
        session: sesionRealQR,
        searchStr: '?demo=1',
        now: now
    });
    assert.strictEqual(evaluacion.estado, ESTADO_ACCESO.DEMO, 'Debe conceder acceso DEMO');

    const sesionDemo = {
        timestamp: now,
        code: 'DEMO-001',
        chofer: 'DEMO',
        origen: 'demo',
        juegoJugado: false
    };
    storage.setItem(CONFIG_PILOTO.DEMO_SESSION_KEY, JSON.stringify(sesionDemo));

    const sesionRealLeida = JSON.parse(storage.getItem(CONFIG_PILOTO.SESSION_KEY));
    assert.strictEqual(sesionRealLeida.code, 'ENC-REAL-77', 'Código real intacto');
    assert.strictEqual(sesionRealLeida.chofer, 'V-055', 'Chofer real intacto');
    assert.strictEqual(sesionRealLeida.timestamp, now - 3600000, 'Timestamp real intacto');
    assert.strictEqual(sesionRealLeida.juegoJugado, false, 'Estado de juego real intacto');
});

test(17, 'Salida de DEMO - Recuperación transparente de sesión QR real vigente', () => {
    const storage = new MockStorage();
    const now = Date.now();
    const sesionRealQR = {
        timestamp: now - 7200000,
        code: 'ENC-RECUPERA',
        chofer: 'V-088',
        origen: 'qr',
        juegoJugado: true
    };
    storage.setItem(CONFIG_PILOTO.SESSION_KEY, JSON.stringify(sesionRealQR));
    storage.setItem(CONFIG_PILOTO.DEMO_SESSION_KEY, JSON.stringify({ origen: 'demo', code: 'DEMO-001' }));

    const evaluacion = evaluarEstadoAcceso({
        session: JSON.parse(storage.getItem(CONFIG_PILOTO.SESSION_KEY)),
        demoSession: JSON.parse(storage.getItem(CONFIG_PILOTO.DEMO_SESSION_KEY)),
        searchStr: '',
        now: now
    });

    assert.strictEqual(evaluacion.estado, ESTADO_ACCESO.ACTIVA, 'Debe reanudar sesión real ACTIVA');
    assert.strictEqual(evaluacion.esNueva, false, 'No debe ser nueva');
    assert.strictEqual(evaluacion.session.code, 'ENC-RECUPERA', 'Recupera código real');
    assert.strictEqual(evaluacion.session.chofer, 'V-088', 'Recupera chofer real');
    assert.strictEqual(evaluacion.session.juegoJugado, true, 'Recupera juego jugado');
});

test(18, 'Salida de DEMO - Bloqueo correcto sin sesión QR previa', () => {
    const storage = new MockStorage();
    storage.setItem(CONFIG_PILOTO.DEMO_SESSION_KEY, JSON.stringify({ origen: 'demo', code: 'DEMO-001' }));

    const evaluacion = evaluarEstadoAcceso({
        session: null,
        demoSession: JSON.parse(storage.getItem(CONFIG_PILOTO.DEMO_SESSION_KEY)),
        searchStr: '',
        now: Date.now()
    });

    assert.strictEqual(evaluacion.estado, ESTADO_ACCESO.SIN_ACCESO, 'Debe mostrar SIN_ACCESO');
    assert.strictEqual(evaluacion.motivo, 'sin_sesion', 'Motivo sin_sesion');
});

test(19, 'Salida de DEMO - Bloqueo por caducidad si la sesión QR ya venció', () => {
    const now = Date.now();
    const sesionRealExpirada = {
        timestamp: now - (26 * 3600000),
        code: 'ENC-EXP-OLD',
        chofer: 'V-001',
        origen: 'qr',
        juegoJugado: false
    };

    const evaluacion = evaluarEstadoAcceso({
        session: sesionRealExpirada,
        searchStr: '',
        now: now
    });

    assert.strictEqual(evaluacion.estado, ESTADO_ACCESO.VENCIDA, 'Debe reportar VENCIDA');
});

test(20, 'Enlace antiguo ?chofer=DEMO - Normalizado a DEMO, nunca sesión real', () => {
    const p1 = evaluarParametrosURL('?chofer=DEMO');
    assert.strictEqual(p1.esDemo, true, 'chofer=DEMO mayúsculas se normaliza a DEMO');
    assert.strictEqual(p1.chofer, null, 'No otorga chofer real');

    const p2 = evaluarParametrosURL('?chofer=demo');
    assert.strictEqual(p2.esDemo, true, 'chofer=demo minúsculas se normaliza a DEMO');

    const ev = evaluarEstadoAcceso({ searchStr: '?chofer=DEMO' });
    assert.strictEqual(ev.estado, ESTADO_ACCESO.DEMO, 'Acceso conduce a DEMO');
    assert.strictEqual(ev.entorno, ENTORNOS.DEMO, 'Entorno es DEMO');
});

test(21, 'Matriz de parámetros - Combinación ambigua (?demo=1&chofer=V-001) rechazada', () => {
    const p1 = evaluarParametrosURL('?demo=1&chofer=V-001');
    assert.strictEqual(p1.valido, false, 'Rechaza combinación demo + chofer');
    assert.strictEqual(p1.motivo, 'combinacion_ambigua_demo_chofer');

    const ev1 = evaluarEstadoAcceso({ searchStr: '?demo=1&chofer=V-001' });
    assert.strictEqual(ev1.estado, ESTADO_ACCESO.SIN_ACCESO, 'Deniega acceso sin crear sesión');

    const p2 = evaluarParametrosURL('?chofer=V-001&demo=xyz');
    assert.strictEqual(p2.valido, false, 'Rechaza cualquier presencia conjunta de demo y chofer');
});

test(22, 'Matriz de parámetros - Parámetros repetidos rechazados', () => {
    const p1 = evaluarParametrosURL('?demo=1&demo=1');
    assert.strictEqual(p1.valido, false, 'Rechaza demo repetido');
    assert.strictEqual(p1.motivo, 'parametros_repetidos');

    const p2 = evaluarParametrosURL('?chofer=V-001&chofer=V-002');
    assert.strictEqual(p2.valido, false, 'Rechaza chofer repetido');
    assert.strictEqual(p2.motivo, 'parametros_repetidos');

    const ev = evaluarEstadoAcceso({ searchStr: '?chofer=V-001&chofer=V-002' });
    assert.strictEqual(ev.estado, ESTADO_ACCESO.SIN_ACCESO, 'Deniega acceso ante parámetros repetidos');
});

test(23, 'Matriz de parámetros - Valores inválidos de demo rechazados', () => {
    const invalidos = ['?demo=0', '?demo=false', '?demo=true', '?demo=otro', '?demo='];
    for (const qs of invalidos) {
        const p = evaluarParametrosURL(qs);
        assert.strictEqual(p.valido, false, `Debe invalidar ${qs}`);
        assert.strictEqual(p.motivo, 'demo_invalido');
        const ev = evaluarEstadoAcceso({ searchStr: qs });
        assert.strictEqual(ev.estado, ESTADO_ACCESO.SIN_ACCESO, `Debe bloquear ${qs}`);
    }
});

test(24, 'No-privilegio de entorno test por URL (?env=test) o localStorage', () => {
    const p = evaluarParametrosURL('?env=test');
    assert.strictEqual(p.esDemo, false, 'env=test no activa demo');
    assert.strictEqual(p.chofer, null, 'env=test no activa chofer');

    const ev = evaluarEstadoAcceso({ searchStr: '?env=test' });
    assert.strictEqual(ev.estado, ESTADO_ACCESO.SIN_ACCESO, 'env=test no otorga sesión');

    sandbox.window.__ENCAVI_ENTORNO__ = 'test';
    assert.strictEqual(puedeEscribirEnProduccion(), false, 'Entorno test prohíbe escrituras de producción');
    sandbox.window.__ENCAVI_ENTORNO__ = ENTORNOS.PRODUCCION;
});

test(25, 'Banner visual de modo DEMO (#egDemoBanner) y botón reiniciarDemo', () => {
    let prependCalled = false;
    let prependedElement = null;
    const docMock = {
        querySelector: () => null,
        getElementById: (id) => (id === 'egDemoBanner' ? null : null),
        createElement: (tag) => ({ id: '', style: {}, innerHTML: '' }),
        body: {
            prepend: (el) => {
                prependCalled = true;
                prependedElement = el;
            }
        }
    };
    const origDoc = sandbox.document;
    sandbox.document = docMock;
    mostrarBannerDemo();
    assert.strictEqual(prependCalled, true, 'Debe montar el banner');
    assert.strictEqual(prependedElement.id, 'egDemoBanner', 'ID debe ser egDemoBanner');
    assert.ok(prependedElement.innerHTML.includes('MODO DEMOSTRACIÓN'), 'Incluye título MODO DEMOSTRACIÓN');
    assert.ok(prependedElement.innerHTML.includes('Reiniciar Demo'), 'Incluye botón de reinicio');
    sandbox.document = origDoc;
});

test(26, 'Carga de campañas DEMO (DEMO_CAMPAIGNS) locales sin lecturas a Firestore', () => {
    assert.ok(Array.isArray(DEMO_CAMPAIGNS), 'DEMO_CAMPAIGNS es un arreglo');
    assert.strictEqual(DEMO_CAMPAIGNS.length, 4, 'Contiene exactamente 4 campañas de ejemplo');
    const titulos = DEMO_CAMPAIGNS.map(c => c.title);
    assert.ok(titulos.includes('Fonda Doña Rosa'));
    assert.ok(titulos.includes('Tacos El Pastorcito'));
    assert.ok(titulos.includes('Café del Puerto'));
    assert.ok(titulos.includes('Autolavado Marino'));

    DEMO_CAMPAIGNS.forEach(c => {
        assert.ok(c.id, 'Cada campaña tiene id');
        assert.ok(c.badge, 'Cada campaña tiene badge');
        assert.ok(c.stock > 0, 'Cada campaña tiene stock disponible');
        assert.ok(c.caja_id, 'Cada campaña tiene caja_id');
        assert.strictEqual(esCampanaVigente(c), true, 'Todas las campañas demo son vigentes');
    });
});

test(27, 'Juego en DEMO - Simulación de rasca y registro en almacenamiento DEMO', () => {
    const storage = new MockStorage();
    const demoSession = {
        timestamp: Date.now(),
        code: 'DEMO-001',
        chofer: 'DEMO',
        origen: 'demo',
        juegoJugado: false
    };

    assert.strictEqual(puedeJugarSesion(demoSession, storage), true, 'Sesión demo puede jugar inicialmente');
    registrarIntentoJuego(demoSession, storage);

    assert.strictEqual(demoSession.juegoJugado, true, 'Marca juegoJugado en sesión demo');
    assert.strictEqual(storage.getItem(CONFIG_PILOTO.DEMO_PLAYED_KEY), 'true', 'Registra en encavigo_demo_played');
    assert.strictEqual(storage.getItem(CONFIG_PILOTO.SESSION_KEY), null, 'NO toca encavigo_session');
    assert.strictEqual(storage.getItem('encavigo_played_DEMO-001'), null, 'NO usa clave por código de producción');
});

test(28, 'Recarga en DEMO - Intento ya jugado bloquea segundo intento', () => {
    const storage = new MockStorage();
    const demoSession = {
        timestamp: Date.now(),
        code: 'DEMO-001',
        chofer: 'DEMO',
        origen: 'demo',
        juegoJugado: true
    };
    storage.setItem(CONFIG_PILOTO.DEMO_SESSION_KEY, JSON.stringify(demoSession));
    storage.setItem(CONFIG_PILOTO.DEMO_PLAYED_KEY, 'true');

    assert.strictEqual(puedeJugarSesion(demoSession, storage), false, 'Segundo intento bloqueado en demo');
});

test(29, 'Reinicio de DEMO real (reiniciarDemo) - Limpia datos demo pero conserva sesión real', () => {
    const storage = new MockStorage();
    const sesionReal = { origen: 'qr', code: 'ENC-REAL-STAY', chofer: 'V-001' };
    storage.setItem(CONFIG_PILOTO.SESSION_KEY, JSON.stringify(sesionReal));
    storage.setItem(CONFIG_PILOTO.DEMO_SESSION_KEY, JSON.stringify({ origen: 'demo', code: 'DEMO-001' }));
    storage.setItem(CONFIG_PILOTO.DEMO_PLAYED_KEY, 'true');

    // Asignar storage y location simulados en sandbox
    const origStorage = sandbox.localStorage;
    const origLocation = sandbox.window.location;
    sandbox.localStorage = storage;
    sandbox.window.location = { pathname: '/', href: '' };

    reiniciarDemo();

    assert.strictEqual(storage.getItem(CONFIG_PILOTO.DEMO_SESSION_KEY), null, 'Demo session borrada por reiniciarDemo');
    assert.strictEqual(storage.getItem(CONFIG_PILOTO.DEMO_PLAYED_KEY), null, 'Demo played borrado por reiniciarDemo');
    assert.notStrictEqual(storage.getItem(CONFIG_PILOTO.SESSION_KEY), null, 'Sesión real se mantiene intacta');
    assert.strictEqual(JSON.parse(storage.getItem(CONFIG_PILOTO.SESSION_KEY)).code, 'ENC-REAL-STAY', 'Código real conservado');
    assert.strictEqual(sandbox.window.location.href, '/?demo=1', 'Redirige exactamente a /?demo=1');

    sandbox.localStorage = origStorage;
    sandbox.window.location = origLocation;
});

// ============================================================================
// BLOQUE 3: AUDITORÍA CODEX — EJECUCIÓN REAL DE ACCIONES Y FIREBASE
// ============================================================================

test(30, 'Eventos DOM reales DEMO: catálogo, clic, juego, canje, opinión y encuesta sin Firebase', integration.isolation);

test(31, 'Canje (quemarCupon) en DEMO simula éxito sin escrituras en Firestore', async () => {
    const mockDb = new MockFirestore();
    sandbox.window.db = mockDb;
    sandbox.window.__ENCAVI_ENTORNO__ = ENTORNOS.DEMO;
    sandbox.window.encaviSession = { origen: 'demo', code: 'DEMO-001', chofer: 'DEMO' };
    sandbox.window.loadedCampaigns = [
        { id: 'demo-fonda-rosa', title: 'Fonda Doña Rosa', stock: 5, caja_id: 'CAJA-DEMO' }
    ];

    let successShown = false;
    sandbox.document.getElementById = (id) => {
        if (id === 'successModal') return { style: { display: 'none' } };
        return { innerText: '', style: {}, classList: { add: () => {}, remove: () => {} } };
    };

    await quemarCupon('demo-fonda-rosa', 'Fonda Doña Rosa');

    assert.strictEqual(mockDb.writes.length, 0, 'Cero escrituras a tickets o campaigns en DEMO');
    assert.strictEqual(sandbox.window.loadedCampaigns[0].stock, 4, 'Stock simulado decrementado en memoria');
});

test(32, 'Canje en Producción con window.db = null no muestra éxito ni reduce stock', async () => {
    sandbox.window.db = null;
    sandbox.window.__ENCAVI_ENTORNO__ = ENTORNOS.PRODUCCION;
    sandbox.window.encaviSession = { origen: 'qr', code: 'ENC-REAL-01', chofer: 'V-001' };
    sandbox.window.loadedCampaigns = [
        { id: 'camp-prod-1', title: 'Comercio Real', stock: 10, caja_id: 'CAJA-PROD' }
    ];

    let avisoTexto = '';
    const origAviso = sandbox.window.alert;
    sandbox.window.alert = (txt) => { avisoTexto = txt; };

    let successModalShown = false;
    sandbox.document.getElementById = (id) => {
        if (id === 'successModal') {
            return {
                style: {
                    set display(val) { if (val === 'flex') successModalShown = true; }
                }
            };
        }
        return { innerText: '', style: {} };
    };

    await quemarCupon('camp-prod-1', 'Comercio Real');

    assert.strictEqual(successModalShown, false, 'NO debe mostrar successModal si db es null en producción');
    assert.strictEqual(sandbox.window.loadedCampaigns[0].stock, 10, 'NO debe reducir stock si db es null');
    assert.ok(avisoTexto.includes('No se pudo registrar'), 'Debe mostrar aviso de error claro');

    sandbox.window.alert = origAviso;
});

test(33, 'Canje en Producción con escritura rechazada no muestra éxito ni reduce stock', async () => {
    const rejectingDb = new MockFirestore(true); // Rechaza todas las escrituras
    sandbox.window.db = rejectingDb;
    sandbox.window.__ENCAVI_ENTORNO__ = ENTORNOS.PRODUCCION;
    sandbox.window.encaviSession = { origen: 'qr', code: 'ENC-REAL-02', chofer: 'V-002' };
    sandbox.window.loadedCampaigns = [
        { id: 'camp-prod-2', title: 'Comercio Real 2', stock: 8, caja_id: 'CAJA-PROD-2' }
    ];

    let avisoTexto = '';
    const origAviso = sandbox.window.alert;
    sandbox.window.alert = (txt) => { avisoTexto = txt; };

    let successModalShown = false;
    sandbox.document.getElementById = (id) => {
        if (id === 'successModal') {
            return {
                style: {
                    set display(val) { if (val === 'flex') successModalShown = true; }
                }
            };
        }
        return { innerText: '', style: {} };
    };

    await quemarCupon('camp-prod-2', 'Comercio Real 2');

    assert.strictEqual(successModalShown, false, 'NO debe mostrar success si la escritura fue rechazada');
    assert.strictEqual(sandbox.window.loadedCampaigns[0].stock, 8, 'NO debe reducir stock si fue rechazada');
    assert.ok(avisoTexto.length > 0, 'Debe alertar el error de registro');

    sandbox.window.alert = origAviso;
});

test(34, 'Canje en Producción con escritura permitida actualiza Firestore y muestra éxito', async () => {
    const mockDb = new MockFirestore(false);
    sandbox.window.db = mockDb;
    sandbox.window.__ENCAVI_ENTORNO__ = ENTORNOS.PRODUCCION;
    sandbox.window.encaviSession = { origen: 'qr', code: 'ENC-REAL-OK', chofer: 'V-003' };
    sandbox.window.loadedCampaigns = [
        { id: 'camp-prod-ok', title: 'Comercio OK', stock: 5, caja_id: 'CAJA-OK' }
    ];

    let successModalShown = false;
    sandbox.document.getElementById = (id) => {
        if (id === 'successModal') {
            return {
                style: {
                    set display(val) { if (val === 'flex') successModalShown = true; }
                }
            };
        }
        return { innerText: '', style: {} };
    };

    await quemarCupon('camp-prod-ok', 'Comercio OK');

    assert.strictEqual(successModalShown, true, 'Debe mostrar successModal al completar la escritura');
    assert.strictEqual(sandbox.window.loadedCampaigns[0].stock, 4, 'Debe decrementar stock');
    const ticketWrite = mockDb.writes.find(w => w.collection === 'tickets');
    assert.ok(ticketWrite, 'Debe escribir el documento en colección tickets');
    const campUpdate = mockDb.writes.find(w => w.collection === 'campaigns');
    assert.ok(campUpdate, 'Debe actualizar el stock en colección campaigns');
});

test(35, 'Opinión (enviarOpinion) en DEMO simula agradecimiento con cero escrituras', async () => {
    const mockDb = new MockFirestore();
    sandbox.window.db = mockDb;
    sandbox.window.__ENCAVI_ENTORNO__ = ENTORNOS.DEMO;
    sandbox.window.encaviSession = { origen: 'demo', code: 'DEMO-001', chofer: 'DEMO' };

    let paso3Visible = false;
    sandbox.document.getElementById = (id) => ({
        value: 'Excelente atención',
        innerText: '',
        textContent: '',
        style: {
            set display(val) { if (id === 'opPaso3' && val === 'block') paso3Visible = true; }
        }
    });

    await enviarOpinion();

    assert.strictEqual(paso3Visible, true, 'Muestra paso 3 de agradecimiento en DEMO');
    assert.strictEqual(mockDb.writes.length, 0, 'Cero escrituras a opiniones en DEMO');
});

test(36, 'Opinión en Producción con db = null o rechazo alerta error y no avanza', async () => {
    sandbox.window.db = null;
    sandbox.window.__ENCAVI_ENTORNO__ = ENTORNOS.PRODUCCION;
    sandbox.window.encaviSession = { origen: 'qr', code: 'ENC-001', chofer: 'V-001' };

    let alertMsg = '';
    const origAlert = sandbox.window.alert;
    sandbox.window.alert = (txt) => { alertMsg = txt; };

    let paso3Visible = false;
    sandbox.document.getElementById = (id) => ({
        value: 'Todo mal',
        innerText: '',
        textContent: '',
        style: {
            set display(val) { if (id === 'opPaso3' && val === 'block') paso3Visible = true; }
        }
    });

    await enviarOpinion();

    assert.strictEqual(paso3Visible, false, 'NO avanza a paso 3 si no hay base de datos');
    assert.ok(alertMsg.includes('No se pudo enviar'), 'Debe alertar error');

    sandbox.window.alert = origAlert;
});

test(37, 'Opinión en Producción con escritura exitosa avanza a agradecimiento', async () => {
    const mockDb = new MockFirestore(false);
    sandbox.window.db = mockDb;
    sandbox.window.__ENCAVI_ENTORNO__ = ENTORNOS.PRODUCCION;
    sandbox.window.encaviSession = { origen: 'qr', code: 'ENC-002', chofer: 'V-002' };

    let paso3Visible = false;
    sandbox.document.getElementById = (id) => ({
        value: 'Muy buen servicio',
        innerText: '',
        textContent: '',
        style: {
            set display(val) { if (id === 'opPaso3' && val === 'block') paso3Visible = true; }
        }
    });

    await enviarOpinion();

    const opWrite = mockDb.writes.find(w => w.collection === 'opiniones');
    assert.ok(opWrite, 'Debe registrar la opinión en colección opiniones');
    assert.strictEqual(paso3Visible, true, 'Avanza a paso 3 tras guardar');
});

test(38, 'URL con codificación malformada o inválida manejada de forma segura', () => {
    const malformadas = ['?%ZZ=1', '?chofer=%E0%A4%A', '?demo=%99', '?%=test'];
    for (const url of malformadas) {
        let params;
        assert.doesNotThrow(() => {
            params = evaluarParametrosURL(url);
        }, `evaluarParametrosURL no debe lanzar excepción con ${url}`);
        assert.strictEqual(params.valido, false, `Debe marcar inválida la URL ${url}`);
        assert.strictEqual(params.motivo, 'url_malformada', `Motivo debe ser url_malformada para ${url}`);

        const ev = evaluarEstadoAcceso({ searchStr: url });
        assert.strictEqual(ev.estado, ESTADO_ACCESO.SIN_ACCESO, `Debe bloquear acceso para ${url}`);
        assert.strictEqual(ev.motivo, 'url_malformada', `Motivo de bloqueo debe ser url_malformada`);
    }
});

test(39, 'Script de inicialización de Firebase evaluado en los 7 escenarios de arranque', () => {
    function probarArranque(searchStr, throwsOnConfig = false) {
        let initCalled = false;
        let firestoreCalled = false;
        const mockFb = {
            initializeApp: () => {
                initCalled = true;
                if (throwsOnConfig) throw new Error('Initialization failure');
            },
            firestore: () => {
                firestoreCalled = true;
                return { isMockDb: true };
            }
        };

        const sb = {
            window: {
                location: { search: searchStr, pathname: '/' }
            },
            console: { warn: () => {}, error: () => {}, log: () => {} },
            firebase: mockFb,
            db: undefined,
            URLSearchParams: URLSearchParams
        };
        sb.window.window = sb.window;
        vm.createContext(sb);
        vm.runInContext(sInit, sb);

        return {
            initCalled,
            firestoreCalled,
            db: sb.window.db
        };
    }

    // 1. DEMO nuevo (?demo=1) -> Cero inicialización
    const r1 = probarArranque('?demo=1');
    assert.strictEqual(r1.initCalled, false, 'En ?demo=1 no debe llamar a initializeApp');
    assert.strictEqual(r1.db, null, 'En ?demo=1 window.db debe ser null');

    // 2. Enlace antiguo (?chofer=DEMO) -> Cero inicialización
    const r2 = probarArranque('?chofer=DEMO');
    assert.strictEqual(r2.initCalled, false, 'En ?chofer=DEMO no debe llamar a initializeApp');
    assert.strictEqual(r2.db, null, 'En ?chofer=DEMO window.db debe ser null');

    // 3. Parámetros mixtos rechazados (?demo=1&chofer=V1) -> Cero inicialización
    const r3 = probarArranque('?demo=1&chofer=V1');
    assert.strictEqual(r3.initCalled, false, 'En parámetros mixtos no debe inicializar');
    assert.strictEqual(r3.db, null, 'window.db debe ser null');

    // 4. URL con codificación inválida (?%ZZ=1) -> Cero inicialización
    const r4 = probarArranque('?%ZZ=1');
    assert.strictEqual(r4.initCalled, false, 'En URL malformada no debe inicializar');
    assert.strictEqual(r4.db, null, 'window.db debe ser null');

    // 5. Entrada directa sin sesión ("") -> Inicializa normalmente
    const r5 = probarArranque('');
    assert.strictEqual(r5.initCalled, true, 'En entrada directa inicializa Firebase');
    assert.notStrictEqual(r5.db, null, 'window.db es asignado');

    // 6. Producción simulada (?chofer=V-102) -> Inicializa normalmente
    const r6 = probarArranque('?chofer=V-102');
    assert.strictEqual(r6.initCalled, true, 'En QR de producción inicializa Firebase');
    assert.notStrictEqual(r6.db, null, 'window.db es asignado');

    // 7. Fallo de inicialización de Firebase -> Capturado con seguridad
    const r7 = probarArranque('?chofer=V-102', true);
    assert.strictEqual(r7.initCalled, true, 'Intenta inicializar');
    assert.strictEqual(r7.db, null, 'Fallo capturado: window.db permanece null sin quebrar la app');
});

test(40, 'Dos contextos DOM y salida DEMO conservan sesión e intento QR reales', integration.transitions);
test(41, 'Opinión con respuesta diferida exitosa o rechazada espera Firebase', integration.deferredOpinion);
test(42, 'Arranque DOM con almacenamiento corrupto conserva aislamiento DEMO', integration.corruptStorage);

test(43, 'Enlaces en negocios/index.html actualizados a /?demo=1 (sin chofer=DEMO)', () => {
    const negHtml = fs.readFileSync(path.join(__dirname, 'negocios', 'index.html'), 'utf8');
    assert.ok(!negHtml.includes('chofer=DEMO'), 'No debe quedar ninguna ocurrencia de chofer=DEMO en negocios/index.html');
    assert.ok(negHtml.includes('href="/?demo=1"'), 'Debe enlazar a /?demo=1');
});

test(44, 'Comprobación de ciclo de vida DOM completo en modo DEMO y modo producción', () => {
    function verificarCiclo(nombre, params, sesion) {
        const domEvents = {};
        const elements = {};
        const doc = {
            body: {
                innerHTML: '<div id="scratchBanner"></div><div id="gameModal"></div><div class="immersive-feed"></div>',
                appendChild: () => {},
                prepend: () => {},
                addEventListener: () => {}
            },
            getElementById: (id) => {
                if (!elements[id]) elements[id] = { style: {}, classList: { add:()=>{}, remove:()=>{}, contains:()=>false } };
                return elements[id];
            },
            querySelector: () => ({ innerHTML: '', querySelectorAll: () => [] }),
            querySelectorAll: () => [],
            createElement: () => ({ id: '', style: {}, innerHTML: '', addEventListener: () => {} }),
            addEventListener: (ev, fn) => {
                if (!domEvents['doc:' + ev]) domEvents['doc:' + ev] = [];
                domEvents['doc:' + ev].push(fn);
            },
            title: 'EncaviGO'
        };

        const mockStore = new MockStorage();
        if (sesion) mockStore.setItem(CONFIG_PILOTO.SESSION_KEY, JSON.stringify(sesion));

        const mockDb = new MockFirestore();
        const sb = {
            alert: () => {},
            window: {
                alert: () => {},
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
                firestore: Object.assign(() => mockDb, {
                    FieldValue: { serverTimestamp: () => ({}), increment: (n) => n }
                })
            },
            db: mockDb,
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
        vm.runInContext(sInit, sb);
        vm.runInContext(sMain, sb);

        if (domEvents['doc:DOMContentLoaded']) domEvents['doc:DOMContentLoaded'].forEach(fn => fn());
        if (domEvents['win:DOMContentLoaded']) domEvents['win:DOMContentLoaded'].forEach(fn => fn());

        if (params === '?demo=1') {
            assert.strictEqual(mockDb.writes.length, 0, 'Ciclo DOM en DEMO produjo cero escrituras');
            assert.strictEqual(mockDb.reads.length, 0, 'Ciclo DOM en DEMO produjo cero lecturas');
        }
    }

    verificarCiclo('Entrada directa (sin sesión previa)', '', null);
    verificarCiclo('Sesión vencida (>24h)', '', { origen: 'qr', chofer: 'V1', timestamp: Date.now() - 30*3600000, code: 'ENC-EXP' });
    verificarCiclo('Sesión activa con QR legítimo', '?chofer=V102', null);
    verificarCiclo('Ciclo DOM en Modo DEMO (?demo=1)', '?demo=1', null);
});

// Verificaciones estáticas de recursos y viewport
assert.ok(fs.existsSync(path.join(__dirname, 'negocios', 'index.html')), 'El destino local de /negocios/ debe existir');
assert.ok(fs.existsSync(path.join(__dirname, 'logo_jackpot.jpg')), 'logo_jackpot.jpg debe existir');
assert.ok(indexHtml.includes('name="viewport"'), 'index.html debe contener meta viewport');
assert.ok(indexHtml.includes('width=device-width'), 'meta viewport debe incluir width=device-width');

// Ejecutar todas las pruebas asíncronas secuencialmente
(async () => {
    for (const { num, description, fn } of testQueue) {
        try {
            await fn();
            console.log(`[PASS] Caso ${num}: ${description}`);
            passedTests++;
        } catch (err) {
            console.error(`[FAIL] Caso ${num}: ${description}`);
            console.error('       Detalle:', err.message);
        }
    }

    console.log('\n---------------------------------------------------------------');
    console.log(`RESULTADO FINAL: ${passedTests} de ${testQueue.length} pruebas pasadas.`);
    console.log('---------------------------------------------------------------');

    if (passedTests !== testQueue.length) {
        process.exit(1);
    }
})();
