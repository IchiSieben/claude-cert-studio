---
lesson:
  route: certify
  order: 8
  level: 2
  title_en: "D8 · Tools and MCPs — 10.6 %"
  summary_en: "Implementing tools (schema, descriptions, errors, tool_choice, parallel calls, approval), building MCP servers (tools, resources, prompts, stdio vs HTTP) and when to use each extension point."
---

# D8 · Tools and MCPs — 10.6 % (~6 preguntas)

> Implementación de tools (schema, descripciones, errores, `tool_choice`, paralelo, client vs server, aprobación), desarrollo de servidores MCP (tools/resources/prompts, stdio vs HTTP) y personalización agéntica (built-in vs custom vs Skills vs MCP).

---

## 1. Implementación de tools (D8.T1 — 4.4 %)

### 1.1 Anatomía

```json
{
  "name": "buscar_ipress",
  "description": "Busca establecimientos de salud (IPRESS) del RENIPRESS por nombre, distrito o código. Devuelve hasta 20 coincidencias con código, nombre, categoría, distrito y Unidad Ejecutora. Úsala cuando el usuario mencione un establecimiento y necesites identificarlo; NO la uses para datos de atenciones o pagos (para eso está consultar_atenciones).",
  "input_schema": {
    "type": "object",
    "properties": {
      "texto": {"type": "string", "description": "Nombre parcial, distrito o código RENIPRESS"},
      "region": {"type": "string", "description": "Región en mayúsculas, p. ej. LIMA. Opcional."}
    },
    "required": ["texto"]
  }
}
```

**La descripción es el 80 % del trabajo.** Anthropic recomienda 3–4+ frases: qué hace, cuándo usarla, cuándo **no**, qué devuelve, limitaciones. El modelo elige tools leyendo descripciones; nombres y descripciones ambiguos = llamadas equivocadas. Parámetros con descripción propia y tipos estrictos; `required` explícito.

### 1.2 `tool_choice`

| Valor | Efecto | Cuándo |
|---|---|---|
| `{"type":"auto"}` (default) | El modelo decide si llama y cuál | Agentes |
| `{"type":"any"}` | Debe llamar **alguna** tool | Cuando siempre hay que actuar/estructurar |
| `{"type":"tool","name":"X"}` | Debe llamar **X** | Salida estructurada forzada (D6.T3) |
| `{"type":"none"}` | No llama tools aunque estén definidas | Turno final de síntesis |

`disable_parallel_tool_use: true` fuerza una tool por turno cuando el orden importa o las tools tienen efectos.

### 1.3 Paralelo vs secuencial

- Por defecto Claude puede emitir **varios `tool_use` en un mismo turno** (paralelo) si son independientes. Tu código ejecuta todos y devuelve **todos los `tool_result` en un solo mensaje `user`**, en el mismo orden.
- Secuencial: cuando la segunda llamada depende de la primera (buscar ID → consultar detalle). El modelo lo hace en turnos sucesivos.
- Puedes invitar al paralelismo en el system prompt ("llama tools independientes en paralelo") y usar `asyncio.gather` para ejecutarlas.

### 1.4 Errores

- Fallo de la herramienta → `tool_result` con `is_error: true` y un mensaje **útil para el modelo** ("código RENIPRESS debe tener 8 dígitos; recibido '1234'"). El modelo corrige y reintenta. Excepción cruda o stack trace = ruido.
- Fallo de tu infraestructura (DB caída) → decide: informar al modelo con `is_error` para que explique al usuario, o abortar el loop.
- Nunca dejar un `tool_use` sin su `tool_result`: la API rechaza el siguiente request.

### 1.5 Client-side vs server-side tools

| | Client-side (custom) | Server-side (Anthropic-hosted) |
|---|---|---|
| Quién ejecuta | **Tu código** | Anthropic, dentro del turno |
| Ejemplos | Tus funciones, DB, APIs internas, MCP que tú conectas | Web search, web fetch, code execution, computer use (algunas), memory tool |
| Loop | Tú manejas `tool_use`/`tool_result` | La API devuelve resultados ya integrados (`server_tool_use`), posible `pause_turn` |
| Costo | Tokens + tu infra | Tokens + tarifa por uso de la tool |

### 1.6 Dispatch agéntico y set de tools

- Set **mínimo y no solapado**: si dos tools pueden resolver lo mismo, el modelo dudará. Consolidar (`buscar_ipress` en vez de `buscar_por_nombre` + `buscar_por_codigo` + `buscar_por_distrito`).
- Devolver **lo que el agente necesita**, no el volcado completo (D6.T1: poda). Paginación, `top_n`, formatos concisos.
- Namespacing por dominio cuando hay muchas (`crm_`, `mef_`).
- Evaluar tools con casos reales: ¿el modelo elige la correcta? ¿con los parámetros correctos? (Anthropic: *Writing tools for agents*).

