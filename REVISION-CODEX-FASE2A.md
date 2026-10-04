# Cierre del Bloque 2A — EncaviGO

Fecha: 2026-10-03. Rama: `antigravity/fase1-acceso-juego`. Base de esta corrección: `343a5e8`.

## Resultado

Bloque 2A terminado para pruebas locales del modo demostración. Este resultado no autoriza ni certifica un lanzamiento público de producción.

## Correcciones realizadas

- `enviarOpinion` devuelve la promesa de Firestore. La prueba espera una respuesta diferida y comprueba éxito y rechazo, evitando un resultado positivo prematuro.
- El canje demo usa el botón **Simular canje**, no requiere cámara ni ubicación y modifica exclusivamente el inventario de ejemplo en memoria. Su comprobante dice **CANJE DE DEMOSTRACIÓN**.
- La etiqueta DEMO sigue visible sobre el comprobante y el encabezado queda debajo del banner. El modo demo no inicia el seguimiento de ubicación por clic.
- Las pruebas de integración ejecutan los scripts de la aplicación en JSDOM y accionan botones reales de catálogo, canje y encuesta, además del juego. Registran inicializaciones, lecturas y escrituras de Firebase: ninguna se produce en esos recorridos demo.
- Dos contextos DOM comparten almacenamiento durante juego y reinicio demo. La salida recupera el código y el intento consumido de la sesión QR original. También se comprueba el arranque con JSON corrupto.

## Validación reproducible

Desde la carpeta del proyecto:

```powershell
npm ci --ignore-scripts --no-audit --no-fund
npm test
```

Resultado final: **44 de 44 casos pasados**. La suite usa dobles de Firebase, sin credenciales ni datos de producción. Los rechazos deliberados de permisos/red pertenecen a los escenarios de prueba.

También se revisó sintaxis JavaScript y formato Git. La revisión visual local cubrió catálogo, juego, reinicio y canje en escritorio y viewport móvil de 390 × 844; el navegador no mostró errores de consola en el recorrido final.

## Límites y siguiente bloque

- JSDOM representa dos contextos de página, sin implementar navegación completa ni eventos nativos de almacenamiento entre pestañas. El retorno se verifica abriendo un contexto nuevo; no se certifica sincronización en vivo entre pestañas.
- La vista móvil se probó en navegador con viewport ajustado, no en dispositivos físicos. El mapa no fue objeto de esta comprobación visual.
- Aislamiento Firebase no significa ausencia de toda conexión externa: la página puede cargar bibliotecas, imágenes y mapas externos.
- Producción sigue pendiente de validar vehículos en servidor, revisar reglas reales de Firestore y XSS, y hacer atómicos los canjes e inventario. Las protecciones del navegador no sustituyen permisos de servidor.

No se hizo push, despliegue, modificación de reglas ni escritura de prueba en Firebase real.
