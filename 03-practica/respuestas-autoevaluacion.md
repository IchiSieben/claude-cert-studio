# Respuestas a las autoevaluaciones de `01-dominios/`

Respuestas cortas. Si la tuya difiere en sustancia, vuelve a la sección correspondiente.

## D2
1. Salida truncada: el JSON está incompleto; detectarlo por `stop_reason`, reintentar con más `max_tokens` o pedir continuación; nunca parsear como válido.
2. Rol `user`; campo `tool_use_id`.
3. 50 %; 24 horas.
4. Cambiar el último mensaje `user` no invalida el prefijo cacheado anterior; cambiar el `system` invalida todo lo que sigue (el caché es por prefijo exacto).
5. SSE: unidireccional servidor→cliente sobre HTTP; WebSocket: bidireccional persistente. La API usa SSE.
6. Reintenta conexión, 408, 409, 429, ≥ 500 (2 veces por defecto). No reintenta 400/401/403/404.
7. RPM, ITPM, OTPM.
8. Al SDK de Python: no. A la Agent SDK: sí (usa el mismo motor que Claude Code y lee `CLAUDE.md` del `cwd` si se configura).
9. Reproducibilidad: un alias puede cambiar de comportamiento sin que toques código.
10. Batches API (asíncrono, 50 %) + Files API/documentos como bloques + caching del system prompt e instrucciones + modelo elegido por eval (Haiku si alcanza) + validación de schema.

## D5
1. Entrada, salida y thinking. Los tokens leídos desde caché cuentan para el contexto (están en el prompt), pero se cobran al 10 %.
2. Ejecución numérica en paralelo y cambios de modelo; tests deben validar estructura/semántica, no igualdad byte a byte.
3. tools → system → messages; lo estable adelante para maximizar el prefijo cacheado.
4. Write 1.25× (5 min) o 2× (1 h); read 0.10×.
5. Sí. Mejor caso: 50 % del batch sobre input cacheado al 10 % → 5 % del precio normal para esa parte.
6. SSE.
7. Conexión, 408, 409, 429, ≥ 500.
8. Haiku, Batches, `temperature` 0, salida estructurada; sin apuro → batch; tarea simple → Haiku.
9. Marcar el último turno con `cache_control` para que en cada llamada el historial anterior se lea del caché.
10. Cambios en formato de salida, en adherencia a instrucciones/tool use, betas o parámetros retirados, límites de tokens distintos.

## D1
1. Workflow: código orquesta LLM y tools en rutas predefinidas. Agente: el LLM decide dinámicamente su proceso y tools.
2. Sectioning: subtareas conocidas y predefinidas, en paralelo. Orchestrator-workers: un LLM decide dinámicamente las subtareas y las delega.
3. Solo lo que se le pasa explícitamente; devuelve un resultado condensado, no su transcript.
4. Límite de turnos/presupuesto; todos los `stop_reason`; `is_error`; aprobación humana para lo irreversible; logging; poda/compactación.
5. Agent SDK: filesystem, terminal, permisos, hooks, subagentes listos. Loop propio: pocas tools de dominio, control total, sin filesystem.
6. Ejecución determinística: el prompt es una sugerencia, el hook es código que se ejecuta (o bloquea) siempre.
7. Grafo de estados con ramas, ciclos, checkpoints reanudables y pausas para humano.
8. Workflow: routing (clasificar) → chaining (buscar KB → redactar) → gate programático (reembolso > $100 → escalar/aprobación). Sin agente autónomo.
9. Un modelo genera y otro evalúa iterativamente; riesgo: costo/latencia se multiplican por iteración → poner tope.
10. El agente escribe progreso/decisiones en archivos fuera del contexto y los relee; sobrevive a compactación y sesiones.

## D6
1. Prompt engineering: cómo escribir las instrucciones. Context engineering: qué tokens entran, salen y se mantienen en todo el ciclo.
2. La precisión cae al crecer el contexto aunque quepa; diseñar para el conjunto mínimo de tokens de alta señal.
3. Compactación, structured note-taking, subagentes aislados (también just-in-time retrieval, context editing).
4. `system`: rol, reglas, formato (estable → cacheable y confiable). `user`: solicitud, datos, contenido no confiable.
5. Tool como schema con `tool_choice` forzado (o structured outputs nativos) + validación.
6. Reintentar 1–2 veces con el error como feedback; luego fallar explícito y registrar.
7. Reducen costo, evitan bloat y context rot; el modelo solo necesita lo relevante.
8. Aísla la exploración ruidosa y devuelve un resumen; mantiene pequeño el contexto del coordinador.
9. Limitar tamaño y escapar etiquetas; quitar PII / patrones de inyección; nunca concatenar entrada en `system`.
10. Con extended thinking activado (y verificar soporte por modelo).