### 1.7 Patrones de aprobación (human-in-the-loop)

- Clasificar tools por riesgo: **lectura** (auto), **escritura reversible** (auto con log), **irreversible / costosa / externa** (aprobación).
- Mecanismos: en Claude Code, `permissions.allow/ask/deny` en `settings.json` + hooks `PreToolUse`; en Agent SDK, `permission_mode` y `can_use_tool` callback; en tu loop, una función `requiere_aprobacion(tool, input)` antes de ejecutar.
- Principio: la aprobación es **código**, no una instrucción al modelo.

---

## 2. Servidores MCP (D8.T2 — 2.1 %)

**Model Context Protocol**: estándar abierto (Anthropic, nov. 2024; ahora bajo fundación) para conectar aplicaciones LLM con fuentes de datos y herramientas. Arquitectura **cliente–servidor**: el **host** (Claude Desktop, Claude Code, tu app con Agent SDK) corre un **cliente MCP** por servidor; cada **servidor MCP** expone capacidades.

### 2.1 Primitivas

| Primitiva | Quién la controla | Qué es | Ejemplo |
|---|---|---|---|
| **Tools** | El modelo (model-controlled) | Funciones que el modelo puede invocar | `consultar_tabla`, `crear_ticket` |
| **Resources** | La aplicación (application-controlled) | Datos de solo lectura direccionables por URI, para poner en contexto | `datos://glosario`, `file:///docs/esquema.md` |
| **Prompts** | El usuario (user-controlled) | Plantillas reutilizables que el usuario invoca (slash commands) | `/analizar-ejecucion-presupuestal` |

Además: **sampling** (el servidor pide al cliente que el modelo genere algo), **roots**, **elicitation** (pedir datos al usuario), notificaciones de cambio de lista.

### 2.2 Transporte

| Transporte | Cómo | Cuándo |
|---|---|---|
| **stdio** | El host lanza el servidor como subproceso y hablan por stdin/stdout (JSON-RPC 2.0) | Servidores locales: filesystem, DB local, scripts. Lo más común en Claude Desktop/Code |
| **Streamable HTTP** | Servidor remoto con endpoint HTTP (POST + SSE opcional para eventos). Reemplaza al transporte "HTTP+SSE" antiguo | Servidores compartidos/remotos, multiusuario, con OAuth |

Protocolo: JSON-RPC 2.0 con handshake `initialize` (negociación de capacidades y versión).

### 2.3 Autoría con FastMCP (Python)

```python
from mcp.server.fastmcp import FastMCP
mcp = FastMCP("mcp-estadistica")

@mcp.tool()
def consultar_ue(codigo_ue: str) -> dict:
    """Devuelve la ficha de una Unidad Ejecutora (datos sintéticos): nombre, región, presupuesto vigente (PIM) y ejecución acumulada. Usar cuando el usuario mencione una UE por código de 4 dígitos."""
    return repo.ue(codigo_ue)

@mcp.resource("datos://glosario")
def glosario() -> str:
    return open("glosario.md").read()

@mcp.prompt()
def analizar_ejecucion(ue: str) -> str:
    return f"Analiza la ejecución presupuestal de la UE {ue} y señala riesgos de subejecución."

if __name__ == "__main__":
    mcp.run()  # stdio por defecto; transport="streamable-http" para remoto
```

Registro en Claude Code: `claude mcp add mcp-estadistica -- python server.py` (o en `.mcp.json` del proyecto para compartir con el equipo). En Claude Desktop: `claude_desktop_config.json`.

### 2.4 Despliegue y seguridad de servidores MCP

- Local (stdio) hereda los permisos del usuario: cuidado con lo que expone.
- Remoto: autenticación (OAuth 2.1 en el spec), TLS, autorización por usuario, rate limiting, logging. Un servidor MCP es una API: aplican todas las reglas de D7.
- Un servidor MCP de terceros es **código que corre con tus credenciales**: revisa la fuente, fija versiones, mínimo privilegio.

---

## 3. Personalización agéntica: qué usar para qué (D8.T3 — 4.1 %)

