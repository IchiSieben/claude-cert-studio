# Blueprint del CCAR-F — Claude Certified Architect – Foundations

> Transcripción del *Exam Guide* oficial v1.0 (julio 2026), obtenido del PDF público de Partner Academy el 2026-09-26. 60 ítems · 120 min · 720/1000 · $125 · vigencia 12 meses · Pearson VUE (online o centro). Elegibilidad: hoy solo organizaciones del Partner Network con correo corporativo (Pearson VUE y la FAQ lo confirman).
> Códigos `A#.#` para no chocar con los `D#.T#.x` del CCDV-F. La app (`../app/`) usa los mismos números.

Perfil que pide la guía: "6+ meses construyendo con Claude APIs, Agent SDK, Claude Code y MCP", con experiencia en agentes, configuración de Claude Code, diseño de MCP, prompt engineering, contexto, CI/CD y patrones de escalamiento. Es, punto por punto, el orquestador: el examen te evalúa lo que ya haces; lo que falta es el vocabulario exacto y los criterios de decisión.

## Pesos

```
A1 Agentic Architecture & Orchestration   ███████████████████████████░░░  27 %  ≈16 ítems
A3 Claude Code Configuration & Workflows  ████████████████████░░░░░░░░░░  20 %  ≈12
A4 Prompt Engineering & Structured Output ████████████████████░░░░░░░░░░  20 %  ≈12
A2 Tool Design & MCP Integration          ██████████████████░░░░░░░░░░░░  18 %  ≈11
A5 Context Management & Reliability       ███████████████░░░░░░░░░░░░░░░  15 %  ≈9
```

A1 + A3 = 47 %: loops, subagentes, hooks, handoff, sesiones, CLAUDE.md, skills, rules, plan mode, `claude -p`. Exactamente el kit.

## A1 · Agentic Architecture & Orchestration — 27 %

- **1.1 Agentic loops.** Conocimiento: ciclo enviar → inspeccionar `stop_reason` (`tool_use` vs `end_turn`) → ejecutar tools → devolver resultados. Habilidad: loop que continúa en `tool_use` y termina en `end_turn`. *Trampa:* decidir por el texto ("DONE"), topes de iteración como salida principal, asumir que texto = terminó (Claude devuelve texto junto a bloques `tool_use`).
- **1.2 Multi-agent orchestration.** Hub-and-spoke: el coordinador maneja toda la comunicación entre subagentes, errores y ruteo; analiza la consulta y elige dinámicamente qué subagentes invocar.
- **1.3 Subagent invocation & context passing.** El Task tool es el mecanismo para lanzar subagentes; `allowedTools` debe incluir `Task`. Incluir los hallazgos completos de agentes previos directamente en el prompt del subagente (no "ver arriba").
- **1.4 Workflow enforcement & handoff.** Diferencia entre enforcement programático (hooks, gates de prerequisito que bloquean tool calls) y guía por prompt. Si hay consecuencia, gate.
- **1.5 Agent SDK hooks.** `PostToolUse` para interceptar resultados y normalizar formatos heterogéneos; `PreToolUse` para bloquear.
- **1.6 Task decomposition.** Pipeline fijo secuencial (prompt chaining) vs descomposición dinámica adaptativa; elegir según variabilidad de la entrada.
- **1.7 Session state & resumption.** `--resume <nombre>` para continuar sesiones nombradas; `fork_session` para ramas independientes.

## A2 · Tool Design & MCP Integration — 18 %

- **2.1 Tool interface design.** La descripción es el mecanismo principal de selección de tool; diferenciar propósito, entradas y salidas. La solución a un misrouting es una mejor descripción, no un clasificador.
- **2.2 Structured error responses.** Flag `isError` de MCP; metadatos estructurados (`errorCategory`: transient / validation / permission) para que el agente sepa si reintentar, corregir o escalar.
- **2.3 Tool distribution & tool_choice.** Demasiadas tools degradan la selección; cada subagente recibe solo las de su rol. `tool_choice` auto / any / tool / none.
- **2.4 MCP server integration.** Alcance: `.mcp.json` de proyecto (compartido por el equipo, versionado, con expansión de variables de entorno) vs nivel usuario (`~/.claude.json`).
- **2.5 Built-in tools.** Grep = contenido; Glob = rutas por patrón; Read/Write = archivos completos. Elegir el correcto según la pregunta.

## A3 · Claude Code Configuration & Workflows — 20 %

