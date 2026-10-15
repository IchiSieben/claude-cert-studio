---
lesson:
  route: certify
  order: 11
  level: 3
  title_en: "Lab 03 — Caching, batches and a cost model"
  summary_en: "Summarize 90 days of reports at the lowest cost: prompt caching for the fixed system prompt, the Batches API for the backlog, and the arithmetic that compares them."
---

# Lab 03 — Caching, Batches y modelo de costo

**Proyecto**: Chasqui (histórico de 90 días) o stt_whisper (post-edición nocturna de transcripciones).
**Objetivos**: D5.T4.a/b · D2.T3.f/h · D5.T3.a/b · D2.T1
**Tiempo**: 3–4 h (+ espera del batch).

## Requerimiento

> Generar el resumen ejecutivo (Lab 01) para **los últimos 90 días** de reportes, con el **menor costo posible**, listo para mañana. Además, la ejecución diaria debe aprovechar que el system prompt (glosario + reglas, ~2 500 tokens) es idéntico cada día.

## Decisiones

1. Histórico de 90 días sin apuro → **Batches** (50 %). Diario con usuario esperando → realtime.
2. System prompt idéntico → **prompt caching** (`cache_control` al final del `system`). ¿Alcanza el mínimo de tokens cacheables para el modelo? Si no, ¿qué agregas (glosario completo, ejemplos) para que valga?
3. Modelo: correr el mismo lote con Haiku y Sonnet y decidir con datos (calidad medida por una rúbrica simple + costo).

## Pasos

### 1. Línea base

- Ejecutar 10 días en realtime sin caché. Registrar `usage` completo y calcular costo con la tabla de precios vigente (`docs.claude.com/en/docs/about-claude/pricing`). Guardar en `costos.csv`.

### 2. Caching

- Añadir `cache_control: {"type":"ephemeral"}` al último bloque del `system`. Ejecutar 10 días **seguidos** (dentro del TTL de 5 min). Verificar: primera llamada `cache_creation_input_tokens > 0`; siguientes `cache_read_input_tokens > 0`.
- Romper el caché a propósito: cambiar una palabra al **inicio** del system. Ver que se vuelve a escribir. Luego cambiar solo el `user`: el caché se mantiene.
- Calcular ahorro real con la fórmula de D5 §4.1.

### 3. Batches

- Construir 90 requests (`custom_id` = fecha), `client.messages.batches.create(...)`. Poller cada 60 s hasta `processing_status == "ended"`. Descargar resultados; manejar `succeeded / errored / expired`.
- Combinar con caching (el `cache_control` también aplica dentro del batch). Registrar costo y comparar con realtime.

### 4. Elección de modelo

- Mismo lote de 30 días con Haiku y con Sonnet. Rúbrica: ¿menciona las 3 variaciones correctas? ¿inventa? ¿5 líneas? Puntuar 0–3 a mano o con LLM-as-judge (Sonnet juzga a ambos; **verifica 10 a mano**).
- Tabla final: modelo × modo (realtime / caché / batch / batch+caché) → costo por 90 días, calidad media.

### 5. Modelo de costo para el cliente

- Escribir `COSTOS.md`: costo diario proyectado, costo del histórico, y qué palancas usaste. Es exactamente el tipo de estimación que te pedirán en un trabajo.

## Verificación

- [ ] `cache_read_input_tokens > 0` demostrado en logs.
- [ ] Batch completo con manejo de los 4 estados por request.
- [ ] Tabla modelo × modo con números reales.
- [ ] Ahorro total documentado (esperable: > 60 % vs línea base).

## Qué aprendiste

1. Orden de cacheo de la API y por qué el `system` va antes que los mensajes.
2. Precio de cache write vs read respecto al input normal.
3. Ventana máxima del batch y descuento.
4. ¿Cuándo NO usarías batch aunque sea más barato?
5. ¿Qué es checkpoint caching y en qué se diferencia de cachear el system?
6. ¿Cómo decidiste el modelo: por intuición o por eval?
