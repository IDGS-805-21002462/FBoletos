const API_URL = "https://localhost:7072/api";
let modalCompraInstance = null;

document.addEventListener("DOMContentLoaded", () => {
    cargarEventos();
    modalCompraInstance = new bootstrap.Modal(document.getElementById('modalComprar'));

    document.getElementById("formComprarBoleto").addEventListener("submit", async (e) => {
        e.preventDefault();

        const boletoData = {
            compradorNombre: document.getElementById("compradorNombre").value,
            compradorEmail: document.getElementById("compradorEmail").value,
            cantidad: parseInt(document.getElementById("cantidadBoletos").value),
            zonaEventoId: parseInt(document.getElementById("selectZona").value)
        };

        try {
            const respuesta = await fetch(`${API_URL}/Boletos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(boletoData)
            });

            if (respuesta.ok) {
                alert("¡Compra realizada con éxito! 🎉");
                modalCompraInstance.hide();
                cargarEventos();
            } else {
                alert("Error al procesar la compra. Verifica los lugares disponibles.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("No se pudo conectar con el servidor.");
        }
    });
});

async function cargarEventos() {
    const contenedor = document.getElementById("lista-eventos");
    contenedor.innerHTML = "<p class='text-center'>Cargando eventos...</p>";

    try {
        const respuesta = await fetch(`${API_URL}/Eventos`);
        if (!respuesta.ok) throw new Error("No se pudo conectar con el servidor backend");

        const eventos = await respuesta.json();
        contenedor.innerHTML = ""; 

        if (eventos.length === 0) {
            contenedor.innerHTML = "<p class='text-center text-muted'>No hay eventos registrados.</p>";
            return;
        }

        eventos.forEach(evento => {
            const zonas = evento.zonas || evento.Zonas || [];

            let zonasHtml = "";
            if (zonas.length > 0) {
                zonasHtml = zonas.map(z => 
                    `<li class="list-group-item d-flex justify-content-between align-items-center">
                        ${z.nombreZona || z.NombreZona} - $${z.precio || z.Precio} 
                        <span class="badge bg-primary rounded-pill">${z.lugaresDisponibles || z.LugaresDisponibles} disp.</span>
                    </li>`
                ).join("");
            } else {
                zonasHtml = "<li class='list-group-item text-muted'>Sin zonas registradas</li>";
            }

            const tarjeta = `
                <div class="col-md-4 mb-4">
                    <div class="card shadow-sm h-100">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title text-primary">${evento.titulo || evento.Titulo}</h5>
                            <p class="card-text text-secondary">${evento.descripcion || evento.Descripcion || 'Sin descripción'}</p>
                            <p class="text-muted mb-1"><strong>Lugar:</strong> ${evento.lugar || evento.Lugar}</p>
                            <p class="text-muted mb-3"><strong>Fecha:</strong> ${new Date(evento.fechaHora || evento.FechaHora).toLocaleString()}</p>
                            
                            <h6 class="mt-2">Zonas y Precios:</h6>
                            <ul class="list-group mb-3">
                                ${zonasHtml}
                            </ul>

                            <button class="btn btn-dark mt-auto w-100" onclick='abrirModalCompra(${JSON.stringify(evento)})'>
                                🎟️ Comprar Boletos
                            </button>
                        </div>
                    </div>
                </div>
            `;
            contenedor.innerHTML += tarjeta;
        });

    } catch (error) {
        console.error(error);
        contenedor.innerHTML = `<div class="alert alert-danger text-center">Error al cargar los eventos.</div>`;
    }
}

function abrirModalCompra(evento) {
    document.getElementById("modalTituloEvento").textContent = evento.titulo || evento.Titulo;
    document.getElementById("eventoIdCompra").value = evento.id || evento.Id;

    const selectZona = document.getElementById("selectZona");
    selectZona.innerHTML = "";

    const zonas = evento.zonas || evento.Zonas || [];

    if (zonas.length > 0) {
        zonas.forEach(z => {
            const option = document.createElement("option");
            option.value = z.id || z.Id;
            option.textContent = `${z.nombreZona || z.NombreZona} - $${z.precio || z.Precio} (${z.lugaresDisponibles || z.LugaresDisponibles} disponibles)`;
            selectZona.appendChild(option);
        });
    } else {
        const option = document.createElement("option");
        option.textContent = "No hay zonas disponibles para este evento";
        selectZona.appendChild(option);
    }

    modalCompraInstance.show();
}