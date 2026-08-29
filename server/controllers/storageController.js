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
