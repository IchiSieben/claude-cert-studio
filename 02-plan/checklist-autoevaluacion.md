# Checklist de autoevaluación por objetivo del blueprint

Escala: 0 = no sé qué es · 1 = lo reconozco · 2 = lo explico · 3 = lo he implementado y podría responder una pregunta de escenario sin dudar.
Meta antes del examen: todo en ≥ 2, y en 3 todo lo de D2 y D5.

| Objetivo | Descripción corta | Peso | Antes | Después | Lab |
|---|---|---|---|---|---|
| D2.T1 | Requerimientos → decisiones técnicas | 3.4 | | | 03 |
| D2.T2 | Ciclo de vida de sistemas LLM | 2.8 | | | 04 |
| D2.T3.a | Messages API: system, roles, max_tokens, stop_reason | | | | 01 |
| D2.T3.b | Tool use en la API (tool_use/tool_result) | | | | 02 |
| D2.T3.c | Streaming SSE y eventos | | | | 01 |
| D2.T3.d | Visión, PDF, Files API, citations | | | | 01 |
| D2.T3.e | Extended / adaptive thinking, fast mode | | | | 01 |
| D2.T3.f | Prompt caching (mecánica) | 6.8 | | | 03 |
| D2.T3.g | Bedrock / Vertex / Foundry | | | | — |
| D2.T3.h | Batches API; realtime vs batch | | | | 03 |
| D2.T4.a | REST, JSON, códigos HTTP, idempotencia, backoff | | | | 04 |
| D2.T4.b | Async, concurrencia, rate limits | 7.4 | | | 04 |
| D2.T4.c | Git, SDLC, code review, refactoring con IA | | | | 04 |
| D2.T5.a | Comportamiento entre interfaces (Code/Desktop/API/SDK) | 8.6 | | | 06 |
| D2.T5.b | Content boundaries, schemas, higiene de sesión, plugins | | | | 02, 07 |
| D2.T6.a | CLAUDE.md y settings.json | 4.1 | | | 06 |
| D2.T6.b | Versionado de modelos y prompts | | | | 04 |
| D5.T1.a | Tokens, ventana, límites de salida | | | | 01 |
| D5.T1.b | temperature/top_p/top_k, no determinismo | 5.2 | | | 01 |
| D5.T1.c | Modos: fast, extended, adaptive | | | | 01 |
| D5.T1.d | Zero/one/few-shot | | | | 02 |
| D5.T2.a | SDK envuelve REST: reintentos, timeouts, helpers | 6.1 | | | 04 |
| D5.T2.b | HTTP vs SSE vs WebSocket vs stdio | | | | 01, 06 |
| D5.T3.a | Opus / Sonnet / Haiku casos de uso | | | | 03 |
| D5.T3.b | Calidad / latencia / costo | 2.7 | | | 03 |
| D5.T3.c | Breaking changes y migración de modelos | | | | 04 |
| D5.T4.a | usage y modelado de costo | 2.8 | | | 03 |
| D5.T4.b | Caching: precios, orden, checkpoint caching | | | | 03 |
| D1.T1.a | Workflow vs agente; 5 patrones | 4.5 | | | 05 |
| D1.T1.b | Supervisor / subagentes; contexto no heredado | | | | 05 |
| D1.T2.a | Agent SDK, loop propio, despliegue | 5.3 | | | 05 |
| D1.T2.b | Hooks para acciones determinísticas | | | | 05, 07 |
| D1.T3.a | Tool loops, subagentes, memoria, contexto | 4.9 | | | 05 |
| D1.T3.b | Strands / LangGraph / PydanticAI | | | | — |
| D6.T1.a | Ventana y memoria | | | | 05 |
| D6.T1.b | Deriva/bloat: poda, compactación | 3.8 | | | 05 |
| D6.T1.c | Aislamiento con subagentes | | | | 05 |
| D6.T2.a | Claridad, few-shot | | | | 02 |
| D6.T2.b | System vs user | 4.6 | | | 02 |
| D6.T2.c | Restricciones, iteración, saneamiento | | | | 07 |
| D6.T3.a | Salida estructurada (schema, tool, prefill) | 2.6 | | | 02 |
| D6.T3.b | Validación, parsing defensivo, escepticismo | | | | 02 |
| D8.T1.a | Schema, tool_choice, paralelo/secuencial | | | | 02 |
| D8.T1.b | Descripciones, is_error | 4.4 | | | 02 |
| D8.T1.c | Dispatch; client vs server tools | | | | 02 |
| D8.T1.d | Aprobación; set de tools | | | | 07 |
| D8.T2.a | Autoría y despliegue MCP | | | | 06 |
| D8.T2.b | Tools / resources / prompts | 2.1 | | | 06 |
| D8.T2.c | stdio vs Streamable HTTP; cliente vs servidor | | | | 06 |
| D8.T3.a | Built-in vs custom vs Skills vs MCP | 4.1 | | | 06 |
| D8.T3.b | Elegir enfoque por caso | | | | 06 |
| D7.T1.a | Prompt injection directa/indirecta | | | | 07 |
| D7.T1.b | Jailbreaks, entrada no confiable | 3.2 | | | 07 |
| D7.T1.c | Fuga de datos, PII | | | | 07 |
| D7.T1.d | AuthN/AuthZ/confidencialidad/privacidad/integridad | | | | 07 |
| D7.T2.a | Capas de guardrails | 2.3 | | | 07 |
| D7.T2.b | Secure by design, IAM, mínimo privilegio | | | | 07 |
| D7.T3.a | Hooks como control de seguridad | 1.0 | | | 07 |
| D7.T4.a | Secretos y API keys | | | | 07 |
| D7.T4.b | Identidad y autenticación | 1.6 | | | 07 |
| D7.T4.c | Aprobación de accesos, auditoría | | | | 07 |
| D3.T1.a | Rules, Skills, Commands, Agents, Memory | | | | 06 |
| D3.T1.b | Sesión, slash commands, headless/stream/auto | 3.1 | | | 04, 06 |
| D3.T1.c | Jerarquía CLAUDE.md y settings.json | | | | 06 |
| D4.T1.a | Errores y recuperación | | | | 04 |
| D4.T1.b | Análisis de trazas | 2.6 | | | 04 |
| D4.T1.c | Integración vs modelo | | | | 04 |

