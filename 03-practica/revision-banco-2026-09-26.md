# Revisión del banco de preguntas — 2026-09-26

> Qué se hizo: las 240 preguntas (120 CCAR-F + 120 CCDV-F, generadas por Claude Code en la corrida desatendida) fueron contrastadas **una por una contra fuentes primarias**: documentación de la plataforma (platform.claude.com), documentación de Claude Code y del Agent SDK (code.claude.com), la especificación de MCP (modelcontextprotocol.io), el blog de ingeniería de Anthropic y el propio exam guide oficial. Siete revisores en paralelo (uno por bloque de dominios), cada uno con la orden de no marcar OK nada que no hubiera verificado. Las correcciones se aplicaron con script; el validador de esquema pasa.
>
> Qué NO se hizo: no se usaron foros ni Reddit para verificar hechos (no son fuente), y una búsqueda específica de reportes de gente que ya rindió no dio resultados útiles — el examen es solo para partners desde julio 2026 y hay muy pocos testimonios; el único de primera mano encontrado (Medium, alguien que aprobó el CCDV-F el 9 sep 2026) confirma el estilo "qué es lo sensato que haría un ingeniero aquí" con escenarios de prompts versionados, schemas de tools, ventanas de contexto, arquitecturas de agentes, API keys y CI. El resto de resultados son vendedores de simuladores.

## Resultado

| | Revisadas | OK | Corregidas (FIX) | Eliminadas (DROP) | Quedan |
|---|---|---|---|---|---|
| CCAR-F | 120 | 77 | 29 | 14 | **106** |
| CCDV-F | 120 | 76 | 36 | 8 | **112** |
| Total | 240 | 153 | 65 | 22 | 218 |

De las 22 eliminadas, 19 eran **duplicados casi literales** (mismo mecanismo, mismo escenario con otras palabras — el lote de 12 por dominio produjo pares -01/-03) y 3 tenían premisa imposible o dependían de un dato volátil. Ninguna OK se marcó por confianza: el criterio fue "afirmación verificable no verificada = CHECK", y al final no quedó ningún CHECK.

Distribución actual por dominio — CCAR-F: D1 31 · D2 15 · D3 24 · D4 24 · D5 12. CCDV-F: D1 17 · D2 39 · D3 4 · D4 3 · D5 15 · D6 13 · D7 10 · D8 11. El mock completo sigue pudiendo extraer 60/53 por peso; los dominios que quedaron cortos (CCAR-F D2 y D5) son los primeros a rellenar (ver §4).

## 1. Lo importante: la plataforma cambió después del exam guide v1.0

Esto es lo más útil que salió de la revisión, porque **el examen se escribió en julio 2026 y la documentación de septiembre ya dice otra cosa en varios puntos**. Regla para el examen: si una pregunta describe el mecanismo "viejo" tal como lo nombra el exam guide, responde según el exam guide; si describe un modelo o feature nuevo, responde según la doc. Y en un pre-screening, saber las dos versiones te distingue.