| Mecanismo | Qué es | Úsalo cuando | No lo uses cuando |
|---|---|---|---|
| **Built-in tools** (Read, Write, Edit, Bash, Grep, Glob, WebFetch…) | Ya vienen en Claude Code / Agent SDK | La tarea es sobre archivos, terminal, repos, web | Necesitas una API interna o datos que no están en disco |
| **Custom tools** (tu función en el loop / Agent SDK in-process) | Función que tú defines y ejecutas | Lógica propia de la app, una sola aplicación, control total | Varias apps la necesitan (→ MCP) |
| **MCP server** | Servicio reutilizable con tools/resources/prompts | Integración compartida entre apps/equipos, mantenida independientemente, con datos vivos | Es una función trivial de una sola app (sobreingeniería) |
| **Skills** (`SKILL.md` + archivos) | Conocimiento procedimental + scripts que el agente carga **bajo demanda** | Enseñar *cómo* hacer algo (metodología, plantillas, checklists, scripts de apoyo) sin gastar contexto hasta que hace falta | Necesitas acceso a un sistema externo (eso es tool/MCP) |
| **Slash commands** | Prompts reutilizables invocados por el usuario | Flujos repetidos que el humano dispara | El agente debe decidir solo (→ skill) |
| **Subagentes** | Agentes con contexto y tools propios | Aislar contexto, paralelizar, especializar | La tarea es corta y lineal |
| **Hooks** | Código en eventos del ciclo | Garantías determinísticas | Sugerencias de estilo (→ CLAUDE.md) |
| **CLAUDE.md / rules** | Instrucciones siempre cargadas | Convenciones del proyecto que aplican a todo | Contenido largo que solo aplica a veces (→ skill) |

Preguntas típicas: "reutilizable e independiente" → MCP (muestra oficial #3). "Cargar un procedimiento de 2000 líneas solo cuando se necesite" → Skill. "Que nunca se ejecute `DROP`" → hook o permiso `deny`, no prompt. "Leer y modificar archivos del repo" → built-in.

---

## 4. Aplicarlo en tus proyectos

| Proyecto | Ejercicio | Objetivos |
|---|---|---|
| **Base estadística (solo lectura, datos sintéticos)** | Servidor MCP `mcp-estadistica` (FastMCP, stdio) con 3 tools (`listar_tablas`, `describir_tabla`, `consultar_sql_readonly` con whitelist SELECT + límite de filas), 1 resource (glosario), 1 prompt. Registrarlo en Claude Code y en Claude Desktop; ver la diferencia. **Ojo**: solo datos sintéticos, nunca datos reales. | D8.T2 completo |
| **farmacias** | Convertir el matcher en tool custom con descripción de 4 frases y `is_error` informativo; test de "¿elige la tool correcta?" con 20 consultas. | D8.T1.a/b |
| **Chasqui** | Tool `enviar_reporte(destinatarios, adjuntos)` marcada como **irreversible** → aprobación por código antes de ejecutar; `PreToolUse` hook que bloquea envíos fuera del horario. | D8.T1.d |
| **claude-kit** | Inventario de tu kit clasificado en la tabla de §3: qué tienes como skill, qué como comando, qué como agente, qué como hook. Detectar 2 cosas que están en el mecanismo equivocado y moverlas. | D8.T3 |
| **archivador de videos propios** | Exponer la transcripción como MCP remoto (Streamable HTTP) en tu red local, con token; consumirlo desde Claude Code. | D8.T2.c |
| **Catálogo de productos estadísticos** | Skill `catalogo-datos` con la metodología para documentar un producto estadístico (plantilla + checklist + script de validación). | D8.T3 |

## 5. Autoevaluación

1. Cuatro cosas que debe decir una buena descripción de tool.
2. Los cuatro valores de `tool_choice` y un uso de cada uno.
3. ¿Dónde van los `tool_result` de llamadas paralelas?
4. ¿Qué es `is_error` y qué NO es?
5. Client-side vs server-side tool: quién ejecuta y ejemplos.
6. Las tres primitivas MCP y quién controla cada una.
7. stdio vs Streamable HTTP: cuándo cada uno.
8. Un equipo quiere que cinco aplicaciones distintas consulten el inventario: ¿tool custom, MCP o skill?
9. ¿Cuándo un Skill y cuándo un MCP?
10. ¿Cómo garantizas que un agente pida permiso antes de enviar un correo?

## 6. Fuentes

- Tool use: https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview · /implement-tool-use
- Anthropic, *Writing tools for agents*: https://www.anthropic.com/engineering/writing-tools-for-agents
- MCP spec y docs: https://modelcontextprotocol.io · https://modelcontextprotocol.io/specification
- MCP en Claude Code: https://docs.claude.com/en/docs/claude-code/mcp
- Python SDK (FastMCP): https://github.com/modelcontextprotocol/python-sdk
- Skills: https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview · Anthropic, *Equipping agents for the real world with Agent Skills*
- Cursos: *Introduction to MCP*, *MCP: Advanced Topics*, *Introduction to Agent Skills* (anthropic.skilljar.com)
