/* ============================================================
   app.js — v1.4 Institucional (CORREGIDO)
   - Campo “Número de Proceso Administrativo”
   - Importación de indicadores DESDE BOTÓN (ELMA)
   ============================================================ */

(function () {
  console.log("🟦 app.js institucional v1.4 iniciado");

  /* ============================================================
     🔵 IMPORTAR INDICADORES DESDE PLANEAMIENTOS (ELMA)
     ============================================================ */

  document.addEventListener("DOMContentLoaded", () => {

    const btnImportFromPlan = document.getElementById("import-from-plan");

    if (btnImportFromPlan) {
      btnImportFromPlan.addEventListener("click", () => {
        try {
          const raw = localStorage.getItem("ELMA_EXPORT_INDICADORES");

          if (!raw) {
            alert("No hay indicadores exportados desde el planeamiento didáctico.");
            return;
          }

          const indicadores = JSON.parse(raw);

          if (!Array.isArray(indicadores) || indicadores.length === 0) {
            alert("Los indicadores exportados están vacíos o dañados.");
            return;
          }

          console.log("📥 Importando indicadores desde planeamientos:", indicadores);

          indicadores.forEach(texto => {
            if (typeof addCriterion === "function") {
              addCriterion(texto);
            } else {
              console.warn("addCriterion no está disponible.");
            }
          });

          // Limpiar para evitar importaciones duplicadas
          localStorage.removeItem("ELMA_EXPORT_INDICADORES");

          alert("📌 Indicadores importados correctamente desde el planeamiento.");

        } catch (err) {
          console.error("⚠️ Error al importar indicadores:", err);
          alert("Ocurrió un error al importar los indicadores.");
        }
      });
    }

    cargarAdmin(); // Cargar datos administrativos al iniciar
  });

  /* ============================================================
     🔵 CAMPOS ADMINISTRATIVOS (TU LÓGICA ORIGINAL)
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

})();
