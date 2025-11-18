// ui-compat.autowire.v2.1.js — Autowire + Selección de rúbrica + Panel de calificación básico (escala 1–4)
(function(){
  console.log("🟩 ui-compat.autowire.v2.1 activo");

  // ========= Utilidades =========
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const byId = id => document.getElementById(id);
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn, {passive:true});
  function t(s){ return (s||"").trim(); }
  function getBank(){ try{ return JSON.parse(localStorage.getItem("rubricBankStore")||"[]"); }catch{return[]} }
  function setSession(obj){ localStorage.setItem("evalSession", JSON.stringify(obj||{})); }
  function getSession(){ try{ return JSON.parse(localStorage.getItem("evalSession")||"{}"); }catch{return{}} }
  function download(filename, text, type){
    const blob = new Blob([text], {type});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ========= Protección clics (no bloquear por header) =========
  try{
    const style = document.createElement("style");
    style.textContent = `@media screen{
      .header::before, #preview-area::before{ pointer-events:none !important; }
      .sidebar *, .main * { pointer-events:auto !important; }
    }`;
    document.head.appendChild(style);
  }catch{}

  // ========= BANCO: Import/Export (igual que v2) =========
  ;(function bank(){
    const findButtonByText = (...needles)=>{
      needles = needles.map(s=>s.toLowerCase());
      const cand = $$("button, a, [role='button']");
      return cand.find(el => needles.some(n => (el.textContent||'').toLowerCase().includes(n)));
    };
    const btnImport = document.querySelector("[data-action='import-bank']") || findButtonByText("importar json","importar banco","importar rúbricas");
    const btnExport = document.querySelector("[data-action='export-bank']") || findButtonByText("exportar banco","exportar json banco");
    const bankList  = byId("bank-list") || document.querySelector(".bank-list") || document.querySelector("#banco ul, #banco ol");
    let input = byId("bank-file");
    if (!input){
      input = document.createElement("input"); input.type="file"; input.accept=".json"; input.id="bank-file"; input.hidden=true;
      document.body.appendChild(input);
    }
    function refreshList(){
      if (!bankList) return;
      const arr = getBank();
      bankList.innerHTML = "";
      if (!arr.length){ bankList.innerHTML = `<li class="muted">No hay rúbricas guardadas.</li>`; return; }
      arr.forEach((it,i)=>{
        const li = document.createElement("li");
        li.innerHTML = `<label><input type="radio" name="bankPick" value="${i}"> ${it.name || ("Rúbrica "+(i+1))}</label>`;
        bankList.appendChild(li);
      });
    }
    function readJSONFile(file){
      return new Promise((resolve,reject)=>{
        const r = new FileReader();
        r.onload = ()=>{ try{ resolve(JSON.parse(r.result)); }catch(e){ reject(e);} };
        r.onerror = reject;
        r.readAsText(file);
      });
    }
    on(btnImport, "click", ()=> input.click());
    on(input, "change", async e=>{
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      try{
        const data = await readJSONFile(f);
        if (!Array.isArray(data)) throw new Error("Se esperaba un arreglo de rúbricas");
        localStorage.setItem("rubricBankStore", JSON.stringify(data));
        refreshList();
        alert("✅ Banco importado.");
      }catch{ alert("⚠️ JSON inválido."); }
      finally { input.value=""; }
    });
    on(btnExport, "click", ()=>{
      const txt = localStorage.getItem("rubricBankStore") || "[]";
      download("rubric_bank.json", txt, "application/json");
    });
    refreshList();
  })();

  // ========= EVALUAR / CALIFICAR =========
  ;(function evalCalif(){
    const btnLoad   = byId("btn-load-rubric") || document.querySelector("[data-action='eval-load']");
    const host      = byId("grade-table") || byId("eval-host") || document.querySelector("#evaluar #grade-table, #evaluar .table-host");
    if (!host || !btnLoad) return;

    function pickIndex(){
      const r = $$('input[name="bankPick"]');
      let pick=-1; r.forEach(x=>{ if (x.checked) pick=parseInt(x.value,10); });
      return pick;
    }
    function ensureShell(){
      host.innerHTML = `
        <div class="eval-shell">
          <div class="eval-controls" style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
            <button id="eval-pick" class="primary">Seleccionar esta rúbrica</button>
            <button id="eval-export-json" class="secondary">Exportar JSON</button>
            <button id="eval-export-csv" class="secondary">Exportar CSV</button>
            <button id="eval-print" class="ghost">Vista impresión</button>
          </div>
          <div id="eval-list-holder"></div>
          <div id="grading-host" style="margin-top:12px;"></div>
        </div>`;
      const holder = byId("eval-list-holder");
      // Inserta lista de rúbricas del banco (lado izquierdo)
      const store = getBank();
      const ul = document.createElement("ul");
      ul.id = "eval-rubric-list";
      ul.style.maxHeight = "220px";
      ul.style.overflowY = "auto";
      if (!store.length) ul.innerHTML = `<li class="muted">No hay rúbricas en banco.</li>`;
      else store.forEach((it,i)=>{
        const li = document.createElement("li");
        li.innerHTML = `<label><input type="radio" name="bankPick" value="${i}"> ${it.name || ("Rúbrica "+(i+1))}</label>`;
        ul.appendChild(li);
      });
      holder.appendChild(ul);
    }

    function exportSelected(fmt){
      const arr = getBank(); const i = pickIndex();
      if (i<0 || i>=arr.length) return alert("Seleccione una rúbrica.");
      if (fmt==="json"){
        download((arr[i].name||"rubrica")+".json", JSON.stringify(arr[i].data, null, 2), "application/json");
      } else {
        const rows = arr[i].data || [];
        const headers=["Criterio","Nivel4","Nivel3","Nivel2","Nivel1"];
        const csv=[headers.join(",")].concat(
          rows.map(r => [r.criterio,r.nivel4,r.nivel3,r.nivel2,r.nivel1].map(x=>`"${(x||"").replace(/"/g,'""')}"`).join(","))
        ).join("\n");
        download((arr[i].name||"rubrica")+".csv", csv, "text/csv");
      }
    }

    function startGrading(idx){
      const store = getBank();
      if (idx<0 || idx>=store.length) return alert("Seleccione una rúbrica.");
      const rub = store[idx];
      const host = byId("grading-host");
      if (!host) return;

      // Persistencia básica
      const sess = getSession();
      sess.rubricIndex = idx;
      sess.rubricName = rub.name || ("Rúbrica "+(idx+1));
      sess.criteria = (rub.data||[]).map(r => t(r.criterio));
      sess.students = sess.students || []; // [{name, section, scores:[]}] escala 1–4
      setSession(sess);

      host.innerHTML = `
        <div class="grading-panel" style="border:1px solid #ccc;border-radius:8px;padding:10px;">
          <div style="display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap;">
            <div><strong>Rúbrica:</strong> ${sess.rubricName}</div>
            <div style="display:flex;gap:6px;align-items:center;">
              <input id="student-name" placeholder="Nombre estudiante" style="padding:6px;border:1px solid #ccc;border-radius:6px;">
              <button id="add-student" class="secondary">Agregar</button>
              <button id="import-students" class="ghost">Importar CSV/XLSX</button>
              <button id="clear-students" class="ghost">Limpiar lista</button>
            </div>
          </div>
          <div id="grading-table-wrap" style="margin-top:10px; overflow:auto;">
            ${renderTable(sess)}
          </div>
        </div>`;

      // Eventos
      on(byId("add-student"), "click", ()=>{
        const name = t(byId("student-name").value);
        if (!name) return;
        const s = getSession();
        s.students.push({name, section:"", scores: Array(s.criteria.length).fill(0)});
        setSession(s);
        byId("grading-table-wrap").innerHTML = renderTable(s);
      });

      const fileInput = document.createElement("input");
      fileInput.type = "file"; fileInput.accept=".csv, .xlsx"; fileInput.hidden=true;
      document.body.appendChild(fileInput);
      on(byId("import-students"), "click", ()=> fileInput.click());
      on(fileInput, "change", async e=>{
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        const s = getSession();
        if (f.name.toLowerCase().endswith(".csv")){
          const text = await f.text();
          const lines = text.split(/\r?\n/).filter(Boolean);
          lines.forEach(line=>{
            const [name, section=""] = line.split(",").map(v=>v?.trim());
            if (name) s.students.push({name, section, scores: Array(s.criteria.length).fill(0)});
          });
        } else {
          // Requiere que la librería XLSX ya esté cargada en la página (según tu index.html)
          const buf = await f.arrayBuffer();
          const wb = XLSX.read(buf, {type:"array"});
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(ws, {header:1});
          rows.forEach(r=>{
            const name = t(r[0]); const section = t(r[1]||"");
            if (name) s.students.push({name, section, scores: Array(s.criteria.length).fill(0)});
          });
        }
        setSession(s);
        byId("grading-table-wrap").innerHTML = renderTable(s);
        e.target.value = "";
      });

      on(byId("clear-students"), "click", ()=>{
        const s = getSession(); s.students = []; setSession(s);
        byId("grading-table-wrap").innerHTML = renderTable(s);
      });

      // Delegación para cambios de notas y eliminar estudiante
      on(byId("grading-table-wrap"), "change", (e)=>{
        const t = e.target;
        if (!(t instanceof HTMLSelectElement)) return;
        const row = parseInt(t.getAttribute("data-row"),10);
        const col = parseInt(t.getAttribute("data-col"),10);
        const s = getSession();
        if (s.students[row]){
          s.students[row].scores[col] = parseInt(t.value,10) || 0;
          setSession(s);
          // opcional recalcular totales en vivo
          byId("grading-table-wrap").innerHTML = renderTable(s);
        }
      });
      on(byId("grading-table-wrap"), "click", (e)=>{
        const x = e.target;
        if (x && x.matches("button[data-del]")){
          const idx = parseInt(x.getAttribute("data-del"),10);
          const s = getSession();
          s.students.splice(idx,1);
          setSession(s);
          byId("grading-table-wrap").innerHTML = renderTable(s);
        }
      });
    }

    function renderTable(s){
      const crit = s.criteria || [];
      const st = s.students || [];
      const head = `<thead><tr>
        <th style="white-space:nowrap;">#</th>
        <th>Estudiante</th>
        ${crit.map((c,i)=>`<th style="min-width:90px;">C${i+1}<div style="font-weight:normal;font-size:11px;opacity:.7">${(c||"").slice(0,20)}</div></th>`).join("")}
        <th>Promedio</th>
        <th></th>
      </tr></thead>`;
      const body = `<tbody>${
        st.map((stu,r)=>{
          const avg = crit.length ? (stu.scores.reduce((a,b)=>a+(b||0),0)/crit.length).toFixed(2) : "0.00";
          return `<tr>
            <td>${r+1}</td>
            <td>${stu.name}${stu.section?` <span style="opacity:.6">(${stu.section})</span>`:""}</td>
            ${crit.map((_,c)=> `<td>
              <select data-row="${r}" data-col="${c}">
                <option value="0"${(stu.scores[c]||0)===0?" selected":""}>–</option>
                <option value="1"${stu.scores[c]===1?" selected":""}>1</option>
                <option value="2"${stu.scores[c]===2?" selected":""}>2</option>
                <option value="3"${stu.scores[c]===3?" selected":""}>3</option>
                <option value="4"${stu.scores[c]===4?" selected":""}>4</option>
              </select>
            </td>`).join("")}
            <td><strong>${avg}</strong></td>
            <td><button data-del="${r}" class="ghost">Eliminar</button></td>
          </tr>`;
        }).join("")
      }</tbody>`;
      return `<table class="grading-table" style="border-collapse:collapse;width:100%;">
        ${head}
        ${body}
      </table>`;
    }

    on(btnLoad, "click", ()=>{
      ensureShell();
      alert("✅ Seleccione una rúbrica del banco (izquierda) y pulse 'Seleccionar esta rúbrica'.");
      const hostEl = byId("grade-table") || byId("eval-host");
      if (hostEl){
        on(hostEl, "click", (e)=>{
          const t = e.target;
          if (!(t instanceof HTMLElement)) return;
          if (t.id==="eval-export-json") exportSelected("json");
          if (t.id==="eval-export-csv")  exportSelected("csv");
          if (t.id==="eval-print")       window.print();
          if (t.id==="eval-pick"){
            const idx = pickIndex();
            if (idx<0) return alert("Seleccione una rúbrica del banco.");
            startGrading(idx);
          }
        });
      }
    });
  })();

  // ========= Modo oscuro y Ayuda =========
  ;(function darkHelp(){
    const btnDark = byId("mode-toggle") || document.querySelector("[data-action='toggle-dark']");
    const btnHelp = byId("btn-help") || document.querySelector("[data-action='help']");
    on(btnDark, "click", ()=> document.body.classList.toggle("dark"));
    on(btnHelp, "click", ()=>{
      alert("Ayuda rápida:\n\n1) Banco: 'Importar JSON' carga rúbricas al banco.\n2) Alinear: Cargue Malla y Planeamientos.\n3) Evaluar/Calificar: 'Cargar rúbrica' → seleccione en la lista (izquierda) → 'Seleccionar esta rúbrica' → agregue/importe estudiantes y califique (1–4).\n4) Exportar: use JSON o CSV.\n5) Impresión oficial: botón 'Imprimir (con encabezado)' del hotfix estable.");
    });
  })();

})();