Suma de pesos (control): 100.0

---

## CCAR-F — Claude Certified Architect – Foundations

Misma escala 0–3. Meta antes del examen: todo en ≥ 2, y en 3 todo A1 y A3 (47 % del examen).
Códigos `A<dominio>.<tarea>` = task statements oficiales (`00-examen/04-blueprint-ccar-f.md`, `app/data/blueprints.js`).
Para practicar un objetivo: app → pestaña *Blueprint* → botón *drill* de esa tarea. El peso va en la primera fila de cada dominio.

| Objetivo | Descripción corta | Peso | Antes | Después | Lab |
|---|---|---|---|---|---|
| A1.1 | Loop agéntico guiado por stop_reason (tool_use vs end_turn) | 27 | | | 02 |
| A1.2 | Orquestación coordinador–subagentes (hub-and-spoke) |  | | | 05 |
| A1.3 | Invocar subagentes (Task) y pasarles el contexto completo |  | | | 05 |
| A1.4 | Enforcement programático (hooks, gates) vs guía por prompt |  | | | 07 |
| A1.5 | Hooks del Agent SDK (PreToolUse/PostToolUse), normalización |  | | | 07 |
| A1.6 | Pipeline fijo (prompt chaining) vs descomposición adaptativa |  | | | 05 |
| A1.7 | Sesiones: --resume <nombre>, fork_session |  | | | — |
| A2.1 | Descripciones de tools como mecanismo de selección | 18 | | | 02 |
| A2.2 | Errores estructurados (isError, errorCategory) |  | | | 02, 06 |
| A2.3 | Distribución de tools por subagente y tool_choice |  | | | 05 |
| A2.4 | Integración MCP: .mcp.json de proyecto vs usuario, variables de entorno |  | | | 06 |
| A2.5 | Built-ins correctos: Grep, Glob, Read/Write |  | | | — |
| A3.1 | Jerarquía de CLAUDE.md y @import | 20 | | | 06 |
| A3.2 | Slash commands y skills: alcance proyecto vs usuario, context: fork |  | | | 06 |
| A3.3 | Reglas por ruta (.claude/rules/ con paths) |  | | | 06 |
| A3.4 | Plan mode vs ejecución directa |  | | | — |
| A3.5 | Refinamiento iterativo con 2–3 ejemplos entrada/salida |  | | | 02 |
| A3.6 | CI/CD: claude -p, --output-format json, --json-schema |  | | | 04 |
| A4.1 | System prompts con criterios explícitos | 20 | | | 02 |
| A4.2 | Few-shot: 2–4 ejemplos dirigidos |  | | | 02 |
| A4.3 | Salida estructurada vía tool use y tool_choice |  | | | 02 |
| A4.4 | Validación, reintento con errores específicos |  | | | 02 |
| A4.5 | Batches: 50 % más barato, hasta 24 h; latencia vs costo |  | | | 03 |
| A4.6 | Revisión multi-instancia (no auto-revisión) |  | | | 04 |
| A5.1 | Ventana de contexto: bloque persistente de hechos del caso | 15 | | | 05 |
| A5.2 | Escalamiento y ambigüedad: disparadores explícitos |  | | | 07 |
| A5.3 | Propagación de errores en multi-agente |  | | | 05 |
| A5.4 | Exploración de codebase y degradación en sesiones largas |  | | | 05 |
| A5.5 | Revisión humana y calibración de confianza |  | | | 04 |
| A5.6 | Procedencia y síntesis multi-fuente (claim → fuente) |  | | | 05 |

Suma de pesos CCAR-F (control): 100
