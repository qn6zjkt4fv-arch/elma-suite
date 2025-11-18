/* ============================================================
   verbs-helper.js — v0.5 Institucional
   Panel de verbos Bloom / Marzano con niveles → verbos
   ============================================================ */
(function () {
  console.log("🟦 verbs-helper.js v0.5");

  const VERBS = {
    Bloom: {
      "Recordar":   ["Enumerar","Definir","Identificar","Reconocer","Nombrar","Listar"],
      "Comprender": ["Describir","Explicar","Resumir","Clasificar","Interpretar","Ejemplificar"],
      "Aplicar":    ["Aplicar","Usar","Demostrar","Implementar","Resolver","Calcular"],
      "Analizar":   ["Comparar","Diferenciar","Organizar","Relacionar","Examinar","Inferir"],
      "Evaluar":    ["Justificar","Argumentar","Valorar","Criticar","Defender","Comprobar"],
      "Crear":      ["Diseñar","Construir","Planificar","Producir","Formular","Proponer"]
    },
    Marzano: {
      "Recuperar":    ["Recordar","Reconocer","Reproducir","Nombrar","Localizar","Enumerar"],
      "Comprender":   ["Parafrasear","Resumir","Clasificar","Ilustrar","Explicar","Comparar"],
      "Analizar":     ["Generalizar","Especificar","Deducir","Inferir","Analizar errores","Contrastar"],
      "Utilizar":     ["Ejecutar","Implementar","Modelar","Simular","Solucionar","Aplicar estrategias"],
      "Metacognitivo":["Planificar","Monitorear","Regular","Evaluar el proceso","Ajustar","Reflexionar"],
      "Actitudinal":  ["Elegir metas","Persistir","Priorizar","Valorar","Comprometerse","Autoevaluar"]
    }
  };

  let panel = null;
  let currentTarget = null;

  function injectStyles() {
    if (document.getElementById("vh-style")) return;
    const css = `
      .vh-floating{position:absolute;background:#fff;border:1px solid #d9e2f3;border-radius:10px;
        box-shadow:0 10px 30px rgba(0,0,0,.12);width:min(700px,96vw);max-height:65vh;overflow:auto;padding:10px;z-index:9999}
      .vh-head{display:flex;gap:8px;align-items:center;justify-content:space-between;margin-bottom:8px}
      .vh-tabs{display:flex;gap:6px}
      .vh-tab{border:1px solid #bcd3fb;background:#eaf2ff;color:#174a8b;padding:6px 10px;border-radius:8px;cursor:pointer;font-weight:600}
      .vh-tab.active{background:#bcd3fb}
      .vh-close{border:none;background:transparent;font-size:18px;cursor:pointer;color:#174a8b}
      .vh-levels{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}
      .vh-level{border:1px solid #e0e7f5;border-radius:8px;padding:6px 10px;background:#f6f9ff;cursor:pointer}
      .vh-grid{display:grid;grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap:6px; margin-top:8px}
      .vh-verb{border:1px solid #d9e2f3;border-radius:8px;padding:6px 8px;background:#fff;cursor:pointer;text-align:center}
      .vh-verb:hover{background:#eef5ff}
      .vh-highlight{animation:vhFlash 1s ease-in-out}
      @keyframes vhFlash{from{background:#fff9d6} to{background:transparent}}
      .verb-btn{margin-left:6px;padding:2px 8px;cursor:pointer}
    `;
    const style = document.createElement("style");
    style.id = "vh-style";
    style.textContent = css;
    document.head.appendChild(style);
  }

  function buildPanel() {
    if (panel) panel.remove();
    injectStyles();
    panel = document.createElement("div");
    panel.className = "vh-floating";
    panel.innerHTML = `
      <div class="vh-head">
        <div class="vh-tabs">
          <button class="vh-tab active" data-tax="Bloom">Bloom</button>
          <button class="vh-tab" data-tax="Marzano">Marzano</button>
        </div>
        <button class="vh-close" title="Cerrar">✕</button>
      </div>
      <div class="vh-levels"></div>
      <div class="vh-grid"><div style="opacity:.7; padding:6px;">Elige un nivel…</div></div>
    `;
    document.body.appendChild(panel);
    panel.querySelector(".vh-close").addEventListener("click", closePanel);
    panel.addEventListener("click", handleClick);
    renderLevels("Bloom");
  }

  function handleClick(e) {
    const tab = e.target.closest(".vh-tab");
    const level = e.target.closest(".vh-level");
    const verb = e.target.closest(".vh-verb");

    if (tab) {
      panel.querySelectorAll(".vh-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      renderLevels(tab.dataset.tax);
      return;
    }
    if (level) {
      renderVerbList(level.dataset.level, getActiveTax());
      return;
    }
    if (verb) {
      insertVerb(verb.textContent);
      return;
    }
  }

  function getActiveTax() {
    return panel.querySelector(".vh-tab.active")?.dataset.tax || "Bloom";
  }

  function renderLevels(tax) {
    const levels = Object.keys(VERBS[tax]);
    const box = panel.querySelector(".vh-levels");
    const grid = panel.querySelector(".vh-grid");
    box.innerHTML = levels.map(l => `<button class="vh-level" data-level="${l}">${l}</button>`).join("");
    grid.innerHTML = `<div style="opacity:.7; padding:6px;">Elige un nivel de ${tax}…</div>`;
  }

  function renderVerbList(level, tax) {
    const verbs = VERBS[tax][level] || [];
    const grid = panel.querySelector(".vh-grid");
    grid.innerHTML = verbs.map(v => `<button class="vh-verb">${v}</button>`).join("");
  }

  function insertVerb(v) {
    if (!currentTarget) return;
    const el = currentTarget;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const before = el.value.slice(0, start);
    const after = el.value.slice(end);
    const needsB = before && !/\s$/.test(before);
    const needsA = after && !/^\s/.test(after);
    el.value = before + (needsB ? " " : "") + v + (needsA ? " " : "") + after;
    el.focus();
    el.classList.add("vh-highlight");
    setTimeout(() => el.classList.remove("vh-highlight"), 800);
  }

  function openPanelFor(el) {
    currentTarget = el;
    buildPanel();
    const rect = el.getBoundingClientRect();
    const panelHeight = 360;
    let top = window.scrollY + rect.bottom + 8;
    if (rect.bottom + panelHeight > window.innerHeight) {
      top = window.scrollY + rect.top - panelHeight - 12;
    }
    const left = Math.min(
      window.scrollX + rect.left,
      window.scrollX + document.documentElement.clientWidth - 720
    );
    panel.style.top = `${top}px`;
    panel.style.left = `${left}px`;
  }

  function closePanel() {
    if (panel) panel.remove();
    panel = null;
    currentTarget = null;
  }

  function attachHelpButtons() {
    document.querySelectorAll(".criterion-row textarea, .criterion-row .criterio").forEach((ta) => {
      if (ta.nextSibling && ta.nextSibling.classList && ta.nextSibling.classList.contains("verb-btn")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "💡 Verbos";
      btn.className = "verb-btn";
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        openPanelFor(ta);
      });
      ta.insertAdjacentElement("afterend", btn);
    });
  }

  const list = document.getElementById("criteria-list");
  if (list) {
    const obs = new MutationObserver(() => attachHelpButtons());
    obs.observe(list, { childList: true, subtree: true });
  }

  document.addEventListener("DOMContentLoaded", attachHelpButtons);
  window.addEventListener("load", () => setTimeout(attachHelpButtons, 400));
  document.addEventListener("elma-ensure-verb-bind", attachHelpButtons);
})();
