# Direcciones de identidad — Cert Studio (V3c, FASE 1, 2026-10-15)

> **Estado (13:40):** el owner descartó A, B y C ("se ven chafa"). La base ahora es la hoja Raycast de Refero:
> ver **§Raycast** al final. A/B/C se quedan abajo como registro de lo que se probó y por qué no.

El 5b ordenó la página, pero eligió el molde: fondo claro, una sola nota terracota (`#ad4f1d`), tarjetas con
hairline. Este documento propone tres salidas, todas sobre el mismo concepto (§15 del prompt): **el blueprint
del examen como instrumento**. Las reglas son las mismas para las tres:

- **Peso = geometría, avance = relleno.** Lo que mide un dominio es lo que pesa en el examen; lo que está
  relleno es lo que ya respondes bien. Las tres usan una sola escala compartida (0–100 % del examen) y en
  ninguna "el más grande ocupa todo el ancho". Es justo lo que hace hoy `start()` (`100*d.weight/max`), y
  ninguna de las tres lo hereda.
- **Los colores de dominio se quedan como código de significado.** Parten de la paleta de antes del 5b
  (`--d1…--d8`) y cambian en dos cosas: D7 deja el ladrillo `#b4462f` (terracota de nuevo) por un marrón
  `#7d5a3a`, y cada tono se ajusta a ≥ 3:1 contra el fondo de cada dirección (objetos gráficos, WCAG 1.4.11).
- **El caso que decide es CCDV-F**, no CCAR-F: D4 pesa 2,6 % y D3 3,1 %. A 390 px, 2,6 % son unos 9 px.
  Cada dirección dice cómo resuelve un dominio que no se puede tocar.

Mockups: `docs/mockups/{a,b,c}.html` (abren por `file://`, leen los pesos reales de `app/data/blueprints.js`;
la "tinta" es progreso de demostración y lo dicen en pantalla). Parámetros: `?cert=CCDV-F|CCAR-F`,
`?theme=light|dark`, `?open=<id de dominio>`. El cambio de certificación y la apertura de dominios funcionan.
Capturas: `node tools/mockup-shots.mjs` → `evidence/identidad/<a|b|c>-<light|dark>-<1440|390>.png` (12).
La interfaz de los mockups está en inglés, como el idioma por defecto de la app; el ES/EN completo es de la
FASE 2.

---

## A. Regla

**La idea:** el examen es una regla graduada de 0 a 100. Cada dominio es un tramo de la regla con su cifra
encima, grande y estructural. Al tocar un tramo, se redibuja más abajo a su propia escala (una lupa unida
por dos líneas, como el recuadro ampliado de un plano) y debajo aparecen sus task statements.

| Rol | Claro | Oscuro | Nombre |
|---|---|---|---|
| Fondo | `#eef1f4` | `#1c2229` | Papel frío / Pizarra |
| Texto y acción | `#14171a` | `#e9edf1` | Grafito / Tiza |
| Secundario | `#4c5560` | `#a3adb8` | Lápiz |
| Hairline | `#c3cad2` | `#3a434d` | Trazo |
| Pista de medidores | `#e1e6eb` | `#252c34` | Pozo |

**Acento de acción, el giro:** no hay acento. La acción es tinta (botón grafito sobre papel, tiza sobre
pizarra) y el único color de la página es el del examen. *En un plano técnico el color es dato, nunca
adorno.*

**Tipografía:** Space Grotesk + JetBrains Mono, heredadas del Ecosistema (ya están alojadas en `app/fonts/`).
La mono deja de ser solo "cifras pequeñas" y pasa a ser la estructura: los pesos a 64 px sobre la regla.
Tamaño de la cifra según el espacio del tramo: ≥ 12 % grande, 6–12 % mediana, < 6 % pequeña y escalonada en
dos alturas.

```
Cert Studio                                        [CCAR-F|CCDV-F] (◐)
Overview  Drill  Mock exam  Traps  Progress
──────────────────────────────────────────────────────────────────────
Claude Certified Developer – Foundations
53 questions, 120 minutes, pass at 720/1000.

14.7%  33.1%            3.1 2.6 16.8%    11%    8.1%  10.6%
0    10    20    30    40    50    60    70    80    90    100
[██░D1][████░░░░░D2░░░░░][█][ ][███░D5░][██D6░][█D7][██D8░]
       \___________________/
D2  Applications and Integration
33.1 % of the exam, about 17.5 questions. Drawn 3× larger.
[██░░][░][███░░][█████░░][███░░░░][███░]      14.7 % … 47.8 %
2.1  Understanding requirements      3.4 %  ▬▬▬▭▭▭  [Drill 2.1]
2.2  Systems life cycle              2.8 %  ▬▭▭▭▭▭  (Drill 2.2)
```

