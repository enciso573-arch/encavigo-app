# EncaviGO: operación preparada para el primer piloto

Fecha: 5 de octubre de 2026, Ciudad de México. Carpeta única de trabajo: `C:/Users/Enciso/Desktop/EncaviGO`.

La plataforma permite preparar las altas antes de tener choferes o negocios. Las listas vacías son un estado esperado. La guía y los ejemplos del panel no crean datos en Firebase. Para ensayar el recorrido del pasajero usa `https://encavigo.com/?demo=1`.

## Empezar desde el panel

1. Entra en `https://encavigo.com/admin.html` con la cuenta administradora existente. El ingreso por Google a la CLI no sustituye el correo y contraseña del panel. Solo el UID propietario tiene permisos administrativos.
2. En **Códigos QR**, registra el acrílico del vehículo: base, nombre real del chofer, municipio de operación y, si corresponde, teléfono y unidad. Genera el código y abre **Acrílico** para imprimirlo. **Para negocios** imprime un QR de información comercial que identifica al referido; no desbloquea la sesión del pasajero ni promete una bonificación adicional.
3. En **Nuevo Negocio**, registra la promoción autorizada: nombre, condiciones, imagen HTTPS opcional, ubicación, inventario acordado, fechas, días y tarifa. El inventario se captura expresamente; no se asignan 50 canjes automáticamente. Se puede dejar pausada. La imagen vacía usa el logotipo.
4. Para **Plan Local**, genera un código de caja y úsalo en todas las promociones del mismo negocio. Imprime ese acrílico desde **Códigos QR**. El canje requiere sesión QR vigente, vehículo válido, caja activa y una promoción disponible.
5. Para **Campaña Municipal**, elige el municipio y enlace HTTPS aprobado. Inicio y fin son obligatorios, con máximo 30 días incluyendo ambos. Aparece en vehículos registrados para ese municipio. El botón abre contacto; no descuenta stock ni genera comisión.
6. En **Mensualidades**, registra el acuerdo de publicidad del negocio. Cortesía significa publicidad de $0. La tarifa por canje se acuerda aparte: un espacio gratuito no pone automáticamente la comisión en cero. El cobro de publicidad se registra después de recibir el dinero, por negocio y mes, con referencia. Son cobros completos; esta versión no registra abonos parciales.
7. En **Comisiones y pagos**, revisa canjes, aprueba o rechaza los que necesitan revisión y registra cobros y pagos efectivamente realizados. Se conserva el importe histórico del canje. El adelanto al chofer queda pendiente de recuperar del negocio. Los botones registran hechos; no transfieren dinero ni emiten facturas.
8. En **Reporte por negocio**, elige negocio y mes. Imprime a PDF o descarga CSV. Se usan interacciones, canjes, comisiones aprobadas, cobros y opiniones reales, sin valores de muestra ni impresiones inventadas. Los comercios no tienen cuentas independientes en este piloto: administración entrega el reporte descargado.
9. **Analíticas** muestra actividad diaria registrada. **Flotilla** utiliza las sesiones y eventos registrados, con los titulares privados de cada QR. **Marcar atendida** registra la atención de una opinión por administración.

## Herramientas para acordar promociones

La calculadora permite capturar precio, costo directo, empaque/complemento, comisión, descuento, contribución mínima y límite de canjes aprobado. Permite explorar descuentos o un complemento informado por el negocio. La ficha privada es obligatoria antes de activar una promoción con canje. Al editar o copiar, se revisa el cálculo y se confirma el acuerdo de nuevo en el formulario. No incluye gastos fijos, impuestos ni mensualidad en la contribución. El procedimiento completo está en [PROCESO-PROMOCIONES.md](PROCESO-PROMOCIONES.md).

La baraja coloca hasta diez promociones cercanas primero cuando hay ubicación y reserva hasta cinco lugares para rotación. Sin ubicación mezcla hasta quince. No es todavía un recomendador que aprenda rentabilidad ni una garantía de visitas.

