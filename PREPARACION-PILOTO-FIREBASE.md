# EncaviGO — Comprobación real de Firebase y preparación del piloto

Fecha: 2026-10-03, America/Mexico_City. Revisión de lectura desde la consola de Firebase en Edge.

## Resultado comprobado

Se pudo acceder al proyecto `encavi-go`. También se consultó el HTML público de `https://encavigo.com/`: su configuración apunta al mismo proyecto, por lo que la revisión corresponde a la base que utiliza el sitio publicado.

| Elemento | Resultado observado |
|---|---|
| Plan | Spark |
| Proveedores de Authentication | Correo electrónico/contraseña habilitado; Anónimo no habilitado |
| Cuenta administradora | El UID `ZS4cI7hnMXVPpCaQECFg208TLbL2` existe en este proyecto y coincide con el configurado localmente |
| Colección `codigos` | Consulta directa: «Esta colección no tiene documentos» |
| Colección `campaigns` | Consulta directa: «Esta colección no tiene documentos» |
| Colecciones visibles en la raíz | `interes`, `scan_log`, `stats` |
| Reglas publicadas | El editor muestra reglas antiguas que conceden permisos administrativos con `request.auth != null`; no se han aplicado las reglas locales nuevas |
| Dominios autorizados para redirecciones OAuth | `localhost`, `encavi-go.firebaseapp.com`, `encavi-go.web.app`; `encavigo.com` no aparece |

La lista de dominios se documenta para una futura integración por Google, teléfono o terceros. La propia consola describe ese requisito para redirecciones OAuth; esta revisión no lo presenta como bloqueo demostrado del acceso anónimo.

El propietario confirmó que todavía se está preparando el piloto. Las colecciones vacías no se interpretan como pérdida de datos: no se verificó que hubiera altas previas ni se efectuó restauración alguna.

Evidencia local de la consulta de promociones: `C:/Users/Enciso/.codex/visualizations/2026/10/03/01a0ffbf-de86-7cb3-8f42-fd72c46604b9/firebase-campaigns-vacia.jpg`.

## Qué se hizo y qué permanece pendiente

Esta revisión consultó proveedores, usuarios, dominios, datos y la parte visible del editor de reglas. No se crearon usuarios, colecciones, promociones ni vehículos; no se habilitó Authentication anónimo ni se publicaron reglas o cambios del sitio. No se extrajeron contraseñas ni credenciales de sesión.

Los cambios de código y reglas siguen siendo locales. Su validación en el emulador está documentada en `REVISION-CODEX-SEGURIDAD-CANJE.md` y `REVISION-CODEX-SESIONES-SERVIDOR.md`. No se repitieron pruebas de código en esta revisión de consola porque no cambió su implementación.

## Orden concreto antes de operar

1. Reunir las altas reales: código de QR de cada vehículo y asociación con el conductor; promociones aprobadas por cada negocio, caja de canje, condiciones, stock, fechas, días, ubicación y tarifa acordada. No cargar los ejemplos DEMO como acuerdos reales.
2. Probar el inicio de sesión anónimo con el cliente y las reglas nuevas en un entorno aislado. Las pruebas actuales validan identidades simuladas del emulador de reglas; aún falta esta comprobación del proveedor de Authentication.
3. Preparar una publicación controlada, incluyendo respaldo de las reglas activas y archivos publicados. Confirmar la cuenta administradora ya verificada y los datos del piloto.
4. Aplicar las reglas que restringen la administración al UID del propietario **antes de habilitar acceso anónimo**. Las reglas antiguas tratan cualquier cuenta autenticada como administradora; activar Anónimo con ellas ampliaría esos permisos a los pasajeros.
5. Con canjes pausados durante la actualización, habilitar Anónimo y publicar el cliente completo compatible, incluyendo `sesiones-servidor.js` y `admin-seguridad.js`. Confirmar las altas reales y probar todo el recorrido antes de abrir el piloto.

La publicación del sitio, el cambio de reglas y la configuración de Authentication son acciones pendientes; esta revisión no las autoriza ni las ejecuta. No se cambió facturación ni se añadió Cloud Functions.

## Trabajo local que puede continuar sin altas reales

El siguiente bloque funcional recomendado es el registro histórico de comisiones: conservar dentro de cada ticket la tarifa aprobada, separar pendiente/cobrado/pagado/adelantado y preparar liquidación semanal. Hoy el panel calcula importes a partir de tarifas actuales de campañas; eso no certifica un historial contable estable. Antes de operar hay que comprobar este bloque y acordar los importes, sin asumir como tarifa válida los valores predeterminados del formulario.
