# Qué enseña Cert Studio

Cinco conceptos que este proyecto ejercita, con el formato de las fichas de `enjambre/docs/conceptos/`. Son la parte académica para la sección de estudio del Landing (ruta "Certifícate" de la Academy).

---

# Taxonomía de distractores

## Qué es

Una clasificación cerrada de *por qué* una opción incorrecta parece correcta. En lugar de etiquetar una respuesta como "mala", se nombra la trampa: parche de parámetro, confiar en el prompt para algo con consecuencias, sobreingeniería, "solo añade contexto", mito, alcance equivocado, guía vaga, autorrevisión, parsear texto en vez de usar estructura, y violar la restricción dominante del enunciado. Diez tipos, cada uno con una pista de cómo reconocerlo.

## Por qué importa aquí

Las preguntas de escenario del examen tienen una opción correcta y tres trampas plausibles. Saber el dato ayuda; reconocer el *tipo* de trampa es más rápido y se transfiere a preguntas que nunca viste. Por eso en `app/data/questions-*.js` cada opción incorrecta lleva una clave de `window.TRAPS`, el validador (`tools/validate-bank.mjs`) rechaza una opción sin etiqueta válida, y el resultado del simulacro no dice solo cuántas fallaste sino qué trampas te atraparon.

## Ejemplo real

`CCDVF-2.1-01`: un chatbot sobre un manual de 5 000 páginas que cambia cada mes. La opción "pega todo el manual que quepa en cada request" es `bigger-context`; "empieza con el modelo más capaz" es `parameter-patch`; "haz fine-tuning con el manual" es `over-engineering`. La correcta traduce el pedido a requisitos funcionales y de infraestructura antes de escribir código. Al generar el banco, 10 de 23 lotes se rechazaron enteros por etiquetas mal puestas (NOTES, 26-sep): la etiqueta es parte de la pregunta, no un adorno.

## Error típico

Usar "mito" como cajón de sastre. Un mito afirma algo falso sobre la plataforma; una opción que solo es una mala elección (por ejemplo, una skill por aplicación) es `wrong-scope`, no `myth`. Si la etiqueta no describe la opción, el estudiante aprende la lección equivocada.

## Para saber más

- Haladyna, Downing y Rodriguez (2002), *A Review of Multiple-Choice Item-Writing Guidelines*: https://doi.org/10.1207/S15324818AME1503_5

---

# Muestreo por peso con resto mayor

## Qué es

Repartir *n* preguntas entre dominios en proporción a su peso cuando las cuotas exactas tienen decimales. Se toma la parte entera de cada cuota y los puestos que sobran se dan, uno por dominio, a los que tienen mayor parte fraccionaria (método de Hamilton). La suma da exactamente *n* y ningún dominio se aleja más de una pregunta de su cuota.

## Por qué importa aquí

El simulacro debe parecerse al examen real: si un dominio pesa 33 %, un tercio de las preguntas sale de ahí. Redondear cada cuota por separado puede dar 59 o 61 preguntas en un examen de 60. `startMock()` en `app/index.html` aplica el resto mayor y luego, dentro de cada dominio, prioriza las preguntas que nunca salieron en tus simulacros anteriores.

## Ejemplo real

Diagnóstico rápido de CCAR-F, 30 ítems, pesos 27/18/20/20/15: cuotas 8,1 · 5,4 · 6 · 6 · 4,5. Partes enteras 8+5+6+6+4 = 29; sobra 1 y va al dominio 5 (fracción 0,5, la mayor): **8, 5, 6, 6, 5**. En CCDV-F (53 ítems, ocho dominios) sobran 5 puestos tras las partes enteras; el dominio 2 (33,1 %) queda con 17 preguntas de 17,54.

## Error típico

Redondear cada cuota con `Math.round` y "arreglar" la diferencia en el último dominio. El total cuadra pero el último dominio absorbe todo el error. La prueba e2e `full mock: official length` verifica que el total sea exactamente el del examen.

## Para saber más

- Método del resto mayor (Hamilton): https://en.wikipedia.org/wiki/Largest_remainder_method

---

# Repaso espaciado simple ("due today")

## Qué es

