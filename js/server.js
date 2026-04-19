const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const sseExpress = require('sse-express');

const app = express();
const PORT = 3000;

// --- Configuración de Almacenamiento ---
const dataDir = path.join(__dirname, '..', 'data');
const uploadsDir = path.join(__dirname, '..', 'uploads');
const devicesFilePath = path.join(dataDir, 'devices.json');
const itemsFilePath = path.join(dataDir, 'items.json');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

let items = [];
let devices = {};
let clients = new Map();
let activeUserAgents = new Set();

// --- Carga Inicial de Datos ---
const loadData = () => {
    try {
        if (fs.existsSync(devicesFilePath)) devices = JSON.parse(fs.readFileSync(devicesFilePath, 'utf8'));
        if (fs.existsSync(itemsFilePath)) items = JSON.parse(fs.readFileSync(itemsFilePath, 'utf8'));
        console.log(`✓ Datos cargados: ${items.length} items, ${Object.keys(devices).length} dispositivos.`);
    } catch (e) { console.error('Error cargando datos:', e); }
};
loadData();

const saveDevices = () => fs.writeFileSync(devicesFilePath, JSON.stringify(devices, null, 2));
const saveItems = () => fs.writeFileSync(itemsFilePath, JSON.stringify(items, null, 2));

// --- Lógica de Dispositivos (Inteligente y Corta) ---
const generateColor = () => {
    const colors = ['#38bdf8', '#fb923c', '#f472b6', '#a78bfa', '#2dd4bf', '#facc15', '#4ade80'];
    return colors[Math.floor(Math.random() * colors.length)];
};

const getDeviceInfo = (req) => {
    const ua = (req.headers['user-agent'] || '').toLowerCase();
    const deviceId = req.query.deviceId || req.headers['x-device-id'] || 'anon';
    let ip = req.ip || req.connection.remoteAddress;
    if (ip.includes('::ffff:')) ip = ip.split(':').pop();

    if (!devices[deviceId]) {
        let os = 'Disp.';
        let browser = 'Web';

        if (ua.includes('windows')) os = 'PC Windows';
        else if (ua.includes('android')) os = 'Android';
        else if (ua.includes('iphone') || ua.includes('ipad')) os = 'Apple';
        else if (ua.includes('linux')) os = 'Linux';
        else if (ua.includes('macintosh')) os = 'Mac';

        if (ua.includes('chrome')) browser = 'Chrome';
        else if (ua.includes('firefox')) browser = 'Firefox';
        else if (ua.includes('safari')) browser = 'Safari';

        devices[deviceId] = {
            name: `${os}`, // Nombre corto de 2 palabras
            color: generateColor(),
            firstSeen: new Date().toISOString(),
            metadata: { browser, os, fullUA: req.headers['user-agent'] }
        };
    }

    devices[deviceId].lastIp = ip;
    devices[deviceId].lastSeen = new Date().toISOString();
    saveDevices();
    return devices[deviceId];
};

// --- Middleware y Estáticos ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage, limits: { fileSize: 10 * 1024 * 1024 * 1024 } });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));
app.use('/css', express.static(path.join(__dirname, '..', 'css')));
app.use('/js', express.static(path.join(__dirname, '..', 'js')));

// --- Eventos en Tiempo Real (SSE) ---
const broadcast = (event, data) => {
    clients.forEach(c => c.res.sse(event, data));
};

app.get('/events', sseExpress, (req, res) => {
    const deviceId = req.query.deviceId || 'anon';
    const connectionId = Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    
    clients.set(connectionId, { res, deviceId });
    activeUserAgents.add(deviceId);

    broadcast('connections_update', clients.size);
    broadcast('device_statuses_update', Array.from(activeUserAgents));

    req.on('close', () => {
        clients.delete(connectionId);
        const stillIn = Array.from(clients.values()).some(c => c.deviceId === deviceId);
        if (!stillIn) activeUserAgents.delete(deviceId);
        broadcast('connections_update', clients.size);
        broadcast('device_statuses_update', Array.from(activeUserAgents));
    });
});

// --- API ---
app.get('/', (req, res) => {
    const ip = (req.ip || '').includes('127.0.0.1') || (req.ip || '').includes('::1');
    res.sendFile(path.join(__dirname, '..', ip ? 'admin.html' : 'index.html'));
});

app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, '..', 'admin.html')));

app.get('/items', (req, res) => res.json(items.sort((a, b) => b.timestamp - a.timestamp)));

app.get('/devices', (req, res) => {
    getDeviceInfo(req);
    res.json(devices);
});

app.post('/item', upload.single('file'), (req, res) => {
    const dev = getDeviceInfo(req);
    const deviceId = req.query.deviceId || req.headers['x-device-id'] || 'anon';
    const timestamp = Date.now();
    let newItem = null;

    if (req.file) {
        newItem = {
            id: timestamp, type: 'file', deviceName: dev.name, color: dev.color, timestamp, userAgent: deviceId,
            content: req.file.filename, originalName: req.file.originalname, mimeType: req.file.mimetype
        };
    } else if (req.body.text) {
        newItem = { id: timestamp, type: 'text', deviceName: dev.name, color: dev.color, timestamp, userAgent: deviceId, content: req.body.text };
    }

    if (newItem) {
        items.push(newItem);
        saveItems();
        res.status(201).json(newItem);
        broadcast('update_items', { time: timestamp });
    } else res.status(400).send('No data');
});

app.delete('/item/:id', (req, res) => {
    const idx = items.findIndex(i => i.id == req.params.id);
    if (idx > -1) {
        const item = items[idx];
        if (item.type === 'file') {
            const p = path.join(uploadsDir, item.content);
            if (fs.existsSync(p)) fs.unlinkSync(p);
        }
        items.splice(idx, 1);
        saveItems();
        broadcast('update_items', { id: req.params.id });
        res.sendStatus(200);
    } else res.sendStatus(404);
});

app.delete('/items', (req, res) => {
    items.forEach(i => {
        if (i.type === 'file') {
            const p = path.join(uploadsDir, i.content);
            if (fs.existsSync(p)) fs.unlinkSync(p);
        }
    });
    items = [];
    saveItems();
    broadcast('update_items', { action: 'clear' });
    res.sendStatus(200);
});

app.post('/device/rename', (req, res) => {
    const { userAgent, newName } = req.body;
    if (devices[userAgent]) {
        devices[userAgent].name = newName;
        saveDevices();
        items.forEach(i => { if (i.userAgent === userAgent) i.deviceName = newName; });
        saveItems();
        broadcast('update_items', { action: 'rename' });
        res.sendStatus(200);
    } else res.sendStatus(404);
});

app.delete('/device/:id', (req, res) => {
    if (devices[req.params.id]) {
        delete devices[req.params.id];
        saveDevices();
        res.sendStatus(200);
    } else res.sendStatus(404);
});

// --- Servidor ---
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 LocalDrop en marcha\n   IP Local: http://${Object.values(os.networkInterfaces()).flat().find(i => i.family === 'IPv4' && !i.internal).address}:${PORT}\n`);
});

server.timeout = 3600000;