**Qué la hace distinta:** es la más fiel al concepto escrito: la barra apilada de Start, a escala real,
convertida en un instrumento de medida con cifras grandes. La lupa es lo memorable: muestra el zoom en vez
de esconderlo.

**Dominios chicos:** en 1440, D3 y D4 tienen 40 y 33 px (tocables) y su cifra pequeña va escalonada. En 390
la barra solo se ve (9–12 px por tramo); la navegación pasa a una lista de dominios debajo, con filas de 44
px. Honesto, pero en el celular el instrumento deja de ser el control.

**Molde que evita:** las tarjetas. No hay ni una caja en la vista; todo es regla, línea y fila.

**Revisión contra los prohibidos**

| Prohibido | Estado |
|---|---|
| Crema + serif + terracota | No: papel frío azulado, sans, sin acento cromático |
| Tarjetas idénticas, mismo radio y sombra | No hay tarjetas. Radios de 4 px solo en controles; cero sombras |
| Etiquetas en mayúsculas espaciadas | No. Los únicos textos en mayúsculas son los códigos `CCAR-F` y `CCDV-F`, que son nombres propios y van sin tracking |
| "A · B · C" con puntos medios | No: la línea de datos va con comas (también se corrigió el `<title>`) |
| `→` en los botones | No |
| Negro teñido como fondo | El oscuro es pizarra `#1c2229`: más claro que `#111` y con matiz azul visible. Se defiende como superficie de pizarra, no como "casi negro". Si no te convence, es la debilidad de esta dirección |
| Negro + un solo verde ácido o bermellón | No |
| Fade+slide por sección, hover en cada tarjeta | No. Una sola coreografía de carga (la tinta crece de izquierda a derecha, 0,9 s) y nada más; no hay hovers |
| Una palabra del titular en otro color | No |

Contraste: texto 15,9 / 13,6; secundario 6,7 / 7,0; botón 15,9 / 13,6; dominio más débil contra el fondo
3,5 / 5,9. **Punto flojo:** las etiquetas `D1`, `D2` dentro de la barra, en papel sobre el relleno, no pasan
AA en todos los tonos. Son redundantes (el botón lleva `aria-label` y la lista las repite), pero en la FASE 2
irían fuera de la barra.


**Nota de escala:** en A y en B los medidores por task statement tienen todos el mismo largo (el relleno es solo avance), así que podrían leerse como "todas las tasks pesan igual". El peso de cada una va en cifra al lado. C, en cambio, lo codifica como número de cuadros. En la FASE 2, A y B tendrían que dar a esos medidores un largo proporcional al peso.

---

## B. Columna

**La idea:** el examen es un medidor vertical que vive fijo en el borde izquierdo de todas las vistas: es
literalmente la navegación de la app. La tinta sube dentro de cada tramo como el nivel de un tubo. A la
derecha, el dominio abierto con su peso enorme (168 px) y los códigos de task statement como columna
tipográfica.

| Rol | Claro | Oscuro | Nombre |
|---|---|---|---|
| Fondo | `#f3f4f6` | `#23272d` | Niebla / Grafito |
| Panel del medidor | `#ffffff` | `#2b3037` | Vidrio |
| Texto | `#16181d` | `#eceef1` | Tinta |
| Secundario | `#50565f` | `#a7aeb8` | Acero |
| Acción | `#3d2bff` | `#9d93ff` | Cobalto eléctrico |

**Acento de acción, el giro:** cobalto eléctrico. *Es el azul de las marcas de corrección de imprenta,
empujado hacia violeta y saturado al máximo; ningún color de dominio es tan saturado, así que una acción
nunca se confunde con un dato.* No es terracota ni el teal del Landing.

**Tipografía:** IBM Plex Sans Condensed + IBM Plex Mono. *Por qué no Space Grotesk:* la columna es estrecha
y los nombres de dominio son largos ("Prompt and Context Engineering"); la condensada cabe sin cortar y
permite que la cifra del peso sea enorme sin comerse la pantalla. Además, Plex viene de documentación
técnica, que es lo que es esta app. Costo: es una familia fuera del Ecosistema y habría que alojarla
(OFL, unos 60 KB más); en el mockup se carga desde Google Fonts.

