# EncaviGO — revisión previa al lanzamiento

Fecha: 2 de octubre de 2026, zona horaria de Ciudad de México.

Las decisiones confirmadas de producto y el orden de implementación se encuentran en `ESPECIFICACION-MAESTRA.md`. Esta auditoría documenta el estado técnico observado; la especificación define el comportamiento deseado.

## Dictamen

Existe una base funcional parcial: sitio comercial, captación por WhatsApp, aplicación de promociones, panel administrativo y conexión a Firestore. No recomiendo lanzar cobros por canjes ni premios reales antes de resolver los bloqueos de seguridad, integridad de inventario y trazabilidad. La presentación visual no es el principal obstáculo.

## Alcance y evidencia

- Navegación del sitio publicado: portada, enlace de demostración, página de negocios y formulario de registro.
- Inspección visual de negocios en escritorio y viewport móvil solicitado de 390 × 844; ancho de contenido observado de 375 px, sin desbordamiento horizontal en esa comprobación.
- HTTP 200 en portada, negocios, privacidad y admin. Cabecera Server: GitHub.com.
- Esos cuatro HTML publicados coinciden con los locales después de normalizar saltos de línea.
- Inspección de código y reglas locales de Firestore. NO se verificaron las reglas desplegadas, usuarios, índices, facturación, App Check, respaldos ni permisos de consola.
- Comprobación sintáctica de 15 scripts clásicos embebidos en 18 HTML: sin errores de sintaxis. Esto no prueba correcto funcionamiento. Revisión estática de rutas: referencia inexistente a img/biz-01.jpg.
- No se enviaron formularios, canjearon cupones, jugaron premios, iniciaron sesiones administrativas ni hicieron cambios de configuración o despliegue. La navegación normal puede generar la analítica automática del propio sitio, incluido el código DEMO.
- Primera apertura de portada: Sesión Expirada y TypeError en initGame al acceder a style de un elemento inexistente. No se comprobó que el navegador tuviera almacenamiento vacío; por tanto, NO demuestra que todos los usuarios nuevos vean la expiración.
- El enlace público Ver la app abrió la bienvenida y después mostró ausencia de negocios/promociones; hubo FirebaseError: Missing or insufficient permissions. No se atribuye ese error de consola a una operación específica sin traza adicional.

## Bloqueos de lanzamiento

### 1. Autenticación equivale a administración

Evidencia: firestore.rules:21,39,89,114,134,163 y reglas equivalentes; admin.html:472.

Las reglas locales autorizan acciones sensibles a cualquier request.auth != null. El panel también comprueba solamente que exista un usuario. No distingue al propietario de otra cuenta autenticada. La posibilidad de alta de nuevas cuentas y las reglas efectivamente publicadas no fueron verificadas.

Corrección: autorización administrativa explícita por UID o roles controlados desde servidor; privilegio mínimo por colección; pruebas de denegación para usuarios ajenos. No basta con ocultar el enlace de admin.

### 2. Opiniones públicas renderizadas como HTML en el panel

Evidencia: firestore.rules:124 permite crear opiniones sin autenticación; admin.html:1128 inserta negocio y comentario directamente en innerHTML.

Existe una ruta de inyección de HTML y potencial XSS almacenado al abrir opiniones en una sesión administrativa. La longitud máxima del comentario no sanea HTML. No se introdujo ningún contenido de prueba en producción.

Corrección: crear nodos y asignar texto con textContent; validar tipos, tamaños y asociación de la opinión a un canje legítimo. Revisar también otras interpolaciones de datos de Firestore.

### 3. Canje e inventario no son una operación indivisible

Evidencia: index.html:6922 crea ticket; index.html:6945 descuenta stock después. El error del segundo paso se registra, pero se muestra éxito. firestore.rules:89 comprueba stock existente sin obligar a descontarlo junto al ticket.

Dos clientes pueden crear tickets cuando queda una sola unidad antes de que se descuente. También puede registrarse un ticket y fallar la reducción de inventario. Se pierde la garantía de no superar el stock.

Corrección: operación transaccional autorizada que valide y registre canje, descuente stock y deje trazabilidad conjuntamente. Probar concurrencia, reintentos, desconexión y duplicados.

### 4. El teléfono decide demasiadas condiciones del cobro

Evidencia: index.html:5870 crea sesión y código local; acepta el parámetro chofer; index.html:5994 verifica lista de bajas, pero no exige que el vehículo esté dado de alta. Las reglas de tickets no validan una sesión emitida por servidor, vencimiento, asociación del negocio a la campaña ni veracidad de la ubicación o del campo revisar.

El código del navegador puede alterarse. Un QR compartido, datos locales modificados o solicitudes directas pueden eludir restricciones que solo se aplican en la interfaz. Un contador que permite sumar uno repetidamente no impide inflarlo.

Corrección: emisión y validación confiable de sesiones/cupones, vehículos registrados y activos, vencimiento del lado servidor, idempotencia, controles de abuso y validación del comercio. App Check puede complementar estas medidas, no sustituirlas. Separar DEMO de datos operativos.

### 5. Premio mostrado aunque no se confirme su registro

