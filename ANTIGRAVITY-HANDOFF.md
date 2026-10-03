# Informe de Entrega Técnica — Antigravity (Fase 1: Acceso, Sesión y Juego)

**Fecha:** 2 de octubre de 2026  
**Repositorio:** `https://github.com/enciso573-arch/encavigo-app`  
**Carpeta de trabajo:** `C:\Users\Enciso\Desktop\EncaviGO`  
**Rama de trabajo:** `antigravity/fase1-acceso-juego`  
**Commit base:** `0b7a4da` (`main`)  

---

## 1. Rama y Commits Creados

- **Rama:** `antigravity/fase1-acceso-juego`
- **Commits locales (sin push):**
  1. `375315c` — `docs: add EncaviGO product specification and launch audit`
  2. `6d47711` — `fix: enforce QR session and pilot game behavior`
  3. `[Próximo]` — `docs: add Antigravity handoff report`

---

## 2. Archivos Modificados y Creados

- `index.html` (Modificado):
  - Inclusión de configuración centralizada `CONFIG_PILOTO`.
  - Funciones puras de control: `evaluarEstadoAcceso`, `puedeJugarSesion`, `registrarIntentoJuego`, `esCampanaVigente`, `escapeHTML`, `mostrarPantallaBloqueo`.
  - Exposición de `window.EncaviCore` para pruebas y desacoplamiento.
  - Corrección de pantalla de entrada directa sin QR y pantalla de sesión vencida.
  - Corrección del error de consola en `initGame` (`Cannot read properties of null (reading 'style')`).
  - Lógica de minijuego para 3 tarjetas idénticas, descubrimiento honesto de promociones y un solo intento por código de sesión.
  - Desactivación estricta del viaje gratis (probabilidad 0%, banner y splash actualizados).
  - Filtro completo de vigencia de campañas con `startDate`, `endDate`, `dias` y `active`.
- `test_fase1.js` (Creado): Suite de verificación automatizada ejecutable mediante `node test_fase1.js` con 12 casos de prueba y comprobaciones de ciclo de vida DOM, enlaces locales y responsive móvil.
- `AUDITORIA-LANZAMIENTO-2026-10-02.md` (Versionado en commit 1): Documento de auditoría técnica previa.
- `ESPECIFICACION-MAESTRA.md` (Versionado en commit 1): Fuente de la verdad de producto.
- `ANTIGRAVITY-HANDOFF.md` (Creado): Este informe técnico de traspaso para Codex.

---

## 3. Descripción Concreta de los Cambios por Tarea

### Tarea 1: Entrada Directa y Sesión Vencida
- **Entrada directa bloqueada:** Si el usuario accede a `encavigo.com` sin el parámetro `?chofer=` y sin una sesión QR previa en `localStorage`, `evaluarEstadoAcceso` devuelve `SIN_ACCESO`. Se muestra una pantalla que explica con claridad que debe escanear el QR dentro de un transporte afiliado, con enlace a `/negocios/`.
- **No confusión de estados:** Ya no se muestra "Sesión Expirada" a visitantes que nunca tuvieron sesión.
- **Sesión vencida (>24h):** Si existió una sesión originada por QR pero han transcurrido más de 24 horas (o está marcada como caducada), se muestra la pantalla informativa de "Sesión Vencida".
- **Sin errores de JavaScript:** Al mostrar las pantallas de bloqueo, el script detiene la ejecución restante de `DOMContentLoaded`, evitando consultas innecesarias a Firestore o manipulación de elementos inexistentes.
- **Corrección de `initGame`:** Se agregó una guarda defensiva `const banner = document.getElementById('scratchBanner'); if (!banner) return;`, eliminando el `TypeError` reportado en la auditoría.
- **Persistencia en recarga:** Si la sesión está activa y dentro de las 24 horas, recargar la página mantiene intacto el mismo código promocional (`ENC-...`) y la misma hora de inicio (`timestamp`).

