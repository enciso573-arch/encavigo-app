# Evaluación obligatoria de promociones

Verificación: 5 de octubre de 2026.

- Seis casos de `test_calculadora.js`: importes sin redondeos indebidos, desayuno con costos completos, complemento con valor distinto de costo, paquete sin doble conteo, alternativas sostenibles y rechazo de fichas desactualizadas.
- 37 comprobaciones de Firestore Emulator. Las dos nuevas comprueban que no se puede activar sin ficha, guardar resultados falsificados, publicar condiciones distintas o leer costos como pasajero. Guardar una promoción pausada permanece permitido.
- 26 comprobaciones de `npm run test:recorrido`, usando el HTML real, SDK Firebase y Auth/Firestore Emulator. Incluyen aprobación desde los controles del panel, edición/copia sin aprobación heredada y cambio de costo que invalida el cálculo; siguen funcionando QR, canje atómico, opinión y pagos. Evidencia detallada en `recorrido-resultado.json`.
- Suite existente: 44 casos de acceso y demo, dos de comisiones, seis de operación y seis de pasajero aprobados. Tras retirar la calculadora anterior y actualizar las funciones de edición, se repitieron los seis de operación.
- `scripts/verificar-sitio.cjs`: 21 scripts válidos y 35 referencias locales existentes. `git diff --check` sin errores.
- Vista del formulario real en el servidor aislado de QA, sin Firebase. Ancho móvil de 390 × 844: ancho del documento 390, sin desbordamiento horizontal. Imagen en `calculadora-movil.jpg`. Se conservaron las reglas de estilo del panel.

Las cifras del ensayo son ficticias y solo viven en emuladores. Estas verificaciones no comprueban precios/costos auténticos de un comercio ni su aprobación humana; la ficha registra la confirmación que captura administración. No sustituye la primera prueba física del QR impreso.
