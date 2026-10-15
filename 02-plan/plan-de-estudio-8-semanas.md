# Plan de estudio — 8 semanas, estudiando construyendo

> Premisa: no hay horas de "estudio" separadas de las de programar. Cada semana tiene **un lab** que se hace en un proyecto tuyo real con Claude Code, **una lectura** corta de fuente primaria, y **un bloque de preguntas**. Estimado: 6–8 h/semana. Si tienes menos, prioriza el lab: es lo que fija.
> Reparto de esfuerzo según pesos: D2+D5 (50 %) ocupan 4 semanas; D1+D6+D8 (36 %) 2.5 semanas; D7+D3+D4 (14 %) 1 semana; repaso y mock 0.5.

## Antes de empezar (1 hora)

- [ ] Leer `00-examen/01-ficha-del-examen.md` y `03-estrategia-de-examen.md`.
- [ ] Copiar `02-plan/checklist-autoevaluacion.md` y marcar honestamente lo que ya dominas (columna "antes").
- [ ] Crear cuenta en anthropic.skilljar.com (gratis) y en la Console (para el Workbench y `usage`).
- [ ] Definir `ANTHROPIC_API_KEY` en variable de entorno de tu máquina de casa, con un límite de gasto bajo en la Console (US$ 10–20 para todo el plan alcanza si usas Haiku/Sonnet y Batches).
- [ ] Abrir esta carpeta en Claude Code: `cd Portfolio/claude-cert && claude`. El `CLAUDE.md` de la carpeta le explica cómo ayudarte a estudiar.

## Semana 1 — Messages API a fondo (D2.T3, D5.T1)

- **Lab 01** (`05-labs/lab-01-messages-api.md`): cliente mínimo → `stop_reason` completo → streaming → `count_tokens` → visión/PDF. En **Chasqui**: resumen ejecutivo del reporte diario.
- Lectura: docs *Messages API*, *Streaming*, *Extended thinking* (1 h).
- Curso: *Building with the Claude API* (skilljar), módulos 1–3.
- Preguntas: `03-practica/preguntas-practica.md` bloque D2 (1–10).
- Objetivos que cierras: D2.T3.a/c/d/e, D5.T1.a/b.

## Semana 2 — Tools, loop de agente y salida estructurada (D2.T3.b, D8.T1, D6.T3)

- **Lab 02** (`lab-02-tool-loop.md`): loop a mano con 2 tools, `is_error`, paralelo, `tool_choice` como schema, validación Pydantic con reintento. En **farmacias**: `normalizar_producto`.
- Lectura: docs *Tool use*, Anthropic *Writing tools for agents*.
- Curso: *Building with the Claude API*, módulos de tools.
- Preguntas: bloque D8 (26–31) + D6 (20–25).
- Cierras: D2.T3.b, D8.T1 completo, D6.T3.

## Semana 3 — Costo, caching y batch (D5.T4, D2.T3.f/h, D5.T3)

- **Lab 03** (`lab-03-caching-batch.md`): medir `usage` → cache_control en system → verificar `cache_read_input_tokens` → mismo lote por Batches → hoja de costo comparativa Haiku/Sonnet/Opus × realtime/batch/caché. En **Chasqui** (histórico 90 días) o **stt_whisper** (post-edición nocturna).
- Lectura: docs *Prompt caching*, *Batch processing*, *Pricing*, *Choosing a model*.
- Preguntas: bloque D5 (11–19).
- Cierras: D5.T3, D5.T4, D2.T3.f/h, D2.T1.

## Semana 4 — Fundamentos de ingeniería aplicados + configuración (D2.T4, D2.T5, D2.T6, D5.T2)

- **Lab 04** (`lab-04-produccion.md`): async con semáforo, manejo de 429/529, `max_retries`/timeouts, logging estructurado JSON con todos los campos de D4 §2, prompts versionados en `prompts/` con changelog, ID de modelo pinneado. En **signal-agent**.
- Lectura: docs *Errors*, *Rate limits*, *SDKs*; repasar SSE vs WebSocket.
- Preguntas: repetir bloque D2 completo (1–10) + D4 (40–42).
- Cierras: D2.T2, D2.T4, D2.T5, D2.T6, D5.T2, D4.
- **Checkpoint**: a esta altura tienes cubierto ~52 % del examen. Mock corto: 25 preguntas mezcladas de `preguntas-practica.md` en 50 min.

## Semana 5 — Agentes y contexto (D1, D6.T1)

- **Lab 05** (`lab-05-agente-sdk.md`): agente con Claude Agent SDK, `allowed_tools`, `max_turns`, hook `PreToolUse`; luego orchestrator-workers con subagentes y medición de tokens. En **archivador de videos propios** o **orquestador**.
- Lectura: Anthropic *Building Effective Agents* (obligatoria, 30 min) y *Effective context engineering for AI agents* (obligatoria, 30 min).
- Curso: *Introduction to subagents*, *Claude Code in Action*.
- Preguntas: bloque D1 (32–39).
- Cierras: D1 completo, D6.T1.

## Semana 6 — MCP y personalización (D8.T2, D8.T3, D3)

