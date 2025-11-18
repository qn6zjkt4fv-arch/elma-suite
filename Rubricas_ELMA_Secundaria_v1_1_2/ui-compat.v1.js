<script>
/* ===================================================================
   ui-compat.v1.js — Puente de compatibilidad para IDs actuales
   - No modifica módulos existentes ni la impresión estable 1.0.5
   - Reactiva Banco (import), Alinear (2 archivos), Evaluar/Calificar,
     Modo oscuro y Ayuda usando los IDs reales de index.html
   =================================================================== */
(function(){
  console.log("🟩 ui-compat.v1 cargado");

  // ---------- Utils
  function readJSONFile(file){
    return new Promise((resolve,reject)=>{
      const r = new FileReader();
      r.onload = () => {
        try { resolve(JSON.parse(r.result)); }
        catch(e){ reject(e); }
      };
      r.onerror = reject;
      r.readAsText(file);
    });
  }
  function $id(sel){ return document.getElementById(sel); }
  function q(sel){ return document.querySelector(sel); }
  function qa(sel){ return Array.from(document.querySelectorAll(sel)); }

  // ---------- BANCO: Importar JSON (usa #import-json y #bank-file)
  (function setupBankImport(){
    const btnImport = $id("import-json");
    let fileInput = $id("bank-file"); // ya existe en tu HTML
    if (!btnImport) return;

    if (!fileInput) {
      fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = ".json";
      fileInput.id = "bank-file";
      fileInput.hidden = true;
      document.body.appendChild(fileInput);
    }

    btnImport.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", async (e)=>{
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      try {
        const arr = await readJSONFile(f);
        if (!Array.isArray(arr)) throw new Error("Formato inválido");
        localStorage.setItem("rubricBankStore", JSON.stringify(arr));
        // reconstruye listado en #bank-list (igual que rubric-engine)
        const list = $id("bank-list");
        if (list) {
          list.innerHTML = "";
          if (!arr.length) {
            list.innerHTML = `<li class="muted">No hay rúbricas guardadas.</li>`;
          } else {
            arr.forEach((item, idx)=>{
              const li = document.createElement("li");
              li.innerHTML = `<label><input type="radio" name="bankPick" value="${idx}"> ${item.name || ("Rúbrica " + (idx+1))}</label>`;
              list.appendChild(li);
            });
          }
        }
        alert("✅ Banco importado.");
      } catch(err) {
        console.warn(err);
        alert("⚠️ JSON inválido.");
      } finally {
        e.target.value = ""; // reset
      }
    });
  })();

  // ---------- ALINEAR: usar tus IDs (#btn-load-demo, #btn-load-json, #align-result)
  (function setupAlign(){
    const btnCurr = $id("btn-load-demo");
    const btnPlans = $id("btn-load-json");
    const out = $id("align-result");
    let fileCurr = $id("file-curriculum"); // proxy oculto para malla
    let filePlans = $id("file-plans");     // proxy oculto para planes

    if (!out) return;

    // Crea dos inputs ocultos para tener flujos separados como alignment.js
    function ensureInputs(){
      if (!fileCurr) {
        fileCurr = document.createElement("input");
        fileCurr.type="file"; fileCurr.accept=".json"; fileCurr.id="file-curriculum"; fileCurr.hidden=true;
        document.body.appendChild(fileCurr);
      }
      if (!filePlans) {
        filePlans = document.createElement("input");
        filePlans.type="file"; filePlans.accept=".json"; filePlans.id="file-plans"; filePlans.hidden=true;
        document.body.appendChild(filePlans);
      }
    }
    ensureInputs();

    const state = { curriculum:null, plans:null };

    async function handlePick(which, file){
      if (!file) return;
      try {
        const data = await readJSONFile(file);
        state[which] = data;
        alert(`✅ ${which==="curriculum" ? "Malla curricular" : "Planeamientos"} cargados.`);
        if (state.curriculum && state.plans) analyze();
      } catch(e){ alert("⚠️ JSON inválido."); }
    }

    function analyze(){
      // réplica simple del análisis: escanea coincidencias por criterio
      const rows = qa(".criterion-row");
      let html = "<h4>Resultado de alineación</h4><ul>";
      rows.forEach((row, idx)=>{
        const c = (row.querySelector(".criterio")?.value || "").toLowerCase();
        const hits = [];
        function scan(obj, path=""){
          if (!obj) return;
          if (typeof obj === "string") {
            const s = obj.toLowerCase();
            if (c && s.includes(c.split(" ")[0])) hits.push(path + ": " + obj.slice(0,120));
            return;
          }
          if (Array.isArray(obj)) obj.forEach((v,i)=>scan(v, path+"["+i+"]"));
          else if (typeof obj === "object") Object.keys(obj).forEach(k=>scan(obj[k], path? path+"."+k : k));
        }
        scan(state.curriculum, "malla");
        scan(state.plans, "planes");
        html += `<li><strong>Criterio ${idx+1}:</strong> ${c || "(sin texto)"}<br>
          <em>Coincidencias:</em><br><div style="margin-left:12px">${hits.map(h=>"- "+h).join("<br>") || "(sin coincidencias)"}</div></li>`;
      });
      html += "</ul>";
      out.innerHTML = html;
    }

    if (btnCurr) btnCurr.addEventListener("click", ()=> fileCurr.click());
    if (btnPlans) btnPlans.addEventListener("click", ()=> filePlans.click());
    fileCurr.addEventListener("change", e=> handlePick("curriculum", e.target.files?.[0]));
    filePlans.addEventListener("change", e=> handlePick("plans", e.target.files?.[0]));
  })();

  // ---------- EVALUAR/CALIFICAR: enlaza tus botones a funciones del módulo
  (function setupGrade(){
    const btnLoad   = $id("btn-load-rubric");      // cargar lista desde banco
    const btnNew    = $id("btn-new-student");      // crear estudiante (mínimo)
    const btnExport = $id("btn-export-grades");    // exportar (elige JSON o CSV)
    const host      = $id("grade-table");          // contenedor tabla

    // reutiliza el banco
    function getBank(){ try{ return JSON.parse(localStorage.getItem("rubricBankStore")||"[]"); }catch{return[]} }
    function admin(){ try{ return JSON.parse(localStorage.getItem("adminData")||"{}"); }catch{return{}} }

    function renderEvalList(){
      const store = getBank();
      const ul = document.createElement("ul");
      ul.id = "eval-rubric-list";
      if (!store.length) {
        ul.innerHTML = `<li class="muted">No hay rúbricas en banco.</li>`;
      } else {
        store.forEach((item, idx)=>{
          const li = document.createElement("li");
          li.innerHTML = `<label><input type="radio" name="evalPick" value="${idx}"> ${item.name || ("Rúbrica " + (idx+1))}</label>`;
          ul.appendChild(li);
        });
      }
      return ul;
    }

    function ensureShell(){
      if (!host) return;
      host.innerHTML = `
        <div class="eval-shell">
          <div class="eval-controls" style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
            <button id="eval-export-json" class="secondary">Exportar JSON</button>
            <button id="eval-export-csv" class="secondary">Exportar CSV</button>
            <button id="eval-print" class="ghost">Vista impresión</button>
          </div>
          <div id="eval-list-holder"></div>
        </div>`;
      $id("eval-list-holder").appendChild(renderEvalList());
    }

    function pickIndex(){
      const r = qa('input[name="evalPick"]');
      let pick=-1; r.forEach(x=>{ if (x.checked) pick = parseInt(x.value,10); });
      return pick;
    }

    function exportJSON(){
      const store=getBank(); const i=pickIndex();
      if (i<0||i>=store.length) return alert("Seleccione una rúbrica.");
      const blob = new Blob([JSON.stringify(store[i].data, null, 2)], {type:"application/json"});
      const url = URL.createObjectURL(blob); const a = document.createElement("a");
      a.href=url; a.download=(store[i].name||"rubrica")+".json";
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    }
    function exportCSV(){
      const store=getBank(); const i=pickIndex();
      if (i<0||i>=store.length) return alert("Seleccione una rúbrica.");
      const rows = store[i].data || [];
      const headers=["Criterio","Nivel4","Nivel3","Nivel2","Nivel1"];
      const csv=[headers.join(",")].concat(
        rows.map(r => [r.criterio,r.nivel4,r.nivel3,r.nivel2,r.nivel1].map(x=>`"${(x||"").replace(/"/g,'""')}"`).join(","))
      ).join("\n");
      const blob=new Blob([csv],{type:"text/csv"});
      const url=URL.createObjectURL(blob); const a=document.createElement("a");
      a.href=url; a.download=(store[i].name||"rubrica")+".csv";
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    }
    function printView(){
      const store=getBank(); const i=pickIndex();
      if (i<0||i>=store.length) return alert("Seleccione una rúbrica.");
      const adminData = admin();
      const header = `
        <div style="text-align:center; margin-bottom:10px;">
          <h2 style="margin:4px 0;">Escuela Liceo María Auxiliadora de San José</h2>
          <h3 style="margin:2px 0;">Ministerio de Educación Pública - Costa Rica</h3>
          <hr style="margin:6px 0;">
          <table style="width:100%; font-size:13px; border-collapse:collapse; margin-bottom:12px;">
            <tr>
              <td><strong>Docente:</strong> ${adminData.docente || ""}</td>
              <td><strong>Asignatura:</strong> ${adminData.asignatura || ""}</td>
              <td><strong>Nivel:</strong> ${adminData.nivel || ""}</td>
            </tr>
            <tr>
              <td><strong>Período:</strong> ${adminData.periodo || ""}</td>
              <td><strong>Tema:</strong> ${adminData.tema || ""}</td>
              <td><strong>Fecha:</strong> ${adminData.fecha || ""}</td>
            </tr>
            <tr>
              <td colspan="3"><strong>Número de Proceso Administrativo:</strong> ${adminData.numero || ""}</td>
            </tr>
          </table>
        </div>`;
      const rows = store[i].data || [];
      const body = `
        <table style="border-collapse: collapse; width: 100%;">
          <thead><tr>
            <th style="border:1px solid #444;padding:6px;">Criterio</th>
            <th style="border:1px solid #444;padding:6px;">Nivel 4</th>
            <th style="border:1px solid #444;padding:6px;">Nivel 3</th>
            <th style="border:1px solid #444;padding:6px;">Nivel 2</th>
            <th style="border:1px solid #444;padding:6px;">Nivel 1</th>
          </tr></thead>
          <tbody>
            ${rows.map(r=>`
              <tr>
                <td style="border:1px solid #444;padding:6px;">${r.criterio||""}</td>
                <td style="border:1px solid #444;padding:6px;">${r.nivel4||""}</td>
                <td style="border:1px solid #444;padding:6px;">${r.nivel3||""}</td>
                <td style="border:1px solid #444;padding:6px;">${r.nivel2||""}</td>
                <td style="border:1px solid #444;padding:6px;">${r.nivel1||""}</td>
              </tr>`).join("")}
          </tbody>
        </table>`;
      const html = `<html><head><meta charset="UTF-8"><style>@page{size:letter;margin:2cm}body{font-family:Arial,sans-serif;font-size:13px}</style></head>
      <body>${header}${body}</body></html>`;
      const win = window.open("", "_blank");
      win.document.write(html); win.document.close();
    }

    if (btnLoad) {
      btnLoad.addEventListener("click", ()=>{
        ensureShell();
        alert("✅ Cargue una rúbrica del banco eligiendo una en la lista.");
      });
    }
    if (btnExport) {
      // Por simplicidad, al exportar preguntamos el formato
      btnExport.addEventListener("click", ()=>{
        const choice = prompt("¿Formato? Escriba: JSON o CSV", "CSV");
        if (!choice) return;
        if (choice.toLowerCase().includes("json")) exportJSON();
        else exportCSV();
      });
    }
    if (host) {
      // Delegación para los 3 botones internos
      host.addEventListener("click", (e)=>{
        const t = e.target;
        if (!(t instanceof HTMLElement)) return;
        if (t.id === "eval-export-json") exportJSON();
        if (t.id === "eval-export-csv")  exportCSV();
        if (t.id === "eval-print")       printView();
      });
    }

    // "Nuevo estudiante" (mínimo: maqueta)
    if (btnNew && host) {
      btnNew.addEventListener("click", ()=>{
        if (!host.querySelector(".students")) {
          const box = document.createElement("div");
          box.className = "students";
          box.innerHTML = `<p style="margin:.5rem 0;">👤 Gestión de estudiantes (próxima iteración). Por ahora el módulo exporta rúbricas seleccionadas.</p>`;
          host.appendChild(box);
        } else {
          alert("🧑‍🎓 Próxima iteración: alta/baja de estudiantes y calificación con escala 1–4.");
        }
      });
    }
  })();

  // ---------- MODO OSCURO y AYUDA
  (function setupDarkHelp(){
    const btnDark = $id("mode-toggle");
    const btnHelp = $id("btn-help");
    if (btnDark) btnDark.addEventListener("click", ()=> document.body.classList.toggle("dark"));
    if (btnHelp) btnHelp.addEventListener("click", ()=>{
      alert("Ayuda rápida:\n\n1) Crear Rúbrica → agregue criterios y vista previa.\n2) Banco → guarde o importe un JSON con varias rúbricas.\n3) Alinear → cargue Malla y Planeamientos (JSON) y se listan coincidencias.\n4) Evaluar → cargue una rúbrica del banco y expórtela en JSON/CSV o imprima.");
    });
  })();

})();
</script>
