# Muestra para revisión humana

Todo el banco (240 preguntas) lo revisó un modelo contra la documentación oficial; ninguna pregunta la ha
revisado todavía una persona. Esta muestra es lo mínimo para empezar: 10 ids por certificación, elegidos al
azar sobre el banco completo (generador `mulberry32`, semilla `20261015`, ids ordenados), así que nadie los
eligió por ser fáciles.

Para cada id: ¿la clave es correcta según la doc de hoy?, ¿algún distractor es defendible como correcto?,
¿la explicación dice algo que la doc no dice? Anota el resultado al lado (`OK`, `CORREGIR: …`, `QUITAR: …`).

## CCAR-F

| id | Nota | Resultado |
|---|---|---|
| CCARF-1.1-03 | | |
| CCARF-1.7-05 | nueva (15-oct) | |
| CCARF-2.2-01 | | |
| CCARF-2.4-06 | nueva (15-oct) | |
| CCARF-3.2-03 | | |
| CCARF-3.2-04 | | |
| CCARF-3.3-04 | | |
| CCARF-5.2-01 | | |
| CCARF-5.2-04 | nueva (15-oct) | |
| CCARF-5.4-04 | nueva (15-oct) | |

## CCDV-F

| id | Nota | Resultado |
|---|---|---|
| CCDVF-1.1-03 | | |
| CCDVF-1.1-04 | | |
| CCDVF-2.4-04 | | |
| CCDVF-2.5-04 | | |
| CCDVF-3.1-03 | | |
| CCDVF-4.1-01 | | |
| CCDVF-5.3-02 | | |
| CCDVF-5.4-04 | | |
| CCDVF-7.2-01 | | |
| CCDVF-8.3-05 | | |

## Además: tres nuevas que el propio redactor marcó como apoyo parcial

| id | Por qué mirarla |
|---|---|
| CCARF-5.6-04 | La doc respalda "contrastar fuentes" e "hipótesis con nivel de confianza"; la regla exacta (conservar ambas cifras con fuente y fecha y marcar la discrepancia) no aparece literal. |
| CCARF-5.5-04 | El ancla apunta a la sección padre; la calibración del juez y la lectura de transcripts están en dos subsecciones. |
| CCDVF-5.2-08 | Que el streaming es SSE está en la doc; que un WebSocket "no aporta nada" para un flujo de un solo sentido es criterio de ingeniería. |

Las 22 preguntas nuevas del 15-oct llevan `"reviewed": "model"` y una `ref` comprobada (200 y ancla presente).
