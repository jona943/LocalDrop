document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias a Elementos del DOM ---
    const form = document.getElementById('formulario-subida');
    const textInput = document.getElementById('entrada-texto');
    const fileInput = document.getElementById('entrada-archivo');
    const fileNameDisplay = document.getElementById('nombre-archivo');
    const feed = document.getElementById('listado');
    const botonLimpiarTodo = document.getElementById('boton-limpiar-todo');
    const dispositivosLista = document.getElementById('dispositivos-lista');
    const estadoSubida = document.getElementById('estado-subida');

    // --- Lógica de la Interfaz ---

    // Muestra el nombre del archivo seleccionado
    fileInput.addEventListener('change', () => {
        fileNameDisplay.textContent = fileInput.files.length > 0
            ? fileInput.files[0].name
            : 'Ningún archivo seleccionado';
    });

    // Envío del formulario
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = textInput.value.trim();
        const file = fileInput.files[0];
        if (!text && !file) return;

        const formData = new FormData();
        if (text) formData.append('text', text);
        if (file) formData.append('file', file);

        const submitButton = form.querySelector('button[type="submit"]');

        try {
            submitButton.disabled = true;
            estadoSubida.textContent = 'Subiendo archivo...';

            await fetch('/item', { method: 'POST', body: formData });
            
            textInput.value = '';
            fileInput.value = null;
            fileNameDisplay.textContent = 'Ningún archivo seleccionado';
        } catch (error) {
            console.error('Error al enviar:', error);
            alert('Hubo un error al enviar el item.');
        } finally {
            submitButton.disabled = false;
            estadoSubida.textContent = '';
        }
    });

    // --- Lógica de Administrador ---

    // Limpiar todo el feed
    botonLimpiarTodo.addEventListener('click', async () => {
        if (!confirm('¿Estás seguro de que quieres borrar todos los elementos?')) return;
        try {
            await fetch('/items', { method: 'DELETE' });
        } catch (error) {
            console.error('Error al limpiar todo:', error);
        }
    });

    // Borrar un item individual
    const borrarItem = async (itemId) => {
        if (!confirm('¿Estás seguro de que quieres borrar este elemento?')) return;
        try {
            await fetch(`/item/${itemId}`, { method: 'DELETE' });
        } catch (error) {
            console.error(`Error al borrar el item ${itemId}:`, error);
        }
    };

    // Renombrar un dispositivo
    const renombrarDispositivo = async (userAgent, nuevoNombre) => {
        try {
            await fetch('/device/rename', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userAgent, newName: nuevoNombre })
            });
        } catch (error) {
            console.error('Error al renombrar:', error);
        }
    };

    // Borrar un dispositivo
    const borrarDispositivo = async (userAgent) => {
        if (!confirm('¿Estás seguro de que quieres borrar este dispositivo? Se perderá su nombre y color personalizado.')) return;
        try {
            await fetch(`/device/${encodeURIComponent(userAgent)}`, { method: 'DELETE' });
        } catch (error) {
            console.error('Error al borrar dispositivo:', error);
        }
    };


    // --- Renderizado ---

    const renderItems = (items) => {
        feed.innerHTML = '';
        items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'elemento';
            const date = new Date(item.timestamp).toLocaleString();
            
            itemDiv.innerHTML = `
                <div class="elemento-cabecera">
                    <span class="nombre-dispositivo" style="color: ${item.color}; font-weight: bold;">${item.deviceName}</span> @ <span>${date}</span>
                </div>
                <div class="elemento-contenido" id="contenido-${item.id}"></div>
                <div class="elemento-acciones" id="acciones-${item.id}">
                    <button class="boton-peligro" data-id="${item.id}">Borrar</button>
                </div>
            `;

            const contentDiv = itemDiv.querySelector(`#contenido-${item.id}`);
            const actionsDiv = itemDiv.querySelector(`#acciones-${item.id}`);

            if (item.type === 'text') {
                const pre = document.createElement('pre');
                pre.textContent = item.content;
                contentDiv.appendChild(pre);
                const copyBtn = document.createElement('button');
                copyBtn.textContent = 'Copiar';
                copyBtn.onclick = () => navigator.clipboard.writeText(item.content);
                actionsDiv.insertBefore(copyBtn, actionsDiv.firstChild);
            } else if (item.type === 'file') {
                if (item.mimeType && item.mimeType.startsWith('image/')) {
                    const img = document.createElement('img');
                    img.src = `/uploads/${item.content}`;
                    contentDiv.appendChild(img);
                } else {
                    const p = document.createElement('p');
                    p.textContent = `Archivo: ${item.originalName}`;
                    contentDiv.appendChild(p);
                }
                const downloadLink = document.createElement('a');
                downloadLink.href = `/uploads/${item.content}`;
                downloadLink.textContent = 'Descargar';
                downloadLink.download = item.originalName;
                actionsDiv.insertBefore(downloadLink, actionsDiv.firstChild);
            }

            feed.appendChild(itemDiv);
            itemDiv.querySelector(`.boton-peligro[data-id="${item.id}"]`).addEventListener('click', () => borrarItem(item.id));
        });
    };

    const fetchAndRenderDevices = async () => {
        try {
            const response = await fetch('/devices');
            const devices = await response.json();
            dispositivosLista.innerHTML = '';

            for (const userAgent in devices) {
                const device = devices[userAgent];
                const deviceDiv = document.createElement('div');
                deviceDiv.className = 'dispositivo-item';
                deviceDiv.style.borderColor = device.color;
                
                deviceDiv.innerHTML = `
                    <input type="text" value="${device.name}" placeholder="Nombre del dispositivo">
                    <button class="guardar-btn" data-user-agent="${encodeURIComponent(userAgent)}">Guardar</button>
                    <button class="boton-peligro borrar-dispositivo-btn" data-user-agent="${encodeURIComponent(userAgent)}">Eliminar</button>
                `;
                
                dispositivosLista.appendChild(deviceDiv);
            }

            // Añadir event listeners a los botones de guardar y borrar
            dispositivosLista.querySelectorAll('.guardar-btn').forEach(button => {
                button.addEventListener('click', () => {
                    const ua = decodeURIComponent(button.dataset.userAgent);
                    const newName = button.previousElementSibling.value;
                    renombrarDispositivo(ua, newName);
                });
            });

            dispositivosLista.querySelectorAll('.borrar-dispositivo-btn').forEach(button => {
                button.addEventListener('click', () => {
                    const ua = decodeURIComponent(button.dataset.userAgent);
                    borrarDispositivo(ua);
                });
            });

        } catch (error) {
            console.error('Error al obtener dispositivos:', error);
        }
    };


    // --- Sincronización en Tiempo Real (SSE) ---
    
    const fetchItems = async () => {
        try {
            const response = await fetch('/items');
            if (!response.ok) throw new Error('Error de red');
            const items = await response.json();
            renderItems(items);
        } catch (error) {
            console.error('Error al obtener items:', error);
            feed.innerHTML = `<p style="color: var(--danger);">Error al conectar con el servidor.</p>`;
        }
    };
    
    // Cargas iniciales
    fetchItems();
    fetchAndRenderDevices();
    
    // Conexión al stream de eventos del servidor
    const eventSource = new EventSource('/events');

    eventSource.addEventListener('connections_update', (event) => {
        const connectionCount = document.getElementById('connection-count');
        if (connectionCount) {
            connectionCount.textContent = event.data;
        }
    });

    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.event === 'update') {
            console.log('Recibida actualización del servidor, refrescando...');
            fetchItems();
            fetchAndRenderDevices(); // También refrescar la lista de dispositivos
        }
    };

    eventSource.onerror = () => {
        console.error('Error en la conexión SSE.');
        feed.innerHTML = `<p style="color: var(--danger);">Conexión con el servidor perdida. Intentando reconectar...</p>`;
    };
});