Evidencia: index.html:6529 calcula el premio con Math.random en el cliente; index.html:6541 intenta registrarlo, ignora el fallo y conserva la secuencia ganadora. firestore.rules:209 no vincula el ID del documento al vehículo y fecha.

Puede anunciarse un viaje gratis sin un registro válido; varios teléfonos pueden competir por el mismo premio. No se probó el juego en producción.

Corrección: adjudicación y confirmación del premio en servidor, límite diario verificable, hora/zona definida, comprobante que pueda validar el conductor y condiciones operativas del premio. Mantenerlo fuera del piloto si no está listo.

### 6. Aviso de privacidad incompatible con el código

Evidencia: privacidad.html:99 y 104 dicen que el GPS nunca se almacena y nunca sale del dispositivo. index.html:6910 guarda latitud, longitud, precisión y distancia en el ticket cuando hay ubicación.

Corrección: decidir qué datos son indispensables y durante cuánto tiempo conservarlos; alinear implementación, explicación al usuario, acceso y aviso. Este hallazgo es una contradicción técnica comprobable; no es una certificación jurídica.

### 7. Los importes históricos cambian al editar campañas

Evidencia: admin.html:1060 obtiene la tarifa actual de campaigns; el ticket no conserva tarifa aplicada. Una promoción eliminada usa una tarifa de respaldo de 25. Agrupación por nombre y multiplicación de cantidad por una sola tarifa en admin.html:1097-1098.

Editar una tarifa puede alterar los totales de meses anteriores; negocios con nombres repetidos o tarifas distintas pueden agruparse incorrectamente.

Corrección: guardar en cada canje validado el negocio estable, tarifa aplicada, moneda y versión de condiciones. Añadir estado de aprobación, cobro, pago y conciliación, con historial. Evitar borrar datos base de movimientos históricos.

### 8. Hosting comercial

Se confirmó que las respuestas públicas provienen de GitHub.com. GitHub Pages declara restricciones para usarlo como hosting de negocios en línea y servicios comerciales. Antes del lanzamiento, revisar la adecuación del alojamiento de esta aplicación.

Recomendación: conservar GitHub para código y control de versiones, y considerar Firebase Hosting para el sitio, con un servicio de backend para operaciones sensibles. La migración de hosting por sí sola no resuelve los errores de autorización.

## Funcionalidad, producto y medición

1. **Entrada y recuperación de sesión.** La expiración reemplaza todo el body; initGame todavía intenta acceder al banner eliminado. Ofrecer explicación y navegación útil sin error de consola. Distinguir visita libre de cupón vencido.
2. **Demostración comercial vacía.** Ver la app llega a un estado sin promociones. Preparar una demostración claramente identificada, con promociones de ejemplo y sin canjes, comisiones o premios reales. No inferir que toda la base está vacía: solo se observó el resultado del recorrido probado.
3. **Escrituras incompatibles con reglas locales.** index.html:6478 actualiza scans y lastActive de choferes; la regla pública permite solo clicks. La creación pública del chofer tampoco está permitida. Esto necesita una solución segura, no abrir toda la colección. Hay un error real de permisos, aunque no se confirmó que corresponda a esta escritura.
4. **Fechas de campañas sin aplicar.** El panel guarda startDate/endDate; la carga de la app filtra active y días de la semana, sin aplicar esas fechas. Las reglas de canje tampoco las exigen. Una campaña activa puede seguir disponible fuera de su periodo contratado.
5. **Planes que exceden la implementación.** buildSmartDeck, index.html:6354, muestra todas las campañas si hay hasta 15. Con más, combina 10 cercanas y 5 aleatorias; no impone radio de 3 km ni separación municipal. El objeto guardado por admin.html:974 no contiene el modelo completo de plan/municipio/cupos. Implementar esos compromisos o ajustar lo ofrecido y definir la gestión manual verificable de cupos.
6. **Contador de flota.** Negocios dice activos hoy, pero negocios/index.html:1118 cuenta los últimos 30 días. Solo pide una página de hasta 300 documentos y no procesa paginación. En la visita se ocultó la cifra por ausencia de un resultado usable. Un escaneo tampoco acredita por sí mismo circulación del vehículo durante el día.
7. **Dashboard de demostración.** dashboard.html:416 contiene BIZ_DATA fijo; parte de la gráfica usa Math.random. No debe entregarse como reporte real. Integrar datos verificables o identificarlo claramente como maqueta.
8. **Controles sin comportamiento visible.** Cambiar zona no produjo un selector durante la prueba; el código del botón no mostró manejador asociado en la búsqueda. Buscar promociones también necesita revisión funcional. Implementar o retirar controles inactivos.
9. **Premisas de atribución.** Un canje no prueba automáticamente cliente nuevo ni venta incremental. Un identificador local por navegador tampoco equivale a una persona única. Definir las métricas con precisión al reportarlas.
10. **Captación manual.** Registro abre WhatsApp con un mensaje; no es un alta automática de negocio ni confirma envío, recepción o seguimiento. Puede servir para un piloto si se define quién responde, horarios y registro de prospectos.
11. **Rendimiento y mantenimiento.** index.html tiene aproximadamente 182 KB locales y concentra estilos y lógica en más de 7,000 líneas. No se midieron Core Web Vitals ni rendimiento en un teléfono real. Separar módulos y estilos al corregir funciones, sin necesidad de reescribir todo en un framework.
12. **Publicación y verificaciones.** No se encontraron en los archivos versionados consultados firebase.json, firestore.indexes.json ni workflows de .github. package.json no define pruebas. Los archivos sueltos llamados test no constituyen una suite de aceptación. Un git push del HTML no publica por sí mismo las reglas de Firebase.
13. **SEO y accesibilidad.** Hay títulos, descripciones y etiquetas sociales; no se encontraron sitemap.xml ni robots.txt versionados. Revisar canonical, navegación por teclado, foco en modales, botones solo con iconos, contraste, lector de pantalla y estados vacíos. No se hizo auditoría WCAG completa.
14. **PWA.** Hay manifest y service worker con caché; eso no confirma funcionamiento offline de Firestore, cámara, GPS ni notificaciones. Verificar actualización entre versiones, comportamiento sin conexión e instalación en Android/iOS.