```
Cert Studio   ┌──┐   Overview  Drill  Mock exam  Traps  Progress      (◐)
[CCAR-F][CCDV-F] │░░│  ─────────────────────────────────────────────────────
     D1 14.7 ─│██│   Claude Certified Developer – Foundations: 53 q, 120 min
              ┏━━┓
     D2 33.1 ─┃░░┃   ┃ 33.1%   Applications and Integration
              ┃██┃   ┃         Domain 2 of 8. About 17.5 of the 53 questions.
              ┗━━┛   ─────────────────────────────────────────────────────
     D3  3.1 ─│█ │   2.1   Understanding requirements        3.4% ▬▬▭  Drill
     D4  2.6 ╱│  │   2.2   Systems life cycle                2.8% ▬▭▭  Drill
     D5 16.8 ─│▓▓│   2.3   Claude API mechanics              6.8% ▬▬▭  Drill
       ...    └──┘   [ Drill all of D2 ]
  0 %  100 % of the exam
```

**Qué la hace distinta:** el instrumento no es una sección de la portada, es el marco de toda la app; se
ve en el mock, en el drill y en el progreso sin ocupar contenido. El peso de 168 px es la tipografía
estructural más fuerte de las tres.

**Dominios chicos:** en 1440 la columna mide unos 730 px: 2,6 % son 19 px de tramo. Las etiquetas se
separan solas (mínimo 30 px entre ellas) con una línea guía al tramo. En 390 la columna queda como un riel
de 52 px con el número de dominio dentro; a esa altura, D4 sigue teniendo ~18 px. Para pantallas más bajas
hay un alto mínimo de 14 px, que **distorsiona la escala** en esos tramos; es la debilidad declarada de esta
dirección.

**Molde que evita:** el header ancho con pestañas y la portada de tarjetas; acá la navegación es el dato.

**Revisión contra los prohibidos**

| Prohibido | Estado |
|---|---|
| Crema + serif + terracota | No: gris frío, condensada sans, cobalto |
| Tarjetas idénticas | No hay tarjetas; filas con hairline |
| Mayúsculas espaciadas | No |
| Puntos medios | No (`<title>` corregido) |
| `→` en los botones | No |
| Negro teñido como fondo | El oscuro es grafito `#23272d`, el más claro de las tres; no es un casi negro |
| Negro + un solo verde ácido/bermellón | No |
| Fade+slide, hover en todo | Una sola coreografía (la tinta sube, 1 s); sin hovers |
| Una palabra del titular en otro color | No. El código del dominio activo en el medidor toma el cobalto, pero es un estado (seleccionado), no un titular |

Contraste: texto 16,1 / 12,9; secundario 6,7 / 6,7; acción sobre fondo 6,4 / 5,8; texto del botón 7,0 /
6,8; dominio más débil 3,6 / 5,5. **Punto flojo:** el cobalto (`#3d2bff`) y D1 (`#2f6fd0`) son los dos
azules; se distinguen por saturación y por uso, pero son los más parecidos de las tres paletas.


**Nota de escala:** en B, como en A los medidores por task statement tienen todos el mismo largo (el relleno es solo avance), así que podrían leerse como "todas las tasks pesan igual". El peso de cada una va en cifra al lado. C, en cambio, lo codifica como número de cuadros. En la FASE 2, A y B tendrían que dar a esos medidores un largo proporcional al peso.

---

## C. Retícula

**La idea:** el examen dibujado como sus preguntas. Cada cuadro es una de las 53 (o 60) preguntas, repartida
por el peso oficial de su dominio (resto mayor). Están ordenadas por columnas, así que cada dominio es un
bloque contiguo y la retícula se lee como la barra apilada hecha de unidades. Un cuadro sólido es una
pregunta de ese tipo que hoy respondes bien. La misma retícula es el mapa del simulacro en la FASE 2: el
examen se ve igual antes, durante y después.

| Rol | Claro | Oscuro | Nombre |
|---|---|---|---|
| Fondo | `#ffffff` | `#152140` | Hoja / Azul tinta |
| Texto | `#14213d` | `#eef2f8` | Azul tinta / Hoja |
| Secundario | `#4a5872` | `#aab6cc` | Pizarra |
| Hairline | `#d5dbe5` | `#2f3f63` | Renglón |
| Acción y marca | `#ffd400` | `#ffd84d` | Amarillo marcador |

