const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const sseExpress = require('sse-express');
const diskusage = require('diskusage');

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
    const customName = req.query.userName || req.headers['x-user-name'];
    let ip = req.ip || req.connection.remoteAddress;
    if (ip.includes('::ffff:')) ip = ip.split(':').pop();

    if (!devices[deviceId]) {
        let osName = 'Disp.';
        let browser = 'Web';

        if (ua.includes('windows')) osName = 'PC Windows';
        else if (ua.includes('android')) osName = 'Android';
        else if (ua.includes('iphone') || ua.includes('ipad')) osName = 'Apple';
        else if (ua.includes('linux')) osName = 'Linux';
        else if (ua.includes('macintosh')) osName = 'Mac';

        if (ua.includes('chrome')) browser = 'Chrome';
        else if (ua.includes('firefox')) browser = 'Firefox';
        else if (ua.includes('safari')) browser = 'Safari';

        devices[deviceId] = {
            os: osName,
            userName: customName || '',
            name: customName ? `${osName} - ${customName}` : osName,
            color: generateColor(),
            firstSeen: new Date().toISOString(),
            metadata: { browser, os: osName, fullUA: req.headers['user-agent'] }
        };
    } else if (customName && devices[deviceId].userName !== customName) {
        // Actualizar nombre si ha cambiado o se ha registrado
        devices[deviceId].userName = customName;
        devices[deviceId].name = `${devices[deviceId].os} - ${customName}`;
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
app.post('/login', (req, res) => {
    const { user, pass } = req.body;
    if (user === 'admin' && pass === 'admin') {
        res.json({ role: 'admin' });
    } else {
        res.status(401).json({ error: 'Credenciales incorrectas' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.get('/admin', (req, res) => {
    // Aquí podrías añadir una validación de sesión más robusta, 
    // pero por ahora serviremos el archivo.
    res.sendFile(path.join(__dirname, '..', 'admin.html'));
});

app.get('/file.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'file.html'));
});

app.get('/items', (req, res) => res.json(items.sort((a, b) => b.timestamp - a.timestamp)));

app.get('/devices', (req, res) => {
    getDeviceInfo(req);
    res.json(devices);
});

app.get('/api/files', (req, res) => {
    fs.readdir(uploadsDir, (err, files) => {
        if (err) return res.status(500).json({ error: 'No se pudieron leer los archivos' });
        
        const fileList = files.map(file => {
            const stats = fs.statSync(path.join(uploadsDir, file));
            return {
                name: file,
                createdAt: stats.birthtime
            };
        }).sort((a, b) => b.createdAt - a.createdAt);
        
        res.json(fileList);
    });
});

app.get('/api/storage', async (req, res) => {
    try {
        const info = await diskusage.check(os.platform() === 'win32' ? 'C:' : '/');
        res.json({
            total: info.total,
            used: info.total - info.available
        });
    } catch (err) {
        res.status(500).json({ error: 'No se pudo obtener info de almacenamiento' });
    }
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
    const localIP = Object.values(os.networkInterfaces())
        .flat()
        .find(i => i.family === 'IPv4' && !i.internal).address;

    console.log(`\n🚀 LocalDrop en marcha`);
    console.log(`   Acceso por Dominio:  http://localdrop.home:3000`);
    console.log(`   Acceso por IP:       http://${localIP}:${PORT}\n`);
});

server.timeout = 3600000;
