# Diseño de la interfaz — Cert Studio (2026-10-15)

Rediseño del ítem 5b. El objetivo no era "que se vea más bonito", sino corregir cinco causas concretas de que
la interfaz se viera generada. Cada token de abajo responde a una de ellas. Capturas antes/después en
`evidence/ui/before/` y `evidence/ui/after/`: las 8 vistas en claro y oscuro a 1280 px, y en claro a 390 px
(`node tools/ui-shots.mjs <tag>`).

## Diagnóstico → decisión

| Causa | Qué se hizo | Por qué funciona |
|---|---|---|
| Tres voces tipográficas sin jerarquía (Georgia en títulos, mono en cifras, sans de sistema en el resto) | Una sola familia para la UI (**Space Grotesk**). La mono (**JetBrains Mono**) queda solo para cifras tabulares, códigos de dominio (`D3`) y códigos de task statement (`2.4`) | La jerarquía la marcan el tamaño y el peso, no el cambio de fuente. Cuando la mono aparece, significa algo: "esto es un dato" |
| Seis tiles y tres tarjetas del mismo peso; dos tiles mostrando `–` | Los datos fijos del examen (ítems, minutos, aprobación, tamaño del banco) pasan a una línea mono bajo el título. La franja de KPIs solo muestra cifras del usuario que **existen**; si falta una, en su lugar va una frase ("Aún no has hecho un simulacro…") | Un `–` obliga a adivinar si es un error o un cero. Una frase dice qué hacer. Además, menos cajas = cada caja pesa más |
| Barras de dominio en arcoíris que no codificaban nada y mezclaban peso con avance | Ocho colores eliminados. "Dónde están los puntos" pasa a ser la pieza central: la barra gris mide el **peso oficial** (a escala, el dominio más pesado ocupa todo el ancho) y encima, en el acento, la **parte del dominio que ya respondiste bien**. Las cifras van alineadas en mono a la derecha | Un color tiene que significar algo. Con dos canales (largo gris = cuánto vale, relleno = cuánto dominas) se ve en un vistazo dónde está el hueco caro |
| Header que ocupaba un cuarto del alto y tapaba la frase de requisitos | Una línea de 48 px (marca · selector de certificación · tema) y debajo pestañas compactas de 40 px. El subtítulo "not affiliated" ya estaba en el pie y no se repite | 88 px fijos en vez de ~190 px; el contenido empieza en el primer tercio de la pantalla |
| Botones sin regla (uno relleno, dos con borde, sin criterio) | Tres niveles: `.btn` relleno = **la** acción primaria de la vista (como mucho una; en Resumen, "Quick diagnostic"); `.btn.ghost` = secundaria; `.btn.link` = terciaria (salir, volver). Un test e2e falla si una vista tiene más de un botón relleno visible | El ojo va a lo relleno. Si hay tres, no va a ninguno |

## Tokens

Viven en el `:root` de `app/index.html`. Los neutros, las fuentes y las alturas vienen del sistema del Ecosistema
(`../Landing/docs/internal/DESIGN-v2.md` y `src/styles/global.css`): Cert Studio es parte de la misma familia
y se tiene que notar.

### Color

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--bg` | `#ffffff` | `#0d1117` | fondo de página y de tarjetas (las tarjetas se separan por línea, no por color) |
| `--line` | `#d0d7de` | `#30363d` | hairlines: bordes de tarjeta, separadores de filas y de KPIs |
| `--track` | `#d0d7de` | `#30363d` | pista de las barras (peso oficial) |
| `--raise` | `#ecf0f4` | `#1e242e` | estado activo del selector de certificación |
| `--ink` | `#1f2328` | `#e6edf3` | texto |
| `--muted` | `#59636e` | `#8b949e` | texto secundario |
| `--accent` | `#ad4f1d` | `#e98a58` | **una sola nota de color**: acción primaria, avance del usuario, enlaces, foco |
| `--accent-ink` | `#ffffff` | `#0d1117` | texto sobre el acento |
| `--ok` / `--bad` | `#1a7f37` / `#cf222e` | `#3fb950` / `#f85149` | solo para corrección: opción correcta/incorrecta, aprobado/no aprobado, tipo de trampa |

El acento cálido es la identidad propia de Cert Studio (el Landing usa teal). El terracota original `#c9612c`
daba solo 4,02:1 con texto blanco, por debajo de AA para texto normal; `#ad4f1d` es el primer paso más oscuro
del mismo tono que pasa en todos los fondos claros. En oscuro, `#e98a58` ya pasaba con holgura.

