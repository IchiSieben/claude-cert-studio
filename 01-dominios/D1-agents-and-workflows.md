# D1 · Agents and Workflows — 14.7 % (~8 preguntas)

> Arquitectura de agentes (cuándo agente vs workflow, jerarquías), construcción con Claude (Agent SDK, loops a mano, hooks), patrones y frameworks (tool-use loops, subagentes, memoria, Strands/LangGraph/PydanticAI).
> Fuente doctrinal: Anthropic, *Building Effective Agents* (dic. 2024) y *Effective context engineering for AI agents* (sep. 2025). Si lees dos textos para este examen, que sean esos dos.

---

## 1. Workflow vs agente (D1.T1 — 4.5 %)

Definiciones de Anthropic (memorizar, el examen las usa tal cual):

- **Workflow**: sistema donde LLM y tools se orquestan por **rutas de código predefinidas**. Tú decides el orden.
- **Agente**: sistema donde el LLM **dirige dinámicamente su propio proceso y uso de tools**, decidiendo cómo llegar al objetivo. El loop decide el orden.

| Criterio | Workflow | Agente |
|---|---|---|
| Pasos conocidos de antemano | Sí | No (o varían mucho) |
| Predictibilidad / auditabilidad | Alta | Menor |
| Costo y latencia | Acotados | Abiertos (hay que poner límites) |
| Cuándo | Pipelines de datos, extracción, clasificación, generación con estructura fija | Tareas abiertas: investigar, depurar, navegar, resolver tickets con muchos caminos |

Regla de Anthropic: **empieza con la solución más simple**; solo sube a agente cuando el workflow no alcanza. Muchas preguntas "¿qué patrón?" se responden con "esto es un workflow, no necesitas un agente".

### 1.1 Los cinco patrones de workflow

1. **Prompt chaining** — pasos secuenciales, cada salida alimenta la siguiente, con *gates* (validaciones programáticas) entre pasos. Ej.: generar → validar esquema → traducir.
2. **Routing** — clasificar la entrada y mandarla a un prompt/modelo especializado. Ej.: Haiku decide si un ticket es facturación/técnico/otro; cada tipo tiene su prompt y modelo.
3. **Parallelization** — *sectioning* (partir la tarea en subtareas independientes y correr en paralelo) o *voting* (correr lo mismo varias veces y votar). Ej.: revisar un PR con tres prompts distintos a la vez; 3 evaluaciones de seguridad y quedarse con la mayoría.
4. **Orchestrator-workers** — un LLM central descompone dinámicamente la tarea y delega a workers; luego sintetiza. Diferencia con parallelization: aquí las subtareas **no se conocen de antemano**.
5. **Evaluator-optimizer** — un LLM genera, otro evalúa con criterios claros, se itera. Ej.: traducción con crítico; búsqueda que refina la consulta.

### 1.2 Jerarquías manager/supervisor y roles de subagentes

- **Coordinador** (manager/supervisor): recibe el objetivo, planifica, despacha subagentes, sintetiza. Tiene el contexto global, pero **no** el detalle de cada subtarea.
- **Subagentes**: contexto propio, aislado, tools acotadas, objetivo estrecho. Devuelven un resultado condensado (no su transcript entero).
- Punto que el examen martilla: **el subagente no hereda automáticamente el contexto del coordinador** — lo que necesita saber se le pasa explícitamente en su prompt; y lo que aprende vuelve solo como su respuesta final. Ventajas: aislamiento de contexto (D6.T1), paralelismo, especialización. Costo: más tokens totales, coordinación.

---

## 2. Construir agentes con Claude (D1.T2 — 5.3 %)

### 2.1 El loop de agente a mano (con la Messages API)

```
prompt inicial + tools
  ┌────────────────────────────────────────────┐
  │ llamar al modelo                            │
  │ stop_reason == tool_use ? → ejecutar tools, │
  │   añadir tool_results, volver a llamar      │
  │ stop_reason == end_turn ? → terminar        │
  │ max_tokens / refusal ? → manejar            │
  │ turnos > límite ? → abortar con resumen     │
  └────────────────────────────────────────────┘
```

