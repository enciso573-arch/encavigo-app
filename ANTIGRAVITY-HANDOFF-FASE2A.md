# EncaviGO — Informe de Implementación Bloque 2A (Revisión Auditada)
## Entorno de Pruebas Aislado y Modo DEMO Seguro

**Fecha:** 2026-10-03
**Proyecto:** EncaviGO
**Ruta:** `C:\Users\Enciso\Desktop\EncaviGO`
**Repositorio:** `https://github.com/enciso573-arch/encavigo-app`
**Rama de trabajo:** `antigravity/fase1-acceso-juego`
**Commit base:** `f72e968`
**Commit inicial Bloque 2A:** `81db985`
**Estado:** Verificado y aprobado localmente (44 de 44 pruebas asíncronas superadas)

---

## 1. Resumen Técnico

En el Bloque 2A se implementó la separación técnica entre los entornos de **Producción**, **Demostración (DEMO)** y **Test**:

1. **Aislamiento en DEMO:** El acceso mediante `?demo=1` o el enlace histórico `?chofer=DEMO` no inicializa el cliente de Firebase (`window.db = null`), no efectúa lecturas a Firestore y no envía escrituras a la base de datos de producción.
2. **Aislamiento de almacenamiento:** Las sesiones de demostración operan en claves independientes (`encavigo_demo_session` y `encavigo_demo_played`). Las sesiones QR de producción (`encavigo_session` y `encavigo_played_<codigo>`) no se modifican, eliminan ni sobrescriben al interactuar con el modo DEMO.
3. **Manejo diferenciado en canje y opinión:**
   - En **DEMO**, el canje de cupón y el envío de opiniones simulan éxito visual local con datos de ejemplo en memoria, sin invocar servicios de red.
   - En **Producción**, si Firebase no está disponible (`db = null`) o si la escritura en Firestore es rechazada por error de red o permisos, el flujo se detiene inmediatamente, emite un aviso de error claro al usuario, **no** muestra la pantalla de éxito y **no** descuenta stock de la campaña.
4. **Manejo seguro de parámetros de URL:** `evaluarParametrosURL` captura posibles excepciones de decodificación (`URIError` ante secuencias percent-encoding inválidas como `?%ZZ=1`) retornando `valido: false, motivo: 'url_malformada'`, impidiendo el acceso sin interrumpir la ejecución.
5. **Enlaces comerciales:** Se actualizaron las referencias en `negocios/index.html` de `/?chofer=DEMO` a `/?demo=1`.
6. **Arnés de pruebas asíncrono:** `test_fase1.js` fue reestructurado como un ejecutor secuencial asíncrono que espera la resolución de cada prueba antes de registrar el resultado. En caso de aserción fallida, el proceso finaliza con código de salida 1. Se cubren 44 casos de prueba automatizados.

---

## 2. Aislamiento de Sesiones y Almacenamiento

### 2.1 Claves de Almacenamiento
* **Sesión QR de Producción:** `CONFIG_PILOTO.SESSION_KEY = 'encavigo_session'`
* **Intento de Juego de Producción:** `'encavigo_played_' + session.code`
* **Sesión de Demostración:** `CONFIG_PILOTO.DEMO_SESSION_KEY = 'encavigo_demo_session'`
* **Intento de Juego de Demostración:** `CONFIG_PILOTO.DEMO_PLAYED_KEY = 'encavigo_demo_played'`

### 2.2 Política de Coexistencia y Transiciones
* **Entrada a DEMO desde sesión QR activa:** Al ingresar con `?demo=1`, la sesión demo se inicializa bajo `encavigo_demo_session`. La clave `encavigo_session` permanece inalterada (no se borra, renueva, sobrescribe ni reutiliza).
* **Retorno de DEMO a Producción:** Si el usuario sale del modo demo navegando a `/` (entrada directa sin parámetros), el evaluador inspecciona `encavigo_session`:
  * Si la sesión QR real sigue dentro de las 24 horas, se recupera con su código original, vehículo atribuido y estado de juego consumido.
  * Si la sesión QR real ya venció (> 24 h), se presenta la pantalla de sesión vencida.
  * Si el usuario nunca tuvo una sesión QR real previa, se presenta la pantalla que exige escanear el código QR en un transporte afiliado.
