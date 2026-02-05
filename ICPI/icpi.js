document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("modalProyecto");
    const btnNuevo = document.getElementById("btnNuevoProyecto");
    const btnGuardar = document.getElementById("guardarProyecto");

    btnNuevo.onclick = () => {
        modal.style.display = "block";
    };

    window.cerrarModal = function() {
        modal.style.display = "none";
    };

    // Guardar proyecto (localStorage temporal o API futura)
    btnGuardar.onclick = () => {
        const nivel = document.getElementById("nivelProyecto").value;
        const objetivo = document.getElementById("objetivoGeneral").value;
        const productos = document.getElementById("productosProyecto").value;
        const cronograma = document.getElementById("cronogramaProyecto").value;

        const asignaturas = Array.from(
            document.querySelectorAll(".checklist input:checked")
        ).map(x => x.value);

        const proyecto = {
            id: Date.now(),
            nivel,
            asignaturas,
            objetivo,
            productos,
            cronograma
        };

        // Guardar local o enviar a BD
        let proyectos = JSON.parse(localStorage.getItem("proyectosICPI")) || [];
        proyectos.push(proyecto);
        localStorage.setItem("proyectosICPI", JSON.stringify(proyectos));

        alert("Proyecto guardado correctamente");
        modal.style.display = "none";
    };

});

// Mostrar mapa por nivel
function verMapa(nivel) {
    alert("Aquí se abrirá el mapa del nivel " + nivel);
}