### Tarea 2: Un Intento de Juego por Sesión
- **Intento vinculado al código de sesión:** Se implementó `puedeJugarSesion` y `registrarIntentoJuego`, asociando el estado jugado al código de sesión tanto en el objeto de sesión (`session.juegoJugado = true`) como en `localStorage.getItem('encavigo_played_' + session.code)`. Ya no depende exclusivamente de `new Date().toDateString()`.
- **Sin intentos adicionales al recargar:** Si el usuario recarga la página o vuelve a abrirla durante la sesión activa, el juego permanece bloqueado y el banner `#scratchBanner` no se muestra.
- **Tres tarjetas iguales:** El juego selecciona una campaña real entre las cargadas. Las tres tarjetas descubiertas revelan de manera idéntica el icono/imagen de esa campaña. Al terminar los 3 intentos, las 3 tarjetas se animan juntas al centro.
- **Descubrimiento honesto:** El resultado indica *"¡Descubriste una promoción! [Nombre del Negocio]"* e informa que la promoción forma parte del catálogo disponible. El botón del modal se actualizó a *"Ver en el catálogo"*.
- **Estado honesto sin campañas:** Si no hay campañas vigentes cargadas, el juego muestra 3 iconos neutros (`📍`) y el mensaje *"Sin promociones disponibles"*, sin inventar categorías ni comercios falsos.

### Tarea 3: Desactivación del Viaje Gratis durante el Piloto
- **Configuración única:** Se centralizó el control en `CONFIG_PILOTO.VIAJE_GRATIS_HABILITADO: false`.
- **Probabilidad cero:** Con el flag en `false`, `puedeGanarViaje` evalúa a `false`, `isJackpot` es estrictamente `false` y no se ejecuta ninguna escritura a `db.collection('premios')`.
- **Textos sustituidos:**
  - Banner: Cambió de *"🎟️ JUEGA Y GANA TU VIAJE GRATIS"* a *"🎟️ ESCANEA, JUEGA Y DESCUBRE PROMOCIONES EN TU RUTA"*.
  - Splash: Cambió de *"puedes ganarte el viaje gratis"* a *"descubre promociones en tu ruta"*.
- **Compatibilidad futura preservada:** El bloque de código para la adjudicación del jackpot se conservó condicionado a `CONFIG_PILOTO.VIAJE_GRATIS_HABILITADO` para cuando se cuente con presupuesto y reglas operativas.

### Tarea 4: Vigencia de Campañas
- **Función pura `esCampanaVigente`:**
  - `active`: Debe ser distinto de `false`.
  - `startDate`: Si existe, la fecha local actual (`YYYY-MM-DD`) debe ser `>= startDate`.
  - `endDate`: Si existe, la fecha local actual (`YYYY-MM-DD`) debe ser `<= endDate`. Incluye explícitamente todo el día de vencimiento hasta las 23:59:59 locales.
  - `dias`: Si existe como arreglo, el día de la semana local (`now.getDay()`) debe estar presente.
  - Compatibilidad: Campañas antiguas sin fechas o sin arreglo de días son admitidas si están activas.
- **Integración:** `window.egSaleHoy(camp)` ahora delega directamente en `esCampanaVigente(camp)`.

---

## 4. Decisiones e Interpretaciones Realizadas

1. **Inclusión de todo el día para `endDate`:** Se definió de forma explícita que una campaña con `endDate: "2026-10-15"` está vigente durante todo el 15 de octubre hasta las 23:59:59 locales, expirando al primer segundo del 16 de octubre.
2. **Interpretación de zona horaria:** Se utiliza la fecha local del dispositivo del usuario (reloj del sistema), que en la operación objetivo corresponde a Puerto Vallarta y Bahía de Banderas (UTC-6). Se documenta como limitación que un dispositivo con reloj desconfigurado evaluará según su fecha local.
3. **Persistencia dual del intento de juego:** Para evitar que un usuario manipule el objeto de sesión o borre selectivamente llaves, el intento se registra tanto dentro de `encavigo_session.juegoJugado` como en una llave independiente `encavigo_played_[session.code]`.
4. **Comportamiento ante calcomanía exterior (`paramDesde`):** Si un usuario escanea una calcomanía exterior teniendo una sesión QR activa previa, se conserva el acceso QR y se registra el origen de calcomanía. Si no tiene sesión QR activa previa, el acceso a promociones permanece bloqueado hasta abordar un transporte afiliado.
5. **Ajuste visual del botón de resultado:** El botón que decía *"¡Canjear Cupón!"* se reemplazó por *"Ver en el catálogo"*, dado que el juego descubre una oferta existente en el catálogo y no un canje inmediato en caja.

