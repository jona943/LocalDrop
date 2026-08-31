import * as storageService from '../services/storageService.js';

// GET /api/disks - Listar unidades detectadas
export const getDisks = async (req, res) => {
    try {
        const disks = await storageService.listDisks();
        res.json(disks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/temperature - Obtener la temperatura del servidor
export const getTemperature = async (req, res) => {
    try {
        const tempInfo = await storageService.getCpuTemperature();
        res.json(tempInfo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/explore?path=/ruta - Explorar carpetas reales
export const explorePath = async (req, res) => {
    try {
        const targetPath = req.query.path || '/';
        const data = await storageService.exploreDirectory(targetPath);
        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// POST /api/trash - Mover a papelera (retención 30 días)
export const moveToTrash = async (req, res) => {
    try {
        const { filePath } = req.body;
        if (!filePath) return res.status(400).json({ error: 'Ruta de archivo requerida.' });
        
        const result = await storageService.moveToTrash(filePath);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// DELETE /api/permanent - Borrado definitivo inmediato con contraseña
export const deletePermanently = async (req, res) => {
    try {
        const { filePath, password } = req.body;
        if (!filePath || !password) {
            return res.status(400).json({ error: 'Ruta y contraseña requeridas para borrado definitivo.' });
        }
        
        const result = await storageService.deletePermanently(filePath, password);
        res.json(result);
    } catch (error) {
        res.status(403).json({ error: error.message });
    }
};

// GET /file-raw?path=/ruta/al/archivo - Transmitir/Descargar archivo desde cualquier ruta
export const getFileRaw = async (req, res) => {
    try {
        const targetPath = req.query.path;
        const isDownload = req.query.download === 'true';
        
        if (!targetPath) {
            return res.status(400).json({ error: 'Ruta de archivo no especificada.' });
        }

        const resolved = storageService.pathResolve(targetPath);
        if (!storageService.fileExists(resolved)) {
            return res.status(404).json({ error: 'Archivo no encontrado.' });
        }

        if (isDownload) {
            res.download(resolved);
        } else {
            res.sendFile(resolved);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// POST /create-folder - Crear una nueva carpeta en la ruta actual
export const createFolder = async (req, res) => {
    try {
        const { targetPath, folderName } = req.body;
        if (!targetPath || !folderName) {
            return res.status(400).json({ error: 'Ruta y nombre de carpeta requeridos.' });
        }
        const result = await storageService.createFolder(targetPath, folderName);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// POST /upload-to-path - Cargar archivo directamente a la ruta actual
export const uploadToPath = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se ha adjuntado ningún archivo.' });
        }
        res.json({ success: true, file: req.file });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

