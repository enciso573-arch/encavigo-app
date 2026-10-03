# EncaviGO — Especificación maestra de producto

**Versión:** 1.0

**Fecha:** 2 de octubre de 2026

**Carpeta principal:** `C:\Users\Enciso\Desktop\EncaviGO`

**Repositorio:** `https://github.com/enciso573-arch/encavigo-app` (`main`)

## Propósito de este documento

Esta es la fuente de verdad para terminar la primera versión de EncaviGO. Separa las decisiones confirmadas por el propietario de las propuestas y funciones futuras. Que una función aparezca aquí no significa que ya esté implementada.

Para conocer problemas técnicos encontrados en la versión actual, consultar `AUDITORIA-LANZAMIENTO-2026-10-02.md`.

## 1. Definición del producto

EncaviGO es una plataforma web de promociones locales que el pasajero descubre mediante un código QR colocado dentro de un vehículo afiliado. Su objetivo es convertir el trayecto del pasajero en visitas medibles para negocios cercanos.

EncaviGO no se limita a vender exposición. El servicio pretende:

1. Ayudar al negocio a construir una promoción atractiva y financieramente viable.
2. Mostrar esa promoción a pasajeros que circulan cerca.
3. Dar exposición inicial a negocios nuevos.
4. Medir visualizaciones, activaciones y canjes.
5. Utilizar resultados reales para conservar, ajustar o reemplazar promociones.

## 2. Alcance confirmado de la primera versión

### 2.1 Acceso mediante QR

- El acceso promocional se obtiene al escanear el QR de un vehículo afiliado.
- Entrar directamente a `encavigo.com` no desbloquea las promociones.
- Una visita directa debe explicar que es necesario escanear el QR de un transporte afiliado.
- Una sesión vencida debe informar que las 24 horas terminaron y que hace falta un nuevo viaje afiliado para obtener otra sesión.
- Ninguno de esos estados debe causar errores de JavaScript.

### 2.2 Sesión promocional

- El QR crea una sesión promocional de 24 horas.
- La sesión tiene un código exclusivo.
- Durante las 24 horas, el pasajero puede consultar y activar promociones de varios negocios.
- El mismo código puede canjearse una sola vez en cada negocio, aunque ese negocio tenga varias promociones.
- Volver a cargar la página no debe crear otro código ni renovar la sesión.
- Escanear nuevamente durante una sesión vigente no debe conceder otro intento de juego ni permitir repetir un canje en el mismo negocio.
- Al terminar las 24 horas, el código deja de ser válido.

### 2.3 Juego inicial

- Cada sesión tiene un solo intento de juego.
- El juego muestra tarjetas de negocios.
- Tres tarjetas iguales revelan una promoción real que también existe en el catálogo general.
- El resultado no concede un descuento adicional ni un beneficio diferente.
- El mensaje correcto es “descubriste una promoción” y no “ganaste un premio exclusivo”.
- Recargar, borrar una pantalla o volver a escanear durante la misma sesión no debe entregar otro intento.

### 2.4 Viaje gratis

- El viaje gratis no forma parte del piloto inicial mientras EncaviGO no tenga presupuesto para cumplirlo.
- La función puede quedar preparada técnicamente, pero debe tener un interruptor de activación controlado por administración.
- Mientras esté desactivada, no debe anunciarse como premio disponible ni aparecer como resultado posible.
- Antes de activarla se deben definir presupuesto, importe máximo, cantidad máxima de premios, periodo, comprobación y condiciones aplicables.
- La adjudicación debe confirmarse de manera confiable antes de mostrar al pasajero que ganó.

### 2.5 Piloto de negocios

- El objetivo inicial es incorporar hasta 15 negocios sin cobrarles el primer espacio o periodo piloto.
- El propósito es llenar la plataforma con promociones reales antes de ampliar la flota y comenzar la venta normal.
- Cada negocio debe aprobar expresamente la promoción, vigencia, inventario y condiciones de canje.
- Los primeros negocios también servirán para aprender qué tipos de promociones funcionan por giro, zona, horario y distancia.
- La gratuidad del piloto no convierte automáticamente al negocio en cliente de pago.

### 2.6 Comisiones y pagos

- EncaviGO cobra al negocio las comisiones generadas por canjes válidos.
- EncaviGO concentra esas comisiones y paga al conductor correspondiente.
- La periodicidad objetivo de pago al conductor es semanal.
- La tarifa aplicada debe guardarse dentro de cada canje para que cambios futuros no alteren importes históricos.
- Cada comisión necesita estados separados: generada, pendiente de cobro, cobrada al negocio y pagada al conductor.
- Un pago adelantado por EncaviGO debe registrarse como adelanto y como saldo pendiente del negocio hasta recuperarlo.
- Los canjes duplicados, cancelados o en revisión no se pagan automáticamente.

