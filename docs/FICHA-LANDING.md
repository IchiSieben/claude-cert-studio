# Ficha para el Landing: Cert Studio

Esta página no edita el Landing. La sesión del Landing importa los dos bloques de abajo tal cual.

## Datos de la ficha

| Campo | Valor | Estado |
|---|---|---|
| Archivos destino | `Landing/src/content/projects/es/cert-studio.md` y `Landing/src/content/projects/en/cert-studio.md` | exacto; el slug coincide con `routes/certify.json` (`project: cert-studio`) y con `docs/arquitectura.json` |
| Segmento | `agentes-ia` | el mismo que `claude-kit` y `enjambre` |
| Estado | `live` + `statusNote: "Open source · 240 original questions"` | 120 + 120, repartidas por peso oficial (validador del banco, 2026-10-15; rellenado tras la revisión del 26-sep) |
| Madurez | `usable` | verificado en el esquema (`config.ts`) |
| `repoUrl` | https://github.com/IchiSieben/claude-cert-studio | público desde el 2026-10-15 |
| `demoUrl` | https://cert.ichisieben.dev | responde 200, sin `noindex`, cero errores de consola (2026-10-15) |
| Familia | `family: claude-code-ecosystem`, `siblings: [claude-kit, enjambre]`, `academyRoute: certify` | campos verificados en `config.ts` de la rama `ecosistema/2026-10-15` |
| Habilidades | `javascript`, `html-css`, `playwright`, `hosting-estatico`, `bash`, `git` | los seis slugs existen en `Landing/src/content/skills/` |
| Portada | `/media/cert-studio/poster.webp` + `preview.mp4` | origen: `docs/media/` del repo público, grabado en la Mac (56,6 fps, interfaz rediseñada, banco 120/120) desde la URL pública; ver `docs/CAPTURAS.md` |
| `order` | 15 | 12–14 ya están ocupados (`chasqui`/`enjambre`, `claude-kit`, `signal-agent`) |

Antes de importar: copiar `docs/media/poster.webp` y `docs/media/preview.mp4` a
`Landing/public/media/cert-studio/`. El esquema falla el build si `media` apunta a un archivo que
no existe; si todavía no están, importar sin el bloque `media`.

Si `cert.ichisieben.dev` no responde 200 el día de la importación, quitar `demoUrl` en vez de dejar
un enlace roto.

Lecciones de la ruta "Certifícate": los 8 documentos de `01-dominios/` y los 7 laboratorios de
`05-labs/` llevan `lesson: {route: certify, order, level, title_en, summary_en}` en su
frontmatter (órdenes 1–15; nivel 2 los dominios, 3 los laboratorios). `tools/import-academia.py`
los lee con `lesson_meta` sin cambios.

Cifras de `results`: 240 preguntas originales (validador del banco, 2026-10-15); 44 pruebas de
punta a punta en verde (Playwright, Windows, 2026-10-15).

## `Landing/src/content/projects/es/cert-studio.md`

```markdown
---
title: "Cert Studio"
segment: "agentes-ia"
tech: ["frontend", "ia-agentes"]
sector: ["herramientas-dev"]
order: 15
featured: false
status: "live"
maturity: "usable"
statusNote: "Open source · 240 original questions"
published: true
since: 2026
date: "2026-10-15"
family: "claude-code-ecosystem"
siblings: ["claude-kit", "enjambre"]
academyRoute: "certify"
summary: "Un simulador estático para preparar las certificaciones CCAR-F y CCDV-F: simulacros que reparten las preguntas según el peso oficial de cada dominio, cronómetro, puntaje escalado de 100 a 1000 y cada opción incorrecta etiquetada con el tipo de trampa que representa. El progreso vive solo en el navegador. Ayuda de estudio no oficial: las 240 preguntas son originales y ninguna reproduce un ítem real del examen."
oneLine: "Me preparo para las certificaciones de Claude Code con un simulador propio: 240 preguntas originales, simulacros por peso de dominio y cada trampa explicada."
techLine: "HTML · JavaScript sin dependencias · Playwright · hosting estático"
repoUrl: "https://github.com/IchiSieben/claude-cert-studio"
demoUrl: "https://cert.ichisieben.dev"
skills:
  - "javascript"
  - "html-css"
  - "playwright"
  - "hosting-estatico"
  - "bash"
  - "git"
applied:
  javascript: "Toda la app en un archivo sin framework ni build: reparto por resto mayor, puntaje ponderado, repaso espaciado SM-2 y un modo muestra con semilla fija."
  html-css: "Una sola página con vistas, tema claro y oscuro, diseño para móvil y una hoja de impresión que convierte el blueprint en PDF."
  playwright: "44 pruebas de punta a punta: axe sin violaciones en las siete vistas en claro y oscuro, las siete vistas en ancho de móvil, el modo muestra sin escribir en el almacenamiento, la migración del repaso espaciado, el uso sin conexión y cero desplazamiento de diseño mientras carga el banco."
  hosting-estatico: "Subdominio estático en hosting compartido, subido por archivo sin borrar nada, con un .htaccess que solo responde por su propio nombre."
  bash: "El despliegue, la exportación al repo público con su auditoría por patrones y el carril de grabación de medios son scripts de Bash."
  git: "El repo público es una exportación filtrada de un solo autor; el historial de trabajo queda privado."
problem: "Las guías de las certificaciones dan dominios y pesos, pero no una forma de practicar que respete esos pesos ni que explique por qué una opción incorrecta parece correcta. Quería medirme con preguntas propias, repartidas como el examen real, sin cuentas ni servidor."
results:
  - { label: "preguntas originales en el banco", value: 240, source: "validador del banco, 2026-10-15" }
  - { label: "pruebas de punta a punta en verde", value: 25, source: "Playwright, Windows, 2026-10-15" }
next:
  - "Revisión humana de una muestra del banco (hoy lo revisó un modelo)."
  - "Importar un respaldo de progreso: hoy solo se exporta."
media:
  kind: video
  poster: /media/cert-studio/poster.webp
  video:
    mp4: /media/cert-studio/preview.mp4
---

Una página HTML y tres archivos de datos: el navegador hace todo el trabajo. Un simulacro reparte
las preguntas entre los dominios según su peso oficial con el método del resto mayor, corre con
cronómetro y devuelve un puntaje escalado de 100 a 1000 con aprobado en 720, el resultado por
dominio y las trampas en las que caíste. Cada opción incorrecta del banco lleva una etiqueta de
trampa, y el validador rechaza la que no la tenga.

El modo de repaso saca primero lo que no viste y lo que fallaste, y vuelve a lo acertado a intervalos
crecientes (SM-2 simplificado). El progreso se guarda en el almacenamiento local y se exporta a JSON; con `?sample=1` todo
vive en memoria con una semilla fija, que es como se graban las capturas.

Límites: ayuda de estudio no oficial, sin afiliación con el emisor de la certificación; la escala
real no es pública y aquí se usa una lineal ponderada; el banco lo revisó un modelo, no un panel
humano; el progreso no viaja entre navegadores. Código bajo Apache-2.0; contenido bajo CC BY 4.0.
```

