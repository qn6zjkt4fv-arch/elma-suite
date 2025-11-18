// exporter.js — centrado horizontal y vertical en celdas + encabezado institucional + merge jerárquico + párrafos
// Solo afecta los productos finales (preview / Word / PDF). No toca la interfaz de edición.

(function (global) {

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

  /* ========== Estilos base y encabezado ========== */

  function baseHead() {
    return (
      '<!DOCTYPE html><html><head>' +
      '<meta charset="UTF-8"><title>Planeamiento</title>' +
      '<style>' +
      'body{font-family:Arial,Helvetica,sans-serif;font-size:12pt;line-height:1.3;margin:30px;}' +
      'h1{font-size:16pt;margin:8px 0 4px;}' +
      'h2{font-size:14pt;margin:16px 0 6px;}' +
      'table{width:100%;border-collapse:collapse;margin-top:6px;}' +
      'th,td{border:1px solid #999;padding:6px;vertical-align:top;}' +
      'thead th{background:#f2f2f2;}' +
      /* 👉 Centrado horizontal y vertical en TODAS las celdas y encabezados */
      'table th, table td { text-align:center; vertical-align:middle; }' +
      /* Encabezado centrado */
      '.logo-header{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;margin-bottom:8px;}' +
      '.logo-header img{height:52px;margin-bottom:4px;}' +
      '.logo-text{font-size:10pt;line-height:1.25;}' +
      '.logo-text strong{display:block;}' +
      /* Tabla administrativa en azul con texto blanco */
      '.table-admin th,.table-admin td{background:#0e7be7;color:#ffffff;border-color:#0b5fb5;}' +
      '.table-admin th{font-weight:bold;}' +
      /* Párrafos dentro de celdas (heredan centrado y vertical-middle) */
      'td p{margin:0 0 6px 0;}' +
      '</style></head><body>'
    );
  }

  function headerWithLogo(titulo) {
    return (
      '<div class="logo-header">' +
        '<img src="logo-elma.png" alt="Logo FMA">' +
        '<div class="logo-text">' +
          '<div>Ministerio de Educación Pública</div>' +
          '<strong>Escuela Liceo María Auxiliadora de San José</strong>' +
          '<div>Instituto de las Hijas de María Auxiliadora</div>' +
        '</div>' +
      '</div>' +
      '<h1>' + esc(titulo) + '</h1>'
    );
  }

  /* ========== Académico con merge jerárquico ========== */

  function buildAcadRowsMerged(matriz) {
    if (!Array.isArray(matriz) || matriz.length === 0) return "";

    let html = "";
    let i = 0;

    while (i < matriz.length) {
      // Grupo por UNIDAD
      const unidadNorm = norm(matriz[i].unidad);
      const startUnidad = i;
      let j = i + 1;
      while (j < matriz.length && norm(matriz[j].unidad) === unidadNorm) j++;
      const endUnidad = j;
      const spanUnidad = endUnidad - startUnidad;

      // Dentro: subgrupos por OBJ. GENERAL
      let u = startUnidad;
      let printedUnidad = false;

      while (u < endUnidad) {
        const objNorm = norm(matriz[u].obj_gen);
        const startObj = u;
        let v = u + 1;
        while (v < endUnidad && norm(matriz[v].obj_gen) === objNorm) v++;
        const endObj = v;
        const spanObj = endObj - startObj;

        for (let k = startObj; k < endObj; k++) {
          const r = matriz[k];
          html += "<tr>";

          if (!printedUnidad) {
            html += '<td rowspan="' + spanUnidad + '">' + esc(matriz[startUnidad].unidad) + '</td>';
            printedUnidad = true;
          }
          if (k === startObj) {
            html += '<td rowspan="' + spanObj + '">' + esc(matriz[startObj].obj_gen) + '</td>';
          }

          html += '<td>' + toParagraphs(r.obj_esp, "inf") + '</td>';
          html += '<td>' + esc(r.contenidos) + '</td>';
          html += '<td>' + esc(r.estrategias) + '</td>';
          html += '<td>' + esc(r.tiempo) + '</td>';

          html += "</tr>";
        }

        u = endObj;
      }

      i = endUnidad;
    }

    return html;
  }

  function htmlAcademico(ac) {
    const filas = buildAcadRowsMerged(ac.matriz || []);
    return (
      baseHead() +
      headerWithLogo("Planeamiento Académico") +
      '<table class="table-admin">' +
        '<tr><th>Docente</th><td>' + esc(ac.docente) + '</td>' +
            '<th>Asignatura</th><td>' + esc(ac.asignatura) + '</td></tr>' +
        '<tr><th>Nivel</th><td>' + esc(ac.nivel) + '</td>' +
            '<th>Ciclo lectivo</th><td>' + esc(ac.ciclo) + '</td></tr>' +
        '<tr><th>Periodicidad</th><td colspan="3">' + esc(ac.periodicidad) + '</td></tr>' +
      '</table>' +
      '<h2>Unidades</h2>' +
      '<table>' +
        '<thead><tr>' +
          '<th>Unidad</th>' +
          '<th>Objetivo general de la unidad</th>' +
          '<th>Objetivo específico</th>' +
          '<th>Contenidos</th>' +
          '<th>Estrategias de mediación</th>' +
          '<th>Tiempo</th>' +
        '</tr></thead>' +
        '<tbody>' + filas + '</tbody>' +
      '</table>' +
      '</body></html>'
    );
  }

  /* ========== Didáctico con párrafos en Indicadores ========== */

  function htmlDidactico(d) {
    const filas = (d.matriz || []).map(r => (
      "<tr>" +
        "<td>" + esc(r.ae) + "</td>" +
        "<td>" + esc(r.estrategias) + "</td>" +
        "<td>" + toParagraphs(r.indicadores, "3p") + "</td>" +
      "</tr>"
    )).join("");

    return (
      baseHead() +
      headerWithLogo("Planeamiento Didáctico") +
      '<table class="table-admin">' +
        '<tr><th>Docente</th><td>' + esc(d.docente) + '</td>' +
            '<th>Asignatura</th><td>' + esc(d.asignatura) + '</td></tr>' +
        '<tr><th>Tema</th><td>' + esc(d.tema) + '</td>' +
            '<th>Nivel</th><td>' + esc(d.nivel) + '</td></tr>' +
        '<tr><th>Ciclo lectivo</th><td>' + esc(d.ciclo) + '</td>' +
            '<th>Período</th><td>' + esc(d.periodo_del) + ' a ' + esc(d.periodo_al) + '</td></tr>' +
        '<tr><th>Cantidad de lecciones</th><td colspan="3">' + esc(d.lecciones) + '</td></tr>' +
      '</table>' +
      '<h2>Matriz didáctica</h2>' +
      '<table>' +
        '<thead><tr>' +
          '<th>Aprendizajes esperados</th>' +
          '<th>Estrategias de mediación</th>' +
          '<th>Indicadores / criterios de aprendizaje</th>' +
        '</tr></thead>' +
        '<tbody>' + filas + '</tbody>' +
      '</table>' +
      '</body></html>'
    );
  }

  /* ========== Construcción y acciones ========== */

  function build(mode) {
    const Engine = global.PlannerEngine;
    if (!Engine) return "";
    const ac = Engine.readAcademicoFromDOM();
    const did = Engine.readDidacticoFromDOM();
    return mode === "academico" ? htmlAcademico(ac) : htmlDidactico(did);
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

  console.log("Exporter: centrado horizontal y vertical activo, merge jerárquico y párrafos.");

})(window);
