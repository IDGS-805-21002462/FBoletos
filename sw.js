const CACHE_ESTATICO = 'boletos-estatico-v3';
const CACHE_DINAMICO = 'boletos-datos-v1';

const ARCHIVOS_CACHE = [
    '/',
    '/index.html',
    '/admin.html',
    '/ticket.html',
    '/login.html',
    '/misboletos.html',
    '/app.js',
    '/admin.js',
    '/login.js',
    '/misboletos.js',
    '/icons/billete-de-avion.png',
    '/icons/boleto.png',
    '/icons/mas.png',
    '/icons/respuesta.png'
];

self.addEventListener('install', evento => {
    evento.waitUntil(
        caches.open(CACHE_ESTATICO).then(cache => cache.addAll(ARCHIVOS_CACHE))
    );
});

self.addEventListener('activate', evento => {
    evento.waitUntil(
        caches.keys().then(claves => {
            return Promise.all(
                claves.map(clave => {
                    if (clave !== CACHE_ESTATICO && clave !== CACHE_DINAMICO) {
                        return caches.delete(clave);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', evento => {
    const url = new URL(evento.request.url);

    // 1. MANEJO DE LA API (Eventos, Boletos, Login)
    if (url.pathname.includes('/api/')) {
        
        // Peticiones de Consulta (Eventos y Mis Boletos) -> GUARDAN CACHÉ
        if (evento.request.method === 'GET') {
            evento.respondWith(
                fetch(evento.request)
                    .then(respuestaRed => {
                        // Si hay internet, guarda una copia de los datos frescos
                        const respuestaClonada = respuestaRed.clone();
                        caches.open(CACHE_DINAMICO).then(cache => {
                            cache.put(evento.request, respuestaClonada);
                        });
                        return respuestaRed;
                    })
                    .catch(() => {
                        // Si NO hay internet, busca la copia guardada
                        return caches.match(evento.request).then(respuestaCache => {
                            if (respuestaCache) {
                                return respuestaCache; // Devuelve los datos offline
                            }
                            // Si tampoco hay datos guardados
                            return new Response(
                                JSON.stringify({ mensaje: 'Sin conexión a internet y sin datos guardados.' }),
                                { headers: { 'Content-Type': 'application/json' }, status: 503 }
                            );
                        });
                    })
            );
        } 
        // Peticiones de Envío (Comprar, Login, Registro) -> NO GUARDAN CACHÉ
        else {
            evento.respondWith(
                fetch(evento.request).catch(() => {
                    return new Response(
                        JSON.stringify({ mensaje: 'Sin conexión a internet. Esta acción requiere estar en línea.' }),
                        { headers: { 'Content-Type': 'application/json' }, status: 503 }
                    );
                })
            );
        }
        return; 
    }

    // 2. MANEJO DE ARCHIVOS ESTÁTICOS (HTML, CSS, JS) -> CACHE FIRST
    evento.respondWith(
        caches.match(evento.request).then(respuestaCache => {
            return respuestaCache || fetch(evento.request).catch(() => {
                return new Response("Archivo no encontrado o sin conexión a internet.", {
                    status: 404,
                    headers: { "Content-Type": "text/plain" }
                });
            });
        })
    );
});