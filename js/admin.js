document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('ld_role') !== 'admin') {
        window.location.href = '/';
        return;
    }
    // --- Referencias a Elementos del DOM ---
    const form = document.getElementById('formulario-subida');
    const textInput = document.getElementById('entrada-texto');
    const fileInput = document.getElementById('entrada-archivo');
    const fileNameDisplay = document.getElementById('nombre-archivo');
    const feed = document.getElementById('listado');
    const botonLimpiarTodo = document.getElementById('boton-limpiar-todo');
    const dispositivosLista = document.getElementById('dispositivos-lista');
    const estadoSubida = document.getElementById('estado-subida');
    const textoProgreso = document.getElementById('texto-progreso');
    const progresoContenedor = document.getElementById('progreso-contenedor');
    const progresoBarra = document.getElementById('progreso-barra');
    const formContainer = document.querySelector('.formulario-contenedor');
    const modalInfo = document.getElementById('modal-info');
    const abrirInfoBtn = document.getElementById('abrir-info');
    const cerrarInfoBtn = document.getElementById('cerrar-info');

    let currentActiveUserAgents = [];

    // --- Lógica del Modal ---
    if (abrirInfoBtn && modalInfo) {
        abrirInfoBtn.onclick = (e) => { e.preventDefault(); modalInfo.style.display = 'flex'; };
        cerrarInfoBtn.onclick = () => { modalInfo.style.display = 'none'; };
        window.onclick = (e) => { if (e.target === modalInfo) modalInfo.style.display = 'none'; };
    }

    // --- Lógica de Drag and Drop ---
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

    // --- Lógica de la Interfaz ---
    fileInput.onchange = () => {
        fileNameDisplay.textContent = fileInput.files.length > 0 ? fileInput.files[0].name : 'Ningún archivo seleccionado';
    };

    // Envío del formulario
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
        if (textoProgreso) textoProgreso.textContent = 'Subiendo...';

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
                if (textoProgreso) textoProgreso.textContent = '¡Hecho!';
                setTimeout(() => {
                    if (progresoContenedor) progresoContenedor.style.display = 'none';
                    if (textoProgreso) textoProgreso.textContent = '';
                }, 2000);
            } else { alert('Error al enviar.'); }
            submitButton.disabled = false;
        };
        xhr.onerror = () => { alert('Error.'); submitButton.disabled = false; };
        xhr.open('POST', '/item');
        xhr.send(formData);
    };

    // --- Lógica de Administrador ---
    botonLimpiarTodo.onclick = async () => {
        if (!confirm('¿Borrar todo el historial?')) return;
        await fetch('/items', { method: 'DELETE' });
    };

    const borrarItem = async (id) => {
        if (!confirm('¿Borrar este item?')) return;
        await fetch(`/item/${id}`, { method: 'DELETE' });
    };

    const renombrarDispositivo = async (ua, newName) => {
        await fetch('/device/rename', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userAgent: ua, newName })
        });
    };

    const borrarDispositivo = async (ua) => {
        if (!confirm('¿Eliminar dispositivo?')) return;
        await fetch(`/device/${encodeURIComponent(ua)}`, { method: 'DELETE' });
    };

    // --- Renderizado ---
    const renderItems = (items) => {
        feed.innerHTML = '';
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'elemento';
            div.innerHTML = `
                <div class="elemento-cabecera">
                    <span style="color: ${item.color}; font-weight: bold;">${item.deviceName}</span> @ ${new Date(item.timestamp).toLocaleString()}
                </div>
                <div class="elemento-contenido" id="cont-${item.id}"></div>
                <div class="elemento-acciones" id="acc-${item.id}">
                    <button class="boton-peligro" onclick="borrarItem(${item.id})">Borrar</button>
                </div>
            `;
            feed.appendChild(div);

            const cDiv = document.getElementById(`cont-${item.id}`);
            const aDiv = document.getElementById(`acc-${item.id}`);

            if (item.type === 'text') {
                const pre = document.createElement('pre');
                pre.textContent = item.content;
                cDiv.appendChild(pre);
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
                aDiv.insertBefore(link, aDiv.firstChild);
            }
        });
    };

    const fetchItems = async () => {
        const res = await fetch('/items');
        renderItems(await res.json());
    };

    const fetchAndRenderDevices = async (activeUAs = currentActiveUserAgents) => {
        const res = await fetch('/devices');
        const devices = await res.json();
        dispositivosLista.innerHTML = '';
        for (const ua in devices) {
            const dev = devices[ua];
            const isConnected = activeUAs.includes(ua);
            const div = document.createElement('div');
            div.className = 'dispositivo-item';
            div.style.borderColor = dev.color;
            div.innerHTML = `
                <div class="dispositivo-info">
                    <span class="status-dot ${isConnected ? 'active' : 'inactive'}"></span>
                    <input type="text" value="${dev.name}">
                </div>
                <div class="dispositivo-acciones">
                    <button class="save-btn" data-ua="${encodeURIComponent(ua)}">Guardar</button>
                    <button class="boton-peligro del-btn" data-ua="${encodeURIComponent(ua)}">X</button>
                </div>
            `;
            dispositivosLista.appendChild(div);
        }
        dispositivosLista.querySelectorAll('.save-btn').forEach(b => {
            b.onclick = () => renombrarDispositivo(decodeURIComponent(b.dataset.ua), b.closest('.dispositivo-item').querySelector('input').value);
        });
        dispositivosLista.querySelectorAll('.del-btn').forEach(b => {
            b.onclick = () => borrarDispositivo(decodeURIComponent(b.dataset.ua));
        });
    };

    // --- Globales para que funcionen los onclick inline ---
    window.borrarItem = borrarItem;

    // --- Tiempo Real (SSE) ---
    fetchItems();
    fetchAndRenderDevices();

    // Obtener deviceId de localstorage para admin también
    const deviceId = localStorage.getItem('localDrop_deviceId') || 'admin';
    
    const eventSource = new EventSource(`/events?deviceId=${deviceId}`);
    eventSource.addEventListener('update_items', () => { fetchItems(); });
    eventSource.addEventListener('device_statuses_update', (e) => {
        currentActiveUserAgents = JSON.parse(e.data);
        fetchAndRenderDevices();
    });
    eventSource.addEventListener('connections_update', (e) => {
        const el = document.getElementById('connection-count');
        if (el) el.textContent = e.data;
    });
});