## D8
1. Qué hace, cuándo usarla, cuándo no, qué devuelve/límites.
2. auto (agente decide) · any (siempre alguna) · tool (forzar una: schema) · none (síntesis sin tools).
3. En un solo mensaje `user`, un `tool_result` por `tool_use_id`.
4. Es "la herramienta falló, reacciona"; no es un error de la API ni de red.
5. Client-side: tú ejecutas (tus funciones, DB, MCP). Server-side: Anthropic ejecuta (web search, code execution).
6. Tools (modelo) · resources (aplicación) · prompts (usuario).
7. stdio: local, subproceso, un cliente. Streamable HTTP: remoto, multi-cliente, auth.
8. MCP.
9. Skill: conocimiento procedimental bajo demanda. MCP: acceso a sistemas/datos externos reutilizable.
10. Aprobación por código: clasificación de riesgo de la tool + hook `PreToolUse`/permiso `ask`/callback del SDK; nunca solo el prompt.

## D7
1. Directa: el usuario la escribe. Indirecta: viene en datos que el agente lee. La indirecta es peor en agentes: el atacante no necesita hablar con el modelo, solo con lo que lee.
2. Válidas: separar confianza, mínimo privilegio, hooks/aprobación (también validar salida, monitoreo). Falsas: bajar temperature, "por favor ignora", modelo más grande.
3. Si el agente no tiene la capacidad (tool), la inyección no puede usarla.
4. Backend, en entorno/gestor de secretos: cualquier cosa en el navegador es pública.
5. Ejecución/bloqueo garantizado por código en cada evento; el `CLAUDE.md` es una instrucción que el modelo puede no seguir.
6. Políticas/entrenamiento del modelo → system prompt → filtros de entrada → tools y permisos mínimos → hooks/aprobación → validación de salida → monitoreo/límites/kill switch.
7. Minimizar, redactar/pseudonimizar, cifrar, retención definida, acceso controlado.
8. Sin API key de Anthropic: IAM roles / service accounts; residencia de datos en la región.
9. AuthN (login OIDC del usuario) · AuthZ (cada tool comprueba permisos del usuario) · confidencialidad (TLS, cifrado) · privacidad (minimizar PII) · integridad (validar entradas y salidas).
10. Registrar, no reintentar igual, ruta alternativa o mensaje al usuario.

## D3
1. Managed → `~/.claude/CLAUDE.md` → padres → `./CLAUDE.md` → `CLAUDE.local.md` → subdirectorios.
2. Managed, usuario, proyecto, local; managed gana.
3. Skill: procedimiento que el modelo carga bajo demanda. Command: prompt que el usuario dispara. Agent: subagente con contexto/tools propios.
4. Solo nombre y descripción están siempre en contexto; el cuerpo se carga al necesitarse.
5. `claude -p "…" --output-format json`.
6. default · acceptEdits · plan · bypassPermissions.
7. Resume la conversación; compact instructions en `CLAUDE.md` y hook `PreCompact`.
8. `.mcp.json` en el proyecto.
9. Exit 2.
10. Paquete instalable de skills + commands + agents + hooks + MCP.

## D4
1. Integración: códigos HTTP, excepciones del SDK, `tool_use` sin `tool_result`. Modelo: tool equivocada, alucinación, variabilidad.
2. ts, request_id, modelo, prompt_version, tokens (4 tipos), stop_reason, latencia, tools, costo, id de sesión pseudonimizado.
3. Verificar si la información estaba en el contexto: si no estaba, es falta de contexto (aportar fuente); si estaba y la contradijo, alucinación (pedir citas, validar).
4. Detectar por `stop_reason`, reintentar con más `max_tokens` o continuación; nunca reparar el JSON a ciegas como si estuviera completo.
5. Otro modelo puntúa salidas con una rúbrica; límite: sesgos y errores del juez → validar muestra con humanos.
6. Casos con salida esperada que se corren en cada cambio de prompt/modelo/tool.
7. `max_turns`, presupuesto de tokens/tiempo, detección de repetición.
8. Porque la variabilidad del modelo y el efecto de cada byte del prompt hacen que "parecido" no reproduzca el fallo.
