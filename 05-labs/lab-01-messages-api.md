# Lab 01 — Messages API a fondo

**Proyecto**: Chasqui (bot diario Barchart + SUNAT → Excel + PPT → Gmail).
**Objetivos**: D2.T3.a/c/d/e · D5.T1.a/b/c · D5.T2.b
**Tiempo**: 3–4 h.

## Requerimiento (como lo escribiría el examen)

> El cliente quiere, además del Excel y el PPT, un **resumen ejecutivo de 5 líneas en español** del reporte diario de precios, generado automáticamente, que mencione las 3 variaciones más relevantes. Debe estar listo en menos de 10 s tras generar el Excel. Si el modelo no puede determinar una variación, debe decirlo y no inventar.

## Decisiones a tomar antes de programar (escríbelas)

1. ¿Realtime o batch? (10 s, un usuario esperando → realtime).
2. ¿Qué modelo? (texto corto, datos ya calculados → Haiku; justificar).
3. ¿Qué va en `system` y qué en `user`?
4. ¿Streaming? (para consola/log sí es útil; para un correo no).
5. ¿`temperature`? (0–0.2: es un resumen factual).
6. ¿`max_tokens`? (5 líneas ≈ 150–250 tokens → 400 con margen; qué pasa si se alcanza).

## Pasos

### 1. Cliente mínimo y `stop_reason`

- `chasqui/llm/resumen.py` con `Anthropic()` (key desde entorno), `system` con rol + glosario de commodities + formato, `user` con la tabla de variaciones en `<datos>`.
- Imprimir `stop_reason` y `usage`. Forzar `max_tokens=30` una vez para **ver** `max_tokens` y una salida truncada. Manejar los 6 valores de `stop_reason` en una función `manejar_stop(resp)`.

### 2. Streaming

- Versión con `client.messages.stream(...)` que imprime en consola token a token y al final `get_final_message()`. Observar los eventos (`message_start`, `content_block_delta`, `message_delta`, `message_stop`) con `for event in stream`.
- Pregunta: ¿qué protocolo va por debajo? (SSE). ¿Podrías hacer esto con WebSocket? ¿Por qué la API no lo usa?

### 3. Tokens y muestreo

- `client.messages.count_tokens(...)` sobre el prompt real: anotar entrada. Comparar con `usage.input_tokens`.
- Correr 5 veces con `temperature=0` y 5 con `temperature=1`; guardar salidas; observar variabilidad. Concluir por escrito qué implica para los tests.

### 4. Visión / PDF (opcional pero recomendado)

- Pasar el PPT exportado a PDF como bloque `document` y pedir "verifica que el resumen coincide con los gráficos". Anotar tokens que consume un PDF de 5 páginas.
- Probar `citations` en el bloque documento.

### 5. Thinking

- Misma tarea con `thinking={"type":"enabled","budget_tokens":2000}` en Sonnet: ¿mejora? ¿cuánto cuesta más? (mirar `usage.output_tokens`). Concluir cuándo lo activarías.

## Verificación

- [ ] Los 6 `stop_reason` manejados, con test unitario que simula cada uno (mock del cliente).
- [ ] Salida truncada detectada y reintentada con más `max_tokens`.
- [ ] "No inventa": test con tabla vacía → el resumen dice que no hay datos.
- [ ] Registro de `usage` por llamada en el log de Chasqui.
- [ ] `LAB.md` con las decisiones de arriba y sus justificaciones.

## Qué aprendiste (responder sin mirar)

1. ¿Por qué `system` es un parámetro y no un mensaje?
2. ¿Qué pasa con la respuesta al llegar a `max_tokens`? ¿Y con el `usage`?
3. SSE vs WebSocket.
4. ¿Qué cuenta un PDF en tokens?
5. ¿Temperature 0 = determinista?
6. ¿Cuándo activarías extended thinking en este caso y cuándo no?
