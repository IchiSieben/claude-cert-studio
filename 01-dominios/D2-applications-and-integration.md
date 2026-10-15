---
lesson:
  route: certify
  order: 2
  level: 2
  title_en: "D2 · Applications and Integration — 33.1 %"
  summary_en: "The heaviest domain: from requirements to architecture, the mechanics of the Messages API, engineering basics (REST, JSON, async, git) and configuration management."
---

# D2 · Applications and Integration — 33.1 % (~18 preguntas)

> El dominio más pesado. Cubre: requerimientos → arquitectura, ciclo de vida, **mecánica de la Messages API**, fundamentos de ingeniería (REST/JSON/async/git), diseño de aplicaciones Claude y gestión de configuración.
> Objetivos del blueprint: D2.T1 … D2.T6 (ver `../00-examen/02-blueprint-completo.md`).
> Nota de verificación: los nombres de parámetros y valores están tomados de la documentación de la Claude API vigente a mi corte de conocimiento (mediados de 2026). Antes del examen, cruza cada uno con https://docs.claude.com — los IDs de modelos y algunos betas cambian.

---

## 1. Mecánica de la Messages API (D2.T3 — 6.8 %, el objetivo individual más valioso del examen)

### 1.1 Anatomía de una llamada

```python
from anthropic import Anthropic
client = Anthropic()  # lee ANTHROPIC_API_KEY del entorno — nunca la pases hardcodeada

resp = client.messages.create(
    model="claude-sonnet-4-5",          # usa el ID exacto que te dé docs.claude.com
    max_tokens=1024,                     # OBLIGATORIO. Tope de salida, no de entrada
    system="Eres un analista de datos del sector salud peruano. Responde en JSON.",
    messages=[
        {"role": "user", "content": "Resume esta tabla: ..."},
    ],
    temperature=0.2,
)
print(resp.content[0].text)
print(resp.stop_reason, resp.usage)
```

Lo que el examen pregunta sobre esto:

| Concepto | Lo que hay que saber |
|---|---|
| `system` | Es un **parámetro top-level**, no un mensaje con rol `system`. Ahí van rol, reglas, formato, contexto estable. |
| `messages` | Alternan `user` / `assistant`. El primero debe ser `user`. Cada `content` es string o lista de **bloques** (`text`, `image`, `document`, `tool_use`, `tool_result`, `thinking`). |
| `max_tokens` | Obligatorio. Si la respuesta lo alcanza → `stop_reason: "max_tokens"` y la salida queda **truncada** (JSON roto, tool call a medias). |
| `usage` | `input_tokens`, `output_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens`. Base del modelado de costo (D5.T4). |
| Sin estado | La API **no recuerda nada** entre llamadas. El historial lo mandas tú completo cada vez. De ahí sale todo el tema de contexto, caching y compactación. |

### 1.2 `stop_reason` — el decisor de casi todas las preguntas "¿qué hago ahora?"

| `stop_reason` | Significa | Qué debe hacer tu código |
|---|---|---|
| `end_turn` | El modelo terminó su turno naturalmente | Entregar la respuesta |
| `max_tokens` | Se acabó el tope de salida | Detectar truncamiento; subir `max_tokens` o pedir continuación; **nunca parsear como completo** |
| `stop_sequence` | Apareció una de tus `stop_sequences` | Leer `stop_sequence` para saber cuál |
| `tool_use` | El modelo quiere llamar una o más tools | Ejecutar cada `tool_use`, devolver `tool_result` en un mensaje `user`, volver a llamar |
| `pause_turn` | Turno largo con server tools (p. ej. búsqueda web) pausado | Reenviar la respuesta tal cual para que continúe |
| `refusal` | El modelo rehusó por política de seguridad | No reintentar a ciegas; registrar y manejar como caso de negocio |

**Trampa clásica**: un loop de agente que solo mira `tool_use` y se queda colgado con `max_tokens`, o que trata `refusal` como error de red y reintenta 5 veces.

### 1.3 Tool use en la API (aquí solo la mecánica; el diseño de tools está en D8)

