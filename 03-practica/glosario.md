# Glosario EN → ES (términos como aparecen en el examen)

El examen es en inglés. Aquí el término tal como lo verás, su equivalente y una definición de una línea. Ordenado alfabéticamente.

| Término (EN) | ES / definición |
|---|---|
| **Adaptive thinking** | Razonamiento cuyo esfuerzo modula el propio modelo según la dificultad. |
| **Agent** | Sistema donde el LLM dirige dinámicamente su proceso y uso de tools. |
| **Agent SDK (Claude Agent SDK)** | Librería con el loop de Claude Code (tools built-in, permisos, hooks, subagentes). |
| **Agentic dispatch** | El modelo decide qué tool llamar y cuándo, sin ruta fija. |
| **Backoff (exponential, with jitter)** | Reintento con esperas crecientes y aleatorias; respuesta a 429/529. |
| **Batch (Message Batches API)** | Procesamiento asíncrono en ≤ 24 h con 50 % de descuento. |
| **Breaking change** | Cambio de versión de modelo que altera comportamiento en el que dependías. |
| **Cache breakpoint / `cache_control`** | Marca que indica hasta dónde cachear el prefijo del prompt. |
| **Checkpoint caching** | Cachear el último turno de una conversación para reutilizar el historial. |
| **Citations** | Referencias a pasajes exactos de documentos en la respuesta. |
| **Client-side tool** | Tool que ejecuta tu código. |
| **Compaction** | Resumir el historial para liberar contexto y continuar. |
| **Content boundary** | Separación explícita entre instrucciones confiables y datos no confiables. |
| **Context editing** | Eliminación automática de resultados de tools antiguos del contexto. |
| **Context engineering** | Curar qué tokens entran, salen y permanecen en el contexto durante todo el ciclo. |
| **Context rot** | Caída de precisión al crecer el contexto, aunque quepa. |
| **Context window** | Máximo de tokens (entrada + salida) por llamada. |
| **Evaluator-optimizer** | Patrón: un LLM genera, otro evalúa, se itera. |
| **Extended thinking** | Razonamiento explícito con presupuesto (`budget_tokens`) antes de responder. |
| **Few-shot** | Ejemplos entrada→salida en el prompt. |
| **Files API** | Subir archivos una vez y referenciarlos por `file_id`. |
| **Guardrail** | Control que restringe entradas, acciones o salidas; en capas. |
| **Headless mode** | Claude Code sin interfaz: `claude -p`. |
| **Hook** | Código ejecutado en un evento del ciclo del agente (`PreToolUse`, etc.). |
| **Human-in-the-loop / approval** | Aprobación humana antes de acciones sensibles. |
| **Idempotency** | Repetir una operación no produce efectos duplicados. |
| **Interleaved thinking** | Pensar entre llamadas a tools dentro de un turno. |
| **`is_error`** | Marca en `tool_result` de que la herramienta falló. |
| **Jailbreak** | Intento de que el modelo viole sus políticas. |
| **JSON-RPC 2.0** | Protocolo de mensajes de MCP. |
| **Just-in-time retrieval** | Cargar contexto bajo demanda con tools, no todo al inicio. |
| **Least privilege** | Mínimo privilegio: cada componente solo con los permisos que necesita. |
| **LLM-as-judge** | Usar un modelo para evaluar salidas con una rúbrica. |
| **Managed settings** | Configuración impuesta por la organización; máxima prioridad. |
| **`max_tokens`** | Tope de tokens de salida; obligatorio. |
| **MCP (Model Context Protocol)** | Estándar abierto cliente–servidor para conectar LLMs con tools/datos. |
| **MCP host / client / server** | App anfitriona / conector por servidor / proveedor de capacidades. |
| **Memory tool** | Tool de archivos para memoria persistente del modelo. |
| **Orchestrator-workers** | Patrón: un LLM descompone dinámicamente y delega a workers. |
| **Output handling** | Validar, parsear y desconfiar de la salida del modelo. |
| **Parallel tool use** | Varios `tool_use` en un turno. |
| **Parallelization (sectioning / voting)** | Subtareas independientes en paralelo / varias corridas y voto. |
| **`pause_turn`** | `stop_reason` cuando un turno largo con server tools se pausa. |
| **Permission mode** | default · acceptEdits · plan · bypassPermissions. |
| **PII** | Información personal identificable. |
| **Plugin** | Paquete de skills + commands + agents + hooks + MCP para Claude Code. |
| **Prefill** | Empezar el turno del asistente para forzar formato. |
| **Progressive disclosure** | Cargar solo nombre/descripción de una skill; el cuerpo al necesitarlo. |
| **Prompt caching** | Reutilizar un prefijo de prompt ya procesado a menor costo. |
| **Prompt chaining** | Pasos secuenciales con gates programáticos. |
| **Prompt injection (direct / indirect)** | Instrucciones maliciosas vía usuario / vía datos que el agente lee. |
| **Rate limit (RPM / ITPM / OTPM)** | Límites por minuto de requests / tokens de entrada / tokens de salida. |
| **`refusal`** | `stop_reason` cuando el modelo rehúsa por seguridad. |
| **Resource (MCP)** | Datos de solo lectura por URI, controlados por la aplicación. |
| **Routing** | Clasificar la entrada y despachar a prompt/modelo especializado. |
| **Scaled score** | Puntaje escalado 100–1000; aprobación 720. |
| **Server-side tool** | Tool ejecutada por Anthropic dentro del turno (web search, etc.). |
| **Skill** | `SKILL.md` + archivos: conocimiento procedimental bajo demanda. |
| **Slash command** | Prompt reutilizable que el usuario invoca con `/`. |
| **SSE (Server-Sent Events)** | Streaming unidireccional sobre HTTP; lo usa la API. |
| **stdio** | Transporte MCP local por stdin/stdout. |
| **`stop_reason`** | Por qué terminó la generación. |
| **Streamable HTTP** | Transporte MCP remoto. |
| **Structured note-taking** | El agente persiste progreso en archivos fuera del contexto. |
| **Structured outputs** | Salida garantizada conforme a un JSON schema. |
| **Subagent** | Agente con contexto y tools propios al que se delega. |
| **System prompt** | Parámetro `system`: rol, reglas, formato. |
| **Tokens** | Unidad de texto para facturación y contexto. |
| **`tool_choice`** | auto · any · tool · none. |
| **Tool description** | Texto que guía al modelo sobre cuándo y cómo usar la tool. |
| **`tool_use` / `tool_result`** | Bloque de llamada del modelo / bloque de respuesta tuya. |
| **Trace** | Secuencia completa de turnos, tool calls y resultados de una ejecución. |
| **WebSocket** | Canal bidireccional persistente; no lo usa la Messages API. |
| **Workflow** | LLM y tools orquestados por rutas de código predefinidas. |
| **Workspace (Console)** | Aislamiento de keys, límites y uso por proyecto. |
| **Zero data retention** | Modalidad contractual sin retención de datos por Anthropic. |
