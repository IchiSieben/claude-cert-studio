# Labs — estudiar construyendo

Cada lab es una **especificación** para hacerlo con Claude Code dentro de uno de tus proyectos (no en esta carpeta). El formato imita lo que el examen evalúa: requerimiento → decisiones → implementación → verificación → qué aprendiste con vocabulario del blueprint.

Cómo usarlos con Claude Code:

```
cd ~/Documents/Portfolio/<proyecto>
claude
> Lee ../claude-cert/05-labs/lab-02-tool-loop.md y ayúdame a implementarlo en este proyecto.
> Explícame cada decisión con los términos del blueprint del CCDV-F antes de escribir código.
```

Reglas para que el lab sirva para estudiar (no solo para que funcione):

1. **Tú escribes la primera versión del código crítico** (el loop, la definición de la tool, el `cache_control`). Claude revisa. Si Claude lo escribe todo, no fija.
2. Al terminar, responde por escrito las preguntas de "Qué aprendiste" en un `LAB.md` dentro del proyecto. Pídele a Claude que te haga 5 preguntas de examen sobre lo que acabas de hacer.
3. Mide siempre: `usage`, latencia, costo. Sin números no hay optimización.
4. Commits con etiqueta del objetivo: `feat(chasqui): resumen ejecutivo via Batches [CCDV-F D2.T3.h]`.
5. Presupuesto: usa Haiku para iterar y Sonnet para la versión final. Todo el plan de 8 semanas debería costar < US$ 20 de API.

| Lab | Semana | Proyecto sugerido | Dominios |
|---|---|---|---|
| 01 Messages API | 1 | Chasqui | D2.T3, D5.T1 |
| 02 Tool loop + salida estructurada | 2 | farmacias | D2.T3.b, D8.T1, D6.T3 |
| 03 Caching + Batch + costo | 3 | Chasqui / stt_whisper | D5.T4, D2.T3.f/h, D5.T3 |
| 04 Producción: async, errores, logging, versionado | 4 | signal-agent | D2.T4, D2.T6, D5.T2, D4 |
| 05 Agente con Agent SDK + subagentes | 5 | archivador de videos / orquestador | D1, D6.T1 |
| 06 Servidor MCP + Skill + auditoría del kit | 6 | Sector público (datos sintéticos) / claude-kit | D8.T2, D8.T3, D3 |
| 07 Seguridad: inyección, hooks, secretos | 7 | pdf-redactor / MCP / Portfolio | D7 |

Requisitos comunes: Python 3.11+, `pip install anthropic pydantic`, `ANTHROPIC_API_KEY` en el entorno, límite de gasto en la Console.
