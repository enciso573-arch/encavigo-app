# Preparación de activación — 2026-10-04

## Verificación nueva

- `npm run test:auth` ejecuta los SDK reales de Authentication y Firestore contra emuladores del proyecto ficticio `demo-encavigo-audit`. No conecta al proyecto de producción.
- Se comprobó inicio de sesión anónimo, entrada sin QR bloqueada, apertura con vehículo dado de alta, restricciones administrativas, conservación de sesión e intento único de juego.
- También se comprobó la limitación conocida: cerrar la identidad anónima y crear otra permite obtener una sesión distinta. No hay garantía de una identidad por persona.
- Las 44 pruebas funcionales, las verificaciones del panel de comisiones y las 28 pruebas de reglas quedaron aprobadas en el bloque anterior. Esta preparación añade cuatro comprobaciones del proveedor anónimo.
- GitHub conserva `main` en `0b7a4dad0b34ef7cead5cca95ea85bbd0404b8b0`; no se ha actualizado esa rama. La simulación `git push --dry-run` confirmó acceso de escritura.
- Existe el workflow automático `pages-build-deployment`; el endpoint de configuración de Pages necesita autenticación para consultar la rama exacta que publica.

## Respaldo

Se descargaron las versiones públicas de `index.html`, `admin.html`, `negocios/index.html`, `dashboard.html` y `registro.html`, con tamaños y SHA-256 en `manifest.json`, a:

`C:/Users/Enciso/AppData/Local/EncaviGO/respaldos/pre-piloto-2026-10-04`

Es un respaldo del HTML publicado, no una exportación de la base de datos ni de sus reglas activas. Antes de sustituir las reglas debe respaldarse el texto vigente autenticado en Firebase; el texto pegado anteriormente por el propietario sirve como referencia, no como comprobación actual.

## Secuencia pendiente de publicación

1. Conectar la cuenta del propietario a Firebase. La herramienta CLI estaba sin cuentas autorizadas y la sesión Edge anterior no estaba disponible en este turno.
2. Consultar y respaldar las reglas activas; comprobar el proyecto `encavi-go` y el UID propietario.
3. Publicar las reglas restringidas antes de habilitar el proveedor anónimo. La configuración de despliegue `firebase.deploy.json` contiene únicamente reglas, sin Hosting, Functions ni cambios de facturación. Usar siempre el proyecto explícito `encavi-go`.
4. Habilitar Authentication anónima y publicar el cliente compatible completo en la rama que realmente usa GitHub Pages. Verificar finalización del workflow y archivos servidos.
5. Dar de alta solo vehículos y promociones aprobados por el propietario. Todavía no se suministraron códigos, conductores ni acuerdos reales del piloto; no copiar las campañas DEMO.
6. Comprobar el recorrido en producción antes de distribuir QR: acceso directo, QR válido, 24 horas, juego, canje, revisión, cobro y pago registrado. Los canjes de prueba deben planearse explícitamente: el historial financiero nuevo es inmutable desde el panel.

## Datos que faltan para abrir el piloto

- Primer vehículo: código QR elegido, conductor asociado y estado activo.
- Primer negocio: identificador de caja y QR de caja, promoción aprobada, condiciones, ubicación, stock, tarifa acordada, vigencia y días.
- El acceso de la consola y la actualización de reglas/Authentication/sitio aún requieren ejecución y verificación. Estas instrucciones no certifican que el piloto esté publicado.
