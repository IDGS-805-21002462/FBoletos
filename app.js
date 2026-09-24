const API_URL = "https://localhost:7072/api";
let modalCompraInstance = null;
let intervalo = null;
let tiempo = 180;
let listaEventosCompleta = [];

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registro => console.log('Service Worker registrado.', registro.scope))
            .catch(error => console.error('Error al registrar Service Worker:', error));
    });
}

document.getElementById("btnCancelar").addEventListener("click", () => {
    modalCompraInstance.hide();
});

document.addEventListener("DOMContentLoaded", () => {
    verificarSesion();
    cargarEventos();

    modalCompraInstance = new bootstrap.Modal(document.getElementById('modalComprar'));
    const selectFiltro = document.getElementById("filtroZonaHTML");
    
    if (selectFiltro) {
        selectFiltro.addEventListener("change", (e) => {
            const zonaSeleccionada = e.target.value;

            if (!zonaSeleccionada) {
                renderizarTarjetas(listaEventosCompleta);
            } else {
                const eventosFiltrados = listaEventosCompleta.filter(evento => {
                    const zonas = evento.zonas || evento.Zonas || [];
                    return zonas.some(z => (z.nombreZona || z.NombreZona) === zonaSeleccionada);
                });
                renderizarTarjetas(eventosFiltrados);
            }
        });
    }

    document.getElementById("formComprarBoleto").addEventListener("submit", async (e) => {
        e.preventDefault();

        const nombre = document.getElementById("compradorNombre").value;
        const email = document.getElementById("compradorEmail").value;
        const cantidad = document.getElementById("cantidadBoletos").value;
        const campos = [nombre, email, cantidad];
        const todosLlenos = campos.every(campo => campo.trim() !== "");

        if (!todosLlenos) {
            Swal.fire({ icon: 'warning', title: 'Atención', text: 'Por favor llena todos los campos.' });
            return;
        }

        const opciones = Array.from(document.getElementById("selectZona").options);
        const hayLugares = opciones.some(opcion => !opcion.textContent.includes("(0 disponibles)"));

        if (!hayLugares) {
            Swal.fire({ icon: 'error', title: 'Agotado', text: 'Esta zona ya no tiene boletos disponibles.' });
            return;
        }

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
                const boletoGuardado = await respuesta.json();
                const selectZona = document.getElementById("selectZona");
                const nombreZonaTexto = selectZona.options[selectZona.selectedIndex].text.split('-')[0].trim();
                const tituloEvento = document.getElementById("modalTituloEvento").textContent;

                localStorage.setItem('ticketNombre', boletoGuardado.compradorNombre);
                localStorage.setItem('ticketCorreo', boletoGuardado.compradorEmail);
                localStorage.setItem('ticketCantidad', boletoGuardado.cantidad);
                localStorage.setItem('ticketZonaId', boletoGuardado.zonaEventoId);
                localStorage.setItem('ticketZona', nombreZonaTexto);
                localStorage.setItem('ticketEvento', tituloEvento);
                localStorage.setItem('ticketSubtotal', (boletoGuardado.subtotal || 0).toFixed(2));
                localStorage.setItem('ticketIVA', (boletoGuardado.iva || 0).toFixed(2));
                localStorage.setItem('ticketTotal', (boletoGuardado.totalPagado || 0).toFixed(2));

                Swal.fire({
                    icon: 'success',
                    title: '¡Éxito!',
                    text: 'Compra realizada con éxito',
                    confirmButtonText: 'Ver Ticket'
                }).then(() => {
                    modalCompraInstance.hide();
                    cargarEventos();
                    window.location.href = 'ticket.html';
                });
            } else {
                const error = await respuesta.json().catch(() => null);
                Swal.fire({ icon: 'error', title: 'Error', text: error?.mensaje || "Error al procesar la compra." });
            }
        } catch (error) {
            console.error("Error:", error);
            Swal.fire({ icon: 'error', title: 'Fallo de conexión', text: 'No se pudo conectar con el servidor.' });
        }
    });
});

async function cargarEventos() {
    const contenedor = document.getElementById("lista-eventos");
    contenedor.innerHTML = "<p class='text-center'>Cargando eventos...</p>";

    try {
        const respuesta = await fetch(`${API_URL}/Eventos`);
        
        if (!respuesta.ok) {
            const error = await respuesta.json().catch(() => ({}));
            throw new Error(error.mensaje || "Error al cargar los eventos desde el servidor.");
        }

        listaEventosCompleta = await respuesta.json();
        renderizarTarjetas(listaEventosCompleta);

    } catch (error) {
        console.error(error);
        contenedor.innerHTML = `<div class="alert alert-danger text-center">${error.message}</div>`;
    }
}

