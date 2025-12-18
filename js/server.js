const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const sseExpress = require('sse-express');

const app = express();
const PORT = 3000;

// --- Almacenamiento en Memoria Volátil ---
let items = [];
let clients = []; // Lista de clientes conectados para SSE

// --- Creación del Directorio de Subidas ---
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// --- Configuración de Multer ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage, limits: { fileSize: 50 * 1024 * 1024 } });

// --- Middleware ---
app.use('/uploads', express.static(uploadsDir));
app.use('/css', express.static(path.join(__dirname, '..', 'css')));
app.use('/js', express.static(path.join(__dirname, '..', 'js')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Lógica de SSE (Server-Sent Events) ---

// Función para notificar a todos los clientes
const broadcastUpdate = () => {
    console.log(`Notificando a ${clients.length} cliente(s)`);
    clients.forEach(client => {
        client.sse('message', { event: 'update' });
    });
};

// Endpoint para que los clientes se conecten
app.get('/events', sseExpress, (req, res) => {
    clients.push(res);
    console.log(`Cliente conectado. Total: ${clients.length}`);

    req.on('close', () => {
        clients = clients.filter(client => client !== res);
        console.log(`Cliente desconectado. Total: ${clients.length}`);
    });
});


// --- Función de Identificación de Dispositivos ---
const getDeviceType = (userAgent) => {
    const ua = userAgent.toLowerCase();
    if (ua.includes('iphone')) return 'iPhone';
    if (ua.includes('android')) return 'Android';
    if (ua.includes('linux') && !ua.includes('android')) return 'Laptop Linux';
    if (ua.includes('windows')) return 'PC Windows';
    return 'Dispositivo Desconocido';
};

// --- RUTAS DE LA API ---

// 1. Servir la aplicación principal (Frontend)
app.get('/', (req, res) => {
    if (req.hostname === 'localhost' || req.hostname === '127.0.0.1') {
        res.sendFile(path.join(__dirname, '..', 'admin.html'));
    } else {
        res.sendFile(path.join(__dirname, '..', 'index.html'));
    }
});

// 2. Obtener todos los items
app.get('/items', (req, res) => {
    res.json(items.sort((a, b) => b.timestamp - a.timestamp));
});

// 3. Subir un nuevo item
app.post('/item', upload.single('file'), (req, res) => {
    const device = getDeviceType(req.headers['user-agent']);
    const timestamp = Date.now();

    if (req.file) {
        items.push({
            id: timestamp, type: 'file', device, timestamp,
            content: req.file.filename,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype
        });
    }
    if (req.body && req.body.text) {
        items.push({ id: timestamp, type: 'text', device, timestamp, content: req.body.text });
    }

    res.status(201).send({ message: 'Item añadido correctamente' });
    broadcastUpdate(); // Notificar a los clientes
});

// 4. Borrar un item específico
app.delete('/item/:id', (req, res) => {
    const itemId = parseInt(req.params.id, 10);
    const itemIndex = items.findIndex(item => item.id === itemId);

    if (itemIndex > -1) {
        items.splice(itemIndex, 1);
        res.status(200).send({ message: 'Elemento borrado' });
        broadcastUpdate(); // Notificar a los clientes
    } else {
        res.status(404).send({ message: 'Elemento no encontrado' });
    }
});

// 5. Borrar todos los items
app.delete('/items', (req, res) => {
    items = [];
    res.status(200).send({ message: 'Todos los elementos borrados' });
    broadcastUpdate(); // Notificar a los clientes
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
    console.log('-------------------------------------------');
});