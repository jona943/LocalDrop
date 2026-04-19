document.addEventListener('DOMContentLoaded', () => {
    // --- Gestión de Identidad y Cookies ---
    const checkCookies = () => {
        const consent = localStorage.getItem('localDrop_consent');
        if (!consent) {
            const banner = document.createElement('div');
            banner.className = 'cookie-banner';
            banner.style.display = 'block';
            banner.innerHTML = `
                <p>Utilizamos almacenamiento local para recordar tu dispositivo y preferencias.</p>
                <div class="cookie-actions">
                    <button class="btn-accept" id="cookie-accept">Aceptar</button>
                    <button class="btn-decline" id="cookie-decline">Rechazar</button>
                </div>
            `;
            document.body.appendChild(banner);
            document.getElementById('cookie-accept').onclick = () => {
                localStorage.setItem('localDrop_consent', 'true');
                banner.style.display = 'none';
            };
            document.getElementById('cookie-decline').onclick = () => {
                banner.style.display = 'none';
            };
        }
    };

    const getDeviceId = () => {
        let id = localStorage.getItem('localDrop_deviceId');
        if (!id) {
            id = 'dev_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('localDrop_deviceId', id);
        }
        return id;
    };

    const deviceId = getDeviceId();
    checkCookies();

    // --- Referencias a Elementos ---
    const form = document.getElementById('formulario-subida');
    const textInput = document.getElementById('entrada-texto');
    const fileInput = document.getElementById('entrada-archivo');
    const fileNameDisplay = document.getElementById('nombre-archivo');
    const feed = document.getElementById('listado');
    const progresoContenedor = document.getElementById('progreso-contenedor');
    const progresoBarra = document.getElementById('progreso-barra');
    const textoProgreso = document.getElementById('texto-progreso');
    const formContainer = document.querySelector('.formulario-contenedor');
    const listaDispositivosMini = document.getElementById('lista-dispositivos-mini');
    
    const modalInfo = document.getElementById('modal-info');
    const abrirInfoBtn = document.getElementById('abrir-info');
    const cerrarInfoBtn = document.getElementById('cerrar-info');

    // --- Lógica del Modal ---
    if (abrirInfoBtn && modalInfo) {
        abrirInfoBtn.onclick = (e) => { e.preventDefault(); modalInfo.style.display = 'flex'; };
        if (cerrarInfoBtn) cerrarInfoBtn.onclick = () => { modalInfo.style.display = 'none'; };
        window.onclick = (e) => { if (e.target === modalInfo) modalInfo.style.display = 'none'; };
    }

    // --- Lógica de Dispositivos ---
    const fetchAndRenderDevices = async (activeUAs = []) => {
        try {
            const response = await fetch('/devices', { headers: { 'x-device-id': deviceId } });
            const devices = await response.json();
            if (listaDispositivosMini) {
                listaDispositivosMini.innerHTML = '';
                Object.keys(devices).forEach(ua => {
                    const device = devices[ua];
                    const isConnected = activeUAs.includes(ua);
                    const item = document.createElement('div');
                    item.className = 'dispositivo-mini-item';
                    item.innerHTML = `
                        <span class="status-indicator ${isConnected ? 'status-online' : 'status-offline'}"></span>
                        <span style="color: ${device.color}; font-weight: 500;">${device.name}</span>
                    `;
                    listaDispositivosMini.appendChild(item);
                });
            }
        } catch (error) { console.error('Error dispositivos:', error); }
    };

    // --- Interfaz Archivos ---
    if (fileInput) {
        fileInput.onchange = () => {
            fileNameDisplay.textContent = fileInput.files.length > 0 ? fileInput.files[0].name : 'Ningún archivo seleccionado';
        };
    }

    // --- Drag and Drop ---
    if (formContainer) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(ev => {
            formContainer.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); });
        });
        ['dragenter', 'dragover'].forEach(ev => {
            formContainer.addEventListener(ev, () => formContainer.classList.add('drag-active'));
        });
        ['dragleave', 'drop'].forEach(ev => {
            formContainer.addEventListener(ev, () => formContainer.classList.remove('drag-active'));
        });
        formContainer.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            if (dt.files.length > 0) {
                fileInput.files = dt.files;
                fileInput.dispatchEvent(new Event('change'));
            }
        });
    }

    // --- Envío de Formulario ---
    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            const text = textInput.value.trim();
            const file = fileInput.files[0];
            if (!text && !file) return;

            const formData = new FormData();
            if (text) formData.append('text', text);
            if (file) formData.append('file', file);

            const xhr = new XMLHttpRequest();
            const submitButton = form.querySelector('button[type="submit"]');

            submitButton.disabled = true;
            if (progresoContenedor) progresoContenedor.style.display = 'block';
            if (progresoBarra) progresoBarra.style.width = '0%';

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const porc = Math.round((e.loaded / e.total) * 100);
                    if (progresoBarra) progresoBarra.style.width = porc + '%';
                    if (textoProgreso) textoProgreso.textContent = `Subiendo: ${porc}%`;
                }
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    textInput.value = '';
                    fileInput.value = null;
                    fileNameDisplay.textContent = 'Ningún archivo seleccionado';
                    setTimeout(() => {
                        if (progresoContenedor) progresoContenedor.style.display = 'none';
                        if (textoProgreso) textoProgreso.textContent = '';
                    }, 2000);
                }
                submitButton.disabled = false;
            };
            xhr.open('POST', '/item');
            xhr.setRequestHeader('x-device-id', deviceId);
            xhr.send(formData);
        };
    }

    // --- Renderizado de Mensajes ---
    const renderItems = (items) => {
        if (!feed) return;
        feed.innerHTML = '';
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'elemento';
            div.innerHTML = `
                <div class="elemento-cabecera">
                    <span style="color: ${item.color}; font-weight: bold;">${item.deviceName}</span> @ ${new Date(item.timestamp).toLocaleString()}
                </div>
                <div class="elemento-contenido" id="cont-${item.id}"></div>
                <div class="elemento-acciones" id="acc-${item.id}"></div>
            `;
            feed.appendChild(div);

            const cDiv = document.getElementById(`cont-${item.id}`);
            const aDiv = document.getElementById(`acc-${item.id}`);

            if (item.type === 'text') {
                const pre = document.createElement('pre');
                pre.textContent = item.content;
                cDiv.appendChild(pre);
                const btn = document.createElement('button');
                btn.textContent = 'Copiar';
                btn.onclick = () => {
                    navigator.clipboard.writeText(item.content);
                    btn.textContent = '¡Copiado!';
                    setTimeout(() => btn.textContent = 'Copiar', 2000);
                };
                aDiv.appendChild(btn);
            } else {
                if (item.mimeType && item.mimeType.startsWith('image/')) {
                    const img = document.createElement('img');
                    img.src = `/uploads/${item.content}`;
                    cDiv.appendChild(img);
                } else {
                    const p = document.createElement('p');
                    p.textContent = `Archivo: ${item.originalName}`;
                    cDiv.appendChild(p);
                }
                const link = document.createElement('a');
                link.href = `/uploads/${item.content}`;
                link.textContent = 'Descargar';
                link.download = item.originalName;
                aDiv.appendChild(link);
            }
        });
    };

    const fetchItems = async () => {
        try {
            const res = await fetch('/items');
            const data = await res.json();
            renderItems(data);
        } catch (e) { console.error('Error items:', e); }
    };

    // --- TIEMPO REAL (SSE) ---
    fetchItems();
    fetchAndRenderDevices();
    
    const eventSource = new EventSource(`/events?deviceId=${deviceId}`);
    
    // Listener universal para cualquier mensaje del servidor
    eventSource.onmessage = (e) => {
        console.log('Mensaje SSE recibido:', e.data);
        fetchItems();
        fetchAndRenderDevices();
    };

    // Listener específico para actualización de items
    eventSource.addEventListener('update_items', () => {
        console.log('Evento update_items -> Refrescando');
        fetchItems();
    });

    eventSource.addEventListener('device_statuses_update', (e) => {
        const uas = JSON.parse(e.data);
        fetchAndRenderDevices(uas);
    });

    eventSource.onerror = () => {
        console.warn('Conexión SSE perdida. Reconectando...');
    };
});
