# Flashcards — hechos que tienen que salir en < 3 segundos

Formato `Pregunta → Respuesta`. Cúbrelas con la mano. Importables a Anki con el script de abajo.

## API y SDK
- `system` en la Messages API es… → un parámetro top-level, no un mensaje.
- Parámetro obligatorio además de `model` y `messages` → `max_tokens`.
- Seis valores de `stop_reason` → end_turn · max_tokens · stop_sequence · tool_use · pause_turn · refusal.
- `stop_reason: max_tokens` con JSON → truncado; no parsear como completo.
- Rol del mensaje que lleva `tool_result` → `user`.
- Campo que enlaza `tool_result` con su llamada → `tool_use_id`.
- Varias tool calls en un turno → todos los `tool_result` en **un** mensaje `user`.
- `is_error: true` significa → la herramienta falló (el modelo debe reaccionar), no que la API falló.
- Protocolo del streaming → SSE (Server-Sent Events) sobre HTTP.
- Evento que trae `stop_reason` y `usage` final en streaming → `message_delta`.
- Campos de `usage` → input_tokens · output_tokens · cache_creation_input_tokens · cache_read_input_tokens.
- Contar tokens sin generar → `messages.count_tokens`.
- Errores que el SDK reintenta solo → conexión, 408, 409, 429, ≥ 500 (2 reintentos por defecto).
- 400 → request inválido, no reintentar. 429 → rate limit, backoff. 529 → overloaded, backoff.
- Tres ejes de rate limit → RPM · ITPM · OTPM.
- Subir un archivo una vez y reutilizarlo → Files API (`file_id`).
- PDF como entrada → bloque `document`, media_type `application/pdf`; cuenta texto + imagen de página.
- Extended thinking se activa con → `thinking: {type: "enabled", budget_tokens: N}`; se cobra como salida.
- Proveedores de nube → Amazon Bedrock · Google Vertex AI · Microsoft Foundry. Auth por IAM, no API key.

## Costo y modelos
- Descuento Batches → 50 %. Ventana → 24 h. Combinable con caching → sí.
- Cache write (5 min) / read → 1.25× / 0.10× del input normal. TTL 1 h → 2× write.
- Orden de cacheo → tools → system → messages.
- Máximo de breakpoints `cache_control` → 4.
- Qué invalida el caché → cualquier cambio en el prefijo (bytes, tools, modelo).
- Checkpoint caching → marcar el último turno para que cada llamada lea el historial previo del caché.
- Opus / Sonnet / Haiku → máxima capacidad / equilibrio (default producción) / rápido y barato.
- Routing por dificultad → Haiku clasifica, Sonnet/Opus resuelven.
- Temperature 0 → casi determinista, no garantizado.
- Ajustar `temperature` y `top_p` a la vez → no; uno de los dos.
- Few-shot sirve para → formato y criterio, no para hechos.
- Producción: ID de modelo → pinneado con versión; eval de regresión antes de migrar.

## Agentes y contexto
- Workflow → LLM y tools orquestados por código predefinido. Agente → el LLM dirige su propio proceso.
- Cinco patrones de workflow → prompt chaining · routing · parallelization (sectioning/voting) · orchestrator-workers · evaluator-optimizer.
- Sectioning vs orchestrator-workers → subtareas predefinidas vs decididas dinámicamente.
- Contexto que hereda un subagente → ninguno; solo lo que se le pasa. Devuelve → un resultado condensado.
- Loop de agente en producción necesita → límite de turnos/presupuesto · todos los stop_reason · is_error · aprobación humana · logs · poda/compactación.
- Garantía determinística → hook o permiso, no prompt.
- Agent SDK vs Messages API → filesystem/terminal/permisos/hooks → SDK; loop mínimo con tools propias → API.
- Context rot → precisión cae al crecer el contexto aunque quepa.
- Técnicas para tareas largas → compactación · structured note-taking · subagentes · just-in-time retrieval · context editing.
- Content boundaries → instrucciones en `system`; datos no confiables en `user` con XML y marcados como datos.
- JSON garantizado y portable → tool como schema + `tool_choice: {type: tool}` + validación Pydantic.
- LangGraph → grafo de estados con checkpoints. PydanticAI → tipado/validación Pydantic. Strands → SDK de agentes de AWS.

