/* ============================================================
   exporter.js — v0.5 Institucional (sin duplicar encabezado + header solo en primera página con .first-page blindado)
   ============================================================ */
(function () {
  console.log("🟦 exporter.js v0.5 (header solo en primera página con .first-page blindado)");

  const exportPDFBtn = document.getElementById("export-pdf") || document.getElementById("exportPDF");
  const exportDOCBtn = document.getElementById("export-word") || document.getElementById("export-doc");
  const exportJSONBtn = document.getElementById("export-json");
  const printViewBtn  = document.getElementById("print-view");

  function generateRubricHTMLFromPreview() {
    const preview = document.getElementById("preview-area") || document.getElementById("rubric-preview");
    if (!preview || !preview.innerHTML.trim()) {
      alert("⚠️ No hay contenido en Vista previa. Use '👁️ Vista previa' antes de exportar.");
      return null;
    }
    const bodyHTML = preview.innerHTML;
    const fullHTML = `
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Rúbrica ELMA Secundaria</title>
          <style>
            @page { size: letter; margin: 2cm; }
            body { font-family: Arial, sans-serif; font-size: 13px; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 10px; }
            th, td { border: 1px solid #444; padding: 6px; text-align: left; vertical-align: top; }
            th { background-color: #f0f0f0; }
            h2, h3 { margin: 0; }
            /* Nuevo: Header administrativo solo en primera página (con fuerza corte y .first-page) */
            @media print {
              @page { size: letter; margin: 2cm; }
              .first-page { page-break-after: always; } /* Fuerza corte después de admin + título */
              .admin { page-break-after: avoid; } /* Admin pegado al título */
              h2 { page-break-after: avoid; } /* Título pegado a admin */
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
              thead { display: table-header-group; } /* Repite solo columnas en p2+ */
              tfoot { display: table-footer-group; }
            }
          </style>
        </head>
        <body>${bodyHTML}</body>
      </html>`;
    return fullHTML;
  }

  function exportToPDF() {
    const content = generateRubricHTMLFromPreview();
    if (!content) return;
    const win = window.open("", "_blank");
    win.document.write(content);
    win.document.close();
    win.print();
  }

  function exportToDOC() {
    const content = generateRubricHTMLFromPreview();
    if (!content) return;
    const blob = new Blob(["\ufeff", content], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Rubrica_ELMA_Secundaria.doc";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function exportCurrentRubricJSON() {
    const rows = document.querySelectorAll(".criterion-row");
    const data = [];
    rows.forEach((row) => {
      data.push({
        criterio: row.querySelector(".criterio")?.value || "",
        nivel4:   row.querySelector(".nivel-4")?.value || "",
        nivel3:   row.querySelector(".nivel-3")?.value || "",
        nivel2:   row.querySelector(".nivel-2")?.value || "",
        nivel1:   row.querySelector(".nivel-1")?.value || ""
      });
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "rubrica.json";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function openPrintView() {
    const content = generateRubricHTMLFromPreview();
    if (!content) return;
    const win = window.open("", "_blank");
    win.document.write(content);
    win.document.close();
  }

  if (exportPDFBtn)  exportPDFBtn.addEventListener("click", exportToPDF);
  if (exportDOCBtn)  exportDOCBtn.addEventListener("click", exportToDOC);
  if (exportJSONBtn) exportJSONBtn.addEventListener("click", exportCurrentRubricJSON);
  if (printViewBtn)  printViewBtn.addEventListener("click", openPrintView);
})();