## `Landing/src/content/projects/en/cert-studio.md`

```markdown
---
title: "Cert Studio"
segment: "agentes-ia"
tech: ["frontend", "ia-agentes"]
sector: ["herramientas-dev"]
order: 15
featured: false
status: "live"
maturity: "usable"
statusNote: "Open source · 240 original questions"
published: true
since: 2026
date: "2026-10-15"
family: "claude-code-ecosystem"
siblings: ["claude-kit", "enjambre"]
academyRoute: "certify"
summary: "A static practice app for the CCAR-F and CCDV-F certifications: mocks that spread questions by each domain's official weight, a timer, a scaled 100–1000 score and every wrong option tagged with the kind of trap it represents. Progress lives only in the browser. An unofficial study aid: all 240 questions are original and none reproduces a real exam item."
oneLine: "I prepare for the Claude Code certifications with my own practice app: 240 original questions, mocks by domain weight and every trap explained."
techLine: "HTML · dependency-free JavaScript · Playwright · static hosting"
repoUrl: "https://github.com/IchiSieben/claude-cert-studio"
demoUrl: "https://cert.ichisieben.dev"
skills:
  - "javascript"
  - "html-css"
  - "playwright"
  - "hosting-estatico"
  - "bash"
  - "git"
applied:
  javascript: "The whole app in one file with no framework or build: largest-remainder sampling, weighted scoring, SM-2 spaced repetition and a sample mode with a fixed seed."
  html-css: "One page with views, light and dark themes, a mobile layout and a print sheet that turns the blueprint into a PDF."
  playwright: "25 end-to-end tests: axe with zero violations on all eight views in light and dark, all eight views at mobile width, sample mode never writing to storage, the spaced-repetition migration, offline use and zero layout shift while the bank loads."
  hosting-estatico: "A static subdomain on shared hosting, uploaded file by file without deleting anything, with an .htaccess that only answers to its own name."
  bash: "Deploy, the export to the public repo with its pattern audit, and the media recording lane are Bash scripts."
  git: "The public repo is a filtered single-author export; the working history stays private."
problem: "The certification guides list domains and weights, but no way to practise that respects those weights or explains why a wrong option looks right. I wanted to measure myself with my own questions, spread like the real exam, with no accounts and no server."
results:
  - { label: "original questions in the bank", value: 240, source: "bank validator, 2026-10-15" }
  - { label: "end-to-end tests passing", value: 25, source: "Playwright, Windows, 2026-10-15" }
next:
  - "Human review of a sample of the bank (today it was reviewed by a model)."
  - "Import a progress backup: today it can only be exported."
media:
  kind: video
  poster: /media/cert-studio/poster.webp
  video:
    mp4: /media/cert-studio/preview.mp4
---

One HTML page and three data files: the browser does all the work. A mock spreads the questions
across the domains by their official weight using the largest-remainder method, runs against a
timer and returns a scaled 100–1000 score with a pass at 720, the per-domain result and the traps
you fell into. Every wrong option in the bank carries a trap tag, and the validator rejects one
without it.

Review mode serves first what you have not seen and what you missed, and comes back to what you got
right at growing intervals (simplified SM-2). Progress is kept in local storage and exports to JSON; with `?sample=1` everything
lives in memory under a fixed seed, which is how the screenshots are recorded.

Limits: an unofficial study aid, not affiliated with the certification's issuer; the real scale is
not public and a weighted linear one is used here; the bank was reviewed by a model, not a human
panel; progress does not travel between browsers. Code under Apache-2.0; content under CC BY 4.0.
```
