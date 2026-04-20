/**
 * LocalDrop Utils - Funciones compartidas
 */

const LocalDropUtils = {
    extensionIcons: {
        'pdf': '/img/extenciones-iconos/pdf.png',
        'txt': '/img/extenciones-iconos/txt.png',
        'js': '/img/extenciones-iconos/js.png',
        'css': '/img/extenciones-iconos/css.png',
        'py': '/img/extenciones-iconos/py.png',
        'default': '/img/extenciones-iconos/archivo-roto.png'
    },

    formatBytes: (bytes, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    },

    getFileExtension: (filename) => filename.split('.').pop().toLowerCase(),

    getDeviceId: () => {
        let id = localStorage.getItem('localDrop_deviceId');
        if (!id) {
            id = 'dev_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('localDrop_deviceId', id);
        }
        return id;
    },

    setupInterceptor: () => {
        const originalFetch = window.fetch;
        window.fetch = function() {
            let [resource, config] = arguments;
            if (!config) config = {};
            if (!config.headers) config.headers = {};
            config.headers['x-device-id'] = LocalDropUtils.getDeviceId();
            const userName = localStorage.getItem('ld_user');
            if (userName) config.headers['x-user-name'] = userName;
            return originalFetch(resource, config);
        };
    },

    injectHeader: (titleSuffix = "") => {
        const header = document.querySelector('.encabezado-principal');
        if (!header) return;
        
        // El logo es el H1 con la clase encabezado-principal__titulo
        header.innerHTML = `
            <div class="contenedor">
                <h1 class="encabezado-principal__titulo">LocalDrop ${titleSuffix}</h1>
                <nav class="navegacion-principal">
                    <a href="/?view=landing">Inicio</a>
                    <a href="/">Panel</a>
                    <a href="/file.html">Archivos</a>
                    <a href="#" id="abrir-info">Info</a>
                </nav>
            </div>
        `;
        
        // Mostrar el header si estaba oculto
        header.style.display = 'block';

        const btn = document.getElementById('abrir-info');
        if (btn) btn.onclick = (e) => {
            e.preventDefault();
            const modal = document.getElementById('modal-info');
            if (modal) modal.style.display = 'flex';
        };
    }
};

LocalDropUtils.setupInterceptor();
