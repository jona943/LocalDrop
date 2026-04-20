document.addEventListener('DOMContentLoaded', () => {
    // 1. Configuración de Identidad y Header
    LocalDropUtils.setupInterceptor();
    LocalDropUtils.injectHeader();

    const fileContainer = document.getElementById('galeria-archivos');

    // 2. Función para obtener y renderizar archivos
    const fetchAndRenderFiles = async () => {
        try {
            const response = await fetch('/api/files');
            if (!response.ok) throw new Error('Error al obtener archivos');
            const files = await response.json();
            
            if (files.length === 0) {
                fileContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No hay archivos subidos todavía.</p>';
                return;
            }

            fileContainer.innerHTML = '';
            files.forEach(file => {
                const fileCard = document.createElement('div');
                fileCard.className = 'file-card';

                const ext = LocalDropUtils.getFileExtension(file.name);
                const isImage = file.name.match(/\.(jpeg|jpg|gif|png|svg)$/i);
                const iconPath = LocalDropUtils.extensionIcons[ext] || LocalDropUtils.extensionIcons.default;

                fileCard.innerHTML = `
                    <p class="file-name" title="${file.name}">${file.name}</p>
                    <div class="file-preview ${isImage ? 'is-image' : 'is-icon'}">
                        ${isImage ? `<img src="/uploads/${file.name}" class="file-thumbnail">` : `<img src="${iconPath}" class="file-icon">`}
                    </div>
                    <p class="file-date">${new Date(file.createdAt).toLocaleString()}</p>
                    <a href="/uploads/${file.name}" class="download-button" download="${file.name}">Descargar</a>
                `;
                fileContainer.appendChild(fileCard);
            });
        } catch (error) {
            console.error('Error Galería:', error);
            fileContainer.innerHTML = '<p style="text-align: center; color: var(--danger);">Error al cargar la galería.</p>';
        }
    };

    // 3. Estado del almacenamiento
    const fetchAndRenderStorage = async () => {
        const usedBar = document.getElementById('storage-used-bar');
        const statusText = document.getElementById('storage-status-text');
        try {
            const response = await fetch('/api/storage');
            const { total, used } = await response.json();
            const percentage = total > 0 ? (used / total) * 100 : 0;
            
            if (usedBar) usedBar.style.width = `${percentage}%`;
            if (statusText) statusText.textContent = `${LocalDropUtils.formatBytes(used)} de ${LocalDropUtils.formatBytes(total)} usados`;
        } catch (error) {
            console.error('Error Storage:', error);
        }
    };

    // Ejecución inicial
    fetchAndRenderFiles();
    fetchAndRenderStorage();
});
