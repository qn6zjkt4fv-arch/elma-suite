// planner-engine.js
// Académico + Didáctico integrados
// - Sin cambios visuales
// - Exporta objetivos/contendidos con conjugación
// - Sin estrategias automáticas en export
// - Soporta múltiples planeamientos nombrados
// - Sincroniza datos administrativos Académico -> Didáctico (cuando están vacíos)

(function (global) {

  /* ===============================
     Estado base
     =============================== */

  function defaultState() {
    return {
      mode: "didactico",
      academico: {
        docente: "",
        asignatura: "",
        nivel: "",
        ciclo: 2025,
        periodicidad: "Primer Semestre",
        matriz: []
      },
      didactico: {
        docente: "",
        asignatura: "",
        tema: "",
        nivel: "",
        ciclo: 2025,
        periodo_del: "",
        periodo_al: "",
        lecciones: "",
        matriz: []
      }
    };
  }

  /* ===============================
     Utilidades de texto
     =============================== */

  // Convierte posibles verbos en infinitivo a 3a persona singular en TODA la frase.
  // Heurística simple pero segura para tu uso.
  function infinitivoATerceraPersona(frase) {
    if (!frase) return "";
    let texto = frase.trim();
    if (!texto) return "";

    return texto
      .split(/(\s+)/) // conserva espacios
      .map(token => {
        if (/^\s+$/.test(token)) return token;

        const m = token.match(/^([()«»"“”¿¡]*)(.*?)([.,;:!?()«»"“”]*)$/);
        const prefix = m ? m[1] : "";
        let base = m ? m[2] : token;
        const suffix = m ? m[3] : "";

        const lower = base.toLowerCase();
        const esVerbo =
          /^[A-Za-zÁÉÍÓÚÜáéíóúüñÑ]+$/.test(base) &&
          lower.length >= 5 &&
          (lower.endsWith("ar") || lower.endsWith("er") || lower.endsWith("ir"));

        if (esVerbo) {
          const raiz = base.slice(0, -2);
          const term = lower.endsWith("ar") ? "a" : "e";
          base = raiz + term; // terminación siempre minúscula
        }

        return prefix + base + suffix;
      })
      .join("")
      .replace(/\s+/g, " ")
      .trim();
  }

  /* ===============================
     Empuje hacia DIDÁCTICO
     =============================== */

  // Intenta unir AE + indicador en una misma fila, sin estrategias automáticas.
  function empujarADidactico({ ae, indicador }) {
    const body = document.getElementById("did-matriz-body");
    if (!body) return;

    const filas = Array.from(body.querySelectorAll("tr"));

    if (filas.length > 0) {
      const last = filas[filas.length - 1];
      const aeField = last.querySelector('textarea[name="did-ae"]');
      const indField = last.querySelector('textarea[name="did-indicadores"]');

      const tieneAE = aeField && aeField.value.trim() !== "";
      const tieneInd = indField && indField.value.trim() !== "";

      if (!tieneAE && !tieneInd) {
        if (ae) aeField.value = ae;
        if (indicador) indField.value = indicador;
        return;
      }

      if (tieneAE && !tieneInd && indicador) {
        indField.value = indicador;
        return;
      }

      if (!tieneAE && tieneInd && ae) {
        aeField.value = ae;
        return;
      }
    }

    // Si no hay fila "compatible", creamos una nueva con ambos campos
    addDidRow({
      ae: ae || "",
      estrategias: "",
      indicadores: indicador || ""
    });
  }

  function switchToDidacticoUI() {
    const btn = document.querySelector('.mode-btn[data-mode="didactico"]');
    if (btn) btn.click();
  }

  /* ===============================
     LECTURA / ESCRITURA ACADÉMICO
     =============================== */

  function readAcademicoFromDOM() {
    const filas = Array.from(document.querySelectorAll("#acad-matriz-body tr"));
    const matriz = filas.map(tr => ({
      unidad: (tr.querySelector('textarea[name="acad-unidad"]') || {}).value?.trim() || "",
      obj_gen: (tr.querySelector('textarea[name="acad-obj-gen"]') || {}).value?.trim() || "",
      obj_esp: (tr.querySelector('textarea[name="acad-obj-esp"]') || {}).value?.trim() || "",
      contenidos: (tr.querySelector('textarea[name="acad-contenidos"]') || {}).value?.trim() || "",
      estrategias: (tr.querySelector('textarea[name="acad-estrategias"]') || {}).value?.trim() || "",
      tiempo: (tr.querySelector('input[name="acad-tiempo"]') || {}).value?.trim() || ""
    }));

    return {
      docente: (document.getElementById("acad-docente") || {}).value?.trim() || "",
      asignatura: (document.getElementById("acad-asignatura") || {}).value?.trim() || "",
      nivel: (document.getElementById("acad-nivel") || {}).value?.trim() || "",
      ciclo: parseInt((document.getElementById("acad-ciclo") || { value: 2025 }).value, 10) || 2025,
      periodicidad: (document.getElementById("acad-periodicidad") || {}).value || "Primer Semestre",
      matriz
    };
  }

  function writeAcademicoToDOM(ac) {
    (document.getElementById("acad-docente") || {}).value = ac.docente || "";
    (document.getElementById("acad-asignatura") || {}).value = ac.asignatura || "";
    (document.getElementById("acad-nivel") || {}).value = ac.nivel || "";
    (document.getElementById("acad-ciclo") || {}).value = ac.ciclo || 2025;
    (document.getElementById("acad-periodicidad") || {}).value = ac.periodicidad || "Primer Semestre";

    const body = document.getElementById("acad-matriz-body");
    if (!body) return;
    body.innerHTML = "";
    (ac.matriz || []).forEach(row => addAcadRow(row));
  }

  function validateAcademico(ac) {
    const e = [];
    if (!ac.docente) e.push("Académico: nombre del docente.");
    if (!ac.asignatura) e.push("Académico: asignatura.");
    if (!ac.nivel) e.push("Académico: nivel.");
    if (!ac.periodicidad) e.push("Académico: periodicidad.");
    return e;
  }

  function addAcadRow(data) {
    const body = document.getElementById("acad-matriz-body");
    if (!body) return;

    const row = data || {
      unidad: "",
      obj_gen: "",
      obj_esp: "",
      contenidos: "",
      estrategias: "",
      tiempo: ""
    };

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><textarea name="acad-unidad" rows="2" placeholder="Nombre de la unidad...">${row.unidad || ""}</textarea></td>
      <td><textarea name="acad-obj-gen" rows="2" placeholder="Objetivo general de la unidad...">${row.obj_gen || ""}</textarea></td>
      <td><textarea name="acad-obj-esp" rows="2" placeholder="Objetivo específico...">${row.obj_esp || ""}</textarea></td>
      <td><textarea name="acad-contenidos" rows="2" placeholder="Contenidos...">${row.contenidos || ""}</textarea></td>
      <td><textarea name="acad-estrategias" rows="2" placeholder="Estrategias de mediación...">${row.estrategias || ""}</textarea></td>
      <td><input name="acad-tiempo" type="text" placeholder="Ej. 4 semanas" value="${row.tiempo || ""}"/></td>
      <td class="row-actions">
        <button type="button" class="btn-clone-unit">+ Obj. esp.</button>
        <button type="button" class="btn-ae">Contenido → AE</button>
        <button type="button" class="btn-crit">Obj. esp. → Criterio</button>
        <button type="button" class="btn-up">▲</button>
        <button type="button" class="btn-down">▼</button>
        <button type="button" class="danger btn-del">X</button>
      </td>
    `;
    body.appendChild(tr);

    const btnUp = tr.querySelector(".btn-up");
    const btnDown = tr.querySelector(".btn-down");
    const btnDel = tr.querySelector(".btn-del");
    const btnClone = tr.querySelector(".btn-clone-unit");
    const btnAE = tr.querySelector(".btn-ae");
    const btnCrit = tr.querySelector(".btn-crit");

    btnUp.onclick = () => {
      if (tr.previousElementSibling)
        tr.parentNode.insertBefore(tr, tr.previousElementSibling);
    };

    btnDown.onclick = () => {
      if (tr.nextElementSibling)
        tr.parentNode.insertBefore(tr.nextElementSibling, tr);
    };

    btnDel.onclick = () => tr.remove();

    // Clonar Unidad + Obj. general para más objetivos específicos
    btnClone.onclick = () => {
      const unidadVal = tr.querySelector('textarea[name="acad-unidad"]').value.trim();
      const objGenVal = tr.querySelector('textarea[name="acad-obj-gen"]').value.trim();
      addAcadRow({
        unidad: unidadVal,
        obj_gen: objGenVal,
        obj_esp: "",
        contenidos: "",
        estrategias: "",
        tiempo: ""
      });
    };

    // Contenido → AE (conjugado, sin estrategias auto)
    btnAE.onclick = () => {
      const cont = tr.querySelector('textarea[name="acad-contenidos"]').value.trim();
      if (!cont) return;
      const ae = infinitivoATerceraPersona(cont);
      empujarADidactico({ ae, indicador: "" });
      switchToDidacticoUI();
    };

    // Obj. específico → Criterio (conjugado)
    btnCrit.onclick = () => {
      const obj = tr.querySelector('textarea[name="acad-obj-esp"]').value.trim();
      if (!obj) return;
      const crit = infinitivoATerceraPersona(obj);
      empujarADidactico({ ae: "", indicador: crit });
      switchToDidacticoUI();
    };
  }

  function clearAcadRows() {
    const body = document.getElementById("acad-matriz-body");
    if (body) body.innerHTML = "";
  }

  /* ===============================
     LECTURA / ESCRITURA DIDÁCTICO
     =============================== */

  function readDidacticoFromDOM() {
    const filas = Array.from(document.querySelectorAll("#did-matriz-body tr"));
    const matriz = filas.map(tr => ({
      ae: (tr.querySelector('textarea[name="did-ae"]') || {}).value?.trim() || "",
      estrategias: (tr.querySelector('textarea[name="did-estrategias"]') || {}).value?.trim() || "",
      indicadores: (tr.querySelector('textarea[name="did-indicadores"]') || {}).value?.trim() || ""
    }));

    return {
      docente: (document.getElementById("did-docente") || {}).value?.trim() || "",
      asignatura: (document.getElementById("did-asignatura") || {}).value?.trim() || "",
      tema: (document.getElementById("did-tema") || {}).value?.trim() || "",
      nivel: (document.getElementById("did-nivel") || {}).value?.trim() || "",
      ciclo: parseInt((document.getElementById("did-ciclo") || { value: 2025 }).value, 10) || 2025,
      periodo_del: (document.getElementById("did-periodo-del") || {}).value || "",
      periodo_al: (document.getElementById("did-periodo-al") || {}).value || "",
      lecciones: (document.getElementById("did-lecciones") || {}).value?.trim() || "",
      matriz
    };
  }

  function writeDidacticoToDOM(did) {
    (document.getElementById("did-docente") || {}).value = did.docente || "";
    (document.getElementById("did-asignatura") || {}).value = did.asignatura || "";
    (document.getElementById("did-tema") || {}).value = did.tema || "";
    (document.getElementById("did-nivel") || {}).value = did.nivel || "";
    (document.getElementById("did-ciclo") || {}).value = did.ciclo || 2025;
    (document.getElementById("did-periodo-del") || {}).value = did.periodo_del || "";
    (document.getElementById("did-periodo-al") || {}).value = did.periodo_al || "";
    (document.getElementById("did-lecciones") || {}).value = did.lecciones || "";

    const body = document.getElementById("did-matriz-body");
    if (!body) return;
    body.innerHTML = "";
    (did.matriz || []).forEach(row => addDidRow(row));
  }

  function validateDidactico(did) {
    const e = [];
    if (!did.docente) e.push("Didáctico: nombre del docente.");
    if (!did.asignatura) e.push("Didáctico: asignatura.");
    if (!did.tema) e.push("Didáctico: tema.");
    if (!did.nivel) e.push("Didáctico: nivel.");
    return e;
  }

  function addDidRow(data) {
    const body = document.getElementById("did-matriz-body");
    if (!body) return;

    const row = data || { ae: "", estrategias: "", indicadores: "" };

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><textarea name="did-ae" rows="2" placeholder="Aprendizajes esperados...">${row.ae || ""}</textarea></td>
      <td><textarea name="did-estrategias" rows="2" placeholder="Estrategias de mediación...">${row.estrategias || ""}</textarea></td>
      <td><textarea name="did-indicadores" rows="2" placeholder="Indicadores / criterios de aprendizaje...">${row.indicadores || ""}</textarea></td>
      <td class="row-actions">
        <button type="button" class="btn-up">▲</button>
        <button type="button" class="btn-down">▼</button>
        <button type="button" class="danger btn-del">X</button>
      </td>
    `;
    body.appendChild(tr);

    const btnUp = tr.querySelector(".btn-up");
    const btnDown = tr.querySelector(".btn-down");
    const btnDel = tr.querySelector(".btn-del");

    btnUp.onclick = () => {
      if (tr.previousElementSibling)
        tr.parentNode.insertBefore(tr, tr.previousElementSibling);
    };

    btnDown.onclick = () => {
      if (tr.nextElementSibling)
        tr.parentNode.insertBefore(tr.nextElementSibling, tr);
    };

    btnDel.onclick = () => tr.remove();
  }

  function clearDidRows() {
    const body = document.getElementById("did-matriz-body");
    if (body) body.innerHTML = "";
  }

  /* ===============================
     Sincronizar admin Acad -> Did
     =============================== */

  function syncAdminFromAcademicoToDidactico() {
    const ac = readAcademicoFromDOM();
    const did = readDidacticoFromDOM();

    const setIfEmpty = (id, value) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (!el.value || el.value.trim() === "") {
        el.value = value || "";
      }
    };

    setIfEmpty("did-docente", ac.docente);
    setIfEmpty("did-asignatura", ac.asignatura);
    setIfEmpty("did-nivel", ac.nivel);
    setIfEmpty("did-ciclo", ac.ciclo);
    // El tema, periodo, lecciones siguen siendo propios del didáctico
  }

  /* ===============================
     PERSISTENCIA
     =============================== */

  const STORAGE_KEY = "planeamiento_integrado_v1";
  const MULTI_KEY = "planeamientos_integrados_multi_v1";
  const RUBRIC_TRANSFER_KEY = "elma_rubric_transfer_v1";


  function exportIndicadoresForRubric(didactico) {
    try {
      const did = didactico || readDidacticoFromDOM();
      if (!did || !Array.isArray(did.matriz)) return null;

      const criterios = did.matriz
        .map(row => (row && row.indicadores ? String(row.indicadores).trim() : ""))
        .filter(txt => txt && txt.length > 0);

      const payload = {
        version: 1,
        source: "planeamiento-didactico",
        updatedAt: new Date().toISOString(),
        docente: did.docente || "",
        asignatura: did.asignatura || "",
        tema: did.tema || "",
        nivel: did.nivel || "",
        criterios
      };

      localStorage.setItem(RUBRIC_TRANSFER_KEY, JSON.stringify(payload));
      return payload;
    } catch (e) {
      console.error("Error exportando indicadores para rúbrica:", e);
      return null;
    }
  }

  function saveAll(currentMode) {
    const state = {
      mode: currentMode,
      academico: readAcademicoFromDOM(),
      didactico: readDidacticoFromDOM()
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      exportIndicadoresForRubric(state.didactico);
    } catch (e) {}
    return state;
  }

  function loadAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  // Guarda con nombre (multi-planeamientos)
  function savePlanWithName(name, currentMode) {
    if (!name) return;
    const state = {
      mode: currentMode,
      academico: readAcademicoFromDOM(),
      didactico: readDidacticoFromDOM()
    };
    try {
      const raw = localStorage.getItem(MULTI_KEY);
      const data = raw ? JSON.parse(raw) : {};
      data[name] = state;
      localStorage.setItem(MULTI_KEY, JSON.stringify(data));
      exportIndicadoresForRubric(state.didactico);
      return state;
    } catch (e) {
      console.error("Error guardando plan con nombre:", e);
      return null;
    }
  }

  function getPlanNames() {
    try {
      const raw = localStorage.getItem(MULTI_KEY);
      if (!raw) return [];
      const data = JSON.parse(raw);
      return Object.keys(data);
    } catch {
      return [];
    }
  }

  function getPlanByName(name) {
    try {
      const raw = localStorage.getItem(MULTI_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return data[name] || null;
    } catch {
      return null;
    }
  }

  /* ===============================
     Exponer API
     =============================== */

  global.PlannerEngine = {
    defaultState,
    // Académico
    readAcademicoFromDOM,
    writeAcademicoToDOM,
    validateAcademico,
    addAcadRow,
    clearAcadRows,
    // Didáctico
    readDidacticoFromDOM,
    writeDidacticoToDOM,
    validateDidactico,
    addDidRow,
    clearDidRows,
    // Sincronización admin
    syncAdminFromAcademicoToDidactico,
    // Persistencia simple
    saveAll,
    loadAll,
    // Persistencia múltiple
    savePlanWithName,
    getPlanNames,
    getPlanByName
  };

})(window);