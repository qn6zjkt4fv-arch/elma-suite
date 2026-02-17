// exporter.js — VERSIÓN FINAL CORREGIDA
// Header solo en primera página + columnas correctas + landscape

(function (global) {

  const Engine = window.PlannerEngine;

  /* ========== Utilidades ========== */

  function esc(s) {
    try {
      if (s && typeof s === "object" && "value" in s) s = s.value;
      if (typeof s !== "string") s = String(s ?? "");
      return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    } catch { return ""; }
  }

  function toParagraphs(raw, mode) {
    if (!raw) return "";
    let txt = raw
      .replace(/[\u2022\u2023\u25E6\u2043\u2219\-–—]/g, '\n')
      .replace(/;\s*/g, '\n')
      .replace(/\.\s*/g, '\n')
      .replace(/\n{2,}/g, '\n');

    if (mode === "inf") txt = txt.replace(/\by\s+(?=[A-Za-zÁÉÍÓÚÜáéíóúüñÑ]{3,}(?:ar|er|ir)\b)/g, '\n');
    if (mode === "3p") txt = txt.replace(/\by\s+(?=[A-Za-zÁÉÍÓÚÜáéíóúüñÑ]{4,}[ae]\b)/g, '\n');

    const parts = txt.split(/\n+/).map(s => s.trim()).filter(Boolean);
    return parts.map(p => `<p>${esc(p)}</p>`).join("");
  }

  /* ========== Estilos ========== */

  function baseHead() {
    return (
      '<!DOCTYPE html><html><head>' +
      '<meta charset="UTF-8"><title>Planeamiento</title>' +
      '<style>' +
      'body{font-family:Arial,Helvetica,sans-serif;font-size:12pt;line-height:1.3;margin:25px;}' +
      'table{border-collapse:collapse;width:100%;}' +
      'th,td{border:1px solid #000;padding:8px;vertical-align:middle;text-align:center;}' +
      'th{background:#f2f2f2;}' +
      '.portada{text-align:center;margin-bottom:40px;}' +

      '@media print {' +
      '  @page { size: letter landscape; margin: 1.8cm; }' +
      '  .portada { page-break-after: always; }' +
      '  .matriz { page-break-before: always; }' +
      '  table { page-break-inside: auto; }' +
      '  tr { page-break-inside: avoid; }' +
      '  thead { display: table-header-group; }' +
      '}' +
      '</style>' +
      '</head><body>'
    );
  }

  function htmlAdmin(data, mode) {
    return `<div class="portada">` +
      `<img src="logo-elma.png" alt="Logo" style="height:55px;">` +
      `<h2>Instituto Figlie di Maria Ausiliatrice</h2>` +
      `<p>Escuela Liceo María Auxiliadora - San José - Costa Rica</p>` +
      `<p>Docente: ${esc(data.docente)}</p>` +
      `<p>Asignatura: ${esc(data.asignatura)}</p>` +
      (mode === "didactico" ? `<p>Tema: ${esc(data.tema)}</p>` : '') +
      `<p>Nivel: ${esc(data.nivel)}</p>` +
      `<p>Ciclo: ${data.ciclo}</p>` +
      (mode === "academico" ? `<p>Periodicidad: ${esc(data.periodicidad)}</p>` : 
      `<p>Período: del ${esc(data.periodo_del)} al ${esc(data.periodo_al)} | Lecciones: ${esc(data.lecciones)}</p>`) +
      `<h1>Planeamiento ${mode === "academico" ? "Académico" : "Didáctico"}</h1>` +
      `</div>`;
  }

  /* ========== ACADÉMICO (campos corregidos) ========== */
  function htmlAcademico(acad) {
    let html = htmlAdmin(acad, "academico") +
      '<table class="matriz">' +
      '<thead><tr>' +
      '<th>Unidad</th>' +
      '<th>Objetivo general de la unidad</th>' +
      '<th>Objetivo específico</th>' +
      '<th>Contenidos</th>' +
      '<th>Estrategias de mediación</th>' +
      '<th>Tiempo</th>' +
      '</tr></thead><tbody>';

    acad.matriz.forEach(row => {
      html += '<tr>' +
        `<td>${esc(row.unidad)}</td>` +
        `<td>${toParagraphs(row.obj_gen, "3p")}</td>` +
        `<td>${toParagraphs(row.obj_esp, "inf")}</td>` +
        `<td>${toParagraphs(row.contenidos, "3p")}</td>` +
        `<td>${toParagraphs(row.estrategias, "3p")}</td>` +
        `<td>${esc(row.tiempo)}</td>` +
        '</tr>';
    });

    html += '</tbody></table>';
    return html;
  }

  /* ========== DIDÁCTICO (solo 3 columnas + campo correcto) ========== */
  function htmlDidactico(did) {
    let html = htmlAdmin(did, "didactico") +
      '<table class="matriz">' +
      '<thead><tr>' +
      '<th>Aprendizajes esperados</th>' +
      '<th>Estrategias de mediación</th>' +
      '<th>Indicadores / criterios de aprendizaje</th>' +
      '</tr></thead><tbody>';

    did.matriz.forEach(row => {
      html += '<tr>' +
        `<td>${toParagraphs(row.ae, "3p")}</td>` +
        `<td>${toParagraphs(row.estrategias, "3p")}</td>` +
        `<td>${toParagraphs(row.indicadores, "3p")}</td>` +
        '</tr>';
    });

    html += '</tbody></table>';
    return html;
  }

  function build(mode) {
    const state = {
      academico: Engine.readAcademicoFromDOM(),
      didactico: Engine.readDidacticoFromDOM()
    };

    const data = state[mode];
    if (!data) return null;

    return baseHead() +
           (mode === "academico" ? htmlAcademico(data) : htmlDidactico(data)) +
           '</body></html>';
  }

  function preview(mode) {
    try {
      const html = build(mode);
      if (!html) { alert("No se pudo generar la previsualización."); return; }
      const win = window.open("", "_blank");
      win.document.write(html); win.document.close(); win.focus();
    } catch (e) { console.error(e); alert("Error en previsualización."); }
  }

  function exportWord(mode) {
    try {
      const html = build(mode);
      const blob = new Blob([html], { type: "application/msword" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = (mode === "academico") ? "planeamiento_academico.doc" : "planeamiento_didactico.doc";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 500);
    } catch (e) { console.error(e); alert("Error al exportar a Word."); }
  }

  function exportPrint(mode) {
    try {
      const html = build(mode);
      const win = window.open("", "_blank");
      win.document.write(html); win.document.close(); win.focus(); win.print();
    } catch (e) { console.error(e); alert("Error al imprimir."); }
  }

  window.PlaneamientoExporter = { preview, exportWord, exportPrint };

  console.log("Exporter FINAL: columnas correctas, landscape, header solo en página 1.");

})(window);