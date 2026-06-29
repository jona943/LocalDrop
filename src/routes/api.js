import express from 'express';
import multer from 'multer';
import sseExpress from 'sse-express';
import { uploadsDir } from '../utils/paths.js';
import * as apiController from '../controllers/apiController.js';

const router = express.Router();

// --- Configuración de Multer para Carga de Archivos ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ 
    storage: storage, 
    limits: { fileSize: 10 * 1024 * 1024 * 1024 } // Límite de 10GB
});

// --- Rutas de Autenticación y SSE ---
router.post('/login', apiController.login);
router.get('/events', sseExpress, apiController.handleEvents);

// --- Rutas de Dispositivos ---
router.get('/devices', apiController.getDevices);
router.post('/device/rename', apiController.renameDevice);
router.delete('/device/:id', apiController.deleteDevice);

// --- Rutas de Items (Texto y Archivos) ---
router.get('/items', apiController.getItems);
router.post('/item', upload.single('file'), apiController.createItem);
router.delete('/item/:id', apiController.deleteItem);
router.delete('/items', apiController.clearItems);

// --- Rutas de Utilidades y Disco ---
router.get('/api/files', apiController.getFiles);
router.get('/api/storage', apiController.getStorageInfo);

export default router;
