# Proceso obligatorio para construir y publicar promociones

Decisión del propietario, incorporada el 5 de octubre de 2026. Complementa la sección 3 de `ESPECIFICACION-MAESTRA.md`.

## Objetivo

Ayudar al negocio a encontrar una oferta real que quizá no había considerado y que conserve contribución después de los costos variables y la comisión. La calculadora utiliza información del negocio; no inventa costos, precios habituales ni garantías de ventas. Un precio habitual presentado como promoción, sin una mejora para el cliente, no pasa la revisión.

## Recorrido en el panel

1. Abrir **Nuevo Negocio**, registrar la compra ofrecida, ubicación exacta, QR de caja, días, fechas, inventario disponible y comisión acordada.
2. En **Construir y revisar la promoción**, describir la compra habitual y comprobar qué incluye y cuánto cuesta normalmente, por ejemplo en la carta o lista de precios vigente.
3. Capturar precio habitual, precio que pagará el cliente, ingredientes o costo directo, empaque, trabajo variable, costo y valor habitual de un complemento adicional, contribución mínima que el negocio quiere conservar y máximo de canjes autorizado. Escribir **0** donde no aplique; un campo vacío no equivale a cero.
4. Explorar alternativas y elegir una. Se comparan descuentos que caben con esos costos y, si el negocio informó un complemento real, la compra al precio habitual con ese complemento. Un paquete requiere sumar los precios habituales y costos de todos sus componentes. La herramienta no inventa un paquete ni productos disponibles.
5. Actualizar la descripción pública y explicar el beneficio concreto: ahorro o complemento que antes no estaba incluido. Confirmar capacidad de atención, ubicación, días, vigencia y cupos con el negocio. El contenido anunciado debe corresponder a lo calculado.
6. Identificar al dueño o encargado autorizado que aprobó las condiciones, pulsar **Calcular la oferta elegida**, revisar el resultado y marcar la confirmación del acuerdo.
7. Guardar publicada. Si falta información, desmarcar **Publicar** y guardar pausada. Una ficha completa, calculada y confirmada también puede guardarse con una promoción pausada; los campos incompletos del cálculo no se guardan como una aprobación.

## Cálculo y condiciones para activar

Los importes se calculan en centavos para evitar errores de redondeo:

**Contribución por canje = precio de oferta − costo directo − empaque − trabajo variable − costo adicional − comisión.**

**Beneficio para el cliente = precio habitual − precio de oferta + valor habitual del complemento adicional.**

Para descuento o paquete, el precio habitual ya contiene todos los componentes; el valor de complemento adicional debe ser cero. Para complemento, debe existir un beneficio que no estuviera incluido en la compra habitual. No se cuenta dos veces el mismo producto.

Para activar una promoción con canje se exige:

- Información completa, beneficio positivo y contribución al menos igual al mínimo positivo acordado con el negocio.
- Comisión igual a la tarifa de la promoción; inventario disponible no mayor al máximo de canjes autorizado.
- Ficha correspondiente al nombre, descripción, imagen, etiqueta, ubicación, caja, comisión, días y fechas publicados.
- Acuerdo confirmado e identificación de quien lo autorizó.

Ejemplo hipotético: desayuno habitual de $220 vendido en $175; ingredientes $70, empaque $5, trabajo variable $10 y comisión $25. El cliente ahorra $45; quedan $65 por canje antes de gastos fijos. Si el café ya viene incluido, no se presenta como regalo.

La contribución no es utilidad neta: todavía debe ayudar a cubrir renta, nómina fija, impuestos y mensualidad de publicidad. La calculadora no prueba que el precio habitual sea auténtico, que el comprador sea nuevo ni que la oferta logre un desvío. Esa comprobación corresponde al acuerdo comercial y los resultados posteriores.

## Edición, copias y privacidad

Cambiar datos del cálculo o condiciones de la promoción invalida la confirmación en el formulario. Al editar una oferta se cargan sus datos anteriores, pero se vuelve a calcular y confirmar antes de guardarla publicada. Copiar una oferta no copia el acuerdo: el nombre del aprobador queda vacío.

La ficha se guarda en `evaluaciones_promocion/{id_de_promocion}` en la misma transacción que la promoción. Solo la cuenta administradora puede leerla. El catálogo `campaigns` no contiene costos ni nombre del aprobador. Firebase verifica los importes, resultado, correspondencia y cupos para activar una oferta, incluso si se intenta saltar el formulario. Se conserva la última ficha por promoción; no constituye un historial de cada edición ni una firma electrónica del negocio.

El descenso de stock por un canje no obliga a calcular de nuevo. Aumentarlo por encima del máximo autorizado sí exige revisar el acuerdo. La transacción de edición conserva el stock actual cuando el administrador no lo cambió, para no deshacer canjes concurrentes.

Las campañas municipales de contacto siguen un proceso distinto: no tienen cupón, stock, comisión ni QR de caja; por ello no utilizan esta calculadora de canjes. Este tipo de campaña no puede generar tickets.

## Seguimiento del piloto

Después de comenzar, comparar interacciones, canjes, opiniones e importes cobrados, y preguntar al negocio si el resultado le conviene. Ajustar la oferta con nuevos datos y aprobación. No sustituir resultados con promesas de ventas, ni anunciar un premio de viaje mientras esté desactivado.
