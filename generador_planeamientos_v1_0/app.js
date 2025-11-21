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
      : "none";
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

    showWelcome();
    setStatus("Nuevo planeamiento iniciado. Selecciona el tipo para comenzar.");
  }

  // ─────────────────────────────────────────
  // Guardado (local + con nombre) / Carga
  // ─────────────────────────────────────────
  function saveAll() {
    // Pregunta si desea usar nombre (multi)
    const useNamed = confirm("¿Deseas guardar este planeamiento con un nombre (para manejar varios)?");
    if (useNamed && Engine.savePlanWithName) {
      const name = prompt("Nombre del planeamiento (ej: 'Química 10° - I Semestre'):");
      if (name && name.trim()) {
        const trimmed = name.trim();
        const res = Engine.savePlanWithName(trimmed, currentMode);
        if (res) {
          setStatus(`Planeamiento guardado como: "${trimmed}".`);
          // actualizar el picker del header
          try { fillPlanPicker(); } catch {}
          return;
        } else {
          setStatus("No se pudo guardar con nombre. Se utilizará el guardado simple.", false);
        }
      }
    }

    // Guardado simple (último estado)
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
    // actualizar picker por si acaso
    try { fillPlanPicker(); } catch {}
  }

  function loadAll() {
    // Compatibilidad anterior: si no elige por nombre, cargamos el último
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

  // ─────────────────────────────────────────
  // Picker del header (lista de nombres)
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

    // restaurar selección si aún existe
    if (selected && names.includes(selected)) {
      sel.value = selected;
    } else {
      sel.value = "";
    }
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
      // refresca lista por si hubo cambios externos
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
  // Exportar / Importar JSON (respaldo en carpeta ELMA)
  // ─────────────────────────────────────────
  function buildJsonFilenameFromState(state) {
    try {
      const did = state && state.didactico ? state.didactico : {};
      const ac  = state && state.academico ? state.academico : {};

      const docente = (did.docente || ac.docente || "").toString();
      const asign   = (did.asignatura || ac.asignatura || "planeamiento").toString();
      const nivel   = (did.nivel || ac.nivel || "").toString();
      const ciclo   = (did.ciclo || ac.ciclo || "").toString();

      const parts = [asign, nivel, ciclo, docente]
        .map(s => s.trim())
        .filter(Boolean)
        .map(s =>
          s.normalize("NFD")
           .replace(/[\u0300-\u036f]/g, "")
           .replace(/[^A-Za-z0-9_-]+/g, "_")
        );

      const date = new Date().toISOString().slice(0, 10);
      const base = parts.length ? "planeamiento_" + parts.join("_") : "planeamiento_elma";
      return base + "_" + date + ".json";
    } catch (e) {
      return "planeamiento_elma.json";
    }
  }

  function handleExportJson() {
    if (!Engine || !Engine.saveAll) {
      alert("No se pudo acceder al motor de planeamientos.");
      return;
    }
    try {
      const state = Engine.saveAll(currentMode);
      const json  = JSON.stringify(state, null, 2);
      const blob  = new Blob([json], { type: "application/json" });
      const url   = URL.createObjectURL(blob);
      const a     = document.createElement("a");
      a.href = url;
      a.download = buildJsonFilenameFromState(state);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatus("Archivo JSON de planeamiento descargado. Guárdalo en tu carpeta ELMA de planeamientos.");
    } catch (e) {
      console.error("Error exportando JSON:", e);
      alert("No se pudo exportar el archivo JSON del planeamiento.");
    }
  }

  function handlePlanFileChange(e) {
    const input = e.target;
    const file = input && input.files && input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || "");
        const st = JSON.parse(text);
        if (!st || typeof st !== "object") {
          throw new Error("Formato inválido");
        }
        if (!Engine) throw new Error("Motor de planeamientos no disponible.");

        if (st.academico) Engine.writeAcademicoToDOM(st.academico);
        if (st.didactico) Engine.writeDidacticoToDOM(st.didactico);

        // Ajustar modo actual según el archivo (por defecto, didáctico)
        currentMode = (st.mode === "academico") ? "academico" : "didactico";
        showWelcome();
        setStatus("Planeamiento cargado desde archivo JSON. Selecciona Académico o Didáctico para continuar.");

        // Re-guardar en almacenamiento local como comodidad
        try { Engine.saveAll(currentMode); } catch (err) { console.warn(err); }
      } catch (err) {
        console.error("Error importando JSON:", err);
        alert("No se pudo leer el archivo. Verifica que sea un JSON generado por esta herramienta.");
      } finally {
        if (input) input.value = "";
      }
    };
    reader.onerror = () => {
      alert("Ocurrió un error al leer el archivo seleccionado.");
      if (input) input.value = "";
    };
    reader.readAsText(file, "utf-8");
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

    const btnExportJson = document.getElementById("btn-export-json");
    const btnImportJson = document.getElementById("btn-import-json");
    const planFileInput = document.getElementById("plan-file-input");

    if (btnExportJson) btnExportJson.onclick = handleExportJson;
    if (btnImportJson && planFileInput) {
      btnImportJson.onclick = () => planFileInput.click();
      planFileInput.addEventListener("change", handlePlanFileChange);
    }

    // picker acciones
    const planPicker = document.getElementById("plan-picker");
    const btnOpenPlan = document.getElementById("btn-open-plan");
    const btnRefreshPlans = document.getElementById("btn-refresh-plans");
    if (btnOpenPlan) btnOpenPlan.onclick = openSelectedPlan;
    if (btnRefreshPlans) btnRefreshPlans.onclick = fillPlanPicker;

    // académico filas
    const btnAcadAdd = document.getElementById("acad-add-row");
    const btnAcadClear = document.getElementById("acad-clear-rows");
    if (btnAcadAdd) btnAcadAdd.onclick = () => Engine.addAcadRow();
    if (btnAcadClear) btnAcadClear.onclick = () => {
      Engine.clearAcadRows();
      setStatus("Matriz académica limpiada.");
    };

    // didáctico filas
    const btnDidAdd = document.getElementById("did-add-row");
    const btnDidClear = document.getElementById("did-clear-rows");
    if (btnDidAdd) btnDidAdd.onclick = () => Engine.addDidRow();
    if (btnDidClear) btnDidClear.onclick = () => {
      Engine.clearDidRows();
      setStatus("Matriz didáctica limpiada.");
    };

    // Estado inicial
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

    // poblar picker al inicio
    fillPlanPicker();

    // Atajo Ctrl+Enter → agrega fila según modo activo
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "Enter") {
        if (currentMode === "didactico") {
          Engine.addDidRow();
          setStatus("Fila didáctica agregada (Ctrl+Enter).");
        } else if (currentMode === "academico") {
          Engine.addAcadRow();
          setStatus("Fila académica agregada (Ctrl+Enter).");
        }
      }
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
