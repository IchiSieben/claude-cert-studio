# Notas de arquitectura — Cert Studio

Investigación previa a `docs/arquitectura.html`, con el formato de `shared/arquitectura-viva/ARQUITECTURA_VIVA.md` §1.

1. **Actores.** Quien estudia, desde su navegador. No hay roles ni cuentas.
2. **Contenedores.** `app/index.html` (página única, JavaScript sin dependencias, corre en el navegador); `app/data/blueprints.js` y `app/data/questions-*.js` (datos como scripts); `localStorage` del navegador (progreso); memoria del navegador en modo muestra; salidas de archivo (impresión del blueprint, exportación JSON). Herramientas del repo: `tools/validate-bank.mjs`, `tests/app.test.mjs` (Playwright), `tools/deploy-cert.sh` (TUS), `tools/export-public.sh`. Externos: Hostinger (subdominio estático) y GitHub (repo público).
3. **Llamadas.** HTTPS del hosting a la página; `<script>` síncronos para los datos; lectura y escritura JSON en `localStorage` (`store.get/set`); `window.print` y `Blob` para las salidas; `require` del validador sobre los datos; Chromium por `file://` en las pruebas; TUS `POST`/`PATCH` del despliegue; `git commit` del exportador.
4. **Flujos.** Abrir la app; simulacro (peso → cronómetro → puntaje → trampas); cómo nace una pregunta; captura en modo muestra; publicar una versión.
5. **Núcleo.** No aplica: no hay API ni capas; la lógica vive en funciones de la página (`startMock`, `submitMock`, `isDue`, `record`).
6. **Datos.** Sin base de datos. `ccs:progress` = `{cert: {q: {id: {seen, right, wrong, last, when}}, traps: {clave: n}, mocks: [{date, kind, score, pct, byDomain, misses, ids}]}}`; `ccs:cert`, `ccs:theme`. Estáticos: preguntas, tareas y trampas.
7. **Despliegue.** Hostinger: directorio del subdominio dentro del hosting compartido, subido por archivo; `.htaccess` con guarda de Host. GitHub: exportación filtrada. Mac mini: graba clip y capturas desde la URL pública (carril `media` de `tools/verify.sh`).
8. **Historias de usuario.** No aplica: herramienta personal publicada.
9. **Decisiones.** Ver la pestaña Decisiones de la página; todas salen del código y de `docs/DECISIONES.md`.
