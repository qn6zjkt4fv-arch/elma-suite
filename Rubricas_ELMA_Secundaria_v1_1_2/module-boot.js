/* ============================================================
   module-boot.js — v1.4 Institucional
   Compatible con estructura de index.html (li + screen-*)
   ============================================================ */

(function () {
  console.log("🟦 module-boot.js iniciado correctamente");

  document.addEventListener("DOMContentLoaded", () => {
    const navItems = document.querySelectorAll("nav.sidebar ul li");
    const screens = document.querySelectorAll(".screen");

    if (!navItems.length || !screens.length) {
      console.warn("⚠️ No se encontraron elementos de navegación o pantallas.");
      return;
    }

    // Oculta todas las pantallas
    function hideAllScreens() {
      screens.forEach((s) => s.classList.remove("active"));
      screens.forEach((s) => (s.style.display = "none"));
    }

    // Muestra una pantalla específica según data-target
    function showScreen(targetId) {
      hideAllScreens();
      const screen = document.getElementById("screen-" + targetId);
      if (screen) {
        screen.classList.add("active");
        screen.style.display = "block";
        console.log(`✅ Mostrando sección: ${targetId}`);
        localStorage.setItem("lastScreen", targetId);
      } else {
        console.warn(`⚠️ Pantalla no encontrada: ${targetId}`);
      }
    }

    // Asigna eventos a los <li> laterales
    navItems.forEach((item) => {
      item.addEventListener("click", () => {
        navItems.forEach((li) => li.classList.remove("active"));
        item.classList.add("active");
        const target = item.getAttribute("data-target");
        showScreen(target);
      });
    });

    // Restaurar última pantalla
    const last = localStorage.getItem("lastScreen");
    if (last && document.getElementById("screen-" + last)) {
      showScreen(last);
      navItems.forEach((li) => {
        li.classList.toggle("active", li.getAttribute("data-target") === last);
      });
    } else {
      showScreen("admin"); // por defecto
    }
  });
})();
