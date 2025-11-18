/* ============================================================
   alignment.js — v0.5 Institucional
   Alinea rúbrica con malla/planeamientos (JSON)
   ============================================================ */
(function () {
  console.log("🟦 alignment.js v0.5");
  const btnLoadCurriculum = document.getElementById("load-curriculum") || document.getElementById("btn-load-curriculum");
  const btnLoadPlans      = document.getElementById("load-plans") || document.getElementById("btn-load-plans");
  const btnAnalyze        = document.getElementById("analyze-alignment") || document.getElementById("btn-analyze-alignment");
  const out               = document.getElementById("align-output") || document.getElementById("alignment-output");
  const inputCurriculum   = document.getElementById("file-curriculum");
  const inputPlans        = document.getElementById("file-plans");

  let curriculum = null, plans = null;

  function readJSON(file, cb) {
    const reader = new FileReader();
    reader.onload = () => {
      try { cb(JSON.parse(reader.result)); }
      catch { alert("⚠️ JSON inválido: " + file.name); }
    };
    reader.readAsText(file);
  }

  if (btnLoadCurriculum) btnLoadCurriculum.addEventListener("click", () => {
    if (inputCurriculum) inputCurriculum.click();
  });
  if (inputCurriculum) inputCurriculum.addEventListener("change", (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    readJSON(f, (data) => { curriculum = data; alert("✅ Malla curricular cargada."); });
  });

  if (btnLoadPlans) btnLoadPlans.addEventListener("click", () => {
    if (inputPlans) inputPlans.click();
  });
  if (inputPlans) inputPlans.addEventListener("change", (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    readJSON(f, (data) => { plans = data; alert("✅ Planeamientos cargados."); });
  });

  if (btnAnalyze) btnAnalyze.addEventListener("click", () => {
    if (!out) { alert("No se encontró el panel de alineación."); return; }
    if (!curriculum || !plans) { out.innerHTML = "<p>⚠️ Cargue malla y planeamientos.</p>"; return; }

    const rows = document.querySelectorAll(".criterion-row");
    let html = "<h4>Resultado de alineación</h4><ul>";
    rows.forEach((row, idx) => {
      const c = (row.querySelector(".criterio")?.value || "").toLowerCase();
      const hits = [];
      function scan(obj, path="") {
        if (!obj) return;
        if (typeof obj === "string") {
          const s = obj.toLowerCase();
          if (c && s.includes(c.split(" ")[0])) hits.push(path + ": " + obj.slice(0,120));
          return;
        }
        if (Array.isArray(obj)) obj.forEach((v,i)=>scan(v, path+"["+i+"]"));
        else if (typeof obj === "object") Object.keys(obj).forEach(k=>scan(obj[k], path? path+"."+k : k));
      }
      scan(curriculum, "malla");
      scan(plans, "planes");
      html += `<li><strong>Criterio ${idx+1}:</strong> ${c || "(sin texto)"}<br>
        <em>Coincidencias:</em><br><div style="margin-left:12px">${hits.map(h=>"- "+h).join("<br>") || "(sin coincidencias)"
      }</div></li>`;
    });
    html += "</ul>";
    out.innerHTML = html;
  });
})();