Elementos que un loop de producción **debe** tener (preguntas de "¿qué le falta a este agente?"):
- Límite de iteraciones y de presupuesto (tokens/costo/tiempo).
- Manejo de todos los `stop_reason`, no solo `tool_use`.
- Errores de tools devueltos con `is_error: true` para que el modelo se recupere.
- Aprobación humana para acciones irreversibles (D8.T1.d).
- Log de cada paso (D4).
- Poda/compactación del historial cuando crece (D6.T1).

### 2.2 Claude Agent SDK

Es el mismo motor que corre Claude Code, expuesto como librería (Python `claude-agent-sdk`, TypeScript `@anthropic-ai/claude-agent-sdk`). Te da el loop, las tools built-in (Read, Write, Edit, Bash, Grep, Glob, WebFetch, WebSearch…), permisos, hooks, subagentes, skills, MCP y gestión de contexto (compactación automática) sin escribirlos.

```python
from claude_agent_sdk import query, ClaudeAgentOptions

async for msg in query(
    prompt="Revisa los tests que fallan en ./tests y propón el fix",
    options=ClaudeAgentOptions(
        allowed_tools=["Read", "Grep", "Glob", "Bash(pytest*)"],
        permission_mode="acceptEdits",
        system_prompt="Eres un ingeniero de datos senior...",
        max_turns=20,
        cwd="/ruta/al/proyecto",
    ),
):
    print(msg)
```

Cuándo usarlo vs loop a mano vs API cruda:

| Necesitas… | Usa |
|---|---|
| Un agente que opera sobre archivos/terminal/repos con permisos y hooks | Agent SDK |
| Un loop mínimo con 2–3 tools de tu dominio, control total, sin filesystem | Messages API + loop propio (o `tool_runner` del SDK) |
| Solo generación/extracción sin tools | Messages API |

Modelos de despliegue: proceso local (CLI/SDK en tu máquina o servidor), headless en CI (GitHub Actions), contenedor con Agent SDK como servicio, o vía la nube del proveedor. Cada uno cambia dónde viven las credenciales y quién aprueba acciones.

### 2.3 Hooks para acciones determinísticas

Un **hook** es código (shell/HTTP) que se ejecuta en un evento del ciclo del agente (`PreToolUse`, `PostToolUse`, `UserPromptSubmit`, `Stop`, `SubagentStop`, `SessionStart`, `SessionEnd`, `PreCompact`, `Notification`). Un `PreToolUse` puede **bloquear** la tool (exit code 2 / decisión `deny`).

Principio de examen: **lo que debe pasar siempre, o no pasar nunca, va en un hook o en código, no en el prompt.** Formatear con `black` tras cada edición, bloquear `rm -rf`, exigir ticket antes de tocar producción, registrar cada llamada a tool → hooks. "Por favor no borres archivos" en el `CLAUDE.md` → sugerencia, no garantía. Detalle de eventos y formato en D3 y D7.T3.

---

## 3. Patrones y frameworks (D1.T3 — 4.9 %)

### 3.1 Memoria y gestión de contexto en agentes

- **Memoria de trabajo** = la ventana de contexto. Finita; el agente la llena con salidas de tools.
- **Memoria persistente** = archivos/DB fuera del contexto: notas estructuradas que el agente escribe y relee (`NOTES.md`, `memory/` — Claude Code lo hace con *agent memory*), vectores para recuperación, o un tool de memoria.
- Técnicas de Anthropic para agentes largos: **compactación** (resumir el historial y seguir), **structured note-taking** (el agente escribe progreso en un archivo), **sub-agent architectures** (cada subagente con contexto limpio), **just-in-time retrieval** (cargar solo lo que se necesita cuando se necesita, no todo al inicio). Ampliado en D6.T1.

### 3.2 Frameworks que el blueprint nombra

| Framework | Qué es | Cuándo tiene sentido |
|---|---|---|
| **Strands Agents** (AWS) | SDK de agentes model-driven: defines modelo + tools + prompt, el framework corre el loop; integra con Bedrock y MCP | Equipos en AWS, agentes con muchas tools, multi-agente |
| **LangGraph** | Orquestación como **grafo de estados** (nodos = pasos, aristas = transiciones, estado compartido, checkpoints) | Workflows complejos con ramas, ciclos, human-in-the-loop y reanudación |
| **PydanticAI** | Agentes en Python con **tipado y validación Pydantic** de entradas/salidas, inyección de dependencias | Cuando la salida estructurada y el tipado estricto son el centro; gente que ya vive en Pydantic/FastAPI |

