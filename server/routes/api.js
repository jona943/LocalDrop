import express from 'express';
import multer from 'multer';
import sseExpress from 'sse-express';
import { uploadsDir } from '../utils/paths.js';
import * as apiController from '../controllers/apiController.js';
import * as storageController from '../controllers/storageController.js';

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

// --- Rutas del Gestor de Almacenamiento & Papelera (Fase 1) ---
router.get('/disks', storageController.getDisks);
router.get('/explore', storageController.explorePath);
router.post('/trash', storageController.moveToTrash);
router.post('/delete-permanent', storageController.deletePermanently);

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
router.get('/files', apiController.getFiles);
router.get('/storage', apiController.getStorageInfo);

export default router;
