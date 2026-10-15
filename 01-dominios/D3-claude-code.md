# D3 · Claude Code — 3.1 % (~2 preguntas)

> Componentes (Rules, Skills, Commands, Agents, Agent Memory), gestión de sesión, slash commands, modos headless/streaming/auto, jerarquía de `CLAUDE.md` y `settings.json`.
> Pesa poco en CCDV-F (20 % en CCAR-F). Es tu terreno: el objetivo aquí es **nombrar con precisión lo que ya haces** y no perder las 2 preguntas por un detalle de jerarquía.

---

## 1. Componentes

| Componente | Dónde vive | Qué hace | Cuándo se carga |
|---|---|---|---|
| **CLAUDE.md** (memoria de proyecto) | `~/.claude/CLAUDE.md` (usuario), `./CLAUDE.md` (proyecto, versionado), `./CLAUDE.local.md` (personal, gitignored), `CLAUDE.md` en subdirectorios | Instrucciones persistentes: convenciones, comandos, arquitectura | Siempre al inicio (los de subdirectorio, al trabajar en ellos). Soporta `@ruta` para importar archivos |
| **Rules** | `.claude/rules/*.md` | Instrucciones modulares por tema (pueden aplicar por patrón de archivos) | Siempre (o por ruta) |
| **Skills** | `.claude/skills/<n>/SKILL.md` (+ scripts, plantillas); también `~/.claude/skills/` y vía plugins | Conocimiento procedimental que el modelo carga **bajo demanda** cuando la descripción coincide con la tarea | Solo el nombre+descripción siempre; el cuerpo cuando hace falta (*progressive disclosure*) |
| **Commands** (slash) | `.claude/commands/<n>.md`, `~/.claude/commands/` | Prompts reutilizables que **el usuario** invoca con `/nombre args` | Al invocarlos |
| **Agents** (subagentes) | `.claude/agents/<n>.md`, `~/.claude/agents/` | Agentes especializados con `description`, `tools`, `model`, system prompt propio y **contexto aislado** | Cuando Claude delega o el usuario lo pide |
| **Agent Memory** | `~/.claude/projects/<proyecto>/memory/` (auto-memory) | Notas que Claude guarda entre sesiones sobre el proyecto | Al inicio de sesión |
| **Hooks** | `settings.json` → `hooks` | Comandos en eventos del ciclo (D7.T3) | En cada evento |
| **MCP servers** | `.mcp.json` (proyecto), `~/.claude.json` (usuario), `claude mcp add` | Tools/resources externos | Al inicio |
| **Plugins** | Marketplaces; `/plugin` | Paquetes de skills+commands+agents+hooks+MCP | Al instalar |

Regla de diseño (la misma de D8.T3): **siempre cargado y corto** → CLAUDE.md/rules; **largo y ocasional** → skill; **lo dispara el humano** → command; **necesita contexto propio** → agent; **debe garantizarse** → hook/permiso.

---

## 2. Jerarquía de configuración

### 2.1 `CLAUDE.md`

Orden de carga (todos se concatenan, los más específicos matizan a los generales): managed/enterprise → `~/.claude/CLAUDE.md` → `CLAUDE.md` de directorios padres hasta la raíz del repo → `./CLAUDE.md` → `./CLAUDE.local.md` → `CLAUDE.md` de subdirectorios al tocarlos. `/init` genera uno; `/memory` los abre; `#` al inicio de un mensaje añade una línea rápido.

### 2.2 `settings.json`

| Nivel | Ruta | Alcance | Prioridad |
|---|---|---|---|
| Managed (enterprise) | `/etc/claude-code/managed-settings.json` (Linux), equivalente en macOS/Windows | Toda la organización; no se puede sobreescribir | **Máxima** |
| Usuario | `~/.claude/settings.json` | Todos tus proyectos | |
| Proyecto | `.claude/settings.json` | El repo, se versiona y comparte | |
| Local | `.claude/settings.local.json` | El repo, solo tú, gitignored | Sobre proyecto |

Claves frecuentes: `permissions.allow/ask/deny` (patrones tipo `Bash(npm run *)`, `Read(./secrets/**)`), `hooks`, `model`, `env`, `enabledPlugins`, `includeCoAuthoredBy`, `cleanupPeriodDays`.

### 2.3 Permission modes

`default` (pregunta en acciones sensibles) · `acceptEdits` (auto-acepta ediciones de archivos) · `plan` (solo lee y planifica, no ejecuta) · `bypassPermissions` (no pregunta nada — solo en sandboxes). Se cambian con `Shift+Tab`, `--permission-mode`, o en settings.

---

## 3. Sesiones y modos de operación

