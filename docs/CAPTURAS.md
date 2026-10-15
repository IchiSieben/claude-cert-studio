# Capturas y medios

Todo se genera por script desde la app pública con `?sample=1` (progreso de demostración en memoria, semilla fija): no hay datos personales ni `localStorage` de nadie en ninguna imagen.

| Archivo | Qué muestra | Cómo se genera | Estado |
|---|---|---|---|
| `docs/media/poster.webp` | Fotograma 0 del clip: la página de inicio con las dos certificaciones y sus pesos | `tools/evidence/clip-cert.ts` (póster = fotograma 0, ≤ 120 KB) | generado |
| `docs/media/preview.webm` | Clip ≤ 8 s en bucle, 1280×720: elegir CCDV-F → una pregunta respondida mal → la etiqueta de trampa explica la opción → resultado del diagnóstico por dominio → vuelta al inicio | CDP screencast con marcas de tiempo reales, AV1 (SVT) ≤ 1,5 MB | generado |
| `docs/media/preview.mp4` | El mismo clip en H.264 (respaldo para Safari antiguo) | ídem, x264 ≤ 1,5 MB | generado |
| `docs/media/clip.json` | fps entregados, fps de salida, duración, bytes, SSIM del bucle, fecha | ídem | generado |
| `docs/img/overview.png` | Resumen de CCDV-F con progreso de muestra | ídem, 1280×800, escala 1 | generado |
| `docs/img/drill.png` | Una pregunta corregida: opción marcada en rojo con su trampa, correcta en verde, explicación | ídem | generado |
| `docs/img/result.png` | Resultado de un diagnóstico: puntaje escalado y barras por dominio | ídem | generado |

## Procedencia

- **Primera versión (2026-10-15, 04:1x):** grabada en Windows con Chromium headless para validar el guion. Headless entrega pocos fotogramas (pantalla casi estática): el clip sale a 60 fps de salida con fotogramas sostenidos.
- **Versión canónica:** la graba la Mac mini (Chromium con ventana, GPU real, `caffeinate -d`) con el carril `media` (`TASK-cert-media.md`, `kind: tests`). Reemplaza los siete archivos de arriba. Vigente: `mac/cert-media-5` (2026-10-15, 56,6 fps, contra el sitio con la interfaz rediseñada y 120/120).

Reproducir en cualquier máquina con ffmpeg:

```bash
npm ci && npx playwright install chromium
node --experimental-strip-types tools/evidence/clip-cert.ts                     # desde la URL pública
node --experimental-strip-types tools/evidence/clip-cert.ts file://$PWD/app/index.html   # copia local
```

## Para el Landing

Copiar a `Landing/public/media/cert-studio/`: `poster.webp`, `preview.mp4` (y `preview.webm` si la ficha lo usa). La ficha (`docs/FICHA-LANDING.md`) apunta ahí.

Revisar a tamaño real tras cada regeneración: `docs/ESTUDIO.md` cita el resultado de `result.png` (dominio 4 en 0/1, puntaje 813).
