const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const sseExpress = require('sse-express');

const app = express();
const PORT = 3000;

// --- Paths de Datos ---
const dataDir = path.join(__dirname, '..', 'data');
const devicesFilePath = path.join(dataDir, 'devices.json');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// --- Almacenamiento y Estado ---
let items = []; // En memoria para la sesión actual
let clients = []; // Clientes conectados para SSE
let devices = {}; // Dispositivos conocidos
let sessionLogStream; // Stream de escritura para el log de la sesión

// --- Carga y Setup Inicial ---
// Cargar dispositivos conocidos
try {
    if (fs.existsSync(devicesFilePath)) {
        devices = JSON.parse(fs.readFileSync(devicesFilePath));
    }
} catch (error) {
    console.error('Error al cargar devices.json:', error);
}

// Crear log de la sesión
const now = new Date();
const pad = (num) => num.toString().padStart(2, '0');
const logFileName = `${pad(now.getFullYear()-2000)}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.log`;
sessionLogStream = fs.createWriteStream(path.join(dataDir, logFileName), { flags: 'a' });
sessionLogStream.write(`--- Log de sesión iniciado: ${now.toISOString()} ---\n`);


// --- Funciones de Utilidad ---
const saveDevices = () => {
    try {
        fs.writeFileSync(devicesFilePath, JSON.stringify(devices, null, 2));
    } catch (error) {
        console.error('Error al guardar devices.json:', error);
    }
};

const generateColor = () => {
    const colors = ['#38bdf8', '#fb923c', '#f472b6', '#a78bfa', '#2dd4bf', '#facc15', '#4ade80'];
    const usedColors = Object.values(devices).map(d => d.color);
    const availableColors = colors.filter(c => !usedColors.includes(c));
    if (availableColors.length > 0) return availableColors[0];
    // Si se acaban los colores, genera uno aleatorio simple
    return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
};

const logInteraction = (message) => {
    sessionLogStream.write(`[${new Date().toISOString()}] ${message}\n`);
};

// --- Configuración de Multer y Middleware ---
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage, limits: { fileSize: 50 * 1024 * 1024 } });

