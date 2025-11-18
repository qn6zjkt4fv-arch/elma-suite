/* ============================================================
   app.js — v1.4 Institucional
   Incluye campo “Número de Proceso Administrativo”
   ============================================================ */

(function () {
  console.log("🟦 app.js institucional v1.4 iniciado");

  // ---- Campos administrativos ----
  const docenteInput    = document.querySelector("#adm-docente, #docente");
  const asignaturaInput = document.querySelector("#adm-asignatura, #asignatura");
  const nivelInput      = document.querySelector("#adm-nivel, #nivel");
  const periodoInput    = document.querySelector("#adm-periodo, #periodo");
  const temaInput       = document.querySelector("#adm-tema, #tema");
  const numeroInput     = document.querySelector("#adm-numero, #numero"); // 🆕 nuevo campo
  const fechaInput      = document.querySelector("#adm-fecha, #fecha");

  // ---- Botones administrativos ----
  const guardarBtn = document.querySelector("#btn-save-admin, #adm-guardar");
  const limpiarBtn = document.querySelector("#btn-clear-admin, #adm-limpiar");

  // ---- Guardar datos administrativos ----
  function guardarAdmin() {
    const adminData = {
      docente:    docenteInput?.value.trim()    || "",
      asignatura: asignaturaInput?.value.trim() || "",
      nivel:      nivelInput?.value.trim()      || "",
      periodo:    periodoInput?.value.trim()    || "",
      tema:       temaInput?.value.trim()       || "",
      numero:     numeroInput?.value.trim()     || "", // 🆕 agregado
      fecha:      fechaInput?.value.trim()      || ""
    };

    localStorage.setItem("adminData", JSON.stringify(adminData));
    alert("✅ Datos administrativos guardados correctamente.");
  }

  // ---- Cargar datos al iniciar ----
  function cargarAdmin() {
    try {
      const saved = JSON.parse(localStorage.getItem("adminData"));
      if (!saved) return;

      if (docenteInput)    docenteInput.value    = saved.docente    || "";
      if (asignaturaInput) asignaturaInput.value = saved.asignatura || "";
      if (nivelInput)      nivelInput.value      = saved.nivel      || "";
      if (periodoInput)    periodoInput.value    = saved.periodo    || "";
      if (temaInput)       temaInput.value       = saved.tema       || "";
      if (numeroInput)     numeroInput.value     = saved.numero     || ""; // 🆕 restaurado
      if (fechaInput)      fechaInput.value      = saved.fecha      || "";
    } catch (err) {
      console.warn("⚠️ Error al cargar datos administrativos:", err);
    }
  }

  // ---- Limpiar formulario ----
  function limpiarAdmin() {
    if (confirm("¿Desea limpiar todos los campos administrativos?")) {
      [docenteInput, asignaturaInput, nivelInput, periodoInput, temaInput, numeroInput, fechaInput].forEach(
        (el) => el && (el.value = "")
      );
      localStorage.removeItem("adminData");
    }
  }

  // ---- Activar botones ----
  if (guardarBtn) guardarBtn.addEventListener("click", guardarAdmin);
  if (limpiarBtn) limpiarBtn.addEventListener("click", limpiarAdmin);

  // ---- Inicializar ----
  document.addEventListener("DOMContentLoaded", cargarAdmin);
})();

