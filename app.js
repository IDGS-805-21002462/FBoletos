const API_URL = "https://localhost:7072/api";
let modalCompraInstance = null;
let intervalo = null;
 let tiempo = 180;
 let listaEventosCompleta = [];

document.getElementById("btnCancelar").addEventListener("click", () => {
    modalCompraInstance.hide();
});


document.addEventListener("DOMContentLoaded", () => {
    cargarEventos();

    modalCompraInstance = new bootstrap.Modal(document.getElementById('modalComprar'));



        // 2. ESCUCHADOR DEL FILTRO POR ZONA EN EL HTML
    const selectFiltro = document.getElementById("filtroZonaHTML");
    if (selectFiltro) {
        selectFiltro.addEventListener("change", (e) => {
            const zonaSeleccionada = e.target.value;

            if (!zonaSeleccionada) {
                // Si selecciona "Todas las zonas", mostramos todos los eventos
                renderizarTarjetas(listaEventosCompleta);
            } else {
                // APLICAMOS EL FILTER AQUÍ
                const eventosFiltrados = listaEventosCompleta.filter(evento => {
                    const zonas = evento.zonas || evento.Zonas || [];
                    // Filtramos si el evento tiene la zona seleccionada
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

            // --- PUNTO 3: .every() ---
            // Revisa si TODOS los campos tienen texto
            const campos = [nombre, email, cantidad];
            const todosLlenos = campos.every(campo => campo.trim() !== "");

            if (!todosLlenos) {
                alert("Por favor llena todos los campos.");
                return;
            }

            // --- PUNTO 3: .some() ---
            // Revisa si AL MENOS UNA zona tiene disponibilidad
            const opciones = Array.from(document.getElementById("selectZona").options);
            const hayLugares = opciones.some(opcion => !opcion.textContent.includes("(0 disponibles)"));

            if (!hayLugares) {
                alert("Esta zona ya no tiene boletos disponibles.");
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
                // Obtenemos la respuesta con los montos calculados por la API
                const boletoGuardado = await respuesta.json();

                const selectZona = document.getElementById("selectZona");
                const nombreZonaTexto = selectZona.options[selectZona.selectedIndex].text.split('-')[0].trim();
                const tituloEvento = document.getElementById("modalTituloEvento").textContent;

                // 1. Guardar datos generales
                localStorage.setItem('ticketNombre', boletoGuardado.compradorNombre);
                localStorage.setItem('ticketCorreo', boletoGuardado.compradorEmail);
                localStorage.setItem('ticketCantidad', boletoGuardado.cantidad);
                localStorage.setItem('ticketZonaId', boletoGuardado.zonaEventoId);
                localStorage.setItem('ticketZona', nombreZonaTexto);
                localStorage.setItem('ticketEvento', tituloEvento);

                // 2. Guardar desglose de precios calculado por la BD
                localStorage.setItem('ticketSubtotal', (boletoGuardado.subtotal || 0).toFixed(2));
                localStorage.setItem('ticketIVA', (boletoGuardado.iva || 0).toFixed(2));
                localStorage.setItem('ticketTotal', (boletoGuardado.totalPagado || 0).toFixed(2));

                alert("¡Compra realizada con éxito!");
                modalCompraInstance.hide();
                cargarEventos();

                // 3. Redirigir a la pantalla del ticket
                window.location.href = 'ticket.html';
            } else {
                const error = await respuesta.json().catch(() => null);
                alert(error?.mensaje || "Error al procesar la compra. Verifica los lugares disponibles.");
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

        // Guardamos los datos en la variable global para usar el .filter()
        listaEventosCompleta = await respuesta.json();

        // Renderizamos las tarjetas
        renderizarTarjetas(listaEventosCompleta);

    } catch (error) {
        console.error(error);
        contenedor.innerHTML = `<div class="alert alert-danger text-center">Error al cargar los eventos.</div>`;
    }
}

// Función auxiliar para dibujar las tarjetas en el HTML
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


function abrirModalCompra(evento) {
    // --- DESESTRUCTURACIÓN DE OBJETOS ---
    // Extraemos titulo, id y zonas directamente del objeto evento
    const { titulo, id, zonas = [] } = evento;

    // Asignamos los datos desestructurados a la interfaz
    document.getElementById("modalTituloEvento").textContent = titulo || evento.Titulo;
    document.getElementById("eventoIdCompra").value = id || evento.Id;

    const selectZona = document.getElementById("selectZona");
    selectZona.innerHTML = "";

    const listaZonas = zonas.length > 0 ? zonas : (evento.Zonas || []);

    // --- PUNTO 4: .reduce() ---
    const totalLugares = listaZonas.reduce((acumulado, zona) => {
        const lugares = zona.lugaresDisponibles || zona.LugaresDisponibles || 0;
        return acumulado + lugares;
    }, 0);

    console.log(`Total de boletos disponibles: ${totalLugares}`);

    // Llenar las opciones del select usando desestructuración en el bucle
    listaZonas.forEach(zona => {
        // --- DESESTRUCTURACIÓN DE CADA ZONA ---
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

    // Abrir el modal
    modalCompraInstance.show();


    // Si había un temporizador corriendo de antes, lo limpiamos
    if (intervalo) clearInterval(intervalo);

    intervalo = setInterval(() => {
        const minutos = Math.floor(tiempo / 60);
        const segundos = tiempo % 60;
        
        const minText = minutos.toString().padStart(2, '0');
        const segText = segundos.toString().padStart(2, '0');

        // Mostrar en el modal
        const reloj = document.getElementById("relojTemporizador");
        if (reloj) reloj.textContent = `${minText}:${segText}`;

        tiempo--;

        if (tiempo < 0) {
            clearInterval(intervalo);

            modalCompraInstance.hide();
            alert("¡Tiempo terminado! Tu sesión ha expirado.");
            window.location.href = 'index.html';
        }
    }, 1000);
}