```python
tools = [{
    "name": "consultar_ipress",
    "description": "Devuelve datos de una IPRESS (establecimiento de salud) por código RENIPRESS. Úsala cuando el usuario mencione un establecimiento por código o nombre y necesites ubicación, categoría o UE.",
    "input_schema": {
        "type": "object",
        "properties": {"codigo": {"type": "string", "description": "Código RENIPRESS de 8 dígitos"}},
        "required": ["codigo"],
    },
}]

messages = [{"role": "user", "content": "¿A qué UE pertenece la IPRESS 00001234?"}]
while True:
    resp = client.messages.create(model=MODEL, max_tokens=1024, tools=tools, messages=messages)
    messages.append({"role": "assistant", "content": resp.content})
    if resp.stop_reason != "tool_use":
        break
    results = []
    for block in resp.content:
        if block.type == "tool_use":
            try:
                out = consultar_ipress(**block.input)
                results.append({"type": "tool_result", "tool_use_id": block.id, "content": json.dumps(out)})
            except Exception as e:
                results.append({"type": "tool_result", "tool_use_id": block.id, "content": str(e), "is_error": True})
    messages.append({"role": "user", "content": results})
```

Puntos de examen: el `tool_result` va en un mensaje con rol **`user`**; debe llevar el `tool_use_id` exacto; si el modelo pidió **varias tools en paralelo**, todos los `tool_result` van en el mismo mensaje `user`; `is_error: true` le dice al modelo que la herramienta falló (para que reintente o explique), no que la API falló.

### 1.4 Streaming

- Se activa con `stream=True` (SDK) o `"stream": true` (REST). Transporte **SSE** (Server-Sent Events) sobre HTTP: unidireccional servidor→cliente. No es WebSocket (D5.T2).
- Eventos en orden: `message_start` → `content_block_start` → `content_block_delta`* → `content_block_stop` → … → `message_delta` (trae `stop_reason` y `usage` final) → `message_stop`.
- Cuándo: interfaces de chat (percepción de latencia), respuestas largas, y **obligatorio en la práctica** cuando `max_tokens` es muy alto (evita timeouts HTTP).
- El SDK tiene `client.messages.stream(...)` con helpers (`text_stream`, `get_final_message()`).

### 1.5 Visión y documentos

- Imágenes: bloque `{"type":"image","source":{"type":"base64"|"url", ...}}`. Formatos JPEG/PNG/GIF/WebP. Van dentro del mensaje `user`, antes del texto que pregunta sobre ellas.
- PDFs: bloque `{"type":"document","source":{"type":"base64","media_type":"application/pdf",...}}`. El modelo ve texto **y** render de cada página (cuenta tokens de ambos). Límites de páginas/tamaño: verificar en docs.
- **Files API**: subes una vez (`client.beta.files.upload`), referencias por `file_id` en varias llamadas. Evita re-enviar base64 gigantes. Combinar con caching.
- Citations: pedir al modelo que cite pasajes de documentos con `"citations": {"enabled": true}` en el bloque documento.

### 1.6 Modos de razonamiento

| Modo | Qué es | Cuándo |
|---|---|---|
| Extended thinking | `thinking={"type":"enabled","budget_tokens":N}`. El modelo razona en bloques `thinking` antes de responder; se cobra como salida. | Problemas de varios pasos, matemática, código difícil, análisis de agentes |
| Adaptive / dynamic thinking | El modelo decide cuánto pensar según la dificultad (nombre exacto y parámetro: verificar en docs para el modelo que uses) | Cargas mixtas donde no quieres fijar un presupuesto |
| Interleaved thinking | Pensar **entre** llamadas a tools dentro de un turno (beta header) | Agentes que deben reflexionar sobre resultados de tools |
| Fast mode / baja latencia | Configuración/modelo orientado a latencia mínima (Haiku, sin thinking, streaming) | Chat en vivo, autocompletado, clasificación |

Trampa: el thinking **no** hace al modelo inmune a inyección ni reemplaza validación de salida.

### 1.7 Prompt caching (mecánica aquí; costos en D5.T4)

- Marcas un bloque con `"cache_control": {"type": "ephemeral"}`. Todo lo **anterior** a ese punto en el orden `tools → system → messages` se cachea como prefijo.
- TTL por defecto 5 min (se renueva con cada hit); existe TTL de 1 h (más caro de escribir).
- Mínimo cacheable: ~1024 tokens en Sonnet/Opus, ~2048 en Haiku (verificar).
- Hasta 4 breakpoints por request. El cache es **por prefijo exacto**: cambiar un carácter al inicio invalida todo lo posterior.
- Uso típico: system prompt largo + documentos + definiciones de tools al inicio; la pregunta del usuario al final.

