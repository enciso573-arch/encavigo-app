# EncaviGO — Sesiones y vehículos validados por Firestore

Fecha: 2026-10-03. Rama: `antigravity/fase1-acceso-juego`. Base: `c05f61d`.

## Resultado local

Se integró `sesiones-servidor.js` con el arranque de la página y el juego. La sesión de producción se consulta en Firestore usando una identidad de Firebase Authentication. No se confía en `localStorage` para conceder acceso: editar sus datos no crea una sesión autorizada ni renueva sus 24 horas.

El visitante utiliza autenticación anónima de Firebase, sin formulario de registro. No se añadieron Cloud Functions ni se cambió facturación. Las validaciones se ejecutan en las reglas de Firestore mediante `request.auth` y `request.time`, usando la infraestructura existente.

## Comportamiento

- `sesiones/{uid}` conserva código, vehículo, fecha de inicio confirmada por servidor e intento de juego. Solo su propietario puede consultar el documento; no puede listar sesiones ni modificarlas arbitrariamente.
- Una nueva sesión requiere un registro `codigos/{vehiculo}` con `tipo: vehiculo`, `estado: activo`, sin documento en `bajas`. Las reglas consultan el registro privado sin exponer nombres ni teléfonos al pasajero.
- Reabrir la página o reescanear durante la sesión mantiene código, fecha, vehículo e intento. Cuando vence, hace falta un QR válido para iniciar otra sesión. La renovación también se comprueba con tiempo de servidor.
- `reservas_codigos/{code}` confirma la reserva del código dentro de la misma transacción. Una reserva existente no se puede sobrescribir. El navegador propone un código aleatorio con Web Crypto; el servidor autoriza su formato y reserva, no es un código emitido por una Cloud Function.
- El código nuevo tiene formato `ENC-` más ocho caracteres hexadecimales. Se ajustó su tamaño de texto para caber en el modal. El resto del proceso de activación y escaneo en caja se conserva.
- El primer volteo de tarjeta espera que Firestore confirme el consumo del intento. Dos pestañas de la misma identidad no pueden consumirlo dos veces ni ponerlo de nuevo en falso.
- El canje exige una sesión de esa identidad, código y vehículo coincidentes, dentro de 24 horas, con vehículo aún vigente. La operación atómica de ticket/inventario del bloque anterior se conserva.
- La consulta inicial exige datos del servidor. Si falla la conexión o autorización, no se recupera una sesión desde una copia local. DEMO conserva sus datos de ejemplo y no utiliza este servicio.

## Validación

`npm test`: **44/44** pruebas de regresión. Sus dobles de verificación son explícitos y no constituyen pruebas de permisos del servidor.

`npm run test:rules`: **22/22** pruebas en Firestore Emulator. Además de las 10 del bloque anterior, comprueban sesiones nuevas, recuperación, reescaneo, vehículos inválidos, manipulación de campos, caducidad, renovación, intento entre pestañas, colisiones, canjes sin identidad, código ajeno, reloj de cliente alterado y verificación sin conexión.

Los recorridos DOM del HTML usan el servicio real contra el emulador para comprobar que una sesión local inventada se ignora y que la tarjeta espera autorización. El SDK modular de pruebas se adapta al formato compat de la página. Se simula la identidad autenticada mediante `rules-unit-testing`; no se certifica todavía el inicio de sesión anónimo en navegador conectado al proyecto real.

El emulador usa `demo-encavigo-audit`, localhost y reglas locales. Sus datos y los usuarios de prueba no pertenecen a producción. Termina y se detiene al cerrar la suite.

## Aplicación pendiente

1. Comprobar y habilitar el proveedor **Anónimo** en Firebase Authentication. No se activó desde esta conversación. Para este diseño no hace falta desplegar Cloud Functions; el plan Spark/Blaze no fue verificado ni modificado.
2. Revisar que todos los vehículos reales estén dados de alta con el esquema indicado. Los vehículos antiguos que solo aparecen en métricas no quedan automáticamente autorizados.
3. Publicar de forma coordinada el cliente, `sesiones-servidor.js` y las reglas. Las sesiones antiguas solo guardadas en el navegador no se importan como confiables: tras la migración, los pasajeros necesitarán un nuevo escaneo. Los tickets históricos mantienen su formato y siguen en la base.
4. Comprobar inicio de sesión anónimo y ciclo completo en un navegador y teléfono reales antes del lanzamiento. Este bloque no incluye publicación, pruebas de cámara ni pruebas de carga.

## Límites reales

Una identidad anónima representa una instalación/perfil de navegador, no una persona verificada. Borrar todas sus credenciales, usar incógnito u otro dispositivo puede obtener otra identidad. No se promete un límite infalible de una persona por día.

El QR físico estático y su URL pueden copiarse. Se comprueba que el código pertenece a un vehículo registrado, pero no se prueba físicamente que el cliente viaje dentro de él. Esa comprobación requeriría un mecanismo adicional de viaje o confirmación del chofer. La autenticación anónima tiene cuotas de Firebase; no sustituye controles contra abuso masivo.

La vigencia de promociones por fechas/días y el GPS siguen comprobándose en el cliente. Los contadores públicos y opiniones necesitan protección adicional; la liquidación de comisiones y tarifa histórica siguen pendientes. Este cambio no certifica seguridad total ni cumplimiento del negocio.

Referencias de diseño: [autenticación anónima](https://firebase.google.com/docs/auth/web/anonymous-auth) y [condiciones de reglas](https://firebase.google.com/docs/firestore/security/rules-conditions).

Estado: **implementación y reglas locales comprobadas; activación en Firebase y publicación pendientes**.

Revisión posterior de la consola: ver `PREPARACION-PILOTO-FIREBASE.md`. Se confirmó Spark, el UID administrador y la ausencia de altas de vehículos/promociones. El acceso anónimo sigue deshabilitado. Su activación debe ocurrir después de restringir los permisos administrativos, no con las reglas antiguas.
