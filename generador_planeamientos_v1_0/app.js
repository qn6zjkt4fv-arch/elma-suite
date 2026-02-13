// app.js — bienvenida + modos + acciones principales + selector de planes guardados (header)
document.addEventListener("DOMContentLoaded", function () {
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

    attachTableListeners(); // Adjunta listeners cada vez que cambias modo
  }

  // Función para adjuntar listeners a las tablas (con logs para debug)
  function attachTableListeners() {
    const btnAddAcad = document.getElementById("acad-add-row");
    const btnClearAcad = document.getElementById("acad-clear-rows");
    if (btnAddAcad) {
      btnAddAcad.onclick = () => Engine.addAcadRow();
      console.log("Listener adjuntado a acad-add-row");
    } else {
      console.warn("btnAddAcad no encontrado – sección académica oculta?");
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
    } else {
      console.warn("btnAddDid no encontrado – sección didáctica oculta?");
    }
    if (btnClearDid) {
      btnClearDid.onclick = Engine.clearDidRows;
      console.log("Listener adjuntado a did-clear-rows");
    }
  }

  // Guardado (local + con nombre) / Carga
  // ─────────────────────────────────────────
  function saveAll() {
    const useNamed = confirm("¿Deseas guardar este planeamiento con un nombre (para manejar varios)?");
    if (useNamed && Engine.savePlanWithName) {
      const name = prompt("Nombre del planeamiento (ej: 'Química 10° - I Semestre'):");
      if (name && name.trim()) {
        const trimmed = name.trim();
        const res = Engine.savePlanWithName(trimmed, currentMode);
        if (res) {
          setStatus(`Planeamiento guardado como: "${trimmed}".`);
          try { fillPlanPicker(); } catch {}
          return;
        } else {
          setStatus("No se pudo guardar con nombre. Se utilizará el guardado simple.", false);
        }
      }
    }
    const state = Engine.saveAll(currentMode);
    const errs = [
      ...Engine.validateAcademico(state.academico),
      ...Engine.validateDidactico(state.didactico)
    ];
    if (errs.length) {
      setStatus("Guardado con observaciones: " + errs.join(" | "), false);
    } else {
      setStatus("Planeamiento guardado localmente.");
    }
    try { fillPlanPicker(); } catch {}
  }

  function loadAll() {
    const st = Engine.loadAll();
    if (!st) {
      setStatus("No hay datos guardados.", false);
      return;
    }
    if (st.academico) Engine.writeAcademicoToDOM(st.academico);
    if (st.didactico) Engine.writeDidacticoToDOM(st.didactico);
    showWelcome();
    currentMode = st.mode === "academico" ? "academico" : "didactico";
    setStatus("Planeamiento cargado. Selecciona Académico o Didáctico para continuar.");
  }

  // Botones de modo (fix: usar .mode-btn en vez de IDs)
  document.querySelectorAll(".mode-btn").forEach(btn => {
    btn.onclick = () => switchMode(btn.dataset.mode);
  });

  // Nuevo
  const btnNew = document.getElementById("btn-new");
  if (btnNew) {
    btnNew.onclick = () => {
      console.log("Clic en nuevo llamado");
      if (confirm("¿Limpiar todo y comenzar un nuevo planeamiento?")) {
        localStorage.removeItem("ELMA_PLANEAMIENTO");
        location.reload();
      }
    };
    console.log("Listener adjuntado a btn-new");
  }

  // Guardar
  const btnSave = document.getElementById("btn-save");
  if (btnSave) {
    btnSave.onclick = saveAll;
    console.log("Listener adjuntado a btn-save");
  }

  // Cargar
  const btnLoad = document.getElementById("btn-load");
  if (btnLoad) {
    btnLoad.onclick = loadAll;
    console.log("Listener adjuntado a btn-load");
  }

  // Previsualizar (con chequeo y log)
  const btnPreview = document.getElementById("btn-preview");
  if (btnPreview) {
    btnPreview.onclick = () => {
      console.log("Clic en previsualizar llamado");
      PlaneamientoExporter.preview(currentMode);
    };
    console.log("Listener adjuntado a btn-preview");
  }

  // Exportar Word (con chequeo y log)
  const btnExportWord = document.getElementById("btn-export-word");
  if (btnExportWord) {
    btnExportWord.onclick = () => {
      console.log("Clic en exportar Word llamado");
      PlaneamientoExporter.exportWord(currentMode);
    };
    console.log("Listener adjuntado a btn-export-word");
  }

  // Imprimir / PDF (con chequeo y log)
  const btnPrint = document.getElementById("btn-print");
  if (btnPrint) {
    btnPrint.onclick = () => {
      console.log("Clic en imprimir/PDF llamado");
      PlaneamientoExporter.exportPrint(currentMode);
    };
    console.log("Listener adjuntado a btn-print");
  }

  // Exportar JSON (con log)
  const btnExportJson = document.getElementById("btn-export-json");
  if (btnExportJson) {
    btnExportJson.onclick = () => {
      console.log("Clic en exportar JSON llamado");
      const state = Engine.saveAll(currentMode);
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `planeamiento_${currentMode}.json`;
      a.click();
      URL.revokeObjectURL(url);
    };
    console.log("Listener adjuntado a btn-export-json");
  }

  // Importar JSON (con log)
  const btnImportJson = document.getElementById("btn-import-json");
  const inputJson = document.createElement("input");
  inputJson.type = "file";
  inputJson.accept = ".json";
  inputJson.style.display = "none";
  document.body.appendChild(inputJson);
  if (btnImportJson) {
    btnImportJson.onclick = () => {
      console.log("Clic en import JSON llamado");
      inputJson.click();
    };
    console.log("Listener adjuntado a btn-import-json");
  }
  inputJson.onchange = () => {
    const file = inputJson.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const state = JSON.parse(e.target.result);
        Engine.writeAcademicoToDOM(state.academico);
        Engine.writeDidacticoToDOM(state.didactico);
        currentMode = state.mode;
        switchMode(currentMode);
        setStatus("Planeamiento importado desde JSON.");
      } catch (err) {
        setStatus("Error importando JSON: " + err.message, false);
      }
    };
    reader.readAsText(file);
  };

  // Exportar indicadores (didáctico) – fix selector con name
  const btnExportIndicadores = document.getElementById("did-export-indicadores");
  if (btnExportIndicadores) {
    btnExportIndicadores.onclick = () => {
      console.log("Clic en export indicadores llamado");
      try {
        const indicadores = [...didSection().querySelectorAll('textarea[name="did-indicadores"]')].map(ta => ta.value.trim()).filter(Boolean);
        if (!indicadores.length) {
          alert("No hay indicadores para exportar.");
          return;
        }

        localStorage.setItem(
          "ELMA_EXPORT_INDICADORES",
          JSON.stringify(indicadores)
        );

        window.location.href = "../Rubricas_ELMA_Secundaria_v1_1_2/index.html";

      } catch (err) {
        console.error("Error exportando indicadores:", err);
        alert("Ocurrió un error al exportar los indicadores.");
      }
    };
    console.log("Listener adjuntado a did-export-indicadores");
  };

  // picker – comentado temporalmente porque funciones no definidas (descomenta cuando las agregues)
  // const planPicker = document.getElementById("plan-picker");
  // const btnOpenPlan = document.getElementById("btn-open-plan");
  // if (btnOpenPlan) btnOpenPlan.onclick = openSelectedPlan;
  // const btnRefreshPlans = document.getElementById("btn-refresh-plans");
  // if (btnRefreshPlans) btnRefreshPlans.onclick = fillPlanPicker;

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

  // fillPlanPicker(); // comentado temporalmente

  // Llama a attachTableListeners al final, después de que todo se renderice
  attachTableListeners();
});