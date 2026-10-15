---
lesson:
  route: certify
  order: 4
  level: 2
  title_en: "D4 · Eval, Testing, and Debugging — 2.6 %"
  summary_en: "Finding errors and recovery strategies, reading traces, and telling whether a problem lives in the integration layer or in the model's output."
---

# D4 · Eval, Testing, and Debugging — 2.6 % (~1 pregunta)

> Identificar errores y estrategias de recuperación; análisis de trazas; aislar si el problema está en la **capa de integración** o en la **salida del modelo**.
> Una pregunta, pero el contenido es transversal: la mentalidad de eval es lo que hace que todo lo demás (prompts, modelos, tools) sea mejorable con evidencia y no a ojo. Y `signal-agent` con 163 tests ya es tu laboratorio.

---

## 1. Dónde está el error: integración vs modelo

| Síntoma | Probable capa | Cómo confirmarlo |
|---|---|---|
| 400/401/429/529, excepciones del SDK, timeouts | Integración (request, auth, límites, red) | Log del request/response, código HTTP, `request_id` |
| `stop_reason: max_tokens` y JSON roto | Integración (config) | Ver `stop_reason` y `usage.output_tokens == max_tokens` |
| `tool_use` sin `tool_result` → 400 en la siguiente llamada | Integración (loop) | Revisar el historial de mensajes |
| El modelo llama la tool equivocada o con parámetros mal formados | **Modelo** ← descripciones de tools (D8) | Reproducir en Console/Workbench con el mismo prompt; variar descripción |
| Salida bien formada pero factualmente errónea | Modelo (alucinación) o contexto insuficiente | Verificar si la información estaba en el contexto; pedir citas |
| Funciona el 90 % y falla el 10 % | Modelo (no determinismo) o casos borde del prompt | Eval set; correr N veces; clasificar fallos |
| Funcionaba y dejó de funcionar sin tocar código | Cambio de modelo (alias) o de datos de entrada | Pinnear ID; diff de inputs |
| Lento | Integración (sin streaming, sin paralelismo, sin caché) o modelo (thinking, Opus) | Medir latencia por fase; `usage` |

Método: **reproducir con el request exacto** (loggea el JSON completo de la request, incluidas tools y system), aislar en el Workbench de la Console, cambiar una variable a la vez.

## 2. Trazas y logging

Cada llamada debería registrar (estructurado, JSON):
`timestamp, request_id, modelo, versión de prompt, input_tokens, output_tokens, cache_read, cache_write, stop_reason, latencia_ms, tools llamadas (nombre, input resumido, is_error), costo estimado, id de usuario/sesión (pseudonimizado)`.

En agentes, la **traza** es la secuencia completa de turnos: prompt → tool_use → tool_result → … → respuesta. Leerla en orden es como se encuentra el punto donde el agente se desvió (una tool devolvió basura → el modelo la creyó; un `is_error` mal redactado → loop de reintentos). Herramientas: tu propio log, OpenTelemetry (Claude Code exporta métricas/eventos OTel), plataformas de observabilidad LLM.

## 3. Estrategias de recuperación

| Falla | Recuperación |
|---|---|
| 429 / 529 / 5xx | Backoff exponencial con jitter, respetar `retry-after`, circuit breaker, fallback a otro modelo/región |
| `max_tokens` | Reintentar con más `max_tokens` o pedir continuación ("continúa desde…") |
| JSON inválido | Reparar / reintentar con el error como feedback (1–2 veces), luego fallar explícitamente |
| Tool error | `is_error` informativo → el modelo corrige; límite de reintentos por tool |
| Loop infinito del agente | `max_turns`, presupuesto de tokens, detección de repetición de la misma tool call |
| `refusal` | No reintentar igual; registrar; ruta alternativa o mensaje al usuario |
| Salida dudosa | Evaluator (segundo modelo) o validación programática antes de actuar |

Principio: **falla rápido y ruidoso** en integración; **degrada con gracia** en modelo (respuesta parcial marcada, no inventada).

## 4. Evaluación (la parte "eval" del nombre del dominio)

Aunque el blueprint solo lista debugging, el exam guide recomienda "construir una app que ejercite… evaluación". Lo mínimo:

1. **Eval set**: 20–100 casos reales con entrada y salida esperada (o rúbrica). Incluye casos borde y adversariales.
2. **Métricas**: exactitud/F1 para clasificación y extracción; validez de schema; tasa de tool correcta; costo y latencia por caso; para texto libre, **LLM-as-judge** con rúbrica (otro modelo puntúa) + muestra revisada por humanos.
3. **Regresión**: correr el eval en cada cambio de prompt, tool o modelo. Guardar resultados con versión.
4. **Producción**: muestreo de casos reales para re-etiquetar; monitoreo de deriva (distribución de `stop_reason`, longitud, refusals, costo).

Anthropic ofrece en la Console una herramienta de evaluación de prompts (comparar versiones sobre casos) y guías de *Test and evaluate*.

## 5. Aplicarlo en tus proyectos

| Proyecto | Ejercicio | Objetivos |
|---|---|---|
| **signal-agent** | Añadir `eval/` con 30 señales etiquetadas; test parametrizado que corre el prompt actual y exige ≥ X % de acuerdo; correrlo en GitHub Actions con Batches para que cueste la mitad. Guardar `usage` por corrida. | D4 completo, D5.T4 |
| **farmacias** | Set de 50 nombres comerciales con su normalización esperada; métrica de exactitud del matcher LLM vs el de 3 capas; matriz de confusión. | D4 |
| **Chasqui** | Logging estructurado JSON de cada llamada al modelo con los campos de §2; dashboard mínimo (DuckDB + tu tablero) de costo/latencia por día. | D4 §2 |
| **stt_whisper** | WER de la post-edición LLM contra 10 transcripciones corregidas a mano. Detectar si "inventa" en pasajes inaudibles. | D4 §4 |
| **Cualquier agente tuyo** | Introducir fallas a propósito (tool que devuelve error, respuesta truncada con `max_tokens=50`, modelo inexistente) y verificar que la recuperación es la de §3. Es "chaos testing" para agentes. | D4 §3 |

## 6. Autoevaluación

1. Tres síntomas que apuntan a integración y tres que apuntan al modelo.
2. Qué campos loggear por llamada.
3. Cómo distingues alucinación de "no tenía la información en el contexto".
4. Estrategia ante `max_tokens` con JSON truncado.
5. ¿Qué es LLM-as-judge y cuál es su límite?
6. Qué es un eval set de regresión y cuándo se corre.
7. Cómo evitas un loop infinito en un agente.
8. Por qué reproducir con el request exacto y no "con un prompt parecido".

## 7. Fuentes

- Test and evaluate: https://docs.claude.com/en/docs/test-and-evaluate/define-success · /develop-tests
- Console Evaluation tool: https://docs.claude.com/en/docs/test-and-evaluate/eval-tool
- Errores: https://docs.claude.com/en/api/errors
- Claude Code monitoring (OTel): https://docs.claude.com/en/docs/claude-code/monitoring-usage
- Anthropic, *Demystifying evals for AI agents* (engineering blog, 2025/26 — buscar título exacto)
