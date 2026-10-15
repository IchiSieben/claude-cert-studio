# Bibliografía y fuentes

Ordenada por prioridad de lectura. Marcadores: ★ obligatorio · ◆ recomendado · ○ referencia (consultar, no leer entero). Fecha de verificación de enlaces: 2026-09-25. Los enlaces de docs.claude.com se reorganizan a veces; si uno falla, buscar el título en el buscador de docs.

## 0. Fuentes oficiales del examen

- ★ *Claude Certified Developer – Foundations Exam Guide*, v1.0, Anthropic, julio 2026. Blueprint, perfil del candidato, políticas, 3 preguntas de muestra. Se descarga desde la página de la certificación en Anthropic Partner Academy (requiere cuenta partner; hay copias públicas indexadas en buscadores). Transcrito en `../00-examen/02-blueprint-completo.md`.
- ★ FAQ oficial de certificaciones — https://anthropic-partners.skilljar.com/page/faq-certifications (elegibilidad, costos, reintentos, renovación).
- ◆ Programa en Pearson VUE — https://www.pearsonvue.com/us/en/anthropic.html
- ◆ Prep courses oficiales por certificación — https://anthropic-partners.skilljar.com/page/claude-certification-exam-prep-courses
- ○ Página de la certificación CCDV-F — https://anthropic-partners.skilljar.com/claude-certified-developer-foundations-certification

## 1. Los dos textos doctrinales de Anthropic (leer completos, 1 h en total)

- ★ *Building Effective Agents* (Schluntz & Zhang, dic. 2024) — https://www.anthropic.com/research/building-effective-agents. Define workflow vs agente y los 5 patrones. Base de D1.
- ★ *Effective context engineering for AI agents* (sep. 2025) — https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents. Context rot, altitud correcta, compactación, note-taking, subagentes, just-in-time. Base de D6.

## 2. Engineering blog de Anthropic (◆, 20–30 min cada uno)

- *Writing tools for agents* — https://www.anthropic.com/engineering/writing-tools-for-agents (D8.T1)
- *Claude Code best practices* — https://www.anthropic.com/engineering/claude-code-best-practices (D3)
- *How we built our multi-agent research system* — https://www.anthropic.com/engineering/multi-agent-research-system (D1.T1.b, D6.T1.c)
- *Equipping agents for the real world with Agent Skills* — https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills (D8.T3)
- *Building agents with the Claude Agent SDK* — https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk (D1.T2)
- ○ *Demystifying evals for AI agents* (título aproximado; buscar en el blog) (D4)

## 3. Documentación de la Claude API (docs.claude.com) — por dominio

### D2 / D5
- ★ Messages API reference — https://docs.claude.com/en/api/messages
- ★ Tool use overview + implement — https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview
- ★ Prompt caching — https://docs.claude.com/en/docs/build-with-claude/prompt-caching
- ★ Batch processing — https://docs.claude.com/en/docs/build-with-claude/batch-processing
- ★ Streaming — https://docs.claude.com/en/docs/build-with-claude/streaming
- ◆ Extended thinking — https://docs.claude.com/en/docs/build-with-claude/extended-thinking
- ◆ Vision, PDF support, Files API, Citations — https://docs.claude.com/en/docs/build-with-claude/vision · /pdf-support · /files · /citations
- ◆ Models overview, Choosing a model, Pricing, Migration guide — https://docs.claude.com/en/docs/about-claude/models · /models/choosing-a-model · /pricing · /models/migration-guide
- ◆ Errors, Rate limits — https://docs.claude.com/en/api/errors · https://docs.claude.com/en/api/rate-limits
- ◆ Client SDKs — https://docs.claude.com/en/api/client-sdks
- ○ Token counting, Context windows — https://docs.claude.com/en/docs/build-with-claude/token-counting · /context-windows
- ○ Bedrock / Vertex / Foundry — https://docs.claude.com/en/api/claude-on-amazon-bedrock · /claude-on-vertex-ai
- ○ Admin API — https://docs.claude.com/en/api/administration-api

### D6
- ★ Prompt engineering overview y subpáginas (be clear, examples, chain of thought, XML tags, system prompts, prefill, chain prompts, long context) — https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview
- ◆ Claude 4 prompting best practices — https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/claude-4-best-practices
- ◆ Structured outputs / JSON mode (nombre y ruta pueden variar) — buscar "structured outputs" en docs
- ○ Context editing, Memory tool — https://docs.claude.com/en/docs/build-with-claude/context-editing · /memory-tool
- ○ Prompt library, Prompt generator (Console) — https://docs.claude.com/en/resources/prompt-library