| Tema | Lo que dice el exam guide v1.0 (jul 2026) | Lo que dice la doc hoy (sep 2026) | Fuente |
|---|---|---|---|
| Salida estructurada | `tool_use` con JSON schema + `tool_choice: any` "garantiza" salida conforme al schema | Forzar `any`/`tool` garantiza la **llamada**, no la validez de los argumentos: eso lo da `strict: true` en la tool o **structured outputs** (`output_config` con json_schema, GA). Además `tool_choice` forzado se rechaza con 400 en algunos modelos nuevos y con extended thinking manual; la doc recomienda `auto` + strict, o structured outputs | platform: tool-use/strict-tool-use, structured-outputs, tool-use/overview |
| Subagentes | "El Task tool es el mecanismo; `allowedTools` debe incluir Task" | La herramienta se llama **Agent** (Task sigue como alias). `allowedTools` **pre-aprueba**, no restringe; lo que quita la capacidad de delegar es sacar Agent de la lista `tools` del agente | code.claude.com sub-agents, agent-sdk/subagents, agent-sdk/permissions |
| IDs de modelo | Pinnear IDs con fecha; alias = auto-actualizable | Para la generación 4.6+ los IDs sin fecha son **snapshots fijos**; los alias auto-actualizables solo existen para modelos anteriores a 4.6 | platform: models/model-ids-and-versions |
| Muestreo | `temperature`/`top_p`/`top_k` | **Deprecados**: valores no default devuelven 400 en modelos actuales; sigue siendo cierto que temperatura 0 nunca fue determinismo total | platform: api/messages |
| Thinking | `budget_tokens` | Deprecado/rechazado en modelos nuevos: **adaptive thinking + effort**; en algunos modelos el thinking no se puede apagar (se baja el effort). Los tokens de thinking cuentan contra `max_tokens` | platform: thinking, effort |
| CLAUDE.md en el Agent SDK | "El SDK no carga CLAUDE.md" | Lo carga **por defecto** cuando `settingSources` se omite; la distinción vale para el SDK cliente / Messages API | code.claude.com agent-sdk/claude-code-features |
| Jerarquía de CLAUDE.md | "El del subdirectorio manda" | Los archivos se **concatenan**; un conflicto se resuelve arbitrariamente. Verificar con `/context` qué se cargó | code.claude.com memory |
| Memoria | "Lo dicho en el chat no persiste" | **Auto memory** activada por defecto: notas y decisiones persisten entre sesiones | code.claude.com memory |
| Comandos vs skills | Dos cosas distintas | Los comandos se **fusionaron en skills**; ambos crean `/nombre`; `disable-model-invocation` los hace solo manuales | code.claude.com skills |
| Built-ins Grep/Glob | Herramientas por defecto | En macOS/Linux/WSL ya **no están en el set por defecto** (Bash find/grep); se restauran con `--tools`/`--allowedTools` o en la lista `tools` de un subagente. El exam guide aún los trata como built-ins | code.claude.com tools-reference |
| `.mcp.json` de proyecto | Compartido sin más | Sigue habiendo una **aprobación única** la primera vez; `${VAR}` se expande | code.claude.com mcp |
| MCP `isError` | "Error a nivel de protocolo" | Es un error de **ejecución de la tool dentro del resultado**; los errores de protocolo (tool desconocida, request malformado) van aparte | modelcontextprotocol.io spec |
| Caching en Batches | "Cache hit en cada request después del primero" | Best-effort (30–98 %); la doc recomienda TTL de 1 h para batches | platform: batch-processing |
| Fork de sesión | Aísla el trabajo | Bifurca el **historial de conversación, no el filesystem**; los archivos de sesión son locales a la máquina | code.claude.com agent-sdk/sessions |
| Cliente SDK | "No trae loop de agente" | Ahora trae un **tool runner** beta; hooks, permisos y sesiones siguen siendo solo del Agent SDK | platform: tool-runner |
| Frameworks | LangGraph, PydanticAI, Strands | La página actual de Building Effective Agents nombra Claude Agent SDK, Strands, Rivet y Vellum | anthropic.com/research/building-effective-agents |
| Few-shot | "2–4 ejemplos" | La doc dice "3–5 para mejores resultados"; no cambia respuestas | platform: multishot-prompting |
| Prompt injection | Página propia | El contenido se fusionó en mitigate-jailbreaks; la guía: contenido no confiable va en `tool_result`/`document`, nunca en system ni como texto de usuario | platform: mitigate-jailbreaks |
| Workbench | Consola "Workbench" | Retirado; ahora es **Playground** | platform: release notes |
| Managed Agents | — | Existe una oferta hosted (Managed Agents) además de self-hosted | platform: agent docs |

Las correcciones del banco mantienen la **lección del exam guide** (que es lo que puntúa) pero con redacción compatible con la doc actual: por ejemplo, las preguntas de `tool_choice` ahora dicen "en un modelo que soporta forced tool use" y explican `strict`.

## 2. Otros defectos corregidos (patrones)

- **Distractor también defendible** (el más grave en un examen): p. ej. "dividir tools genéricas en específicas" es una habilidad del exam guide, no un error; "poner el breakpoint de caché en el último mensaje" es un patrón documentado; "un linter" es una verificación recomendada. Se reemplazaron por opciones refutadas por la doc.
- **Premisa falsa**: "los built-ins no alcanzan APIs SaaS" (Bash puede hacer curl; WebFetch existe), "Read lee directorios", "un exit code 1 del hook bloquea" (solo el 2 bloquea), "la lista de stop_reason tiene cuatro valores" (hay siete).
- **Etiqueta de trampa equivocada** en ~10 opciones (p. ej. un mito etiquetado como violates-constraint). Corregido porque la app te enseña *por tipo*.
- **Razonamiento invertido** en why_wrong (reglas `deny` de settings: ningún nivel las anula; la razón real era el alcance).
- **Ocho ítems enseñaban "2–3 ejemplos"** donde la doc dice 3–5; anotado, no afecta la respuesta.

## 3. Tabla por ítem (solo FIX y DROP; las OK están en los findings)

