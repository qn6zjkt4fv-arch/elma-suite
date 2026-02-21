/* ============================================================
   app.js — v1.4 Institucional (CORREGIDO + ARCHIVADO EN CARPETA)
   - Campo “Número de Proceso Administrativo”
   - Importación de indicadores DESDE BOTÓN (ELMA)
   - Archivado automático en carpeta local o descarga fallback
   ============================================================ */

(function () {
  console.log("🟦 app.js institucional v1.4 iniciado (con archivado en carpeta)");

  // ─────────────────────────────────────────
  // UTILIDADES PARA ARCHIVADO EN CARPETA (File System Access API + fallback)
  // ─────────────────────────────────────────
  async function getArchiveDirectory() {
    let dirHandle;
    try {
      // Intenta recuperar handle persistente de IndexedDB
      const db = await new Promise((res, rej) => {
        const req = indexedDB.open('ElmaSuiteDB', 1);
        req.onupgradeneeded = e => e.target.result.createObjectStore('handles');
        req.onsuccess = e => res(e.target.result);
        req.onerror = rej;
      });
      const tx = db.transaction('handles', 'readonly');
      const store = tx.objectStore('handles');
      dirHandle = await new Promise((res, rej) => {
        const getReq = store.get('archiveDirRubricas'); // key exclusiva para rúbricas
        getReq.onsuccess = () => res(getReq.result);
        getReq.onerror = rej;
      });

      if (dirHandle) {
        // Verifica permiso persistente
        if (await dirHandle.queryPermission({ mode: 'readwrite' }) !== 'granted') {
          if (await dirHandle.requestPermission({ mode: 'readwrite' }) !== 'granted') {
            dirHandle = null; // Denegado, fallback
          }
        }
      }

      if (!dirHandle) {
        // Pide seleccionar carpeta (primera vez)
        dirHandle = await window.showDirectoryPicker();
        if (!dirHandle) throw new Error('Usuario canceló selección');

        // Guarda handle en IndexedDB
        const txWrite = db.transaction('handles', 'readwrite');
        const storeWrite = txWrite.objectStore('handles');
        await new Promise((res, rej) => {
          const putReq = storeWrite.put(dirHandle, 'archiveDirRubricas');
          putReq.onsuccess = res;
          putReq.onerror = rej;
        });
      }
      return dirHandle;
    } catch (err) {
      console.warn('File System Access no disponible o denegado:', err);
      return null; // Fallback a descarga
    }
  }

  function downloadAsJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'rubrica.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Exponer funciones para que rubric-engine.js las use
  window.getArchiveDirectory = getArchiveDirectory;
  window.downloadAsJSON = downloadAsJSON;

  /* ============================================================
     🔵 IMPORTAR INDICADORES DESDE PLANEAMIENTOS (ELMA) — VERSIÓN FINAL
     ============================================================ */

  document.addEventListener("DOMContentLoaded", () => {

    const btnImportFromPlan = document.getElementById("import-from-plan");

    if (btnImportFromPlan) {
      btnImportFromPlan.addEventListener("click", () => {
        try {
          const raw = localStorage.getItem("elma_rubric_transfer_v1");

          if (!raw) {
            alert("No hay indicadores exportados desde el planeamiento didáctico.\n\n" +
                  "Primero exporta los indicadores desde el módulo de planeamiento.");
            return;
          }

          const payload = JSON.parse(raw);

          // Soporta tanto el formato viejo (array directo) como el nuevo (objeto con .criterios)
          const indicadores = Array.isArray(payload) 
            ? payload 
            : (payload.criterios || []);

          if (!Array.isArray(indicadores) || indicadores.length === 0) {
            alert("Los indicadores exportados están vacíos o en formato incorrecto.");
            return;
          }

          console.log("📥 Importando indicadores:", indicadores);

          const criteriaList = document.getElementById("criteria-list");
          if (!criteriaList) {
            alert("No se encontró el área de criterios.");
            return;
          }

          // Agregar como criterios reales
          indicadores.forEach(texto => {
            const row = createCriterionRow({ criterio: texto.trim() });
            criteriaList.appendChild(row);
          });

          document.dispatchEvent(new Event("elma-ensure-verb-bind"));

          // Limpiar después de importar
          localStorage.removeItem("elma_rubric_transfer_v1");

          alert(`📌 Se importaron ${indicadores.length} indicadores correctamente.`);

        } catch (err) {
          console.error("⚠️ Error al importar indicadores:", err);
          alert("Ocurrió un error al importar los indicadores.");
        }
      });
    }

    cargarAdmin(); // Cargar datos administrativos al iniciar
  });

  /* ============================================================
     🔵 CAMPOS ADMINISTRATIVOS (TU LÓGICA ORIGINAL) — sin cambios
     ============================================================ */

  const docenteInput    = document.querySelector("#adm-docente, #docente");
  const asignaturaInput = document.querySelector("#adm-asignatura, #asignatura");
  const nivelInput      = document.querySelector("#adm-nivel, #nivel");
  const periodoInput    = document.querySelector("#adm-periodo, #periodo");
  const temaInput       = document.querySelector("#adm-tema, #tema");
  const numeroInput     = document.querySelector("#adm-numero, #numero");
  const fechaInput      = document.querySelector("#adm-fecha, #fecha");

  const guardarBtn = document.querySelector("#btn-save-admin, #adm-guardar");
  const limpiarBtn = document.querySelector("#btn-clear-admin, #adm-limpiar");

  function guardarAdmin() {
    const adminData = {
      docente:    docenteInput?.value.trim()    || "",
      asignatura: asignaturaInput?.value.trim() || "",
      nivel:      nivelInput?.value.trim()      || "",
      periodo:    periodoInput?.value.trim()    || "",
      tema:       temaInput?.value.trim()       || "",
      numero:     numeroInput?.value.trim()     || "",
      fecha:      fechaInput?.value.trim()      || ""
    };

    localStorage.setItem("adminData", JSON.stringify(adminData));
    alert("✅ Datos administrativos guardados correctamente.");
  }

  function cargarAdmin() {
    try {
      const saved = JSON.parse(localStorage.getItem("adminData"));
      if (!saved) return;

      if (docenteInput)    docenteInput.value    = saved.docente    || "";
      if (asignaturaInput) asignaturaInput.value = saved.asignatura || "";
      if (nivelInput)      nivelInput.value      = saved.nivel      || "";
      if (periodoInput)    periodoInput.value    = saved.periodo    || "";
      if (temaInput)       temaInput.value       = saved.tema       || "";
      if (numeroInput)     numeroInput.value     = saved.numero    || "";
      if (fechaInput)      fechaInput.value      = saved.fecha     || "";
    } catch (err) {
      console.warn("⚠️ Error al cargar datos administrativos:", err);
    }
  }

  function limpiarAdmin() {
    if (confirm("¿Desea limpiar todos los campos administrativos?")) {
      [
        docenteInput,
        asignaturaInput,
        nivelInput,
        periodoInput,
        temaInput,
        numeroInput,
        fechaInput
      ].forEach(el => el && (el.value = ""));
      localStorage.removeItem("adminData");
    }
  }

  if (guardarBtn) guardarBtn.addEventListener("click", guardarAdmin);
  if (limpiarBtn) limpiarBtn.addEventListener("click", limpiarAdmin);

})();  // Fin del IIFE