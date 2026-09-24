const API_URL = "https://localhost:7072/api";

document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("jwtToken");
    
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        const respuesta = await fetch(`${API_URL}/Boletos/MisBoletos`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (respuesta.status === 401) {
            localStorage.removeItem("jwtToken");
            window.location.href = "login.html";
            return;
        }

        if (respuesta.ok) {
            const misBoletos = await respuesta.json();
            renderizarMisBoletos(misBoletos);
        } else {
            const error = await respuesta.json().catch(() => ({}));
            document.getElementById("lista-mis-boletos").innerHTML = 
                `<p class="text-center text-muted col-12">${error.mensaje || "No tienes boletos aún."}</p>`;
        }
    } catch (error) {
        console.error(error);
        Swal.fire({ icon: 'error', title: 'Fallo de conexión', text: 'Error al conectar con el servidor.' });
    }
});

function renderizarMisBoletos(boletos) {
    const contenedor = document.getElementById("lista-mis-boletos");
    contenedor.innerHTML = "";

    if (boletos.length === 0) {
        contenedor.innerHTML = "<p class='text-center text-muted col-12'>No tienes boletos comprados.</p>";
        return;
    }

    boletos.forEach(boleto => {
        const eventoTitulo = boleto.eventoTitulo || "Evento Desconocido";
        const zonaNombre = boleto.zonaNombre || "Zona";
        const totalPagado = boleto.totalPagado ?? 0;
        const fechaCompra = new Date(boleto.fechaCompra).toLocaleDateString();

        const tarjeta = `
            <div class="col-md-5 mb-4">
                <div class="card shadow-sm border-primary">
                    <div class="card-body">
                        <h5 class="card-title text-primary">${eventoTitulo}</h5>
                        <p class="mb-1"><strong>Zona:</strong> ${zonaNombre}</p>
                        <p class="mb-1"><strong>Cantidad:</strong> ${boleto.cantidad} boleto(s)</p>
                        <p class="mb-1"><strong>Fecha de compra:</strong> ${fechaCompra}</p>
                        <p class="mb-3 fs-5"><strong>Total Pagado:</strong> $${totalPagado.toFixed(2)}</p>
                        
                        <button class="btn btn-dark w-100" onclick='abrirMiTicket(${JSON.stringify(boleto)})'>
                            Ver Ticket Físico
                        </button>
                    </div>
                </div>
            </div>
        `;
        contenedor.innerHTML += tarjeta;
    });
}

window.abrirMiTicket = function(boleto) {
    localStorage.setItem('ticketNombre', boleto.compradorNombre);
    localStorage.setItem('ticketCorreo', boleto.compradorEmail);
    localStorage.setItem('ticketCantidad', boleto.cantidad);
    localStorage.setItem('ticketZona', boleto.zonaNombre);
    localStorage.setItem('ticketEvento', boleto.eventoTitulo);
    localStorage.setItem('ticketSubtotal', (boleto.subtotal || 0).toFixed(2));
    localStorage.setItem('ticketIVA', (boleto.iva || 0).toFixed(2));
    localStorage.setItem('ticketTotal', (boleto.totalPagado || 0).toFixed(2));

    window.location.href = 'ticket.html';
};