---
lesson:
  route: certify
  order: 13
  level: 3
  title_en: "Lab 05 — An agent with the Agent SDK, hooks and subagents"
  summary_en: "An agent that downloads, transcribes, classifies and files a batch of videos, confined to one folder by hooks and split into subagents."
---

# Lab 05 — Agente con Claude Agent SDK, hooks y subagentes

**Proyecto**: archivador de videos propios (transcribir con stt_whisper, clasificar, archivar) — o `orquestador`.
**Objetivos**: D1.T1 · D1.T2 · D1.T3.a · D6.T1 · D8.T1.d
**Tiempo**: 5–6 h.

## Requerimiento

> Dado un lote de videos propios en una carpeta, un agente debe: transcribir cada uno, clasificarlo (tema, idioma, personas mencionadas → **no** guardar nombres de terceros), y archivarlo en la estructura de carpetas del archivador. Debe operar **solo dentro de la carpeta del archivo**, no ejecutar comandos destructivos, parar tras N turnos, y producir un informe final de ≤ 300 palabras. El coordinador no debe cargar en su contexto las transcripciones completas.

## Decisiones (escribir primero)

1. ¿Workflow o agente? Argumenta: los pasos son fijos por video (workflow), pero el manejo de fallos (video privado, transcripción vacía, formato raro) es abierto. Solución razonable: **workflow externo por video** + **agente acotado** para la clasificación/recuperación. Escríbelo con los términos de *Building Effective Agents*.
2. ¿Agent SDK o loop propio? (Necesita filesystem, Bash acotado, permisos y hooks → Agent SDK).
3. ¿Qué tools built-in permites? (`Read`, `Write` dentro de la carpeta, `Bash(yt-dlp*)`, `Bash(python stt*)`; nada de `rm`, nada de red aparte del downloader).
4. ¿Qué es determinístico y va en hook? (bloquear escrituras fuera del archivo; bloquear `rm`; registrar cada tool call).
5. ¿Cómo mantienes el contexto del coordinador pequeño? (subagente `transcriptor` que devuelve resumen + metadatos, no el texto completo; poda de salidas de `yt-dlp`).

## Pasos

### 1. Agente simple con Agent SDK

- `pip install claude-agent-sdk`. Script con `query(prompt, ClaudeAgentOptions(allowed_tools=[...], permission_mode="acceptEdits", max_turns=15, cwd=ARCHIVO, system_prompt=...))`. Iterar mensajes e imprimir tool calls.
- Observa cómo maneja un video que falla (URL inválida). ¿Se recupera? ¿Cuántos turnos gastó?

### 2. Hooks

- `PreToolUse` sobre `Write|Edit|Bash`: script Python que lee el JSON por stdin; si la ruta está fuera de `ARCHIVO` o el comando contiene `rm `/`del `, sale con código 2 y mensaje. Verifica que el agente recibe el rechazo y adapta.
- `PostToolUse`: appende a `audit.jsonl` (tool, input resumido, ts).
- Compara: la misma regla escrita solo en el system prompt. Intenta que el agente la viole (pídele "limpia los temporales"). Concluye.

### 3. Subagente aislado

- Define `.claude/agents/transcriptor.md`: `description`, `tools: Bash(python stt*), Read`, `model: haiku`, prompt que exige devolver `{resumen ≤ 120 palabras, idioma, temas[], duracion}`.
- El coordinador delega la transcripción y **nunca** ve el texto completo. Mide `usage` del coordinador con y sin subagente para 5 videos.

### 4. Memoria y compactación

- Añade *structured note-taking*: el coordinador mantiene `PROGRESO.md` (hechos, pendientes, fallos). Corta la sesión a la mitad y reanuda: ¿retoma bien?
- Fuerza compactación (`max_turns` alto, lote grande) y observa qué sobrevive. Añade *compact instructions* al `CLAUDE.md` del proyecto.

### 5. Orchestrator-workers (extensión, en `orquestador`)

- Coordinador Sonnet descompone; workers Haiku en paralelo; síntesis. Compara tokens totales vs. una sola conversación monolítica. Anota el tradeoff (más tokens totales, menos contexto por agente, más paralelismo).

## Verificación

- [ ] Hook bloquea escritura fuera de la carpeta (test con ruta `../`).
- [ ] Hook bloquea `rm`; el system prompt solo no basta (documentado).
- [ ] Coordinador nunca contiene una transcripción completa (grep en la traza).
- [ ] `max_turns` respetado; informe final ≤ 300 palabras.
- [ ] No se guardan nombres de terceros (regla D7.T1.c).

## Qué aprendiste

1. Define workflow vs agente y dónde está cada uno en tu diseño.
2. ¿Qué hereda el subagente del coordinador? ¿Qué devuelve?
3. ¿Qué garantizó el hook que el prompt no?
4. Tres técnicas de context engineering que usaste.
5. ¿Cuándo hubieras usado la Messages API cruda en vez del Agent SDK?
6. Costo del patrón orchestrator-workers vs monolito: ¿qué ganaste y qué pagaste?
