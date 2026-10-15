# D6 · Prompt and Context Engineering — 11.0 % (~6 preguntas)

> Context engineering (ventana, memoria, deriva, compactación, aislamiento), prompt engineering (claridad, few-shot, system vs user, restricciones, saneamiento) y output handling (estructura, validación, parsing defensivo).
> Fuente doctrinal: guía de prompt engineering de Anthropic + *Effective context engineering for AI agents*.

---

## 1. Context engineering (D6.T1 — 3.8 %)

**Definición (Anthropic)**: el conjunto de estrategias para curar y mantener el **conjunto óptimo de tokens** durante la inferencia. El prompt engineering es un subconjunto: escribir bien las instrucciones. El context engineering es todo lo demás: qué entra, qué sale, cuándo, y cómo se mantiene pequeño y relevante.

Principio: **el contexto es un recurso finito con rendimientos decrecientes**. Más tokens ≠ mejor; hay "context rot": a medida que crece la ventana, baja la precisión con la que el modelo recupera lo que importa. Objetivo: el conjunto **más pequeño de tokens de alta señal** que maximice el resultado.

### 1.1 Anatomía del contexto y qué hacer con cada parte

| Componente | Riesgo | Técnica |
|---|---|---|
| System prompt | Demasiado largo o demasiado vago | "Altitud correcta": específico para guiar, flexible para no volverse frágil. Secciones con XML/Markdown (`<rol>`, `<reglas>`, `<formato>`) |
| Tools | Demasiadas, solapadas, descripciones ambiguas | Set mínimo, sin solapamiento, descripciones inequívocas (D8) |
| Ejemplos | Muchos casos borde apilados | Pocos ejemplos **diversos y canónicos** |
| Historial de mensajes | Crece sin control | Compactación, poda de tool results, reinicio de sesión |
| Salidas de tools | Volcados enormes (logs, tablas, HTML) | **Podar** antes de reinyectar: truncar, resumir, devolver solo campos relevantes; `context editing` (borrar tool results viejos automáticamente) |
| Documentos | Todo cargado al inicio | **Just-in-time**: cargar bajo demanda con tools (rutas, IDs, consultas), como un humano que abre archivos cuando los necesita |

### 1.2 Técnicas para tareas largas

1. **Compactación**: resumir la conversación (decisiones, archivos tocados, bugs, pendientes) y reiniciar con ese resumen. Claude Code lo hace en `/compact` y automáticamente al acercarse al límite; el hook `PreCompact` y las "compact instructions" del `CLAUDE.md` controlan qué se conserva.
2. **Structured note-taking / agent memory**: el agente persiste notas fuera del contexto (`NOTES.md`, `memory/*.md`) y las relee. Progreso, decisiones y "cómo hacer X" sobreviven a la compactación.
3. **Sub-agent architectures**: cada subagente explora con su propio contexto (decenas de miles de tokens) y devuelve un resumen de 1–2K al coordinador. Aislamiento = el "ruido" de la exploración no contamina al orquestador.
4. **Context editing / tool result clearing**: eliminar automáticamente resultados de tools antiguos del historial (feature de la API para agentes).
5. **Memory tool**: tool de archivos que el modelo usa para leer/escribir memoria persistente entre sesiones.

### 1.3 Deriva y contaminación

- **Context drift**: instrucciones iniciales pierden peso frente a lo acumulado; el modelo "olvida" el formato. Mitigación: repetir restricciones clave cerca del final, compactar, validar salida.
- **Bloat**: tokens irrelevantes que suben costo y bajan precisión. Mitigación: podar tool outputs, no pegar documentos enteros.
- **Poisoning**: contenido no confiable (web, archivos) que introduce instrucciones (D7). Mitigación: content boundaries y hooks.

---

## 2. Prompt engineering (D6.T2 — 4.6 %)

Las técnicas oficiales de Anthropic, en orden de "probar primero":

1. **Sé claro y directo.** Di qué, para quién, en qué formato, y qué hacer en casos borde. Escribe el prompt como un brief a un colega nuevo y competente que no tiene tu contexto.
2. **Ejemplos (few-shot)** envueltos en `<example>`. Sirven para formato y criterio; que sean diversos y correctos.
3. **Deja que piense** (chain of thought / extended thinking). Para tareas de varios pasos: "piensa paso a paso dentro de `<thinking>` y luego responde en `<answer>`" o activar thinking nativo.
4. **Etiquetas XML** para separar partes: `<instrucciones>`, `<documento>`, `<ejemplo>`, `<formato>`. Ayudan al modelo y al parsing.
5. **Rol en `system`.** Define identidad, dominio, tono y restricciones estables. Contenido variable y datos → `user`.
6. **Prefill** de la respuesta del asistente (empezar el turno `assistant` con `{` o `<json>`) para forzar formato. (Verificar en docs si el modelo que uses soporta prefill; con extended thinking activado no se puede.)
7. **Encadenar prompts** en vez de un prompt gigante (D1 chaining).
8. **Long-context tips**: documentos largos arriba, pregunta abajo; pedir citas textuales antes de responder; estructurar con XML.

### 2.1 System vs user

| Va en `system` | Va en `user` |
|---|---|
| Rol, personalidad, idioma | La solicitud concreta |
| Reglas y restricciones permanentes | Datos, documentos, resultados de tools |
| Formato de salida por defecto | Ejemplos específicos del caso |
| Descripción del contexto de negocio (glosario de negocio, etc.) | Contenido no confiable, marcado como tal |

