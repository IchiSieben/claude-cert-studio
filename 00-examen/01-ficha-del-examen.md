# Ficha del examen — Claude Certified Developer – Foundations (CCDV-F)

> Fuente primaria: *Claude Certified Developer – Foundations Exam Guide*, v1.0, vigente desde julio 2026 (Anthropic).
> Complementado con la FAQ oficial de certificaciones (Anthropic Partner Academy) y la página del programa en Pearson VUE.
> Verificado: 2026-09-25. Todo lo que diga "según Anthropic" sale de esas tres fuentes; lo demás está marcado como terceros.

## 1. Qué es

Credencial que valida que sabes **construir aplicaciones Claude de grado producción**: API, herramientas, agentes, prompt/context engineering, seguridad y evaluación. Es el examen "de código". Su hermano, el Architect – Foundations (CCAR-F), es el examen "de diseño de sistemas" (escenarios).

| Dato | Valor |
|---|---|
| Código | CCDV-F |
| Versión / vigencia | 1.0 · julio 2026 |
| Preguntas | **53 ítems** |
| Tiempo | **120 min** (~2 min 15 s por pregunta) |
| Formato | Opción múltiple y respuesta múltiple; cada ítem dice cuántas respuestas marcar |
| Aprobación | **720 / 1000** (escala 100–1000, puntaje escalado) |
| Reporte | Aprobado/desaprobado + puntaje + % de aciertos por dominio |
| Idioma | Solo inglés |
| Costo | **US$ 125** por intento (Associate 99, Architect-F 125, Architect-P 175) |
| Entrega | Pearson VUE: OnVUE (online con proctor) o centro de examen |
| Libro cerrado | Sin notas, sin traductores, sin asistentes de IA |
| Vigencia | 12 meses. Renovación gratis con una evaluación no supervisada si la haces a tiempo; si caduca, examen completo otra vez |
| Reintentos | Espera de 14 → 30 → 90 días tras cada desaprobado; máx. 4 intentos por 12 meses rodantes; se paga cada uno |
| Reprogramar | Hasta 24 h antes (Pearson dice 48 h para centros); dentro de ese plazo se pierde el pago |
| ID | Documento oficial con foto, nombre exacto al registrado |

## 2. Quién puede rendirlo — LEER PRIMERO

Según la **FAQ oficial** (anthropic-partners.skilljar.com/page/faq-certifications):

- **Solo personas empleadas en organizaciones del Claude Partner Network.** El registro exige un correo con dominio de la empresa partner; los correos personales no funcionan. "Customers and non-partners cannot participate."
- Mayor de 18 años.
- El registro, una vez pagado, vale 5 años para agendar.
- Descuentos automáticos por tier del partner: 50 % (Select/Preferred/Global Premier) y 100 % para Global Premier hasta el 31-dic-2026.

**Qué significa para ti:** si no trabajas en una organización partner, la vía realista es que **una organización del Claude Partner Network te registre con su correo corporativo** cuando trabajes con ella. Estudiar antes es exactamente la jugada correcta: llegas listo y el examen es un trámite. Algunas guías de terceros dicen que "individuos pueden rendirlo"; la FAQ oficial dice lo contrario. Cuando llegue el momento, confirmar con esa organización o con certifications-support@anthropic.com. *(FAQ reverificada el 2026-10-15: sin cambios.)*

## 3. Perfil del candidato (según Anthropic)

- 1–5 años de experiencia en ingeniería de software.
- ≥ 6 meses de trabajo práctico con Claude o LLMs comparables.
- Python y/o TypeScript, fluidez con REST y CLI.
- **Fuera de alcance**: usuarios no técnicos, uso casual, gente que solo escribe prompts sin responsabilidad de desarrollo.

Tu perfil ya cumple: data engineer con Python, ETL, Docker, Claude Code diario, agentes propios (`signal-agent`, `Chasqui`, `orquestador`). Lo que falta no es experiencia, es **vocabulario exacto y cobertura sistemática** de los 8 dominios — y eso es lo que arma esta carpeta.

