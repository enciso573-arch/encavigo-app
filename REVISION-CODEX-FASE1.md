# Revisión Codex — Fase 1: acceso, sesión y juego

**Fecha:** 3 de octubre de 2026

**Rama revisada:** `antigravity/fase1-acceso-juego`

**Base:** `main` en `0b7a4da`

## Dictamen

El bloque es una base funcional para continuar el desarrollo, pero todavía no está listo para un lanzamiento público. La lógica principal de acceso por QR, sesión de 24 horas, un intento de juego y viaje gratis desactivado quedó cubierta por pruebas locales. Antes de publicar se deben resolver los bloqueos de servidor y seguridad descritos al final.

## Hallazgos corregidos durante la revisión

1. **Reescaneo durante una sesión activa:** la entrega original creaba otra sesión, otro código y otro intento cada vez que se abría un enlace con `?chofer=`. Ahora conserva el inicio original de las 24 horas, el código, el chofer atribuido y el estado del juego.
2. **Consumo accidental del juego:** abrir el modal consumía el único intento. Ahora se consume al elegir la primera tarjeta y permanece consumido si se recarga la página.
3. **Mensaje comercial incompatible con el piloto:** `/negocios/` todavía anunciaba “GANA TU VIAJE GRATIS”. Ahora comunica que el juego descubre promociones.
4. **Cobertura de pruebas:** se agregaron casos para reescaneo con sesión vigente, reemplazo de una sesión vencida y comprobación del mensaje comercial.
5. **Formato Git:** se eliminaron espacios finales que hacían fallar `git diff --check`.

## Verificación ejecutada

- `node test_fase1.js`: **14 de 14 casos aprobados**.
- Compilación de todos los scripts JavaScript embebidos: **sin errores de sintaxis**.
- `git diff --check`: **sin errores**.
- Prueba visual local de entrada directa: muestra la pantalla que exige escanear el QR.
- Prueba visual local de `/negocios/`: muestra el mensaje actualizado y carga sin errores de consola.

No se ejecutó el flujo QR real desde el navegador durante esta revisión porque el código actual registra escaneos en Firebase de producción. La lógica se verificó en el entorno aislado de `test_fase1.js` para no contaminar datos reales.

## Bloqueos antes de un lanzamiento público

1. **Validar vehículos en servidor.** Cualquier persona puede fabricar hoy un enlace con cualquier valor en `?chofer=` y obtener acceso. Se requiere un token firmado o una validación contra una lista autorizada en servidor.
2. **Separar la demostración de producción.** Los enlaces `/?chofer=DEMO` de `/negocios/` entran por el mismo flujo real y pueden registrar actividad en Firebase. La demo debe usar datos y almacenamiento aislados.
3. **Cerrar reglas de Firestore y sanear contenido.** Revisar `firestore.rules` y reemplazar las inserciones de opiniones o campos externos mediante `innerHTML` por nodos seguros con `textContent`.
4. **Hacer atómico el canje.** La validación del código, el canje único y la reducción de inventario deben ejecutarse juntos mediante una transacción en backend/Firestore.
5. **Mover el intento de juego al servidor.** `localStorage` se puede borrar; por ello la regla de un intento no es todavía antifraude.
6. **Resolver el recurso faltante.** `index.html` referencia `img/biz-01.jpg`, que no existe en la carpeta actual.
7. **Validar en teléfonos reales.** La suite comprueba estructura móvil y ciclos DOM; falta una prueba manual completa en Android y iPhone con una base de pruebas separada.

## Estado de publicación

- Sin `push` a GitHub.
- Sin despliegue.
- Sin cambios intencionales en Firebase.
- Las correcciones de esta revisión quedan en la rama de Fase 1 para revisión antes de integrarlas a `main`.