La búsqueda filtra nombre, descripción y etiqueta sin distinguir acentos. La ubicación se solicita solo al pulsar el control correspondiente; sin ella no se inventa cercanía. Las alertas requieren permiso del navegador y GPS preciso mientras la página permanece abierta. La demo no solicita ubicación ni activa notificaciones reales. Por indicación del propietario, la apariencia original anterior a las propuestas visuales se conserva. Los controles nuevos de búsqueda y ubicación utilizan sus mismos estilos; no se cambia la identidad de la página.


## Verificación realizada

- `npm run test:recorrido`: 26 comprobaciones del recorrido unido de panel, pasajero y reporte, con Authentication y Firestore locales y las reglas reales del repositorio. Incluye altas desde formularios, QR, canje, opinión, adelanto/cobro y mensualidades. Informe y límites en `qa/RECORRIDO-COMPLETO.md`; no utiliza cámara física ni datos de producción.

- `npm test`: 44 casos de acceso, sesión, demo y recorrido; 2 de comisiones; 6 de operación del panel, validación, contacto y reporte; 6 recorridos de búsqueda, ubicación, alertas y opinión; 6 casos de la calculadora.
- `npm run test:rules`: 37 casos con Firestore Emulator. Incluyen stock atómico, duplicados, permisos, caja y vehículo dados de baja, fechas/días, importes históricos, publicidad, opiniones ligadas al canje y logs ligados a sesión.
- `npm run test:auth`: 4 casos con el proveedor anónimo real del SDK contra emuladores locales.
- `node scripts/verificar-sitio.cjs`: 21 scripts válidos, 35 referencias locales existentes, sin IDs duplicados y vistas dentro del panel.
- Revisión del formulario real en navegador, con Firebase sustituido por un doble **solo en el servidor local de QA**. Escritorio y móvil de 390 × 844; sin desbordamiento horizontal en el móvil revisado. Es una prueba visual, no una sesión propietaria en producción.
- No se crean negocios, choferes, tickets ni pagos ficticios en Firebase real. La guía de la fonda es texto de ayuda.

## Límites comprobados

El viaje gratis sigue desactivado tanto en interfaz como en reglas durante el piloto. Su activación financiada requiere otro cambio coordinado; recibir una mensualidad no lo enciende automáticamente.

Un QR estático se puede copiar. Firebase Anonymous Auth identifica una instalación/sesión, no una persona: crear otra identidad permite otra sesión. No se presenta esto como protección absoluta de presencia física ni como una cuenta por persona. Se sigue requiriendo supervisión de los canjes y revisión de ubicación cuando falta o es imprecisa.

Las listas de reportes leen el historial completo; para este primer piloto son funcionales. Un volumen grande requiere paginación y consultas agregadas. El aviso describe el envío de ubicación del canje a Firebase, pero este trabajo no certifica cumplimiento legal del negocio ni sustituye la identificación formal de su responsable.

Las pruebas de software no sustituyen el primer uso de un QR impreso con cámara real ni la comprobación humana del dinero recibido/entregado. Esas verificaciones se realizan al comenzar la operación; no hace falta inventar altas hoy para preparar el sistema.

## Publicación y recuperación

La publicación debe incluir juntos el cliente y `firestore.rules`. El cliente ya no incrementa contadores públicos: las métricas provienen de logs de sesión y campaña. El propietario conserva sus permisos. No se habilita Blaze ni se cambian precios de acuerdos reales.

Antes de publicar se guarda un respaldo externo del código público y reglas vigentes en `C:/Users/Enciso/AppData/Local/EncaviGO/respaldos/operacion-2026-10-04`. Los canjes y movimientos financieros son inmutables; la opción antigua de borrar toda la operación fue retirada.

Para QA visual aislada: `node scripts/preview-operacion.cjs` y abrir `http://127.0.0.1:9016/__qa__/admin.html`. No conecta con Firebase, bloquea escrituras y se sirve únicamente en localhost. Nunca usarlo como acceso administrativo real.