Postura de Anthropic (y del examen): los frameworks ayudan a arrancar pero **añaden capas que ocultan los prompts y respuestas**; entiende primero el loop crudo, y cuando uses un framework, sabe qué hace por debajo. Muchas preguntas premian "usa el patrón simple directo sobre la API" frente a "mete un framework".

---

## 4. Aplicarlo en tus proyectos

| Proyecto | Ejercicio | Objetivos |
|---|---|---|
| **signal-agent** (ledger de predicciones, 163 tests) | Clasifica tu arquitectura actual con los términos de Anthropic: ¿es un workflow (chaining + routing) o un agente? Documenta en su README el patrón y por qué. Luego implementa un **evaluator-optimizer**: un modelo redacta la señal, otro la evalúa contra tu rúbrica de falsabilidad, máx. 2 iteraciones. | D1.T1, D1.T3 |
| **orquestador** | Convertirlo en un **orchestrator-workers** explícito: coordinador con Sonnet que descompone; workers Haiku con contexto aislado; síntesis final. Medir tokens totales vs la versión monolítica. | D1.T1.b, D6.T1.c |
| **Chasqui** | Es un workflow puro (pasos fijos). Añadir *gates* programáticos entre pasos (validar Excel antes de generar PPT). Explicar por escrito por qué **no** debe ser un agente. | D1.T1.a |
| **archivador de videos propios** | Agente pequeño con Agent SDK: "transcribe (tu stt_whisper como tool), clasifica y archiva" con `max_turns`, `allowed_tools` restringidas y un `PreToolUse` que bloquee escrituras fuera de la carpeta del archivo. | D1.T2 |
| **claude-kit** | Documentar tus subagentes (`mecanico`, `operario`, `redactor`, `investigador`, `profundo`) como jerarquía supervisor/workers: qué contexto recibe cada uno y qué devuelve. Ese doc es literalmente material de D1.T1.b. | D1.T1.b |
| **Plataforma de datos públicos (datos sintéticos)** | Diseñar (solo diseño) el Text2SQL como routing: Haiku clasifica intención → SQL generator → validador de SQL (gate) → ejecutor con solo-lectura. Justificar workflow vs agente. | D1.T1 |

## 5. Autoevaluación

1. Define workflow y agente en una frase cada uno.
2. Diferencia entre parallelization (sectioning) y orchestrator-workers.
3. ¿Qué contexto tiene un subagente al arrancar? ¿Qué devuelve?
4. Cinco cosas que debe tener un loop de agente en producción.
5. ¿Cuándo Agent SDK y cuándo loop propio con la Messages API?
6. ¿Qué garantiza un hook que no garantiza un prompt?
7. Para qué sirve LangGraph que no te da un loop simple.
8. Un ticket de soporte llega, hay que clasificarlo, buscar en la base de conocimiento, redactar respuesta y escalar si hay reembolso > $100. ¿Workflow o agente? Dibuja el patrón.
9. ¿Qué es evaluator-optimizer y cuál es su riesgo de costo?
10. ¿Qué es structured note-taking y por qué ayuda en tareas largas?

## 6. Fuentes

- Anthropic, *Building Effective Agents*: https://www.anthropic.com/research/building-effective-agents
- Anthropic, *Effective context engineering for AI agents*: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- Anthropic, *How we built our multi-agent research system*: https://www.anthropic.com/engineering/multi-agent-research-system
- Claude Agent SDK: https://docs.claude.com/en/api/agent-sdk/overview
- Subagentes en Claude Code: https://docs.claude.com/en/docs/claude-code/sub-agents
- Hooks: https://docs.claude.com/en/docs/claude-code/hooks
- Strands: https://strandsagents.com · LangGraph: https://langchain-ai.github.io/langgraph · PydanticAI: https://ai.pydantic.dev
- Cursos: *Introduction to subagents*, *Claude Code in Action* (anthropic.skilljar.com)
