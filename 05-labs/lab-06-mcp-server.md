# Lab 06 — Servidor MCP, Skill y auditoría del kit

**Proyecto**: nuevo `Portfolio/mcp-estadistica/` con **datos sintéticos** (nunca datos reales) + `claude-kit`.
**Objetivos**: D8.T2 · D8.T3 · D3.T1 · D2.T5.a · D2.T6.a
**Tiempo**: 5–6 h.

## Requerimiento

> Varias herramientas (Claude Code, Claude Desktop, un futuro Text2SQL) deben poder **listar tablas, describirlas y ejecutar consultas de solo lectura** sobre un esquema estadístico sintético, con un glosario compartido y un prompt estándar de análisis de ejecución presupuestal. La integración debe mantenerse en un solo lugar y reutilizarse.

Pregunta de examen implícita: ¿custom tool en cada app, o MCP? → MCP (reutilizable, independiente, datos vivos).

## Pasos

### 1. Datos sintéticos

- DuckDB con 4 tablas inventadas (`ue`, `ipress`, `atenciones_mes`, `ejecucion_presupuestal`) y 1 000 filas generadas. Esquema parecido al real, contenido falso.

### 2. Servidor (FastMCP, stdio)

- Tools: `listar_tablas()`, `describir_tabla(nombre)`, `consultar_sql_readonly(sql, limite=200)`. Descripciones de 4 frases. Errores como mensajes útiles (no stack traces).
- `consultar_sql_readonly`: solo `SELECT`, sin `;`, sin palabras prohibidas, límite de filas, conexión **read-only** de DuckDB. (Esto es D7 adelantado.)
- Resource `datos://glosario` (markdown). Prompt `analizar_ejecucion(ue)`.
- Probar con el MCP Inspector (`npx @modelcontextprotocol/inspector python server.py`).

### 3. Registrar en dos hosts y observar la diferencia

- Claude Code: `claude mcp add estadistica -- python server.py` (usuario) y luego en `.mcp.json` (proyecto, compartible). `/mcp` para ver estado. Pídele que analice una UE.
- Claude Desktop: `claude_desktop_config.json`. Misma pregunta.
- Anota: qué configuración vive dónde, qué se comparte y qué no (D2.T5.a).

### 4. Streamable HTTP

- `mcp.run(transport="streamable-http")` en un puerto local; token simple en cabecera (para el lab; en producción OAuth 2.1). Conectar desde Claude Code con `claude mcp add --transport http`. ¿Qué cambia respecto a stdio? (proceso independiente, multi-cliente, red, auth).

### 5. Skill

- `.claude/skills/catalogo-datos/SKILL.md`: metodología para documentar un producto estadístico (pasos, plantilla, checklist) + `scripts/validar_ficha.py`. Frontmatter con `name` y `description` precisa (es lo que decide cuándo se carga).
- Verifica *progressive disclosure*: en una sesión nueva, pregunta algo no relacionado y comprueba (con `/cost` o la traza) que el cuerpo de la skill no se cargó; luego pide documentar un producto y observa que sí.

### 6. Auditoría de `claude-kit`

- Tabla con cada pieza del kit y su mecanismo actual (rule / skill / command / agent / hook / MCP). Aplica la regla: siempre-cargado-y-corto → rule; largo-y-ocasional → skill; lo-dispara-el-humano → command; contexto-propio → agent; garantía → hook. Mueve al menos 2 piezas. Mide tokens de arranque de sesión antes/después.
- Documenta la jerarquía de `settings.json` que realmente tienes (usuario vs proyecto vs local) y elimina duplicados.

## Verificación

- [ ] Inspector muestra 3 tools, 1 resource, 1 prompt.
- [ ] `consultar_sql_readonly("DROP TABLE ue")` → error útil, nada ejecutado.
- [ ] Funciona en Claude Code y Desktop por stdio; en Claude Code por HTTP.
- [ ] Skill se carga solo cuando corresponde.
- [ ] `claude-kit/docs/arquitectura.md` con la tabla y los cambios.

## Qué aprendiste

1. Tools vs resources vs prompts: quién controla cada uno.
2. stdio vs Streamable HTTP: cuándo cada uno y qué implica para auth.
3. ¿Por qué MCP y no una tool custom aquí?
4. ¿Qué es progressive disclosure y cómo lo verificaste?
5. Orden de carga de `CLAUDE.md` y de `settings.json`.
6. ¿Qué configuración de Claude Desktop ve tu script con el SDK? (ninguna) ¿Por qué?
