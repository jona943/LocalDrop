import express from 'express';
import path from 'path';
import cors from 'cors';
import { uploadsDir, serverDir } from './utils/paths.js';
import apiRouter from './routes/api.js';
import * as deviceService from './services/deviceService.js';
import * as itemService from './services/itemService.js';

const app = express();

// --- Carga Inicial de Datos ---
deviceService.loadDevices();
itemService.loadItems();

console.log('✓ Datos iniciales cargados en memoria.');

// --- Middlewares ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Servir Archivos Subidos ---
app.use('/uploads', express.static(uploadsDir));

// --- Montar Rutas de API y SSE ---
app.use('/', apiRouter);

// --- Servir Build de Frontend React (Si existe) ---
const frontendDist = path.join(serverDir, '../frontend/dist');
app.use(express.static(frontendDist));

app.use((req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
        if (err) {
            res.status(404).send('LocalDrop Backend running. Frontend dist not built yet.');
        }
    });
});

export default app;
