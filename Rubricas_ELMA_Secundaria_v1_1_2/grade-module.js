/* ============================================================
   grade-module.js — v0.5 Institucional
   Evaluar/Calificar: export JSON, CSV, vista de impresión
   ============================================================ */
(function () {
  console.log("🟦 grade-module.js v0.5");
  const btnExportJSON = document.getElementById("eval-export-json");
  const btnExportCSV  = document.getElementById("eval-export-csv");
  const btnPrintView  = document.getElementById("eval-print");
  const evalList      = document.getElementById("eval-rubric-list");
  const btnLoadEval   = document.getElementById("eval-load");

  function refreshEvalList() {
    if (!evalList) return;
    const store = JSON.parse(localStorage.getItem("rubricBankStore") || "[]");
    evalList.innerHTML = "";
    if (!store.length) {
      evalList.innerHTML = `<li class="muted">No hay rúbricas en banco.</li>`;
      return;
    }
    store.forEach((item, idx) => {
      const li = document.createElement("li");
      li.innerHTML = `<label><input type="radio" name="evalPick" value="${idx}"> ${item.name || ("Rúbrica " + (idx+1))}</label>`;
      evalList.appendChild(li);
    });
  }

  function exportSelectedJSON() {
    const radios = document.querySelectorAll('input[name="evalPick"]');
    let pick = -1; radios.forEach(r => { if (r.checked) pick = parseInt(r.value,10); });
    const store = JSON.parse(localStorage.getItem("rubricBankStore") || "[]");
    if (pick < 0 || pick >= store.length) { alert("Seleccione una rúbrica."); return; }
    const blob = new Blob([JSON.stringify(store[pick].data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = (store[pick].name || "rubrica") + ".json";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportSelectedCSV() {
    const radios = document.querySelectorAll('input[name="evalPick"]');
    let pick = -1; radios.forEach(r => { if (r.checked) pick = parseInt(r.value,10); });
    const store = JSON.parse(localStorage.getItem("rubricBankStore") || "[]");
    if (pick < 0 || pick >= store.length) { alert("Seleccione una rúbrica."); return; }
    const rows = store[pick].data || [];
    const headers = ["Criterio","Nivel4","Nivel3","Nivel2","Nivel1"];
    const csv = [headers.join(",")].concat(
      rows.map(r => [r.criterio, r.nivel4, r.nivel3, r.nivel2, r.nivel1].map(x => `"${(x||"").replace(/"/g,'""')}"`).join(","))
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = (store[pick].name || "rubrica") + ".csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function openPrintSelected() {
    const radios = document.querySelectorAll('input[name="evalPick"]');
    let pick = -1; radios.forEach(r => { if (r.checked) pick = parseInt(r.value,10); });
    const store = JSON.parse(localStorage.getItem("rubricBankStore") || "[]");
    if (pick < 0 || pick >= store.length) { alert("Seleccione una rúbrica."); return; }
    const admin = JSON.parse(localStorage.getItem("adminData") || "{}");
    const header = `
      <div style="text-align:center; margin-bottom:10px;">
        <h2 style="margin:4px 0;">Escuela Liceo María Auxiliadora de San José</h2>
        <h3 style="margin:2px 0;">Ministerio de Educación Pública - Costa Rica</h3>
        <hr style="margin:6px 0;">
        <table style="width:100%; font-size:13px; border-collapse:collapse; margin-bottom:12px;">
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
      </div>`;
    const rows = store[pick].data || [];
    const body = `
      <table style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr>
            <th style="border:1px solid #444;padding:6px;">Criterio</th>
            <th style="border:1px solid #444;padding:6px;">Nivel 4</th>
            <th style="border:1px solid #444;padding:6px;">Nivel 3</th>
            <th style="border:1px solid #444;padding:6px;">Nivel 2</th>
            <th style="border:1px solid #444;padding:6px;">Nivel 1</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              <td style="border:1px solid #444;padding:6px;">${r.criterio||""}</td>
              <td style="border:1px solid #444;padding:6px;">${r.nivel4||""}</td>
              <td style="border:1px solid #444;padding:6px;">${r.nivel3||""}</td>
              <td style="border:1px solid #444;padding:6px;">${r.nivel2||""}</td>
              <td style="border:1px solid #444;padding:6px;">${r.nivel1||""}</td>
            </tr>`).join("")}
        </tbody>
      </table>`;
    const html = `
      <html><head><meta charset="UTF-8"><style>@page{size:letter;margin:2cm}body{font-family:Arial,sans-serif;font-size:13px}</style></head>
      <body>${header}${body}</body></html>`;
    const win = window.open("", "_blank");
    win.document.write(html); win.document.close();
  }

  if (btnExportJSON) btnExportJSON.addEventListener("click", exportSelectedJSON);
  if (btnExportCSV)  btnExportCSV.addEventListener("click", exportSelectedCSV);
  if (btnPrintView)  btnPrintView.addEventListener("click", openPrintSelected);
  if (btnLoadEval)   btnLoadEval.addEventListener("click", refreshEvalList);

  document.addEventListener("DOMContentLoaded", refreshEvalList);
})();
