# D5 · Model Selection and Optimization — 16.8 % (~9 preguntas)

> Fundamentos de LLM, fundamentos técnicos (SDK/REST/WebSocket), elección de modelo y gestión de costo/tokens. Junto con D2 es la mitad del examen.
> Objetivos: D5.T1 … D5.T4.

---

## 1. Fundamentos de LLM (D5.T1 — 5.2 %)

### 1.1 Tokens

- Unidad de facturación y de contexto. Aproximación: ~3.5–4 caracteres por token en inglés; el español y el código consumen algo más. JSON con mucha puntuación y espacios es caro; tablas Markdown también.
- **Ventana de contexto** = entrada + salida (incluido thinking). 200K tokens es el estándar de la familia actual; hay contexto de 1M para algunos modelos (verificar en docs, puede ser beta y con precio distinto por encima de 200K).
- **Límite de salida** es separado y menor (decenas de miles de tokens según modelo). `max_tokens` no puede superarlo.
- Puedes contar tokens sin generar: endpoint `count_tokens` (`client.messages.count_tokens(...)`). Útil para decidir si cabe, si conviene cachear, y para estimar costo antes de un batch.

### 1.2 Muestreo y no determinismo

| Parámetro | Efecto | Guía |
|---|---|---|
| `temperature` (0–1) | Aplana o afila la distribución. 0 = casi determinista, 1 = más variado | Extracción/clasificación/código: 0–0.3. Creativo: 0.7–1 |
| `top_p` | Muestreo por núcleo: solo tokens hasta acumular probabilidad p | Ajusta **uno** de temperature/top_p, no ambos |
| `top_k` | Solo los k tokens más probables | Raro en producción |

**Incluso con temperature 0 la salida no es 100 % determinista** (paralelismo numérico, cambios de modelo). Consecuencias: valida siempre la salida (D6.T3), diseña tests tolerantes (D4), no construyas idempotencia sobre "el modelo siempre dice lo mismo".

### 1.3 Modos del modelo

- **Extended thinking**: presupuesto explícito de razonamiento (`budget_tokens`, se cobra como salida). Sube calidad en tareas de varios pasos; sube latencia y costo.
- **Adaptive thinking**: el modelo modula cuánto razonar. Buena opción por defecto en cargas heterogéneas (verificar nombre/parámetro exacto en docs).
- **Fast mode / baja latencia**: sin thinking, streaming, modelo pequeño, prompt corto, `max_tokens` ajustado.
- No confundir con `temperature`: thinking cambia *cuánto trabaja* el modelo, temperature cambia *cuánto varía*.

### 1.4 Zero / one / few-shot

- Zero-shot: solo instrucciones. Suficiente para la mayoría de tareas con modelos actuales.
- One/few-shot: 1–5 ejemplos de entrada→salida. Sirven para **formato** y **criterio de borde**, no para "enseñar" conocimiento. Ejemplos mal elegidos sesgan (el modelo copia longitud, tono y hasta errores). Ponlos en `system` o al inicio del `user`, envueltos en `<example>`.

---

## 2. Fundamentos técnicos (D5.T2 — 6.1 %)

### 2.1 El SDK envuelve REST

- `anthropic` (Python) y `@anthropic-ai/sdk` (TypeScript) son wrappers tipados sobre `POST https://api.anthropic.com/v1/messages` con cabeceras `x-api-key`, `anthropic-version`, y `anthropic-beta` cuando aplica.
- Lo que el SDK te da gratis: tipos, reintentos automáticos con backoff (conexión, 408, 409, 429, ≥500), timeouts, paginación, helpers de streaming (`messages.stream`), helpers de tools (`tool_runner` / `beta.messages.tool_runner` para correr un loop con tus funciones), clientes para Bedrock/Vertex.
- Lo que **no** te da: el loop de agente completo con tools built-in, memoria, hooks — eso es la **Agent SDK** (D1).
- Puedes llamar la API con `curl` o `requests`; el examen espera que sepas que el SDK es azúcar sobre eso y que los errores HTTP de la sección D2 §2.1 son los mismos.

### 2.2 HTTP request/response vs SSE vs WebSocket

| Mecanismo | Dirección | Uso con Claude |
|---|---|---|
| Request/response | 1 request → 1 response completa | Llamada normal |
| **SSE** (Server-Sent Events) | Servidor → cliente, sobre HTTP, unidireccional, texto | **Streaming de la Messages API** |
| WebSocket | Bidireccional, persistente | No lo usa la Messages API. Lo usarías tú entre tu frontend y tu backend (chat en vivo), o en APIs de voz en tiempo real |
| stdio | Pipes de proceso | Transporte de servidores MCP locales (D8) |

Pregunta típica: "¿Qué protocolo usa la API para streaming?" → SSE. "¿Para un chat con varios usuarios y push del servidor al navegador?" → WebSocket entre *tu* backend y el navegador; tu backend consume SSE de Claude.

---

## 3. Elección de modelo (D5.T3 — 2.7 %)

| Tier | Perfil | Casos |
|---|---|---|
| **Opus** | Máxima capacidad, más caro, más lento | Agentes largos y autónomos, razonamiento complejo, código difícil, tareas donde un error cuesta más que los tokens |
| **Sonnet** | Equilibrio calidad/costo/latencia; el "default" de producción | Mayoría de apps, agentes de código, extracción compleja, RAG |
| **Haiku** | Más rápido y barato | Clasificación, routing, extracción simple, subagentes de alto volumen, chat de baja latencia, primera pasada de filtros |