* **Reinicio de DEMO (`reiniciarDemo()`):** Limpia exclusivamente `encavigo_demo_session` y `encavigo_demo_played`. Conserva intacta la sesión real en `encavigo_session` y redirige a `/?demo=1`.

---

## 3. Desactivación de Firebase en DEMO y Protección de Escrituras

### 3.1 Inicialización Condicional de Firebase
Antes de ejecutar `firebase.initializeApp(firebaseConfig)` en `index.html`, el script de inicialización invoca `evaluarParametrosURL(window.location.search)`:
* Si la URL corresponde a modo DEMO (`?demo=1`), enlace histórico (`?chofer=DEMO`), parámetros ambiguos o URL malformada, **no se ejecuta `firebase.initializeApp`** y se establece `window.db = null`.
* No se crean listeners en tiempo real, consultas pendientes ni tareas en segundo plano que puedan disparar escrituras tras abandonar la pantalla.

### 3.2 Guardián Central de Escrituras (`puedeEscribirEnProduccion`)
Toda función que realiza operaciones de modificación en Firestore consulta obligatoriamente:
```javascript
function puedeEscribirEnProduccion() {
    if (typeof window === 'undefined') return false;
    if (window.__ENCAVI_ENTORNO__ !== ENTORNOS.PRODUCCION) return false;
    if (!window.encaviSession || typeof window.encaviSession !== 'object') return false;
    if (window.encaviSession.origen !== 'qr') return false;
    if (!window.encaviSession.chofer || window.encaviSession.chofer === 'orgánico' || String(window.encaviSession.chofer).toUpperCase() === 'DEMO') return false;
    if (window.encaviSession.caducada) return false;
    if (!window.db) return false;
    return true;
}
```

---

## 4. Inventario Completo de Escrituras Protegidas

El inventario siguiente agrupa escrituras del flujo público en 11 colecciones; algunas colecciones tienen varias operaciones (por ejemplo, clicks y stock de campañas):

| # | Colección | Operación | Función / Punto de Código | Protección Aplicada |
|---|---|---|---|---|
| 1 | `calco_log` | `.set()` | `contarCalcomania` | Retorna de inmediato si `!puedeEscribirEnProduccion()`. |
| 2 | `codigos` | `.update()` | `contarCalcomania` | No se ejecuta si no pasa el guardián de calcomanía. |
| 3 | `interes` | `.set()` | Encuesta categoría vacía (`.vacio-chip`) | Bloqueado con `if (puedeEscribirEnProduccion())`. |
| 4 | `click_log` | `.set()` | Clic en reclamo (`.track-click`) | Bloqueado con `if (puedeEscribirEnProduccion())`. |
| 5 | `stats` | `.update()` | Incremento de clicks globales | Bloqueado con `if (puedeEscribirEnProduccion())`. |
| 6 | `choferes` | `.update()` | Clicks por chofer | Bloqueado con `if (puedeEscribirEnProduccion())`. |
| 7 | `campaigns` | `.update()` | Clicks por campaña | Bloqueado con `if (puedeEscribirEnProduccion())`. |
| 8 | `scan_log` | `.set()` | Registro de escaneo de chofer | Bloqueado con `if (puedeEscribirEnProduccion())`. |
| 9 | `premios` | `.set()` | Viaje gratis (`openGame`) | Bloqueado por `VIAJE_GRATIS_HABILITADO: false` y `puedeEscribirEnProduccion()`. |
| 10 | `tickets` | `.set()` | Canje de cupón (`quemarCupon`) | En DEMO simula éxito visual en memoria. En producción, si `!targetDb` o la escritura falla, detiene el flujo, emite alerta de error, no muestra éxito y no descuenta stock. |
| 11 | `opiniones` | `.add()` | Encuesta tras canje (`enviarOpinion`) | En DEMO muestra agradecimiento visual en memoria. En producción, si `!targetDb` o la escritura falla, detiene el flujo, emite alerta y no avanza. |

---

## 5. Matriz de Parámetros de URL y Políticas de Acceso

