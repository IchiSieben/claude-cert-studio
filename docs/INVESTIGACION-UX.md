# Investigación UX para Cert Studio

Fecha: 2026-10-15. Alcance: qué dicen personas que preparan certificaciones técnicas, y verificación de la guía oficial.

## Método y límites

- Herramientas: WebSearch y WebFetch. Firecrawl devolvió "Unauthorized" y no se usó.
- Marcas de evidencia: **[abierta]** = abrí la URL y leí su contenido. **[búsqueda]** = solo vi el resultado en la lista de búsqueda (extracto), no abrí la página.
- **Límite principal: no pude leer Reddit.** El buscador bloquea reddit.com y los espejos (redlib) no resolvieron. No hay ningún hilo de r/AWSCertifications, r/ClaudeAI, r/learnprogramming ni r/Anki que yo haya abierto. Lo que sí entró: foro de Tutorials Dojo, hilos de Hacker News, notas de Matuschak, un blog de Substack con relato de examen, reseñas de Trustpilot (solo extractos) y fuentes de ciencia del aprendizaje (solo extractos).
- No encontré hilos de ExamTopics ni de Hacker News sobre el examen Claude. Los relatos de CCA-F vienen de Substack, Medium, LinkedIn y gitconnected; Medium y gitconnected dieron 403 (solo extracto de búsqueda).
- No se cita ni reproduce ninguna pregunta de examen ni de volcados.
- Varias fuentes son blogs de proveedores con interés comercial. Se marcan. Los números de esas fuentes no están verificados.
- "Qué cambia" son propuestas mías de diseño, no hallazgos de las fuentes.

## Hallazgos

### 1. El simulacro oficial y los propios dan falsa confianza
- Evidencia: https://itone.substack.com/p/lessons-from-the-anthropic-architect (13 jul 2026) [abierta]. El autor aprobó el simulacro oficial con facilidad, pero el examen real le pareció más denso, y las prácticas generadas con Claude eran más fáciles y sesgadas a ciertos temas. Aprobó por poco margen. Extractos de búsqueda de relatos CCA-F (Medium/LinkedIn, sin fecha visible) [búsqueda] mencionan alguien con 964 en un simulacro y 671 en el real; no pude verificar el original. Trustpilot ERPprep (sin fecha visible) [búsqueda]: "practiqué hasta casi 100% y saqué 63% en el real".
- Qué cambia en Cert Studio: no mostrar nunca un "% de probabilidad de aprobar". Mostrar la métrica por dominio igual que el informe oficial, y una nota fija: "tu nota aquí no predice la real". Marcar cada ítem con dificultad (fácil/denso) y exigir en el simulacro una mezcla con proporción fija de ítems densos.

### 2. Repetir el mismo banco convierte la práctica en memoria de respuestas
- Evidencia: https://portal.tutorialsdojo.com/forums/discussion/regarding-practice-tests/ (28 feb 2021) [abierta]. El soporte de Tutorials Dojo dice que repetir el modo por temas "solo da memorización de respuestas" y recomienda modos aleatorizados. Extracto de búsqueda de un comentario en r/AWSCertifications (sin fecha) [búsqueda] sugiere reservar el examen completo para uno o dos días antes del real.
- Qué cambia en Cert Studio: barajar el orden de opciones en cada intento; contador de "veces vista" por ítem; el simulacro prioriza ítems nunca vistos y avisa cuando el banco restante ya es corto. Antes de revelar la respuesta, pedir al usuario marcar su nivel de seguridad (1 clic) para distinguir acierto razonado de acierto por reconocimiento.

### 3. Preguntas erróneas, desactualizadas y reportes que nadie atiende
- Evidencia: Trustpilot SkillCertPro y ERPprep (sin fecha visible) [búsqueda], p. ej. https://www.trustpilot.com/review/skillcertpro.com?page=3 : respuestas marcadas mal, explicaciones ausentes, un revisor dice que de unos 50 reportes le notificaron uno corregido. El relato de itone [abierta] avisa que muchos ítems de volcados son dudosos o falsos.
- Qué cambia en Cert Studio: cada ítem lleva fecha de última verificación y enlace a la página de documentación que lo respalda; botón "reportar error" que abre un issue de GitHub prellenado con el id del ítem; un changelog público de correcciones. Es lo que más diferencia a una app gratuita y abierta de un banco de pago.

