/* ============================================================
   rubric-engine.js — v0.5 Institucional (sin duplicar encabezado)
   ============================================================ */
(function () {
  console.log("🟦 rubric-engine.js v0.5");

  const criteriaList     = document.getElementById("criteria-list");
  const addCriterionBtn  = document.getElementById("add-criterion");
  const previewBtn       = document.getElementById("preview-rubric") || document.getElementById("btn-preview");
  const previewContainer = document.getElementById("preview-area") || document.getElementById("rubric-preview");
  const saveBankBtn      = document.getElementById("save-bank") || document.getElementById("save-to-bank") || document.getElementById("btn-save");
  const loadBankBtn      = document.getElementById("load-bank") || document.getElementById("load-from-bank");
  const bankList         = document.getElementById("bank-list");
  const RUBRIC_TRANSFER_KEY = "elma_rubric_transfer_v1";


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
      "Aceptar: reemplazar los criterios actuales por estos.\n" +
      "Cancelar: agregarlos al final de la rúbrica."
    );

    if (replace) {
      criteriaList.innerHTML = "";
    }

    criterios.forEach((texto) => {
      const t = (texto || "").trim();
      if (!t) return;
      const row = createCriterionRow({ criterio: t });
      criteriaList.appendChild(row);
    });

    document.dispatchEvent(new Event("elma-ensure-verb-bind"));

    let msg = "Se importaron " + criterios.length + " criterios desde el planeamiento didáctico.";
    if (payload.tema) msg += "\n\nTema: " + payload.tema;
    if (payload.asignatura) msg += "\nAsignatura: " + payload.asignatura;
    if (payload.nivel) msg += "\nNivel: " + payload.nivel;
    alert(msg);
  }


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

  // —— Banco ——
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
  const importInput = document.getElementById("import-bank");
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

  // Eventos
  if (addCriterionBtn) addCriterionBtn.addEventListener("click", () => {
    criteriaList.appendChild(createCriterionRow());
    document.dispatchEvent(new Event("elma-ensure-verb-bind"));
  });

  let importFromPlannerBtn = document.getElementById("import-from-planner");
  if (!importFromPlannerBtn && addCriterionBtn && addCriterionBtn.parentElement) {
    importFromPlannerBtn = document.createElement("button");
    importFromPlannerBtn.type = "button";
    importFromPlannerBtn.id = "import-from-planner";
    importFromPlannerBtn.textContent = "Importar desde planeamiento";
    importFromPlannerBtn.className = addCriterionBtn.className || "";
    addCriterionBtn.parentElement.insertBefore(importFromPlannerBtn, addCriterionBtn.nextSibling);
  }
  if (importFromPlannerBtn) {
    importFromPlannerBtn.addEventListener("click", importCriteriaFromPlanner);
  }

  if (previewBtn)    previewBtn.addEventListener("click", renderPreview);
  if (saveBankBtn)   saveBankBtn.addEventListener("click", saveToBank);
  if (loadBankBtn)   loadBankBtn.addEventListener("click", loadFromBank);
  if (importInput)   importInput.addEventListener("change", handleImportBank);
  if (exportBankBtn) exportBankBtn.addEventListener("click", exportBankJSON);

  // Inicial
  document.addEventListener("DOMContentLoaded", refreshBankList);
})();