---

## 5. Pruebas Ejecutadas y Resultados Exactos

Se ejecutó la suite `test_fase1.js` con Node.js v24.16.0 en `C:\Users\Enciso\Desktop\EncaviGO`:

```
===============================================================
ENCAVIGO - VERIFICACIÓN DE FASE 1: ACCESO, SESIÓN Y JUEGO
===============================================================

[PASS] Caso 1: Entrada directa sin sesión
[PASS] Caso 2: Sesión QR nueva
[PASS] Caso 3: Recarga durante sesión activa
[PASS] Caso 4: Sesión vencida (> 24 horas)
[PASS] Caso 5: Un intento de juego ya utilizado
[PASS] Caso 6: Juego sin campañas
[PASS] Caso 7: Juego con una campaña real simulada localmente
[PASS] Caso 8: Viaje gratis desactivado durante el piloto
[PASS] Caso 9: Campaña antes de startDate
[PASS] Caso 10: Campaña dentro de vigencia
[PASS] Caso 11: Campaña después de endDate e inclusión de todo el día
[PASS] Caso 12: Campaña antigua sin fechas

--- Comprobaciones de ciclo de vida, enlaces y móvil ---
[PASS] Ciclo DOM: Entrada directa (sin sesión previa) ejecutado sin errores.
[PASS] Ciclo DOM: Sesión vencida (>24h) ejecutado sin errores.
[PASS] Ciclo DOM: Sesión activa con QR ejecutado sin errores.
[PASS] Enlaces y recursos locales verificados exitosamente.
[PASS] Configuración de ancho móvil verificada en meta tags y estilos.

---------------------------------------------------------------
RESULTADO FINAL: 12 de 12 pruebas pasadas.
---------------------------------------------------------------
```

- **Verificación sintáctica:** Todos los bloques `<script>` de `index.html` fueron analizados mediante `vm.Script` de Node.js, confirmando 0 errores de sintaxis.
- **Verificación Git:** `git diff --check` ejecutado con código de salida 0 (sin espacios en blanco espurios ni conflictos).

---

## 6. Casos que no Pudieron Probarse en este Entorno

1. **Lectura física de cámara en escaneo de QR:** Requiere un dispositivo móvil con cámara y permisos de hardware en navegador real.
2. **Escritura y lectura de Firebase en producción:** No se ejecutó intencionalmente para respetar la regla obligatoria de no contaminar la base de datos de producción.
3. **Comportamiento en Safari iOS / Chrome Android físico:** Las pruebas se realizaron mediante emulación de DOM y aislamiento con sandbox en Node.js; se recomienda prueba en dispositivos físicos antes de la salida a calle.

---

## 7. Riesgos y Limitaciones Pendientes

1. **Validación del vehículo por URL (`?chofer=`):** Actualmente el sistema confía en el valor de la URL si no está en la colección `bajas`. Un usuario técnico podría inventar un identificador de chofer hasta que se implemente validación criptográfica (firmas / tokens) o lista blanca en servidor.
2. **Reloj del dispositivo del cliente:** La vigencia de campañas y el vencimiento de 24 horas se basan en el reloj local del navegador. Si el teléfono tiene una fecha desfasada, podría alterar la evaluación local.
3. **Reglas de seguridad de Firestore:** La auditoría previa identificó que las reglas en producción conceden permisos sensibles a `request.auth != null`. Este bloque no modificó `firestore.rules`.
4. **Atómica de canjes e inventario:** La operación de canje en caja sigue requiriendo conversión a transacción indivisible en un bloque posterior.

---

## 8. Diferencias entre el Comportamiento Anterior y el Nuevo