## 3. Promociones y calculadora EncaviGO

### 3.1 Objetivo

La calculadora no pretende sustituir a un mercadólogo. Su función es ayudar a construir una promoción con alto valor percibido para el pasajero y un costo sostenible para el negocio.

La promoción debe ser suficientemente atractiva para justificar que un pasajero cercano se desvíe hacia el negocio. Un descuento pequeño puede no ser suficiente.

### 3.2 Datos mínimos que debe proporcionar el negocio

- Nombre del producto o servicio.
- Precio normal de venta.
- Costo variable estimado.
- Costo de empaque, si aplica.
- Comisión del conductor correspondiente.
- Complementos de bajo costo y alto valor percibido.
- Productos con capacidad o inventario disponible.
- Días y horarios de baja demanda.
- Compra mínima que debe conservarse.
- Costo máximo aceptado para adquirir un cliente nuevo.
- Vigencia e inventario máximo autorizado para la promoción.

### 3.3 Cálculo mínimo

La calculadora debe mostrar por separado:

`margen del canje = pago del cliente - costo variable - empaque - comisión - costo adicional de la promoción`

Los gastos fijos, impuestos y otros costos deben mostrarse o explicarse por separado cuando se evalúe rentabilidad. No se debe presentar el margen del canje como utilidad neta.

### 3.4 Resultado esperado

La primera calculadora propondrá hasta tres alternativas:

- **Segura:** protege más margen, con atractivo moderado.
- **Agresiva:** acepta un costo mayor para adquirir una primera visita.
- **Horario flojo:** solo se activa en días u horas con capacidad disponible.

Cada alternativa debe mostrar:

- Lo que paga y recibe el pasajero.
- Valor comunicado de la oferta.
- Costo estimado para el negocio.
- Comisión.
- Margen estimado restante.
- Límite de canjes recomendado.
- Riesgos o datos faltantes.

El negocio elige y aprueba. La calculadora no publica automáticamente una promoción.

### 3.5 Ejemplos que deben evaluarse, no asumirse

Para una fonda con comida completa de $120, posibles estructuras incluyen:

- Comida a precio normal más una porción controlada para llevar.
- Compra de dos comidas más un complemento para compartir.
- Beneficio adicional en un horario de baja demanda.
- Precio reducido de primera visita, si el margen lo permite.

El costo real de ingredientes, empaque y comisión determina si cada opción es viable. Estos ejemplos no autorizan promociones concretas para ningún negocio.

## 4. La Baraja

### 4.1 Objetivo

La Baraja ordena las promociones que ve el pasajero. Debe equilibrar cercanía, oportunidad para negocios nuevos, atractivo de la oferta y resultados medidos.

### 4.2 Señales previstas

- Distancia al negocio.
- Zona o municipio contratado.
- Horario de operación.
- Día y horario objetivo de la campaña.
- Vigencia e inventario disponible.
- Tipo de plan contratado.
- Antigüedad del negocio en la plataforma.
- Exposición acumulada.
- Aperturas, activaciones y canjes.
- Estado de impulso inicial.

### 4.3 Impulso inicial

- Los negocios nuevos reciben exposición prioritaria durante un periodo o cantidad de apariciones definidos.
- El impulso no puede durar indefinidamente.
- Al concluirlo, los datos determinan si la promoción se conserva, ajusta o reemplaza.
- La cantidad exacta de días o apariciones se decidirá después de observar el piloto.

### 4.4 Lectura de resultados

- Muchas visualizaciones y pocas aperturas: presentación o propuesta poco atractiva.
- Aperturas sin activaciones: beneficio insuficiente o condiciones confusas.
- Activaciones sin canjes: distancia, horario, confianza o proceso de canje problemáticos.
- Canjes con margen negativo: promoción financieramente incorrecta.
- Canjes sostenibles y buena experiencia: candidata a conservar prioridad.

La Baraja no debe ocultar permanentemente a los negocios nuevos ni permitir que un solo negocio monopolice las primeras posiciones.

## 5. Métricas necesarias

Las métricas deben tener definiciones estables y evitar contar recargas como personas diferentes.

- Sesiones válidas iniciadas mediante QR.
- Vehículo atribuido a cada sesión.
- Promociones mostradas.
- Tarjetas abiertas.
- Promociones activadas.
- Intentos de canje.
- Canjes confirmados.
- Canjes rechazados, duplicados o enviados a revisión.
- Distancia aproximada al negocio cuando sea necesaria y esté informada al usuario.
- Tarifa aplicada en el momento del canje.
- Comisión cobrada y pagada.
- Zona, día y hora.

