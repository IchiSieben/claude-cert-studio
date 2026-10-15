# Papers — elicitación de requisitos, clarificación y descomposición de tareas con agentes

> Base para el módulo "preguntas tipo user stories" del orquestador (que Claude Code pregunte lo que falta antes de ejecutar, y parta bien las tareas). Verificado el 2026-09-26 sobre arXiv; los que dicen *[verificar abstract]* solo se vieron por título/ID.
> Relevancia para el examen: CCAR-F 1.6 (task decomposition), 5.2 (escalation & ambiguity), 3.4 (plan mode); CCDV-F 2.1 (understanding requirements), 1.1 (workflow vs agent); CCAA-F 1.2 (task decomposition), CCAR-P 6.1 (structured discovery).

## Clarificación antes de ejecutar (ask or assume)

- **Edwards & Schuster, "Ask or Assume? Uncertainty-Aware Clarification-Seeking in Coding Agents"** — arXiv:2603.26233 (mar. 2026, rev. jun. 2026). Evalúan agentes de código sobre un SWE-bench Verified con tareas subespecificadas. Hallazgo: un sistema multi-agente que **separa la detección de subespecificación de la ejecución** resuelve 69.4 % de las tareas, muy por encima del agente único que asume. Lección directa para el kit: la pregunta de clarificación es un paso propio (un subagente o un gate), no una instrucción "pregunta si tienes dudas" en el prompt.
- **"Clarity Is Not Assumed: Understanding LLM-Based Code Generation under Ambiguous Requirements"** — arXiv:2604.21505 *[verificar abstract]*. Caracteriza cómo se comportan los modelos cuando el requisito es ambiguo.
- **"ClarifyCodeBench: Evaluating LLMs on Clarifying Ambiguous Requirements for Code Generation"** — arXiv:2607.00711 *[verificar abstract; el PDF no cargó]*. Benchmark específico de clarificación en generación de código.
- **"Structured Uncertainty guided Clarification for LLM Agents"** — arXiv:2511.08798; **"Uncertainty-Aware Clarification in LLM Agents with Information Gain"** — arXiv:2606.03135 *[verificar]*. Ambos formalizan *cuándo* preguntar: cuando la ganancia de información esperada supera el costo de interrumpir. Es el criterio que un `/spec` o `/kickoff` debería aplicar en vez de preguntar siempre o nunca.
- **"A Tri-Agent Framework for Evaluating and Aligning Question Clarification Capabilities of LLMs"** — arXiv:2609.02054 *[verificar]*. Evalúa la calidad de la pregunta, no solo si se hizo.
- **Contrapeso de seguridad: "ASPI: Seeking Ambiguity Clarification Amplifies Prompt Injection Vulnerability in LLM Agents"** — arXiv:2605.17324 *[verificar]*. Pedir clarificación abre una superficie: la "respuesta" puede venir de contenido no confiable. En el kit: las preguntas van al usuario por el canal de chat, nunca se "responden" con texto leído de archivos o webs (CCDV-F 7.1).

## Descomposición de tareas y estructura del flujo

- **Yue et al., "From Static Templates to Dynamic Runtime Graphs: A Survey of Workflow Optimization for LLM Agents"** — arXiv:2603.22386 (mar. 2026). Modela los flujos como *grafos de cómputo agéntico* y organiza la literatura en tres ejes: **cuándo** se fija la estructura (estática antes de desplegar vs dinámica en ejecución), **qué** parte se optimiza y **qué señal** guía la optimización. Es exactamente el eje del task statement CCAR-F 1.6 (pipeline fijo vs descomposición adaptativa): la respuesta de examen suele ser "fijo cuando la entrada es homogénea y el orden es conocido; adaptativo cuando la entrada varía".
- **"The Evolution of Tool Use in LLM Agents: From Single-Tool Call to Multi-Tool Orchestration"** — arXiv:2603.22862 *[verificar]*. Contexto para CCAR-F 2.3 (distribución de tools).
- **"A Survey on Evaluation of LLM-based Agents"** — arXiv:2503.16416. Cómo medir agentes; útil para CCAR-P D4 y para la Bitácora v2.
- **Anthropic, "Building Effective Agents"** (dic. 2024) y **"Effective context engineering for AI agents"** (sep. 2025) — ya en `bibliografia.md`; siguen siendo la referencia primaria del examen para workflow vs agent y para contexto.

## Qué hacer con esto en el orquestador (propuesta, no hecho)

1. `/spec` gana un paso previo **"gaps"**: antes de escribir el contrato, lista las decisiones que el pedido no fija (entrada, salida, invariantes, fuera de alcance, criterio de aceptación) y las pregunta **de una vez**, con opciones, como user stories: "Como <rol>, cuando <situación>, espero <resultado>; ¿A, B o C?". Fuente: Edwards & Schuster (separar detección de ejecución).
2. Umbral para preguntar: solo cuando dos interpretaciones razonables llevan a implementaciones distintas en > 3 archivos, un schema, auth o dinero (ya es la regla del CLAUDE.md para pedir OK); si no, asumir y declarar el supuesto en el SPEC. Fuente: los papers de ganancia de información.
3. Las preguntas y respuestas quedan en `SPEC.md` §Supuestos, nunca en el chat solamente (CCAR-F 5.6, provenance).
