const API_URL = "https://localhost:7072/api";

let zonasLocal = [
    { 
        id: 1,
        nombre: "VIP"
    },
    { 
        id: 2,
        nombre: "Preferente"
    },
    { 
        id: 3, 
        nombre: "Platinium" 
    },
    { 
        id: 4, 
        nombre: "Oro" 
    },
    { 
        id: 5, 
        nombre: "Plata" 
    },
    { 
        id: 6, 
        nombre: "General A" 
    },
    { 
        id: 7,
        nombre: "General B" 
    },
    { 
        id: 8, 
        nombre: "Grada / Tribuna" 
    }
];

 function cargarZonasEnFormulario() {
            const select = document.getElementById("nombreZona");
            if (!select) return;

            select.innerHTML = '<option value="">Selecciona una zona...</option>';

            zonasLocal.forEach(zona => {
                const option = document.createElement("option");
                option.value = zona.nombre;
                option.textContent = zona.nombre;
                select.appendChild(option);
            });
        }

        // 3. Ejecutar la carga de zonas automáticamente cuando abre la página
        document.addEventListener("DOMContentLoaded", () => {
            cargarZonasEnFormulario();
        });

        // 4. Manejo del evento de envío del formulario
        document.getElementById("formCrearEvento").addEventListener("submit", async (e) => {
            e.preventDefault();

            const nuevoEvento = {
                titulo: document.getElementById("titulo").value,
                descripcion: document.getElementById("descripcion").value,
                fechaHora: document.getElementById("fechaHora").value,
                lugar: document.getElementById("lugar").value,
                zonas: [
                    {
                        nombreZona: document.getElementById("nombreZona").value,
                        precio: parseFloat(document.getElementById("precioZona").value),
                        lugaresDisponibles: parseInt(document.getElementById("lugaresZona").value)
                    }
                ]
            };

            try {
                const respuesta = await fetch(`${API_URL}/Eventos`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(nuevoEvento)
                });

                if (respuesta.ok) {
                    alert("¡Evento y zona creados con éxito!");
                    window.location.href = "index.html"; 
                } else {
                    alert("Error al guardar el evento.");
                }
            } catch (error) {
                console.error("Error:", error);
                alert("No se pudo conectar con el servidor.");
            }
        });