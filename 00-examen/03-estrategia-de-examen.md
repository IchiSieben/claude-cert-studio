# Estrategia de examen — cómo piensan las preguntas y cómo repartir el esfuerzo

## 1. Aritmética del examen

- 53 preguntas, 720/1000 para aprobar. El puntaje es escalado, no un porcentaje directo, pero como regla de dedo apunta a **≥ 75 % de aciertos** (40+ de 53) para tener margen.
- 120 minutos → 2 min 15 s por pregunta. Los ítems son de escenario (3–6 líneas + 4 opciones). No sobra tiempo para dudar en las fáciles; sí para releer las de respuesta múltiple.
- **Respuesta múltiple**: el ítem dice "select TWO" / "select THREE". Marcar de más o de menos = incorrecto. Anota mentalmente el número antes de leer las opciones.

## 2. Dónde está el puntaje

```
D2 Applications & Integration   ████████████████████████████████░ 33.1 %  ~18 preguntas
D5 Model Selection & Optim.     ████████████████░░░░░░░░░░░░░░░░░ 16.8 %   ~9
D1 Agents & Workflows           ██████████████░░░░░░░░░░░░░░░░░░░ 14.7 %   ~8
D6 Prompt & Context Eng.        ███████████░░░░░░░░░░░░░░░░░░░░░░ 11.0 %   ~6
D8 Tools & MCPs                 ██████████░░░░░░░░░░░░░░░░░░░░░░░ 10.6 %   ~6
D7 Security & Safety            ████████░░░░░░░░░░░░░░░░░░░░░░░░░  8.1 %   ~4
D3 Claude Code                  ███░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  3.1 %   ~2
D4 Eval/Testing/Debugging       ███░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  2.6 %   ~1
```

Consecuencias:

1. **D2 + D5 = 50 %.** API mechanics, SDK, async, REST, batch vs realtime, caching, modelos, tokens. Es el examen de "sabes usar la plataforma bien". Aquí se gana o se pierde.
2. **D1 + D6 + D8 = 36 %.** Agentes, contexto, tools, MCP. Es donde tu experiencia ya pesa (signal-agent, Chasqui, orquestador, claude-kit). Hay que ordenar el vocabulario, no aprender de cero.
3. **D7 = 8 %.** Pocas preguntas pero muy predecibles: prompt injection, mínimo privilegio, secretos fuera del código, hooks como control. Rentables.
4. **D3 + D4 = 6 %.** Claude Code pesa poquísimo en *este* examen (en el Architect pesa 20 %). No sobreinvertir aunque sea tu terreno favorito.

Regla de asignación de horas: **50 / 30 / 15 / 5** sobre los grupos de arriba.

## 3. Cómo están escritas las preguntas (patrones observados en las muestras oficiales)

Las tres preguntas de muestra del exam guide comparten una estructura:

- **Escenario con una restricción explícita** ("cost is the primary concern", "reusable across applications", "user-submitted content").
- **Una opción correcta que ataca la estructura del problema** (Batches API, servidor MCP, aislar entrada no confiable).
- **Tres distractores de tipos reconocibles:**
  - *El parche de parámetro*: bajar `temperature`, bajar `max_tokens`, cambiar de modelo. Casi nunca es la respuesta cuando el problema es arquitectónico.
  - *La solución que funciona pero no cumple la restricción*: paralelizar llamadas síncronas (rápido, pero no más barato); hardcodear la integración (funciona, pero no se reutiliza).
  - *La solución "de prompt" a un problema que exige enforcement*: "pedirle amablemente al modelo que ignore instrucciones inyectadas". Si hay consecuencia financiera, de seguridad o de datos, la respuesta correcta tiene **código, hooks o permisos**, no prompt.
  - *El mito*: "un modelo más grande es más resistente a inyección", "los tools built-in llegan a cualquier API".

Heurísticas de eliminación, en orden:

1. Subraya la restricción dominante (costo / latencia / reutilización / seguridad / determinismo).
2. Tacha toda opción que sea un ajuste de parámetro cuando el problema es de arquitectura.
3. Tacha toda opción que confíe en el prompt para algo que tiene consecuencias.
4. Entre las que quedan, elige la que usa la **primitiva de plataforma nombrada** para ese caso (Batches, caching, tool_choice, hooks, MCP, subagentes, streaming, Files API…). El examen premia conocer que la primitiva existe.

## 4. Vocabulario que tiene que salir automático

Si alguno de estos términos no te dispara una definición de una frase, es una laguna. Todos están explicados en `01-dominios/`.

`stop_reason` (end_turn · max_tokens · stop_sequence · tool_use · pause_turn · refusal) · `tool_use` / `tool_result` · `is_error` · `tool_choice` (auto · any · tool · none) · `disable_parallel_tool_use` · `cache_control` ephemeral · cache read/write pricing · Message Batches (24 h, 50 %) · SSE / `message_start` … `message_stop` · `content_block_delta` · extended thinking / `budget_tokens` / interleaved · Files API · citations · structured outputs / JSON schema · system vs user · few-shot · XML tags · prefill · `temperature`/`top_p`/`top_k` · context window · compaction · context editing · subagent · orchestrator-workers · evaluator-optimizer · prompt chaining · routing · parallelization · MCP tools/resources/prompts · stdio / Streamable HTTP · MCP client vs server · Skills (`SKILL.md`) · `CLAUDE.md` hierarchy · `settings.json` (user / project / local / managed) · hooks (`PreToolUse`, `PostToolUse`, `Stop`, …) · headless `claude -p` · `--output-format stream-json` · permission modes · Agent SDK `query()` · prompt injection · least privilege · secrets in env vars · idempotencia · exponential backoff · 429 / 529 · rate limits (RPM / ITPM / OTPM).

## 5. El día del examen

- Haz el mock completo de claudecertificationguide.com (60 preguntas del CCAR-F: sobra el 20 % de Claude Code, pero el resto calibra bien) al menos una vez cronometrado. Registra cada error con su *tipo de trampa* del punto 3.
- Primera pasada: responde todo lo que sepas en < 1 min. Marca las dudosas. Segunda pasada: dudosas con eliminación. Tercera: relee solo las de respuesta múltiple para verificar el conteo.
- No hay penalidad por error: nunca dejes en blanco.
- Inglés técnico: "which of the following BEST…", "MOST cost-effective", "MINIMUM latency" — la palabra en mayúsculas es la restricción dominante. Léela primero.