| ID | Veredicto | Motivo principal |
|---|---|---|
| CCARF-1.1-02 | FIX | Explanation says stop_reason 'has four common values'; the Messages API reference enumerates seven (end_turn, max_tokens, stop_sequence, tool_use, pause_turn, refusal, model_context_window_exceeded), so 'four' is outdate |
| CCARF-1.3-01 | FIX | Stale tool name: current docs state the Task tool was renamed to Agent (Task still works as an alias); the SDK subagents page says 'Claude invokes subagents through the Agent tool' and its examples use allowed_tools=[... |
| CCARF-1.3-02 | FIX | why_wrong A says subagents 'do not share the parent's transcript at all'; current docs make one exception: 'The exception is a fork, which inherits the parent conversation instead of starting fresh'. The keyed answer sta |
| CCARF-1.7-01 | FIX | Option D ('Claude Code keeps the previous session's memory in the background regardless') is partly defensible today: the memory docs describe auto memory, on by default, in which Claude writes notes for itself across se |
| CCARF-1.7-02 | FIX | Stem requires that each attempt 'must NOT see the other's edits'; the sessions docs state 'Forking branches the conversation history, not the filesystem. If a forked agent edits files, those changes are real and visible  |
| CCARF-1.7-03 | DROP | Near-duplicate of CCARF-1.7-02: same scenario (long exploration of a codebase, then two competing refactoring strategies) and same mechanism (fork the session); only the cast changes (one architect vs two engineers). |
| CCARF-1.3-04 | FIX | Same defects as CCARF-1.3-01: the tool is now the Agent tool (Task kept as alias), and per the SDK permissions page a tool missing from allowedTools 'is still available to Claude' and 'tools like Agent ... don't ask befo |
| CCARF-1.5-04 | FIX | Explanation says PreToolUse 'is the only place a check can actually deny the call'; docs also let deny rules and a PermissionRequest hook block a call, so 'only' overstates. The core claim is verified: 'PostToolUse fires |
| CCARF-2.1-03 | FIX | Option B is defensible: the official exam guide lists 'Splitting generic tools into purpose-specific tools with defined contracts' as a task 2.1 skill, and the stem's tools (do_it, helper2, process) read as exactly the g |
| CCARF-2.2-01 | FIX | Keyed answer verified against the MCP spec: tool execution errors (API failures, input validation errors, business logic errors) 'are reported in tool results with isError: true', and 'Clients SHOULD provide tool executi |
| CCARF-2.3-02 | FIX | Keyed answers now depend on an unstated fact: the API docs' forcing-tool-use table says that for some newer models 'any and tool return a 400 error' (error text: tool_choice: type "tool" and "any" are not supported for t |
| CCARF-2.4-01 | FIX | Keyed answer verified: 'Local scope is the default' and is stored in ~/.claude.json; 'Project-scoped servers ... storing configurations in a .mcp.json file at your project's root directory ... Check .mcp.json into versio |
| CCARF-2.5-02 | FIX | Option C is mis-tagged: the tools reference says 'Read only reads files, not directories. Claude lists directory contents with a shell command such as ls', so 'Read the top-level directory listing and recursively Read ea |
| CCARF-2.1-04 | DROP | Near-duplicate of CCARF-2.1-01: same mechanism (two similar tools with indistinguishable descriptions, rewrite descriptions to state purpose/inputs/outputs) and two of three distractors identical (temperature, pre-classi |
| CCARF-2.2-03 | FIX | Terminology conflict with the MCP spec: option B and the explanation call isError 'protocol-level', but the spec classifies isError results as 'Tool Execution Errors' as opposed to 'Protocol Errors' (JSON-RPC errors for  |
| CCARF-2.2-04 | DROP | Near-duplicate of CCARF-2.2-01: same mechanism and scenario (error text embedded in a normal-looking result, fix by setting isError: true). Keep one of the pair; 2.2-01 is the stronger item because it also tests protocol |
| CCARF-2.2-05 | DROP | Near-duplicate of CCARF-2.2-02: identical mechanism and scenario (three failure causes, uniform isError, add errorCategory transient/validation/permission). Keep one of the pair. |
| CCARF-2.3-04 | FIX | Same model dependency as CCARF-2.3-02: the docs state that for some newer models tool_choice 'any' and 'tool' return a 400 error and recommend 'auto with strict tool use ... or structured outputs'; manual extended thinki |
| CCARF-2.4-03 | DROP | Near-duplicate of CCARF-2.4-01: same mechanism and scenario (server registered on one machine, teammates lack it, fix by committing project-scoped .mcp.json). Keep one of the pair. |
| CCARF-2.4-04 | DROP | Near-duplicate of CCARF-2.4-02: same mechanism and scenario (personal token in committed .mcp.json, fix with ${VAR} expansion). Keep one of the pair; the select-two format only splits the same answer into two halves. |
| CCARF-2.5-03 | DROP | Near-duplicate of CCARF-2.5-01: same mechanism and scenario (find a string across thousands of files, agent reads files one by one, fix with Grep). Keep one of the pair. |
| CCARF-2.5-04 | DROP | Near-duplicate of CCARF-2.5-02: same mechanism and scenario (enumerate files by exact name across a monorepo, fix with Glob). Keep one of the pair; this one is the cleaner item (all three distractors are doc-verified: Gr |
| CCARF-3.2-01 | FIX | Scope facts verified: .claude/commands/ is project-scoped and versioned; ~/.claude/commands/ is 'Personal single-file commands available in every project' (claude-directory page). |
| CCARF-3.1-03 | FIX | Keyed answer verified: CLAUDE.local.md = 'Personal project-specific preferences; add to .gitignore', shared with 'Just you (current project)'; ~/.claude/CLAUDE.md = 'Just you (all projects)'. |
| CCARF-3.1-04 | FIX | False premise: the stem and learn assume a subdirectory CLAUDE.md 'takes priority' over the root file. The docs say 'All discovered files are concatenated into context rather than overriding each other' and 'if two rules |
| CCARF-3.2-04 | FIX | Keyed answers verified: .claude/commands/ is project-scoped and versioned; ~/.claude/commands/ is 'Personal single-file commands available in every project'. |
| CCARF-3.3-03 | FIX | Keyed answer verified: '**/*.ts' style globs match 'in any directory' and 'Path-scoped rules trigger when Claude reads files matching the pattern'. |
| CCARF-3.3-04 | FIX | Duplicate: identical scenario and mechanism to CCARF-3.3-02 (paths: ['services/api/*.py'], top-level file matched, nested file ignored, fix is a ** segment). One of the pair must go; replaced this item's scenario with a  |
| CCARF-3.6-04 | FIX | Keyed mechanism verified: --allowedTools uses permission-rule syntax, Edit(src/**) allow rules are path-scoped, and in a -p run with no permission host 'these requests are denied either way' (anything that would prompt). |
| CCARF-4.2-02 | FIX | Verified: 'Examples are one of the most reliable ways to steer Claude's output format, tone, and structure.' |
| CCARF-4.3-01 | FIX | Overstated guarantee: the strict-tool-use doc says 'Without strict mode, Claude might return incompatible types ("2" instead of 2) or omit required fields'; the schema guarantee comes from strict: true ('guarantees Claud |
| CCARF-4.3-02 | FIX | Verified: 'auto allows Claude to decide whether to call any provided tools or not. This is the default value when tools are provided'; 'any' forces one of the tools, 'tool' forces a particular tool. Option A (single tool |
| CCARF-4.3-03 | FIX | Explanation claims tool_use 'is the only approach that guarantees schema compliance'; the docs give two guaranteed mechanisms (JSON outputs and strict tool use) and warn that non-strict tool inputs may have wrong types o |
| CCARF-4.3-04 | FIX | tool_choice facts verified: auto is the default and lets Claude 'decide whether to call any provided tools or not'; 'any'/'tool' force a call and suppress natural-language text before the tool_use block. |
| CCARF-4.6-03 | FIX | Keyed answer verified: 'A fresh context improves code review since Claude won't be biased toward code it just wrote.' |
| CCARF-5.1-02 | FIX | Tag mismatch: option A ('summarising every three turns') is tagged vague-guidance, but it is a cadence tweak and the why_wrong ('the interval is not the flaw') describes a parameter patch. Retag A as parameter-patch. |
| CCARF-5.6-01 | FIX | Keyed answer verified: exam guide task 5.6 knowledge 'source attribution is lost during summarization steps when findings are compressed' and skill 'Requiring subagents to output structured claim-source mappings' that th |
| CCARF-5.1-03 | DROP | Near-duplicate of CCARF-5.1-01: same mechanism and scenario (progressive summarisation corrupts identifiers and dates, fix with a verbatim case-facts block). Keep one of the pair. |
| CCARF-5.2-03 | DROP | Near-duplicate of CCARF-5.2-01: same mechanism and scenario (vague escalation clause, fix with explicit triggers plus worked examples). Keep one of the pair. |
| CCARF-5.3-02 | DROP | Near-duplicate of CCARF-5.3-01: same mechanism (subagent returns a generic failure string, fix with a structured error object of category, attempted query, partial results). Keep one of the pair; partial results are sepa |
| CCARF-5.4-02 | DROP | Exact twin of CCARF-5.4-01: same select-two, same four option types (bigger window, 'remember'/'be careful' reminder, subagent per question, scratchpad files) and same keyed pair. Keep one of the pair. |
| CCARF-5.5-03 | DROP | Near-duplicate of CCARF-5.5-01: same mechanism and scenario (high aggregate accuracy, confidence-only review queue, rare category confidently misclassified, fix with stratified sampling of high-confidence outputs per cat |
| CCARF-5.6-02 | DROP | Near-duplicate of CCARF-5.6-01: same mechanism and scenario (subagent prose findings merged into one narrative, provenance lost, fix with claim-to-source tagging preserved through the merge). Keep one of the pair. |
| CCDVF-1.3-03 | FIX | why_wrong C is false: Strands docs state the structured_output_model parameter 'manages the conversion, validation, and response processing automatically' using a Pydantic model, so Strands does provide Pydantic-validate |
| CCDVF-1.3-05 | FIX | LangGraph claims verified: 'low-level orchestration framework and runtime for building, managing, and deploying long-running, stateful agents', agents 'persist through failures and can run for extended periods, resuming  |
| CCDVF-1.3-06 | DROP | Near-duplicate of CCDVF-6.1-04: same mechanism (agent maintains a notes file and re-reads it), same keyed answer, near-identical learn text, and the same myth distractor about the model remembering on its own; Domain 1 a |
| CCDVF-2.3-04 | FIX | The stem hinges on the legacy manual thinking configuration (a 16,000-token budget_tokens with max_tokens 4,000): the extended-thinking doc now says thinking.type 'enabled' with budget_tokens is deprecated on some curren |
| CCDVF-2.4-02 | FIX | Keyed answer verified: 401 is authentication_error (API key malformed, revoked or expired); 529 is overloaded_error; a malformed request is 400 invalid_request_error; an unknown resource is 404 not_found_error, so 'a 400 |
| CCDVF-2.5-02 | FIX | The keyed pair is right in principle, but option A's remedy (uploaded text 'in the user turn, clearly delimited') is below the documented guidance: the mitigate-jailbreaks doc says to deliver third-party content 'inside  |
| CCDVF-2.6-01 | FIX | The keyed option A ('specific dated identifier') and the apply line ('model names without a date suffix ... an unplanned upgrade waiting to happen') are wrong for current models: the model-ids-and-versions doc says that  |
| CCDVF-2.3-05 | FIX | Near-duplicate of CCDVF-2.3-02: same scenario (tool list serialized in varying order) and same mechanism (unstable prefix before the breakpoint breaks the exact-match cache). The facts are correct (caching requires '100% |
| CCDVF-2.3-07 | FIX | Near-duplicate of CCDVF-2.4-03: same scenario (a retried request after a timeout produced a duplicate charge) and same keyed mechanism (idempotency key on the side effect). |
| CCDVF-2.3-08 | FIX | Keyed pair verified: the batch doc says 'All usage is charged at 50% of the standard API prices' and that cache_control is supported in batch requests. |
| CCDVF-2.5-05 | FIX | why_wrong B ('claude.ai has no such setting; the web chat interface is not built to be operated without someone present') is outdated: the help center says Claude Cowork scheduled tasks 'run remotely, so they run on thei |
| CCDVF-2.5-07 | FIX | Keyed option B ('force its use with tool_choice') is now model-dependent: the thinking doc states that the newest models 'reject forced tool use on every request with a 400 error' (tool_choice type any or tool), and the  |
| CCDVF-2.5-10 | DROP | Near-duplicate of CCDVF-2.5-06: identical mechanism (tags around untrusted text plus a system-prompt statement that tagged content is data), with 2.5-06 already carrying both halves in one option; 2.5-02 covers the other |
| CCDVF-2.5-11 | FIX | The stem says the job 'calls the Claude SDK directly', which is ambiguous, and option A's 'not by a direct SDK call' is false for the Agent SDK: the Agent SDK doc says 'When you omit settingSources, query() reads the sam |
| CCDVF-2.2-03 | FIX | Near-duplicate of CCDVF-2.2-01: same scenario (silent quality regression noticed only after a customer complaint), same concept string and same keyed mechanism (production logging plus a standing regression eval set). |
| CCDVF-2.1-04 | FIX | Near-duplicate of CCDVF-2.1-01: same mechanism (turn a one-line business ask into explicit requirements before building) and same concept string; distractor C ('Claude cannot be used for this') is implausible enough to b |
| CCDVF-2.6-03 | FIX | Keyed answer verified: managed settings are highest in precedence and 'nothing you set overrides it, apart from a few security-sensitive exceptions'; 'no other level, including command line arguments, can override a mana |
| CCDVF-3.1-01 | FIX | Keyed answer verified: memory docs say 'Files in subdirectories load on demand when Claude reads files in those directories' and 'CLAUDE.md and CLAUDE.local.md files in the directory hierarchy above the working directory |
| CCDVF-4.1-02 | FIX | Option D, explanation and learn reference the Console Workbench, which has been retired: release notes say 'The legacy Workbench ... in the Claude Console is being sunset' and 'Workbench is now playground in the Claude C |
| CCDVF-5.1-01 | FIX | Keyed claim verified: the API reference states 'Note that even with temperature of 0.0, the results will not be fully deterministic'. |
| CCDVF-5.1-03 | FIX | Keyed claim verified: 'the tokens Claude spends reasoning are billed as output tokens, even when the thinking text isn't returned to you, and they count toward max_tokens alongside the response text'; the usage object ex |
| CCDVF-5.3-01 | FIX | Option D is partially defensible: the Batch API does halve the price of the final step without touching its quality ('All usage is charged at 50% of standard API prices'), so the stem needs a superlative to make C the si |
| CCDVF-5.1-04 | FIX | Explanation overstates the endpoint: docs say 'The token count is an estimate. In some cases, the actual number of input tokens used when creating a message might differ by a small amount', and it returns input_tokens on |
| CCDVF-5.1-05 | DROP | Near-duplicate of CCDVF-5.1-01: same mechanism (temperature 0 is not a determinism guarantee, per 'Note that even with temperature of 0.0, the results will not be fully deterministic') and same keyed insight, only the wr |
| CCDVF-5.1-06 | FIX | Keyed pair holds: choosing-a-model lists 'Applications with tight latency requirements' and 'High-volume, straightforward tasks' as cases for a faster, more cost-effective model; thinking docs note faster time-to-first-t |
| CCDVF-5.2-04 | DROP | Near-duplicate of CCDVF-5.2-01: identical mechanism (official SDK wraps REST with headers, typed objects, retries, timeouts, streaming helpers) and the same hand-rolled-HTTP scenario; all its facts verify, but two items  |
| CCDVF-5.2-05 | DROP | Near-duplicate of CCDVF-5.2-03: same keyed insight (Messages API streams over SSE; the backend consumes the stream and relays it, keeping the key server-side) and the same frontend-wants-a-websocket scenario; facts verif |
| CCDVF-5.2-06 | DROP | Wrong premise: the SDK's automatic retry re-sends the failed HTTP request inside messages.create ('Certain errors are automatically retried 2 times by default'); it does not re-execute the application code around the cal |
| CCDVF-5.2-07 | FIX | Explanation and why_wrong A say the base SDK has 'no agent loop', but the client SDKs now ship a beta tool runner that 'handles the agentic loop' ('Runs tools when Claude calls them, Handles the request/response cycle, M |
| CCDVF-5.3-03 | DROP | Near-duplicate of CCDVF-5.3-01: same mechanism (route by difficulty, small model for simple volume, capable model reserved for hard cases, per 'Multi-model strategies pair a lower-cost model with a frontier model so that |
| CCDVF-5.4-03 | FIX | Option D is a documented working pattern, so it is defensible: 'In a growing conversation the final block works as long as each turn adds fewer than 20 blocks: earlier content never changes, so the next request's lookbac |
| CCDVF-6.2-01 | FIX | The stem's premise contradicts the docs: it blames rule-following failures on the rules sitting 'at the end of each user message, after the text to translate', but the prompting guide says 'Place your long documents and  |
| CCDVF-6.3-01 | FIX | Keyed option B is outdated and model-dependent: forcing a tool with tool_choice 'tool'/'any' is 'not supported' with manual extended thinking and returns a 400 error on the newest models (Opus 5.5, Fable 5.1, Mythos 5.1) |
| CCDVF-6.1-04 | FIX | Keyed answer verified: the context-engineering post's structured note-taking ('the agent regularly writes notes persisted to memory outside of the context window. These notes get pulled back into the context window at la |
| CCDVF-6.2-03 | FIX | Keyed answer verified: the guardrails page recommends 'JSON-encode untrusted content ... so an attacker cannot close a quote or tag to break out into an instruction context', and Claude Code's own subagent output scan ne |
| CCDVF-6.3-03 | FIX | Stem is factually wrong and internally inconsistent: a tool forced with tool_choice is not schema-enforced by the API unless strict: true is set ('Add strict: true ... to ensure Claude's tool calls always match your sche |
| CCDVF-7.4-01 | FIX | Facts verified: Anthropic's key best-practices article says to 'use different API keys for development, testing, and production environments', 'regularly rotate your API keys on a consistent schedule', 'revoke the key im |
| CCDVF-7.1-02 | FIX | Near-duplicate of 7.1-01: the keyed answer (untrusted-data framing plus least-privilege tools) and two of three distractors (stronger prompt sentence, most capable model) repeat 7.1-01's mechanism and traps, so a candida |
| CCDVF-7.1-03 | FIX | Near-duplicate of 7.2-01: same role-play jailbreak scenario, same keyed mechanism (an independent output check outside the generating conversation) and the same 'repeat the rule more forcefully' and 'larger model' distra |
| CCDVF-8.1-02 | DROP | Redundant: the is_error half repeats 8.1-04 (same keyed wording 'tool_result with is_error set and a message describing what went wrong') and the enforced-approval half repeats 8.1-03 and 7.1-01 option C, so the item add |
| CCDVF-8.2-01 | FIX | Transport facts verified: the MCP spec says 'In the stdio transport, the client launches the MCP server as a subprocess' and 'In the Streamable HTTP transport, the server operates as an independent process that can handl |
| CCDVF-8.3-02 | FIX | False premise in the keyed option and in why_wrong A: Claude Code's built-in Bash tool can reach arbitrary APIs; the security page says 'Commands that fetch content from the web such as curl and wget are not auto-approve |
| CCDVF-8.2-02 | FIX | Near-duplicate of 8.2-01: option B is the same stdio-to-Streamable-HTTP answer, and the stem is double-barrelled (transport plus resource-vs-tool), against the one-dominant-constraint rule. |
| CCDVF-8.3-03 | FIX | Keyed mechanism duplicates 8.3-01 (a Skill for a checklist plus script); the distinguishing value here is Skill-vs-CLAUDE.md loading, so the MCP distractor (A), which 8.3-01 already uses, is replaced with a Claude Code l |

Los findings completos (con todas las fuentes por ítem y el texto de reemplazo) están en `app/data/review/` — `*.findings.json` y `*.summary.md`.

## 4. Huecos a rellenar cuando se regeneren las plazas eliminadas (del exam guide)

- CCAR-F 2.4: descubrimiento de tools al conectar + recursos MCP. 5.1: "lost in the middle". 5.4: `/compact` y exportes de estado para recuperación. 5.6: estadísticas en conflicto y fechas de publicación.
- CCDV-F 5.2: WebSocket vs SSE con un escenario distinto a los que quedaron. 8.1: patrones de aprobación (ya cubierto en 8.1-03; solo si se quiere un segundo ángulo).
- Regla para los lotes nuevos: **un ítem por mecanismo por dominio**, nunca "dos por concepto" — fue la causa de los 19 duplicados.

## 5. Fuentes consultadas por los revisores (URLs realmente abiertas)

- https://anthropic-partners.skilljar.com/claude-certified-architect-foundations-certification (linked PDF: Claude Certified Architect - Foundations Exam Guide)
- https://code.claude.com/docs/en/agent-sdk/agent-loop
- https://code.claude.com/docs/en/agent-sdk/claude-code-features
- https://code.claude.com/docs/en/agent-sdk/hooks
- https://code.claude.com/docs/en/agent-sdk/hosting
- https://code.claude.com/docs/en/agent-sdk/overview
- https://code.claude.com/docs/en/agent-sdk/permissions
- https://code.claude.com/docs/en/agent-sdk/python
- https://code.claude.com/docs/en/agent-sdk/sessions
- https://code.claude.com/docs/en/agent-sdk/subagents
- https://code.claude.com/docs/en/agent-sdk/user-input
- https://code.claude.com/docs/en/best-practices
- https://code.claude.com/docs/en/claude-directory
- https://code.claude.com/docs/en/cli-reference
- https://code.claude.com/docs/en/context-window
- https://code.claude.com/docs/en/costs
- https://code.claude.com/docs/en/headless
- https://code.claude.com/docs/en/hooks
- https://code.claude.com/docs/en/hooks-guide
- https://code.claude.com/docs/en/managed-settings
- https://code.claude.com/docs/en/mcp
- https://code.claude.com/docs/en/memory
- https://code.claude.com/docs/en/permission-modes
- https://code.claude.com/docs/en/permissions
- https://code.claude.com/docs/en/plugins
- https://code.claude.com/docs/en/security
- https://code.claude.com/docs/en/sessions
- https://code.claude.com/docs/en/settings
- https://code.claude.com/docs/en/skills
- https://code.claude.com/docs/en/sub-agents
- https://code.claude.com/docs/en/tools-reference
- https://docs.langchain.com/oss/python/langgraph/overview
- https://docs.python.org/3/library/asyncio-task.html
- https://everpath-course-content.s3-accelerate.amazonaws.com/instructor%2F6nizmqk8tpzpfjvt6qmmav7rh%2Fpublic%2F1783542750%2FClaude+Certified+Architect+%E2%80%93+Foundations+Exam+Guide.pdf
- https://modelcontextprotocol.io/docs/getting-started/intro
- https://modelcontextprotocol.io/specification/latest/basic/transports
- https://modelcontextprotocol.io/specification/latest/basic/transports/stdio
- https://modelcontextprotocol.io/specification/latest/basic/transports/streamable-http
- https://modelcontextprotocol.io/specification/latest/server/index
- https://modelcontextprotocol.io/specification/latest/server/resources
- https://modelcontextprotocol.io/specification/latest/server/tools
- https://platform.claude.com/docs/en/about-claude/glossary
- https://platform.claude.com/docs/en/about-claude/model-deprecations
- https://platform.claude.com/docs/en/about-claude/models/choosing-a-model
- https://platform.claude.com/docs/en/about-claude/models/model-ids-and-versions
- https://platform.claude.com/docs/en/about-claude/models/overview
- https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview
- https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools
- https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls
- https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use
- https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview
- https://platform.claude.com/docs/en/agents-and-tools/tool-use/parallel-tool-use
- https://platform.claude.com/docs/en/agents-and-tools/tool-use/strict-tool-use
- https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-runner
- https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool
- https://platform.claude.com/docs/en/api/claude-on-amazon-bedrock
- https://platform.claude.com/docs/en/api/claude-on-vertex-ai
- https://platform.claude.com/docs/en/api/client-sdks
- https://platform.claude.com/docs/en/api/errors
- https://platform.claude.com/docs/en/api/handling-stop-reasons
- https://platform.claude.com/docs/en/api/messages
- https://platform.claude.com/docs/en/api/messages/create
- https://platform.claude.com/docs/en/api/rate-limits
- https://platform.claude.com/docs/en/build-with-claude/batch-processing
- https://platform.claude.com/docs/en/build-with-claude/claude-in-microsoft-foundry
- https://platform.claude.com/docs/en/build-with-claude/claude-on-amazon-bedrock
- https://platform.claude.com/docs/en/build-with-claude/context-windows
- https://platform.claude.com/docs/en/build-with-claude/effort
- https://platform.claude.com/docs/en/build-with-claude/extended-thinking
- https://platform.claude.com/docs/en/build-with-claude/files
- https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons
- https://platform.claude.com/docs/en/build-with-claude/pdf-support
- https://platform.claude.com/docs/en/build-with-claude/prompt-caching
- https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/be-clear-and-direct
- https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/chain-prompts
- https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
- https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/multishot-prompting
- https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview
- https://platform.claude.com/docs/en/build-with-claude/streaming
- https://platform.claude.com/docs/en/build-with-claude/structured-outputs
- https://platform.claude.com/docs/en/build-with-claude/thinking
- https://platform.claude.com/docs/en/build-with-claude/token-counting
- https://platform.claude.com/docs/en/build-with-claude/tool-use/overview
- https://platform.claude.com/docs/en/build-with-claude/vision
- https://platform.claude.com/docs/en/cli-sdks-libraries/sdks/python
- https://platform.claude.com/docs/en/cli-sdks-libraries/sdks/typescript
- https://platform.claude.com/docs/en/get-api-key
- https://platform.claude.com/docs/en/manage-claude/workspaces
- https://platform.claude.com/docs/en/release-notes/overview
- https://platform.claude.com/docs/en/test-and-evaluate/develop-tests
- https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks
- https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations
- https://pydantic.dev/docs/ai/overview/
- https://strandsagents.com/docs/user-guide/concepts/agents/interventions/human-in-the-loop/
- https://strandsagents.com/docs/user-guide/sdk/agents/session-management/
- https://strandsagents.com/docs/user-guide/sdk/agents/structured-output/
- https://strandsagents.com/docs/user-guide/sdk/model-providers/
- https://strandsagents.com/docs/user-guide/sdk/tools/custom-tools/
- https://support.claude.com/en/articles/11176164-use-connectors-to-extend-claude-s-capabilities
- https://support.claude.com/en/articles/13854387-schedule-recurring-tasks-in-claude-cowork
- https://support.claude.com/en/articles/9767949-api-key-best-practices-keeping-your-keys-safe-and-secure
- https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- https://www.anthropic.com/engineering/multi-agent-research-system
- https://www.anthropic.com/engineering/writing-tools-for-agents
- https://www.anthropic.com/research/building-effective-agents