**Acento de acción, el giro:** amarillo marcador. *Subrayar es lo que hace quien estudia: el amarillo marca
la pestaña activa, el dominio abierto y la acción principal; nunca es texto, siempre es fondo o subrayado,
con tinta encima.* D4 baja a `#a85c00` para no confundirse con él.

**Tipografía:** Archivo (eje de ancho 62–125) + JetBrains Mono. *Por qué:* una sola familia da dos voces
sin mezclar fuentes. Comprimida (62 %) para las cifras gigantes (el `53`, el `D2`) y expandida (112–125 %)
para la marca y los títulos. La mono queda para los números de pregunta y los pesos. Costo: Archivo es
nueva para el Ecosistema (OFL, ~70 KB variable); en el mockup se carga desde Google Fonts.

```
Cert Studio                                          [CCAR-F|CCDV-F] [◐]
Overview  Drill  Mock exam  Traps  Progress
▔▔▔▔▔▔▔▔ (marcador)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ███  ███    Claude Certified Developer – Foundations
 █ █    █    Each square is one of the 53 questions, split by weight…
 ███  ███
[1][5][9][13][17][21][25][29][33][37][41][45][49][53]
[2][6][■][■ ][17][22][26][30][34][38][42][46][50]
[3][7][■][■ ][19][23][27][31][35][39][43][47][51]
[4][8][■][■ ][20][24][28][32][36][40][44][48][52]
 D1──┘ D2────────────────┘D3 D4 D5────┘ D6───┘ D7┘ D8──┘
■ D1 Agents and Workflows 14.7 %, 8 q   ■ D2 Applications… 33.1 %, 17 q
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 D2           2.1  Understanding requirements          ■□  ≈ 1.8 questions
 Applications 2.2  Systems life cycle                  ■▯  ≈ 1.5 questions
 [Drill D2]   2.3  Claude API mechanics                ■■□▯ ≈ 3.6 questions
```

**Qué la hace distinta:** no se parece a ningún dashboard. Es la única de las tres en la que el número
grande (53) es el examen mismo, y la única que dice en unidades humanas cuánto vale algo: "≈ 3,6 preguntas"
se entiende mejor que "6,8 %".

