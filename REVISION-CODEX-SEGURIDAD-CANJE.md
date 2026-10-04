# EncaviGO — Seguridad y canje, avance local

Fecha: 2026-10-03. Rama: `antigravity/fase1-acceso-juego`. Base: `10d6832`.

## Qué cambió

El proceso visible del pasajero conserva su código de sesión y el escaneo en caja. La implementación del canje ahora lee el inventario actualizado y registra el ticket, su referencia privada y el descuento de stock dentro de una sola transacción. La pantalla de éxito aparece después de confirmar toda la operación; un fallo no descuenta el inventario local ni crea un comprobante nuevo para opiniones.

Las reglas locales vinculan ambas escrituras mediante `getAfter`: no autorizan un ticket separado del descuento, un descuento sin ticket, dos tickets por una existencia ni la repetición del mismo código en el mismo negocio. `operaciones_canje` contiene el vínculo privado; el identificador aleatorio `ultima_operacion` en el catálogo público no revela el código del pasajero. El formato histórico de los tickets (`negocio_codigo`) se conserva para respetar los canjes ya registrados.

La administración se limita al UID de la cuenta propietaria que el usuario proporcionó en esta conversación. Una cuenta común no obtiene permisos por iniciar sesión ni puede crear documentos para darse privilegios. No se requiere otra colección de administradores. Las escrituras públicas de premios quedan bloqueadas durante el piloto. Se endurecieron tipos, campos y fechas de opiniones y registros de clics/escaneos.

Las opiniones se presentan mediante nodos y `textContent`. Los textos de la revisión de canjes y nombres del resumen de cobros se escapan antes de insertarse en HTML; sus diccionarios no heredan propiedades de objetos. Esto protege los puntos identificados, sin certificar todos los renderizadores del proyecto.

## Qué se comprobó

- `npm test`: **44/44** pruebas del acceso, sesión, juego y demostración.
- `npm run test:rules`: **10/10** pruebas adicionales con reglas compiladas por el emulador Firestore. Incluyen administración, privacidad, escrituras parciales, duplicados entre promociones del mismo negocio, promoción desactivada, último cupón concurrente, y opiniones maliciosas como texto.
- Dos contextos DOM ejecutan la función real `quemarCupon` del HTML conectada al emulador mediante un adaptador del SDK: solo uno consigue el último cupón. El adaptador convierte referencias/snapshots del SDK modular al formato compat usado por la página.
- El rechazo deliberado de escrituras genera mensajes `PERMISSION_DENIED` en consola: son los resultados esperados de las pruebas negativas.
- No se accedió a datos reales ni se publicaron reglas o archivos. El emulador usa únicamente `demo-encavigo-audit` y localhost; se detiene al terminar.

Se contrastaron los permisos con las reglas que el propietario pegó desde Firebase. Esto no constituye una consulta autenticada independiente de la consola ni prueba que sigan iguales tras cambios posteriores.

## Reproducir

```powershell
npm ci --ignore-scripts --no-audit --no-fund
npm test
npm run test:rules
```

El emulador requiere Java 21. Para esta revisión se descargó una distribución JRE portable de Eclipse Temurin a `%TEMP%/encavigo-emulator-java21`, verificando su SHA-256. `JAVA_HOME` y `PATH` se ajustaron únicamente dentro del proceso de prueba, sin modificar configuración global de Windows. Se añadieron dependencias de desarrollo para Firebase SDK, CLI y pruebas de reglas; no se incorporan al navegador del sitio.

## Antes de aplicar en producción

1. UID recibido y configurado: `ZS4cI7hnMXVPpCaQECFg208TLbL2`. El emulador confirma sus permisos y rechaza los de otras cuentas. Antes de publicar, comprobar que corresponde a la cuenta con la que se usa el panel del proyecto Firebase real.
2. Verificar que las promociones reales tengan `active: true`, stock entero positivo y `caja_id` canónico (mayúsculas, números, guiones o guion bajo). La regla exige que el negocio del ticket coincida exactamente con `caja_id`; los datos antiguos inconsistentes requieren corrección revisada.
3. Preparar una publicación coordinada del cliente y reglas con una pausa controlada de canjes. El cliente anterior no cumple las reglas nuevas; las reglas anteriores tampoco aceptan `ultima_operacion`. No publicar uno solo y asumir compatibilidad.
4. Probar un canje de extremo a extremo en entorno aislado con la cuenta administrativa y promociones reales de prueba antes del despliegue público. Esta revisión no incluye pruebas en teléfono físico, cámara real ni rendimiento a gran escala.

## Lo que sigue pendiente

Este bloque resuelve consistencia de inventario y permisos administrativos locales, no toda la seguridad de lanzamiento. Un atacante todavía puede construir códigos y atribuciones porque no existe una sesión emitida y verificada por servidor. Las 24 horas, vehículo válido, vigencia por fechas/días y presencia física aún requieren validación confiable: no basta con el navegador o GPS enviado por el cliente.

Los contadores públicos aún pueden inflarse repitiendo incrementos. Las opiniones no están vinculadas por servidor a un canje autenticado. La comisión histórica, cobro y liquidación necesitan su propia implementación y prueba. No se autoriza presentar este avance como antifraude completo.

Estado: **cambios locales probados; aplicación en Firebase y lanzamiento pendientes**.
