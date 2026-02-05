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

    showWelcome();
    setStatus("Nuevo planeamiento iniciado. Selecciona el tipo para comenzar.");
  }

  // ─────────────────────────────────────────
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

    fillPlanPicker();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