Volver a ver una pregunta cuando estás a punto de olvidarla, no cuando te toca por orden. Los sistemas completos (SM-2, FSRS) estiman un intervalo por tarjeta. Aquí se usa la regla más simple que todavía sirve: una pregunta está pendiente si nunca la viste, si la fallaste la última vez o si la acertaste hace más de 3 días.

## Por qué importa aquí

Con 218 preguntas no hace falta un planificador sofisticado; hace falta que los fallos vuelvan y que lo aprendido se repase antes de borrarse. `isDue()` en `app/index.html` implementa la regla en una línea, y la pestaña Drill ofrece "Practise due questions" filtrado por los dominios marcados.

## Ejemplo real

Perfil nuevo: las 106 preguntas de CCAR-F están pendientes. Tras practicar 5, el contador baja exactamente en las acertadas: el test `drill 5 questions records 5 answers and lowers the due count` comprueba que `due = total − acertadas`.

## Error típico

Guardar solo "acertada / fallada" sin la fecha. Sin `when` no hay forma de saber que algo acertado hace dos semanas ya necesita repaso. Cada respuesta guarda `seen`, `right`, `wrong`, `last` y `when`.

## Para saber más

- Ebbinghaus y la curva del olvido; Cepeda et al. (2006), *Distributed practice in verbal recall tasks*: https://doi.org/10.1037/0033-2909.132.3.354

---

# Puntaje escalado

## Qué es

Convertir un porcentaje de aciertos en una escala fija (aquí 100–1000, aprueba 720) para que exámenes de distinto largo o dificultad se comparen. Los exámenes reales usan escalas calibradas por ítem que no se publican.

## Por qué importa aquí

El simulacro pondera cada dominio por su peso oficial: `pct = Σ peso × aciertos/total` sobre los dominios presentes, y `puntaje = 100 + 900 × pct`. Un 720 equivale a ≈ 69 % ponderado. Es una aproximación lineal y la app lo dice: un piso, no una promesa.

## Ejemplo real

El diagnóstico de CCDV-F (27 ítems) trae 9 preguntas del dominio 2 (33,1 %) y una sola del dominio 4 (2,6 %). En `docs/img/result.png` (modo muestra) esa única pregunta del dominio 4 está fallada (0/1) y el resultado igual aprueba con 813: una pregunta de un dominio liviano pesa mucho menos que una del dominio 2, aunque ambas sean "una pregunta".

## Error típico

Promediar aciertos sin ponderar. Con 27 preguntas un dominio de 2,6 % puede salir con 1 ítem; si ese ítem pesa lo mismo que los 9 del dominio de 33 %, el puntaje deja de parecerse al examen.

## Para saber más

- Kolen y Brennan, *Test Equating, Scaling, and Linking* (Springer, 3.ª ed., 2014), cap. 1.

---

# Una app estática que se prueba de punta a punta

## Qué es

Una página sin servidor ni build (`app/index.html` + tres `.js` de datos) se puede probar igual que una aplicación completa: un navegador real (Playwright) la abre por `file://`, hace clic, responde simulacros y comprueba el estado.

## Por qué importa aquí

Los datos van como `.js` y no como `.json` justamente para que `file://` funcione: un `fetch()` de un JSON local lo bloquea el navegador. Así la misma copia corre desde un clon, desde Hostinger y desde la Mac sin cambiar nada. `npm test` cubre 16 casos: simulacros sin repetidos, resultado, modo muestra sin `localStorage`, PDF de la hoja de repaso, 390 px sin scroll horizontal y cero errores de consola.

## Ejemplo real

El test de modo muestra carga la app dos veces con `?sample=1` y exige el mismo estado: mismas preguntas vistas, mismo primer ítem de la práctica y `localStorage.length === 0`. Eso funciona porque en modo muestra `Math.random` se reemplaza por un generador con semilla fija (mulberry32), y por eso las capturas públicas son reproducibles.

## Error típico

Probar la lógica con tests unitarios y no abrir nunca la página. El `?lang=es` o un error de consola solo aparecen con el navegador; en este repo, el último paso de la suite falla si hubo cualquier error de consola en todo el recorrido.

## Para saber más

- Playwright, *Test isolation y browser contexts*: https://playwright.dev/docs/browser-contexts