Reglas de examen:
- El enunciado suele dar la restricción: "lowest cost" → Haiku si la tarea lo permite; "most complex reasoning" → Opus; "balanced" → Sonnet.
- **Routing por dificultad**: Haiku clasifica y despacha; Sonnet/Opus resuelven. Es a la vez un patrón de workflow (D1) y una optimización de costo.
- **Breaking changes entre releases**: cambios en formato de salida, en cómo sigue instrucciones, en tool use, en betas retiradas. Mitigación: pinnear ID, eval set de regresión, migración por etapas (canary), leer las *migration guides* de Anthropic.

---

## 4. Costo y tokens (D5.T4 — 2.8 %)

### 4.1 Modelo de costo

```
costo = input_tokens × p_in
      + cache_creation_input_tokens × p_in × 1.25   (TTL 5 min; ×2 para TTL 1 h)
      + cache_read_input_tokens × p_in × 0.10
      + output_tokens × p_out                        (thinking cuenta como output)
```

- Precios por millón de tokens, distintos por tier; salida ≈ 5× entrada. Ver tabla vigente en https://docs.claude.com/en/docs/about-claude/pricing.
- **Batch = 50 %** sobre todo lo anterior (input y output), y se combina con caching.
- Registra `usage` de cada llamada en tu log estructurado (D4). Sin eso no hay optimización, solo intuición.

### 4.2 Prompt caching en detalle

- Escribir al caché cuesta 25 % más que un input normal; leerlo cuesta **10 %**. Punto de equilibrio: si el prefijo se reutiliza ≥ 2 veces dentro del TTL, ya ganaste.
- Orden que cachea la API: `tools` → `system` → `messages`. Pon lo estable adelante, lo variable atrás.
- Breakpoints (`cache_control`) hasta 4; el sistema busca hacia atrás el prefijo cacheado más largo.
- **Checkpoint caching** en conversaciones largas: marca el último mensaje `user` o `assistant` con `cache_control`; en cada turno el prefijo anterior se lee del caché y solo el turno nuevo se escribe. Es lo que hace Claude Code por debajo.
- Qué lo invalida: cambiar cualquier byte del prefijo (incluido reordenar tools o cambiar `temperature`? — no: los parámetros de muestreo no forman parte del prefijo, pero el modelo y las tools sí). Verificar la lista exacta en docs.

### 4.3 Palancas de optimización, de mayor a menor impacto habitual

1. Elegir el modelo más pequeño que pase el eval.
2. Batch para todo lo no interactivo.
3. Caching de system/tools/documentos.
4. Acortar prompts: sin repetir instrucciones, sin ejemplos redundantes, sin volcar tablas enteras cuando basta un resumen.
5. `max_tokens` ajustado y formatos de salida compactos (JSON sin prosa).
6. Podar salidas de tools antes de reinyectarlas (D6.T1).
7. Thinking solo donde mejora el resultado; presupuestos medidos.

---

## 5. Aplicarlo en tus proyectos

| Proyecto | Ejercicio | Objetivos |
|---|---|---|
| **signal-agent** | Añadir un `CostLedger`: cada llamada registra `usage` y costo estimado; test que falla si el costo por señal supera un umbral. Comparar Haiku vs Sonnet en el eval set de señales: precisión vs costo. | D5.T3, D5.T4 |
| **Chasqui** | Medir tokens del prompt diario con `count_tokens`; poner el glosario/instrucciones en `system` con `cache_control`; comprobar en `usage` que `cache_read_input_tokens` > 0 desde la 2.ª corrida. | D5.T4.b |
| **archivador de videos propios** | Clasificación de videos (tema, idioma) con Haiku y `temperature=0`; medir variabilidad corriendo 3 veces el mismo lote. | D5.T1.b, D5.T3 |
| **Tableros de gestión pública (datos sintéticos)** | Generar descripciones de indicadores con Haiku; escalar a Sonnet solo las que fallen una validación. Documentar el ahorro. | D5.T3 (routing) |
| **claude-kit** | Revisar tu política de routing de modelos en `settings.json`/subagentes: Haiku para `mecanico`/`investigador`, Sonnet para `operario`, Opus solo para `profundo`. Ya lo tienes intuido; ahora escríbelo con las razones del examen. | D5.T3 |

## 6. Autoevaluación

1. ¿Qué cuenta contra la ventana de contexto: entrada, salida, thinking, tokens leídos desde caché?
2. ¿Por qué temperature 0 no garantiza determinismo y qué implica para tus tests?
3. ¿Cuál es el orden de cacheo de la API y por qué importa?
4. Cache write vs cache read: ¿cuánto cuesta cada uno respecto al input normal?
5. ¿Batch y caching se combinan? ¿Cuánto ahorras en el mejor caso?
6. SSE vs WebSocket: ¿cuál usa la Messages API?
7. ¿Qué reintenta el SDK por defecto?
8. Un lote de 1M de tickets de soporte para clasificar en 12 categorías, sin apuro: modelo, modo, y por qué.
9. ¿Qué es checkpoint caching?
10. Nombra tres tipos de breaking change al cambiar de versión de modelo.

## 7. Fuentes

- Modelos y precios: https://docs.claude.com/en/docs/about-claude/models · https://docs.claude.com/en/docs/about-claude/pricing
- Elección de modelo: https://docs.claude.com/en/docs/about-claude/models/choosing-a-model
- Migración entre modelos: https://docs.claude.com/en/docs/about-claude/models/migration-guide
- Prompt caching: https://docs.claude.com/en/docs/build-with-claude/prompt-caching
- Token counting: https://docs.claude.com/en/docs/build-with-claude/token-counting
- Context windows: https://docs.claude.com/en/docs/build-with-claude/context-windows
- SDKs: https://docs.claude.com/en/api/client-sdks
