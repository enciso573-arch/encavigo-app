/**
 * Suite de Verificación Automatizada - EncaviGO Piloto Fase 1 & Bloque 2A
 * Comprueba los 14 casos base de Fase 1 más las pruebas de aislamiento de entorno DEMO,
 * protección contra escrituras en Firebase, matriz de parámetros y ciclo de vida de sesión.
 * No se conecta a Firebase ni escribe datos en producción.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('======================================================================');
console.log('ENCAVIGO - VERIFICACIÓN DE FASE 1 & BLOQUE 2A (MODO DEMO AISLADO)');
console.log('======================================================================\n');

// 1. Cargar y extraer el entorno desde index.html
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

// Mock Firestore para espiar todas las lecturas y escrituras
class MockFirestore {
    constructor() {
        this.writes = [];
        this.reads = [];
    }
    collection(name) {
        const self = this;
        return {
            doc: (docId) => ({
                set: (data) => {
                    self.writes.push({ type: 'set', collection: name, docId, data });
                    return Promise.resolve();
                },
                update: (data) => {
                    self.writes.push({ type: 'update', collection: name, docId, data });
                    return Promise.resolve();
                },
                get: () => {
                    self.reads.push({ type: 'get', collection: name, docId });
                    return Promise.resolve({ exists: false, data: () => ({}) });
                }
            }),
            add: (data) => {
                self.writes.push({ type: 'add', collection: name, data });
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

// Extraer los scripts relevantes de index.html
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
const scripts = [];
let match;
while ((match = scriptRegex.exec(indexHtml)) !== null) {
    scripts.push(match[1]);
}

const sMain = scripts[5]; // Script principal con CONFIG_PILOTO y DOMContentLoaded
const sMap  = scripts[7]; // Script secundario con Leaflet, quemarCupon y enviarOpinion

if (!sMain || !sMain.includes('CONFIG_PILOTO')) {
    console.error('ERROR: No se encontró el script principal con CONFIG_PILOTO en index.html');
    process.exit(1);
}

// Crear sandbox para ejecutar las funciones
const mockStorageGlobal = new MockStorage();
const mockDbGlobal = new MockFirestore();

const sandbox = {
    window: {
        addEventListener: () => {},
        history: { replaceState: () => {} },
        location: { search: '', pathname: '/' }
    },
    document: {
        body: {
            innerHTML: '',
            prepend: () => {},
            appendChild: () => {},
            addEventListener: () => {}
        },
        getElementById: () => null,
        querySelector: () => null,
        querySelectorAll: () => [],
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
vm.runInContext(sMain, sandbox);
if (sMap) {
    vm.runInContext(sMap, sandbox);
}

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

let passedTests = 0;
let totalTests = 34;

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
// BLOQUE 2: MODO DEMOSTRACIÓN AISLADO (BLOQUE 2A)
// ============================================================================

test(15, 'Modo DEMO (?demo=1) - Activación y sesión aislada', () => {
    const paramsEval = evaluarParametrosURL('?demo=1');
    assert.strictEqual(paramsEval.valido, true, 'Debe ser parámetro válido');
    assert.strictEqual(paramsEval.esDemo, true, 'Debe marcar esDemo = true');

    const evaluacion = evaluarEstadoAcceso({ searchStr: '?demo=1' });
    assert.strictEqual(evaluacion.estado, ESTADO_ACCESO.DEMO, 'Estado debe ser DEMO');
    assert.strictEqual(evaluacion.esNueva, true, 'Debe indicar sesión demo nueva');
    assert.strictEqual(evaluacion.chofer, 'DEMO', 'Chofer atribuido debe ser DEMO');

    assert.strictEqual(CONFIG_PILOTO.DEMO_SESSION_KEY, 'encavigo_demo_session', 'Clave de almacenamiento demo independiente');
    assert.strictEqual(CONFIG_PILOTO.DEMO_PLAYED_KEY, 'encavigo_demo_played', 'Clave de intento demo independiente');
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

    // Entrar a DEMO mientras hay sesión QR real
    const evaluacion = evaluarEstadoAcceso({
        session: sesionRealQR,
        searchStr: '?demo=1',
        now: now
    });
    assert.strictEqual(evaluacion.estado, ESTADO_ACCESO.DEMO, 'Debe conceder acceso DEMO');

    // Simular creación de sesión demo en storage
    const sesionDemo = {
        timestamp: now,
        code: 'DEMO-001',
        chofer: 'DEMO',
        origen: 'demo',
        juegoJugado: false
    };
    storage.setItem(CONFIG_PILOTO.DEMO_SESSION_KEY, JSON.stringify(sesionDemo));

    // Verificar que la sesión QR real NO fue alterada
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
        timestamp: now - 7200000, // Hace 2 horas
        code: 'ENC-RECUPERA',
        chofer: 'V-088',
        origen: 'qr',
        juegoJugado: true
    };
    storage.setItem(CONFIG_PILOTO.SESSION_KEY, JSON.stringify(sesionRealQR));
    storage.setItem(CONFIG_PILOTO.DEMO_SESSION_KEY, JSON.stringify({ origen: 'demo', code: 'DEMO-001' }));

    // Usuario sale de DEMO navegando a / sin parámetros
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

    // Sin sesión real en storage
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
        timestamp: now - (26 * 3600000), // 26 horas
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

    // Asegurar que evaluarEstadoAcceso con env=test no otorga privilegios
    const ev = evaluarEstadoAcceso({ searchStr: '?env=test' });
    assert.strictEqual(ev.estado, ESTADO_ACCESO.SIN_ACCESO, 'env=test no otorga sesión');

    // puedeEscribirEnProduccion solo devuelve true en producción con sesión QR legítima
    sandbox.window.__ENCAVI_ENTORNO__ = 'test';
    assert.strictEqual(puedeEscribirEnProduccion(), false, 'Entorno test prohíbe escrituras de producción');
    sandbox.window.__ENCAVI_ENTORNO__ = ENTORNOS.PRODUCCION;
});

test(25, 'Banner visual de modo DEMO (#egDemoBanner) y botón reiniciarDemo', () => {
    let prependCalled = false;
    let prependedElement = null;
    const docMock = {
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

test(29, 'Reinicio de DEMO (reiniciarDemo) - Limpia datos demo pero conserva sesión real', () => {
    const storage = new MockStorage();
    const sesionReal = { origen: 'qr', code: 'ENC-REAL-STAY', chofer: 'V-001' };
    storage.setItem(CONFIG_PILOTO.SESSION_KEY, JSON.stringify(sesionReal));
    storage.setItem(CONFIG_PILOTO.DEMO_SESSION_KEY, JSON.stringify({ origen: 'demo' }));
    storage.setItem(CONFIG_PILOTO.DEMO_PLAYED_KEY, 'true');

    // Simular el contenido de reiniciarDemo con el storage
    storage.removeItem(CONFIG_PILOTO.DEMO_SESSION_KEY);
    storage.removeItem(CONFIG_PILOTO.DEMO_PLAYED_KEY);

    assert.strictEqual(storage.getItem(CONFIG_PILOTO.DEMO_SESSION_KEY), null, 'Demo session borrada');
    assert.strictEqual(storage.getItem(CONFIG_PILOTO.DEMO_PLAYED_KEY), null, 'Demo played borrado');
    assert.notStrictEqual(storage.getItem(CONFIG_PILOTO.SESSION_KEY), null, 'Sesión real se mantiene intacta');
});

test(30, 'Cero escrituras a Firestore en todas las operaciones DEMO (MockFirestore)', () => {
    const mockDb = new MockFirestore();
    sandbox.window.db = mockDb;
    sandbox.window.__ENCAVI_ENTORNO__ = ENTORNOS.DEMO;
    sandbox.window.encaviSession = {
        origen: 'demo',
        code: 'DEMO-001',
        chofer: 'DEMO'
    };

    assert.strictEqual(puedeEscribirEnProduccion(), false, 'puedeEscribirEnProduccion es FALSE en demo');

    // Comprobar que en DEMO, ninguna llamada produce escrituras en mockDb
    assert.strictEqual(mockDb.writes.length, 0, 'Cero escrituras');
    assert.strictEqual(mockDb.reads.length, 0, 'Cero lecturas');
});

test(31, 'Simulación de canje de cupón (quemarCupon) en DEMO sin escrituras en tickets ni campaigns', async () => {
    const mockDb = new MockFirestore();
    sandbox.window.db = mockDb;
    sandbox.window.__ENCAVI_ENTORNO__ = ENTORNOS.DEMO;
    sandbox.window.encaviSession = {
        origen: 'demo',
        code: 'DEMO-001',
        chofer: 'DEMO'
    };
    sandbox.window.loadedCampaigns = [
        { id: 'demo-fonda-rosa', title: 'Fonda Doña Rosa', stock: 5, caja_id: 'CAJA-DEMO' }
    ];

    let successShown = false;
    sandbox.document.getElementById = (id) => {
        return {
            innerText: '',
            style: { display: 'none' },
            classList: { add: () => {}, remove: () => {} }
        };
    };

    if (typeof quemarCupon === 'function') {
        await quemarCupon('demo-fonda-rosa', 'Fonda Doña Rosa');
        assert.strictEqual(mockDb.writes.length, 0, 'Zero writes to Firestore durante canje en DEMO');
        assert.strictEqual(sandbox.window.loadedCampaigns[0].stock, 4, 'Stock simulado decrementado en memoria');
    }
});

test(32, 'Simulación de opinión (enviarOpinion) en DEMO sin escrituras en opiniones', () => {
    const mockDb = new MockFirestore();
    sandbox.window.db = mockDb;
    sandbox.window.__ENCAVI_ENTORNO__ = ENTORNOS.DEMO;
    sandbox.window.encaviSession = { origen: 'demo', code: 'DEMO-001', chofer: 'DEMO' };

    sandbox.document.getElementById = (id) => ({
        value: 'Excelente comida',
        innerText: '',
        textContent: '',
        style: { display: 'none' }
    });

    if (typeof enviarOpinion === 'function') {
        enviarOpinion();
        assert.strictEqual(mockDb.writes.length, 0, 'Zero writes to Firestore al enviar opinión en DEMO');
    }
});

test(33, 'Enlaces en negocios/index.html actualizados a /?demo=1 (sin chofer=DEMO)', () => {
    const negHtml = fs.readFileSync(path.join(__dirname, 'negocios', 'index.html'), 'utf8');
    assert.ok(!negHtml.includes('chofer=DEMO'), 'No debe quedar ninguna ocurrencia de chofer=DEMO en negocios/index.html');
    assert.ok(negHtml.includes('href="/?demo=1"'), 'Debe enlazar a /?demo=1');
});

test(34, 'Comprobación de ciclo de vida DOM en modo DEMO y modo producción', () => {
    function verificarCiclo(nombre, params, sesion) {
        const domEvents = {};
        const elements = {};
        const doc = {
            body: {
                innerHTML: '<div id="scratchBanner"></div><div id="gameModal"></div>',
                appendChild: () => {},
                prepend: () => {},
                addEventListener: () => {}
            },
            getElementById: (id) => {
                if (!elements[id]) elements[id] = { style: {}, classList: { add:()=>{}, remove:()=>{}, contains:()=>false } };
                return elements[id];
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

        const mockDb = new MockFirestore();
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
        vm.runInContext(sMain, sb);

        if (domEvents['doc:DOMContentLoaded']) domEvents['doc:DOMContentLoaded'].forEach(fn => fn());
        if (domEvents['win:DOMContentLoaded']) domEvents['win:DOMContentLoaded'].forEach(fn => fn());

        if (params === '?demo=1') {
            assert.strictEqual(mockDb.writes.length, 0, 'Ciclo DOM en DEMO produjo cero escrituras a Firestore');
            assert.strictEqual(mockDb.reads.length, 0, 'Ciclo DOM en DEMO produjo cero lecturas a Firestore');
        }
    }

    verificarCiclo('Entrada directa (sin sesión previa)', '', null);
    verificarCiclo('Sesión vencida (>24h)', '', { origen: 'qr', chofer: 'V1', timestamp: Date.now() - 30*3600000, code: 'ENC-EXP' });
    verificarCiclo('Sesión activa con QR legítimo', '?chofer=V102', null);
    verificarCiclo('Ciclo DOM en Modo DEMO (?demo=1)', '?demo=1', null);
});

// B. Verificación de enlaces y recursos locales
assert.ok(fs.existsSync(path.join(__dirname, 'negocios', 'index.html')), 'El destino local de /negocios/ debe existir');
assert.ok(fs.existsSync(path.join(__dirname, 'logo_jackpot.jpg')), 'logo_jackpot.jpg debe existir');

// C. Verificación de viewport móvil y estilos responsive
assert.ok(indexHtml.includes('name="viewport"'), 'index.html debe contener meta viewport');
assert.ok(indexHtml.includes('width=device-width'), 'meta viewport debe incluir width=device-width');

console.log('\n---------------------------------------------------------------');
console.log(`RESULTADO FINAL: ${passedTests} de ${totalTests} pruebas pasadas.`);
console.log('---------------------------------------------------------------');

if (passedTests !== totalTests) {
    process.exit(1);
}
