const API_URL = "https://localhost:7072/api";

document.getElementById("formLogin").addEventListener("submit", async (e) => {
    e.preventDefault();
    const correo = document.getElementById("loginCorreo").value;
    const contrasena = document.getElementById("loginContrasena").value;

    try {
        const respuesta = await fetch(`${API_URL}/Auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ correo, contrasena })
        });

        const data = await respuesta.json().catch(() => null);

        if (respuesta.status === 503) {
            Swal.fire({
                icon: 'warning',
                title: 'Sin Conexión',
                text: 'Por tu seguridad, es necesario conectarse a internet para iniciar sesión.',
                confirmButtonText: 'Entendido'
            });
            return;
        }

        if (respuesta.ok) {
            localStorage.setItem("jwtToken", data.token);
            localStorage.setItem("nombreUsuario", data.nombre);
            
            Swal.fire({
                icon: 'success',
                title: '¡Bienvenido!',
                text: `Hola de nuevo, ${data.nombre}`,
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                window.location.href = "index.html";
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error de Acceso',
                text: data?.mensaje || "Error al iniciar sesión."
            });
        }
    } catch (error) {
        console.error(error);
        Swal.fire({
            icon: 'error',
            title: 'Fallo de conexión',
            text: 'No se pudo conectar con el servidor.'
        });
    }
});

document.getElementById("formRegistro").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nombre = document.getElementById("registroNombre").value;
    const correo = document.getElementById("registroCorreo").value;
    const contrasena = document.getElementById("registroContrasena").value;

    try {
        const respuesta = await fetch(`${API_URL}/Auth/registro`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre, correo, contrasena })
        });

        const data = await respuesta.json().catch(() => null);

        if (respuesta.status === 503) {
            Swal.fire({
                icon: 'warning',
                title: 'Sin Conexión',
                text: 'Por tu seguridad, es necesario conectarse a internet para registrarte.',
                confirmButtonText: 'Entendido'
            });
            return;
        }

        if (respuesta.ok) {
            Swal.fire({
                icon: 'success',
                title: '¡Registro Exitoso!',
                text: 'Cuenta creada correctamente. Ya puedes iniciar sesión.'
            }).then(() => {
                document.getElementById("formRegistro").reset();
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error al Registrar',
                text: data?.mensaje || "Error al crear la cuenta."
            });
        }
    } catch (error) {
        console.error(error);
        Swal.fire({
            icon: 'error',
            title: 'Fallo de conexión',
            text: 'No se pudo conectar con el servidor.'
        });
    }
});