## Tools y MCP
- Descripción de tool debe decir → qué hace · cuándo usarla · cuándo no · qué devuelve / límites.
- `tool_choice` → auto · any · tool (nombre) · none.
- Forzar una tool por turno → `disable_parallel_tool_use: true`.
- Server-side tools → web search, web fetch, code execution… ejecutadas por Anthropic. Client-side → tú.
- Primitivas MCP y quién controla → tools (modelo) · resources (aplicación) · prompts (usuario).
- Transportes MCP → stdio (local, subproceso) · Streamable HTTP (remoto, multi-cliente, auth).
- Protocolo de mensajes MCP → JSON-RPC 2.0.
- Compartir MCP con el equipo en Claude Code → `.mcp.json` del proyecto.
- Reutilizable entre apps, mantenido aparte → MCP. Largo y ocasional → Skill. Lo dispara el humano → command. Contexto propio → agent. Siempre y corto → CLAUDE.md/rules.
- Progressive disclosure → solo nombre+descripción de la skill siempre; el cuerpo al necesitarse.

## Seguridad
- Inyección indirecta → instrucciones dentro de datos que el agente lee (web, PDF, tool output).
- Mitigaciones válidas → separar confianza · mínimo privilegio en tools · hooks/aprobación · validar salida · monitoreo.
- Mitigaciones falsas → bajar temperature · "por favor ignora" · modelo más grande.
- API key en app web → solo backend; nunca en el navegador.
- Exit code que bloquea en `PreToolUse` → 2 (stderr al modelo).
- Cinco pilares → autenticación · autorización · confidencialidad · privacidad · integridad.
- Identidad para autorizar tools viene de → el host/app autenticada, nunca del texto del modelo.
- `stop_reason: refusal` → manejar como caso de negocio; no reintentar a ciegas.

## Claude Code
- Orden `CLAUDE.md` → managed → `~/.claude/CLAUDE.md` → padres → `./CLAUDE.md` → `CLAUDE.local.md` → subdirectorios.
- Niveles `settings.json` → managed (gana) · usuario · proyecto · local.
- Permission modes → default · acceptEdits · plan · bypassPermissions.
- Headless → `claude -p "…" --output-format json|stream-json --allowedTools … --max-turns N`.
- Eventos de hook → SessionStart · UserPromptSubmit · PreToolUse · PermissionRequest · PostToolUse · Notification · Stop · SubagentStop · PreCompact · SessionEnd.
- `/compact` → resume la conversación; compact instructions en CLAUDE.md y hook PreCompact controlan qué queda.
- Subagentes → `.claude/agents/*.md` con description, tools, model; contexto aislado.
- Skills → `.claude/skills/<n>/SKILL.md`. Commands → `.claude/commands/<n>.md`.

## Examen
- Ítems / minutos / aprobación → 53 / 120 / 720 de 1000.
- Precio → US$ 125. Vigencia → 12 meses. Renovación → gratis, no supervisada, a tiempo.
- Reintentos → 14 / 30 / 90 días; máx. 4 por 12 meses.
- Quién puede rendir (FAQ oficial) → empleados de empresas del Claude Partner Network, con correo corporativo.
- Dominio más pesado → Applications and Integration, 33.1 %.

## Exportar a Anki

```python
# flashcards_to_anki.py — genera un TSV importable (Front \t Back)
import re, pathlib
src = pathlib.Path("flashcards.md").read_text(encoding="utf-8")
rows = [l[2:] for l in src.splitlines() if l.startswith("- ") and "→" in l]
out = "\n".join(f"{q.strip()}\t{a.strip()}" for q, a in (r.split("→", 1) for r in rows))
pathlib.Path("flashcards.tsv").write_text(out, encoding="utf-8")
print(len(rows), "tarjetas")
```