function renderizarTarjetas(eventos) {
    const contenedor = document.getElementById("lista-eventos");
    contenedor.innerHTML = ""; 

    if (eventos.length === 0) {
        contenedor.innerHTML = "<p class='text-center text-muted col-12'>No hay eventos registrados.</p>";
        return;
    }

    eventos.forEach(evento => {
        const zonas = evento.zonas || evento.Zonas || [];
        let zonasHtml = "";
        
        if (zonas.length > 0) {
            zonasHtml = zonas.map(z => 
                `<li class="list-group-item d-flex justify-content-between align-items-center">
                    ${z.nombreZona || z.NombreZona} - $${z.precio || z.Precio} 
                    <span class="badge bg-success rounded-pill">${z.lugaresDisponibles || z.LugaresDisponibles} disp.</span>
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
                            Comprar Boletos
                        </button>
                    </div>
                </div>
            </div>
        `;
        contenedor.innerHTML += tarjeta;
    });
}

// Extrae el correo real guardado dentro del JWT
function obtenerCorreoDelToken() {
    const token = localStorage.getItem("jwtToken");
    if (!token) return "";
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.email || payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] || "";
    } catch (e) {
        return "";
    }
}

function abrirModalCompra(evento) {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
        Swal.fire({
            icon: 'info',
            title: 'Inicio de sesión requerido',
            text: 'Necesitas iniciar sesión para comprar boletos.'
        }).then(() => {
            window.location.href = "login.html";
        });
        return; 
    }

    const { titulo, id, zonas = [] } = evento;
    document.getElementById("modalTituloEvento").textContent = titulo || evento.Titulo;
    document.getElementById("eventoIdCompra").value = id || evento.Id;

    // Autocompletar datos del usuario activo
    document.getElementById("compradorNombre").value = localStorage.getItem("nombreUsuario") || "";
    document.getElementById("compradorEmail").value = obtenerCorreoDelToken();

    const selectZona = document.getElementById("selectZona");
    selectZona.innerHTML = "";

    const listaZonas = zonas.length > 0 ? zonas : (evento.Zonas || []);
    const totalLugares = listaZonas.reduce((acumulado, zona) => {
        const lugares = zona.lugaresDisponibles || zona.LugaresDisponibles || 0;
        return acumulado + lugares;
    }, 0);

    listaZonas.forEach(zona => {
        const { id: idZona, nombreZona, precio, lugaresDisponibles } = zona;
        const idFinal = idZona || zona.Id;
        const nombreFinal = nombreZona || zona.NombreZona;
        const precioFinal = precio || zona.Precio;
        const lugaresFinales = lugaresDisponibles ?? zona.LugaresDisponibles;

        const option = document.createElement("option");
        option.value = idFinal;
        option.textContent = `${nombreFinal} - $${precioFinal} (${lugaresFinales} disponibles)`;
        
        if (lugaresFinales <= 0) {
            option.disabled = true;
        }

        selectZona.appendChild(option);
    });

    modalCompraInstance.show();

    if (intervalo) clearInterval(intervalo);
    tiempo = 180; // Reinicia el temporizador a 3 minutos

    intervalo = setInterval(() => {
        const minutos = Math.floor(tiempo / 60);
        const segundos = tiempo % 60;
        
        const minText = minutos.toString().padStart(2, '0');
        const segText = segundos.toString().padStart(2, '0');

        const reloj = document.getElementById("relojTemporizador");
        if (reloj) reloj.textContent = `${minText}:${segText}`;

        tiempo--;

        if (tiempo < 0) {
            clearInterval(intervalo);
            modalCompraInstance.hide();
            Swal.fire({
                icon: 'warning',
                title: 'Tiempo Agotado',
                text: 'Tu sesión de compra ha expirado.'
            }).then(() => {
                window.location.reload();
            });
        }
    }, 1000);
}

function verificarSesion() {
    const token = localStorage.getItem("jwtToken");
    const nombre = localStorage.getItem("nombreUsuario");
    const menuUsuario = document.getElementById("menu-usuario");

    if (menuUsuario) {
        if (token) {
            menuUsuario.innerHTML = `
                <span class="text-white me-3">Hola, <strong>${nombre}</strong></span>
                <a href="misboletos.html" class="btn btn-outline-info btn-sm me-2">🎟️ Mis Boletos</a>
                <button onclick="cerrarSesion()" class="btn btn-danger btn-sm">Cerrar Sesión</button>
            `;
        } else {
            menuUsuario.innerHTML = `
                <a href="login.html" class="btn btn-primary btn-sm">Iniciar Sesión / Registro</a>
            `;
        }
    }
}

window.cerrarSesion = function() {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("nombreUsuario");
    window.location.href = "login.html"; 
};