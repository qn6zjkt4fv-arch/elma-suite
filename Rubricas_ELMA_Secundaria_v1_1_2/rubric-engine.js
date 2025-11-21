/* ============================================================
   rubric-engine.js — v1.0 Institucional
   - Crear / editar criterios
   - Banco de rúbricas (localStorage)
   - Importar desde planeamiento didáctico ELMA
   - Sincronización básica con planeamiento (updatedAt)
   - Desglose de indicadores con múltiples acciones en criterios separados
   - Banco de ideas de estrategias de mediación (Bloom / Marzano)
     con filtro por área / materia institucional
   ============================================================ */
(function () {
  console.log("🟦 rubric-engine.js v1.0");

  const criteriaList     = document.getElementById("criteria-list");
  const addCriterionBtn  = document.getElementById("add-criterion");
  const previewBtn       = document.getElementById("preview-rubric") || document.getElementById("btn-preview");
  const previewContainer = document.getElementById("preview-area") || document.getElementById("rubric-preview");
  const saveBankBtn      = document.getElementById("save-bank") || document.getElementById("save-to-bank") || document.getElementById("btn-save");
  const loadBankBtn      = document.getElementById("load-bank") || document.getElementById("load-from-bank");
  const bankList         = document.getElementById("bank-list");

  // Vínculo con planeamiento didáctico ELMA
  const RUBRIC_TRANSFER_KEY    = "elma_rubric_transfer_v1";
  const RUBRIC_LAST_IMPORT_KEY = "elma_rubric_last_import_v1";

  // Filtro de materias / áreas institucionales
  const SUBJECT_FILTER = [
    { id: "all",            label: "Todas las materias" },
    { id: "ciencias",       label: "Ciencias (Física, Química, Biología)" },
    { id: "matematicas",    label: "Matemática y Cálculo" },
    { id: "sociales",       label: "Estudios Sociales y Cívica" },
    { id: "espanol",        label: "Español" },
    { id: "ingles_gram",    label: "Inglés gramatical" },
    { id: "ingles_conv",    label: "Inglés conversacional" },
    { id: "frances",        label: "Francés (7°, 8° y 9°)" },
    { id: "informatica",    label: "Informatica" },
    { id: "artes",          label: "Artes (industriales, plásticas, música)" },
    { id: "hogar",          label: "Educación para el hogar" },
    { id: "ed_fisica",      label: "Educación física" },
    { id: "religion",       label: "Educación religiosa" },
    { id: "filo_psico",     label: "Filosofía y Psicología" }
  ];

  // Banco de ideas de estrategias de mediación / evaluación formativa
  // Cada idea tiene: { text, subjects: ["all", "ciencias", ...] }
  const STRATEGY_BANK = [
    {
      id: "recordar",
      label: "Recordar / Recuperar (Bloom I)",
      description: "Actividades para activar conocimientos previos, reconocer conceptos, hechos, definiciones y vocabulario clave.",
      ideas: [
        {
          text: "Elaborar un glosario ilustrado con términos clave del tema y definiciones redactadas por el estudiante.",
          subjects: ["all", "espanol", "ciencias", "sociales"]
        },
        {
          text: "Usar tarjetas de emparejamiento (flashcards) concepto ↔ definición en parejas, con tiempo limitado.",
          subjects: ["all", "ciencias", "matematicas", "sociales", "espanol", "ingles_gram", "frances"]
        },
        {
          text: "Mini cuestionario de opción múltiple o respuesta corta al inicio de la lección para recuperar conocimientos previos.",
          subjects: ["all"]
        },
        {
          text: "Completar oraciones con espacios en blanco usando vocabulario específico del tema (por ejemplo, partes de la célula, componentes del circuito, elementos de un texto).",
          subjects: ["ciencias", "espanol", "matematicas"]
        },
        {
          text: "Lluvia de ideas en el pizarrón sobre lo que recuerdan del tema, organizando las ideas en palabras clave.",
          subjects: ["all"]
        },
        {
          text: "Listado guiado de hechos históricos clave con fecha y lugar para que el estudiante los ordene cronológicamente.",
          subjects: ["sociales", "filo_psico"]
        },
        {
          text: "Reconocer símbolos, fórmulas o notación (matemática, química, eléctrica) a partir de tarjetas con ejemplos.",
          subjects: ["matematicas", "ciencias", "informatica"]
        },
        {
          text: "Escuchar un breve audio o canción en inglés/francés y completar una lista de palabras que reconozca.",
          subjects: ["ingles_gram", "ingles_conv", "frances"]
        },
        {
          text: "Identificar en una imagen o esquema las partes principales (por ejemplo, partes de una planta, de un circuito, de un instrumento musical o segmentos corporales implicados en un movimiento).",
          subjects: ["ciencias", "biologia", "musica", "artes", "ed_fisica"]
        },
        {
          text: "Lista de verificación donde el estudiante marca qué temas y subtemas reconoce haber trabajado en períodos anteriores.",
          subjects: ["all"]
        }
      ]
    },
    {
      id: "comprender",
      label: "Comprender / Organizar (Bloom II)",
      description: "Actividades para explicar con sus palabras, organizar información y establecer relaciones básicas.",
      ideas: [
        {
          text: "Construir un mapa conceptual sencillo que relacione los conceptos principales del tema con conectores sencillos (es, tiene, se relaciona con...).",
          subjects: ["all"]
        },
        {
          text: "Realizar una tabla comparativa entre conceptos (por ejemplo: mezcla ↔ compuesto, democracia ↔ dictadura, función lineal ↔ cuadrática).",
          subjects: ["ciencias", "sociales", "matematicas"]
        },
        {
          text: "Reescribir una definición formal en un lenguaje sencillo, como si se lo explicara a un compañero de un nivel menor.",
          subjects: ["espanol", "ciencias", "sociales", "filo_psico"]
        },
        {
          text: "Elaborar un resumen gráfico (esquema, cuadro sinóptico) de un texto expositivo leído en clase.",
          subjects: ["espanol", "sociales", "ciencias"]
        },
        {
          text: "Realizar una historieta corta donde se represente una situación que ejemplifique el concepto (por ejemplo, conservación de la energía, respeto a las normas, empatía, juego limpio).",
          subjects: ["ciencias", "sociales", "civica", "filo_psico", "artes", "ed_fisica"]
        },
        {
          text: "Organizar instrucciones desordenadas en la secuencia correcta (por ejemplo, pasos de un experimento de laboratorio, pasos de un algoritmo sencillo, secuencia de un calentamiento físico).",
          subjects: ["ciencias", "informatica", "ed_fisica"]
        },
        {
          text: "Explicar con sus palabras un procedimiento matemático (por ejemplo, cómo resolver una ecuación de primer grado) en una breve nota escrita.",
          subjects: ["matematicas", "calculo"]
        },
        {
          text: "Escuchar un diálogo sencillo en inglés o francés y luego ordenar tiras de papel con los fragmentos del diálogo en el orden correcto.",
          subjects: ["ingles_conv", "ingles_gram", "frances"]
        },
        {
          text: "Comentar en grupo el significado de una obra de arte, canción o pieza musical, relacionándola con el contexto trabajado.",
          subjects: ["musica", "artes", "espanol", "filo_psico"]
        },
        {
          text: "Identificar y explicar los elementos de la estructura de un texto (introducción, desarrollo, cierre; tesis, argumentos, conclusión).",
          subjects: ["espanol", "filo_psico"]
        }
      ]
    },
    {
      id: "aplicar",
      label: "Aplicar / Usar en contextos (Bloom III)",
      description: "Actividades para usar lo aprendido en situaciones problema, ejercicios prácticos o contextos reales.",
      ideas: [
        {
          text: "Resolver una situación problema contextualizada que involucre los contenidos del tema (por ejemplo, cálculo de consumo eléctrico en el hogar, proporciones en una receta, presupuesto familiar).",
          subjects: ["matematicas", "calculo", "ciencias", "hogar"]
        },
        {
          text: "Diseñar y ejecutar un experimento de laboratorio sencillo siguiendo una guía y registrar observaciones en una tabla.",
          subjects: ["ciencias", "fisica", "quimica", "biologia"]
        },
        {
          text: "Aplicar fórmulas o procedimientos para resolver ejercicios con datos cercanos a la realidad del estudiante (por ejemplo, velocidad promedio en un viaje, frecuencia cardiaca en actividad física, impuestos, descuentos).",
          subjects: ["matematicas", "calculo", "fisica", "sociales", "ed_fisica"]
        },
        {
          text: "Simulación o juego de roles donde el estudiante deba asumir un papel (juez, representante estudiantil, científico, técnico de laboratorio, árbitro deportivo) y tomar decisiones usando el contenido estudiado.",
          subjects: ["sociales", "civica", "filo_psico", "ciencias", "ed_fisica"]
        },
        {
          text: "Elaborar un producto en artes industriales (objeto, maqueta, pieza simple) aplicando medidas, planos y especificaciones técnicas.",
          subjects: ["artes", "artes_industriales", "matematicas"]
        },
        {
          text: "Programar en informática una solución sencilla (por ejemplo, una calculadora básica, un quiz interactivo o una animación simple) utilizando estructuras básicas (secuencias, condicionales, repeticiones).",
          subjects: ["informatica", "matematicas"]
        },
        {
          text: "Preparar y presentar un diálogo en inglés o francés donde se utilice el vocabulario y la estructura gramatical del tema (tiempos verbales, comparativos, etc.).",
          subjects: ["ingles_conv", "ingles_gram", "frances"]
        },
        {
          text: "Aplicar técnicas de respiración, postura y articulación para interpretar una pieza musical breve o un texto dramático.",
          subjects: ["musica", "artes", "espanol"]
        },
        {
          text: "Planificar y ejecutar una rutina de calentamiento o circuito de estaciones incorporando habilidades motoras básicas (saltar, lanzar, correr) y registrando pulsaciones antes y después.",
          subjects: ["ed_fisica", "ciencias"]
        },
        {
          text: "Planificar y preparar una receta sencilla valorando medidas, tiempos de cocción y normas de higiene.",
          subjects: ["hogar", "ciencias", "matematicas"]
        },
        {
          text: "Resolver ejercicios de lógica o razonamiento (tablas de verdad, silogismos, paradojas) aplicando reglas vistas en filosofía o psicología.",
          subjects: ["filo_psico"]
        }
      ]
    },
    {
      id: "analizar",
      label: "Analizar / Relacionar (Bloom IV)",
      description: "Actividades para descomponer, comparar, encontrar patrones y relaciones causa–efecto.",
      ideas: [
        {
          text: "Construir un diagrama de Venn para comparar dos conceptos, procesos o modelos (por ejemplo, sistema nervioso ↔ sistema endocrino; democracia ↔ autoritarismo).",
          subjects: ["ciencias", "biologia", "sociales", "filo_psico"]
        },
        {
          text: "Elaborar un diagrama de flujo o línea de tiempo que muestre pasos, causas y consecuencias de un fenómeno (por ejemplo, proceso de independencia, ciclo del agua, diseño de un algoritmo, secuencia de un entrenamiento).",
          subjects: ["sociales", "ciencias", "informatica", "ed_fisica"]
        },
        {
          text: "Analizar un caso real (noticia, problema de convivencia, situación ambiental) identificando causas, actores involucrados y posibles consecuencias.",
          subjects: ["sociales", "civica", "religion", "filo_psico", "ciencias"]
        },
        {
          text: "Subrayado codificado por colores para distinguir ideas principales, detalles, argumentos y contraargumentos en un texto.",
          subjects: ["espanol", "filo_psico", "sociales"]
        },
        {
          text: "Clasificar un conjunto de ejemplos en categorías definidas por el docente, justificando por escrito la razón de la clasificación.",
          subjects: ["ciencias", "matematicas", "sociales", "espanol"]
        },
        {
          text: "Analizar un experimento o procedimiento fallido (real o ficticio) identificando los posibles errores en la secuencia de pasos.",
          subjects: ["ciencias", "fisica", "quimica", "informatica", "artes_industriales", "ed_fisica"]
        },
        {
          text: "Escuchar una pieza musical o analizar una obra plástica identificando elementos como ritmo, contraste, simetría, textura y explicando su efecto.",
          subjects: ["musica", "artes", "artes_plasticas"]
        },
        {
          text: "Analizar un discurso político o un texto argumentativo identificando tesis, argumentos, estrategias retóricas y posibles sesgos.",
          subjects: ["espanol", "sociales", "filo_psico"]
        },
        {
          text: "Comparar diferentes modelos científicos (por ejemplo, modelos atómicos, modelos de sistema solar) destacando semejanzas y diferencias.",
          subjects: ["ciencias", "fisica", "quimica"]
        },
        {
          text: "Analizar una situación de juego o partido (posición en cancha, toma de decisiones, trabajo en equipo) e identificar factores que favorecen o dificultan el desempeño.",
          subjects: ["ed_fisica", "filo_psico", "civica"]
        }
      ]
    },
    {
      id: "crear",
      label: "Crear / Sintetizar (Bloom V)",
      description: "Actividades para integrar y producir algo nuevo a partir de lo aprendido.",
      ideas: [
        {
          text: "Diseñar un proyecto o propuesta que responda a una necesidad del entorno (campaña ambiental, proyecto de servicio comunitario, mejora en la institución).",
          subjects: ["sociales", "civica", "ciencias", "religion", "filo_psico"]
        },
        {
          text: "Elaborar un mapa mental integrando todo el tema con palabras clave, imágenes y conexiones personales.",
          subjects: ["all"]
        },
        {
          text: "Crear un experimento o actividad nueva que permita comprobar una idea o hipótesis del tema, definiendo materiales, pasos y posibles resultados.",
          subjects: ["ciencias", "fisica", "quimica", "biologia"]
        },
        {
          text: "Escribir un cuento, poema o texto creativo donde se integren conceptos del tema (por ejemplo, personificación de partículas, relato histórico desde la perspectiva de un personaje, experiencia en una competencia deportiva).",
          subjects: ["espanol", "ciencias", "sociales", "ed_fisica"]
        },
        {
          text: "Diseñar un juego de mesa o digital que evalúe contenidos de la unidad (preguntas, retos, tarjetas).",
          subjects: ["informatica", "matematicas", "ciencias", "sociales", "espanol"]
        },
        {
          text: "Componer o adaptar una canción, rap o jingle que recoja los conceptos centrales del tema.",
          subjects: ["musica", "espanol", "ingles_conv", "frances"]
        },
        {
          text: "Crear una maqueta, modelo 3D o prototipo funcional que represente un sistema (por ejemplo, sistema solar, estructura de la célula, maqueta urbana).",
          subjects: ["ciencias", "fisica", "biologia", "artes", "artes_industriales"]
        },
        {
          text: "Diseñar un folleto informativo o infografía digital para explicar un tema a la comunidad educativa.",
          subjects: ["espanol", "informatica", "ciencias", "sociales", "civica"]
        },
        {
          text: "Crear un pequeño programa o animación en informática que permita visualizar un proceso matemático o físico (por ejemplo, movimiento uniforme, crecimiento de una función).",
          subjects: ["informatica", "matematicas", "fisica"]
        },
        {
          text: "Diseñar una coreografía grupal o rutina de ejercicios que integre diferentes tipos de movimiento (fuerza, resistencia, coordinación) con música seleccionada por el grupo.",
          subjects: ["ed_fisica", "musica", "artes"]
        }
      ]
    },
    {
      id: "evaluar",
      label: "Evaluar / Metacognición (Bloom VI / Marzano)",
      description: "Actividades para valorar, justificar, autoevaluar y tomar conciencia del propio aprendizaje.",
      ideas: [
        {
          text: "Completar una rúbrica de autoevaluación donde el estudiante valore su propio desempeño en el trabajo realizado, con espacio para compromisos de mejora.",
          subjects: ["all"]
        },
        {
          text: "Escribir un breve texto argumentativo justificando la solución elegida para un problema o la postura adoptada ante un caso.",
          subjects: ["espanol", "sociales", "filo_psico", "civica"]
        },
        {
          text: "Realizar co-evaluación en parejas utilizando una lista sencilla de criterios previamente acordados (claridad, orden, creatividad, uso del tiempo, trabajo en equipo).",
          subjects: ["all", "ed_fisica"]
        },
        {
          text: "Mantener un diario de aprendizaje donde el estudiante registre qué aprendió, qué le costó y qué estrategias le funcionaron mejor.",
          subjects: ["espanol", "filo_psico", "religion"]
        },
        {
          text: "Debate estructurado sobre un tema polémico donde cada estudiante debe fundamentar su posición con argumentos basados en los contenidos vistos.",
          subjects: ["sociales", "civica", "filo_psico", "religion"]
        },
        {
          text: "Autoevaluar una presentación oral (en español o en otro idioma) usando una rúbrica sencilla y escribir una reflexión sobre los aspectos por mejorar.",
          subjects: ["espanol", "ingles_conv", "frances"]
        },
        {
          text: "Revisar un producto artístico (dibujo, pieza musical, maqueta) a partir de criterios de calidad definidos en conjunto, y proponer ajustes para una segunda versión.",
          subjects: ["artes", "musica", "artes_plasticas", "artes_industriales"]
        },
        {
          text: "Evaluar el impacto de una decisión o política histórica en estudios sociales, argumentando alternativas posibles y sus efectos.",
          subjects: ["sociales", "civica", "filo_psico"]
        },
        {
          text: "Reflexionar sobre la relación entre ciencia y ética (uso de recursos naturales, experimentación, tecnología) y escribir una posición personal fundamentada.",
          subjects: ["ciencias", "sociales", "filo_psico", "religion"]
        },
        {
          text: "Elaborar una lista de metas de aprendizaje personales para la siguiente unidad, vinculando fortalezas y debilidades identificadas, incluyendo hábitos de actividad física y autocuidado.",
          subjects: ["all", "ed_fisica"]
        }
      ]
    }
  ];

  /* ============================================================
     Utilidad: desglosar un indicador con varias acciones
     en criterios "atómicos" separados.
     ============================================================ */
  function splitIntoAtomicCriteria(text) {
    if (!text) return [];
    let t = String(text).replace(/\s+/g, " ").trim();
    if (!t) return [];

    // Partimos por . o ; seguidos de espacio (simple pero funcional)
    const rawPieces = t.split(/[.;]\s+/);
    const out = [];

    rawPieces.forEach((piece) => {
      const p = piece.trim();
      if (!p) return;
      let final = p;
      if (!/[.!?]$/.test(final)) {
        final += ".";
      }
      out.push(final);
    });

    return out;
  }

  /* ============================================================
     Fábrica de filas de criterio
     ============================================================ */
  function createCriterionRow(data = {}) {
    const row = document.createElement("div");
    row.className = "criterion-row";
    row.innerHTML = `
      <input type="text" class="criterio" placeholder="Criterio de aprendizaje" value="${data.criterio || ""}">
      <div class="niveles">
        <textarea placeholder="Nivel 4" class="nivel nivel-4">${data.nivel4 || ""}</textarea>
        <textarea placeholder="Nivel 3" class="nivel nivel-3">${data.nivel3 || ""}</textarea>
        <textarea placeholder="Nivel 2" class="nivel nivel-2">${data.nivel2 || ""}</textarea>
        <textarea placeholder="Nivel 1" class="nivel nivel-1">${data.nivel1 || ""}</textarea>
      </div>
      <button class="delete-criterion" title="Eliminar">🗑️</button>
    `;
    row.querySelector(".delete-criterion").addEventListener("click", () => row.remove());
    return row;
  }

  function gatherRubricData() {
    const data = [];
    document.querySelectorAll(".criterion-row").forEach((row) => {
      data.push({
        criterio: row.querySelector(".criterio")?.value || "",
        nivel4:   row.querySelector(".nivel-4")?.value || "",
        nivel3:   row.querySelector(".nivel-3")?.value || "",
        nivel2:   row.querySelector(".nivel-2")?.value || "",
        nivel1:   row.querySelector(".nivel-1")?.value || ""
      });
    });
    return data;
  }

  /* ============================================================
     Importar criterios desde planeamiento didáctico (snapshot)
     ============================================================ */
  function importCriteriaFromPlanner() {
    if (!criteriaList) return;

    let raw;
    try {
      raw = localStorage.getItem(RUBRIC_TRANSFER_KEY);
    } catch (e) {
      alert("No se pudo acceder al almacenamiento local para importar desde el planeamiento.");
      return;
    }

    if (!raw) {
      alert(
        "No se encontraron indicadores exportados desde el planeamiento didáctico.\n\n" +
        "Abre el generador de planeamientos, carga el planeamiento deseado y pulsa «Guardar» antes de intentar importar."
      );
      return;
    }

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch (e) {
      console.error("Error parseando datos de planeamiento:", e);
      alert("Los datos exportados desde el planeamiento parecen estar dañados.");
      return;
    }

    const criterios = (payload && Array.isArray(payload.criterios)) ? payload.criterios : [];
    if (!criterios.length) {
      alert("El planeamiento exportado no contiene indicadores para convertir en criterios de aprendizaje.");
      return;
    }

    const replace = confirm(
      "Se encontraron " + criterios.length + " indicadores del planeamiento didáctico.\n\n" +
      "Aceptar: reemplazar los criterios actuales por estos (desglosando acciones múltiples).\n" +
      "Cancelar: agregarlos al final de la rúbrica."
    );

    if (replace) {
      criteriaList.innerHTML = "";
    }

    // Si no reemplazamos, contamos cuántas filas ya existen para continuar numeración
    let existingCount = 0;
    if (!replace) {
      existingCount = criteriaList.querySelectorAll(".criterion-row").length;
    }
    let counter = existingCount;

    criterios.forEach((texto) => {
      const parts = splitIntoAtomicCriteria(texto);
      parts.forEach((p) => {
        counter++;
        const label = "C" + counter + ". " + p;
        const row = createCriterionRow({ criterio: label });
        criteriaList.appendChild(row);
      });
    });

    document.dispatchEvent(new Event("elma-ensure-verb-bind"));

    try {
      const syncInfo = {
        importedAt: new Date().toISOString(),
        sourceUpdatedAt: payload.updatedAt || null,
        meta: {
          docente:    payload.docente    || "",
          asignatura: payload.asignatura || "",
          tema:       payload.tema       || "",
          nivel:      payload.nivel      || ""
        }
      };
      localStorage.setItem(RUBRIC_LAST_IMPORT_KEY, JSON.stringify(syncInfo));
    } catch (e) {
      console.warn("No se pudo guardar info de sincronización de la rúbrica:", e);
    }

    let totalAtomic = counter - existingCount;
    let msg = "Se importaron " + totalAtomic + " criterios (desglosando acciones) desde el planeamiento didáctico.";
    if (payload.tema)       msg += "\n\nTema: " + payload.tema;
    if (payload.asignatura) msg += "\nAsignatura: " + payload.asignatura;
    if (payload.nivel)      msg += "\nNivel: " + payload.nivel;
    alert(msg);
  }

  /* ============================================================
     Sincronización con planeamiento (reemplazo total)
     ============================================================ */
  function syncCriteriaWithPlanner(existingPayload) {
    if (!criteriaList) return;

    let payload = existingPayload;
    if (!payload) {
      let raw;
      try {
        raw = localStorage.getItem(RUBRIC_TRANSFER_KEY);
      } catch (e) {
        alert("No se pudo acceder al almacenamiento local para sincronizar con el planeamiento.");
        return;
      }
      if (!raw) {
        alert("No se encontraron indicadores exportados desde el planeamiento didáctico.");
        return;
      }
      try {
        payload = JSON.parse(raw);
      } catch (e) {
        console.error("Error parseando datos de planeamiento en sincronización:", e);
        alert("Los datos exportados desde el planeamiento parecen estar dañados.");
        return;
      }
    }

    const criterios = (payload && Array.isArray(payload.criterios)) ? payload.criterios : [];
    if (!criterios.length) {
      alert("El planeamiento exportado no contiene indicadores para convertir en criterios de aprendizaje.");
      return;
    }

    // Reemplaza TODOS los criterios actuales por los del planeamiento, desglosando acciones
    criteriaList.innerHTML = "";
    let counter = 0;
    criterios.forEach((texto) => {
      const parts = splitIntoAtomicCriteria(texto);
      parts.forEach((p) => {
        counter++;
        const label = "C" + counter + ". " + p;
        const row = createCriterionRow({ criterio: label });
        criteriaList.appendChild(row);
      });
    });

    document.dispatchEvent(new Event("elma-ensure-verb-bind"));

    try {
      const syncInfo = {
        importedAt: new Date().toISOString(),
        sourceUpdatedAt: payload.updatedAt || null,
        meta: {
          docente:    payload.docente    || "",
          asignatura: payload.asignatura || "",
          tema:       payload.tema       || "",
          nivel:      payload.nivel      || ""
        }
      };
      localStorage.setItem(RUBRIC_LAST_IMPORT_KEY, JSON.stringify(syncInfo));
    } catch (e) {
      console.warn("No se pudo actualizar info de sincronización:", e);
    }

    let msg = "Se actualizaron " + counter + " criterios (desglosando acciones) desde el planeamiento didáctico.";
    if (payload.tema)       msg += "\n\nTema: " + payload.tema;
    if (payload.asignatura) msg += "\nAsignatura: " + payload.asignatura;
    if (payload.nivel)      msg += "\nNivel: " + payload.nivel;
    alert(msg);
  }

  function checkPlannerSyncStatus() {
    if (!criteriaList) return;

    let rawTransfer, rawLast;
    try {
      rawTransfer = localStorage.getItem(RUBRIC_TRANSFER_KEY);
      rawLast     = localStorage.getItem(RUBRIC_LAST_IMPORT_KEY);
    } catch (e) {
      return;
    }

    if (!rawTransfer || !rawLast) return;

    let payload, last;
    try {
      payload = JSON.parse(rawTransfer);
      last    = JSON.parse(rawLast);
    } catch (e) {
      return;
    }

    if (!payload || !payload.updatedAt || !last || !last.sourceUpdatedAt) return;

    if (payload.updatedAt === last.sourceUpdatedAt) return;

    if (document.getElementById("planner-sync-banner")) return;

    const banner = document.createElement("div");
    banner.id = "planner-sync-banner";
    banner.style.fontSize = "0.9rem";
    banner.style.padding = "0.5rem 0.75rem";
    banner.style.marginBottom = "0.5rem";
    banner.style.border = "1px solid #ccc";
    banner.style.borderRadius = "6px";
    banner.style.background = "#fffbe6";
    banner.style.display = "flex";
    banner.style.alignItems = "center";
    banner.style.justifyContent = "space-between";
    banner.style.gap = "0.75rem";

    const text = document.createElement("span");
    text.textContent = "El planeamiento didáctico fue modificado después de la última importación de criterios.";

    const btnSync = document.createElement("button");
    btnSync.type = "button";
    btnSync.textContent = "Actualizar criterios";
    btnSync.style.fontSize = "0.85rem";

    const btnClose = document.createElement("button");
    btnClose.type = "button";
    btnClose.textContent = "Cerrar";
    btnClose.style.fontSize = "0.8rem";

    btnSync.addEventListener("click", () => {
      syncCriteriaWithPlanner(payload);
      banner.remove();
    });
    btnClose.addEventListener("click", () => {
      banner.remove();
    });

    const rightBox = document.createElement("div");
    rightBox.style.display = "flex";
    rightBox.style.gap = "0.5rem";
    rightBox.appendChild(btnSync);
    rightBox.appendChild(btnClose);

    banner.appendChild(text);
    banner.appendChild(rightBox);

    const parent = criteriaList.parentElement || document.body;
    parent.insertBefore(banner, parent.firstChild);
  }

  /* ============================================================
     Vista previa de rúbrica
     ============================================================ */
  function renderPreview() {
    if (!previewContainer) {
      alert("No se encontró el área de vista previa (#preview-area).");
      return;
    }
    const admin = JSON.parse(localStorage.getItem("adminData") || "{}");

    const header = `
      <div class="rubric-header">
        <h2>Escuela Liceo María Auxiliadora de San José</h2>
        <h3>Ministerio de Educación Pública - Costa Rica</h3>
        <table class="admin-table">
          <tr>
            <td><strong>Docente:</strong> ${admin.docente || ""}</td>
            <td><strong>Asignatura:</strong> ${admin.asignatura || ""}</td>
            <td><strong>Nivel:</strong> ${admin.nivel || ""}</td>
          </tr>
          <tr>
            <td><strong>Período:</strong> ${admin.periodo || ""}</td>
            <td><strong>Tema:</strong> ${admin.tema || ""}</td>
            <td><strong>Fecha:</strong> ${admin.fecha || ""}</td>
          </tr>
          <tr>
            <td colspan="3"><strong>Número de Proceso Administrativo:</strong> ${admin.numero || ""}</td>
          </tr>
        </table>
      </div>
    `;

    let body = `
      <table class="rubric-table">
        <thead>
          <tr>
            <th>Criterio</th>
            <th>Nivel 4</th>
            <th>Nivel 3</th>
            <th>Nivel 2</th>
            <th>Nivel 1</th>
          </tr>
        </thead>
        <tbody>
    `;

    const rows = gatherRubricData();
    rows.forEach((c) => {
      body += `
        <tr>
          <td>${c.criterio}</td>
          <td>${c.nivel4}</td>
          <td>${c.nivel3}</td>
          <td>${c.nivel2}</td>
          <td>${c.nivel1}</td>
        </tr>`;
    });

    body += "</tbody></table>";
    previewContainer.innerHTML = header + body;
    previewContainer.classList.remove("hidden");
  }

  /* ============================================================
     Banco de rúbricas
     ============================================================ */
  function refreshBankList() {
    if (!bankList) return;
    const bank = JSON.parse(localStorage.getItem("rubricBankStore") || "[]");
    bankList.innerHTML = "";
    if (!bank.length) {
      bankList.innerHTML = `<li class="muted">No hay rúbricas guardadas.</li>`;
      return;
    }
    bank.forEach((item, idx) => {
      const li = document.createElement("li");
      li.innerHTML = `<label><input type="radio" name="bankPick" value="${idx}"> ${item.name || ("Rúbrica " + (idx+1))}</label>`;
      bankList.appendChild(li);
    });
  }

  function saveToBank() {
    const name = prompt("Nombre para esta rúbrica en banco:", "Rúbrica sin nombre");
    const data = gatherRubricData();
    const store = JSON.parse(localStorage.getItem("rubricBankStore") || "[]");
    store.push({ name, data, ts: Date.now() });
    localStorage.setItem("rubricBankStore", JSON.stringify(store));
    refreshBankList();
    alert("✅ Rúbrica guardada en banco local.");
  }

  function loadFromBank() {
    const radios = document.querySelectorAll('input[name="bankPick"]');
    let pick = -1;
    radios.forEach((r) => { if (r.checked) pick = parseInt(r.value,10); });
    const store = JSON.parse(localStorage.getItem("rubricBankStore") || "[]");
    if (pick < 0 || pick >= store.length) {
      alert("Seleccione una rúbrica del listado.");
      return;
    }
    const sel = store[pick].data || [];
    criteriaList.innerHTML = "";
    sel.forEach(c => criteriaList.appendChild(createCriterionRow(c)));
    document.dispatchEvent(new Event("elma-ensure-verb-bind"));
    alert("✅ Rúbrica cargada desde banco local.");
  }

  // Importar / Exportar banco (JSON)
  const importInput   = document.getElementById("import-bank");
  const exportBankBtn = document.getElementById("export-bank");

  function exportBankJSON() {
    const store = localStorage.getItem("rubricBankStore") || "[]";
    const blob = new Blob([store], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "rubric_bank.json";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleImportBank(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const arr = JSON.parse(reader.result);
        if (!Array.isArray(arr)) throw new Error("Formato inválido");
        localStorage.setItem("rubricBankStore", JSON.stringify(arr));
        refreshBankList();
        alert("✅ Banco importado.");
      } catch (err) {
        alert("⚠️ JSON inválido.");
      }
    };
    reader.readAsText(file);
  }

  /* ============================================================
     Banco de ideas de mediación: panel flotante
     ============================================================ */
  function renderStrategyList(levelId, subjectId, container) {
    container.innerHTML = "";

    STRATEGY_BANK.forEach(cat => {
      if (levelId !== "all" && cat.id !== levelId) return;

      const block = document.createElement("div");
      block.style.marginBottom = "0.75rem";

      const h4 = document.createElement("h4");
      h4.textContent = cat.label;
      h4.style.margin = "0 0 0.25rem 0";

      const desc = document.createElement("p");
      desc.textContent = cat.description;
      desc.style.margin = "0 0 0.25rem 0";
      desc.style.fontSize = "0.8rem";

      const ul = document.createElement("ul");
      ul.style.margin = "0 0 0 1.25rem";
      ul.style.padding = "0";

      let countForCat = 0;

      cat.ideas.forEach(idea => {
        const subs = idea.subjects || ["all"];
        const matchesSubject =
          subjectId === "all" ||
          subs.includes("all") ||
          subs.includes(subjectId);

        if (!matchesSubject) return;

        countForCat++;

        const li = document.createElement("li");
        li.style.marginBottom = "0.25rem";

        const span = document.createElement("span");
        span.textContent = idea.text;
        span.style.cursor = "pointer";

        span.addEventListener("click", () => {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(idea.text)
              .then(() => {
                alert(
                  "La estrategia se ha copiado al portapapeles.\n\n" +
                  "Puedes pegarla en la mediación, en el criterio o al redactar el indicador."
                );
              })
              .catch(() => {
                alert("Estrategia sugerida:\n\n" + idea.text);
              });
          } else {
            alert("Estrategia sugerida:\n\n" + idea.text);
          }
        });

        li.appendChild(span);
        ul.appendChild(li);
      });

      if (countForCat > 0) {
        block.appendChild(h4);
        block.appendChild(desc);
        block.appendChild(ul);
        container.appendChild(block);
      }
    });

    if (!container.innerHTML.trim()) {
      container.innerHTML = "<p style='font-size:0.8rem;'>No hay ideas específicas para esta combinación de nivel y materia. Prueba con «Todas las materias».</p>";
    }
  }

  function ensureStrategyPanel() {
    let panel = document.getElementById("strategy-bank-panel");
    if (panel) return panel;

    panel = document.createElement("div");
    panel.id = "strategy-bank-panel";
    panel.style.position = "fixed";
    panel.style.right = "1rem";
    panel.style.bottom = "1rem";
    panel.style.width = "360px";
    panel.style.maxHeight = "70vh";
    panel.style.overflowY = "auto";
    panel.style.background = "#ffffff";
    panel.style.border = "1px solid #ccc";
    panel.style.borderRadius = "8px";
    panel.style.padding = "0.75rem";
    panel.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
    panel.style.fontSize = "0.85rem";
    panel.style.zIndex = "9999";

    const title = document.createElement("h3");
    title.textContent = "Banco de ideas de mediación";
    title.style.margin = "0 0 0.25rem 0";
    title.style.fontSize = "1rem";

    const intro = document.createElement("p");
    intro.style.margin = "0 0 0.5rem 0";
    intro.innerHTML =
      "Ideas para responder a: <br>" +
      "<strong>¿Qué quiero que aprendan?</strong> (criterio) · " +
      "<strong>¿Cómo quiero que lo aprendan?</strong> (mediación).<br>" +
      "La estrategia objetiva y medible la define cada docente en el indicador.";

    const levelLabel = document.createElement("label");
    levelLabel.textContent = "Filtrar por nivel cognitivo: ";
    levelLabel.style.display = "block";
    levelLabel.style.marginBottom = "0.25rem";

    const levelSelect = document.createElement("select");
    levelSelect.id = "strategy-bank-level";
    levelSelect.style.width = "100%";
    levelSelect.style.marginBottom = "0.5rem";

    const optAllLevel = document.createElement("option");
    optAllLevel.value = "all";
    optAllLevel.textContent = "Todos los niveles";
    levelSelect.appendChild(optAllLevel);

    STRATEGY_BANK.forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = cat.label;
      levelSelect.appendChild(opt);
    });

    const subjectLabel = document.createElement("label");
    subjectLabel.textContent = "Filtrar por materia / área: ";
    subjectLabel.style.display = "block";
    subjectLabel.style.marginBottom = "0.25rem";
    subjectLabel.style.marginTop = "0.25rem";

    const subjectSelect = document.createElement("select");
    subjectSelect.id = "strategy-bank-subject";
    subjectSelect.style.width = "100%";
    subjectSelect.style.marginBottom = "0.5rem";

    SUBJECT_FILTER.forEach(sf => {
      const opt = document.createElement("option");
      opt.value = sf.id;
      opt.textContent = sf.label;
      subjectSelect.appendChild(opt);
    });

    const listContainer = document.createElement("div");
    listContainer.id = "strategy-bank-list";

    const footer = document.createElement("div");
    footer.style.display = "flex";
    footer.style.justifyContent = "flex-end";
    footer.style.marginTop = "0.5rem";
    footer.style.gap = "0.5rem";

    const resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.textContent = "Reiniciar filtros";
    resetBtn.style.fontSize = "0.8rem";

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.textContent = "Cerrar";
    closeBtn.style.fontSize = "0.8rem";

    closeBtn.addEventListener("click", () => {
      panel.style.display = "none";
    });

    resetBtn.addEventListener("click", () => {
      levelSelect.value = "all";
      subjectSelect.value = "all";
      renderStrategyList("all", "all", listContainer);
    });

    footer.appendChild(resetBtn);
    footer.appendChild(closeBtn);

    levelLabel.appendChild(levelSelect);
    subjectLabel.appendChild(subjectSelect);
    panel.appendChild(title);
    panel.appendChild(intro);
    panel.appendChild(levelLabel);
    panel.appendChild(subjectLabel);
    panel.appendChild(listContainer);
    panel.appendChild(footer);

    document.body.appendChild(panel);

    function updateList() {
      renderStrategyList(levelSelect.value, subjectSelect.value, listContainer);
    }

    levelSelect.addEventListener("change", updateList);
    subjectSelect.addEventListener("change", updateList);

    renderStrategyList("all", "all", listContainer);

    return panel;
  }

  function openStrategyBank() {
    const panel = ensureStrategyPanel();
    panel.style.display = "block";
  }

  /* ============================================================
     Eventos
     ============================================================ */
  if (addCriterionBtn) addCriterionBtn.addEventListener("click", () => {
    criteriaList.appendChild(createCriterionRow());
    document.dispatchEvent(new Event("elma-ensure-verb-bind"));
  });

  let importFromPlannerBtn = document.getElementById("import-from-planeamiento");
  if (!importFromPlannerBtn && addCriterionBtn && addCriterionBtn.parentElement) {
    importFromPlannerBtn = document.createElement("button");
    importFromPlannerBtn.type = "button";
    importFromPlannerBtn.id = "import-from-planeamiento";
    importFromPlannerBtn.textContent = "Importar desde planeamiento";
    importFromPlannerBtn.className = addCriterionBtn.className || "";
    addCriterionBtn.parentElement.insertBefore(importFromPlannerBtn, addCriterionBtn.nextSibling);
  }
  if (importFromPlannerBtn) {
    importFromPlannerBtn.addEventListener("click", importCriteriaFromPlanner);
  }

  let strategyBankBtn = document.getElementById("open-strategy-bank");
  if (!strategyBankBtn && addCriterionBtn && addCriterionBtn.parentElement) {
    strategyBankBtn = document.createElement("button");
    strategyBankBtn.type = "button";
    strategyBankBtn.id = "open-strategy-bank";
    strategyBankBtn.textContent = "Banco de ideas";
    strategyBankBtn.className = addCriterionBtn.className || "";
    addCriterionBtn.parentElement.insertBefore(
      strategyBankBtn,
      importFromPlannerBtn ? importFromPlannerBtn.nextSibling : addCriterionBtn.nextSibling
    );
  }
  if (strategyBankBtn) {
    strategyBankBtn.addEventListener("click", openStrategyBank);
  }

  if (previewBtn)    previewBtn.addEventListener("click", renderPreview);
  if (saveBankBtn)   saveBankBtn.addEventListener("click", saveToBank);
  if (loadBankBtn)   loadBankBtn.addEventListener("click", loadFromBank);
  if (importInput)   importInput.addEventListener("change", handleImportBank);
  if (exportBankBtn) exportBankBtn.addEventListener("click", exportBankJSON);

  document.addEventListener("DOMContentLoaded", () => {
    refreshBankList();
    checkPlannerSyncStatus();
  });
})();