### 4. Los distractores son características reales aplicadas donde no corresponden
- Evidencia: extractos de búsqueda de relatos CCA-F (LinkedIn/Towards AI, sin fecha visible) [búsqueda]: las opciones incorrectas son anti-patrones realistas y una sola palabra ("garantizado", "más rápido") cambia la respuesta; https://itone.substack.com/p/lessons-from-the-anthropic-architect [abierta]: opciones diseñadas para engañar, y confundir convenciones de otras herramientas con el modelo de configuración de Claude.
- Qué cambia en Cert Studio: ya existe la taxonomía de 10 trampas; añadir (a) tras fallar, mostrar qué trampa elegiste y cuál era la señal en el enunciado; (b) estadística "tus fallos por tipo de trampa"; (c) resaltar tras responder las palabras absolutas del enunciado y de las opciones (siempre, nunca, garantizado).

### 5. La repetición espaciada sirve para recordar, no para decidir en escenarios
- Evidencia: https://www.examcert.app/blog/ai-flashcards-vs-ai-practice-exams-2026/ (29 abr 2026) [abierta], blog de un proveedor de exámenes de práctica: las tarjetas no tienen distractores y no entrenan decisión; sus porcentajes no tienen fuente. https://news.ycombinator.com/item?id=35511357 (10 abr 2023) [abierta]: comentaristas dicen que la repetición espaciada no construye habilidad por sí sola y que hay que seguir resolviendo problemas. Extracto de búsqueda de un hilo r/Anki (oct 2024) [búsqueda]: debate entre recuerdo libre y opción múltiple.
- Qué cambia en Cert Studio: programar con SM-2 la *regla de decisión* (una línea por ítem: "cuando X, usar Y porque Z"), no solo el enunciado. Tras dos aciertos, servir una variante del mismo ítem con otra superficie (otros nombres, mismo principio). Evita que SM-2 premie reconocer el texto.

### 6. El hábito diario muere por acumulación de pendientes
- Evidencia: https://news.ycombinator.com/item?id=35520264 (11 abr 2023) [abierta] y https://news.ycombinator.com/item?id=35511357 [abierta]: quien carga una lista enorme se ahoga en repasos y abandona; consejos: limitar tarjetas nuevas, sesiones de 5 a 15 minutos, repasar antes de añadir, no ser "completista".
- Qué cambia en Cert Studio: sesión diaria con tope (por defecto 10 ítems, unos 10 min); repasos vencidos primero y los nuevos solo si quedan huecos; si hay más de N vencidos, posponer el sobrante sin mostrar un contador acusador. Todo en localStorage.

### 7. El primer uso debe dar valor inmediato
- Evidencia: https://notes.andymatuschak.org/z3DiwZKDuLxMV17mt2nWH7y (sin fecha visible; cita de 2019) [abierta]: el hábito de repaso es oneroso, las primeras sesiones tienen pocos prompts mediocres y el beneficio no se ve pronto, por eso la gente lo deja.
- Qué cambia en Cert Studio: tras la primera sesión de 10 ítems, mostrar de inmediato un mapa por dominio con el peso oficial al lado ("esto vale 33,1% del examen y llevas 40%"). Sin registro ni configuración previa.

### 8. Rachas: efecto plausible pero la evidencia que hallé es de segunda mano
- Evidencia: https://www.lazyweb.com/research/duolingo-retention-experiments (2023, nota de un proveedor) y un resumen de un estudio de *Journal of Consumer Research* [búsqueda]: la racha visible aumenta la repetición, romperla desanima, congelar o reparar la suaviza. No hallé estudio controlado en aprendices ni testimonios de usuarios sobre rachas.
- Qué cambia en Cert Studio: en vez de racha estricta, "días estudiados de los últimos 14" con un día de gracia por semana. Es barato y evita el castigo por romper. No lo presentaría como probado.

### 9. La guía oficial permite estudiar por peso, y el informe es por dominio
- Evidencia: Exam Guide CCDV-F y CCAR-F v1.0, efectiva julio 2026 [abierta, texto extraído del PDF]: el informe de puntaje muestra el % correcto por dominio, que no se usa para aprobar; el aprobado es solo el puntaje total escalado. El examen es criterial: se mide contra un estándar fijo, no contra otros candidatos. CCDV-F: Eval/Testing/Debugging pesa 2,6% y Claude Code 3,1%; Applications and Integration pesa 33,1%.
- Qué cambia en Cert Studio: mostrar la preparación ponderada por el peso del dominio, no el promedio simple, y una métrica "puntos en juego" = peso × (1 − dominio). Evita gastar tiempo en dominios de 2,6%.

