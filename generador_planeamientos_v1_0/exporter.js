// exporter.js — centrado horizontal y vertical en celdas + encabezado institucional + merge jerárquico + párrafos
// Solo afecta los productos finales (preview / Word / PDF). No toca la interfaz de edición.
// Modificado: Header administrativo solo en primera página (con fuerza corte y .first-page blindado).
// Fix: Definir Engine como window.PlannerEngine para evitar ReferenceError

(function (global) {

  const Engine = window.PlannerEngine;
  if (!Engine) {
    console.error("PlannerEngine no definido. Verifica planner-engine.js");
    alert("PlannerEngine no cargado.");
  }

  /* ========== Utilidades ========== */

  function esc(s) {
    try {
      if (s && typeof s === "object" && "value" in s) s = s.value;
      if (typeof s !== "string") s = String(s ?? "");
      return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    } catch { return ""; }
  }

  function norm(str) {
    return (str || "").toString().replace(/\s+/g, " ").trim();
  }

  // mode: "inf" (objetivos específicos con infinitivo) | "3p" (indicadores 3ª persona)
  function toParagraphs(raw, mode) {
    if (!raw) return "";
    let txt = raw
      .replace(/[\u2022\u2023\u25E6\u2043\u2219\-–—]/g, '\n') // bullets/guiones → salto
      .replace(/;\s*/g, '\n')  // ; → salto
      .replace(/\.\s*/g, '\n') // . → salto
      .replace(/\n{2,}/g, '\n');

    if (mode === "inf") {
      txt = txt.replace(/\by\s+(?=[A-Za-zÁÉÍÓÚÜáéíóúüñÑ]{3,}(?:ar|er|ir)\b)/g, '\n');
    } else if (mode === "3p") {
      txt = txt.replace(/\by\s+(?=[A-Za-zÁÉÍÓÚÜáéíóúüñÑ]{4,}[ae]\b)/g, '\n');
    }

    const parts = txt
      .split(/\n+/)
      .map(s => s.replace(/\s+/g, ' ').trim())
      .filter(Boolean);

    return parts.map(p => `<p>${esc(p)}</p>`).join("");
  }

  /* ========== Estilos base y encabezado (modificado para compatibilidad print con fuerza corte y .first-page) ========== */

  function baseHead() {
    return (
      '<!DOCTYPE html><html><head>' +
      '<meta charset="UTF-8"><title>Planeamiento</title>' +
      '<style>' +
      'body{font-family:Arial,Helvetica,sans-serif;font-size:11pt;line-height:1.2;margin:20px;}' +
      'h1{text-align:center;margin:20px 0;}' +
      'table{border-collapse:collapse;width:100%;}' +
      'th,td{border:1px solid #000;padding:8px;vertical-align:middle;text-align:center;}' +
      'th{background:#f2f2f2;}' +
      'p{margin:4px 0;}' +
      '.admin{margin-bottom:20px;text-align:center;}' +
      '.matriz th:first-child,.matriz td:first-child{text-align:left;}' + // Ajustes adicionales si necesario
      '.matriz{font-size:10pt;}' +
      // Nuevo CSS para print: Admin + título en p1, fuerza corte después para p2+
      '@media print {' +
      '  @page { size: letter landscape; margin: 1.5cm; }' +
      '  table { page-break-inside: auto; }' +
      '  tr { page-break-inside: avoid; page-break-after: auto; }' +
      '  thead { display: table-header-group; }' +
      '  tfoot { display: table-footer-group; }' +
      '}' +

      '</style>' +
      '</head><body>'
    );
  }

  /* ========== Generadores de HTML ========== */

  function htmlAdmin(data, mode) {
    return `<div class="admin">` +
      `<img src="logo-elma.png" alt="Logo ELMA" style="height:50px;">` +
      `<h2>Instituto Figlie di Maria Ausiliatrice</h2>` +
      `<p>Escuela Liceo María Auxiliadora - San José - Costa Rica</p>` +
      `<p>Docente: ${esc(data.docente)}</p>` +
      `<p>Asignatura: ${esc(data.asignatura)}</p>` +
      (mode === "didactico" ? `<p>Tema: ${esc(data.tema)}</p>` : '') +
      `<p>Nivel: ${esc(data.nivel)}</p>` +
      `<p>Ciclo: ${data.ciclo}</p>` +
      (mode === "academico" ? `<p>Periodicidad: ${esc(data.periodicidad)}</p>` : 
      `<p>Periodo: del ${esc(data.periodo_del)} al ${esc(data.periodo_al)} | Lecciones: ${esc(data.lecciones)}</p>`) +
      `</div>`;
  }

  function htmlAcademico(acad) {
    let html = '<div class="first-page">' + // Wrap admin + h1 para corte after
      htmlAdmin(acad, "academico") +
      '<h1>Planeamiento Académico</h1>' +
      '</div>' +
      '<table class="matriz">' +
      '<thead><tr>' +
      '<th>Unidad</th><th>Objetivo general</th><th>Objetivo específico</th><th>Contenidos</th><th>Estrategias de mediación</th><th>Tiempo</th>' +
      '</tr></thead><tbody>';

    acad.matriz.forEach(row => {
      html += '<tr>' +
        `<td>${esc(row.unidad)}</td>` +
        `<td>${toParagraphs(row.obj_general, "3p")}</td>` +
        `<td>${toParagraphs(row.obj_especifico, "inf")}</td>` +
        `<td>${toParagraphs(row.contenidos, "3p")}</td>` +
        `<td>${toParagraphs(row.estrategias, "3p")}</td>` +
        `<td>${esc(row.tiempo)}</td>` +
        '</tr>';
    });

    html += '</tbody></table>';
    return html;
  }

  function htmlDidactico(did) {
    let html = '<div class="first-page">' + // Wrap admin + h1 para corte after
      htmlAdmin(did, "didactico") +
      '<h1>Planeamiento Didáctico</h1>' +
      '</div>' +
      '<table class="matriz">' +
      '<thead><tr>' +
      '<th>Aprendizaje esperado</th><th>Indicadores de logro</th><th>Estrategias de mediación</th><th>Criterios de evaluación</th><th>Tiempo</th>' +
      '</tr></thead><tbody>';

    did.matriz.forEach(row => {
      html += '<tr>' +
        `<td>${toParagraphs(row.aprendizaje, "3p")}</td>` +
        `<td>${toParagraphs(row.indicadores, "3p")}</td>` +
        `<td>${toParagraphs(row.estrategias, "3p")}</td>` +
        `<td>${toParagraphs(row.criterios, "3p")}</td>` +
        `<td>${esc(row.tiempo)}</td>` +
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

  const content = (mode === "academico")
    ? htmlAcademico(data)
    : htmlDidactico(data);

  return baseHead() + content + '</body></html>';
}

  function preview(mode) {
    try {
      const html = build(mode);
      if (!html) { alert("No se pudo generar la previsualización."); return; }
      const win = window.open("", "_blank");
      if (!win) { alert("El navegador bloqueó la ventana emergente."); return; }
      win.document.open(); win.document.write(html); win.document.close(); win.focus();
    } catch (e) { console.error(e); alert("Error al generar la previsualización."); }
  }

  function exportWord(mode) {
    try {
      const html = build(mode);
      if (!html) { alert("No se pudo generar el documento Word."); return; }
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
      if (!html) { alert("No se pudo preparar la impresión."); return; }
      const win = window.open("", "_blank");
      if (!win) { alert("El navegador bloqueó la ventana emergente."); return; }
      win.document.open(); win.document.write(html); win.document.close(); win.focus(); win.print();
    } catch (e) { console.error(e); alert("Error al imprimir."); }
  }

  window.PlaneamientoExporter = { preview, exportWord, exportPrint };

  console.log("Exporter: centrado horizontal y vertical activo, merge jerárquico y párrafos. Header solo en primera página (con .first-page blindado).");

})(window);