- **3.1 CLAUDE.md hierarchy & modularity.** Usuario (`~/.claude/CLAUDE.md`), proyecto, directorio; `@import` para incluir archivos de estándares; diagnosticar conflictos de jerarquía. Settings: enterprise > user > project; el CLAUDE.md del directorio de trabajo siempre entra.
- **3.2 Slash commands & skills.** `.claude/commands/` de proyecto (versionado) vs usuario; `context: fork` para aislar una skill del contexto principal.
- **3.3 Path-specific rules.** `.claude/rules/*.md` con frontmatter YAML `paths:` (globs) para cargar convenciones solo donde aplican.
- **3.4 Plan mode vs ejecución directa.** Plan mode para cambios grandes o con implicancias arquitectónicas; directo para cambios chicos y acotados.
- **3.5 Iterative refinement.** 2–3 ejemplos concretos entrada/salida comunican una transformación mejor que cualquier descripción.
- **3.6 CI/CD.** `claude -p` (no interactivo), `--output-format json`, `--json-schema` para salida validable en pipelines.

## A4 · Prompt Engineering & Structured Output — 20 %

- **4.1 System prompts con criterios explícitos.** Criterios específicos y medibles reducen falsos positivos. *Ejemplo de la guía:* "review this code, be conservative, only report high-confidence findings" es vago; "flag comments only when the claimed behaviour contradicts the actual code; report bugs and security vulnerabilities; skip style preferences and local patterns" es un criterio.
- **4.2 Few-shot.** 2–4 ejemplos dirigidos a los casos ambiguos; es la técnica más efectiva para formato consistente.
- **4.3 Structured output via tool use.** Definir una tool de extracción con JSON schema y forzar `tool_choice: any` / `tool` garantiza salida conforme al schema.
- **4.4 Validation, retry & feedback loops.** Reintentar adjuntando el documento original **y** los errores de validación específicos.
- **4.5 Batch processing.** Message Batches API: 50 % más barato, hasta 24 h; elegir modo según la latencia que el flujo tolera.
- **4.6 Multi-instance / multi-pass review.** El auto-review conserva el contexto de generación; usar una segunda instancia independiente para revisar.

## A5 · Context Management & Reliability — 15 %

- **5.1 Context window management.** La sumarización progresiva degrada valores numéricos, porcentajes y fechas; extraer hechos transaccionales a un bloque persistente de "case facts" que se antepone a cada prompt. *Distractores típicos:* "agrandar la ventana", "pedirle al modelo que preserve los números".
- **5.2 Escalation & ambiguity.** Disparadores explícitos (el cliente pide un humano, excepción o vacío de política) con ejemplos few-shot en el system prompt.
- **5.3 Error propagation multi-agente.** Contexto de error estructurado (tipo de falla, consulta intentada, resultados parciales) para que el coordinador se recupere con inteligencia.
- **5.4 Codebase exploration & degradation.** Las sesiones largas dan respuestas inconsistentes; subagentes por pregunta y archivos de scratchpad.
- **5.5 Human review & confidence calibration.** La precisión agregada oculta fallas por tipo; muestreo aleatorio estratificado de extracciones de alta confianza.
- **5.6 Provenance & multi-source synthesis.** La atribución se pierde al comprimir; exigir a los subagentes un mapeo estructurado afirmación → fuente.

## Mapa CCAR-F ↔ lo que ya tienes

| Task | Dónde lo practicas hoy |
|---|---|
| 1.1, 1.6 | signal-agent (loop), Chasqui (pipeline fijo) |
| 1.2, 1.3, 2.3 | orquestador: carriles `mecanico/operario/redactor/investigador/profundo`, reviewer con tools acotadas |
| 1.4, 1.5 | hooks `session-drift-warn`, `precompact-draft`, `log-tool-failure`; regla "handoff antes de clear" (hoy es prompt: candidato a gate) |
| 1.7 | `--resume`, HANDOFF.md, `/kickoff` |
| 2.1, 2.2, 2.4 | MCP openmetadata / oracle-sqlcl (Desktop), lab-06 MCP sintético |
| 3.1–3.6 | todo el kit: CLAUDE.md de 70 líneas, `rules/`, skills, `claude -p` en tests |
| 4.1–4.6 | `reviewer.md` (rúbrica forzada), xreview, batch en Chasqui |
| 5.1–5.6 | `context-hygiene.md`, thresholds, Bitácora, `/ahora` |

## Muestras oficiales (estilo, no contenido)

La guía trae ejemplos de pregunta: escenario de producción, una restricción dominante, cuatro opciones plausibles, frecuentemente "¿qué está MAL en este enfoque?". Las respuestas correctas nombran la primitiva de plataforma (stop_reason, tool_choice, hooks, `.mcp.json`, `paths:`, `--json-schema`, Batches, case facts); los distractores son parches de parámetro, prompts donde hace falta enforcement, "más contexto" y mitos. La app etiqueta cada distractor con uno de esos diez tipos.