| Característica | Comportamiento Anterior | Comportamiento Nuevo |
|---|---|---|
| Entrada directa sin QR | Asignaba origen `libre` y permitía ver el catálogo; al vencer decía erróneamente "Sesión Expirada". | Bloquea el catálogo y juego; explica que debe escanear el QR en un transporte afiliado. |
| Error en pantalla bloqueada | `initGame` intentaba leer `.style` de `#scratchBanner` y provocaba `TypeError`. | Comprueba la existencia del banner; ejecución defensiva limpia con 0 errores. |
| Recarga en sesión activa | Funcionaba pero recalculaba estado y en algunos casos reiniciaba sesiones. | Mantiene exactamente el mismo código promocional y timestamp de inicio. |
| Intento de minijuego | Usaba fecha calendario (`toDateString()`), permitiendo jugar de nuevo al cambiar de día. | Vinculado al código de sesión: 1 intento por sesión de 24 horas, incluso tras recargar. |
| Tarjetas del minijuego | Mostraba 2 tarjetas ganadoras y 1 perdedora (animando solo 2). | Tres tarjetas iguales revelan la promoción real; las 3 se animan juntas. |
| Mensaje del resultado | Prometía "¡Cupón en Negocio!" con botón "¡Canjear Cupón!". | Comunica honestamente "¡Descubriste una promoción!" con botón "Ver en el catálogo". |
| Juego sin campañas | Mostraba texto confuso sobre promociones inexistentes. | Muestra estado honesto de "Sin promociones disponibles" con icono neutro. |
| Viaje gratis | Anunciado en banner y splash; probabilidad del 1% activa en código. | Desactivado de forma centralizada (`false`), probabilidad 0%, textos reemplazados. |
| Vigencia de campañas | Solo evaluaba días de la semana (`dias`); ignoraba `startDate` y `endDate`. | Evalúa `active`, `startDate`, `endDate` (día completo) y `dias`. |

---

## 9. Ubicación Exacta de la Configuración del Viaje Gratis

- **Archivo:** `C:\Users\Enciso\Desktop\EncaviGO\index.html`
- **Línea aproximada:** 5873
- **Bloque:**
```javascript
const CONFIG_PILOTO = {
    // Control maestro del viaje gratis.
    // Durante el piloto permanece desactivado (false), probabilidad efectiva 0%.
    // Para reactivarlo en el futuro cuando se definan presupuesto y adjudicación:
    // cambiar VIAJE_GRATIS_HABILITADO a true.
    VIAJE_GRATIS_HABILITADO: false,
    SESSION_HOURS: 24,
    SESSION_KEY: 'encavigo_session'
};
```
- **Procedimiento de reactivación futura:** Cambiar `VIAJE_GRATIS_HABILITADO: true` una vez que se definan presupuesto, tope por viaje, conciliación contable y confirmación previa del premio desde backend.

---

## 10. Trabajo Recomendado para el Siguiente Bloque

1. **Bloque de Seguridad y Reglas de Firebase:**
   - Crear y versionar `firestore.rules` en el repositorio.
   - Restringir la administración por UID autorizado en servidor y no solo por `request.auth != null`.
   - Saneamiento estricto de opiniones en `admin.html` mediante `textContent` para erradicar riesgo de XSS.
2. **Bloque de Transaccionalidad en Canjes:**
   - Migrar `quemarCupon` a una transacción Firestore (`runTransaction`) indivisible que valide vigencia, stock y cree el ticket con la tarifa histórica congelada.
3. **Bloque de Validación de QR de Vehículo:**
   - Diseñar la validación de código de chofer contra catálogo activo de vehículos y control de parámetros compartidos.

---

## 11. Salida de `git status --short` (Previa al commit del informe)

```
?? ANTIGRAVITY-HANDOFF.md
```

---

## 12. Confirmación Expresa de Restricciones Cumplidas

- **NO se ejecutó `git push`** ni se modificó ningún repositorio remoto.
- **NO se desplegó el sitio** en GitHub Pages ni ningún otro hosting.
- **NO se alteró Firebase** desde la consola web ni se escribieron datos de prueba en la base de datos de producción.
- **NO se utilizaron comandos destructivos** de Git (`reset --hard`, `clean -fd`, etc.).
- **NO se modificaron carpetas externas** a `C:\Users\Enciso\Desktop\EncaviGO`.
