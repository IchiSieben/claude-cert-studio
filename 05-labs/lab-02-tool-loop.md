---
lesson:
  route: certify
  order: 10
  level: 3
  title_en: "Lab 02 — Tool loop and structured output"
  summary_en: "Turn a scraped product name into valid JSON every time, calling a local catalogue tool when needed: the tool loop by hand, schemas and validation."
---

# Lab 02 — Loop de tools y salida estructurada

**Proyecto**: farmacias (Radar de Precios; matcher de 3 capas).
**Objetivos**: D2.T3.b · D8.T1.a/b/c · D6.T3.a/b · D6.T2.a/b · D5.T1.d
**Tiempo**: 4–5 h.

## Requerimiento

> Dado el nombre comercial de un producto scrapeado ("PANADOL ANTIGRIPAL NF X 100 TAB"), obtener `{principio_activo, concentracion, forma_farmaceutica, presentacion, es_medicamento}` como JSON válido **siempre**, consultando el catálogo local (DIGEMID) cuando haga falta. Si el texto no es un medicamento (un shampoo), `es_medicamento=false` y el resto `null`. Tasa de JSON inválido: 0 %.

## Decisiones

1. ¿Cómo garantizas JSON válido? (tool como schema con `tool_choice` forzado, o structured outputs si está disponible; + validación Pydantic).
2. ¿Qué tools necesita el modelo? (`buscar_digemid(texto)` de lectura). ¿Qué NO necesita? (nada de escritura).
3. ¿Few-shot? (3 ejemplos canónicos: medicamento simple, combinación, no-medicamento).
4. ¿Qué va en `system`? (rol, reglas, ejemplos; cacheable) ¿y en `user`? (el nombre en `<producto>`).

## Pasos

### 1. Tool de búsqueda con buena descripción

- `buscar_digemid`: descripción de 4 frases (qué, cuándo, cuándo no, qué devuelve). `input_schema` estricto. Devuelve top-5 candidatos con campos mínimos (poda).
- Errores: texto vacío → `is_error: true` con mensaje útil. Excepción de la BD → `is_error` distinto.

### 2. El loop

- Implementa el loop tú mismo (no `tool_runner` todavía): `while stop_reason == "tool_use"`, ejecutar todos los `tool_use` del turno, devolver todos los `tool_result` en **un** mensaje `user`, límite de 5 iteraciones.
- Prueba paralelismo: pide normalizar 3 productos en una sola consulta y observa si emite 3 `tool_use` en un turno. Luego `disable_parallel_tool_use=True` y compara.

### 3. Salida estructurada

- Tool `emitir_resultado` con el schema de salida; en el turno final, `tool_choice={"type":"tool","name":"emitir_resultado"}`.
- Validar `block.input` con un modelo Pydantic. Si falla: **un** reintento con el error de validación como `tool_result` `is_error`. Si vuelve a fallar: excepción explícita y log.
- Alternativa: si la API expone structured outputs para tu modelo, implementar también esa vía y comparar.

### 4. Después, con el SDK

- Reescribir el loop con `client.beta.messages.tool_runner` (o el helper vigente). Anotar qué te ahorra y qué te oculta.

### 5. `tool_choice` y `is_error`

- Probar `auto` / `any` / `none` en el mismo prompt y anotar comportamiento.
- Test: la BD devuelve error → el modelo debe explicar que no pudo consultar, no inventar un principio activo.

## Verificación

- [ ] 50 nombres reales del scraper → 0 JSON inválidos; exactitud vs tu matcher de 3 capas anotada.
- [ ] Test: "SHAMPOO HEAD & SHOULDERS" → `es_medicamento=false`.
- [ ] Test: tool falla → salida honesta, `is_error` en la traza.
- [ ] Test: `max_tokens` bajo → detectado (no es JSON válido "por casualidad").
- [ ] Descripción de la tool evaluada: 20 consultas, ¿elige llamar la tool cuando debe y no cuando no?

## Qué aprendiste

1. ¿En qué rol va `tool_result` y qué lo enlaza?
2. ¿Por qué validar aunque uses `tool_choice` forzado?
3. Tres cosas que debe decir una descripción de tool.
4. ¿Qué es `is_error` y qué no es?
5. ¿Para qué sirven los few-shot aquí y qué riesgo tienen?
6. ¿Cuándo usarías `tool_choice: any`?
