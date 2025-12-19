document.addEventListener('DOMContentLoaded', () => {
    const fileContainer = document.getElementById('galeria-archivos');

    const extensionIcons = {
        'pdf': '/img/extenciones-iconos/pdf.png',
        'txt': '/img/extenciones-iconos/txt.png',
        'js': '/img/extenciones-iconos/js.png',
        'css': '/img/extenciones-iconos/css.png',
        'py': '/img/extenciones-iconos/py.png',
        // Añade más extensiones e iconos aquí si es necesario
    };

    const getFileExtension = (filename) => {
        return filename.split('.').pop().toLowerCase();
    };

    const fetchAndRenderFiles = async () => {
        try {
            const response = await fetch('/api/files');
            if (!response.ok) {
                throw new Error(`Error al obtener los archivos: ${response.statusText}`);
            }
            const files = await response.json();
            renderFiles(files);
        } catch (error) {
            console.error(error);
            fileContainer.innerHTML = '<p>Error al cargar los archivos. Inténtalo de nuevo más tarde.</p>';
        }
    };

    const renderFiles = (files) => {
        if (files.length === 0) {
            fileContainer.innerHTML = '<p>No hay archivos subidos todavía.</p>';
            return;
        }

        fileContainer.innerHTML = ''; // Limpiar el contenedor
        // const fileGrid = document.createElement('div'); // This line is not needed as fileContainer is already #galeria-archivos
        // fileGrid.className = 'file-grid'; // This is handled by fileContainer

        files.forEach(file => {
            const fileCard = document.createElement('div');
            fileCard.className = 'file-card';

            const fileNameElem = document.createElement('p');
            fileNameElem.className = 'file-name';
            fileNameElem.textContent = file.name;
            
            const filePreview = document.createElement('div');
            filePreview.className = 'file-preview'; // Contenedor para la imagen/icono

            const fileExtension = getFileExtension(file.name);
            const isImage = file.name.match(/\.(jpeg|jpg|gif|png|svg)$/i);

            if (isImage) {
                fileCard.classList.add('is-image'); // Añadir clase para tarjetas de imagen
                const thumbnail = document.createElement('img');
                thumbnail.src = `/uploads/${file.name}`;
                thumbnail.className = 'file-thumbnail';
                filePreview.appendChild(thumbnail);
            } else {
                fileCard.classList.add('is-icon'); // Añadir clase para tarjetas de icono
                const iconPath = extensionIcons[fileExtension] || '/img/extenciones-iconos/archivo-roto.png'; // Usar icono de archivo roto si no se encuentra
                // Solo crear el elemento de imagen si se tiene una ruta de icono (ya sea específica o fallback)
                if (iconPath) {
                    const icon = document.createElement('img');
                    icon.src = iconPath;
                    icon.className = 'file-icon'; // Nueva clase para iconos de archivo
                    icon.alt = `Icono de ${fileExtension}`;
                    filePreview.appendChild(icon);
                }
            }

            const fileDateElem = document.createElement('p');
            fileDateElem.className = 'file-date';
            fileDateElem.textContent = new Date(file.createdAt).toLocaleString();

            const downloadLink = document.createElement('a');
            downloadLink.href = `/uploads/${file.name}`;
            downloadLink.textContent = 'Descargar';
            downloadLink.className = 'download-button';
            downloadLink.download = file.name;

            fileCard.appendChild(fileNameElem);
            fileCard.appendChild(filePreview);
            fileCard.appendChild(fileDateElem);
            fileCard.appendChild(downloadLink);
            fileContainer.appendChild(fileCard); // Añadir la tarjeta directamente al fileContainer
        });
        // fileContainer.appendChild(fileGrid); // This line is not needed
    };

    fetchAndRenderFiles();
});