- **Lab 06** (`lab-06-mcp-server.md`): servidor MCP `mcp-estadistica` con FastMCP (3 tools, 1 resource, 1 prompt), stdio, registro en Claude Code y Desktop; luego Streamable HTTP. Skill `catalogo-datos`. Auditoría de **claude-kit** con la tabla built-in/custom/skill/MCP.
- Lectura: MCP spec (Architecture, Tools, Resources, Prompts, Transports), docs *Skills*, *Claude Code memory/settings*.
- Curso: *Introduction to MCP*, *Introduction to Agent Skills*.
- Preguntas: bloques D8 (26–31) y D3 (43–45).
- Cierras: D8.T2, D8.T3, D3.

## Semana 7 — Seguridad y hooks (D7)

- **Lab 07** (`lab-07-seguridad.md`): test adversarial de inyección en **pdf-redactor**; whitelist SQL + usuario read-only en el MCP; `permissions.deny` + hook `PreToolUse` en tu config global; pre-commit gitleaks en Portfolio; redacción de PII en logs de Chasqui.
- Lectura: docs *Mitigate jailbreaks*, *Claude Code security/IAM*, OWASP Top 10 LLM.
- Preguntas: bloque D7 (46–50).
- Extra: preparar la clase de OWASP-LLM para tu curso de ciberseguridad.
- Cierras: D7 completo.

## Semana 8 — Repaso y simulacro

- Releer `03-practica/flashcards.md` dos veces (20 min cada una).
- Rehacer todas las autoevaluaciones de `01-dominios/` sin mirar; anotar lagunas; leer solo esas secciones.
- **Mock completo cronometrado**: las 50 preguntas de `preguntas-practica.md` en 100 min + el mock gratuito de claudecertificationguide.com (CCAR-F, 60 preguntas: descuenta las de Claude Code puro). Meta: ≥ 80 %.
- Por cada error: anotar el *tipo de trampa* (`03-estrategia-de-examen.md` §3). Si un tipo se repite, ese es tu sesgo.
- Actualizar `checklist-autoevaluacion.md` columna "después".

## Track paralelo CCAR-F (Architect) — mismas 8 semanas

> No reemplaza nada de lo anterior: se monta sobre los mismos labs. El CCAR-F comparte ~80 % del terreno con el CCDV-F, pero pesa distinto: A1 (27 %) + A3 (20 %) = 47 %. Por eso arranca por ahí. Suma ~2 h/semana, casi todo drill en la app (`app/index.html`, selector **CCAR-F**) y marcar `checklist-autoevaluacion.md` §CCAR-F.

| Semanas | Dominios CCAR-F | Qué haces (encima del lab CCDV-F de esa semana) | Cierras |
|---|---|---|---|
| 1–2 | **A1** Agentic Architecture (27 %) + **A3** Claude Code Config (20 %) | Labs 01–02 ya ejercitan A1.1 (loop por `stop_reason`). Añade: en tu repo, un `CLAUDE.md` con `@import`, una regla `.claude/rules/` con `paths`, un comando de proyecto y una corrida `claude -p --output-format json`. Drill A1 y A3 en la app (≈ 25 preguntas/semana). | A1.1, A1.4, A1.5, A3.1–A3.6 |
| 3–4 | **A4** Prompt & Structured Output (20 %) + **A2** Tool Design & MCP (18 %) | Lab 03 cubre A4.5 (Batches); lab 04 cubre A4.6 (revisión con otra instancia). Añade: una tool con `tool_choice` forzado para salida estructurada y un reintento con los errores de validación; un `.mcp.json` de proyecto con variables de entorno. Drill A4 y A2. | A4.1–A4.6, A2.1–A2.5 |
| 5 | **A5** Context & Reliability (15 %) | Lab 05 (agentes y contexto) cubre A5.1, A5.3, A5.4. Añade: un bloque persistente de "hechos del caso" y un subagente que devuelva afirmaciones con su fuente (A5.6). Drill A5. Completa A1.2, A1.3, A1.6, A1.7 con el mismo lab. | A5.1–A5.6, resto de A1 |
| 6–8 | Mocks | Un **mock completo CCAR-F** por semana en la app (60 ítems, 120 min; la app prioriza preguntas que no salieron en mocks anteriores). Tras cada mock: drill del dominio más débil y de *Due today*. Anotar el tipo de trampa de cada error. Meta: ≥ 800 en el tercer mock. | Checklist CCAR-F en ≥ 2 |

## Después del plan (mantener hasta que puedas rendir)

- Cada nueva feature en tus proyectos: identificar qué objetivo del blueprint ejercita y anotarlo en el commit (`[CCDV-F D8.T1.b]`). Mantiene el vocabulario vivo sin horas extra.
- Una vez al mes: 20 preguntas al azar + revisar el changelog de docs.claude.com (modelos nuevos, betas graduadas). Las preguntas del examen se actualizan con la plataforma.
- Cuando una organización del Claude Partner Network te dé el correo corporativo: registrarte, hacer el prep track oficial (5 cursos), agendar a 2 semanas.

## Si solo tienes 3 semanas

Semana A: labs 01+02+03 (API, tools, costo). Semana B: labs 05+06 (agentes, MCP) + las dos lecturas de Anthropic. Semana C: lab 07 + flashcards + mock. Cubre ~85 % del peso.