// --- PrintBrand: asegura logo como <img> en impresión (no depende de fondos) ---
(function ensurePrintLogo(){
  function injectInto(container){
    if (!container) return;
    if (container.querySelector("#print-brand")) return;
    const img = document.createElement("img");
    img.id = "print-brand";
    img.className = "print-brand";
    img.src = "./img/logo-elma.png";   // <- confirma ruta en dist/img/
    img.alt = "ELMA";
    img.setAttribute("aria-hidden", "true");
    container.appendChild(img);
  }

  // Prioridad 1: si existe un header específico del área imprimible
  // (ajusta el selector si tu hotfix crea otro contenedor)
  const printHeader = document.querySelector("#print-root .print-header, #print-root .header, #print-area .header");
  if (printHeader) {
    injectInto(printHeader);
  } else {
    // Fallback: el header de pantalla (se ocultará el ::before en impresión)
    const screenHeader = document.querySelector(".header") || document.body;
    injectInto(screenHeader);
  }

  // Reintento justo antes de imprimir por si el hotfix reconstruye el DOM
  window.addEventListener("beforeprint", () => {
    const ph = document.querySelector("#print-root .print-header, #print-root .header, #print-area .header") 
            || document.querySelector(".header");
    injectInto(ph);
  });
})();

// ===== Verbs Dock para #verbs-helper / .verbs-helper =====
(function verbsDockFix(){
  const SEL = '#verbs-helper, .verbs-helper, [data-role="verbs-helper"]';

  function findPanel(root=document){
    return root.querySelector(SEL);
  }

  function dock(panel){
    if (!panel) return;
    // Clase para activar el CSS de docking
    panel.classList.add('docked');
    // Limpieza de estilos inline que lo peguen arriba
    panel.style.position = 'fixed';
    panel.style.top = '';                 // anulamos top
    panel.style.right = '';
    panel.style.left = '50%';
    panel.style.bottom = '';              // lo gobierna la clase .docked (CSS)
    panel.style.transform = 'translateX(-50%)';
    panel.style.maxHeight = '44vh';
    panel.style.overflow = 'auto';
    panel.style.zIndex = '10050';
  }

  // 1) Si ya existe al cargar
  dock(findPanel());

  // 2) Re-dock si lo reinsertan o cambian clases/estilos
  const mo = new MutationObserver(muts=>{
    for (const m of muts){
      if (m.type === 'childList'){
        for (const n of m.addedNodes){
          if (n instanceof Element){
            const p = n.matches?.(SEL) ? n : findPanel(n);
            if (p) dock(p);
          }
        }
      } else if (m.type === 'attributes' && m.target instanceof Element){
        if (m.target.matches?.(SEL)) dock(m.target);
      }
    }
  });
  mo.observe(document.documentElement, {
    childList: true, subtree: true,
    attributes: true, attributeFilter: ['class','style']
  });

  // 3) Por si hay varios botones que abren verbos: engancha por texto y data-*
  function normText(el){ return (el.textContent||'').replace(/\s+/g,' ').trim().toLowerCase(); }
  function findButtons(...needles){
    const n = needles.map(s=>s.toLowerCase());
    const cands = Array.from(document.querySelectorAll('button, a, [role="button"], [data-action], [data-open]'));
    return cands.filter(el => n.some(x => normText(el).includes(x)) ||
                              ['verbs','verbs-helper'].some(k => el.dataset.action===k || el.dataset.open===k));
  }
  const triggers = findButtons('verbos','lista de verbos','banco de verbos','verbs');
  triggers.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      // reintentos por si el panel aparece con retraso/animación
      setTimeout(()=> dock(findPanel()), 0);
      setTimeout(()=> dock(findPanel()), 120);
      setTimeout(()=> dock(findPanel()), 360);
    }, {passive:true});
  });

  // 4) Mantener visible al redimensionar
  window.addEventListener('resize', ()=> {
    dock(findPanel());
  }, {passive:true});
})();