app.use('/uploads', express.static(uploadsDir));
app.use('/css', express.static(path.join(__dirname, '..', 'css')));
app.use('/js', express.static(path.join(__dirname, '..', 'js')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// --- Lógica de SSE (Server-Sent Events) ---
const broadcastUpdate = () => {
    console.log(`Notificando a ${clients.length} cliente(s)`);
    clients.forEach(client => client.sse('message', { event: 'update' }));
};
app.get('/events', sseExpress, (req, res) => {
    clients.push(res);
    console.log(`Cliente conectado. Total: ${clients.length}`);
    req.on('close', () => {
        clients = clients.filter(c => c !== res);
        console.log(`Cliente desconectado. Total: ${clients.length}`);
    });
});


// --- Lógica de Dispositivos ---
const getDeviceData = (userAgent) => {
    let deviceData = devices[userAgent];
    if (!deviceData) {
        deviceData = {
            name: getDeviceType(userAgent),
            color: generateColor(),
            firstSeen: new Date().toISOString()
        };
        devices[userAgent] = deviceData;
        saveDevices(); // Guardar el nuevo dispositivo
        logInteraction(`Nuevo dispositivo detectado: ${deviceData.name} (${userAgent})`);
    }
    return deviceData;
};

const getDeviceType = (userAgent) => {
    const ua = userAgent.toLowerCase();
    if (ua.includes('iphone')) return 'iPhone';
    if (ua.includes('android')) return 'Android';
    if (ua.includes('linux') && !ua.includes('android')) return 'Laptop Linux';
    if (ua.includes('windows')) return 'PC Windows';
    return 'Dispositivo Desconocido';
};


// --- RUTAS DE LA API ---
app.get('/', (req, res) => {
    getDeviceData(req.headers['user-agent']); // Registrar dispositivo al visitar la página
    if (req.hostname === 'localhost' || req.hostname === '127.0.0.1') {
        res.sendFile(path.join(__dirname, '..', 'admin.html'));
    } else {
        res.sendFile(path.join(__dirname, '..', 'index.html'));
    }
});

app.get('/items', (req, res) => res.json(items.sort((a, b) => b.timestamp - a.timestamp)));

app.get('/devices', (req, res) => res.json(devices));

app.delete('/device/:userAgent', (req, res) => {
    const { userAgent } = req.params;
    if (devices[userAgent]) {
        const deviceName = devices[userAgent].name;
        delete devices[userAgent];
        saveDevices();
        logInteraction(`Dispositivo eliminado: "${deviceName}" (${userAgent})`);
        res.status(200).send({ message: 'Dispositivo eliminado' });
        broadcastUpdate();
    } else {
        res.status(404).send({ message: 'Dispositivo no encontrado' });
    }
});

app.post('/device/rename', (req, res) => {
    const { userAgent, newName } = req.body;
    if (devices[userAgent] && newName) {
        const oldName = devices[userAgent].name;
        devices[userAgent].name = newName;
        saveDevices();

        // Actualizar el nombre en los items de la sesión actual
        items.forEach(item => {
            if (item.userAgent === userAgent) {
                item.deviceName = newName;
            }
        });

        logInteraction(`Dispositivo renombrado: de "${oldName}" a "${newName}" (${userAgent})`);
        res.status(200).send({ message: 'Dispositivo renombrado' });
        broadcastUpdate(); // Notificar a todos para que refresquen y vean el nuevo nombre
    } else {
        res.status(400).send({ message: 'Faltan datos para renombrar' });
    }
});

app.post('/item', upload.single('file'), (req, res) => {
    const userAgent = req.headers['user-agent'];
    const deviceData = getDeviceData(userAgent);
    const timestamp = Date.now();
    let newItem;

    if (req.file) {
        newItem = {
            id: timestamp, type: 'file', deviceName: deviceData.name, color: deviceData.color, timestamp, userAgent,
            content: req.file.filename,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype
        };
        logInteraction(`Archivo subido: "${req.file.originalname}" por ${deviceData.name}`);
    }
    if (req.body && req.body.text) {
        newItem = { id: timestamp, type: 'text', deviceName: deviceData.name, color: deviceData.color, timestamp, userAgent, content: req.body.text };
        logInteraction(`Texto subido: "${req.body.text}" por ${deviceData.name}`);
    }

    if (newItem) {
        items.push(newItem);
        res.status(201).send({ message: 'Item añadido' });
        broadcastUpdate();
    } else {
        res.status(400).send({ message: 'No se envió contenido válido' });
    }
});

app.delete('/item/:id', (req, res) => {
    const itemId = parseInt(req.params.id, 10);
    const itemIndex = items.findIndex(item => item.id === itemId);

    if (itemIndex > -1) {
        const item = items[itemIndex];
        items.splice(itemIndex, 1);
        logInteraction(`Elemento borrado: ID ${itemId} ("${item.content || item.originalName}")`);
        res.status(200).send({ message: 'Elemento borrado' });
        broadcastUpdate();
    } else {
        res.status(404).send({ message: 'Elemento no encontrado' });
    }
});

app.delete('/items', (req, res) => {
    items = [];
    logInteraction('Todos los elementos han sido borrados');
    res.status(200).send({ message: 'Todos los elementos borrados' });
    broadcastUpdate();
});


// --- Inicio del Servidor ---
app.listen(PORT, '0.0.0.0', () => {
    const networkInterfaces = os.networkInterfaces();
    let localIp = '';
    for (const name of Object.keys(networkInterfaces)) {
        for (const net of networkInterfaces[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                localIp = net.address;
                break;
            }
        }
        if (localIp) break;
    }
    console.log('-------------------------------------------');
    console.log('🚀 LocalDrop iniciado');
    console.log(`     URL MODO USUARIO http://${localIp}:${PORT}`);
    console.log(`     URL MODO ADMIN   http://localhost:${PORT}`);
    console.log(`     Log de sesión:    ${path.join(dataDir, logFileName)}`);
    console.log('-------------------------------------------');
});