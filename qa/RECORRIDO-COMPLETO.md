# Recorrido completo de EncaviGO sin participantes reales

Verificación del 5 de octubre de 2026. Se corrigió un fallo observado durante el recorrido: el código de caja aceptaba un texto más largo que solo contenía el código esperado. Ahora exige coincidencia completa, tanto en lectura como en captura manual, conservando la normalización de mayúsculas y espacios.

## Resultado y alcance

26 comprobaciones aprobadas en `npm run test:recorrido`. Los resultados individuales y la fecha exacta están en [recorrido-resultado.json](recorrido-resultado.json). La suite habitual `npm test` también aprobó sus 64 casos, incluidos los seis casos de cálculo de promociones.

La prueba ejecuta el HTML y los controladores actuales de `admin.html`, `index.html` y `dashboard.html` en JSDOM, conectados al SDK real instalado de Firebase y a Authentication y Firestore Emulator. Usa las reglas del repositorio. No sustituye las escrituras por promesas de éxito ni activa una puerta trasera en las páginas públicas.

Authentication usa una cuenta propietaria ficticia del emulador con el UID autorizado, creada solo para la prueba. Se comprueba el ingreso desde el formulario por correo y contraseña de prueba, además del inicio anónimo de pasajeros. Esto no verifica la contraseña de la cuenta del propietario en producción.

El proyecto ficticio es `demo-encavigo-audit`, Firestore escucha en `127.0.0.1:8787` y Authentication en `127.0.0.1:9098`. El script exige esos dos destinos antes de arrancar. Ningún chofer, negocio, ticket, opinión ni pago ficticio se escribe en `encavi-go`. Los emuladores se detienen al acabar.

## Recorrido comprobado

1. Inicio de sesión del propietario mediante el panel.
2. Alta de un chofer desde el formulario, con municipio y QR privado; documento público de flotilla creado.
3. Alta de caja y promoción desde Nuevo Negocio, con tres cupones y tarifa inicial de $25; publicar sin cálculo aprobado queda bloqueado.
4. Contenido de impresión: URL correcta en el QR del vehículo y código correcto en el de caja.
5. Entrada sin QR bloqueada, sin sesión promocional.
6. Entrada con el QR generado: código exclusivo confirmado por Firebase y catálogo con la promoción creada.
7. Juego: abrir y cerrar no consume; voltear la primera tarjeta consume una sola vez. Viaje gratis desactivado.
8. Recarga y reescaneo: conservan código, vehículo, hora inicial y juego; no duplican el escaneo.
9. Caja incorrecta rechazada por captura manual y resultado del lector; no basta contener el código válido dentro de otro texto.
10. Canje válido: éxito solo después de confirmación, un ticket, inventario de tres a dos y comisión histórica de $25.
11. Opinión ligada al canje, guardada para administración.
12. Repetir el canje no crea otro ticket ni descuenta inventario ni muestra éxito.
13. Adelanto al chofer desde el panel, posterior cobro del negocio y saldo de recuperación correcto; pago duplicado rechazado.
14. Acuerdo gratuito, cambio a mensualidad pagada de $1,000 y cobro mensual sin duplicados. Los importes son ficticios, no acuerdos comerciales reales.
15. Reporte del mismo negocio con interacción, canje, opinión y cobro coincidentes.
16. Edición de tarifa a $45 sin alterar el canje histórico de $25.
17. Dos pasajeros simultáneos con una unidad: un éxito, un rechazo y stock cero.
18. Canje sin ubicación: queda en revisión; no se puede liquidar antes de aprobarlo desde el panel.
19. Promoción agotada y promoción pausada: no generan tickets.
20. Caja dada de baja: el servidor rechaza el canje aun con el código correcto.
21. Sesión vencida: canje rechazado y reapertura bloqueada; nuevo QR inicia otra sesión. Se simula la espera cambiando solo la fecha inicial en el emulador, sin modificar las reglas.
22. Vehículo dado de baja: no se puede reabrir la sesión.
23. Pasajero sin acceso al registro privado, mensualidades, edición de stock ni panel propietario.
24. Ausencia de errores de JavaScript en las páginas ejercitadas.

También se comprueba que la ficha de costos queda privada, que editar o copiar no hereda aprobación y que cambiar un costo después de calcular invalida la confirmación y bloquea el guardado publicado.

## Lo que esta prueba no certifica

- No usa una cámara física ni imprime un QR. Se verifica el contenido que recibe el generador y se entregan resultados de lectura al controlador real. La cámara, sus permisos y la legibilidad de impresión necesitan un teléfono real.
- GPS y mapa son sustituidos expresamente para reproducir ubicación válida o falta de permiso. No se comprueba exactitud del GPS de un teléfono ni servicios cartográficos externos.
- JSDOM no sustituye un navegador móvil para diseño, cámara, notificaciones o compatibilidad con todos los dispositivos. Los recursos externos no se descargan en esta prueba.
- No se comprueba presencia física en transporte: los QR estáticos pueden copiarse.
- El viaje gratis financiado y un recomendador basado en desempeño no están implementados por esta suite. Sus límites siguen descritos en `OPERACION-LISTA.md`.
- No se recibe ni se transfiere dinero; se verifica el registro y cálculo de movimientos ficticios.

## Repetir la verificación

Con Node y Java 21 disponibles, ejecutar `npm run test:recorrido` desde la carpeta del proyecto. La configuración `firebase.emulator.json` arranca y detiene ambos emuladores. El script no requiere iniciar sesión en Firebase de producción ni activar Blaze.

El informe JSON se sobrescribe con el resultado de cada ejecución, incluidos fallos. Si una comprobación falla, el comando termina con código de error.