La función `evaluarParametrosURL(searchStr)` analiza rigurosamente las cadenas de búsqueda:
* `?demo=1` &rarr; Modo DEMO legítimo.
* `?chofer=DEMO` (mayúsculas o minúsculas) &rarr; Enlace comercial histórico. Se normaliza a DEMO y **nunca** concede una sesión real.
* `?demo=1&chofer=V-001` &rarr; Combinación ambigua. Rechazada con estado `SIN_ACCESO` (motivo: `combinacion_ambigua_demo_chofer`).
* `?demo=1&demo=1` o `?chofer=V1&chofer=V2` &rarr; Parámetros repetidos. Rechazados con estado `SIN_ACCESO` (motivo: `parametros_repetidos`).
* `?demo=0`, `?demo=false`, `?demo=otro`, `?demo=` &rarr; Parámetros DEMO inválidos. Rechazados con estado `SIN_ACCESO` (motivo: `demo_invalido`).
* `%ZZ`, `%E0%A4%A` (secuencias UTF-8 truncadas o percent-encoding corrupto) &rarr; Capturado por bloque `try/catch`, retorna `valido: false, motivo: 'url_malformada'`.
* `?env=test` o claves en `localStorage` &rarr; Parámetros públicos sin efecto de privilegios.

---

## 6. Campañas de Ejemplo para Demostración

En modo DEMO se cargan 4 comercios locales simulados (`DEMO_CAMPAIGNS`), sin peticiones a Firestore:
1. **Fonda Doña Rosa** (Desayunos tradicionales · 15% OFF, stock: 20)
2. **Tacos El Pastorcito** (Combo 5 tacos + agua · $85 MXN, stock: 15)
3. **Café del Puerto** (Cafetería · 2x1 americano/capuccino, stock: 30)
4. **Autolavado Marino** (Lavado exterior gratis con encerado, stock: 10)

Todas cuentan con coordenadas locales de Puerto Vallarta, categoría, badges y compatibilidad con el sistema de filtrado y visualización en mapa Leaflet.

---

## 7. Experiencia Visual del Modo DEMO

* **Banner visual superior (`#egDemoBanner`):**
  * Fondo naranja `#EA580C`, texto blanco en negrita: `🧪 MODO DEMOSTRACIÓN · Datos de prueba`.
  * Botón interactivo: `Reiniciar Demo`.
* **Botón Reiniciar Demo:**
  * Invoca `reiniciarDemo()`, que limpia el almacenamiento local demo y redirige a `/?demo=1`.
  * No afecta la sesión real guardada.

---

## 8. Resultados de la Suite Automatizada (`test_fase1.js`)

Se ejecutaron 44 pruebas automatizadas con el ejecutor asíncrono secuencial, resultando en 100% aprobadas:

```
[PASS] Caso 1: Entrada directa sin sesión
[PASS] Caso 2: Sesión QR nueva
[PASS] Caso 3: Recarga durante sesión activa
[PASS] Caso 13: Reabrir QR conserva la sesión activa
[PASS] Caso 14: QR nuevo reemplaza una sesión vencida
[PASS] Caso 4: Sesión vencida (> 24 horas)
[PASS] Caso 5: Un intento de juego ya utilizado
[PASS] Caso 6: Juego sin campañas
[PASS] Caso 7: Juego con una campaña real simulada localmente
[PASS] Caso 8: Viaje gratis desactivado durante el piloto
[PASS] Caso 9: Campaña antes de startDate
[PASS] Caso 10: Campaña dentro de vigencia
[PASS] Caso 11: Campaña después de endDate e inclusión de todo el día
[PASS] Caso 12: Campaña antigua sin fechas
[PASS] Caso 15: Modo DEMO (?demo=1) - Activación y sesión aislada
[PASS] Caso 16: Modo DEMO - Preservación de sesión QR real existente
[PASS] Caso 17: Salida de DEMO - Recuperación transparente de sesión QR real vigente
[PASS] Caso 18: Salida de DEMO - Bloqueo correcto sin sesión QR previa
[PASS] Caso 19: Salida de DEMO - Bloqueo por caducidad si la sesión QR ya venció
[PASS] Caso 20: Enlace antiguo ?chofer=DEMO - Normalizado a DEMO, nunca sesión real
[PASS] Caso 21: Matriz de parámetros - Combinación ambigua (?demo=1&chofer=V-001) rechazada
[PASS] Caso 22: Matriz de parámetros - Parámetros repetidos rechazados
[PASS] Caso 23: Matriz de parámetros - Valores inválidos de demo rechazados
[PASS] Caso 24: No-privilegio de entorno test por URL (?env=test) o localStorage
[PASS] Caso 25: Banner visual de modo DEMO (#egDemoBanner) y botón reiniciarDemo
[PASS] Caso 26: Carga de campañas DEMO (DEMO_CAMPAIGNS) locales sin lecturas a Firestore
[PASS] Caso 27: Juego en DEMO - Simulación de rasca y registro en almacenamiento DEMO
[PASS] Caso 28: Recarga en DEMO - Intento ya jugado bloquea segundo intento
[PASS] Caso 29: Reinicio de DEMO real (reiniciarDemo) - Limpia datos demo pero conserva sesión real
[PASS] Caso 30: Cero operaciones de Firebase en DEMO ejecutando acciones reales
[PASS] Caso 31: Canje (quemarCupon) en DEMO simula éxito sin escrituras en Firestore
[PASS] Caso 32: Canje en Producción con window.db = null no muestra éxito ni reduce stock
[PASS] Caso 33: Canje en Producción con escritura rechazada no muestra éxito ni reduce stock
[PASS] Caso 34: Canje en Producción con escritura permitida actualiza Firestore y muestra éxito
[PASS] Caso 35: Opinión (enviarOpinion) en DEMO simula agradecimiento con cero escrituras
[PASS] Caso 36: Opinión en Producción con db = null o rechazo alerta error y no avanza
[PASS] Caso 37: Opinión en Producción con escritura exitosa avanza a agradecimiento
[PASS] Caso 38: URL con codificación malformada o inválida manejada de forma segura
[PASS] Caso 39: Script de inicialización de Firebase evaluado en los 7 escenarios de arranque
[PASS] Caso 40: Dos instancias/pestañas compartiendo almacenamiento conservan aislamiento concurrente
[PASS] Caso 41: Recorrido completo: QR real -> DEMO -> Juego -> Reinicio DEMO -> Salida a / -> QR real intacto
[PASS] Caso 42: Manejo seguro de almacenamiento corrupto (JSON inválido en localStorage)
[PASS] Caso 43: Enlaces en negocios/index.html actualizados a /?demo=1 (sin chofer=DEMO)
[PASS] Caso 44: Comprobación de ciclo de vida DOM completo en modo DEMO y modo producción

---------------------------------------------------------------
RESULTADO FINAL: 44 de 44 pruebas pasadas.
---------------------------------------------------------------
```

---

## 9. Archivos Modificados

1. `C:\Users\Enciso\Desktop\EncaviGO\index.html`:
   - Inicialización condicional de Firebase con evaluación de parámetros segura ante `URIError`.
   - Distinción explícita de DEMO vs. fallos de producción en `quemarCupon` y `enviarOpinion`.
   - Definición de constantes `ENTORNOS`, `CONFIG_PILOTO` (claves demo), `ESTADO_ACCESO.DEMO`.
   - Campañas `DEMO_CAMPAIGNS`.
   - Funciones `evaluarParametrosURL`, `puedeEscribirEnProduccion`, `mostrarBannerDemo`, `reiniciarDemo`.
   - Protección en los 11 puntos de escritura.
   - Exposición en `window.EncaviCore`.
2. `C:\Users\Enciso\Desktop\EncaviGO\negocios\index.html`:
   - Enlaces actualizados de `/?chofer=DEMO` a `/?demo=1`.
3. `C:\Users\Enciso\Desktop\EncaviGO\test_fase1.js`:
   - Ejecutor asíncrono secuencial con 44 pruebas completas y control de código de salida en fallo.
4. `C:\Users\Enciso\Desktop\EncaviGO\ANTIGRAVITY-HANDOFF-FASE2A.md`:
   - Registro técnico del bloque auditado.

---

## 10. Declaración de Diagnóstico Final

Entorno DEMO aislado y aprobado para continuar pruebas

## 11. Cierre de Codex — 2026-10-03

La revisión final y sus límites están en `REVISION-CODEX-FASE2A.md`. Sustituye las descripciones históricas de los casos 30, 40, 41 y 42 del registro anterior: ahora ejecutan eventos DOM reales, dos contextos compartiendo almacenamiento, respuestas diferidas de opiniones y arranque con almacenamiento corrupto mediante `test_demo_integration.js`.

Se corrigió el retorno de la promesa de `enviarOpinion`, el canje demo sin GPS ni cámara, el encabezado cubierto por el banner y la identificación explícita del comprobante como demostración. La validación final usa `npm test` (44/44). Se verificó visualmente el flujo en escritorio y viewport móvil de 390 × 844. No se publicó ni se modificó Firebase.