## 4. Los 8 dominios (peso oficial)

| # | Dominio | Peso | ≈ preguntas de 53 |
|---|---|---|---|
| 2 | Applications and Integration | **33.1 %** | ~18 |
| 5 | Model Selection and Optimization | **16.8 %** | ~9 |
| 1 | Agents and Workflows | **14.7 %** | ~8 |
| 6 | Prompt and Context Engineering | **11.0 %** | ~6 |
| 8 | Tools and MCPs | **10.6 %** | ~6 |
| 7 | Security and Safety | **8.1 %** | ~4 |
| 3 | Claude Code | **3.1 %** | ~2 |
| 4 | Eval, Testing, and Debugging | **2.6 %** | ~1 |

Lectura estratégica: **un solo dominio vale un tercio del examen** y pesa más que los cuatro dominios de abajo juntos (24.4 %). El desglose completo con las tareas y objetivos está en `02-blueprint-completo.md`.

## 5. Preparación recomendada por Anthropic (literal del exam guide)

1. Autoevaluarse contra cada objetivo del blueprint.
2. Revisar la documentación oficial de: Claude API, modelos, prompt engineering, Claude Code, Skills y MCP.
3. **Construir al menos una aplicación Claude** que ejercite API, tools, prompt/context engineering, seguridad y evaluación.
4. Practicar: escribir prompts, construir agentes/workflows, gestionar tokens, poner guardrails, crear tools propias.
5. Hacer las preguntas de muestra.

El punto 3 es literalmente tu plan: estudiar construyendo. Ver `02-plan/`.

## 6. Ruta de preparación oficial (Partner Academy) y pública

- Prep track oficial (requiere cuenta partner): `anthropic-partners.skilljar.com/path/claude-certified-developer-foundations` — 5 cursos.
- Cursos **públicos y gratis** de Anthropic Academy (`anthropic.skilljar.com`), los que sí puedes hacer hoy: *Building with the Claude API*, *Introduction to MCP*, *MCP: Advanced Topics*, *Claude Code in Action*, *Introduction to Agent Skills*, *Claude Platform 101*. Lista completa en `04-bibliografia/`.
- Guía gratuita de terceros con 250+ preguntas y mock exam (la que me pasaste): claudecertificationguide.com — su track construido es el de Architect (CCAR-F); el de Developer estaba "planned" al 2026-09-25.

## 7. Las otras tres certificaciones (para ubicarte)

| Cert | Código | Para quién | Ítems / dominios | Precio |
|---|---|---|---|---|
| Associate – Foundations | CCAO-F | Usuarios de negocio, sin código | 60 / 7 | $99 |
| **Developer – Foundations** | **CCDV-F** | Ingenieros que construyen apps Claude | **53 / 8** | **$125** |
| Architect – Foundations | CCAR-F | Arquitectos de solución (4 de 6 escenarios) | 60 / 5 | $125 |
| Architect – Professional | CCAR-P | Arquitectos senior, gobierno/lifecycle | 63 / 7 | $175 |

No hay prerrequisitos entre ellas. Anthropic dice: elegir por rol, no por dificultad. El material de esta carpeta cubre CCDV-F al 100 % y, de paso, el ~80 % de CCAR-F (los dominios se solapan mucho; ver nota al final del blueprint).

## 8. Enlaces oficiales

- Programa (Pearson VUE): https://www.pearsonvue.com/us/en/anthropic.html
- FAQ oficial: https://anthropic-partners.skilljar.com/page/faq-certifications
- Página de la certificación: https://anthropic-partners.skilljar.com/claude-certified-developer-foundations-certification
- Prep courses: https://anthropic-partners.skilljar.com/page/claude-certification-exam-prep-courses
- Agendar examen: https://wsr.pearsonvue.com/testtaker/signin/SignInPage/ANTHROPIC
- Academy pública: https://anthropic.skilljar.com · https://www.anthropic.com/learn
- Soporte: certifications-support@anthropic.com
