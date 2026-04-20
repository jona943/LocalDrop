document.addEventListener('DOMContentLoaded', () => {
    // Inyectar Header y Configuración Inicial
    LocalDropUtils.injectHeader();
    
    const landingPage = document.getElementById('landing-page');
    const modalRegistro = document.getElementById('modal-registro');
    const headerPrincipal = document.querySelector('.encabezado-principal');
    const contenidoPrincipal = document.querySelector('.contenido-principal');

    // --- Lógica de Landing y Registro ---
    const btnEmpezarPublico = document.getElementById('btn-empezar-publico');
    const btnEmpezarAdmin = document.getElementById('btn-empezar-admin');
    const btnGenerarAcceso = document.getElementById('btn-generar-acceso');
    const btnEntrar = document.getElementById('btn-entrar');
    const inputNombre = document.getElementById('nombre-usuario');
    const infoRegistro = document.getElementById('info-registro');
    const sectionPublic = document.getElementById('section-public');
    const sectionAdmin = document.getElementById('section-admin');
    const linkShowAdmin = document.getElementById('link-show-admin');
    const linkShowPublic = document.getElementById('link-show-public');
    const btnLoginAdmin = document.getElementById('btn-login-admin');

    // --- Redirecciones de Sesión ---
    const urlParams = new URLSearchParams(window.location.search);
    const isLanding = urlParams.get('view') === 'landing';

    if (isLanding) {
        localStorage.removeItem('ld_user');
        localStorage.removeItem('ld_role');
        headerPrincipal.style.display = 'none';
    } else if (localStorage.getItem('ld_role') === 'admin') {
        window.location.href = '/admin';
    } else if (localStorage.getItem('ld_user')) {
        landingPage.style.display = 'none';
        modalRegistro.style.display = 'none';
        headerPrincipal.style.display = 'block';
        contenidoPrincipal.style.display = 'block';
    } else {
        headerPrincipal.style.display = 'none';
    }

    btnEmpezarPublico.onclick = () => {
        landingPage.style.display = 'none';
        modalRegistro.style.display = 'flex';
        sectionPublic.style.display = 'block';
        sectionAdmin.style.display = 'none';
    };

    btnEmpezarAdmin.onclick = () => {
        landingPage.style.display = 'none';
        modalRegistro.style.display = 'flex';
        sectionPublic.style.display = 'none';
        sectionAdmin.style.display = 'block';
    };

    linkShowAdmin.onclick = (e) => { e.preventDefault(); sectionPublic.style.display = 'none'; sectionAdmin.style.display = 'block'; };
    linkShowPublic.onclick = (e) => { e.preventDefault(); sectionAdmin.style.display = 'none'; sectionPublic.style.display = 'block'; };

    btnLoginAdmin.onclick = async () => {
        const user = document.getElementById('admin-user').value;
        const pass = document.getElementById('admin-pass').value;
        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user, pass })
            });
            if (response.ok) {
                localStorage.setItem('ld_role', 'admin');
                window.location.href = '/admin';
            } else alert('Credenciales incorrectas.');
        } catch (err) { console.error(err); }
    };

    btnGenerarAcceso.onclick = () => {
        const nombre = inputNombre.value.trim();
        if (!nombre) return alert('Introduce un nombre.');
        document.getElementById('reg-dispositivo').textContent = detectarDispositivo();
        document.getElementById('reg-password').textContent = generarPassword();
        infoRegistro.style.display = 'block';
        btnGenerarAcceso.style.display = 'none';
        btnEntrar.style.display = 'block';
        inputNombre.disabled = true;
        localStorage.setItem('ld_user', nombre);
    };

    btnEntrar.onclick = async () => {
        await fetch('/devices'); // Sincronizar nombre
        modalRegistro.style.display = 'none';
        headerPrincipal.style.display = 'block';
        contenidoPrincipal.style.display = 'block';
    };

    const generarPassword = (l = 8) => {
        const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let p = ''; for (let i = 0; i < l; i++) p += c.charAt(Math.floor(Math.random() * c.length));
        return p;
    };

    const detectarDispositivo = () => {
        const ua = navigator.userAgent.toLowerCase();
        if (ua.includes('windows')) return 'PC Windows';
        if (ua.includes('android')) return 'Android';
        if (ua.includes('iphone') || ua.includes('ipad')) return 'Apple';
        if (ua.includes('linux')) return 'Linux';
        return 'Dispositivo';
    };

    // --- Lógica del Panel ---
    const form = document.getElementById('formulario-subida');
    const feed = document.getElementById('listado');
    const listaDispositivosMini = document.getElementById('lista-dispositivos-mini');

    const renderItem = (item) => {
        const div = document.createElement('div');
        div.className = 'elemento';
        const isFile = item.type === 'file';
        const ext = isFile ? LocalDropUtils.getFileExtension(item.content) : '';
        const isImage = isFile && item.content.match(/\.(jpeg|jpg|gif|png|svg)$/i);
        
        div.innerHTML = `
            <div class="elemento-cabecera" style="color: ${item.color}">${item.deviceName} • ${new Date(item.timestamp).toLocaleTimeString()}</div>
            <div class="elemento-contenido">
                ${isFile ? (isImage ? `<img src="/uploads/${item.content}">` : `<p>Archivo: ${item.originalName}</p>`) : `<pre>${item.content}</pre>`}
            </div>
            <div class="elemento-acciones">
                ${isFile ? `<a href="/uploads/${item.content}" download="${item.originalName}">Descargar</a>` : `<button onclick="navigator.clipboard.writeText('${item.content}')">Copiar</button>`}
            </div>
        `;
        return div;
    };

    const updateFeed = async () => {
        const res = await fetch('/items');
        const items = await res.json();
        feed.innerHTML = '';
        items.forEach(i => feed.appendChild(renderItem(i)));
    };

    const updateDevices = async (activeUAs = []) => {
        const res = await fetch('/devices');
        const devices = await res.json();
        if (listaDispositivosMini) {
            listaDispositivosMini.innerHTML = '';
            Object.keys(devices).forEach(ua => {
                const dev = devices[ua];
                const item = document.createElement('div');
                item.className = 'dispositivo-mini-item';
                item.innerHTML = `<span class="status-indicator ${activeUAs.includes(ua) ? 'status-online' : 'status-offline'}"></span><span style="color: ${dev.color}">${dev.name}</span>`;
                listaDispositivosMini.appendChild(item);
            });
        }
    };

    form.onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        const file = document.getElementById('entrada-archivo').files[0];
        const text = document.getElementById('entrada-texto').value;
        if (file) formData.append('file', file);
        if (text) formData.append('text', text);
        await fetch('/item', { method: 'POST', body: formData });
        form.reset();
        document.getElementById('nombre-archivo').textContent = 'Ningún archivo seleccionado';
    };

    const ev = new EventSource(`/events?deviceId=${LocalDropUtils.getDeviceId()}`);
    ev.addEventListener('update_items', updateFeed);
    ev.addEventListener('device_statuses_update', (e) => updateDevices(JSON.parse(e.data)));
    
    updateFeed();
});
