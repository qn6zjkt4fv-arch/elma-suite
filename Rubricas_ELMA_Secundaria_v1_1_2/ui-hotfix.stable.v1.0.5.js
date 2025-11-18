
// ====================================================================
// ui-hotfix.stable.v1.0.5.js
// - ÚNICA ruta estable de impresión: "Imprimir (con encabezado)"
// - Espera la carga de imágenes (logo) en la ventana de impresión ANTES de imprimir
// - Hotkeys: Ctrl+Alt+P (imprimir), Ctrl+Alt+B (abrir panel de Branding si existe)
// - Botón flotante opcional (ocultable) para imprimir con encabezado
// - NO toca/rompe tu panel original; no introduce "solo área"
// ====================================================================
(function Hotfix105(){
  if (!window.Branding) window.Branding = {};

  const LS_ROOT     = "brandHeaderRootSelector";
  const LS_HIDE_BTN = "brandPrintHeadOnlyHidden";

  // ---------- Utils
  function getRootSelector(){
    try { return localStorage.getItem(LS_ROOT) || ""; } catch { return ""; }
  }
  function setRootSelector(sel){
    try { sel ? localStorage.setItem(LS_ROOT, sel) : localStorage.removeItem(LS_ROOT); } catch {}
  }
  function ensureDefaultRoot(){
    if (!getRootSelector() && document.getElementById("preview-area")) {
      setRootSelector("#preview-area");
    }
  }
  function ensurePreviewVisible(run){
    const rootSel = getRootSelector() || "#preview-area";
    const el = document.querySelector(rootSel) || document.getElementById("preview-area") || null;
    if (!el) { run(); return; }

    const wasHidden = el.classList && el.classList.contains("hidden");
    const prevDisplay = el.style ? el.style.display : undefined;

    if (wasHidden) el.classList.remove("hidden");
    if (getComputedStyle(el).display === "none") el.style.display = "block";

    try { run(el); }
    finally {
      const restore = () => {
        if (el) {
          if (prevDisplay !== undefined) el.style.display = prevDisplay;
          if (wasHidden) el.classList.add("hidden");
        }
        window.removeEventListener("afterprint", restore);
      };
      window.addEventListener("afterprint", restore);
      setTimeout(() => { try { const evt = new Event("afterprint"); window.dispatchEvent(evt); } catch {} }, 1200);
    }
  }

  // ---------- Header inline (reconstruido en cada impresión)
  function buildHeaderHTMLInline() {
    let hdr = {}, cfg = {}, logo = "";
    try { hdr  = JSON.parse(localStorage.getItem("brandHeaderConfig")||"{}"); } catch {}
    try { cfg  = JSON.parse(localStorage.getItem("brandLogoConfig")||"{}"); } catch {}
    try { logo = localStorage.getItem("brandLogoDataURL") || ""; } catch {}

    const enabled = hdr.enabled !== false; // ON por defecto
    if (!enabled) return "";

    const fs   = hdr.fontSizePT ?? 12;
    const lh   = hdr.lineHeight ?? 1.28;
    const pad  = hdr.paddingMM ?? 6;
    const side = hdr.sideMM ?? 12;
    const gap  = hdr.gapMM ?? 2;
    const lw   = hdr.logoWidthMM ?? 26;
    const align= hdr.align === "left" ? "flex-start" : "center";
    const pageMargin = cfg.pageMarginMM ?? 12;
    const wantLogo   = hdr.logoInHeader !== false && !!logo;

    return `
      <style>@page{margin:${pageMargin}mm}</style>
      <div id="brand-print-header" class="brand-print-header" style="
        display:block;width:100%;box-sizing:border-box;margin:0;
        padding:${pad}mm ${side}mm;background:#fff;color:#222;
        font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
        ${hdr.border ? 'border-top:1px solid #999;border-bottom:1px solid #999;' : ''}
      ">
        <div style="display:flex;align-items:center;justify-content:${align};gap:${gap}mm">
          ${wantLogo ? `<img id="brand-print-logo" style="width:${lw}mm;height:auto;max-height:40mm" src="${logo}" alt="Logo">` : ""}
          <div style="display:flex;flex-direction:column;align-items:${align==='flex-start'?'flex-start':'center'}">
            <div style="font-weight:${hdr.weightTitle ?? 700};font-size:${fs}pt;line-height:${lh};margin:0">
              ${hdr.title || "Escuela Liceo María Auxiliadora de San José"}
            </div>
            <div style="font-weight:${hdr.weightSubtitle ?? 600};font-size:${Math.round(fs*0.92)}pt;line-height:${lh};margin-top:${gap}mm">
              ${hdr.subtitle || "Ministerio de Educación Pública – Costa Rica"}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ---------- CSS Reset impresión (ventana)
  const RESET_CSS = `
    @page { size:auto; }
    @media print {
      html, body { height:auto !important; overflow:visible !important; background:#fff !important; }
      * { background-image:none !important; }
      #print-root, .rubric-container, #preview-area, .preview-area,
      .rubric, .page, .paper, .print-area, .printable,
      .viewport, .scroll, [data-scroll], .pane, .workspace, .tabview,
      .content, .content-inner, .container, .wrapper {
        position: static !important;
        height: auto !important;
        max-height: none !important;
        overflow: visible !important;
        box-shadow: none !important;
        transform: none !important;
      }
      table, thead, tbody, tr, td, th {
        height: auto !important;
        max-height: none !important;
        overflow: visible !important;
      }
    }
  `;

  // ---------- Print con espera de imágenes (logo)
  function headOnlyPrintWindow(){
    ensureDefaultRoot();
    ensurePreviewVisible((srcEl) => {
      const rootSel = getRootSelector() || "#preview-area";
      const src = srcEl || document.querySelector(rootSel) || document.getElementById("preview-area") || document.body;
      const cssBrand = (document.getElementById("brand-style")?.textContent || "");
      const headerHTML = buildHeaderHTMLInline();

      const w = window.open("", "_blank");
      w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Imprimir</title>
        <style>${cssBrand}\n${RESET_CSS}</style></head>
        <body>${headerHTML}${src.outerHTML}
          <script>
            (function(){
              function whenImagesReady(doc, done){
                var imgs = Array.prototype.slice.call(doc.images || []);
                if (!imgs.length) return done();
                var pending = 0;
                imgs.forEach(function(img){
                  // contar solo imágenes visibles/útiles
                  if (!img) return;
                  pending++;
                  if (img.complete && img.naturalWidth > 0) { pending--; return; }
                  img.addEventListener('load', function(){ pending--; if (pending<=0) done(); }, {once:true});
                  img.addEventListener('error', function(){ pending--; if (pending<=0) done(); }, {once:true});
                });
                if (pending<=0) return done();
                setTimeout(function(){ if (pending>0) done(); }, 1200); // fallback 1.2s
              }
              function go(){
                whenImagesReady(document, function(){
                  try { window.focus(); } catch(e) {}
                  try { window.print(); } catch(e) {}
                });
              }
              if (document.readyState === 'complete' || document.readyState === 'interactive') go();
              else window.addEventListener('DOMContentLoaded', go, {once:true});
            })();
          <\/script>
        </body></html>`);
      w.document.close();
    });
  }

  // Publica el método canónico
  window.Branding.printNow = headOnlyPrintWindow;

  // ---------- Botón flotante (opcional)
  function ensureHeadButton(){
    if (localStorage.getItem(LS_HIDE_BTN)==="1") return;
    if (document.getElementById("brand-print-headonly-btn")) return;
    const btn = document.createElement("button");
    btn.id = "brand-print-headonly-btn";
    btn.type = "button";
    btn.textContent = "🖨️ Imprimir (con encabezado)";
    btn.style.cssText = [
      "position: fixed; right: 12px; bottom: 12px; z-index: 2147483605;",
      "background: #1f2937; color: #fff; border: none; border-radius: 999px;",
      "padding: 10px 14px; font: 13px/1 system-ui,Segoe UI,Roboto,Helvetica,Arial;",
      "box-shadow: 0 6px 16px rgba(0,0,0,.25); cursor: pointer; opacity: .95;"
    ].join(" ");
    btn.onclick = headOnlyPrintWindow;
    document.body.appendChild(btn);
  }

  // ---------- Hotkeys
  function installHotkeys(){
    document.addEventListener("keydown", (ev) => {
      if (!(ev.ctrlKey && ev.altKey)) return;
      const k = (ev.key || "").toLowerCase();
      if (k === "p") { ev.preventDefault(); headOnlyPrintWindow(); }
      if (k === "b") {
        if (typeof window.Branding.openPanel === "function") {
          ev.preventDefault();
          try { window.Branding.openPanel(); } catch {}
        }
      }
    });
  }

  // ---------- Remueve botones legacy "solo área" por ID si aún existen
  function removeLegacyButtons(){
    ["brand-print-scope-btn","brand-print-scope-btn-v2"].forEach(id=>{
      const el = document.getElementById(id);
      if (el) el.remove();
    });
  }

  // ---------- Arranque
  function start(){
    ensureDefaultRoot();
    removeLegacyButtons();
    ensureHeadButton();
    installHotkeys();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