### 10. La presión de tiempo es real
- Evidencia: https://itone.substack.com/p/lessons-from-the-anthropic-architect (13 jul 2026) [abierta]: 60 preguntas en 2 horas; terminó con unos diez minutos de margen y preguntas por revisar.
- Qué cambia en Cert Studio: en el simulacro, indicador de ritmo (promedio 2,26 min por ítem en CCDV-F y 2,0 en CCAR-F, calculado de 120/53 y 120/60), marcar para revisar y pantalla final de ítems marcados antes de enviar. Guardar el tiempo por ítem para mostrar cuáles te frenan.

### 11. La última semana: repasar, no aprender; último simulacro 5 a 7 días antes
- Evidencia (genérica, no específica de Claude): https://www.manhattanprep.com/gmat/forums/post4006.html [búsqueda] (un tutor de GMAT: la semana final es repaso, último simulacro 5 a 7 días antes); https://cbtnuggets.com/blog/career/career-progression/when-to-stop-studying-for-your-exam [búsqueda] (no cramming la noche anterior, repaso ligero); un curso de reválida médica [búsqueda] (mantener práctica cronometrada). No encontré hilos reales de "última semana" para estas certificaciones.
- Qué cambia en Cert Studio: "modo semana final" con fecha de examen guardada localmente: D-7 simulacro completo, D-6 a D-2 dominios débiles más repasos vencidos, D-1 solo la hoja de reglas (sin ítems nuevos). Declarar en la interfaz que el plan sale de consejos generales, no de datos del examen Claude.

