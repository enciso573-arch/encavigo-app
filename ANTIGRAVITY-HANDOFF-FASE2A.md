# EncaviGO — Informe de Implementación Bloque 2A
## Entorno de Pruebas Aislado y Modo DEMO Seguro

**Fecha:** 2026-10-03  
**Proyecto:** EncaviGO  
**Ruta:** `C:\Users\Enciso\Desktop\EncaviGO`  
**Repositorio:** `https://github.com/enciso573-arch/encavigo-app`  
**Rama de trabajo:** `antigravity/fase1-acceso-juego`  
**Commit de partida:** `f72e968`  
**Estado:** Verificado y aprobado localmente  

---

## 1. Resumen Ejecutivo

En el Bloque 2A se implementó un aislamiento estricto e inquebrantable entre los entornos de **Producción**, **Demostración** y **Test**, garantizando que:
1. La exploración y demostración del producto comercial mediante `?demo=1` o el enlace antiguo `?chofer=DEMO` no inicializa el cliente de Firebase, no realiza lecturas a Firestore y no envía ninguna escritura hacia la base de datos de producción.
2. Las sesiones del Modo DEMO se gestionan en claves de almacenamiento completamente independientes (`encavigo_demo_session` y `encavigo_demo_played`), conservando intacta cualquier sesión QR real activa en el dispositivo.
3. Se protegió centralmente la totalidad del inventario de escrituras (11 puntos en 8 colecciones) mediante la función guardián `puedeEscribirEnProduccion()`.
4. Los enlaces comerciales en `negocios/index.html` fueron actualizados de `/?chofer=DEMO` a `/?demo=1`.
5. Se amplió la suite automatizada `test_fase1.js` de 14 a 34 pruebas unitarias y de integración en memoria, cubriendo la matriz completa de abusos de parámetros, ciclo de vida DOM, simulación de canje y confirmando 0 escrituras hacia Firebase.

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
* **Reinicio de DEMO (`reiniciarDemo()`):** Limpia exclusivamente `encavigo_demo_session` y `encavigo_demo_played`. Conserva intacta la sesión real en `encavigo_session`.

---

## 3. Desactivación de Firebase en DEMO y Protección de Escrituras

### 3.1 Inicialización Condicional de Firebase
Antes de ejecutar `firebase.initializeApp(firebaseConfig)` en `index.html`, se inspecciona la URL de acceso:
* Si se detecta modo demostración (`?demo=1` o `?chofer=DEMO`), **no se inicializa el cliente de Firebase** y se establece `window.db = null`.
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

A continuación se detalla la protección aplicada en los 11 puntos de escritura en Firestore:

| # | Colección | Operación | Función / Punto de Código | Protección Aplicada |
|---|---|---|---|---|
| 1 | `calco_log` | `.set()` | `contarCalcomania` | Retorna de inmediato si `!puedeEscribirEnProduccion()`. |
| 2 | `codigos` | `.update()` | `contarCalcomania` | No se ejecuta si no pasa el guardián de calcomanía. |
| 3 | `interes` | `.set()` | Encuesta categoría vacía | Bloqueado con `if (puedeEscribirEnProduccion())`. |
| 4 | `click_log` | `.set()` | Clic en reclamo (`.track-click`) | Bloqueado con `if (puedeEscribirEnProduccion())`. |
| 5 | `stats` | `.update()` | Incremento de clicks globales | Bloqueado con `if (puedeEscribirEnProduccion())`. |
| 6 | `choferes` | `.update()` | Clicks por chofer | Bloqueado con `if (puedeEscribirEnProduccion())`. |
| 7 | `campaigns` | `.update()` | Clicks por campaña | Bloqueado con `if (puedeEscribirEnProduccion())`. |
| 8 | `scan_log` | `.set()` | Registro de escaneo de chofer | Bloqueado con `if (puedeEscribirEnProduccion() ...)`. |
| 9 | `premios` | `.set()` | Viaje gratis (`openGame`) | Bloqueado por `VIAJE_GRATIS_HABILITADO: false` y `puedeEscribirEnProduccion()`. |
| 10 | `tickets` | `.set()` | Canje de cupón (`quemarCupon`) | En DEMO simula éxito visual y decrementa stock en memoria; 0 llamadas a Firestore. |
| 11 | `opiniones` | `.add()` | Encuesta tras canje (`enviarOpinion`) | En DEMO muestra agradecimiento visual; 0 llamadas a Firestore. |

