document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias a Elementos del DOM ---
    const form = document.getElementById('formulario-subida');
    const textInput = document.getElementById('entrada-texto');
    const fileInput = document.getElementById('entrada-archivo');
    const fileNameDisplay = document.getElementById('nombre-archivo');
    const feed = document.getElementById('listado');
    const botonLimpiarTodo = document.getElementById('boton-limpiar-todo');

    const POLLING_INTERVAL = 4000; // 4 segundos

    // --- Lógica de la Interfaz ---

    // Muestra el nombre del archivo seleccionado
    fileInput.addEventListener('change', () => {
        fileNameDisplay.textContent = fileInput.files.length > 0
            ? fileInput.files[0].name
            : 'Ningún archivo seleccionado';
    });

    // Envío del formulario (igual que en script.js)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = textInput.value.trim();
        const file = fileInput.files[0];

        if (!text && !file) {
            alert('Por favor, escribe un mensaje o selecciona un archivo.');
            return;
        }

        const formData = new FormData();
        if (text) formData.append('text', text);
        if (file) formData.append('file', file);

        try {
            // El servidor enviará un evento SSE que actualizará la UI
            await fetch('/item', {
                method: 'POST',
                body: formData,
            });
            textInput.value = '';
            fileInput.value = null;
            fileNameDisplay.textContent = 'Ningún archivo seleccionado';
        } catch (error) {
            console.error('Error al enviar:', error);
            alert('Hubo un error al enviar el item.');
        }
    });

    // --- Lógica de Administrador ---

    // Limpiar todo el feed
    botonLimpiarTodo.addEventListener('click', async () => {
        if (!confirm('¿Estás seguro de que quieres borrar todos los elementos? Esta acción no se puede deshacer.')) {
            return;
        }
        try {
            // El servidor enviará un evento SSE que actualizará la UI
            const response = await fetch('/items', { method: 'DELETE' });
            if (!response.ok) throw new Error('El servidor rechazó la petición.');
        } catch (error) {
            console.error('Error al limpiar todo:', error);
            alert('No se pudieron borrar los elementos.');
        }
    });

    // Función para borrar un item individual
    const borrarItem = async (itemId) => {
        if (!confirm('¿Estás seguro de que quieres borrar este elemento?')) {
            return;
        }
        try {
            // El servidor enviará un evento SSE que actualizará la UI
            const response = await fetch(`/item/${itemId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('El servidor rechazó la petición.');
        } catch (error) {
            console.error(`Error al borrar el item ${itemId}:`, error);
            alert('No se pudo borrar el elemento.');
        }
    };


    // --- Renderizado de Items (Versión Admin) ---

    const renderItems = (items) => {
        feed.innerHTML = ''; // Limpiar el feed actual
        
        items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'elemento';
            const date = new Date(item.timestamp).toLocaleString();
            
            // Se añade el botón de borrar a las acciones del elemento y se usa el nombre y color del dispositivo
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
                copyBtn.onclick = () => {
                    navigator.clipboard.writeText(item.content).then(() => {
                        copyBtn.textContent = '¡Copiado!';
                        setTimeout(() => { copyBtn.textContent = 'Copiar'; }, 2000);
                    });
                };
                // Insertar antes del botón de borrar
                actionsDiv.insertBefore(copyBtn, actionsDiv.firstChild);

            } else if (item.type === 'file') {
                const isImage = item.mimeType && item.mimeType.startsWith('image/');
                
                if (isImage) {
                    const img = document.createElement('img');
                    img.src = `/uploads/${item.content}`;
                    img.alt = item.originalName;
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

            // Añadir el event listener para el botón de borrar de este item
            const botonBorrar = itemDiv.querySelector(`.boton-peligro[data-id="${item.id}"]`);
            botonBorrar.addEventListener('click', () => borrarItem(item.id));
        });
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
    
    // Carga inicial
    fetchItems();
    
    // Conexión al stream de eventos del servidor
    const eventSource = new EventSource('/events');

    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.event === 'update') {
            console.log('Recibida actualización del servidor, refrescando...');
            fetchItems();
        }
    };

    eventSource.onerror = () => {
        console.error('Error en la conexión SSE.');
        feed.innerHTML = `<p style="color: var(--danger);">Conexión con el servidor perdida. Intentando reconectar...</p>`;
    };
});