**Dominios chicos:** un dominio nunca tiene menos de un cuadro, y un cuadro siempre se puede tocar (64 px en
1440, 40 px en 390). D4 (2,6 % de 53 = 1,38) es un cuadro, y la leyenda conserva el peso oficial exacto. El
costo es la **cuantización**: el reparto es aproximado (resto mayor) y lo dice en pantalla ("expected split,
not a promise").

**Molde que evita:** el gráfico de barras de dashboard. Aquí no hay ejes ni barras: hay preguntas.

**Revisión contra los prohibidos**

| Prohibido | Estado |
|---|---|
| Crema + serif + terracota | No: blanco puro, grotesca de ancho variable, amarillo |
| Tarjetas idénticas, mismo radio y sombra | **Riesgo leído y aceptado:** los cuadros son idénticos a propósito, porque son unidades de medida, no tarjetas de contenido. No tienen radio ni sombra |
| Mayúsculas espaciadas | No |
| Puntos medios | No (`<title>` corregido) |
| `→` en los botones | No |
| Negro teñido como fondo | El oscuro es azul tinta `#152140`, un azul saturado y elegido como color (el mismo del texto en claro: los temas se invierten), no un neutro casi negro |
| Negro + un solo verde ácido/bermellón | No: fondo azul + amarillo, y los dominios llevan su color |
| Fade+slide, hover en todo | Una sola coreografía (los cuadros aparecen en orden de pregunta, 12 ms cada uno, ~0,6 s en total); sin hovers |
| Una palabra del titular en otro color | No. El `D2` grande va en el color del dominio, pero es un código y no parte de una frase |

Contraste: texto 16,0 / 14,1; secundario 7,2 / 7,8; texto del botón sobre amarillo 11,2 / 11,5; dominio más
débil 4,3 / 6,3. **Punto flojo:** en claro, el amarillo contra blanco da 1,43:1. El botón lo resuelve con
un borde de 2 px en tinta (el límite del control es el borde, 16:1), y la marca de la pestaña acompaña a un
texto en negrita. En oscuro el amarillo sí contrasta por sí solo (11,5).

---

## Comparación y recomendación

| | A. Regla | B. Columna | C. Retícula |
|---|---|---|---|
| Fidelidad al concepto ("la barra es la navegación") | Alta en escritorio, baja en móvil (la lista navega) | **La más alta**: está en todas las vistas | Media: la barra cuantizada |
| Lo memorable | La lupa | El peso de 168 px y el riel | **El examen como 53 cuadros** |
| Dominios de 2,6 % | Lista en móvil | Etiquetas con guía; escala distorsionada solo en pantallas bajas | **Siempre tocable** |
| Reutilización en la FASE 2 | Media | Alta (el riel es el marco) | **Alta (es el mapa del simulacro)** |
| Fuentes nuevas | Ninguna | Plex Condensed + Mono | Archivo |
| Debilidad principal | Fondo oscuro defendible pero cercano al molde | Dos azules parecidos | Reparto aproximado |

**Recomendación: C.** Es la que más claramente hace decir "esto es distinto". Responde al problema de
CCDV-F sin trucos (un dominio chico es un cuadro, nunca una astilla de 9 px), y la FASE 2 la reutiliza
entera: el mapa de celdas del modo examen y el resultado "con tu tinta real" son la misma retícula. Si
prefieres que el instrumento sea el marco de toda la app, **B** es la segunda opción. Las dos se pueden
combinar en la FASE 2: el riel de B como navegación y la retícula de C como portada y como simulacro.
Eso lo propongo, pero no lo hago sin que lo elijas.

---

## Raycast (base elegida por el owner, 2026-10-15)

Fuente: hoja de Refero "Raycast — Style Reference, Midnight command center, coral neon"
(`https://styles.refero.design/style/3b6a17f0-3bdf-418c-a95e-0b89e5a8b2f8`), bajada con
`../Landing/tools/refero/pull.mjs` a `docs/refero/raycast/` (fuera de git: licencia desconocida). La prosa de la
hoja la escribió un modelo; **solo los tokens medidos de abajo se toman como hechos**.

Mockup: `docs/mockups/raycast.html`. Una página con el Overview (el instrumento) y, debajo, una pregunta en modo
examen; `?view=exam` muestra solo la cabina. La pregunta es real, del banco: la primera de la primera task del
dominio abierto (`CCDVF-2.1-*`). Capturas: `evidence/identidad/raycast-<light|dark>-<1440|390>.png` y
`raycast-exam-<light|dark>-<1440|390>.png` (8), con `node tools/mockup-shots.mjs raycast`.

### Tokens medidos (de `variables.css` y `DESIGN.md` de la hoja)

| Rol | Valor Raycast | Uso aquí (oscuro) | Claro (derivado) |
|---|---|---|---|
| Canvas (Void Black) | `#040506` | fondo de página y de la cabina | `#f5f5f6` |
| Panel (Ink) | `#07080a` | tarjeta del instrumento, teclas | `#fbfbfc` |
| Pozo (Obsidian) | `#111214` | selector, tecla hundida, celdas sin responder | `#ebebed` |
| Grafito | `#1b1c1e` | tecla de atajo, opción activa del selector | `#e2e2e4` |
| Bordes (Slate / nav) | `#2f3031` / `#363739` | separadores / nav flotante | `#d6d6d8` / `#cfcfd2` |
| Texto | blanco / Ash `#9c9c9d` / Smoke `#6a6b6c` | principal / secundario / ningún texto con información | `#111214` / `#5c5d60` / `#6a6b6c` |
| Botón primario | Mist `#e6e6e6` con texto Iron `#454647` | único relleno: "Start mock", "Next question" | `#1b1c1e` con texto `#e6e6e6` |
| "Tecla" | `inset 0 1px 0 rgba(255,255,255,.05)` + anillo de 1 px a .25 + `inset 0 -1px 0 rgba(0,0,0,.2)` | toda la elevación; el anillo baja a .12 (con .25 las 8 teclas competían con el instrumento) | luz interior blanca a .95 + anillo negro a .12 |
| Radios | 6 badges, 8 botones e inputs, 16 tarjetas, 20 grandes, píldora | 8 teclas y botones, 12 opciones, 20 instrumento y cabina | igual |
| Tipografía | Inter 400/500/600; display 56 px / 1,17 / +0,22 px; Geist Mono 10–14 px | igual; el `h1` es el display | igual |
| Nav | píldora flotante, `backdrop-filter: blur(48px)`, borde `#363739` | igual | vidrio claro |

Contraste medido: Ash sobre el canvas, 7,4:1; Iron sobre Mist, 7,6:1; secundario claro `#5c5d60` sobre
`#f5f5f6`, 6,0:1; botón claro, 13,7:1. **Smoke (`#6a6b6c`) da 3,8:1 sobre el canvas, así que no se usa para
ningún texto con información**: la escala, las cifras y las pistas van en Ash.

### Las 6 adaptaciones, como decisiones

1. **El único color con significado son los dominios.** Se recupera la paleta de antes del 5b
   (`#3a7bd5 #2f9e6f #8a5cf6 #e0921a #e0457b #1fa3a3 #b4462f #6b7d2c`) y se ajusta **solo la luminosidad
   HSL**, con el mismo matiz y la misma saturación, hasta ≥ 6,5:1 sobre `#040506` (≥ 6:1 sobre el pozo) en
   oscuro y ≥ 4,6:1 sobre `#f5f5f6` en claro:

   | | D1 | D2 | D3 | D4 | D5 | D6 | D7 | D8 |
   |---|---|---|---|---|---|---|---|---|
   | Oscuro | `#5e93dd` | `#31a675` | `#a17bf8` | `#e0921a` | `#e66894` | `#1fa3a3` | `#d77965` | `#859b37` |
   | Claro | `#2b6eca` | `#257d58` | `#7c49f5` | `#996412` | `#d22360` | `#177a7a` | `#b4462f` | `#657529` |

   CCAR-F usa D1–D5. El coral de Raycast (`#ff6363`) no entra. El acento de marca es un solo punto junto a
   "Cert Studio", del color del dominio abierto. **Aviso:** D7 aclarado (`#d77965`) es un salmón. No es el
   coral de Raycast (está menos saturado), pero es el tono más cercano: si molesta, D7 es el único al que
   habría que cambiarle el matiz.
2. **El instrumento es el hero** y el único lugar con color fuerte. La barra apilada va a escala real
   (0–100 % del examen, nunca "el más grande = lleno"): cada tramo muestra el peso como pista (el color del
   dominio al 24 % en oscuro y al 14 % en claro) y el avance como relleno sólido. Debajo van 8 teclas, una
   por dominio, que en móvil son la navegación. El dominio abierto se redibuja a su escala propia, con el
   rango del examen que cubre (14,7 %…47,8 %). Cada task statement lleva un medidor **de largo proporcional
   a su peso** en esa escala, con el avance dentro; así se corrige la nota de escala de A y B.
3. **Modo examen = cabina.** Canvas puro y sin nav (se oculta). La pregunta va en Inter 22 px/400 (19 en
   móvil). Las opciones son teclas: al elegir una, se hunde (luz y anillo invertidos, `translateY(1px)`,
   150 ms) y su atajo se rellena en Mist. Los atajos A–D van en Geist Mono dentro de la tecla y funcionan
   con el teclado. Reloj en mono de 32 px. El mapa de 53 celdas solo tiene color en las respondidas.
4. **Tema claro**: la misma pila invertida (canvas `#f5f5f6`, panel `#fbfbfc`, pozo `#ebebed`), neutra, sin
   crema. Se mantiene la regla de borde fino + luz interior, sin sombras exteriores. El primario se invierte
   (grafito con texto Mist). Por defecto sigue `prefers-color-scheme`; el toggle lo fija.
5. **Movimiento**: una sola coreografía de carga (la barra se dibuja de izquierda a derecha en 600 ms,
   ease-out, con `clip-path`) y la tecla que se hunde (150 ms). Con `prefers-reduced-motion` queda un
   fundido de 300 ms y la tecla no se desplaza.
6. **El molde prohibido sigue vigente.** La única etiqueta en mayúsculas espaciadas (mono de 10 px, +0,8 px)
   es el código del task statement (`CCDVF-2.3`), porque ahí la etiqueta es información. Sin puntos medios,
   sin `→`, sin sombras exteriores. Las teclas de dominio tienen todas la misma forma a propósito (son un
   teclado, no tarjetas de contenido) y se distinguen por el color de su punto.

### Lo que el mockup todavía no resuelve (FASE 2)

- **Fuentes**: en el mockup se cargan desde Google Fonts. En la app irían alojadas en `app/fonts/` (Inter y
  Geist Mono son OFL), con fallbacks de métricas ajustadas como hoy.
- **En 390 px, "Start mock" sale del nav** porque no cabe junto al selector de certificación; habría que
  ponerlo como primer botón bajo el instrumento.
- **En móvil se ocultan las cifras bajo la barra**: ahí el peso lo llevan las teclas.
- **ES/EN**: el mockup está en inglés, como la app por defecto.