Una métrica por dispositivo no debe presentarse automáticamente como “personas únicas”. Un canje tampoco demuestra por sí solo que el cliente nunca había visitado antes el negocio.

## 6. Estados del recorrido

### Sesión

`sin acceso → activa → vencida`

### Promoción

`borrador → aprobada → programada → activa → agotada o vencida → archivada`

### Canje

`solicitado → validado o rechazado → en revisión si corresponde`

### Comisión

`generada → pendiente de cobro → cobrada → pagada al conductor`

Los estados financieros deben conservar historial de quién realizó el cambio y cuándo. No se deben reconstruir únicamente a partir del estado actual de una campaña.

## 7. Reglas técnicas obligatorias antes de cobrar

- Solo administradores autorizados pueden modificar campañas, códigos, tarifas y estados financieros.
- Los comentarios de usuarios se muestran como texto, sin interpretar HTML.
- Crear el ticket y descontar inventario es una operación atómica: todo se completa o nada se registra.
- El servidor o las reglas confiables validan vehículo, sesión, vencimiento, negocio, campaña, inventario e idempotencia.
- Un canje repetido no duplica inventario, comisión ni cobro.
- La tarifa aplicada queda guardada en el ticket.
- Las fechas de inicio y fin se aplican al mostrar y canjear promociones.
- Los datos DEMO y de pruebas están separados de la operación real.
- El éxito solo se muestra después de la confirmación confiable.
- El tratamiento real de ubicación coincide con el aviso de privacidad.
- Existen respaldo, monitoreo, alertas de gasto y procedimiento de reversión.

## 8. Orden de implementación

1. Corregir autorización administrativa y visualización segura de opiniones.
2. Definir y asegurar la sesión de 24 horas iniciada por QR.
3. Hacer atómicos el canje, inventario y registro de tarifa.
4. Añadir estados de cobro, adelanto y pago semanal a conductores.
5. Separar demostración y pruebas de producción.
6. Ajustar el juego a un intento y descubrimiento de promociones.
7. Corregir mensajes de acceso directo y sesión vencida.
8. Aplicar vigencia, zona, municipio, plan e inventario.
9. Ejecutar el piloto y medir resultados.
10. Construir la primera calculadora con reglas financieras.
11. Añadir impulso inicial y optimización gradual de La Baraja.
12. Preparar el viaje gratis únicamente cuando exista presupuesto y condiciones definidas.

## 9. Criterios de éxito del piloto

El piloto debe responder con datos a estas preguntas:

- ¿Cuántos pasajeros escanean cuando el conductor invita y cuando no invita?
- ¿Cuántas sesiones abren al menos una promoción?
- ¿Qué porcentaje activa una promoción?
- ¿Qué porcentaje llega y canjea?
- ¿Qué ofertas producen canjes sin dejar margen negativo?
- ¿Qué distancia y horarios todavía generan visitas?
- ¿Los negocios respetan los canjes?
- ¿Los registros de EncaviGO coinciden con los negocios?
- ¿Cuántos negocios desean continuar pagando después del piloto?

Como referencia inicial de validación, conseguir que al menos 3 de los 15 negocios quieran pagar un siguiente periodo sería una señal positiva, pero no constituye por sí sola rentabilidad demostrada.

## 10. Fuera del alcance inicial

- Delivery y pedidos a domicilio.
- Tarifas de reparto.
- Mapa de calor avanzado.
- Optimización automática basada en inteligencia artificial.
- Garantías de “cero fraude”.
- Garantías de clientes o retorno financiero.
- Viaje gratis sin presupuesto reservado y condiciones definidas.

## 11. Decisiones pendientes

- Duración exacta del espacio gratuito para los 15 negocios.
- Proceso y documento de aprobación de cada promoción.
- Definición confiable de un QR de vehículo válido y medidas contra enlaces compartidos.
- Política cuando se escanea otro vehículo durante una sesión vigente.
- Radio exacto de muestra y canje por giro y tipo de negocio.
- Tarifas de comisión por giro o ticket promedio.
- Día de corte y día de pago semanal a conductores.
- Condiciones para adelantar comisiones no cobradas.
- Periodo de retención y eliminación de ubicación y registros.
- Presupuesto, importe máximo y condiciones del viaje gratis.
- Medio de alojamiento definitivo y despliegue de backend/reglas.
- Meta mínima de conversión y margen para continuar después del piloto.

## 12. Regla de control de cambios

Toda función nueva debe clasificarse antes de implementarse como:

- **Confirmada:** decisión aprobada por el propietario.
- **Propuesta:** idea pendiente de aprobación.
- **Implementada:** existe en código y tiene pruebas.
- **Publicada:** está desplegada y verificada en producción.

Ningún documento generado por una herramienta puede convertir una propuesta en decisión confirmada ni una descripción en función implementada.