## Oferta y operación comercial

- La portada comercial dice que se paga cuando llega el cliente, mientras los planes incluyen mensualidad o precio fijo. Explicar desde arriba: cuota base y, cuando corresponda, comisión por canje.
- La afirmación de recuperar 100% de inversión con 2 o 3 clientes compara facturación con gasto publicitario y omite costos/margen. Sustituirla por un ejemplo condicionado a margen real y atribución, sin garantía general.
- El ejemplo de costo por cliente de 33 pesos incluye promoción y comisión, pero no reparte la cuota mensual. Identificarlo como costo variable por canje.
- Definir quién financia el viaje gratis, monto máximo, viajes elegibles, resolución de duplicados, excepciones de GPS, cancelaciones y controversias.
- Especificar la evidencia que recibe el comercio y cómo verifica un canje sin depender exclusivamente de una pantalla mostrada por el pasajero.
- La comisión completa se asigna al chofer en el código. La cuota mensual debe sostener captación, tres promociones semanales por comercio, atención, reportes, materiales, infraestructura y premios según el acuerdo. Medir esos costos antes de escalar.
- Confirmar negocios, vehículos y zonas realmente activos antes de prometer cobertura o exclusividad. Mantener procedimientos de alta/baja y sustitución de QR.

## Orden de trabajo propuesto

1. Verificar consola de Firebase y comparar reglas desplegadas; separar entorno de pruebas; confirmar respaldo y recuperación.
2. Corregir permisos administrativos y renderizado de opiniones.
3. Diseñar el registro transaccional de canjes y evidencia de autorización; tarifas históricas, conciliación y control de abuso.
4. Resolver premios o retirarlos temporalmente del alcance de lanzamiento.
5. Corregir privacidad, sesiones, errores de permisos, fechas, flota y demostración.
6. Alinear planes, cobertura, reportes y mensajes comerciales con lo implementado.
7. Preparar hosting de producción, monitoreo, alertas de gasto, despliegue reproducible y reversión.
8. Ejecutar piloto acotado, por ejemplo 3–5 negocios y 5–10 vehículos en una zona, después de aprobar los bloqueos técnicos. El tamaño es una propuesta operativa, no un pronóstico de rentabilidad.

## Criterios de aceptación antes de cobrar

- Un usuario no autorizado no puede administrar campañas ni leer datos privados.
- Una opinión con caracteres HTML se muestra como texto inerte.
- Con una unidad restante y dos canjes simultáneos, solo uno se confirma.
- Reintentar el mismo canje no duplica inventario, comisión ni cobro.
- Vehículo inexistente/dado de baja, cupón vencido y campaña fuera de fechas se rechazan desde el sistema confiable.
- Cambiar o archivar una campaña no modifica importes históricos.
- Demo y pruebas no contaminan los reportes operativos.
- Premio solo se muestra después de adjudicación confirmada, si se mantiene esa función.
- Sin GPS, cámara o conexión hay una salida clara y no aparece éxito falso.
- Pruebas reales en Safari/iPhone y Chrome/Android: QR del vehículo, promoción, QR de caja, canje, reporte y liquidación conciliados.
- Revisión del aviso contra los datos efectivamente guardados y procedimiento de eliminación/retención.
- Datos, respaldo, reglas, índices, despliegue y monitoreo verificados en producción.

## Referencias técnicas consultadas

- Firebase, condiciones de reglas: https://firebase.google.com/docs/firestore/security/rules-conditions
- Firebase, transacciones: https://firebase.google.com/docs/firestore/manage-data/transactions
- Firebase, App Check: https://firebase.google.com/docs/app-check
- Firebase Hosting: https://firebase.google.com/docs/hosting
- GitHub Pages, límites y restricciones: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits

Estos resultados permiten priorizar correcciones; no certifican seguridad integral, cumplimiento legal ni rentabilidad, y no sustituyen una prueba completa con entorno de pruebas y acceso a configuración.
