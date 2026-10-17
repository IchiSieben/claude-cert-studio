# Diseño de la interfaz — Cert Studio (V3c, base Raycast, 2026-10-15)

Reemplaza al diseño del ítem 5b (Space Grotesk, acento terracota, tarjetas con línea). Los tokens medidos y las
seis adaptaciones están en `DIRECCIONES.md` (sección Raycast); este documento dice qué quedó construido y cómo se
comprueba. El diseño anterior sigue en el historial de git (el commit anterior a `[cert] V3c F2`).

## Qué es

- **Un instrumento** (`instrument()` en `app/index.html`): barra apilada de pesos sobre una escala común de 0 a
  100 % del examen (peso = largo, nunca "el más grande = lleno"), el avance del usuario como relleno sólido y,
  debajo, una tecla por dominio. Es la navegación (la vista de inicio) y el gráfico del resultado del
  simulacro. Estado en la URL: `?cert=&domain=&task=` (más `view=`, `lang=`, `sample=`).
- **El dominio abierto se dibuja en su propio eje de 0 a 100 %** de ese dominio, con la línea "= 33,1 % del
  examen". Sus task statements cuelgan debajo como hijos (guía vertical, medidores de 4 px más claros que las
  teclas), se expanden con su texto, su peso y el enlace a su práctica.
- Las bandas de menos del 5 % del examen no llevan etiqueta bajo la barra (se leen en su tecla); hay 48 px de aire
  entre la barra y las teclas.
- **Modo examen = cabina**: oculta nav y pie, reloj mono de 32 px, mapa de celdas que solo se colorea (por
  dominio) en las respondidas, opciones como teclas que se hunden 150 ms al elegir (se actualizan en su sitio, sin
  recrear el DOM), atajos A–D en Geist Mono dentro de la tecla, F marca, Enter avanza.
- **Resultado**: el instrumento relleno con la tinta real del simulacro, radar SVG de los diez tipos de trampa con
  su lista numerada como equivalente de texto, y "Estudia esto primero" = peso × tasa de error.
- **Para hoy** es una pila de tarjetas (la de al frente lleva la cuenta y qué sigue).

## Tipografía

Inter 400/500/600 y Geist Mono, alojadas en `app/fonts/` (woff2 variables latin, licencias OFL al lado). Fallbacks
de métricas ajustadas, medidos con `tools/measure-fonts.mjs` (`size-adjust` / `ascent-override` /
`descent-override`):

| Fuente | Fallback | size-adjust | ascent | descent |
|---|---|---|---|---|
| Inter 100–599 | Arial | 106,6 % | 90,9 % | 22,61 % |
| Inter 600–900 | Arial Bold | 101,56 % | 95,41 % | 23,73 % |
| Geist Mono | Courier New | 99,98 % | 100,52 % | 29,5 % |

El `h1` es el display (56 px / 1,17 / +0,22 px; 36 en móvil). La única etiqueta en mayúsculas espaciadas es el
código del task statement (`CCDVF-4.3`).

## Color

Canvas `#040506` / `#f5f5f6`, neutros del mockup. El único color con significado son los dominios D1–D8. **D7 se
movió un paso hacia el rojo ladrillo, lejos de D5**: oscuro `#d77965` → `#da6e62` (6,20:1 sobre `#040506`), claro
`#b4462f` → `#c43d2e` (4,75:1 sobre `#f5f5f6`). Un test recalcula los 8 contrastes de cada tema. Verde y rojo solo
aparecen después de responder (acierto/fallo), siempre con texto además del color.

**Cada banda lleva siempre el color de su dominio** (corrección V3c, 2026-10-16): peso = longitud, dominio = matiz,
pista = el matiz al 35 % de alfa (`color-mix(in srgb, var(--c) 35%, transparent)`), avance = el mismo matiz sólido
llenando desde la izquierda. Con 0 respondidas la barra ya es de colores; ningún carril (`.wbar`, `.zbar`, `.tm`,
`.meter`) es gris. En claro se oscureció solo la luminosidad (mismo matiz) para que el relleno sólido tenga ≥ 3:1
contra su pista al 35 % y contra el lienzo, y el color como texto ≥ 4,5:1 sobre lienzo, tarjeta y pozo; el test
recalcula los 8 dominios × 2 temas.

## Navegación

El instrumento apilado (0–100 % del examen) con sus teclas de dominio es la navegación: `/` lo abre para la
certificación por defecto (el cambio de certificación está en la cabecera). Las pestañas son solo las cuatro
actividades (Práctica, Simulacro, Trampas, Progreso). `?view=start` y `?view=blueprint` son alias del instrumento
(`blueprint` lo abre con todos los task statements desplegados, que ahora es el botón del propio instrumento);
Conceptos es un enlace desde el instrumento.

## Accesibilidad y movimiento

- `npm test` corre axe-core (wcag2a/aa, 21a/aa, best-practice) sobre las 7 vistas, una pregunta respondida, la
  cabina y un resultado, en claro y oscuro, a 1280 y 390 px: 0 violaciones.
- Foco visible (2 px, color del texto). Radar y tinta tienen equivalente de texto (lista numerada y tabla).
- Movimiento solo como respuesta a una acción, más una coreografía de carga (la barra se dibuja de izquierda a
  derecha, 600 ms, una vez por carga). Con `prefers-reduced-motion` queda un fundido de 300 ms y la tecla no se
  desplaza.

## Idioma

Toda la interfaz está en `app/data/i18n.js` (EN y ES). Un test falla si una clave falta en un idioma, si cambian los
parámetros o las etiquetas, o si la app pide una clave que no existe. Las preguntas, explicaciones, el blueprint y
la taxonomía de trampas siguen en inglés (el examen es en inglés) y la interfaz lo dice.

## Cómo revertirlo

`git revert` de los commits `[cert] V3c F2` devuelve el diseño 5b completo (incluidas las fuentes anteriores).
