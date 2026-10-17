# BACKLOG — Cert Studio

Lo que no entró en la corrida nocturna V3c (2026-10-15 → 2026-10-17), con el motivo.

| Ítem | Motivo | Dónde retomarlo |
|---|---|---|
| F4.2 funciones 2–7: modo semana final, racha y resumen de sesión, dificultad adaptativa explicada, `apply` como "la pregunta real del arquitecto", compartir resultado como imagen, aviso "el simulacro no predice", enlace "reportar error" | El owner paró la corrida (ALTO, 2026-10-16) para corregir la fidelidad al mockup y ordenó pasar al cierre | Rama `wip/f4.2-resto` (`68c2204`, sin probar); especificación en `docs/SPEC-F4.2.md` |
| F4.3 pruebas de usuario con tres personas guionizadas (`docs/PRUEBAS-USUARIO.md`) | Mismo motivo: el owner ordenó cerrar después de la corrección | `docs/SPEC-F4.2.md` no la cubre; el texto está en §15 del prompt, F4.3 |
| F4.4 pasada de identidad (quitar un accesorio por vista) | Mismo motivo. Las capturas finales sí están en `evidence/identidad/final/` | §15, F4.4 |
| Tope de intervalos SM-2 a la fecha de examen (investigación, ítem 8) | Solo entró la fecha de examen y la línea de ritmo (`0016e18`) | `wip/f4.2-resto` |
| "Puntos en juego" por dominio (ítem 2), variantes tras dos aciertos (ítem 10) | No entraron en la especificación de esta corrida | `docs/INVESTIGACION-UX.md` |
| Lighthouse de una vista de pregunta | El lane `cert-lh` de Landing tiene la URL fija en `/`; añadir `LH_URL` toca `Landing/tools/verify.sh` en main, que despliega solo (requiere OK). Desde esta PC Hostinger responde 403 a Lighthouse headless. Además una pregunta exige un clic: haría falta un *user flow* de Lighthouse | `Landing/tools/verify.sh` en una rama |
| Texto completo de los task statements dentro de la app | Hoy es el abreviado de `blueprints.js`; el completo vive en `00-examen/` | Decisión 2026-10-15 V3c F2 |
| Baselines del gate de fidelidad en el Mac | Se capturaron en Windows; en macOS el render de fuentes puede diferir | `node tests/fidelity.test.mjs --update` en el Mac, con fila en DECISIONES |
| Fuentes antiguas en el servidor (`cert-app/fonts/`) | Borrar en Hostinger no está autorizado | hPanel, a mano |
