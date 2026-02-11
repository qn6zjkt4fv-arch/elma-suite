// app.js — bienvenida + modos + acciones principales + selector de planes guardados (header)
(function () {
  const Engine = window.PlannerEngine;

  let currentMode = "didactico"; // "didactico" | "academico"

  const statusCard = () => document.getElementById("status-card");
  const welcomeCard = () => document.getElementById("welcome-card");
  const modeSwitch = () => document.getElementById("mode-switch");
  const didSection = () => document.getElementById("didactico-section");
  const acadSection = () => document.getElementById("acad-section");

  function setStatus(msg, ok = true) {
    const el = statusCard();
    if (!el) return;
    el.textContent = msg || "";
    el.style.borderLeft = msg
      ? (ok ? "6px solid #0e7be7" : "6px solid #d33c3c")
      : "6px solid transparent";
  }

  function showWelcome() {
    if (welcomeCard()) welcomeCard().style.display = "block";
    if (modeSwitch()) modeSwitch().style.display = "none";
    if (didSection()) didSection().style.display = "none";
    if (acadSection()) acadSection().style.display = "none";
  }

  function switchMode(mode) {
    currentMode = mode;

    document.querySelectorAll(".mode-btn").forEach(b => {
      b.classList.toggle("active", b.dataset.mode === mode);
    });

    const isDid = mode === "didactico";

    if (welcomeCard()) welcomeCard().style.display = "none";
    if (modeSwitch()) modeSwitch().style.display = "flex";
    if (didSection()) didSection().style.display = isDid ? "block" : "none";
    if (acadSection()) acadSection().style.display = isDid ? "none" : "block";

    if (isDid && Engine && Engine.syncAdminFromAcademicoToDidactico) {
      Engine.syncAdminFromAcademicoToDidactico();
    }

    setStatus(
      isDid
        ? "Modo: Planeamiento didáctico."
        : "Modo: Planeamiento académico."
    );
  }

  function startDidactico() { switchMode("didactico"); }
  function startAcademico() { switchMode("academico"); }

  function newPlan() {
    const st = Engine.defaultState();

    Engine.writeAcademicoToDOM(st.academico);
    Engine.clearAcadRows();
    Engine.addAcadRow();

    Engine.writeDidacticoToDOM(st.didactico);
    Engine.clearDidRows();
    Engine.addDidRow();

// Mueve los listeners AQUÍ, después de renderizar las tablas
const attachTableListeners = () => {
  const btnAddAcad = document.getElementById("acad-add-row");
  const btnClearAcad = document.getElementById("acad-clear-rows");
  if (btnAddAcad) {
    btnAddAcad.onclick = () => Engine.addAcadRow();
    console.log("Listener adjuntado a acad-add-row"); // Para debug
  }
  if (btnClearAcad) {
    btnClearAcad.onclick = Engine.clearAcadRows;
    console.log("Listener adjuntado a acad-clear-rows");
  }

  const btnAddDid = document.getElementById("did-add-row");
  const btnClearDid = document.getElementById("did-clear-rows");
  if (btnAddDid) {
    btnAddDid.onclick = () => Engine.addDidRow();
    console.log("Listener adjuntado a did-add-row");
  }
  if (btnClearDid) {
    btnClearDid.onclick = Engine.clearDidRows;
    console.log("Listener adjuntado a did-clear-rows");
  }
};

// Llama después del render inicial
attachTableListeners();

// Y si cambias de modo, vuelve a adjuntar (por si las secciones se ocultan/muestran)
const originalSwitchMode = switchMode;
switchMode = (mode) => {
  originalSwitchMode(mode);
  setTimeout(attachTableListeners, 100); // Pequeño delay para que el DOM se actualice
};

    showWelcome();
    setStatus("Nuevo planeamiento iniciado. Selecciona el tipo para comenzar.");
  }

  // ─────────────────────────────────────────
  // Guardado (local + con nombre) / Carga
  // ─────────────────────────────────────────
    async function saveAll() {
  const useNamed = confirm("¿Deseas guardar este planeamiento con un nombre (para manejar varios)?");
  let name = '';
  if (useNamed && Engine.savePlanWithName) {
    name = prompt("Nombre del planeamiento (ej: 'Química 10° - I Semestre'):");
    if (name && name.trim()) {
      name = name.trim();
      const res = Engine.savePlanWithName(name, currentMode);
      if (!res) {
        setStatus("No se pudo guardar con nombre. Se utilizará el guardado simple.", false);
      }
    } else {
      return; // Si no hay nombre, sale
    }
  }

  const state = Engine.saveAll(currentMode); // Guardado local (cache)
  const errs = [
    ...Engine.validateAcademico(state.academico),
    ...Engine.validateDidactico(state.didactico)
  ];

  let statusMsg = "Planeamiento guardado localmente.";
  if (errs.length) {
    statusMsg = "Guardado con observaciones: " + errs.join(" | ");
    setStatus(statusMsg, false);
  } else {
    setStatus(statusMsg);
  }

  try { fillPlanPicker(); } catch {}

  // Archivado en carpeta (nuevo flujo)
  const dirHandle = await getArchiveDirectory();
  const filename = name ? `${name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.json` : `planeamiento_${new Date().toISOString().slice(0,10)}.json`;

  if (dirHandle) {
    try {
      const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(state, null, 2));
      await writable.close();
      setStatus(`${statusMsg} | Guardado en carpeta seleccionada: ${filename}`, !errs.length);
    } catch (err) {
      console.error('Error guardando en carpeta:', err);
      downloadAsJSON(state, filename); // Fallback
      setStatus(`${statusMsg} | Guardado como descarga (ver Descargas)`, !errs.length);
    }
  } else {
    downloadAsJSON(state, filename); // Fallback si no hay API o denegado
    setStatus(`${statusMsg} | Descargado a tu carpeta de Descargas`, !errs.length);
  }
}
  // ─────────────────────────────────────────
  // Picker del header
  // ─────────────────────────────────────────
  function fillPlanPicker() {
    const sel = document.getElementById("plan-picker");
    if (!sel || !Engine || !Engine.getPlanNames) return;
    const names = Engine.getPlanNames() || [];
    const selected = sel.value;

    sel.innerHTML = "";
    const opt0 = document.createElement("option");
    opt0.value = "";
    opt0.textContent = "— Selecciona un planeamiento guardado —";
    sel.appendChild(opt0);

    names.forEach(n => {
      const opt = document.createElement("option");
      opt.value = n;
      opt.textContent = n;
      sel.appendChild(opt);
    });

    sel.value = (selected && names.includes(selected)) ? selected : "";
  }

  function openSelectedPlan() {
    const sel = document.getElementById("plan-picker");
    if (!sel) return;
    const name = sel.value && sel.value.trim();
    if (!name) {
      alert("Selecciona un planeamiento de la lista.");
      return;
    }
    const plan = Engine.getPlanByName ? Engine.getPlanByName(name) : null;
    if (!plan) {
      alert("No se encontró el planeamiento seleccionado.");
      fillPlanPicker();
      return;
    }

    if (plan.academico) Engine.writeAcademicoToDOM(plan.academico);
    if (plan.didactico) Engine.writeDidacticoToDOM(plan.didactico);
    showWelcome();
    currentMode = (plan.mode === "academico" || plan.mode === "didactico") ? plan.mode : currentMode;
    setStatus(`Planeamiento "${name}" cargado. Selecciona el modo para continuar.`);
  }

  // ─────────────────────────────────────────
  // Exportador
  // ─────────────────────────────────────────
  function getExporter() {
    const exp = window.PlaneamientoExporter;
    if (!exp) {
      alert("No se encontró el módulo de exportación. Asegúrate de que 'exporter.js' se cargue antes de 'app.js'.");
      console.error("PlaneamientoExporter no disponible en window.");
      return null;
    }
    return exp;
  }

  function handlePreview() {
    const exp = getExporter();
    if (exp && exp.preview) exp.preview(currentMode);
  }

  function handleExportWord() {
    const exp = getExporter();
    if (exp && exp.exportWord) exp.exportWord(currentMode);
  }

  function handlePrint() {
    const exp = getExporter();
    if (exp && exp.exportPrint) exp.exportPrint(currentMode);
  }

  // ─────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────
  function init() {
    // bienvenida
    const btnStartDid = document.getElementById("start-did");
    const btnStartAcad = document.getElementById("start-acad");
    if (btnStartDid) btnStartDid.onclick = startDidactico;
    if (btnStartAcad) btnStartAcad.onclick = startAcademico;

    // switch modo
    document.querySelectorAll(".mode-btn").forEach(b => {
      b.addEventListener("click", () => switchMode(b.dataset.mode));
    });

    // header actions
    const btnNew = document.getElementById("btn-new");
    const btnSave = document.getElementById("btn-save");
    const btnLoad = document.getElementById("btn-load");
    const btnPrev = document.getElementById("btn-preview");
    const btnWord = document.getElementById("btn-export-word");
    const btnPrint = document.getElementById("btn-print");

    if (btnNew) btnNew.onclick = newPlan;
    if (btnSave) btnSave.onclick = saveAll;
    if (btnLoad) btnLoad.onclick = loadAll;
    if (btnPrev) btnPrev.onclick = handlePreview;
    if (btnWord) btnWord.onclick = handleExportWord;
    if (btnPrint) btnPrint.onclick = handlePrint;

    // ─────────────────────────────────────────
    // EXPORTAR INDICADORES A RÚBRICAS (FIX)
    // ─────────────────────────────────────────
    const btnExportIndicadores = document.getElementById("did-export-indicadores");
    if (btnExportIndicadores) {
      btnExportIndicadores.addEventListener("click", () => {
        try {
         const indicadores = Array.from(
 	   document.querySelectorAll("#didactico-section textarea")
	   )
  	.map(el => el.value.trim())
	.filter(txt => txt.length > 0);


          if (indicadores.length === 0) {
            alert("No hay indicadores para exportar.");
            return;
          }

          localStorage.setItem(
            "ELMA_EXPORT_INDICADORES",
            JSON.stringify(indicadores)
          );

          window.location.href =
            "../Rubricas_ELMA_Secundaria_v1_1_2/index.html";

        } catch (err) {
          console.error("Error exportando indicadores:", err);
          alert("Ocurrió un error al exportar los indicadores.");
        }
      });
    }

    // picker
    const planPicker = document.getElementById("plan-picker");
    const btnOpenPlan = document.getElementById("btn-open-plan");
    const btnRefreshPlans = document.getElementById("btn-refresh-plans");
    if (btnOpenPlan) btnOpenPlan.onclick = openSelectedPlan;
    if (btnRefreshPlans) btnRefreshPlans.onclick = fillPlanPicker;

    // AQUÍ: Agregá los listeners de las tablas
    const btnAddAcad = document.getElementById("acad-add-row");
    const btnClearAcad = document.getElementById("acad-clear-rows");
    if (btnAddAcad) btnAddAcad.onclick = () => Engine.addAcadRow();
    if (btnClearAcad) btnClearAcad.onclick = Engine.clearAcadRows;

    const btnAddDid = document.getElementById("did-add-row");
    const btnClearDid = document.getElementById("did-clear-rows");
    if (btnAddDid) btnAddDid.onclick = () => Engine.addDidRow();
    if (btnClearDid) btnClearDid.onclick = Engine.clearDidRows;

    // estado inicial
    const st = Engine.loadAll();
    if (st && (st.academico || st.didactico)) {
      if (st.academico) Engine.writeAcademicoToDOM(st.academico);
      if (st.didactico) Engine.writeDidacticoToDOM(st.didactico);
      showWelcome();
      currentMode = st.mode === "academico" ? "academico" : "didactico";
      setStatus("Datos guardados detectados. Selecciona el modo para continuar.");
    } else {
      const st0 = Engine.defaultState();
      Engine.writeAcademicoToDOM(st0.academico);
      Engine.addAcadRow();
      Engine.writeDidacticoToDOM(st0.didactico);
      Engine.addDidRow();
      showWelcome();
      setStatus("Selecciona el tipo de planeamiento que deseas crear.");
    }

    fillPlanPicker();  }

  document.addEventListener("DOMContentLoaded", init);
})();