---

## 5. Matriz de Parámetros de URL y Políticas de Acceso

La función `evaluarParametrosURL(searchStr)` analiza rigurosamente las cadenas de búsqueda:
* `?demo=1` &rarr; Modo DEMO legítimo.
* `?chofer=DEMO` (mayúsculas o minúsculas) &rarr; Enlace comercial histórico. Se normaliza a DEMO y **nunca** concede una sesión real.
* `?demo=1&chofer=V-001` &rarr; Combinación ambigua. Rechazada con estado `SIN_ACCESO` (motivo: `combinacion_ambigua_demo_chofer`).
* `?demo=1&demo=1` o `?chofer=V1&chofer=V2` &rarr; Parámetros repetidos. Rechazados con estado `SIN_ACCESO` (motivo: `parametros_repetidos`).
* `?demo=0`, `?demo=false`, `?demo=otro`, `?demo=` &rarr; Parámetros DEMO inválidos. Rechazados con estado `SIN_ACCESO` (motivo: `demo_invalido`).
* `?env=test` o claves en `localStorage` &rarr; Parámetros públicos sin efecto. El entorno de pruebas solo existe dentro del arnés local de ejecución simulada.

---

## 6. Campañas de Ejemplo para Demostración

En modo DEMO se cargan 4 comercios locales simulados (`DEMO_CAMPAIGNS`), sin realizar peticiones a Firestore:
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
  * Invoca `reiniciarDemo()`, que limpia el almacenamiento local demo y refresca la vista.
  * No afecta la sesión real guardada.

---

## 8. Resultados de la Suite Automatizada (`test_fase1.js`)

Se ejecutaron 34 pruebas automatizadas con salida limpia y 100% aprobadas:
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
[PASS] Caso 29: Reinicio de DEMO (reiniciarDemo) - Limpia datos demo pero conserva sesión real
[PASS] Caso 30: Cero escrituras a Firestore en todas las operaciones DEMO (MockFirestore)
[PASS] Caso 31: Simulación de canje de cupón (quemarCupon) en DEMO sin escrituras en tickets ni campaigns
[PASS] Caso 32: Simulación de opinión (enviarOpinion) en DEMO sin escrituras en opiniones
[PASS] Caso 33: Enlaces en negocios/index.html actualizados a /?demo=1 (sin chofer=DEMO)
[PASS] Caso 34: Comprobación de ciclo de vida DOM en modo DEMO y modo producción

RESULTADO FINAL: 34 de 34 pruebas pasadas.
```

---

## 9. Archivos Modificados

1. `C:\Users\Enciso\Desktop\EncaviGO\index.html`:
   * Inicialización condicional de Firebase.
   * `ENTORNOS`, `CONFIG_PILOTO` con claves demo, `ESTADO_ACCESO.DEMO`.
   * Campañas `DEMO_CAMPAIGNS`.
   * Funciones `evaluarParametrosURL`, `puedeEscribirEnProduccion`, `mostrarBannerDemo`, `reiniciarDemo`.
   * Modificación de flujo de entrada en `DOMContentLoaded`.
   * Protección de los 11 puntos de escritura.
   * Exposición de funciones en `window.EncaviCore`.
2. `C:\Users\Enciso\Desktop\EncaviGO\negocios\index.html`:
   * Reemplazo de enlaces `/?chofer=DEMO` por `/?demo=1` en botón Hero (línea 639) y footer (línea 1111).
3. `C:\Users\Enciso\Desktop\EncaviGO\test_fase1.js`:
   * Ampliación del arnés a 34 pruebas automatizadas con `MockFirestore`.
4. `C:\Users\Enciso\Desktop\EncaviGO\ANTIGRAVITY-HANDOFF-FASE2A.md`:
   * Este documento de entrega y auditoría técnica.

---

## 10. Declaración de Diagnóstico Final

**Entorno DEMO aislado y aprobado para continuar pruebas**