Ventaja de `system` estable: se cachea (D5) y es la zona "confiable" (D7).

### 2.2 Restricciones de salida y refinamiento iterativo

- Especifica longitud, idioma, formato, qué hacer si no hay información ("responde `null`, no inventes").
- Itera con un **eval set**: cambia una cosa, mide, guarda versión. No "tuneo a ojo" (D2.T6, D4).

### 2.3 Saneamiento de entrada

- Antes de meter entrada del usuario al prompt: limitar tamaño, escapar/quitar etiquetas que colisionen con tus XML (`</instrucciones>` dentro de un documento), detectar y neutralizar patrones de inyección obvios, quitar PII innecesaria.
- Nunca concatenar entrada del usuario dentro de `system`.

---

## 3. Output handling (D6.T3 — 2.6 %)

### 3.1 Cómo obtener salida estructurada, de más a menos robusto

1. **Structured outputs / JSON schema nativo**: pides un schema y la API garantiza que la salida lo cumple (verificar disponibilidad y nombre exacto del parámetro en docs; ha estado en beta).
2. **Tool como schema**: defines una tool `emitir_resultado` con `input_schema` y fuerzas `tool_choice={"type":"tool","name":"emitir_resultado"}`. El `input` del `tool_use` es tu JSON validado contra el schema. Truco clásico y portable.
3. **Prefill + instrucciones + stop sequence**: empezar la respuesta con `{`, pedir "solo JSON", parar en `}`… funciona, pero sin garantía.
4. Pedir "responde en JSON" y rezar. No.

### 3.2 Parsing defensivo

- Validar **siempre** contra un schema (Pydantic / JSON Schema) aunque uses structured outputs: protege contra truncamiento (`max_tokens`), cambios de modelo, y errores de lógica.
- Manejar: JSON con texto alrededor, comillas mal escapadas, campos faltantes, tipos incorrectos, listas vacías. Estrategia: extraer el primer bloque `{...}` balanceado → `json.loads` → validar → si falla, **reintentar con el error como feedback** (un turno más: "tu salida no cumple el schema: <error>; corrígela").
- **Escepticismo ante salidas confiadas**: el modelo puede afirmar con seguridad algo falso (alucinación). Para hechos verificables: pedir citas, cruzar contra la fuente (tool), o pedir `confidence` y umbral. En pipelines de datos: nunca escribir a la base sin validación programática.

---

## 4. Aplicarlo en tus proyectos

| Proyecto | Ejercicio | Objetivos |
|---|---|---|
| **farmacias** | Extracción de `{nombre, principio_activo, concentracion, forma, presentacion}` con **tool como schema** + validación Pydantic + reintento con feedback. Medir tasa de fallos de parsing antes/después. | D6.T3 |
| **pdf-redactor** | Prompt de detección de PII con `<documento>` y saneamiento (escapar etiquetas). Introducir a propósito un PDF con texto "ignora las instrucciones" y verificar que no altera la salida. | D6.T2.c, D7 |
| **claude-kit / Portfolio CLAUDE.md** | Reescribir tu `CLAUDE.md` del Portfolio aplicando "altitud correcta": quitar lo obvio, dejar reglas duras y rutas. Añadir *compact instructions* explícitas (ya tienes una sección: revísala contra la doctrina). Medir tokens antes/después con `count_tokens`. | D6.T1.b |
| **orquestador** | Que cada worker devuelva ≤ 500 tokens de resumen estructurado; podar tool outputs (tablas → top-N filas + stats). Comparar el tamaño de contexto del coordinador. | D6.T1 |
| **Descripción de tablas para OpenMetadata (datos sintéticos)** | Few-shot con 3 tablas canónicas de un esquema sintético; salida JSON `{descripcion, tags, columnas:[{nombre, descripcion}]}`; validación; carga vía API de OpenMetadata. | D6.T2.a, D6.T3 |
| **stt_whisper** | Post-edición de transcripciones: prompt con glosario en `system` cacheado, texto en `<transcripcion>`, salida con marcas `[inaudible]` en vez de inventar. | D6.T2, D6.T3.b |

## 5. Autoevaluación

1. Diferencia prompt engineering de context engineering en una frase.
2. ¿Qué es "context rot" y cuál es su consecuencia de diseño?
3. Tres técnicas para agentes de larga duración.
4. ¿Qué va en `system` y qué en `user`, y por qué importa para caching y seguridad?
5. ¿Cómo fuerzas JSON válido sin depender de "por favor responde en JSON"?
6. ¿Qué haces cuando la salida no pasa el schema?
7. ¿Por qué podar salidas de tools?
8. ¿Qué hace un subagente por tu contexto?
9. Dos formas de saneamiento de entrada.
10. ¿Cuándo un prefill no está disponible?

## 6. Fuentes

- Prompt engineering overview: https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview
- Claude 4 best practices: https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/claude-4-best-practices
- Long context tips: https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/long-context-tips
- Structured outputs / JSON: https://docs.claude.com/en/docs/build-with-claude/structured-outputs (verificar ruta vigente)
- Context editing y memory tool: https://docs.claude.com/en/docs/build-with-claude/context-editing · /memory-tool
- Anthropic, *Effective context engineering for AI agents* (2025): https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- Anthropic, *Writing tools for agents*: https://www.anthropic.com/engineering/writing-tools-for-agents
- Prompt library y Console prompt generator: https://docs.claude.com/en/resources/prompt-library
