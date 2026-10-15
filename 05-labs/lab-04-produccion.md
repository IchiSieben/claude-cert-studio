# Lab 04 — Grado producción: async, errores, logging, versionado

**Proyecto**: signal-agent (ledger de predicciones; 163 tests, mypy strict, GitHub Actions).
**Objetivos**: D2.T4.a/b/c · D2.T6 · D2.T2 · D5.T2.a · D5.T3.c · D4.T1
**Tiempo**: 4–5 h.

## Requerimiento

> El módulo que genera señales debe procesar **200 indicadores en < 2 min** sin superar el rate limit del tier, sobrevivir a 429/529 sin perder trabajo, registrar cada llamada de forma auditable, y permitir **cambiar de versión de prompt o de modelo con evidencia** (eval de regresión) y sin sorpresas.

## Pasos

### 1. Async con concurrencia acotada

- `AsyncAnthropic` + `asyncio.Semaphore(N)` + `asyncio.gather(..., return_exceptions=True)`. Medir tiempo total con N = 1, 4, 8, 16. Observar dónde aparece el 429.
- Idempotencia: cada indicador tiene `id`; si el proceso se cae a la mitad y se relanza, no duplica señales en el ledger.

### 2. Errores y reintentos

- Configurar `max_retries` y `timeout` en el cliente; probar `max_retries=0` para ver los errores crudos.
- Tabla de decisión implementada: 400/401/404 → no reintentar, fallar ruidoso; 429 → backoff exponencial + jitter, respetar `retry-after`; 500/529 → backoff; `overloaded` sostenido → fallback de modelo (Sonnet → Haiku) con marca en el log.
- Test con `respx`/mock que simula cada código.

### 3. Logging estructurado

- Un registro JSON por llamada con: `ts, request_id, modelo, prompt_version, input_tokens, output_tokens, cache_read, cache_write, stop_reason, latencia_ms, tools, costo_estimado, indicador_id`. Nada de PII.
- Un script que lee los logs con DuckDB y saca: costo/día, p95 de latencia, distribución de `stop_reason`, tasa de error por tipo.

### 4. Versionado de prompts y modelos

- `prompts/senal_v3.md` con frontmatter (versión, fecha, modelo objetivo, changelog). El código carga por versión; el log registra `prompt_version`.
- `config.toml` con `model = "claude-…-YYYYMMDD"` pinneado. Documentar el procedimiento de migración: cambiar en staging → correr eval → comparar → promover.

### 5. Eval de regresión en CI

- `eval/senales.jsonl`: 30 casos (indicador + señal esperada o rúbrica). Test parametrizado que corre el prompt actual y exige ≥ umbral de acuerdo. Por costo, correrlo con **Batches** en el job nocturno y con Haiku en cada PR.
- GitHub Actions: secret `ANTHROPIC_API_KEY`, job que ejecuta la eval y publica el resumen como comentario del PR (opcional: con `claude -p` headless, D3).

### 6. Trazas: aislar integración vs modelo

- Introduce 3 fallas a propósito: (a) modelo inexistente, (b) `max_tokens=20`, (c) descripción de tool ambigua. Para cada una, escribe en `LAB.md` cómo la traza te dice en qué capa está el problema.

## Verificación

- [ ] 200 indicadores en < 2 min sin errores no manejados; sin duplicados tras relanzar.
- [ ] Tests de los 6 códigos HTTP.
- [ ] Log JSON + consulta DuckDB funcionando.
- [ ] Cambio de `prompt_version` visible en el log; eval de regresión pasa en CI.
- [ ] `LAB.md` con las 3 trazas analizadas.

## Qué aprendiste

1. ¿Qué errores reintenta el SDK solo y con qué política?
2. RPM/ITPM/OTPM: ¿cuál te limitó y cómo lo supiste?
3. ¿Por qué idempotencia importa en un pipeline con LLM?
4. ¿Qué es un breaking change de modelo y cómo lo detecta tu eval?
5. ¿Qué campos del log te permiten calcular el costo exacto?
6. ¿Cómo distinguiste en las trazas integración vs modelo?
