# Comisiones y pagos — preparación local del piloto

Tarifas contrastadas con https://encavigo.com/negocios: $25, $45 y $80 MXN, fijadas por acuerdo según el rango del ticket del negocio. La comisión completa corresponde al chofer; las mensualidades de publicidad son independientes. El panel conserva $0 para cortesías. El plan de campaña municipal publicado no incluye canjes ni comisiones; este bloque no crea campañas ni contratos de ese modelo.

## Cambios

- El canje guarda `comision_centavos`, `moneda` y `negocio_nombre` desde la promoción leída dentro de la transacción. Las reglas verifican la coincidencia con la tarifa del servidor. Editar o borrar la promoción no cambia lo ya generado.
- `tickets` queda inmutable para pasajeros y administración. Los movimientos están separados en `movimientos_comision`, también inmutables, con referencia, autor y fecha del servidor.
- Un identificador fijo por canje y operación impide registrar dos veces el cobro, pago o decisión de revisión. La comisión completa se paga al chofer; no se supone un porcentaje para EncaviGO.
- La administración puede aprobar o rechazar canjes marcados antes de registrar movimientos. Los canjes antiguos sin importe histórico quedan visibles pero no se liquidan con una tarifa inventada.
- Cobro del negocio y pago al chofer son independientes. Si se paga antes de cobrar, el resumen muestra el adelanto pendiente de recuperar.
- Consulta semanal (lunes a domingo), mensual o de todo el historial. La semana es una convención de consulta, no un día contractual de pago. Los totales reflejan el estado actual de los canjes del periodo seleccionado, no el flujo de caja ocurrido durante esa semana.
- Negocios se agrupan por identificador de caja; tarifas distintas se suman por canje. Los nombres iguales no mezclan cuentas. Importes se calculan en centavos enteros.
- La limpieza administrativa queda bloqueada si existe algún canje para preservar la relación con campañas y choferes.
- Los registros del panel se muestran con `textContent`, incluidas referencias y nombres.

## Verificación

- Regresión: 44 casos de acceso, sesión, juego, demo y canje.
- Comisiones: agregación de tarifas mixtas y negocios homónimos, cero comisión, importes históricos ausentes, límites de semana y ejecución del panel real en JSDOM con Firebase sustituido.
- Seguridad: 28 casos en Firestore Emulator, incluyendo tarifa manipulada, historial inmutable, revisión obligatoria, pagos concurrentes, cobro posterior de adelantos, cortesías y canjes rechazados.
- Sintaxis de scripts HTML/JS y `git diff --check`.

## Alcance y publicación pendiente

Esto registra cobros y pagos confirmados por la administradora; no procesa transferencias bancarias ni prueba por sí mismo que un pago ocurrió. Los movimientos son completos por canje, sin pagos parciales, cancelaciones posteriores ni corrección contable de movimientos erróneos. Esos flujos requieren un bloque adicional antes de necesitarlos en operación. La lectura completa de tickets y movimientos está pensada para el primer piloto; al crecer hará falta paginación o reportes agregados.

No hubo push, despliegue ni escrituras de prueba en Firebase real. El sitio publicado todavía usa el código y reglas anteriores. Antes del piloto: revisar y publicar las reglas restringidas junto al cliente, habilitar Authentication anónima después de restringir administración, dar de alta únicamente vehículos y promociones aprobadas y ejecutar una prueba completa controlada. Firebase está en Spark; este bloque no requiere Cloud Functions.

La identidad anónima y un QR estático no demuestran que una persona subió físicamente al vehículo. Se conservan las limitaciones de presencia, nuevas identidades y telemetría documentadas en el informe de sesiones.