### 1.8 Message Batches API

- `client.messages.batches.create(requests=[{custom_id, params}, ...])`. Hasta decenas de miles de requests por batch.
- Se procesa **asíncronamente, dentro de 24 h** (normalmente mucho menos). **50 % de descuento** sobre el precio normal, **acumulable con prompt caching**.
- Polling del estado (`processing` → `ended`), luego se descargan resultados por `custom_id`. Cada request puede terminar `succeeded` / `errored` / `canceled` / `expired`.
- Cuándo: evaluaciones masivas, clasificación de históricos, ETL nocturno, generación de resúmenes en lote — todo lo que **tolera latencia**.
- **Tradeoff realtime vs batch** (pregunta de muestra oficial #1): si nadie está esperando la respuesta, batch. Si hay un humano o un SLA de segundos, realtime.

### 1.9 Proveedores de nube

Claude está disponible por **Amazon Bedrock**, **Google Vertex AI** y **Microsoft Foundry** además de la API directa. Misma familia de modelos, mismo shape de request (con envoltorio del proveedor), pero: autenticación con IAM/GCP en vez de API key, IDs de modelo distintos, disponibilidad de betas y regiones distinta, facturación en la cuenta del proveedor. Razones para elegirlos: residencia de datos, compliance, créditos, VPC. Los SDKs tienen clientes `AnthropicBedrock` y `AnthropicVertex`.

---

## 2. Fundamentos de ingeniería que el examen asume (D2.T4 — 7.4 %)

Es el segundo objetivo más pesado del examen y es "genérico": REST, JSON, async, git, SDLC. Las preguntas lo mezclan con Claude ("¿cómo manejar un 429?", "¿cómo paralelizar 500 llamadas sin reventar el rate limit?").

### 2.1 HTTP y errores de la API

| Código | Significa | Qué hacer |
|---|---|---|
| 400 `invalid_request_error` | Request mal formado (falta `max_tokens`, roles no alternan, imagen inválida) | Arreglar el request; **no reintentar** |
| 401 `authentication_error` | API key inválida | Revisar secreto; no reintentar |
| 403 `permission_error` | La key no tiene permiso para ese recurso | Config de organización |
| 404 `not_found_error` | Modelo o recurso inexistente | Revisar ID de modelo |
| 413 `request_too_large` | Request > límite (~32 MB) | Files API, reducir contenido |
| 429 `rate_limit_error` | Excediste RPM / ITPM / OTPM | **Backoff exponencial con jitter**, respetar `retry-after`; colas; batch |
| 500 `api_error` | Error interno | Reintentar con backoff |
| 529 `overloaded_error` | Sobrecarga temporal | Reintentar con backoff; fallback de modelo |

El SDK reintenta automáticamente (2 veces por defecto, configurable con `max_retries`) los errores de conexión, 408, 409, 429 y ≥ 500. Timeouts configurables por cliente o por llamada.

### 2.2 Rate limits

Tres ejes por modelo y por tier de organización: **RPM** (requests/min), **ITPM** (input tokens/min), **OTPM** (output tokens/min). Los tokens leídos desde caché suelen no contar para ITPM. Estrategias: semáforo de concurrencia, cola de trabajo, prompt caching, batch para lo que no es urgente, spend limits.

### 2.3 Async en Python

```python
import asyncio
from anthropic import AsyncAnthropic
client = AsyncAnthropic()
sem = asyncio.Semaphore(8)          # concurrencia acotada = respeto al rate limit

async def clasificar(texto):
    async with sem:
        r = await client.messages.create(model=MODEL, max_tokens=50, messages=[{"role":"user","content":texto}])
        return r.content[0].text

resultados = await asyncio.gather(*(clasificar(t) for t in textos), return_exceptions=True)
```

Puntos: `asyncio.gather` para paralelizar I/O; semáforo para acotar; `return_exceptions=True` para que una falla no tumbe el lote; **idempotencia** (poder reintentar sin duplicar efectos) — clave en tools que escriben.

### 2.4 Git, SDLC y code review con IA

- Los prompts y las configuraciones (`CLAUDE.md`, `settings.json`, definiciones de tools) **se versionan** como código.
- Claude en el SDLC: generación → revisión humana → tests → CI (Claude Code headless en GitHub Actions para revisar PRs) → despliegue → monitoreo de calidad de salidas.
- Refactoring asistido: el modelo propone, los tests deciden. Sin tests no hay refactor seguro — con o sin IA.

---

## 3. Diseño de aplicaciones Claude (D2.T5 — 8.6 %)

### 3.1 Una misma capacidad, cuatro interfaces

| Interfaz | Qué es | Quién controla el loop | Config |
|---|---|---|---|
| API / SDK | Tú construyes todo: loop, tools, memoria | Tu código | Tu código |
| Claude Agent SDK | El loop de Claude Code como librería (`query()`), con tools built-in, hooks, subagentes | El SDK, tú lo parametrizas | Opciones + `CLAUDE.md` |
| Claude Code (CLI) | Agente de terminal para desarrolladores | Claude Code | `CLAUDE.md`, `settings.json`, hooks, skills |
| Claude Desktop / claude.ai | Producto de usuario final, con MCP y conectores | Anthropic | Configuración de la app |

Lo que **no** se comparte automáticamente: un `CLAUDE.md` no afecta llamadas a la API; un MCP configurado en Desktop no existe para tu script; la memoria de una sesión de Claude Code no está en otra. Pregunta típica: "el equipo configuró X en Claude Desktop, ¿por qué el pipeline en producción no lo ve?" → porque son superficies distintas.

### 3.2 Content boundaries (límites de contenido)

Separar **instrucciones** (confiables, tuyas) de **datos** (no confiables, del usuario/web/archivos). Mecánicas:

- Instrucciones en `system`; datos en `user`, envueltos en etiquetas XML (`<documento>…</documento>`) y con la instrucción explícita de que lo de adentro es contenido a procesar, no órdenes.
- Salidas de tools son datos, no instrucciones (base de la defensa contra inyección, D7).
- Schemas de entrada y salida explícitos (JSON Schema en tools; structured outputs).

### 3.3 Higiene de sesión

- Qué persiste entre turnos (historial, resultados de tools, archivos subidos) y qué hay que limpiar (salidas de tools ya usadas, contexto obsoleto).
- Compactar o resumir antes de que el contexto se llene; reiniciar sesión para tareas no relacionadas.
- No arrastrar PII o secretos en el historial más de lo necesario.

### 3.4 Plugins

Paquetes que agrupan skills, comandos, agentes, hooks y servidores MCP para Claude Code, instalables desde un marketplace. Sirven para **distribuir una configuración estándar a un equipo**.

---

## 4. Requerimientos y ciclo de vida (D2.T1 + D2.T2 — 6.2 %)

### 4.1 De requerimiento a decisión

| Si el requerimiento dice… | La decisión técnica es… |
|---|---|
| "Respuesta en segundos a un usuario" | Realtime + streaming + modelo rápido (Haiku/Sonnet) |
| "Miles de documentos, resultado mañana" | Batches API + caching, modelo según calidad |
| "Debe seguir un formato exacto para otro sistema" | Structured output / tool como schema + validación |
| "Datos sensibles de pacientes" | Sin PII innecesaria en el prompt, proveedor con compliance/residencia, logging cuidadoso, mínimo privilegio en tools |
| "El proceso tiene pasos fijos" | Workflow determinístico (chaining/routing), no agente |
| "No sabemos de antemano cuántos pasos" | Agente con tools + límites (max turns, presupuesto) |
| "Muchas apps deben usar la misma integración" | Servidor MCP |
| "Presupuesto muy ajustado" | Haiku donde alcance, caching, batch, prompts cortos, medir `usage` |

### 4.2 Ciclo de vida de un sistema con LLM

Prototipo (playground/notebook) → **eval set** pequeño con casos reales → versión 1 con métricas → despliegue con logging de prompts/outputs/usage → monitoreo (calidad, costo, latencia, refusals) → iteración de prompts/modelo con regresión contra el eval set → manejo de cambios de modelo (pinnear ID, probar migración).

---

## 5. Gestión de configuración (D2.T6 — 4.1 %)

- **`CLAUDE.md`**: instrucciones persistentes para Claude Code, jerárquicas (global `~/.claude/CLAUDE.md` → proyecto `./CLAUDE.md` → `CLAUDE.local.md` no versionado → subdirectorios). Detalle en D3.
- **`settings.json`**: permisos, hooks, modelo, variables de entorno. Niveles: usuario (`~/.claude/settings.json`), proyecto (`.claude/settings.json`, se comparte), local (`.claude/settings.local.json`, gitignored), y **managed/enterprise** (lo impone la organización, gana sobre todo).
- **Versionado de modelos**: usa IDs con fecha/versión en producción (reproducible) y prueba los alias/nuevas versiones en staging. Un cambio de modelo es un cambio de comportamiento: corre el eval set antes de promover.
- **Versionado de prompts**: prompts como archivos en el repo (o en un registro) con versión, changelog y eval asociada. Nunca "el prompt que está en el código de producción y nadie sabe cuándo cambió".

---

## 6. Aplicarlo en tus proyectos (estudiar construyendo)

| Proyecto | Qué hacer esta semana | Objetivos que cubre |
|---|---|---|
| **Chasqui** (bot diario Barchart + SUNAT → Excel/PPT → Gmail) | Añadir un paso de "resumen ejecutivo" con la API: primero síncrono con streaming a consola; luego migrarlo a **Batches** para el histórico de 90 días y comparar costo en `usage`. | D2.T3.a/h, D2.T1, D5.T4 |
| **farmacias** (Radar de Precios) | Reemplazar (o complementar) el matcher de 3 capas con una tool `normalizar_producto` que use el modelo con **structured output** y `is_error` cuando el input no es un medicamento. Manejar 429 con backoff y semáforo async. | D2.T3.b, D2.T4.a/b, D6.T3 |
| **pdf-redactor** (OCR/PII) | Pasar PDFs como bloques `document` y pedir detección de PII con citations; comparar contra tu OCR. Subir con Files API y cachear. | D2.T3.d/f, D7.T1.c |
| **signal-agent** | Fijar ID de modelo con fecha en config; crear `prompts/` versionado con changelog; correr los 163 tests + un eval set de 20 señales al cambiar de modelo. | D2.T6, D2.T2 |
| **stt_whisper** | Post-proceso de transcripciones con Batches (lotes nocturnos), diarización como paso previo. | D2.T3.h |
| **Catálogo de datos (OpenMetadata, datos sintéticos)** | Prototipo de "descripción automática de tablas" para OpenMetadata: 1 tabla síncrona → 500 tablas por Batches con caching del glosario de negocio en `system`. | D2.T1, D2.T3.f/h |

Cada uno es un lab en `../05-labs/`.

## 7. Autoevaluación rápida (responde sin mirar)

1. ¿Qué pasa si `stop_reason` es `max_tokens` y estabas generando JSON?
2. ¿En qué rol va el `tool_result`? ¿Qué campo lo enlaza a la llamada?
3. ¿Cuál es el descuento del Batches API y cuál es su ventana máxima?
4. ¿El prompt caching invalida si cambias el último mensaje del usuario? ¿Y si cambias el system prompt?
5. Diferencia entre SSE y WebSocket, y cuál usa la API de Claude.
6. ¿Qué reintenta el SDK solo y qué no?
7. Nombra las tres dimensiones de rate limit.
8. ¿Un `CLAUDE.md` afecta a tu script con el SDK de Python? ¿Y a la Agent SDK?
9. ¿Por qué pinnear el ID de modelo en producción?
10. Un cliente quiere resultados "para mañana" de 20 000 PDFs con el menor costo: describe la arquitectura en tres líneas.

Respuestas en `../03-practica/respuestas-autoevaluacion.md`.

## 8. Fuentes

- Messages API reference y guías: https://docs.claude.com/en/api/messages · https://docs.claude.com/en/docs/build-with-claude/overview
- Tool use: https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview
- Streaming: https://docs.claude.com/en/docs/build-with-claude/streaming
- Prompt caching: https://docs.claude.com/en/docs/build-with-claude/prompt-caching
- Batches: https://docs.claude.com/en/docs/build-with-claude/batch-processing
- Files API, PDF, vision: https://docs.claude.com/en/docs/build-with-claude/files · /pdf-support · /vision
- Extended thinking: https://docs.claude.com/en/docs/build-with-claude/extended-thinking
- Errores y rate limits: https://docs.claude.com/en/api/errors · https://docs.claude.com/en/api/rate-limits
- Bedrock / Vertex: https://docs.claude.com/en/api/claude-on-amazon-bedrock · /claude-on-vertex-ai
- Curso gratuito: *Building with the Claude API* — https://anthropic.skilljar.com/claude-with-the-anthropic-api