| Modo | Cómo | Para qué |
|---|---|---|
| Interactivo | `claude` | Trabajo normal |
| Continuar / reanudar | `claude -c` (última), `claude -r <id>` (elegir) | Retomar contexto |
| **Headless / no interactivo** | `claude -p "prompt"` | Scripts, CI/CD, pipelines. Sale al terminar |
| Salida estructurada | `--output-format json` / `stream-json` | Consumir la respuesta desde código; `stream-json` emite eventos línea a línea |
| Entrada por pipe | `cat log.txt \| claude -p "resume"` | Pasar datos |
| Auto / sin preguntas | `--permission-mode bypassPermissions` o `--dangerously-skip-permissions` | Contenedores aislados |
| Herramientas acotadas | `--allowedTools "Read,Grep,Bash(pytest*)"` | Headless seguro |
| Límite de turnos | `--max-turns N` | Acotar costo en automatizaciones |
| Modelo | `--model` | Elegir Haiku/Sonnet/Opus por tarea |

Slash commands built-in que hay que reconocer: `/init`, `/compact [instrucciones]`, `/clear`, `/memory`, `/config`, `/permissions`, `/mcp`, `/agents`, `/hooks`, `/cost`, `/model`, `/review`, `/help`, `/plugin`.

**Compactación**: `/compact` resume la conversación conservando lo esencial; ocurre también automáticamente cerca del límite. Las *compact instructions* en `CLAUDE.md` (como la sección que ya tienes en el Portfolio) y el hook `PreCompact` controlan qué sobrevive.

---

## 4. Hooks (referencia técnica; uso de seguridad en D7.T3)

Eventos: `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PermissionRequest`, `PostToolUse`, `Notification`, `Stop`, `SubagentStop`, `PreCompact`, `SessionEnd`. Tipos: `command` (shell; recibe JSON por stdin) y `prompt` (evaluación por el modelo). `matcher` filtra por nombre de tool (regex). Salida: exit 0 = ok (stdout puede añadirse al contexto en algunos eventos), exit 2 = **bloquear** y devolver stderr al modelo; o JSON con `decision`/`permissionDecision`.

---

## 5. Claude Code en CI/CD y GitHub

- GitHub Action oficial (`anthropics/claude-code-action`): responde a `@claude` en issues/PRs, revisa código, genera tests. Credenciales por secrets del repo (o Bedrock/Vertex OIDC).
- Headless en cualquier CI: `claude -p --output-format json --allowedTools ... --max-turns ...`.
- Buenas prácticas: `CLAUDE.md` con convenciones; permisos mínimos; hooks para formateo/lint; PR review como *gate*, no como merge automático.

---

## 6. Aplicarlo en tus proyectos (ya lo haces; esta vez con nombres)

| Proyecto | Ejercicio | Objetivos |
|---|---|---|
| **claude-kit** | Escribir un `docs/arquitectura.md` del kit usando la tabla de §1: qué es rule, qué skill, qué command, qué agent, qué hook, y por qué cada cosa está donde está. Verificar que `settings.json` de usuario vs proyecto no tengan reglas duplicadas. | D3.T1.a/c |
| **Portfolio** | Auditar `CLAUDE.md` del Portfolio + `.claude/rules/` + `.claude/agents/` con la regla "siempre cargado y corto": mover a skills lo largo y ocasional. Medir tokens de arranque de sesión con `/cost` antes y después. | D3.T1.c, D6.T1 |
| **signal-agent** (ya con GitHub Actions) | Añadir un job headless: `claude -p` revisa el PR contra una checklist de falsabilidad y comenta. `--max-turns 5`, `--allowedTools "Read,Grep,Glob"`. | D3.T1.b, D2.T4.c |
| **Chasqui** | Comando `/informe-diario` que corre el pipeline y resume errores; hook `Stop` que verifica que el Excel se generó. | D3.T1.a |
| **Equipo de datos (caso genérico)** | Documento de propuesta "Claude Code para un equipo de datos": configuración managed, `CLAUDE.md` del repo de productos estadísticos, permisos `deny` para producción. | D3.T1.c, D7 |

## 7. Autoevaluación

1. Orden de carga de los `CLAUDE.md`.
2. Cuatro niveles de `settings.json` y cuál gana.
3. Diferencia skill vs command vs agent en una frase cada uno.
4. ¿Qué es progressive disclosure y por qué ahorra tokens?
5. Comando para correr Claude Code en un pipeline y obtener JSON.
6. Cuatro permission modes.
7. ¿Qué hace `/compact` y cómo controlas qué conserva?
8. ¿Dónde se registra un MCP para compartirlo con el equipo?
9. Exit code que bloquea en un hook `PreToolUse`.
10. ¿Qué es un plugin?

## 8. Fuentes

- Docs Claude Code: https://docs.claude.com/en/docs/claude-code/overview
- Memoria / CLAUDE.md: https://docs.claude.com/en/docs/claude-code/memory
- Settings: https://docs.claude.com/en/docs/claude-code/settings
- Hooks: https://docs.claude.com/en/docs/claude-code/hooks
- Subagentes: https://docs.claude.com/en/docs/claude-code/sub-agents · Skills: /skills · Slash commands: /slash-commands
- Headless / SDK: https://docs.claude.com/en/docs/claude-code/headless
- GitHub Actions: https://docs.claude.com/en/docs/claude-code/github-actions
- Best practices: https://www.anthropic.com/engineering/claude-code-best-practices
- Curso: *Claude Code in Action* (anthropic.skilljar.com)
