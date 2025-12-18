document.addEventListener('DOMContentLoaded', () => {
            const form = document.getElementById('formulario-subida');
            const textInput = document.getElementById('entrada-texto');
            const fileInput = document.getElementById('entrada-archivo');
            const fileNameDisplay = document.getElementById('nombre-archivo');
            const feed = document.getElementById('listado');
            
            const POLLING_INTERVAL = 4000; // 4 segundos para un balance óptimo

            // --- Lógica de la Interfaz ---

            fileInput.addEventListener('change', () => {
                fileNameDisplay.textContent = fileInput.files.length > 0
                    ? fileInput.files[0].name
                    : 'Ningún archivo seleccionado';
            });
            
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
                    // La subida de datos ahora notificará a todos los clientes (incluido este)
                    // a través del evento SSE, por lo que no es necesario llamar a fetchItems() aquí.
                    await fetch('/item', {
                        method: 'POST',
                        body: formData,
                    });

                    // Limpiar formulario
                    textInput.value = '';
                    fileInput.value = null;
                    fileNameDisplay.textContent = 'Ningún archivo seleccionado';

                } catch (error) {
                    console.error('Error al enviar:', error);
                    alert('Hubo un error al enviar el item.');
                }
            });

            // --- Renderizado de Items ---

            const renderItems = (items) => {
                feed.innerHTML = ''; // Limpiar el feed actual
                
                items.forEach(item => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'elemento';

                    const date = new Date(item.timestamp).toLocaleString();
                    
                    itemDiv.innerHTML = `
                        <div class="elemento-cabecera">
                            <span>[${item.device}]</span> @ <span>${date}</span>
                        </div>
                        <div class="elemento-contenido" id="contenido-${item.id}"></div>
                        <div class="elemento-acciones" id="acciones-${item.id}"></div>
                    `;

                    feed.appendChild(itemDiv);

                    const contentDiv = document.getElementById(`contenido-${item.id}`);
                    const actionsDiv = document.getElementById(`acciones-${item.id}`);

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
                        actionsDiv.appendChild(copyBtn);

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
                        actionsDiv.appendChild(downloadLink);
                    }
                });
            };

            // --- Sincronización en Tiempo Real (SSE) ---
            
            const fetchItems = async () => {
                try {
                    const response = await fetch('/items'); // Corregido de /item a /items
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
            
            // Cuando el servidor envía un mensaje, refrescamos el contenido
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