### D1 / D3
- ★ Claude Agent SDK overview (Python y TypeScript) — https://docs.claude.com/en/api/agent-sdk/overview
- ★ Claude Code docs: overview, memory (CLAUDE.md), settings, hooks, sub-agents, skills, slash commands, MCP, headless, GitHub Actions, security/IAM, monitoring — https://docs.claude.com/en/docs/claude-code/overview
- ○ Frameworks nombrados en el blueprint: Strands Agents — https://strandsagents.com · LangGraph — https://langchain-ai.github.io/langgraph · PydanticAI — https://ai.pydantic.dev

### D8
- ★ Model Context Protocol: introducción y especificación (Architecture, Tools, Resources, Prompts, Transports, Authorization) — https://modelcontextprotocol.io · https://modelcontextprotocol.io/specification
- ◆ MCP Python SDK (FastMCP) — https://github.com/modelcontextprotocol/python-sdk
- ◆ MCP Inspector — https://github.com/modelcontextprotocol/inspector
- ◆ Agent Skills overview — https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview
- ○ Anthropic skills repo (ejemplos) — https://github.com/anthropics/skills

### D7
- ★ Strengthen guardrails: mitigate jailbreaks, reduce prompt leak, reduce hallucinations — https://docs.claude.com/en/docs/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks
- ◆ OWASP Top 10 for LLM Applications — https://owasp.org/www-project-top-10-for-large-language-model-applications/
- ◆ Claude Code security e IAM — https://docs.claude.com/en/docs/claude-code/security · /iam
- ○ Anthropic Usage Policy — https://www.anthropic.com/legal/aup · Privacidad de datos de la API — https://privacy.claude.com
- ○ Ley 29733 de Protección de Datos Personales (Perú) — contexto local para PII.

### D4
- ◆ Define success criteria, Develop test cases, Evaluation tool — https://docs.claude.com/en/docs/test-and-evaluate/define-success · /develop-tests · /eval-tool

## 4. Cursos gratuitos de Anthropic Academy (anthropic.skilljar.com)

| Curso | Dominios | Prioridad |
|---|---|---|
| Building with the Claude API | D2, D5, D6, D8.T1 | ★ |
| Introduction to Model Context Protocol | D8.T2 | ★ |
| MCP: Advanced Topics | D8.T2 | ◆ |
| Claude Code in Action | D3, D1.T2 | ★ |
| Introduction to Agent Skills | D8.T3 | ◆ |
| Introduction to subagents (si está listado) | D1.T1.b | ◆ |
| Claude Platform 101 / Claude 101 | contexto general | ○ |
| Claude with Amazon Bedrock / Google Vertex AI | D2.T3.g | ○ (solo si lo usarás) |

Portal: https://www.anthropic.com/learn · Algunos también en Coursera: https://www.coursera.org/partners/anthropic

## 5. Guías de terceros (útiles, no oficiales; contrastar con lo oficial)

- Claude Certification Guide — https://claudecertificationguide.com (la que me pasaste): guía gratuita con 30 lecciones, 250+ preguntas y mock exam **del CCAR-F**; página del CCDV-F con blueprint y datos del examen; blog comparando las 4 certificaciones.
- Repo unofficial study guide CCAR-F — https://github.com/dnacenta/claude-certified-architect
- Artículo DEV: *The Claude Certified Architect Exam: 5 domains, 6 scenarios* — https://dev.to/aws-builders/the-claude-certified-architect-exam-5-domains-6-scenarios-and-everything-you-need-to-know-4le3
- cloud-authority.com, findskill.ai, k21academy, flashgenius, certificationpractice: resúmenes y bancos de preguntas de pago o freemium. Sirven para practicar volumen; **ninguno tiene preguntas reales** (son confidenciales bajo NDA) y algunos contradicen la FAQ oficial en elegibilidad.

## 6. Cómo mantener esta bibliografía

- Cada vez que docs.claude.com anuncie un modelo nuevo, un beta graduado o un parámetro renombrado, anotarlo en `../NOTES.md` con fecha y actualizar el dominio afectado.
- Los pesos del blueprint cambian por versión del exam guide; si aparece v1.1+, rehacer `02-blueprint-completo.md` y la checklist.
