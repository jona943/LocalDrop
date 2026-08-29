import express from 'express';
import path from 'path';
import { uploadsDir, jsDir, cssDir, rootDir } from './utils/paths.js';
import apiRouter from './routes/api.js';
import * as deviceService from './services/deviceService.js';
import * as itemService from './services/itemService.js';

const app = express();

// --- Carga Inicial de Datos ---
deviceService.loadDevices();
itemService.loadItems();

console.log('✓ Datos iniciales cargados en memoria.');

// --- Middlewares de Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Servir Recursos Estáticos ---
app.use('/uploads', express.static(uploadsDir));
app.use('/css', express.static(cssDir));
app.use('/js', express.static(jsDir));

// --- Montar Rutas de API y SSE ---
app.use('/', apiRouter);

// --- Rutas del Frontend HTML ---
app.get('/', (req, res) => {
    res.sendFile(path.join(rootDir, 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(rootDir, 'admin.html'));
});

app.get('/file.html', (req, res) => {
    res.sendFile(path.join(rootDir, 'file.html'));
});

export default app;