¿Por qué verde y rojo, si el acento es "la única nota de color"? Porque no son decoración: "acertaste / fallaste"
es la información más importante de una app de práctica, y quitarle el color la haría más lenta de leer.
Aparecen solo después de responder, nunca en la navegación ni en los datos.

Contraste medido (WCAG, texto normal pide 4,5:1):

| Par | Claro | Oscuro |
|---|---|---|
| texto / fondo | 15,80 | 16,02 |
| secundario / fondo | 6,11 | 6,15 |
| secundario / `--raise` | 5,34 | 5,07 |
| acento / fondo (enlaces) | 5,37 | 7,43 |
| texto del botón / acento | 5,37 | 7,43 |
| ok / fondo | 5,08 | 7,45 |
| error / fondo | 5,36 | 5,65 |
| acento / pista (relleno contra gris) | 3,69 | 4,79 |

La pista gris contra el fondo blanco queda en 1,45:1: no es un fallo de 1.4.11 porque la barra no es la única
forma de leer el dato (la cifra exacta está al lado, en mono). Es una decisión deliberada: el peso es contexto,
el avance es lo que tiene que saltar.

### Tipografía: 4 tamaños

| Token | Valor (≤640 px) | Uso |
|---|---|---|
| `--t-xl` | 32 px (26) | `h1` y la puntuación del simulacro |
| `--t-l` | 20 px (18) | `h2` de sección, enunciado de la pregunta, cifras de KPI |
| `--t-m` | 16 px | cuerpo, títulos de tarjeta, botones |
| `--t-s` | 13 px | todo lo secundario: etiquetas, cifras mono, pestañas, pie |

Cuatro tamaños alcanzan porque la jerarquía se completa con peso (600 títulos, 400 cuerpo) y color
(`--ink` frente a `--muted`). Antes había doce tamaños distintos en pantalla (de 11 a 56 px); los únicos valores en píxeles que quedan son los de la hoja impresa.

Las fuentes van alojadas en `app/fonts/` (woff2 variables, latin, 22 y 40 KB; licencia OFL al lado) y el
service worker las guarda para el modo sin conexión. Cada una tiene un *fallback* con métricas ajustadas
(Arial escalado para Space Grotesk, Courier New para JetBrains Mono, los mismos números del Landing): si la
fuente llega tarde, cambian los glifos pero no el tamaño de las líneas, y el CLS sigue en 0.

### Forma

- **Dos radios**: `--r-s` 6 px para controles (botones, selector, etiquetas) y `--r-l` 10 px para contenedores
  (tarjetas, opciones de respuesta, franja de KPIs).
- **Hairlines, no sombras**: nada en la app proyecta sombra. Los grupos se separan con una línea de 1 px. Las
  sombras simulan profundidad que una herramienta de estudio no tiene; la línea solo dice "aquí acaba esto".
- **Espaciado** en la escala 4 · 8 · 12 · 16 · 24 · 32 · 40, la misma del Landing.

## Accesibilidad

- `npm test` corre **axe-core** sobre las 8 vistas y además sobre una pregunta ya respondida (explicación y
  etiquetas de trampa) y un resultado de simulacro, en claro y oscuro, a 1280 y 390 px: 0 violaciones
  (antes: 72, sobre todo contraste del selector activo, banner fuera de un *landmark* y saltos de encabezado).
- Foco visible en todo: contorno de 2 px en el acento con 2 px de separación.
- `prefers-reduced-motion`: las únicas transiciones (color de borde y fondo, 120 ms) solo existen bajo
  `no-preference`.
- 390 px sin desplazamiento horizontal: las pestañas se desplazan dentro de su fila (con un degradado que indica
  que hay más), las filas de dominio pasan las cifras debajo del nombre, la tabla del historial se desplaza
  dentro de su caja.
- Las vistas de pregunta y simulacro tienen un `h1` solo para lectores de pantalla; el selector de
  certificación usa `aria-pressed` y la pestaña activa `aria-current="page"`.

## Cómo revertirlo

Todo el cambio está en el `<style>` y en las plantillas de las vistas de `app/index.html`, más `app/fonts/`.
`git revert` del commit del ítem 5b vuelve al diseño anterior completo; las capturas de `evidence/ui/before/`
muestran cómo era.