### 12. Ciencia del aprendizaje: practicar recuperando y espaciar rinden; entrelazar es "moderado"
- Evidencia [búsqueda, extractos]: Dunlosky et al. 2013 (PSPI) califica práctica con pruebas y práctica distribuida como utilidad alta, entrelazado como moderada, releer y subrayar como baja (https://www.psychologicalscience.org/observer/which-study-strategies-make-the-grade-2). Cepeda et al. 2006, metaanálisis: el intervalo óptimo entre estudios crece con el retraso hasta la prueba (https://digitalcommons.usf.edu/psy_facpub/1771/). Rohrer, Dedrick y Burgess 2014: en séptimo grado el entrelazado superó al bloqueado (72% frente a 38%; cifra de un extracto) (https://link.springer.com/article/10.3758/s13423-014-0588-3). Karpicke y Roediger 2008: seguir evaluando supera seguir releyendo (https://profiles.wustl.edu/en/publications/the-critical-importance-of-retrieval-for-learning/). Los resultados son de vocabulario y matemáticas escolares, no de certificaciones; verificar cifras en los originales.
- Qué cambia en Cert Studio: tope de intervalo SM-2 en función de la fecha de examen guardada (si hay fecha); sesión diaria entrelazada entre dominios por defecto, con el modo "por dominio" solo como práctica explícita; no ofrecer "releer notas" como actividad principal.

### 13. Lo que piden y casi ningún banco da
- Evidencia: [búsqueda] foros GMAT Club (https://gmatclub.com/forum/post671587.html), foro CPA (https://forum.another71.com/forum/welcome-cpa-exam-forum/ot-off-topic/topic/features-you-want-in-study-software/page/2) y Booster Prep (https://boosterprep.com/dat/study-guide/using-anki-to-review-practice-tests): análisis de errores por tema, reabrir solo las falladas, saltar las vistas recientemente, marcar dudosas, y convertir cada fallo en tarjeta de recuerdo. Un experto de GMAT Club insiste en estudiar por qué cada opción incorrecta es incorrecta.
- Qué cambia en Cert Studio: registro de errores por task statement, "reintentar falladas", marcar dudosas, y explicación por opción (ya hay trampas). Además, exportar e importar el progreso como JSON, porque vive solo en el navegador; es inferencia mía: un cambio de navegador o borrar datos pierde meses de repasos.

### 14. En CCAR-F el examen es 4 escenarios de 6, con selección múltiple de N respuestas
- Evidencia: Exam Guide CCAR-F v1.0 [abierta, PDF]: "4 scenarios drawn from a bank of 6", ítems de opción múltiple y de respuesta múltiple donde cada ítem indica cuántas seleccionar.
- Qué cambia en Cert Studio: verificar que el simulacro CCAR-F agrupe los ítems por escenario (4 de 6 al azar) y que el formato de selección múltiple diga explícitamente "elige N". Es una comprobación de la app, no pude inspeccionar el código aquí.

### 15. Consejo de práctica de quien aprobó: construir y generar ejercicios densos
- Evidencia: https://itone.substack.com/p/lessons-from-the-anthropic-architect (13 jul 2026) [abierta]: recomienda construir un proyecto que cubra el alcance, hacer laboratorios del currículo completo y mirar los volcados solo de pasada. Extractos de búsqueda de otros relatos CCA-F [búsqueda] apoyan simulacros difíciles y entender el porqué en lugar de memorizar.
- No aplica, por qué: Cert Studio es una app estática de preguntas; construir proyectos queda fuera. Sí se puede enlazar cada task statement a su laboratorio o documentación, que se cubre en el hallazgo 3.

## Guía oficial: diferencias encontradas

**Ninguna en los datos que declara la app.** Qué revisé:

- Las páginas de Skilljar de CCDV-F y CCAR-F [abiertas] solo traen tarifa de $125 y remiten a la guía; no dicen ítems ni pesos. La página https://anthropic-partners.skilljar.com/page/partner-certifications [abierta] enlaza los dos PDF de guía.
- Las dos guías (PDF, versión 1.0, efectiva julio 2026, metadatos del 8 jul 2026) [abiertas, texto extraído localmente]:
  - CCDV-F: 53 ítems, 120 minutos, aprobado 720 en escala 100-1.000, $125 USD. Pesos: 14,7 / 33,1 / 3,1 / 2,6 / 16,8 / 11,0 / 8,1 / 10,6. Coincide con la app.
  - CCAR-F: 60 ítems, 120 minutos, 720/1.000, $125 USD. Pesos: 27 / 18 / 20 / 20 / 15. Coincide con la app.
- FAQ https://anthropic-partners.skilljar.com/page/faq-certifications [abierta]: 120 minutos para responder y unos 135 de permanencia; 720 de 1.000 para las cuatro certificaciones; $125 CCDV-F y CCAR-F (este último costaba $99 antes del 30 jun 2026); reintentos tras 14, 30 y 90 días, máximo cuatro por año móvil; vigencia 12 meses. La FAQ no da número de ítems ni pesos.
- Dato nuevo útil para la app, no una discrepancia: las guías dicen "subject to change without notice"; conviene mostrar en la app "guía v1.0, julio 2026" y avisar si cambia. No encontré en la guía CCDV-F estructura por escenarios (solo la CCAR-F la declara).
- No comparé las preguntas de muestra de las guías con el banco de la app ni inspeccioné el código de la app.

## Top 10 de cambios por valor/esfuerzo

1. Tope diario de sesión, repasos primero y sobrante pospuesto sin contador acusador (hallazgos 6, 7). Esfuerzo bajo, valor alto en retención.
2. Mapa por dominio con peso oficial y "puntos en juego" tras la primera sesión (7, 9). Bajo/alto.
3. Barajar opciones por intento y priorizar ítems no vistos en el simulacro (2). Bajo/alto.
4. Tras fallar, mostrar qué trampa elegiste y su señal; estadística por trampa (4). Bajo-medio/alto, usa lo que ya existe.
5. Exportar e importar progreso en JSON (13). Bajo/alto, protege el progreso local.
6. Aviso fijo "la nota del simulacro no predice la real" y dificultad por ítem (1). Bajo/medio.
7. Botón "reportar error" a GitHub con id de ítem, fecha de verificación y enlace a la documentación (3). Medio/alto.
8. Modo semana final con fecha de examen guardada y tope de intervalos SM-2 a esa fecha (11, 12). Medio/alto.
9. Simulacro con marcar para revisar, indicador de ritmo y tiempo por ítem; verificar agrupación por 4 de 6 escenarios y "elige N" en CCAR-F (10, 14). Medio/alto.
10. Programar la regla de decisión y servir variantes tras dos aciertos (5). Medio-alto/alto, el cambio más profundo.
